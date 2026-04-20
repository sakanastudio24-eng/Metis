import type {
  MetisAccessState,
  MetisConnectedAccount,
  MetisSiteAccessState,
  MetisUploadQueueItem,
  PageScopedFairnessAnswers,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "./audit";

export type MetisBridgeStatus = "ready" | "reconnecting" | "missing";
export type MetisSessionUiState = {
  scanScope: "single" | "multi";
  plusAnswers: PlusRefinementAnswers;
  pageFairnessByKey: Record<string, Partial<PageScopedFairnessAnswers>>;
  isPlusRefinementOpen: boolean;
  isPlusUser: boolean;
};

export interface MetisTabSessionState {
  tabId: number;
  windowId: number;
  currentUrl: string;
  isActive: boolean;
  isSidePanelOpen: boolean;
  bridgeStatus: MetisBridgeStatus;
  accessState: MetisAccessState;
  siteAccess: MetisSiteAccessState;
  connectedAccount: MetisConnectedAccount | null;
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
  | { type: "METIS_OPEN_PANEL_FROM_POPUP" }
  | { type: "METIS_OPEN_TOOLBAR_SETTINGS" }
  | { type: "METIS_OPEN_SIGN_IN"; source: "popup" | "panel" | "report" | "content" }
  | { type: "METIS_DISCONNECT_ACCOUNT" }
  | { type: "METIS_REQUEST_SITE_ACCESS"; tabId?: number | null }
  | { type: "METIS_REMOVE_SITE_ACCESS"; tabId?: number | null }
  | { type: "METIS_GET_SITE_ACCESS_STATE"; tabId?: number | null }
  | { type: "METIS_OPEN_PAGE_REPORT"; tabId: number; openPlusPreview?: boolean }
  | { type: "METIS_START_TAB_SESSION" }
  | { type: "METIS_ACTIVATE_FROM_TOOLBAR" }
  | { type: "METIS_RECONNECT_ACTIVE_TAB" }
  | { type: "METIS_SCAN_UPDATE"; payload: MetisScanUpdatePayload }
  | { type: "METIS_AUTH_STATE_CHANGED" }
  | { type: "METIS_GET_BRIDGE_DEBUG" }
  | { type: "METIS_GET_ACTIVE_TAB_SESSION" }
  | { type: "METIS_SET_PANEL_VISIBILITY"; tabId: number; isOpen: boolean }
  | { type: "METIS_PATCH_TAB_SESSION"; patch: Partial<MetisSessionUiState> }
  | { type: "METIS_UPLOAD_REQUEST_QUEUED"; item: MetisUploadQueueItem }
  | { type: "METIS_SESSION_CHANGED"; tabId: number; session: MetisTabSessionState | null }
  | { type: "METIS_RECONNECT_REQUIRED"; tabId: number };

export const DEFAULT_METIS_SESSION_UI_STATE: MetisSessionUiState = {
  scanScope: "single",
  plusAnswers: {},
  pageFairnessByKey: {},
  isPlusRefinementOpen: false,
  isPlusUser: false
};
