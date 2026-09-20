(() => {
  const TYPE = "noir-pulse-now-playing";
  let last = "";

  function textOf(node) {
    if (!node) {
      return "";
    }
    const chunks = /yt-formatted-string/i.test(node.tagName || "")
      ? [node.shadowRoot?.textContent, node.textContent, node.getAttribute?.("title")]
      : [node.textContent, node.shadowRoot?.textContent, node.getAttribute?.("aria-label"), node.getAttribute?.("title")];
    for (const chunk of chunks) {
      const text = String(chunk || "").replace(/\s+/g, " ").trim();
      if (text) {
        return text;
      }
    }
    return "";
  }

  function isGenericTitle(title) {
    return !title || /^(youtube music|youtube|spotify|soundcloud|netflix)$/i.test(title.trim());
  }

  function artworkSrc(metadata) {
    const art = metadata?.artwork;
    if (!Array.isArray(art) || art.length === 0) {
      return "";
    }
    const ranked = [...art].sort((a, b) => {
      const sizeA = Number.parseInt(String(a.sizes || "0").split("x")[0], 10) || 0;
      const sizeB = Number.parseInt(String(b.sizes || "0").split("x")[0], 10) || 0;
      return sizeB - sizeA;
    });
    return ranked[0]?.src || "";
  }

  function mediaPlaying() {
    for (const el of document.querySelectorAll("video, audio")) {
      if (!el.paused && !el.ended && el.readyState >= 2) {
        return true;
      }
    }
    return Boolean(document.pictureInPictureElement);
  }

  function ytMusicFromDom() {
    if (!/(^|\.)music\.youtube\.com$/.test(location.hostname)) {
      return null;
    }
    const bar = document.querySelector("ytmusic-player-bar");
    const title =
      textOf(bar?.querySelector(".content-info-wrapper yt-formatted-string.title")) ||
      textOf(bar?.querySelector("yt-formatted-string.title")) ||
      textOf(bar?.querySelector(".title")) ||
      textOf(document.querySelector("ytmusic-player-bar .title"));
    const byline =
      textOf(bar?.querySelector(".content-info-wrapper yt-formatted-string.byline")) ||
      textOf(bar?.querySelector("yt-formatted-string.byline")) ||
      textOf(bar?.querySelector(".byline")) ||
      textOf(document.querySelector("ytmusic-player-bar .byline"));
    const img =
      bar?.querySelector(".image") ||
      bar?.querySelector("img") ||
      document.querySelector("ytmusic-player-bar img");
    const artwork = img?.currentSrc || img?.src || "";
    const artist = byline.split("•")[0].trim();
    if (isGenericTitle(title)) {
      return null;
    }
    return { title, artist, artwork };
  }

  function ytMusicIsPlaying() {
    const btn = document.querySelector(
      "ytmusic-player-bar #play-pause-button, ytmusic-player-bar .play-pause-button, ytmusic-player-bar tp-yt-paper-icon-button.play-pause-button"
    );
    const label = `${btn?.getAttribute("title") || ""} ${btn?.getAttribute("aria-label") || ""}`;
    if (/pause/i.test(label)) {
      return true;
    }
    if (/play/i.test(label) && !/pause/i.test(label)) {
      return false;
    }
    return null;
  }

  function snapshot() {
    const metadata = navigator.mediaSession?.metadata;
    const playbackState = navigator.mediaSession?.playbackState || "";
    const elementPlaying = mediaPlaying();
    const ytmPlay = ytMusicIsPlaying();
    const hasMedia = document.querySelectorAll("video, audio").length > 0;
    const playing = hasMedia
      ? elementPlaying
      : ytmPlay ?? (playbackState === "playing" || (playbackState !== "paused" && elementPlaying));
    const fromDom = ytMusicFromDom();
    const sessionTitle = metadata?.title || "";
    const title =
      (fromDom?.title && !isGenericTitle(fromDom.title) ? fromDom.title : "") ||
      (!isGenericTitle(sessionTitle) ? sessionTitle : "");
    const artist = fromDom?.artist || metadata?.artist || "";
    const artwork = fromDom?.artwork || artworkSrc(metadata);
    return {
      title,
      artist,
      album: metadata?.album || "",
      artwork,
      playbackState,
      playing,
    };
  }

  function publish() {
    const data = snapshot();
    const encoded = JSON.stringify(data);
    if (encoded === last) {
      window.postMessage({ type: TYPE, data: { ...data, heartbeat: true } }, "*");
      return;
    }
    last = encoded;
    window.postMessage({ type: TYPE, data }, "*");
  }

  document.addEventListener("play", publish, true);
  document.addEventListener("pause", publish, true);
  document.addEventListener("playing", publish, true);
  document.addEventListener("ended", publish, true);
  document.addEventListener("loadedmetadata", () => {
    last = "";
    publish();
  }, true);
  document.addEventListener("emptied", () => {
    last = "";
    publish();
  }, true);

  const bar = () => document.querySelector("ytmusic-player-bar");
  const watch = () => {
    const node = bar();
    if (!node) {
      return;
    }
    const observe = (target) => {
      if (!target || target.__noirPulseObserved) {
        return;
      }
      target.__noirPulseObserved = true;
      new MutationObserver(publish).observe(target, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
    };
    observe(node);
    node.querySelectorAll("yt-formatted-string.title, yt-formatted-string.byline, .title, .byline").forEach((item) => {
      observe(item);
      if (item.shadowRoot) {
        observe(item.shadowRoot);
      }
    });
  };

  watch();
  setInterval(() => {
    watch();
    publish();
  }, 800);
  publish();
})();
