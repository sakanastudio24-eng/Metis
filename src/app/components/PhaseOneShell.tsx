/**
 * PhaseOneShell
 * Keeps the interaction flow intentionally simple: launcher -> side panel ->
 * full dashboard modal. This avoids the awkward "panel to slightly larger panel"
 * transition and lets the dashboard feel like a distinct report surface.
 */
import { AnimatePresence, motion } from "motion/react";
import { Copy, Expand, Minimize2, X } from "lucide-react";
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
import type { PanelMode, ScanScope } from "../useMetisState";
import type {
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../../shared/types/audit";
import { PanelLayout } from "./figures/PanelLayout";
import { FullReportLayout } from "./figures/FullReportLayout";
import { buildMetisDesignViewModel } from "./figures/liveAdapter";

const HOST_BUTTON_STYLE = {
  background: "#0c1623",
  border: "1px solid rgba(255,255,255,0.1)"
} as const;

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
  onOpen
}: {
  onOpen: () => void;
}) {
  return (
    <div className="fixed right-0 z-[2147483647]" style={{ bottom: "5rem" }}>
      <motion.button
        type="button"
        onClick={onOpen}
        className="group flex min-w-[44px] flex-col items-center gap-2 px-3 py-4 shadow-2xl"
        style={{
          ...HOST_BUTTON_STYLE,
          borderRadius: "12px 0 0 12px",
          borderRight: "none",
          boxShadow: "0 18px 44px rgba(0,0,0,0.32)"
        }}
        title="Open Metis"
        initial={{ opacity: 0, x: 18, scale: 0.88 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          y: [0, -3, 0]
        }}
        transition={{
          opacity: { duration: 0.28, ease: "easeOut" },
          x: panelTransition,
          scale: panelTransition,
          y: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.65 }
        }}
        whileHover={{ x: -3, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="flex h-[18px] w-[18px] items-center justify-center"
          animate={{ rotate: [0, -6, 0, 6, 0] }}
          transition={{ duration: 1.8, delay: 0.45, ease: "easeInOut" }}
        >
          <div
            style={{
              color: "white",
              fontFamily: "Jua, sans-serif",
              fontSize: 18,
              lineHeight: 1
            }}
          >
            M
          </div>
        </motion.div>
        <div
          className="hidden text-center group-hover:block"
          style={{
            color: "rgba(255,255,255,0.35)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "14px"
          }}
        >
          Open
        </div>
      </motion.button>
    </div>
  );
}

function ShellHeader({
  title,
  subtitle,
  onClose,
  onExpand,
  onMinimize,
  isMini
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;
  isMini: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between border-b px-4 py-4"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-[18px]"
          style={{
            width: isMini ? 48 : 52,
            height: isMini ? 48 : 52,
            background: "#dc5e5e",
            color: "white",
            fontFamily: "Jua, sans-serif",
            fontSize: isMini ? 24 : 28
          }}
        >
          M
        </div>
        <div>
          <div
            style={{
              color: "white",
              fontFamily: "Jua, sans-serif",
              fontSize: isMini ? 18 : 20
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.4)",
              fontFamily: "Inter, sans-serif",
              fontSize: isMini ? 11 : 12
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onExpand && (
        <motion.button
          type="button"
          onClick={onExpand}
          className="rounded-full p-2"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Expand"
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.06)" }}
          whileTap={{ scale: 0.96 }}
        >
          <Expand size={16} />
        </motion.button>
      )}
      {onMinimize && (
          <motion.button
            type="button"
            onClick={onMinimize}
            className="rounded-full p-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
            title="Minimize"
            whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.96 }}
          >
            <Minimize2 size={16} />
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={onClose}
          className="rounded-full p-2"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Close"
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.06)" }}
          whileTap={{ scale: 0.96 }}
        >
          <X size={18} />
        </motion.button>
      </div>
    </div>
  );
}

function PanelFooter({
  onCopy
}: {
  onCopy: () => void;
}) {
  return (
    <div
      className="shrink-0 border-t px-4 py-3"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          style={{
            color: "rgba(255,255,255,0.34)",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            lineHeight: "15px"
          }}
        >
          Expand from the header for the dashboard view.
        </div>
        <motion.button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-2 rounded-[18px] px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 700
          }}
          whileHover={{
            scale: 1.03,
            backgroundColor: "rgba(255,255,255,0.08)"
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Copy size={14} />
          Copy
        </motion.button>
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
  const activeSnapshot = buildCurrentSnapshot(rawSnapshot, visitedSnapshots, scanScope);
  const issues = activeSnapshot ? detectIssues(activeSnapshot) : [];
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
          answers: plusAnswers,
          plusReport,
          requiredQuestionCount: PLUS_CORE_KEYS.length
        })
      : null;

  const currentQuestion =
    PLUS_QUESTION_DEFINITIONS.filter((definition) => {
      if (!definition.dependsOn) {
        return true;
      }

      return plusAnswers[definition.dependsOn.key] === definition.dependsOn.value;
    }).find((definition) => plusAnswers[definition.key] === undefined) ?? null;

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

  void baselineSnapshot;

  return (
    <>
      <AnimatePresence mode="wait">
        {panelMode === "idle" && <LauncherButton key="launcher" onOpen={() => setPanelMode("mini")} />}
      </AnimatePresence>

      <AnimatePresence>
        {panelMode === "mini" && (
        <motion.div
          key="mini-panel"
          className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[288px] flex-col overflow-hidden shadow-2xl"
          style={{
            background: "#111d2b",
            borderLeft: "1px solid rgba(255,255,255,0.06)"
          }}
          initial={{ opacity: 0, x: 32, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          transition={panelTransition}
        >
          <ShellHeader
            title="Metis"
            subtitle="Phase 4 live insight"
            onClose={() => setPanelMode("idle")}
            onExpand={() => setPanelMode("full")}
            isMini
          />
          <div className="metis-scroll flex-1 overflow-y-auto px-4 py-4">
            <PanelLayout viewModel={viewModel} compact />
          </div>
          <PanelFooter
            onCopy={() => {
              void handleCopyReport();
            }}
          />
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
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(14px)"
            }}
            onClick={() => setPanelMode("mini")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              key="report-modal"
              className="pointer-events-auto h-[94vh] w-full max-w-[1320px]"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 26, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={panelTransition}
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
                onClose={() => setPanelMode("mini")}
              />
            </motion.div>
          </div>
        </>
      )}
      </AnimatePresence>
    </>
  );
}
