# Noir Pulse

Dark cinematic new tab for Chrome. Random wallpapers from a local folder, plus clock, search, notes, shortcuts, a speed test, and ad blocking.

This is a personal unpacked extension. It is not for the Chrome Web Store.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this folder
5. Open a new tab and click **Folder** to lock a local image directory

After code changes, click **Reload** on the extension card.

Wallpapers, notes, and settings stay in this browser profile (IndexedDB and `chrome.storage.local`). They are not part of the project files.

## Keys

Press `?` on the new tab (or the corner mark) for the full legend.

## Privacy

The extension does not phone home. Network use is only what you trigger:

- Search goes to the engine you picked
- Shortcut tiles may load favicons from Google or DuckDuckGo
- Speed test talks to `speed.cloudflare.com`
- Ad blocking uses `declarativeNetRequest` on pages you visit
