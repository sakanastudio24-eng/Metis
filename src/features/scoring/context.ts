import type {
  IssueCategory,
  PlusRefinementAnswers
} from "../../shared/types/audit";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isProductContext(answers: PlusRefinementAnswers) {
  return ["saasDashboard", "ecommerce", "marketplace", "internalTool"].includes(
    answers.appType ?? ""
  );
}

export function getContextScoreMultiplier(
  category: IssueCategory,
  answers: PlusRefinementAnswers
) {
  let multiplier = 1;

  switch (answers.appType) {
    case "docsContent":
    case "mediaHeavy":
      if (category === "requestCount") {
        multiplier *= 0.94;
      }
      if (category === "pageWeight" || category === "largeImages") {
        multiplier *= 0.92;
      }
      break;
    case "saasDashboard":
    case "ecommerce":
    case "marketplace":
    case "internalTool":
      if (category === "requestCount") {
        multiplier *= 0.8;
      }
      if (category === "pageWeight") {
        multiplier *= 0.82;
      }
      if (category === "duplicateRequests") {
        multiplier *= 0.94;
      }
      break;
    case "aiApp":
      if (category === "requestCount") {
        multiplier *= 0.78;
      }
      if (category === "pageWeight") {
        multiplier *= 0.84;
      }
      if (category === "aiSpendSurface") {
        multiplier *= 0.82;
      }
      if (category === "duplicateRequests") {
        multiplier *= 0.95;
      }
      break;
    default:
      break;
  }

  if (answers.representativeExperience === "specificRoute") {
    if (category === "requestCount") {
      multiplier *= 0.9;
    }
    if (category === "pageWeight" || category === "largeImages") {
      multiplier *= 0.92;
    }
    if (category === "duplicateRequests") {
      multiplier *= 0.97;
    }
  }

  if (answers.pageDynamics === "highlyDynamic") {
    if (category === "requestCount") {
      multiplier *= 0.9;
    }
    if (category === "aiSpendSurface" && answers.appType === "aiApp") {
      multiplier *= 0.92;
    }
  }

  if (answers.representativeExperience === "mainPublicPage" && isProductContext(answers)) {
    multiplier *= 1.02;
  }

  // Duplicate and third-party sprawl still matter across every page type.
  if (category === "duplicateRequests") {
    return clamp(multiplier, 0.9, 1.05);
  }

  if (category === "thirdPartySprawl") {
    return clamp(multiplier, 0.95, 1.05);
  }

  return clamp(multiplier, 0.72, 1.08);
}
