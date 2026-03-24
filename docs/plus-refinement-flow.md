# Plus Refinement Flow

This flow explains the optional Plus question layer that sits on top of the base Phase 4 report.

## Goal

Keep the default Metis report instant, then let a user answer a few high-value questions to improve:

- urgency framing
- provider-specific next steps
- traffic-aware prioritization
- API and AI cost sensitivity
- media and optimization context

## Source Files

- `src/features/refinement/config.ts`
- `src/features/refinement/index.ts`
- `src/app/useMetisState.ts`
- `src/app/components/PhaseOneShell.tsx`
- `src/shared/types/audit.ts`

## Flow

1. Run the normal scan, detection, scoring, and insight path first.
2. Show `Refine This Report` as an optional next step in the full panel.
3. Ask a short set of core questions:
   - hosting provider
   - monthly visits
   - app type
4. Offer optional depth questions for plan, paid APIs, AI usage, route importance, and optimization coverage.
5. Keep all answers local to the panel state.
6. Build a refined Plus report from:
   - base insight
   - normalized snapshot
   - detected issues
   - score breakdown
   - optional user answers
7. Render stack-aware urgency, context, and next-step guidance without changing the base score.

## Current Rule

The Plus refinement layer should:

- improve interpretation
- stay optional
- stay deterministic
- avoid fake pricing precision

It should not:

- block the base report
- require auth
- require backend storage
- override the underlying scan metrics or score
