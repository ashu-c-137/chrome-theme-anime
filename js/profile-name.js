export function firstNameFromFull(value) {
  const cleaned = String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.includes("@")) {
    return "";
  }
  const first = cleaned.split(" ")[0].replace(/[,.;:]+$/g, "");
  if (!first) {
    return "";
  }
  if (!/^[\p{L}][\p{L}.'’-]*$/u.test(first)) {
    return "";
  }
  if (/^[A-Za-z]/.test(first) && first.length < 2) {
    return "";
  }
  if (first === first.toUpperCase() && /[A-Z]/.test(first)) {
    return first.charAt(0) + first.slice(1).toLowerCase();
  }
  return first;
}

export async function scrapeAccountGivenName() {
  const firstFrom = (full) => {
    const cleaned = String(full || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned || cleaned.includes("@")) {
      return "";
    }
    const first = cleaned.split(" ")[0].replace(/[,.;:]+$/g, "");
    if (!first || !/^[\p{L}][\p{L}.'’-]*$/u.test(first)) {
      return "";
    }
    if (/^[A-Za-z]/.test(first) && first.length < 2) {
      return "";
    }
    if (first === first.toUpperCase() && /[A-Z]/.test(first)) {
      return first.charAt(0) + first.slice(1).toLowerCase();
    }
    return first;
  };

  const fromLabel = (label) => {
    const text = String(label || "").replace(/\u00a0/g, " ");
    const match =
      text.match(
        /(?:Google Account|Google account|Compte Google|Cuenta de Google|Google-Konto)\s*:\s*([^(\n]+?)\s*\(\s*[^)]*@/i
      ) || text.match(/Google Account:\s*([^(\n]+)/i);
    return match ? firstFrom(match[1]) : "";
  };

  for (const node of document.querySelectorAll("[aria-label]")) {
    const name = fromLabel(node.getAttribute("aria-label"));
    if (name) {
      return name;
    }
  }

  const account = document.querySelector(
    "#account-name, ytd-active-account-header-renderer #account-name"
  );
  const fromDom = firstFrom(account?.textContent);
  if (fromDom) {
    return fromDom;
  }

  const host = String(location.hostname || "").replace(/^www\./, "");
  if (!/youtube\.com$/.test(host)) {
    return "";
  }

  try {
    const ytcfg = window.ytcfg;
    const context = ytcfg?.get?.("INNERTUBE_CONTEXT");
    if (!context) {
      return "";
    }
    const res = await fetch("/youtubei/v1/account/account_menu?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ context }),
    });
    if (!res.ok) {
      return "";
    }
    const data = await res.json();
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") {
        continue;
      }
      const header = node.activeAccountHeaderRenderer?.accountName;
      if (header) {
        const text =
          header.simpleText ||
          (Array.isArray(header.runs) ? header.runs.map((part) => part.text).join("") : "");
        const name = firstFrom(text);
        if (name) {
          return name;
        }
      }
      const values = Array.isArray(node) ? node : Object.values(node);
      for (const value of values) {
        if (value && typeof value === "object") {
          stack.push(value);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

export async function readStoredFirstName() {
  try {
    return firstNameFromFull((await chrome.storage.local.get("firstName")).firstName);
  } catch {
    return "";
  }
}

export async function saveFirstName(name) {
  const next = firstNameFromFull(name);
  if (!next) {
    return "";
  }
  try {
    await chrome.storage.local.set({ firstName: next });
  } catch {
    /* ignore */
  }
  return next;
}

export async function readBundledFirstName() {
  try {
    const res = await fetch(chrome.runtime.getURL("local-user.json"));
    if (!res.ok) {
      return "";
    }
    const data = await res.json();
    return firstNameFromFull(data.firstName || data.fullName || "");
  } catch {
    return "";
  }
}

export async function captureFirstNameFromTabs() {
  if (!globalThis.chrome?.tabs?.query || !chrome.scripting?.executeScript) {
    return "";
  }
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({
      url: ["https://*.google.com/*", "https://*.youtube.com/*", "https://youtube.com/*"],
    });
  } catch {
    return "";
  }
  for (const tab of tabs) {
    const name = await captureFirstNameFromTab(tab.id, tab.url);
    if (name) {
      return name;
    }
  }
  return "";
}

export async function captureFirstNameFromTab(tabId, url) {
  if (!tabId || !isAccountUrl(url) || !chrome.scripting?.executeScript) {
    return "";
  }
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: scrapeAccountGivenName,
    });
    const name = firstNameFromFull(results?.[0]?.result);
    if (name) {
      await saveFirstName(name);
    }
    return name;
  } catch {
    return "";
  }
}

export async function resolveFirstName(existing = "") {
  const fromSettings = firstNameFromFull(existing);
  if (fromSettings) {
    return fromSettings;
  }
  const stored = await readStoredFirstName();
  if (stored) {
    return stored;
  }
  const bundled = await readBundledFirstName();
  if (bundled) {
    await saveFirstName(bundled);
    return bundled;
  }
  return captureFirstNameFromTabs();
}

function isAccountUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host.endsWith(".google.com") || host === "google.com";
  } catch {
    return false;
  }
}
