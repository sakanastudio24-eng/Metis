// Persist the first seen snapshot per origin and the visited-page snapshots that power
// the multipage comparison view in the panel.
import type { RawScanSnapshot } from "../types/audit";

function getBaselineStorageKey(origin: string) {
  return `metis:baseline:${origin}`;
}

function getPagesStorageKey(origin: string) {
  return `metis:pages:${origin}`;
}

function getStorageArea() {
  try {
    if (!chrome?.runtime?.id) {
      return null;
    }

    return chrome.storage.local;
  } catch {
    return null;
  }
}

function resolveStorageValue<T>(fallback: T, resolve: (value: T) => void, value: T) {
  try {
    if (chrome.runtime.lastError) {
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
    !Array.isArray(snapshot.resources)
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
  const pageKey = snapshot.page.href;

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const storedSnapshots = (result[key] as Record<string, RawScanSnapshot> | undefined) ?? {};
        const existing = Object.fromEntries(
          Object.entries(storedSnapshots).filter((entry) => isValidSnapshot(entry[1]))
        );
        const next = {
          ...existing,
          [pageKey]: snapshot
        };

        try {
          storage.set({ [key]: next }, () => {
            resolveStorageValue([snapshot], resolve, Object.values(next));
          });
        } catch {
          resolve([snapshot]);
        }
      });
    } catch {
      resolve([snapshot]);
    }
  });
}
