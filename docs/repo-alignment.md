# Metis Extension Alignment Packet

This document keeps the extension aligned with Metis Web.

It defines what belongs in the extension, what belongs on the website, and what should not drift during product polish.

Use `docs/production-roadmap.md` for the ordered launch checklist.

Use `docs/design-system-logic.md` for shared UI logic and final surface polish.

Use `docs/communication-contracts/README.md` for upload, access-state, and multi-lane communication work.

Use `docs/communication-contracts/auth-contract.md` for website-to-extension auth bridge work.

## What the extension owns

The Metis extension owns:

- scanning and analysis
- side panel workflow
- page level fullscreen report rendering
- popup controls
- extension local settings
- extension local legal copy

The extension does not own account state, pricing, beta enrollment, or web auth flows.

## What Metis Web owns

Metis Web owns:

- auth
- onboarding
- account access
- account security
- pricing posture
- Plus Beta access rules
- public privacy and terms

## Alignment rules

- all public product links should use `https://metis.zward.studio`
- account actions in the extension should use `https://metis.zward.studio/account`
- the extension must not pretend to own account state
- the extension must not offer local Plus purchase or fake local entitlement flows
- extension settings stay inside the extension
- account settings stay on the website
- scans and reports stay local first unless a shipped feature changes that contract

## UI guardrails

- keep the side panel focused on scanning and reading the current result
- keep popup actions focused on extension behavior, with link outs for website account access
- an upgrade action is allowed, but it should hand off to the website account page
- do not use a local billing modal, fake purchase success state, fake plan badge, or local entitlement toast
- do not add website fragment links that do not exist

## Legal and copy guardrails

- extension legal copy should describe extension behavior only
- extension legal copy should say that account and security settings live on Metis Web
- extension copy should not imply the website and extension are fully synced unless that bridge ships
- Plus should read as website managed beta access

## Current repo state

The repo is aligned to the current website managed model and the core product is largely in place.

- account actions link out to `https://metis.zward.studio/account`
- local Plus purchase and fake entitlement flows are removed
- extension legal copy now points account and security language to Metis Web
- the shipped auth bridge is the narrow website handoff through `/account/settings?source=extension` plus backend validation
- the extension remains local first for scanning, reporting, and settings
- the remaining work is calibration, export, polish, store readiness, and final live bridge verification

The shipped bridge is a narrow account handoff, not full website-to-extension product sync. Any Plus entry in the extension should still behave like a website handoff instead of a local entitlement flow.

Bridge work must follow `docs/communication-contracts/auth-contract.md` instead of inventing ad hoc payloads or redirect behavior.

Upload and access-state work must follow the communication contracts folder instead of scattered one-off notes.

## Before changing account or auth adjacent UI

Check the matching website packet first:

- `../Metis-Web/docs/repo-alignment.md`

If a change touches account wording, beta access wording, website links, legal wording, auth, or entitlement expectations, update both repos on purpose.
