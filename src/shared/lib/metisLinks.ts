/**
 * Keep public Metis links in one place so account and product handoffs do not drift
 * across the popup, side panel, report copy, and legal surfaces.
 */
const METIS_WEB_ORIGIN = "https://metis.zward.studio";
const METIS_API_ORIGIN = "https://metis.zward.studio";

export const METIS_SITE_URL = METIS_WEB_ORIGIN;

function buildExtensionAwareUrl(pathname: "/sign-in" | "/sign-up", extensionId?: string) {
  const url = new URL(pathname, METIS_WEB_ORIGIN);
  url.searchParams.set("source", "extension");

  if (extensionId) {
    url.searchParams.set("extensionId", extensionId);
  }

  return url.toString();
}

export const METIS_SIGN_IN_URL = buildExtensionAwareUrl("/sign-in");
export const METIS_SIGN_UP_URL = buildExtensionAwareUrl("/sign-up");
export const METIS_ACCOUNT_URL = `${METIS_WEB_ORIGIN}/account`;
export const METIS_PRIVACY_URL = `${METIS_WEB_ORIGIN}/privacy`;
export const METIS_TERMS_URL = `${METIS_WEB_ORIGIN}/terms`;
export const METIS_EXTENSION_VALIDATE_URL = `${METIS_API_ORIGIN}/v1/extension/validate`;
export const METIS_EVENTS_URL = `${METIS_API_ORIGIN}/api/events`;
export const METIS_SCAN_SUMMARY_URL = `${METIS_API_ORIGIN}/api/scan-summary`;
export const METIS_PREMIUM_REPORT_REQUEST_URL = `${METIS_API_ORIGIN}/api/premium-report-request`;
export const METIS_SITE_LABEL = "metis.zward.studio";
export const METIS_ACCOUNT_NAME = "Avery Hale";
export const METIS_ACCOUNT_EMAIL = "avery@metis.studio";

export function buildMetisSignInUrl(extensionId?: string) {
  return buildExtensionAwareUrl("/sign-in", extensionId);
}

export function buildMetisSignUpUrl(extensionId?: string) {
  return buildExtensionAwareUrl("/sign-up", extensionId);
}
