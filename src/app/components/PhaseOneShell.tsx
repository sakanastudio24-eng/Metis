/**
 * PhaseOneShell
 * Live MV3 shell rebuilt against the zip-backed Metis prototype hierarchy.
 */
import { useState } from "react";
import { Copy, Expand, Minimize2, X } from "lucide-react";
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
      <button
        type="button"
        onClick={onOpen}
        className="group flex min-w-[44px] flex-col items-center gap-2 px-3 py-4 shadow-2xl"
        style={{
          ...HOST_BUTTON_STYLE,
          borderRadius: "12px 0 0 12px",
          borderRight: "none"
        }}
        title="Open Metis"
      >
        <div className="flex h-[18px] w-[18px] items-center justify-center">
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
        </div>
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
      </button>
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
          <button
            type="button"
            onClick={onExpand}
            className="rounded-full p-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
            title="Expand"
          >
            <Expand size={16} />
          </button>
        )}
        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-full p-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2"
          style={{ color: "rgba(255,255,255,0.4)" }}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function PanelFooter({
  primaryLabel,
  onPrimary,
  onCopy
}: {
  primaryLabel: string;
  onPrimary: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      className="shrink-0 border-t px-4 pb-4 pt-3"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="mb-3">
        <button
          type="button"
          className="w-full rounded-[24px] px-5 py-4"
          onClick={onPrimary}
          style={{
            background: "#dc5e5e",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(220,94,94,0.35)"
          }}
        >
          {primaryLabel}
        </button>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
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
        >
          <Copy size={14} />
          Copy
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
  const [showReport, setShowReport] = useState(false);
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
  };

  void baselineSnapshot;

  return (
    <>
      {panelMode === "idle" && <LauncherButton onOpen={() => setPanelMode("mini")} />}

      {panelMode === "mini" && (
        <div
          className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[288px] flex-col overflow-hidden shadow-2xl"
          style={{
            background: "#111d2b",
            borderLeft: "1px solid rgba(255,255,255,0.06)"
          }}
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
            primaryLabel="Open Full Panel"
            onPrimary={() => setPanelMode("full")}
            onCopy={() => {
              void handleCopyReport();
            }}
          />
        </div>
      )}

      {panelMode === "full" && (
        <>
          <div
            className="fixed inset-0 z-[2147483646]"
            style={{
              background: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(3px)"
            }}
            onClick={() => setPanelMode("idle")}
          />
          <div
            className="fixed bottom-5 right-5 top-5 z-[2147483647] flex w-[410px] flex-col overflow-hidden rounded-[22px] shadow-2xl"
            style={{
              background: "#111d2b",
              border: "1px solid rgba(255,255,255,0.07)"
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <ShellHeader
              title="Metis Full Report"
              subtitle={viewModel ? `${viewModel.hostname} · ${viewModel.scannedAt}` : "Scanning current page"}
              onClose={() => setPanelMode("idle")}
              onMinimize={() => setPanelMode("mini")}
              isMini={false}
            />
            <div className="metis-scroll flex-1 overflow-y-auto px-5 py-5">
              <PanelLayout viewModel={viewModel} />
            </div>
            <PanelFooter
              primaryLabel="Open Full Report"
              onPrimary={() => setShowReport(true)}
              onCopy={() => {
                void handleCopyReport();
              }}
            />
          </div>
        </>
      )}

      {showReport && (
        <>
          <div
            className="fixed inset-0 z-[2147483647]"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(16px)"
            }}
            onClick={() => setShowReport(false)}
          />
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6 pointer-events-none">
            <div
              className="pointer-events-auto h-[92vh] w-full max-w-[672px]"
              onClick={(event) => event.stopPropagation()}
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
                onClose={() => setShowReport(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
