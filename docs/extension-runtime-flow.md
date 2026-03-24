# Extension Runtime Flow

This is the current runtime split for Metis.

## Flow

1. `manifest.json` registers the MV3 surfaces.
2. `src/content/index.tsx` injects a fixed Shadow DOM host and mounts React.
3. `src/app/App.tsx` runs an immediate scan, schedules a one-shot post-load rescan when the page is still settling, then keeps the steady scan loop and navigation checks alive.
4. `src/shared/lib/siteBaseline.ts` persists baseline and multipage snapshots.
5. `src/background/index.ts` stays minimal until a later phase needs background coordination.

## Scan Lifecycle Rule

The content script should:

- populate the UI fast with an immediate scan
- run a guaranteed second pass after `window.load` when the page is not complete yet
- keep periodic rescans and navigation checks after that
- log a small console-only scan summary for debugging without adding permanent debug UI

## Current Rule

Keep page-facing logic in the content script and only move work into the service worker
when Chrome APIs or cross-tab coordination require it.

## UI Isolation Rule

The injected Metis UI should behave like its own app, not like part of the host page.

That means:

- fixed Shadow DOM mount
- explicit font-size baseline
- px-based typography overrides for extension text utilities
- extension-owned box sizing and font family

These rules are there specifically to reduce Google-vs-YouTube drift in the panel UI.
