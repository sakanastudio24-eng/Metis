import {
  DEFAULT_METIS_SESSION_UI_STATE,
  type MetisTabSessionState,
  type MetisSessionUiState
} from "../types/runtime";

const METIS_TAB_SESSIONS_KEY = "metisTabSessions";

type StoredMetisTabSessions = Record<string, MetisTabSessionState>;

function getEmptySessions(): StoredMetisTabSessions {
  return {};
}

async function getStoredSessions(): Promise<StoredMetisTabSessions> {
  const storage = await chrome.storage.session.get(METIS_TAB_SESSIONS_KEY);
  return (storage[METIS_TAB_SESSIONS_KEY] as StoredMetisTabSessions | undefined) ?? getEmptySessions();
}

async function setStoredSessions(sessions: StoredMetisTabSessions) {
  await chrome.storage.session.set({
    [METIS_TAB_SESSIONS_KEY]: sessions
  });
}

export async function getMetisTabSessions(): Promise<StoredMetisTabSessions> {
  return getStoredSessions();
}

export async function getMetisTabSession(tabId: number): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  return sessions[String(tabId)] ?? null;
}

export async function upsertMetisTabSession(
  tabId: number,
  updater: (current: MetisTabSessionState | null) => MetisTabSessionState
): Promise<MetisTabSessionState> {
  const sessions = await getStoredSessions();
  const nextSession = updater(sessions[String(tabId)] ?? null);

  sessions[String(tabId)] = nextSession;
  await setStoredSessions(sessions);

  return nextSession;
}

export async function patchMetisTabSession(
  tabId: number,
  patch: Partial<MetisTabSessionState>
): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  const current = sessions[String(tabId)];

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

  sessions[String(tabId)] = next;
  await setStoredSessions(sessions);
  return next;
}

export async function patchMetisTabSessionUiState(
  tabId: number,
  patch: Partial<MetisSessionUiState>
): Promise<MetisTabSessionState | null> {
  const sessions = await getStoredSessions();
  const current = sessions[String(tabId)];

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

  sessions[String(tabId)] = next;
  await setStoredSessions(sessions);
  return next;
}

export async function removeMetisTabSession(tabId: number) {
  const sessions = await getStoredSessions();
  delete sessions[String(tabId)];
  await setStoredSessions(sessions);
}
