// detection/config.ts keeps Phase 3 issue thresholds public and centralized.
// This file is meant to be tuned without rewriting the detection engine.
export const DETECTION_THRESHOLDS = {
  requestCount: {
    low: 50,
    medium: 80,
    high: 120
  },
  duplicateRequests: {
    low: { duplicateRequestCount: 8, duplicateEndpointCount: 4 },
    medium: { duplicateRequestCount: 20, duplicateEndpointCount: 8 },
    high: { duplicateRequestCount: 45, duplicateEndpointCount: 16 }
  },
  pageWeight: {
    low: 750_000,
    medium: 1_500_000,
    high: 3_000_000
  },
  largeImages: {
    low: { meaningfulImageBytes: 500_000, meaningfulImageCount: 2 },
    medium: { meaningfulImageBytes: 1_000_000, meaningfulImageCount: 4 },
    high: { meaningfulImageBytes: 2_000_000, meaningfulImageCount: 8 }
  },
  thirdPartySprawl: {
    low: 4,
    medium: 8,
    high: 14
  }
} as const;
