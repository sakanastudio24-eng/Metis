// Phase 3 will convert the normalized scan snapshot into real user-facing issues.
import type { DetectedIssue, RawScanSnapshot } from "../../shared/types/audit";

export function detectIssues(snapshot: RawScanSnapshot): DetectedIssue[] {
  void snapshot;
  throw new Error("detectIssues is reserved for Phase 3.");
}
