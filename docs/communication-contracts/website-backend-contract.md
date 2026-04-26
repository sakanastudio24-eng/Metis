# Metis Website Backend Contract

This contract defines normal website-to-backend communication.

## Lane responsibilities

Website ↔ backend is used for:

- auth
- onboarding
- user account
- billing later
- saved reports later

## Identity rule

Supabase remains the identity source of truth.

FastAPI stays narrow and only handles protected app and backend needs that sit beside the website account system.

## Current boundary

The website owns:

- auth entry
- callback completion
- onboarding
- account pages
- security pages
- staged API Beta posture

The backend owns:

- protected verification
- health and readiness
- future account-linked API work
- future report-saving behavior

## Beta boundary rule

API Beta may stay visible in the website UI before the full backend surface is live.

That visibility must remain honest:

- staged account UI is allowed
- unfinished backend behavior must not be implied as live

## Future scope

This lane expands later for:

- billing
- saved reports
- stronger account-linked features

Those should be added through this contract, not ad hoc route-by-route drift.

## Implementation Status

Status at `0.14.9`:

- [x] extension now treats website auth and account pages as website-owned
- [x] extension uses backend validation only for protected access-state checks
- [x] extension does not claim ownership of billing or saved-report account behavior
- [ ] billing and saved-report flows remain future work
- [ ] website-side staged API Beta surfaces still need to stay aligned with backend reality
