"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DETECTION_THRESHOLDS = void 0;
// detection/config.ts keeps Phase 3 issue thresholds public and centralized.
// This file is meant to be tuned without rewriting the detection engine.
exports.DETECTION_THRESHOLDS = {
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
};
