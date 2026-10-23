const input = document.querySelector("#siteUrl");
const status = document.querySelector("#status");
chrome.storage.sync.get({ siteUrl: "http://localhost:3000" }, values => { input.value = values.siteUrl; });
document.querySelector("#save").addEventListener("click", async () => {
  const siteUrl = input.value.trim().replace(/\/$/, "");
  if (!/^https?:\/\//.test(siteUrl)) { status.textContent = "Enter a complete website address."; return; }
  await chrome.storage.sync.set({ siteUrl }); status.textContent = "Saved";
});
