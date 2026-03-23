// Phase 3 will score the detected issues once the rule set exists.
import type { DetectedIssue, RawScanSnapshot, ScoreBreakdown } from "../../shared/types/audit";

export function scoreSnapshot(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[]
): ScoreBreakdown {
  void snapshot;
  void issues;
  throw new Error("scoreSnapshot is reserved for Phase 3.");
}
