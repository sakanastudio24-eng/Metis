// Convert a normalized snapshot into a short list of user-facing cost-risk issues.
import type { DetectedIssue, RawScanSnapshot } from "../../shared/types/audit";

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

export function detectIssues(snapshot: RawScanSnapshot): DetectedIssue[] {
  const { metrics } = snapshot;
  const issues: DetectedIssue[] = [];

  if (metrics.requestCount >= 120) {
    issues.push({
      id: "high-request-count",
      title: "High request count may increase bandwidth costs",
      detail: `${metrics.requestCount} requests were retained after cleanup, which can raise transfer volume and edge work for a single experience.`,
      severity: "high"
    });
  } else if (metrics.requestCount >= 80) {
    issues.push({
      id: "high-request-count",
      title: "Request volume is trending high",
      detail: `${metrics.requestCount} requests survived normalization, which suggests the page is doing more network work than it needs to.`,
      severity: "medium"
    });
  } else if (metrics.requestCount >= 50) {
    issues.push({
      id: "high-request-count",
      title: "Request volume is worth watching",
      detail: `${metrics.requestCount} requests is still manageable, but it leaves less room for third-party growth and heavier page states.`,
      severity: "low"
    });
  }

  if (metrics.duplicateRequestCount >= 45 || metrics.duplicateEndpointCount >= 16) {
    issues.push({
      id: "duplicate-requests",
      title: "Duplicate requests suggest redundant loading",
      detail: `${metrics.duplicateRequestCount} repeat hits across ${metrics.duplicateEndpointCount} endpoints point to repeated fetches, assets, or script reuse.`,
      severity: "high"
    });
  } else if (metrics.duplicateRequestCount >= 20 || metrics.duplicateEndpointCount >= 8) {
    issues.push({
      id: "duplicate-requests",
      title: "Repeated requests are adding avoidable traffic",
      detail: `${metrics.duplicateRequestCount} duplicate hits across ${metrics.duplicateEndpointCount} endpoints suggest that some assets or APIs are loading more than once.`,
      severity: "medium"
    });
  } else if (metrics.duplicateRequestCount >= 8 || metrics.duplicateEndpointCount >= 4) {
    issues.push({
      id: "duplicate-requests",
      title: "Some duplicate requests are starting to show up",
      detail: `${metrics.duplicateRequestCount} extra hits were detected after normalization, which is often the first sign of redundant loading paths.`,
      severity: "low"
    });
  }

  if (metrics.totalEncodedBodySize >= 3_000_000) {
    issues.push({
      id: "heavy-page-weight",
      title: "Large payloads may raise bandwidth costs",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} of known transfer weight was detected, which is heavy for a single page experience.`,
      severity: "high"
    });
  } else if (metrics.totalEncodedBodySize >= 1_500_000) {
    issues.push({
      id: "heavy-page-weight",
      title: "Payload weight is starting to climb",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} of known transfer weight can become expensive once traffic or route depth scales up.`,
      severity: "medium"
    });
  } else if (metrics.totalEncodedBodySize >= 750_000) {
    issues.push({
      id: "heavy-page-weight",
      title: "Page weight is worth trimming",
      detail: `${formatBytes(metrics.totalEncodedBodySize)} is not extreme yet, but it leaves less headroom for richer states and third-party code.`,
      severity: "low"
    });
  }

  if (metrics.meaningfulImageBytes >= 2_000_000 || metrics.meaningfulImageCount >= 8) {
    issues.push({
      id: "large-images",
      title: "Large images are driving a meaningful share of page weight",
      detail: `${metrics.meaningfulImageCount} heavier images account for ${formatBytes(metrics.meaningfulImageBytes)} of transfer weight, which can dominate media-heavy routes.`,
      severity: "high"
    });
  } else if (metrics.meaningfulImageBytes >= 1_000_000 || metrics.meaningfulImageCount >= 4) {
    issues.push({
      id: "large-images",
      title: "Image weight is starting to dominate the page",
      detail: `${metrics.meaningfulImageCount} meaningful images account for ${formatBytes(metrics.meaningfulImageBytes)}, which is enough to noticeably shape transfer cost.`,
      severity: "medium"
    });
  } else if (metrics.meaningfulImageBytes >= 500_000 || metrics.meaningfulImageCount >= 2) {
    issues.push({
      id: "large-images",
      title: "A few images are already carrying real weight",
      detail: `${metrics.meaningfulImageCount} meaningful images add up to ${formatBytes(metrics.meaningfulImageBytes)}, which is often a good optimization surface.`,
      severity: "low"
    });
  }

  if (metrics.thirdPartyDomainCount >= 14) {
    issues.push({
      id: "third-party-sprawl",
      title: "Many third-party dependencies can raise network and operational cost",
      detail: `${metrics.thirdPartyDomainCount} third-party domains were observed, which broadens both network surface area and external dependency risk.`,
      severity: "high"
    });
  } else if (metrics.thirdPartyDomainCount >= 8) {
    issues.push({
      id: "third-party-sprawl",
      title: "Third-party sprawl is becoming noticeable",
      detail: `${metrics.thirdPartyDomainCount} third-party domains were detected, which can make cost and performance harder to control.`,
      severity: "medium"
    });
  } else if (metrics.thirdPartyDomainCount >= 4) {
    issues.push({
      id: "third-party-sprawl",
      title: "Third-party usage is worth watching",
      detail: `${metrics.thirdPartyDomainCount} outside domains are already in play, so growth here can quietly increase request complexity.`,
      severity: "low"
    });
  }

  return sortIssues(issues).slice(0, 5);
}
