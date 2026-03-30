# Metis Extension Internal Contract

This contract defines extension-internal communication.

It covers:

- content script and page bridge
- background service worker
- popup
- side panel

## Runtime participants

- content script and page bridge gather route-level scan state
- background coordinates runtime actions and privileged APIs
- popup opens settings and entry actions
- side panel renders the compact working surface

## Message family rule

Use the existing `MetisRuntimeMessage` family and extend it as needed.

Do not create a second incompatible message naming system.

Use `METIS_*` message names for runtime events.

## Minimum V1 internal message set

- scan request
- scan result
- open panel
- open sign-in
- auth state changed
- upload request queued

These can map to the current runtime message union or be added into it, but they should stay under one coherent message family.

## Canonical internal flow

1. user opens the panel
2. panel requests the current scan for the active tab
3. background coordinates the request
4. content script returns a scan summary or current session state
5. panel renders the score and issue summary

## Current repo alignment

The current repo already has:

- a `MetisRuntimeMessage` union
- background coordination in `src/background/index.ts`
- content-side scan and bridge work in `src/content`
- popup and side-panel surfaces that already use runtime messaging

The contract should extend that shape instead of replacing it.

## Storage-adjacent keys

Extension-local communication should expect these storage keys to exist:

- `metis_session`
- `metis_last_scan`
- `metis_upload_queue`
- `metis_user_settings`

## Ownership guidance

Preferred extension-side code ownership:

- background router
- content bridge listener
- storage helper
- API helper
- upload queue helper
- shared message types

## Rule before bridge or backend expansion

Extension-internal communication must be solid before website or backend lanes expand.

If local scan, summary rendering, and panel coordination are unstable, do not paper over that with auth or backend features.

## Implementation Status

Status at `0.12.0`:

- [x] `MetisRuntimeMessage` remains the single internal message family
- [x] open panel, open sign-in, auth state changed, and upload queued messages now exist
- [x] popup, side panel, background, and page bridge all share the same tab-session model
- [x] scan and panel flows still run locally without backend dependence
- [x] storage helpers now align to the contract key names with compatibility migration
