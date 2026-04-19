# External Auth Bridge Flow

This page is the implementation flow for the direct external auth bridge.

## Extension-first flow

What to do first:

1. user opens the extension
2. user clicks `Sign in`
3. background opens the website sign-in URL with `source=extension` and `extensionId=<chrome.runtime.id>`
4. website finishes auth
5. website checks that `extensionId` is in its configured allowlist
6. settings overlay sends `METIS_BRIDGE_SYNC`
7. service worker stores `metis_account_state`

Expected result:

- popup can reopen later and show connected account state without needing the website tab open

## Website-first flow

What to do next:

1. user is already signed in on the website
2. website uses the configured production or dev extension ID allowlist
3. user clicks `Connect to extension`
4. settings overlay sends the same `METIS_BRIDGE_SYNC`
5. extension stores the new snapshot

Expected result:

- reconnect updates `tier`, `isBeta`, `scansUsed`, and `sitesTracked` without
  another auth flow

## Failure flow

If the bridge fails:

1. website overlay receives a failure reply
2. overlay stays on `/account/settings`
3. user can choose `Close overlay` or `Try sign-in again`

Expected result:

- connection failures stay visible inside the account settings overlay and do not depend on separate pages

## Debug order

1. confirm the extension is reloaded after manifest or service-worker changes
2. confirm the website origin is exactly `https://metis.zward.studio` or `http://localhost:3000`
3. confirm the sign-in URL contains `source=extension`
4. confirm the sign-in URL or stored website state includes a usable extension ID that is also in the website allowlist
5. inspect `chrome.storage.local` for:
   - `metis_account_state`
   - `metis_connected_at`
   - `metis_bridge_version`
6. if the website requests disconnect, confirm the extension clears the same
   bridge storage keys instead of keeping stale account state
7. confirm Supabase and provider dashboards use the exact callback URL for the current origin

Expected result:

- bridge debugging starts with origin, extension ID, and storage state before touching injected UI
