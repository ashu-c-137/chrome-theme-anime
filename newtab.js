import { loadSettings, saveSettings, applyAppearance } from "./js/store.js";
import { initWallpaper } from "./js/wallpaper.js";
import { initClock } from "./js/clock.js";
import { initSearch } from "./js/search.js";
import { initShortcuts } from "./js/shortcuts.js";
import { initQuotes } from "./js/quotes.js";
import { initNotes } from "./js/notes.js";
import { initSpeed } from "./js/speed.js";
import { initSettings } from "./js/settings.js";
import { initKeys } from "./js/keys.js";
import { initCredit } from "./js/credit.js";

const settings = await loadSettings();
applyAppearance(settings);

const clock = initClock(settings);
const search = initSearch(settings);
const quotes = initQuotes({ settings, saveSettings });
const notes = initNotes({ settings, saveSettings });
const shortcuts = initShortcuts({ settings, saveSettings });
const speed = initSpeed();

const wallpaper = initWallpaper({
  settings,
  saveSettings,
  changeFolderBtns: [
    document.getElementById("change-folder"),
    document.getElementById("settings-folder"),
  ],
  anotherBtn: document.getElementById("another"),
  controlsEl: document.getElementById("controls"),
});

const settingsUi = initSettings({
  settings,
  saveSettings,
  clock,
  search,
});
const credit = initCredit();

initKeys({ wallpaper, search, settingsUi, shortcuts, quotes, notes, speed, credit });
