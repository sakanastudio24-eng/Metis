// scan/url.ts normalizes the current page URL into the shared page context contract.
// The rest of the pipeline relies on this shape instead of reading window.location directly.
import type { PageContext } from "../../shared/types/audit";

export function parsePageContext(href: string): PageContext {
  const url = new URL(href);

  return {
    href: url.href,
    origin: url.origin,
    hostname: url.hostname,
    pathname: url.pathname
  };
}
