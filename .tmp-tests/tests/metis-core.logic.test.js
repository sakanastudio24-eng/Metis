"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// metis-core.logic.test.ts verifies the deterministic Metis core without a browser.
// It covers normalized metric aggregation, multipage shaping, weighted scoring,
// control assessment, and the report scenarios that should stay stable while UI
// polish continues.
const node_test_1 = require("node:test");
const assert = require("node:assert/strict");
const control_1 = require("../src/features/control/control");
const detection_1 = require("../src/features/detection");
const insights_1 = require("../src/features/insights");
const pricing_1 = require("../src/features/pricing");
const refinement_1 = require("../src/features/refinement");
const scan_1 = require("../src/features/scan");
const scoring_1 = require("../src/features/scoring");
const stack_1 = require("../src/features/stack");
const pricing_2 = require("../src/config/pricing");
const exportDocument_1 = require("../src/app/components/figures/exportDocument");
const liveAdapter_1 = require("../src/app/components/figures/liveAdapter");
const loadingState_1 = require("../src/app/components/figures/loadingState");
const metisLocalSettings_1 = require("../src/shared/lib/metisLocalSettings");
const pageScanHistory_1 = require("../src/shared/lib/pageScanHistory");
const defaultPage = {
    href: "https://example.com/",
    origin: "https://example.com",
    hostname: "example.com",
    pathname: "/"
};
function createResource(name, overrides = {}) {
    const url = new URL(name, defaultPage.href);
    const category = overrides.category ?? "other";
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
        isMeaningfulImage: overrides.isMeaningfulImage ??
            (category === "image" && (overrides.encodedBodySize ?? 25_000) >= 50_000)
    };
}
function createSnapshot(resources, overrides = {}) {
    const metrics = (0, scan_1.buildResourceMetrics)(resources, {
        rawRequestCount: resources.length,
        droppedTinyCount: 0,
        droppedZeroTransferCount: 0
    });
    return {
        scannedAt: overrides.scannedAt ?? "2026-03-24T12:00:00.000Z",
        page: overrides.page ?? defaultPage,
        resources,
        stackSignals: overrides.stackSignals ??
            resources.map((resource) => ({
                name: resource.name,
                hostname: resource.hostname,
                pathname: resource.pathname
            })),
        dom: overrides.dom ?? {
            scriptCount: resources.filter((resource) => resource.category === "script").length,
            imageCount: resources.filter((resource) => resource.category === "image").length,
            iframeCount: 0
        },
        metrics
    };
}
(0, node_test_1.test)("buildResourceMetrics tracks duplicates and meaningful images from normalized resources", () => {
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
    const metrics = (0, scan_1.buildResourceMetrics)(resources, {
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
(0, node_test_1.test)("buildMultipageSnapshot aggregates visited pages and debug summary stays stable", () => {
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
    const multipage = (0, scan_1.buildMultipageSnapshot)(current, visited);
    const summary = (0, scan_1.buildScanDebugSummary)(multipage);
    assert.equal(multipage.metrics.requestCount, 2);
    assert.equal(multipage.dom.imageCount, 1);
    assert.equal(summary.totalRequests, 2);
    assert.equal(summary.imageCount, 1);
    assert.equal(summary.filteredCount, 2);
});
(0, node_test_1.test)("warming snapshots stay non-committal", () => {
    const snapshot = createSnapshot([]);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    assert.equal(score.label, "warming up");
    assert.equal(insight.estimateLabel, "Scanning");
    assert.equal(insight.primaryCategory, null);
    assert.match(insight.summary, /warming up/i);
});
(0, node_test_1.test)("controlled snapshots produce a low-waste insight", () => {
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
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    assert.equal(issues.length, 0);
    assert.equal(score.label, "healthy");
    assert.equal(insight.estimateLabel, "Low waste");
    assert.equal(insight.primaryCategory, null);
    assert.match(insight.summary, /controlled/i);
});
(0, node_test_1.test)("duplicate-heavy snapshots prioritize duplicate waste in the insight", () => {
    const resources = Array.from({ length: 9 }, (_, index) => createResource(`https://example.com/api/feed?slot=${index}`, {
        category: "api",
        initiatorType: "fetch",
        encodedBodySize: 65_000
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    assert.equal(issues[0]?.category, "duplicateRequests");
    assert.equal(score.label, "healthy");
    assert.equal(insight.primaryCategory, "duplicateRequests");
    assert.equal(insight.estimateLabel, "Low waste");
    assert.match(insight.summary, /repeated|duplicate/i);
    assert.match(insight.nextStep, /duplicate asset|shared loaders|caches/i);
});
(0, node_test_1.test)("image-heavy snapshots produce a moderate or heavy image-focused insight", () => {
    const resources = Array.from({ length: 8 }, (_, index) => createResource(`https://images.example.net/gallery-${index}.jpg`, {
        category: "image",
        initiatorType: "img",
        encodedBodySize: 300_000,
        isThirdParty: true,
        isMeaningfulImage: true
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    assert.equal(insight.primaryCategory, "largeImages");
    assert.match(insight.summary, /image/i);
    assert.ok(["Moderate waste", "Heavy waste"].includes(insight.estimateLabel));
});
(0, node_test_1.test)("third-party-heavy snapshots point to dependency sprawl", () => {
    const resources = Array.from({ length: 8 }, (_, index) => createResource(`https://vendor-${index}.example.net/sdk.js`, {
        category: "script",
        initiatorType: "script",
        encodedBodySize: 60_000,
        isThirdParty: true
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    assert.equal(insight.primaryCategory, "thirdPartySprawl");
    assert.ok(["healthy", "watch", "high risk"].includes(score.label));
    assert.match(insight.supportingDetail, /third-party domains/i);
    assert.match(insight.nextStep, /vendors|third-party tags/i);
});
(0, node_test_1.test)("plus refinement stays dormant until answers are provided", () => {
    const snapshot = createSnapshot([
        createResource("https://example.com/app.js", {
            category: "script",
            initiatorType: "script",
            encodedBodySize: 120_000
        })
    ]);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const report = (0, refinement_1.buildPlusOptimizationReport)(insight, snapshot, issues, score, {});
    assert.equal(report, null);
});
(0, node_test_1.test)("plus refinement raises priority with traffic, free plan, and paid APIs", () => {
    const resources = Array.from({ length: 9 }, (_, index) => createResource(`https://example.com/api/feed?slot=${index}`, {
        category: "api",
        initiatorType: "fetch",
        encodedBodySize: 65_000
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const report = (0, refinement_1.buildPlusOptimizationReport)(insight, snapshot, issues, score, {
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
(0, node_test_1.test)("plus refinement keeps partial output when only some core answers are present", () => {
    const resources = Array.from({ length: 8 }, (_, index) => createResource(`https://images.example.net/gallery-${index}.jpg`, {
        category: "image",
        initiatorType: "img",
        encodedBodySize: 300_000,
        isThirdParty: true,
        isMeaningfulImage: true
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const report = (0, refinement_1.buildPlusOptimizationReport)(insight, snapshot, issues, score, {
        hostingProvider: "cloudflare",
        mediaImportance: "core",
        optimizationCoverage: "no"
    });
    assert.ok(report);
    assert.equal(report?.summary.startsWith("Partial Plus read:"), true);
    assert.ok((report?.missingCoreQuestions.length ?? 0) > 0);
    assert.match(report?.nextStep ?? "", /Cloudflare|cache rules|media delivery/i);
});
(0, node_test_1.test)("control keeps AI-heavy dynamic routes out of the uncontrolled bucket", () => {
    const snapshot = createSnapshot([
        createResource("https://api.openai.com/v1/chat/completions", {
            category: "api",
            initiatorType: "fetch",
            encodedBodySize: 90_000,
            isThirdParty: true
        }),
        createResource("https://example.com/_next/static/chunks/app.js", {
            category: "script",
            initiatorType: "script",
            encodedBodySize: 180_000
        }),
        createResource("https://example.com/api/assist", {
            category: "api",
            initiatorType: "fetch",
            encodedBodySize: 75_000
        })
    ]);
    const answers = {
        aiUsage: "yesOften",
        appType: "aiApp",
        pageDynamics: "highlyDynamic"
    };
    const issues = (0, detection_1.detectIssues)(snapshot, answers);
    const control = (0, control_1.assessControl)(snapshot, issues, answers);
    assert.ok(control.score >= 40);
    assert.ok(["Controlled", "Mixed"].includes(control.label));
    assert.match(control.reasons.join(" "), /AI|dynamic|route/i);
});
(0, node_test_1.test)("control lowers static high-request pages without app context", () => {
    const resources = Array.from({ length: 130 }, (_, index) => createResource(`https://example.com/chunk-${index}.js`, {
        category: "script",
        initiatorType: "script",
        encodedBodySize: 12_000
    }));
    const snapshot = createSnapshot(resources);
    const answers = {
        appType: "marketing",
        pageDynamics: "mostlyStatic"
    };
    const issues = (0, detection_1.detectIssues)(snapshot, answers);
    const control = (0, control_1.assessControl)(snapshot, issues, answers);
    assert.equal(control.label, "Uncontrolled");
    assert.ok(control.penalties.some((entry) => entry.id === "static-high-request-count"));
});
(0, node_test_1.test)("control penalizes duplicate-heavy routes regardless of stack", () => {
    const resources = Array.from({ length: 20 }, (_, index) => createResource(`https://example.com/api/feed?slot=${index}`, {
        category: "api",
        initiatorType: "fetch",
        encodedBodySize: 50_000
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const control = (0, control_1.assessControl)(snapshot, issues, {});
    assert.equal(control.label, "Uncontrolled");
    assert.ok(control.penalties.some((entry) => entry.id === "duplicate-requests"));
});
(0, node_test_1.test)("control credits large payloads that have CDN and media context", () => {
    const resources = Array.from({ length: 6 }, (_, index) => createResource(`https://cdn.example.net/gallery-${index}.jpg`, {
        category: "image",
        initiatorType: "img",
        encodedBodySize: 350_000,
        isThirdParty: true,
        isMeaningfulImage: true
    }));
    const snapshot = createSnapshot(resources, {
        stackSignals: [
            {
                name: "https://cdn.example.net/gallery-0.jpg",
                hostname: "cdn.example.net",
                pathname: "/gallery-0.jpg",
                source: "resource"
            },
            {
                name: "https://cdnjs.cloudflare.com/ajax/libs/app.js",
                hostname: "cdnjs.cloudflare.com",
                pathname: "/ajax/libs/app.js",
                source: "resource"
            }
        ]
    });
    const answers = {
        appType: "mediaHeavy",
        hostingProvider: "cloudflare"
    };
    const issues = (0, detection_1.detectIssues)(snapshot, answers);
    const control = (0, control_1.assessControl)(snapshot, issues, answers);
    assert.ok(control.score >= 40);
    assert.ok(["Controlled", "Mixed"].includes(control.label));
    assert.ok(control.credits.some((entry) => entry.id === "payload-on-cdn"));
});
(0, node_test_1.test)("control treats third-party sprawl without context as uncontrolled", () => {
    const resources = Array.from({ length: 15 }, (_, index) => createResource(`https://vendor-${index}.example.net/sdk.js`, {
        category: "script",
        initiatorType: "script",
        encodedBodySize: 125_000,
        isThirdParty: true
    }));
    const snapshot = createSnapshot(resources);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const control = (0, control_1.assessControl)(snapshot, issues, {});
    assert.equal(control.label, "Uncontrolled");
    assert.ok(control.penalties.some((entry) => entry.id === "heavy-third-party-sprawl"));
});
(0, node_test_1.test)("control does not punish provider presence by itself", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://d111111abcdef8.cloudfront.net/app.js",
                hostname: "d111111abcdef8.cloudfront.net",
                pathname: "/app.js",
                source: "resource"
            }
        ]
    });
    const issues = (0, detection_1.detectIssues)(snapshot);
    const control = (0, control_1.assessControl)(snapshot, issues, {});
    assert.equal(control.penalties.length, 0);
    assert.ok(control.score >= 50);
});
(0, node_test_1.test)("control does not punish AI presence by itself", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://api.openai.com/v1/chat/completions",
                hostname: "api.openai.com",
                pathname: "/v1/chat/completions",
                source: "resource"
            }
        ]
    });
    const issues = (0, detection_1.detectIssues)(snapshot, {
        aiUsage: "yesOften"
    });
    const control = (0, control_1.assessControl)(snapshot, issues, {
        aiUsage: "yesOften"
    });
    assert.equal(control.penalties.length, 0);
    assert.ok(control.score >= 50);
});
(0, node_test_1.test)("design view model splits metadata and builds scale simulation rows", () => {
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
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const report = (0, refinement_1.buildPlusOptimizationReport)(insight, snapshot, issues, score, {
        hostingProvider: "vercel",
        monthlyVisits: "1kTo10k",
        appType: "saasDashboard",
        aiUsage: "yesOften"
    });
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control: (0, control_1.assessControl)(snapshot, issues, {
            hostingProvider: "vercel",
            monthlyVisits: "1kTo10k",
            appType: "saasDashboard",
            aiUsage: "yesOften"
        }),
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
    assert.equal(viewModel.hostname, "example.com");
    assert.equal(viewModel.pagesSampledLabel, "Sampled 5 pages");
    assert.equal(viewModel.sampledPagesCount, 5);
    assert.equal(viewModel.routeKey, "https://example.com/");
    assert.match(viewModel.snapshotKey, /https:\/\/example.com\/::/);
    assert.equal(viewModel.scaleSimulationRows.length, 5);
    assert.equal(viewModel.scaleSimulationRows[2]?.trafficLabel, "10k users");
    assert.match(viewModel.scaleSimulationRows[2]?.amount ?? "", /^~\$/);
    assert.equal(viewModel.aiCostPerRequestEstimate, "~$0.0001");
    assert.ok(["Controlled", "Mixed", "Uncontrolled"].includes(viewModel.controlLabel));
});
(0, node_test_1.test)("design view model can show current-site sampled progress beyond single-page mode", () => {
    const snapshot = createSnapshot([]);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control: (0, control_1.assessControl)(snapshot, issues, {}),
        score,
        insight,
        scope: "single",
        pageCount: 2,
        answers: {},
        plusReport: null,
        requiredQuestionCount: 3
    });
    assert.equal(viewModel.pagesSampledLabel, "Sampled 2 pages");
    assert.equal(viewModel.sampledPagesCount, 2);
});
(0, node_test_1.test)("design view model adds stack fallback questions for missing groups", () => {
    const snapshot = createSnapshot([
        createResource("https://example.com/app.js", {
            category: "script",
            initiatorType: "script",
            encodedBodySize: 120_000
        })
    ]);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control: (0, control_1.assessControl)(snapshot, issues, {
            aiUsage: "yesOften"
        }),
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
    assert.ok(fallbackKeys.includes("stackCdnProvider"));
    assert.ok(fallbackKeys.includes("stackAiProvider"));
    assert.ok(fallbackKeys.includes("stackAnalytics"));
    assert.equal(fallbackKeys.includes("stackFramework"), false);
    assert.equal(fallbackKeys.includes("stackPayment"), false);
});
(0, node_test_1.test)("design view model detects known stack from raw stack signals even when retained resources are sparse", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://example.com/_next/static/chunks/main.js",
                hostname: "example.com",
                pathname: "/_next/static/chunks/main.js"
            },
            {
                name: "https://vercel.live/edge-config",
                hostname: "vercel.live",
                pathname: "/edge-config"
            },
            {
                name: "https://www.googletagmanager.com/gtag/js?id=G-TEST",
                hostname: "www.googletagmanager.com",
                pathname: "/gtag/js"
            }
        ]
    });
    const issues = (0, detection_1.detectIssues)(snapshot);
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control: (0, control_1.assessControl)(snapshot, issues, {}),
        score,
        insight,
        scope: "single",
        pageCount: 1,
        answers: {},
        plusReport: null,
        requiredQuestionCount: 3
    });
    assert.ok(viewModel.stackGroups.some((group) => group.label === "Framework"));
    assert.ok(viewModel.stackGroups.some((group) => group.label === "Hosting / CDN" && group.items.some((item) => item.label === "Vercel")));
    assert.ok(viewModel.stackGroups.some((group) => group.label === "Analytics / Ads / RUM"));
});
(0, node_test_1.test)("design view model keeps brand colors for detected stack and fix cards", () => {
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
    const issues = (0, detection_1.detectIssues)(snapshot, {
        aiUsage: "yesOften",
        hostingProvider: "vercel"
    });
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control: (0, control_1.assessControl)(snapshot, issues, {
            aiUsage: "yesOften",
            hostingProvider: "vercel"
        }),
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
    assert.ok(issues.some((issue) => issue.category === "aiSpendSurface"));
    assert.ok(issues.some((issue) => issue.category === "analyticsAdsRumSurface"));
    assert.ok(issues.some((issue) => issue.category === "hostingCdnSpendSurface"));
    assert.equal(issues.some((issue) => issue.category === "requestCount"), false);
});
(0, node_test_1.test)("money stack detector recognizes amazon spend signals without generic tech spam", () => {
    const snapshot = createSnapshot([], {
        page: {
            href: "https://www.amazon.com/Amazon_Basics",
            origin: "https://www.amazon.com",
            hostname: "www.amazon.com",
            pathname: "/Amazon_Basics"
        },
        stackSignals: [
            {
                name: "https://d123.cloudfront.net/static/nav.js",
                hostname: "d123.cloudfront.net",
                pathname: "/static/nav.js",
                source: "resource"
            },
            {
                name: "https://s.amazon-adsystem.com/iu3?slot=navFooter",
                hostname: "s.amazon-adsystem.com",
                pathname: "/iu3",
                source: "resource"
            },
            {
                name: "https://client.rum.us-east-1.amazonaws.com/appmonitors/amazon",
                hostname: "client.rum.us-east-1.amazonaws.com",
                pathname: "/appmonitors/amazon",
                source: "resource"
            }
        ]
    });
    const detection = (0, stack_1.detectMoneyStack)(snapshot, {});
    const analyticsGroup = detection.groups.find((group) => group.id === "analyticsAdsRum");
    const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "CloudFront"));
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "AWS"));
    assert.ok(analyticsGroup?.vendors.some((vendor) => vendor.label === "Amazon Advertising"));
    assert.ok(analyticsGroup?.vendors.some((vendor) => vendor.label === "CloudWatch RUM"));
});
(0, node_test_1.test)("money stack detector classifies direct AWS service hosts explicitly", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://bucket-name.s3.amazonaws.com/assets/app.js",
                hostname: "bucket-name.s3.amazonaws.com",
                pathname: "/assets/app.js",
                source: "resource"
            },
            {
                name: "https://abc123.execute-api.us-east-1.amazonaws.com/prod/search",
                hostname: "abc123.execute-api.us-east-1.amazonaws.com",
                pathname: "/prod/search",
                source: "resource"
            }
        ]
    });
    const detection = (0, stack_1.detectMoneyStack)(snapshot, {});
    const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "AWS S3"));
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "AWS API Gateway"));
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "AWS"));
});
(0, node_test_1.test)("money stack detector resolves DigitalOcean from direct provider hosts", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://assets.example.ams3.digitaloceanspaces.com/app.js",
                hostname: "assets.example.ams3.digitaloceanspaces.com",
                pathname: "/app.js",
                source: "resource"
            }
        ]
    });
    const detection = (0, stack_1.detectMoneyStack)(snapshot, {});
    const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "DigitalOcean"));
});
(0, node_test_1.test)("pricing catalog preserves raw plan labels and normalized tiers", () => {
    assert.ok(pricing_2.PRICING_ENTRIES.some((entry) => entry.providerId === "hostinger" &&
        entry.rawPlanLabel === "Shared Single (Entry)" &&
        entry.normalizedTier === "entry"));
    assert.ok(pricing_2.PRICING_ENTRIES.some((entry) => entry.providerId === "aws" &&
        entry.rawPlanLabel === "ECS/Fargate Cluster" &&
        entry.normalizedTier === "cluster"));
});
(0, node_test_1.test)("pricing context maps CloudFront to AWS and stays approximate", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://d123.cloudfront.net/static/nav.js",
                hostname: "d123.cloudfront.net",
                pathname: "/static/nav.js",
                source: "resource"
            }
        ]
    });
    const detection = (0, stack_1.detectMoneyStack)(snapshot, {});
    const pricing = (0, pricing_1.resolvePricingContext)(snapshot, detection, {});
    assert.equal(pricing.primaryProvider?.providerId, "aws");
    assert.match(pricing.estimateSourceNote ?? "", /AWS/i);
    assert.equal(pricing.heuristicFallback, false);
});
(0, node_test_1.test)("pricing context can fall back to broad answer aliases without forcing stack detection", () => {
    const snapshot = createSnapshot([]);
    const detection = (0, stack_1.detectMoneyStack)(snapshot, { hostingProvider: "aws" });
    const pricing = (0, pricing_1.resolvePricingContext)(snapshot, detection, { hostingProvider: "aws" });
    assert.equal(detection.groups.some((group) => group.id === "hostingCdn"), false);
    assert.equal(pricing.primaryProvider?.providerId, "aws");
    assert.equal(pricing.heuristicFallback, false);
});
(0, node_test_1.test)("money stack detector treats Cloudflare Browser Insights as analytics and Cloudflare platform context", () => {
    const snapshot = createSnapshot([], {
        page: {
            href: "https://www.perplexity.ai/",
            origin: "https://www.perplexity.ai",
            hostname: "www.perplexity.ai",
            pathname: "/"
        },
        stackSignals: [
            {
                name: "https://static.cloudflareinsights.com/beacon.min.js",
                hostname: "static.cloudflareinsights.com",
                pathname: "/beacon.min.js",
                source: "resource"
            },
            {
                name: "https://api.execute-api.us-east-1.amazonaws.com/prod/session",
                hostname: "api.execute-api.us-east-1.amazonaws.com",
                pathname: "/prod/session",
                source: "resource"
            }
        ]
    });
    const detection = (0, stack_1.detectMoneyStack)(snapshot, {});
    const analyticsGroup = detection.groups.find((group) => group.id === "analyticsAdsRum");
    const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
    assert.ok(analyticsGroup?.vendors.some((vendor) => vendor.label === "Cloudflare Browser Insights"));
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "Cloudflare CDN"));
    assert.ok(hostingGroup?.vendors.some((vendor) => vendor.label === "AWS"));
});
(0, node_test_1.test)("generic AWS stack context does not create a hosting spend issue on its own", () => {
    const snapshot = createSnapshot([], {
        stackSignals: [
            {
                name: "https://abc123.execute-api.us-east-1.amazonaws.com/prod/search",
                hostname: "abc123.execute-api.us-east-1.amazonaws.com",
                pathname: "/prod/search",
                source: "resource"
            },
            {
                name: "https://bucket-name.s3.amazonaws.com/assets/app.js",
                hostname: "bucket-name.s3.amazonaws.com",
                pathname: "/assets/app.js",
                source: "resource"
            }
        ]
    });
    const issues = (0, detection_1.detectIssues)(snapshot, {});
    assert.equal(issues.some((issue) => issue.category === "hostingCdnSpendSurface"), false);
});
(0, node_test_1.test)("loading helpers only replay on new routes and soften same-route refreshes", () => {
    assert.equal((0, loadingState_1.shouldReplayLoading)(null, "https://example.com/a"), true);
    assert.equal((0, loadingState_1.shouldReplayLoading)("https://example.com/a", "https://example.com/a"), false);
    assert.equal((0, loadingState_1.shouldReplayLoading)("https://example.com/a", "https://example.com/b"), true);
    assert.equal((0, loadingState_1.isSoftRefresh)("https://example.com/a::2026-03-24T12:00:00.000Z", "https://example.com/a::2026-03-24T12:00:01.000Z"), true);
    assert.equal((0, loadingState_1.isSoftRefresh)("https://example.com/a::2026-03-24T12:00:00.000Z", "https://example.com/b::2026-03-24T12:00:01.000Z"), false);
});
(0, node_test_1.test)("page scan snapshots normalize to a stable page key", () => {
    const snapshot = createSnapshot([
        createResource("https://example.com/api/feed?slot=1", {
            category: "api",
            initiatorType: "fetch",
            encodedBodySize: 80_000
        })
    ]);
    const compact = (0, pageScanHistory_1.buildPageScanSnapshot)(snapshot);
    assert.equal((0, pageScanHistory_1.getPageScanKey)("https://example.com/?page=1"), "https://example.com/");
    assert.equal(compact.pageKey, "https://example.com/");
    assert.equal(compact.requestCount, snapshot.metrics.requestCount);
    assert.equal(compact.totalEncodedBodySize, snapshot.metrics.totalEncodedBodySize);
});
(0, node_test_1.test)("page scan comparison computes deltas and summary lines", () => {
    const previous = {
        url: "https://example.com/",
        pageKey: "https://example.com/",
        timestamp: Date.parse("2026-03-24T12:00:00.000Z"),
        requestCount: 10,
        duplicateRequestCount: 2,
        duplicateEndpointCount: 1,
        thirdPartyDomainCount: 2,
        totalEncodedBodySize: 500_000,
        meaningfulImageCount: 1,
        meaningfulImageBytes: 120_000
    };
    const next = {
        ...previous,
        timestamp: Date.parse("2026-03-24T12:01:00.000Z"),
        requestCount: 24,
        duplicateRequestCount: 5,
        duplicateEndpointCount: 2,
        thirdPartyDomainCount: 4,
        totalEncodedBodySize: 820_000,
        meaningfulImageCount: 3,
        meaningfulImageBytes: 420_000
    };
    const comparison = (0, pageScanHistory_1.comparePageScans)(previous, next);
    assert.equal(comparison.requestCountDelta, 14);
    assert.equal(comparison.duplicateRequestCountDelta, 3);
    assert.equal(comparison.totalEncodedBodySizeDelta, 320_000);
    assert.match(comparison.summary[0] ?? "", /14 more requests/i);
    assert.match(comparison.summary[1] ?? "", /320 KB/i);
});
(0, node_test_1.test)("latest captured snapshot carries across pages without being overwritten by auto saves", async () => {
    const storageState = {};
    const chromeMock = {
        runtime: { id: "test-extension", lastError: undefined },
        storage: {
            local: {
                get: (keys, callback) => {
                    const result = Object.fromEntries(keys.map((key) => [key, storageState[key]]));
                    callback(result);
                },
                set: (items, callback) => {
                    Object.assign(storageState, items);
                    callback();
                }
            }
        }
    };
    const previousChrome = globalThis.chrome;
    globalThis.chrome = chromeMock;
    try {
        const pageASnapshot = {
            url: "https://example.com/pricing",
            pageKey: "https://example.com/pricing",
            timestamp: Date.parse("2026-03-24T12:00:00.000Z"),
            requestCount: 12,
            duplicateRequestCount: 2,
            duplicateEndpointCount: 1,
            thirdPartyDomainCount: 3,
            totalEncodedBodySize: 220_000,
            meaningfulImageCount: 1,
            meaningfulImageBytes: 90_000
        };
        const pageBSnapshot = {
            url: "https://example.com/dashboard",
            pageKey: "https://example.com/dashboard",
            timestamp: Date.parse("2026-03-24T12:05:00.000Z"),
            requestCount: 18,
            duplicateRequestCount: 4,
            duplicateEndpointCount: 2,
            thirdPartyDomainCount: 5,
            totalEncodedBodySize: 360_000,
            meaningfulImageCount: 2,
            meaningfulImageBytes: 140_000
        };
        await (0, pageScanHistory_1.savePageScan)(pageASnapshot, { markAsLatestCaptured: true });
        const latestCaptured = await (0, pageScanHistory_1.getLatestCapturedPageScan)();
        assert.equal(latestCaptured?.pageKey, pageASnapshot.pageKey);
        const afterFirstCapture = await (0, pageScanHistory_1.getPageScanStoreSummary)();
        assert.equal(afterFirstCapture.savedPageCount, 1);
        const comparisonContext = await (0, pageScanHistory_1.getPageScanComparisonContext)(pageBSnapshot);
        assert.equal(comparisonContext.latestCapturedSnapshot?.pageKey, pageASnapshot.pageKey);
        assert.equal(comparisonContext.latestCapturedComparison?.requestCountDelta, 6);
        await (0, pageScanHistory_1.savePageScan)(pageBSnapshot);
        const latestCapturedAfterAutoSave = await (0, pageScanHistory_1.getLatestCapturedPageScan)();
        assert.equal(latestCapturedAfterAutoSave?.pageKey, pageASnapshot.pageKey);
        const afterSecondPage = await (0, pageScanHistory_1.getPageScanStoreSummary)();
        assert.equal(afterSecondPage.savedPageCount, 2);
    }
    finally {
        if (previousChrome === undefined) {
            delete globalThis.chrome;
        }
        else {
            globalThis.chrome = previousChrome;
        }
    }
});
(0, node_test_1.test)("local settings persist through chrome storage when available", async () => {
    const storageState = {};
    const previousChrome = globalThis.chrome;
    globalThis.chrome = {
        runtime: { id: "metis-test", lastError: undefined },
        storage: {
            local: {
                get(keys, callback) {
                    const result = Object.fromEntries(keys.map((key) => [key, storageState[key]]));
                    callback(result);
                },
                set(items, callback) {
                    Object.assign(storageState, items);
                    callback();
                }
            }
        }
    };
    try {
        const nextSettings = {
            ...metisLocalSettings_1.DEFAULT_METIS_SETTINGS,
            preferredScanScope: "multi",
            motionPreference: "reduced",
            showSampleProgress: false
        };
        await (0, metisLocalSettings_1.saveMetisLocalSettings)(nextSettings);
        const loadedSettings = await (0, metisLocalSettings_1.getMetisLocalSettings)();
        assert.equal(loadedSettings.preferredScanScope, "multi");
        assert.equal(loadedSettings.motionPreference, "reduced");
        assert.equal(loadedSettings.showSampleProgress, false);
    }
    finally {
        if (previousChrome === undefined) {
            delete globalThis.chrome;
        }
        else {
            globalThis.chrome = previousChrome;
        }
    }
});
(0, node_test_1.test)("export document builder keeps report sections deterministic", () => {
    const snapshot = createSnapshot([
        createResource("https://example.com/app.js", {
            category: "script",
            initiatorType: "script",
            encodedBodySize: 120_000
        }),
        createResource("https://example.com/api/feed", {
            category: "api",
            initiatorType: "fetch",
            encodedBodySize: 80_000
        })
    ]);
    const issues = (0, detection_1.detectIssues)(snapshot);
    const control = (0, control_1.assessControl)(snapshot, issues, {});
    const score = (0, scoring_1.scoreSnapshot)(snapshot, issues);
    const insight = (0, insights_1.buildInsight)(snapshot, issues, score);
    const viewModel = (0, liveAdapter_1.buildMetisDesignViewModel)({
        snapshot,
        issues,
        control,
        score,
        insight,
        scope: "single",
        pageCount: 1,
        answers: {},
        plusReport: null,
        requiredQuestionCount: 3
    });
    const document = (0, exportDocument_1.buildExportReportDocument)(viewModel);
    assert.equal(document.title, "Metis report · example.com");
    assert.equal(document.sections[0]?.title, "Overview");
    assert.match(document.sections[0]?.lines[0] ?? "", /Cost Risk:/);
    assert.equal(document.sections.at(-1)?.title, "Recommendations");
});
