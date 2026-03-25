"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessControl = assessControl;
const stack_1 = require("../stack");
const config_1 = require("../detection/config");
const control_config_1 = require("./control.config");
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function hasIssue(issues, category) {
    return issues.some((issue) => issue.category === category);
}
function isModernFramework(frameworkIds) {
    return frameworkIds.some((id) => ["react", "nextjs", "vue", "svelte"].includes(id));
}
function supportsHeavyAppContext(answers) {
    return ["aiApp", "saasDashboard", "mediaHeavy", "ecommerce", "marketplace", "internalTool"].includes(answers.appType ?? "");
}
function buildLabel(score) {
    if (score >= control_config_1.CONTROL_CONFIG.labels.controlledMin) {
        return "Controlled";
    }
    if (score >= control_config_1.CONTROL_CONFIG.labels.mixedMin) {
        return "Mixed";
    }
    return "Uncontrolled";
}
function buildReasons(credits, penalties) {
    const ranked = [
        ...penalties.map((entry) => ({
            weight: entry.points,
            polarity: "penalty",
            reason: entry.reason
        })),
        ...credits.map((entry) => ({
            weight: entry.points,
            polarity: "credit",
            reason: entry.reason
        }))
    ]
        .sort((left, right) => {
        const weightDifference = right.weight - left.weight;
        if (weightDifference !== 0) {
            return weightDifference;
        }
        if (left.polarity !== right.polarity) {
            return left.polarity === "penalty" ? -1 : 1;
        }
        return left.reason.localeCompare(right.reason);
    })
        .slice(0, 3);
    return ranked.map((entry) => entry.reason);
}
function assessControl(snapshot, issues, answers = {}) {
    const detection = (0, stack_1.detectMoneyStack)(snapshot, answers);
    const metrics = snapshot.metrics;
    const credits = [];
    const penalties = [];
    const hostingIds = detection.groups.find((group) => group.id === "hostingCdn")?.vendors.map((vendor) => vendor.id) ?? [];
    const aiIds = detection.groups.find((group) => group.id === "aiProviders")?.vendors.map((vendor) => vendor.id) ?? [];
    const analyticsIds = detection.groups.find((group) => group.id === "analyticsAdsRum")?.vendors.map((vendor) => vendor.id) ?? [];
    const frameworkIds = detection.groups.find((group) => group.id === "framework")?.vendors.map((vendor) => vendor.id) ?? [];
    const hasHostingSupport = hostingIds.length > 0 || Boolean(answers.hostingProvider);
    const hasAiSurface = aiIds.length > 0 || ["yesOften", "sometimes"].includes(answers.aiUsage ?? "");
    const hasHeavyPayload = metrics.totalEncodedBodySize >= config_1.DETECTION_THRESHOLDS.pageWeight.medium;
    const hasElevatedRequestCount = metrics.requestCount >= config_1.DETECTION_THRESHOLDS.requestCount.medium;
    const hasHighRequestCount = metrics.requestCount >= config_1.DETECTION_THRESHOLDS.requestCount.high;
    const hasStaticContext = ["marketing", "portfolio"].includes(answers.appType ?? "") ||
        answers.pageDynamics === "mostlyStatic";
    const hasContextualSupport = hasHostingSupport || hasAiSurface || supportsHeavyAppContext(answers) || isModernFramework(frameworkIds);
    if (aiIds.length > 0) {
        credits.push({
            id: "ai-provider-detected",
            points: control_config_1.CONTROL_CONFIG.credits.aiProviderDetected,
            reason: "AI usage looks expected on this route because a provider is clearly present."
        });
    }
    if (hasHeavyPayload && hasHostingSupport) {
        credits.push({
            id: "payload-on-cdn",
            points: control_config_1.CONTROL_CONFIG.credits.justifiedPayloadOnCdn,
            reason: "Payload weight is partly justified by a hosting or CDN layer that is built to serve heavier routes."
        });
    }
    if (isModernFramework(frameworkIds) && hasElevatedRequestCount) {
        credits.push({
            id: "modern-framework-overhead",
            points: control_config_1.CONTROL_CONFIG.credits.modernFrameworkOverhead,
            reason: "Some request overhead is expected on a modern app route using a heavier client framework."
        });
    }
    if (analyticsIds.length >= 1 && analyticsIds.length <= config_1.DETECTION_THRESHOLDS.analyticsAdsRumSurface.medium) {
        credits.push({
            id: "moderate-analytics",
            points: control_config_1.CONTROL_CONFIG.credits.moderateAnalytics,
            reason: "A small analytics footprint can be normal if it stays contained."
        });
    }
    if (answers.pageDynamics === "highlyDynamic") {
        credits.push({
            id: "highly-dynamic-route",
            points: control_config_1.CONTROL_CONFIG.credits.highlyDynamicRoute,
            reason: "The route is marked as highly dynamic, so some extra request activity is expected."
        });
    }
    if (supportsHeavyAppContext(answers)) {
        credits.push({
            id: "app-context-support",
            points: control_config_1.CONTROL_CONFIG.credits.appContextSupport,
            reason: "The selected app type suggests this route can legitimately carry more work than a simple site."
        });
    }
    if (metrics.duplicateEndpointCount >= config_1.DETECTION_THRESHOLDS.duplicateRequests.low.duplicateEndpointCount) {
        penalties.push({
            id: "duplicate-endpoints",
            points: control_config_1.CONTROL_CONFIG.penalties.duplicateEndpoints,
            reason: "Duplicate endpoints still point to repeated work that is hard to justify."
        });
    }
    if (metrics.duplicateRequestCount >= config_1.DETECTION_THRESHOLDS.duplicateRequests.low.duplicateRequestCount) {
        penalties.push({
            id: "duplicate-requests",
            points: control_config_1.CONTROL_CONFIG.penalties.duplicateRequests,
            reason: "Repeated requests suggest avoidable waste instead of expected route complexity."
        });
    }
    if (metrics.thirdPartyDomainCount >= config_1.DETECTION_THRESHOLDS.thirdPartySprawl.high) {
        penalties.push({
            id: "heavy-third-party-sprawl",
            points: control_config_1.CONTROL_CONFIG.penalties.heavyThirdPartySprawl,
            reason: "Heavy third-party sprawl is difficult to justify because each extra vendor adds overhead."
        });
    }
    if (hasHeavyPayload && !hasContextualSupport) {
        penalties.push({
            id: "unjustified-payload",
            points: control_config_1.CONTROL_CONFIG.penalties.unjustifiedPayload,
            reason: "Payload weight looks high without enough route context to explain it."
        });
    }
    if (hasHighRequestCount && hasStaticContext && !hasIssue(issues, "duplicateRequests")) {
        penalties.push({
            id: "static-high-request-count",
            points: control_config_1.CONTROL_CONFIG.penalties.staticHighRequestCount,
            reason: "Request volume looks high for a relatively static route and is worth challenging."
        });
    }
    const creditPoints = credits.reduce((total, entry) => total + entry.points, 0);
    const penaltyPoints = penalties.reduce((total, entry) => total + entry.points, 0);
    const score = clamp(control_config_1.CONTROL_CONFIG.baseScore + creditPoints - penaltyPoints, 0, 100);
    return {
        score,
        label: buildLabel(score),
        reasons: buildReasons(credits, penalties),
        credits,
        penalties
    };
}
