import type { IssueCategory, PlusRefinementAnswers } from "../../shared/types/audit";
import { normalizeRouteContext } from "../refinement/normalizedContext";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type ContextScoreProfile = {
  request: number;
  payload: number;
  duplicate: number;
  aiOrApi: number;
};

type ScoreContextSignals = {
  frameworkIds?: string[];
  duplicateEndpointCount?: number;
};

function hasModernFramework(frameworkIds: string[] = []) {
  return frameworkIds.some((id) => ["react", "nextjs", "vue", "svelte"].includes(id));
}

function getBaseProfile(answers: PlusRefinementAnswers): ContextScoreProfile {
  const context = normalizeRouteContext(answers);

  switch (context.pageClass) {
    case "docs":
      return {
        request: 0.9,
        payload: 0.88,
        duplicate: 0.96,
        aiOrApi: 1
      };
    case "dashboard":
      return {
        request: 0.65,
        payload: 0.72,
        duplicate: 0.85,
        aiOrApi: 1
      };
    case "ai":
      return {
        request: 0.6,
        payload: 0.78,
        duplicate: 0.88,
        aiOrApi: 0.72
      };
    case "marketing":
    case "unknown":
    default:
      return {
        request: context.routeRole === "main" ? 1.1 : 1,
        payload: context.routeRole === "main" ? 1.12 : 1,
        duplicate: context.routeRole === "main" ? 1.06 : 1,
        aiOrApi: context.routeRole === "main" ? 1.04 : 1
      };
  }
}

function applyRouteRoleMultiplier(multiplier: number, answers: PlusRefinementAnswers, kind: "request" | "payload" | "duplicate" | "aiOrApi") {
  const context = normalizeRouteContext(answers);

  if (context.routeRole !== "specific") {
    return multiplier;
  }

  if (kind === "request") {
    return multiplier * 0.82;
  }

  if (kind === "payload") {
    return multiplier * 0.86;
  }

  if (kind === "duplicate") {
    return multiplier * 0.94;
  }

  return multiplier * 0.9;
}

export function getContextScoreMultiplier(
  category: IssueCategory,
  answers: PlusRefinementAnswers,
  signals: ScoreContextSignals = {}
) {
  const baseProfile = getBaseProfile(answers);
  let multiplier = 1;

  if (category === "requestCount") {
    multiplier = applyRouteRoleMultiplier(baseProfile.request, answers, "request");
  } else if (category === "pageWeight" || category === "largeImages") {
    multiplier = applyRouteRoleMultiplier(baseProfile.payload, answers, "payload");
  } else if (category === "duplicateRequests") {
    multiplier = applyRouteRoleMultiplier(baseProfile.duplicate, answers, "duplicate");
  } else if (category === "aiSpendSurface") {
    multiplier = applyRouteRoleMultiplier(baseProfile.aiOrApi, answers, "aiOrApi");
  } else if (category === "thirdPartySprawl") {
    multiplier = 0.98;
  } else {
    multiplier = 1;
  }

  if (category === "duplicateRequests" && hasModernFramework(signals.frameworkIds)) {
    multiplier *= 0.8;

    if ((signals.duplicateEndpointCount ?? 0) >= 50) {
      multiplier *= 0.75;
    }
  }

  if ((category === "largeImages" || category === "pageWeight") && hasModernFramework(signals.frameworkIds)) {
    multiplier *= 0.94;
  }

  if (category === "duplicateRequests") {
    return clamp(multiplier, 0.6, 1.08);
  }

  if (category === "thirdPartySprawl") {
    return clamp(multiplier, 0.95, 1.02);
  }

  return clamp(multiplier, 0.55, 1.15);
}
