# Phase 2 Review

Phase 2 is complete enough to hand off into Phase 3.

## What Phase 2 Now Does

- captures a real page snapshot from the content script
- parses page URL and origin context
- inspects shallow DOM counts
- reads Performance API resource entries
- filters zero-transfer and tiny resources out of the user-facing metrics
- normalizes request URLs to `origin + pathname`
- classifies requests into stable categories
- tracks unique URLs and duplicate hits separately
- measures known page weight from filtered resources
- tracks third-party request and domain counts
- surfaces top offenders and large-image offenders in the panel
- stores a baseline snapshot per origin
- stores visited-page snapshots per origin for multipage comparison
- rescans on page changes and with temporary 5-second polling

## Known Limits

- cross-origin resource sizes are still limited by browser timing policies
- DOM image count is supporting context, not the main cost signal
- polling is still temporary and should be revisited after Phase 3
- some pages with sandboxed iframes will log browser-level iframe restrictions

## Phase 3 Start Point

Use the normalized metrics in `rawSnapshot.metrics` as the input to detection and scoring.

Strong starting signals:

- total requests
- unique URLs
- duplicate hits
- known page weight
- meaningful image count and bytes
- third-party domains
- top offenders
