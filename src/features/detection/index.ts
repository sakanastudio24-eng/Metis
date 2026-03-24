// detection/index.ts converts normalized metrics into a short list of explainable issues.
// It reads the public threshold config and attaches metric/threshold metadata to each issue.
import type { DetectedIssue, RawScanSnapshot } from "../../shared/types/audit";
import { DETECTION_THRESHOLDS } from "./config";

const severityRank = {
  high: 3,
  medium: 2,
  low: 1
} as const;

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

function sortIssues(issues: DetectedIssue[]) {
  return issues.sort((left, right) => {
    const severityDifference = severityRank[right.severity] - severityRank[left.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return left.title.localeCompare(right.title);
  });
}

function meetsDuplicateThreshold(
  snapshot: RawScanSnapshot,
  threshold: {
    duplicateRequestCount: number;
    duplicateEndpointCount: number;
  }
) {
  return (
    snapshot.metrics.duplicateRequestCount >= threshold.duplicateRequestCount ||
    snapshot.metrics.duplicateEndpointCount >= threshold.duplicateEndpointCount
  );
}

function meetsLargeImageThreshold(
  snapshot: RawScanSnapshot,
  threshold: {
    meaningfulImageBytes: number;
    meaningfulImageCount: number;
  }
) {
  return (
    snapshot.metrics.meaningfulImageBytes >= threshold.meaningfulImageBytes ||
    snapshot.metrics.meaningfulImageCount >= threshold.meaningfulImageCount
  );
}

export function detectIssues(snapshot: RawScanSnapshot): DetectedIssue[] {
  const { metrics } = snapshot;
  const issues: DetectedIssue[] = [];

  if (metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.high) {
    issues.push({
      id: "high-request-count",
      title: "High request count may increase bandwidth costs",
      detail: `${metrics.requestCount} requests were retained after cleanup, which can raise transfer volume and edge work for a single experience.`,
      severity: "high",
      category: "requestCount",
      metric: {
        requestCount: metrics.requestCount
      },
      threshold: {
        requestCount: DETECTION_THRESHOLDS.requestCount.high
      }
    });
  } else if (metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.medium) {
    issues.push({
      id: "high-request-count",
      title: "Request volume is trending high",
      detail: `${metrics.requestCount} requests survived normalization, which suggests the page is doing more network work than it needs to.`,
      severity: "medium",
      category: "requestCount",
      metric: {
        requestCount: metrics.requestCount
      },
      threshold: {
        requestCount: DETECTION_THRESHOLDS.requestCount.medium
      }
    });
  } else if (metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.low) {
    issues.push({
      id: "high-request-count",
      title: "Request volume is worth watching",
      detail: `${metrics.requestCount} requests is still manageable, but it leaves less room for third-party growth and heavier page states.`,
      severity: "low",
      category: "requestCount",
      metric: {
        requestCount: metrics.requestCount
      },
      threshold: {
        requestCount: DETECTION_THRESHOLDS.requestCount.low
      }
    });
  }

  if (meetsDuplicateThreshold(snapshot, DETECTION_THRESHOLDS.duplicateRequests.high)) {
    issues.push({
      id: "duplicate-requests",
      title: "Duplicate requests suggest redundant loading",
      detail: `${metrics.duplicateRequestCount} repeat hits across ${metrics.duplicateEndpointCount} endpoints point to repeated fetches, assets, or script reuse.`,
      severity: "high",
      category: "duplicateRequests",
      metric: {
        duplicateRequestCount: metrics.duplicateRequestCount,
        duplicateEndpointCount: metrics.duplicateEndpointCount
      },
      threshold: DETECTION_THRESHOLDS.duplicateRequests.high
    });
  } else if (meetsDuplicateThreshold(snapshot, DETECTION_THRESHOLDS.duplicateRequests.medium)) {
    issues.push({
      id: "duplicate-requests",
      title: "Repeated requests are adding avoidable traffic",
      detail: `${metrics.duplicateRequestCount} duplicate hits across ${metrics.duplicateEndpointCount} endpoints suggest that some assets or APIs are loading more than once.`,
      severity: "medium",
      category: "duplicateRequests",
      metric: {
        duplicateRequestCount: metrics.duplicateRequestCount,
        duplicateEndpointCount: metrics.duplicateEndpointCount
      },
      threshold: DETECTION_THRESHOLDS.duplicateRequests.medium
    });
  } else if (meetsDuplicateThreshold(snapshot, DETECTION_THRESHOLDS.duplicateRequests.low)) {
    issues.push({
      id: "duplicate-requests",
      title: "Some duplicate requests are starting to show up",
      detail: `${metrics.duplicateRequestCount} extra hits were detected after normalization, which is often the first sign of redundant loading paths.`,
      severity: "low",
      category: "duplicateRequests",
      metric: {
        duplicateRequestCount: metrics.duplicateRequestCount,
        duplicateEndpointCount: metrics.duplicateEndpointCount
      },
      threshold: DETECTION_THRESHOLDS.duplicateRequests.low
    });
  }

  if (metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.high) {
    issues.push({
      id: "heavy-page-weight",
      title: "Large payloads may raise bandwidth costs",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} of known transfer weight was detected, which is heavy for a single page experience.`,
      severity: "high",
      category: "pageWeight",
      metric: {
        totalEncodedBodySize: metrics.totalEncodedBodySize
      },
      threshold: {
        totalEncodedBodySize: DETECTION_THRESHOLDS.pageWeight.high
      }
    });
  } else if (metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.medium) {
    issues.push({
      id: "heavy-page-weight",
      title: "Payload weight is starting to climb",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} of known transfer weight can become expensive once traffic or route depth scales up.`,
      severity: "medium",
      category: "pageWeight",
      metric: {
        totalEncodedBodySize: metrics.totalEncodedBodySize
      },
      threshold: {
        totalEncodedBodySize: DETECTION_THRESHOLDS.pageWeight.medium
      }
    });
  } else if (metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.low) {
    issues.push({
      id: "heavy-page-weight",
      title: "Page weight is worth trimming",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} is not extreme yet, but it leaves less headroom for richer states and third-party code.`,
      severity: "low",
      category: "pageWeight",
      metric: {
        totalEncodedBodySize: metrics.totalEncodedBodySize
      },
      threshold: {
        totalEncodedBodySize: DETECTION_THRESHOLDS.pageWeight.low
      }
    });
  }

  if (meetsLargeImageThreshold(snapshot, DETECTION_THRESHOLDS.largeImages.high)) {
    issues.push({
      id: "large-images",
      title: "Large images are driving a meaningful share of page weight",
      detail: `${metrics.meaningfulImageCount} heavier images account for ${formatBytes(metrics.meaningfulImageBytes)} of transfer weight, which can dominate media-heavy routes.`,
      severity: "high",
      category: "largeImages",
      metric: {
        meaningfulImageCount: metrics.meaningfulImageCount,
        meaningfulImageBytes: metrics.meaningfulImageBytes
      },
      threshold: DETECTION_THRESHOLDS.largeImages.high
    });
  } else if (meetsLargeImageThreshold(snapshot, DETECTION_THRESHOLDS.largeImages.medium)) {
    issues.push({
      id: "large-images",
      title: "Image weight is starting to dominate the page",
      detail: `${metrics.meaningfulImageCount} meaningful images account for ${formatBytes(metrics.meaningfulImageBytes)}, which is enough to noticeably shape transfer cost.`,
      severity: "medium",
      category: "largeImages",
      metric: {
        meaningfulImageCount: metrics.meaningfulImageCount,
        meaningfulImageBytes: metrics.meaningfulImageBytes
      },
      threshold: DETECTION_THRESHOLDS.largeImages.medium
    });
  } else if (meetsLargeImageThreshold(snapshot, DETECTION_THRESHOLDS.largeImages.low)) {
    issues.push({
      id: "large-images",
      title: "A few images are already carrying real weight",
      detail: `${metrics.meaningfulImageCount} meaningful images add up to ${formatBytes(metrics.meaningfulImageBytes)}, which is often a good optimization surface.`,
      severity: "low",
      category: "largeImages",
      metric: {
        meaningfulImageCount: metrics.meaningfulImageCount,
        meaningfulImageBytes: metrics.meaningfulImageBytes
      },
      threshold: DETECTION_THRESHOLDS.largeImages.low
    });
  }

  if (metrics.thirdPartyDomainCount >= DETECTION_THRESHOLDS.thirdPartySprawl.high) {
    issues.push({
      id: "third-party-sprawl",
      title: "Many third-party dependencies can raise network and operational cost",
      detail: `${metrics.thirdPartyDomainCount} third-party domains were observed, which broadens both network surface area and external dependency risk.`,
      severity: "high",
      category: "thirdPartySprawl",
      metric: {
        thirdPartyDomainCount: metrics.thirdPartyDomainCount
      },
      threshold: {
        thirdPartyDomainCount: DETECTION_THRESHOLDS.thirdPartySprawl.high
      }
    });
  } else if (metrics.thirdPartyDomainCount >= DETECTION_THRESHOLDS.thirdPartySprawl.medium) {
    issues.push({
      id: "third-party-sprawl",
      title: "Third-party sprawl is becoming noticeable",
      detail: `${metrics.thirdPartyDomainCount} third-party domains were detected, which can make cost and performance harder to control.`,
      severity: "medium",
      category: "thirdPartySprawl",
      metric: {
        thirdPartyDomainCount: metrics.thirdPartyDomainCount
      },
      threshold: {
        thirdPartyDomainCount: DETECTION_THRESHOLDS.thirdPartySprawl.medium
      }
    });
  } else if (metrics.thirdPartyDomainCount >= DETECTION_THRESHOLDS.thirdPartySprawl.low) {
    issues.push({
      id: "third-party-sprawl",
      title: "Third-party usage is worth watching",
      detail: `${metrics.thirdPartyDomainCount} outside domains are already in play, so growth here can quietly increase request complexity.`,
      severity: "low",
      category: "thirdPartySprawl",
      metric: {
        thirdPartyDomainCount: metrics.thirdPartyDomainCount
      },
      threshold: {
        thirdPartyDomainCount: DETECTION_THRESHOLDS.thirdPartySprawl.low
      }
    });
  }

  return sortIssues(issues).slice(0, 5);
}
