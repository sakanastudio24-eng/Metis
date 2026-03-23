# Scan Signal Flow

This is the completed Phase 2 signal pipeline.

## Pipeline

1. Collect raw browser entries from `performance.getEntriesByType("resource")`
2. Filter out:
   - zero-transfer resources
   - tiny resources under the current minimum threshold
3. Normalize URLs to `origin + pathname`
4. Classify requests into stable categories
5. Aggregate:
   - request count
   - unique URLs
   - duplicate hits
   - API calls
   - third-party domains
   - known page weight
   - top offenders
6. Store:
   - current snapshot
   - per-origin baseline
   - per-origin visited-page snapshots

## Phase 3 Rule

Detection must work from the normalized metrics, not from raw noisy browser entries.
