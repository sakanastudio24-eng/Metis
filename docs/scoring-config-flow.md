# Scoring Config Flow

This document describes how Metis Phase 3 scoring is configured.

## Why This Exists

The score should be tunable without rewriting the detection or scoring engines.

That means Metis keeps three layers separate:

1. raw metrics
2. detection thresholds
3. score weights

## Source Files

- `src/features/detection/config.ts`
- `src/features/detection/index.ts`
- `src/features/scoring/config.ts`
- `src/features/scoring/index.ts`
- `src/shared/types/audit.ts`

## Flow

1. `scan/performance.ts` produces normalized metrics.
2. `detection/config.ts` defines when each category becomes low, medium, or high.
3. `detection/index.ts` emits issues with:
   - category
   - severity
   - metric values
   - threshold values
4. `scoring/config.ts` defines:
   - base score
   - severity penalties
   - category multipliers
   - label thresholds
5. `scoring/index.ts` converts issues into deductions and a final label.

## Current Categories

- `requestCount`
- `duplicateRequests`
- `pageWeight`
- `largeImages`
- `thirdPartySprawl`

## Current Design Rule

Detection decides whether something is a problem.

Scoring decides how much that problem should matter.

That split keeps the score explainable and easier to tune over time.
