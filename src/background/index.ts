// background/index.ts now coordinates the disposable page bridge and the stable
// Chrome side panel workspace. The service worker never scans the page itself;
// it only brokers sessions and privileged Chrome APIs.
import {
  getMetisTabSession,
  patchMetisTabSession,
  patchMetisTabSessionUiState,
  removeMetisTabSession,
  upsertMetisTabSession
} from "../shared/lib/tabSessionStore";
import {
  DEFAULT_METIS_SESSION_UI_STATE,
  type MetisRuntimeMessage,
  type MetisTabSessionState
} from "../shared/types/runtime";

function isRestrictedUrl(url?: string) {
  if (!url) {
    return true;
  }

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

async function tryPingExistingInjection(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "METIS_PING" satisfies MetisRuntimeMessage["type"] });
    return Boolean(response && typeof response === "object" && "ok" in response);
  } catch {
    return false;
  }
}

async function ensureContentBridge(tabId: number) {
  const alreadyInjected = await tryPingExistingInjection(tabId);

  if (alreadyInjected) {
    return true;
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["assets/content.js"]
  });

  return true;
}

// Content scripts declared in the manifest do not always appear on tabs that
// were already open when the extension was reloaded during development. This
// keeps the hover bridge visible on existing tabs after reloads and browser
// restarts instead of forcing a manual page refresh first.
async function primeOpenTabsWithBridge() {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id || isRestrictedUrl(tab.url)) {
        return;
      }

      try {
        await ensureContentBridge(tab.id);
      } catch (error) {
        console.warn("[Metis] failed to prime content bridge", {
          tabId: tab.id,
          url: tab.url,
          error
        });
      }
    })
  );
}

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Metis] background service worker ready");
  void primeOpenTabsWithBridge();
});

chrome.runtime.onStartup.addListener(() => {
  void primeOpenTabsWithBridge();
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "metis-sidepanel-presence") {
    return;
  }

  let activeTabId: number | null = null;

  port.onMessage.addListener((message: unknown) => {
    if (
      message &&
      typeof message === "object" &&
      "tabId" in message &&
      typeof message.tabId === "number"
    ) {
      activeTabId = message.tabId;
    }
  });

  port.onDisconnect.addListener(() => {
    if (!activeTabId) {
      return;
    }

    const closedTabId = activeTabId;

    void patchMetisTabSession(closedTabId, {
      isSidePanelOpen: false
    }).then((session) => {
      if (session) {
        return broadcastSessionChange(closedTabId);
      }
    });
  });
});

async function broadcastSessionChange(tabId: number) {
  const session = await getMetisTabSession(tabId);

  try {
    await chrome.runtime.sendMessage({
      type: "METIS_SESSION_CHANGED",
      tabId,
      session
    } satisfies MetisRuntimeMessage);
  } catch {
    // No side panel listeners is a normal case while the user is not looking at Metis.
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "METIS_SESSION_CHANGED",
      tabId,
      session
    } satisfies MetisRuntimeMessage);
  } catch {
    // The page bridge may not exist yet for this tab.
  }
}

async function openMetisSidePanel(windowId: number) {
  await chrome.sidePanel.open({ windowId });
}

function getSenderTab(
  sender: chrome.runtime.MessageSender
): { tabId: number; windowId: number } | null {
  if (!sender.tab?.id || sender.tab.windowId === undefined) {
    return null;
  }

  return {
    tabId: sender.tab.id,
    windowId: sender.tab.windowId
  };
}

async function getActiveTabSession() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!activeTab?.id) {
    return {
      tabId: null,
      session: null
    };
  }

  return {
    tabId: activeTab.id,
    session: await getMetisTabSession(activeTab.id)
  };
}

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return false;
  }

  const runtimeMessage = message as MetisRuntimeMessage;

  void (async () => {
    switch (runtimeMessage.type) {
      case "METIS_BRIDGE_READY": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertMetisTabSession(senderTab.tabId, (current) => ({
          tabId: senderTab.tabId,
          windowId: senderTab.windowId,
          currentUrl: runtimeMessage.href,
          isActive: current?.isActive ?? false,
          isSidePanelOpen: current?.isSidePanelOpen ?? false,
          bridgeStatus: "ready",
          lastUpdatedAt: current?.lastUpdatedAt ?? null,
          rawSnapshot: current?.rawSnapshot ?? null,
          baselineSnapshot: current?.baselineSnapshot ?? null,
          visitedSnapshots: current?.visitedSnapshots ?? [],
          uiState: current?.uiState ?? DEFAULT_METIS_SESSION_UI_STATE
        }));

        await broadcastSessionChange(senderTab.tabId);
        sendResponse({ ok: true, session });
        return;
      }

      case "METIS_OPEN_SIDE_PANEL": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        await openMetisSidePanel(senderTab.windowId);
        sendResponse({ ok: true });
        return;
      }

      case "METIS_START_TAB_SESSION": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertMetisTabSession(senderTab.tabId, (current) => ({
          tabId: senderTab.tabId,
          windowId: senderTab.windowId,
          currentUrl: current?.currentUrl ?? sender.tab?.url ?? "",
          isActive: true,
          isSidePanelOpen: current?.isSidePanelOpen ?? false,
          bridgeStatus: current?.bridgeStatus ?? "ready",
          lastUpdatedAt: current?.lastUpdatedAt ?? null,
          rawSnapshot: current?.rawSnapshot ?? null,
          baselineSnapshot: current?.baselineSnapshot ?? null,
          visitedSnapshots: current?.visitedSnapshots ?? [],
          uiState: current?.uiState ?? DEFAULT_METIS_SESSION_UI_STATE
        }));

        await broadcastSessionChange(senderTab.tabId);
        sendResponse({ ok: true, session });
        return;
      }

      case "METIS_SCAN_UPDATE": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertMetisTabSession(senderTab.tabId, (current) => ({
          tabId: senderTab.tabId,
          windowId: senderTab.windowId,
          currentUrl: runtimeMessage.payload.currentUrl,
          isActive: current?.isActive ?? true,
          isSidePanelOpen: current?.isSidePanelOpen ?? false,
          bridgeStatus: "ready",
          lastUpdatedAt: Date.now(),
          rawSnapshot: runtimeMessage.payload.rawSnapshot,
          baselineSnapshot: runtimeMessage.payload.baselineSnapshot,
          visitedSnapshots: runtimeMessage.payload.visitedSnapshots,
          uiState: current?.uiState ?? DEFAULT_METIS_SESSION_UI_STATE
        }));

        await broadcastSessionChange(senderTab.tabId);
        sendResponse({ ok: true, session });
        return;
      }

      case "METIS_GET_ACTIVE_TAB_SESSION": {
        sendResponse({
          ok: true,
          ...(await getActiveTabSession())
        });
        return;
      }

      case "METIS_SET_PANEL_VISIBILITY": {
        const session = await patchMetisTabSession(runtimeMessage.tabId, {
          isSidePanelOpen: runtimeMessage.isOpen
        });

        if (session) {
          await broadcastSessionChange(runtimeMessage.tabId);
        }

        sendResponse({ ok: Boolean(session), session });
        return;
      }

      case "METIS_PATCH_TAB_SESSION": {
        const { tabId } = await getActiveTabSession();

        if (!tabId) {
          sendResponse({ ok: false });
          return;
        }

        const session = await patchMetisTabSessionUiState(tabId, runtimeMessage.patch);
        await broadcastSessionChange(tabId);
        sendResponse({ ok: Boolean(session), session });
        return;
      }

      case "METIS_RECONNECT_ACTIVE_TAB": {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        });

        if (!activeTab?.id || !activeTab.windowId || isRestrictedUrl(activeTab.url)) {
          sendResponse({ ok: false });
          return;
        }

        await ensureContentBridge(activeTab.id);
        await chrome.tabs.sendMessage(activeTab.id, {
          type: "METIS_ACTIVATE_FROM_TOOLBAR"
        } satisfies MetisRuntimeMessage);
        await openMetisSidePanel(activeTab.windowId);
        sendResponse({ ok: true });
        return;
      }

      default:
        sendResponse({ ok: false });
    }
  })().catch((error) => {
    console.error("[Metis] background message failed", error);
    sendResponse({ ok: false, error: String(error) });
  });

  return true;
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "loading") {
    return;
  }

  const session = await patchMetisTabSession(tabId, {
    bridgeStatus: "reconnecting"
  });

  if (!session) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      type: "METIS_RECONNECT_REQUIRED",
      tabId
    } satisfies MetisRuntimeMessage);
  } catch {
    // No side panel listener is fine.
  }

  await broadcastSessionChange(tabId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeMetisTabSession(tabId);
  await broadcastSessionChange(tabId);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || tab.windowId === undefined || isRestrictedUrl(tab.url)) {
    return;
  }

  try {
    await ensureContentBridge(tab.id);
    await chrome.tabs.sendMessage(tab.id, {
      type: "METIS_ACTIVATE_FROM_TOOLBAR"
    } satisfies MetisRuntimeMessage);
    await openMetisSidePanel(tab.windowId);
  } catch (error) {
    console.error("[Metis] failed to inject into tab", error);
  }
});
