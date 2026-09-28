import { firstNameFromFull, resolveFirstName } from "./profile-name.js";

const WEEKDAYS_JP = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) {
    return { en: "Stay sharp.", jp: "朝" };
  }
  if (hour >= 12 && hour < 18) {
    return { en: "Keep moving.", jp: "昼" };
  }
  if (hour >= 18 && hour < 22) {
    return { en: "The night is long.", jp: "夜" };
  }
  return { en: "After hours.", jp: "深夜" };
}

function withName(line, name) {
  if (!name) {
    return line;
  }
  return `${String(line).replace(/[.!]?$/, "")}, ${name}.`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatClock(now, clockFormat) {
  if (clockFormat === "12") {
    let hours = now.getHours() % 12;
    if (hours === 0) {
      hours = 12;
    }
    return `${hours}:${pad(now.getMinutes())}`;
  }
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function initClock(settings, saveSettings) {
  const clockEl = document.getElementById("clock");
  const dateEn = document.getElementById("date-en");
  const dateJp = document.getElementById("date-jp");
  const greetingEl = document.getElementById("greeting");
  const greetingJp = document.getElementById("greeting-jp");

  let clockFormat = settings.clockFormat;
  let userName = firstNameFromFull(settings.firstName);

  function tick() {
    const now = new Date();
    clockEl.textContent = formatClock(now, clockFormat);
    dateEn.textContent = `${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    dateJp.textContent = WEEKDAYS_JP[now.getDay()];
    const greeting = greetingForHour(now.getHours());
    greetingEl.textContent = withName(greeting.en, userName);
    greetingJp.textContent = greeting.jp;
  }

  async function applyName(name, persist) {
    const next = firstNameFromFull(name);
    if (next === userName) {
      return;
    }
    userName = next;
    settings.firstName = next;
    tick();
    if (persist && saveSettings) {
      await saveSettings({ firstName: next });
    }
  }

  tick();
  window.setInterval(tick, 1000);
  resolveFirstName(userName).then((name) => {
    applyName(name, name !== userName);
  });
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local" || !changes.firstName) {
      return;
    }
    applyName(changes.firstName.newValue, false);
  });

  return {
    setFormat(next) {
      clockFormat = next === "12" ? "12" : "24";
      tick();
    },
    setFirstName(name) {
      applyName(name, true);
    },
  };
}
