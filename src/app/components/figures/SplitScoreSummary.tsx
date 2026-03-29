import {
  Activity,
  AlertTriangle,
  ArrowUp,
  ChevronUp,
  Minus,
  ShieldCheck
} from "lucide-react";
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
  const trend =
    label === "Healthy" || label === "Controlled"
      ? { icon: Minus, color: "#22c55e", background: "rgba(34,197,94,0.12)" }
      : label === "Moderate Risk" || label === "Mixed"
        ? { icon: ArrowUp, color: "#f97316", background: "rgba(249,115,22,0.12)" }
      : label === "High Risk" || label === "Uncontrolled"
          ? { icon: ChevronUp, color: "#dc5e5e", background: "rgba(220,94,94,0.12)" }
          : { icon: Minus, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)" };
  const TrendIcon = trend.icon;

  return (
    <motion.div
      className="rounded-[22px] px-4 py-4"
      style={{
        background,
        border: `1px solid ${color}22`
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
          className="inline-flex items-center justify-center rounded-full"
          style={{
            background: trend.background,
            color: trend.color,
            width: compact ? 28 : 32,
            height: compact ? 28 : 32
          }}
          aria-label={label}
          title={label}
        >
          <TrendIcon size={compact ? 13 : 15} />
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

function ConfidenceStrip({
  label,
  detail,
  compact
}: {
  label: string;
  detail: string;
  compact: boolean;
}) {
  const tone =
    label === "High"
      ? { color: "#22c55e", background: "rgba(34,197,94,0.12)" }
      : label === "Moderate"
        ? { color: "#f97316", background: "rgba(249,115,22,0.12)" }
        : { color: "#dc5e5e", background: "rgba(220,94,94,0.12)" };

  return (
    <motion.div
      className={compact ? "col-span-2 rounded-[20px] px-4 py-3" : "rounded-[22px] px-4 py-4 lg:col-span-2"}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.06, ease: "easeOut" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: tone.background, color: tone.color }}
        >
          <Activity size={14} />
        </div>
        <div className="min-w-0 flex-1">
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
            <AcronymText text="Confidence" />
          </div>
          <div
            className="mt-1"
            style={{
              color: tone.color,
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 12 : 13,
              fontWeight: 700
            }}
          >
            <AcronymText text={label} />
          </div>
          <div
            className="mt-2"
            style={{
              color: "rgba(255,255,255,0.62)",
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 11 : 12,
              lineHeight: compact ? "17px" : "19px"
            }}
          >
            <AcronymText text={detail} />
          </div>
        </div>
      </div>
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
        ? "#f97316"
        : "#dc5e5e";

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
      <ConfidenceStrip
        label={viewModel.confidenceLabel}
        detail={viewModel.confidenceDetail}
        compact={compact}
      />
    </motion.div>
  );
}
