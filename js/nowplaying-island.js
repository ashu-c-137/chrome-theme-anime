(() => {
  if (window.__noirPulseIsland) {
    return;
  }
  window.__noirPulseIsland = true;

  const HOST_ID = "noir-pulse-now-playing-host";
  const isExtensionPage = location.protocol === "chrome-extension:";

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function mediaSite(url) {
    const host = hostOf(url);
    if (host === "youtu.be" || host === "m.youtube.com" || host === "youtube.com") {
      return "youtube.com";
    }
    return host;
  }

  function isVideoTrack(track) {
    if (track?.kind === "video") {
      return true;
    }
    const href = String(track?.url || "");
    if (/music\.youtube\.com/i.test(href)) {
      return false;
    }
    return /(?:youtube\.com|youtu\.be|netflix\.com|twitch\.tv|vimeo\.com)/i.test(href);
  }

  function isPlayingSourcePage(track) {
    if (isExtensionPage || !track?.url) {
      return false;
    }
    const here = mediaSite(location.href);
    const there = mediaSite(track.url);
    return Boolean(here && there && here === there);
  }

  const styles = `
    :host {
      all: initial;
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483646 !important;
      pointer-events: none !important;
    }
    .island {
      position: fixed;
      z-index: 2147483646;
      left: 50%;
      bottom: ${isExtensionPage ? "132px" : "56px"};
      transform: translate3d(-50%, 8px, 0);
      display: flex;
      align-items: center;
      gap: 10px;
      width: max-content;
      max-width: min(34rem, calc(100vw - 32px));
      padding: 7px 8px 7px 7px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      box-sizing: border-box;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.38);
      color: #ede6d6;
      font-family: "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      will-change: left, bottom, transform, width, height;
    }
    .island.is-ready {
      transition:
        left 0.5s cubic-bezier(0.22, 1.15, 0.36, 1),
        bottom 0.5s cubic-bezier(0.22, 1.15, 0.36, 1),
        transform 0.5s cubic-bezier(0.22, 1.15, 0.36, 1),
        width 0.45s cubic-bezier(0.22, 1.15, 0.36, 1),
        height 0.45s cubic-bezier(0.22, 1.15, 0.36, 1),
        padding 0.4s ease,
        gap 0.4s ease,
        border-radius 0.4s ease,
        opacity 0.28s ease,
        visibility 0.28s ease;
    }
    .island.is-live {
      opacity: 1;
      transform: translate3d(-50%, 0, 0);
      pointer-events: auto;
      visibility: visible;
    }
    :host-context(body.layout-edit) .island.is-live {
      outline: 1px dashed rgba(201, 163, 106, 0.62);
      outline-offset: 8px;
      cursor: grab;
    }
    .island.is-live.is-placed:not(.is-min) {
      left: var(--place-left, 50%);
      top: var(--place-top, auto);
      bottom: auto;
      transform: none;
    }
    .island.is-live.is-min {
      left: calc(100% - 16px);
      bottom: 16px;
      transform: translate3d(-100%, 0, 0);
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      max-width: 44px;
      max-height: 44px;
      padding: 0;
      gap: 0;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      overflow: hidden;
    }
    .disc {
      position: relative;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      border-radius: 50%;
      overflow: hidden;
      background: rgba(10, 10, 14, 0.45);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
      border: 0;
      padding: 0;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.78);
    }
    .island.is-min .disc {
      width: 44px;
      height: 44px;
      border-radius: 50%;
    }
    .art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .art.is-empty {
      display: none;
    }
    .note {
      position: absolute;
      inset: 11px;
      width: 20px;
      height: 20px;
    }
    .note .glyph-video {
      display: none;
    }
    .note.is-video .glyph-music {
      display: none;
    }
    .note.is-video .glyph-video {
      display: unset;
    }
    .art:not(.is-empty) ~ .note {
      display: none;
    }
    .copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 14rem;
      cursor: pointer;
      background: none;
      border: 0;
      padding: 0;
      color: inherit;
      text-align: left;
    }
    .kicker {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #c9a36a;
      line-height: 1;
    }
    .title, .artist {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .title {
      font-size: 14px;
      font-weight: 650;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .artist {
      font-size: 11px;
      color: rgba(237, 230, 214, 0.68);
      line-height: 1.2;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .ctrl {
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: rgba(237, 230, 214, 0.9);
      display: grid;
      place-items: center;
      cursor: pointer;
      padding: 0;
    }
    .ctrl:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .ctrl svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      pointer-events: none;
    }
    .disc svg {
      pointer-events: none;
    }
    .ctrl.play svg {
      width: 18px;
      height: 18px;
    }
    .copy, .controls, .min {
      overflow: hidden;
      max-width: 18rem;
      opacity: 1;
      transition: max-width 0.4s cubic-bezier(0.22, 1.15, 0.36, 1), opacity 0.22s ease, margin 0.4s ease;
    }
    .island.is-min .copy,
    .island.is-min .controls,
    .island.is-min .min {
      position: absolute;
      width: 0;
      height: 0;
      max-width: 0;
      max-height: 0;
      min-width: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      pointer-events: none;
      visibility: hidden;
    }
  `;

  function svg(path, view = "0 0 24 24") {
    return `<svg viewBox="${view}" aria-hidden="true"><path d="${path}"/></svg>`;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("data-noir-pulse-island", "true");
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${styles}</style>
    <div class="island" aria-hidden="true">
      <button type="button" class="disc" title="Expand">
        <img class="art is-empty" alt="">
        <svg class="note" viewBox="0 0 24 24" aria-hidden="true">
          <path class="glyph-music" fill="currentColor" d="M9 18.5a2.5 2.5 0 1 1-2-2.45V7.6l11-2.1v8.45a2.5 2.5 0 1 1-2-2.45V8.15L9 9.95z"/>
          <g class="glyph-video" fill="currentColor">
            <path d="M3.75 6.6A2.6 2.6 0 0 1 6.35 4h8.3A2.6 2.6 0 0 1 17.25 6.6v10.8a2.6 2.6 0 0 1-2.6 2.6h-8.3a2.6 2.6 0 0 1-2.6-2.6z"/>
            <path d="M18.4 8.35 21.5 6.2v11.6l-3.1-2.15z"/>
          </g>
        </svg>
      </button>
      <button type="button" class="copy" title="Jump to playing tab">
        <span class="kicker">Now playing</span>
        <span class="title"></span>
        <span class="artist"></span>
      </button>
      <div class="controls">
        <button type="button" class="ctrl prev" title="Previous">${svg("M6 6h2v12H6zm3.5 6 8.5 6V6z")}</button>
        <button type="button" class="ctrl play" title="Play">${svg("M8 5v14l11-7z")}</button>
        <button type="button" class="ctrl next" title="Next">${svg("M6 18l8.5-6L6 6v12zM16 6h2v12h-2z")}</button>
      </div>
      <button type="button" class="ctrl min" title="Minimise">${svg("M7 11h10v2H7z")}</button>
    </div>
  `;

  const root = shadow.querySelector(".island");
  const art = shadow.querySelector(".art");
  const titleEl = shadow.querySelector(".title");
  const artistEl = shadow.querySelector(".artist");
  const kickerEl = shadow.querySelector(".kicker");
  const note = shadow.querySelector(".note");
  const playBtn = shadow.querySelector(".play");
  const disc = shadow.querySelector(".disc");
  const copy = shadow.querySelector(".copy");

  const PLAY = svg("M8 5v14l11-7z");
  const PAUSE = svg("M6 5h4v14H6zm8 0h4v14h-4z");

  let lastKey = "";
  let hideTimer = 0;
  let islandEnabled = true;
  let placed = null;
  let placeDrag = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyPlaced() {
    if (!isExtensionPage || !placed || root.classList.contains("is-min")) {
      root.classList.remove("is-placed");
      root.style.removeProperty("--place-left");
      root.style.removeProperty("--place-top");
      return;
    }
    root.classList.add("is-placed");
    root.style.setProperty("--place-left", `${placed.x * 100}%`);
    root.style.setProperty("--place-top", `${placed.y * 100}%`);
  }

  async function readIslandEnabled() {
    try {
      const wrap = await chrome.storage.local.get(["features", "layout"]);
      islandEnabled = wrap.features?.island !== false;
      placed = wrap.layout?.island || null;
      applyPlaced();
    } catch {
      islandEnabled = true;
    }
  }

  function mount() {
    if (!document.documentElement.contains(host)) {
      (document.body || document.documentElement).append(host);
    }
  }

  function hideIsland() {
    window.clearTimeout(hideTimer);
    root.classList.remove("is-live", "is-min", "is-placed");
    root.setAttribute("aria-hidden", "true");
    lastKey = "";
  }

  function render(view) {
    const track = view?.track;
    const minimized = Boolean(view?.minimized);
    if (!islandEnabled || isPlayingSourcePage(track)) {
      hideIsland();
      return;
    }
    if (!track?.title) {
      hideIsland();
      return;
    }

    window.clearTimeout(hideTimer);
    const video = isVideoTrack(track);
    const key = `${track.title}|${track.artist}|${track.artwork}|${track.playing}|${video}|${minimized}`;
    root.classList.add("is-live");
    root.classList.toggle("is-min", minimized);
    applyPlaced();
    root.setAttribute("aria-hidden", "false");
    if (!root.classList.contains("is-ready")) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => root.classList.add("is-ready"));
      });
    }

    if (key === lastKey) {
      return;
    }
    lastKey = key;

    titleEl.textContent = track.title;
    kickerEl.textContent = video ? "Watching" : "Now playing";
    note.classList.toggle("is-video", video);
    artistEl.textContent = track.artist || "";
    artistEl.hidden = !track.artist;
    playBtn.innerHTML = track.playing ? PAUSE : PLAY;
    playBtn.title = track.playing ? "Pause" : "Play";

    if (track.artwork) {
      art.src = track.artwork;
      art.classList.remove("is-empty");
    } else {
      art.removeAttribute("src");
      art.classList.add("is-empty");
    }
  }

  function control(action) {
    if (!globalThis.chrome?.runtime?.sendMessage) {
      return;
    }
    chrome.runtime.sendMessage({ type: "nowPlaying:control", action }, (view) => {
      void chrome.runtime.lastError;
      if (view) {
        render(view);
      }
    });
  }

  function onControl(action, event) {
    if (document.body.classList.contains("layout-edit")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    control(action);
  }

  function refresh() {
    if (!globalThis.chrome?.runtime?.sendMessage) {
      return;
    }
    chrome.runtime.sendMessage({ type: "nowPlaying:get" }, (view) => {
      void chrome.runtime.lastError;
      render(view);
    });
  }

  art.addEventListener("error", () => {
    art.classList.add("is-empty");
    art.removeAttribute("src");
  });

  shadow.querySelector(".prev").addEventListener("click", (event) => onControl("prev", event));
  playBtn.addEventListener("click", (event) => {
    if (document.body.classList.contains("layout-edit")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const willPause = playBtn.title === "Pause";
    playBtn.innerHTML = willPause ? PLAY : PAUSE;
    playBtn.title = willPause ? "Play" : "Pause";
    onControl("toggle", event);
  });
  shadow.querySelector(".next").addEventListener("click", (event) => onControl("next", event));
  shadow.querySelector(".min").addEventListener("click", (event) => onControl("minimize", event));
  disc.addEventListener("click", (event) => {
    onControl(root.classList.contains("is-min") ? "expand" : "focus", event);
  });
  copy.addEventListener("click", (event) => onControl("focus", event));

  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (changes.nowPlaying || (area === "local" && changes.nowPlayingMinimized)) {
      refresh();
    }
    if (area === "local" && changes.features) {
      islandEnabled = changes.features.newValue?.island !== false;
      refresh();
    }
    if (area === "local" && changes.layout) {
      placed = changes.layout.newValue?.island || null;
      applyPlaced();
    }
  });

  if (isExtensionPage) {
    root.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("layout-edit") || event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const box = root.getBoundingClientRect();
      placeDrag = {
        pointer: event.pointerId,
        dx: event.clientX - box.left,
        dy: event.clientY - box.top,
        moved: false,
      };
      root.setPointerCapture(event.pointerId);
    });
    root.addEventListener("pointermove", (event) => {
      if (!placeDrag || event.pointerId !== placeDrag.pointer) {
        return;
      }
      placeDrag.moved = true;
      const width = root.offsetWidth || 80;
      const height = root.offsetHeight || 44;
      const left = Math.min(Math.max(8, event.clientX - placeDrag.dx), Math.max(8, window.innerWidth - width - 8));
      const top = Math.min(Math.max(8, event.clientY - placeDrag.dy), Math.max(8, window.innerHeight - height - 8));
      root.classList.add("is-placed");
      root.style.setProperty("--place-left", `${left}px`);
      root.style.setProperty("--place-top", `${top}px`);
    });
    const endPlace = async (event) => {
      if (!placeDrag || event.pointerId !== placeDrag.pointer) {
        return;
      }
      const moved = placeDrag.moved;
      try {
        root.releasePointerCapture(placeDrag.pointer);
      } catch {
        /* already released */
      }
      placeDrag = null;
      if (!moved) {
        return;
      }
      const box = root.getBoundingClientRect();
      placed = {
        x: Math.min(0.92, Math.max(0, box.left / window.innerWidth)),
        y: Math.min(0.92, Math.max(0, box.top / window.innerHeight)),
      };
      applyPlaced();
      try {
        const wrap = await chrome.storage.local.get("layout");
        await chrome.storage.local.set({
          layout: { ...(wrap.layout || {}), island: placed },
        });
      } catch {
        /* ignore */
      }
    };
    root.addEventListener("pointerup", endPlace);
    root.addEventListener("pointercancel", endPlace);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }

  readIslandEnabled().then(refresh);
  window.setInterval(refresh, 1500);
})();
