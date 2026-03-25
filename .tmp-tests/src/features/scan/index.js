"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResourceMetrics = void 0;
exports.collectRawScanSnapshot = collectRawScanSnapshot;
exports.buildMultipageSnapshot = buildMultipageSnapshot;
exports.buildScanDebugSummary = buildScanDebugSummary;
const stack_1 = require("../stack");
const dom_1 = require("./dom");
const performance_1 = require("./performance");
Object.defineProperty(exports, "buildResourceMetrics", { enumerable: true, get: function () { return performance_1.buildResourceMetrics; } });
const url_1 = require("./url");
function collectRawScanSnapshot() {
    const page = (0, url_1.parsePageContext)(window.location.href);
    const { resources, stackSignals, metrics } = (0, performance_1.collectResourceSummaries)(page);
    const domStackSignals = (0, stack_1.collectDomStackSignals)(page.href);
    // Keep resource and DOM stack hints together so later cost-surface detection
    // can reason about vendors without reopening the scan layer.
    return {
        scannedAt: new Date().toISOString(),
        page,
        resources,
        stackSignals: [...stackSignals, ...domStackSignals],
        dom: (0, dom_1.inspectDomSurface)(),
        metrics
    };
}
function buildMultipageSnapshot(currentSnapshot, visitedSnapshots) {
    // Multipage mode is still a simple aggregate. It favors a stable product read
    // over trying to preserve every page as a first-class report section.
    const scopedSnapshots = visitedSnapshots.length > 0 ? visitedSnapshots : [currentSnapshot];
    const resources = scopedSnapshots.flatMap((snapshot) => snapshot.resources);
    const stackSignals = scopedSnapshots.flatMap((snapshot) => snapshot.stackSignals ?? []);
    return {
        scannedAt: currentSnapshot.scannedAt,
        page: currentSnapshot.page,
        resources,
        stackSignals,
        dom: {
            scriptCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.dom.scriptCount, 0),
            imageCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.dom.imageCount, 0),
            iframeCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.dom.iframeCount, 0)
        },
        metrics: (0, performance_1.buildResourceMetrics)(resources, {
            rawRequestCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.metrics.rawRequestCount, 0),
            droppedZeroTransferCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.metrics.droppedZeroTransferCount, 0),
            droppedTinyCount: scopedSnapshots.reduce((total, snapshot) => total + snapshot.metrics.droppedTinyCount, 0)
        })
    };
}
function buildScanDebugSummary(snapshot) {
    // This summary is intentionally small because it is for runtime sanity checks,
    // not for a user-facing debug panel.
    return {
        totalRequests: snapshot.metrics.requestCount,
        duplicateEndpoints: snapshot.metrics.duplicateEndpointCount,
        totalBytes: snapshot.metrics.totalEncodedBodySize,
        imageCount: snapshot.metrics.meaningfulImageCount,
        rawCount: snapshot.metrics.rawRequestCount,
        filteredCount: snapshot.metrics.requestCount
    };
}
