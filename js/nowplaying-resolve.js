export const NOW_PLAYING_KEY = "nowPlaying";
export const NOW_PLAYING_MIN_KEY = "nowPlayingMinimized";
export const STALE_MS = 4000;
export const KEEP_MS = 60000;

export function hostFrom(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function usableArtwork(url) {
  if (!url) {
    return "";
  }
  if (!(url.startsWith("https://") || url.startsWith("http://") || url.startsWith("data:"))) {
    return "";
  }
  if (/favicon|ytm_logo|youtube_music_icon|\/img\/on_platform_logo|gstatic\.com\/youtube\/music/i.test(url)) {
    return "";
  }
  return url;
}

function isGenericTitle(title) {
  return !title || /^(youtube music|youtube|spotify|soundcloud|netflix|now playing)$/i.test(String(title).trim());
}

function isGenericArtist(artist) {
  return /^(music\.youtube\.com|youtube\.com|youtu\.be|open\.spotify\.com|spotify\.com)$/i.test(String(artist || "").trim());
}

export function stripSiteSuffix(title, url) {
  let clean = String(title || "").trim();
  clean = clean
    .replace(/\s+[·•|]\s+YouTube Music$/i, "")
    .replace(/\s+[-–—]\s+YouTube Music$/i, "")
    .replace(/\s+[-–—]\s+YouTube$/i, "")
    .replace(/\s+\|\s+Spotify$/i, "")
    .replace(/^Spotify\s+[–—-]\s+/i, "")
    .replace(/\s+[·•|]\s+SoundCloud$/i, "")
    .replace(/\s+\|\s+Free Listening on SoundCloud$/i, "")
    .replace(/\s+[-–—]\s+Twitch$/i, "")
    .replace(/\s+[-–—]\s+Netflix$/i, "")
    .trim();

  if (/spotify\.com/i.test(url) && clean.includes("•")) {
    const [song, artist] = clean.split("•").map((part) => part.trim());
    return { title: song || clean, artist: artist || hostFrom(url) };
  }

  if (/music\.youtube\.com/i.test(url)) {
    const bullet = clean.split(" • ");
    if (bullet.length >= 2) {
      return { title: bullet[0], artist: bullet.slice(1).join(" • ") };
    }
    const dash = clean.split(" - ");
    if (dash.length >= 2) {
      return { title: dash[0], artist: dash.slice(1).join(" - ") };
    }
  }

  return { title: clean, artist: hostFrom(url) };
}

function matchesTab(meta, tab) {
  if (!meta?.url || !tab?.url) {
    return false;
  }
  try {
    return new URL(meta.url).hostname === new URL(tab.url).hostname;
  } catch {
    return tab.url.startsWith(meta.url) || meta.url.startsWith(tab.url);
  }
}

export async function audibleTabs() {
  try {
    const tabs = await chrome.tabs.query({ audible: true });
    return tabs.filter((tab) => tab.audible && !tab.url?.startsWith("chrome-extension://"));
  } catch {
    return [];
  }
}

async function tabById(tabId) {
  if (!tabId) {
    return null;
  }
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

async function tabByUrl(url) {
  if (!url) {
    return null;
  }
  try {
    const origin = new URL(url).origin;
    const matches = await chrome.tabs.query({ url: [`${origin}/*`, origin, `${origin}/`] });
    return matches[0] || null;
  } catch {
    return null;
  }
}

async function tabForStored(stored, audible) {
  const pinned = await tabById(stored?.tabId);
  if (pinned) {
    return pinned;
  }
  if (stored) {
    const matched =
      audible.find((item) => matchesTab(stored, item)) ||
      audible.find((item) => hostFrom(item.url) === hostFrom(stored.url));
    if (matched) {
      return matched;
    }
    const byUrl = await tabByUrl(stored.url);
    if (byUrl) {
      return byUrl;
    }
  }
  return audible[audible.length - 1] || null;
}

export async function resolveNowPlaying() {
  const [tabs, storedWrap, minWrap] = await Promise.all([
    audibleTabs(),
    chrome.storage.session
      ? chrome.storage.session.get(NOW_PLAYING_KEY)
      : chrome.storage.local.get(NOW_PLAYING_KEY),
    chrome.storage.local.get(NOW_PLAYING_MIN_KEY),
  ]);
  const stored = storedWrap?.[NOW_PLAYING_KEY] || null;
  const minimized = Boolean(minWrap?.[NOW_PLAYING_MIN_KEY]);
  const age = stored ? Date.now() - Number(stored.updatedAt || 0) : Infinity;
  const tab = await tabForStored(stored, tabs);

  if (stored?.title && (tab || age < KEEP_MS)) {
    const parsed = stripSiteSuffix(stored.pageTitle || stored.title, stored.url || tab?.url || "");
    const title = isGenericTitle(stored.title) ? parsed.title : stored.title || parsed.title;
    const artist = isGenericArtist(stored.artist) ? parsed.artist : stored.artist || parsed.artist;
    return {
      track: {
        title: isGenericTitle(title) ? stored.title || parsed.title : title,
        artist: isGenericArtist(artist) ? "" : artist,
        artwork: usableArtwork(stored.artwork),
        url: stored.url || tab?.url || "",
        tabId: tab?.id || stored.tabId,
        windowId: tab?.windowId || stored.windowId,
        playing: age < 2500 ? Boolean(stored.playing) : Boolean(tab?.audible ?? stored.playing),
      },
      minimized,
    };
  }

  if (tab?.audible) {
    const parsed = stripSiteSuffix(tab.title, tab.url || "");
    if (isGenericTitle(parsed.title) && isGenericTitle(tab.title)) {
      return { track: null, minimized };
    }
    return {
      track: {
        title: parsed.title || tab.title || "Now playing",
        artist: isGenericArtist(parsed.artist) ? "" : parsed.artist,
        artwork: "",
        url: tab.url || "",
        tabId: tab.id,
        windowId: tab.windowId,
        playing: true,
      },
      minimized,
    };
  }

  return { track: null, minimized };
}
