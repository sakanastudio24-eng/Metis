// insights/config.ts keeps Phase 4 insight language public and deterministic.
// Summary templates, estimate labels, and next-step hints live here so the
// guidance layer can be tuned without rewriting the insight engine.
import type { IssueCategory, ScoreLabel } from "../../shared/types/audit";

type SummaryTemplateMap = Record<ScoreLabel, string>;

export const INSIGHT_ESTIMATE_LABELS: Record<ScoreLabel, string> = {
  "warming up": "Scanning",
  healthy: "Low waste",
  watch: "Moderate waste",
  "high risk": "Heavy waste"
};

export const INSIGHT_SUMMARY_TEMPLATES: Record<
  IssueCategory | "default",
  SummaryTemplateMap
> = {
  default: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page looks controlled from a cost-risk perspective.",
    watch: "The page is carrying moderate cost pressure.",
    "high risk": "The page is carrying heavy cost pressure."
  },
  requestCount: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "Request volume is noticeable, but it may still be justified for this route.",
    watch: "Request volume is elevated enough that this route is worth reviewing more closely.",
    "high risk": "Request volume is a major driver of this route's cost profile and needs context."
  },
  duplicateRequests: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page is mostly controlled, but repeated loading paths are starting to show.",
    watch: "Repeated requests are creating avoidable network waste.",
    "high risk": "Duplicate loading is a major source of waste on this page."
  },
  pageWeight: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "Payload size still looks manageable, but transfer weight is rising.",
    watch: "Transfer weight is heavy enough to keep this page in a watch state.",
    "high risk": "Payload weight is a major source of cost pressure on this page."
  },
  largeImages: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page is mostly controlled, but image weight is becoming noticeable.",
    watch: "Image payloads are driving moderate waste on this page.",
    "high risk": "Image payloads are driving a large share of this page's waste."
  },
  thirdPartySprawl: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page still looks controlled, but third-party sprawl is growing.",
    watch: "Third-party sprawl is starting to make the page harder to control.",
    "high risk": "Third-party sprawl is a major source of operational and network risk."
  },
  aiSpendSurface: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "An AI cost surface is present, but that may be expected for this route.",
    watch: "AI-backed work is part of this route's cost profile and should be checked for efficiency.",
    "high risk": "AI-backed work is a major source of cost pressure and may be firing more than the route needs."
  },
  analyticsAdsRumSurface: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page is mostly controlled, but vendor measurement overhead is present.",
    watch: "Analytics and ad-tech vendors are adding measurable cost pressure.",
    "high risk": "Vendor measurement and ad-tech overhead are a major cost driver here."
  },
  hostingCdnSpendSurface: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The hosting path matters financially here, but that does not make the route inherently wasteful.",
    watch: "The hosting and CDN path is amplifying the cost profile of this route.",
    "high risk": "The hosting and CDN path is making existing waste more expensive on this route."
  }
};

export const INSIGHT_NEXT_STEPS: Record<IssueCategory | "default", string> = {
  default: "Keep monitoring this route and recheck after meaningful product changes.",
  requestCount:
    "Separate expected route activity from redundant work first, then trim low-value requests and overlapping fetch paths.",
  duplicateRequests:
    "Audit duplicate asset and API paths, then collapse repeated calls behind shared loaders or caches.",
  pageWeight:
    "Trim the heaviest assets first and defer anything that does not need to land in the first page view.",
  largeImages:
    "Start with the heaviest images and reduce bytes through resizing, better formats, or lazy loading.",
  thirdPartySprawl:
    "Review third-party tags and keep only the vendors that still justify their network and operational cost.",
  aiSpendSurface:
    "Check whether AI work is expected on this route, then reduce call frequency with debouncing, caching, and narrower trigger points where it is not.",
  analyticsAdsRumSurface:
    "Trim low-value analytics, ad-tech, and RUM vendors first, then keep the remaining tags lazy and well-scoped.",
  hostingCdnSpendSurface:
    "Treat cache misses, transfer-heavy assets, and repeated compute as infra-cost amplifiers and tune them against the active host/CDN path."
};
