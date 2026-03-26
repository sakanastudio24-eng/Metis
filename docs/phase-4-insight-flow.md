# Phase 4 Insight Flow

This flow shows how Metis turns normalized scan data into one deterministic insight.

## Source Files

- `src/features/scan/index.ts`
- `src/features/detection/index.ts`
- `src/features/scoring/index.ts`
- `src/features/insights/config.ts`
- `src/features/insights/index.ts`
- `src/app/components/figures/liveAdapter.ts`

## Flow

1. Build a normalized `RawScanSnapshot`.
2. Detect a short issue stack from normalized metrics.
3. Score the issue stack with weighted penalties.
4. Choose the strongest issue by severity, then score deduction weight.
5. Build one summary line from the score label and primary issue category.
6. Build one supporting detail line from issue metric and threshold metadata.
7. Assign one qualitative estimate label:
   - `Scanning`
   - `Low waste`
   - `Moderate waste`
   - `Heavy waste`
8. Attach one deterministic next-step hint tied to the primary issue category.
9. Render the insight under the issue stack and above diagnostics in the panel.

## Current Rule

The insight layer must stay deterministic and local.

It should consume:

- normalized snapshot data
- detected issues
- weighted score output

It should not:

- re-read raw Performance API entries
- invent exact money values
- depend on backend or AI services
