# Phase 3 Logic Flow

Phase 3 starts from `rawSnapshot.metrics`.

## Inputs

Use these metrics first:

- `requestCount`
- `uniqueRequestCount`
- `duplicateRequestCount`
- `duplicateEndpointCount`
- `apiRequestCount`
- `thirdPartyDomainCount`
- `totalEncodedBodySize`
- `meaningfulImageCount`
- `meaningfulImageBytes`
- `topOffenders`
- `topMeaningfulImages`

## Detection Pass

Generate 3 to 5 issues max.

Recommended first rule set:

1. High request count
Logic:
   Trigger when request count passes the agreed threshold.
Output:
   "High request count may increase bandwidth and edge execution costs."

2. Duplicate requests
Logic:
   Trigger when duplicate hits or duplicate endpoints pass threshold.
Output:
   "Repeated requests suggest duplicate loading or redundant API usage."

3. Heavy page weight
Logic:
   Trigger when known page weight passes threshold.
Output:
   "Large transferred payload may raise bandwidth costs."

4. Large images
Logic:
   Trigger when meaningful image count or image bytes are high.
Output:
   "Large images are carrying a meaningful share of page weight."

5. Third-party sprawl
Logic:
   Trigger when third-party domain count is high.
Output:
   "Many third-party dependencies can raise network and operational cost."

## Scoring Pass

Start at `100`.

Subtract by rule severity, not by raw metrics directly.

Recommended structure:

- low: `-5`
- medium: `-10`
- high: `-15` or `-20`

Return:

- final score
- label such as `healthy`, `watch`, `high risk`
- deduction list

## Important Constraint

Do not pretend to know exact money.
Use language like:

- "may increase bandwidth costs"
- "can raise request volume"
- "suggests redundant loading"
