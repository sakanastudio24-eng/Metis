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

export interface PlusQuestionOption {
  value: string;
  label: string;
}

export interface PlusQuestionDefinition {
  key: keyof PlusRefinementAnswers;
  label: string;
  helper: string;
  group: QuestionGroup;
  required: boolean;
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
    key: "paidApis",
    label: "Does this page use paid APIs?",
    helper: "This makes duplicate requests materially more expensive.",
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
    other: "other hosting"
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
  paidApis: {
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
