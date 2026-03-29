# Metis Extension Alignment Packet

This document is the extension-side alignment note. It defines what `Metis` owns, what `Metis-Web` owns, and what must not drift during production polish.

## Extension role

`Metis` is the Chrome extension product surface for:

- scanning and analysis
- page-level report rendering
- side panel workspace behavior
- popup controls
- extension-local settings
- extension-local legal copy

The extension is not the source of truth for account state, pricing, beta enrollment, or web auth flows.

## Ownership boundary

`Metis` owns:

- scan pipeline behavior
- report and side panel UI
- extension-local preferences
- local-first storage used by the extension
- extension privacy and terms copy that describes extension behavior

`Metis-Web` owns:

- auth
- onboarding
- account management
- account security
- pricing and beta posture
- public privacy and terms
- Plus Beta access rules

## Current alignment rules

- all public product links must use `https://metis.zward.studio`
- account actions in the extension must link to `https://metis.zward.studio/account`
- the extension must not present fake local account ownership
- the extension must not offer local Plus purchase or fake local entitlement flows
- Plus Beta can be surfaced from the extension only as a website-linked beta entry point
- extension settings stay inside the extension
- account settings stay on the website
- scans and report behavior should remain local-first unless a shipped feature explicitly changes that contract

## UI guardrails

- keep the side panel focused on scanning and report workflow
- keep popup actions focused on extension behavior, not website account management beyond a link-out
- an upgrade action may exist for Plus Beta, but it should open the user's website account in a new tab
- temporary extension-side Plus Beta entry is allowed only as a bridge while website-to-extension sync is unfinished
- do not use a local billing modal, fake purchase success state, fake plan badge, or local entitlement toast
- do not add dead website fragment links such as `#plus` or `#feedback` unless the website ships them

## Legal and copy guardrails

- extension legal copy must describe extension-local behavior accurately
- extension legal copy should state that website auth and account settings are managed on `Metis-Web`
- extension copy must not claim the website-to-extension auth bridge is fully finished unless it actually ships
- Plus should be described as website-managed beta access only

## Current repo status

The extension is currently aligned to the interim website-managed model:

- account actions link out to `https://metis.zward.studio/account`
- local Plus purchase and fake entitlement flows have been removed from the extension
- extension legal copy now states that account and security settings live on `Metis-Web`
- the extension remains local-first for scanning, reporting, and extension settings

Until the full website-to-extension entitlement sync exists, any temporary Plus entry in the extension should still behave like a website-managed beta handoff, not a local subscription system.

## Before changing account or auth-adjacent UI

Check the matching website packet first:

- `../Metis-Web/docs/repo-alignment.md` in the parent workspace

If a change affects:

- account wording
- beta access wording
- website links
- privacy or terms language
- auth or entitlement expectations

then update both repos deliberately instead of changing only one side.
