# Pricing Reference Flow

Metis now keeps a local pricing reference layer for rough cost modeling.

The important rule is simple:

- official vendor pricing pages are the source of truth
- Metis keeps an approved local copy of that truth
- the extension uses that local copy for estimates and provider-aware wording

## What This Layer Is For

This layer exists to make estimates more believable without turning Metis into a billing calculator.

That means Metis can say things like:

- `~ Based on the AWS CloudFront pricing reference last verified 2026-03`
- `~ Based on the Vercel Pro pricing reference last verified 2026-03`

It should not say:

- `You will pay exactly $12.43`

## What Gets Stored

Each pricing entry keeps:

- provider id
- display name
- raw plan label
- normalized plan tier
- monthly visit baseline
- paid API baseline
- AI usage baseline
- high-traffic route baseline
- app type baseline
- billed metric types
- approximate rate note
- source URL
- last verified date

## Raw Plan Labels vs Normalized Tiers

Metis stores both.

### Raw plan label

This is the exact label from the provider-facing plan list, such as:

- `Shared Single (Entry)`
- `Cloud Professional`
- `EC2 t3.small`
- `ECS/Fargate Cluster`

### Normalized tier

This is the internal estimate bucket used for modeling:

- `entry`
- `shared`
- `sharedPlus`
- `cloud`
- `managed`
- `vpsSmall`
- `vpsMedium`
- `vpsLarge`
- `appPlatform`
- `container`
- `cluster`
- `usage`
- `subscription`

The raw plan is for auditability.
The normalized tier is for stable estimate math.

## Public Answers Stay Stable

The user-facing `hostingProvider` question does not widen yet.

That means Metis can keep the current answer model while still resolving a broader set of providers internally through:

- stack fingerprints
- provider aliases
- pricing resolution

This avoids turning one refinement question into a long provider list before the pricing model settles.

## How Resolution Works

Metis resolves provider pricing in this order:

1. direct stack evidence from fingerprints
2. internal alias mapping
3. broad billing context from user answers
4. heuristic fallback if nothing reliable is known

Examples:

- `CloudFront` maps to the AWS pricing family
- `Cloudflare CDN` maps to Cloudflare
- `DigitalOcean` host evidence maps to DigitalOcean
- a broad `hostingProvider = aws` answer can sharpen pricing context even when the page itself does not expose a direct AWS hostname

## Why Estimates Use `~`

Every pricing-derived UI surface should show approximation on purpose.

Metis is modeling likely cost pressure, not reproducing a cloud bill.

So:

- session cost uses `~`
- monthly projection uses `~`
- scale simulation uses `~`
- provider estimate notes explicitly mention the pricing reference

## Update Workflow

The safe workflow is:

1. official provider pricing changes
2. Metis pricing config is reviewed
3. the local approved copy is updated
4. `lastVerifiedAt` is refreshed

Manual approval stays in the loop.

That keeps the pricing layer auditable and avoids silently changing the product model from unreviewed vendor docs.
