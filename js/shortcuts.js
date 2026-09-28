import { MAX_SHORTCUTS } from "./store.js";

function hostFrom(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function monogram(label, url) {
  const source = (label || hostFrom(url) || "+").trim();
  return source.charAt(0).toUpperCase();
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function iconUrl(url, fallback) {
  const host = hostname(url);
  if (!host) {
    return "";
  }
  if (fallback) {
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  }
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

function attachIcon(container, url) {
  const src = iconUrl(url, false);
  if (!src) {
    return;
  }

  const img = document.createElement("img");
  img.className = "tile-icon";
  img.alt = "";
  img.referrerPolicy = "no-referrer";
  img.decoding = "async";
  img.src = src;
  img.addEventListener("load", () => {
    container.classList.add("has-icon");
  });
  img.addEventListener("error", () => {
    if (img.dataset.fallback === "1") {
      img.remove();
      container.classList.remove("has-icon");
      return;
    }
    img.dataset.fallback = "1";
    img.src = iconUrl(url, true);
  });
  container.prepend(img);
}

export function initShortcuts({ settings, saveSettings }) {
  const dock = document.getElementById("dock");
  const editorList = document.getElementById("shortcut-editor-list");
  const modal = document.getElementById("shortcut-modal");
  const titleEl = document.getElementById("shortcut-modal-title");
  const labelInput = document.getElementById("shortcut-label");
  const urlInput = document.getElementById("shortcut-url");
  const saveBtn = document.getElementById("shortcut-save");
  const deleteBtn = document.getElementById("shortcut-delete");

  let shortcuts = settings.shortcuts.map((item) => ({ ...item }));
  let editingIndex = -1;
  let dragFrom = -1;
  let didDrag = false;

  async function moveSlot(from, to) {
    if (from === to || from < 0 || to < 0 || from >= shortcuts.length || to >= shortcuts.length) {
      return;
    }
    const [item] = shortcuts.splice(from, 1);
    shortcuts.splice(to, 0, item);
    await persist();
  }

  function clearDropMarks() {
    dock.querySelectorAll(".is-drop").forEach((node) => {
      node.classList.remove("is-drop");
    });
    editorList.querySelectorAll(".is-drop").forEach((node) => {
      node.classList.remove("is-drop");
    });
  }

  function bindReorder(node, index) {
    node.draggable = true;
    node.addEventListener("dragstart", (event) => {
      if (document.body.classList.contains("layout-edit")) {
        event.preventDefault();
        return;
      }
      dragFrom = index;
      didDrag = true;
      node.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      const ghost = node.querySelector(".mono");
      if (ghost) {
        event.dataTransfer.setDragImage(ghost, 23, 23);
      }
    });
    node.addEventListener("dragend", () => {
      node.classList.remove("is-dragging");
      clearDropMarks();
      dragFrom = -1;
      window.setTimeout(() => {
        didDrag = false;
      }, 80);
    });
    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragFrom === index) {
        return;
      }
      clearDropMarks();
      node.classList.add("is-drop");
    });
    node.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && node.contains(event.relatedTarget)) {
        return;
      }
      node.classList.remove("is-drop");
    });
    node.addEventListener("drop", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropMarks();
      const from = Number(event.dataTransfer.getData("text/plain"));
      await moveSlot(Number.isFinite(from) ? from : dragFrom, index);
    });
  }

  function makeTile(item, index, empty) {
    const node = document.createElement(empty ? "button" : "a");
    node.className = `tile${empty ? " empty" : ""}`;
    node.dataset.index = String(index);
    if (empty) {
      node.type = "button";
      node.title = "Add shortcut";
      node.draggable = false;
    } else {
      node.href = item.url;
      node.title = item.label || hostFrom(item.url);
      node.draggable = true;
    }

    const mono = document.createElement("span");
    mono.className = "mono";
    const letter = document.createElement("span");
    letter.className = "mono-letter";
    letter.textContent = empty ? "+" : monogram(item.label, item.url);
    mono.append(letter);
    if (!empty) {
      attachIcon(mono, item.url);
    }

    const name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = empty ? "Add" : item.label || hostFrom(item.url);
    node.append(mono, name);

    node.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openEditor(index);
    });

    node.addEventListener("click", (event) => {
      if (didDrag) {
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
        return;
      }
      if (empty) {
        openEditor(index);
      }
    });

    if (empty) {
      return node;
    }

    bindReorder(node, index);
    return node;
  }

  function renderDock() {
    dock.replaceChildren();
    shortcuts.forEach((item, index) => {
      dock.append(makeTile(item, index, false));
    });
    if (shortcuts.length < MAX_SHORTCUTS) {
      dock.append(makeTile({ label: "", url: "" }, shortcuts.length, true));
    }
  }

  function renderEditorList() {
    editorList.replaceChildren();
    shortcuts.forEach((item, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "shortcut-row";
      row.title = "Drag to reorder";
      const grip = document.createElement("span");
      grip.className = "shortcut-grip";
      grip.setAttribute("aria-hidden", "true");
      grip.textContent = "⋮⋮";
      const left = document.createElement("span");
      left.className = "shortcut-row-label";
      attachIcon(left, item.url);
      const text = document.createElement("span");
      text.textContent = item.label || hostFrom(item.url);
      left.append(text);
      const right = document.createElement("small");
      right.textContent = hostFrom(item.url);
      row.append(grip, left, right);
      row.addEventListener("click", () => {
        if (didDrag) {
          didDrag = false;
          return;
        }
        openEditor(index);
      });
      bindReorder(row, index);
      editorList.append(row);
    });
    if (shortcuts.length < MAX_SHORTCUTS) {
      const add = document.createElement("button");
      add.type = "button";
      add.className = "shortcut-row is-add";
      add.textContent = "Add shortcut";
      add.addEventListener("click", () => openEditor(shortcuts.length));
      editorList.append(add);
    }
  }

  function openEditor(index) {
    editingIndex = index;
    const item = shortcuts[index] || { label: "", url: "" };
    titleEl.textContent = item.url ? item.label || "Shortcut" : "New shortcut";
    labelInput.value = item.label || "";
    urlInput.value = item.url || "";
    deleteBtn.hidden = !item.url;
    modal.classList.remove("hidden");
    document.getElementById("scrim").classList.remove("hidden");
    labelInput.focus();
  }

  function closeEditor() {
    modal.classList.add("hidden");
    editingIndex = -1;
    const settingsOpen = !document.getElementById("settings").classList.contains("hidden");
    const helpOpen = !document.getElementById("keys-overlay").classList.contains("hidden");
    if (!settingsOpen && !helpOpen) {
      document.getElementById("scrim").classList.add("hidden");
    }
  }

  async function persist() {
    shortcuts = shortcuts.filter((item) => item.url).slice(0, MAX_SHORTCUTS);
    await saveSettings({
      shortcuts: shortcuts.map((item) => ({ label: item.label, url: item.url })),
    });
    renderDock();
    renderEditorList();
  }

  saveBtn.addEventListener("click", async () => {
    if (editingIndex < 0) {
      return;
    }
    const url = normalizeUrl(urlInput.value);
    if (!url) {
      return;
    }
    const item = {
      label: labelInput.value.trim() || hostFrom(url) || "Link",
      url,
    };
    if (editingIndex < shortcuts.length) {
      shortcuts[editingIndex] = item;
    } else if (shortcuts.length < MAX_SHORTCUTS) {
      shortcuts.push(item);
    }
    await persist();
    closeEditor();
  });

  deleteBtn.addEventListener("click", async () => {
    if (editingIndex < 0 || editingIndex >= shortcuts.length) {
      closeEditor();
      return;
    }
    shortcuts.splice(editingIndex, 1);
    await persist();
    closeEditor();
  });

  dock.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  editorList.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  renderDock();
  renderEditorList();

  return {
    open(index) {
      const item = shortcuts[index];
      if (item?.url) {
        window.location.href = item.url;
        return;
      }
      if (shortcuts.length < MAX_SHORTCUTS) {
        openEditor(shortcuts.length);
      }
    },
    closeEditor,
    isEditing() {
      return !modal.classList.contains("hidden");
    },
    refresh() {
      renderDock();
      renderEditorList();
    },
  };
}
