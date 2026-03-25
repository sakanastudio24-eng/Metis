// App.tsx owns the live content-script runtime.
// It now prefers user-triggered scanning: Metis waits until the panel opens,
// delays the scan slightly so dynamic pages can settle, and only keeps the
// rescan loop alive while the user is actually looking at the product.
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useRef } from "react";
import { Toaster } from "sonner";
import { PhaseOneShell } from "./components/PhaseOneShell";
import { useMetisState } from "./useMetisState";
import { buildScanDebugSummary, collectRawScanSnapshot } from "../features/scan";
import {
  buildPageScanSnapshot,
  savePageScanAndCompare
} from "../shared/lib/pageScanHistory";
import {
  getOrCreateSiteBaseline,
  upsertVisitedSiteSnapshot
} from "../shared/lib/siteBaseline";

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

function stopEventPropagation(
  event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>
) {
  event.stopPropagation();
}

export default function App() {
  const {
    panelMode,
    setPanelMode,
    isPanelOpen,
    rawSnapshot,
    setRawSnapshot,
    baselineSnapshot,
    setBaselineSnapshot,
    scanScope,
    setScanScope,
    visitedSnapshots,
    setVisitedSnapshots,
    plusAnswers,
    setPlusAnswers,
    isPlusRefinementOpen,
    setIsPlusRefinementOpen
  } = useMetisState();
  const scanTimeoutRef = useRef<number | null>(null);

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

    const handlePostLoadSync = () => {
      if (isStopped || !isPanelOpen) {
        return;
      }

      scheduleScan(POST_LOAD_SCAN_DELAY_MS);
    };

    const handlePageChange = () => {
      if (isStopped || window.location.href === lastHref) {
        return;
      }

      lastHref = window.location.href;

      if (!isPanelOpen) {
        return;
      }

      scheduleScan(PANEL_OPEN_SCAN_DELAY_MS);
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

    const scheduleScan = (delay = PANEL_OPEN_SCAN_DELAY_MS) => {
      if (isStopped || !isPanelOpen) {
        return;
      }

      clearScheduledScan();
      scanTimeoutRef.current = window.setTimeout(() => {
        scanTimeoutRef.current = null;
        void syncSnapshots();
      }, delay);
    };

    const syncSnapshots = async () => {
      if (isStopped || !isPanelOpen) {
        return;
      }

      try {
        const snapshot = collectRawScanSnapshot();
        const compactSnapshot = buildPageScanSnapshot(snapshot);
        const baseline = await getOrCreateSiteBaseline(snapshot);
        const visited = await upsertVisitedSiteSnapshot(snapshot);
        const pageScanHistory = await savePageScanAndCompare(compactSnapshot);

        setRawSnapshot(snapshot);
        setBaselineSnapshot(baseline);
        setVisitedSnapshots(visited);

        console.info("[Metis] scan summary", buildScanDebugSummary(snapshot));
        console.info("[Metis] raw scan snapshot", snapshot);
        console.info("[Metis] site baseline snapshot", baseline);
        console.info("[Metis] visited site snapshots", visited);
        console.info("[Metis] page scan snapshot", compactSnapshot);

        if (pageScanHistory.comparison) {
          console.info("[Metis] page scan comparison", pageScanHistory.comparison);
        }
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          console.info("[Metis] extension context invalidated, stopping scan loop");
          stopSync();
          return;
        }

        console.error("[Metis] failed to collect raw scan snapshot", error);
      }
    };

    if (isPanelOpen) {
      scheduleScan(PANEL_OPEN_SCAN_DELAY_MS);
    }

    if (isPanelOpen && document.readyState !== "complete") {
      window.addEventListener("load", handlePostLoadSync, { once: true });
    }

    if (isPanelOpen) {
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
  }, [isPanelOpen, setBaselineSnapshot, setRawSnapshot, setVisitedSnapshots]);

  return (
    <div
      className="relative"
      onClick={stopEventPropagation}
      onMouseDown={stopEventPropagation}
      onPointerDown={stopEventPropagation}
    >
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#101c2b",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px"
          }
        }}
      />
      <PhaseOneShell
        panelMode={panelMode}
        setPanelMode={setPanelMode}
        scanScope={scanScope}
        setScanScope={setScanScope}
        rawSnapshot={rawSnapshot}
        baselineSnapshot={baselineSnapshot}
        visitedSnapshots={visitedSnapshots}
        plusAnswers={plusAnswers}
        setPlusAnswers={setPlusAnswers}
        isPlusRefinementOpen={isPlusRefinementOpen}
        setIsPlusRefinementOpen={setIsPlusRefinementOpen}
      />
    </div>
  );
}
