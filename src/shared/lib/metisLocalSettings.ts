import type { MetisLocalSettings } from "../types/audit";
import {
  LEGACY_METIS_USER_SETTINGS_KEY,
  METIS_USER_SETTINGS_KEY
} from "./metisStorageKeys";

export const DEFAULT_METIS_SETTINGS: MetisLocalSettings = {
  preferredScanScope: "single",
  refreshMode: "smart",
  motionPreference: "full",
  autoRescanWhilePanelOpen: true,
  webPageScanningEnabled: true,
  localHistoryEnabled: true,
  bridgeRepairEnabled: true,
  sidePanelWorkspaceEnabled: true,
  scanDelayProfile: "balanced",
  attachedReport: true,
  showSampleProgress: true
};

type StorageAreaLike = {
  get: (
    keys: string[],
    callback: (result: Record<string, unknown>) => void
  ) => void;
  set: (items: Record<string, unknown>, callback: () => void) => void;
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

function isMetisRefreshMode(value: unknown): value is MetisLocalSettings["refreshMode"] {
  return value === "smart" || value === "steady";
}

function isMetisMotionPreference(value: unknown): value is MetisLocalSettings["motionPreference"] {
  return value === "full" || value === "reduced";
}

function isScanScope(value: unknown): value is MetisLocalSettings["preferredScanScope"] {
  return value === "single" || value === "multi";
}

function isScanDelayProfile(value: unknown): value is MetisLocalSettings["scanDelayProfile"] {
  return value === "fast" || value === "balanced" || value === "thorough";
}

function normalizeSettings(value: unknown): MetisLocalSettings {
  if (!isRecord(value)) {
    return DEFAULT_METIS_SETTINGS;
  }

  return {
    preferredScanScope: isScanScope(value.preferredScanScope)
      ? value.preferredScanScope
      : DEFAULT_METIS_SETTINGS.preferredScanScope,
    refreshMode: isMetisRefreshMode(value.refreshMode)
      ? value.refreshMode
      : DEFAULT_METIS_SETTINGS.refreshMode,
    motionPreference: isMetisMotionPreference(value.motionPreference)
      ? value.motionPreference
      : DEFAULT_METIS_SETTINGS.motionPreference,
    autoRescanWhilePanelOpen:
      typeof value.autoRescanWhilePanelOpen === "boolean"
        ? value.autoRescanWhilePanelOpen
        : DEFAULT_METIS_SETTINGS.autoRescanWhilePanelOpen,
    webPageScanningEnabled:
      typeof value.webPageScanningEnabled === "boolean"
        ? value.webPageScanningEnabled
        : DEFAULT_METIS_SETTINGS.webPageScanningEnabled,
    localHistoryEnabled:
      typeof value.localHistoryEnabled === "boolean"
        ? value.localHistoryEnabled
        : DEFAULT_METIS_SETTINGS.localHistoryEnabled,
    bridgeRepairEnabled:
      typeof value.bridgeRepairEnabled === "boolean"
        ? value.bridgeRepairEnabled
        : DEFAULT_METIS_SETTINGS.bridgeRepairEnabled,
    sidePanelWorkspaceEnabled:
      typeof value.sidePanelWorkspaceEnabled === "boolean"
        ? value.sidePanelWorkspaceEnabled
        : DEFAULT_METIS_SETTINGS.sidePanelWorkspaceEnabled,
    scanDelayProfile: isScanDelayProfile(value.scanDelayProfile)
      ? value.scanDelayProfile
      : DEFAULT_METIS_SETTINGS.scanDelayProfile,
    attachedReport:
      typeof value.attachedReport === "boolean"
        ? value.attachedReport
        : DEFAULT_METIS_SETTINGS.attachedReport,
    showSampleProgress:
      typeof value.showSampleProgress === "boolean"
        ? value.showSampleProgress
        : DEFAULT_METIS_SETTINGS.showSampleProgress
  };
}

export async function getMetisLocalSettings(): Promise<MetisLocalSettings> {
  const storage = getStorageArea();

  if (!storage) {
    return DEFAULT_METIS_SETTINGS;
  }

  return new Promise((resolve) => {
    try {
      storage.get([METIS_USER_SETTINGS_KEY, LEGACY_METIS_USER_SETTINGS_KEY], (result) => {
        const storedSettings =
          result[METIS_USER_SETTINGS_KEY] ?? result[LEGACY_METIS_USER_SETTINGS_KEY];
        const normalizedSettings = normalizeSettings(storedSettings);

        if (
          storedSettings !== undefined &&
          result[METIS_USER_SETTINGS_KEY] === undefined
        ) {
          storage.set({ [METIS_USER_SETTINGS_KEY]: normalizedSettings }, () => {
            resolveStorageValue(DEFAULT_METIS_SETTINGS, resolve, normalizedSettings);
          });
          return;
        }

        resolveStorageValue(DEFAULT_METIS_SETTINGS, resolve, normalizedSettings);
      });
    } catch {
      resolve(DEFAULT_METIS_SETTINGS);
    }
  });
}

export async function saveMetisLocalSettings(
  nextSettings: Partial<MetisLocalSettings>
): Promise<MetisLocalSettings> {
  const storage = getStorageArea();
  const mergedSettings = {
    ...(await getMetisLocalSettings()),
    ...nextSettings
  };

  if (!storage) {
    return mergedSettings;
  }

  await new Promise<void>((resolve) => {
    try {
      storage.set({ [METIS_USER_SETTINGS_KEY]: mergedSettings }, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });

  return mergedSettings;
}
