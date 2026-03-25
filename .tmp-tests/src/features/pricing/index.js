"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePricingContext = resolvePricingContext;
const pricing_1 = require("../../config/pricing");
function toResolvedProvider(providerId, confidence) {
    const entry = (0, pricing_1.getCheapestPricingEntry)(providerId);
    if (!entry) {
        return null;
    }
    return {
        providerId,
        displayName: entry.displayName,
        rawPlanLabel: entry.rawPlanLabel,
        normalizedTier: entry.normalizedTier,
        approximateRate: entry.approximateRate,
        sourceUrl: entry.sourceUrl,
        lastVerifiedAt: entry.lastVerifiedAt,
        confidence
    };
}
function mapVendorToAlias(vendorId) {
    switch (vendorId) {
        case "cloudfront":
            return "cloudfront";
        case "aws-s3":
            return "aws-s3";
        case "aws-api-gateway":
            return "aws-api-gateway";
        case "cloudflare":
            return "cloudflare-cdn";
        case "vercel":
            return "vercel-edge";
        case "digitalocean":
        case "linode":
        case "vultr":
        case "gcp":
        case "azure":
        case "heroku":
        case "aws":
            return vendorId;
        default:
            return null;
    }
}
function deriveAnswerAlias(answers) {
    if (!answers.hostingProvider) {
        return null;
    }
    return answers.hostingProvider;
}
function buildEstimateSourceNote(provider) {
    if (!provider) {
        return null;
    }
    return `~ Based on ${provider.displayName} ${provider.rawPlanLabel} assumptions last verified ${provider.lastVerifiedAt}.`;
}
function resolvePricingContext(snapshot, detection, answers = {}) {
    const matchedProviders = [];
    const seen = new Set();
    const addProvider = (alias, confidence) => {
        if (!alias) {
            return;
        }
        const providerId = pricing_1.PRICING_PROVIDER_ALIASES[alias];
        if (!providerId || seen.has(providerId)) {
            return;
        }
        const provider = toResolvedProvider(providerId, confidence);
        if (!provider) {
            return;
        }
        seen.add(providerId);
        matchedProviders.push(provider);
    };
    for (const vendor of detection.groups.find((group) => group.id === "hostingCdn")?.vendors ?? []) {
        addProvider(mapVendorToAlias(vendor.id), vendor.confidence);
    }
    for (const vendor of detection.groups.find((group) => group.id === "aiProviders")?.vendors ?? []) {
        if (vendor.id === "openai") {
            addProvider("openai", vendor.confidence);
        }
        else if (vendor.id === "anthropic") {
            addProvider("anthropic", vendor.confidence);
        }
    }
    if (matchedProviders.length === 0) {
        addProvider(deriveAnswerAlias(answers), "low");
    }
    const primaryProvider = matchedProviders[0] ?? null;
    const providerMultiplier = primaryProvider ? pricing_1.PRICING_PROVIDER_MULTIPLIERS[primaryProvider.providerId] : 1;
    return {
        primaryProvider,
        matchedProviders,
        estimateSourceNote: buildEstimateSourceNote(primaryProvider),
        heuristicFallback: matchedProviders.length === 0,
        monthlyVisitBaseline: primaryProvider
            ? (0, pricing_1.getCheapestPricingEntry)(primaryProvider.providerId)?.monthlyVisitBaseline ?? null
            : null,
        providerMultiplier: snapshot.metrics.requestCount > 0 ? providerMultiplier : 1
    };
}
