export const CONFIDENCE_CONFIG = {
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
