# Sunset Poster Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/anchorite2006/sunset-poster-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/anchorite2006/sunset-poster-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sunset Poster Studio turns your own photos and a caption into a multi-panel poster cover in the style of a sunset-drenched crime saga — one big hero panel, two smaller panels, bold outlined lettering, and a sunset, neon, or noir colour grade. It runs entirely offline in a desktop browser: photos are read on your machine and never uploaded. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty.

## What it does

- Load your own photos (multi-select), one photo can fill several panels
- Crop and position each panel: drag to pan, slider to zoom
- Two layouts (hero on the left, hero on top) and three grades (Sunset, Neon, Noir)
- Editable title and sub-caption, with size, letter spacing, and colour controls
- Live preview, then one-click PNG export at 1080 × 1080, 1080 × 1350, or 1920 × 1080

## Run it locally

```
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Zero network requests: the display font (Anton, SIL OFL) is bundled under `app/fonts/`, and the two sample photos under `app/samples/` were made with an image model and are free to use.

## Files

- `app/index.html`, `app/style.css` — the editor page
- `app/src/cover.js` — the poster renderer (panels, grade, lettering, PNG export)
- `app/src/main.js` — editor wiring (photo loading, drag-to-pan, exports)
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
