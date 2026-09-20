function typingInField(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function initKeys({ wallpaper, search, settingsUi, shortcuts, quotes, notes, speed, credit }) {
  window.addEventListener("keydown", (event) => {
    const field = typingInField(event.target);

    if (event.key === "Escape") {
      if (search.isOpen()) {
        event.preventDefault();
        search.close();
        return;
      }
      if (notes.isOpen()) {
        event.preventDefault();
        notes.close();
        return;
      }
      if (credit.isOpen()) {
        event.preventDefault();
        credit.close();
        return;
      }
      settingsUi.closeAll();
      shortcuts.closeEditor();
      return;
    }

    if (settingsUi.isHelpOpen()) {
      event.preventDefault();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search.open();
      return;
    }

    if (field) {
      return;
    }

    if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search.open();
      return;
    }

    if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      search.open();
      return;
    }

    if (event.key === "?" || (event.shiftKey && event.key === "/")) {
      event.preventDefault();
      settingsUi.toggleHelp();
      return;
    }

    if (event.key === "q" || event.key === "Q") {
      event.preventDefault();
      quotes.shuffle();
      return;
    }

    if (event.key === "t" || event.key === "T") {
      event.preventDefault();
      speed.run();
      return;
    }

    if (event.key === "n" || event.key === "N") {
      event.preventDefault();
      notes.open();
      return;
    }

    if (event.key === "s" || event.key === "S") {
      event.preventDefault();
      settingsUi.open();
      return;
    }

    if (event.key === "w" || event.key === "W" || event.key === "r" || event.key === "R") {
      event.preventDefault();
      wallpaper.shuffle();
      return;
    }

    if (/^[1-6]$/.test(event.key)) {
      shortcuts.open(Number(event.key) - 1);
    }
  });
}
