import type { PlusRefinementAnswers } from "../../shared/types/audit";

export type NormalizedRouteContext = {
  pageClass: "marketing" | "docs" | "dashboard" | "ai" | "unknown";
  routeRole: "main" | "specific" | "unknown";
  isDynamic: boolean;
};

// Refinement answers come from product-facing questions. Normalize them once so
// score, control, and insight all react to the same fairness context.
export function normalizeRouteContext(
  answers: PlusRefinementAnswers = {}
): NormalizedRouteContext {
  let pageClass: NormalizedRouteContext["pageClass"] = "unknown";

  if (["marketing", "portfolio"].includes(answers.appType ?? "")) {
    pageClass = "marketing";
  } else if (["docsContent", "mediaHeavy"].includes(answers.appType ?? "")) {
    pageClass = "docs";
  } else if (answers.appType === "aiApp") {
    pageClass = "ai";
  } else if (
    ["saasDashboard", "ecommerce", "marketplace", "internalTool"].includes(
      answers.appType ?? ""
    )
  ) {
    pageClass = "dashboard";
  }

  const routeRole: NormalizedRouteContext["routeRole"] =
    answers.representativeExperience === "mainPublicPage"
      ? "main"
      : answers.representativeExperience === "specificRoute"
        ? "specific"
        : "unknown";

  return {
    pageClass,
    routeRole,
    isDynamic: answers.pageDynamics === "highlyDynamic"
  };
}
