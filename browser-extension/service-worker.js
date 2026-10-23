const DEFAULT_SITE = "http://localhost:3000";

function encodePayload(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "WAYGROUND_RESULT") return;
  (async () => {
    const { siteUrl = DEFAULT_SITE } = await chrome.storage.sync.get("siteUrl");
    const payload = encodePayload(message.result);
    await chrome.storage.local.set({ lastCapture: message.result, lastCaptureAt: Date.now() });
    await chrome.tabs.create({ url: `${siteUrl.replace(/\/$/, "")}/dashboard/reports/import#result=${payload}` });
    sendResponse({ ok: true });
  })().catch(error => sendResponse({ ok: false, error: String(error) }));
  return true;
});
