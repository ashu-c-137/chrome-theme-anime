const TYPE = "noir-pulse-now-playing";
const KEY = "nowPlaying";
const SOURCE = `${location.origin}${location.pathname}`;

function storage() {
  return globalThis.chrome?.storage?.session || globalThis.chrome?.storage?.local || null;
}

function sameSite(existing) {
  return existing?.hostname === location.hostname || existing?.source === SOURCE;
}

function isWeak(payload) {
  const title = String(payload?.title || "").trim();
  return !title || /^(youtube music|youtube|spotify|soundcloud|netflix)$/i.test(title);
}

async function publish(data) {
  const api = storage();
  if (!api) {
    return;
  }

  const payload = {
    title: String(data.title || ""),
    artist: String(data.artist || ""),
    album: String(data.album || ""),
    artwork: String(data.artwork || ""),
    playing: Boolean(data.playing),
    kind: data.kind === "video" ? "video" : "music",
    source: SOURCE,
    url: location.href,
    hostname: location.hostname,
    pageTitle: document.title,
    updatedAt: Date.now(),
  };

  const current = await api.get(KEY);
  const existing = current?.[KEY];

  if (payload.playing) {
    if (isWeak(payload) && sameSite(existing) && !isWeak(existing)) {
      await commit(api, {
        ...existing,
        playing: true,
        url: payload.url,
        pageTitle: payload.pageTitle,
        hostname: payload.hostname,
        source: SOURCE,
        updatedAt: Date.now(),
      });
      return;
    }
    if (
      sameSite(existing) &&
      existing?.title &&
      payload.title &&
      payload.title !== existing.title &&
      Date.now() - Number(existing.updatedAt || 0) < 2500
    ) {
      return;
    }
    await commit(api, {
      ...payload,
      tabId: existing?.tabId,
      windowId: existing?.windowId,
      kind: payload.kind || existing?.kind,
    });
    return;
  }

  if (sameSite(existing) || (!existing && payload.title)) {
    await commit(api, {
      ...existing,
      title: isWeak(payload) ? existing?.title || payload.title : payload.title || existing?.title,
      artist: payload.artist || existing?.artist,
      artwork: payload.artwork || existing?.artwork,
      playing: false,
      url: payload.url || existing?.url,
      pageTitle: payload.pageTitle || existing?.pageTitle,
      hostname: payload.hostname || existing?.hostname,
      source: SOURCE,
      kind: existing?.kind || payload.kind,
      updatedAt: Date.now(),
    });
  }
}

async function commit(api, value) {
  await api.set({ [KEY]: value });
  chrome.runtime.sendMessage({ type: "nowPlaying:bind", url: value.url, playing: value.playing }, () => {
    void chrome.runtime.lastError;
  });
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== TYPE || !event.data.data) {
    return;
  }
  const data = event.data.data;
  if (data.heartbeat) {
    return;
  }
  publish(data);
});
