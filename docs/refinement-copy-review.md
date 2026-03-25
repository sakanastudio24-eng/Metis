# Refinement Copy Review

This file is the plain-language review sheet for the current Plus question flow and refinement wording.

Use it to tune tone without digging through the full runtime code.

## Core Question Flow

### App Type

- Label: `App Type`
- Helper: `This reduces false positives and changes what normal looks like.`
- Why it matters: `A route that looks heavy on a portfolio may be acceptable on a dashboard or marketplace.`
- Options:
  - `Marketing site`
  - `Portfolio`
  - `Ecommerce`
  - `SaaS dashboard`
  - `Content-heavy`
  - `AI-heavy`
  - `Marketplace`
  - `Internal tool`

### Hosting Provider

- Label: `Hosting Provider`
- Helper: `This sharpens compute and bandwidth interpretation.`
- Why it matters: `The same request pattern means different things on different hosts and billing models.`
- Options:
  - `Vercel`
  - `Netlify`
  - `Cloudflare`
  - `AWS`
  - `Render`
  - `Railway`
  - `Other`

### Plan Tier

- Label: `Plan Tier`
- Helper: `This changes overage risk and urgency framing.`
- Why it matters: `A watch score on a free plan can be more urgent than the same score on an enterprise plan.`
- Options:
  - `Free`
  - `Pro`
  - `Team`
  - `Enterprise`
  - `Not sure`

### Site Size (optional)

- Label: `Site Size (optional)`
- Helper: `Rough page count helps frame how much surface area this report should represent.`
- Why it matters: `A 6-page site and a 500-page app can show similar issues while needing very different cleanup strategies.`
- Options:
  - `Under 10 pages`
  - `10–50 pages`
  - `50–200 pages`
  - `200+ pages`
  - `Not sure`

### Monthly Traffic

- Label: `Monthly Traffic`
- Helper: `This is the highest-value input for impact and savings framing.`
- Why it matters: `Raw page weight means little without traffic. Volume determines whether a small issue is negligible or expensive.`
- Options:
  - `Under 1k`
  - `1k–10k`
  - `10k–100k`
  - `100k+`
  - `Not sure`

### Is this route one of your highest-traffic pages?

- Label: `Is this route one of your highest-traffic pages?`
- Helper: `This changes prioritization more than raw page weight alone.`
- Why it matters: `A problem on a homepage or other hot route deserves faster cleanup than the same issue on a low-traffic admin path.`
- Options:
  - `Yes`
  - `Somewhat`
  - `No`
  - `Not sure`

### How dynamic is this page?

- Label: `How dynamic is this page?`
- Helper: `This helps separate expected request activity from waste.`
- Why it matters: `Heavy request activity is more expected on highly dynamic apps, but repeated work can still be expensive.`
- Options:
  - `Mostly static`
  - `Mixed`
  - `Highly dynamic`
  - `Not sure`

### Does this page use paid APIs?

- Label: `Does this page use paid APIs?`
- Helper: `This makes duplicate requests materially more expensive.`
- Why it matters: `Repeated calls are much worse if they hit paid services such as search, maps, auth, or email vendors.`
- Options:
  - `Yes`
  - `No`
  - `Not sure`

### Does this page use AI per user action?

- Label: `Does this page use AI per user action?`
- Helper: `Frequent AI calls can dominate the cost profile.`
- Why it matters: `A single AI call on submit is very different from AI usage on every keystroke or repeated action.`
- Options:
  - `Yes, often`
  - `Sometimes`
  - `No`
  - `Not sure`

### Are images or media important on this page?

- Label: `Are images or media important on this page?`
- Helper: `This tunes how aggressively image issues should be framed.`
- Why it matters: `A photography or media product should be optimized differently than a docs site or admin tool.`
- Options:
  - `Yes, core to the product`
  - `Somewhat`
  - `No`

### Are you already using a CDN or image optimization?

- Label: `Are you already using a CDN or image optimization?`
- Helper: `This changes what the next best action should be.`
- Why it matters: `Knowing whether optimization tooling already exists changes whether the best next move is adoption, tuning, or deeper cleanup.`
- Options:
  - `Yes`
  - `No`
  - `Not sure`

## Stack Fallback Questions

These are only shown when Metis cannot confidently detect a cost-relevant stack group.

### Framework

- Label: `Framework`
- Helper: `Metis could not confidently detect the UI framework on this route.`
- Why it matters: `Framework context changes which fixes are realistic and which patterns are normal on the page.`

### Hosting / CDN

- Label: `Hosting / CDN`
- Helper: `Metis could not confidently detect the host or CDN from the current route.`
- Why it matters: `The host and CDN layer changes what repeated requests, caching, and heavy assets actually cost.`

### AI Provider

- Label: `AI Provider`
- Helper: `Metis saw AI-like behavior but could not map it to a provider.`
- Why it matters: `Different AI vendors change per-request cost and what optimization steps matter most.`

### Analytics / Ads / RUM

- Label: `Analytics / Ads / RUM`
- Helper: `Metis could not confidently identify the measurement or advertising vendors on this route.`
- Why it matters: `Analytics, ad-tech, and RUM vendors add third-party spend and execution overhead that should be attributed correctly.`

### Payment

- Label: `Payment`
- Helper: `Metis could not identify a payment provider from this route.`
- Why it matters: `Payment providers often bring extra scripts and route-specific costs that should be attributed correctly.`

## Refinement Output Copy

This is the current wording shape used after answers start coming in.

### Priority Labels

- `High priority`
- `Worth planning`
- `Monitor`

### Summary Patterns

- Full refinement:
  - `High priority: {base insight summary}`
  - `Worth planning: {base insight summary}`
  - `Monitor: {base insight summary}`
- Partial refinement:
  - `Partial Plus read: {base insight summary}`

### Context Prefix Pattern

When enough answers exist, the detail text can start with a prefix like:

- `On Vercel under 1k monthly visits for this marketing site:`
- `On AWS 10k to 100k monthly visits for this SaaS dashboard across 50 to 200 pages:`

### Route Priority Notes

- `Because this is one of your highest-traffic routes, the issue deserves earlier cleanup.`
- `Because this route has meaningful traffic, the issue is worth planning into near-term work.`

### Plan Notes

- `A free plan leaves less room before overage pressure or upgrade pressure becomes visible.`
- `An enterprise plan gives more headroom, but waste still compounds at scale.`

### Cost Sensitivity Notes

- `Repeated requests matter more here because they may be hitting paid endpoints.`
- `Confirmed paid API usage makes repeated AI activity more expensive than normal request overhead.`
- `Frequent AI calls raise the ceiling on per-session cost faster than standard requests.`
- `Occasional AI calls make spikes more expensive when this route gets busy.`
- `Because media is core to the product, the right target is delivery efficiency, not removing media value.`
- `Some request volume is expected on a highly dynamic route, so focus on redundant work before cutting legitimate activity.`
- `For a simpler site type, this amount of network activity is a stronger cleanup signal than it would be on a dashboard.`
- `Because this is a high-traffic route, every extra analytics or ad-tech tag compounds faster than it would on a low-traffic page.`

### Provider-Specific Next-Step Additions

- `On Vercel, push harder on caching, edge-friendly assets, and avoiding repeated function work on hot routes.`
- `On Netlify, lean on CDN caching and avoid repeated function or asset work on the landing route.`
- `On Cloudflare, use cache rules and media delivery features before accepting this as normal overhead.`
- `On AWS, check whether CloudFront, S3 delivery, and function boundaries are carrying avoidable transfer or invocation cost.`
- `On Render, focus on cutting repeat work and keeping the hottest route light enough to avoid waste under steady traffic.`
- `On Railway, keep duplicate work and heavier payloads in check because scaling can become visible quickly.`
- `Tune this against the way your host bills for transfer, compute, and vendor usage.`

## Notes For Editing

- Question text mostly lives in [src/features/refinement/config.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/refinement/config.ts)
- Refinement output phrases mostly live in [src/features/refinement/index.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/refinement/index.ts)
- Stack fallback wording also lives in [src/features/refinement/config.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/refinement/config.ts)
