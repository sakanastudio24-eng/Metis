# Side Panel Session Flow

This is the runtime split that now powers Metis.

The short version:

- the page bridge is disposable
- the side panel is the stable compact workspace
- the background service worker brokers state between them

## The Three Layers

### 1. Page bridge

Lives in the tab context.

Responsibilities:

- show the Metis hover
- start the scan when the hover is clicked
- watch route changes
- collect snapshots
- post live updates to the extension
- open the fullscreen report overlay in the page when asked

This layer dies on full reload and comes back with the page.

### 2. Background coordinator

Lives in the MV3 service worker.

Responsibilities:

- open the Chrome side panel
- track tab-scoped Metis sessions
- store live tab-session state in `chrome.storage.session`
- relay updates between the page bridge and the side panel

### 3. Side panel app

Lives in extension context.

Responsibilities:

- render the main Metis UI
- keep the compact dashboard available across tab changes
- read the active tab session
- keep refinement, settings, export, and Plus shell close to the compact workspace
- show reconnect state when the page bridge is gone

## Session Lifecycle

### Hover click

1. page bridge is already mounted
2. user clicks the hover
3. content script starts the tab session
4. background opens the side panel
5. scans begin flowing into the tab session store
6. side panel renders the latest session

### Full report open

1. side panel stays focused on compact reading
2. user clicks `Full Report`
3. background relays that request to the page bridge
4. page bridge opens the fullscreen DOM report for the current tab

### SPA route change

1. content bridge sees `location.href` change
2. Metis reruns the scan
3. background updates the stored tab session
4. side panel refreshes the current report

### Full reload

1. old page bridge disappears
2. background marks the bridge as reconnecting
3. side panel keeps the session context but shows reconnect state
4. content script mounts again
5. bridge sends `METIS_BRIDGE_READY`
6. scans resume when the session is active again

## Why This Split Is Better

- less page-layout fragility
- fewer site-specific compact-panel bugs
- more stable Metis compact workspace
- easier compare/history/settings/export flow
- cleaner split between compact dashboard and page-owned deep read

## Main Files

- [src/content/PageBridgeApp.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/content/PageBridgeApp.tsx)
- [src/background/index.ts](/Users/zech/Downloads/The-Big-One/Metis/src/background/index.ts)
- [src/app/App.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/app/App.tsx)
- [src/shared/lib/tabSessionStore.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/lib/tabSessionStore.ts)
- [src/shared/types/runtime.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/types/runtime.ts)
