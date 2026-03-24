/**
 * Figma Design Test Fixture
 * Exercises the zip-authoritative panel and report layouts with stable mock data.
 */
import React, { useState } from "react";
import { PanelLayout } from "../../src/app/components/figures/PanelLayout";
import { FullReportLayout } from "../../src/app/components/figures/FullReportLayout";
import { buildMetisDesignViewModel } from "../../src/app/components/figures/liveAdapter";
import type { MetisSnapshot, PlusRefinementAnswers } from "../../src/shared/types/audit";

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
      metric: { duplicateRequestCount: 26, duplicateEndpointCount: 8 },
      threshold: { duplicateRequestCount: 20, duplicateEndpointCount: 8 }
    },
    {
      id: "memory-leak",
      title: "Memory Leak Pattern",
      detail: "Persistent requests to the same endpoint without caching",
      severity: "high",
      category: "requestCount",
      metric: { requestCount: 124 },
      threshold: { requestCount: 80 }
    },
    {
      id: "unopt-images",
      title: "Unoptimized Images",
      detail: "5 large images loaded without compression",
      severity: "medium",
      category: "largeImages",
      metric: { meaningfulImageCount: 5, meaningfulImageBytes: 3800000 },
      threshold: { meaningfulImageCount: 4, meaningfulImageBytes: 1000000 }
    }
  ],
  score: {
    score: 72,
    label: "watch",
    deductions: [
      {
        reason: "Duplicate API Requests",
        points: 12.5,
        category: "duplicateRequests",
        severity: "high",
        multiplier: 1.25
      },
      {
        reason: "High Request Count",
        points: 10,
        category: "requestCount",
        severity: "high",
        multiplier: 1
      },
      {
        reason: "Unoptimized Images",
        points: 10,
        category: "largeImages",
        severity: "medium",
        multiplier: 1
      }
    ]
  },
  insight: {
    summary: "High request count and AI usage detected",
    supportingDetail:
      "This page makes 124 total requests with 26 duplicates, which suggests repeated work on hot routes.",
    estimateLabel: "Moderate waste",
    nextStep: "Implement request caching strategy and review API endpoint patterns.",
    primaryCategory: "duplicateRequests"
  }
};

const MOCK_PLUS_ANSWERS: PlusRefinementAnswers = {
  hostingProvider: "vercel",
  monthlyVisits: "1kTo10k",
  appType: "saasDashboard",
  aiUsage: "yesOften"
};

export default function FigmaDesignTest() {
  const [showReport, setShowReport] = useState(false);
  const [scanScope, setScanScope] = useState<"single" | "multi">("multi");
  const viewModel = buildMetisDesignViewModel({
    snapshot: MOCK_SNAPSHOT.raw,
    issues: MOCK_SNAPSHOT.issues,
    score: MOCK_SNAPSHOT.score,
    insight: MOCK_SNAPSHOT.insight,
    scope: scanScope,
    pageCount: 5,
    answers: MOCK_PLUS_ANSWERS,
    plusReport: null,
    requiredQuestionCount: 3
  });

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 text-gray-50">
      <div className="mx-auto max-w-6xl space-y-12">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Figma Design Implementation</h1>
          <p className="text-gray-400">
            Visual fixture for the zip-authoritative Metis shell.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Mini / Full Panel Body</h2>
          <div
            className="overflow-hidden rounded-[22px] border border-gray-800 bg-[#111d2b] p-5"
            style={{ width: "410px" }}
          >
            <PanelLayout viewModel={viewModel} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Full Report Modal Preview</h2>
          <button
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
            onClick={() => setShowReport(true)}
          >
            Open Report
          </button>
        </section>

        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="h-[92vh] w-full max-w-[672px]">
              <FullReportLayout
                viewModel={viewModel}
                scanScope={scanScope}
                onSetScanScope={setScanScope}
                currentQuestion={null}
                plusAnswers={MOCK_PLUS_ANSWERS}
                isRefinementOpen={false}
                setIsRefinementOpen={() => undefined}
                onAnswer={() => undefined}
                onCopyReport={() => undefined}
                onClose={() => setShowReport(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
