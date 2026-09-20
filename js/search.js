import { SEARCH_ENGINES } from "./store.js";

export function initSearch(settings) {
  const overlay = document.getElementById("search-overlay");
  const frost = document.getElementById("search-frost");
  const trigger = document.getElementById("search-trigger");
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  let engine = settings.searchEngine;
  let open = false;

  function show() {
    if (open) {
      input.focus();
      input.select();
      return;
    }
    open = true;
    overlay.hidden = false;
    window.requestAnimationFrame(() => {
      document.body.classList.add("searching");
      overlay.classList.add("is-on");
      input.focus();
      input.select();
    });
  }

  function hide() {
    if (!open) {
      return;
    }
    open = false;
    overlay.classList.remove("is-on");
    document.body.classList.remove("searching");
    input.blur();
    window.setTimeout(() => {
      if (!open) {
        overlay.hidden = true;
        input.value = "";
      }
    }, 420);
  }

  trigger.addEventListener("click", show);
  frost.addEventListener("click", hide);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      return;
    }
    const base = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
    window.location.href = `${base}${encodeURIComponent(query)}`;
  });

  return {
    open: show,
    close: hide,
    focus: show,
    setEngine(next) {
      engine = SEARCH_ENGINES[next] ? next : "google";
    },
    isOpen() {
      return open;
    },
    isFocused() {
      return open || document.activeElement === input;
    },
  };
}
