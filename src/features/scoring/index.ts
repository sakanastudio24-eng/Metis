// Score a snapshot from its detected issues so the UI can present a simple cost-risk view.
import type { DetectedIssue, RawScanSnapshot, ScoreBreakdown } from "../../shared/types/audit";
import { SCORE_CONFIG } from "./config";

function roundScoreValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function scoreSnapshot(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[]
): ScoreBreakdown {
  const deductions = issues.map((issue) => ({
    reason: issue.title,
    points: roundScoreValue(
      SCORE_CONFIG.severityPenalty[issue.severity] *
        SCORE_CONFIG.categoryMultiplier[issue.category]
    ),
    category: issue.category,
    severity: issue.severity,
    multiplier: SCORE_CONFIG.categoryMultiplier[issue.category]
  }));

  const totalDeduction = deductions.reduce((total, deduction) => total + deduction.points, 0);
  const score = Math.max(
    0,
    roundScoreValue(SCORE_CONFIG.baseScore - totalDeduction)
  );

  let label = "healthy";
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
