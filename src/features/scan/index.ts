import type { RawScanSnapshot } from "../../shared/types/audit";
import { inspectDomSurface } from "./dom";
import { buildResourceMetrics, collectResourceSummaries } from "./performance";
import { parsePageContext } from "./url";

export function collectRawScanSnapshot(): RawScanSnapshot {
  const page = parsePageContext(window.location.href);
  const { resources, metrics } = collectResourceSummaries(page);

  return {
    scannedAt: new Date().toISOString(),
    page,
    resources,
    dom: inspectDomSurface(),
    metrics
  };
}

export { buildResourceMetrics };
