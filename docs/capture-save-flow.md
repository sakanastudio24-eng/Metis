# Capture Save Flow

This is the simple version of how Metis capture works today.

The important thing to know is that `Capture` is not a screenshot tool and it is not a crawler. It is a save point for the current page scan.

## What Capture Saves

When you press `Capture`, Metis saves a compact page snapshot with:

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

## Two Kinds Of Saved State

Metis now keeps two related records in storage.

### 1. Per-page history

This is keyed by:

- `origin + pathname`

That means:

- `/pricing` compares against older `/pricing` scans
- `/dashboard` compares against older `/dashboard` scans
- query strings do not create fake new pages

This is the right model for same-page-over-time comparison.

### 2. Latest captured page

This is the most recent page the user manually captured.

That means:

- capture page A
- open page B
- Metis can still compare page B against the latest captured page A

This is the cross-page compare path.

## What Happens On Auto Scan

When Metis scans a page while the panel is open, it:

1. builds the current compact page snapshot
2. compares it to the last saved snapshot for the same page key
3. saves the new same-page snapshot

That updates page history, but it does not replace the latest manual capture.

This matters because the user may want to keep page A as the compare target while browsing page B, page C, and page D.

## What Happens On Manual Capture

When the user presses `Capture`, Metis:

1. builds the current compact page snapshot
2. saves it into per-page history
3. marks it as `latestCapturedSnapshot`

That manual action is what carries the saved page across routes.

## Compare Modes Metis Supports

Right now the storage model supports two useful comparisons:

### Same page history

Compare:

- current `/pricing`
- last saved `/pricing`

### Latest captured page

Compare:

- current page
- latest manually captured page

That is the mode that makes cross-page capture useful.

## Why This Design Exists

This approach keeps the model simple:

- page history stays stable
- manual capture still has meaning
- Metis can compare across routes without pretending it has a full timeline system

It is a good v1 shape because it gives the user a real “save this page state” action without forcing the product to become a full session recorder.
