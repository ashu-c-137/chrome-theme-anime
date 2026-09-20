const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;
const DB_NAME = "random-wallpaper-newtab";
const STORE = "handles";
const HANDLE_KEY = "wallpaperDir";
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

  let front = layerA;
  let back = layerB;
  let currentObjectUrl = null;
  let pendingRevoke = null;
  let ready = false;
  let history = settings.wallpaperHistory.slice();

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
    });
  }

  async function saveDirHandle(handle) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadDirHandle() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async function ensureReadPermission(handle) {
    const opts = { mode: "read" };
    if ((await handle.queryPermission(opts)) === "granted") {
      return true;
    }
    return (await handle.requestPermission(opts)) === "granted";
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

  async function showRandomWallpaper(dirHandle) {
    const images = await listImageFiles(dirHandle);
    if (images.length === 0) {
      revealHud();
      return;
    }

    const pick = pickFrom(images);
    const file = await pick.getFile();
    const nextUrl = URL.createObjectURL(file);
    await decodeImage(nextUrl);

    back.style.backgroundImage = `url("${nextUrl}")`;
    back.classList.add("visible");
    back.classList.remove("dim");
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

    await remember(pick.name);
    revealHud();
  }

  async function pickFolder() {
    if (!window.showDirectoryPicker) {
      return null;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      await saveDirHandle(handle);
      history = [];
      await saveSettings({ wallpaperHistory: [] });
      return handle;
    } catch (err) {
      if (err.name === "AbortError") {
        return null;
      }
      return null;
    }
  }

  async function runWithSavedFolder() {
    const handle = await loadDirHandle();
    if (!handle) {
      revealHud();
      return;
    }

    const allowed = await ensureReadPermission(handle);
    if (!allowed) {
      revealHud();
      return;
    }

    try {
      await showRandomWallpaper(handle);
    } catch {
      revealHud();
    }
  }

  async function lockFolder() {
    const handle = await pickFolder();
    if (handle) {
      await showRandomWallpaper(handle);
    }
  }

  for (const btn of changeFolderBtns) {
    btn.addEventListener("click", () => {
      lockFolder();
    });
  }

  anotherBtn.addEventListener("click", () => {
    runWithSavedFolder();
  });

  runWithSavedFolder();

  return {
    shuffle: runWithSavedFolder,
    lockFolder,
    isReady: () => ready,
  };
}
