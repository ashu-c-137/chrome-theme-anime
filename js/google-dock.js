const APPS = [
  {
    label: "YouTube",
    url: "https://www.youtube.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FF0033" d="M43.6 14.4c-.5-1.9-2-3.4-3.9-3.9C36.2 9.6 24 9.6 24 9.6s-12.2 0-15.7.9c-1.9.5-3.4 2-3.9 3.9C3.6 17.9 3.6 24 3.6 24s0 6.1.8 9.6c.5 1.9 2 3.4 3.9 3.9 3.5.9 15.7.9 15.7.9s12.2 0 15.7-.9c1.9-.5 3.4-2 3.9-3.9.8-3.5.8-9.6.8-9.6s0-6.1-.8-9.6z"/><path fill="#fff" d="M20.2 30.8V17.2L32.4 24z"/></svg>',
  },
  {
    label: "Drive",
    url: "https://drive.google.com",
    icon:
      '<svg viewBox="0 0 87.3 78" aria-hidden="true"><path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z"/><path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9 9 0 0 0-1.2 4.5h27.5z"/><path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z"/><path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"/><path fill="#2684fc" d="M59.8 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/><path fill="#ffba00" d="M73.4 26.5 60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"/></svg>',
  },
  {
    label: "Docs",
    url: "https://docs.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M28 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V16z"/><path fill="#A1C2FA" d="M28 4v8a4 4 0 0 0 4 4h8z"/><path fill="#fff" d="M16 24h16v2.2H16zm0 5.2h16V31H16zm0 5.2h10v2.2H16z"/></svg>',
  },
  {
    label: "Sheets",
    url: "https://sheets.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#0F9D58" d="M28 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V16z"/><path fill="#87CEAC" d="M28 4v8a4 4 0 0 0 4 4h8z"/><path fill="#fff" d="M15 22h18v14H15z"/><path fill="#0F9D58" d="M21 22h6v14h-6zm-6 4.6h18v4.8H15z"/></svg>',
  },
  {
    label: "Slides",
    url: "https://slides.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#F4B400" d="M28 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V16z"/><path fill="#FDE293" d="M28 4v8a4 4 0 0 0 4 4h8z"/><rect x="15" y="22" width="18" height="13" rx="1.5" fill="#fff"/></svg>',
  },
  {
    label: "Gmail",
    url: "https://mail.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#34A853" d="M45 16.2 40 19l-5 4.7V40h7a3 3 0 0 0 3-3z"/><path fill="#4285F4" d="M3 16.2 6.6 17.9 13 23.7V40H6a3 3 0 0 1-3-3z"/><path fill="#EA4335" d="m35 11.2-11 8.25L13 11.2 12 17l1 6.7L24 32l11-8.3 1-6.7z"/><path fill="#C5221F" d="M3 12.3V16.2l10 7.5V11.2L9.9 8.9A4.3 4.3 0 0 0 7.3 8C4.9 8 3 9.9 3 12.3z"/><path fill="#FBBC04" d="M45 12.3V16.2l-10 7.5V11.2l3.1-2.3A4.3 4.3 0 0 1 40.7 8C43.1 8 45 9.9 45 12.3z"/></svg>',
  },
  {
    label: "Calendar",
    url: "https://calendar.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="7" width="38" height="36" rx="5" fill="#fff"/><path fill="#1A73E8" d="M5 12a5 5 0 0 1 5-5h28a5 5 0 0 1 5 5v8H5z"/><path fill="#1A73E8" d="M16 4h4v8h-4zm12 0h4v8h-4z"/><text x="24" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#1A73E8">31</text></svg>',
  },
  {
    label: "Meet",
    url: "https://meet.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="12" width="26" height="24" rx="5" fill="#00832D"/><path fill="#00AC47" d="M28 18.5v11L44 38V10z"/><path fill="#0066DA" d="M28 29.5 44 38v-5.5z" opacity=".35"/></svg>',
  },
  {
    label: "Photos",
    url: "https://photos.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#F4B400" d="M24 5C24 15 15 24 5 24 15 24 24 15 24 5z"/><path fill="#0F9D58" d="M43 24C33 24 24 15 24 5c0 10 9 19 19 19z"/><path fill="#4285F4" d="M24 43c0-10 9-19 19-19 0 10-9 19-19 19z"/><path fill="#EA4335" d="M5 24c10 0 19 9 19 19C14 43 5 34 5 24z"/></svg>',
  },
  {
    label: "Keep",
    url: "https://keep.google.com",
    icon:
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FDD663" d="M24 5c-7.7 0-14 6.3-14 14 0 5 2.6 9.4 6.5 11.9V36h15v-5.1c3.9-2.5 6.5-6.9 6.5-11.9 0-7.7-6.3-14-14-14z"/><path fill="#F6BF26" d="M18.2 38h11.6v2.4a2.6 2.6 0 0 1-2.6 2.6h-6.4a2.6 2.6 0 0 1-2.6-2.6z"/><path fill="#F6BF26" d="M20 44.2h8V46h-8z"/><path fill="#fff" d="M24 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" opacity=".55"/></svg>',
  },
];

export function initGoogleDock() {
  const rail = document.querySelector(".right-rail");
  const card = document.getElementById("google-dock");
  const grid = document.getElementById("google-dock-grid");
  const btn = document.getElementById("open-google-dock");

  grid.replaceChildren();
  for (const app of APPS) {
    const link = document.createElement("a");
    link.className = "g-dock-app";
    link.href = app.url;
    link.title = app.label;
    link.setAttribute("aria-label", app.label);
    link.innerHTML = `${app.icon}<span>${app.label}</span>`;
    grid.append(link);
  }

  function isOpen() {
    return rail.classList.contains("is-open");
  }

  function open() {
    rail.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close Google apps");
    btn.title = "Close";
    card.setAttribute("aria-hidden", "false");
  }

  function close() {
    rail.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Google apps");
    btn.title = "Google";
    card.setAttribute("aria-hidden", "true");
  }

  function toggle() {
    if (isOpen()) {
      close();
      return;
    }
    open();
  }

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen()) {
      return;
    }
    if (event.target instanceof Node && (card.contains(event.target) || btn.contains(event.target))) {
      return;
    }
    close();
  });

  return { open, close, toggle, isOpen };
}
