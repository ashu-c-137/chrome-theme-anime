import { NOW_PLAYING_KEY, NOW_PLAYING_MIN_KEY, resolveNowPlaying } from "./nowplaying-resolve.js";

const NEXT_SELECTORS = [
  "ytmusic-player-bar #next-button",
  "ytmusic-player-bar .next-button",
  "ytmusic-player-bar [aria-label='Next']",
  ".ytp-next-button",
  "[data-testid='control-button-skip-forward']",
  "[aria-label='Next']",
  "[aria-label='Next song']",
  "[aria-label='Next track']",
  ".next-button",
];

const PREV_SELECTORS = [
  "ytmusic-player-bar #previous-button",
  "ytmusic-player-bar .previous-button",
  "ytmusic-player-bar [aria-label='Previous']",
  ".ytp-prev-button",
  "[data-testid='control-button-skip-back']",
  "[aria-label='Previous']",
  "[aria-label='Previous song']",
  "[aria-label='Previous track']",
  ".previous-button",
];

function pageClickFirst(selectors) {
  const clickNode = (node) => {
    const inner = node.shadowRoot?.querySelector("button, [role='button']") || node;
    inner.click();
  };
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node) {
      clickNode(node);
      return true;
    }
  }
  return false;
}

function pageToggleMedia() {
  const clickNode = (node) => {
    const inner = node.shadowRoot?.querySelector("button, [role='button']") || node;
    inner.click();
  };
  const ytm = document.querySelector(
    [
      "ytmusic-player-bar #play-pause-button",
      "ytmusic-player-bar .play-pause-button",
      "ytmusic-player-bar tp-yt-paper-icon-button.play-pause-button",
      "ytmusic-player-bar ytmusic-play-button-renderer",
    ].join(", ")
  );
  if (ytm) {
    const label = `${ytm.getAttribute("title") || ""} ${ytm.getAttribute("aria-label") || ""}`;
    const wasPlaying = /pause/i.test(label) || ytm.getAttribute("aria-pressed") === "true";
    clickNode(ytm);
    return { playing: !wasPlaying };
  }

  const playSelectors = [
    ".ytp-play-button",
    "[data-testid='control-button-playpause']",
    "[aria-label='Pause']",
    "[aria-label='Play']",
  ];
  for (const selector of playSelectors) {
    const node = document.querySelector(selector);
    if (node) {
      const label = `${node.getAttribute("title") || ""} ${node.getAttribute("aria-label") || ""}`;
      const wasPlaying = /pause/i.test(label);
      clickNode(node);
      return { playing: !wasPlaying };
    }
  }

  const media = [...document.querySelectorAll("video, audio")];
  const playingEl = media.find((el) => !el.paused && !el.ended);
  if (playingEl) {
    playingEl.pause();
    return { playing: false };
  }
  const paused = media.find((el) => el.paused && el.readyState > 0) || media[0];
  if (paused) {
    paused.play()?.catch(() => {});
    return { playing: true };
  }
  return { playing: null };
}

function storageApi() {
  return chrome.storage.session || chrome.storage.local;
}

async function runInTab(tabId, func, args = []) {
  if (!tabId) {
    return null;
  }
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func,
      args,
    });
    return results?.[0]?.result ?? null;
  } catch {
    return null;
  }
}

async function bindPlayingTab(tab) {
  if (!tab?.id) {
    return;
  }
  const api = storageApi();
  const storedWrap = await api.get(NOW_PLAYING_KEY);
  const stored = storedWrap?.[NOW_PLAYING_KEY];
  if (!stored || stored.tabId === tab.id) {
    return;
  }
  await api.set({
    [NOW_PLAYING_KEY]: {
      ...stored,
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url || stored.url,
    },
  });
}

async function handleControl(action) {
  const view = await resolveNowPlaying();
  const tabId = view.track?.tabId;

  if (action === "minimize") {
    await chrome.storage.local.set({ [NOW_PLAYING_MIN_KEY]: true });
    return resolveNowPlaying();
  }
  if (action === "expand") {
    await chrome.storage.local.set({ [NOW_PLAYING_MIN_KEY]: false });
    return resolveNowPlaying();
  }
  if (action === "focus" && tabId) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      if (view.track.windowId) {
        await chrome.windows.update(view.track.windowId, { focused: true });
      }
    } catch {
      /* tab may have closed */
    }
    return view;
  }
  if (action === "toggle") {
    const result = await runInTab(tabId, pageToggleMedia);
    const playing = typeof result?.playing === "boolean" ? result.playing : !view.track?.playing;
    const api = storageApi();
    const storedWrap = await api.get(NOW_PLAYING_KEY);
    const stored = storedWrap?.[NOW_PLAYING_KEY];
    const next = stored
      ? { ...stored, playing, tabId: tabId || stored.tabId, updatedAt: Date.now() }
      : view.track
        ? {
            title: view.track.title,
            artist: view.track.artist || "",
            artwork: view.track.artwork || "",
            playing,
            url: view.track.url || "",
            pageTitle: view.track.title || "",
            tabId,
            windowId: view.track.windowId,
            updatedAt: Date.now(),
          }
        : null;
    if (next) {
      await api.set({ [NOW_PLAYING_KEY]: next });
    }
    return resolveNowPlaying();
  }
  if (action === "next") {
    await runInTab(tabId, pageClickFirst, [NEXT_SELECTORS]);
    return resolveNowPlaying();
  }
  if (action === "prev") {
    await runInTab(tabId, pageClickFirst, [PREV_SELECTORS]);
    return resolveNowPlaying();
  }
  return view;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "nowPlaying:get") {
    resolveNowPlaying().then(sendResponse).catch(() => sendResponse({ track: null, minimized: false }));
    return true;
  }
  if (message?.type === "nowPlaying:bind") {
    bindPlayingTab(sender.tab)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message?.type === "nowPlaying:control") {
    handleControl(message.action)
      .then(sendResponse)
      .catch(() => sendResponse({ track: null, minimized: false }));
    return true;
  }
  return false;
});
