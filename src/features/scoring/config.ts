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
    requestCount: 1,
    duplicateRequests: 1.25,
    pageWeight: 1.1,
    largeImages: 1,
    thirdPartySprawl: 0.9,
    aiSpendSurface: 0.75,
    analyticsAdsRumSurface: 0.6,
    hostingCdnSpendSurface: 0.55
  },
  labels: {
    healthyMin: 85,
    watchMin: 65
  }
} as const;
