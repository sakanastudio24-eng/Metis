/**
 * Keep public Metis links in one place so account and product handoffs do not drift
 * across the popup, side panel, report copy, and legal surfaces.
 */
const METIS_WEB_ORIGIN = "http://localhost:3000";
const METIS_API_ORIGIN = "http://localhost:8000";

export const METIS_SITE_URL = METIS_WEB_ORIGIN;
export const METIS_SIGN_IN_URL = `${METIS_WEB_ORIGIN}/sign-in?source=extension`;
export const METIS_SIGN_UP_URL = `${METIS_WEB_ORIGIN}/sign-up?source=extension`;
export const METIS_ACCOUNT_URL = `${METIS_WEB_ORIGIN}/account`;
export const METIS_EXTENSION_VALIDATE_URL = `${METIS_API_ORIGIN}/v1/extension/validate`;
export const METIS_EVENTS_URL = `${METIS_API_ORIGIN}/api/events`;
export const METIS_SCAN_SUMMARY_URL = `${METIS_API_ORIGIN}/api/scan-summary`;
export const METIS_PREMIUM_REPORT_REQUEST_URL = `${METIS_API_ORIGIN}/api/premium-report-request`;
export const METIS_SITE_LABEL = "localhost:3000";
export const METIS_ACCOUNT_NAME = "Avery Hale";
export const METIS_ACCOUNT_EMAIL = "avery@metis.studio";
