let whitelist = [];

// Load cached whitelist
async function loadWhitelistFromStorage() {
  const result = await browser.storage.local.get("cachedWhitelist");
  if (result.cachedWhitelist) {
    whitelist = result.cachedWhitelist;
    console.log("Loaded whitelist from local cache:", whitelist);
  } else {
    console.log("No local whitelist found.");
  }
}

// Fetch whitelist from your server
async function fetchWhitelistFromServer() {
  try {
    const { whitelistUrl } = await browser.storage.local.get("whitelistUrl");
    const url = whitelistUrl || "https://example.com/default-whitelist.json"; // fallback
    const response = await fetch(url);
    const fetched = await response.json();
    whitelist = fetched;
    console.log("Fetched whitelist from server:", whitelist);
    await browser.storage.local.set({ cachedWhitelist: whitelist });
  } catch (error) {
    console.error("Failed to fetch whitelist from server. Using cached version if available.", error);
  }
}

// Listen for requests from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getWhitelist") {
    sendResponse({ whitelist });
  } else if (message.type === "refreshWhitelist") {
    fetchWhitelistFromServer().then(() => sendResponse({ success: true }));
    return true; // Required to use sendResponse asynchronously
  }
});

// Initial loading
loadWhitelistFromStorage().then(fetchWhitelistFromServer);

// Optional: Refresh every hour
setInterval(fetchWhitelistFromServer, 60 * 60 * 1000);

// Inject script on message display
browser.messageDisplay.onMessageDisplayed.addListener(async (tab, message) => {
  try {
    await browser.tabs.executeScript(tab.id, { file: "inject.js" });
  } catch (e) {
    console.error("Injection error:", e);
  }
});