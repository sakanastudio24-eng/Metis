// scoring/index.ts turns detected issues into a weighted cost-risk score.
// It applies public severity penalties, category multipliers, and label thresholds.
import type {
  DetectedIssue,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ScoreBreakdown,
  ScoreLabel
} from "../../shared/types/audit";
import { SCORE_CONFIG } from "./config";
import { getContextScoreMultiplier } from "./context";
import { detectMoneyStack } from "../stack";

function roundScoreValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function scoreSnapshot(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  answers: PlusRefinementAnswers = {}
): ScoreBreakdown {
  const frameworkIds =
    detectMoneyStack(snapshot, answers)
      .groups.find((group) => group.id === "framework")
      ?.vendors.map((vendor) => vendor.id) ?? [];

  const deductions = issues.map((issue) => ({
    reason: issue.title,
    points: roundScoreValue(
      SCORE_CONFIG.severityPenalty[issue.severity] *
        SCORE_CONFIG.categoryMultiplier[issue.category] *
        getContextScoreMultiplier(issue.category, answers, {
          frameworkIds,
          duplicateEndpointCount: snapshot.metrics.duplicateEndpointCount
        })
    ),
    category: issue.category,
    severity: issue.severity,
    multiplier:
      SCORE_CONFIG.categoryMultiplier[issue.category] *
      getContextScoreMultiplier(issue.category, answers, {
        frameworkIds,
        duplicateEndpointCount: snapshot.metrics.duplicateEndpointCount
      })
  }));

  const totalDeduction = deductions.reduce((total, deduction) => total + deduction.points, 0);
  const score = Math.max(
    0,
    roundScoreValue(SCORE_CONFIG.baseScore - totalDeduction)
  );

  let label: ScoreLabel = "healthy";
  if (score < SCORE_CONFIG.labels.watchMin) {
    label = "high risk";
  } else if (score < SCORE_CONFIG.labels.healthyMin) {
    label = "watch";
  }

  if (issues.length === 0 && snapshot.metrics.requestCount === 0) {
    label = "warming up";
  }

  return {
    score,
    label,
    deductions
  };
}
