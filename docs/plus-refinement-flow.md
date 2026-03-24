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

## Question Groups

### Stack

- `hostingProvider`
- `hostingPlan`
- `appType`

### Traffic

- `monthlyVisits`
- `highTrafficRoute`
- `pageDynamics`

### Cost Sensitivity

- `paidApis`
- `aiUsage`
- `mediaImportance`
- `optimizationCoverage`

## What Each Question Does

### `hostingProvider`

- Improves:
  - compute risk interpretation
  - bandwidth cost framing
  - provider-specific next steps
- Why it matters:
  - the same request pattern means different things on different hosts and billing models

### `hostingPlan`

- Improves:
  - overage risk interpretation
  - urgency framing
  - upgrade versus optimize guidance
- Why it matters:
  - a watch score on a free plan can be more urgent than the same score on an enterprise plan

### `monthlyVisits`

- Improves:
  - monthly impact framing
  - scale projection
  - savings prioritization
- Why it matters:
  - raw page weight means little without traffic volume

### `appType`

- Improves:
  - baseline expectations
  - false positive control
  - recommendation relevance
- Why it matters:
  - what is acceptable on a dashboard can still be a problem on a portfolio or marketing site

### `pageDynamics`

- Improves:
  - request-count interpretation
  - duplicate request seriousness
  - caching guidance
- Why it matters:
  - highly dynamic routes can justify more activity, but redundant work is still a cost signal

### `paidApis`

- Improves:
  - API cost sensitivity
  - duplicate request seriousness
  - premium action quality
- Why it matters:
  - repeated calls are materially worse when they hit paid services

### `aiUsage`

- Improves:
  - AI cost sensitivity
  - per-session scaling logic
  - cost-driver prioritization
- Why it matters:
  - AI on every action changes the cost profile much more than occasional AI use

### `mediaImportance`

- Improves:
  - image severity weighting
  - optimization priority
  - recommendation tone
- Why it matters:
  - a media product should be optimized differently than a docs or admin surface

### `highTrafficRoute`

- Improves:
  - issue prioritization
  - projected impact relevance
  - action ordering
- Why it matters:
  - a problem on a hot route deserves earlier cleanup than the same issue on a low-traffic page

### `optimizationCoverage`

- Improves:
  - recommendation accuracy
  - false positive cleanup
  - image and bandwidth guidance
- Why it matters:
  - existing CDN or image tooling changes whether the next step is adoption, tuning, or deeper cleanup

## Current Config Rule

Each question definition should stay explicit about:

- what it improves
- why it matters
- whether it is core or optional
- which group it belongs to

That keeps the Plus layer reviewable without reading the full refinement engine.

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
