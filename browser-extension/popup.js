const byId = id => document.querySelector(`#${id}`);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
document.querySelector("#settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelector("#saveFolder").addEventListener("click", async () => {
  const grade = Number(byId("grade").value);
  const moduleTitle = byId("module").value.trim();
  const chapterTitle = byId("chapter").value.trim();
  const exerciseTitle = byId("exercise").value.trim();
  const activityTitle = byId("activity").value.trim();
  if (grade < 3 || grade > 12 || !moduleTitle || !chapterTitle || !exerciseTitle || !activityTitle) { byId("status").textContent = "Complete every folder field."; return; }
  await chrome.storage.local.set({ pendingLocation: { grade, moduleId: slug(moduleTitle), moduleTitle, chapterId: slug(chapterTitle), chapterTitle, exerciseId: slug(exerciseTitle), exerciseTitle, activityId: slug(activityTitle), activityTitle } });
  byId("status").textContent = "The next result will be saved in this folder.";
});
chrome.storage.local.get("pendingLocation", ({ pendingLocation }) => {
  if (!pendingLocation) return;
  byId("grade").value = pendingLocation.grade || ""; byId("module").value = pendingLocation.moduleTitle || ""; byId("chapter").value = pendingLocation.chapterTitle || ""; byId("exercise").value = pendingLocation.exerciseTitle || ""; byId("activity").value = pendingLocation.activityTitle || "";
});
