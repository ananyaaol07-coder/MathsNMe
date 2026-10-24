(() => {
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (data?.type !== "MATHSNME_SET_WAYGROUND_LOCATION" || !data.requestId || !data.location) return;
    chrome.runtime.sendMessage({ type: "SET_PENDING_LOCATION", location: data.location }, response => {
      if (chrome.runtime.lastError || !response?.ok) return;
      window.dispatchEvent(new CustomEvent("mathsnme-wayground-location-saved", { detail: { requestId: data.requestId } }));
    });
  });
})();
