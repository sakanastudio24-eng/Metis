// Phase 4 will translate the score and issues into plain-language cost guidance.
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
