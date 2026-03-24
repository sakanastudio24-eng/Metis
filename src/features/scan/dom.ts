// scan/dom.ts collects lightweight DOM counts that add context to the scan snapshot.
// These counts support trust and future insights, but they do not drive scoring directly.
import type { DomSummary } from "../../shared/types/audit";

export function inspectDomSurface(): DomSummary {
  return {
    scriptCount: document.querySelectorAll("script").length,
    imageCount: document.querySelectorAll("img").length,
    iframeCount: document.querySelectorAll("iframe").length
  };
}
