# Description

Chrome extension that clears out the tamo.lt portal Inbox by selecting all messages and bulk-deleting them, page by page.

Portal has no functionality to mark delete all.
Messages by the subject seen as not important never opened and after couple of years shown as +300 unread.

As there is no other way to clean up, wrote this extension to help.

# Usage

1. Download/clone this repo.
2. Go to `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right toggle).
4. Click **Load unpacked** and select this folder.
5. Open Tamo, go to `https://bendrauk.tamo.lt/Messages/Received`.
6. Click the extension's toolbar icon to start. It will select all loaded messages, bulk-delete them, load more ("Rodyti daugiau"), and repeat automatically until the inbox is empty.
7. Click the icon again anytime to stop it.

Progress and status are logged to the page's console (F12 → Console) with a `[Tamo Cleaner]` prefix, so you can follow along or diagnose issues.

# Customization

The extension only runs on `https://bendrauk.tamo.lt/Messages/Received` — edit `TARGET_URL_PREFIX` in `background.js` if your portal uses a different subdomain.

Delays between actions are set conservatively (waiting for confirm dialogs, pausing between rounds) to stay reliable across slower connections — adjust the `sleep(...)` values in `background.js` if you want it faster or more cautious.