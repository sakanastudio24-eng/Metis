/**
 * PanelLayout
 * Main panel component that integrates all Figma design components.
 * Shows score, cost insight, top issues, stack, and cost breakdown.
 * 
 * This is the main layout rendered in the extension panel.
 */
import { ChevronDown, Copy, Download, FileText } from "lucide-react";
import type { MetisSnapshot, RawScanSnapshot, CostInsight } from "../../../shared/types/audit";
import { ScoreVisualization } from "./ScoreVisualization";
import { TopIssuesList } from "./TopIssuesList";
import { DetectedStackBadges } from "./DetectedStackBadges";
import { CostBreakdown } from "./CostBreakdown";

interface PanelLayoutProps {
  snapshot: MetisSnapshot | null;
  multiPageSnapshots?: RawScanSnapshot[];
  isLoading?: boolean;
  onExpandReport?: () => void;
  onExportPDF?: () => void;
}

export function PanelLayout({
  snapshot,
  multiPageSnapshots = [],
  isLoading = false,
  onExpandReport,
  onExportPDF
}: PanelLayoutProps) {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">
          {isLoading ? "Scanning..." : "No data available"}
        </p>
      </div>
    );
  }

  const { raw, issues, score, insight } = snapshot;
  const sessionCost = "$0.024"; // TODO: Calculate from metrics
  const monthlyProjection = "~$240/month"; // TODO: Calculate from traffic data
  const pageCount = multiPageSnapshots.length || 1;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6 p-6 pb-8">
        {/* Header: Score + Risk + Summary */}
        <div className="space-y-4">
          <ScoreVisualization score={score.score} label={score.label} size={140} />

          {/* Summary insight line */}
          {insight && (
            <div className="text-center space-y-2">
              <p className="text-gray-200 text-sm font-medium leading-relaxed">
                {insight.summary}
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {insight.supportingDetail}
              </p>
            </div>
          )}
        </div>

        {/* Page info + Cost cards */}
        <div className="space-y-3">
          {/* Multi-page indicator */}
          {pageCount > 1 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(59, 130, 246, 0.05)" }}>
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-blue-400">
                Live · Sampled {pageCount} pages · {raw.page.hostname}
              </span>
            </div>
          )}

          {/* Cost cards */}
          <div className="grid gap-3">
            <div
              className="p-4 rounded-lg space-y-1"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <p className="text-xs text-gray-400">
                Current session cost ({pageCount} {pageCount === 1 ? "page" : "pages"})
              </p>
              <p className="text-2xl font-bold text-white">{sessionCost}</p>
            </div>

            <div
              className="p-4 rounded-lg flex items-center justify-between"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                </div>
                <span className="text-sm text-gray-300">At 10k users</span>
              </div>
              <span className="text-sm font-semibold text-orange-400">{monthlyProjection}</span>
            </div>
          </div>
        </div>

        {/* Top Issues */}
        <TopIssuesList issues={issues} maxItems={5} />

        {/* Detected Stack */}
        <DetectedStackBadges
          badges={[
            { label: "React 18", type: "tech" },
            { label: "Next.js 14", type: "tech" },
            { label: "Vercel", type: "provider" },
            { label: "OpenAI API", type: "tech" },
            { label: "AI usage detected", type: "insight" }
          ]}
          pageInfo={{
            mode: pageCount > 1 ? "multi" : "single",
            pages: pageCount,
            hostname: raw.page.hostname
          }}
        />

        {/* Expandable: What just happened? */}
        <details className="group cursor-pointer">
          <summary className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-4 h-4 text-gray-500">⚡</div>
              What just happened?
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-4 pb-4 text-xs text-gray-400 space-y-2">
            <p>This page was analyzed for:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Large unoptimized images</li>
              <li>Duplicate network requests</li>
              <li>Expensive third-party scripts</li>
              <li>AI API usage patterns</li>
              <li>Inefficient resource loading</li>
            </ul>
          </div>
        </details>

        {/* Full Report Button */}
        <button
          onClick={onExpandReport}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            boxShadow: "0 8px 16px rgba(249, 115, 22, 0.3)"
          }}
        >
          <FileText className="w-4 h-4" />
          Full Report
        </button>
      </div>
    </div>
  );
}
