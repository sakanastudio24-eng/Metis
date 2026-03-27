import {
  getCheapestPricingEntry,
  PRICING_PROVIDER_ALIASES,
  PRICING_PROVIDER_MULTIPLIERS
} from "../../config/pricing";
import type {
  MoneyStackDetection,
  PlusRefinementAnswers,
  PricingContext,
  PricingProviderAlias,
  PricingProviderId,
  RawScanSnapshot,
  ResolvedPricingProvider
} from "../../shared/types/audit";

function toResolvedProvider(
  providerId: PricingProviderId,
  confidence: ResolvedPricingProvider["confidence"]
): ResolvedPricingProvider | null {
  const entry = getCheapestPricingEntry(providerId);
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

function mapVendorToAlias(vendorId: string): PricingProviderAlias | null {
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

function deriveAnswerAlias(answers: PlusRefinementAnswers): PricingProviderAlias | null {
  if (!answers.hostingProvider) {
    return null;
  }
  return answers.hostingProvider;
}

function buildEstimateSourceNote(provider: ResolvedPricingProvider | null) {
  if (!provider) {
    return null;
  }

  return `~ Based on the ${provider.displayName} ${provider.rawPlanLabel} pricing reference last verified ${provider.lastVerifiedAt}.`;
}

export function resolvePricingContext(
  snapshot: RawScanSnapshot,
  detection: MoneyStackDetection,
  answers: PlusRefinementAnswers = {}
): PricingContext {
  const matchedProviders: ResolvedPricingProvider[] = [];
  const seen = new Set<PricingProviderId>();

  // The pricing layer is deliberately conservative. Strong stack evidence wins
  // first, while user answers are only used to sharpen billing context when
  // the page itself cannot prove the provider family.
  const addProvider = (
    alias: PricingProviderAlias | null,
    confidence: ResolvedPricingProvider["confidence"]
  ) => {
    if (!alias) {
      return;
    }
    const providerId = PRICING_PROVIDER_ALIASES[alias];
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
    } else if (vendor.id === "anthropic") {
      addProvider("anthropic", vendor.confidence);
    }
  }

  if (matchedProviders.length === 0) {
    addProvider(deriveAnswerAlias(answers), "low");
  }

  const primaryProvider = matchedProviders[0] ?? null;
  const providerMultiplier =
    primaryProvider ? PRICING_PROVIDER_MULTIPLIERS[primaryProvider.providerId] : 1;

  return {
    primaryProvider,
    matchedProviders,
    estimateSourceNote: buildEstimateSourceNote(primaryProvider),
    heuristicFallback: matchedProviders.length === 0,
    monthlyVisitBaseline: primaryProvider
      ? getCheapestPricingEntry(primaryProvider.providerId)?.monthlyVisitBaseline ?? null
      : null,
    providerMultiplier: snapshot.metrics.requestCount > 0 ? providerMultiplier : 1
  };
}
