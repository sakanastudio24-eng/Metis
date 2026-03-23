// Keep Phase 3 score weights public and centralized so category tuning
// stays transparent and independent from score calculation code.
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
    thirdPartySprawl: 0.9
  },
  labels: {
    healthyMin: 85,
    watchMin: 65
  }
} as const;
