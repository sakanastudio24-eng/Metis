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
  PaidApiUsage
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
    key: "hostingProvider",
    label: "Which hosting provider are you using?",
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
    label: "What plan are you on?",
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
    key: "appType",
    label: "What kind of app is this?",
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
      { value: "mediaHeavy", label: "Media-heavy site" },
      { value: "aiApp", label: "AI app" },
      { value: "marketplace", label: "Marketplace" },
      { value: "internalTool", label: "Internal tool" }
    ]
  },
  {
    key: "monthlyVisits",
    label: "About how many monthly visits do you get?",
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
  } satisfies Record<OptimizationCoverage, string>
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
