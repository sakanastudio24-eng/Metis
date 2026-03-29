// scan/index.ts assembles the canonical raw scan snapshot.
// It also keeps lightweight multipage helpers around so the UI can show
// sampled-page context without changing the current-route score.
import { DETECTION_THRESHOLDS } from "../detection/config";
import type { RawScanSnapshot } from "../../shared/types/audit";
import { collectDomStackSignals } from "../stack";
import { inspectDomSurface } from "./dom";
import { buildResourceMetrics, collectResourceSummaries } from "./performance";
import { parsePageContext } from "./url";

export interface MultipageEvidence {
  sampledPagesCount: number;
  sampledPagesLabel: string;
  comparisonSummary: string;
  patternNote: string | null;
  hasMultipageEvidence: boolean;
}

export function collectRawScanSnapshot(): RawScanSnapshot {
  const page = parsePageContext(window.location.href);
  const { resources, stackSignals, metrics } = collectResourceSummaries(page);
  const domStackSignals = collectDomStackSignals(page.href);

  // Keep resource and DOM stack hints together so later cost-surface detection
  // can reason about vendors without reopening the scan layer.
  return {
    scannedAt: new Date().toISOString(),
    page,
    resources,
    stackSignals: [...stackSignals, ...domStackSignals],
    dom: inspectDomSurface(),
    metrics
  };
}

export function buildMultipageSnapshot(
  currentSnapshot: RawScanSnapshot,
  visitedSnapshots: RawScanSnapshot[]
): RawScanSnapshot {
  // Keep the aggregate helper around for future route-comparison work, but the
  // product no longer uses it to change the current-route report math.
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

function severityFromValue(value: number, thresholds: { low: number; medium: number; high: number }) {
  if (value >= thresholds.high) {
    return 3;
  }

  if (value >= thresholds.medium) {
    return 2;
  }

  if (value >= thresholds.low) {
    return 1;
  }

  return 0;
}

function duplicateSeverity(snapshot: RawScanSnapshot) {
  const duplicateThresholds = DETECTION_THRESHOLDS.duplicateRequests;

  return Math.max(
    severityFromValue(
      snapshot.metrics.duplicateEndpointCount,
      {
        low: duplicateThresholds.low.duplicateEndpointCount,
        medium: duplicateThresholds.medium.duplicateEndpointCount,
        high: duplicateThresholds.high.duplicateEndpointCount
      }
    ),
    severityFromValue(
      snapshot.metrics.duplicateRequestCount,
      {
        low: duplicateThresholds.low.duplicateRequestCount,
        medium: duplicateThresholds.medium.duplicateRequestCount,
        high: duplicateThresholds.high.duplicateRequestCount
      }
    )
  );
}

function imageSeverity(snapshot: RawScanSnapshot) {
  const thresholds = DETECTION_THRESHOLDS.largeImages;

  return Math.max(
    severityFromValue(snapshot.metrics.meaningfulImageBytes, {
      low: thresholds.low.meaningfulImageBytes,
      medium: thresholds.medium.meaningfulImageBytes,
      high: thresholds.high.meaningfulImageBytes
    }),
    severityFromValue(snapshot.metrics.meaningfulImageCount, {
      low: thresholds.low.meaningfulImageCount,
      medium: thresholds.medium.meaningfulImageCount,
      high: thresholds.high.meaningfulImageCount
    })
  );
}

function thirdPartySeverity(snapshot: RawScanSnapshot) {
  return severityFromValue(
    snapshot.metrics.thirdPartyDomainCount,
    DETECTION_THRESHOLDS.thirdPartySprawl
  );
}

function routePressureBand(snapshot: RawScanSnapshot) {
  const duplicate = duplicateSeverity(snapshot);
  const request = severityFromValue(
    snapshot.metrics.requestCount,
    DETECTION_THRESHOLDS.requestCount
  );
  const payload = severityFromValue(
    snapshot.metrics.totalEncodedBodySize,
    DETECTION_THRESHOLDS.pageWeight
  );
  const images = imageSeverity(snapshot);
  const thirdParty = thirdPartySeverity(snapshot);
  const pressurePoints =
    duplicate * 4 +
    request * 2 +
    payload * 2 +
    images * 2 +
    thirdParty;

  if (pressurePoints >= 12) {
    return 3;
  }

  if (pressurePoints >= 6) {
    return 2;
  }

  if (pressurePoints > 0) {
    return 1;
  }

  return 0;
}

export function buildMultipageEvidence(
  currentSnapshot: RawScanSnapshot,
  visitedSnapshots: RawScanSnapshot[]
): MultipageEvidence {
  const scopedSnapshots = visitedSnapshots.length > 0 ? visitedSnapshots : [currentSnapshot];
  const otherSnapshots = scopedSnapshots.filter(
    (snapshot) => snapshot.page.href !== currentSnapshot.page.href
  );
  const sampledPagesCount = Math.max(scopedSnapshots.length, 1);
  const sampledPagesLabel =
    sampledPagesCount === 1 ? "Sampled pages: 1" : `Sampled pages: ${sampledPagesCount}`;

  if (otherSnapshots.length === 0) {
    return {
      sampledPagesCount,
      sampledPagesLabel,
      comparisonSummary: "Visit a few more routes to compare this page against the rest of the site.",
      patternNote: null,
      hasMultipageEvidence: false
    };
  }

  const currentBand = routePressureBand(currentSnapshot);
  const otherBands = otherSnapshots.map(routePressureBand);
  const highestOtherBand = Math.max(...otherBands);
  const lowestOtherBand = Math.min(...otherBands);
  const duplicatePatternCount = scopedSnapshots.filter((snapshot) => duplicateSeverity(snapshot) >= 1).length;
  const vendorPatternCount = scopedSnapshots.filter((snapshot) => thirdPartySeverity(snapshot) >= 1).length;
  const imagePatternCount = scopedSnapshots.filter((snapshot) => imageSeverity(snapshot) >= 1).length;

  let comparisonSummary = "Similar cost patterns were observed across sampled pages.";

  if (highestOtherBand >= currentBand + 1) {
    comparisonSummary = "Other sampled pages show higher cost pressure than this page.";
  } else if (currentBand >= lowestOtherBand + 1 && currentBand > highestOtherBand) {
    comparisonSummary = "This page shows more cost pressure than the other sampled pages.";
  }

  let patternNote: string | null = null;

  if (duplicatePatternCount >= 2) {
    patternNote = "Duplicate requests appear across sampled pages.";
  } else if (vendorPatternCount >= 2) {
    patternNote = "Third-party vendor overhead appears across sampled pages.";
  } else if (imagePatternCount >= 2) {
    patternNote = "Large media appears across sampled pages.";
  }

  return {
    sampledPagesCount,
    sampledPagesLabel,
    comparisonSummary,
    patternNote,
    hasMultipageEvidence: true
  };
}

export function buildScanDebugSummary(snapshot: RawScanSnapshot) {
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

export { buildResourceMetrics };
