# Extension Runtime Flow

This is the simple version of how Metis shows up on a page and keeps its data fresh now that the main UI lives in Chrome's side panel.

## Flow

1. `manifest.json` registers the MV3 surfaces, including the side panel.
2. `content_scripts` mount `src/content/index.tsx` on normal web pages.
3. `src/content/index.tsx` mounts a fixed Shadow DOM host and shows only the on-page Metis hover bridge.
4. The user clicks the page hover.
5. The content bridge starts the tab session and asks `src/background/index.ts` to open Chrome's side panel.
6. The content bridge delays the scan slightly so the route can settle, then runs the first scan.
7. If the page is still settling, Metis schedules one more pass after `window.load`.
8. After that, it keeps a light rescan loop and page-change checks alive while the tab session stays active.
9. The background service worker stores live tab-session state in `chrome.storage.session`.
10. `src/app/App.tsx` reads the active tab session and renders the stable side panel workspace.

## Why It Works This Way

Metis is now a hybrid product.

That means:

- the page bridge stays close to the page
- the stable UI lives in extension context
- the scan still waits for explicit user intent

The page-facing behavior should still:

- keep the hover visible
- scan only after the launcher is clicked
- settle once the page finishes loading
- keep watching for route changes and later activity

## Scan Lifecycle Rule

Once the user opens Metis from the hover, the page bridge should:

- open fast
- wait a moment before the first scan
- run a guaranteed second pass after `window.load` when the page is not complete yet
- keep periodic rescans and navigation checks after that
- log a small console-only scan summary for debugging without adding permanent debug UI

## Current Rule

Keep page-facing logic small and disposable. Move stable coordination and the main UI into extension surfaces when Chrome gives Metis a better lifecycle.

## UI Isolation Rule

The injected page bridge should still behave like its own app, not like part of the host page.

That means:

- fixed Shadow DOM mount
- explicit font-size baseline
- px-based typography overrides for extension text utilities
- extension-owned box sizing and font family

These rules are there specifically to reduce Google-vs-YouTube drift in the hover bridge while the side panel keeps the main product UI stable.
