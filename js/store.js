const DEFAULT_SHORTCUTS = [
  { label: "YouTube", url: "https://www.youtube.com", jp: "動画" },
  { label: "GitHub", url: "https://github.com", jp: "源" },
  { label: "Reddit", url: "https://www.reddit.com", jp: "議" },
  { label: "Netflix", url: "https://www.netflix.com", jp: "映" },
  { label: "Gmail", url: "https://mail.google.com", jp: "便" },
  { label: "Discord", url: "https://discord.com", jp: "話" },
];

export const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  ddg: "https://duckduckgo.com/?q=",
  youtube: "https://www.youtube.com/results?search_query=",
  github: "https://github.com/search?q=",
};

export const DEFAULTS = {
  clockFormat: "24",
  searchEngine: "google",
  overlayStrength: 45,
  grain: true,
  shortcuts: DEFAULT_SHORTCUTS,
  wallpaperHistory: [],
  quoteHistory: [],
  notes: [],
  pinnedNoteId: "",
};

const LOCAL_KEY = "noir-pulse-settings";

function canUseChromeStorage() {
  return Boolean(globalThis.chrome?.storage?.local);
}

export async function loadSettings() {
  try {
    if (canUseChromeStorage()) {
      const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
      return normalize({ ...DEFAULTS, ...stored });
    }
  } catch {
    /* fall through */
  }

  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      return normalize({ ...DEFAULTS, ...JSON.parse(raw) });
    }
  } catch {
    /* ignore */
  }

  return { ...DEFAULTS, shortcuts: DEFAULT_SHORTCUTS.map((s) => ({ ...s })) };
}

export async function saveSettings(partial) {
  try {
    if (canUseChromeStorage()) {
      await chrome.storage.local.set(partial);
      return;
    }
  } catch {
    /* fall through */
  }

  const current = await loadSettings();
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...current, ...partial }));
}

function normalize(settings) {
  const shortcuts = Array.isArray(settings.shortcuts)
    ? settings.shortcuts.slice(0, 6).map((item) => ({
        label: String(item.label || "").slice(0, 24),
        url: String(item.url || ""),
        jp: String(item.jp || ""),
      }))
    : DEFAULT_SHORTCUTS.map((s) => ({ ...s }));

  while (shortcuts.length < 6) {
    shortcuts.push({ label: "", url: "", jp: "" });
  }

  const overlay = Number(settings.overlayStrength);
  return {
    clockFormat: settings.clockFormat === "12" ? "12" : "24",
    searchEngine: SEARCH_ENGINES[settings.searchEngine]
      ? settings.searchEngine
      : "google",
    overlayStrength: Number.isFinite(overlay)
      ? Math.min(70, Math.max(20, overlay))
      : 45,
    grain: settings.grain !== false,
    shortcuts,
    wallpaperHistory: Array.isArray(settings.wallpaperHistory)
      ? settings.wallpaperHistory.slice(0, 8)
      : [],
    quoteHistory: Array.isArray(settings.quoteHistory)
      ? settings.quoteHistory.slice(0, 24)
      : [],
    notes: Array.isArray(settings.notes)
      ? settings.notes
          .slice(0, 80)
          .map((note) => ({
            id: String(note.id || ""),
            title: String(note.title || "").slice(0, 72),
            tag: String(note.tag || "").slice(0, 24),
            text: String(note.text || "").slice(0, 480),
            done: Boolean(note.done),
            updatedAt: Number(note.updatedAt) || Date.now(),
          }))
          .filter((note) => note.id && (note.text || note.title))
      : [],
    pinnedNoteId: String(settings.pinnedNoteId || ""),
  };
}

export function applyAppearance(settings) {
  document.documentElement.style.setProperty(
    "--vignette",
    String(settings.overlayStrength / 100)
  );
  document.body.classList.toggle("grain-off", !settings.grain);
}
