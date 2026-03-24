/**
 * FullReportLayout
 * Expanded modal view showing detailed breakdown, all issues, and cost analysis.
 * This is shown when user clicks \"Full Report\" button on the panel.
 * 
 * DESIGN SPECS:
 * - Full-width desktop view with sticky header
 * - Displays complete metrics table with all detected issues
 * - Cost breakdown section shows all major cost drivers
 * - Page metrics table with request counts, weights, etc.
 * 
 * INTEGRATION NOTES:
 * - Currently rendered in a fixed-size modal (should be responsive)
 * - Export PDF button is stubbed (needs pdf-lib or similar)
 * - Copy link functionality uses browser clipboard API
 * - Report can be opened from PanelLayout or directly from diagnostics panel
 */
import { ChevronLeft, Copy, Download, X } from "lucide-react";
import type { MetisSnapshot, RawScanSnapshot } from "../../../shared/types/audit";
import { ScoreVisualization } from "./ScoreVisualization";
import { TopIssuesList } from "./TopIssuesList";
import { CostBreakdown } from "./CostBreakdown";

interface FullReportLayoutProps {
  snapshot: MetisSnapshot | null;
  multiPageSnapshots?: RawScanSnapshot[];
  onClose?: () => void;
  onBack?: () => void;
}

export function FullReportLayout({
  snapshot,
  multiPageSnapshots = [],
  onClose,
  onBack
}: FullReportLayoutProps) {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">No report data</p>
      </div>
    );
  }

  const { raw, issues, score, insight } = snapshot;
  const pageCount = multiPageSnapshots.length || 1;
  const sessionCost = "$0.024";
  const monthlyProjection = "~$240/month";

  return (
    <div className="w-full bg-gray-950 text-gray-50 min-h-screen">
      {/* Sticky header with report title, timestamp, and action buttons */}
      <div className="border-b border-gray-800 sticky top-0 z-10 bg-gray-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Metis Full Report</h1>
            <p className="text-xs text-gray-500">
              {raw.page.hostname} · {new Date(raw.scannedAt).toLocaleDateString()} {new Date(raw.scannedAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Copy link"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Score + Summary */}
        <div className="grid grid-cols-3 gap-6 items-start">
          <div className="col-span-1 flex justify-center">
            <ScoreVisualization score={score.score} label={score.label} size={120} />
          </div>

          <div className="col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{score.score}</h2>
                <div
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "#f9731625",
                    color: "#f97316",
                    border: "1px solid #f9731640"
                  }}
                >
                  {score.label}
                </div>
              </div>
              <p className="text-gray-400 text-sm">Cost Risk Score</p>
            </div>

            {insight && (
              <div className="space-y-2">
                <p className="text-white font-medium">{insight.summary}</p>
                <p className="text-gray-400 text-sm">{insight.supportingDetail}</p>
              </div>
            )}

            {/* Cost Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/3 border border-white/6">
                <p className="text-xs text-gray-500">Current session</p>
                <p className="text-lg font-bold text-white">{sessionCost}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-white/6">
                <p className="text-xs text-gray-500">At 10k users</p>
                <p className="text-lg font-bold text-orange-400">{monthlyProjection}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Issues Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">All Issues</h2>
          <TopIssuesList issues={issues} maxItems={100} />
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Cost Breakdown */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Cost Breakdown</h2>
          <CostBreakdown deductions={score.deductions} />
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Metrics Table */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Page Metrics</h2>
          <div
            className="overflow-x-auto rounded-lg border"
            style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
          >
            <table className="w-full text-sm">
              <tbody>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <td className="px-4 py-3 text-gray-400">Total Requests</td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {raw.metrics.requestCount}
                  </td>
                </tr>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <td className="px-4 py-3 text-gray-400">Duplicate Requests</td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {raw.metrics.duplicateRequestCount}
                  </td>
                </tr>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <td className="px-4 py-3 text-gray-400">Total Page Weight</td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {(raw.metrics.totalEncodedBodySize / 1024 / 1024).toFixed(2)} MB
                  </td>
                </tr>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <td className="px-4 py-3 text-gray-400">Third-party Requests</td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {raw.metrics.thirdPartyRequestCount}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-400">Images</td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {raw.metrics.imageRequestCount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="pb-8 text-center">
          <p className="text-xs text-gray-600">
            Report generated by Metis • ward.studio/metis
          </p>
        </div>
      </div>
    </div>
  );
}
