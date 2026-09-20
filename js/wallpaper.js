const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;
const DB_NAME = "random-wallpaper-newtab";
const STORE = "handles";
const HANDLE_KEY = "wallpaperDir";
const CACHE_KEY = "lastWallpaper";
const PICKER_ID = "noir-pulse-wallpapers";
const FADE_MS = 400;

export function initWallpaper({
  settings,
  saveSettings,
  changeFolderBtns,
  anotherBtn,
  controlsEl,
}) {
  const layerA = document.getElementById("backdrop-a");
  const layerB = document.getElementById("backdrop-b");
  const loader = document.getElementById("loader");
  const folderBtnSet = new Set(changeFolderBtns.filter(Boolean));

  let front = layerA;
  let back = layerB;
  let currentObjectUrl = null;
  let pendingRevoke = null;
  let ready = false;
  let unlocking = false;
  let history = settings.wallpaperHistory.slice();

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
      };
    });
  }

  async function idbPut(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveDirHandle(handle) {
    await idbPut(HANDLE_KEY, handle);
  }

  async function loadDirHandle() {
    try {
      return await idbGet(HANDLE_KEY);
    } catch {
      return null;
    }
  }

  async function saveCachedWallpaper(file) {
    const buffer = await file.arrayBuffer();
    await idbPut(CACHE_KEY, {
      buffer,
      type: file.type || "image/jpeg",
      name: file.name || "",
    });
  }

  async function loadCachedWallpaper() {
    try {
      const cached = await idbGet(CACHE_KEY);
      if (!cached?.buffer) {
        return null;
      }
      return new Blob([cached.buffer], { type: cached.type || "image/jpeg" });
    } catch {
      return null;
    }
  }

  async function ensureReadPermission(handle, allowPrompt) {
    const opts = { mode: "read" };
    try {
      if ((await handle.queryPermission(opts)) === "granted") {
        return true;
      }
      if (!allowPrompt) {
        return false;
      }
      return (await handle.requestPermission(opts)) === "granted";
    } catch {
      return false;
    }
  }

  async function collectImages(dirHandle, out) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file" && IMAGE_EXT.test(entry.name)) {
        out.push(entry);
      } else if (entry.kind === "directory") {
        await collectImages(entry, out);
      }
    }
  }

  async function listImageFiles(dirHandle) {
    const files = [];
    await collectImages(dirHandle, files);
    return files;
  }

  function hideLoader() {
    loader.classList.add("is-done");
  }

  function revealHud() {
    ready = true;
    front.classList.remove("dim");
    back.classList.remove("dim");
    controlsEl.classList.remove("hidden");
    controlsEl.classList.add("visible");
    hideLoader();
  }

  function decodeImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().then(resolve, resolve);
        } else {
          resolve();
        }
      };
      img.onerror = resolve;
      img.src = url;
    });
  }

  function pickFrom(images) {
    const blocked = new Set(history);
    let pool = images.filter((file) => !blocked.has(file.name));
    if (pool.length === 0) {
      pool = images.filter((file) => file.name !== history[0]);
    }
    if (pool.length === 0) {
      pool = images;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function remember(name) {
    history = [name, ...history.filter((item) => item !== name)].slice(0, 8);
    await saveSettings({ wallpaperHistory: history });
  }

  async function paintWallpaper(file, { fade } = { fade: true }) {
    const nextUrl = URL.createObjectURL(file);
    await decodeImage(nextUrl);

    const target = fade ? back : front;
    target.style.backgroundImage = `url("${nextUrl}")`;
    target.classList.add("visible");
    target.classList.remove("dim");

    if (fade) {
      front.classList.remove("visible");
      const outgoing = currentObjectUrl;
      currentObjectUrl = nextUrl;
      const outgoingLayer = front;
      front = back;
      back = outgoingLayer;
      window.clearTimeout(pendingRevoke);
      pendingRevoke = window.setTimeout(() => {
        if (outgoing) {
          URL.revokeObjectURL(outgoing);
        }
      }, FADE_MS);
    } else {
      const outgoing = currentObjectUrl;
      currentObjectUrl = nextUrl;
      if (outgoing) {
        URL.revokeObjectURL(outgoing);
      }
    }
  }

  async function showCachedWallpaper() {
    const blob = await loadCachedWallpaper();
    if (!blob) {
      return false;
    }
    await paintWallpaper(blob, { fade: false });
    revealHud();
    return true;
  }

  async function showRandomWallpaper(dirHandle) {
    const images = await listImageFiles(dirHandle);
    if (images.length === 0) {
      revealHud();
      return;
    }

    const pick = pickFrom(images);
    const file = await pick.getFile();
    await paintWallpaper(file, { fade: Boolean(currentObjectUrl) });
    try {
      await saveCachedWallpaper(file);
    } catch {
      /* cache is best-effort */
    }
    await remember(pick.name);
    revealHud();
  }

  async function pickFolder() {
    if (!window.showDirectoryPicker) {
      return null;
    }

    try {
      const previous = await loadDirHandle();
      const options = { id: PICKER_ID, mode: "read" };
      if (previous) {
        options.startIn = previous;
      }
      const handle = await window.showDirectoryPicker(options);
      try {
        await handle.requestPermission({ mode: "read" });
      } catch {
        /* already granted by the picker */
      }
      await saveDirHandle(handle);
      history = [];
      await saveSettings({ wallpaperHistory: [] });
      return handle;
    } catch (err) {
      if (err?.name === "AbortError") {
        return null;
      }
      return null;
    }
  }

  async function useFolder(handle, allowPrompt) {
    if (!(await ensureReadPermission(handle, allowPrompt))) {
      return false;
    }
    try {
      await showRandomWallpaper(handle);
      await saveDirHandle(handle);
      return true;
    } catch {
      return false;
    }
  }

  function armPermissionUnlock(handle) {
    const onGesture = async (event) => {
      if (unlocking) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && [...folderBtnSet].some((btn) => btn.contains(target))) {
        return;
      }

      unlocking = true;
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);

      const restored = await useFolder(handle, true);
      unlocking = false;
      if (!restored) {
        armPermissionUnlock(handle);
      }
    };

    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
  }

  async function runWithSavedFolder() {
    const handle = await loadDirHandle();
    if (!handle) {
      revealHud();
      return;
    }

    if (await useFolder(handle, true)) {
      return;
    }

    revealHud();
  }

  async function lockFolder() {
    const handle = await pickFolder();
    if (handle) {
      await showRandomWallpaper(handle);
    }
  }

  async function boot() {
    try {
      await navigator.storage?.persist?.();
    } catch {
      /* ignore */
    }

    const handle = await loadDirHandle();
    const cached = await showCachedWallpaper();

    if (!handle) {
      if (!cached) {
        revealHud();
      }
      return;
    }

    if (await useFolder(handle, false)) {
      return;
    }

    if (await useFolder(handle, true)) {
      return;
    }

    if (!cached) {
      revealHud();
    }
    armPermissionUnlock(handle);
  }

  for (const btn of folderBtnSet) {
    btn.addEventListener("click", () => {
      lockFolder();
    });
  }

  anotherBtn.addEventListener("click", () => {
    runWithSavedFolder();
  });

  boot();

  return {
    shuffle: runWithSavedFolder,
    lockFolder,
    isReady: () => ready,
  };
}
