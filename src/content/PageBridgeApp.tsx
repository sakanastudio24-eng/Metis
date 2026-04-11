import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { assessConfidence } from "../features/confidence";
import { assessControl } from "../features/control/control";
import { detectIssues } from "../features/detection";
import { buildInsight } from "../features/insights";
import { buildPlusOptimizationReport } from "../features/refinement";
import {
  PLUS_CORE_KEYS,
  PLUS_QUESTION_DEFINITIONS
} from "../features/refinement/config";
import {
  clearPageScopedFairnessAnswer,
  getEffectivePageScopedFairnessAnswers,
  getFairnessPageKey,
  getPageScopedFairnessAnswers,
  migrateLegacyFairnessAnswers,
  setPageScopedFairnessAnswer,
  stripPageScopedFairnessAnswers,
  type PageScopedFairnessMap
} from "../features/refinement/pageScopedFairness";
import {
  buildMultipageEvidence,
  buildScanDebugSummary,
  collectRawScanSnapshot
} from "../features/scan";
import { scoreSnapshot } from "../features/scoring";
import { detectMoneyStack } from "../features/stack";
import { buildExportOutlineText, buildExportReportDocument } from "../app/components/figures/exportDocument";
import { FullReportLayout } from "../app/components/figures/FullReportLayout";
import { ExportArchitectureModal } from "../app/components/figures/MetisUtilityModals";
import { buildMetisDesignViewModel } from "../app/components/figures/liveAdapter";
import {
  buildPageScanSnapshot,
  savePageScanAndCompare
} from "../shared/lib/pageScanHistory";
import {
  DEFAULT_METIS_SETTINGS,
  getMetisLocalSettings,
  saveMetisLocalSettings
} from "../shared/lib/metisLocalSettings";
import {
  isAllowedMetisAuthOrigin,
  isAllowedMetisAuthPathname,
  isMetisAuthSuccessBridgeMessage
} from "../shared/lib/metisAuthSession";
import {
  buildStoredVisitedSnapshot,
  getOrCreateSiteBaseline,
  upsertVisitedSiteSnapshot
} from "../shared/lib/siteBaseline";
import {
  LEGACY_METIS_USER_SETTINGS_KEY,
  METIS_USER_SETTINGS_KEY
} from "../shared/lib/metisStorageKeys";
import type {
  MetisAuthFailureAck,
  MetisAuthSuccessAck,
  MetisLocalSettings,
  PageScanComparison,
  PageScanSnapshot,
  PlusRefinementAnswers,
  RawScanSnapshot
} from "../shared/types/audit";
import type { ScanScope } from "../app/types/scanScope";
import type {
  MetisRuntimeMessage,
  MetisSessionUiState,
  MetisTabSessionState
} from "../shared/types/runtime";

const PANEL_OPEN_SCAN_DELAY_MS = 1000;
const POST_LOAD_SCAN_DELAY_MS = 500;
const SCAN_REFRESH_INTERVAL_MS = 3000;
const NAVIGATION_CHECK_INTERVAL_MS = 500;
const SCAN_DEBUG_LOG_INTERVAL_MS = 8000;
const LAUNCHER_CLIP_HEIGHT_PX = 88;
const LAUNCHER_EDGE_GUTTER_PX = 12;
const LAUNCHER_DRAG_THRESHOLD_PX = 5;

function isExtensionContextInvalidated(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("extension context invalidated")
  );
}

function getDefaultLauncherTop() {
  return Math.max(
    LAUNCHER_EDGE_GUTTER_PX,
    window.innerHeight - (LAUNCHER_CLIP_HEIGHT_PX + 72)
  );
}

function clampLauncherTop(nextTop: number) {
  const minTop = LAUNCHER_EDGE_GUTTER_PX;
  const maxTop = Math.max(
    minTop,
    window.innerHeight - LAUNCHER_CLIP_HEIGHT_PX - LAUNCHER_EDGE_GUTTER_PX
  );

  return Math.min(Math.max(nextTop, minTop), maxTop);
}

function getInjectionCooldownMs(scanDelayProfile: MetisLocalSettings["scanDelayProfile"]) {
  if (scanDelayProfile === "fast") {
    return 1200;
  }

  if (scanDelayProfile === "thorough") {
    return 2600;
  }

  return 1800;
}

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

function buildCurrentSnapshot(rawSnapshot: RawScanSnapshot | null) {
  if (!rawSnapshot) {
    return null;
  }

  return rawSnapshot;
}

function buildAutoRefinementAnswers(
  snapshot: RawScanSnapshot | null
): Partial<PlusRefinementAnswers> {
  if (!snapshot) {
    return {};
  }

  const detection = detectMoneyStack(snapshot, {});
  const hostingGroup = detection.groups.find((group) => group.id === "hostingCdn");
  const aiGroup = detection.groups.find((group) => group.id === "aiProviders");
  const analyticsGroup = detection.groups.find((group) => group.id === "analyticsAdsRum");

  const hostingVendorId = hostingGroup?.vendors[0]?.id;
  const aiVendorId = aiGroup?.vendors[0]?.id;
  const analyticsVendorId = analyticsGroup?.vendors[0]?.id;

  return {
    hostingProvider:
      hostingVendorId === "vercel"
        ? "vercel"
        : hostingVendorId === "cloudflare"
          ? "cloudflare"
          : hostingVendorId === "cloudfront" ||
              hostingVendorId === "aws" ||
              hostingVendorId === "aws-s3" ||
              hostingVendorId === "aws-api-gateway"
            ? "aws"
            : undefined,
    stackCdnProvider:
      hostingVendorId === "cloudflare"
        ? "cloudflare"
        : hostingVendorId === "cloudfront"
          ? "cloudfront"
          : hostingVendorId === "vercel"
            ? "vercelEdge"
            : undefined,
    stackAiProvider:
      aiVendorId === "openai"
        ? "openai"
        : aiVendorId === "anthropic"
          ? "anthropic"
          : aiVendorId === "googleAi"
            ? "google"
            : undefined,
    stackAnalytics:
      analyticsVendorId === "ga4"
        ? "ga4"
        : analyticsVendorId === "gtm"
          ? "gtm"
          : analyticsVendorId === "amazonAds"
            ? "amazonAdvertising"
            : analyticsVendorId === "cloudwatchRum"
              ? "cloudwatchRum"
              : analyticsVendorId === "metaPixel"
                ? "metaPixel"
                : analyticsVendorId === "segment"
                  ? "segment"
                  : analyticsVendorId === "plausible"
                    ? "plausible"
                    : analyticsVendorId === "mixpanel"
                      ? "mixpanel"
                      : undefined
  };
}

function buildAnswersBeforeRouteContext(
  inferredAnswers: Partial<PlusRefinementAnswers>,
  plusAnswers: PlusRefinementAnswers
): PlusRefinementAnswers {
  return {
    ...inferredAnswers,
    ...stripPageScopedFairnessAnswers(plusAnswers)
  };
}

export function PageBridgeApp() {
  const [hovered, setHovered] = useState(false);
  const [launcherRecoveryMode, setLauncherRecoveryMode] = useState(false);
  const [launcherTop, setLauncherTop] = useState<number | null>(null);
  const [isLauncherDragging, setIsLauncherDragging] = useState(false);
  const [session, setSession] = useState<MetisTabSessionState | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [riskLabel, setRiskLabel] = useState<string>("Ready");
  const [isUpdating, setIsUpdating] = useState(false);
  const [scanScope, setScanScope] = useState<ScanScope>("single");
  const [plusAnswers, setPlusAnswers] = useState<PlusRefinementAnswers>({});
  const [pageFairnessByKey, setPageFairnessByKey] = useState<PageScopedFairnessMap>({});
  const [isPlusRefinementOpen, setIsPlusRefinementOpen] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [settings, setSettings] = useState<MetisLocalSettings>(DEFAULT_METIS_SETTINGS);
  const scanTimeoutRef = useRef<number | null>(null);
  const scanSyncInFlightRef = useRef(false);
  const lastInjectionAtRef = useRef(0);
  const lastDebugLogAtRef = useRef(0);
  const launcherShellRef = useRef<HTMLDivElement | null>(null);
  const launcherTopRef = useRef<number | null>(null);
  const launcherDragOffsetRef = useRef(0);
  const launcherPointerStartYRef = useRef(0);
  const launcherPointerIdRef = useRef<number | null>(null);
  const launcherDragMovedRef = useRef(false);
  const suppressLauncherClickRef = useRef(false);

  const applySessionState = (nextSession: MetisTabSessionState | null) => {
    setSession(nextSession);
    setIsSessionActive(nextSession?.isActive ?? false);
    setIsPanelOpen(nextSession?.isSidePanelOpen ?? false);

    if (nextSession?.uiState) {
      const migratedUiState = migrateLegacyFairnessAnswers(
        nextSession.uiState.plusAnswers,
        nextSession.uiState.pageFairnessByKey ?? {},
        getFairnessPageKey(nextSession.currentUrl)
      );

      setScanScope(nextSession.uiState.scanScope);
      setPlusAnswers(migratedUiState.plusAnswers);
      setPageFairnessByKey(migratedUiState.pageFairnessByKey);
      setIsPlusRefinementOpen(nextSession.uiState.isPlusRefinementOpen);
      setIsPlusUser(nextSession.uiState.isPlusUser);
      return;
    }

    setScanScope("single");
    setPlusAnswers({});
    setPageFairnessByKey({});
    setIsPlusRefinementOpen(false);
    setIsPlusUser(false);
  };

  const visitedSnapshots = session?.visitedSnapshots ?? [];
  const activeSnapshot = buildCurrentSnapshot(session?.rawSnapshot ?? null);
  const multipageEvidence = useMemo(
    () => (activeSnapshot ? buildMultipageEvidence(activeSnapshot, visitedSnapshots) : null),
    [activeSnapshot, visitedSnapshots]
  );
  const inferredAnswers = useMemo(
    () => buildAutoRefinementAnswers(activeSnapshot),
    [activeSnapshot]
  );
  const currentPageKey = useMemo(
    () => getFairnessPageKey(activeSnapshot?.page.href ?? session?.currentUrl ?? window.location.href),
    [activeSnapshot?.page.href, session?.currentUrl]
  );
  const currentPageStoredFairnessAnswers = useMemo(
    () => getPageScopedFairnessAnswers(pageFairnessByKey, currentPageKey),
    [currentPageKey, pageFairnessByKey]
  );
  const currentPageFairnessAnswers = useMemo(
    () => getEffectivePageScopedFairnessAnswers(pageFairnessByKey, currentPageKey),
    [currentPageKey, pageFairnessByKey]
  );
  const effectiveAnswers = useMemo(
    () => ({
      ...inferredAnswers,
      ...plusAnswers,
      ...currentPageFairnessAnswers
    }),
    [currentPageFairnessAnswers, inferredAnswers, plusAnswers]
  );
  const answersBeforeRouteContext = useMemo(
    () => buildAnswersBeforeRouteContext(inferredAnswers, plusAnswers),
    [inferredAnswers, plusAnswers]
  );
  const stackDetection = activeSnapshot ? detectMoneyStack(activeSnapshot, effectiveAnswers) : null;
  const issues = activeSnapshot ? detectIssues(activeSnapshot, effectiveAnswers) : [];
  const baselineIssues = activeSnapshot ? detectIssues(activeSnapshot, answersBeforeRouteContext) : [];
  const control = activeSnapshot ? assessControl(activeSnapshot, issues, effectiveAnswers) : null;
  const baselineControl =
    activeSnapshot ? assessControl(activeSnapshot, baselineIssues, answersBeforeRouteContext) : null;
  const scoreBreakdown = activeSnapshot ? scoreSnapshot(activeSnapshot, issues, effectiveAnswers) : null;
  const baselineScore =
    activeSnapshot ? scoreSnapshot(activeSnapshot, baselineIssues, answersBeforeRouteContext) : null;
  const confidence =
    activeSnapshot && stackDetection && scoreBreakdown
      ? assessConfidence(activeSnapshot, stackDetection, scoreBreakdown)
      : null;
  const insight =
    activeSnapshot && scoreBreakdown && confidence
      ? buildInsight(activeSnapshot, issues, scoreBreakdown, confidence, effectiveAnswers)
      : null;
  const plusReport =
    activeSnapshot && scoreBreakdown && insight
      ? buildPlusOptimizationReport(insight, activeSnapshot, issues, scoreBreakdown, effectiveAnswers)
      : null;
  const pageCount = Math.max(visitedSnapshots.length, 1);
  const viewModel =
    activeSnapshot && scoreBreakdown && control && confidence && baselineScore && baselineControl
      ? buildMetisDesignViewModel({
          snapshot: activeSnapshot,
          issues,
          control,
          confidence,
          score: scoreBreakdown,
          insight,
          scope: scanScope,
          pageCount,
          multipageEvidence,
          answers: effectiveAnswers,
          plusReport,
          requiredQuestionCount: PLUS_CORE_KEYS.length,
          contextPreview: {
            beforeScore: baselineScore,
            beforeControl: baselineControl,
            hasActiveContext:
              currentPageFairnessAnswers.appType !== undefined ||
              currentPageFairnessAnswers.representativeExperience !== undefined
          }
        })
      : null;
  const exportDocument = viewModel
    ? buildExportReportDocument(viewModel, { isPlusUser })
    : null;
  const questionDefinitions = useMemo(() => {
    const baseDefinitions = PLUS_QUESTION_DEFINITIONS.filter((definition) => {
      if (!definition.dependsOn) {
        return true;
      }

      return effectiveAnswers[definition.dependsOn.key] === definition.dependsOn.value;
    });

    return [...baseDefinitions, ...(viewModel?.stackQuestionDefinitions ?? [])];
  }, [effectiveAnswers, viewModel?.stackQuestionDefinitions]);
  const isFairnessQuestionKey = (
    key: keyof PlusRefinementAnswers
  ): key is "appType" | "representativeExperience" =>
    PLUS_CORE_KEYS.includes(key as "appType" | "representativeExperience");
  const isQuestionResolved = (key: keyof PlusRefinementAnswers) =>
    isFairnessQuestionKey(key)
      ? currentPageFairnessAnswers[key] !== undefined
      : effectiveAnswers[key] !== undefined;
  const isQuestionExplicitlyAnswered = (key: keyof PlusRefinementAnswers) =>
    isFairnessQuestionKey(key)
      ? currentPageStoredFairnessAnswers[key] !== undefined
      : effectiveAnswers[key] !== undefined;
  const pendingQuestionDefinitions = useMemo(
    () => questionDefinitions.filter((definition) => !isQuestionResolved(definition.key)),
    [questionDefinitions, currentPageFairnessAnswers, effectiveAnswers]
  );
  const currentQuestion =
    pendingQuestionDefinitions[0] ?? null;
  const answeredQuestions = useMemo(
    () =>
      questionDefinitions.filter((definition) => isQuestionExplicitlyAnswered(definition.key)),
    [questionDefinitions, currentPageStoredFairnessAnswers, effectiveAnswers]
  );
  const previousQuestion = answeredQuestions[answeredQuestions.length - 1] ?? null;

  const patchSessionUi = async (patch: Partial<MetisSessionUiState>) => {
    await sendRuntimeMessage({
      type: "METIS_PATCH_TAB_SESSION",
      patch
    });
  };

  useEffect(() => {
    let isMounted = true;

    void getMetisLocalSettings().then((storedSettings) => {
      if (!isMounted) {
        return;
      }

      setSettings(storedSettings);
    });

    void sendRuntimeMessage<{
      ok: boolean;
      session?: MetisTabSessionState | null;
    }>({
      type: "METIS_BRIDGE_READY",
      href: window.location.href
    }).then((response) => {
      if (!isMounted) {
        return;
      }

      applySessionState(response?.session ?? null);
    });

    const listener = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return false;
      }

      const runtimeMessage = message as MetisRuntimeMessage;

      if (runtimeMessage.type === "METIS_PING") {
        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_ACTIVATE_FROM_TOOLBAR") {
        setIsSessionActive(true);
        sendResponse({ ok: true });
        return true;
      }

      // The side panel stays compact. Opening the deep read happens back in
      // the page bridge so the report can use the full tab viewport.
      if (runtimeMessage.type === "METIS_OPEN_PAGE_REPORT") {
        setHovered(false);
        if (runtimeMessage.openPlusPreview) {
          setIsPlusUser(true);
          setIsPlusRefinementOpen(false);
        }
        setIsReportOpen(true);
        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_SESSION_CHANGED") {
        applySessionState(runtimeMessage.session ?? null);

        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_AUTH_STATE_CHANGED") {
        sendResponse({ ok: true });
        return true;
      }

      if (runtimeMessage.type === "METIS_UPLOAD_REQUEST_QUEUED") {
        toast.success("Premium request queued", {
          description: "Metis saved your request and will retry delivery if the network is busy."
        });
        sendResponse({ ok: true });
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      isMounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (
        areaName !== "local" ||
        (!changes[METIS_USER_SETTINGS_KEY] && !changes[LEGACY_METIS_USER_SETTINGS_KEY])
      ) {
        return;
      }

      void getMetisLocalSettings().then(setSettings);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const nextTop =
      typeof settings.launcherTop === "number" ? settings.launcherTop : getDefaultLauncherTop();

    // The clip and hover preview share one anchored Y position.
    setLauncherTop(clampLauncherTop(nextTop));
  }, [settings.launcherTop]);

  useEffect(() => {
    launcherTopRef.current = launcherTop;
  }, [launcherTop]);

  useEffect(() => {
    const handleResize = () => {
      setLauncherTop((currentTop) => clampLauncherTop(currentTop ?? getDefaultLauncherTop()));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isLauncherDragging) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      if (
        launcherPointerIdRef.current !== null &&
        event.pointerId !== launcherPointerIdRef.current
      ) {
        return;
      }

      const nextTop = clampLauncherTop(event.clientY - launcherDragOffsetRef.current);
      launcherDragMovedRef.current = true;
      setLauncherTop(nextTop);
      setHovered(false);
    };

    const finishDrag = () => {
      document.body.style.userSelect = previousUserSelect;
      setIsLauncherDragging(false);
      launcherPointerIdRef.current = null;

      if (launcherDragMovedRef.current) {
        suppressLauncherClickRef.current = true;
        const persistedTop = clampLauncherTop(
          launcherTopRef.current ?? getDefaultLauncherTop()
        );
        void saveMetisLocalSettings({ launcherTop: persistedTop });
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (
        launcherPointerIdRef.current !== null &&
        event.pointerId !== launcherPointerIdRef.current
      ) {
        return;
      }

      finishDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isLauncherDragging]);

  useEffect(() => {
    const handleAuthBridge = (event: MessageEvent<unknown>) => {
      if (
        !isAllowedMetisAuthOrigin(event.origin) ||
        !isAllowedMetisAuthPathname(window.location.pathname) ||
        !isMetisAuthSuccessBridgeMessage(event.data)
      ) {
        return;
      }

      void sendRuntimeMessage<{
        ok?: boolean;
        reason?: string;
        detail?: string;
        endpoint?: string;
      }>({
        type: "METIS_AUTH_STATE_CHANGED",
        payload: event.data
      }).then((response) => {
        if (response?.ok) {
          const ack: MetisAuthSuccessAck = {
            type: "METIS_AUTH_SUCCESS_ACK",
            source: "metis-extension",
            version: 1,
            ok: true
          };

          window.postMessage(ack, window.location.origin);
          toast.success("Connected to Metis ✓", {
            description: "This website session is now available in the extension."
          });
          return;
        }

        const failure: MetisAuthFailureAck = {
          type: "METIS_AUTH_FAILURE",
          source: "metis-extension",
          version: 1,
          ok: false,
          reason:
            response?.reason === "extension_unavailable" ||
            response?.reason === "validation_endpoint_unreachable" ||
            response?.reason === "validation_rejected" ||
            response?.reason === "invalid_account_payload" ||
            response?.reason === "storage_failed"
              ? response.reason
              : "unknown",
          detail:
            typeof response?.detail === "string"
              ? response.detail
              : "The extension could not store the connected account state.",
          endpoint: typeof response?.endpoint === "string" ? response.endpoint : undefined
        };

        window.postMessage(failure, window.location.origin);
        toast.error("Metis connection failed", {
          description: failure.detail
        });
      });
    };

    window.addEventListener("message", handleAuthBridge);

    return () => {
      window.removeEventListener("message", handleAuthBridge);
    };
  }, []);

  useEffect(() => {
    let lastHref = window.location.href;
    let isStopped = false;
    let intervalId: number | null = null;
    let navigationCheckId: number | null = null;

    const initialScanDelay =
      settings.scanDelayProfile === "fast"
        ? 400
        : settings.scanDelayProfile === "thorough"
          ? 1800
          : PANEL_OPEN_SCAN_DELAY_MS;
    const postLoadDelay = Math.max(350, Math.round(initialScanDelay / 2));

    const clearScheduledScan = () => {
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };

    const scheduleScan = (delay = initialScanDelay) => {
      if (isStopped || !isSessionActive || !settings.webPageScanningEnabled) {
        return;
      }

      clearScheduledScan();
      scanTimeoutRef.current = window.setTimeout(() => {
        scanTimeoutRef.current = null;
        void syncSnapshots();
      }, delay);
    };

    const handlePageChange = () => {
      if (isStopped || window.location.href === lastHref) {
        return;
      }

      lastHref = window.location.href;

      if (!isSessionActive) {
        return;
      }

      scheduleScan(initialScanDelay);
    };

    const handlePostLoadSync = () => {
      if (isStopped || !isSessionActive || !settings.webPageScanningEnabled) {
        return;
      }

      scheduleScan(postLoadDelay);
    };

    const stopSync = () => {
      if (isStopped) {
        return;
      }

      isStopped = true;
      scanSyncInFlightRef.current = false;

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      if (navigationCheckId !== null) {
        window.clearInterval(navigationCheckId);
      }

      clearScheduledScan();
      window.removeEventListener("popstate", handlePageChange);
      window.removeEventListener("hashchange", handlePageChange);
      window.removeEventListener("load", handlePostLoadSync);
    };

    const syncSnapshots = async () => {
      if (isStopped || !isSessionActive || !settings.webPageScanningEnabled) {
        return;
      }

      // Keep the page bridge from flooding Chrome with back-to-back full snapshot
      // writes on noisy pages. We still reschedule, but we only inject one update
      // per cooldown window and never overlap an in-flight sync.
      const injectionCooldownMs = getInjectionCooldownMs(settings.scanDelayProfile);
      const now = Date.now();
      const remainingCooldown =
        lastInjectionAtRef.current + injectionCooldownMs - now;

      if (scanSyncInFlightRef.current) {
        scheduleScan(injectionCooldownMs);
        return;
      }

      if (remainingCooldown > 0) {
        scheduleScan(Math.max(remainingCooldown, 250));
        return;
      }

      scanSyncInFlightRef.current = true;
      lastInjectionAtRef.current = now;
      setIsUpdating(true);

      try {
        const snapshot = collectRawScanSnapshot();
        const compactSnapshot = buildPageScanSnapshot(snapshot);
        let baseline = snapshot;
        let visited = [buildStoredVisitedSnapshot(snapshot)];
        let pageScanHistory: {
          previous: PageScanSnapshot | null;
          comparison: PageScanComparison | null;
          latestCapturedSnapshot: PageScanSnapshot | null;
          latestCapturedComparison: PageScanComparison | null;
        } = {
          previous: null,
          comparison: null,
          latestCapturedSnapshot: null,
          latestCapturedComparison: null
        };

        if (settings.localHistoryEnabled) {
          baseline = await getOrCreateSiteBaseline(snapshot);
          visited = await upsertVisitedSiteSnapshot(snapshot);
          pageScanHistory = await savePageScanAndCompare(compactSnapshot);
        }
        const issues = detectIssues(snapshot);
        const scoreBreakdown = scoreSnapshot(snapshot, issues);

        setScore(Math.round(scoreBreakdown.score));
        setRiskLabel(scoreBreakdown.label);

        if (Date.now() - lastDebugLogAtRef.current >= SCAN_DEBUG_LOG_INTERVAL_MS) {
          lastDebugLogAtRef.current = Date.now();
          console.info("[Metis] scan summary", buildScanDebugSummary(snapshot));
          console.info("[Metis] raw scan snapshot", snapshot);
          console.info("[Metis] site baseline snapshot", baseline);
          console.info("[Metis] visited site snapshots", visited);
          console.info("[Metis] page scan snapshot", compactSnapshot);

          if (pageScanHistory.comparison) {
            console.info("[Metis] page scan comparison", pageScanHistory.comparison);
          }

          if (pageScanHistory.latestCapturedSnapshot) {
            console.info(
              "[Metis] latest captured page snapshot",
              pageScanHistory.latestCapturedSnapshot
            );
          }

          if (pageScanHistory.latestCapturedComparison) {
            console.info(
              "[Metis] latest captured page comparison",
              pageScanHistory.latestCapturedComparison
            );
          }
        }

        const response = await sendRuntimeMessage<{
          ok: boolean;
          session?: MetisTabSessionState | null;
        }>({
          type: "METIS_SCAN_UPDATE",
          payload: {
            currentUrl: window.location.href,
            rawSnapshot: snapshot,
            baselineSnapshot: baseline,
            visitedSnapshots: visited
          }
        });

        // The page bridge should not wait on a follow-up session broadcast to
        // show the latest scan. Hydrate from the write response immediately so
        // the fullscreen report stays in sync even if the broadcast arrives late.
        if (response?.ok) {
          applySessionState(response.session ?? null);
        }
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          stopSync();
          return;
        }

        console.error("[Metis] failed to sync page bridge snapshot", error);
      } finally {
        scanSyncInFlightRef.current = false;
        setIsUpdating(false);
      }
    };

    if (isSessionActive && settings.webPageScanningEnabled) {
      scheduleScan(initialScanDelay);
    }

    if (
      isSessionActive &&
      settings.webPageScanningEnabled &&
      document.readyState !== "complete"
    ) {
      window.addEventListener("load", handlePostLoadSync, { once: true });
    }

    if (isSessionActive && settings.webPageScanningEnabled) {
      navigationCheckId = window.setInterval(() => {
        handlePageChange();
      }, NAVIGATION_CHECK_INTERVAL_MS);

      if (settings.autoRescanWhilePanelOpen) {
        intervalId = window.setInterval(() => {
          void syncSnapshots();
        }, SCAN_REFRESH_INTERVAL_MS);
      }
    }

    window.addEventListener("popstate", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);

    return () => {
      stopSync();
    };
  }, [
    isSessionActive,
    settings.autoRescanWhilePanelOpen,
    settings.localHistoryEnabled,
    settings.scanDelayProfile,
    settings.webPageScanningEnabled
  ]);

  useEffect(() => {
    if (isPanelOpen || isReportOpen || isExportOpen || !isSessionActive) {
      return;
    }

    setHovered(true);
    const hoverResetId = window.setTimeout(() => {
      setHovered(false);
    }, 2200);

    return () => {
      window.clearTimeout(hoverResetId);
    };
  }, [isExportOpen, isPanelOpen, isReportOpen, isSessionActive]);

  useEffect(() => {
    if (!(isReportOpen || isExportOpen)) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isExportOpen, isReportOpen]);

  const handleActivate = async () => {
    setIsSessionActive(true);
    setIsPanelOpen(true);
    setHovered(false);

    const openPanelPromise = sendRuntimeMessage<{ ok?: boolean }>({ type: "METIS_OPEN_SIDE_PANEL" });
    const startSessionPromise = sendRuntimeMessage({ type: "METIS_START_TAB_SESSION" });

    const [openPanelResponse] = await Promise.all([openPanelPromise, startSessionPromise]);

    if (!openPanelResponse?.ok) {
      setIsPanelOpen(false);
      setLauncherRecoveryMode(true);
      setHovered(true);
      void sendRuntimeMessage({ type: "METIS_OPEN_TOOLBAR_SETTINGS" });
      toast.message("Metis opened settings instead", {
        description: "Chrome blocked the panel open on this page. Use the popup button to reopen the panel."
      });
      return;
    }

    setLauncherRecoveryMode(false);
  };

  const handleLauncherPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const shellTop =
      launcherShellRef.current?.getBoundingClientRect().top ?? launcherTop ?? getDefaultLauncherTop();

    launcherPointerIdRef.current = event.pointerId;
    launcherPointerStartYRef.current = event.clientY;
    launcherDragOffsetRef.current = event.clientY - shellTop;
    launcherDragMovedRef.current = false;
    setIsLauncherDragging(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerId !== launcherPointerIdRef.current) {
      return;
    }

    if (
      !isLauncherDragging &&
      Math.abs(event.clientY - launcherPointerStartYRef.current) < LAUNCHER_DRAG_THRESHOLD_PX
    ) {
      return;
    }

    setIsLauncherDragging(true);
  };

  const handleLauncherPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerId !== launcherPointerIdRef.current) {
      return;
    }

    if (!isLauncherDragging) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      launcherPointerIdRef.current = null;
      launcherDragMovedRef.current = false;
    }
  };

  const handleLauncherClick = () => {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      return;
    }

    void handleActivate();
  };

  const handleSetScanScope = (scope: ScanScope) => {
    setScanScope(scope);
    void patchSessionUi({ scanScope: scope });
  };

  const handleAnswer = (key: keyof PlusRefinementAnswers, value: string) => {
    if (PLUS_CORE_KEYS.includes(key)) {
      const nextPageFairnessByKey = setPageScopedFairnessAnswer(
        pageFairnessByKey,
        currentPageKey,
        key as "appType" | "representativeExperience",
        value
      );

      setPageFairnessByKey(nextPageFairnessByKey);
      void patchSessionUi({ pageFairnessByKey: nextPageFairnessByKey });
      return;
    }

    const nextAnswers = {
      ...stripPageScopedFairnessAnswers(plusAnswers),
      [key]: value
    };

    setPlusAnswers(nextAnswers);
    void patchSessionUi({ plusAnswers: nextAnswers });
  };

  const handleBackQuestion = () => {
    if (!previousQuestion) {
      return;
    }

    if (PLUS_CORE_KEYS.includes(previousQuestion.key)) {
      const nextPageFairnessByKey = clearPageScopedFairnessAnswer(
        pageFairnessByKey,
        currentPageKey,
        previousQuestion.key as "appType" | "representativeExperience"
      );

      setPageFairnessByKey(nextPageFairnessByKey);
      void patchSessionUi({ pageFairnessByKey: nextPageFairnessByKey });
      return;
    }

    const nextAnswers = {
      ...stripPageScopedFairnessAnswers(plusAnswers),
      [previousQuestion.key]: undefined
    };

    setPlusAnswers(nextAnswers);
    void patchSessionUi({ plusAnswers: nextAnswers });
  };

  const handleDegradeToFree = async () => {
    setIsPlusUser(false);
    setIsPlusRefinementOpen(false);
    await patchSessionUi({
      isPlusUser: false,
      isPlusRefinementOpen: false
    });
  };

  const handleCopyReport = async () => {
    if (!viewModel) {
      return;
    }

    const document = buildExportReportDocument(viewModel, { isPlusUser });
    await navigator.clipboard.writeText(buildExportOutlineText(document));

    toast.success("Report copied", {
      description: "Metis copied the current report summary to your clipboard."
    });
  };

  const handleCopyExportOutline = async () => {
    if (!viewModel) {
      return;
    }

    await navigator.clipboard.writeText(
      buildExportOutlineText(buildExportReportDocument(viewModel, { isPlusUser }))
    );

    toast.success("Export outline copied", {
      description: "The current export document shape is now on your clipboard."
    });
  };

  return (
    <>
      <AnimatePresence>
        {!isPanelOpen && !isReportOpen && !isExportOpen && launcherTop !== null && (
          <motion.div
            ref={launcherShellRef}
            className="fixed right-0 z-[2147483647]"
            style={{ top: `${launcherTop}px` }}
            onMouseEnter={() => {
              if (!isLauncherDragging) {
                setHovered(true);
              }
            }}
            onMouseLeave={() => {
              if (!isLauncherDragging) {
                setHovered(false);
              }
            }}
            onFocusCapture={() => setHovered(true)}
            onBlurCapture={(event: ReactFocusEvent<HTMLDivElement>) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setHovered(false);
              }
            }}
            initial={{ opacity: 0, x: 18, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.92 }}
            transition={{
              opacity: { duration: 0.22, ease: "easeOut" },
              x: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 },
              scale: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 }
            }}
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute right-[52px] top-1/2 w-[360px] -translate-y-1/2 rounded-[24px] px-6 py-6"
                  style={{
                    background: "#0d1825",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 46px rgba(0,0,0,0.42)"
                  }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div
                        style={{
                          color: "rgba(255,255,255,0.38)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase"
                        }}
                      >
                        Metis
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        Score: {score ?? "…"}
                      </div>
                    </div>
                    <div
                      style={{
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: "22px"
                      }}
                    >
                      {launcherRecoveryMode
                        ? "Panel open was blocked on this page."
                        : isSessionActive
                          ? riskLabel
                          : "Metis is ready"}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        lineHeight: "19px"
                      }}
                    >
                      {launcherRecoveryMode
                        ? "Use the Metis popup if Chrome blocks the side panel on this page."
                        : "Drag this clip up or down, then click for the real side panel."}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleActivate();
                        }}
                        className="rounded-full px-3 py-2"
                        style={{
                          background: "#dc5e5e",
                          color: "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {launcherRecoveryMode ? "Try panel again" : "Open panel"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={handleLauncherClick}
              onPointerDown={handleLauncherPointerDown}
              onPointerMove={handleLauncherPointerMove}
              onPointerUp={handleLauncherPointerUp}
              onPointerCancel={handleLauncherPointerUp}
              className="group flex h-[92px] w-[40px] items-center justify-center shadow-2xl"
              style={{
                background: "#0d1825",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px 0 0 18px",
                borderRight: "none",
                boxShadow: hovered
                  ? "0 18px 44px rgba(0,0,0,0.32), 0 0 0 1px rgba(220,94,94,0.16)"
                  : "0 18px 44px rgba(0,0,0,0.32)",
                cursor: isLauncherDragging ? "grabbing" : "grab"
              }}
              title="Open Metis"
              animate={{
                width: hovered ? 48 : 40,
                backgroundColor: hovered ? "#132233" : "#0d1825"
              }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div
                className="flex flex-col items-center justify-center gap-1"
                style={{
                  color: "#ffffff"
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 7,
                    height: 7,
                    borderRadius: 9999,
                    background: isUpdating ? "#22c55e" : "#dc5e5e"
                  }}
                />
                <span
                  style={{
                    fontFamily: "Jua, sans-serif",
                    fontSize: 12,
                    lineHeight: 1
                  }}
                >
                  M
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[2147483600]"
              style={{ background: "rgba(2,7,16,0.76)", backdropFilter: "blur(14px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportOpen(false)}
            />
            <motion.div
              className="fixed inset-0 z-[2147483601] flex items-center justify-center p-5"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div
                className="pointer-events-auto h-[min(900px,calc(100vh-40px))] w-[min(1400px,calc(100vw-40px))]"
                onClick={(event) => event.stopPropagation()}
              >
                <FullReportLayout
                  viewModel={viewModel}
                  scanScope={scanScope}
                  onSetScanScope={handleSetScanScope}
                  currentQuestion={currentQuestion}
                  plusAnswers={plusAnswers}
                  isRefinementOpen={isPlusRefinementOpen}
                  setIsRefinementOpen={(value) => {
                    setIsPlusRefinementOpen(value);
                    void patchSessionUi({ isPlusRefinementOpen: value });
                  }}
                  onAnswer={handleAnswer}
                  onBackQuestion={handleBackQuestion}
                  canGoBack={previousQuestion !== null}
                onCopyReport={() => {
                  void handleCopyReport();
                }}
                  isPlusUser={isPlusUser}
                  refreshTick={0}
                  onClose={() => setIsReportOpen(false)}
                  onDegradeToFree={() => {
                    void handleDegradeToFree();
                  }}
                  showSampleProgress
                  onOpenExport={() => {
                    setIsReportOpen(false);
                    setIsExportOpen(true);
                  }}
                  attachedLayout={false}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportOpen && exportDocument ? (
          <ExportArchitectureModal
            document={exportDocument}
            onClose={() => setIsExportOpen(false)}
            onCopyOutline={() => {
              void handleCopyExportOutline();
            }}
          />
        ) : null}
      </AnimatePresence>

    </>
  );
}
