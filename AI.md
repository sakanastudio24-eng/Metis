# Metis AI Context

This file is the shortest repo-level context note for AI/code agents working in Metis.

## Product shape

Metis is a Chrome Extension Manifest V3 product for page-level cost-risk analysis.

Current surface split:

- page DOM: hover launcher and fullscreen report overlay
- side panel: compact workspace
- toolbar icon: settings popup
- background: runtime relay and tab-session coordinator

## Live runtime model

- a lightweight content bridge is always mounted on normal pages
- clicking the `M` hover starts the tab session and opens the side panel
- scans run from the page bridge, not from the service worker
- the fullscreen report and Metis+ overlay open back in the page DOM
- the side panel stays compact and stable across page changes

## Core pipeline

Metis is deterministic and local-first.

The main logic path is:

`scan -> stack -> issues -> control -> score -> insight -> pricing -> UI`

Important implementation boundaries:

- `src/features/scan`: browser data collection and normalization
- `src/features/stack`: fingerprint-based vendor detection
- `src/features/detection`: issue detection
- `src/features/control`: justified vs uncontrolled heaviness
- `src/features/scoring`: waste/cost-risk score
- `src/features/insights`: user-facing explanation copy
- `src/features/pricing`: provider-aware estimate framing

## Current product rules

- user-provided context belongs in refinement questions, not hidden settings assumptions
- hosting/CDN is an amplifier, not a direct fault
- AI/provider presence is contextual, not automatically wasteful
- the side panel should stay narrow and stable
- large immersive reads belong in the page DOM, not in the side panel

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
- `docs/flow-overview.md`
- `docs/extension-runtime-flow.md`
- `docs/sidepanel-session-flow.md`
- `docs/design-system-flow.md`
- `docs/pricing-reference-flow.md`

## Working rules

- prefer focused commits by subsystem
- keep version bumps isolated in their own commit
- use `dist/` when loading the unpacked extension in Chrome
- reload the extension in `chrome://extensions` after manifest or background changes
- refresh the host page after content-script changes

## Permissions in use

- `storage`
- `scripting`
- `sidePanel`
- `host_permissions: <all_urls>`
- `content_scripts.matches: <all_urls>`

## Main risk before shipping

The biggest review-sensitive area is still broad always-on page access through `"<all_urls>"` plus always-mounted content scripts.
