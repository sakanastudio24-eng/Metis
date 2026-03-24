// refinement/config.ts keeps the Plus questionnaire public and easy to tune.
// The question set is intentionally small so answers improve the report without
// turning the extension into a setup wizard.
import type {
  PlusRefinementAnswers,
  AppType,
  AiUsage,
  HighTrafficRoute,
  HostingPlan,
  HostingProvider,
  MediaImportance,
  MonthlyVisitsBand,
  OptimizationCoverage,
  PageDynamics,
  PaidApiUsage,
  SiteSizeBand,
  StackAiProvider,
  StackAnalytics,
  StackCdnProvider,
  StackFramework,
  StackPayment
} from "../../shared/types/audit";

type QuestionGroup = "Stack" | "Traffic" | "Cost sensitivity";
export type InsightArea =
  | "computeRisk"
  | "bandwidthCost"
  | "providerSpecificNextSteps"
  | "overageRisk"
  | "urgencyFraming"
  | "upgradeVsOptimizeGuidance"
  | "baselineExpectations"
  | "falsePositiveControl"
  | "recommendationRelevance"
  | "monthlyImpact"
  | "scaleProjection"
  | "savingsPrioritization"
  | "issuePrioritization"
  | "projectedImpactRelevance"
  | "actionOrdering"
  | "requestCountInterpretation"
  | "duplicateRequestSeriousness"
  | "cachingGuidance"
  | "apiCostSensitivity"
  | "premiumActionQuality"
  | "aiCostSensitivity"
  | "perSessionScaling"
  | "costDriverPrioritization"
  | "imageSeverityWeighting"
  | "optimizationPriority"
  | "recommendationTone"
  | "recommendationAccuracy"
  | "falsePositiveCleanup"
  | "imageAndBandwidthGuidance";

export interface PlusQuestionOption {
  value: string;
  label: string;
  brandColor?: string;
}

export interface PlusQuestionDefinition {
  key: keyof PlusRefinementAnswers;
  label: string;
  helper: string;
  improves: InsightArea[];
  whyItMatters: string;
  group: QuestionGroup;
  required: boolean;
  dependsOn?: {
    key: keyof PlusRefinementAnswers;
    value: string;
  };
  options: PlusQuestionOption[];
}

export const PLUS_CORE_KEYS: Array<keyof PlusRefinementAnswers> = [
  "hostingProvider",
  "monthlyVisits",
  "appType"
];

export const PLUS_QUESTION_DEFINITIONS: PlusQuestionDefinition[] = [
  {
    key: "appType",
    label: "App Type",
    helper: "This reduces false positives and changes what normal looks like.",
    improves: [
      "baselineExpectations",
      "falsePositiveControl",
      "recommendationRelevance"
    ],
    whyItMatters:
      "A route that looks heavy on a portfolio may be acceptable on a dashboard or marketplace.",
    group: "Stack",
    required: true,
    options: [
      { value: "marketing", label: "Marketing site" },
      { value: "portfolio", label: "Portfolio" },
      { value: "ecommerce", label: "Ecommerce" },
      { value: "saasDashboard", label: "SaaS dashboard" },
      { value: "mediaHeavy", label: "Content-heavy" },
      { value: "aiApp", label: "AI-heavy" },
      { value: "marketplace", label: "Marketplace" },
      { value: "internalTool", label: "Internal tool" }
    ]
  },
  {
    key: "hostingProvider",
    label: "Hosting Provider",
    helper: "This sharpens compute and bandwidth interpretation.",
    improves: [
      "computeRisk",
      "bandwidthCost",
      "providerSpecificNextSteps"
    ],
    whyItMatters:
      "The same request pattern means different things on different hosts and billing models.",
    group: "Stack",
    required: true,
    options: [
      { value: "vercel", label: "Vercel" },
      { value: "netlify", label: "Netlify" },
      { value: "cloudflare", label: "Cloudflare" },
      { value: "aws", label: "AWS" },
      { value: "render", label: "Render" },
      { value: "railway", label: "Railway" },
      { value: "other", label: "Other" }
    ]
  },
  {
    key: "hostingPlan",
    label: "Plan Tier",
    helper: "This changes overage risk and urgency framing.",
    improves: [
      "overageRisk",
      "urgencyFraming",
      "upgradeVsOptimizeGuidance"
    ],
    whyItMatters:
      "A watch score on a free plan can be more urgent than the same score on an enterprise plan.",
    group: "Stack",
    required: false,
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "team", label: "Team" },
      { value: "enterprise", label: "Enterprise" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "siteSize",
    label: "Site Size (optional)",
    helper: "Rough page count helps frame how much surface area this report should represent.",
    improves: [
      "baselineExpectations",
      "projectedImpactRelevance",
      "recommendationRelevance"
    ],
    whyItMatters:
      "A 6-page site and a 500-page app can show similar issues while needing very different cleanup strategies.",
    group: "Traffic",
    required: false,
    options: [
      { value: "under10", label: "Under 10 pages" },
      { value: "10To50", label: "10–50 pages" },
      { value: "50To200", label: "50–200 pages" },
      { value: "200Plus", label: "200+ pages" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "monthlyVisits",
    label: "Monthly Traffic",
    helper: "This is the highest-value input for impact and savings framing.",
    improves: [
      "monthlyImpact",
      "scaleProjection",
      "savingsPrioritization"
    ],
    whyItMatters:
      "Raw page weight means little without traffic. Volume determines whether a small issue is negligible or expensive.",
    group: "Traffic",
    required: true,
    options: [
      { value: "under1k", label: "Under 1k" },
      { value: "1kTo10k", label: "1k–10k" },
      { value: "10kTo100k", label: "10k–100k" },
      { value: "100kPlus", label: "100k+" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "highTrafficRoute",
    label: "Is this route one of your highest-traffic pages?",
    helper: "This changes prioritization more than raw page weight alone.",
    improves: [
      "issuePrioritization",
      "projectedImpactRelevance",
      "actionOrdering"
    ],
    whyItMatters:
      "A problem on a homepage or other hot route deserves faster cleanup than the same issue on a low-traffic admin path.",
    group: "Traffic",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "somewhat", label: "Somewhat" },
      { value: "no", label: "No" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "pageDynamics",
    label: "How dynamic is this page?",
    helper: "This helps separate expected request activity from waste.",
    improves: [
      "requestCountInterpretation",
      "duplicateRequestSeriousness",
      "cachingGuidance"
    ],
    whyItMatters:
      "Heavy request activity is more expected on highly dynamic apps, but repeated work can still be expensive.",
    group: "Traffic",
    required: false,
    options: [
      { value: "mostlyStatic", label: "Mostly static" },
      { value: "mixed", label: "Mixed" },
      { value: "highlyDynamic", label: "Highly dynamic" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "paidApiUsage",
    label: "Does this page use paid APIs?",
    helper: "This makes duplicate requests materially more expensive.",
    improves: [
      "apiCostSensitivity",
      "duplicateRequestSeriousness",
      "premiumActionQuality"
    ],
    whyItMatters:
      "Repeated calls are much worse if they hit paid services such as search, maps, auth, or email vendors.",
    group: "Cost sensitivity",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "aiUsage",
    label: "Does this page use AI per user action?",
    helper: "Frequent AI calls can dominate the cost profile.",
    improves: [
      "aiCostSensitivity",
      "perSessionScaling",
      "costDriverPrioritization"
    ],
    whyItMatters:
      "A single AI call on submit is very different from AI usage on every keystroke or repeated action.",
    group: "Cost sensitivity",
    required: false,
    options: [
      { value: "yesOften", label: "Yes, often" },
      { value: "sometimes", label: "Sometimes" },
      { value: "no", label: "No" },
      { value: "notSure", label: "Not sure" }
    ]
  },
  {
    key: "mediaImportance",
    label: "Are images or media important on this page?",
    helper: "This tunes how aggressively image issues should be framed.",
    improves: [
      "imageSeverityWeighting",
      "optimizationPriority",
      "recommendationTone"
    ],
    whyItMatters:
      "A photography or media product should be optimized differently than a docs site or admin tool.",
    group: "Cost sensitivity",
    required: false,
    options: [
      { value: "core", label: "Yes, core to the product" },
      { value: "somewhat", label: "Somewhat" },
      { value: "no", label: "No" }
    ]
  },
  {
    key: "optimizationCoverage",
    label: "Are you already using a CDN or image optimization?",
    helper: "This changes what the next best action should be.",
    improves: [
      "recommendationAccuracy",
      "falsePositiveCleanup",
      "imageAndBandwidthGuidance"
    ],
    whyItMatters:
      "Knowing whether optimization tooling already exists changes whether the best next move is adoption, tuning, or deeper cleanup.",
    group: "Cost sensitivity",
    required: false,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "notSure", label: "Not sure" }
    ]
  }
];

export const PLUS_LABELS = {
  hostingProvider: {
    vercel: "Vercel",
    netlify: "Netlify",
    cloudflare: "Cloudflare",
    aws: "AWS",
    render: "Render",
    railway: "Railway",
    other: "Other hosting"
  } satisfies Record<HostingProvider, string>,
  hostingPlan: {
    free: "free plan",
    pro: "pro plan",
    team: "team plan",
    enterprise: "enterprise plan",
    notSure: "unknown plan"
  } satisfies Record<HostingPlan, string>,
  monthlyVisits: {
    under1k: "under 1k monthly visits",
    "1kTo10k": "1k to 10k monthly visits",
    "10kTo100k": "10k to 100k monthly visits",
    "100kPlus": "100k+ monthly visits",
    notSure: "unknown traffic"
  } satisfies Record<MonthlyVisitsBand, string>,
  siteSize: {
    under10: "under 10 pages",
    "10To50": "10 to 50 pages",
    "50To200": "50 to 200 pages",
    "200Plus": "200+ pages",
    notSure: "unknown site size"
  } satisfies Record<SiteSizeBand, string>,
  appType: {
    marketing: "marketing site",
    portfolio: "portfolio",
    ecommerce: "ecommerce site",
    saasDashboard: "SaaS dashboard",
    mediaHeavy: "media-heavy site",
    aiApp: "AI app",
    marketplace: "marketplace",
    internalTool: "internal tool"
  } satisfies Record<AppType, string>,
  pageDynamics: {
    mostlyStatic: "mostly static route",
    mixed: "mixed route",
    highlyDynamic: "highly dynamic route",
    notSure: "unknown route dynamics"
  } satisfies Record<PageDynamics, string>,
  paidApiUsage: {
    yes: "paid APIs in the path",
    no: "no paid API calls expected",
    notSure: "unknown paid API usage"
  } satisfies Record<PaidApiUsage, string>,
  aiUsage: {
    yesOften: "AI on frequent user actions",
    sometimes: "occasional AI usage",
    no: "no AI usage",
    notSure: "unknown AI usage"
  } satisfies Record<AiUsage, string>,
  mediaImportance: {
    core: "media is core to the product",
    somewhat: "media matters somewhat",
    no: "media is not core"
  } satisfies Record<MediaImportance, string>,
  highTrafficRoute: {
    yes: "high-traffic route",
    somewhat: "medium-priority route",
    no: "lower-traffic route",
    notSure: "unknown route priority"
  } satisfies Record<HighTrafficRoute, string>,
  optimizationCoverage: {
    yes: "optimization tooling already in place",
    no: "no optimization tooling in place",
    notSure: "unknown optimization coverage"
  } satisfies Record<OptimizationCoverage, string>,
  stackFramework: {
    react: "React 18",
    nextjs: "Next.js 14",
    vue: "Vue",
    svelte: "Svelte",
    other: "Other framework"
  } satisfies Record<StackFramework, string>,
  stackCdnProvider: {
    cloudflare: "Cloudflare CDN",
    cloudfront: "CloudFront",
    fastly: "Fastly",
    vercelEdge: "Vercel Edge",
    none: "No CDN detected",
    other: "Other CDN"
  } satisfies Record<StackCdnProvider, string>,
  stackAiProvider: {
    openai: "OpenAI GPT-4",
    anthropic: "Anthropic Claude",
    google: "Google Gemini",
    none: "No AI provider",
    other: "Other AI provider"
  } satisfies Record<StackAiProvider, string>,
  stackAnalytics: {
    ga4: "Google Analytics 4",
    plausible: "Plausible",
    segment: "Segment",
    mixpanel: "Mixpanel",
    none: "No analytics",
    other: "Other analytics"
  } satisfies Record<StackAnalytics, string>,
  stackPayment: {
    stripe: "Stripe v3",
    shopify: "Shopify",
    paddle: "Paddle",
    none: "No payment provider",
    other: "Other payment provider"
  } satisfies Record<StackPayment, string>
};

export const PLUS_IMPACT_LABELS: Record<InsightArea, string> = {
  computeRisk: "compute risk interpretation",
  bandwidthCost: "bandwidth cost framing",
  providerSpecificNextSteps: "provider-specific next steps",
  overageRisk: "overage risk interpretation",
  urgencyFraming: "urgency framing",
  upgradeVsOptimizeGuidance: "upgrade versus optimize guidance",
  baselineExpectations: "baseline expectations",
  falsePositiveControl: "false positive control",
  recommendationRelevance: "recommendation relevance",
  monthlyImpact: "monthly impact framing",
  scaleProjection: "scale projection",
  savingsPrioritization: "savings prioritization",
  issuePrioritization: "issue prioritization",
  projectedImpactRelevance: "projected impact relevance",
  actionOrdering: "action ordering",
  requestCountInterpretation: "request-count interpretation",
  duplicateRequestSeriousness: "duplicate request seriousness",
  cachingGuidance: "caching guidance",
  apiCostSensitivity: "API cost sensitivity",
  premiumActionQuality: "premium action quality",
  aiCostSensitivity: "AI cost sensitivity",
  perSessionScaling: "per-session scaling logic",
  costDriverPrioritization: "cost-driver prioritization",
  imageSeverityWeighting: "image severity weighting",
  optimizationPriority: "optimization priority",
  recommendationTone: "recommendation tone",
  recommendationAccuracy: "recommendation accuracy",
  falsePositiveCleanup: "false positive cleanup",
  imageAndBandwidthGuidance: "image and bandwidth guidance"
};

const STACK_BRAND_COLORS = {
  react: "#61dafb",
  nextjs: "#9ca3af",
  vue: "#41b883",
  svelte: "#ff6d3b",
  cloudflare: "#f6821f",
  cloudfront: "#f59e0b",
  fastly: "#ff3355",
  vercelEdge: "#6366f1",
  openai: "#10a37f",
  anthropic: "#d97706",
  google: "#60a5fa",
  ga4: "#f9a825",
  plausible: "#a78bfa",
  segment: "#6ee7ff",
  mixpanel: "#8b5cf6",
  stripe: "#6772e5",
  shopify: "#7ab55c",
  paddle: "#6d5efc"
} as const;

export type MissingStackGroup =
  | "framework"
  | "hostingCdn"
  | "aiProvider"
  | "analytics"
  | "payment";

export function buildStackFallbackQuestionDefinitions(
  missingGroups: MissingStackGroup[]
): PlusQuestionDefinition[] {
  return missingGroups.map((group) => {
    switch (group) {
      case "framework":
        return {
          key: "stackFramework",
          label: "Framework",
          helper: "Metis could not confidently detect the UI framework on this route.",
          improves: ["baselineExpectations", "recommendationRelevance"],
          whyItMatters:
            "Framework context changes which fixes are realistic and which patterns are normal on the page.",
          group: "Stack",
          required: false,
          options: [
            { value: "react", label: "React 18", brandColor: STACK_BRAND_COLORS.react },
            { value: "nextjs", label: "Next.js 14", brandColor: STACK_BRAND_COLORS.nextjs },
            { value: "vue", label: "Vue", brandColor: STACK_BRAND_COLORS.vue },
            { value: "svelte", label: "Svelte", brandColor: STACK_BRAND_COLORS.svelte },
            { value: "other", label: "Other framework" }
          ]
        };
      case "hostingCdn":
        return {
          key: "stackCdnProvider",
          label: "Hosting / CDN",
          helper: "Metis could not confidently detect the host or CDN from the current route.",
          improves: ["providerSpecificNextSteps", "bandwidthCost", "recommendationAccuracy"],
          whyItMatters:
            "The host and CDN layer changes what repeated requests, caching, and heavy assets actually cost.",
          group: "Stack",
          required: false,
          options: [
            { value: "cloudflare", label: "Cloudflare CDN", brandColor: STACK_BRAND_COLORS.cloudflare },
            { value: "cloudfront", label: "CloudFront", brandColor: STACK_BRAND_COLORS.cloudfront },
            { value: "fastly", label: "Fastly", brandColor: STACK_BRAND_COLORS.fastly },
            { value: "vercelEdge", label: "Vercel Edge", brandColor: STACK_BRAND_COLORS.vercelEdge },
            { value: "none", label: "No CDN" },
            { value: "other", label: "Other CDN" }
          ]
        };
      case "aiProvider":
        return {
          key: "stackAiProvider",
          label: "AI Provider",
          helper: "Metis saw AI-like behavior but could not map it to a provider.",
          improves: ["aiCostSensitivity", "costDriverPrioritization", "premiumActionQuality"],
          whyItMatters:
            "Different AI vendors change per-request cost and what optimization steps matter most.",
          group: "Stack",
          required: false,
          options: [
            { value: "openai", label: "OpenAI GPT-4", brandColor: STACK_BRAND_COLORS.openai },
            { value: "anthropic", label: "Anthropic Claude", brandColor: STACK_BRAND_COLORS.anthropic },
            { value: "google", label: "Google Gemini", brandColor: STACK_BRAND_COLORS.google },
            { value: "none", label: "No AI provider" },
            { value: "other", label: "Other AI provider" }
          ]
        };
      case "analytics":
        return {
          key: "stackAnalytics",
          label: "Analytics",
          helper: "Metis could not identify the analytics tool from the current route.",
          improves: ["falsePositiveCleanup", "recommendationAccuracy", "actionOrdering"],
          whyItMatters:
            "Analytics vendors can add third-party weight and duplicate tag behavior that should be explained correctly.",
          group: "Stack",
          required: false,
          options: [
            { value: "ga4", label: "Google Analytics 4", brandColor: STACK_BRAND_COLORS.ga4 },
            { value: "plausible", label: "Plausible", brandColor: STACK_BRAND_COLORS.plausible },
            { value: "segment", label: "Segment", brandColor: STACK_BRAND_COLORS.segment },
            { value: "mixpanel", label: "Mixpanel", brandColor: STACK_BRAND_COLORS.mixpanel },
            { value: "none", label: "No analytics" },
            { value: "other", label: "Other analytics" }
          ]
        };
      case "payment":
      default:
        return {
          key: "stackPayment",
          label: "Payment",
          helper: "Metis could not identify a payment provider from this route.",
          improves: ["recommendationRelevance", "projectedImpactRelevance", "actionOrdering"],
          whyItMatters:
            "Payment providers often bring extra scripts and route-specific costs that should be attributed correctly.",
          group: "Stack",
          required: false,
          options: [
            { value: "stripe", label: "Stripe v3", brandColor: STACK_BRAND_COLORS.stripe },
            { value: "shopify", label: "Shopify", brandColor: STACK_BRAND_COLORS.shopify },
            { value: "paddle", label: "Paddle", brandColor: STACK_BRAND_COLORS.paddle },
            { value: "none", label: "No payment provider" },
            { value: "other", label: "Other payment provider" }
          ]
        };
    }
  });
}
