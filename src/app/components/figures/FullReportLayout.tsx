/**
 * FullReportLayout
 * Treats the dashboard as a wide report surface instead of a slightly larger
 * panel. The overview is intentionally compact so the dashboard can fit more
 * meaningful sections above the fold.
 */
import type { ReactNode } from "react";
import { ArrowLeft, Bot, Check, Copy, Download, Target, X, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { ScanScope } from "../../types/scanScope";
import type { PlusQuestionDefinition } from "../../../features/refinement/config";
import { METIS_SITE_LABEL } from "../../../shared/lib/metisLinks";
import type { PlusRefinementAnswers } from "../../../shared/types/audit";
import type { MetisDesignViewModel } from "./liveAdapter";
import { TopIssuesList } from "./TopIssuesList";
import { CostBreakdown } from "./CostBreakdown";
import { DetectedStackBadges } from "./DetectedStackBadges";
import { SplitScoreSummary } from "./SplitScoreSummary";
import { AcronymText } from "./AcronymTooltipText";

function alpha(color: string, suffix: string) {
  if (!color.startsWith("#")) {
    return color;
  }

  return `${color}${suffix}`;
}

function optionStyle(
  option: { brandColor?: string },
  selected: boolean
) {
  // Manual stack answers should look like the detected stack pills so the
  // refinement flow feels like part of one design system.
  if (!option.brandColor) {
    return {
      background: selected ? "#dc5e5e" : "rgba(255,255,255,0.08)",
      border: selected
        ? "1px solid rgba(220,94,94,0.4)"
        : "1px solid rgba(255,255,255,0.1)",
      color: "white"
    };
  }

  return {
    background: selected ? alpha(option.brandColor, "2f") : alpha(option.brandColor, "17"),
    border: `1px solid ${selected ? alpha(option.brandColor, "55") : alpha(option.brandColor, "38")}`,
    color: option.brandColor
  };
}

function ScaleSimulationSection({
  aiCostPerRequestEstimate,
  rows
}: {
  aiCostPerRequestEstimate: string | null;
  rows: MetisDesignViewModel["scaleSimulationRows"];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="rounded-[24px] px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2">
        <Target size={14} className="text-white/35" />
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}
        >
          <AcronymText text="Scale Simulation · Plus" />
        </div>
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.46)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          lineHeight: "18px",
          marginTop: 10
        }}
      >
        If this route scales, this waste scales with it.
      </div>

      {aiCostPerRequestEstimate && (
        // Only show this card when the adapter has a concrete AI estimate hint.
        // Omitting it is cleaner than rendering a vague empty state.
        <div
          className="mt-4 rounded-[18px] px-4 py-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)"
          }}
        >
          <div className="flex items-center gap-2">
            <Bot size={14} style={{ color: "#dc5e5e" }} />
            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <AcronymText text="AI cost per request (est.)" />
            </div>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.42)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              marginTop: 6
            }}
          >
            <AcronymText text="Based on detected AI-style usage." />
          </div>
          <div
            className="metis-display"
            style={{
              color: "white",
              fontSize: 18,
              marginTop: 10
            }}
          >
            {aiCostPerRequestEstimate}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-[18px]" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid grid-cols-[1fr_1fr_1fr] px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}
        >
          {["Traffic", "Scenario", "Est. monthly waste"].map((label) => (
            <div
              key={label}
              style={{
                color: "rgba(255,255,255,0.34)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {label}
            </div>
          ))}
        </div>
        {rows.map((row, index) => (
          <div
            key={row.trafficLabel}
            className="grid grid-cols-[1fr_1fr_1fr] px-4 py-3"
            style={{
              borderBottom:
                index < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
            }}
          >
            <div style={{ color: "white", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              {row.trafficLabel}
            </div>
            <div style={{ color: "rgba(255,255,255,0.52)", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              {row.scenario}
            </div>
            <div
              className="metis-display"
              style={{ color: "white", fontSize: 16 }}
            >
              {row.amount}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.34)",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          lineHeight: "17px",
          marginTop: 10
        }}
      >
        Projected from the current route profile.
      </div>
    </motion.div>
  );
}

function FixRecommendationsSection({
  cards,
  totalSavingsLabel
}: {
  cards: MetisDesignViewModel["fixRecommendationCards"];
  totalSavingsLabel: MetisDesignViewModel["totalSavingsLabel"];
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="rounded-[28px] p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div
            style={{
              color: "#dc5e5e",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}
          >
            <AcronymText text="Fix Recommendations · Metis+" />
          </div>
          <div
            style={{
              color: "white",
              fontFamily: "Jua, sans-serif",
              fontSize: 22,
              marginTop: 10
            }}
          >
            Total savings: {totalSavingsLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {cards.map((card, index) => (
          // Missing fields are omitted on purpose so recommendation cards stay
          // compact instead of filling up with empty labels.
          <div
            key={card.title}
            className="rounded-[22px] px-5 py-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${alpha(card.color, "33")}`
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div
                style={{
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 16,
                  fontWeight: 700
                }}
              >
                {card.title}
              </div>
              <div
                className="rounded-full px-3 py-1"
                style={{
                  background: alpha(card.color, "18"),
                  color: card.color,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "lowercase"
                }}
              >
                {card.severityLabel}
              </div>
              {card.priorityLabel && (
                <div
                  className="rounded-full px-3 py-1"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {index === 0 ? "Fix First" : card.priorityLabel}
                </div>
              )}
              {card.saveLabel && (
                <div
                  className="rounded-full px-3 py-1"
                  style={{
                    background: "rgba(34,197,94,0.14)",
                    color: "#22c55e",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {card.saveLabel}
                </div>
              )}
            </div>

            {card.rootCause && (
              <div className="mt-4">
                <div className="metis-overline text-white/35">Root Cause</div>
                <div style={{ color: "rgba(255,255,255,0.72)", fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "20px", marginTop: 8 }}>
                  {card.rootCause}
                </div>
              </div>
            )}

            {card.fix && (
              <div className="mt-4">
                <div className="metis-overline text-white/35">Recommendation</div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "20px", marginTop: 8 }}>
                  {card.fix}
                </div>
              </div>
            )}

            {card.scaleImpact && (
              <div className="mt-4">
                <div className="metis-overline text-white/35">Impact</div>
                <div
                  className="mt-2 rounded-[18px] px-4 py-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.62)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    lineHeight: "18px"
                  }}
                >
                  {card.scaleImpact}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function EndpointDetailSection({
  rows
}: {
  rows: MetisDesignViewModel["plusEndpointRows"];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="rounded-[24px] px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        Endpoint Detail
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.46)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          lineHeight: "18px",
          marginTop: 10
        }}
      >
        The busiest requests Metis saw on this route.
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.requestCountLabel}`}
            className="rounded-[20px] px-4 py-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: 700
                  }}
                >
                  <AcronymText text={row.label} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Type", value: row.categoryLabel },
                    { label: "Requests", value: row.requestCountLabel },
                    { label: "Size", value: row.sizeLabel }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[16px] px-3 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)"
                      }}
                    >
                      <div
                        style={{
                          color: "rgba(255,255,255,0.34)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase"
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.74)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          marginTop: 6
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface FullReportLayoutProps {
  viewModel: MetisDesignViewModel | null;
  scanScope: ScanScope;
  onSetScanScope: (scope: ScanScope) => void;
  currentQuestion: PlusQuestionDefinition | null;
  plusAnswers: PlusRefinementAnswers;
  isRefinementOpen: boolean;
  setIsRefinementOpen: (value: boolean) => void;
  onAnswer: (key: keyof PlusRefinementAnswers, value: string) => void;
  onBackQuestion: () => void;
  canGoBack: boolean;
  onCopyReport: () => void;
  isPlusUser?: boolean;
  hasExpandedSiteAccess?: boolean;
  onRequestExpandedSiteAccess?: () => void;
  headerAccessory?: ReactNode;
  refreshTick?: number;
  onClose?: () => void;
  onDegradeToFree?: () => void;
  showSampleProgress?: boolean;
  onOpenExport?: () => void;
  attachedLayout?: boolean;
}

export function FullReportLayout({
  viewModel,
  scanScope,
  onSetScanScope,
  currentQuestion,
  plusAnswers,
  isRefinementOpen,
  setIsRefinementOpen,
  onAnswer,
  onBackQuestion,
  canGoBack,
  onCopyReport,
  isPlusUser = false,
  hasExpandedSiteAccess = false,
  onRequestExpandedSiteAccess,
  headerAccessory,
  refreshTick = 0,
  onClose,
  onDegradeToFree,
  showSampleProgress = true,
  onOpenExport,
  attachedLayout = false
}: FullReportLayoutProps) {
  if (!viewModel) {
    return (
      <div className="metis-report-shell flex min-h-[480px] items-center justify-center rounded-[24px] text-white/50">
        Scanning this page…
      </div>
    );
  }

  const showExpandedSections = hasExpandedSiteAccess;
  const isPreviewOnly = !showExpandedSections;

  return (
    <motion.div
      className={`metis-report-shell flex h-full flex-col overflow-hidden ${
        attachedLayout ? "rounded-l-[28px] rounded-r-none" : "rounded-[24px]"
      }`}
      style={{
        border: isPlusUser ? "1px solid rgba(220,94,94,0.22)" : undefined,
        boxShadow: isPlusUser ? "0 30px 90px rgba(220,94,94,0.12)" : undefined
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-8 py-5"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.72)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div
            className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px]"
            style={{
              background: "#dc5e5e",
              color: "white",
              fontFamily: "Jua, sans-serif",
              fontSize: 28
            }}
          >
            M
          </div>
          <div>
            <div className="metis-display" style={{ color: "white", fontSize: 22 }}>
              {isPlusUser
                ? "Metis+ Full Report"
                : isPreviewOnly
                  ? "Metis Report Preview"
                  : "Metis Full Report"}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "Inter, sans-serif",
                fontSize: 13
              }}
            >
              {viewModel.hostname} · {viewModel.scannedAt}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPlusUser && onDegradeToFree ? (
            <button
              type="button"
              onClick={onDegradeToFree}
              className="rounded-full px-4 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.74)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Degrade to free
            </button>
          ) : null}
          <div
            className="rounded-full px-4 py-2"
            style={{
              border: "1px solid rgba(220,94,94,0.35)",
              color: "#dc5e5e",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}
          >
            Phase 4
          </div>
          {isPlusUser ? (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: "rgba(220,94,94,0.14)",
                border: "1px solid rgba(220,94,94,0.32)",
                color: "#dc5e5e",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              <Zap size={12} />
              Metis+
            </div>
          ) : hasExpandedSiteAccess ? (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: "rgba(34,197,94,0.14)",
                border: "1px solid rgba(34,197,94,0.32)",
                color: "#4ade80",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Expanded site access
            </div>
          ) : null}
          <div
            className="rounded-full px-4 py-2"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}
          >
            {viewModel.riskLabel}
          </div>
          {headerAccessory}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
            aria-label="Close report"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="metis-scroll flex-1 overflow-y-auto overflow-x-hidden px-8 py-7">
        <div className="space-y-6">
          <motion.div
            className="rounded-[28px] p-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04, ease: "easeOut" }}
          >
            <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_328px]">
              <div className="space-y-4">
                <SplitScoreSummary
                  viewModel={viewModel}
                  pulseKey={refreshTick}
                  scanScope={scanScope}
                  onSetScanScope={onSetScanScope}
                />
                <div
                  className="rounded-[22px] px-5 py-4"
                  style={{
                    background: isPlusUser ? "rgba(220,94,94,0.08)" : "rgba(255,255,255,0.04)",
                    border: isPlusUser
                      ? "1px solid rgba(220,94,94,0.18)"
                      : "1px solid rgba(255,255,255,0.07)"
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.32)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 10
                    }}
                  >
                    Quick Insight
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.78)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      lineHeight: "22px",
                      fontWeight: 500
                    }}
                  >
                    {viewModel.quickInsight}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      lineHeight: "18px",
                      marginTop: 10
                    }}
                  >
                    {viewModel.supportingDetail}
                  </div>
                  {isPlusUser ? (
                    <div
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{
                        background: "rgba(220,94,94,0.14)",
                        border: "1px solid rgba(220,94,94,0.28)",
                        color: "#dc5e5e",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      <Zap size={12} />
                      Plus read
                    </div>
                  ) : isPreviewOnly ? (
                    <div
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.78)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      Basic scan preview
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="overflow-hidden rounded-[24px]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)"
                }}
              >
                <div className="border-b px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      {viewModel.hostname}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {showSampleProgress && (
                        <div
                          className="rounded-full px-3 py-1.5"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.55)",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          <AcronymText text={viewModel.pagesSampledLabel} />
                        </div>
                      )}
                      <div
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.68)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        <Check size={12} />
                        <AcronymText text="Saved locally" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 px-5 py-5">
                  <div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.68)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12
                      }}
                    >
                      <AcronymText text="Current session cost" />
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        marginTop: 6
                      }}
                    >
                      Counting as page loads · estimated
                    </div>
                  </div>
                  <div
                    className="metis-display"
                    style={{
                      color: "white",
                      fontSize: 20
                    }}
                  >
                    {viewModel.sessionCost}
                  </div>
                </div>
                <div
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                  style={{
                    background: "rgba(220,94,94,0.10)",
                    borderTop: "1px solid rgba(220,94,94,0.18)"
                  }}
                >
                  <Zap size={15} style={{ color: "#dc5e5e" }} />
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13
                    }}
                  >
                    <AcronymText text="At 10k users →" />
                  </div>
                  <div
                    className="metis-display"
                    style={{
                      color: "#dc5e5e",
                      fontSize: 22
                    }}
                  >
                    {viewModel.monthlyProjection}
                  </div>
                </div>
              </div>
            </div>

            {viewModel.summaryPills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {viewModel.summaryPills.map((pill) => (
                  <motion.div
                    key={pill.label}
                    className="rounded-full px-4 py-2"
                    style={{
                      background:
                        pill.tone === "critical"
                          ? "rgba(239,68,68,0.16)"
                          : pill.tone === "moderate"
                            ? "rgba(220,94,94,0.16)"
                            : "rgba(234,179,8,0.16)",
                      color:
                        pill.tone === "critical"
                          ? "#ff5d55"
                          : pill.tone === "moderate"
                            ? "#dc5e5e"
                            : "#facc15",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    {pill.label}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            className="metis-report-grid"
            initial={{ opacity: 0.9, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
          >
            <div className="space-y-6">
              <TopIssuesList
                issues={viewModel.issues}
                title="Problems · Sorted by Severity"
                showSummaryPills={false}
                showDetails={showExpandedSections}
              />
            </div>

            <div className="space-y-6">
              <DetectedStackBadges chips={viewModel.stackChips} groups={viewModel.stackGroups} />
            </div>
          </motion.div>

          {showExpandedSections && (
            <motion.div
              className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
              initial={{ opacity: 0.9, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.1, ease: "easeOut" }}
            >
              <CostBreakdown rows={viewModel.costRows} />
              <EndpointDetailSection rows={viewModel.plusEndpointRows} />
            </motion.div>
          )}

          {isPreviewOnly && onRequestExpandedSiteAccess ? (
            <motion.div
              className="rounded-[24px] p-5"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.18)"
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.1, ease: "easeOut" }}
            >
              <div
                style={{
                  color: "white",
                  fontFamily: "Jua, sans-serif",
                  fontSize: 20
                }}
              >
                Deeper insights are available on this site
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.64)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  lineHeight: "20px",
                  marginTop: 10
                }}
              >
                Allow Metis on this site to analyze more routes, improve accuracy, and keep the page workspace available here.
              </div>
              <button
                type="button"
                onClick={onRequestExpandedSiteAccess}
                className="mt-4 rounded-full px-4 py-2"
                style={{
                  background: "#22c55e",
                  color: "#04110a",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Enable deeper scan
              </button>
            </motion.div>
          ) : null}

          <motion.div
            className="rounded-[28px] p-6"
            style={{
              background: "rgba(220,94,94,0.08)",
              border: "1px solid rgba(220,94,94,0.2)"
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div
                  style={{
                    color: "#dc5e5e",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase"
                  }}
                >
                  <AcronymText text="Add Page Context" />
                </div>
                <div
                  style={{
                    color: "white",
                    fontFamily: "Jua, sans-serif",
                    fontSize: 22,
                    marginTop: 12
                  }}
                >
                  <AcronymText text="Add Page Context" />
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.42)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: 10
                  }}
                >
                  Keeps the read fair without changing the scan
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    lineHeight: "20px",
                    marginTop: 10,
                    maxWidth: 760
                  }}
                >
                  Answer a couple of quick context questions so Metis can judge this route more fairly. The raw scan stays the same.
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsRefinementOpen(!isRefinementOpen)}
                className="rounded-full px-5 py-3"
                style={{
                  background: "#dc5e5e",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 700
                }}
                whileHover={{ scale: 1.03, boxShadow: "0 10px 28px rgba(220,94,94,0.28)" }}
                whileTap={{ scale: 0.98 }}
              >
                <AcronymText text={isRefinementOpen ? "Hide questions" : "Answer context questions"} />
              </motion.button>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
              {isRefinementOpen && currentQuestion && (
                <div
                  className="rounded-[24px] px-5 py-5"
                  style={{
                    background: "rgba(12,22,35,0.45)",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.28)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase"
                    }}
                  >
                    <AcronymText text={currentQuestion.group} />
                  </div>
                  {canGoBack && (
                    <button
                      type="button"
                      onClick={onBackQuestion}
                      className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.72)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      <ArrowLeft size={12} />
                      Back
                    </button>
                  )}
                  <div
                    style={{
                      color: "white",
                      fontFamily: "Jua, sans-serif",
                      fontSize: 20,
                      marginTop: 10
                    }}
                  >
                    <AcronymText text={currentQuestion.label} />
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      marginTop: 10
                    }}
                  >
                    <AcronymText text={currentQuestion.helper} />
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.42)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      marginTop: 12
                    }}
                  >
                    <AcronymText text={currentQuestion.whyItMatters} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {currentQuestion.options.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => onAnswer(currentQuestion.key, option.value)}
                        className="rounded-full px-4 py-2"
                        style={{
                          ...optionStyle(
                            option,
                            plusAnswers[currentQuestion.key] === option.value
                          ),
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          fontWeight: 600
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AcronymText text={option.label} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {(viewModel.questionState.summary || viewModel.questionState.detail) && (
                <div
                  className="rounded-[24px] px-5 py-5"
                  style={{
                    background: isPlusUser ? "rgba(220,94,94,0.08)" : "rgba(255,255,255,0.04)",
                    border: isPlusUser
                      ? "1px solid rgba(220,94,94,0.18)"
                      : "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div
                      style={{
                        color: "white",
                        fontFamily: "Jua, sans-serif",
                        fontSize: 18
                      }}
                    >
                      <AcronymText text={viewModel.questionState.summary ?? "Refinement ready"} />
                    </div>
                    {viewModel.questionState.priorityLabel && (
                      <div
                        className="rounded-full px-4 py-2"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.7)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase"
                        }}
                      >
                        <AcronymText text={viewModel.questionState.priorityLabel} />
                      </div>
                    )}
                  </div>
                  {viewModel.questionState.detail && (
                    <div
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        lineHeight: "21px",
                        marginTop: 12
                      }}
                    >
                      <AcronymText text={viewModel.questionState.detail} />
                    </div>
                  )}
                  {viewModel.questionState.contextNotes.length > 1 ? (
                    <div className="mt-4 space-y-2">
                      {viewModel.questionState.contextNotes.slice(1).map((note) => (
                        <div
                          key={note}
                          style={{
                            color: "rgba(255,255,255,0.52)",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            lineHeight: "18px"
                          }}
                        >
                          <AcronymText text={note} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {viewModel.questionState.nextStep && (
                    <div
                      className="mt-4 rounded-[18px] px-4 py-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.72)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        lineHeight: "18px"
                      }}
                    >
                      <AcronymText text={viewModel.questionState.nextStep} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {showExpandedSections && (
            <ScaleSimulationSection
              aiCostPerRequestEstimate={viewModel.aiCostPerRequestEstimate}
              rows={viewModel.scaleSimulationRows}
            />
          )}

          {showExpandedSections && (
            <FixRecommendationsSection
              cards={viewModel.fixRecommendationCards}
              totalSavingsLabel={viewModel.totalSavingsLabel}
            />
          )}
        </div>
      </div>

      <div
        className="flex shrink-0 items-center justify-between border-t px-7 py-4"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.2)",
            fontFamily: "Inter, sans-serif",
            fontSize: 10
          }}
        >
          {METIS_SITE_LABEL}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={onCopyReport}
            className="flex items-center gap-2 rounded-[18px] px-5 py-3"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 700
            }}
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Copy size={15} />
            <AcronymText text="Copy" />
          </motion.button>
          <motion.button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-2 rounded-[18px] px-6 py-3"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.72)",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 700
            }}
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={15} />
            <AcronymText text="Export" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
