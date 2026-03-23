// Keep the MV3 service worker minimal until Phase 3+ needs background coordination.
chrome.runtime.onInstalled.addListener(() => {
  console.info("[Metis] background service worker ready");
});
