import {
  DEFAULT_METIS_SESSION_UI_STATE,
  type MetisTabSessionState,
  type MetisSessionUiState
} from "../types/runtime";
import { getDefaultMetisAccessState } from "./metisAuthSession";
import { getDefaultMetisSiteAccessState } from "./siteAccess";
import {
  LEGACY_METIS_TAB_SESSIONS_KEY,
  METIS_RUNTIME_SESSION_KEY
} from "./metisStorageKeys";

type SessionStorageLike = {
  get: (keys: string | string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type StoredRuntimeSession = {
  tabs: Record<string, MetisTabSessionState>;
};

function getEmptySessions(): StoredRuntimeSession {
  return {
    tabs: {}
  };
}

function normalizeSession(session: MetisTabSessionState): MetisTabSessionState {
  return {
    ...session,
    accessState: session.accessState ?? getDefaultMetisAccessState(),
    siteAccess: session.siteAccess ?? getDefaultMetisSiteAccessState(),
    connectedAccount: session.connectedAccount ?? null,
    uiState: {
      ...DEFAULT_METIS_SESSION_UI_STATE,
      ...session.uiState
    }
  };
}

function getChromeSessionStorage(): SessionStorageLike | null {
  const chromeLike = globalThis as typeof globalThis & {
    chrome?: {
      storage?: {
        session?: SessionStorageLike;
      };
    };
  };

  return chromeLike.chrome?.storage?.session ?? null;
}

async function getStoredSessions(): Promise<StoredRuntimeSession> {
  const sessionStorage = getChromeSessionStorage();

  if (!sessionStorage) {
    return getEmptySessions();
  }

  const storage = await sessionStorage.get([
    METIS_RUNTIME_SESSION_KEY,
    LEGACY_METIS_TAB_SESSIONS_KEY
  ]);
  const current = storage[METIS_RUNTIME_SESSION_KEY] as StoredRuntimeSession | undefined;

  if (current?.tabs) {
    return {
      tabs: Object.fromEntries(
        Object.entries(current.tabs).map(([tabId, session]) => [tabId, normalizeSession(session)])
      )
    };
  }

  const legacyTabs = storage[LEGACY_METIS_TAB_SESSIONS_KEY] as Record<string, MetisTabSessionState> | undefined;

  if (legacyTabs) {
    const migrated: StoredRuntimeSession = {
      tabs: Object.fromEntries(
        Object.entries(legacyTabs).map(([tabId, session]) => [tabId, normalizeSession(session)])
      )
    };

    await sessionStorage.set({
      [METIS_RUNTIME_SESSION_KEY]: migrated
    });

    return migrated;
  }

  return getEmptySessions();
}

async function setStoredSessions(sessions: StoredRuntimeSession) {
  const sessionStorage = getChromeSessionStorage();

  if (!sessionStorage) {
    return;
  }

  await sessionStorage.set({
    [METIS_RUNTIME_SESSION_KEY]: sessions
  });
}

export async function getMetisTabSessions(): Promise<Record<string, MetisTabSessionState>> {
  const sessions = await getStoredSessions();
  return sessions.tabs;
}

export async function getMetisTabSession(tabId: number): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  return sessions.tabs[String(tabId)] ?? null;
}

export async function upsertMetisTabSession(
  tabId: number,
  updater: (current: MetisTabSessionState | null) => MetisTabSessionState
): Promise<MetisTabSessionState> {
  const sessions = await getStoredSessions();
  const nextSession = normalizeSession(updater(sessions.tabs[String(tabId)] ?? null));

  sessions.tabs[String(tabId)] = nextSession;
  await setStoredSessions(sessions);

  return nextSession;
}

export async function patchMetisTabSession(
  tabId: number,
  patch: Partial<MetisTabSessionState>
): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  const current = sessions.tabs[String(tabId)];

  if (!current) {
    return null;
  }

  const next: MetisTabSessionState = {
    ...current,
    ...patch,
    uiState: {
      ...DEFAULT_METIS_SESSION_UI_STATE,
      ...current.uiState,
      ...patch.uiState
    }
  };

  sessions.tabs[String(tabId)] = normalizeSession(next);
  await setStoredSessions(sessions);
  return sessions.tabs[String(tabId)];
}

export async function patchMetisTabSessionUiState(
  tabId: number,
  patch: Partial<MetisSessionUiState>
): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  const current = sessions.tabs[String(tabId)];

  if (!current) {
    return null;
  }

  const next: MetisTabSessionState = {
    ...current,
    uiState: {
      ...DEFAULT_METIS_SESSION_UI_STATE,
      ...current.uiState,
      ...patch
    }
  };

  sessions.tabs[String(tabId)] = normalizeSession(next);
  await setStoredSessions(sessions);
  return sessions.tabs[String(tabId)];
}

export async function removeMetisTabSession(tabId: number) {
  const sessions = await getStoredSessions();
  delete sessions.tabs[String(tabId)];
  await setStoredSessions(sessions);
}
