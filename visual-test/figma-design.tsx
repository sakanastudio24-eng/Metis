/**
 * Figma Design Test Fixture
 * Testing the new panel and report layouts with mock data.
 * Serves at /sites/figma-design/
 */
import React, { useState } from "react";
import { PanelLayout } from "../../src/app/components/figures/PanelLayout";
import { FullReportLayout } from "../../src/app/components/figures/FullReportLayout";
import type { MetisSnapshot } from "../../src/shared/types/audit";

// Mock data matching Figma design
const MOCK_SNAPSHOT: MetisSnapshot = {
  raw: {
    scannedAt: new Date().toISOString(),
    page: {
      href: "https://app.example.com/dashboard",
      origin: "https://app.example.com",
      hostname: "app.example.com",
      pathname: "/dashboard"
    },
    resources: [],
    dom: {
      scriptCount: 12,
      imageCount: 24,
      iframeCount: 2
    },
    metrics: {
      rawRequestCount: 145,
      requestCount: 124,
      uniqueRequestCount: 98,
      duplicateRequestCount: 26,
      duplicateEndpointCount: 8,
      scriptRequestCount: 34,
      imageRequestCount: 52,
      apiRequestCount: 28,
      thirdPartyRequestCount: 41,
      thirdPartyDomainCount: 12,
      totalEncodedBodySize: 8245120,
      meaningfulImageCount: 18,
      meaningfulImageBytes: 3891456,
      largeAssetCount: 5,
      droppedZeroTransferCount: 3,
      droppedTinyCount: 12,
      topOffenders: [],
      topMeaningfulImages: []
    }
  },
  issues: [
    {
      id: "dup-api",
      title: "Duplicate API Requests",
      detail: "26 duplicate requests detected across the session",
      severity: "high",
      category: "duplicateRequests",
      metric: { count: 26 },
      threshold: { max: 5 }
    },
    {
      id: "memory-leak",
      title: "Memory Leak Pattern",
      detail: "Persistent requests to same endpoint without caching",
      severity: "high",
      category: "requestCount",
      metric: { increase: 34 },
      threshold: { max: 10 }
    },
    {
      id: "unopt-images",
      title: "Unoptimized Images",
      detail: "5 large images loaded without compression",
      severity: "medium",
      category: "largeImages",
      metric: { count: 5, size: 3.8 },
      threshold: { maxSize: 1 }
    }
  ],
  score: {
    score: 72,
    label: "watch",
    deductions: [
      {
        reason: "Duplicate API Requests",
        points: 15,
        category: "duplicateRequests",
        severity: "high",
        multiplier: 1.2
      },
      {
        reason: "High Request Count",
        points: 12,
        category: "requestCount",
        severity: "high",
        multiplier: 1.0
      },
      {
        reason: "Unoptimized Images",
        points: 8,
        category: "largeImages",
        severity: "medium",
        multiplier: 0.8
      }
    ]
  },
  insight: {
    summary: "High request count and AI usage detected",
    supportingDetail:
      "This page makes 124 total requests with 26 duplicates, likely triggered by AI operations. Consider caching and request deduplication.",
    estimateLabel: "Moderate waste",
    nextStep:
      "Implement request caching strategy and review API endpoint patterns",
    primaryCategory: "duplicateRequests"
  }
};

export default function FigmaDesignTest() {
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Figma Design Implementation</h1>
          <p className="text-gray-400">
            Testing the new Metis panel and report layouts with real component
            code
          </p>
        </div>

        {/* Panel View */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Panel View (410px)</h2>
          <div
            className="border border-gray-800 rounded-lg overflow-hidden"
            style={{ width: "410px" }}
          >
            <div className="bg-gray-900 p-4">
              <PanelLayout
                snapshot={MOCK_SNAPSHOT}
                multiPageSnapshots={[MOCK_SNAPSHOT.raw, MOCK_SNAPSHOT.raw]}
                onExpandReport={() => setShowReport(true)}
              />
            </div>
          </div>
        </section>

        {/* Report Modal Preview */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="bg-gray-950 rounded-lg w-full max-w-4xl max-h-96 overflow-auto"
              style={{ maxHeight: "80vh" }}
            >
              <FullReportLayout
                snapshot={MOCK_SNAPSHOT}
                onClose={() => setShowReport(false)}
              />
            </div>
          </div>
        )}

        {/* Figma Design Reference */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Design Reference</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <h3 className="font-semibold mb-2">Panel Components</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Score visualization (orange ring)</li>
                <li>✓ Risk label badge (Moderate Risk)</li>
                <li>✓ Summary insight text</li>
                <li>✓ Multi-page tracking</li>
                <li>✓ Session + projected costs</li>
                <li>✓ Top issues list</li>
                <li>✓ Detected stack badges</li>
                <li>✓ Cost breakdown</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <h3 className="font-semibold mb-2">Report Components</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Full score display</li>
                <li>✓ Expanded insight</li>
                <li>✓ Side-by-side cost cards</li>
                <li>✓ All issues section</li>
                <li>✓ Cost breakdown table</li>
                <li>✓ Metrics table</li>
                <li>✓ Export options</li>
                <li>✓ Share functionality</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Mock Data Structure */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Mock Data Structure</h2>
          <pre className="bg-gray-900 p-4 rounded-lg border border-gray-800 text-sm overflow-auto text-gray-300 max-h-96">
            {JSON.stringify(MOCK_SNAPSHOT, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
