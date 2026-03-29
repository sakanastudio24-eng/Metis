import { detectMoneyStack } from "../stack";
import { DETECTION_THRESHOLDS } from "../detection/config";
import { normalizeRouteContext } from "../refinement/normalizedContext";
import { CONTROL_CONFIG } from "./control.config";
import type {
  ControlAssessment,
  ControlCredit,
  ControlLabel,
  ControlPenalty,
  DetectedIssue,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../../shared/types/audit";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hasIssue(issues: DetectedIssue[], category: DetectedIssue["category"]) {
  return issues.some((issue) => issue.category === category);
}

function isModernFramework(frameworkIds: string[]) {
  return frameworkIds.some((id) => ["react", "nextjs", "vue", "svelte"].includes(id));
}

function isContainedRoute(snapshot: RawScanSnapshot, issues: DetectedIssue[]) {
  return (
    snapshot.metrics.requestCount < 50 &&
    snapshot.metrics.totalEncodedBodySize < 1_000_000 &&
    !hasIssue(issues, "duplicateRequests")
  );
}

function getLargeImagePenaltyPoints(issue: DetectedIssue) {
  if (issue.severity === "high") {
    return CONTROL_CONFIG.penalties.largeImages.high;
  }

  if (issue.severity === "medium") {
    return CONTROL_CONFIG.penalties.largeImages.medium;
  }

  return CONTROL_CONFIG.penalties.largeImages.low;
}

function buildLabel(score: number): ControlLabel {
  if (score >= CONTROL_CONFIG.labels.controlledMin) {
    return "Controlled";
  }

  if (score >= CONTROL_CONFIG.labels.mixedMin) {
    return "Mixed";
  }

  return "Uncontrolled";
}

function buildReasons(credits: ControlCredit[], penalties: ControlPenalty[]) {
  const ranked = [
    ...penalties.map((entry) => ({
      weight: entry.points,
      polarity: "penalty" as const,
      reason: entry.reason
    })),
    ...credits.map((entry) => ({
      weight: entry.points,
      polarity: "credit" as const,
      reason: entry.reason
    }))
  ]
    .sort((left, right) => {
      const weightDifference = right.weight - left.weight;
      if (weightDifference !== 0) {
        return weightDifference;
      }

      if (left.polarity !== right.polarity) {
        return left.polarity === "penalty" ? -1 : 1;
      }

      return left.reason.localeCompare(right.reason);
    })
    .slice(0, 3);

  return ranked.map((entry) => entry.reason);
}

export function assessControl(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  answers: PlusRefinementAnswers = {}
): ControlAssessment {
  const detection = detectMoneyStack(snapshot, answers);
  const metrics = snapshot.metrics;
  const credits: ControlCredit[] = [];
  const penalties: ControlPenalty[] = [];

  const hostingIds =
    detection.groups.find((group) => group.id === "hostingCdn")?.vendors.map((vendor) => vendor.id) ?? [];
  const aiIds =
    detection.groups.find((group) => group.id === "aiProviders")?.vendors.map((vendor) => vendor.id) ?? [];
  const analyticsIds =
    detection.groups.find((group) => group.id === "analyticsAdsRum")?.vendors.map((vendor) => vendor.id) ?? [];
  const frameworkIds =
    detection.groups.find((group) => group.id === "framework")?.vendors.map((vendor) => vendor.id) ?? [];
  const routeContext = normalizeRouteContext(answers);

  const hasHostingSupport = hostingIds.length > 0 || Boolean(answers.hostingProvider);
  const hasAiSurface = aiIds.length > 0 || ["yesOften", "sometimes"].includes(answers.aiUsage ?? "");
  const hasHeavyPayload = metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.medium;
  const hasElevatedRequestCount = metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.medium;
  const hasHighRequestCount = metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.high;
  const hasSpecificRouteContext = routeContext.routeRole === "specific";
  const hasMainPublicPageContext = routeContext.routeRole === "main";
  const hasStaticContext =
    routeContext.pageClass === "marketing" ||
    answers.pageDynamics === "mostlyStatic" ||
    hasMainPublicPageContext;
  const hasContextualSupport =
    hasHostingSupport ||
    hasAiSurface ||
    routeContext.pageClass === "dashboard" ||
    routeContext.pageClass === "ai" ||
    routeContext.pageClass === "docs" ||
    hasSpecificRouteContext ||
    isModernFramework(frameworkIds);

  if (isContainedRoute(snapshot, issues)) {
    credits.push({
      id: "contained-route",
      points: CONTROL_CONFIG.credits.containedRoute,
      reason: "This route stays light enough to look controlled on its own."
    });
  }

  if (aiIds.length > 0) {
    credits.push({
      id: "ai-provider-detected",
      points: CONTROL_CONFIG.credits.aiProviderDetected,
      reason: "AI usage looks expected on this route because a provider is clearly present."
    });
  }

  if (hasHeavyPayload && hasHostingSupport) {
    credits.push({
      id: "payload-on-cdn",
      points: CONTROL_CONFIG.credits.justifiedPayloadOnCdn,
      reason: "Payload weight is partly justified by a hosting or CDN layer that is built to serve heavier routes."
    });
  }

  if (isModernFramework(frameworkIds) && hasElevatedRequestCount) {
    credits.push({
      id: "modern-framework-overhead",
      points: CONTROL_CONFIG.credits.modernFrameworkOverhead,
      reason: "Some request overhead is expected on a modern app route using a heavier client framework."
    });
  }

  if (isModernFramework(frameworkIds)) {
    credits.push({
      id: "modern-framework-detected",
      points: CONTROL_CONFIG.credits.modernFrameworkDetected,
      reason: "A modern app framework is present, so some route complexity can be intentional."
    });
  }

  if (analyticsIds.length >= 1 && analyticsIds.length <= DETECTION_THRESHOLDS.analyticsAdsRumSurface.medium) {
    credits.push({
      id: "moderate-analytics",
      points: CONTROL_CONFIG.credits.moderateAnalytics,
      reason: "A small analytics footprint can be normal if it stays contained."
    });
  }

  if (answers.pageDynamics === "highlyDynamic") {
    credits.push({
      id: "highly-dynamic-route",
      points: CONTROL_CONFIG.credits.highlyDynamicRoute,
      reason: "The route is marked as highly dynamic, so some extra request activity is expected."
    });
  }

  if (routeContext.pageClass === "dashboard") {
    credits.push({
      id: "app-context-support",
      points: CONTROL_CONFIG.credits.dashboardContextSupport,
      reason: "The selected app type suggests this route can legitimately carry more work than a simple site."
    });
  }

  if (routeContext.pageClass === "docs") {
    credits.push({
      id: "docs-context-support",
      points: CONTROL_CONFIG.credits.docsContextSupport,
      reason: "Content-heavy pages can carry more assets than a simple landing page without looking out of control."
    });
  }

  if (routeContext.pageClass === "docs" && hasIssue(issues, "largeImages") && !hasIssue(issues, "duplicateRequests")) {
    credits.push({
      id: "docs-media-support",
      points: CONTROL_CONFIG.credits.docsMediaSupport,
      reason: "Media on a docs route can be meaningful product context, so image weight should not crater control on its own."
    });
  }

  if (routeContext.pageClass === "ai") {
    credits.push({
      id: "ai-context-support",
      points: CONTROL_CONFIG.credits.aiContextSupport,
      reason: "An interactive AI route can justify more request activity than a simple public page."
    });
  }

  if (hasSpecificRouteContext) {
    credits.push({
      id: "specific-route-context",
      points: CONTROL_CONFIG.credits.specificRouteContext,
      reason: "This was marked as a specific route, so some extra route-level activity is more expected."
    });
  }

  if (metrics.duplicateEndpointCount >= DETECTION_THRESHOLDS.duplicateRequests.low.duplicateEndpointCount) {
    const duplicateEndpointPenalty = isModernFramework(frameworkIds)
      ? Math.round(CONTROL_CONFIG.penalties.duplicateEndpoints * 0.6)
      : CONTROL_CONFIG.penalties.duplicateEndpoints;

    penalties.push({
      id: "duplicate-endpoints",
      points: duplicateEndpointPenalty,
      reason: "Duplicate endpoints still point to repeated work that is hard to justify."
    });
  }

  if (metrics.duplicateRequestCount >= DETECTION_THRESHOLDS.duplicateRequests.low.duplicateRequestCount) {
    const duplicateRequestPenalty = isModernFramework(frameworkIds)
      ? Math.round(CONTROL_CONFIG.penalties.duplicateRequests * 0.6)
      : CONTROL_CONFIG.penalties.duplicateRequests;

    penalties.push({
      id: "duplicate-requests",
      points: duplicateRequestPenalty,
      reason: "Repeated requests suggest avoidable waste instead of expected route complexity."
    });
  }

  const largeImageIssue = issues.find((issue) => issue.category === "largeImages");
  if (largeImageIssue) {
    const basePenalty = getLargeImagePenaltyPoints(largeImageIssue);
    const imagePenalty =
      routeContext.pageClass === "docs"
        ? Math.max(1, Math.round(basePenalty * 0.6))
        : basePenalty;

    penalties.push({
      id: "large-images",
      points: imagePenalty,
      reason: "Image-heavy routes can still add weight, but image complexity should affect control less than direct waste."
    });
  }

  if (metrics.thirdPartyDomainCount >= DETECTION_THRESHOLDS.thirdPartySprawl.high) {
    penalties.push({
      id: "heavy-third-party-sprawl",
      points: CONTROL_CONFIG.penalties.heavyThirdPartySprawl,
      reason: "Heavy third-party sprawl is difficult to justify because each extra vendor adds overhead."
    });
  }

  if (hasHeavyPayload && !hasContextualSupport) {
    penalties.push({
      id: "unjustified-payload",
      points: CONTROL_CONFIG.penalties.unjustifiedPayload,
      reason: "Payload weight looks high without enough route context to explain it."
    });
  }

  if (
    hasHighRequestCount &&
    hasStaticContext &&
    !hasSpecificRouteContext &&
    !hasIssue(issues, "duplicateRequests")
  ) {
    const highRequestPenalty = isModernFramework(frameworkIds)
      ? Math.round(CONTROL_CONFIG.penalties.staticHighRequestCount * 0.4)
      : CONTROL_CONFIG.penalties.staticHighRequestCount;

    penalties.push({
      id: "static-high-request-count",
      points: highRequestPenalty,
      reason: "Request volume looks high for a relatively static route and is worth challenging."
    });
  }

  const creditPoints = credits.reduce((total, entry) => total + entry.points, 0);
  const penaltyPoints = penalties.reduce((total, entry) => total + entry.points, 0);
  const score = clamp(CONTROL_CONFIG.baseScore + creditPoints - penaltyPoints, 0, 100);

  return {
    score,
    label: buildLabel(score),
    reasons: buildReasons(credits, penalties),
    credits,
    penalties
  };
}
