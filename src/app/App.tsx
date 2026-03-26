import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, FileText, RefreshCcw } from "lucide-react";
import { toast, Toaster } from "sonner";
import { assessControl } from "../features/control/control";
import { detectIssues } from "../features/detection";
import { buildInsight } from "../features/insights";
import { buildPlusOptimizationReport } from "../features/refinement";
import {
  PLUS_CORE_KEYS,
  PLUS_QUESTION_DEFINITIONS
} from "../features/refinement/config";
import { buildMultipageSnapshot } from "../features/scan";
import { scoreSnapshot } from "../features/scoring";
import { detectMoneyStack } from "../features/stack";
import type {
  MetisLocalSettings,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../shared/types/audit";
import type { ScanScope } from "./useMetisState";
import {
  clearPageScanStore,
  getPageScanStoreSummary
} from "../shared/lib/pageScanHistory";
import { clearVisitedSiteSnapshots } from "../shared/lib/siteBaseline";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings,
  saveMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import type {
  MetisRuntimeMessage,
  MetisSessionPanelMode,
  MetisTabSessionState
} from "../shared/types/runtime";
import { FullReportLayout } from "./components/figures/FullReportLayout";
import { buildExportOutlineText, buildExportReportDocument } from "./components/figures/exportDocument";
import {
  ExportArchitectureModal,
  LocalSettingsModal
} from "./components/figures/MetisUtilityModals";
import { PanelLayout } from "./components/figures/PanelLayout";
import {
  CopyReportButton,
  PlusUpgradeModal,
  ProfileButton,
  WhatJustHappened
} from "./components/figures/PrototypeChrome";
import { buildMetisDesignViewModel } from "./components/figures/liveAdapter";

function buildCurrentSnapshot(
  rawSnapshot: RawScanSnapshot | null,
  visitedSnapshots: RawScanSnapshot[],
  scanScope: ScanScope
) {
  if (!rawSnapshot) {
    return null;
  }

  if (scanScope === "multi") {
    return buildMultipageSnapshot(rawSnapshot, visitedSnapshots);
  }

  return rawSnapshot;
}

function buildAutoRefinementAnswers(
  snapshot: RawScanSnapshot | null
): Partial<PlusRefinementAnswers> {
  if (!snapshot) {
    return {};
  }

  const detection = detectMoneyStack(snapshot, {});
  const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
  const aiGroup = detection.groups.find((group) => group.id === "aiProviders");
  const analyticsGroup = detection.groups.find((group) => group.id === "analyticsAdsRum");

  const hostingVendorId = hostingGroup?.vendors[0]?.id;
  const aiVendorId = aiGroup?.vendors[0]?.id;
  const analyticsVendorId = analyticsGroup?.vendors[0]?.id;

  return {
    hostingProvider:
      hostingVendorId === "vercel"
        ? "vercel"
        : hostingVendorId === "cloudflare"
          ? "cloudflare"
          : hostingVendorId === "cloudfront" ||
              hostingVendorId === "aws" ||
              hostingVendorId === "aws-s3" ||
              hostingVendorId === "aws-api-gateway"
            ? "aws"
            : undefined,
    stackCdnProvider:
      hostingVendorId === "cloudflare"
        ? "cloudflare"
        : hostingVendorId === "cloudfront"
          ? "cloudfront"
          : hostingVendorId === "vercel"
            ? "vercelEdge"
            : undefined,
    stackAiProvider:
      aiVendorId === "openai"
        ? "openai"
        : aiVendorId === "anthropic"
          ? "anthropic"
          : aiVendorId === "googleAi"
            ? "google"
            : undefined,
    stackAnalytics:
      analyticsVendorId === "ga4"
        ? "ga4"
        : analyticsVendorId === "gtm"
          ? "gtm"
          : analyticsVendorId === "amazonAds"
            ? "amazonAdvertising"
            : analyticsVendorId === "cloudwatchRum"
              ? "cloudwatchRum"
              : analyticsVendorId === "metaPixel"
                ? "metaPixel"
                : analyticsVendorId === "segment"
                  ? "segment"
                  : analyticsVendorId === "plausible"
                    ? "plausible"
                    : analyticsVendorId === "mixpanel"
                      ? "mixpanel"
                      : undefined
  };
}

function buildReportCopyText(hostname: string, viewModel: ReturnType<typeof buildMetisDesignViewModel>) {
  return [
    `Metis Cost Report — ${hostname}`,
    `Risk Score: ${viewModel.score}/100 (${viewModel.riskLabel})`,
    `Control: ${viewModel.controlScore}/100 (${viewModel.controlLabel})`,
    `Estimated waste: ${viewModel.estimateRange}`,
    viewModel.estimateSourceNote ?? null,
    `Session cost: ${viewModel.sessionCost} · At 10k users: ${viewModel.monthlyProjection}`,
    `Top issues: ${viewModel.topIssues.map((issue) => issue.title).join(", ") || "No major issues surfaced"}`,
    `Quick insight: ${viewModel.quickInsight}`,
    viewModel.controlReasons.length > 0
      ? `Control reasons: ${viewModel.controlReasons.join(" | ")}`
      : null,
    "— Scanned by Metis (ward.studio/metis)"
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
}

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

function deriveOrigin(url: string | null) {
  if (!url) {
    return window.location.origin;
  }

  try {
    return new URL(url).origin;
  } catch {
    return window.location.origin;
  }
}

function SidePanelHeader({
  hostname,
  onOpenReport,
  onUpgrade,
  onSettings,
  isPlusUser
}: {
  hostname: string;
  onOpenReport: () => void;
  onUpgrade: () => void;
  onSettings: () => void;
  isPlusUser: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between border-b px-4 py-4"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="min-w-0">
        <div
          className="text-white"
          style={{ fontFamily: "Jua, sans-serif", fontSize: 22 }}
        >
          Metis
        </div>
        <div
          className="truncate"
          style={{
            color: "rgba(255,255,255,0.38)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11
          }}
        >
          {hostname}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={onOpenReport}
          className="rounded-full px-3 py-2"
          style={{
            background: "rgba(220,94,94,0.12)",
            border: "1px solid rgba(220,94,94,0.25)",
            color: "#dc8d72",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            Full Report
          </div>
        </motion.button>
        <ProfileButton
          onUpgrade={onUpgrade}
          onSettings={onSettings}
          isPlusUser={isPlusUser}
          onDark
        />
      </div>
    </div>
  );
}

function ReconnectState({
  ready,
  onReconnect
}: {
  ready: boolean;
  onReconnect: () => void;
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 py-8"
      style={{ background: "#0d1825" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "rgba(249,115,22,0.12)",
          border: "1px solid rgba(249,115,22,0.24)"
        }}
      >
        <AlertTriangle size={20} style={{ color: "#f97316" }} />
      </div>
      <div
        className="mt-5 text-center text-white"
        style={{ fontFamily: "Jua, sans-serif", fontSize: 24 }}
      >
        {ready ? "Start Metis on this page" : "Reconnect to this page"}
      </div>
      <div
        className="mt-3 max-w-[320px] text-center"
        style={{
          color: "rgba(255,255,255,0.56)",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          lineHeight: "20px"
        }}
      >
        {ready
          ? "Click the page hover or reconnect here to start the tab session and stream live scan data into the side panel."
          : "The page bridge is not ready yet. Reconnect Metis to refresh the current tab and resume live updates."}
      </div>
      <motion.button
        type="button"
        onClick={onReconnect}
        className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3"
        style={{
          background: "#dc5e5e",
          color: "white",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 700
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <RefreshCcw size={14} />
        Reconnect
      </motion.button>
    </div>
  );
}

export default function App() {
  const sidePanelPresencePortRef = useRef<chrome.runtime.Port | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [session, setSession] = useState<MetisTabSessionState | null>(null);
  const [panelMode, setPanelMode] = useState<MetisSessionPanelMode>("mini");
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [plusAnswers, setPlusAnswers] = useState<PlusRefinementAnswers>({});
  const [isPlusRefinementOpen, setIsPlusRefinementOpen] = useState(false);
  const [isPlusModalOpen, setIsPlusModalOpen] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [savedPageCount, setSavedPageCount] = useState(0);

  const rawSnapshot = session?.rawSnapshot ?? null;
  const visitedSnapshots = session?.visitedSnapshots ?? [];
  const activeSnapshot = buildCurrentSnapshot(rawSnapshot, visitedSnapshots, scanScope);
  const inferredAnswers = useMemo(
    () => buildAutoRefinementAnswers(activeSnapshot),
    [activeSnapshot]
  );
  const effectiveAnswers = useMemo(
    () => ({
      ...inferredAnswers,
      ...plusAnswers
    }),
    [inferredAnswers, plusAnswers]
  );
  const issues = activeSnapshot ? detectIssues(activeSnapshot, effectiveAnswers) : [];
  const control = activeSnapshot ? assessControl(activeSnapshot, issues, effectiveAnswers) : null;
  const score = activeSnapshot ? scoreSnapshot(activeSnapshot, issues) : null;
  const insight =
    activeSnapshot && score ? buildInsight(activeSnapshot, issues, score) : null;
  const plusReport =
    activeSnapshot && score && insight
      ? buildPlusOptimizationReport(insight, activeSnapshot, issues, score, effectiveAnswers)
      : null;
  const pageCount = Math.max(visitedSnapshots.length, 1);
  const viewModel =
    activeSnapshot && score && control
      ? buildMetisDesignViewModel({
          snapshot: activeSnapshot,
          issues,
          control,
          score,
          insight,
          scope: scanScope,
          pageCount,
          answers: effectiveAnswers,
          plusReport,
          requiredQuestionCount: PLUS_CORE_KEYS.length
        })
      : null;
  const exportDocument = viewModel ? buildExportReportDocument(viewModel) : null;
  const questionDefinitions = useMemo(() => {
    const baseDefinitions = PLUS_QUESTION_DEFINITIONS.filter((definition) => {
      if (!definition.dependsOn) {
        return true;
      }

      return effectiveAnswers[definition.dependsOn.key] === definition.dependsOn.value;
    });

    return [...baseDefinitions, ...(viewModel?.stackQuestionDefinitions ?? [])].filter(
      (definition) => effectiveAnswers[definition.key] === undefined
    );
  }, [effectiveAnswers, viewModel?.stackQuestionDefinitions]);
  const currentQuestion =
    questionDefinitions.find((definition) => plusAnswers[definition.key] === undefined) ?? null;
  const answeredQuestions = useMemo(
    () =>
      questionDefinitions.filter((definition) => plusAnswers[definition.key] !== undefined),
    [plusAnswers, questionDefinitions]
  );
  const previousQuestion = answeredQuestions[answeredQuestions.length - 1] ?? null;

  const refreshSavedPageSummary = async () => {
    const summary = await getPageScanStoreSummary();
    setSavedPageCount(summary.savedPageCount);
  };

  const refreshActiveSession = async () => {
    const response = await sendRuntimeMessage<{
      ok: boolean;
      tabId: number | null;
      session: MetisTabSessionState | null;
    }>({
      type: "METIS_GET_ACTIVE_TAB_SESSION"
    });

    if (!response?.ok) {
      return;
    }

    setActiveTabId(response.tabId ?? null);
    setSession(response.session ?? null);

    const uiState = response.session?.uiState ?? null;
    if (uiState) {
      setPanelMode(uiState.panelMode);
      setScanScope(uiState.scanScope);
      setPlusAnswers(uiState.plusAnswers);
      setIsPlusRefinementOpen(uiState.isPlusRefinementOpen);
    } else {
      setPanelMode("mini");
      setScanScope(settings.preferredScanScope);
      setPlusAnswers({});
      setIsPlusRefinementOpen(false);
    }
  };

  const patchSessionUi = async (patch: {
    panelMode?: MetisSessionPanelMode;
    scanScope?: ScanScope;
    plusAnswers?: PlusRefinementAnswers;
    isPlusRefinementOpen?: boolean;
  }) => {
    await sendRuntimeMessage({
      type: "METIS_PATCH_TAB_SESSION",
      patch
    });
  };

  useEffect(() => {
    const port = chrome.runtime.connect({
      name: "metis-sidepanel-presence"
    });

    sidePanelPresencePortRef.current = port;

    return () => {
      sidePanelPresencePortRef.current = null;
      port.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeTabId || !sidePanelPresencePortRef.current) {
      return;
    }

    sidePanelPresencePortRef.current.postMessage({
      tabId: activeTabId
    });
  }, [activeTabId]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getMetisLocalSettings(), getPageScanStoreSummary()]).then(
      ([storedSettings, summary]) => {
        if (cancelled) {
          return;
        }

        setSettings(storedSettings);
        setSavedPageCount(summary.savedPageCount);
        setSettingsReady(true);
      }
    );

    void refreshActiveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    void saveMetisLocalSettings(settings);
  }, [settings, settingsReady]);

  useEffect(() => {
    if (!activeTabId) {
      return;
    }

    void sendRuntimeMessage({
      type: "METIS_SET_PANEL_VISIBILITY",
      tabId: activeTabId,
      isOpen: true
    });

    return () => {
      void sendRuntimeMessage({
        type: "METIS_SET_PANEL_VISIBILITY",
        tabId: activeTabId,
        isOpen: false
      });
    };
  }, [activeTabId]);

  useEffect(() => {
    const handleRuntimeMessage = (message: unknown) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }

      const runtimeMessage = message as MetisRuntimeMessage;

      if (
        runtimeMessage.type === "METIS_SESSION_CHANGED" ||
        runtimeMessage.type === "METIS_RECONNECT_REQUIRED"
      ) {
        void refreshActiveSession();
      }
    };

    const handleActivated = () => {
      void refreshActiveSession();
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.windows.onFocusChanged.addListener(handleActivated);

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.windows.onFocusChanged.removeListener(handleActivated);
    };
  }, [activeTabId]);

  useEffect(() => {
    if (!session?.lastUpdatedAt) {
      return;
    }

    void refreshSavedPageSummary();
  }, [session?.lastUpdatedAt]);

  const handleSetPanelMode = (mode: MetisSessionPanelMode) => {
    setPanelMode(mode);
    void patchSessionUi({ panelMode: mode });
  };

  const handleSetScanScope = (scope: ScanScope) => {
    setScanScope(scope);
    void patchSessionUi({ scanScope: scope });
  };

  const handleAnswer = (key: keyof PlusRefinementAnswers, value: string) => {
    const nextAnswers = {
      ...plusAnswers,
      [key]: value
    };

    setPlusAnswers(nextAnswers);
    void patchSessionUi({ plusAnswers: nextAnswers });
  };

  const handleBackQuestion = () => {
    if (!previousQuestion) {
      return;
    }

    const nextAnswers = {
      ...plusAnswers,
      [previousQuestion.key]: undefined
    };

    setPlusAnswers(nextAnswers);
    void patchSessionUi({ plusAnswers: nextAnswers });
  };

  const handleCopyReport = async () => {
    if (!viewModel) {
      return;
    }

    await navigator.clipboard.writeText(
      buildReportCopyText(activeSnapshot?.page.hostname ?? "current-page", viewModel)
    );

    toast.success("Report copied", {
      description: "Metis copied the current report summary to your clipboard."
    });
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleOpenExport = () => {
    if (!viewModel) {
      return;
    }

    setIsExportOpen(true);
  };

  const handleCopyExportOutline = async () => {
    if (!viewModel) {
      return;
    }

    const document = buildExportReportDocument(viewModel);
    await navigator.clipboard.writeText(buildExportOutlineText(document));
    toast.success("Export outline copied", {
      description: "The current export document shape is now on your clipboard."
    });
  };

  const handleClearSavedScans = async () => {
    await clearPageScanStore();
    await refreshSavedPageSummary();
    toast.success("Saved scan history cleared", {
      description: "Metis removed stored page snapshots from this device."
    });
  };

  const handleResetCurrentSiteProgress = async () => {
    await clearVisitedSiteSnapshots(deriveOrigin(session?.currentUrl ?? null));
    toast.success("Current-site progress reset", {
      description: "Metis will rebuild sampled-page progress for this origin from the next scan."
    });
  };

  const handleReconnect = async () => {
    const response = await sendRuntimeMessage<{ ok: boolean }>({
      type: "METIS_RECONNECT_ACTIVE_TAB"
    });

    if (!response?.ok) {
      toast.error("Reconnect failed", {
        description: "Metis could not reattach to the current tab."
      });
      return;
    }

    toast.success("Reconnecting", {
      description: "Metis is rebuilding the page bridge for this tab."
    });
  };

  return (
    <div
      className="flex h-screen flex-col"
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
            fontSize: "13px"
          }
        }}
      />

      {!session?.isActive ? (
        <ReconnectState ready={Boolean(session?.bridgeStatus === "ready")} onReconnect={() => void handleReconnect()} />
      ) : panelMode === "full" ? (
        <div className="h-full">
          <FullReportLayout
            viewModel={viewModel}
            scanScope={scanScope}
            onSetScanScope={handleSetScanScope}
            currentQuestion={currentQuestion}
            plusAnswers={plusAnswers}
            isRefinementOpen={isPlusRefinementOpen}
            setIsRefinementOpen={(value) => {
              setIsPlusRefinementOpen(value);
              void patchSessionUi({ isPlusRefinementOpen: value });
            }}
            onAnswer={handleAnswer}
            onBackQuestion={handleBackQuestion}
            canGoBack={previousQuestion !== null}
            onCopyReport={() => {
              void handleCopyReport();
            }}
            onUpgrade={() => setIsPlusModalOpen(true)}
            isPlusUser={isPlusUser}
            headerAccessory={
              <ProfileButton
                onUpgrade={() => setIsPlusModalOpen(true)}
                onSettings={handleOpenSettings}
                isPlusUser={isPlusUser}
                onDark
              />
            }
            refreshTick={0}
            onClose={() => handleSetPanelMode("mini")}
            showSampleProgress={settings.showSampleProgress}
            onOpenExport={handleOpenExport}
            attachedLayout={false}
          />
        </div>
      ) : (
        <>
          <SidePanelHeader
            hostname={viewModel?.hostname ?? session.currentUrl}
            onOpenReport={() => handleSetPanelMode("full")}
            onUpgrade={() => setIsPlusModalOpen(true)}
            onSettings={handleOpenSettings}
            isPlusUser={isPlusUser}
          />

          <div className="metis-scroll flex-1 overflow-y-auto px-4 py-4">
            <PanelLayout
              viewModel={viewModel}
              compact
              refreshTick={0}
              showSampleProgress={settings.showSampleProgress}
            />
          </div>

          <div
            className="shrink-0 space-y-2 px-4 pb-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <WhatJustHappened
              hostname={viewModel?.hostname ?? session.currentUrl}
            />
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={() => handleSetPanelMode("full")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-bold"
                style={{
                  background: "#dc5e5e",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <FileText size={12} />
                Full Report
              </motion.button>
              <CopyReportButton
                onCopy={() => {
                  void handleCopyReport();
                }}
              />
            </div>
          </div>
        </>
      )}

      {isSettingsOpen && (
        <LocalSettingsModal
          settings={settings}
          scanSummary={{
            savedPageCount,
            latestCapturedSnapshot: null
          }}
          currentSitePages={Math.max(visitedSnapshots.length, 1)}
          onClose={() => setIsSettingsOpen(false)}
          onChange={setSettings}
          onClearSavedScans={() => {
            void handleClearSavedScans();
          }}
          onResetCurrentSiteProgress={() => {
            void handleResetCurrentSiteProgress();
          }}
        />
      )}

      {isExportOpen && exportDocument && (
        <ExportArchitectureModal
          document={exportDocument}
          onClose={() => setIsExportOpen(false)}
          onCopyOutline={() => {
            void handleCopyExportOutline();
          }}
        />
      )}

      {isPlusModalOpen && (
        <PlusUpgradeModal
          onClose={() => setIsPlusModalOpen(false)}
          onConfirm={() => {
            setIsPlusUser(true);
            setIsPlusModalOpen(false);
            toast.success("Metis+ unlocked", {
              description: "The prototype Plus experience is now enabled in this session."
            });
          }}
        />
      )}
    </div>
  );
}
