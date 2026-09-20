const RESOURCE_HIDE = [
  "ins.adsbygoogle",
  "[id^='google_ads_']",
  "[id^='div-gpt-ad']",
  "[id^='gpt_unit_']",
  "iframe[src*='googlesyndication']",
  "iframe[src*='doubleclick.net']",
  "iframe[src*='googleadservices']",
  "iframe[src*='amazon-adsystem']",
  "iframe[src*='taboola']",
  "iframe[src*='outbrain']",
  "iframe[id^='google_ads']",
  ".OUTBRAIN",
  "div[id^='taboola-']",
  ".trc_related_container",
  "#masthead-ad",
  "#player-ads",
  "#offer-module",
  "ytd-ad-slot-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-sparkles-text-search-renderer",
  "ytd-display-ad-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-action-companion-ad-renderer",
  "ytd-banner-promo-renderer",
  "ytd-player-legacy-desktop-watch-ads-renderer",
  "ytd-rich-item-renderer:has(ytd-ad-slot-renderer)",
  "ytd-reel-video-renderer:has(ytd-ad-slot-renderer)",
  ".ytp-ad-overlay-container",
  ".ytp-ad-module",
  ".video-ads.ytp-ad-module",
];

const STYLE_ID = "newtab-adblock-style";

function ensureStyle() {
  if (document.getElementById(STYLE_ID) || !document.documentElement) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `${RESOURCE_HIDE.join(",")}{display:none!important;height:0!important;max-height:0!important;min-height:0!important;visibility:hidden!important;overflow:hidden!important;pointer-events:none!important;}`;
  document.documentElement.append(style);
}

function skipYouTube() {
  if (!/(^|\.)youtube\.com$/.test(location.hostname)) {
    return;
  }
  const skip = document.querySelector(
    ".ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button-modern"
  );
  if (skip instanceof HTMLElement) {
    skip.click();
  }
  const player = document.querySelector(".html5-video-player.ad-showing");
  if (!player) {
    return;
  }
  const video = player.querySelector("video");
  if (video instanceof HTMLVideoElement && Number.isFinite(video.duration) && video.duration > 0) {
    video.muted = true;
    video.currentTime = video.duration;
  }
}

function sweep() {
  ensureStyle();
  skipYouTube();
}

ensureStyle();
sweep();

let sweepQueued = false;
const observer = new MutationObserver(() => {
  if (sweepQueued) {
    return;
  }
  sweepQueued = true;
  requestAnimationFrame(() => {
    sweepQueued = false;
    sweep();
  });
});

observer.observe(document.documentElement || document, {
  childList: true,
  subtree: true,
});

if (window === window.top && /(^|\.)youtube\.com$/.test(location.hostname)) {
  setInterval(skipYouTube, 700);
}
