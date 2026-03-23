import type { DomSummary } from "../../shared/types/audit";

export function inspectDomSurface(): DomSummary {
  return {
    scriptCount: document.querySelectorAll("script").length,
    imageCount: document.querySelectorAll("img").length,
    iframeCount: document.querySelectorAll("iframe").length
  };
}
