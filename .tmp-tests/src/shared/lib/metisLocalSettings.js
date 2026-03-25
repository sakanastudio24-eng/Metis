"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_METIS_SETTINGS = void 0;
exports.getMetisLocalSettings = getMetisLocalSettings;
exports.saveMetisLocalSettings = saveMetisLocalSettings;
const STORAGE_KEY = "metis:settings";
exports.DEFAULT_METIS_SETTINGS = {
    preferredScanScope: "single",
    refreshMode: "smart",
    motionPreference: "full",
    attachedReport: true,
    showSampleProgress: true
};
function getChromeRuntime() {
    const runtime = globalThis;
    return runtime.chrome ?? null;
}
function getStorageArea() {
    const chromeRuntime = getChromeRuntime();
    try {
        if (!chromeRuntime?.runtime?.id) {
            return null;
        }
        return chromeRuntime.storage?.local ?? null;
    }
    catch {
        return null;
    }
}
function resolveStorageValue(fallback, resolve, value) {
    const chromeRuntime = getChromeRuntime();
    try {
        if (chromeRuntime?.runtime?.lastError) {
            resolve(fallback);
            return;
        }
    }
    catch {
        resolve(fallback);
        return;
    }
    resolve(value);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isMetisRefreshMode(value) {
    return value === "smart" || value === "steady";
}
function isMetisMotionPreference(value) {
    return value === "full" || value === "reduced";
}
function isScanScope(value) {
    return value === "single" || value === "multi";
}
function normalizeSettings(value) {
    if (!isRecord(value)) {
        return exports.DEFAULT_METIS_SETTINGS;
    }
    return {
        preferredScanScope: isScanScope(value.preferredScanScope)
            ? value.preferredScanScope
            : exports.DEFAULT_METIS_SETTINGS.preferredScanScope,
        refreshMode: isMetisRefreshMode(value.refreshMode)
            ? value.refreshMode
            : exports.DEFAULT_METIS_SETTINGS.refreshMode,
        motionPreference: isMetisMotionPreference(value.motionPreference)
            ? value.motionPreference
            : exports.DEFAULT_METIS_SETTINGS.motionPreference,
        attachedReport: typeof value.attachedReport === "boolean"
            ? value.attachedReport
            : exports.DEFAULT_METIS_SETTINGS.attachedReport,
        showSampleProgress: typeof value.showSampleProgress === "boolean"
            ? value.showSampleProgress
            : exports.DEFAULT_METIS_SETTINGS.showSampleProgress
    };
}
async function getMetisLocalSettings() {
    const storage = getStorageArea();
    if (!storage) {
        return exports.DEFAULT_METIS_SETTINGS;
    }
    return new Promise((resolve) => {
        try {
            storage.get([STORAGE_KEY], (result) => {
                resolveStorageValue(exports.DEFAULT_METIS_SETTINGS, resolve, normalizeSettings(result[STORAGE_KEY]));
            });
        }
        catch {
            resolve(exports.DEFAULT_METIS_SETTINGS);
        }
    });
}
async function saveMetisLocalSettings(nextSettings) {
    const storage = getStorageArea();
    const mergedSettings = {
        ...(await getMetisLocalSettings()),
        ...nextSettings
    };
    if (!storage) {
        return mergedSettings;
    }
    await new Promise((resolve) => {
        try {
            storage.set({ [STORAGE_KEY]: mergedSettings }, () => {
                resolveStorageValue(undefined, resolve, undefined);
            });
        }
        catch {
            resolve();
        }
    });
    return mergedSettings;
}
