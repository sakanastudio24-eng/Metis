/**
 * TopIssuesList
 * Prototype issue rows and severity summary pills.
 */
import type { DesignIssue, DesignSummaryPill } from "./liveAdapter";

function summaryToneStyle(tone: DesignSummaryPill["tone"]) {
  if (tone === "critical") {
    return {
      background: "rgba(239,68,68,0.16)",
      color: "#ff5d55"
    };
  }

  if (tone === "moderate") {
    return {
      background: "rgba(249,115,22,0.16)",
      color: "#ff8b22"
    };
  }

  return {
    background: "rgba(234,179,8,0.16)",
    color: "#facc15"
  };
}

function severityPillStyle(severity: DesignIssue["severityLabel"]) {
  if (severity === "critical") {
    return {
      background: "rgba(239,68,68,0.14)",
      color: "#ff5d55"
    };
  }

  if (severity === "moderate") {
    return {
      background: "rgba(249,115,22,0.14)",
      color: "#ff8b22"
    };
  }

  return {
    background: "rgba(234,179,8,0.14)",
    color: "#facc15"
  };
}

interface TopIssuesListProps {
  issues: DesignIssue[];
  summaryPills?: DesignSummaryPill[];
  compact?: boolean;
  title?: string;
}

export function TopIssuesList({
  issues,
  summaryPills = [],
  compact = false,
  title = "Top Issues"
}: TopIssuesListProps) {
  return (
    <div className="space-y-3">
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

      {summaryPills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summaryPills.map((pill) => (
            <div
              key={pill.label}
              className="rounded-full px-4 py-2"
              style={{
                ...summaryToneStyle(pill.tone),
                fontFamily: "Inter, sans-serif",
                fontSize: compact ? 11 : 12,
                fontWeight: 600
              }}
            >
              {pill.label}
            </div>
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
          No major issues surfaced in the current scan.
        </div>
      ) : (
        <div className="space-y-0">
          {issues.map((issue, index) => (
            <div
              key={issue.id}
              className={`flex items-center justify-between gap-4 ${index < issues.length - 1 ? "border-b" : ""}`}
              style={{
                padding: compact ? "14px 0" : "16px 0",
                borderColor: "rgba(255,255,255,0.08)"
              }}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: issue.color, flexShrink: 0 }}
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
                  {issue.title}
                </div>
              </div>
              <div
                className="rounded-full px-4 py-1.5"
                style={{
                  ...severityPillStyle(issue.severityLabel),
                  fontFamily: "Inter, sans-serif",
                  fontSize: compact ? 11 : 12,
                  fontWeight: 500,
                  textTransform: "lowercase"
                }}
              >
                {issue.severityLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
