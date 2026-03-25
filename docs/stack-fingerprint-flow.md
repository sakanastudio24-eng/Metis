# Stack Fingerprint Flow

Metis now resolves stack context in two steps:

1. collect normalized evidence
2. score fingerprints against that evidence

That is intentionally different from the older "spot one clue, declare a vendor" style. It makes the detector easier to audit and easier to tune.

## The Core Rule

Metis should store raw clues first and decide on technologies second.

That means the detector prefers evidence like:

- `host:cloudfront.net`
- `path:/_next/static/...`
- `global:react`
- `answer:hostingProvider:aws`

over early conclusions like:

- `AWS detected`
- `Next.js detected`

## Evidence Sources

The current Phase 4 stack detector uses these sources:

- `host`
- `path`
- `resource`
- `element`
- `dom`
- `global`
- `answer`

The detector pulls those clues from:

- resource timing signals
- retained scan resources
- DOM globals and markers
- script, link, and iframe URLs
- refinement answers when billing context is still missing

## Resolution Order

Metis resolves stack context in this order:

1. collect evidence from the current scan
2. normalize it into stable keys
3. score every fingerprint
4. apply explicit implications like `Next.js -> React`
5. group the resolved technologies into report sections
6. ask fallback questions only for unresolved cost groups

## Why Thresholds Matter

Each fingerprint has a `minScore`.

That keeps weak one-off hints from becoming noisy stack claims. For example:

- `/_next/` is strong enough to identify Next.js
- one vague vendor-like string should not identify anything on its own

This is why the detector is more stable than a chain of ad hoc `if` statements.

## Cost Groups vs Context Groups

Metis separates stack results into two kinds:

### Cost-driving groups

- Hosting / CDN
- AI Providers
- Analytics / Ads / RUM

These can affect estimate wording and cost-surface issues.

### Context-only groups

- Framework
- Payment

These appear in the report for context, but they should not directly lower the score by themselves.

## Fallback Questions

Metis should only ask the user when stack evidence is missing or too weak for a cost-relevant group.

Good fallback questions:

- hosting provider
- AI provider
- analytics / ads / RUM context

Bad fallback questions:

- `Are you using Next.js?`
- `Is this AWS?`

Those should usually be inferred first.

## Maintenance Rule

When a detector misses a provider:

1. add or improve the normalized evidence pattern
2. tune the fingerprint threshold if needed
3. add a test that proves the new detection

Do not patch misses with one-off UI logic. Keep the change inside the evidence and fingerprint layers so the whole system stays explainable.
