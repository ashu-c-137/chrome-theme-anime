import { captureFirstNameFromTab } from "./profile-name.js";

function clearNowPlaying() {
  const tasks = [chrome.storage.local.remove(["nowPlaying", "nowPlayingMinimized"])];
  if (chrome.storage.session) {
    tasks.push(chrome.storage.session.remove("nowPlaying"));
  }
  return Promise.all(tasks).catch(() => {});
}

clearNowPlaying();

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete") {
    return;
  }
  captureFirstNameFromTab(tabId, tab?.url).catch(() => {});
});
