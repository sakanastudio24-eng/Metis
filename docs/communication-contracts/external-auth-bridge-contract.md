# External Auth Bridge Contract

This contract replaces the older page `postMessage` auth relay.

Metis now uses direct website -> extension external messaging for account connection.

## Ownership

- `Metis-Web` owns website sign-in, account state, and the connect overlay on `/account/settings?source=extension`
- `Metis` owns the Chrome extension manifest, service-worker receiver, storage cache, and UI reads
- the extension stores a small account snapshot only
- the website remains the account source of truth

## Allowed website origins

- `https://metis.zward.studio`
- `http://localhost:3000`

No wildcard hosts. No sibling subdomains. No preview domains unless they are added on purpose.

## Allowed extension IDs

The website sender can target:

- one configured production extension ID
- a small configured dev allowlist
- the current `extensionId` query parameter when the flow starts from the extension
- the last successful connected extension ID cached in website local storage

This keeps production predictable while still supporting local unpacked development.

## Entry flows

### Extension-first

1. user clicks `Sign in` in the extension
2. extension opens `/sign-in?source=extension&extensionId=<chrome.runtime.id>`
3. website auth completes
4. callback lands on `/account/settings?source=extension&extensionId=...`
5. overlay sends direct external message to the extension
6. service worker stores the account snapshot
7. popup, side panel, and injected UI read from extension storage later

Expected result:
- the bridge works even if popup and injected UI are closed during sign-in

### Website-first

1. user is already signed in on the website
2. user clicks `Connect to extension`
3. settings overlay sends direct external message
4. extension stores the account snapshot

Expected result:
- reconnect and resync do not require a second auth system inside the extension

## Website -> extension message

```ts
type MetisBridgeSyncMessage = {
  type: "METIS_BRIDGE_SYNC";
  source: "metis-web";
  bridgeVersion: 1;
  account: {
    email: string | null;
    username: string | null;
    scansUsed: number;
    tier: "free" | "plus_beta" | "paid";
    isBeta: boolean;
  };
};
```

The payload is intentionally small.

Do not send:

- service-role secrets
- whole provider sessions as the account source of truth
- onboarding answers
- billing details
- raw scan history

## Extension replies

```ts
type MetisBridgeSyncAck = {
  type: "METIS_BRIDGE_SYNC_ACK";
  source: "metis-extension";
  bridgeVersion: 1;
  ok: true;
};

type MetisBridgeSyncFailure = {
  type: "METIS_BRIDGE_SYNC_FAILURE";
  source: "metis-extension";
  bridgeVersion: 1;
  ok: false;
  reason:
    | "invalid_origin"
    | "invalid_extension_id"
    | "invalid_message_type"
    | "invalid_payload"
    | "unsupported_bridge_version"
    | "storage_failed"
    | "unknown";
  detail?: string;
};
```

## Extension storage contract

```ts
metis_account_state
metis_connected_at
metis_bridge_version
```

The bridge writes these keys from the service worker.

Popup, injector, and side panel read from those keys later.

## Validation rules

The service worker must reject anything that does not pass all of these checks:

- sender origin is allowlisted
- message type is exactly `METIS_BRIDGE_SYNC`
- `bridgeVersion === 1`
- account payload matches `BridgeAccountState`

## UI expectations

Signed out:

- extension shows `Sign in to unlock full insights`

Connected:

- extension shows `Connected to Metis ✓`
- popup can show `email`, `username`, `scansUsed`, `tier`, and beta state from cached storage

## Out of scope for this bridge

- full session sync
- token refresh
- content-script based auth relay
- making the injector be open during the handoff
- sending raw Supabase session objects around as the main product-state source
