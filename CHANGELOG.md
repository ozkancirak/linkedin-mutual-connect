# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/) (0.x = early, the behaviour may still change).

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
