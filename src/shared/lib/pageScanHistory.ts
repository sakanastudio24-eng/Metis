// pageScanHistory.ts stores compact page-level scan snapshots for later comparison.
// It keeps a normalized page key so the same route can be compared over time
// without full query-string noise making every scan look like a different page.
import type {
  PageScanComparison,
  PageScanSnapshot,
  RawScanSnapshot
} from "../types/audit";

interface StoredPageScans {
  scans: Record<string, PageScanSnapshot>;
  latestScanUrl?: string;
  // This is the manual cross-page compare target. Auto scans should not replace
  // it unless the user explicitly captures again.
  latestCapturedSnapshot?: PageScanSnapshot | null;
}

const STORAGE_KEY = "metis:page-scans";

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

function isValidPageScanSnapshot(snapshot: unknown): snapshot is PageScanSnapshot {
  if (!isRecord(snapshot)) {
    return false;
  }

  return (
    typeof snapshot.url === "string" &&
    typeof snapshot.pageKey === "string" &&
    typeof snapshot.timestamp === "number" &&
    typeof snapshot.requestCount === "number" &&
    typeof snapshot.duplicateRequestCount === "number" &&
    typeof snapshot.duplicateEndpointCount === "number" &&
    typeof snapshot.thirdPartyDomainCount === "number" &&
    typeof snapshot.totalEncodedBodySize === "number" &&
    typeof snapshot.meaningfulImageCount === "number" &&
    typeof snapshot.meaningfulImageBytes === "number"
  );
}

function getSummaryLine(delta: number, positiveLabel: string, negativeLabel: string) {
  if (delta > 0) {
    return `${delta} ${positiveLabel}`;
  }

  if (delta < 0) {
    return `${Math.abs(delta)} ${negativeLabel}`;
  }

  return null;
}

export function getPageScanKey(url: string) {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}`;
}

export function buildPageScanSnapshot(snapshot: RawScanSnapshot): PageScanSnapshot {
  return {
    url: snapshot.page.href,
    pageKey: getPageScanKey(snapshot.page.href),
    timestamp: Date.parse(snapshot.scannedAt),
    requestCount: snapshot.metrics.requestCount,
    duplicateRequestCount: snapshot.metrics.duplicateRequestCount,
    duplicateEndpointCount: snapshot.metrics.duplicateEndpointCount,
    thirdPartyDomainCount: snapshot.metrics.thirdPartyDomainCount,
    totalEncodedBodySize: snapshot.metrics.totalEncodedBodySize,
    meaningfulImageCount: snapshot.metrics.meaningfulImageCount,
    meaningfulImageBytes: snapshot.metrics.meaningfulImageBytes
  };
}

export function comparePageScans(
  previous: PageScanSnapshot,
  next: PageScanSnapshot
): PageScanComparison {
  const comparison = {
    requestCountDelta: next.requestCount - previous.requestCount,
    duplicateRequestCountDelta:
      next.duplicateRequestCount - previous.duplicateRequestCount,
    duplicateEndpointCountDelta:
      next.duplicateEndpointCount - previous.duplicateEndpointCount,
    thirdPartyDomainCountDelta:
      next.thirdPartyDomainCount - previous.thirdPartyDomainCount,
    totalEncodedBodySizeDelta:
      next.totalEncodedBodySize - previous.totalEncodedBodySize,
    meaningfulImageCountDelta:
      next.meaningfulImageCount - previous.meaningfulImageCount,
    meaningfulImageBytesDelta:
      next.meaningfulImageBytes - previous.meaningfulImageBytes,
    summary: [] as string[]
  };

  const summary = [
    getSummaryLine(
      comparison.requestCountDelta,
      "more requests than the previous scan",
      "fewer requests than the previous scan"
    ),
    getSummaryLine(
      comparison.totalEncodedBodySizeDelta,
      `more bytes than the previous scan`,
      `fewer bytes than the previous scan`
    ),
    getSummaryLine(
      comparison.duplicateRequestCountDelta,
      "more duplicate requests than the previous scan",
      "fewer duplicate requests than the previous scan"
    ),
    getSummaryLine(
      comparison.meaningfulImageBytesDelta,
      "more meaningful image bytes than the previous scan",
      "fewer meaningful image bytes than the previous scan"
    )
  ].filter((value): value is string => value !== null);

  if (comparison.totalEncodedBodySizeDelta !== 0) {
    const bytes = Math.abs(comparison.totalEncodedBodySizeDelta);
    const kb = Math.max(1, Math.round(bytes / 1_000));
    summary[1] =
      comparison.totalEncodedBodySizeDelta > 0
        ? `Page weight increased by ${kb} KB`
        : `Page weight dropped by ${kb} KB`;
  }

  comparison.summary = summary;
  return comparison;
}

async function getStoredPageScans(): Promise<StoredPageScans> {
  const storage = getStorageArea();

  if (!storage) {
    return { scans: {} };
  }

  return new Promise((resolve) => {
    try {
      storage.get([STORAGE_KEY], (result: Record<string, unknown>) => {
        const stored = isRecord(result[STORAGE_KEY]) ? result[STORAGE_KEY] : {};
        const scans = isRecord(stored.scans)
          ? (Object.fromEntries(
              Object.entries(stored.scans).filter((entry) =>
                isValidPageScanSnapshot(entry[1])
              )
            ) as Record<string, PageScanSnapshot>)
          : {};

        resolveStorageValue(
          { scans: {} },
          resolve,
          {
            scans,
            latestScanUrl:
              typeof stored.latestScanUrl === "string" ? stored.latestScanUrl : undefined,
            latestCapturedSnapshot: isValidPageScanSnapshot(stored.latestCapturedSnapshot)
              ? stored.latestCapturedSnapshot
              : null
          }
        );
      });
    } catch {
      resolve({ scans: {} });
    }
  });
}

async function setStoredPageScans(value: StoredPageScans): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      storage.set({ [STORAGE_KEY]: value }, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });
}

export async function getPreviousPageScan(url: string): Promise<PageScanSnapshot | null> {
  const stored = await getStoredPageScans();
  return stored.scans[getPageScanKey(url)] ?? null;
}

export async function getLatestCapturedPageScan(): Promise<PageScanSnapshot | null> {
  const stored = await getStoredPageScans();
  return stored.latestCapturedSnapshot ?? null;
}

export async function getPageScanComparisonContext(snapshot: PageScanSnapshot): Promise<{
  previous: PageScanSnapshot | null;
  comparison: PageScanComparison | null;
  latestCapturedSnapshot: PageScanSnapshot | null;
  latestCapturedComparison: PageScanComparison | null;
}> {
  const stored = await getStoredPageScans();
  const previous = stored.scans[snapshot.pageKey] ?? null;
  const latestCapturedSnapshot = stored.latestCapturedSnapshot ?? null;

  return {
    previous,
    comparison: previous ? comparePageScans(previous, snapshot) : null,
    latestCapturedSnapshot,
    // Same-page history and latest-manual-capture are separate compare modes.
    // Keep them separate so a user can capture page A and still browse page B.
    latestCapturedComparison:
      latestCapturedSnapshot && latestCapturedSnapshot.pageKey !== snapshot.pageKey
        ? comparePageScans(latestCapturedSnapshot, snapshot)
        : null
  };
}

export async function savePageScan(
  snapshot: PageScanSnapshot,
  options: { markAsLatestCaptured?: boolean } = {}
): Promise<void> {
  const stored = await getStoredPageScans();
  const next: StoredPageScans = {
    scans: {
      ...stored.scans,
      [snapshot.pageKey]: snapshot
    },
    latestScanUrl: snapshot.pageKey,
    // Normal background saves update page history. Only an explicit capture
    // should promote a snapshot into the cross-page compare slot.
    latestCapturedSnapshot: options.markAsLatestCaptured
      ? snapshot
      : stored.latestCapturedSnapshot ?? null
  };

  await setStoredPageScans(next);
}

export async function savePageScanAndCompare(snapshot: PageScanSnapshot): Promise<{
  previous: PageScanSnapshot | null;
  comparison: PageScanComparison | null;
  latestCapturedSnapshot: PageScanSnapshot | null;
  latestCapturedComparison: PageScanComparison | null;
}> {
  const context = await getPageScanComparisonContext(snapshot);
  await savePageScan(snapshot);

  return {
    previous: context.previous,
    comparison: context.comparison,
    latestCapturedSnapshot: context.latestCapturedSnapshot,
    latestCapturedComparison: context.latestCapturedComparison
  };
}
