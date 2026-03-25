"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageScanKey = getPageScanKey;
exports.buildPageScanSnapshot = buildPageScanSnapshot;
exports.comparePageScans = comparePageScans;
exports.getPreviousPageScan = getPreviousPageScan;
exports.getLatestCapturedPageScan = getLatestCapturedPageScan;
exports.getPageScanStoreSummary = getPageScanStoreSummary;
exports.getPageScanComparisonContext = getPageScanComparisonContext;
exports.savePageScan = savePageScan;
exports.savePageScanAndCompare = savePageScanAndCompare;
exports.clearPageScanStore = clearPageScanStore;
const STORAGE_KEY = "metis:page-scans";
function getChromeRuntime() {
    const runtime = globalThis;
    return runtime.chrome ?? null;
}
function getStorageArea() {
    const chromeRuntime = getChromeRuntime();
    try {
        if (!chromeRuntime?.runtime?.id) {
            return null;
        }
        return chromeRuntime.storage?.local ?? null;
    }
    catch {
        return null;
    }
}
function resolveStorageValue(fallback, resolve, value) {
    const chromeRuntime = getChromeRuntime();
    try {
        if (chromeRuntime?.runtime?.lastError) {
            resolve(fallback);
            return;
        }
    }
    catch {
        resolve(fallback);
        return;
    }
    resolve(value);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isValidPageScanSnapshot(snapshot) {
    if (!isRecord(snapshot)) {
        return false;
    }
    return (typeof snapshot.url === "string" &&
        typeof snapshot.pageKey === "string" &&
        typeof snapshot.timestamp === "number" &&
        typeof snapshot.requestCount === "number" &&
        typeof snapshot.duplicateRequestCount === "number" &&
        typeof snapshot.duplicateEndpointCount === "number" &&
        typeof snapshot.thirdPartyDomainCount === "number" &&
        typeof snapshot.totalEncodedBodySize === "number" &&
        typeof snapshot.meaningfulImageCount === "number" &&
        typeof snapshot.meaningfulImageBytes === "number");
}
function getSummaryLine(delta, positiveLabel, negativeLabel) {
    if (delta > 0) {
        return `${delta} ${positiveLabel}`;
    }
    if (delta < 0) {
        return `${Math.abs(delta)} ${negativeLabel}`;
    }
    return null;
}
function getPageScanKey(url) {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
}
function buildPageScanSnapshot(snapshot) {
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
function comparePageScans(previous, next) {
    const comparison = {
        requestCountDelta: next.requestCount - previous.requestCount,
        duplicateRequestCountDelta: next.duplicateRequestCount - previous.duplicateRequestCount,
        duplicateEndpointCountDelta: next.duplicateEndpointCount - previous.duplicateEndpointCount,
        thirdPartyDomainCountDelta: next.thirdPartyDomainCount - previous.thirdPartyDomainCount,
        totalEncodedBodySizeDelta: next.totalEncodedBodySize - previous.totalEncodedBodySize,
        meaningfulImageCountDelta: next.meaningfulImageCount - previous.meaningfulImageCount,
        meaningfulImageBytesDelta: next.meaningfulImageBytes - previous.meaningfulImageBytes,
        summary: []
    };
    const summary = [
        getSummaryLine(comparison.requestCountDelta, "more requests than the previous scan", "fewer requests than the previous scan"),
        getSummaryLine(comparison.totalEncodedBodySizeDelta, `more bytes than the previous scan`, `fewer bytes than the previous scan`),
        getSummaryLine(comparison.duplicateRequestCountDelta, "more duplicate requests than the previous scan", "fewer duplicate requests than the previous scan"),
        getSummaryLine(comparison.meaningfulImageBytesDelta, "more meaningful image bytes than the previous scan", "fewer meaningful image bytes than the previous scan")
    ].filter((value) => value !== null);
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
async function getStoredPageScans() {
    const storage = getStorageArea();
    if (!storage) {
        return { scans: {} };
    }
    return new Promise((resolve) => {
        try {
            storage.get([STORAGE_KEY], (result) => {
                const stored = isRecord(result[STORAGE_KEY]) ? result[STORAGE_KEY] : {};
                const scans = isRecord(stored.scans)
                    ? Object.fromEntries(Object.entries(stored.scans).filter((entry) => isValidPageScanSnapshot(entry[1])))
                    : {};
                resolveStorageValue({ scans: {} }, resolve, {
                    scans,
                    latestScanUrl: typeof stored.latestScanUrl === "string" ? stored.latestScanUrl : undefined,
                    latestCapturedSnapshot: isValidPageScanSnapshot(stored.latestCapturedSnapshot)
                        ? stored.latestCapturedSnapshot
                        : null
                });
            });
        }
        catch {
            resolve({ scans: {} });
        }
    });
}
async function setStoredPageScans(value) {
    const storage = getStorageArea();
    if (!storage) {
        return;
    }
    await new Promise((resolve) => {
        try {
            storage.set({ [STORAGE_KEY]: value }, () => {
                resolveStorageValue(undefined, resolve, undefined);
            });
        }
        catch {
            resolve();
        }
    });
}
async function getPreviousPageScan(url) {
    const stored = await getStoredPageScans();
    return stored.scans[getPageScanKey(url)] ?? null;
}
async function getLatestCapturedPageScan() {
    const stored = await getStoredPageScans();
    return stored.latestCapturedSnapshot ?? null;
}
async function getPageScanStoreSummary() {
    const stored = await getStoredPageScans();
    return {
        savedPageCount: Object.keys(stored.scans).length,
        latestCapturedSnapshot: stored.latestCapturedSnapshot ?? null
    };
}
async function getPageScanComparisonContext(snapshot) {
    const stored = await getStoredPageScans();
    const previous = stored.scans[snapshot.pageKey] ?? null;
    const latestCapturedSnapshot = stored.latestCapturedSnapshot ?? null;
    return {
        previous,
        comparison: previous ? comparePageScans(previous, snapshot) : null,
        latestCapturedSnapshot,
        // Same-page history and latest-manual-capture are separate compare modes.
        // Keep them separate so a user can capture page A and still browse page B.
        latestCapturedComparison: latestCapturedSnapshot && latestCapturedSnapshot.pageKey !== snapshot.pageKey
            ? comparePageScans(latestCapturedSnapshot, snapshot)
            : null
    };
}
async function savePageScan(snapshot, options = {}) {
    const stored = await getStoredPageScans();
    const next = {
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
    return {
        savedPageCount: Object.keys(next.scans).length,
        latestCapturedSnapshot: next.latestCapturedSnapshot ?? null
    };
}
async function savePageScanAndCompare(snapshot) {
    const context = await getPageScanComparisonContext(snapshot);
    await savePageScan(snapshot);
    return {
        previous: context.previous,
        comparison: context.comparison,
        latestCapturedSnapshot: context.latestCapturedSnapshot,
        latestCapturedComparison: context.latestCapturedComparison
    };
}
async function clearPageScanStore() {
    await setStoredPageScans({
        scans: {},
        latestCapturedSnapshot: null
    });
}
