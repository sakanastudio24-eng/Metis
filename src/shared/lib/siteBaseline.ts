import type { RawScanSnapshot } from "../types/audit";

function getBaselineStorageKey(origin: string) {
  return `metis:baseline:${origin}`;
}

function getPagesStorageKey(origin: string) {
  return `metis:pages:${origin}`;
}

function getStorageArea() {
  try {
    if (!chrome?.runtime?.id) {
      return null;
    }

    return chrome.storage.local;
  } catch {
    return null;
  }
}

function resolveStorageValue<T>(fallback: T, resolve: (value: T) => void, value: T) {
  try {
    if (chrome.runtime.lastError) {
      resolve(fallback);
      return;
    }
  } catch {
    resolve(fallback);
    return;
  }

  resolve(value);
}

export async function getSiteBaseline(
  origin: string
): Promise<RawScanSnapshot | null> {
  const storage = getStorageArea();

  if (!storage) {
    return null;
  }

  const key = getBaselineStorageKey(origin);

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        resolveStorageValue(
          null,
          resolve,
          (result[key] as RawScanSnapshot | undefined) ?? null
        );
      });
    } catch {
      resolve(null);
    }
  });
}

export async function setSiteBaseline(snapshot: RawScanSnapshot): Promise<void> {
  const storage = getStorageArea();

  if (!storage) {
    return;
  }

  const key = getBaselineStorageKey(snapshot.page.origin);

  await new Promise<void>((resolve) => {
    try {
      storage.set({ [key]: snapshot }, () => {
        resolveStorageValue(undefined, resolve, undefined);
      });
    } catch {
      resolve();
    }
  });
}

export async function getOrCreateSiteBaseline(
  snapshot: RawScanSnapshot
): Promise<RawScanSnapshot> {
  const existing = await getSiteBaseline(snapshot.page.origin);

  if (existing) {
    return existing;
  }

  await setSiteBaseline(snapshot);
  return snapshot;
}

export async function getVisitedSiteSnapshots(
  origin: string
): Promise<RawScanSnapshot[]> {
  const storage = getStorageArea();

  if (!storage) {
    return [];
  }

  const key = getPagesStorageKey(origin);

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const value = result[key] as Record<string, RawScanSnapshot> | undefined;
        resolveStorageValue([], resolve, value ? Object.values(value) : []);
      });
    } catch {
      resolve([]);
    }
  });
}

export async function upsertVisitedSiteSnapshot(
  snapshot: RawScanSnapshot
): Promise<RawScanSnapshot[]> {
  const storage = getStorageArea();

  if (!storage) {
    return [snapshot];
  }

  const key = getPagesStorageKey(snapshot.page.origin);
  const pageKey = snapshot.page.href;

  return new Promise((resolve) => {
    try {
      storage.get([key], (result) => {
        const existing = (result[key] as Record<string, RawScanSnapshot> | undefined) ?? {};
        const next = {
          ...existing,
          [pageKey]: snapshot
        };

        try {
          storage.set({ [key]: next }, () => {
            resolveStorageValue([snapshot], resolve, Object.values(next));
          });
        } catch {
          resolve([snapshot]);
        }
      });
    } catch {
      resolve([snapshot]);
    }
  });
}
