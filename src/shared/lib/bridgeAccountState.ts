import type {
  MetisAccessState,
  MetisBridgeAccountState,
  MetisBridgeSyncFailure,
  MetisBridgeSyncMessage,
  MetisConnectedAccount,
} from "../types/audit";

export const METIS_EXTERNAL_BRIDGE_VERSION = 1;
export const METIS_ALLOWED_EXTERNAL_BRIDGE_ORIGINS = [
  "https://metis.zward.studio",
  "http://localhost:3000",
] as const;

export function isAllowedExternalBridgeOrigin(origin: string) {
  return METIS_ALLOWED_EXTERNAL_BRIDGE_ORIGINS.includes(
    origin as (typeof METIS_ALLOWED_EXTERNAL_BRIDGE_ORIGINS)[number]
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTier(value: unknown): MetisBridgeAccountState["tier"] | null {
  return value === "plus_beta" || value === "paid" || value === "free" ? value : null;
}

export function normalizeBridgeAccountState(value: unknown): MetisBridgeAccountState | null {
  if (!isRecord(value)) {
    return null;
  }

  const tier = normalizeTier(value.tier);

  if (!tier) {
    return null;
  }

  return {
    email: typeof value.email === "string" ? value.email : null,
    username: typeof value.username === "string" ? value.username : null,
    scansUsed: typeof value.scansUsed === "number" ? value.scansUsed : 0,
    sitesTracked: typeof value.sitesTracked === "number" ? value.sitesTracked : 0,
    tier,
    isBeta: value.isBeta === true,
  };
}

export function isMetisBridgeSyncMessage(value: unknown): value is MetisBridgeSyncMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "METIS_BRIDGE_SYNC" &&
    value.source === "metis-web" &&
    value.bridgeVersion === METIS_EXTERNAL_BRIDGE_VERSION &&
    normalizeBridgeAccountState(value.account) !== null
  );
}

export function deriveAccessStateFromBridgeAccount(
  account: MetisBridgeAccountState | null
): MetisAccessState {
  if (!account) {
    return {
      isAuthenticated: false,
      tier: "free",
      allowPlusUi: false,
      allowReportEmail: false,
      plusBetaEnabled: false,
      apiBetaEnabled: false,
    };
  }

  const plusEnabled = account.tier === "plus_beta" || account.tier === "paid" || account.isBeta;
  const apiEnabled = account.tier === "plus_beta" || account.tier === "paid";

  return {
    isAuthenticated: true,
    tier: account.tier,
    allowPlusUi: plusEnabled,
    allowReportEmail: plusEnabled,
    plusBetaEnabled: plusEnabled,
    apiBetaEnabled: apiEnabled,
  };
}

export function buildConnectedAccountFromBridge(
  account: MetisBridgeAccountState | null
): MetisConnectedAccount | null {
  if (!account) {
    return null;
  }

  const displayName =
    account.username?.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ??
    account.email?.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ??
    "Connected account";

  return {
    id: account.email ?? displayName,
    email: account.email,
    displayName,
  };
}

export function buildBridgeFailure(
  reason: MetisBridgeSyncFailure["reason"],
  detail?: string
): MetisBridgeSyncFailure {
  return {
    type: "METIS_BRIDGE_SYNC_FAILURE",
    source: "metis-extension",
    bridgeVersion: METIS_EXTERNAL_BRIDGE_VERSION,
    ok: false,
    reason,
    detail,
  };
}
