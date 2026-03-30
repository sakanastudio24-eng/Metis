import type {
  MetisAnalyticsEventPayload,
  MetisPremiumReportRequestPayload,
  MetisScanSummaryUploadPayload,
  MetisUploadQueueItem,
  MetisUploadQueueState,
  StoredMetisWebSession
} from "../types/audit";
import {
  METIS_EVENTS_URL,
  METIS_PREMIUM_REPORT_REQUEST_URL,
  METIS_SCAN_SUMMARY_URL
} from "./metisLinks";
import { METIS_UPLOAD_QUEUE_KEY } from "./metisStorageKeys";

const DEFAULT_SUMMARY_DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const DEFAULT_EVENT_DEDUPE_WINDOW_MS = 10 * 1000;

function getChromeLocalStorage() {
  const chromeLike = globalThis as typeof globalThis & {
    chrome?: {
      runtime?: { id?: string };
      storage?: {
        local?: {
          get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void;
          set: (items: Record<string, unknown>, callback: () => void) => void;
        };
      };
    };
  };

  if (!chromeLike.chrome?.runtime?.id) {
    return null;
  }

  return chromeLike.chrome.storage?.local ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `metis-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function getEmptyQueueState(): MetisUploadQueueState {
  return {
    items: [],
    lastSummaryByRoute: {},
    lastEventByKey: {}
  };
}

function normalizeQueueState(value: unknown): MetisUploadQueueState {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return getEmptyQueueState();
  }

  const items: MetisUploadQueueItem[] = value.items.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : buildItemId(),
    kind:
      item.kind === "scan_summary" || item.kind === "premium_report_request"
        ? item.kind
        : "event",
    payload: (isRecord(item.payload) ? item.payload : {}) as unknown as MetisUploadQueueItem["payload"],
    route: typeof item.route === "string" ? item.route : null,
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    attemptCount: typeof item.attemptCount === "number" ? item.attemptCount : 0,
    lastAttemptAt: typeof item.lastAttemptAt === "number" ? item.lastAttemptAt : null
  }));

  const lastSummaryByRoute = isRecord(value.lastSummaryByRoute)
    ? Object.fromEntries(
        Object.entries(value.lastSummaryByRoute)
          .filter(([, timestamp]) => typeof timestamp === "number")
          .map(([route, timestamp]) => [route, timestamp as number])
      )
    : {};

  const lastEventByKey = isRecord(value.lastEventByKey)
    ? Object.fromEntries(
        Object.entries(value.lastEventByKey)
          .filter(([, timestamp]) => typeof timestamp === "number")
          .map(([key, timestamp]) => [key, timestamp as number])
      )
    : {};

  return {
    items,
    lastSummaryByRoute,
    lastEventByKey
  };
}

async function getQueueState(): Promise<MetisUploadQueueState> {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return getEmptyQueueState();
  }

  return new Promise((resolve) => {
    storage.get([METIS_UPLOAD_QUEUE_KEY], (result) => {
      resolve(normalizeQueueState(result[METIS_UPLOAD_QUEUE_KEY]));
    });
  });
}

async function saveQueueState(state: MetisUploadQueueState) {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return state;
  }

  await new Promise<void>((resolve) => {
    storage.set({ [METIS_UPLOAD_QUEUE_KEY]: state }, () => resolve());
  });

  return state;
}

function buildEventKey(payload: MetisAnalyticsEventPayload) {
  return `${payload.type}:${payload.route ?? "-"}`;
}

export async function enqueueMetisAnalyticsEvent(
  payload: MetisAnalyticsEventPayload
): Promise<MetisUploadQueueItem | null> {
  const state = await getQueueState();
  const now = Date.now();
  const eventKey = buildEventKey(payload);
  const previousTimestamp = state.lastEventByKey[eventKey] ?? 0;

  if (now - previousTimestamp < DEFAULT_EVENT_DEDUPE_WINDOW_MS) {
    return null;
  }

  const item: MetisUploadQueueItem = {
    id: buildItemId(),
    kind: "event",
    payload,
    route: payload.route ?? null,
    createdAt: now,
    attemptCount: 0,
    lastAttemptAt: null
  };

  state.items.push(item);
  state.lastEventByKey[eventKey] = now;
  await saveQueueState(state);
  return item;
}

export async function enqueueMetisScanSummary(
  payload: MetisScanSummaryUploadPayload
): Promise<MetisUploadQueueItem | null> {
  const state = await getQueueState();
  const now = Date.now();
  const lastSummaryTimestamp = state.lastSummaryByRoute[payload.route] ?? 0;

  if (now - lastSummaryTimestamp < DEFAULT_SUMMARY_DEDUPE_WINDOW_MS) {
    return null;
  }

  const item: MetisUploadQueueItem = {
    id: buildItemId(),
    kind: "scan_summary",
    payload,
    route: payload.route,
    createdAt: now,
    attemptCount: 0,
    lastAttemptAt: null
  };

  state.items.push(item);
  state.lastSummaryByRoute[payload.route] = now;
  await saveQueueState(state);
  return item;
}

export async function enqueueMetisPremiumReportRequest(
  payload: MetisPremiumReportRequestPayload
): Promise<MetisUploadQueueItem> {
  const state = await getQueueState();
  const item: MetisUploadQueueItem = {
    id: buildItemId(),
    kind: "premium_report_request",
    payload,
    route: payload.route,
    createdAt: Date.now(),
    attemptCount: 0,
    lastAttemptAt: null
  };

  state.items.push(item);
  await saveQueueState(state);
  return item;
}

async function postQueueItem(item: MetisUploadQueueItem, session: StoredMetisWebSession) {
  const url =
    item.kind === "event"
      ? METIS_EVENTS_URL
      : item.kind === "scan_summary"
        ? METIS_SCAN_SUMMARY_URL
        : METIS_PREMIUM_REPORT_REQUEST_URL;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify(item.payload)
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}

export async function processMetisUploadQueue(session: StoredMetisWebSession | null) {
  if (!session) {
    return { processed: 0, remaining: (await getQueueState()).items.length };
  }

  const state = await getQueueState();
  const remainingItems: MetisUploadQueueItem[] = [];
  let processed = 0;

  for (const item of state.items) {
    try {
      await postQueueItem(item, session);
      processed += 1;
    } catch {
      remainingItems.push({
        ...item,
        attemptCount: item.attemptCount + 1,
        lastAttemptAt: Date.now()
      });
    }
  }

  await saveQueueState({
    ...state,
    items: remainingItems
  });

  return {
    processed,
    remaining: remainingItems.length
  };
}

export async function getMetisUploadQueueState() {
  return getQueueState();
}
