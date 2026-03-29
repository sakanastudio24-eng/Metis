// refinement/index.ts builds the optional Plus report layer.
// It uses a short answer set to sharpen urgency, stack-specific framing, and
// next-step guidance without changing the underlying scan, issue, or score logic.
import type {
  CostInsight,
  DetectedIssue,
  IssueCategory,
  PlusOptimizationReport,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ScoreBreakdown
} from "../../shared/types/audit";
import { PLUS_CORE_KEYS, PLUS_LABELS } from "./config";

function countAnswered(answers: PlusRefinementAnswers) {
  return Object.values(answers).filter((value) => value !== undefined).length;
}

function getMissingCoreQuestions(
  answers: PlusRefinementAnswers
): Array<keyof PlusRefinementAnswers> {
  return PLUS_CORE_KEYS.filter((key) => answers[key] === undefined);
}

function buildPriorityLabel(
  answers: PlusRefinementAnswers,
  score: ScoreBreakdown
) {
  let priorityScore = 0;

  if (score.label === "high risk") {
    priorityScore += 3;
  } else if (score.label === "watch") {
    priorityScore += 2;
  } else if (score.label === "healthy") {
    priorityScore += 1;
  }

  switch (answers.monthlyVisits) {
    case "1kTo10k":
      priorityScore += 1;
      break;
    case "10kTo100k":
      priorityScore += 2;
      break;
    case "100kPlus":
      priorityScore += 3;
      break;
    default:
      break;
  }

  if (answers.highTrafficRoute === "yes") {
    priorityScore += 2;
  } else if (answers.highTrafficRoute === "somewhat") {
    priorityScore += 1;
  }

  if (answers.hostingPlan === "free") {
    priorityScore += 2;
  } else if (answers.hostingPlan === "pro") {
    priorityScore += 1;
  }

  if (answers.paidApiUsage === "yes") {
    priorityScore += 1;
  }

  if (answers.aiUsage === "yesOften") {
    priorityScore += 2;
  } else if (answers.aiUsage === "sometimes") {
    priorityScore += 1;
  }

  if (priorityScore >= 7) {
    return "High priority";
  }

  if (priorityScore >= 4) {
    return "Worth planning";
  }

  return "Monitor";
}

function buildContextPrefix(answers: PlusRefinementAnswers) {
  const parts: string[] = [];

  if (answers.hostingProvider) {
    parts.push(`On ${PLUS_LABELS.hostingProvider[answers.hostingProvider]}`);
  }

  if (answers.monthlyVisits) {
    parts.push(PLUS_LABELS.monthlyVisits[answers.monthlyVisits]);
  }

  if (answers.appType) {
    parts.push(`for this ${PLUS_LABELS.appType[answers.appType]}`);
  }

  if (answers.siteSize) {
    parts.push(`across ${PLUS_LABELS.siteSize[answers.siteSize]}`);
  }

  return parts.join(" ");
}

function buildCostSensitivityNote(
  answers: PlusRefinementAnswers,
  primaryCategory: IssueCategory | null
) {
  const notes: string[] = [];

  if (answers.paidApiUsage === "yes" && primaryCategory === "duplicateRequests") {
    notes.push("Repeated requests matter more here because they may be hitting paid endpoints.");
  }

  if (answers.paidApiUsage === "yes" && primaryCategory === "aiSpendSurface") {
    notes.push("Confirmed paid API usage makes repeated AI activity more expensive than normal request overhead.");
  }

  if (answers.aiUsage === "yesOften") {
    notes.push("Frequent AI calls raise the ceiling on per-session cost faster than standard requests.");
  } else if (answers.aiUsage === "sometimes") {
    notes.push("Occasional AI calls make spikes more expensive when this route gets busy.");
  }

  if (answers.mediaImportance === "core" && primaryCategory === "largeImages") {
    notes.push("Because media is core to the product, the right target is delivery efficiency, not removing media value.");
  }

  if (
    answers.pageDynamics === "highlyDynamic" &&
    (primaryCategory === "requestCount" || primaryCategory === "duplicateRequests")
  ) {
    notes.push("Some request volume is expected on a highly dynamic route, so focus on redundant work before cutting legitimate activity.");
  }

  if (
    (answers.appType === "marketing" || answers.appType === "portfolio") &&
    (primaryCategory === "requestCount" || primaryCategory === "duplicateRequests")
  ) {
    notes.push("For a simpler site type, this amount of network activity is a stronger cleanup signal than it would be on a dashboard.");
  }

  if (answers.highTrafficRoute === "yes" && primaryCategory === "analyticsAdsRumSurface") {
    notes.push("Because this is a high-traffic route, every extra analytics or ad-tech tag compounds faster than it would on a low-traffic page.");
  }

  return notes.join(" ");
}

function buildProviderNextStep(
  answers: PlusRefinementAnswers,
  primaryCategory: IssueCategory | null,
  baseNextStep: string
) {
  switch (answers.hostingProvider) {
    case "vercel":
      return `${baseNextStep} On Vercel, push harder on caching, edge-friendly assets, and avoiding repeated function work on hot routes.`;
    case "netlify":
      return `${baseNextStep} On Netlify, lean on CDN caching and avoid repeated function or asset work on the landing route.`;
    case "cloudflare":
      return `${baseNextStep} On Cloudflare, use cache rules and media delivery features before accepting this as normal overhead.`;
    case "aws":
      return `${baseNextStep} On AWS, check whether CloudFront, S3 delivery, and function boundaries are carrying avoidable transfer or invocation cost.`;
    case "render":
      return `${baseNextStep} On Render, focus on cutting repeat work and keeping the hottest route light enough to avoid waste under steady traffic.`;
    case "railway":
      return `${baseNextStep} On Railway, keep duplicate work and heavier payloads in check because scaling can become visible quickly.`;
    case "other":
      return `${baseNextStep} Tune this against the way your host bills for transfer, compute, and vendor usage.`;
    default:
      if (primaryCategory === "largeImages" && answers.optimizationCoverage === "no") {
        return `${baseNextStep} You also said optimization tooling is not in place yet, so CDN and image optimization should land early.`;
      }

      return baseNextStep;
  }
}

export function buildPlusOptimizationReport(
  baseInsight: CostInsight,
  snapshot: RawScanSnapshot,
  issues: DetectedIssue[],
  score: ScoreBreakdown,
  answers: PlusRefinementAnswers
): PlusOptimizationReport | null {
  const answeredCount = countAnswered(answers);

  if (answeredCount === 0) {
    return null;
  }

  const missingCoreQuestions = getMissingCoreQuestions(answers);
  const prefix = buildContextPrefix(answers);
  const sensitivityNote = buildCostSensitivityNote(answers, baseInsight.primaryCategory);
  const routePriority =
    answers.highTrafficRoute === "yes"
      ? "Because this is one of your highest-traffic routes, the issue deserves earlier cleanup."
      : answers.highTrafficRoute === "somewhat"
        ? "Because this route has meaningful traffic, the issue is worth planning into near-term work."
        : "";
  const planNote =
    answers.hostingPlan === "free"
      ? "A free plan leaves less room before overage pressure or upgrade pressure becomes visible."
      : answers.hostingPlan === "enterprise"
        ? "An enterprise plan gives more headroom, but waste still compounds at scale."
        : "";

  const detail = [
    prefix ? `${prefix} ${baseInsight.summary}` : baseInsight.summary,
    routePriority,
    planNote,
    sensitivityNote
  ].filter(Boolean);

  return {
    detailSummary: detail[0] ?? baseInsight.summary,
    contextNotes: detail.slice(1),
    nextStep: buildProviderNextStep(answers, baseInsight.primaryCategory, baseInsight.nextStep),
    priorityLabel:
      missingCoreQuestions.length === 0 ? buildPriorityLabel(answers, score) : "Plus suggestion",
    answeredCount,
    missingCoreQuestions
  };
}
