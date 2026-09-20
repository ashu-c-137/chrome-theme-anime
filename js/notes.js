function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function cleanTag(value) {
  return String(value || "")
    .trim()
    .replace(/^#/, "")
    .slice(0, 24);
}

export function initNotes({ settings, saveSettings }) {
  const preview = document.getElementById("notes-preview");
  const previewKicker = document.getElementById("notes-preview-kicker");
  const previewTitle = document.getElementById("notes-preview-title");
  const previewText = document.getElementById("notes-preview-text");
  const pad = document.getElementById("notes-pad");
  const list = document.getElementById("notes-list");
  const form = document.getElementById("notes-form");
  const titleInput = document.getElementById("notes-title");
  const tagInput = document.getElementById("notes-tag");
  const bodyInput = document.getElementById("notes-input");
  const closeBtn = document.getElementById("notes-close");
  const searchToggle = document.getElementById("notes-search-toggle");
  const filterToggle = document.getElementById("notes-filter-toggle");
  const searchRow = document.getElementById("notes-search-row");
  const filterRow = document.getElementById("notes-filter-row");
  const searchInput = document.getElementById("notes-search");
  const filterBtn = document.getElementById("notes-filter-btn");
  const filterLabel = document.getElementById("notes-filter-label");
  const filterMenu = document.getElementById("notes-filter-menu");
  const scrim = document.getElementById("scrim");

  let notes = Array.isArray(settings.notes)
    ? settings.notes.map((note) => ({ ...note }))
    : [];
  let pinnedId = settings.pinnedNoteId || "";
  let expandedId = "";
  let query = "";
  let tagFilter = "";

  function latest() {
    return [...notes].sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))[0];
  }

  function featured() {
    return notes.find((note) => note.id === pinnedId) || latest();
  }

  function tags() {
    return [...new Set(notes.map((note) => note.tag).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
  }

  function visibleNotes() {
    const needle = query.trim().toLowerCase();
    return [...notes]
      .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
      .filter((note) => {
        if (tagFilter && (note.tag || "").toLowerCase() !== tagFilter.toLowerCase()) {
          return false;
        }
        if (!needle) {
          return true;
        }
        return [note.title || "", note.tag || "", note.text || ""]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function fillHighlighted(el, value) {
    const raw = String(value || "");
    const needle = query.trim();
    el.replaceChildren();
    if (!raw || !needle) {
      el.textContent = raw;
      return;
    }
    const matcher = new RegExp(escapeRegExp(needle), "ig");
    let last = 0;
    let found = false;
    let match = matcher.exec(raw);
    while (match) {
      found = true;
      if (match.index > last) {
        el.append(raw.slice(last, match.index));
      }
      const mark = document.createElement("mark");
      mark.className = "note-hit";
      mark.textContent = match[0];
      el.append(mark);
      last = match.index + match[0].length;
      if (matcher.lastIndex === match.index) {
        matcher.lastIndex += 1;
      }
      match = matcher.exec(raw);
    }
    if (last < raw.length) {
      el.append(raw.slice(last));
    }
    if (!found) {
      el.textContent = raw;
    }
  }

  function renderPreview() {
    const note = featured();
    const isPinned = Boolean(note && note.id === pinnedId);
    if (!note || !(note.text || note.title)) {
      previewKicker.textContent = "Notes";
      previewTitle.classList.add("hidden");
      previewText.textContent = "Write a line…";
      preview.classList.add("is-empty");
      preview.classList.remove("has-title");
      return;
    }
    preview.classList.remove("is-empty");
    previewKicker.textContent = isPinned ? "Pinned" : "Latest";
    if (note.title) {
      previewTitle.textContent = note.title;
      previewTitle.classList.remove("hidden");
      preview.classList.add("has-title");
    } else {
      previewTitle.classList.add("hidden");
      preview.classList.remove("has-title");
    }
    previewText.textContent = note.text || note.title;
  }

  function closeFilterMenu() {
    filterMenu.classList.add("hidden");
    filterBtn.setAttribute("aria-expanded", "false");
  }

  function renderFilter() {
    filterLabel.textContent = tagFilter ? `#${tagFilter}` : "All tags";
    filterMenu.replaceChildren();
    const items = ["", ...tags()];
    for (const tag of items) {
      const item = document.createElement("li");
      const option = document.createElement("button");
      option.type = "button";
      option.className = `notes-filter-option${(tagFilter || "") === tag ? " is-on" : ""}`;
      option.setAttribute("role", "option");
      option.textContent = tag ? `#${tag}` : "All tags";
      option.addEventListener("click", () => {
        tagFilter = tag;
        closeFilterMenu();
        renderFilter();
        renderList();
      });
      item.append(option);
      filterMenu.append(item);
    }
  }

  function renderList() {
    list.replaceChildren();
    const shown = visibleNotes();
    if (notes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Nothing held yet.";
      list.append(empty);
      return;
    }
    if (shown.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Nothing matches that search or tag.";
      list.append(empty);
      return;
    }

    for (const note of shown) {
      const row = document.createElement("li");
      const isPinned = note.id === pinnedId;
      row.className = `note-row${note.done ? " is-done" : ""}${
        note.id === expandedId ? " is-expanded" : ""
      }${isPinned ? " is-pinned" : ""}`;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "note-check";
      check.title = note.done ? "Open again" : "Mark done";
      check.setAttribute("aria-label", note.done ? "Mark undone" : "Mark done");

      const content = document.createElement("div");
      content.className = "note-copy";

      if (note.title) {
        const heading = document.createElement("strong");
        heading.className = "note-title";
        fillHighlighted(heading, note.title);
        content.append(heading);
      }

      const body = document.createElement("p");
      fillHighlighted(body, note.text || note.title);
      content.append(body);

      const text = String(note.text || "");
      const long = text.length > 140 || text.split("\n").length > 3;
      if (long) {
        const more = document.createElement("button");
        more.type = "button";
        more.className = "note-more";
        more.textContent = note.id === expandedId ? "Show less" : "Show more";
        more.addEventListener("click", () => {
          expandedId = expandedId === note.id ? "" : note.id;
          renderList();
        });
        content.append(more);
      }

      if (note.tag) {
        const chip = document.createElement("span");
        chip.className = "note-tag";
        fillHighlighted(chip, `#${note.tag}`);
        content.append(chip);
      }

      const actions = document.createElement("div");
      actions.className = "note-actions";

      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = `note-pin${isPinned ? " is-on" : ""}`;
      pin.title = isPinned ? "Unpin from home" : "Pin to home";
      pin.setAttribute("aria-label", pin.title);
      pin.innerHTML =
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.1l1.7 3.44 3.8.55-2.75 2.68.65 3.78L8 10.78 4.6 12.55l.65-3.78L2.5 6.09l3.8-.55z"/></svg>';

      const trash = document.createElement("button");
      trash.type = "button";
      trash.className = "note-trash";
      trash.title = "Erase";
      trash.setAttribute("aria-label", "Erase");
      trash.innerHTML =
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6"/></svg>';

      check.addEventListener("click", () => toggle(note.id));
      pin.addEventListener("click", () => pinNote(note.id));
      trash.addEventListener("click", () => remove(note.id));

      actions.append(pin, trash);
      row.append(check, content, actions);
      list.append(row);
    }
  }

  function refresh() {
    renderPreview();
    renderFilter();
    renderList();
  }

  async function persist() {
    await saveSettings({ notes, pinnedNoteId: pinnedId });
    refresh();
  }

  function open() {
    pad.classList.remove("hidden");
    scrim.classList.remove("hidden");
    refresh();
    bodyInput.focus();
  }

  function close() {
    pad.classList.add("hidden");
    const settingsOpen = !document.getElementById("settings").classList.contains("hidden");
    const helpOpen = !document.getElementById("keys-overlay").classList.contains("hidden");
    const shortcutOpen = !document.getElementById("shortcut-modal").classList.contains("hidden");
    if (!settingsOpen && !helpOpen && !shortcutOpen) {
      scrim.classList.add("hidden");
    }
  }

  function isOpen() {
    return !pad.classList.contains("hidden");
  }

  async function add(title, tag, text) {
    const nextTitle = title.trim().slice(0, 72);
    const nextTag = cleanTag(tag);
    const nextText = text.trim().slice(0, 480);
    if (!nextTitle && !nextText) {
      return;
    }
    notes = [
      {
        id: uid(),
        title: nextTitle,
        tag: nextTag,
        text: nextText,
        done: false,
        updatedAt: Date.now(),
      },
      ...notes,
    ].slice(0, 80);
    await persist();
  }

  async function toggle(id) {
    notes = notes.map((note) =>
      note.id === id
        ? { ...note, done: !note.done, updatedAt: Date.now() }
        : note
    );
    await persist();
  }

  async function pinNote(id) {
    pinnedId = pinnedId === id ? "" : id;
    await persist();
  }

  async function remove(id) {
    notes = notes.filter((note) => note.id !== id);
    if (pinnedId === id) {
      pinnedId = "";
    }
    if (expandedId === id) {
      expandedId = "";
    }
    await persist();
  }

  preview.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  searchToggle.addEventListener("click", () => {
    const opening = searchRow.classList.contains("hidden");
    searchRow.classList.toggle("hidden", !opening);
    filterRow.classList.add("hidden");
    searchToggle.classList.toggle("is-on", opening);
    filterToggle.classList.remove("is-on");
    closeFilterMenu();
    if (opening) {
      searchInput.focus();
    }
  });

  filterToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = filterRow.classList.contains("hidden");
    filterRow.classList.toggle("hidden", !opening);
    searchRow.classList.add("hidden");
    filterToggle.classList.toggle("is-on", opening);
    searchToggle.classList.remove("is-on");
    if (opening) {
      renderFilter();
      filterMenu.classList.remove("hidden");
      filterBtn.setAttribute("aria-expanded", "true");
      filterBtn.focus();
    } else {
      closeFilterMenu();
    }
  });

  filterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = filterMenu.classList.contains("hidden");
    filterMenu.classList.toggle("hidden", !opening);
    filterBtn.setAttribute("aria-expanded", String(opening));
  });

  document.addEventListener("click", (event) => {
    if (!filterRow.contains(event.target)) {
      closeFilterMenu();
    }
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    renderList();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await add(titleInput.value, tagInput.value, bodyInput.value);
    titleInput.value = "";
    tagInput.value = "";
    bodyInput.value = "";
    bodyInput.focus();
  });

  renderPreview();

  return { open, close, isOpen };
}
