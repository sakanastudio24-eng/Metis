// scan/index.ts assembles the canonical raw scan snapshot.
// It also reshapes multiple visited pages into one aggregate snapshot for multipage scoring
// and exposes a small debug summary for console-only runtime verification.
import type { RawScanSnapshot } from "../../shared/types/audit";
import { inspectDomSurface } from "./dom";
import { buildResourceMetrics, collectResourceSummaries } from "./performance";
import { parsePageContext } from "./url";

export function collectRawScanSnapshot(): RawScanSnapshot {
  const page = parsePageContext(window.location.href);
  const { resources, stackSignals, metrics } = collectResourceSummaries(page);

  return {
    scannedAt: new Date().toISOString(),
    page,
    resources,
    stackSignals,
    dom: inspectDomSurface(),
    metrics
  };
}

export function buildMultipageSnapshot(
  currentSnapshot: RawScanSnapshot,
  visitedSnapshots: RawScanSnapshot[]
): RawScanSnapshot {
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
    metrics: buildResourceMetrics(resources, {
      rawRequestCount: scopedSnapshots.reduce(
        (total, snapshot) => total + snapshot.metrics.rawRequestCount,
        0
      ),
      droppedZeroTransferCount: scopedSnapshots.reduce(
        (total, snapshot) => total + snapshot.metrics.droppedZeroTransferCount,
        0
      ),
      droppedTinyCount: scopedSnapshots.reduce(
        (total, snapshot) => total + snapshot.metrics.droppedTinyCount,
        0
      )
    })
  };
}

export function buildScanDebugSummary(snapshot: RawScanSnapshot) {
  return {
    totalRequests: snapshot.metrics.requestCount,
    duplicateEndpoints: snapshot.metrics.duplicateEndpointCount,
    totalBytes: snapshot.metrics.totalEncodedBodySize,
    imageCount: snapshot.metrics.meaningfulImageCount,
    rawCount: snapshot.metrics.rawRequestCount,
    filteredCount: snapshot.metrics.requestCount
  };
}

export { buildResourceMetrics };
