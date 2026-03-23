import { useState } from "react";
import type { MetisSnapshot } from "../shared/types/audit";

export type PanelMode = "idle" | "mini" | "full";

export function useMetisState() {
  const [panelMode, setPanelMode] = useState<PanelMode>("idle");
  const [snapshot, setSnapshot] = useState<MetisSnapshot | null>(null);

  return {
    panelMode,
    setPanelMode,
    isPanelOpen: panelMode !== "idle",
    snapshot,
    setSnapshot
  };
}
