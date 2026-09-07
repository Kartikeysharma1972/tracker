# Momentum — Habit Tracker

A private, offline-first discipline & habit tracker. Single-file web app (vanilla HTML/CSS/JS) — no backend, all data stays in your browser's `localStorage`. Installable as a PWA (add to home screen).

## Features
- **Landscape habit matrix** — habits × days, weekday headers, month navigation, sticky header + first column
- **One-click cells** — empty → ✓ → ✗ → ✓ (right-click to clear); count habits (e.g. coffee cups) increment 0 → 1 → 2…
- **Grid + Dashboard** views — weekly bars, month heatmap, streak & completion leaderboards
- Per-habit streaks, weekly goals, color & emoji; add / edit / reorder / archive
- **Smart Mirror (dark)** + light-grey glass themes
- Search, undo, optional PIN lock
- Export/Import (JSON + CSV), versioned schema with auto-migration
- **PWA** — offline, installable on iPhone/Android/desktop

## Run locally
```bash
python -m http.server 8080
# open http://localhost:8080
```
Or just open `index.html` directly.

## Deploy
Static hosting (GitHub Pages / Netlify / Cloudflare Pages). HTTPS required for PWA install on mobile.

---
Built with Claude Code.
