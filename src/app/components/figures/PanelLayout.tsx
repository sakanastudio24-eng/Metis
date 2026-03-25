/**
 * PanelLayout
 * Zip-authoritative mini/full panel body bound to live Phase 4 data.
 */
import { Check } from "lucide-react";
import { motion } from "motion/react";
import type { MetisDesignViewModel } from "./liveAdapter";
import { ScoreVisualization } from "./ScoreVisualization";
import { TopIssuesList } from "./TopIssuesList";
import { DetectedStackBadges } from "./DetectedStackBadges";

interface PanelLayoutProps {
  viewModel: MetisDesignViewModel | null;
  compact?: boolean;
  refreshTick?: number;
}

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

export function PanelLayout({
  viewModel,
  compact = false,
  refreshTick = 0
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
        className="flex flex-col items-center gap-4"
        key={refreshTick}
        initial={{ opacity: 0.88, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
      >
        <ScoreVisualization
          score={viewModel.score}
          size={compact ? 108 : 138}
          color={viewModel.riskColor}
          trackColor="rgba(255,255,255,0.08)"
          pulseKey={refreshTick}
        />

        <div className="text-center">
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "Inter, sans-serif",
              fontSize: compact ? 14 : 18
            }}
          >
            Cost Risk:{" "}
            <span style={{ color: "white", fontWeight: 700 }}>{viewModel.score}</span>
          </div>
        </div>

        <RiskBadge
          label={viewModel.riskLabel}
          color={viewModel.riskColor}
          background={viewModel.riskBg}
        />

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: viewModel.controlBg,
            color: viewModel.controlColor,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: viewModel.controlColor }}
          />
          Control: {viewModel.controlLabel}
        </div>

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
            {viewModel.quickInsight}
          </div>
        </motion.div>
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
                {viewModel.pagesSampledLabel}
              </div>
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
                Page saved
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
                Current session cost ({viewModel.scopeLabel.toLowerCase()})
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 10 : 11,
                  marginTop: 4
                }}
              >
                Counting as page loads · estimated
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
            background: "rgba(99,102,241,0.09)",
            borderTop: "1px solid rgba(99,102,241,0.18)"
          }}
        >
          <div style={{ color: "#a5b4fc", fontSize: 16 }}>⚡</div>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12
            }}
          >
            At 10k users →
          </div>
          <div
            style={{
              color: "#aeb5ff",
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
