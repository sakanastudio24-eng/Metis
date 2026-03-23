// Normalize the current page URL into a consistent page context contract.
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
