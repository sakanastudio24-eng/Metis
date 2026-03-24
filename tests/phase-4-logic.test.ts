// phase-4-logic.test.ts verifies the deterministic Phase 4 core without a browser.
// It covers normalized metric aggregation, multipage shaping, weighted scoring,
// and the insight scenarios that should stay stable while UI polish continues.
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { detectIssues } from "../src/features/detection";
import { buildInsight } from "../src/features/insights";
import { buildPlusOptimizationReport } from "../src/features/refinement";
import { buildMultipageSnapshot, buildResourceMetrics, buildScanDebugSummary } from "../src/features/scan";
import { scoreSnapshot } from "../src/features/scoring";
import { buildMetisDesignViewModel } from "../src/app/components/figures/liveAdapter";
import { isSoftRefresh, shouldReplayLoading } from "../src/app/components/figures/loadingState";
import type {
  PageContext,
  RawScanSnapshot,
  ResourceCategory,
  ResourceSummary
} from "../src/shared/types/audit";

const defaultPage: PageContext = {
  href: "https://example.com/",
  origin: "https://example.com",
  hostname: "example.com",
  pathname: "/"
};

function createResource(
  name: string,
  overrides: Partial<ResourceSummary> = {}
): ResourceSummary {
  const url = new URL(name, defaultPage.href);
  const category: ResourceCategory = overrides.category ?? "other";

  return {
    name: url.href,
    normalizedUrl: `${url.origin}${url.pathname}`,
    hostname: url.hostname,
    pathname: url.pathname,
    initiatorType: overrides.initiatorType ?? "other",
    category,
    transferSize: overrides.transferSize ?? overrides.encodedBodySize ?? 25_000,
    encodedBodySize: overrides.encodedBodySize ?? 25_000,
    duration: overrides.duration ?? 20,
    isThirdParty: overrides.isThirdParty ?? url.origin !== defaultPage.origin,
    isMeaningfulImage:
      overrides.isMeaningfulImage ??
      (category === "image" && (overrides.encodedBodySize ?? 25_000) >= 50_000)
  };
}

function createSnapshot(
  resources: ResourceSummary[],
  overrides: Partial<RawScanSnapshot> = {}
): RawScanSnapshot {
  const metrics = buildResourceMetrics(resources, {
    rawRequestCount: resources.length,
    droppedTinyCount: 0,
    droppedZeroTransferCount: 0
  });

  return {
    scannedAt: overrides.scannedAt ?? "2026-03-24T12:00:00.000Z",
    page: overrides.page ?? defaultPage,
    resources,
    dom: overrides.dom ?? {
      scriptCount: resources.filter((resource) => resource.category === "script").length,
      imageCount: resources.filter((resource) => resource.category === "image").length,
      iframeCount: 0
    },
    metrics
  };
}

test("buildResourceMetrics tracks duplicates and meaningful images from normalized resources", () => {
  const resources = [
    createResource("https://example.com/api/data?id=1", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 80_000
    }),
    createResource("https://example.com/api/data?id=2", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 90_000
    }),
    createResource("https://cdn.example.net/hero.jpg", {
      category: "image",
      initiatorType: "img",
      encodedBodySize: 300_000,
      isThirdParty: true,
      isMeaningfulImage: true
    })
  ];

  const metrics = buildResourceMetrics(resources, {
    rawRequestCount: 6,
    droppedTinyCount: 2,
    droppedZeroTransferCount: 1
  });

  assert.equal(metrics.requestCount, 3);
  assert.equal(metrics.uniqueRequestCount, 2);
  assert.equal(metrics.duplicateRequestCount, 1);
  assert.equal(metrics.duplicateEndpointCount, 1);
  assert.equal(metrics.meaningfulImageCount, 1);
  assert.equal(metrics.thirdPartyDomainCount, 1);
  assert.equal(metrics.rawRequestCount, 6);
});

test("buildMultipageSnapshot aggregates visited pages and debug summary stays stable", () => {
  const current = createSnapshot([
    createResource("https://example.com/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 120_000
    })
  ]);

  const visited = [
    createSnapshot([
      createResource("https://example.com/api/feed", {
        category: "api",
        initiatorType: "fetch",
        encodedBodySize: 50_000
      }),
      createResource("https://media.example.net/poster.webp", {
        category: "image",
        initiatorType: "img",
        encodedBodySize: 90_000,
        isThirdParty: true,
        isMeaningfulImage: true
      })
    ])
  ];

  const multipage = buildMultipageSnapshot(current, visited);
  const summary = buildScanDebugSummary(multipage);

  assert.equal(multipage.metrics.requestCount, 2);
  assert.equal(multipage.dom.imageCount, 1);
  assert.equal(summary.totalRequests, 2);
  assert.equal(summary.imageCount, 1);
  assert.equal(summary.filteredCount, 2);
});

test("warming snapshots stay non-committal", () => {
  const snapshot = createSnapshot([]);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  assert.equal(score.label, "warming up");
  assert.equal(insight.estimateLabel, "Scanning");
  assert.equal(insight.primaryCategory, null);
  assert.match(insight.summary, /warming up/i);
});

test("controlled snapshots produce a low-waste insight", () => {
  const snapshot = createSnapshot([
    createResource("https://example.com/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 120_000
    }),
    createResource("https://example.com/styles.css", {
      category: "stylesheet",
      initiatorType: "link",
      encodedBodySize: 40_000
    })
  ]);

  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  assert.equal(issues.length, 0);
  assert.equal(score.label, "healthy");
  assert.equal(insight.estimateLabel, "Low waste");
  assert.equal(insight.primaryCategory, null);
  assert.match(insight.summary, /controlled/i);
});

test("duplicate-heavy snapshots prioritize duplicate waste in the insight", () => {
  const resources = Array.from({ length: 9 }, (_, index) =>
    createResource(`https://example.com/api/feed?slot=${index}`, {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 65_000
    })
  );
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  assert.equal(issues[0]?.category, "duplicateRequests");
  assert.equal(score.label, "healthy");
  assert.equal(insight.primaryCategory, "duplicateRequests");
  assert.equal(insight.estimateLabel, "Low waste");
  assert.match(insight.summary, /repeated|duplicate/i);
  assert.match(insight.nextStep, /duplicate asset|shared loaders|caches/i);
});

test("image-heavy snapshots produce a moderate or heavy image-focused insight", () => {
  const resources = Array.from({ length: 8 }, (_, index) =>
    createResource(`https://images.example.net/gallery-${index}.jpg`, {
      category: "image",
      initiatorType: "img",
      encodedBodySize: 300_000,
      isThirdParty: true,
      isMeaningfulImage: true
    })
  );
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  assert.equal(insight.primaryCategory, "largeImages");
  assert.match(insight.summary, /image/i);
  assert.ok(["Moderate waste", "Heavy waste"].includes(insight.estimateLabel));
});

test("third-party-heavy snapshots point to dependency sprawl", () => {
  const resources = Array.from({ length: 8 }, (_, index) =>
    createResource(`https://vendor-${index}.example.net/sdk.js`, {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 60_000,
      isThirdParty: true
    })
  );
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  assert.equal(insight.primaryCategory, "thirdPartySprawl");
  assert.ok(["healthy", "watch", "high risk"].includes(score.label));
  assert.match(insight.supportingDetail, /third-party domains/i);
  assert.match(insight.nextStep, /vendors|third-party tags/i);
});

test("plus refinement stays dormant until answers are provided", () => {
  const snapshot = createSnapshot([
    createResource("https://example.com/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 120_000
    })
  ]);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  const report = buildPlusOptimizationReport(insight, snapshot, issues, score, {});

  assert.equal(report, null);
});

test("plus refinement raises priority with traffic, free plan, and paid APIs", () => {
  const resources = Array.from({ length: 9 }, (_, index) =>
    createResource(`https://example.com/api/feed?slot=${index}`, {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 65_000
    })
  );
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);
  const report = buildPlusOptimizationReport(insight, snapshot, issues, score, {
    hostingProvider: "vercel",
    hostingPlan: "free",
    monthlyVisits: "100kPlus",
    appType: "marketing",
    highTrafficRoute: "yes",
    paidApiUsage: "yes"
  });

  assert.ok(report);
  assert.equal(report?.priorityLabel, "High priority");
  assert.equal(report?.missingCoreQuestions.length, 0);
  assert.match(report?.detail ?? "", /Vercel|100k\+|marketing/i);
  assert.match(report?.nextStep ?? "", /Vercel|caching|function work/i);
});

test("plus refinement keeps partial output when only some core answers are present", () => {
  const resources = Array.from({ length: 8 }, (_, index) =>
    createResource(`https://images.example.net/gallery-${index}.jpg`, {
      category: "image",
      initiatorType: "img",
      encodedBodySize: 300_000,
      isThirdParty: true,
      isMeaningfulImage: true
    })
  );
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);
  const report = buildPlusOptimizationReport(insight, snapshot, issues, score, {
    hostingProvider: "cloudflare",
    mediaImportance: "core",
    optimizationCoverage: "no"
  });

  assert.ok(report);
  assert.equal(report?.summary.startsWith("Partial Plus read:"), true);
  assert.ok((report?.missingCoreQuestions.length ?? 0) > 0);
  assert.match(report?.nextStep ?? "", /Cloudflare|cache rules|media delivery/i);
});

test("design view model splits metadata and builds scale simulation rows", () => {
  const resources = [
    createResource("https://example.com/_next/static/chunks/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 180_000
    }),
    createResource("https://cdn.example.net/hero.jpg", {
      category: "image",
      initiatorType: "img",
      encodedBodySize: 400_000,
      isThirdParty: true,
      isMeaningfulImage: true
    }),
    createResource("https://api.example.com/feed?slot=1", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 80_000,
      isThirdParty: true
    }),
    createResource("https://api.example.com/feed?slot=2", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 80_000,
      isThirdParty: true
    })
  ];
  const snapshot = createSnapshot(resources);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);
  const report = buildPlusOptimizationReport(insight, snapshot, issues, score, {
    hostingProvider: "vercel",
    monthlyVisits: "1kTo10k",
    appType: "saasDashboard",
    aiUsage: "yesOften"
  });

  const viewModel = buildMetisDesignViewModel({
    snapshot,
    issues,
    score,
    insight,
    scope: "multi",
    pageCount: 5,
    answers: {
      hostingProvider: "vercel",
      monthlyVisits: "1kTo10k",
      appType: "saasDashboard",
      aiUsage: "yesOften"
    },
    plusReport: report,
    requiredQuestionCount: 3
  });

  assert.deepEqual(viewModel.metaTokens, ["Live", "Sampled 5 pages", "example.com"]);
  assert.equal(viewModel.routeKey, "https://example.com/");
  assert.match(viewModel.snapshotKey, /https:\/\/example.com\/::/);
  assert.equal(viewModel.scaleSimulationRows.length, 5);
  assert.equal(viewModel.scaleSimulationRows[2]?.trafficLabel, "10k users");
  assert.match(viewModel.scaleSimulationRows[2]?.amount ?? "", /^\$/);
  assert.equal(viewModel.aiCostPerRequestEstimate, "~$0.0001");
});

test("design view model adds stack fallback questions for missing groups", () => {
  const snapshot = createSnapshot([
    createResource("https://example.com/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 120_000
    })
  ]);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  const viewModel = buildMetisDesignViewModel({
    snapshot,
    issues,
    score,
    insight,
    scope: "single",
    pageCount: 1,
    answers: {
      aiUsage: "yesOften"
    },
    plusReport: null,
    requiredQuestionCount: 3
  });

  const fallbackKeys = viewModel.stackQuestionDefinitions.map((question) => question.key);
  assert.ok(fallbackKeys.includes("stackFramework"));
  assert.ok(fallbackKeys.includes("stackCdnProvider"));
  assert.ok(fallbackKeys.includes("stackAiProvider"));
  assert.ok(fallbackKeys.includes("stackAnalytics"));
  assert.ok(fallbackKeys.includes("stackPayment"));
});

test("design view model keeps brand colors for detected stack and fix cards", () => {
  const snapshot = createSnapshot([
    createResource("https://example.com/_next/static/chunks/app.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 150_000
    }),
    createResource("https://react.example.com/react-dom.js", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 70_000,
      isThirdParty: true
    }),
    createResource("https://js.stripe.com/v3/", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 40_000,
      isThirdParty: true
    }),
    createResource("https://www.googletagmanager.com/gtag/js?id=G-TEST", {
      category: "script",
      initiatorType: "script",
      encodedBodySize: 30_000,
      isThirdParty: true
    }),
    createResource("https://api.openai.com/v1/chat/completions", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 40_000,
      isThirdParty: true
    }),
    createResource("https://vercel.live/edge-config", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 40_000,
      isThirdParty: true
    }),
    createResource("https://example.com/api/feed?slot=1", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 90_000
    }),
    createResource("https://example.com/api/feed?slot=2", {
      category: "api",
      initiatorType: "fetch",
      encodedBodySize: 90_000
    })
  ]);
  const issues = detectIssues(snapshot);
  const score = scoreSnapshot(snapshot, issues);
  const insight = buildInsight(snapshot, issues, score);

  const viewModel = buildMetisDesignViewModel({
    snapshot,
    issues,
    score,
    insight,
    scope: "single",
    pageCount: 1,
    answers: {
      aiUsage: "yesOften",
      hostingProvider: "vercel"
    },
    plusReport: null,
    requiredQuestionCount: 3
  });

  assert.ok(viewModel.stackChips.some((chip) => chip.label.includes("React") && chip.brandColor));
  assert.ok(viewModel.stackGroups.some((group) => group.label === "Payment"));
  assert.ok(viewModel.fixRecommendationCards.length > 0);
  assert.ok(viewModel.fixRecommendationCards.every((card) => !("placeholder" in card)));
});

test("loading helpers only replay on new routes and soften same-route refreshes", () => {
  assert.equal(shouldReplayLoading(null, "https://example.com/a"), true);
  assert.equal(
    shouldReplayLoading("https://example.com/a", "https://example.com/a"),
    false
  );
  assert.equal(
    shouldReplayLoading("https://example.com/a", "https://example.com/b"),
    true
  );

  assert.equal(
    isSoftRefresh(
      "https://example.com/a::2026-03-24T12:00:00.000Z",
      "https://example.com/a::2026-03-24T12:00:01.000Z"
    ),
    true
  );
  assert.equal(
    isSoftRefresh(
      "https://example.com/a::2026-03-24T12:00:00.000Z",
      "https://example.com/b::2026-03-24T12:00:01.000Z"
    ),
    false
  );
});
