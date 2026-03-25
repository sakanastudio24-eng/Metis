// detection/index.ts converts normalized metrics into a short list of explainable issues.
// It reads the public threshold config and attaches metric/threshold metadata to each issue.
import { detectMoneyStack } from "../stack";
import type { DetectedIssue, PlusRefinementAnswers, RawScanSnapshot } from "../../shared/types/audit";
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

function isScoredHostingVendor(vendor: { id: string }) {
  return !["aws", "aws-s3", "aws-api-gateway", "cloudfront"].includes(vendor.id);
}

export function detectIssues(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers = {}
): DetectedIssue[] {
  const { metrics } = snapshot;
  const issues: DetectedIssue[] = [];
  const moneyStack = detectMoneyStack(snapshot, answers);

  // Resource-shape issues stay primary because they explain what the route is
  // doing, not just which vendors happen to be present.
  if (metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.high) {
    issues.push({
      id: "high-request-count",
      title: "Request volume is elevated and worth reviewing",
      detail: `${metrics.requestCount} requests were retained after cleanup. That may be justified on a dynamic route, but it is worth checking whether the page is doing more network work than it needs to.`,
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
      title: "Request volume is elevated",
      detail: `${metrics.requestCount} requests survived normalization. Some of that may be expected, but this route is worth reviewing for redundant or low-value network work.`,
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
      detail: `${metrics.requestCount} requests is still manageable, but it leaves less headroom if this route grows or adds more third-party work.`,
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

  // Money-stack issues are lighter score modifiers. They add provider-aware cost
  // context without drowning out the core request and payload signals.
  const analyticsVendors =
    moneyStack.groups.find((group) => group.id === "analyticsAdsRum")?.vendors ?? [];
  if (analyticsVendors.length >= DETECTION_THRESHOLDS.analyticsAdsRumSurface.high) {
    issues.push({
      id: "analytics-ads-rum-surface",
      title: "A dense analytics and ad-tech surface is adding vendor overhead",
      detail: `${analyticsVendors.map((vendor) => vendor.label).join(", ")} were detected on this route, which increases third-party execution and vendor cost pressure.`,
      severity: "high",
      category: "analyticsAdsRumSurface",
      metric: {
        analyticsVendorCount: analyticsVendors.length
      },
      threshold: {
        analyticsVendorCount: DETECTION_THRESHOLDS.analyticsAdsRumSurface.high
      }
    });
  } else if (analyticsVendors.length >= DETECTION_THRESHOLDS.analyticsAdsRumSurface.medium) {
    issues.push({
      id: "analytics-ads-rum-surface",
      title: "Analytics and ad-tech vendors are starting to stack up",
      detail: `${analyticsVendors.map((vendor) => vendor.label).join(", ")} are active here, which makes third-party cost harder to keep tidy.`,
      severity: "medium",
      category: "analyticsAdsRumSurface",
      metric: {
        analyticsVendorCount: analyticsVendors.length
      },
      threshold: {
        analyticsVendorCount: DETECTION_THRESHOLDS.analyticsAdsRumSurface.medium
      }
    });
  } else if (analyticsVendors.length >= DETECTION_THRESHOLDS.analyticsAdsRumSurface.low) {
    issues.push({
      id: "analytics-ads-rum-surface",
      title: "A paid measurement or advertising layer is present on this route",
      detail: `${analyticsVendors[0]?.label ?? "A measurement vendor"} is active here, which adds direct vendor and execution overhead even before traffic scales.`,
      severity: "low",
      category: "analyticsAdsRumSurface",
      metric: {
        analyticsVendorCount: analyticsVendors.length
      },
      threshold: {
        analyticsVendorCount: DETECTION_THRESHOLDS.analyticsAdsRumSurface.low
      }
    });
  }

  const aiVendors = moneyStack.groups.find((group) => group.id === "aiProviders")?.vendors ?? [];
  const aiUsageHint = answers.aiUsage === "yesOften" || answers.aiUsage === "sometimes";
  if (aiVendors.length > 0 && (metrics.apiRequestCount > 0 || aiUsageHint)) {
    const highAi =
      metrics.apiRequestCount >= DETECTION_THRESHOLDS.aiSpendSurface.highApiRequestCount ||
      metrics.requestCount >= DETECTION_THRESHOLDS.aiSpendSurface.highRequestCount ||
      answers.aiUsage === "yesOften";
    const mediumAi =
      metrics.apiRequestCount >= DETECTION_THRESHOLDS.aiSpendSurface.mediumApiRequestCount ||
      metrics.requestCount >= DETECTION_THRESHOLDS.aiSpendSurface.mediumRequestCount;

    issues.push({
      id: "ai-spend-surface",
      title:
        highAi
          ? "AI work is a major part of this route's cost profile"
          : mediumAi
            ? "AI work is contributing to this route's cost profile"
            : "An AI cost surface is present on this route",
      detail:
        highAi
          ? `${aiVendors[0]?.label ?? "An AI provider"} is active and the current request profile is large enough that repeated model calls could become materially expensive if the route is doing more AI work than it needs to.`
          : mediumAi
            ? `${aiVendors[0]?.label ?? "An AI provider"} is active here and the request profile suggests vendor cost can rise quickly as traffic grows, even if AI usage is expected on the route.`
            : `${aiVendors[0]?.label ?? "An AI provider"} was detected alongside route activity. That is not automatically waste, but repeated AI work would add direct vendor cost.`,
      severity: highAi ? "high" : mediumAi ? "medium" : "low",
      category: "aiSpendSurface",
      metric: {
        aiVendorCount: aiVendors.length,
        apiRequestCount: metrics.apiRequestCount,
        requestCount: metrics.requestCount
      },
      threshold: {
        apiRequestCount: highAi
          ? DETECTION_THRESHOLDS.aiSpendSurface.highApiRequestCount
          : mediumAi
            ? DETECTION_THRESHOLDS.aiSpendSurface.mediumApiRequestCount
            : 1
      }
    });
  }

  const hostingVendors = moneyStack.groups.find((group) => group.id === "hostingCdn")?.vendors ?? [];
  const scoredHostingVendors = hostingVendors.filter(isScoredHostingVendor);
  if (scoredHostingVendors.length > 0) {
    const highHosting =
      scoredHostingVendors.length >= 2 &&
      (metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.hostingCdnSpendSurface.highTransferBytes ||
        metrics.requestCount >= DETECTION_THRESHOLDS.hostingCdnSpendSurface.highRequestCount);
    const mediumHosting =
      scoredHostingVendors.length >= 2 ||
      metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.hostingCdnSpendSurface.mediumTransferBytes ||
      metrics.requestCount >= DETECTION_THRESHOLDS.hostingCdnSpendSurface.mediumRequestCount;

    issues.push({
      id: "hosting-cdn-spend-surface",
      title:
        highHosting
          ? "The hosting path is amplifying this route's cost profile"
          : mediumHosting
            ? "The hosting path is now part of the cost profile"
            : "A billable hosting or CDN layer is active on this route",
      detail:
        highHosting
          ? `${scoredHostingVendors.map((vendor) => vendor.label).join(", ")} are serving this route alongside a heavier request or transfer profile. The host or CDN is not the fault, but cache misses, transfer-heavy assets, and repeated compute become more expensive here.`
          : mediumHosting
            ? `${scoredHostingVendors.map((vendor) => vendor.label).join(", ")} are part of the current route path, so repeated requests and heavier assets have a clearer infra cost impact without making the provider itself the problem.`
            : `${scoredHostingVendors[0]?.label ?? "A host or CDN"} was detected on this route, which makes transfer, cache misses, and repeated work more relevant financially.`,
      severity: highHosting ? "high" : mediumHosting ? "medium" : "low",
      category: "hostingCdnSpendSurface",
      metric: {
        hostingVendorCount: scoredHostingVendors.length,
        totalEncodedBodySize: metrics.totalEncodedBodySize,
        requestCount: metrics.requestCount
      },
      threshold: {
        totalEncodedBodySize: highHosting
          ? DETECTION_THRESHOLDS.hostingCdnSpendSurface.highTransferBytes
          : mediumHosting
            ? DETECTION_THRESHOLDS.hostingCdnSpendSurface.mediumTransferBytes
            : DETECTION_THRESHOLDS.hostingCdnSpendSurface.lowTransferBytes
      }
    });
  }

  // Keep the surfaced issue list short so the panel and report stay readable.
  return sortIssues(issues).slice(0, 5);
}
