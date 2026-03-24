// useMetisState.ts keeps the injected panel state local to the content script.
// It holds panel mode, scope selection, and the latest scan snapshots used by
// the current scoring, Phase 4 insight flow, and the optional Plus refinement layer.
import { useState } from "react";
import type { PlusRefinementAnswers, RawScanSnapshot } from "../shared/types/audit";

export type PanelMode = "idle" | "mini" | "full";
export type ScanScope = "single" | "multi";

export function useMetisState() {
  const [panelMode, setPanelMode] = useState<PanelMode>("idle");
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [rawSnapshot, setRawSnapshot] = useState<RawScanSnapshot | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState<RawScanSnapshot | null>(null);
  const [visitedSnapshots, setVisitedSnapshots] = useState<RawScanSnapshot[]>([]);
  const [plusAnswers, setPlusAnswers] = useState<PlusRefinementAnswers>({});
  const [isPlusRefinementOpen, setIsPlusRefinementOpen] = useState(false);

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
    setVisitedSnapshots,
    plusAnswers,
    setPlusAnswers,
    isPlusRefinementOpen,
    setIsPlusRefinementOpen
  };
}
