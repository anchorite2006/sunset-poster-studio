// Fixed scenes for screenshots: ?shot=editor shows the editor with photos
// loaded; ?shot=cover shows the poster full-bleed. Query params pick the
// sample photos per panel, the caption, the grade, the layout and the size.
// window.__shotReady is set once the scene has painted.
import { EXPORT_SIZES } from './cover.js';

function sizeFromQuery(query) {
  const raw = query.get('size');
  if (!raw) return null;
  const found = EXPORT_SIZES.find((s) => `${s.width}x${s.height}` === raw);
  return found || null;
}

export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await api.loadSamplePhotos();

  const state = api.getState();
  const pick = (key, fallback) => {
    const name = query.get(key) || fallback;
    const file = name.includes('.') ? name : `${name}.jpg`;
    return state.photos.findIndex((p) => p.name === file);
  };

  const hero = pick('photo', 'pier.jpg');
  const second = pick('photo2', query.get('multi') ? 'boulevard.jpg' : 'pier.jpg');
  const third = pick('photo3', query.get('multi') ? 'pier.jpg' : 'boulevard.jpg');

  api.setState({
    caption: query.get('caption') || 'SUNSET DRIVE',
    subtitle: query.get('subtitle') || 'THREE FRAMES, ONE GOLDEN HOUR',
    grade: query.get('grade') || 'sunset',
    layout: query.get('layout') || 'left',
    size: sizeFromQuery(query) || state.size,
  });
  if (hero >= 0) {
    state.panels[0].photo = hero;
    state.panels[1].photo = second >= 0 ? second : hero;
    state.panels[2].photo = third >= 0 ? third : hero;
    if (query.get('zoom')) state.panels[0].zoom = Number(query.get('zoom'));
    if (query.get('panY')) state.panels[0].panY = Number(query.get('panY'));
    api.syncControls();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
