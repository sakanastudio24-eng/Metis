import type { DetectedIssue, RawScanSnapshot, ScoreBreakdown } from "../../shared/types/audit";

export function scoreSnapshot(
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[]
): ScoreBreakdown {
  void snapshot;
  void issues;
  throw new Error("scoreSnapshot is reserved for Phase 3.");
}
