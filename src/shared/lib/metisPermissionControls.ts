import type { MetisLocalSettings } from "../types/audit";

export type PermissionControlId =
  | "basicScan"
  | "expandedSiteAccess"
  | "localHistory"
  | "bridgeRepair"
  | "sidePanelWorkspace";

export interface PermissionControl {
  id: PermissionControlId;
  title: string;
  ability: string;
  description: string;
  active: boolean;
}

export function buildPermissionControls(
  settings: MetisLocalSettings,
  options?: { expandedSiteAccessActive?: boolean }
): PermissionControl[] {
  return [
    {
      id: "basicScan",
      title: "Basic scan",
      ability: "Scans the current page",
      description:
        "When this is off, Metis stops running quick scans on the page you open it on.",
      active: settings.basicScanEnabled
    },
    {
      id: "expandedSiteAccess",
      title: "Expanded site access",
      ability: "Analyzes more of this site",
      description:
        "When enabled for this site, Metis can scan same-origin routes, improve accuracy, and keep the page workspace available here.",
      active: options?.expandedSiteAccessActive ?? false
    },
    {
      id: "localHistory",
      title: "Local history",
      ability: "Keeps local history on this device",
      description:
        "When this is off, Metis stops saving snapshots and same-site progress locally. Your core settings still remain available so the extension can keep working.",
      active: settings.localHistoryEnabled
    },
    {
      id: "bridgeRepair",
      title: "Bridge repair",
      ability: "Refreshes Metis on the current page",
      description:
        "When this is off, Metis stops reinjecting or repairing the page bridge on older tabs that need a fresh script pass.",
      active: settings.bridgeRepairEnabled
    },
    {
      id: "sidePanelWorkspace",
      title: "Attached workspace",
      ability: "Keeps the attached workspace available",
      description:
        "When this is off, Metis stops relying on the attached workspace as an automatic compact-review preference. A direct user-open can still bring Metis forward.",
      active: settings.attachedWorkspaceEnabled
    }
  ];
}
