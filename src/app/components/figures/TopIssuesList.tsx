/**
 * TopIssuesList
 * Prototype issue rows and severity summary pills.
 */
import { motion } from "motion/react";
import type { DesignIssue, DesignSummaryPill } from "./liveAdapter";
import { AcronymText } from "./AcronymTooltipText";

function summaryToneStyle(tone: DesignSummaryPill["tone"]) {
  if (tone === "critical") {
    return {
      background: "rgba(220,94,94,0.16)",
      color: "#dc5e5e"
    };
  }

  if (tone === "moderate") {
    return {
      background: "rgba(249,115,22,0.16)",
      color: "#ff8b22"
    };
  }

  return {
    background: "rgba(249,115,22,0.1)",
    color: "#f97316"
  };
}

function severityPillStyle(severity: DesignIssue["severityLabel"]) {
  if (severity === "critical") {
    return {
      background: "rgba(220,94,94,0.14)",
      color: "#dc5e5e"
    };
  }

  if (severity === "moderate") {
    return {
      background: "rgba(249,115,22,0.14)",
      color: "#ff8b22"
    };
  }

  return {
    background: "rgba(249,115,22,0.1)",
    color: "#f97316"
  };
}

interface TopIssuesListProps {
  issues: DesignIssue[];
  summaryPills?: DesignSummaryPill[];
  compact?: boolean;
  title?: string;
  showSummaryPills?: boolean;
}

export function TopIssuesList({
  issues,
  summaryPills = [],
  compact = false,
  title = "Top Issues",
  showSummaryPills = true
}: TopIssuesListProps) {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.3)",
          fontFamily: "Inter, sans-serif",
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}
      >
        {title}
      </div>

      {showSummaryPills && summaryPills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summaryPills.map((pill, index) => (
            <motion.div
              key={pill.label}
              className="rounded-full px-4 py-2"
              style={{
                ...summaryToneStyle(pill.tone),
                fontFamily: "Inter, sans-serif",
                fontSize: compact ? 11 : 12,
                fontWeight: 600
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
            >
              <AcronymText text={pill.label} />
            </motion.div>
          ))}
        </div>
      )}

      {issues.length === 0 ? (
        <div
          className="rounded-[22px] px-4 py-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Inter, sans-serif",
            fontSize: compact ? 11 : 12
          }}
        >
          <AcronymText text="No major issues surfaced in the current scan." />
        </div>
      ) : (
        <div className="space-y-0">
          {issues.map((issue, index) => (
            <motion.div
              key={issue.id}
              className={`${index < issues.length - 1 ? "border-b" : ""}`}
              style={{
                padding: compact ? "14px 0" : "16px 0",
                borderColor: "rgba(255,255,255,0.08)"
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.05, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: issue.color, flexShrink: 0, marginTop: compact ? 1 : 3 }}
                    />
                    <div
                      className="truncate"
                      style={{
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: compact ? 12 : 14,
                        fontWeight: 500
                      }}
                    >
                      <AcronymText text={issue.title} />
                    </div>
                  </div>
                  {!compact && (
                    <div
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        lineHeight: "18px",
                        marginLeft: 28,
                        marginTop: 8
                      }}
                    >
                      <AcronymText text={issue.detail} />
                    </div>
                  )}
                </div>
                <div
                  className="rounded-full px-4 py-1.5"
                  style={{
                    ...severityPillStyle(issue.severityLabel),
                    fontFamily: "Inter, sans-serif",
                    fontSize: compact ? 11 : 12,
                    fontWeight: 500,
                    textTransform: "lowercase",
                    flexShrink: 0
                  }}
                >
                  {issue.severityLabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
