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
    return !title || /^(youtube music|youtube|spotify|soundcloud|netflix|twitch)$/i.test(title.trim());
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

  function ogImage() {
    return (
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('link[rel="image_src"]')?.href ||
      ""
    );
  }

  function pageTitle() {
    let title = String(document.title || "").replace(/\s+/g, " ").trim();
    title = title
      .replace(/\s+[·•|]\s+YouTube Music$/i, "")
      .replace(/\s+[-–—]\s+YouTube Music$/i, "")
      .replace(/\s+[-–—]\s+YouTube$/i, "")
      .replace(/\s+\|\s+Spotify$/i, "")
      .replace(/\s+[·•|]\s+SoundCloud$/i, "")
      .replace(/\s+[-–—]\s+Twitch$/i, "")
      .replace(/\s+[-–—]\s+Netflix$/i, "")
      .replace(/\s+\|\s+Netflix$/i, "")
      .replace(/\s+[-–—]\s+Vimeo$/i, "")
      .trim();
    return isGenericTitle(title) ? "" : title;
  }

  function isMainMedia(el) {
    if (!el || el.paused || el.ended || el.readyState < 2) {
      return false;
    }
    if (el.tagName === "AUDIO") {
      return true;
    }
    const width = el.clientWidth || el.videoWidth || 0;
    const height = el.clientHeight || el.videoHeight || 0;
    return width * height >= 160 * 90 || Boolean(document.pictureInPictureElement === el);
  }

  function primaryMedia() {
    const live = [...document.querySelectorAll("video, audio")].filter(isMainMedia);
    live.sort((a, b) => (b.clientWidth * b.clientHeight || 0) - (a.clientWidth * a.clientHeight || 0));
    return live[0] || (document.pictureInPictureElement || null);
  }

  function mediaPlaying() {
    return Boolean(primaryMedia());
  }

  function playingVideo() {
    const el = primaryMedia();
    return Boolean(el && el.tagName === "VIDEO");
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
    return { title, artist, artwork, kind: "music" };
  }

  function youtubeFromDom() {
    if (!/(^|\.)youtube\.com$/.test(location.hostname) || /(^|\.)music\.youtube\.com$/.test(location.hostname)) {
      return null;
    }
    const title =
      textOf(document.querySelector("h1.ytd-watch-metadata yt-formatted-string")) ||
      textOf(document.querySelector("ytd-watch-metadata #title yt-formatted-string")) ||
      textOf(document.querySelector("#title h1 yt-formatted-string")) ||
      textOf(document.querySelector("h1.ytd-video-primary-info-renderer")) ||
      textOf(document.querySelector(".ytp-title-link"));
    const artist =
      textOf(document.querySelector("ytd-video-owner-renderer #channel-name a")) ||
      textOf(document.querySelector("ytd-channel-name a")) ||
      textOf(document.querySelector("#owner #channel-name a")) ||
      textOf(document.querySelector("#upload-info #channel-name a"));
    if (isGenericTitle(title)) {
      return null;
    }
    return { title, artist, artwork: ogImage(), kind: "video" };
  }

  function ytMusicIsPlaying() {
    const btn = document.querySelector(
      [
        "ytmusic-player-bar #play-pause-button",
        "ytmusic-player-bar .play-pause-button",
        "ytmusic-player-bar tp-yt-paper-icon-button.play-pause-button",
        "ytmusic-player-bar ytmusic-play-button-renderer",
      ].join(", ")
    );
    if (!btn) {
      return null;
    }
    const inner = btn.shadowRoot?.querySelector("button, [role='button']") || btn;
    const icon = btn.querySelector("yt-icon, .yt-icon") || inner.querySelector?.("yt-icon, .yt-icon");
    const label = [
      btn.getAttribute("title"),
      btn.getAttribute("aria-label"),
      inner.getAttribute?.("title"),
      inner.getAttribute?.("aria-label"),
      icon?.getAttribute?.("icon"),
      icon?.icon,
    ]
      .filter(Boolean)
      .join(" ");
    if (/pause/i.test(label)) {
      return true;
    }
    if (/play/i.test(label)) {
      return false;
    }
    if (btn.getAttribute("aria-pressed") === "true" || inner.getAttribute?.("aria-pressed") === "true") {
      return true;
    }
    if (btn.getAttribute("aria-pressed") === "false" || inner.getAttribute?.("aria-pressed") === "false") {
      return false;
    }
    return null;
  }

  function snapshot() {
    const metadata = navigator.mediaSession?.metadata;
    const playbackState = navigator.mediaSession?.playbackState || "";
    const elementPlaying = mediaPlaying();
    const ytmPlay = ytMusicIsPlaying();
    const playing =
      ytmPlay ??
      (playbackState === "paused"
        ? false
        : playbackState === "playing"
          ? true
          : elementPlaying);
    const fromMusic = ytMusicFromDom();
    const fromVideo = youtubeFromDom();
    const sessionTitle = metadata?.title || "";
    const fallbackTitle = pageTitle();
    const title =
      (fromMusic?.title && !isGenericTitle(fromMusic.title) ? fromMusic.title : "") ||
      (fromVideo?.title && !isGenericTitle(fromVideo.title) ? fromVideo.title : "") ||
      (!isGenericTitle(sessionTitle) ? sessionTitle : "") ||
      fallbackTitle;
    const artist = fromMusic?.artist || fromVideo?.artist || metadata?.artist || "";
    const artwork = fromMusic?.artwork || fromVideo?.artwork || artworkSrc(metadata) || ogImage();
    const kind = fromMusic ? "music" : playingVideo() || fromVideo ? "video" : "music";
    return {
      title,
      artist,
      album: metadata?.album || "",
      artwork,
      playbackState,
      playing,
      kind,
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
  window.addEventListener("yt-navigate-finish", () => {
    last = "";
    publish();
  });

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

  const watch = () => {
    const musicBar = document.querySelector("ytmusic-player-bar");
    if (musicBar) {
      observe(musicBar);
      musicBar.querySelectorAll(
        "yt-formatted-string.title, yt-formatted-string.byline, .title, .byline, #play-pause-button, .play-pause-button"
      ).forEach((item) => {
        observe(item);
        if (item.shadowRoot) {
          observe(item.shadowRoot);
        }
      });
    }
    document.querySelectorAll("ytd-watch-metadata, #title.ytd-watch-metadata, h1.ytd-watch-metadata").forEach(observe);
  };

  watch();
  setInterval(() => {
    watch();
    publish();
  }, 800);
  publish();
})();
