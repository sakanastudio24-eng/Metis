import type {
  ConfidenceAssessment,
  MoneyStackDetection,
  RawScanSnapshot,
  ScoreBreakdown
} from "../../shared/types/audit";
import { CONFIDENCE_CONFIG } from "./config";

function buildReasons(snapshot: RawScanSnapshot, detection: MoneyStackDetection) {
  const reasons: string[] = [];
  const { metrics } = snapshot;

  if (metrics.requestCount >= CONFIDENCE_CONFIG.requests.high) {
    reasons.push("Retained request volume is strong enough to support a fuller route read.");
  } else if (metrics.requestCount >= CONFIDENCE_CONFIG.requests.moderate) {
    reasons.push("Metis has enough retained requests to guide the read, but not a full route picture.");
  } else {
    reasons.push("Metis retained only a small amount of route data.");
  }

  if (metrics.meaningfulImageBytes >= CONFIDENCE_CONFIG.meaningfulImageBytes.high) {
    reasons.push("Meaningful asset weight is visible in the current route data.");
  } else if (metrics.meaningfulImageBytes >= CONFIDENCE_CONFIG.meaningfulImageBytes.moderate) {
    reasons.push("Some meaningful asset weight is visible, which helps confidence.");
  }

  if (detection.directCostGroups.length >= 2) {
    reasons.push("Multiple cost-relevant stack groups were resolved directly from page signals.");
  } else if (detection.directCostGroups.length === 0) {
    reasons.push("Few cost-relevant stack groups were resolved from the current page signals.");
  }

  if (detection.missingCostGroups.length >= CONFIDENCE_CONFIG.missingGroups.low) {
    reasons.push("Major cost categories are still missing from the observed signal set.");
  }

  return reasons.slice(0, 3);
}

export function assessConfidence(
  snapshot: RawScanSnapshot,
  detection: MoneyStackDetection,
  score: ScoreBreakdown
): ConfidenceAssessment {
  const { metrics, dom } = snapshot;
  const hasStrongRequestSignal = metrics.requestCount >= CONFIDENCE_CONFIG.requests.high;
  const hasModerateRequestSignal = metrics.requestCount >= CONFIDENCE_CONFIG.requests.moderate;
  const hasStrongAssetSignal =
    metrics.meaningfulImageBytes >= CONFIDENCE_CONFIG.meaningfulImageBytes.high;
  const hasModerateAssetSignal =
    metrics.meaningfulImageBytes >= CONFIDENCE_CONFIG.meaningfulImageBytes.moderate;
  const hasResolvedStack = detection.directCostGroups.length > 0;
  const missingGroupCount = detection.missingCostGroups.length;
  const hasSparseResourceSignal =
    metrics.rawRequestCount === 0 || (metrics.requestCount === 0 && dom.scriptCount + dom.imageCount > 0);

  if (
    score.label === "warming up" ||
    hasSparseResourceSignal ||
    (!hasModerateRequestSignal &&
      !hasModerateAssetSignal &&
      !hasResolvedStack &&
      missingGroupCount >= CONFIDENCE_CONFIG.missingGroups.moderate)
  ) {
    return {
      label: "Low",
      summary: "Metis could only see part of this route.",
      detail: "This read is based on limited page data and detected signals.",
      reasons: buildReasons(snapshot, detection)
    };
  }

  if (
    hasStrongRequestSignal &&
    (hasStrongAssetSignal || hasResolvedStack) &&
    missingGroupCount === 0
  ) {
    return {
      label: "High",
      summary: "Metis has a strong signal set for this route.",
      detail: "The current read is based on solid page data and resolved cost signals.",
      reasons: buildReasons(snapshot, detection)
    };
  }

  return {
    label: "Moderate",
    summary: "Metis has enough signal to guide the read, but not the full picture.",
    detail: "Based on available page data and detected signals.",
    reasons: buildReasons(snapshot, detection)
  };
}
