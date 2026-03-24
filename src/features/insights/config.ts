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
    healthy: "The page still looks controlled, but request volume is starting to build.",
    watch: "Request volume is pushing this page into a watch state.",
    "high risk": "Request volume is a primary driver of this page's cost pressure."
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
    healthy: "The page looks stable, but an AI cost surface is already present.",
    watch: "AI-backed work is contributing to this route's cost profile.",
    "high risk": "AI-backed requests are a major source of cost pressure on this route."
  },
  analyticsAdsRumSurface: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The page is mostly controlled, but vendor measurement overhead is present.",
    watch: "Analytics and ad-tech vendors are adding measurable cost pressure.",
    "high risk": "Vendor measurement and ad-tech overhead are a major cost driver here."
  },
  hostingCdnSpendSurface: {
    "warming up": "Metis is still warming up on this page.",
    healthy: "The route is controlled, but its hosting path already matters financially.",
    watch: "Hosting and CDN choices are shaping this route's cost profile.",
    "high risk": "The hosting and CDN path is amplifying cost on this route."
  }
};

export const INSIGHT_NEXT_STEPS: Record<IssueCategory | "default", string> = {
  default: "Keep monitoring this route and recheck after meaningful product changes.",
  requestCount:
    "Trim non-essential requests first, then defer low-value scripts and fold overlapping fetch paths together.",
  duplicateRequests:
    "Audit duplicate asset and API paths, then collapse repeated calls behind shared loaders or caches.",
  pageWeight:
    "Trim the heaviest assets first and defer anything that does not need to land in the first page view.",
  largeImages:
    "Start with the heaviest images and reduce bytes through resizing, better formats, or lazy loading.",
  thirdPartySprawl:
    "Review third-party tags and keep only the vendors that still justify their network and operational cost.",
  aiSpendSurface:
    "Reduce AI call frequency first through debouncing, caching, and narrower trigger points before traffic multiplies the spend.",
  analyticsAdsRumSurface:
    "Trim low-value analytics, ad-tech, and RUM vendors first, then keep the remaining tags lazy and well-scoped.",
  hostingCdnSpendSurface:
    "Treat cache misses, transfer-heavy assets, and repeated compute as infra-cost problems and tune them against the active host/CDN path."
};
