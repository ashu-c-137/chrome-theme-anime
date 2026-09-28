import { applyAppearance, applyFeatures, FEATURE_OPTIONS } from "./store.js";

export function initSettings({
  settings,
  saveSettings,
  clock,
  search,
}) {
  const drawer = document.getElementById("settings");
  const scrim = document.getElementById("scrim");
  const openBtn = document.getElementById("open-settings");
  const closeBtn = document.getElementById("close-settings");
  const engineSelect = document.getElementById("search-engine");
  const overlay = document.getElementById("overlay-strength");
  const overlayValue = document.getElementById("overlay-value");
  const grain = document.getElementById("grain-toggle");
  const help = document.getElementById("keys-overlay");
  const keysBtn = document.getElementById("open-keys");

  engineSelect.value = settings.searchEngine;
  overlay.value = String(settings.overlayStrength);
  overlayValue.textContent = String(settings.overlayStrength);
  grain.checked = settings.grain;

  const firstNameInput = document.getElementById("first-name");
  firstNameInput.value = settings.firstName || "";
  firstNameInput.addEventListener("change", async () => {
    const name = firstNameInput.value.replace(/\s+/g, " ").trim().split(" ")[0].slice(0, 24);
    firstNameInput.value = name;
    settings.firstName = name;
    clock.setFirstName(name);
  });
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === "local" && changes.firstName) {
      firstNameInput.value = String(changes.firstName.newValue || "");
    }
  });

  const featureList = document.getElementById("feature-list");
  featureList.replaceChildren();
  for (const option of FEATURE_OPTIONS) {
    const label = document.createElement("label");
    label.className = "choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.feature = option.id;
    input.checked = settings.features[option.id] !== false;
    const text = document.createTextNode(option.label);
    label.append(input, text);
    input.addEventListener("change", async () => {
      settings.features = { ...settings.features, [option.id]: input.checked };
      applyFeatures(settings.features);
      await saveSettings({ features: settings.features });
    });
    featureList.append(label);
  }

  for (const radio of document.querySelectorAll('input[name="clock-format"]')) {
    radio.checked = radio.value === settings.clockFormat;
  }

  function open() {
    closeHelp();
    drawer.classList.remove("hidden");
    scrim.classList.remove("hidden");
  }

  function close() {
    drawer.classList.add("hidden");
    document.getElementById("shortcut-modal").classList.add("hidden");
    document.getElementById("notes-pad").classList.add("hidden");
    if (help.classList.contains("hidden")) {
      scrim.classList.add("hidden");
    }
  }

  function openHelp() {
    close();
    help.classList.remove("hidden");
    scrim.classList.remove("hidden");
    keysBtn.setAttribute("aria-expanded", "true");
  }

  function closeHelp() {
    help.classList.add("hidden");
    keysBtn.setAttribute("aria-expanded", "false");
    if (drawer.classList.contains("hidden")) {
      scrim.classList.add("hidden");
    }
  }

  function toggleHelp() {
    if (help.classList.contains("hidden")) {
      openHelp();
      return;
    }
    closeHelp();
  }

  function closeAll() {
    drawer.classList.add("hidden");
    help.classList.add("hidden");
    keysBtn.setAttribute("aria-expanded", "false");
    document.getElementById("shortcut-modal").classList.add("hidden");
    document.getElementById("notes-pad").classList.add("hidden");
    scrim.classList.add("hidden");
  }

  openBtn.addEventListener("click", open);
  keysBtn.addEventListener("click", toggleHelp);
  closeBtn.addEventListener("click", close);
  scrim.addEventListener("click", closeAll);
  help.addEventListener("click", (event) => {
    if (event.target === help) {
      closeHelp();
    }
  });

  for (const radio of document.querySelectorAll('input[name="clock-format"]')) {
    radio.addEventListener("change", async () => {
      if (!radio.checked) {
        return;
      }
      clock.setFormat(radio.value);
      await saveSettings({ clockFormat: radio.value });
    });
  }

  engineSelect.addEventListener("change", async () => {
    search.setEngine(engineSelect.value);
    await saveSettings({ searchEngine: engineSelect.value });
  });

  overlay.addEventListener("input", async () => {
    overlayValue.textContent = overlay.value;
    applyAppearance({
      overlayStrength: Number(overlay.value),
      grain: grain.checked,
    });
    await saveSettings({ overlayStrength: Number(overlay.value) });
  });

  grain.addEventListener("change", async () => {
    applyAppearance({
      overlayStrength: Number(overlay.value),
      grain: grain.checked,
    });
    await saveSettings({ grain: grain.checked });
  });

  return {
    open,
    close,
    openHelp,
    closeHelp,
    toggleHelp,
    closeAll,
    isOpen() {
      return !drawer.classList.contains("hidden") || !help.classList.contains("hidden");
    },
    isHelpOpen() {
      return !help.classList.contains("hidden");
    },
  };
}
