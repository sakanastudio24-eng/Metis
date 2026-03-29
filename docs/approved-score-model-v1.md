# Approved Score Model v1

This document freezes the approved Metis score model before the next calibration pass.

Use it as the rollback reference if a later tuning pass drifts too far from the current product read.

## Version Baseline

- approved baseline: `0.4.0`
- product meaning:
  - `Score` = avoidable cost pressure
  - `Control` = whether the route complexity looks justified

## Core Principles

- penalize waste hard
- penalize complexity softly
- give credit for justified modern complexity
- keep Free and Plus on the same numeric truth
- keep hosting and CDN as supporting context unless paired with heavier transfer or repeated work

## Detection Thresholds

### Request count

- low: `80`
- medium: `180`
- high: `400`

### Page weight

- low: `1_500_000`
- medium: `4_000_000`
- high: `8_000_000`

### Duplicate requests

- low: `20` repeated requests or `6` duplicated endpoints
- medium: `60` repeated requests or `14` duplicated endpoints
- high: `160` repeated requests or `28` duplicated endpoints

## Score Weighting

These are the approved category multipliers in the `0.4.0` model.

- `duplicateRequests: 1.65`
- `largeImages: 1.6`
- `analyticsAdsRumSurface: 1.05`
- `thirdPartySprawl: 0.85`
- `aiSpendSurface: 0.7`
- `pageWeight: 0.55`
- `requestCount: 0.4`
- `hostingCdnSpendSurface: 0.2`

## Control Baseline

- base score: `60`
- controlled minimum: `72`
- mixed minimum: `52`

### Strong positive credits

- contained route: `26`
- dashboard context support: `15`
- AI context support: `18`
- specific route context: `10`

### Strong negative penalties

- duplicate endpoints: `18`
- duplicate repeated requests: `14`
- heavy third-party sprawl: `12`
- unjustified payload: `10`
- static high request count: `10`

## Guardrails

- Free and Plus must keep the same score, control, confidence, issue order, and cost direction
- light routes should not get heavy-route framing
- hosting and CDN should not surface as standalone top issues
- framework awareness should soften interpretation a little, not erase waste

## Rollback Use

If a later calibration pass makes reports feel less fair or less believable, use this doc as the restore target for:

- detection thresholds
- score multipliers
- control thresholds
- top-driver ranking philosophy
- score and control language
