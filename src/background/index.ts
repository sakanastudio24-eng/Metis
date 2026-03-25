// background/index.ts now owns the trust-first beta runtime:
// Metis injects only after the user clicks the extension action.
chrome.runtime.onInstalled.addListener(() => {
  console.info("[Metis] background service worker ready");
});

function isRestrictedUrl(url?: string) {
  if (!url) {
    return true;
  }

  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

async function tryPingExistingInjection(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "METIS_PING" });
    return Boolean(response && typeof response === "object" && "ok" in response);
  } catch {
    return false;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    return;
  }

  const alreadyInjected = await tryPingExistingInjection(tab.id);

  if (alreadyInjected) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["assets/content.js"]
    });
  } catch (error) {
    console.error("[Metis] failed to inject into tab", error);
  }
});
