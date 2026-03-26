import type { PlusRefinementAnswers, RawScanSnapshot } from "./audit";

export type MetisBridgeStatus = "ready" | "reconnecting" | "missing";
export type MetisSessionUiState = {
  scanScope: "single" | "multi";
  plusAnswers: PlusRefinementAnswers;
  isPlusRefinementOpen: boolean;
};

export interface MetisTabSessionState {
  tabId: number;
  windowId: number;
  currentUrl: string;
  isActive: boolean;
  isSidePanelOpen: boolean;
  bridgeStatus: MetisBridgeStatus;
  lastUpdatedAt: number | null;
  rawSnapshot: RawScanSnapshot | null;
  baselineSnapshot: RawScanSnapshot | null;
  visitedSnapshots: RawScanSnapshot[];
  uiState: MetisSessionUiState;
}

export interface MetisScanUpdatePayload {
  currentUrl: string;
  rawSnapshot: RawScanSnapshot;
  baselineSnapshot: RawScanSnapshot;
  visitedSnapshots: RawScanSnapshot[];
}

export type MetisRuntimeMessage =
  | { type: "METIS_PING" }
  | { type: "METIS_BRIDGE_READY"; href: string }
  | { type: "METIS_OPEN_SIDE_PANEL" }
  | { type: "METIS_OPEN_PAGE_REPORT"; tabId: number }
  | { type: "METIS_START_TAB_SESSION" }
  | { type: "METIS_ACTIVATE_FROM_TOOLBAR" }
  | { type: "METIS_RECONNECT_ACTIVE_TAB" }
  | { type: "METIS_SCAN_UPDATE"; payload: MetisScanUpdatePayload }
  | { type: "METIS_GET_ACTIVE_TAB_SESSION" }
  | { type: "METIS_SET_PANEL_VISIBILITY"; tabId: number; isOpen: boolean }
  | { type: "METIS_PATCH_TAB_SESSION"; patch: Partial<MetisSessionUiState> }
  | { type: "METIS_SESSION_CHANGED"; tabId: number; session: MetisTabSessionState | null }
  | { type: "METIS_RECONNECT_REQUIRED"; tabId: number };

export const DEFAULT_METIS_SESSION_UI_STATE: MetisSessionUiState = {
  scanScope: "single",
  plusAnswers: {},
  isPlusRefinementOpen: false
};
