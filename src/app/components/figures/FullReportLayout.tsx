/**
 * FullReportLayout
 * Treats the dashboard as a wide report surface instead of a slightly larger
 * panel. The overview is intentionally compact so the dashboard can fit more
 * meaningful sections above the fold.
 */
import type { ReactNode } from "react";
import { Bot, Camera, Copy, Download, Target, X } from "lucide-react";
import { motion } from "motion/react";
import type { ScanScope } from "../../useMetisState";
import type { PlusQuestionDefinition } from "../../../features/refinement/config";
import type { PlusRefinementAnswers } from "../../../shared/types/audit";
import type { MetisDesignViewModel } from "./liveAdapter";
import { ScoreVisualization } from "./ScoreVisualization";
import { TopIssuesList } from "./TopIssuesList";
import { CostBreakdown } from "./CostBreakdown";
import { DetectedStackBadges } from "./DetectedStackBadges";

function RiskBadge({
  label,
  color,
  background
}: {
  label: string;
  color: string;
  background: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-2"
      style={{
        background,
        color,
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 600
      }}
    >
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

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
          Scale Simulation · Plus
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
        <div
          className="mt-4 rounded-[18px] px-4 py-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)"
          }}
        >
          <div className="flex items-center gap-2">
            <Bot size={14} style={{ color: "#17c690" }} />
            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              AI cost per request (est.)
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
            Based on detected AI-style usage.
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
  cards
}: {
  cards: MetisDesignViewModel["fixRecommendationCards"];
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
              color: "#dc8d72",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}
          >
            Fix Recommendations · Metis+
          </div>
          <div
            style={{
              color: "white",
              fontFamily: "Jua, sans-serif",
              fontSize: 22,
              marginTop: 10
            }}
          >
            Total savings: ~${cards.reduce((sum, card) => sum + Number(card.saveLabel?.replace(/[^\d]/g, "") || 0), 0)}/mo
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {cards.map((card, index) => (
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
                    color: "#4ade80",
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
                <div className="metis-overline text-white/35">Fix</div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "20px", marginTop: 8 }}>
                  {card.fix}
                </div>
              </div>
            )}

            {card.scaleImpact && (
              <div
                className="mt-4 rounded-[18px] px-4 py-4"
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
            )}
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
  onCopyReport: () => void;
  onCapture?: () => void;
  onUpgrade?: () => void;
  isPlusUser?: boolean;
  headerAccessory?: ReactNode;
  refreshTick?: number;
  onClose?: () => void;
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
  onCopyReport,
  onCapture,
  onUpgrade,
  isPlusUser = false,
  headerAccessory,
  refreshTick = 0,
  onClose
}: FullReportLayoutProps) {
  if (!viewModel) {
    return (
      <div className="metis-report-shell flex min-h-[480px] items-center justify-center rounded-[24px] text-white/50">
        Scanning this page…
      </div>
    );
  }

  return (
    <motion.div
      className="metis-report-shell flex h-full flex-col overflow-hidden rounded-[24px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-8 py-5"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-4">
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
              Metis Full Report
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
          <div
            className="rounded-full px-4 py-2"
            style={{
              border: "1px solid rgba(220,94,94,0.35)",
              color: "#dc8d72",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase"
            }}
          >
            Phase 4
          </div>
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
          {isPlusUser ? (
            <div
              className="rounded-full px-4 py-2"
              style={{
                border: "1px solid rgba(220,94,94,0.34)",
                background: "rgba(220,94,94,0.14)",
                color: "#dc8d72",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 10px 22px rgba(220,94,94,0.12)"
              }}
            >
              Plus
            </div>
          ) : onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-full px-4 py-2"
              style={{
                border: "1px solid rgba(220,94,94,0.28)",
                background: "rgba(220,94,94,0.1)",
                color: "#dc8d72",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Get Plus
            </button>
          ) : null}
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

      <div className="metis-scroll flex-1 overflow-y-auto px-8 py-7">
        <div className="space-y-6">
          <motion.div
            key={`overview-${refreshTick}`}
            className="rounded-[28px] p-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04, ease: "easeOut" }}
          >
            <div className="grid items-start gap-6 xl:grid-cols-[134px_minmax(0,1fr)_328px]">
              <div className="flex flex-col items-center justify-start gap-4">
                <ScoreVisualization
                  score={viewModel.score}
                  size={126}
                  color={viewModel.riskColor}
                  trackColor="rgba(255,255,255,0.08)"
                  pulseKey={refreshTick}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className="metis-display"
                    style={{
                      color: "white",
                      fontSize: 32,
                      lineHeight: 1
                    }}
                  >
                    {viewModel.score}
                  </div>
                  <RiskBadge
                    label={viewModel.riskLabel}
                    color={viewModel.riskColor}
                    background={viewModel.riskBg}
                  />
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14
                  }}
                >
                  Cost Risk Score
                </div>

                <div
                  className="rounded-[22px] px-5 py-4"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <div
                    className="metis-display"
                    style={{
                      color: "white",
                      fontSize: 18
                    }}
                  >
                    {viewModel.estimateRange}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.42)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      lineHeight: "18px",
                      marginTop: 8
                    }}
                  >
                    Driven by bandwidth, requests, and API usage.
                  </div>
                </div>

                <div
                  className="rounded-[22px] px-5 py-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)"
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
                        {viewModel.pagesSampledLabel}
                      </div>
                      <button
                        type="button"
                        onClick={() => onCapture?.()}
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
                        <Camera size={12} />
                        Capture
                      </button>
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
                      Current session cost ({viewModel.scopeLabel.toLowerCase()})
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
                    background: "rgba(99,102,241,0.10)",
                    borderTop: "1px solid rgba(99,102,241,0.18)"
                  }}
                >
                  <div style={{ color: "#a5b4fc", fontSize: 16 }}>⚡</div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13
                    }}
                  >
                    At 10k users →
                  </div>
                  <div
                    className="metis-display"
                    style={{
                      color: "#aeb5ff",
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
                            ? "rgba(249,115,22,0.16)"
                            : "rgba(234,179,8,0.16)",
                      color:
                        pill.tone === "critical"
                          ? "#ff5d55"
                          : pill.tone === "moderate"
                            ? "#ff8b22"
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
            key={`body-${refreshTick}`}
            initial={{ opacity: 0.9, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
          >
            <div className="space-y-6">
              <TopIssuesList
                issues={viewModel.issues}
                title="Problems · Sorted by Severity"
                showSummaryPills={false}
              />
              <CostBreakdown rows={viewModel.costRows} />
            </div>

            <div className="space-y-6">
              <DetectedStackBadges chips={viewModel.stackChips} groups={viewModel.stackGroups} />
            </div>
          </motion.div>

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
                    color: "#dc8d72",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase"
                  }}
                >
                  Improve Accuracy
                </div>
                <div
                  style={{
                    color: "white",
                    fontFamily: "Jua, sans-serif",
                    fontSize: 22,
                    marginTop: 12
                  }}
                >
                  Improve Accuracy
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
                  Updates score in real time
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
                  Answer a few stack and traffic questions to sharpen the cost interpretation without changing the underlying scan.
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
                {isRefinementOpen ? "Hide questions" : "Refine This Report"}
              </motion.button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
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
                    {currentQuestion.group}
                  </div>
                  <div
                    style={{
                      color: "white",
                      fontFamily: "Jua, sans-serif",
                      fontSize: 20,
                      marginTop: 10
                    }}
                  >
                    {currentQuestion.label}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      marginTop: 10
                    }}
                  >
                    {currentQuestion.helper}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.42)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      marginTop: 12
                    }}
                  >
                    {currentQuestion.whyItMatters}
                  </div>

                  <div
                    className="mt-5 rounded-[18px] px-4 py-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    <div
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginBottom: 10
                      }}
                    >
                      Scan Scope
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSetScanScope("single")}
                        className="rounded-full px-5 py-3"
                        style={{
                          background: scanScope === "single" ? "#ff7a1a" : "#0f2740",
                          color: scanScope === "single" ? "#0c1623" : "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        Single Page
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetScanScope("multi")}
                        className="rounded-full px-5 py-3"
                        style={{
                          background: scanScope === "multi" ? "#ff7a1a" : "#0f2740",
                          color: scanScope === "multi" ? "#0c1623" : "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        Multipage
                      </button>
                    </div>
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
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {(viewModel.questionState.summary || viewModel.questionState.detail) && (
                <div
                  className="rounded-[24px] px-5 py-5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)"
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
                      {viewModel.questionState.summary ?? "Plus refinement ready"}
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
                        {viewModel.questionState.priorityLabel}
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
                      {viewModel.questionState.detail}
                    </div>
                  )}
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
                      {viewModel.questionState.nextStep}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {isPlusUser && (
            <ScaleSimulationSection
              aiCostPerRequestEstimate={viewModel.aiCostPerRequestEstimate}
              rows={viewModel.scaleSimulationRows}
            />
          )}

          {isPlusUser && <FixRecommendationsSection cards={viewModel.fixRecommendationCards} />}
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
          ward.studio/metis
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
            Copy
          </motion.button>
          <motion.button
            type="button"
            onClick={onUpgrade}
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
            Export PDF (Plus)
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
