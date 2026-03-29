import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { assessConfidence } from "../features/confidence";
import { assessControl } from "../features/control/control";
import { detectIssues } from "../features/detection";
import { buildInsight } from "../features/insights";
import { buildPlusOptimizationReport } from "../features/refinement";
import {
  PLUS_CORE_KEYS,
  PLUS_QUESTION_DEFINITIONS
} from "../features/refinement/config";
import { buildScanDebugSummary, collectRawScanSnapshot } from "../features/scan";
import { buildMultipageSnapshot } from "../features/scan";
import { scoreSnapshot } from "../features/scoring";
import { detectMoneyStack } from "../features/stack";
import { buildExportOutlineText, buildExportReportDocument } from "../app/components/figures/exportDocument";
import { FullReportLayout } from "../app/components/figures/FullReportLayout";
import { ExportArchitectureModal } from "../app/components/figures/MetisUtilityModals";
import { buildMetisDesignViewModel } from "../app/components/figures/liveAdapter";
import {
  buildPageScanSnapshot,
  savePageScanAndCompare
} from "../shared/lib/pageScanHistory";
import { METIS_SITE_LABEL } from "../shared/lib/metisLinks";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import {
  getOrCreateSiteBaseline,
  upsertVisitedSiteSnapshot
} from "../shared/lib/siteBaseline";
import type {
  MetisLocalSettings,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../shared/types/audit";
import type { ScanScope } from "../app/types/scanScope";
import type {
  MetisRuntimeMessage,
  MetisSessionUiState,
  MetisTabSessionState
} from "../shared/types/runtime";

const PANEL_OPEN_SCAN_DELAY_MS = 1000;
const POST_LOAD_SCAN_DELAY_MS = 500;
const SCAN_REFRESH_INTERVAL_MS = 3000;
const NAVIGATION_CHECK_INTERVAL_MS = 500;

function isExtensionContextInvalidated(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("extension context invalidated")
  );
}

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

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

function buildReportCopyText(
  hostname: string,
  viewModel: ReturnType<typeof buildMetisDesignViewModel>
) {
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

export function PageBridgeApp() {
  const [hovered, setHovered] = useState(false);
  const [session, setSession] = useState<MetisTabSessionState | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [riskLabel, setRiskLabel] = useState<string>("Ready");
  const [isUpdating, setIsUpdating] = useState(false);
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [plusAnswers, setPlusAnswers] = useState<PlusRefinementAnswers>({});
  const [isPlusRefinementOpen, setIsPlusRefinementOpen] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const scanTimeoutRef = useRef<number | null>(null);

  const visitedSnapshots = session?.visitedSnapshots ?? [];
  const activeSnapshot = buildCurrentSnapshot(session?.rawSnapshot ?? null, visitedSnapshots, scanScope);
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
  const stackDetection = activeSnapshot ? detectMoneyStack(activeSnapshot, effectiveAnswers) : null;
  const issues = activeSnapshot ? detectIssues(activeSnapshot, effectiveAnswers) : [];
  const control = activeSnapshot ? assessControl(activeSnapshot, issues, effectiveAnswers) : null;
  const scoreBreakdown = activeSnapshot ? scoreSnapshot(activeSnapshot, issues) : null;
  const confidence =
    activeSnapshot && stackDetection && scoreBreakdown
      ? assessConfidence(activeSnapshot, stackDetection, scoreBreakdown)
      : null;
  const insight =
    activeSnapshot && scoreBreakdown && confidence
      ? buildInsight(activeSnapshot, issues, scoreBreakdown, confidence)
      : null;
  const plusReport =
    activeSnapshot && scoreBreakdown && insight
      ? buildPlusOptimizationReport(insight, activeSnapshot, issues, scoreBreakdown, effectiveAnswers)
      : null;
  const pageCount = Math.max(visitedSnapshots.length, 1);
  const viewModel =
    activeSnapshot && scoreBreakdown && control && confidence
      ? buildMetisDesignViewModel({
          snapshot: activeSnapshot,
          issues,
          control,
          confidence,
          score: scoreBreakdown,
          insight,
          scope: scanScope,
          pageCount,
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

  const patchSessionUi = async (patch: Partial<MetisSessionUiState>) => {
    await sendRuntimeMessage({
      type: "METIS_PATCH_TAB_SESSION",
      patch
    });
  };

  useEffect(() => {
    let isMounted = true;

    void getMetisLocalSettings().then((storedSettings) => {
      if (!isMounted) {
        return;
      }

      setSettings(storedSettings);
    });

    void sendRuntimeMessage<{
      ok: boolean;
      session?: MetisTabSessionState | null;
    }>({
      type: "METIS_BRIDGE_READY",
      href: window.location.href
    }).then((response) => {
      if (!isMounted) {
        return;
      }

      const nextSession = response?.session ?? null;
      setSession(nextSession);
      setIsSessionActive(nextSession?.isActive ?? false);
      setIsPanelOpen(nextSession?.isSidePanelOpen ?? false);

      if (nextSession?.uiState) {
        setScanScope(nextSession.uiState.scanScope);
        setPlusAnswers(nextSession.uiState.plusAnswers);
        setIsPlusRefinementOpen(nextSession.uiState.isPlusRefinementOpen);
        setIsPlusUser(nextSession.uiState.isPlusUser);
      } else {
        setScanScope("single");
        setPlusAnswers({});
        setIsPlusRefinementOpen(false);
        setIsPlusUser(false);
      }
    });

    const listener = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return false;
      }

      const runtimeMessage = message as MetisRuntimeMessage;

      if (runtimeMessage.type === "METIS_PING") {
        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_ACTIVATE_FROM_TOOLBAR") {
        setIsSessionActive(true);
        sendResponse({ ok: true });
        return true;
      }

      // The side panel stays compact. Opening the deep read happens back in
      // the page bridge so the report can use the full tab viewport.
      if (runtimeMessage.type === "METIS_OPEN_PAGE_REPORT") {
        setHovered(false);
        if (runtimeMessage.openPlusPreview) {
          setIsPlusUser(true);
          setIsPlusRefinementOpen(false);
        }
        setIsReportOpen(true);
        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_SESSION_CHANGED") {
        setSession(runtimeMessage.session ?? null);
        setIsSessionActive(runtimeMessage.session?.isActive ?? false);
        setIsPanelOpen(runtimeMessage.session?.isSidePanelOpen ?? false);

        if (runtimeMessage.session?.uiState) {
          setScanScope(runtimeMessage.session.uiState.scanScope);
          setPlusAnswers(runtimeMessage.session.uiState.plusAnswers);
          setIsPlusRefinementOpen(runtimeMessage.session.uiState.isPlusRefinementOpen);
          setIsPlusUser(runtimeMessage.session.uiState.isPlusUser);
        } else {
          setScanScope("single");
          setPlusAnswers({});
          setIsPlusRefinementOpen(false);
          setIsPlusUser(false);
        }

        sendResponse({ ok: true });
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      isMounted = false;
      chrome.runtime.onMessage.removeListener(listener);
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
    let lastHref = window.location.href;
    let isStopped = false;
    let intervalId: number | null = null;
    let navigationCheckId: number | null = null;

    const initialScanDelay =
      settings.scanDelayProfile === "fast"
        ? 400
        : settings.scanDelayProfile === "thorough"
          ? 1800
          : PANEL_OPEN_SCAN_DELAY_MS;
    const postLoadDelay = Math.max(350, Math.round(initialScanDelay / 2));

    const clearScheduledScan = () => {
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };

    const scheduleScan = (delay = initialScanDelay) => {
      if (isStopped || !isSessionActive) {
        return;
      }

      clearScheduledScan();
      scanTimeoutRef.current = window.setTimeout(() => {
        scanTimeoutRef.current = null;
        void syncSnapshots();
      }, delay);
    };

    const handlePageChange = () => {
      if (isStopped || window.location.href === lastHref) {
        return;
      }

      lastHref = window.location.href;

      if (!isSessionActive) {
        return;
      }

      scheduleScan(initialScanDelay);
    };

    const handlePostLoadSync = () => {
      if (isStopped || !isSessionActive) {
        return;
      }

      scheduleScan(postLoadDelay);
    };

    const stopSync = () => {
      if (isStopped) {
        return;
      }

      isStopped = true;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      if (navigationCheckId !== null) {
        window.clearInterval(navigationCheckId);
      }

      clearScheduledScan();
      window.removeEventListener("popstate", handlePageChange);
      window.removeEventListener("hashchange", handlePageChange);
      window.removeEventListener("load", handlePostLoadSync);
    };

    const syncSnapshots = async () => {
      if (isStopped || !isSessionActive) {
        return;
      }

      setIsUpdating(true);

      try {
        const snapshot = collectRawScanSnapshot();
        const compactSnapshot = buildPageScanSnapshot(snapshot);
        const baseline = await getOrCreateSiteBaseline(snapshot);
        const visited = await upsertVisitedSiteSnapshot(snapshot);
        const pageScanHistory = await savePageScanAndCompare(compactSnapshot);
        const issues = detectIssues(snapshot);
        const scoreBreakdown = scoreSnapshot(snapshot, issues);

        setScore(Math.round(scoreBreakdown.score));
        setRiskLabel(scoreBreakdown.label);

        console.info("[Metis] scan summary", buildScanDebugSummary(snapshot));
        console.info("[Metis] raw scan snapshot", snapshot);
        console.info("[Metis] site baseline snapshot", baseline);
        console.info("[Metis] visited site snapshots", visited);
        console.info("[Metis] page scan snapshot", compactSnapshot);

        if (pageScanHistory.comparison) {
          console.info("[Metis] page scan comparison", pageScanHistory.comparison);
        }

        if (pageScanHistory.latestCapturedSnapshot) {
          console.info(
            "[Metis] latest captured page snapshot",
            pageScanHistory.latestCapturedSnapshot
          );
        }

        if (pageScanHistory.latestCapturedComparison) {
          console.info(
            "[Metis] latest captured page comparison",
            pageScanHistory.latestCapturedComparison
          );
        }

        await sendRuntimeMessage({
          type: "METIS_SCAN_UPDATE",
          payload: {
            currentUrl: window.location.href,
            rawSnapshot: snapshot,
            baselineSnapshot: baseline,
            visitedSnapshots: visited
          }
        });
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          stopSync();
          return;
        }

        console.error("[Metis] failed to sync page bridge snapshot", error);
      } finally {
        setIsUpdating(false);
      }
    };

    if (isSessionActive) {
      scheduleScan(initialScanDelay);
    }

    if (isSessionActive && document.readyState !== "complete") {
      window.addEventListener("load", handlePostLoadSync, { once: true });
    }

    if (isSessionActive) {
      navigationCheckId = window.setInterval(() => {
        handlePageChange();
      }, NAVIGATION_CHECK_INTERVAL_MS);

      if (settings.autoRescanWhilePanelOpen) {
        intervalId = window.setInterval(() => {
          void syncSnapshots();
        }, SCAN_REFRESH_INTERVAL_MS);
      }
    }

    window.addEventListener("popstate", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);

    return () => {
      stopSync();
    };
  }, [isSessionActive, settings.autoRescanWhilePanelOpen, settings.scanDelayProfile]);

  useEffect(() => {
    if (!(isReportOpen || isExportOpen)) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isExportOpen, isReportOpen]);

  const handleActivate = async () => {
    setIsSessionActive(true);
    setIsPanelOpen(true);
    setHovered(false);

    await sendRuntimeMessage({ type: "METIS_START_TAB_SESSION" });
    await sendRuntimeMessage({ type: "METIS_OPEN_SIDE_PANEL" });
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

  const handleCopyExportOutline = async () => {
    if (!viewModel) {
      return;
    }

    await navigator.clipboard.writeText(
      buildExportOutlineText(buildExportReportDocument(viewModel, { isPlusUser }))
    );

    toast.success("Export outline copied", {
      description: "The current export document shape is now on your clipboard."
    });
  };

  return (
    <>
      <AnimatePresence>
        {!isPanelOpen && !isReportOpen && (
          <motion.div
            className="fixed right-0 z-[2147483647]"
            style={{ bottom: "5rem" }}
            initial={{ opacity: 0, x: 18, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.92 }}
            transition={{
              opacity: { duration: 0.22, ease: "easeOut" },
              x: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 },
              scale: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 }
            }}
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute right-[68px] top-1/2 inline-flex h-[34px] -translate-y-1/2 items-center rounded-full px-4"
                  style={{
                    background: "#0d1825",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 46px rgba(0,0,0,0.42)"
                  }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-2.5 whitespace-nowrap leading-none">
                    <div
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase"
                      }}
                    >
                      Metis
                    </div>
                    <div className="h-1 w-1 shrink-0 rounded-full bg-white/20" />
                    <div
                      style={{
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      Cost Risk: {score ?? "…"}
                    </div>
                    <div className="h-1 w-1 shrink-0 rounded-full bg-white/20" />
                    <div
                      style={{
                        color: "rgba(255,255,255,0.66)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      {isSessionActive ? riskLabel : "Open Metis"}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={() => {
                void handleActivate();
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="group flex h-[56px] w-[56px] items-center justify-center shadow-2xl"
              style={{
                background: "#0d1825",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px 0 0 14px",
                borderRight: "none",
                boxShadow: "0 18px 44px rgba(0,0,0,0.32)"
              }}
              title="Open Metis"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: isUpdating ? "rgba(34,197,94,0.16)" : "rgba(220,94,94,0.18)",
                  color: isUpdating ? "#22c55e" : "#ffffff",
                  fontFamily: "Jua, sans-serif",
                  fontSize: 15,
                  lineHeight: 1
                }}
              >
                M
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[2147483600]"
              style={{ background: "rgba(2,7,16,0.76)", backdropFilter: "blur(14px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-[2147483601] flex items-center justify-center p-5"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div
                className="pointer-events-auto h-[min(900px,calc(100vh-40px))] w-[min(1400px,calc(100vw-40px))]"
                onClick={(event) => event.stopPropagation()}
              >
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
                  isPlusUser={isPlusUser}
                  refreshTick={0}
                  onClose={() => setIsReportOpen(false)}
                  showSampleProgress
                  onOpenExport={() => {
                    setIsReportOpen(false);
                    setIsExportOpen(true);
                  }}
                  attachedLayout={false}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportOpen && exportDocument ? (
          <ExportArchitectureModal
            document={exportDocument}
            onClose={() => setIsExportOpen(false)}
            onCopyOutline={() => {
              void handleCopyExportOutline();
            }}
          />
        ) : null}
      </AnimatePresence>

    </>
  );
}
