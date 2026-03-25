# Capture Save Flow

This is the simple version of how Metis capture works today.

The important thing to know is that Metis does not use a screenshot-style capture system. It saves a compact scan snapshot for the current route while the panel is open.

## What Metis Saves

When Metis saves a page snapshot, it keeps:

- the current page URL
- a normalized page key
- request count
- duplicate request signals
- third-party domain count
- total encoded body size
- meaningful image count
- meaningful image bytes
- a timestamp

This is enough to compare one saved page state against another later without storing the full raw scan output.

## How Saving Works Now

The current product flow is automatic:

1. open the panel
2. Metis scans the current route
3. Metis saves a compact snapshot for that normalized page key
4. the UI shows `Page saved`

That means the current route is already being stored without a separate capture click.

## Per-page History

Page history is keyed by:

- `origin + pathname`

That means:

- `/pricing` compares against older `/pricing` scans
- `/dashboard` compares against older `/dashboard` scans
- query strings do not create fake new pages

This is the right model for same-page-over-time comparison, and it is also what drives the sampled-pages count in the UI.

## What Happens On Auto Scan

When Metis scans a page while the panel is open, it:

1. builds the current compact page snapshot
2. compares it to the last saved snapshot for the same page key
3. saves the new same-page snapshot

If the user opens page A, then page B, then page C, each normalized route can be saved into the page-history store.

## Compare Modes Metis Supports

Right now the storage model supports two useful comparisons:

### Same page history

Compare:

- current `/pricing`
- last saved `/pricing`

## Why This Design Exists

This approach keeps the model simple:

- page history stays stable
- the UI can show how many distinct pages have been saved
- Metis can compare route states without pretending it has a full timeline system

It is a good v1 shape because it keeps the saved state small, cheap to reason about, and stable across navigation.
