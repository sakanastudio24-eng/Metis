# Metis Auth Contract

This is the extension-side copy of the shared auth bridge contract.

Use this file when changing extension auth handoff behavior, content-script bridge logic, background auth storage, or connected account UI.

This is lane 2 inside the broader communication contract system.

## Architecture rule

- `Metis-Web` owns auth
- `Metis` owns local runtime
- the bridge is a one-time handoff, not full sync

The extension must not render embedded login UI or act like it owns identity.

## V1 goal

V1 keeps auth web-first and the extension local-first.

The extension stays usable without auth. A bridged website session unlocks connected account behavior and fuller insight access, but base scanning still works locally.

## Entry flow

When the extension needs website auth, it opens:

- production: `https://metis.zward.studio/sign-in?source=extension`
- development: `http://localhost:3000/sign-in?source=extension`

If sign-up is used instead, the same query rule applies:

- `/sign-up?source=extension`

## Callback flow

- website auth completes through `/auth/callback`
- extension-aware auth resolves into `/auth/success`
- `/auth/success` is a bridge-only completion page
- `/auth/success` must not become a general redirect surface

## Bridge method

The bridge uses `window.postMessage`.

Flow:

1. website loads `/auth/success`
2. website reads the authenticated session client-side
3. website posts `METIS_AUTH_SUCCESS`
4. content script validates origin, path, and payload
5. content script forwards the message to background
6. background stores the bridged auth locally
7. background validates account state with backend
8. background broadcasts connected auth state to extension surfaces
9. extension ACKs the success page so it can close

## Allowed origins and route

Only accept messages from:

- `https://metis.zward.studio`
- `http://localhost:3000`

Only accept auth bridge messages when the page location is:

- `/auth/success`

Ignore all other origins and paths.

## Query parameter rule

`source=extension` means:

- auth should preserve extension intent through the auth flow
- callback completion should land on `/auth/success`
- normal website auth behavior should stay unchanged when the parameter is absent

## Website message payload

```ts
type MetisAuthSuccessMessage = {
  type: "METIS_AUTH_SUCCESS";
  source: "metis-web";
  version: 1;
  session: {
    accessToken: string;
    expiresAt: number | null;
    user: {
      id: string;
      email: string | null;
    };
  };
};
```

## Extension ACK payload

```ts
type MetisAuthSuccessAck = {
  type: "METIS_AUTH_SUCCESS_ACK";
  source: "metis-extension";
  version: 1;
  ok: true;
};
```

## Storage rule

The extension stores bridged auth in `chrome.storage.local`.

V1 stores minimal data only:

- access token
- expiry when available
- user id
- user email when available
- validated account flags
- connection timestamp

V1 does not require refresh-token rotation.

Never store service-role secrets or backend-only credentials in the extension.

## Backend validation contract

After storing the basic bridged session, background validates it against backend.

Validation endpoint:

- `POST /v1/extension/validate`

Expected validated state:

- `plan`
- `plus_beta_enabled`
- `api_beta_enabled`
- `allow_plus_ui`
- `allow_report_email`

Backend validation is the source of truth for extension-side entitlement behavior.

## Extension storage shape

```ts
type StoredMetisWebSession = {
  accessToken: string;
  expiresAt: number | null;
  user: {
    id: string;
    email: string | null;
  };
  account: {
    plan: "free" | "plus_beta";
    plusBetaEnabled: boolean;
    apiBetaEnabled: boolean;
    allowPlusUi: boolean;
    allowReportEmail: boolean;
  };
  connectedAt: number;
};
```

## Entitlement rule

- all signed-in users get a connected extension session
- Plus and API unlocks still depend on server-side flags
- signed-in does not automatically mean Plus Beta
- signed-in does not automatically mean API Beta

## UI copy rule

Signed-out connected CTA:

- `Sign in to unlock full insights`

Signed-in connected state:

- `Connected to Metis ✓`

This bridge must not create a fake billing state or imply that website and extension data are fully synced.

## Success-page behavior

- success page posts bridge payload
- waits for extension ACK
- shows a short success state
- attempts `window.close()` after ACK
- shows manual fallback if no ACK arrives

The success page should not silently close without a verified handoff.

## Failure rule

Ignore and do not persist:

- unknown origins
- non-`/auth/success` pages
- malformed payloads
- missing tokens
- failed backend validation responses

If validation fails or the token later expires:

- clear connected state
- fall back to signed-out extension behavior

## Responsibility split

Website responsibilities:

- auth UI
- provider flows
- callback completion
- success-page bridge payload

Extension responsibilities:

- origin and route validation
- local auth storage
- connected UI state
- fallback to signed-out behavior

Backend responsibilities:

- token-backed account validation
- plan and beta-flag truth
- future protected bridge expansion

## Related contracts

- `README.md`
- `communication-build-track.md`
- `extension-internal-contract.md`
- `api-upload-contract.md`
- `website-backend-contract.md`
- `access-state-contract.md`

## Implementation Status

Status at `0.12.0`:

- [x] extension opens website sign-in through the shared Metis site URL
- [x] content bridge validates allowed origin, `/auth/success`, and payload shape before forwarding
- [x] background validates bridged auth against `POST /v1/extension/validate`
- [x] validated auth is stored locally and rebroadcast to extension surfaces
- [x] extension sends the required `METIS_AUTH_SUCCESS_ACK`
- [x] invalid bridge payloads fall back to signed-out behavior
- [ ] sign-up entry still follows the doc contract, but the extension currently uses sign-in as the primary path
- [ ] production website success-page behavior still needs full end-to-end verification against the live extension
