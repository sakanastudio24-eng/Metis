# Metis Communication Contracts

This folder is the communication source of truth for Metis.

Use it when work crosses:

- extension UI and scanner
- extension and website
- extension and backend
- website and backend

## Contract set

- `communication-build-track.md`
- `extension-internal-contract.md`
- `auth-contract.md`
- `external-auth-bridge-contract.md`
- `api-upload-contract.md`
- `website-backend-contract.md`
- `access-state-contract.md`

## How to use these docs

- start with `communication-build-track.md` for the build order
- use `extension-internal-contract.md` for extension-only messaging
- use `auth-contract.md` for the website auth bridge
- use `external-auth-bridge-contract.md` for the direct website -> extension Chrome bridge
- use `api-upload-contract.md` for uploads, queueing, and rate limits
- use `website-backend-contract.md` for normal website/backend traffic
- use `access-state-contract.md` for account-tier and gating rules

If a communication change affects more than one lane, update all touched contracts on purpose.

## Implementation Status

Current extension status at `0.12.0`:

- [x] extension-internal runtime messaging is active
- [x] auth bridge contract is wired into the extension
- [x] validated access state is stored and broadcast locally
- [x] upload queue primitives exist for events, summaries, and premium requests
- [x] website-to-extension auth messaging is locked to `https://metis.zward.studio` and `http://localhost:3000`
- [ ] backend responses are not yet end-to-end verified from this repo alone
- [ ] website-side `/account/settings?source=extension` bridge flow still needs final live packaged-extension verification in production

## Current stage

Metis is currently in `Step 5 / Milestone E`.

What is already done:

- local extension messaging works
- the website auth bridge works
- backend validation and upload primitives exist
- access-state gating exists in the extension runtime

What is left before this lane feels finished:

- live production verification of the packaged extension against the website bridge
- final hardening of gating, retries, and edge-case behavior
