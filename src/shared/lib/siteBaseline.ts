// siteBaseline.ts persists origin baselines and visited-page snapshots in chrome.storage.local.
// It also validates stored records so stale snapshot shapes do not crash newer panel code.
import { getPageScanKey } from "./pageScanHistory";
import type { RawScanSnapshot } from "../types/audit";

export interface SiteHistorySummary {
  baselineOriginCount: number;
  visitedOriginCount: number;
}

function getBaselineStorageKey(origin: string) {
  return `metis:baseline:${origin}`;
}

function getPagesStorageKey(origin: string) {
  return `metis:pages:${origin}`;
}

type StorageAreaLike = {
  get: (
    keys: string[] | null,
    callback: (result: Record<string, unknown>) => void
  ) => void;
  set: (items: Record<string, unknown>, callback: () => void) => void;
  remove: (keys: string | string[], callback: () => void) => void;
};

type ChromeLike = {
  runtime?: {
    id?: string;
    lastError?: unknown;
  };
  storage?: {
    local?: StorageAreaLike;
  };
};

function getChromeRuntime(): ChromeLike | null {
  const runtime = globalThis as typeof globalThis & { chrome?: ChromeLike };
  return runtime.chrome ?? null;
}

function getStorageArea() {
  const chromeRuntime = getChromeRuntime();

  try {
    if (!chromeRuntime?.runtime?.id) {
      return null;
    }

    return chromeRuntime.storage?.local ?? null;
  } catch {
    return null;
  }
}

function resolveStorageValue<T>(fallback: T, resolve: (value: T) => void, value: T) {
  const chromeRuntime = getChromeRuntime();

  try {
    if (chromeRuntime?.runtime?.lastError) {
      resolve(fallback);
      return;
    }
  } catch {
    resolve(fallback);
    return;
  }

  resolve(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidSnapshot(snapshot: unknown): snapshot is RawScanSnapshot {
  if (!isRecord(snapshot)) {
    return false;
  }

  const page = snapshot.page;
  const dom = snapshot.dom;
  const metrics = snapshot.metrics;

  if (
    typeof snapshot.scannedAt !== "string" ||
    !isRecord(page) ||
    !isRecord(dom) ||
    !isRecord(metrics) ||
    !Array.isArray(snapshot.resources) ||
    ("stackSignals" in snapshot && !Array.isArray(snapshot.stackSignals))
  ) {
    return false;
  }

  return (
    typeof page.href === "string" &&
    typeof page.origin === "string" &&
    typeof page.hostname === "string" &&
    typeof page.pathname === "string" &&
    typeof dom.scriptCount === "number" &&
    typeof dom.imageCount === "number" &&
    typeof dom.iframeCount === "number" &&
    typeof metrics.rawRequestCount === "number" &&
    typeof metrics.requestCount === "number" &&
    typeof metrics.uniqueRequestCount === "number" &&
    typeof metrics.duplicateRequestCount === "number" &&
    typeof metrics.duplicateEndpointCount === "number" &&
    typeof metrics.scriptRequestCount === "number" &&
    typeof metrics.imageRequestCount === "number" &&
    typeof metrics.apiRequestCount === "number" &&
    typeof metrics.thirdPartyRequestCount === "number" &&
    typeof metrics.thirdPartyDomainCount === "number" &&
    typeof metrics.totalEncodedBodySize === "number" &&
    typeof metrics.meaningfulImageCount === "number" &&
    typeof metrics.meaningfulImageBytes === "number" &&
    typeof metrics.largeAssetCount === "number" &&
    typeof metrics.droppedZeroTransferCount === "number" &&
    typeof metrics.droppedTinyCount === "number" &&
    Array.isArray(metrics.topOffenders) &&
    Array.isArray(metrics.topMeaningfulImages)
  );
}

export function buildStoredVisitedSnapshot(snapshot: RawScanSnapshot): RawScanSnapshot {
  return {
    ...snapshot,
    // Multipage context only needs route identity, metrics, DOM counts, and
    // a light hint of stack context. Keeping route history compact helps the
    // sampled-page count grow instead of collapsing on large pages.
    resources: [],
    stackSignals: (snapshot.stackSignals ?? []).slice(0, 24)
  };
}

export async function getSiteBaseline(
  origin: string
): Promise<RawScanSnapshot | null> {
  const storage = getStorageArea();

  if (!storage) {
    return null;
  }

  const key = getBaselineStorageKey(origin);

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const baseline = isValidSnapshot(result[key]) ? result[key] : null;
        resolveStorageValue(
          null,
          resolve,
          baseline
        );
      });
    } catch {
      resolve(null);
    }
  });
}

export async function setSiteBaseline(snapshot: RawScanSnapshot): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  const key = getBaselineStorageKey(snapshot.page.origin);

  await new Promise<void>((resolve) => {
    try {
      storage.set({ [key]: snapshot }, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });
}

export async function getOrCreateSiteBaseline(
  snapshot: RawScanSnapshot
): Promise<RawScanSnapshot> {
  const existing = await getSiteBaseline(snapshot.page.origin);

  if (existing) {
    return existing;
  }

  await setSiteBaseline(snapshot);
  return snapshot;
}

export async function getVisitedSiteSnapshots(
  origin: string
): Promise<RawScanSnapshot[]> {
  const storage = getStorageArea();

  if (!storage) {
    return [];
  }

  const key = getPagesStorageKey(origin);

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const value = result[key] as Record<string, RawScanSnapshot> | undefined;
        const snapshots = value ? Object.values(value).filter(isValidSnapshot) : [];
        resolveStorageValue([], resolve, snapshots);
      });
    } catch {
      resolve([]);
    }
  });
}

export async function upsertVisitedSiteSnapshot(
  snapshot: RawScanSnapshot
): Promise<RawScanSnapshot[]> {
  const storage = getStorageArea();

  if (!storage) {
    return [snapshot];
  }

  const key = getPagesStorageKey(snapshot.page.origin);
  const pageKey = getPageScanKey(snapshot.page.href);
  const storedSnapshot = buildStoredVisitedSnapshot(snapshot);

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const storedSnapshots = (result[key] as Record<string, RawScanSnapshot> | undefined) ?? {};
        const existing = Object.fromEntries(
          Object.entries(storedSnapshots).filter((entry) => isValidSnapshot(entry[1]))
        );
        const next = {
          ...existing,
          [pageKey]: storedSnapshot
        };

        try {
          storage.set({ [key]: next }, () => {
            resolveStorageValue([storedSnapshot], resolve, Object.values(next));
          });
        } catch {
          resolve([storedSnapshot]);
        }
      });
    } catch {
      resolve([storedSnapshot]);
    }
  });
}

export async function clearVisitedSiteSnapshots(origin: string): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  const key = getPagesStorageKey(origin);

  await new Promise<void>((resolve) => {
    try {
      storage.set({ [key]: {} }, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });
}

export async function clearSiteHistoryForOrigin(origin: string): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  const keys = [getBaselineStorageKey(origin), getPagesStorageKey(origin)];

  await new Promise<void>((resolve) => {
    try {
      storage.remove(keys, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });
}

export async function getSiteHistorySummary(): Promise<SiteHistorySummary> {
  const storage = getStorageArea();

  if (!storage) {
    return {
      baselineOriginCount: 0,
      visitedOriginCount: 0
    };
  }

  return new Promise((resolve) => {
    try {
      storage.get(null, (result) => {
        const keys = Object.keys(result);
        resolveStorageValue(
          {
            baselineOriginCount: 0,
            visitedOriginCount: 0
          },
          resolve,
          {
            baselineOriginCount: keys.filter((key) => key.startsWith("metis:baseline:")).length,
            visitedOriginCount: keys.filter((key) => key.startsWith("metis:pages:")).length
          }
        );
      });
    } catch {
      resolve({
        baselineOriginCount: 0,
        visitedOriginCount: 0
      });
    }
  });
}

export async function clearAllSiteHistory(): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  const summary = await getSiteHistorySummary();

  if (summary.baselineOriginCount === 0 && summary.visitedOriginCount === 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      storage.get(null, (result) => {
        const keys = Object.keys(result).filter(
          (key) => key.startsWith("metis:baseline:") || key.startsWith("metis:pages:")
        );

        if (keys.length === 0) {
          resolveStorageValue(undefined, resolve, undefined);
          return;
        }

        storage.remove(keys, () => {
          resolveStorageValue(undefined, resolve, undefined);
        });
      });
    } catch {
      resolve();
    }
  });
}
