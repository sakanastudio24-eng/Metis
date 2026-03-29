// insights/index.ts turns deterministic Phase 3 output into short Phase 4 guidance.
// It never re-reads raw browser entries directly; it only uses normalized metrics,
// detected issues, and the weighted score breakdown already produced upstream.
import type {
  ConfidenceAssessment,
  CostInsight,
  DetectedIssue,
  IssueCategory,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ScoreBreakdown,
  ScoreDeduction,
  Severity
} from "../../shared/types/audit";
import {
  INSIGHT_ESTIMATE_LABELS,
  INSIGHT_NEXT_STEPS,
  INSIGHT_SUMMARY_TEMPLATES
} from "./config";
import { normalizeRouteContext } from "../refinement/normalizedContext";
import { DETECTION_THRESHOLDS } from "../detection/config";

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3
};

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

function findDeductionForIssue(
  issue: DetectedIssue,
  deductions: ScoreDeduction[]
) {
  return deductions.find((deduction) => deduction.category === issue.category);
}

function getStrongestIssue(
  issues: DetectedIssue[],
  deductions: ScoreDeduction[]
) {
  // Insight order should track the same logic the score used, otherwise the
  // headline can feel disconnected from the numeric result.
  return [...issues].sort((left, right) => {
    const severityDifference = severityRank[right.severity] - severityRank[left.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    const leftPoints = findDeductionForIssue(left, deductions)?.points ?? 0;
    const rightPoints = findDeductionForIssue(right, deductions)?.points ?? 0;
    const deductionDifference = rightPoints - leftPoints;

    if (deductionDifference !== 0) {
      return deductionDifference;
    }

    return left.title.localeCompare(right.title);
  })[0];
}

function buildSupportingDetail(issue: DetectedIssue) {
  // This line exists to prove why the issue fired, not to restate the title.
  switch (issue.category) {
    case "requestCount":
      return `${issue.metric?.requestCount ?? 0} retained requests cleared cleanup against a threshold of ${
        issue.threshold?.requestCount ?? 0
      }.`;
    case "duplicateRequests":
      return `${issue.metric?.duplicateRequestCount ?? 0} duplicate hits landed across ${
        issue.metric?.duplicateEndpointCount ?? 0
      } endpoints, past the active threshold of ${
        issue.threshold?.duplicateRequestCount ?? 0
      } hits or ${issue.threshold?.duplicateEndpointCount ?? 0} endpoints.`;
    case "pageWeight":
      return `${formatBytes(issue.metric?.totalEncodedBodySize ?? 0)} of known transfer weight was retained against a threshold of ${formatBytes(
        issue.threshold?.totalEncodedBodySize ?? 0
      )}.`;
    case "largeImages":
      return `${issue.metric?.meaningfulImageCount ?? 0} heavier images account for ${formatBytes(
        issue.metric?.meaningfulImageBytes ?? 0
      )}, above the current threshold of ${
        issue.threshold?.meaningfulImageCount ?? 0
      } images or ${formatBytes(issue.threshold?.meaningfulImageBytes ?? 0)}.`;
    case "thirdPartySprawl":
      return `${issue.metric?.thirdPartyDomainCount ?? 0} third-party domains were observed against a threshold of ${
        issue.threshold?.thirdPartyDomainCount ?? 0
      }.`;
    case "aiSpendSurface":
      return `${issue.metric?.aiVendorCount ?? 0} AI provider was detected with ${
        issue.metric?.apiRequestCount ?? 0
      } API-style requests and ${issue.metric?.requestCount ?? 0} retained requests on this route.`;
    case "analyticsAdsRumSurface":
      return `${issue.metric?.analyticsVendorCount ?? 0} analytics, ad-tech, or RUM vendors were detected on this route.`;
    case "hostingCdnSpendSurface":
      return `${issue.metric?.hostingVendorCount ?? 0} hosting or CDN vendors were detected alongside ${formatBytes(
        issue.metric?.totalEncodedBodySize ?? 0
      )} of transfer weight and ${issue.metric?.requestCount ?? 0} retained requests.`;
    default:
      return issue.detail;
  }
}

function buildNoIssueInsight(snapshot: RawScanSnapshot): CostInsight {
  return {
    summary: "The page looks controlled from a cost-risk perspective.",
    supportingDetail: `${snapshot.metrics.requestCount} retained requests and ${formatBytes(
      snapshot.metrics.totalEncodedBodySize
    )} of known transfer weight are both staying within the current thresholds.`,
    estimateLabel: INSIGHT_ESTIMATE_LABELS.healthy,
    nextStep: INSIGHT_NEXT_STEPS.default,
    primaryCategory: null
  };
}

function buildWarmingInsight(snapshot: RawScanSnapshot): CostInsight {
  return {
    summary: "Metis is still warming up on this page.",
    supportingDetail: `${snapshot.metrics.rawRequestCount} raw resource entries were seen, but not enough retained requests have cleared cleanup yet.`,
    estimateLabel: INSIGHT_ESTIMATE_LABELS["warming up"],
    nextStep: "Let the page finish loading, interact once, and run the scan again.",
    primaryCategory: null
  };
}

function isHeavyRouteCategory(category: IssueCategory | null) {
  return [
    "requestCount",
    "duplicateRequests",
    "pageWeight",
    "largeImages",
    "aiSpendSurface",
    "hostingCdnSpendSurface"
  ].includes(category ?? "");
}

function isLightRoute(snapshot: RawScanSnapshot, issues: DetectedIssue[]) {
  return (
    snapshot.metrics.requestCount < 50 &&
    snapshot.metrics.totalEncodedBodySize < 500_000 &&
    !issues.some((issue) => issue.category === "duplicateRequests")
  );
}

function applyContextFraming(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  insight: CostInsight,
  answers: PlusRefinementAnswers
): CostInsight {
  if (!insight.primaryCategory || !isHeavyRouteCategory(insight.primaryCategory)) {
    return insight;
  }

  if (isLightRoute(snapshot, issues)) {
    return insight;
  }

  const routeContext = normalizeRouteContext(answers);

  if (routeContext.routeRole === "specific" && routeContext.isDynamic) {
    return {
      ...insight,
      summary: "This route is specific and dynamic, so some extra activity is expected."
    };
  }

  if (routeContext.pageClass === "marketing" && routeContext.routeRole !== "specific") {
    const hasMediumRequestPressure =
      snapshot.metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.medium;
    const hasMediumPayloadPressure =
      snapshot.metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.medium;

    if (hasMediumRequestPressure && hasMediumPayloadPressure) {
      return {
        ...insight,
        summary: "This route is heavy for a marketing page."
      };
    }

    return {
      ...insight,
      summary: "This route shows moderate complexity for a marketing page."
    };
  }

  if (routeContext.pageClass === "docs") {
    return {
      ...insight,
      summary: "This route is a little heavier than expected for a docs page."
    };
  }

  if (routeContext.pageClass === "dashboard") {
    return {
      ...insight,
      summary: "This route is heavier, but some of that is expected for a dashboard."
    };
  }

  if (routeContext.pageClass === "ai") {
    return {
      ...insight,
      summary: "This route is active and interactive, so some extra activity is expected."
    };
  }

  return insight;
}

function buildContextDetail(answers: PlusRefinementAnswers) {
  if (answers.representativeExperience === "specificRoute") {
    return "Metis is reading this as a specific route, not the whole public experience.";
  }

  if (answers.representativeExperience === "mainPublicPage") {
    return "Metis is reading this as part of the main public experience.";
  }

  return null;
}

export function buildInsight(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  score: ScoreBreakdown,
  confidence: ConfidenceAssessment,
  answers: PlusRefinementAnswers = {}
): CostInsight {
  if (score.label === "warming up") {
    return buildWarmingInsight(snapshot);
  }

  if (issues.length === 0) {
    return buildNoIssueInsight(snapshot);
  }

  const strongestIssue = getStrongestIssue(issues, score.deductions);
  const primaryCategory: IssueCategory = strongestIssue.category;
  // Summary text stays template-based so the same input always yields the same
  // headline. That keeps Phase 4 deterministic and easier to test.
  const summaryTemplate =
    INSIGHT_SUMMARY_TEMPLATES[primaryCategory]?.[score.label] ??
    INSIGHT_SUMMARY_TEMPLATES.default[score.label];

  const contextDetail = buildContextDetail(answers);
  const insight: CostInsight = applyContextFraming(
    snapshot,
    issues,
    {
      summary: summaryTemplate,
      supportingDetail: contextDetail
        ? `${buildSupportingDetail(strongestIssue)} ${contextDetail}`
        : buildSupportingDetail(strongestIssue),
      estimateLabel: INSIGHT_ESTIMATE_LABELS[score.label],
      nextStep: INSIGHT_NEXT_STEPS[primaryCategory] ?? INSIGHT_NEXT_STEPS.default,
      primaryCategory
    },
    answers
  );

  if (confidence.label === "High") {
    return insight;
  }

  if (confidence.label === "Moderate") {
    return insight;
  }

  return {
    ...insight,
    summary: `${insight.summary} Metis could only see part of this route.`,
    supportingDetail: insight.supportingDetail
  };
}
