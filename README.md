# LinkedIn Mutual Connect

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
![version](https://img.shields.io/badge/version-0.1.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)

Chrome extension (Manifest V3) that scans LinkedIn's **"People you may know"** page, lists the people you share
**many mutual connections** with at the top of the page, and sends connection invites to them.

🇹🇷 [Türkçe README](README.tr.md)

> ⚠️ **Read this first.** LinkedIn's [User Agreement](https://www.linkedin.com/legal/user-agreement) prohibits
> automating the site. Using this tool can get your account **restricted**. It is an early (0.x) hobby project,
> provided as is, and **you use it at your own risk**. Start with a low daily limit.

## What it does

- Opens as a small draggable pill at the bottom of `linkedin.com/mynetwork/*` and expands into a panel.
- **Find only** mode: scrolls the whole suggestion list, filters by a minimum number of mutual connections and shows
  the matches in a **"Mutual connections"** box at the top of the page, sorted from most to fewest. Nothing is sent.
- **Find and send** mode: sends invites to those people in order (most mutual connections first), up to a daily limit.
  The page is not rescanned if you already scanned it; scanning and sending can also run at the same time.
- Handles the "Add a note to your invitation?" dialog automatically (sends **without a note**).
- People whose invite could not be sent from the list page are opened in their profile in a tab managed by the
  extension, where the invite is sent and the tab is closed.
- Remembers found people for 7 days (so a page refresh does not lose them) and, during that time, does not suggest
  someone you already invited again.
- Works with the English and Turkish LinkedIn interface.

## Install (unpacked)

1. Download or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
4. Open <https://www.linkedin.com/mynetwork/grow/> and click the pill at the bottom.

After changing any file, press **Reload** on the extension and refresh the LinkedIn tab.

## Usage

| Setting | Meaning |
| --- | --- |
| **Find only / Find and send** | Mode switch. "Find only" never sends anything. |
| **Min. mutual connections** | Only people with at least this many mutual connections are listed (1–1000). You can type a number. |
| **Daily limit** | Maximum invites per day (1–100). A rolling 7-day cap of 100 invites is always enforced. |

The pill can be dragged anywhere; the position is remembered. The panel opens below the pill when it is near the
top of the screen.

## How it stays out of the way

- It does nothing until you press the button. Scanning and sending never start by themselves.
- It stops when LinkedIn shows an invitation-limit warning, or when 10 invites in a row fail.
- The only permission it asks for is `storage`. It makes **no network requests of its own** and has no analytics.
  Settings, counters and a cache of the cards it found stay in `chrome.storage.local` on your machine.

## Limitations

- LinkedIn changes its markup often; selectors may need updates. The unit tests only cover the pure helpers (button
  and mutual-count detection, the invite counter). The page logic is tested neither against mock pages nor against a
  live LinkedIn account.
- The interface texts are in Turkish.
- Keep the LinkedIn tab in the foreground while it runs: Chrome slows down timers in background tabs, which can make
  scanning and sending very slow.
- Sending many invites quickly looks like automation to LinkedIn. Invites go out about 0.5–1 second apart, so keep the
  daily limit low, especially on new accounts. The weekly counter only counts invites sent by this extension, not the
  ones you send by hand or from other devices.

## Project layout

```
manifest.json      MV3 manifest (content scripts load in the listed order, they share one global scope)
background.js      service worker: opens/closes profile tabs for the content script
src/core.js        constants, mutual-count parsing, Connect-button detection, counters
src/panel.js       pill + panel UI (shadow DOM), rendering and state
src/people.js      suggestion scan, "mutual connections" box, cache
src/send.js        invite sending, note-dialog handling (incl. shadow DOM), limits, retries
src/events.js      panel controls, dragging, page tracking
src/profile.js     profile-tab flow, cross-tab sync, startup
test/              unit tests (node --test)
scripts/check.js   static checks used by CI
```

## Development

No dependencies, Node 18+ is enough.

```bash
npm run check   # manifest files exist, JS syntax, versions match, minimal permissions
npm test        # unit tests for parsing and detection
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

[MIT](LICENSE)
