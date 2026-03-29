import { assessConfidence } from "../features/confidence";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, FileText, RefreshCcw, Zap } from "lucide-react";
import { toast, Toaster } from "sonner";
import { assessControl } from "../features/control/control";
import { detectIssues } from "../features/detection";
import { buildInsight } from "../features/insights";
import { buildPlusOptimizationReport } from "../features/refinement";
import {
  FAIRNESS_QUESTION_KEYS,
  PLUS_CORE_KEYS,
  PLUS_QUESTION_DEFINITIONS
} from "../features/refinement/config";
import {
  clearPageScopedFairnessAnswer,
  getFairnessPageKey,
  getPageScopedFairnessAnswers,
  migrateLegacyFairnessAnswers,
  setPageScopedFairnessAnswer,
  stripPageScopedFairnessAnswers,
  type PageScopedFairnessMap
} from "../features/refinement/pageScopedFairness";
import { buildMultipageEvidence } from "../features/scan";
import { scoreSnapshot } from "../features/scoring";
import { detectMoneyStack } from "../features/stack";
import type {
  MetisLocalSettings,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../shared/types/audit";
import type { ScanScope } from "./types/scanScope";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings,
  saveMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import {
  METIS_ACCOUNT_URL,
  METIS_SITE_LABEL
} from "../shared/lib/metisLinks";
import type {
  MetisRuntimeMessage,
  MetisSessionUiState,
  MetisTabSessionState
} from "../shared/types/runtime";
import { buildExportOutlineText, buildExportReportDocument } from "./components/figures/exportDocument";
import {
  ExportArchitectureModal
} from "./components/figures/MetisUtilityModals";
import { PanelLayout } from "./components/figures/PanelLayout";
import {
  CopyReportButton,
  ProfileButton,
  WhatJustHappened
} from "./components/figures/PrototypeChrome";
import { buildMetisDesignViewModel } from "./components/figures/liveAdapter";

function buildCurrentSnapshot(rawSnapshot: RawScanSnapshot | null) {
  if (!rawSnapshot) {
    return null;
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
  const topDrivers =
    viewModel.topIssues.length > 0
      ? viewModel.topIssues.slice(0, 3).map((issue, index) => `${index + 1}. ${issue.title}`)
      : ["1. No major issues surfaced"];

  return [
    `Metis report for ${hostname}`,
    "",
    `Score: ${viewModel.score}/100 (${viewModel.riskLabel})`,
    `Control: ${viewModel.controlScore}/100 (${viewModel.controlLabel})`,
    `Confidence: ${viewModel.confidenceLabel}`,
    viewModel.confidenceDetail,
    "",
    "Estimated waste",
    viewModel.estimateRange,
    viewModel.estimateSourceNote ?? null,
    "",
    "At 10k users",
    viewModel.monthlyProjection,
    "",
    "Top drivers",
    ...topDrivers,
    "",
    "Insight",
    viewModel.quickInsight,
    viewModel.supportingDetail,
    "",
    `Scanned by Metis (${METIS_SITE_LABEL})`
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");
}

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

function SidePanelHeader({
  hostname,
  isPlusUser,
  onManageAccount,
  onUpgrade,
  onSettings,
}: {
  hostname: string;
  isPlusUser: boolean;
  onManageAccount: () => void;
  onUpgrade: () => void;
  onSettings: () => void;
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
        {isPlusUser ? (
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: "rgba(220,94,94,0.14)",
              border: "1px solid rgba(220,94,94,0.28)",
              color: "#dc8d72",
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            <Zap size={10} />
            Metis+
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <ProfileButton
          onManageAccount={onManageAccount}
          onUpgrade={onUpgrade}
          onSettings={onSettings}
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
        {ready ? "Start Metis on this page" : "Close and reopen Metis"}
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
          ? "Click the page hover or use this button to start the tab session and stream live scan data into the side panel."
          : "The page bridge is not ready yet. Close the panel, reopen Metis, and refresh the current tab if needed."}
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
        Close and reopen
      </motion.button>
    </div>
  );
}

export default function App() {
  const sidePanelPresencePortRef = useRef<chrome.runtime.Port | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [session, setSession] = useState<MetisTabSessionState | null>(null);
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [plusAnswers, setPlusAnswers] = useState<PlusRefinementAnswers>({});
  const [pageFairnessByKey, setPageFairnessByKey] = useState<PageScopedFairnessMap>({});
  const [isPlusRefinementOpen, setIsPlusRefinementOpen] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);

  const applySessionState = (nextSession: MetisTabSessionState | null) => {
    setSession(nextSession);

    const uiState = nextSession?.uiState ?? null;
    if (uiState) {
      const migratedUiState = migrateLegacyFairnessAnswers(
        uiState.plusAnswers,
        uiState.pageFairnessByKey ?? {},
        getFairnessPageKey(nextSession?.currentUrl)
      );

      setScanScope(uiState.scanScope);
      setPlusAnswers(migratedUiState.plusAnswers);
      setPageFairnessByKey(migratedUiState.pageFairnessByKey);
      setIsPlusRefinementOpen(uiState.isPlusRefinementOpen);
      setIsPlusUser(uiState.isPlusUser);
      return;
    }

    setScanScope(settings.preferredScanScope);
    setPlusAnswers({});
    setPageFairnessByKey({});
    setIsPlusRefinementOpen(false);
    setIsPlusUser(false);
  };

  const rawSnapshot = session?.rawSnapshot ?? null;
  const visitedSnapshots = session?.visitedSnapshots ?? [];
  const activeSnapshot = buildCurrentSnapshot(rawSnapshot);
  const multipageEvidence = useMemo(
    () => (activeSnapshot ? buildMultipageEvidence(activeSnapshot, visitedSnapshots) : null),
    [activeSnapshot, visitedSnapshots]
  );
  const inferredAnswers = useMemo(
    () => buildAutoRefinementAnswers(activeSnapshot),
    [activeSnapshot]
  );
  const currentPageKey = useMemo(
    () => getFairnessPageKey(activeSnapshot?.page.href ?? session?.currentUrl),
    [activeSnapshot?.page.href, session?.currentUrl]
  );
  const currentPageFairnessAnswers = useMemo(
    () => getPageScopedFairnessAnswers(pageFairnessByKey, currentPageKey),
    [currentPageKey, pageFairnessByKey]
  );
  const effectiveAnswers = useMemo(
    () => ({
      ...inferredAnswers,
      ...plusAnswers,
      ...currentPageFairnessAnswers
    }),
    [currentPageFairnessAnswers, inferredAnswers, plusAnswers]
  );
  const stackDetection = activeSnapshot ? detectMoneyStack(activeSnapshot, effectiveAnswers) : null;
  const issues = activeSnapshot ? detectIssues(activeSnapshot, effectiveAnswers) : [];
  const control = activeSnapshot ? assessControl(activeSnapshot, issues, effectiveAnswers) : null;
  const score = activeSnapshot ? scoreSnapshot(activeSnapshot, issues, effectiveAnswers) : null;
  const confidence =
    activeSnapshot && stackDetection && score
      ? assessConfidence(activeSnapshot, stackDetection, score)
      : null;
  const insight =
    activeSnapshot && score && confidence
      ? buildInsight(activeSnapshot, issues, score, confidence, effectiveAnswers)
      : null;
  const plusReport =
    activeSnapshot && score && insight
      ? buildPlusOptimizationReport(insight, activeSnapshot, issues, score, effectiveAnswers)
      : null;
  const pageCount = Math.max(visitedSnapshots.length, 1);
  const viewModel =
    activeSnapshot && score && control && confidence
      ? buildMetisDesignViewModel({
          snapshot: activeSnapshot,
          issues,
          control,
          confidence,
          score,
          insight,
          scope: scanScope,
          pageCount,
          multipageEvidence,
          answers: effectiveAnswers,
          plusReport,
          requiredQuestionCount: PLUS_CORE_KEYS.length
        })
      : null;
  const exportDocument = viewModel
    ? buildExportReportDocument(viewModel, { isPlusUser })
    : null;
  const questionDefinitions = useMemo(() => {
    const baseDefinitions = PLUS_QUESTION_DEFINITIONS.filter((definition) => {
      if (!definition.dependsOn) {
        return true;
      }

      return effectiveAnswers[definition.dependsOn.key] === definition.dependsOn.value;
    });

    return [...baseDefinitions, ...(viewModel?.stackQuestionDefinitions ?? [])];
  }, [effectiveAnswers, viewModel?.stackQuestionDefinitions]);
  const pendingQuestionDefinitions = useMemo(
    () => questionDefinitions.filter((definition) => effectiveAnswers[definition.key] === undefined),
    [effectiveAnswers, questionDefinitions]
  );
  const currentQuestion =
    pendingQuestionDefinitions[0] ?? null;
  const currentFairnessQuestion =
    questionDefinitions.find(
      (definition) =>
        FAIRNESS_QUESTION_KEYS.includes(definition.key) &&
        effectiveAnswers[definition.key] === undefined
    ) ?? null;
  const answeredQuestions = useMemo(
    () =>
      questionDefinitions.filter((definition) => effectiveAnswers[definition.key] !== undefined),
    [effectiveAnswers, questionDefinitions]
  );
  const previousQuestion = answeredQuestions[answeredQuestions.length - 1] ?? null;

  // The side panel stays small and stable. Deeper reading and immersive actions
  // still happen back in the page DOM.
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
    applySessionState(response.session ?? null);
  };

  const patchSessionUi = async (patch: Partial<MetisSessionUiState>) => {
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

    void getMetisLocalSettings().then((storedSettings) => {
        if (cancelled) {
          return;
        }

        setSettings(storedSettings);
        setSettingsReady(true);
      }
    );

    void refreshActiveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local" || !changes["metis:settings"]) {
        return;
      }

      void getMetisLocalSettings().then(setSettings);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
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
    if (!session?.isActive || rawSnapshot) {
      return;
    }

    // The side panel can mount before the first scan lands. Retry hydration
    // briefly while the tab session is active so the panel does not get stuck
    // on an empty state if the initial session-change broadcast is missed.
    const timeoutId = window.setTimeout(() => {
      void refreshActiveSession();
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [rawSnapshot, session?.isActive]);

  const handleSetScanScope = (scope: ScanScope) => {
    setScanScope(scope);
    void patchSessionUi({ scanScope: scope });
  };

  const handleAnswer = (key: keyof PlusRefinementAnswers, value: string) => {
    if (FAIRNESS_QUESTION_KEYS.includes(key)) {
      const nextPageFairnessByKey = setPageScopedFairnessAnswer(
        pageFairnessByKey,
        currentPageKey,
        key as "appType" | "representativeExperience",
        value
      );

      setPageFairnessByKey(nextPageFairnessByKey);
      void patchSessionUi({ pageFairnessByKey: nextPageFairnessByKey });
      return;
    }

    const nextAnswers = {
      ...stripPageScopedFairnessAnswers(plusAnswers),
      [key]: value
    };

    setPlusAnswers(nextAnswers);
    void patchSessionUi({ plusAnswers: nextAnswers });
  };

  const handleBackQuestion = () => {
    if (!previousQuestion) {
      return;
    }

    if (FAIRNESS_QUESTION_KEYS.includes(previousQuestion.key)) {
      const nextPageFairnessByKey = clearPageScopedFairnessAnswer(
        pageFairnessByKey,
        currentPageKey,
        previousQuestion.key as "appType" | "representativeExperience"
      );

      setPageFairnessByKey(nextPageFairnessByKey);
      void patchSessionUi({ pageFairnessByKey: nextPageFairnessByKey });
      return;
    }

    const nextAnswers = {
      ...stripPageScopedFairnessAnswers(plusAnswers),
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
    void sendRuntimeMessage({
      type: "METIS_OPEN_TOOLBAR_SETTINGS"
    });
  };

  const handleOpenPageReport = async (options?: { openPlusPreview?: boolean }) => {
    if (!activeTabId) {
      return;
    }

    // The side panel is the stable compact workspace. The large report opens
    // back inside the tab so it can use the full page viewport.
    await sendRuntimeMessage({
      type: "METIS_OPEN_PAGE_REPORT",
      tabId: activeTabId,
      openPlusPreview: options?.openPlusPreview
    });
  };

  const handleOpenAccountPortal = () => {
    window.open(METIS_ACCOUNT_URL, "_blank", "noopener,noreferrer");
  };

  const handleUpgradeToPlus = async () => {
    if (!activeTabId) {
      return;
    }

    // Upgrade is local for now. It opens the fullscreen report in its Plus
    // state instead of forcing a separate billing or onboarding step.
    setIsPlusUser(true);
    await patchSessionUi({
      isPlusUser: true,
      isPlusRefinementOpen: false
    });
    await handleOpenPageReport({
      openPlusPreview: true
    });
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

    const document = buildExportReportDocument(viewModel, { isPlusUser });
    await navigator.clipboard.writeText(buildExportOutlineText(document));
    toast.success("Export outline copied", {
      description: "The current export document shape is now on your clipboard."
    });
  };

  const handleReconnect = async () => {
    const response = await sendRuntimeMessage<{ ok: boolean }>({
      type: "METIS_RECONNECT_ACTIVE_TAB"
    });

    if (!response?.ok) {
      toast.error("Close and reopen failed", {
        description: "Metis could not reopen cleanly on the current tab."
      });
      return;
    }

    toast.success("Close and reopen started", {
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
      ) : (
        <>
          <SidePanelHeader
            hostname={viewModel?.hostname ?? session.currentUrl}
            isPlusUser={isPlusUser}
            onManageAccount={handleOpenAccountPortal}
            onUpgrade={() => {
              void handleUpgradeToPlus();
            }}
            onSettings={handleOpenSettings}
          />

          <div className="metis-scroll flex-1 overflow-y-auto px-4 py-4">
            <PanelLayout
              viewModel={viewModel}
              compact
              refreshTick={0}
              showSampleProgress={settings.showSampleProgress}
              currentFairnessQuestion={currentFairnessQuestion}
              onAnswer={handleAnswer}
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
                onClick={() => {
                  void handleOpenPageReport();
                }}
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

      {isExportOpen && exportDocument && (
        <ExportArchitectureModal
          document={exportDocument}
          onClose={() => setIsExportOpen(false)}
          onCopyOutline={() => {
            void handleCopyExportOutline();
          }}
        />
      )}
    </div>
  );
}
