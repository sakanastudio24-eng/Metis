# Extension Runtime Flow

This is the current runtime split for Metis.

## Flow

1. `manifest.json` registers the MV3 surfaces.
2. `src/content/index.tsx` injects a fixed Shadow DOM host and mounts React.
3. `src/app/App.tsx` starts the scan loop and passes snapshots into the panel.
4. `src/shared/lib/siteBaseline.ts` persists baseline and multipage snapshots.
5. `src/background/index.ts` stays minimal until a later phase needs background coordination.

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
