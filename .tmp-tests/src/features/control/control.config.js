"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROL_CONFIG = void 0;
// control.config.ts keeps the first-pass judgment model explicit and mechanical.
// Metis already knows how heavy a route looks; this layer asks whether the
// heaviness seems justified for the kind of route being scanned.
exports.CONTROL_CONFIG = {
    baseScore: 50,
    labels: {
        controlledMin: 65,
        mixedMin: 40
    },
    credits: {
        aiProviderDetected: 12,
        justifiedPayloadOnCdn: 8,
        modernFrameworkOverhead: 6,
        moderateAnalytics: 3,
        highlyDynamicRoute: 6,
        appContextSupport: 6
    },
    penalties: {
        duplicateEndpoints: 15,
        duplicateRequests: 12,
        heavyThirdPartySprawl: 10,
        unjustifiedPayload: 8,
        staticHighRequestCount: 8
    }
};
