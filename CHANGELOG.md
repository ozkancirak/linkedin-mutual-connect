# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/) (0.x = early, the behaviour may still change).

## [0.1.1] - 2026-11-27

Bug-fix release. The fixes were checked with unit tests and simulated pages, not with a live LinkedIn account.

### Fixed
- A profile tab opened by the extension could send an invite to the wrong person when two profile addresses shared a
  prefix (`/in/ali` and `/in/ali-yilmaz`). The tab is now matched by the exact address or by the person's name.
- Pressing Stop and then Start right away could run two sending loops at once and invite the same people twice.
- An unexpected error during scanning left the panel stuck on "running", and "Find and send" waited forever.
- Changing the minimum mutual connections while running emptied the list of found people. The minimum and the daily
  limit are now locked while running.
- A full `chrome.storage.local` quota silently stopped saving the found people. The oldest entries are now dropped to
  make room.
- A button removed by a LinkedIn re-render was counted as a sent invite even when the invite had not gone out.

### Changed
- Removed unused code and merged duplicated invite-counter and card-marking code into shared helpers.
- README: corrected the test coverage and 7-day cache wording, added notes about keeping the tab in the foreground and
  about the invite pace.
- CI runs `npm run check` and `npm test` directly, without the leftover `package.json` guard.
- One more unit test (invite counter).

## [0.1.0] - 2026-11-27

First public version.

### Added
- Floating pill and settings panel on `linkedin.com/mynetwork/*` (draggable, opens upward or downward).
- **Find only** mode: scrolls the whole suggestion list, filters by minimum mutual connections and shows matches in a
  sorted "Mutual connections" box at the top of the page.
- **Find and send** mode: sends invites in order (most mutual connections first) with a daily limit (1-100) and a
  rolling 7-day cap, handles the "add a note" dialog (including shadow DOM) and retries failures.
- Profile-tab fallback managed by a background service worker for people whose invite cannot be sent from the list.
- 7-day cache of found people that survives page refreshes; people already invited are not suggested again.
- English and Turkish LinkedIn interface support.
- Unit tests, static checks and a GitHub Actions workflow.
