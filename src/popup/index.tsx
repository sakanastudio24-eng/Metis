import { StrictMode, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Database, ExternalLink, Gauge, LayoutDashboard, Mail, Shield, Sparkles, Trash2, UserRound } from "lucide-react";
import { Toaster, toast } from "sonner";
import "../styles/tailwind.css";
import { clearPageScanStore, clearPageScansForOrigin, getPageScanStoreSummary } from "../shared/lib/pageScanHistory";
import {
  buildConnectedAccountFromBridge,
  deriveAccessStateFromBridgeAccount,
} from "../shared/lib/bridgeAccountState";
import {
  clearBridgeAccountState,
  getBridgeStorageDebugSnapshot,
  getStoredBridgeState,
} from "../shared/lib/bridgeStorage";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings,
  saveMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import {
  buildPermissionControls,
  type PermissionControlId
} from "../shared/lib/metisPermissionControls";
import { getDefaultMetisSiteAccessState } from "../shared/lib/siteAccess";
import {
  clearAllSiteHistory,
  clearSiteHistoryForOrigin,
  getSiteHistorySummary,
  type SiteHistorySummary
} from "../shared/lib/siteBaseline";
import {
  METIS_ACCOUNT_URL,
  METIS_PRIVACY_URL,
  METIS_SITE_URL,
  METIS_TERMS_URL
} from "../shared/lib/metisLinks";
import {
  METIS_ACCOUNT_STATE_KEY,
  METIS_BRIDGE_DEBUG_KEY,
  METIS_BRIDGE_VERSION_KEY,
  METIS_CONNECTED_AT_KEY,
  LEGACY_METIS_USER_SETTINGS_KEY,
  METIS_USER_SETTINGS_KEY,
} from "../shared/lib/metisStorageKeys";
import type {
  MetisAccessState,
  MetisLocalSettings,
  MetisSiteAccessState
} from "../shared/types/audit";
import type { MetisRuntimeMessage, MetisTabSessionState } from "../shared/types/runtime";

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

function Section({
  icon: Icon,
  title,
  detail,
  children
}: {
  icon: typeof Gauge;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[20px] border px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: "rgba(220,94,94,0.12)",
            border: "1px solid rgba(220,94,94,0.2)"
          }}
        >
          <Icon size={14} style={{ color: "#dc8d72" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 18 }}>
            {title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.52)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: "18px",
              marginTop: 5
            }}
          >
            {detail}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function PillButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-2"
      style={{
        background: active ? "#dc5e5e" : "rgba(255,255,255,0.06)",
        border: active ? "1px solid rgba(220,94,94,0.34)" : "1px solid rgba(255,255,255,0.08)",
        color: active ? "white" : "rgba(255,255,255,0.72)",
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        fontWeight: 700
      }}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  title,
  detail,
  active,
  onClick
}: {
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[16px] px-3 py-3 text-left"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="min-w-0">
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
          {title}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "16px",
            marginTop: 4
          }}
        >
          {detail}
        </div>
      </div>
      <div
        className="rounded-full px-3 py-1.5"
        style={{
          background: active ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.08)",
          color: active ? "#4ade80" : "rgba(255,255,255,0.55)",
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          fontWeight: 700
        }}
      >
        {active ? "On" : "Off"}
      </div>
    </button>
  );
}

function PermissionAbilityRow({
  settings,
  siteAccess,
  selectedId,
  onSelect,
  onToggle
}: {
  settings: MetisLocalSettings;
  siteAccess: MetisSiteAccessState;
  selectedId: PermissionControlId;
  onSelect: (id: PermissionControlId) => void;
  onToggle: (id: PermissionControlId) => Promise<void> | void;
}) {
  const controls = buildPermissionControls(settings, {
    expandedSiteAccessActive: siteAccess.isGranted
  });
  const selected =
    controls.find((control) => control.id === selectedId) ?? controls[0];
  const enabledCount = controls.filter((control) => control.active).length;

  return (
    <div className="space-y-3">
      <div
        className="rounded-[16px] border px-3 py-3"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", minHeight: 94 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
              Permission ability
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.54)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                marginTop: 4
              }}
            >
              {enabledCount} of {controls.length} capabilities active
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
            {selected.ability}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {controls.map((control) => {
          return (
            <button
              key={control.id}
              type="button"
              onMouseEnter={() => onSelect(control.id)}
              onFocus={() => onSelect(control.id)}
              onClick={() => {
                void onToggle(control.id);
              }}
              className="inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-2"
              style={{
                background:
                  selected.id === control.id ? "rgba(220,94,94,0.12)" : "rgba(255,255,255,0.03)",
                borderColor:
                  selected.id === control.id ? "rgba(220,94,94,0.24)" : "rgba(255,255,255,0.07)"
              }}
            >
              <span style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                {control.title}
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  background: control.active ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.08)",
                  color: control.active ? "#4ade80" : "rgba(255,255,255,0.55)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 10,
                  fontWeight: 700
                }}
              >
                {control.active ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-[16px] border px-3 py-3"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
            {selected.title}
          </div>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.56)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "16px",
            marginTop: 6
          }}
        >
          {selected.description}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  destructive = false,
  children,
  onClick
}: {
  destructive?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2"
      style={{
        background: destructive ? "rgba(220,94,94,0.12)" : "rgba(255,255,255,0.06)",
        border: destructive
          ? "1px solid rgba(220,94,94,0.22)"
          : "1px solid rgba(255,255,255,0.08)",
        color: destructive ? "#dc8d72" : "rgba(255,255,255,0.76)",
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        fontWeight: 700
      }}
    >
      {children}
    </button>
  );
}

function LinkCard({
  href,
  title,
  detail
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 rounded-[16px] px-3 py-3 no-underline"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div className="min-w-0">
        <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
          {title}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "16px",
            marginTop: 4
          }}
        >
          {detail}
        </div>
      </div>
      <ExternalLink size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
    </a>
  );
}

function PopupApp() {
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const [siteAccess, setSiteAccess] = useState<MetisSiteAccessState>(getDefaultMetisSiteAccessState());
  const [selectedPermissionId, setSelectedPermissionId] = useState<PermissionControlId>("basicScan");
  const [ready, setReady] = useState(false);
  const [savedPageCount, setSavedPageCount] = useState(0);
  const [siteHistory, setSiteHistory] = useState<SiteHistorySummary>({
    baselineOriginCount: 0,
    visitedOriginCount: 0
  });
  const [accessState, setAccessState] = useState<MetisAccessState>(deriveAccessStateFromBridgeAccount(null));
  const [connectedAccountName, setConnectedAccountName] = useState("Website account");
  const [connectedAccountEmail, setConnectedAccountEmail] = useState<string | null>(null);
  const [connectedAccountScansUsed, setConnectedAccountScansUsed] = useState(0);
  const [connectedAccountSitesTracked, setConnectedAccountSitesTracked] = useState(0);
  const [activeOriginForLocalData, setActiveOriginForLocalData] = useState<string | null>(null);
  const [bridgeDebug, setBridgeDebug] = useState<Awaited<ReturnType<typeof getBridgeStorageDebugSnapshot>>>(null);
  const scanBehaviorRef = useRef<HTMLDivElement | null>(null);
  const previousAuthStateRef = useRef(false);
  const previousAccountEmailRef = useRef<string | null>(null);

  const extensionVersion = useMemo(() => chrome.runtime.getManifest().version, []);
  const showBridgeDebug = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "bridge",
    []
  );

  const refreshStorageState = async () => {
    const [pageSummary, siteSummary, bridgeState, bridgeSnapshot, siteAccessResponse] = await Promise.all([
      getPageScanStoreSummary(),
      getSiteHistorySummary(),
      getStoredBridgeState(),
      getBridgeStorageDebugSnapshot(),
      sendRuntimeMessage<{ ok?: boolean; siteAccess?: MetisSiteAccessState }>({
        type: "METIS_GET_SITE_ACCESS_STATE"
      })
    ]);

    setSavedPageCount(pageSummary.savedPageCount);
    setSiteHistory(siteSummary);
    setAccessState(deriveAccessStateFromBridgeAccount(bridgeState?.account ?? null));
    const connectedAccount = buildConnectedAccountFromBridge(bridgeState?.account ?? null);
    setConnectedAccountName(connectedAccount?.displayName ?? "Website account");
    setConnectedAccountEmail(connectedAccount?.email ?? null);
    setConnectedAccountScansUsed(bridgeState?.account.scansUsed ?? 0);
    setConnectedAccountSitesTracked(bridgeState?.account.sitesTracked ?? 0);
    setActiveOriginForLocalData(
      pageSummary.latestCapturedSnapshot?.url
        ? new URL(pageSummary.latestCapturedSnapshot.url).origin
        : null
    );
    setBridgeDebug(bridgeSnapshot);
    setSiteAccess(siteAccessResponse?.siteAccess ?? getDefaultMetisSiteAccessState());
  };

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getMetisLocalSettings(),
      getPageScanStoreSummary(),
      getSiteHistorySummary(),
      getStoredBridgeState(),
      getBridgeStorageDebugSnapshot(),
      sendRuntimeMessage<{ ok?: boolean; siteAccess?: MetisSiteAccessState }>({
        type: "METIS_GET_SITE_ACCESS_STATE"
      }),
    ]).then(
      ([storedSettings, pageSummary, siteSummary, bridgeState, bridgeSnapshot, siteAccessResponse]) => {
        if (cancelled) {
          return;
        }

        setSettings(storedSettings);
        setSavedPageCount(pageSummary.savedPageCount);
        setSiteHistory(siteSummary);
        setAccessState(deriveAccessStateFromBridgeAccount(bridgeState?.account ?? null));
        const connectedAccount = buildConnectedAccountFromBridge(bridgeState?.account ?? null);
        setConnectedAccountName(connectedAccount?.displayName ?? "Website account");
        setConnectedAccountEmail(connectedAccount?.email ?? null);
        setConnectedAccountScansUsed(bridgeState?.account.scansUsed ?? 0);
        setConnectedAccountSitesTracked(bridgeState?.account.sitesTracked ?? 0);
        setActiveOriginForLocalData(
          pageSummary.latestCapturedSnapshot?.url
            ? new URL(pageSummary.latestCapturedSnapshot.url).origin
            : null
        );
        setBridgeDebug(bridgeSnapshot);
        setSiteAccess(siteAccessResponse?.siteAccess ?? getDefaultMetisSiteAccessState());
        setReady(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void saveMetisLocalSettings(settings);
  }, [ready, settings]);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      if (
        changes[METIS_USER_SETTINGS_KEY] ||
        changes[LEGACY_METIS_USER_SETTINGS_KEY] ||
        changes[METIS_ACCOUNT_STATE_KEY] ||
        changes[METIS_BRIDGE_DEBUG_KEY] ||
        changes[METIS_CONNECTED_AT_KEY] ||
        changes[METIS_BRIDGE_VERSION_KEY]
      ) {
        void refreshStorageState();
        void getMetisLocalSettings().then(setSettings);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleRuntimeMessage = (message: MetisRuntimeMessage) => {
      if (
        message.type === "METIS_AUTH_STATE_CHANGED" ||
        message.type === "METIS_SESSION_CHANGED"
      ) {
        void refreshStorageState();
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      previousAuthStateRef.current = accessState.isAuthenticated;
      previousAccountEmailRef.current = connectedAccountEmail;
      return;
    }

    if (!previousAuthStateRef.current && accessState.isAuthenticated) {
      toast.success("Connected to Metis ✓", {
        description: "Your website account is now linked in the extension."
      });
    }

    if (
      previousAuthStateRef.current &&
      accessState.isAuthenticated &&
      previousAccountEmailRef.current &&
      connectedAccountEmail &&
      previousAccountEmailRef.current !== connectedAccountEmail
    ) {
      toast.message(`Switched to ${connectedAccountEmail}`, {
        description: "The website sent a newer account snapshot and replaced the cached extension account."
      });
    }

    previousAuthStateRef.current = accessState.isAuthenticated;
    previousAccountEmailRef.current = connectedAccountEmail;
  }, [accessState.isAuthenticated, connectedAccountEmail, ready]);

  const handleClearSnapshots = async () => {
    await clearPageScanStore();
    await refreshStorageState();
    toast.success("Saved snapshots cleared");
  };

  const handleClearCurrentWebsiteData = async () => {
    if (!activeOriginForLocalData) {
      toast.message("No current website data", {
        description: "Capture a page first so Metis knows which website origin to clear."
      });
      return;
    }

    await Promise.all([
      clearPageScansForOrigin(activeOriginForLocalData),
      clearSiteHistoryForOrigin(activeOriginForLocalData),
    ]);
    await refreshStorageState();
    toast.success("Current website data cleared", {
      description: `${activeOriginForLocalData} was removed from local Metis storage.`
    });
  };

  const handleClearHistory = async () => {
    await clearAllSiteHistory();
    await refreshStorageState();
    toast.success("All local history cleared");
  };

  const handleTogglePermission = async (permissionId: PermissionControlId) => {
    switch (permissionId) {
      case "basicScan":
        setSettings((current) => ({
          ...current,
          basicScanEnabled: !current.basicScanEnabled
        }));
        return;
      case "expandedSiteAccess": {
        if (siteAccess.isGranted) {
          const response = await sendRuntimeMessage<{
            ok?: boolean;
            siteAccess?: MetisTabSessionState["siteAccess"];
          }>({
            type: "METIS_REMOVE_SITE_ACCESS"
          });

          setSiteAccess(response?.siteAccess ?? getDefaultMetisSiteAccessState());
          await refreshStorageState();
          return;
        }

        if (!siteAccess.canRequest) {
          toast.message("Site access is unavailable here", {
            description: "Chrome blocks expanded access on restricted pages."
          });
          return;
        }

        const response = await sendRuntimeMessage<{
          ok?: boolean;
          siteAccess?: MetisTabSessionState["siteAccess"];
        }>({
          type: "METIS_REQUEST_SITE_ACCESS"
        });

        setSiteAccess(response?.siteAccess ?? getDefaultMetisSiteAccessState());
        await refreshStorageState();
        return;
      }
      case "localHistory":
        setSettings((current) => ({
          ...current,
          localHistoryEnabled: !current.localHistoryEnabled
        }));
        return;
      case "bridgeRepair":
        setSettings((current) => ({
          ...current,
          bridgeRepairEnabled: !current.bridgeRepairEnabled
        }));
        return;
      case "sidePanelWorkspace":
        setSettings((current) => ({
          ...current,
          attachedWorkspaceEnabled: !current.attachedWorkspaceEnabled
        }));
        return;
    }
  };

  const handleOpenMetisPanel = async () => {
    const response = await sendRuntimeMessage<{ ok?: boolean }>({
      type: "METIS_OPEN_PANEL_FROM_POPUP"
    });

    if (response?.ok) {
      window.close();
      return;
    }

    toast.error("Metis could not open the panel", {
      description: "Refresh the page and try again from the popup."
    });
  };

  const handleOpenSignIn = async () => {
    console.info("[Metis bridge] popup requested sign-in", {
      runtimeId: chrome.runtime.id,
    });
    await sendRuntimeMessage({
      type: "METIS_OPEN_SIGN_IN",
      source: "popup"
    });
    toast.message("Open Metis to finish sign in", {
      description: "Finish the website flow, then return here for the connected signal."
    });
  };

  const handleDisconnectAccount = async () => {
    const response = await sendRuntimeMessage<{ ok?: boolean }>({
      type: "METIS_DISCONNECT_ACCOUNT"
    });

    if (response?.ok) {
      await refreshStorageState();
      toast.success("Disconnected account", {
        description: "The extension cache is cleared. Your website session stays signed in."
      });
      return;
    }

    await clearBridgeAccountState();
    await refreshStorageState();
    toast.success("Disconnected account", {
      description: "The extension cache is cleared. Your website session stays signed in."
    });
  };

  return (
    <div
      className="relative flex h-[640px] w-[380px] flex-col px-4 py-4"
      style={{
        background: "#0d1825",
        color: "white"
      }}
    >
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#101c2b",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px"
          }
        }}
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div style={{ color: "#dc8d72", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Metis
          </div>
          <div style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 28, marginTop: 6 }}>
            Settings
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.54)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: "18px",
              marginTop: 8
            }}
          >
            Trust, storage, and fallback controls for the current beta.
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1.5"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.54)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          v{extensionVersion}
        </div>
      </div>

      <div className="mb-4 flex justify-center">
        <ActionButton onClick={() => void handleOpenMetisPanel()}>
          <LayoutDashboard size={14} />
          Open Metis panel
        </ActionButton>
      </div>

      <div className="metis-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 pb-16">
        <Section
          icon={UserRound}
          title="Account"
          detail="Account identity and dashboard access stay on the Metis website."
        >
          <div
            className="rounded-[16px] border px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
              {accessState.isAuthenticated ? "Connected to Metis ✓" : "Sign in to unlock full insights"}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.52)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                lineHeight: "16px",
                marginTop: 6
              }}
            >
              {accessState.isAuthenticated
                ? `Tier: ${accessState.tier.replace("_", " ")}`
                : "The extension keeps scanning locally, but account-linked access starts on the website."}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Username
              </div>
              <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                {accessState.isAuthenticated ? connectedAccountName : "Not connected"}
              </div>
            </div>
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Email
              </div>
              <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                {accessState.isAuthenticated ? connectedAccountEmail ?? "No email returned" : "Sign in required"}
              </div>
            </div>
          </div>
          <div
            className="rounded-[16px] border px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Scan usage
                </div>
                <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700 }}>
                  {accessState.isAuthenticated ? connectedAccountScansUsed : 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Sites tracked
                </div>
                <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700 }}>
                  {accessState.isAuthenticated ? connectedAccountSitesTracked : 0}
                </div>
              </div>
            </div>
          </div>
          {!accessState.isAuthenticated ? (
            <ActionButton onClick={() => void handleOpenSignIn()}>
              <Mail size={12} />
              Sign in
            </ActionButton>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <a
              href={METIS_ACCOUNT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 no-underline"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.82)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <LayoutDashboard size={12} />
              Manage account
            </a>
            {accessState.isAuthenticated ? (
              <ActionButton destructive onClick={() => void handleDisconnectAccount()}>
                <Trash2 size={12} />
                Disconnect account
              </ActionButton>
            ) : null}
          </div>
          {showBridgeDebug ? (
          <div
            className="rounded-[16px] border px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
              Bridge debug
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.52)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                lineHeight: "16px",
                marginTop: 6
              }}
            >
              {bridgeDebug?.bridgeDebug?.lastStatus
                ? `Last status: ${bridgeDebug.bridgeDebug.lastStatus}`
                : "No bridge attempt stored yet."}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Stored account
                </div>
                <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                  {bridgeDebug?.accountState ? "Present" : "Missing"}
                </div>
              </div>
              <div>
                <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Last event
                </div>
                <div className="mt-2 text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
                  {bridgeDebug?.bridgeDebug?.updatedAt
                    ? new Date(bridgeDebug.bridgeDebug.updatedAt).toLocaleTimeString()
                    : "Never"}
                </div>
              </div>
            </div>
            {bridgeDebug?.bridgeDebug?.lastFailureReason ? (
              <div
                className="mt-3 rounded-[12px] border px-3 py-3"
                style={{
                  background: "rgba(220,94,94,0.08)",
                  borderColor: "rgba(220,94,94,0.18)",
                }}
              >
                <div style={{ color: "#ffd4d4", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Failure
                </div>
                <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                  {bridgeDebug.bridgeDebug.lastFailureReason}
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif", fontSize: 11, lineHeight: "16px", marginTop: 6 }}>
                  {bridgeDebug.bridgeDebug.lastFailureDetail ?? "No detail returned."}
                </div>
              </div>
            ) : null}
          </div>
          ) : null}
        </Section>

        <div ref={scanBehaviorRef}>
          <Section
            icon={Gauge}
            title="Scan behavior"
            detail="Keep scan behavior explicit and lightweight."
          >
            <ToggleRow
              title="Auto-rescan while panel open"
              detail="Route changes still rescan even when steady refresh is off."
              active={settings.autoRescanWhilePanelOpen}
              onClick={() =>
                setSettings({
                  ...settings,
                  autoRescanWhilePanelOpen: !settings.autoRescanWhilePanelOpen
                })
              }
            />
            <div className="space-y-2">
              <div className="text-white/55" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>
                Scan delay
              </div>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  active={settings.scanDelayProfile === "fast"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "fast" })}
                >
                  Fast
                </PillButton>
                <PillButton
                  active={settings.scanDelayProfile === "balanced"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "balanced" })}
                >
                  Balanced
                </PillButton>
                <PillButton
                  active={settings.scanDelayProfile === "thorough"}
                  onClick={() => setSettings({ ...settings, scanDelayProfile: "thorough" })}
                >
                  Thorough
                </PillButton>
              </div>
            </div>
          </Section>
        </div>

        <Section
          icon={Database}
          title="Data"
          detail="Metis stores scan history locally on this device and clears it by website origin."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Saved snapshots
              </div>
              <div className="metis-display mt-2 text-white" style={{ fontSize: 22 }}>
                {savedPageCount}
              </div>
            </div>
            <div className="rounded-[16px] border px-3 py-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-white/45" style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Site history
              </div>
              <div className="metis-display mt-2 text-white" style={{ fontSize: 22 }}>
                {siteHistory.visitedOriginCount}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton destructive onClick={() => void handleClearCurrentWebsiteData()}>
              <Trash2 size={11} />
              Clear current website data
            </ActionButton>
            <ActionButton destructive onClick={() => void handleClearSnapshots()}>
              <Trash2 size={11} />
              Clear all snapshots
            </ActionButton>
            <ActionButton destructive onClick={() => void handleClearHistory()}>
              <Trash2 size={11} />
              Clear all local history
            </ActionButton>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.52)",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              lineHeight: "16px",
            }}
          >
            {activeOriginForLocalData
              ? `Current website scope: ${activeOriginForLocalData}`
              : "Current website scope appears after Metis captures a page on this device."}
          </div>
        </Section>

        <Section
          icon={Shield}
          title="Permissions"
          detail="Turn Metis capabilities on or off here without leaving the extension."
        >
          <PermissionAbilityRow
            settings={settings}
            siteAccess={siteAccess}
            selectedId={selectedPermissionId}
            onSelect={setSelectedPermissionId}
            onToggle={handleTogglePermission}
          />
          <div
            className="rounded-[16px] border px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700 }}>
              Expanded site access
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.52)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                lineHeight: "16px",
                marginTop: 6
              }}
            >
              {siteAccess.isGranted && siteAccess.origin
                ? `Enabled for ${siteAccess.origin}`
                : siteAccess.isRestricted
                  ? "Chrome blocks site access on this page."
                  : "Basic scan stays available until you allow deeper scan for this site."}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {siteAccess.isGranted ? (
                <ActionButton destructive onClick={() => void handleTogglePermission("expandedSiteAccess")}>
                  <Trash2 size={11} />
                  Remove access for this site
                </ActionButton>
              ) : (
                <ActionButton onClick={() => void handleTogglePermission("expandedSiteAccess")}>
                  <Shield size={12} />
                  Allow on this site
                </ActionButton>
              )}
            </div>
          </div>
        </Section>

        <Section
          icon={Sparkles}
          title="About"
          detail="A quick way to reach the product site, legal pages, and account access."
        >
          <div className="space-y-2">
            <LinkCard
              href={METIS_SITE_URL}
              title="Metis site"
              detail="Product overview, current direction, and website entry."
            />
            <LinkCard
              href={METIS_PRIVACY_URL}
              title="Privacy"
              detail="Current privacy policy."
            />
            <LinkCard
              href={METIS_TERMS_URL}
              title="Terms"
              detail="Current terms of use."
            />
            <LinkCard
              href={METIS_ACCOUNT_URL}
              title="Manage account"
              detail="Open website account access and Plus Beta entry."
            />
          </div>
        </Section>
        <div className="h-8" />
      </div>
    </div>
  );
}

const root = document.getElementById("metis-react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <PopupApp />
    </StrictMode>
  );
}
