/**
 * TopIssuesList
 * Displays detected issues with severity color-coding.
 * Shows up to N issues with title and severity badge.
 */
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { DetectedIssue, Severity } from "../../../shared/types/audit";

const SEVERITY_CONFIG: Record<Severity, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  high: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    icon: AlertCircle
  },
  medium: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    icon: AlertTriangle
  },
  low: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    icon: Info
  }
};

interface TopIssuesListProps {
  issues: DetectedIssue[];
  maxItems?: number;
}

export function TopIssuesList({ issues, maxItems = 5 }: TopIssuesListProps) {
  const displayed = issues.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
        <p className="text-sm text-green-400">No issues detected. Good job! ✨</p>
      </div>
    );
  }

  // Count issues by severity for header
  const counts = {
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Top Issues
      </h3>

      {/* Summary badges */}
      {(counts.high > 0 || counts.medium > 0 || counts.low > 0) && (
        <div className="flex gap-2 flex-wrap">
          {counts.high > 0 && (
            <div className="px-2.5 py-1 rounded-sm text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
              <span className="font-bold">{counts.high}</span>{" "}
              {counts.high === 1 ? "Critical" : "Critical"}
            </div>
          )}
          {counts.medium > 0 && (
            <div className="px-2.5 py-1 rounded-sm text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <span className="font-bold">{counts.medium}</span> Moderate
            </div>
          )}
          {counts.low > 0 && (
            <div className="px-2.5 py-1 rounded-sm text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <span className="font-bold">{counts.low}</span> Low
            </div>
          )}
        </div>
      )}

      {/* Issue list */}
      <div className="space-y-2">
        {displayed.map((issue) => {
          const config = SEVERITY_CONFIG[issue.severity];
          const Icon = config.icon;

          return (
            <div
              key={issue.id}
              className="flex items-start justify-between p-3 rounded-lg gap-3"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)"
              }}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.text}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 break-words">
                    {issue.title}
                  </p>
                  {issue.detail && (
                    <p className="text-xs text-gray-400 mt-1 break-words">
                      {issue.detail}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${config.bg} ${config.text}`}
                style={{
                  background: config.bg,
                  color: config.text,
                  textTransform: "capitalize"
                }}
              >
                {issue.severity}
              </div>
            </div>
          );
        })}
      </div>

      {issues.length > maxItems && (
        <button className="w-full py-2 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
          View all {issues.length} issues →
        </button>
      )}
    </div>
  );
}
