# Extension Runtime Flow

This is the simple version of how Metis shows up on a page and keeps its data fresh.

## Flow

1. `manifest.json` registers the MV3 surfaces.
2. `src/content/index.tsx` injects a fixed Shadow DOM host and mounts React.
3. `src/app/App.tsx` runs an immediate scan so the UI has something to show quickly.
4. If the page is still settling, Metis schedules one more scan after `window.load`.
5. After that, it keeps a light rescan loop and page-change checks alive.
6. `src/shared/lib/siteBaseline.ts` stores baseline and visited-page snapshots.
7. `src/background/index.ts` stays intentionally small until a later feature really needs background coordination.

## Why It Works This Way

Metis is a content-script-first product. That means the page-facing work stays close to the page, which keeps the model simple:

- show something fast
- settle once the page finishes loading
- keep watching for route changes and later activity

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
