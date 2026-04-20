import type { MetisSiteAccessState } from "../types/audit";

export function getDefaultMetisSiteAccessState(): MetisSiteAccessState {
  return {
    origin: null,
    isGranted: false,
    canRequest: false,
    isRestricted: true
  };
}

export function isRestrictedMetisUrl(url?: string | null) {
  if (!url) {
    return true;
  }

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

export function getMetisOriginPattern(url?: string | null) {
  if (!url || isRestrictedMetisUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return `${parsed.origin}/*`;
  } catch {
    return null;
  }
}

export function getMetisUrlOrigin(url?: string | null) {
  const pattern = getMetisOriginPattern(url);

  if (!pattern) {
    return null;
  }

  return pattern.slice(0, -2);
}

export async function getMetisSiteAccessState(url?: string | null): Promise<MetisSiteAccessState> {
  const origin = getMetisUrlOrigin(url);
  const pattern = getMetisOriginPattern(url);

  if (!origin || !pattern) {
    return getDefaultMetisSiteAccessState();
  }

  const isGranted = await chrome.permissions.contains({
    origins: [pattern]
  });

  return {
    origin,
    isGranted,
    canRequest: true,
    isRestricted: false
  };
}

export async function requestMetisSiteAccess(url?: string | null) {
  const pattern = getMetisOriginPattern(url);

  if (!pattern) {
    return false;
  }

  return chrome.permissions.request({
    origins: [pattern]
  });
}

export async function removeMetisSiteAccess(url?: string | null) {
  const pattern = getMetisOriginPattern(url);

  if (!pattern) {
    return false;
  }

  return chrome.permissions.remove({
    origins: [pattern]
  });
}
