// insights/index.ts is reserved for Phase 4.
// It will translate Phase 3 score output into plain-language cost guidance.
import type { CostInsight, DetectedIssue, RawScanSnapshot, ScoreBreakdown } from "../../shared/types/audit";

export function buildInsight(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  score: ScoreBreakdown
): CostInsight {
  void snapshot;
  void issues;
  void score;
  throw new Error("buildInsight is reserved for Phase 4.");
}
