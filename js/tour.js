const STEPS = [
  {
    id: "welcome",
    title: "This tab is yours",
    body: "A short walk through every piece of the new tab — how to use it, how to customise it, and which key runs it. Skip whenever you like.",
    keys: [{ kbd: "?" }],
    keyNote: "Help & tutorial",
  },
  {
    id: "greeting",
    selector: "[data-widget='greeting']",
    hideClass: "hide-greeting",
    title: "Greeting",
    body: "Changes with the hour. Put your first name in Settings and it will address you.",
  },
  {
    id: "clock",
    selector: "[data-widget='clock']",
    hideClass: "hide-clock",
    title: "Clock",
    body: "Date and time stay in this corner. Switch 12-hour or 24-hour in Settings.",
  },
  {
    id: "speed",
    selector: "#speed-test",
    hideClass: "hide-speed",
    title: "Speed test",
    body: "Tap here to measure download, upload, and ping. The chart draws against Cloudflare and stays on this machine.",
    keys: [{ kbd: "T" }],
    keyNote: "Run the test",
  },
  {
    id: "shortcuts",
    selector: "#dock",
    hideClass: "hide-shortcuts",
    title: "Site shortcuts",
    body: "Click a tile to open the site. Add, rename, and drag to reorder them later in Settings.",
    keys: [{ kbd: "1" }, { sep: "–" }, { kbd: "9" }],
    keyNote: "Open the first nine",
  },
  {
    id: "google-dock",
    selector: "#open-google-dock",
    hideClass: "hide-google-dock",
    title: "Google dock",
    body: "The brass tab on the right opens YouTube, Drive, Docs, Sheets, and the rest of your Google apps.",
    keys: [{ kbd: "G" }],
    keyNote: "Open the Google dock",
  },
  {
    id: "search",
    selector: "#search-trigger",
    title: "Search",
    body: "Opens a search overlay. The engine — Google, DuckDuckGo, YouTube, or GitHub — is chosen in Settings.",
    keys: [
      { kbd: "Space" },
      { sep: "or" },
      { kbd: "/" },
      { sep: "or" },
      { kbd: "Ctrl" },
      { sep: "+" },
      { kbd: "K" },
    ],
    keyNote: "Open search",
  },
  {
    id: "notes",
    selector: "#notes-preview",
    hideClass: "hide-notes",
    title: "Notes",
    body: "A pad for lines worth keeping. Inside you can title, tag, search, filter, and pin a note to this preview.",
    keys: [{ kbd: "N" }],
    keyNote: "Open notes",
  },
  {
    id: "quotes",
    selector: "#quote",
    hideClass: "hide-quotes",
    title: "Quotes",
    body: "Click the line for another. The tab remembers recent quotes so it does not repeat itself too soon.",
    keys: [{ kbd: "Q" }],
    keyNote: "Another quote",
  },
  {
    id: "wallpaper",
    selector: "#another",
    title: "Shuffle wallpaper",
    body: "Pulls another image from the folder you locked. Wallpapers never leave this browser profile.",
    keys: [{ kbd: "W" }, { sep: "or" }, { kbd: "R" }],
    keyNote: "Shuffle wallpaper",
  },
  {
    id: "folder",
    selector: "#change-folder",
    title: "Wallpaper folder",
    body: "Pick a local folder of images. Chrome will ask to keep access so the tab can shuffle on its own. Relock it from Settings if permission is lost.",
  },
  {
    id: "help",
    selector: "#open-keys",
    title: "Help",
    body: "The question mark opens the keyboard legend you started from. This tutorial lives under that list.",
    keys: [{ kbd: "?" }],
    keyNote: "Legend & tutorial",
  },
  {
    id: "settings",
    selector: "#open-settings",
    title: "Settings",
    body: "Everything customisable lives in this drawer — widgets, layout, name, search, look, and shortcuts. Next we open it.",
    keys: [{ kbd: "S" }],
    keyNote: "Open settings",
  },
  {
    id: "widgets",
    selector: "#settings-section-widgets",
    panel: "settings",
    title: "Widgets & layout",
    body: "Turn pieces of the new tab on or off, including the media island that appears when a video or song is playing. Arrange widgets lets you drag them anywhere; reset puts them back.",
  },
  {
    id: "name-clock",
    selector: "#settings-section-clock",
    panel: "settings",
    title: "Name & clock format",
    body: "First name is woven into the greeting. Pick 12h or 24h for the clock in the opposite corner.",
  },
  {
    id: "engine",
    selector: "#settings-section-search",
    panel: "settings",
    title: "Search engine",
    body: "Choose where the search overlay sends the query.",
    keys: [
      { kbd: "Space" },
      { sep: "or" },
      { kbd: "/" },
      { sep: "or" },
      { kbd: "Ctrl" },
      { sep: "+" },
      { kbd: "K" },
    ],
    keyNote: "Open search",
  },
  {
    id: "overlay",
    selector: "#settings-section-overlay",
    panel: "settings",
    title: "Vignette & grain",
    body: "Vignette darkens the edges so type stays readable over bright photos. Film grain is optional texture.",
  },
  {
    id: "shortcut-editor",
    selector: "#settings-section-shortcuts",
    panel: "settings",
    title: "Edit shortcuts",
    body: "Drag a row to reorder. Click a row to change the label or URL. Add as many as you like — keys 1–9 still open the first nine on the dock.",
    keys: [{ kbd: "1" }, { sep: "–" }, { kbd: "9" }],
    keyNote: "Still open the first nine",
  },
  {
    id: "done",
    title: "You're set",
    body: "Press ? anytime for the legend, or start this walkthrough again from there. Esc closes search, notes, settings, and this tour.",
    keys: [{ kbd: "?" }, { sep: "or" }, { kbd: "Esc" }, { sep: "or" }, { kbd: "S" }],
    keyNote: "Help, close, settings",
  },
];

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function isVisible(el) {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function visibleBox(el) {
  if (!isVisible(el)) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  const left = clamp(rect.left, 6, window.innerWidth - 6);
  const right = clamp(rect.right, 6, window.innerWidth - 6);
  const top = clamp(rect.top, 6, window.innerHeight - 6);
  const bottom = clamp(rect.bottom, 6, window.innerHeight - 6);
  if (right - left < 8 || bottom - top < 8) {
    return null;
  }
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function overlapRatio(box, rect) {
  const left = Math.max(box.left, rect.left);
  const top = Math.max(box.top, rect.top);
  const right = Math.min(box.left + box.width, rect.right);
  const bottom = Math.min(box.top + box.height, rect.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const area = Math.max(1, rect.width * rect.height);
  return (width * height) / area;
}

export function initTour({ settingsUi, layout }) {
  const root = document.getElementById("tour");
  const spotlight = document.getElementById("tour-spotlight");
  const card = document.getElementById("tour-card");
  const titleEl = document.getElementById("tour-title");
  const bodyEl = document.getElementById("tour-body");
  const keysEl = document.getElementById("tour-keys");
  const progressEl = document.getElementById("tour-progress");
  const backBtn = document.getElementById("tour-back");
  const nextBtn = document.getElementById("tour-next");
  const skipBtn = document.getElementById("tour-skip");
  const startBtn = document.getElementById("tour-start");
  const drawer = document.getElementById("settings");

  let index = 0;
  let queue = [];
  let active = false;
  let placing = false;

  function isActive() {
    return active;
  }

  function current() {
    return queue[index] || null;
  }

  function renderKeys(tokens, note) {
    keysEl.replaceChildren();
    if (!tokens || !tokens.length) {
      keysEl.classList.add("hidden");
      return;
    }
    keysEl.classList.remove("hidden");
    const row = document.createElement("span");
    row.className = "keys";
    for (const token of tokens) {
      if (token.kbd) {
        const kbd = document.createElement("kbd");
        kbd.textContent = token.kbd;
        row.append(kbd);
        continue;
      }
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = token.sep || "";
      row.append(sep);
    }
    keysEl.append(row);
    if (note) {
      const hint = document.createElement("span");
      hint.className = "tour-key-note";
      hint.textContent = note;
      keysEl.append(hint);
    }
  }

  function placeCard(rect, preferLeft) {
    const gap = 16;
    const pad = 12;
    const cw = card.offsetWidth || 320;
    const ch = card.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect) {
      card.classList.add("is-center");
      card.style.left = "";
      card.style.top = "";
      return;
    }

    card.classList.remove("is-center");
    const below = { left: rect.left, top: rect.bottom + gap };
    const above = { left: rect.left, top: rect.top - ch - gap };
    const right = { left: rect.right + gap, top: rect.top };
    const left = {
      left: rect.left - cw - gap,
      top: rect.top + (rect.height - ch) / 2,
    };
    const spots = preferLeft ? [left, above, below, right] : [below, above, right, left];

    let chosen = spots[0];
    for (const spot of spots) {
      const fitsX = spot.left >= pad && spot.left + cw <= vw - pad;
      const fitsY = spot.top >= pad && spot.top + ch <= vh - pad;
      if (fitsX && fitsY) {
        chosen = spot;
        break;
      }
    }

    card.style.left = `${clamp(chosen.left, pad, Math.max(pad, vw - cw - pad))}px`;
    card.style.top = `${clamp(chosen.top, pad, Math.max(pad, vh - ch - pad))}px`;

    const placed = {
      left: parseFloat(card.style.left),
      top: parseFloat(card.style.top),
      width: cw,
      height: ch,
    };
    if (overlapRatio(placed, rect) > 0.22) {
      const fallbacks = [
        { left: pad, top: pad },
        { left: pad, top: vh - ch - pad },
        { left: vw - cw - pad, top: pad },
        { left: vw - cw - pad, top: vh - ch - pad },
      ];
      let best = placed;
      let bestOverlap = overlapRatio(placed, rect);
      for (const spot of fallbacks) {
        const box = {
          left: clamp(spot.left, pad, Math.max(pad, vw - cw - pad)),
          top: clamp(spot.top, pad, Math.max(pad, vh - ch - pad)),
          width: cw,
          height: ch,
        };
        const ratio = overlapRatio(box, rect);
        if (ratio < bestOverlap) {
          best = box;
          bestOverlap = ratio;
        }
      }
      card.style.left = `${best.left}px`;
      card.style.top = `${best.top}px`;
    }
  }

  function paintSpotlight(rect) {
    if (!rect) {
      root.classList.add("is-center");
      spotlight.style.left = "0px";
      spotlight.style.top = "0px";
      spotlight.style.width = "0px";
      spotlight.style.height = "0px";
      return;
    }
    root.classList.remove("is-center");
    const pad = 10;
    const left = Math.max(6, rect.left - pad);
    const top = Math.max(6, rect.top - pad);
    const right = Math.min(window.innerWidth - 6, rect.right + pad);
    const bottom = Math.min(window.innerHeight - 6, rect.bottom + pad);
    spotlight.style.left = `${left}px`;
    spotlight.style.top = `${top}px`;
    spotlight.style.width = `${Math.max(28, right - left)}px`;
    spotlight.style.height = `${Math.max(28, bottom - top)}px`;
  }

  async function prepare(step) {
    layout?.stopEdit?.();
    if (step.panel === "settings") {
      settingsUi.open();
      await nextFrame();
      const target = document.querySelector(step.selector);
      target?.scrollIntoView({ block: "nearest", behavior: "auto" });
      await nextFrame();
      return;
    }
    settingsUi.close();
    await nextFrame();
  }

  async function showStep() {
    const step = current();
    if (!step) {
      stop();
      return;
    }

    placing = true;
    await prepare(step);

    const last = index === queue.length - 1;
    titleEl.textContent = step.title;
    bodyEl.textContent = step.body;
    renderKeys(step.keys, step.keyNote);
    progressEl.textContent = `${index + 1} / ${queue.length}`;
    backBtn.disabled = index === 0;
    nextBtn.textContent = last ? "Done" : "Next";
    skipBtn.classList.toggle("hidden", last);

    const target = step.selector ? document.querySelector(step.selector) : null;
    const rect = visibleBox(target);
    paintSpotlight(rect);
    placeCard(rect, step.panel === "settings");
    nextBtn.focus();
    placing = false;
  }

  function buildQueue() {
    return STEPS.filter((step) => {
      if (step.hideClass && document.body.classList.contains(step.hideClass)) {
        return false;
      }
      if (!step.selector) {
        return true;
      }
      if (step.panel === "settings") {
        return Boolean(document.querySelector(step.selector));
      }
      return isVisible(document.querySelector(step.selector));
    });
  }

  async function start() {
    if (layout?.isEditing?.()) {
      layout.stopEdit();
    }
    settingsUi.closeAll();
    queue = buildQueue();
    if (!queue.length) {
      return;
    }
    index = 0;
    active = true;
    document.body.classList.add("tour-active");
    root.classList.add("is-preparing");
    root.classList.remove("hidden");
    root.hidden = false;
    await showStep();
    root.classList.remove("is-preparing");
  }

  function stop() {
    active = false;
    placing = false;
    root.classList.add("hidden");
    root.classList.remove("is-preparing");
    root.hidden = true;
    root.classList.add("is-center");
    document.body.classList.remove("tour-active");
    settingsUi.close();
  }

  async function next() {
    if (!active || placing) {
      return;
    }
    if (index >= queue.length - 1) {
      stop();
      return;
    }
    index += 1;
    await showStep();
  }

  async function back() {
    if (!active || placing || index === 0) {
      return;
    }
    index -= 1;
    await showStep();
  }

  function onKey(event) {
    if (!active) {
      return;
    }
    event.stopImmediatePropagation();
    if (event.key === "Tab") {
      return;
    }
    const inCard = event.target instanceof Node && card.contains(event.target);
    if (event.key === "Escape") {
      event.preventDefault();
      stop();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
      return;
    }
    if (inCard && (event.key === "Enter" || event.key === " ")) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      next();
      return;
    }
    event.preventDefault();
  }

  startBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    start();
  });
  nextBtn.addEventListener("click", next);
  backBtn.addEventListener("click", back);
  skipBtn.addEventListener("click", stop);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", () => {
    if (active && !placing) {
      showStep();
    }
  });
  drawer.addEventListener("scroll", () => {
    if (active && !placing && current()?.panel === "settings") {
      const step = current();
      const target = step.selector ? document.querySelector(step.selector) : null;
      const rect = visibleBox(target);
      paintSpotlight(rect);
      placeCard(rect, true);
    }
  });

  return { start, stop, next, back, isActive };
}
