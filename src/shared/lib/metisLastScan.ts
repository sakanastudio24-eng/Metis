import type { RawScanSnapshot, StoredMetisLastScan } from "../types/audit";
import { METIS_LAST_SCAN_KEY } from "./metisStorageKeys";

function getChromeLocalStorage() {
  const chromeLike = globalThis as typeof globalThis & {
    chrome?: {
      runtime?: { id?: string };
      storage?: {
        local?: {
          get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void;
          set: (items: Record<string, unknown>, callback: () => void) => void;
        };
      };
    };
  };

  if (!chromeLike.chrome?.runtime?.id) {
    return null;
  }

  return chromeLike.chrome.storage?.local ?? null;
}

export function buildStoredMetisLastScan(
  snapshot: RawScanSnapshot,
  issueCount: number
): StoredMetisLastScan {
  return {
    route: snapshot.page.href,
    scoredAt: Date.now(),
    requestCount: snapshot.metrics.requestCount,
    duplicateEndpointCount: snapshot.metrics.duplicateEndpointCount,
    issueCount
  };
}

export async function saveStoredMetisLastScan(scan: StoredMetisLastScan) {
  const storage = getChromeLocalStorage();

  if (!storage) {
    return scan;
  }

  await new Promise<void>((resolve) => {
    storage.set({ [METIS_LAST_SCAN_KEY]: scan }, () => resolve());
  });

  return scan;
}
