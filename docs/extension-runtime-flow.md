# Extension Runtime Flow

This is the simple version of how Metis shows up on a page and keeps its data fresh.

## Flow

1. `manifest.json` registers the MV3 surfaces.
2. `content_scripts` mount `src/content/index.tsx` on normal web pages.
3. `src/content/index.tsx` mounts a fixed Shadow DOM host and shows only the on-page Metis launcher.
4. The user clicks the on-page Metis trigger.
5. `src/app/App.tsx` delays the scan slightly so the route can settle, then runs the first scan.
6. If the page is still settling, Metis schedules one more pass after `window.load`.
7. After that, it keeps a light rescan loop and page-change checks alive while the panel is open.
8. `src/shared/lib/siteBaseline.ts` stores baseline and visited-page snapshots.
9. `src/background/index.ts` remains as a fallback path if the toolbar action ever needs to re-inject Metis into the current tab.

## Why It Works This Way

Metis is still a content-script-first product, but the launcher is now always available on normal pages while scanning stays user-triggered.

That means the page-facing work stays close to the page while the scan still waits for user intent:

- keep the launcher visible
- scan only after the launcher is clicked
- settle once the page finishes loading
- keep watching for route changes and later activity

## Scan Lifecycle Rule

Once the user opens the on-page trigger, the content app should:

- open fast
- wait a moment before the first scan
- run a guaranteed second pass after `window.load` when the page is not complete yet
- keep periodic rescans and navigation checks after that
- log a small console-only scan summary for debugging without adding permanent debug UI

## Current Rule

Keep page-facing logic in the injected app and only move work into the service worker
when Chrome APIs, injection control, or cross-tab coordination require it.

## UI Isolation Rule

The injected Metis UI should behave like its own app, not like part of the host page.

That means:

- fixed Shadow DOM mount
- explicit font-size baseline
- px-based typography overrides for extension text utilities
- extension-owned box sizing and font family

These rules are there specifically to reduce Google-vs-YouTube drift in the panel UI.
