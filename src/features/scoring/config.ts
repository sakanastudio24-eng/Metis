// scoring/config.ts keeps Phase 3 score weights public and centralized.
// Category multipliers and label thresholds live here so tuning stays transparent.
export const SCORE_CONFIG = {
  baseScore: 100,
  severityPenalty: {
    low: 5,
    medium: 10,
    high: 15
  },
  categoryMultiplier: {
    // Waste should lead. Complexity signals stay softer unless paired with
    // stronger waste patterns elsewhere in the route.
    requestCount: 0.4,
    duplicateRequests: 1.65,
    pageWeight: 0.55,
    largeImages: 1.6,
    thirdPartySprawl: 0.85,
    aiSpendSurface: 0.7,
    analyticsAdsRumSurface: 1.05,
    hostingCdnSpendSurface: 0.2
  },
  labels: {
    healthyMin: 72,
    watchMin: 52
  }
} as const;
