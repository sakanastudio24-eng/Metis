// App.tsx owns the live content-script runtime.
// It refreshes scan data, guards against invalid extension contexts,
// and passes the latest snapshots into the injected Metis panel.
import type { MouseEvent, PointerEvent } from "react";
import { useEffect } from "react";
import { PhaseOneShell } from "./components/PhaseOneShell";
import { useMetisState } from "./useMetisState";
import { collectRawScanSnapshot } from "../features/scan";
import {
  getOrCreateSiteBaseline,
  upsertVisitedSiteSnapshot
} from "../shared/lib/siteBaseline";

const SCAN_REFRESH_INTERVAL_MS = 5000;
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
    rawSnapshot,
    setRawSnapshot,
    baselineSnapshot,
    setBaselineSnapshot,
    scanScope,
    setScanScope,
    visitedSnapshots,
    setVisitedSnapshots
  } = useMetisState();

  useEffect(() => {
    let lastHref = window.location.href;
    let isStopped = false;
    let intervalId: number | null = null;
    let navigationCheckId: number | null = null;

    const handlePageChange = () => {
      if (isStopped || window.location.href === lastHref) {
        return;
      }

      lastHref = window.location.href;
      void syncSnapshots();
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

      window.removeEventListener("popstate", handlePageChange);
      window.removeEventListener("hashchange", handlePageChange);
    };

    const syncSnapshots = async () => {
      if (isStopped) {
        return;
      }

      try {
        const snapshot = collectRawScanSnapshot();
        const baseline = await getOrCreateSiteBaseline(snapshot);
        const visited = await upsertVisitedSiteSnapshot(snapshot);

        setRawSnapshot(snapshot);
        setBaselineSnapshot(baseline);
        setVisitedSnapshots(visited);

        console.info("[Metis] raw scan snapshot", snapshot);
        console.info("[Metis] site baseline snapshot", baseline);
        console.info("[Metis] visited site snapshots", visited);
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          console.info("[Metis] extension context invalidated, stopping scan loop");
          stopSync();
          return;
        }

        console.error("[Metis] failed to collect raw scan snapshot", error);
      }
    };

    void syncSnapshots();

    intervalId = window.setInterval(() => {
      void syncSnapshots();
    }, SCAN_REFRESH_INTERVAL_MS);

    navigationCheckId = window.setInterval(() => {
      handlePageChange();
    }, NAVIGATION_CHECK_INTERVAL_MS);

    window.addEventListener("popstate", handlePageChange);
    window.addEventListener("hashchange", handlePageChange);

    return () => {
      stopSync();
    };
  }, [setBaselineSnapshot, setRawSnapshot, setVisitedSnapshots]);

  return (
    <div
      className="relative"
      onClick={stopEventPropagation}
      onMouseDown={stopEventPropagation}
      onPointerDown={stopEventPropagation}
    >
      <PhaseOneShell
        panelMode={panelMode}
        setPanelMode={setPanelMode}
        scanScope={scanScope}
        setScanScope={setScanScope}
        rawSnapshot={rawSnapshot}
        baselineSnapshot={baselineSnapshot}
        visitedSnapshots={visitedSnapshots}
      />
    </div>
  );
}
