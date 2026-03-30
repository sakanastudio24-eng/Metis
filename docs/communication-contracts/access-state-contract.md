# Metis Access State Contract

This contract defines shared access-state and feature-gating behavior.

## Canonical access shape

```ts
type AccessState = {
  isAuthenticated: boolean;
  tier: "free" | "plus_beta" | "paid";
};
```

## Truth sources

Access state should come from validated communication state, not hardcoded UI assumptions.

Server-side truth can come from:

- auth session metadata
- backend validation response
- profile or account table later

## Extension feature gating

- signed out → `Sign in to unlock full insights`
- free → limited report behavior
- plus beta → deeper report and premium-request eligibility
- paid later → future paid behavior without changing the core model

## Gating rule

Do not gate features through hardcoded UI alone.

The extension should derive what to show from validated access state.

## Sync rule

The extension stays useful while signed out.

Connected account state adds:

- authenticated status
- tier-aware UI
- access to account-linked requests

It does not turn the extension into a website-dependent product.

## Implementation Status

Status at `0.12.0`:

- [x] access state is now derived from validated session state, not only from local UI toggles
- [x] signed-out behavior still keeps the extension useful
- [x] popup and side panel can show connected account state
- [x] Plus visibility now depends on validated `allowPlusUi`
- [ ] paid-tier behavior is still reserved and not yet distinct from Plus Beta in the UI
