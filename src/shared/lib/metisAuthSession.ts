import type {
  MetisAccessState,
  MetisAuthSuccessBridgeMessage,
  MetisConnectedAccount,
  StoredMetisWebSession
} from "../types/audit";
import { METIS_WEB_SESSION_KEY } from "./metisStorageKeys";

// Exact-match allowlist only. No wildcard hosts, no sibling subdomains.
const ALLOWED_METIS_AUTH_ORIGINS = new Set([
  "https://metis.zward.studio",
  "http://localhost:3000"
]);

// The auth bridge is only valid on the dedicated completion route.
const AUTH_SUCCESS_PATHNAME = "/auth/success";

function getChromeLocalStorage() {
  const chromeLike = globalThis as typeof globalThis & {
    chrome?: {
      runtime?: { id?: string; lastError?: unknown };
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

function toBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeConnectedAccount(session: StoredMetisWebSession | null): MetisConnectedAccount | null {
  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    displayName:
      session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ??
      "Connected account"
  };
}

export function getDefaultMetisAccessState(): MetisAccessState {
  return {
    isAuthenticated: false,
    tier: "free",
    allowPlusUi: false,
    allowReportEmail: false,
    plusBetaEnabled: false,
    apiBetaEnabled: false
  };
}

export function deriveMetisAccessState(
  session: StoredMetisWebSession | null
): MetisAccessState {
  if (!session) {
    return getDefaultMetisAccessState();
  }

  const normalizedTier = session.account.plan === "paid" ? "paid" : session.account.plan;

  return {
    isAuthenticated: true,
    tier: normalizedTier,
    allowPlusUi: session.account.allowPlusUi,
    allowReportEmail: session.account.allowReportEmail,
    plusBetaEnabled: session.account.plusBetaEnabled,
    apiBetaEnabled: session.account.apiBetaEnabled
  };
}

function normalizeStoredSession(value: unknown): StoredMetisWebSession | null {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.account)) {
    return null;
  }

  const accessToken = typeof value.accessToken === "string" ? value.accessToken : null;
  const userId = typeof value.user.id === "string" ? value.user.id : null;

  if (!accessToken || !userId) {
    return null;
  }

  const plan =
    value.account.plan === "plus_beta" || value.account.plan === "paid"
      ? value.account.plan
      : "free";

  return {
    accessToken,
    expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : null,
    user: {
      id: userId,
      email: typeof value.user.email === "string" ? value.user.email : null
    },
    account: {
      plan,
      plusBetaEnabled: toBoolean(value.account.plusBetaEnabled),
      apiBetaEnabled: toBoolean(value.account.apiBetaEnabled),
      allowPlusUi: toBoolean(value.account.allowPlusUi),
      allowReportEmail: toBoolean(value.account.allowReportEmail)
    },
    connectedAt:
      typeof value.connectedAt === "number" ? value.connectedAt : Date.now()
  };
}

export function isAllowedMetisAuthOrigin(origin: string) {
  return ALLOWED_METIS_AUTH_ORIGINS.has(origin);
}

export function isAllowedMetisAuthPathname(pathname: string) {
  return pathname === AUTH_SUCCESS_PATHNAME;
}

export function isMetisAuthSuccessBridgeMessage(
  value: unknown
): value is MetisAuthSuccessBridgeMessage {
  if (!isRecord(value) || !isRecord(value.session) || !isRecord(value.session.user)) {
    return false;
  }

  return (
    value.type === "METIS_AUTH_SUCCESS" &&
    value.source === "metis-web" &&
    value.version === 1 &&
    typeof value.session.accessToken === "string" &&
    typeof value.session.user.id === "string"
  );
}

export async function getStoredMetisWebSession(): Promise<StoredMetisWebSession | null> {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return null;
  }

  return new Promise((resolve) => {
    storage.get([METIS_WEB_SESSION_KEY], (result) => {
      resolve(normalizeStoredSession(result[METIS_WEB_SESSION_KEY]));
    });
  });
}

export async function saveStoredMetisWebSession(
  session: StoredMetisWebSession
): Promise<StoredMetisWebSession> {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return session;
  }

  await new Promise<void>((resolve) => {
    storage.set({ [METIS_WEB_SESSION_KEY]: session }, () => resolve());
  });

  return session;
}

export async function clearStoredMetisWebSession() {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return;
  }

  await new Promise<void>((resolve) => {
    storage.set({ [METIS_WEB_SESSION_KEY]: null }, () => resolve());
  });
}

export function buildStoredMetisWebSession(
  message: MetisAuthSuccessBridgeMessage,
  account: StoredMetisWebSession["account"]
): StoredMetisWebSession {
  return {
    accessToken: message.session.accessToken,
    expiresAt: message.session.expiresAt ?? null,
    user: {
      id: message.session.user.id,
      email: message.session.user.email ?? null
    },
    account,
    connectedAt: Date.now()
  };
}

export function getConnectedAccountSnapshot(session: StoredMetisWebSession | null) {
  return normalizeConnectedAccount(session);
}
