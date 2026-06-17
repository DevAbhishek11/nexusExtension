// Service Worker for NexTab Chrome Extension
// Handles background tasks, sync, and notifications

chrome?.runtime?.onInstalled?.addListener((details) => {
  if (details.reason === "install") {
    // First time install - set default settings flag
    chrome.storage.local.set({ firstInstall: true, installedAt: Date.now() });
    console.log("NexTab installed successfully!");
  }
});

// Listen for storage sync messages from tabs
chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_SETTINGS") {
    chrome.storage.sync.set(message.data, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.type === "GET_PREMIUM_STATUS") {
    chrome.storage.local.get(["isPremium"], (result) => {
      sendResponse({ isPremium: result.isPremium || false });
    });
    return true;
  }
});
