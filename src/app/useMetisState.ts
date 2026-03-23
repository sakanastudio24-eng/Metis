// Store the panel mode and the current scan snapshots locally inside the content script UI.
import { useState } from "react";
import type { RawScanSnapshot } from "../shared/types/audit";

export type PanelMode = "idle" | "mini" | "full";
export type ScanScope = "single" | "multi";

export function useMetisState() {
  const [panelMode, setPanelMode] = useState<PanelMode>("idle");
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [rawSnapshot, setRawSnapshot] = useState<RawScanSnapshot | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState<RawScanSnapshot | null>(null);
  const [visitedSnapshots, setVisitedSnapshots] = useState<RawScanSnapshot[]>([]);

  return {
    panelMode,
    setPanelMode,
    scanScope,
    setScanScope,
    isPanelOpen: panelMode !== "idle",
    rawSnapshot,
    setRawSnapshot,
    baselineSnapshot,
    setBaselineSnapshot,
    visitedSnapshots,
    setVisitedSnapshots
  };
}
