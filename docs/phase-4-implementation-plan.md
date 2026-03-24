# Phase 4 Implementation Plan

This plan started from the Phase 3 codebase and now maps to the shipped Phase 4 foundation.

## Outcome

Implement a deterministic insight layer that converts score output into short, credible cost-risk guidance.

## Target Files

- `src/features/insights/index.ts`
- `src/features/insights/config.ts`
- `src/shared/types/audit.ts`
- `src/app/components/PhaseOneShell.tsx`

## Implemented Foundation

Shipped in the current Phase 4 pass:

- estimate labels
- summary tone rules
- category-specific message templates
- deterministic next-step hints
- a richer `CostInsight` type
- a guaranteed post-load rescan path
- console-only scan debug summaries
- panel integration between issues and diagnostics

## Remaining Follow-Up

The next polish pass should still review the output against:

- Google Search
- YouTube
- local visual fixtures

Tune for:

- readability
- credibility
- message length
- repeated copy patterns

After insight generation is stable, the remaining store-readiness work should cover:

- permissions review
- description/listing alignment
- visual consistency pass
- final bug cleanup
