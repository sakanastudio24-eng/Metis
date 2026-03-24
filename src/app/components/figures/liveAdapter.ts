/**
 * liveAdapter.ts
 * Maps the current Phase 4 scan, score, and refinement output into the
 * prototype-shaped view model used by the zip-authoritative UI shell.
 */
import type {
  DetectedIssue,
  IssueCategory,
  PlusOptimizationReport,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ScoreBreakdown
} from "../../../shared/types/audit";
import { PLUS_LABELS } from "../../../features/refinement/config";
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
}

export interface DesignStackGroup {
  label: string;
  items: string[];
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

export interface MetisDesignViewModel {
  hostname: string;
  pathname: string;
  scannedAt: string;
  scopeLabel: string;
  pagesSampledLabel: string;
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
}

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
    return `$${(value / 1_000).toFixed(0)}k`;
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

function deriveMonthlyWaste(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers
) {
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

function buildCostRows(
  score: ScoreBreakdown,
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers
) {
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

    if (
      deduction.category === "requestCount" ||
      deduction.category === "duplicateRequests"
    ) {
      contribution.requests += deduction.points;
      return;
    }

    contribution.ai += deduction.points;
  });

  contribution.ai += aiWeight(answers) > 0 ? aiWeight(answers) / 2 : 0;

  const totalContribution =
    contribution.bandwidth + contribution.requests + contribution.ai || 1;

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

function buildStackChips(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers,
  score: ScoreBreakdown,
  scope: ScanScope,
  pageCount: number
) {
  const chips: DesignStackChip[] = [];

  if (answers.appType) {
    chips.push({
      label: PLUS_LABELS.appType[answers.appType],
      tone: "tech"
    });
  }

  if (answers.hostingProvider) {
    chips.push({
      label: PLUS_LABELS.hostingProvider[answers.hostingProvider],
      tone: "provider"
    });
  }

  if (answers.aiUsage && answers.aiUsage !== "no") {
    chips.push({
      label: "AI usage detected",
      tone: "ai"
    });
  }

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

function buildStackGroups(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers,
  scope: ScanScope,
  pageCount: number
) {
  const groups: DesignStackGroup[] = [
    {
      label: "Surface",
      items: [scope === "multi" ? `Multipage sample (${pageCount})` : "Single-page sample"]
    },
    {
      label: "Signals",
      items: [
        `${snapshot.metrics.requestCount} retained requests`,
        `${snapshot.metrics.thirdPartyDomainCount} third-party domains`
      ]
    },
    {
      label: "Payload",
      items: [
        formatBytes(snapshot.metrics.totalEncodedBodySize),
        `${snapshot.metrics.meaningfulImageCount} meaningful images`
      ]
    }
  ];

  if (answers.hostingProvider || answers.appType) {
    groups.unshift({
      label: "Known Context",
      items: [
        answers.hostingProvider
          ? PLUS_LABELS.hostingProvider[answers.hostingProvider]
          : "Unknown host",
        answers.appType ? PLUS_LABELS.appType[answers.appType] : "Unknown app type"
      ]
    });
  }

  return groups;
}

function buildQuestionState(
  report: PlusOptimizationReport | null,
  requiredCount: number
): DesignQuestionState {
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

  return {
    hostname: snapshot.page.hostname,
    pathname: snapshot.page.pathname,
    scannedAt: new Date(snapshot.scannedAt).toLocaleString(),
    scopeLabel: scope === "multi" ? "Multipage" : "Single Page",
    pagesSampledLabel:
      scope === "multi"
        ? `Live · Sampled ${pageCount} pages · ${snapshot.page.hostname}`
        : `Live · Sampled 1 page · ${snapshot.page.hostname}`,
    score: Math.round(score.score),
    riskLabel: riskTone.label,
    riskColor: riskTone.color,
    riskBg: riskTone.bg,
    estimateRange: `~$${Math.round(monthlyWaste * 0.6)}–$${Math.round(monthlyWaste * 1.1)}/month estimated waste`,
    quickInsight: plusReport?.summary ?? insight?.summary ?? "Metis is still building a clean read of this page.",
    supportingDetail:
      plusReport?.detail ??
      insight?.supportingDetail ??
      "Interact with the page once to help Metis refine the session profile.",
    sessionCost: formatCurrency(sessionCostValue),
    monthlyProjection: `~${formatMonthly(monthlyProjection)}/month`,
    summaryPills: buildSummaryPills(issuesForDisplay),
    issues: issuesForDisplay,
    topIssues: issuesForDisplay.slice(0, 5),
    stackChips: buildStackChips(snapshot, answers, score, scope, pageCount),
    stackGroups: buildStackGroups(snapshot, answers, scope, pageCount),
    costRows: buildCostRows(score, snapshot, answers),
    questionState: buildQuestionState(plusReport, requiredQuestionCount)
  };
}
