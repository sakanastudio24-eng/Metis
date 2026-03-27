import type { PlusRefinementAnswers } from "../types/audit";
import type { MetisLocalSettings } from "../types/audit";

export function buildSettingsAssumptionAnswers(
  settings: MetisLocalSettings
): Partial<PlusRefinementAnswers> {
  return {
    hostingProvider:
      settings.defaultHostingAssumption === "auto"
        ? undefined
        : settings.defaultHostingAssumption,
    monthlyVisits:
      settings.trafficBaselineOverride === "auto"
        ? undefined
        : settings.trafficBaselineOverride
  };
}
