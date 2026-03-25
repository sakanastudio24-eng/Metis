import { detectMoneyStack } from "../stack";
import { DETECTION_THRESHOLDS } from "../detection/config";
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

function supportsHeavyAppContext(answers: PlusRefinementAnswers) {
  return ["aiApp", "saasDashboard", "mediaHeavy", "ecommerce", "marketplace", "internalTool"].includes(
    answers.appType ?? ""
  );
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

  const hasHostingSupport = hostingIds.length > 0 || Boolean(answers.hostingProvider);
  const hasAiSurface = aiIds.length > 0 || ["yesOften", "sometimes"].includes(answers.aiUsage ?? "");
  const hasHeavyPayload = metrics.totalEncodedBodySize >= DETECTION_THRESHOLDS.pageWeight.medium;
  const hasElevatedRequestCount = metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.medium;
  const hasHighRequestCount = metrics.requestCount >= DETECTION_THRESHOLDS.requestCount.high;
  const hasStaticContext =
    ["marketing", "portfolio"].includes(answers.appType ?? "") ||
    answers.pageDynamics === "mostlyStatic";
  const hasContextualSupport =
    hasHostingSupport || hasAiSurface || supportsHeavyAppContext(answers) || isModernFramework(frameworkIds);

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

  if (supportsHeavyAppContext(answers)) {
    credits.push({
      id: "app-context-support",
      points: CONTROL_CONFIG.credits.appContextSupport,
      reason: "The selected app type suggests this route can legitimately carry more work than a simple site."
    });
  }

  if (metrics.duplicateEndpointCount >= DETECTION_THRESHOLDS.duplicateRequests.low.duplicateEndpointCount) {
    penalties.push({
      id: "duplicate-endpoints",
      points: CONTROL_CONFIG.penalties.duplicateEndpoints,
      reason: "Duplicate endpoints still point to repeated work that is hard to justify."
    });
  }

  if (metrics.duplicateRequestCount >= DETECTION_THRESHOLDS.duplicateRequests.low.duplicateRequestCount) {
    penalties.push({
      id: "duplicate-requests",
      points: CONTROL_CONFIG.penalties.duplicateRequests,
      reason: "Repeated requests suggest avoidable waste instead of expected route complexity."
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

  if (hasHighRequestCount && hasStaticContext && !hasIssue(issues, "duplicateRequests")) {
    penalties.push({
      id: "static-high-request-count",
      points: CONTROL_CONFIG.penalties.staticHighRequestCount,
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
