import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import type { MetisDesignViewModel } from "./liveAdapter";
import { ScoreVisualization } from "./ScoreVisualization";
import { AcronymText } from "./AcronymTooltipText";

interface SplitScoreSummaryProps {
  viewModel: MetisDesignViewModel;
  compact?: boolean;
  pulseKey?: number;
}

function SummaryCard({
  title,
  score,
  label,
  color,
  background,
  summary,
  reasons = [],
  compact = false,
  delay = 0,
  icon
}: {
  title: string;
  score: number;
  label: string;
  color: string;
  background: string;
  summary: string;
  reasons?: string[];
  compact?: boolean;
  delay?: number;
  icon: typeof AlertTriangle;
}) {
  const Icon = icon;

  return (
    <motion.div
      className="rounded-[22px] px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="inline-flex items-center gap-2"
            style={{
              color: "rgba(255,255,255,0.36)",
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 10 : 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}
          >
            <Icon size={compact ? 11 : 12} style={{ color }} />
            <AcronymText text={title} />
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div
              className="metis-display"
              style={{
                color: "white",
                fontSize: compact ? 24 : 30,
                lineHeight: 1
              }}
            >
              {score}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.42)",
                fontFamily: "Inter, sans-serif",
                fontSize: compact ? 10 : 11,
                marginBottom: 4
              }}
            >
              /100
            </div>
          </div>
        </div>

        <div
          className="rounded-full px-3 py-1.5"
          style={{
            background,
            color,
            fontFamily: "Inter, sans-serif",
            fontSize: compact ? 10 : 11,
            fontWeight: 700
          }}
        >
          <AcronymText text={label} />
        </div>
      </div>

      <div
        style={{
          color: compact ? "rgba(255,255,255,0.56)" : "rgba(255,255,255,0.64)",
          fontFamily: "Inter, sans-serif",
          fontSize: compact ? 11 : 12,
          lineHeight: compact ? "17px" : "19px",
          marginTop: compact ? 10 : 12
        }}
      >
        <AcronymText text={summary} />
      </div>

      {!compact && reasons.length > 0 && (
        <div className="mt-3 space-y-2">
          {reasons.slice(0, 2).map((reason) => (
            <div
              key={reason}
              className="rounded-[16px] px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.56)",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                lineHeight: "17px"
              }}
            >
              <AcronymText text={reason} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function SplitScoreSummary({
  viewModel,
  compact = false,
  pulseKey = 0
}: SplitScoreSummaryProps) {
  const combinedTone =
    viewModel.combinedScore >= 65
      ? "#22c55e"
      : viewModel.combinedScore >= 40
        ? "#f59e0b"
        : "#ef4444";

  return (
    <motion.div
      className={compact ? "grid grid-cols-2 gap-3" : "grid gap-4 lg:grid-cols-2"}
      key={pulseKey}
      initial={{ opacity: 0.92, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <motion.div
        className={compact ? "col-span-2 rounded-[22px] px-4 py-4" : "rounded-[24px] px-5 py-5 lg:col-span-2"}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <ScoreVisualization
            score={viewModel.combinedScore}
            size={compact ? 88 : 116}
            color={combinedTone}
            trackColor="rgba(255,255,255,0.08)"
            pulseKey={pulseKey}
          />
          <div className="min-w-0">
            <div
              style={{
                color: "rgba(255,255,255,0.36)",
                fontFamily: "Inter, sans-serif",
                fontSize: compact ? 10 : 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              <AcronymText text="Combined Score" />
            </div>
            <div
              className="metis-display"
              style={{
                color: "white",
                fontSize: compact ? 24 : 30,
                lineHeight: 1,
                marginTop: 8
              }}
            >
              {viewModel.combinedScore}/100
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div
                className="rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 10 : 11,
                  fontWeight: 700
                }}
              >
                <AcronymText text={`Cost Risk ${viewModel.combinedBreakdown.costRisk}/100`} />
              </div>
              <div
                className="rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 10 : 11,
                  fontWeight: 700
                }}
              >
                <AcronymText text={`Control ${viewModel.combinedBreakdown.control}/100`} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SummaryCard
        title={viewModel.splitSummary.costRisk.title}
        score={viewModel.splitSummary.costRisk.score}
        label={viewModel.splitSummary.costRisk.label}
        color={viewModel.splitSummary.costRisk.color}
        background={viewModel.splitSummary.costRisk.background}
        summary={compact ? viewModel.estimateRange : viewModel.splitSummary.costRisk.summary}
        compact={compact}
        icon={AlertTriangle}
      />
      <SummaryCard
        title={viewModel.splitSummary.control.title}
        score={viewModel.splitSummary.control.score}
        label={viewModel.splitSummary.control.label}
        color={viewModel.splitSummary.control.color}
        background={viewModel.splitSummary.control.background}
        summary={viewModel.splitSummary.control.summary}
        reasons={compact ? [] : viewModel.controlReasons}
        compact={compact}
        delay={0.04}
        icon={ShieldCheck}
      />
    </motion.div>
  );
}
