// control.config.ts keeps the first-pass judgment model explicit and mechanical.
// Metis already knows how heavy a route looks; this layer asks whether the
// heaviness seems justified for the kind of route being scanned.
export const CONTROL_CONFIG = {
  baseScore: 60,
  labels: {
    controlledMin: 72,
    mixedMin: 52
  },
  credits: {
    containedRoute: 26,
    aiProviderDetected: 12,
    justifiedPayloadOnCdn: 8,
    modernFrameworkDetected: 4,
    modernFrameworkOverhead: 6,
    moderateAnalytics: 3,
    highlyDynamicRoute: 6,
    docsContextSupport: 4,
    docsMediaSupport: 14,
    dashboardContextSupport: 15,
    aiContextSupport: 18,
    specificRouteContext: 10
  },
  penalties: {
    duplicateEndpoints: 18,
    duplicateRequests: 14,
    largeImages: {
      low: 2,
      medium: 5,
      high: 9
    },
    heavyThirdPartySprawl: 12,
    mainPublicMarketingRoute: 4,
    unjustifiedPayload: 10,
    staticHighRequestCount: 10
  }
} as const;
