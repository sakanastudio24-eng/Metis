import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { detectIssues } from "../features/detection";
import { buildScanDebugSummary, collectRawScanSnapshot } from "../features/scan";
import { scoreSnapshot } from "../features/scoring";
import {
  buildPageScanSnapshot,
  savePageScanAndCompare
} from "../shared/lib/pageScanHistory";
import {
  getOrCreateSiteBaseline,
  upsertVisitedSiteSnapshot
} from "../shared/lib/siteBaseline";
import type { MetisRuntimeMessage } from "../shared/types/runtime";

const PANEL_OPEN_SCAN_DELAY_MS = 1000;
const POST_LOAD_SCAN_DELAY_MS = 500;
const SCAN_REFRESH_INTERVAL_MS = 3000;
const NAVIGATION_CHECK_INTERVAL_MS = 500;

function isExtensionContextInvalidated(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("extension context invalidated")
  );
}

async function sendRuntimeMessage<T>(message: MetisRuntimeMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
}

export function PageBridgeApp() {
  const [hovered, setHovered] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [riskLabel, setRiskLabel] = useState<string>("Ready");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncedLabel, setLastSyncedLabel] = useState<string>("Waiting");
  const scanTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    void sendRuntimeMessage<{ ok: boolean; session?: { isActive: boolean } | null }>({
      type: "METIS_BRIDGE_READY",
      href: window.location.href
    }).then((response) => {
      if (!isMounted) {
        return;
      }

      if (response?.session?.isActive) {
        setIsSessionActive(true);
      }
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

      return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      isMounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    let lastHref = window.location.href;
    let isStopped = false;
    let intervalId: number | null = null;
    let navigationCheckId: number | null = null;

    const clearScheduledScan = () => {
      if (scanTimeoutRef.current !== null) {
        window.clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };

    const scheduleScan = (delay = PANEL_OPEN_SCAN_DELAY_MS) => {
      if (isStopped || !isSessionActive) {
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

      scheduleScan(PANEL_OPEN_SCAN_DELAY_MS);
    };

    const handlePostLoadSync = () => {
      if (isStopped || !isSessionActive) {
        return;
      }

      scheduleScan(POST_LOAD_SCAN_DELAY_MS);
    };

    const stopSync = () => {
      if (isStopped) {
        return;
      }

      isStopped = true;

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
      if (isStopped || !isSessionActive) {
        return;
      }

      setIsUpdating(true);

      try {
        const snapshot = collectRawScanSnapshot();
        const compactSnapshot = buildPageScanSnapshot(snapshot);
        const baseline = await getOrCreateSiteBaseline(snapshot);
        const visited = await upsertVisitedSiteSnapshot(snapshot);
        const pageScanHistory = await savePageScanAndCompare(compactSnapshot);
        const issues = detectIssues(snapshot);
        const scoreBreakdown = scoreSnapshot(snapshot, issues);

        setScore(Math.round(scoreBreakdown.score));
        setRiskLabel(scoreBreakdown.label);
        setLastSyncedLabel(new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit"
        }));

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

        await sendRuntimeMessage({
          type: "METIS_SCAN_UPDATE",
          payload: {
            currentUrl: window.location.href,
            rawSnapshot: snapshot,
            baselineSnapshot: baseline,
            visitedSnapshots: visited
          }
        });
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          stopSync();
          return;
        }

        console.error("[Metis] failed to sync page bridge snapshot", error);
      } finally {
        setIsUpdating(false);
      }
    };

    if (isSessionActive) {
      scheduleScan(PANEL_OPEN_SCAN_DELAY_MS);
    }

    if (isSessionActive && document.readyState !== "complete") {
      window.addEventListener("load", handlePostLoadSync, { once: true });
    }

    if (isSessionActive) {
      intervalId = window.setInterval(() => {
        void syncSnapshots();
      }, SCAN_REFRESH_INTERVAL_MS);

      navigationCheckId = window.setInterval(() => {
        handlePageChange();
      }, NAVIGATION_CHECK_INTERVAL_MS);
    }

    window.addEventListener("popstate", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);

    return () => {
      stopSync();
    };
  }, [isSessionActive]);

  const handleActivate = async () => {
    setIsSessionActive(true);

    await sendRuntimeMessage({ type: "METIS_START_TAB_SESSION" });
    await sendRuntimeMessage({ type: "METIS_OPEN_SIDE_PANEL" });
  };

  if (isSessionActive) {
    return null;
  }

  return (
    <div className="fixed right-0 z-[2147483647]" style={{ bottom: "5rem" }}>
      {hovered && (
        <motion.div
          className="absolute right-[68px] top-1/2 inline-flex h-[34px] -translate-y-1/2 items-center rounded-full px-4"
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
          <div className="flex items-center gap-2.5 whitespace-nowrap leading-none">
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
            <div className="h-1 w-1 shrink-0 rounded-full bg-white/20" />
            <div
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Cost Risk: {score ?? "…"}
            </div>
            <div className="h-1 w-1 shrink-0 rounded-full bg-white/20" />
            <div
              style={{
                color: "rgba(255,255,255,0.66)",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 500
              }}
            >
              Open Metis
            </div>
          </div>
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={() => {
          void handleActivate();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex min-w-[48px] items-center justify-center px-3 py-4 shadow-2xl"
        style={{
          background: "#0d1825",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px 0 0 14px",
          borderRight: "none",
          boxShadow: "0 18px 44px rgba(0,0,0,0.32)"
        }}
        title="Open Metis"
        initial={{ opacity: 0, x: 18, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          opacity: { duration: 0.28, ease: "easeOut" },
          x: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
          scale: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "rgba(220,94,94,0.18)",
            color: "#ffffff",
            fontFamily: "Jua, sans-serif",
            fontSize: 15
          }}
        >
          M
        </div>
      </motion.button>
    </div>
  );
}
