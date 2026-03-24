// background/index.ts is the minimal MV3 service worker entry.
// It currently exists only to prove the extension shell is healthy and installed.
chrome.runtime.onInstalled.addListener(() => {
  console.info("[Metis] background service worker ready");
});
