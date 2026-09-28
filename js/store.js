const DEFAULT_SHORTCUTS = [
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Reddit", url: "https://www.reddit.com" },
  { label: "Netflix", url: "https://www.netflix.com" },
  { label: "Gmail", url: "https://mail.google.com" },
  { label: "Discord", url: "https://discord.com" },
];

export const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  ddg: "https://duckduckgo.com/?q=",
  youtube: "https://www.youtube.com/results?search_query=",
  github: "https://github.com/search?q=",
};

export const DEFAULT_FEATURES = {
  clock: true,
  greeting: true,
  shortcuts: true,
  quotes: true,
  notes: true,
  speed: true,
  googleDock: true,
};

export const FEATURE_OPTIONS = [
  { id: "clock", label: "Clock" },
  { id: "greeting", label: "Greeting" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "quotes", label: "Quotes" },
  { id: "notes", label: "Notes" },
  { id: "speed", label: "Speed test" },
  { id: "googleDock", label: "Google dock" },
];

export const MAX_SHORTCUTS = 32;

export const LAYOUT_WIDGETS = ["greeting", "clock", "speed", "shortcuts", "quotes", "notes"];

export const DEFAULTS = {
  clockFormat: "24",
  searchEngine: "google",
  overlayStrength: 45,
  grain: true,
  shortcuts: DEFAULT_SHORTCUTS,
  features: { ...DEFAULT_FEATURES },
  layout: {},
  wallpaperHistory: [],
  quoteHistory: [],
  notes: [],
  pinnedNoteId: "",
  firstName: "",
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

  return { ...DEFAULTS, shortcuts: DEFAULT_SHORTCUTS.map((s) => ({ ...s })), features: { ...DEFAULT_FEATURES } };
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

function normalizeFeatures(raw) {
  const features = { ...DEFAULT_FEATURES };
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(DEFAULT_FEATURES)) {
      if (raw[key] === false) {
        features[key] = false;
      }
    }
  }
  return features;
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(0.92, Math.max(0, n));
}

function normalizeLayout(raw) {
  const layout = {};
  if (!raw || typeof raw !== "object") {
    return layout;
  }
  for (const id of LAYOUT_WIDGETS) {
    const pos = raw[id];
    if (pos && Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.y))) {
      layout[id] = { x: clamp01(pos.x), y: clamp01(pos.y) };
    }
  }
  return layout;
}

function normalize(settings) {
  const shortcuts = Array.isArray(settings.shortcuts)
    ? settings.shortcuts
        .map((item) => ({
          label: String(item.label || "").slice(0, 24),
          url: String(item.url || ""),
        }))
        .filter((item) => item.url)
        .slice(0, MAX_SHORTCUTS)
    : DEFAULT_SHORTCUTS.map((s) => ({ ...s }));

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
    features: normalizeFeatures(settings.features),
    layout: normalizeLayout(settings.layout),
    wallpaperHistory: Array.isArray(settings.wallpaperHistory)
      ? settings.wallpaperHistory.slice(0, 8)
      : [],
    quoteHistory: Array.isArray(settings.quoteHistory)
      ? settings.quoteHistory.slice(0, 24)
      : [],
    notes: Array.isArray(settings.notes)
      ? settings.notes
          .filter((note) => !String(note.id || "").startsWith("keep:"))
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
    pinnedNoteId: String(settings.pinnedNoteId || "").startsWith("keep:")
      ? ""
      : String(settings.pinnedNoteId || ""),
    firstName: String(settings.firstName || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")[0]
      .slice(0, 24),
  };
}

export function applyAppearance(settings) {
  document.documentElement.style.setProperty(
    "--vignette",
    String(settings.overlayStrength / 100)
  );
  document.body.classList.toggle("grain-off", !settings.grain);
}

export function applyFeatures(features) {
  const next = normalizeFeatures(features);
  document.body.classList.toggle("hide-clock", !next.clock);
  document.body.classList.toggle("hide-greeting", !next.greeting);
  document.body.classList.toggle("hide-shortcuts", !next.shortcuts);
  document.body.classList.toggle("hide-quotes", !next.quotes);
  document.body.classList.toggle("hide-notes", !next.notes);
  document.body.classList.toggle("hide-speed", !next.speed);
  document.body.classList.toggle("hide-google-dock", !next.googleDock);
}
