// Score a snapshot from its detected issues so the UI can present a simple cost-risk view.
import type { DetectedIssue, RawScanSnapshot, ScoreBreakdown } from "../../shared/types/audit";

const severityPoints = {
  low: 5,
  medium: 10,
  high: 15
} as const;

export function scoreSnapshot(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[]
): ScoreBreakdown {
  const deductions = issues.map((issue) => ({
    reason: issue.title,
    points: severityPoints[issue.severity]
  }));

  const totalDeduction = deductions.reduce((total, deduction) => total + deduction.points, 0);
  const score = Math.max(0, 100 - totalDeduction);

  let label = "healthy";
  if (score < 65) {
    label = "high risk";
  } else if (score < 85) {
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
