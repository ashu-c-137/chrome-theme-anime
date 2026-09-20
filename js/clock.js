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

export function initClock(settings) {
  const clockEl = document.getElementById("clock");
  const dateEn = document.getElementById("date-en");
  const dateJp = document.getElementById("date-jp");
  const greetingEl = document.getElementById("greeting");
  const greetingJp = document.getElementById("greeting-jp");

  let clockFormat = settings.clockFormat;

  function tick() {
    const now = new Date();
    clockEl.textContent = formatClock(now, clockFormat);
    dateEn.textContent = `${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    dateJp.textContent = WEEKDAYS_JP[now.getDay()];
    const greeting = greetingForHour(now.getHours());
    greetingEl.textContent = greeting.en;
    greetingJp.textContent = greeting.jp;
  }

  tick();
  window.setInterval(tick, 1000);

  return {
    setFormat(next) {
      clockFormat = next === "12" ? "12" : "24";
      tick();
    },
  };
}
