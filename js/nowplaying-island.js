(() => {
  if (window.__noirPulseIsland) {
    return;
  }
  window.__noirPulseIsland = true;

  const HOST_ID = "noir-pulse-now-playing-host";
  const isExtensionPage = location.protocol === "chrome-extension:";

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
        <svg class="note" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 18.5a2.5 2.5 0 1 1-2-2.45V7.6l11-2.1v8.45a2.5 2.5 0 1 1-2-2.45V8.15L9 9.95z"/></svg>
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
  const playBtn = shadow.querySelector(".play");
  const disc = shadow.querySelector(".disc");
  const copy = shadow.querySelector(".copy");

  const PLAY = svg("M8 5v14l11-7z");
  const PAUSE = svg("M6 5h4v14H6zm8 0h4v14h-4z");

  let lastKey = "";
  let hideTimer = 0;

  function mount() {
    if (!document.documentElement.contains(host)) {
      (document.body || document.documentElement).append(host);
    }
  }

  function render(view) {
    const track = view?.track;
    const minimized = Boolean(view?.minimized);
    if (!track?.title) {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        root.classList.remove("is-live", "is-min");
        root.setAttribute("aria-hidden", "true");
        lastKey = "";
      }, 2500);
      return;
    }

    window.clearTimeout(hideTimer);
    const key = `${track.title}|${track.artist}|${track.artwork}|${track.playing}|${minimized}`;
    root.classList.add("is-live");
    root.classList.toggle("is-min", minimized);
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
    if (area === "session" && changes.nowPlaying) {
      refresh();
    }
    if (area === "local" && changes.nowPlayingMinimized) {
      refresh();
    }
  });

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }

  refresh();
  window.setInterval(refresh, 1500);
})();
