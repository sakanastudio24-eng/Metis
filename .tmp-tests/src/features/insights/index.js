"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInsight = buildInsight;
const config_1 = require("./config");
const severityRank = {
    low: 1,
    medium: 2,
    high: 3
};
function formatBytes(bytes) {
    if (bytes >= 1_000_000) {
        return `${(bytes / 1_000_000).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}
function findDeductionForIssue(issue, deductions) {
    return deductions.find((deduction) => deduction.category === issue.category);
}
function getStrongestIssue(issues, deductions) {
    // Insight order should track the same logic the score used, otherwise the
    // headline can feel disconnected from the numeric result.
    return [...issues].sort((left, right) => {
        const severityDifference = severityRank[right.severity] - severityRank[left.severity];
        if (severityDifference !== 0) {
            return severityDifference;
        }
        const leftPoints = findDeductionForIssue(left, deductions)?.points ?? 0;
        const rightPoints = findDeductionForIssue(right, deductions)?.points ?? 0;
        const deductionDifference = rightPoints - leftPoints;
        if (deductionDifference !== 0) {
            return deductionDifference;
        }
        return left.title.localeCompare(right.title);
    })[0];
}
function buildSupportingDetail(issue) {
    // This line exists to prove why the issue fired, not to restate the title.
    switch (issue.category) {
        case "requestCount":
            return `${issue.metric?.requestCount ?? 0} retained requests cleared cleanup against a threshold of ${issue.threshold?.requestCount ?? 0}.`;
        case "duplicateRequests":
            return `${issue.metric?.duplicateRequestCount ?? 0} duplicate hits landed across ${issue.metric?.duplicateEndpointCount ?? 0} endpoints, past the active threshold of ${issue.threshold?.duplicateRequestCount ?? 0} hits or ${issue.threshold?.duplicateEndpointCount ?? 0} endpoints.`;
        case "pageWeight":
            return `${formatBytes(issue.metric?.totalEncodedBodySize ?? 0)} of known transfer weight was retained against a threshold of ${formatBytes(issue.threshold?.totalEncodedBodySize ?? 0)}.`;
        case "largeImages":
            return `${issue.metric?.meaningfulImageCount ?? 0} heavier images account for ${formatBytes(issue.metric?.meaningfulImageBytes ?? 0)}, above the current threshold of ${issue.threshold?.meaningfulImageCount ?? 0} images or ${formatBytes(issue.threshold?.meaningfulImageBytes ?? 0)}.`;
        case "thirdPartySprawl":
            return `${issue.metric?.thirdPartyDomainCount ?? 0} third-party domains were observed against a threshold of ${issue.threshold?.thirdPartyDomainCount ?? 0}.`;
        case "aiSpendSurface":
            return `${issue.metric?.aiVendorCount ?? 0} AI provider was detected with ${issue.metric?.apiRequestCount ?? 0} API-style requests and ${issue.metric?.requestCount ?? 0} retained requests on this route.`;
        case "analyticsAdsRumSurface":
            return `${issue.metric?.analyticsVendorCount ?? 0} analytics, ad-tech, or RUM vendors were detected on this route.`;
        case "hostingCdnSpendSurface":
            return `${issue.metric?.hostingVendorCount ?? 0} hosting or CDN vendors were detected alongside ${formatBytes(issue.metric?.totalEncodedBodySize ?? 0)} of transfer weight and ${issue.metric?.requestCount ?? 0} retained requests.`;
        default:
            return issue.detail;
    }
}
function buildNoIssueInsight(snapshot) {
    return {
        summary: "The page looks controlled from a cost-risk perspective.",
        supportingDetail: `${snapshot.metrics.requestCount} retained requests and ${formatBytes(snapshot.metrics.totalEncodedBodySize)} of known transfer weight are both staying within the current thresholds.`,
        estimateLabel: config_1.INSIGHT_ESTIMATE_LABELS.healthy,
        nextStep: config_1.INSIGHT_NEXT_STEPS.default,
        primaryCategory: null
    };
}
function buildWarmingInsight(snapshot) {
    return {
        summary: "Metis is still warming up on this page.",
        supportingDetail: `${snapshot.metrics.rawRequestCount} raw resource entries were seen, but not enough retained requests have cleared cleanup yet.`,
        estimateLabel: config_1.INSIGHT_ESTIMATE_LABELS["warming up"],
        nextStep: "Let the page finish loading, interact once, and run the scan again.",
        primaryCategory: null
    };
}
function buildInsight(snapshot, issues, score) {
    if (score.label === "warming up") {
        return buildWarmingInsight(snapshot);
    }
    if (issues.length === 0) {
        return buildNoIssueInsight(snapshot);
    }
    const strongestIssue = getStrongestIssue(issues, score.deductions);
    const primaryCategory = strongestIssue.category;
    // Summary text stays template-based so the same input always yields the same
    // headline. That keeps Phase 4 deterministic and easier to test.
    const summaryTemplate = config_1.INSIGHT_SUMMARY_TEMPLATES[primaryCategory]?.[score.label] ??
        config_1.INSIGHT_SUMMARY_TEMPLATES.default[score.label];
    return {
        summary: summaryTemplate,
        supportingDetail: buildSupportingDetail(strongestIssue),
        estimateLabel: config_1.INSIGHT_ESTIMATE_LABELS[score.label],
        nextStep: config_1.INSIGHT_NEXT_STEPS[primaryCategory] ?? config_1.INSIGHT_NEXT_STEPS.default,
        primaryCategory
    };
}
