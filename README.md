# Metis

Metis is a Chrome extension for reading cost risk on the current page.

The product shape is simple.

- the page keeps a light hover bridge
- the side panel stays compact and stable
- the fullscreen report opens back in the page DOM

Metis is local first. It scans the current route, scores waste, explains what looks justified, and keeps the account boundary on the website.

If you want the shortest repo context note for an AI or code agent, start with [AI.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/AI.md).

Release history and version policy live in [docs/updates.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/updates.md).

The approved scoring rollback reference lives in [docs/approved-score-model-v1.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/approved-score-model-v1.md).

The current pre-ship release line starts at `0.1.0`. Normal product work now moves on minor versions. Patch versions are reserved for small fixes after a minor when needed. The first public ship will be `1.0.0`.

## What works now

- Manifest V3 extension runtime
- page hover activation on normal sites
- compact side panel workspace
- fullscreen report in the page DOM
- deterministic scan to stack to issues to control to score pipeline
- stack fingerprint detection
- pricing reference layer for estimate framing
- local history and saved snapshot storage
- refinement questions for missing business context
- toolbar settings popup
- legal pages bundled inside the extension

## What still needs work

- broader estimate calibration across more real sites
- more copy tuning across edge cases
- export output beyond the current document shell
- store polish and review prep

## Tech stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension Manifest V3

## Runtime shape

Metis uses four surfaces.

- page DOM for the hover and fullscreen report
- side panel for the compact working view
- toolbar popup for local settings
- background service worker for tab session coordination

The scan path is deterministic.

`scan -> stack -> issues -> control -> score -> insight -> pricing -> UI`

## Start here

If you are getting oriented, read these in order.

1. [docs/flow-overview.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/flow-overview.md)
2. [docs/updates.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/updates.md)
3. [docs/approved-score-model-v1.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/approved-score-model-v1.md)
4. [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/extension-runtime-flow.md)
5. [docs/sidepanel-session-flow.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/sidepanel-session-flow.md)
6. [docs/design-system-flow.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/design-system-flow.md)
7. [docs/repo-alignment.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/repo-alignment.md)
8. [docs/front-facing-foundation.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/front-facing-foundation.md)
9. [docs/design-system-logic.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/design-system-logic.md)
10. [docs/production-roadmap.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/production-roadmap.md)
11. [docs/master-copy.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/master-copy.md)

## Setup

```bash
pnpm install
pnpm build
```

## Load in Chrome

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Turn on `Developer mode`
4. Click `Load unpacked`
5. Select [dist](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/dist)

Notes:

- load `dist/`, not the repo root
- reload the extension after manifest or background changes
- refresh the host page after content script changes
- content scripts do not run on Chrome internal pages such as `chrome://`

## Development commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test:logic
```

What they do:

- `pnpm dev` rebuilds into `dist/` while you work
- `pnpm build` creates a fresh production build
- `pnpm typecheck` runs TypeScript checks
- `pnpm test:logic` runs the deterministic logic suite

## Permissions in use

- `storage`
- `scripting`
- `sidePanel`
- `host_permissions: <all_urls>`
- `content_scripts.matches: <all_urls>`

Why they exist:

- `storage` keeps local settings and saved scan state
- `scripting` helps reconnect the page bridge when needed
- `sidePanel` powers the compact workspace
- `host_permissions` and `content_scripts` keep the hover available on normal sites

## Repo structure

```text
src/
  app/                  Side panel UI, fullscreen report wiring, shared view models
  background/           Manifest V3 service worker
  content/              Page bridge and DOM mount
  features/             Scan, stack, control, score, insight, pricing, refinement
  legal/                Internal extension legal pages
  popup/                Toolbar settings popup
  shared/               Shared contracts and runtime helpers
  styles/               Tailwind entry

docs/                   Flow notes and product references
```

## Product boundary

Metis owns scanning, reporting, and local settings inside the extension.

Metis Web owns account access, beta access, and public website flows.

If you touch account wording, website links, Plus copy, or legal wording, update [docs/repo-alignment.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/repo-alignment.md) on purpose.
