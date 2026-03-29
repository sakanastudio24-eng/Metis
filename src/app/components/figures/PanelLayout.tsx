/**
 * PanelLayout
 * Zip-authoritative mini/full panel body bound to live Phase 4 data.
 */
import { Check, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { MetisDesignViewModel } from "./liveAdapter";
import { SplitScoreSummary } from "./SplitScoreSummary";
import { TopIssuesList } from "./TopIssuesList";
import { DetectedStackBadges } from "./DetectedStackBadges";
import { AcronymText } from "./AcronymTooltipText";
import type { PlusQuestionDefinition } from "../../../features/refinement/config";
import type { PlusRefinementAnswers } from "../../../shared/types/audit";

interface PanelLayoutProps {
  viewModel: MetisDesignViewModel | null;
  compact?: boolean;
  refreshTick?: number;
  showSampleProgress?: boolean;
  currentFairnessQuestion?: PlusQuestionDefinition | null;
  onAnswer?: (key: keyof PlusRefinementAnswers, value: string) => void;
}

function FairnessQuestionCard({
  question,
  onAnswer
}: {
  question: PlusQuestionDefinition;
  onAnswer: (key: keyof PlusRefinementAnswers, value: string) => void;
}) {
  return (
    <motion.div
      className="w-full rounded-[24px] px-5 py-5"
      style={{
        background: "rgba(220,94,94,0.08)",
        border: "1px solid rgba(220,94,94,0.18)"
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: 0.08, ease: "easeOut" }}
    >
      <div
        style={{
          color: "#dc8d72",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}
      >
        Add page context
      </div>
      <div
        style={{
          color: "white",
          fontFamily: "Jua, sans-serif",
          fontSize: 18,
          marginTop: 10
        }}
      >
        <AcronymText text={question.label} />
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.6)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          lineHeight: "18px",
          marginTop: 8
        }}
      >
        <AcronymText text={question.helper} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAnswer(question.key, option.value)}
            className="rounded-full px-3.5 py-2"
            style={{
              background: option.brandColor ? `${option.brandColor}20` : "rgba(255,255,255,0.06)",
              border: `1px solid ${option.brandColor ? `${option.brandColor}3d` : "rgba(255,255,255,0.1)"}`,
              color: option.brandColor ?? "rgba(255,255,255,0.82)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <AcronymText text={option.label} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function PanelLayout({
  viewModel,
  compact = false,
  refreshTick = 0,
  showSampleProgress = true,
  currentFairnessQuestion = null,
  onAnswer
}: PanelLayoutProps) {
  if (!viewModel) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center rounded-[24px]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.45)",
          fontFamily: "Inter, sans-serif",
          fontSize: 12
        }}
      >
        Scanning this page…
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0.94, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <SplitScoreSummary viewModel={viewModel} compact pulseKey={refreshTick} />

        <motion.div
          className="w-full rounded-[24px] px-5 py-5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)"
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06, ease: "easeOut" }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 12 : 14,
              lineHeight: compact ? "20px" : "22px",
              fontWeight: 500
            }}
          >
            <AcronymText text={viewModel.quickInsight} />
          </div>
        </motion.div>

        {currentFairnessQuestion && onAnswer ? (
          <FairnessQuestionCard
            question={currentFairnessQuestion}
            onAnswer={onAnswer}
          />
        ) : null}
      </motion.div>

      <motion.div
        className="overflow-hidden rounded-[28px]"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)"
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, delay: 0.08, ease: "easeOut" }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="min-w-0 truncate"
              style={{
                color: "rgba(255,255,255,0.38)",
                fontFamily: "Inter, sans-serif",
                fontSize: compact ? 11 : 12,
                fontWeight: 600
              }}
            >
              {viewModel.hostname}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showSampleProgress && (
                <div
                  className="whitespace-nowrap rounded-full px-3 py-1.5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: compact ? 10 : 11,
                    fontWeight: 700
                  }}
                >
                  <AcronymText text={viewModel.pagesSampledLabel} />
                </div>
              )}
              <div
                className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.68)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 10 : 11,
                  fontWeight: 700
                }}
              >
                <Check size={compact ? 10 : 11} />
                <AcronymText text="Saved locally" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 11 : 13,
                  lineHeight: compact ? "16px" : "20px"
                }}
              >
                <AcronymText text="Current session cost" />
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 10 : 11,
                  marginTop: 4
                }}
              >
                <AcronymText text="Counting as page loads · estimated" />
              </div>
            </div>
            <div
              style={{
                color: "white",
                fontFamily: "Jua, sans-serif",
                fontSize: compact ? 18 : 22
              }}
            >
              {viewModel.sessionCost}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            background: "rgba(249,115,22,0.09)",
            borderTop: "1px solid rgba(249,115,22,0.18)"
          }}
        >
          <Zap size={15} style={{ color: "#f97316" }} />
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12
            }}
          >
            <AcronymText text="At 10k users →" />
          </div>
          <div
            style={{
              color: "#ff9c48",
              fontFamily: "Jua, sans-serif",
              fontSize: compact ? 18 : 20
            }}
          >
            {viewModel.monthlyProjection}
          </div>
        </div>
      </motion.div>

      <TopIssuesList
        issues={compact ? viewModel.topIssues.slice(0, 3) : viewModel.topIssues}
        summaryPills={viewModel.summaryPills}
        compact={compact}
      />

      <DetectedStackBadges chips={viewModel.stackChips} compact={compact} />
    </motion.div>
  );
}
