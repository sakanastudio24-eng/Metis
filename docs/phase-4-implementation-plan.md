# Phase 4 Implementation Plan

This plan starts from the current Phase 3 codebase.

## Outcome

Implement a deterministic insight layer that converts score output into short, credible cost-risk guidance.

## Target Files

- `src/features/insights/index.ts`
- `src/features/insights/config.ts`
- `src/shared/types/audit.ts`
- `src/app/components/PhaseOneShell.tsx`

## Step 1. Add Insight Config

Create `src/features/insights/config.ts` with:

- estimate labels
- summary tone rules
- category-specific message templates
- severity wording

Keep this public and configurable like detection/scoring.

## Step 2. Expand Insight Output Type

Extend the current `CostInsight` type to support:

- `summary`
- `supportingDetail`
- `estimateLabel`
- `nextStep`
- optional `primaryCategory`

Keep it short and UI-ready.

## Step 3. Build Deterministic Insight Logic

Implement `buildInsight()` so it:

1. picks the strongest issue
2. reads score label and deductions
3. builds a summary from category + severity
4. adds one supporting line using metric metadata
5. adds a lightweight estimate label without fake precision
6. adds one next-step suggestion

## Step 4. Wire Insight Into Panel UI

Update `PhaseOneShell.tsx` so the full panel shows:

- score
- issues
- insight summary block
- diagnostics below

The mini panel should show:

- score
- first issue
- one short insight line

## Step 5. Add Tuning Pass

Review the output against:

- Google Search
- YouTube
- local visual fixtures

Tune for:

- readability
- credibility
- message length
- repeated copy patterns

## Step 6. Prepare Store-Readiness Follow-Up

After insight generation is stable, the next polish work should cover:

- permissions review
- description/listing alignment
- visual consistency pass
- final bug cleanup
