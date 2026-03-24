/**
 * loadingState.ts
 * Small pure helpers that keep Metis loading behavior deterministic across
 * launcher, mini panel, and full report surfaces.
 */
export function shouldReplayLoading(
  loadedRouteKey: string | null,
  routeKey: string | null
) {
  return Boolean(routeKey) && loadedRouteKey !== routeKey;
}

export function isSoftRefresh(
  previousSnapshotKey: string | null,
  nextSnapshotKey: string | null
) {
  if (!previousSnapshotKey || !nextSnapshotKey || previousSnapshotKey === nextSnapshotKey) {
    return false;
  }

  const previousRouteKey = previousSnapshotKey.split("::")[0];
  const nextRouteKey = nextSnapshotKey.split("::")[0];
  return previousRouteKey === nextRouteKey;
}
