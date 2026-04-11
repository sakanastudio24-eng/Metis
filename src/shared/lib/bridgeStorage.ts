import type { MetisBridgeAccountState } from "../types/audit";
import {
  METIS_ACCOUNT_STATE_KEY,
  METIS_BRIDGE_DEBUG_KEY,
  METIS_BRIDGE_VERSION_KEY,
  METIS_CONNECTED_AT_KEY,
  METIS_WEB_SESSION_KEY,
} from "./metisStorageKeys";
import { METIS_EXTERNAL_BRIDGE_VERSION, normalizeBridgeAccountState } from "./bridgeAccountState";

type StoredExternalBridgeState = {
  account: MetisBridgeAccountState;
  connectedAt: number;
  bridgeVersion: number;
};

export type BridgeStorageDebugSnapshot = {
  accountState: MetisBridgeAccountState | null;
  connectedAt: number | null;
  bridgeVersion: number | null;
  bridgeDebug: BridgeDebugState | null;
};

export type BridgeDebugStatus = "received" | "stored" | "rejected" | "failed";

export type BridgeDebugState = {
  lastAttemptAt: number | null;
  lastStatus: BridgeDebugStatus | null;
  lastFailureReason: string | null;
  lastFailureDetail: string | null;
  lastSenderOrigin: string | null;
  lastMessageType: string | null;
  targetExtensionId: string | null;
  updatedAt: number | null;
};

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

function normalizeBridgeDebugState(value: unknown): BridgeDebugState | null {
  if (!isRecord(value)) {
    return null;
  }

  const lastStatus =
    value.lastStatus === "received" ||
    value.lastStatus === "stored" ||
    value.lastStatus === "rejected" ||
    value.lastStatus === "failed"
      ? value.lastStatus
      : null;

  return {
    lastAttemptAt: typeof value.lastAttemptAt === "number" ? value.lastAttemptAt : null,
    lastStatus,
    lastFailureReason: typeof value.lastFailureReason === "string" ? value.lastFailureReason : null,
    lastFailureDetail: typeof value.lastFailureDetail === "string" ? value.lastFailureDetail : null,
    lastSenderOrigin: typeof value.lastSenderOrigin === "string" ? value.lastSenderOrigin : null,
    lastMessageType: typeof value.lastMessageType === "string" ? value.lastMessageType : null,
    targetExtensionId: typeof value.targetExtensionId === "string" ? value.targetExtensionId : null,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : null,
  };
}

function normalizeStoredBridgeState(
  accountValue: unknown,
  connectedAtValue: unknown,
  bridgeVersionValue: unknown
): StoredExternalBridgeState | null {
  const account = normalizeBridgeAccountState(accountValue);

  if (!account) {
    return null;
  }

  return {
    account,
    connectedAt: typeof connectedAtValue === "number" ? connectedAtValue : Date.now(),
    bridgeVersion:
      typeof bridgeVersionValue === "number" ? bridgeVersionValue : METIS_EXTERNAL_BRIDGE_VERSION,
  };
}

function normalizeLegacyBridgeAccount(value: unknown): MetisBridgeAccountState | null {
  if (!isRecord(value) || !isRecord(value.bridgeAccount)) {
    return null;
  }

  return normalizeBridgeAccountState(value.bridgeAccount);
}

async function getRawBridgeState() {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return null;
  }

  return new Promise<Record<string, unknown>>((resolve) => {
    storage.get(
      [
        METIS_ACCOUNT_STATE_KEY,
        METIS_CONNECTED_AT_KEY,
        METIS_BRIDGE_VERSION_KEY,
        METIS_BRIDGE_DEBUG_KEY,
        METIS_WEB_SESSION_KEY,
      ],
      (result) => resolve(result)
    );
  });
}

export async function getBridgeStorageDebugSnapshot(): Promise<BridgeStorageDebugSnapshot | null> {
  const raw = await getRawBridgeState();

  if (!raw) {
    return null;
  }

  return {
    accountState: normalizeBridgeAccountState(raw[METIS_ACCOUNT_STATE_KEY]),
    connectedAt: typeof raw[METIS_CONNECTED_AT_KEY] === "number" ? raw[METIS_CONNECTED_AT_KEY] : null,
    bridgeVersion: typeof raw[METIS_BRIDGE_VERSION_KEY] === "number" ? raw[METIS_BRIDGE_VERSION_KEY] : null,
    bridgeDebug: normalizeBridgeDebugState(raw[METIS_BRIDGE_DEBUG_KEY]),
  };
}

export async function updateBridgeDebugState(
  patch: Partial<BridgeDebugState>
): Promise<BridgeDebugState | null> {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return null;
  }

  const raw = await getRawBridgeState();
  const current = normalizeBridgeDebugState(raw?.[METIS_BRIDGE_DEBUG_KEY]);
  const next: BridgeDebugState = {
    lastAttemptAt: patch.lastAttemptAt ?? current?.lastAttemptAt ?? null,
    lastStatus: patch.lastStatus ?? current?.lastStatus ?? null,
    lastFailureReason: patch.lastFailureReason ?? current?.lastFailureReason ?? null,
    lastFailureDetail: patch.lastFailureDetail ?? current?.lastFailureDetail ?? null,
    lastSenderOrigin: patch.lastSenderOrigin ?? current?.lastSenderOrigin ?? null,
    lastMessageType: patch.lastMessageType ?? current?.lastMessageType ?? null,
    targetExtensionId: patch.targetExtensionId ?? current?.targetExtensionId ?? null,
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve) => {
    storage.set(
      {
        [METIS_BRIDGE_DEBUG_KEY]: next,
      },
      () => resolve()
    );
  });

  return next;
}

export async function saveBridgeAccountState(
  account: MetisBridgeAccountState,
  connectedAt = Date.now()
): Promise<StoredExternalBridgeState> {
  const storage = getChromeLocalStorage();
  const state: StoredExternalBridgeState = {
    account,
    connectedAt,
    bridgeVersion: METIS_EXTERNAL_BRIDGE_VERSION,
  };

  if (!storage) {
    return state;
  }

  // The external bridge owns the canonical account state now, so clear the
  // old page-bridge session cache instead of letting stale auth tokens linger.
  await new Promise<void>((resolve) => {
    storage.set(
      {
        [METIS_ACCOUNT_STATE_KEY]: state.account,
        [METIS_CONNECTED_AT_KEY]: state.connectedAt,
        [METIS_BRIDGE_VERSION_KEY]: state.bridgeVersion,
        [METIS_WEB_SESSION_KEY]: null,
      },
      () => resolve()
    );
  });

  return state;
}

export async function clearBridgeAccountState() {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return;
  }

  await new Promise<void>((resolve) => {
    storage.set(
      {
        [METIS_ACCOUNT_STATE_KEY]: null,
        [METIS_CONNECTED_AT_KEY]: null,
        [METIS_BRIDGE_VERSION_KEY]: null,
        [METIS_WEB_SESSION_KEY]: null,
      },
      () => resolve()
    );
  });
}

export async function getStoredBridgeState(): Promise<StoredExternalBridgeState | null> {
  const raw = await getRawBridgeState();

  if (!raw) {
    return null;
  }

  const current = normalizeStoredBridgeState(
    raw[METIS_ACCOUNT_STATE_KEY],
    raw[METIS_CONNECTED_AT_KEY],
    raw[METIS_BRIDGE_VERSION_KEY]
  );

  if (current) {
    return current;
  }

  const legacyAccount = normalizeLegacyBridgeAccount(raw[METIS_WEB_SESSION_KEY]);

  if (!legacyAccount) {
    return null;
  }

  return saveBridgeAccountState(legacyAccount);
}

export async function getStoredBridgeAccountState(): Promise<MetisBridgeAccountState | null> {
  return (await getStoredBridgeState())?.account ?? null;
}
