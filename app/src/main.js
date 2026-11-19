// Sunset Poster Studio — editor wiring.
// Loads local photos, keeps panel/grade/caption state, paints the live
// preview, and downloads the exported PNG. Photos never leave the machine.
import {
  EXPORT_SIZES,
  makeFreshState,
  drawPosterPanels,
  posterPanelRects,
  exportCoverPNG,
  exportCoverDataURL,
} from './cover.js';
import { runShot } from './shots.js';

const PANEL_NAMES = ['Hero panel', 'Second panel', 'Third panel'];

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const photoInput = document.getElementById('photo-input');
const photoCount = document.getElementById('photo-count');
const panelRows = document.getElementById('panel-rows');
const zoomSlider = document.getElementById('zoom-slider');
const activeLabel = document.getElementById('active-panel-label');
const captionInput = document.getElementById('caption-input');
const subtitleInput = document.getElementById('subtitle-input');
const titleSize = document.getElementById('title-size');
const titleGap = document.getElementById('title-gap');
const titleColor = document.getElementById('title-color');
const exportStatus = document.getElementById('export-status');

const state = makeFreshState();
let activePanel = 0;
let dragging = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

function fitPreviewCanvas() {
  const size = state.size;
  const w = 960;
  canvas.width = w;
  canvas.height = Math.round((w * size.height) / size.width);
}

export function renderPreview() {
  fitPreviewCanvas();
  drawPosterPanels(ctx, state, canvas.width, canvas.height);
  const panel = state.panels[activePanel];
  activeLabel.textContent =
    `Panel: ${PANEL_NAMES[activePanel]} — click a panel, then drag to move its photo` +
    (panel.photo < 0 ? ' (empty)' : '');
  zoomSlider.value = String(state.panels[activePanel].zoom || 1);
}

function refreshPhotoOptions() {
  const selects = panelRows.querySelectorAll('select');
  selects.forEach((select, i) => {
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '-1';
    empty.textContent = 'Empty panel';
    select.appendChild(empty);
    state.photos.forEach((photo, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = photo.name;
      select.appendChild(option);
    });
    select.value = String(state.panels[i].photo);
  });
  photoCount.textContent =
    state.photos.length === 0
      ? 'No photos yet.'
      : `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded — one photo can fill several panels.`;
  panelRows.querySelectorAll('.panel-row').forEach((row, i) => {
    row.classList.toggle('is-active', i === activePanel);
  });
}

function buildPanelRows() {
  panelRows.innerHTML = '';
  PANEL_NAMES.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row';
    const label = document.createElement('label');
    label.textContent = name;
    label.htmlFor = `panel-photo-${i}`;
    const select = document.createElement('select');
    select.id = `panel-photo-${i}`;
    select.setAttribute('aria-label', `${name} photo`);
    select.addEventListener('change', () => {
      state.panels[i].photo = Number(select.value);
      activePanel = i;
      refreshPhotoOptions();
      renderPreview();
    });
    row.appendChild(label);
    row.appendChild(select);
    row.addEventListener('click', () => {
      activePanel = i;
      refreshPhotoOptions();
      renderPreview();
    });
    panelRows.appendChild(row);
  });
  refreshPhotoOptions();
}

export async function addPhotos(files) {
  const list = Array.from(files || []);
  for (const file of list) {
    if (!file.type.startsWith('image/')) continue;
    const image = await loadImage(URL.createObjectURL(file));
    const index = state.photos.length;
    state.photos.push({ name: file.name, image });
    state.panels.forEach((panel) => {
      if (panel.photo < 0) panel.photo = index;
    });
  }
  refreshPhotoOptions();
  renderPreview();
}

export async function loadSamplePhotos() {
  const names = ['boulevard.jpg', 'pier.jpg'];
  for (const name of names) {
    if (state.photos.some((p) => p.name === name)) continue;
    const image = await loadImage(`samples/${name}`);
    const index = state.photos.length;
    state.photos.push({ name, image });
    state.panels.forEach((panel) => {
      if (panel.photo < 0) panel.photo = index;
    });
  }
  refreshPhotoOptions();
  renderPreview();
}

function pointToPanel(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const rects = posterPanelRects(canvas.width, canvas.height, state.layout);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return { index: i, x, y };
  }
  return null;
}

canvas.addEventListener('pointerdown', (event) => {
  const hit = pointToPanel(event);
  if (!hit) return;
  activePanel = hit.index;
  refreshPhotoOptions();
  renderPreview();
  const panel = state.panels[activePanel];
  dragging = { x: hit.x, y: hit.y, panX: panel.panX || 0, panY: panel.panY || 0 };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const hit = pointToPanel(event);
  if (!hit) return;
  const rects = posterPanelRects(canvas.width, canvas.height, state.layout);
  const rect = rects[activePanel];
  const panel = state.panels[activePanel];
  panel.panX = dragging.panX + (hit.x - dragging.x) / rect.w;
  panel.panY = dragging.panY + (hit.y - dragging.y) / rect.h;
  renderPreview();
});

function endDrag() {
  dragging = null;
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

photoInput.addEventListener('change', async (event) => {
  await addPhotos(event.target.files);
  event.target.value = '';
});

document.getElementById('load-samples').addEventListener('click', () => {
  loadSamplePhotos().catch(() => {
    photoCount.textContent = 'Sample photos could not be loaded.';
  });
});

zoomSlider.addEventListener('input', () => {
  state.panels[activePanel].zoom = Number(zoomSlider.value);
  renderPreview();
});

document.querySelectorAll('.layout-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('is-on', b === button));
    renderPreview();
  });
});

document.querySelectorAll('.grade-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('is-on', b === button));
    renderPreview();
  });
});

document.querySelectorAll('.size-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.size = EXPORT_SIZES[Number(button.dataset.size)];
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-on', b === button));
    renderPreview();
  });
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  renderPreview();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  renderPreview();
});
titleSize.addEventListener('input', () => {
  state.titleScale = Number(titleSize.value);
  renderPreview();
});
titleGap.addEventListener('input', () => {
  state.titleGap = Number(titleGap.value);
  renderPreview();
});
titleColor.addEventListener('input', () => {
  state.titleColor = titleColor.value;
  renderPreview();
});

document.querySelectorAll('.export-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const size = EXPORT_SIZES[Number(button.dataset.export)];
    exportStatus.textContent = `Exporting ${size.width} x ${size.height}…`;
    try {
      const blob = await exportCoverPNG(state, size.width, size.height);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sunset-poster-${size.width}x${size.height}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      exportStatus.textContent = `Saved sunset-poster-${size.width}x${size.height}.png`;
    } catch {
      exportStatus.textContent = 'Export failed — try again.';
    }
  });
});

// Hooks the screenshot script and the finalist review use: export without a
// download, and read the live state.
window.__studio = {
  state,
  renderPreview,
  addPhotos,
  loadSamplePhotos,
  exportCoverDataURL: (width, height) => exportCoverDataURL(state, width, height),
  exportCoverPNG: (width, height) => exportCoverPNG(state, width, height),
};

buildPanelRows();
renderPreview();

if (document.fonts && document.fonts.load) {
  document.fonts.load('80px Anton').then(renderPreview).catch(() => undefined);
  document.fonts.ready.then(renderPreview).catch(() => undefined);
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadSamplePhotos,
    getState() { return state; },
    render() { renderPreview(); },
    syncControls() { refreshPhotoOptions(); renderPreview(); },
    setState(patch) {
      Object.assign(state, patch);
      if (patch.caption !== undefined) captionInput.value = patch.caption;
      if (patch.subtitle !== undefined) subtitleInput.value = patch.subtitle;
      if (patch.grade) {
        document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.grade === patch.grade));
      }
      if (patch.layout) {
        document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.layout === patch.layout));
      }
      if (patch.size) {
        const index = EXPORT_SIZES.findIndex((s) => s.width === patch.size.width && s.height === patch.size.height);
        if (index >= 0) {
          document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-on', Number(b.dataset.size) === index));
        }
      }
      refreshPhotoOptions();
      renderPreview();
    },
  });
}
