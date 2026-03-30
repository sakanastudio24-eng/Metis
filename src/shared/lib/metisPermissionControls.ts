import type { MetisLocalSettings } from "../types/audit";

export type PermissionControlId = "webPages" | "storage" | "scripting" | "sidePanel";

export interface PermissionControl {
  id: PermissionControlId;
  title: string;
  ability: string;
  description: string;
  active: boolean;
}

export function buildPermissionControls(settings: MetisLocalSettings): PermissionControl[] {
  return [
    {
      id: "webPages",
      title: "Web pages",
      ability: "Scans current and same-site routes",
      description:
        "When this is off, Metis stops collecting new route scans on normal http and https pages until you turn it back on.",
      active: settings.webPageScanningEnabled
    },
    {
      id: "storage",
      title: "Storage",
      ability: "Keeps local history on this device",
      description:
        "When this is off, Metis stops saving snapshots and same-site progress locally. Your core settings still remain available so the extension can keep working.",
      active: settings.localHistoryEnabled
    },
    {
      id: "scripting",
      title: "Scripting",
      ability: "Repairs the page bridge",
      description:
        "When this is off, Metis stops reinjecting or repairing the page bridge on older tabs that need a fresh script pass.",
      active: settings.bridgeRepairEnabled
    },
    {
      id: "sidePanel",
      title: "Side panel",
      ability: "Keeps the attached workspace available",
      description:
        "When this is off, Metis stops relying on the attached workspace as an automatic compact-review preference. A direct user-open can still bring Metis forward.",
      active: settings.sidePanelWorkspaceEnabled
    }
  ];
}

export function getPermissionAbilityPercent(active: boolean) {
  return active ? 100 : 18;
}
