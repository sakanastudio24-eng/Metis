# Metis AI Context

This is the shortest repo level note for AI and code agents working in Metis.

## Product shape

Metis is a Chrome extension for page level cost risk analysis.

Current surfaces:

- page DOM for the hover and fullscreen report
- side panel for the compact working view
- toolbar popup for local settings
- background service worker for runtime coordination

## Live runtime model

- a light content bridge stays mounted on normal pages
- clicking the `M` hover starts the tab session and opens the side panel
- scans run from the page bridge, not from the service worker
- the fullscreen report opens back in the page DOM
- the side panel stays compact and stable across page changes

## Core pipeline

Metis is deterministic and local first.

Main logic path:

`scan -> stack -> issues -> control -> score -> insight -> pricing -> UI`

Key boundaries:

- `src/features/scan` for browser data collection and normalization
- `src/features/stack` for fingerprint based vendor detection
- `src/features/detection` for issue detection
- `src/features/control` for justified versus uncontrolled heaviness
- `src/features/scoring` for waste and cost risk scoring
- `src/features/insights` for user facing explanation copy
- `src/features/pricing` for provider aware estimate framing

## Product rules

- user context belongs in refinement questions, not hidden settings
- hosting and CDN are amplifiers, not direct faults
- AI and provider presence are contextual
- large immersive reads belong in the page DOM
- account management belongs to Metis Web, not the extension
- extension settings stay local to the extension UI
- Plus is website managed beta access
- all public product links should resolve to `https://metis.zward.studio`

## Key files

- `manifest.json`
- `src/background/index.ts`
- `src/content/PageBridgeApp.tsx`
- `src/app/App.tsx`
- `src/app/components/figures/liveAdapter.ts`
- `src/shared/types/runtime.ts`
- `src/shared/types/audit.ts`

## Docs worth reading first

- `README.md`
- `docs/repo-alignment.md`
- `docs/flow-overview.md`
- `docs/extension-runtime-flow.md`
- `docs/sidepanel-session-flow.md`
- `docs/design-system-flow.md`
- `docs/design-system-logic.md`
- `docs/front-facing-foundation.md`
- `docs/production-roadmap.md`
- `docs/pricing-reference-flow.md`

## Working rules

- prefer focused commits by subsystem
- call out git segmentation for every meaningful feature or cleanup
- keep version bumps isolated in their own commit
- keep the updates doc in the same release prep pass as the version bump
- keep frontend work human, intentional, and easy to read
- load `dist/` when testing the unpacked extension
- reload the extension after manifest or background changes
- refresh the host page after content script changes

## Versioning rules

- the legacy `0.0.0.x` line is historical and should not continue
- the current pre-ship line starts at `0.1.0`
- before first public ship, normal product work uses minor releases like `0.1.0`, `0.2.0`, and `0.3.0`
- patch releases like `0.1.1` are only for small fixes or regressions after a minor release
- the first public ship should be `1.0.0`
- release workflow stays split into feature or docs work first, then a standalone version bump commit
- update [docs/updates.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/updates.md) whenever a new version is cut

## Agent rules

- check existing docs before adding a new flow note
- only add or update docs when they add real value
- ask before removing or merging a doc that might still help
- update the matching flow doc when a flow changes
- update `docs/repo-alignment.md` when website and extension ownership shifts
- never inspect `.env` files directly
- ask questions about env shape or provide example env files instead
- include git segmentation when reporting work back

## Security rules

- prefer the smallest permission set that supports the feature
- keep auth, entitlement, and trust boundaries explicit
- do not hide user supplied context inside settings
- prefer local first behavior unless a backend is clearly required
- avoid convenience changes that widen access or hidden state without product reason

## Permissions in use

- `storage`
- `scripting`
- `sidePanel`
- `host_permissions: <all_urls>`
- `content_scripts.matches: <all_urls>`

## Main shipping risk

The biggest review sensitive area is still broad always on page access through `"<all_urls>"` plus always mounted content scripts.

## Alignment note

- account, entitlement, and beta access stay website managed unless a real sync bridge ships
- use `docs/repo-alignment.md` before changing account adjacent UI or copy
