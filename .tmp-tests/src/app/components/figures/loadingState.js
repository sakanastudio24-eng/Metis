"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldReplayLoading = shouldReplayLoading;
exports.isSoftRefresh = isSoftRefresh;
/**
 * loadingState.ts
 * Small pure helpers that keep Metis loading behavior deterministic across
 * launcher, mini panel, and full report surfaces.
 */
function shouldReplayLoading(loadedRouteKey, routeKey) {
    return Boolean(routeKey) && loadedRouteKey !== routeKey;
}
function isSoftRefresh(previousSnapshotKey, nextSnapshotKey) {
    if (!previousSnapshotKey || !nextSnapshotKey || previousSnapshotKey === nextSnapshotKey) {
        return false;
    }
    const previousRouteKey = previousSnapshotKey.split("::")[0];
    const nextRouteKey = nextSnapshotKey.split("::")[0];
    return previousRouteKey === nextRouteKey;
}
