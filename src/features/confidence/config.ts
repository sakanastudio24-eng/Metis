export const CONFIDENCE_CONFIG = {
  limited: {
    requestCount: 5,
    totalEncodedBodySize: 100_000
  },
  requests: {
    moderate: 8,
    high: 18
  },
  meaningfulImageBytes: {
    moderate: 100_000,
    high: 300_000
  },
  missingGroups: {
    moderate: 1,
    low: 2
  }
} as const;
