/**
 * liveAdapter.ts
 * Maps the Phase 4 scan, score, and refinement state into the prototype-shaped
 * view model used by the zip-authoritative shell.
 */
import {
  buildStackFallbackQuestionDefinitions,
  PLUS_LABELS
} from "../../../features/refinement/config";
import type { PlusQuestionDefinition } from "../../../features/refinement/config";
import type {
  DetectedIssue,
  IssueCategory,
  PlusOptimizationReport,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ScoreBreakdown
} from "../../../shared/types/audit";
import type { ScanScope } from "../../useMetisState";

export interface DesignIssue {
  id: string;
  title: string;
  detail: string;
  severityLabel: "critical" | "moderate" | "low";
  color: string;
}

export interface DesignSummaryPill {
  label: string;
  tone: "critical" | "moderate" | "low";
}

export interface DesignStackChip {
  label: string;
  tone: "neutral" | "provider" | "ai" | "warning" | "tech";
  brandColor?: string;
}

export interface DesignStackGroupItem {
  label: string;
  brandColor?: string;
}

export interface DesignStackGroup {
  label: string;
  items: DesignStackGroupItem[];
}

export interface DesignCostRow {
  label: string;
  amount: string;
  accent: string;
}

export interface DesignQuestionState {
  answeredCount: number;
  requiredCount: number;
  missingCoreCount: number;
  summary: string | null;
  detail: string | null;
  nextStep: string | null;
  priorityLabel: string | null;
}

export interface DesignScaleSimulationRow {
  trafficLabel: string;
  scenario: string;
  amount: string;
}

export interface DesignFixRecommendationCard {
  title: string;
  severityLabel: "critical" | "moderate" | "low";
  saveLabel?: string;
  priorityLabel?: string;
  rootCause?: string;
  fix?: string;
  scaleImpact?: string;
  color: string;
}

export interface MetisDesignViewModel {
  routeKey: string;
  snapshotKey: string;
  hostname: string;
  pathname: string;
  scannedAt: string;
  scopeLabel: string;
  pagesSampledLabel: string;
  metaTokens: string[];
  score: number;
  riskLabel: string;
  riskColor: string;
  riskBg: string;
  estimateRange: string;
  quickInsight: string;
  supportingDetail: string;
  sessionCost: string;
  monthlyProjection: string;
  summaryPills: DesignSummaryPill[];
  issues: DesignIssue[];
  topIssues: DesignIssue[];
  stackChips: DesignStackChip[];
  stackGroups: DesignStackGroup[];
  costRows: DesignCostRow[];
  questionState: DesignQuestionState;
  scaleSimulationRows: DesignScaleSimulationRow[];
  aiCostPerRequestEstimate: string | null;
  fixRecommendationCards: DesignFixRecommendationCard[];
  stackQuestionDefinitions: PlusQuestionDefinition[];
  stackDetectionState: {
    missingGroups: string[];
  };
}

const STACK_BRAND_COLORS = {
  react: "#61dafb",
  nextjs: "#9ca3af",
  vercel: "#6366f1",
  cloudflare: "#f6821f",
  openai: "#10a37f",
  ga4: "#f9a825",
  stripe: "#6772e5"
} as const;

function formatCurrency(value: number) {
  if (value < 0.1) {
    return `$${value.toFixed(3)}`;
  }

  if (value < 10) {
    return `$${value.toFixed(2)}`;
  }

  return `$${Math.round(value)}`;
}

function formatMonthly(value: number) {
  if (value >= 10_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }

  return `$${Math.round(value)}`;
}

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

function scoreToRiskTone(score: ScoreBreakdown) {
  switch (score.label) {
    case "high risk":
      return {
        label: "High Risk",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.2)"
      };
    case "watch":
      return {
        label: "Moderate Risk",
        color: "#f97316",
        bg: "rgba(249,115,22,0.2)"
      };
    case "healthy":
      return {
        label: "Healthy",
        color: "#22c55e",
        bg: "rgba(34,197,94,0.2)"
      };
    default:
      return {
        label: "Warming up",
        color: "rgba(255,255,255,0.4)",
        bg: "rgba(255,255,255,0.08)"
      };
  }
}

function visitEstimate(answers: PlusRefinementAnswers) {
  switch (answers.monthlyVisits) {
    case "under1k":
      return 750;
    case "1kTo10k":
      return 5_000;
    case "10kTo100k":
      return 50_000;
    case "100kPlus":
      return 150_000;
    default:
      return 5_000;
  }
}

function aiWeight(answers: PlusRefinementAnswers) {
  switch (answers.aiUsage) {
    case "yesOften":
      return 8;
    case "sometimes":
      return 4;
    default:
      return 0;
  }
}

function deriveMonthlyWaste(snapshot: RawScanSnapshot, answers: PlusRefinementAnswers) {
  const { metrics } = snapshot;
  const baseWaste =
    metrics.totalEncodedBodySize / 1_000_000 * 1.1 +
    metrics.requestCount * 0.05 +
    metrics.duplicateRequestCount * 0.25 +
    metrics.thirdPartyRequestCount * 0.03 +
    metrics.meaningfulImageCount * 0.4 +
    aiWeight(answers);

  const visitFactor =
    answers.monthlyVisits === "under1k"
      ? 0.4
      : answers.monthlyVisits === "1kTo10k"
        ? 1
        : answers.monthlyVisits === "10kTo100k"
          ? 4
          : answers.monthlyVisits === "100kPlus"
            ? 10
            : 1;

  return Math.max(4, baseWaste * visitFactor);
}

function issueToDesignIssue(issue: DetectedIssue): DesignIssue {
  return {
    id: issue.id,
    title: issue.title,
    detail: issue.detail,
    severityLabel:
      issue.severity === "high"
        ? "critical"
        : issue.severity === "medium"
          ? "moderate"
          : "low",
    color:
      issue.severity === "high"
        ? "#ef4444"
        : issue.severity === "medium"
          ? "#f97316"
          : "#eab308"
  };
}

function buildSummaryPills(issues: DesignIssue[]) {
  const counts = {
    critical: issues.filter((issue) => issue.severityLabel === "critical").length,
    moderate: issues.filter((issue) => issue.severityLabel === "moderate").length,
    low: issues.filter((issue) => issue.severityLabel === "low").length
  };

  return [
    counts.critical > 0
      ? { label: `${counts.critical} Critical`, tone: "critical" as const }
      : null,
    counts.moderate > 0
      ? { label: `${counts.moderate} Moderate`, tone: "moderate" as const }
      : null,
    counts.low > 0 ? { label: `${counts.low} Low`, tone: "low" as const } : null
  ].filter((value): value is DesignSummaryPill => value !== null);
}

function buildCostRows(score: ScoreBreakdown, snapshot: RawScanSnapshot, answers: PlusRefinementAnswers) {
  const monthlyWaste = deriveMonthlyWaste(snapshot, answers);
  const contribution = {
    bandwidth: 0,
    requests: 0,
    ai: 0
  };

  score.deductions.forEach((deduction) => {
    if (deduction.category === "pageWeight" || deduction.category === "largeImages") {
      contribution.bandwidth += deduction.points;
      return;
    }

    if (deduction.category === "requestCount" || deduction.category === "duplicateRequests") {
      contribution.requests += deduction.points;
      return;
    }

    contribution.ai += deduction.points;
  });

  contribution.ai += aiWeight(answers) > 0 ? aiWeight(answers) / 2 : 0;

  const totalContribution = contribution.bandwidth + contribution.requests + contribution.ai || 1;
  const bandwidthValue = monthlyWaste * (contribution.bandwidth / totalContribution || 0.35);
  const requestsValue = monthlyWaste * (contribution.requests / totalContribution || 0.4);
  const aiValue = monthlyWaste * (contribution.ai / totalContribution || 0.25);

  return [
    {
      label: "Bandwidth",
      amount: `~${formatMonthly(bandwidthValue)}/mo`,
      accent: "#9cc3ff"
    },
    {
      label: "Requests / Compute",
      amount: `~${formatMonthly(requestsValue)}/mo`,
      accent: "#ffb366"
    },
    {
      label:
        answers.aiUsage && answers.aiUsage !== "no"
          ? "AI API Usage"
          : "Third-Party / APIs",
      amount: `~${formatMonthly(aiValue)}/mo`,
      accent: answers.aiUsage && answers.aiUsage !== "no" ? "#17c690" : "#a5b4fc"
    }
  ];
}

function hasStackMatch(haystacks: string[], patterns: string[]) {
  return patterns.some((pattern) => haystacks.some((value) => value.includes(pattern)));
}

function detectStack(snapshot: RawScanSnapshot, answers: PlusRefinementAnswers) {
  const resources = snapshot.resources;
  const stackSignals = snapshot.stackSignals ?? [];
  const signalNames = stackSignals.map((signal) => signal.name.toLowerCase());
  const signalHostnames = stackSignals.map((signal) => signal.hostname.toLowerCase());
  const signalPathnames = stackSignals.map((signal) => signal.pathname.toLowerCase());
  const resourceNames = resources.map((resource) => resource.name.toLowerCase());
  const hostnames = resources.map((resource) => resource.hostname.toLowerCase());
  const names = [...resourceNames, ...signalNames];
  const hosts = [...hostnames, ...signalHostnames];
  const paths = [...resources.map((resource) => resource.pathname.toLowerCase()), ...signalPathnames];

  const frameworkItems: DesignStackGroupItem[] = [];
  const hostingItems: DesignStackGroupItem[] = [];
  const aiItems: DesignStackGroupItem[] = [];
  const analyticsItems: DesignStackGroupItem[] = [];
  const paymentItems: DesignStackGroupItem[] = [];

  const hasNext =
    hasStackMatch(names, ["/_next/", "__next", "next.js", "nextjs"]) ||
    hasStackMatch(paths, ["/_next/", "/next-static/"]) ||
    answers.stackFramework === "nextjs";

  if (hasNext) {
    frameworkItems.push({ label: "Next.js 14", brandColor: STACK_BRAND_COLORS.nextjs });
  }

  if (
    hasStackMatch(names, ["react", "react-dom", "react.production"]) ||
    answers.stackFramework === "react" ||
    hasNext
  ) {
    frameworkItems.unshift({ label: "React 18", brandColor: STACK_BRAND_COLORS.react });
  }

  if (answers.stackFramework && frameworkItems.length === 0) {
    frameworkItems.push({
      label: PLUS_LABELS.stackFramework[answers.stackFramework],
      brandColor:
        answers.stackFramework === "react"
          ? STACK_BRAND_COLORS.react
          : answers.stackFramework === "nextjs"
            ? STACK_BRAND_COLORS.nextjs
            : undefined
    });
  }

  if (answers.hostingProvider) {
    hostingItems.push({
      label: PLUS_LABELS.hostingProvider[answers.hostingProvider],
      brandColor:
        answers.hostingProvider === "vercel" ? STACK_BRAND_COLORS.vercel : undefined
    });
  }

  if (
    hasStackMatch(hosts, ["cloudflare", "cloudflareinsights.com", "challenges.cloudflare.com"]) ||
    answers.stackCdnProvider === "cloudflare"
  ) {
    hostingItems.push({ label: "Cloudflare CDN", brandColor: STACK_BRAND_COLORS.cloudflare });
  } else if (
    hasStackMatch(hosts, ["vercel", "vercel-insights.com", "vercel.live"]) ||
    hasStackMatch(paths, ["/_vercel/"]) ||
    answers.hostingProvider === "vercel" ||
    answers.stackCdnProvider === "vercelEdge"
  ) {
    if (!hostingItems.some((item) => item.label === "Vercel")) {
      hostingItems.unshift({ label: "Vercel", brandColor: STACK_BRAND_COLORS.vercel });
    }
  } else if (answers.stackCdnProvider) {
    hostingItems.push({ label: PLUS_LABELS.stackCdnProvider[answers.stackCdnProvider] });
  }

  if (hasStackMatch(hosts, ["openai", "oaistatic.com"]) || answers.stackAiProvider === "openai") {
    aiItems.push({ label: "OpenAI GPT-4", brandColor: STACK_BRAND_COLORS.openai });
  } else if (answers.stackAiProvider) {
    aiItems.push({ label: PLUS_LABELS.stackAiProvider[answers.stackAiProvider] });
  }

  if (
    hasStackMatch(hosts, [
      "google-analytics",
      "googletagmanager",
      "analytics.google.com",
      "googleads.g.doubleclick.net"
    ]) ||
    answers.stackAnalytics === "ga4"
  ) {
    analyticsItems.push({ label: "Google Analytics 4", brandColor: STACK_BRAND_COLORS.ga4 });
  } else if (answers.stackAnalytics) {
    analyticsItems.push({ label: PLUS_LABELS.stackAnalytics[answers.stackAnalytics] });
  }

  if (hasStackMatch(hosts, ["stripe", "js.stripe.com"]) || answers.stackPayment === "stripe") {
    paymentItems.push({ label: "Stripe v3", brandColor: STACK_BRAND_COLORS.stripe });
  } else if (answers.stackPayment) {
    paymentItems.push({ label: PLUS_LABELS.stackPayment[answers.stackPayment] });
  }

  const missingGroups = [
    frameworkItems.length === 0 ? "framework" : null,
    hostingItems.length === 0 ? "hostingCdn" : null,
    aiItems.length === 0 && (answers.aiUsage && answers.aiUsage !== "no")
      ? "aiProvider"
      : null,
    analyticsItems.length === 0 ? "analytics" : null,
    paymentItems.length === 0 ? "payment" : null
  ].filter((value): value is "framework" | "hostingCdn" | "aiProvider" | "analytics" | "payment" => value !== null);

  const chips: DesignStackChip[] = [
    ...frameworkItems.slice(0, 2).map((item) => ({
      label: item.label,
      tone: "tech" as const,
      brandColor: item.brandColor
    })),
    ...hostingItems.slice(0, 2).map((item) => ({
      label: item.label,
      tone: "provider" as const,
      brandColor: item.brandColor
    })),
    ...aiItems.slice(0, 1).map((item) => ({
      label: item.label,
      tone: "ai" as const,
      brandColor: item.brandColor
    }))
  ];

  return {
    chips,
    groups: [
      { label: "Framework", items: frameworkItems },
      { label: "Hosting / CDN", items: hostingItems },
      { label: "AI Providers", items: aiItems },
      { label: "Analytics", items: analyticsItems },
      { label: "Payment", items: paymentItems }
    ].filter((group) => group.items.length > 0),
    missingGroups
  };
}

function buildStackChips(
  snapshot: RawScanSnapshot,
  score: ScoreBreakdown,
  scope: ScanScope,
  pageCount: number,
  detected: ReturnType<typeof detectStack>
) {
  const chips = [...detected.chips];

  if (snapshot.metrics.thirdPartyDomainCount >= 4) {
    chips.push({
      label: `${snapshot.metrics.thirdPartyDomainCount} third-party domains`,
      tone: "warning"
    });
  }

  chips.push({
    label: scope === "multi" ? `Sampled ${pageCount} pages` : "Single page scan",
    tone: "neutral"
  });

  if (score.label === "high risk") {
    chips.push({
      label: "Cost driver surfaced",
      tone: "warning"
    });
  }

  return chips.slice(0, 6);
}

function buildQuestionState(report: PlusOptimizationReport | null, requiredCount: number): DesignQuestionState {
  if (!report) {
    return {
      answeredCount: 0,
      requiredCount,
      missingCoreCount: requiredCount,
      summary: null,
      detail: null,
      nextStep: null,
      priorityLabel: null
    };
  }

  return {
    answeredCount: report.answeredCount,
    requiredCount,
    missingCoreCount: report.missingCoreQuestions.length,
    summary: report.summary,
    detail: report.detail,
    nextStep: report.nextStep,
    priorityLabel: report.priorityLabel
  };
}

function buildScaleSimulationRows(monthlyWaste: number): DesignScaleSimulationRow[] {
  const cases = [
    { users: 1_000, label: "1k users", scenario: "now", factor: 1 },
    { users: 5_000, label: "5k users", scenario: "5× growth", factor: 5 },
    { users: 10_000, label: "10k users", scenario: "10× growth", factor: 10 },
    { users: 50_000, label: "50k users", scenario: "50× growth", factor: 50 },
    { users: 100_000, label: "100k users", scenario: "Viral / scale", factor: 100 }
  ];

  return cases.map((entry) => ({
    trafficLabel: entry.label,
    scenario: entry.scenario,
    amount: `${formatMonthly(monthlyWaste * entry.factor)}${entry.factor < 10 ? "/mo" : "/mo"}`
  }));
}

const FIX_LIBRARY: Partial<
  Record<IssueCategory, Omit<DesignFixRecommendationCard, "title" | "severityLabel" | "color">>
> = {
  duplicateRequests: {
    saveLabel: "Save ~$8/mo",
    priorityLabel: "Fix First",
    rootCause:
      "No request deduplication layer means multiple components trigger the same fetch independently on mount.",
    fix:
      "Add a shared SWR or React Query cache key so concurrent callers share a single in-flight request. Alternatively, hoist the fetch into a context provider.",
    scaleImpact: "At 10× traffic → ~$80/month wasted on redundant compute alone."
  },
  requestCount: {
    saveLabel: "Save ~$5/mo",
    rootCause:
      "The route is doing more work than its current UI state appears to require, which usually points to duplicate fetches, over-eager polling, or missing memoization.",
    fix:
      "Reduce duplicate fetch triggers, trim polling intervals, and move expensive loaders higher in the tree so they do not rerun on every interaction.",
    scaleImpact: "At 10× traffic this request pattern compounds quickly into visible compute waste."
  },
  largeImages: {
    saveLabel: "Save ~$4/mo",
    rootCause:
      "Large media is landing without enough compression, lazy loading, or responsive delivery for the rendered footprint.",
    fix:
      "Convert oversized assets to modern formats, lazy-load below-the-fold images, and use responsive image delivery instead of raw full-size payloads.",
    scaleImpact: "At 10× traffic → bandwidth waste multiplies fast on image-heavy routes."
  },
  pageWeight: {
    saveLabel: "Save ~$6/mo",
    rootCause:
      "The page is shipping more bytes than necessary across scripts, styles, and media for its current state.",
    fix:
      "Split heavy bundles, compress large assets, and cache stable resources more aggressively so repeat visits avoid full re-downloads.",
    scaleImpact: "At 10× traffic → avoidable transfer costs become much harder to ignore."
  },
  thirdPartySprawl: {
    saveLabel: "Save ~$3/mo",
    rootCause:
      "The route depends on too many external vendors for analytics, embeds, or helper scripts, which adds cost and latency overhead.",
    fix:
      "Remove low-value third-party tags, delay non-critical vendors, and collapse overlapping tools where possible.",
    scaleImpact: "At 10× traffic → external vendor overhead becomes a larger share of the route cost profile."
  }
};

function buildFixRecommendationCards(issues: DetectedIssue[]): DesignFixRecommendationCard[] {
  return issues
    .map((issue, index) => {
      const severityLabel: DesignFixRecommendationCard["severityLabel"] =
        issue.severity === "high" ? "critical" : issue.severity === "medium" ? "moderate" : "low";
      const color =
        severityLabel === "critical"
          ? "#ef4444"
          : severityLabel === "moderate"
            ? "#f97316"
            : "#eab308";
      const library = FIX_LIBRARY[issue.category] ?? {};

      return {
        title: issue.title,
        severityLabel,
        color,
        priorityLabel: index === 0 ? library.priorityLabel ?? "Fix First" : library.priorityLabel,
        saveLabel: library.saveLabel,
        rootCause: library.rootCause,
        fix: library.fix,
        scaleImpact: library.scaleImpact
      };
    })
    .slice(0, 5);
}

export function buildMetisDesignViewModel({
  snapshot,
  issues,
  score,
  insight,
  scope,
  pageCount,
  answers,
  plusReport,
  requiredQuestionCount
}: {
  snapshot: RawScanSnapshot;
  issues: DetectedIssue[];
  score: ScoreBreakdown;
  insight: { summary: string; supportingDetail: string } | null;
  scope: ScanScope;
  pageCount: number;
  answers: PlusRefinementAnswers;
  plusReport: PlusOptimizationReport | null;
  requiredQuestionCount: number;
}): MetisDesignViewModel {
  const riskTone = scoreToRiskTone(score);
  const monthlyWaste = deriveMonthlyWaste(snapshot, answers);
  const visitCount = visitEstimate(answers);
  const sessionCostValue = monthlyWaste / Math.max(250, visitCount / 4);
  const monthlyProjection = sessionCostValue * 10_000;
  const issuesForDisplay = issues.map(issueToDesignIssue);
  const detectedStack = detectStack(snapshot, answers);
  const metaTokens =
    scope === "multi"
      ? ["Live", `Sampled ${pageCount} pages`, snapshot.page.hostname]
      : ["Live", "Sampled 1 page", snapshot.page.hostname];

  return {
    routeKey: snapshot.page.href,
    snapshotKey: `${snapshot.page.href}::${snapshot.scannedAt}`,
    hostname: snapshot.page.hostname,
    pathname: snapshot.page.pathname,
    scannedAt: new Date(snapshot.scannedAt).toLocaleString(),
    scopeLabel: scope === "multi" ? "Multipage" : "Single Page",
    pagesSampledLabel: metaTokens.join(" · "),
    metaTokens,
    score: Math.round(score.score),
    riskLabel: riskTone.label,
    riskColor: riskTone.color,
    riskBg: riskTone.bg,
    estimateRange: `~$${Math.round(monthlyWaste * 0.6)}–$${Math.round(monthlyWaste * 1.1)}/month estimated waste`,
    quickInsight:
      plusReport?.summary ?? insight?.summary ?? "Metis is still building a clean read of this page.",
    supportingDetail:
      plusReport?.detail ??
      insight?.supportingDetail ??
      "Interact with the page once to help Metis refine the session profile.",
    sessionCost: formatCurrency(sessionCostValue),
    monthlyProjection: `~${formatMonthly(monthlyProjection)}/month`,
    summaryPills: buildSummaryPills(issuesForDisplay),
    issues: issuesForDisplay,
    topIssues: issuesForDisplay.slice(0, 5),
    stackChips: buildStackChips(snapshot, score, scope, pageCount, detectedStack),
    stackGroups: detectedStack.groups,
    costRows: buildCostRows(score, snapshot, answers),
    questionState: buildQuestionState(plusReport, requiredQuestionCount),
    scaleSimulationRows: buildScaleSimulationRows(monthlyWaste),
    aiCostPerRequestEstimate:
      answers.aiUsage && answers.aiUsage !== "no" ? "~$0.0001" : null,
    fixRecommendationCards: buildFixRecommendationCards(issues),
    stackQuestionDefinitions: buildStackFallbackQuestionDefinitions(detectedStack.missingGroups),
    stackDetectionState: {
      missingGroups: detectedStack.missingGroups
    }
  };
}
