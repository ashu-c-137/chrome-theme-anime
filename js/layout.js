const WIDGETS = [
  { id: "greeting", selector: "[data-widget='greeting']" },
  { id: "clock", selector: "[data-widget='clock']" },
  { id: "speed", selector: "[data-widget='speed']" },
  { id: "shortcuts", selector: "[data-widget='shortcuts']" },
  { id: "quotes", selector: "[data-widget='quotes']" },
  { id: "notes", selector: "[data-widget='notes']" },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function placeElement(el, pos) {
  if (!el) {
    return;
  }
  if (!pos) {
    el.classList.remove("is-placed");
    el.style.left = "";
    el.style.top = "";
    el.style.right = "";
    el.style.bottom = "";
    el.style.transform = "";
    return;
  }
  el.classList.add("is-placed");
  el.style.left = `${pos.x * 100}%`;
  el.style.top = `${pos.y * 100}%`;
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.transform = "none";
}

export function applyLayout(layout) {
  const next = layout && typeof layout === "object" ? layout : {};
  for (const widget of WIDGETS) {
    placeElement(document.querySelector(widget.selector), next[widget.id] || null);
  }
}

export function initLayout({ settings, saveSettings, settingsUi }) {
  const banner = document.getElementById("layout-banner");
  const doneBtn = document.getElementById("layout-done");
  const editBtn = document.getElementById("layout-edit");
  const resetBtn = document.getElementById("layout-reset");

  let layout = { ...(settings.layout || {}) };
  let dragging = null;

  applyLayout(layout);

  function isEditing() {
    return document.body.classList.contains("layout-edit");
  }

  function startEdit() {
    settingsUi.close();
    document.body.classList.add("layout-edit");
    banner.classList.remove("hidden");
  }

  function stopEdit() {
    document.body.classList.remove("layout-edit");
    banner.classList.add("hidden");
    dragging = null;
  }

  async function persist() {
    let stored = {};
    try {
      stored = (await chrome.storage.local.get("layout")).layout || {};
    } catch {
      stored = {};
    }
    layout = { ...stored, ...layout };
    settings.layout = { ...layout };
    await saveSettings({ layout });
    applyLayout(layout);
  }

  async function reset() {
    layout = {};
    settings.layout = {};
    await saveSettings({ layout: {} });
    applyLayout({});
  }

  function beginDrag(event, id, el) {
    if (!isEditing() || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const box = el.getBoundingClientRect();
    dragging = {
      id,
      el,
      pointer: event.pointerId,
      dx: event.clientX - box.left,
      dy: event.clientY - box.top,
      moved: false,
    };
    el.classList.add("is-dragging");
    el.setPointerCapture(event.pointerId);
  }

  function onMove(event) {
    if (!dragging || event.pointerId !== dragging.pointer) {
      return;
    }
    dragging.moved = true;
    const width = dragging.el.offsetWidth || 80;
    const height = dragging.el.offsetHeight || 40;
    const left = clamp(event.clientX - dragging.dx, 8, Math.max(8, window.innerWidth - width - 8));
    const top = clamp(event.clientY - dragging.dy, 8, Math.max(8, window.innerHeight - height - 8));
    dragging.el.classList.add("is-placed");
    dragging.el.style.left = `${left}px`;
    dragging.el.style.top = `${top}px`;
    dragging.el.style.right = "auto";
    dragging.el.style.bottom = "auto";
    dragging.el.style.transform = "none";
  }

  async function onUp(event) {
    if (!dragging || event.pointerId !== dragging.pointer) {
      return;
    }
    const { id, el, pointer, moved } = dragging;
    el.classList.remove("is-dragging");
    try {
      el.releasePointerCapture(pointer);
    } catch {
      /* already released */
    }
    dragging = null;
    if (!moved) {
      return;
    }
    const box = el.getBoundingClientRect();
    layout[id] = {
      x: clamp(box.left / window.innerWidth, 0, 0.92),
      y: clamp(box.top / window.innerHeight, 0, 0.92),
    };
    await persist();
  }

  for (const widget of WIDGETS) {
    const el = document.querySelector(widget.selector);
    if (!el) {
      continue;
    }
    el.addEventListener("pointerdown", (event) => beginDrag(event, widget.id, el));
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  document.addEventListener(
    "click",
    (event) => {
      if (!isEditing()) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("#layout-banner")) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("[data-widget]")) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  editBtn.addEventListener("click", startEdit);
  doneBtn.addEventListener("click", stopEdit);
  resetBtn.addEventListener("click", reset);
  window.addEventListener("resize", () => applyLayout(layout));

  return {
    startEdit,
    stopEdit,
    isEditing,
    reset,
  };
}
