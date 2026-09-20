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

  function slots() {
    const list = shortcuts.slice(0, 6);
    while (list.length < 6) {
      list.push({ label: "", url: "", jp: "" });
    }
    return list;
  }

  async function moveSlot(from, to) {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    const next = slots();
    if (from >= next.length || to >= next.length) {
      return;
    }
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    shortcuts = next;
    await persist();
  }

  function clearDropMarks() {
    dock.querySelectorAll(".is-drop").forEach((node) => {
      node.classList.remove("is-drop");
    });
  }

  function renderDock() {
    dock.replaceChildren();
    slots().forEach((item, index) => {
      const empty = !item.url;
      const node = document.createElement(empty ? "button" : "a");
      node.className = `tile${empty ? " empty" : ""}`;
      node.dataset.index = String(index);
      node.draggable = true;
      if (empty) {
        node.type = "button";
        node.title = "Add shortcut";
      } else {
        node.href = item.url;
        node.title = item.label || hostFrom(item.url);
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

      const jp = document.createElement("span");
      jp.className = "tile-jp";
      jp.textContent = empty ? "追加" : item.jp || "";

      node.append(mono, name, jp);

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

      node.addEventListener("dragstart", (event) => {
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

      dock.append(node);
    });
  }

  function renderEditorList() {
    editorList.replaceChildren();
    slots().forEach((item, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "shortcut-row";
      const left = document.createElement("span");
      left.className = "shortcut-row-label";
      if (item.url) {
        attachIcon(left, item.url);
      }
      const text = document.createElement("span");
      text.textContent = item.label || item.url || `Slot ${index + 1}`;
      left.append(text);
      const right = document.createElement("small");
      right.textContent = item.url ? hostFrom(item.url) : "empty";
      row.append(left, right);
      row.addEventListener("click", () => openEditor(index));
      editorList.append(row);
    });
  }

  function openEditor(index) {
    editingIndex = index;
    const item = slots()[index];
    titleEl.textContent = item.url ? `Shortcut ${index + 1}` : "New shortcut";
    labelInput.value = item.label || "";
    urlInput.value = item.url || "";
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
    await saveSettings({ shortcuts });
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
    const next = slots();
    next[editingIndex] = {
      label: labelInput.value.trim() || hostFrom(url) || "Link",
      url,
      jp: next[editingIndex].jp || "",
    };
    shortcuts = next;
    await persist();
    closeEditor();
  });

  deleteBtn.addEventListener("click", async () => {
    if (editingIndex < 0) {
      return;
    }
    const next = slots();
    next[editingIndex] = { label: "", url: "", jp: "" };
    shortcuts = next;
    await persist();
    closeEditor();
  });

  dock.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  renderDock();
  renderEditorList();

  return {
    open(index) {
      const item = slots()[index];
      if (item?.url) {
        window.location.href = item.url;
      } else {
        openEditor(index);
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
