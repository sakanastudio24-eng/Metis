// detection/config.ts keeps Phase 3 issue thresholds public and centralized.
// This file is meant to be tuned without rewriting the detection engine.
export const DETECTION_THRESHOLDS = {
  requestCount: {
    low: 80,
    medium: 180,
    high: 400
  },
  duplicateRequests: {
    low: { duplicateRequestCount: 20, duplicateEndpointCount: 6 },
    medium: { duplicateRequestCount: 60, duplicateEndpointCount: 14 },
    high: { duplicateRequestCount: 160, duplicateEndpointCount: 28 }
  },
  pageWeight: {
    low: 1_500_000,
    medium: 4_000_000,
    high: 8_000_000
  },
  largeImages: {
    low: { meaningfulImageBytes: 1_000_000, meaningfulImageCount: 4 },
    medium: { meaningfulImageBytes: 2_500_000, meaningfulImageCount: 8 },
    high: { meaningfulImageBytes: 5_000_000, meaningfulImageCount: 16 }
  },
  thirdPartySprawl: {
    low: 4,
    medium: 8,
    high: 14
  },
  analyticsAdsRumSurface: {
    low: 1,
    medium: 3,
    high: 5
  },
  aiSpendSurface: {
    mediumApiRequestCount: 5,
    highApiRequestCount: 12,
    mediumRequestCount: 40,
    highRequestCount: 80
  },
  hostingCdnSpendSurface: {
    lowTransferBytes: 250_000,
    mediumTransferBytes: 750_000,
    highTransferBytes: 1_500_000,
    mediumRequestCount: 40,
    highRequestCount: 80
  }
} as const;
