/**
 * PhaseOneShell
 * Restores the prototype-led Metis interaction flow:
 * launcher hover -> startup scan animation -> mini side panel -> full report.
 * Live Phase 4 data still powers the surfaces, but the chrome now follows the
 * original prototype's account, loading, footer, and Plus-upgrade behaviors.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, FileText, Maximize2, X } from "lucide-react";
import { toast } from "sonner";
import { detectIssues } from "../../features/detection";
import { buildInsight } from "../../features/insights";
import { buildPlusOptimizationReport } from "../../features/refinement";
import {
  PLUS_CORE_KEYS,
  PLUS_QUESTION_DEFINITIONS
} from "../../features/refinement/config";
import { buildMultipageSnapshot } from "../../features/scan";
import { scoreSnapshot } from "../../features/scoring";
import {
  buildPageScanSnapshot,
  getPageScanStoreSummary,
  savePageScan
} from "../../shared/lib/pageScanHistory";
import type { PanelMode, ScanScope } from "../useMetisState";
import type {
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../../shared/types/audit";
import {
  DETECTION_TOTAL_DURATION_MS,
  METIS_RED,
  PANEL_BG
} from "../data/metis-mock-data";
import { FullReportLayout } from "./figures/FullReportLayout";
import { isSoftRefresh, shouldReplayLoading } from "./figures/loadingState";
import { PanelLayout } from "./figures/PanelLayout";
import {
  CopyReportButton,
  LoadingScreen,
  PlusUpgradeModal,
  ProfileButton,
  WhatJustHappened
} from "./figures/PrototypeChrome";
import { buildMetisDesignViewModel } from "./figures/liveAdapter";

const panelTransition = {
  type: "spring",
  stiffness: 240,
  damping: 24,
  mass: 0.9
} as const;

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

function buildReportCopyText(
  hostname: string,
  viewModel: ReturnType<typeof buildMetisDesignViewModel>
) {
  return [
    `Metis Cost Report — ${hostname}`,
    `Risk Score: ${viewModel.score}/100 (${viewModel.riskLabel})`,
    `Estimated waste: ${viewModel.estimateRange}`,
    `Session cost: ${viewModel.sessionCost} · At 10k users: ${viewModel.monthlyProjection}`,
    `Top issues: ${viewModel.topIssues.map((issue) => issue.title).join(", ") || "No major issues surfaced"}`,
    `Quick insight: ${viewModel.quickInsight}`,
    "— Scanned by Metis (ward.studio/metis)"
  ].join("\n");
}

function LauncherButton({
  onOpen,
  score,
  riskLabel
}: {
  onOpen: () => void;
  score?: number;
  riskLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed right-0 z-[2147483647]" style={{ bottom: "5rem" }}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute right-[68px] top-1/2 -translate-y-1/2 rounded-full px-4 py-2.5"
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
            <div className="flex items-center gap-3 whitespace-nowrap">
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
              <div className="h-1 w-1 rounded-full bg-white/20" />
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
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <div
                style={{
                  color: "rgba(255,255,255,0.66)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {riskLabel ?? "Ready"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex min-w-[48px] items-center justify-center px-3 py-4 shadow-2xl"
        style={{
          background: "#0d1825",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px 0 0 14px",
          borderRight: "none",
          boxShadow: "0 18px 44px rgba(0,0,0,0.32)"
        }}
        title="Open Metis"
        initial={{ opacity: 0, x: 18, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          opacity: { duration: 0.28, ease: "easeOut" },
          x: panelTransition,
          scale: panelTransition
        }}
        whileHover={{ x: -6 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative flex h-[28px] w-[28px] items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "rgba(220,94,94,0.15)" }}
            animate={{ scale: [1, 1.16, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative flex h-[28px] w-[28px] items-center justify-center rounded-[10px]"
            style={{ background: METIS_RED }}
          >
            <span
              style={{
                color: "white",
                fontFamily: "Jua, sans-serif",
                fontSize: 16,
                lineHeight: 1
              }}
            >
              M
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

function MiniPanelHeader({
  onClose,
  onOpenReport,
  onUpgrade,
  isPlusUser
}: {
  onClose: () => void;
  onOpenReport: () => void;
  onUpgrade: () => void;
  isPlusUser: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 pb-3 pt-4 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
          style={{ background: METIS_RED }}
        >
          <span style={{ color: "white", fontFamily: "Jua, sans-serif", fontSize: 14 }}>
            M
          </span>
        </div>
        <span
          className="text-white"
          style={{ fontFamily: "Jua, sans-serif", fontSize: 14 }}
        >
          Metis
        </span>
        <motion.button
          type="button"
          onClick={() => {
            if (!isPlusUser) {
              onUpgrade();
            }
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 480, damping: 22 }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1"
          style={{
            background: isPlusUser
              ? "rgba(220,94,94,0.2)"
              : "rgba(220,94,94,0.1)",
            border: isPlusUser
              ? "1px solid rgba(220,94,94,0.36)"
              : "1px solid rgba(220,94,94,0.2)",
            boxShadow: isPlusUser ? "0 8px 18px rgba(220,94,94,0.15)" : "none",
            cursor: isPlusUser ? "default" : "pointer"
          }}
          title={isPlusUser ? "Metis Plus active" : "Get Plus"}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
              color: METIS_RED,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}
          >
            {isPlusUser ? "Plus" : "Get Plus"}
          </span>
        </motion.button>
      </div>

      <div className="flex items-center gap-1.5">
        <ProfileButton onUpgrade={onUpgrade} isPlusUser={isPlusUser} />
        <button
          type="button"
          onClick={onOpenReport}
          className="rounded-full p-1.5 hover:bg-white/8 transition-colors"
          title="Open full report"
        >
          <Maximize2 size={12} className="text-white/40" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/8 transition-colors"
          title="Close"
        >
          <X size={12} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}

export function PhaseOneShell({
  panelMode,
  setPanelMode,
  scanScope,
  setScanScope,
  rawSnapshot,
  baselineSnapshot,
  visitedSnapshots,
  plusAnswers,
  setPlusAnswers,
  isPlusRefinementOpen,
  setIsPlusRefinementOpen
}: {
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
  scanScope: ScanScope;
  setScanScope: (scope: ScanScope) => void;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
  plusAnswers: PlusRefinementAnswers;
  setPlusAnswers: (value: PlusRefinementAnswers) => void;
  isPlusRefinementOpen: boolean;
  setIsPlusRefinementOpen: (value: boolean) => void;
}) {
  const [miniLoaded, setMiniLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [miniRouteKey, setMiniRouteKey] = useState<string | null>(null);
  const [fullRouteKey, setFullRouteKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isPlusModalOpen, setIsPlusModalOpen] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [plusReturnMode, setPlusReturnMode] = useState<PanelMode | null>(null);
  const [savedPageCount, setSavedPageCount] = useState(0);
  const lastSnapshotKeyRef = useRef<string | null>(null);

  const activeSnapshot = buildCurrentSnapshot(rawSnapshot, visitedSnapshots, scanScope);
  const issues = activeSnapshot ? detectIssues(activeSnapshot, plusAnswers) : [];
  const score = activeSnapshot ? scoreSnapshot(activeSnapshot, issues) : null;
  const insight =
    activeSnapshot && score ? buildInsight(activeSnapshot, issues, score) : null;
  const plusReport =
    activeSnapshot && score && insight
      ? buildPlusOptimizationReport(insight, activeSnapshot, issues, score, plusAnswers)
      : null;
  const pageCount = scanScope === "multi" ? Math.max(visitedSnapshots.length, 1) : 1;
  const viewModel =
    activeSnapshot && score
      ? buildMetisDesignViewModel({
          snapshot: activeSnapshot,
          issues,
          score,
          insight,
          scope: scanScope,
          pageCount,
          savedPageCount,
          answers: plusAnswers,
          plusReport,
          requiredQuestionCount: PLUS_CORE_KEYS.length
        })
      : null;
  const routeKey = viewModel?.routeKey ?? rawSnapshot?.page.href ?? null;
  const snapshotKey = viewModel?.snapshotKey ?? null;

  const questionDefinitions = useMemo(() => {
    const baseDefinitions = PLUS_QUESTION_DEFINITIONS.filter((definition) => {
      if (!definition.dependsOn) {
        return true;
      }

      return plusAnswers[definition.dependsOn.key] === definition.dependsOn.value;
    });

    return [...baseDefinitions, ...(viewModel?.stackQuestionDefinitions ?? [])];
  }, [plusAnswers, viewModel?.stackQuestionDefinitions]);

  const currentQuestion =
    questionDefinitions.find((definition) => plusAnswers[definition.key] === undefined) ?? null;

  useEffect(() => {
    let isCancelled = false;

    const syncSavedPageCount = async () => {
      const summary = await getPageScanStoreSummary();

      if (!isCancelled) {
        setSavedPageCount(summary.savedPageCount);
      }
    };

    void syncSavedPageCount();

    return () => {
      isCancelled = true;
    };
  }, [routeKey, panelMode]);

  useEffect(() => {
    if (!snapshotKey || !routeKey) {
      return;
    }

    const lastSnapshotKey = lastSnapshotKeyRef.current;
    // A soft refresh should feel alive, but it should not replay the full
    // startup experience unless the page truly changed.
    if (isSoftRefresh(lastSnapshotKey, snapshotKey)) {
      setRefreshTick((current) => current + 1);
    }

    lastSnapshotKeyRef.current = snapshotKey;
  }, [routeKey, snapshotKey]);

  useEffect(() => {
    if (panelMode !== "mini" || !shouldReplayLoading(miniRouteKey, routeKey)) {
      return;
    }

    // The mini panel only replays the scanning loader for a genuinely new route
    // or snapshot key, not every time the user reopens the panel.
    setMiniLoaded(false);
    const timer = window.setTimeout(() => {
      setMiniRouteKey(routeKey);
      setMiniLoaded(true);
    }, DETECTION_TOTAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [miniRouteKey, panelMode, routeKey]);

  useEffect(() => {
    if (panelMode !== "full" || !shouldReplayLoading(fullRouteKey, routeKey)) {
      return;
    }

    // Fullscreen follows the same rule as the panel so the two surfaces stay in
    // sync and do not feel like separate products.
    setFullLoaded(false);
    const timer = window.setTimeout(() => {
      setFullRouteKey(routeKey);
      setFullLoaded(true);
    }, DETECTION_TOTAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [fullRouteKey, panelMode, routeKey]);

  useEffect(() => {
    const shouldLockPageScroll = panelMode === "full" || isPlusModalOpen;
    if (!shouldLockPageScroll) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isPlusModalOpen, panelMode]);

  const handleAnswer = (key: keyof PlusRefinementAnswers, value: string) => {
    setPlusAnswers({
      ...plusAnswers,
      [key]: value
    });
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

  const handleCaptureSample = async () => {
    if (!activeSnapshot || !viewModel) {
      return;
    }

    const summary = await savePageScan(buildPageScanSnapshot(activeSnapshot), {
      markAsLatestCaptured: true
    });
    setSavedPageCount(summary.savedPageCount);

    const savedPagesLabel =
      summary.savedPageCount === 1
        ? "Sampled 1 page"
        : `Sampled ${summary.savedPageCount} pages`;

    toast.success("Page captured", {
      description: `${savedPagesLabel} saved for ${viewModel.hostname} and set as the latest compare target.`
    });
  };

  const handleOpenMini = () => {
    setPanelMode("mini");
  };

  const handleOpenPlusModal = (sourceMode: PanelMode) => {
    if (sourceMode === "full") {
      setPlusReturnMode("full");
      setPanelMode("idle");
    } else {
      setPlusReturnMode(null);
    }

    setIsPlusModalOpen(true);
  };

  const handleClosePlusModal = () => {
    setIsPlusModalOpen(false);

    if (plusReturnMode) {
      setPanelMode(plusReturnMode);
      setPlusReturnMode(null);
    }
  };

  const handleUpgradeConfirm = () => {
    setIsPlusUser(true);
    setIsPlusModalOpen(false);

    if (plusReturnMode) {
      setPanelMode(plusReturnMode);
      setPlusReturnMode(null);
    }

    toast.success("Metis+ unlocked", {
      description: "The prototype Plus experience is now enabled in this session."
    });
  };

  void baselineSnapshot;

  return (
    <>
      <AnimatePresence mode="wait">
        {panelMode === "idle" && (
          <LauncherButton
            key="launcher"
            onOpen={handleOpenMini}
            score={viewModel?.score}
            riskLabel={viewModel?.riskLabel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelMode === "mini" && (
          <motion.div
            key="mini-panel"
            className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[288px] flex-col overflow-hidden shadow-2xl"
            style={{
              background: PANEL_BG,
              borderLeft: "1px solid rgba(255,255,255,0.06)"
            }}
            initial={{ opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={panelTransition}
          >
            <MiniPanelHeader
              onClose={() => setPanelMode("idle")}
              onOpenReport={() => setPanelMode("full")}
              onUpgrade={() => handleOpenPlusModal("mini")}
              isPlusUser={isPlusUser}
            />

            <AnimatePresence mode="wait">
              {!miniLoaded ? (
                <motion.div key="loading" className="flex-1">
                  <LoadingScreen />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  className="metis-scroll flex-1 overflow-y-auto px-4 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <PanelLayout
                    viewModel={viewModel}
                    compact
                    refreshTick={refreshTick}
                    onCapture={() => {
                      void handleCaptureSample();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="shrink-0 space-y-2 px-4 pb-4 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <WhatJustHappened
                hostname={viewModel?.hostname ?? rawSnapshot?.page.hostname ?? window.location.hostname}
              />
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => setPanelMode("full")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-bold"
                  style={{
                    background: METIS_RED,
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FileText size={12} />
                  Full Report
                  <ChevronRight size={12} />
                </motion.button>
                <CopyReportButton
                  onCopy={() => {
                    void handleCopyReport();
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelMode === "full" && (
          <>
            <motion.div
              key="report-backdrop"
              className="fixed inset-0 z-[2147483646]"
              style={{
                background: "rgba(0,0,0,0.78)",
                backdropFilter: "blur(18px)"
              }}
              onClick={() => setPanelMode("mini")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />

            <div className="pointer-events-none fixed inset-0 z-[2147483647] flex items-center justify-center p-5">
              <motion.div
                key="report-modal"
                className="pointer-events-auto h-[92vh] w-full max-w-[1360px]"
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 26, scale: 0.975 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={panelTransition}
              >
                <AnimatePresence mode="wait">
                  {!fullLoaded ? (
                    <motion.div
                      key="full-loading"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <LoadingScreen />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="full-content"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.24 }}
                    >
                      <FullReportLayout
                        viewModel={viewModel}
                        scanScope={scanScope}
                        onSetScanScope={setScanScope}
                        currentQuestion={currentQuestion}
                        plusAnswers={plusAnswers}
                        isRefinementOpen={isPlusRefinementOpen}
                        setIsRefinementOpen={setIsPlusRefinementOpen}
                        onAnswer={handleAnswer}
                        onCopyReport={() => {
                          void handleCopyReport();
                        }}
                        onCapture={() => {
                          void handleCaptureSample();
                        }}
                        onUpgrade={() => handleOpenPlusModal("full")}
                        isPlusUser={isPlusUser}
                        headerAccessory={
                          <ProfileButton
                            onUpgrade={() => handleOpenPlusModal("full")}
                            isPlusUser={isPlusUser}
                            onDark
                          />
                        }
                        refreshTick={refreshTick}
                        onClose={() => setPanelMode("mini")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlusModalOpen && (
          <PlusUpgradeModal
            onClose={handleClosePlusModal}
            onConfirm={handleUpgradeConfirm}
          />
        )}
      </AnimatePresence>
    </>
  );
}
