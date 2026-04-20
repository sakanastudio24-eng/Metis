// background/index.ts coordinates the stable Chrome side panel workspace and
// the direct website -> extension bridge. The service worker never scans the
// page itself; it only brokers sessions, stored account state, upload queues,
// and privileged Chrome APIs.
import { assessConfidence } from "../features/confidence";
import { detectIssues } from "../features/detection";
import { scoreSnapshot } from "../features/scoring";
import { detectMoneyStack } from "../features/stack";
import {
  getStoredMetisWebSession,
} from "../shared/lib/metisAuthSession";
import {
  buildConnectedAccountFromBridge,
  deriveAccessStateFromBridgeAccount,
} from "../shared/lib/bridgeAccountState";
import {
  getBridgeStorageDebugSnapshot,
  clearBridgeAccountState,
  getStoredBridgeAccountState,
} from "../shared/lib/bridgeStorage";
import { buildStoredMetisLastScan, saveStoredMetisLastScan } from "../shared/lib/metisLastScan";
import { getMetisLocalSettings } from "../shared/lib/metisLocalSettings";
import {
  METIS_SITE_URL,
  buildMetisSignInUrl,
} from "../shared/lib/metisLinks";
import {
  getMetisSiteAccessState,
  isRestrictedMetisUrl,
  removeMetisSiteAccess,
  requestMetisSiteAccess,
} from "../shared/lib/siteAccess";
import {
  enqueueMetisAnalyticsEvent,
  enqueueMetisPremiumReportRequest,
  enqueueMetisScanSummary,
  processMetisUploadQueue
} from "../shared/lib/metisUploadQueue";
import {
  getMetisTabSession,
  getMetisTabSessions,
  patchMetisTabSession,
  patchMetisTabSessionUiState,
  removeMetisTabSession,
  upsertMetisTabSession
} from "../shared/lib/tabSessionStore";
import type {
  MetisAccessState,
} from "../shared/types/audit";
import {
  DEFAULT_METIS_SESSION_UI_STATE,
  type MetisRuntimeMessage,
  type MetisTabSessionState
} from "../shared/types/runtime";
import { registerExternalBridgeListener } from "./externalBridge";

function resolveSessionUiState(
  currentUiState: MetisTabSessionState["uiState"] | null | undefined,
  accessState: MetisAccessState
) {
  const resolvedUiState = {
    ...DEFAULT_METIS_SESSION_UI_STATE,
    ...currentUiState
  };

  if (accessState.allowPlusUi) {
    return {
      ...resolvedUiState,
      isPlusUser: currentUiState?.isPlusUser ?? true
    };
  }

  return {
    ...resolvedUiState,
    isPlusUser: false
  };
}

async function getAuthContext() {
  const bridgeAccount = await getStoredBridgeAccountState();
  const accessState = deriveAccessStateFromBridgeAccount(bridgeAccount);

  return {
    accessState,
    connectedAccount: buildConnectedAccountFromBridge(bridgeAccount)
  };
}

function withContractState(
  session: MetisTabSessionState | null,
  accessState: MetisAccessState,
  connectedAccount: ReturnType<typeof buildConnectedAccountFromBridge>,
  siteAccess: MetisTabSessionState["siteAccess"]
): MetisTabSessionState | null {
  if (!session) {
    return null;
  }

  return {
    ...session,
    accessState,
    siteAccess,
    connectedAccount,
    uiState: resolveSessionUiState(session.uiState, accessState)
  };
}

async function resolveTabSession(
  session: MetisTabSessionState | null,
  accessState: MetisAccessState,
  connectedAccount: ReturnType<typeof buildConnectedAccountFromBridge>
) {
  if (!session) {
    return null;
  }

  return withContractState(
    session,
    accessState,
    connectedAccount,
    await getMetisSiteAccessState(session.currentUrl)
  );
}

async function upsertResolvedTabSession(
  tabId: number,
  updater: (current: MetisTabSessionState | null) => Omit<MetisTabSessionState, "accessState" | "connectedAccount" | "siteAccess" | "uiState"> & {
    uiState?: MetisTabSessionState["uiState"];
  }
) {
  const current = await getMetisTabSession(tabId);
  const authContext = await getAuthContext();
  const nextBase = updater(current);
  const nextSession: MetisTabSessionState = {
    ...nextBase,
    accessState: authContext.accessState,
    siteAccess: await getMetisSiteAccessState(nextBase.currentUrl),
    connectedAccount: authContext.connectedAccount,
    uiState: resolveSessionUiState(nextBase.uiState ?? current?.uiState, authContext.accessState)
  };

  await upsertMetisTabSession(tabId, () => nextSession);
  return nextSession;
}

async function syncAllSessionsWithAccessState() {
  const sessions = await getMetisTabSessions();
  const authContext = await getAuthContext();
  const tabIds = Object.keys(sessions).map((tabId) => Number(tabId));

  for (const tabId of tabIds) {
    const current = sessions[String(tabId)];
    const siteAccess = await getMetisSiteAccessState(current.currentUrl);

    await upsertMetisTabSession(tabId, () => ({
      ...current,
      accessState: authContext.accessState,
      siteAccess,
      connectedAccount: authContext.connectedAccount,
      uiState: resolveSessionUiState(current.uiState, authContext.accessState)
    }));
  }

  return tabIds;
}

async function broadcastSessionChange(tabId: number) {
  const authContext = await getAuthContext();
  const session = await resolveTabSession(
    await getMetisTabSession(tabId),
    authContext.accessState,
    authContext.connectedAccount
  );

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

async function broadcastAuthStateChange() {
  try {
    await chrome.runtime.sendMessage({
      type: "METIS_AUTH_STATE_CHANGED"
    } satisfies MetisRuntimeMessage);
  } catch {
    // No listeners is fine.
  }
}

async function tryPingExistingInjection(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "METIS_PING" satisfies MetisRuntimeMessage["type"]
    });
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

  const settings = await getMetisLocalSettings();

  if (!settings.bridgeRepairEnabled) {
    return false;
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["assets/content.js"]
  });

  return true;
}

async function queueUsageEvent(type: string, route?: string) {
  const authSession = await getStoredMetisWebSession();

  if (!authSession) {
    return;
  }

  await enqueueMetisAnalyticsEvent({
    type,
    occurredAt: Date.now(),
    route
  });
  await processMetisUploadQueue(authSession);
}

async function queueScanSummaryForSession(session: MetisTabSessionState | null) {
  if (!session?.rawSnapshot) {
    return;
  }

  const authSession = await getStoredMetisWebSession();

  if (!authSession) {
    return;
  }

  const issues = detectIssues(session.rawSnapshot);
  const score = scoreSnapshot(session.rawSnapshot, issues);
  const confidence = assessConfidence(
    session.rawSnapshot,
    detectMoneyStack(session.rawSnapshot, {}),
    score
  );

  await enqueueMetisScanSummary({
    route: session.currentUrl,
    score: Math.round(score.score),
    issueCount: issues.length,
    confidence: confidence.label
  });
  await processMetisUploadQueue(authSession);
}

async function queuePremiumReportRequestForSession(
  session: MetisTabSessionState | null,
  source: "panel" | "report" | "popup"
) {
  if (!session) {
    return;
  }

  const authSession = await getStoredMetisWebSession();

  if (!authSession) {
    return;
  }

  const item = await enqueueMetisPremiumReportRequest({
    route: session.currentUrl,
    requestedAt: Date.now(),
    source
  });

  try {
    await chrome.runtime.sendMessage({
      type: "METIS_UPLOAD_REQUEST_QUEUED",
      item
    } satisfies MetisRuntimeMessage);
  } catch {
    // No listeners is fine.
  }

  await processMetisUploadQueue(authSession);
}

async function openMetisSidePanel(tabId: number, windowId: number) {
  try {
    await chrome.sidePanel.open({ windowId });
    return true;
  } catch (globalError) {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel.html",
        enabled: true
      });
      await chrome.sidePanel.open({ tabId });
      return true;
    } catch (tabError) {
      console.warn("[Metis] failed to open side panel", {
        tabId,
        windowId,
        globalError,
        tabError
      });
      return false;
    }
  }
}

async function openMetisToolbarSettings(windowId?: number) {
  if (windowId) {
    await chrome.action.openPopup({ windowId });
    return;
  }

  await chrome.action.openPopup();
}

async function openMetisSignInPage() {
  const signInUrl = buildMetisSignInUrl(chrome.runtime.id);
  console.info("[Metis bridge] opening website sign-in", {
    runtimeId: chrome.runtime.id,
    signInUrl,
  });
  const existingTabs = await chrome.tabs.query({});
  const existingMetisTab = existingTabs.find(
    (tab) => typeof tab.url === "string" && tab.url.startsWith(METIS_SITE_URL)
  );

  if (existingMetisTab?.id) {
    await chrome.tabs.update(existingMetisTab.id, {
      url: signInUrl,
      active: true
    });

    if (existingMetisTab.windowId !== undefined) {
      await chrome.windows.update(existingMetisTab.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({
    url: signInUrl,
    active: true
  });
}

async function handleBridgeAccountStored() {
  const tabIds = await syncAllSessionsWithAccessState();
  await Promise.all(tabIds.map((tabId) => broadcastSessionChange(tabId)));
  await broadcastAuthStateChange();
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

  const authContext = await getAuthContext();

  return {
    tabId: activeTab.id,
    session: await resolveTabSession(
      await getMetisTabSession(activeTab.id),
      authContext.accessState,
      authContext.connectedAccount
    )
  };
}

registerExternalBridgeListener({
  onBridgeStored: handleBridgeAccountStored
});

// Expanded site access is origin-scoped. Only granted origins are re-injected
// automatically after reloads or later visits.
async function primeOpenTabsWithBridge() {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id || isRestrictedMetisUrl(tab.url)) {
        return;
      }

      try {
        const siteAccess = await getMetisSiteAccessState(tab.url);

        if (!siteAccess.isGranted) {
          return;
        }

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

function restoreToolbarPopupBehavior() {
  void chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error) => {
      console.warn("[Metis] failed to restore toolbar popup behavior", error);
    });
}

chrome.runtime.onInstalled.addListener(() => {
  console.info("[Metis] background service worker ready");
  restoreToolbarPopupBehavior();
  void primeOpenTabsWithBridge();
});

chrome.runtime.onStartup.addListener(() => {
  restoreToolbarPopupBehavior();
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

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return false;
  }

  const runtimeMessage = message as MetisRuntimeMessage;

  if (runtimeMessage.type === "METIS_OPEN_SIDE_PANEL") {
    const senderTab = getSenderTab(sender);

    if (!senderTab) {
      sendResponse({ ok: false });
      return false;
    }

    void openMetisSidePanel(senderTab.tabId, senderTab.windowId).then(async (opened) => {
      if (opened) {
        await queueUsageEvent("panel_opened", sender.tab?.url ?? undefined);
      }

      sendResponse({ ok: opened });
    });

    return true;
  }

  void (async () => {
    switch (runtimeMessage.type) {
      case "METIS_BRIDGE_READY": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertResolvedTabSession(senderTab.tabId, (current) => ({
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
          uiState: current?.uiState
        }));

        await broadcastSessionChange(senderTab.tabId);
        sendResponse({ ok: true, session });
        return;
      }

      case "METIS_OPEN_TOOLBAR_SETTINGS": {
        const senderTab = getSenderTab(sender);
        await openMetisToolbarSettings(senderTab?.windowId);
        sendResponse({ ok: true });
        return;
      }

      case "METIS_OPEN_SIGN_IN": {
        await queueUsageEvent("auth_cta_clicked");
        await openMetisSignInPage();
        sendResponse({ ok: true });
        return;
      }

      case "METIS_DISCONNECT_ACCOUNT": {
        await clearBridgeAccountState();
        await handleBridgeAccountStored();
        console.info("[Metis bridge] cleared cached account snapshot");
        sendResponse({ ok: true });
        return;
      }

      case "METIS_OPEN_PANEL_FROM_POPUP": {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        });

        if (!activeTab?.id || !activeTab.windowId || isRestrictedMetisUrl(activeTab.url)) {
          sendResponse({ ok: false });
          return;
        }

        const bridgeReady = await ensureContentBridge(activeTab.id);

        if (!bridgeReady) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertResolvedTabSession(activeTab.id, (current) => ({
          tabId: activeTab.id!,
          windowId: activeTab.windowId!,
          currentUrl: current?.currentUrl ?? activeTab.url ?? "",
          isActive: true,
          isSidePanelOpen: current?.isSidePanelOpen ?? false,
          bridgeStatus: current?.bridgeStatus ?? "ready",
          lastUpdatedAt: current?.lastUpdatedAt ?? null,
          rawSnapshot: current?.rawSnapshot ?? null,
          baselineSnapshot: current?.baselineSnapshot ?? null,
          visitedSnapshots: current?.visitedSnapshots ?? [],
          uiState: current?.uiState
        }));

        await chrome.tabs.sendMessage(activeTab.id, {
          type: "METIS_ACTIVATE_FROM_TOOLBAR"
        } satisfies MetisRuntimeMessage);
        const opened = await openMetisSidePanel(activeTab.id, activeTab.windowId);

        if (opened) {
          await queueUsageEvent("panel_opened", activeTab.url ?? undefined);
        }

        await broadcastSessionChange(activeTab.id);
        sendResponse({ ok: opened, session });
        return;
      }

      case "METIS_OPEN_PAGE_REPORT": {
        if (!runtimeMessage.tabId) {
          sendResponse({ ok: false });
          return;
        }

        const bridgeReady = await ensureContentBridge(runtimeMessage.tabId);

        if (!bridgeReady) {
          sendResponse({ ok: false });
          return;
        }

        await chrome.tabs.sendMessage(runtimeMessage.tabId, runtimeMessage);
        const session = await getMetisTabSession(runtimeMessage.tabId);
        await queueUsageEvent(
          runtimeMessage.openPlusPreview ? "upgrade_clicked" : "full_scan_opened",
          session?.currentUrl
        );
        await queueScanSummaryForSession(session);

        if (runtimeMessage.openPlusPreview) {
          await queuePremiumReportRequestForSession(session, "panel");
        }

        sendResponse({ ok: true });
        return;
      }

      case "METIS_START_TAB_SESSION": {
        const senderTab = getSenderTab(sender);

        if (!senderTab) {
          sendResponse({ ok: false });
          return;
        }

        const session = await upsertResolvedTabSession(senderTab.tabId, (current) => ({
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
          uiState: current?.uiState
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

        const session = await upsertResolvedTabSession(senderTab.tabId, (current) => ({
          tabId: senderTab.tabId,
          windowId: senderTab.windowId,
          currentUrl: runtimeMessage.payload.currentUrl,
          isActive: true,
          isSidePanelOpen: current?.isSidePanelOpen ?? false,
          bridgeStatus: "ready",
          lastUpdatedAt: Date.now(),
          rawSnapshot: runtimeMessage.payload.rawSnapshot,
          baselineSnapshot: runtimeMessage.payload.baselineSnapshot,
          visitedSnapshots: runtimeMessage.payload.visitedSnapshots,
          uiState: current?.uiState
        }));

        await saveStoredMetisLastScan(
          buildStoredMetisLastScan(
            runtimeMessage.payload.rawSnapshot,
            detectIssues(runtimeMessage.payload.rawSnapshot).length
          )
        );

        await broadcastSessionChange(senderTab.tabId);
        sendResponse({ ok: true, session });
        return;
      }

      case "METIS_GET_SITE_ACCESS_STATE": {
        const tabId = runtimeMessage.tabId ?? (await getActiveTabSession()).tabId;

        if (!tabId) {
          sendResponse({ ok: false, siteAccess: await getMetisSiteAccessState(null) });
          return;
        }

        const tab = await chrome.tabs.get(tabId).catch(() => null);
        sendResponse({
          ok: true,
          siteAccess: await getMetisSiteAccessState(tab?.url ?? null)
        });
        return;
      }

      case "METIS_REQUEST_SITE_ACCESS": {
        const tabId = runtimeMessage.tabId ?? (await getActiveTabSession()).tabId;

        if (!tabId) {
          sendResponse({ ok: false });
          return;
        }

        const tab = await chrome.tabs.get(tabId).catch(() => null);

        if (!tab?.id || tab.windowId === undefined || isRestrictedMetisUrl(tab.url)) {
          sendResponse({ ok: false, siteAccess: await getMetisSiteAccessState(tab?.url ?? null) });
          return;
        }

        const granted = await requestMetisSiteAccess(tab.url ?? null);
        const siteAccess = await getMetisSiteAccessState(tab.url ?? null);

        if (!granted || !siteAccess.isGranted) {
          sendResponse({ ok: false, siteAccess });
          return;
        }

        await ensureContentBridge(tab.id);
        const current = await getMetisTabSession(tab.id);

        if (current) {
          await patchMetisTabSession(tab.id, {
            siteAccess
          });
          await broadcastSessionChange(tab.id);
        }

        sendResponse({ ok: true, siteAccess });
        return;
      }

      case "METIS_REMOVE_SITE_ACCESS": {
        const tabId = runtimeMessage.tabId ?? (await getActiveTabSession()).tabId;

        if (!tabId) {
          sendResponse({ ok: false });
          return;
        }

        const tab = await chrome.tabs.get(tabId).catch(() => null);
        const removed = await removeMetisSiteAccess(tab?.url ?? null);
        const siteAccess = await getMetisSiteAccessState(tab?.url ?? null);
        const current = await getMetisTabSession(tabId);

        if (current) {
          await patchMetisTabSession(tabId, {
            siteAccess,
            uiState: {
              ...current.uiState,
              scanScope: "single"
            }
          });
          await broadcastSessionChange(tabId);
        }

        sendResponse({ ok: removed, siteAccess });
        return;
      }

      case "METIS_GET_ACTIVE_TAB_SESSION": {
        sendResponse({
          ok: true,
          ...(await getActiveTabSession())
        });
        return;
      }

      case "METIS_GET_BRIDGE_DEBUG": {
        sendResponse({
          ok: true,
          snapshot: await getBridgeStorageDebugSnapshot(),
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

        if (!activeTab?.id || !activeTab.windowId || isRestrictedMetisUrl(activeTab.url)) {
          sendResponse({ ok: false });
          return;
        }

        const bridgeReady = await ensureContentBridge(activeTab.id);

        if (!bridgeReady) {
          await openMetisToolbarSettings(activeTab.windowId);
          sendResponse({ ok: false });
          return;
        }

        await chrome.tabs.sendMessage(activeTab.id, {
          type: "METIS_ACTIVATE_FROM_TOOLBAR"
        } satisfies MetisRuntimeMessage);
        const opened = await openMetisSidePanel(activeTab.id, activeTab.windowId);

        if (opened) {
          await queueUsageEvent("panel_opened", activeTab.url ?? undefined);
        }

        sendResponse({ ok: opened });
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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    const session = await patchMetisTabSession(tabId, {
      bridgeStatus: "reconnecting"
    });

    if (session) {
      try {
        await chrome.runtime.sendMessage({
          type: "METIS_RECONNECT_REQUIRED",
          tabId
        } satisfies MetisRuntimeMessage);
      } catch {
        // No side panel listener is fine.
      }

      await broadcastSessionChange(tabId);
    }

    return;
  }

  if (changeInfo.status !== "complete" || !tab.id || isRestrictedMetisUrl(tab.url)) {
    return;
  }

  const siteAccess = await getMetisSiteAccessState(tab.url);

  if (!siteAccess.isGranted) {
    return;
  }

  try {
    await ensureContentBridge(tab.id);
  } catch (error) {
    console.warn("[Metis] failed to auto-inject granted site", {
      tabId: tab.id,
      url: tab.url,
      error
    });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeMetisTabSession(tabId);
  await broadcastSessionChange(tabId);
});
