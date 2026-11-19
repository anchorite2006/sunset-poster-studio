// Sunset Poster Studio — poster renderer.
// Draws a three-panel cover (one big hero panel plus two smaller ones),
// grades it, letters the caption, and exports PNG files.
// No network, no libraries: plain canvas 2D.

export const EXPORT_SIZES = [
  { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  { label: 'Landscape 1920 x 1080', width: 1920, height: 1080 },
];

export const GRADES = ['sunset', 'neon', 'noir'];
export const LAYOUTS = ['left', 'top'];

export function makeFreshState() {
  return {
    photos: [],
    panels: [
      { photo: -1, zoom: 1, panX: 0, panY: 0 },
      { photo: -1, zoom: 1, panX: 0, panY: 0 },
      { photo: -1, zoom: 1, panX: 0, panY: 0 },
    ],
    layout: 'left',
    grade: 'sunset',
    caption: 'SUNSET DRIVE',
    subtitle: 'THREE FRAMES, ONE GOLDEN HOUR',
    titleScale: 1,
    titleGap: 6,
    titleColor: '#ffffff',
    size: { width: 1920, height: 1080 },
  };
}

function panelRects(width, height, layout) {
  const band = Math.round(height * 0.2);
  const art = height - band;
  const seam = Math.max(4, Math.round(width * 0.005));
  if (layout === 'top') {
    const heroH = Math.round(art * 0.62);
    const smallH = art - heroH - seam;
    const smallW = Math.round((width - seam) / 2);
    return [
      { x: 0, y: 0, w: width, h: heroH },
      { x: 0, y: heroH + seam, w: smallW, h: smallH },
      { x: smallW + seam, y: heroH + seam, w: width - smallW - seam, h: smallH },
    ];
  }
  const heroW = Math.round(width * 0.62);
  const sideW = width - heroW - seam;
  const smallH = Math.round((art - seam) / 2);
  return [
    { x: 0, y: 0, w: heroW, h: art },
    { x: heroW + seam, y: 0, w: sideW, h: smallH },
    { x: heroW + seam, y: smallH + seam, w: sideW, h: art - smallH - seam },
  ];
}

export function posterPanelRects(width, height, layout) {
  return panelRects(width, height, layout);
}

function gradeFilter(grade) {
  if (grade === 'neon') return 'saturate(1.65) contrast(1.16) brightness(1.04)';
  if (grade === 'noir') return 'grayscale(1) contrast(1.28) brightness(1.06)';
  return 'saturate(1.32) contrast(1.08) brightness(1.03)';
}

function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#ff9a3d');
  g.addColorStop(0.55, '#ff5e7a');
  g.addColorStop(1, '#5b2a86');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.42;
  const r = Math.min(rect.w, rect.h) * 0.2;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 30, 0.55)';
  ctx.fillRect(rect.x, cy + r * 0.4, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = `700 ${Math.max(13, Math.round(rect.w * 0.045))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', cx, rect.y + rect.h * 0.78);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function cropAndPositionPhoto(ctx, image, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!image) {
    drawEmptyPanel(ctx, rect);
    ctx.restore();
    return;
  }
  const base = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
  const zoom = Math.max(1, panel.zoom || 1);
  const dw = image.naturalWidth * base * zoom;
  const dh = image.naturalHeight * base * zoom;
  const maxPanX = Math.max(0, (dw - rect.w) / 2 / rect.w);
  const maxPanY = Math.max(0, (dh - rect.h) / 2 / rect.h);
  const panX = Math.max(-maxPanX, Math.min(maxPanX, panel.panX || 0));
  const panY = Math.max(-maxPanY, Math.min(maxPanY, panel.panY || 0));
  const dx = rect.x + (rect.w - dw) / 2 + panX * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panY * rect.h;
  ctx.filter = gradeFilter(grade);
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

export function applySunsetGrade(ctx, grade, width, height, artBottom) {
  ctx.save();
  if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, width, artBottom);
    g.addColorStop(0, 'rgba(255, 0, 140, 0.22)');
    g.addColorStop(0.5, 'rgba(120, 0, 255, 0.08)');
    g.addColorStop(1, 'rgba(0, 220, 255, 0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, artBottom);
  } else if (grade === 'noir') {
    const g = ctx.createLinearGradient(0, 0, 0, artBottom);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, artBottom);
  } else {
    const g = ctx.createLinearGradient(0, 0, width, artBottom);
    g.addColorStop(0, 'rgba(255, 190, 90, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 110, 40, 0.06)');
    g.addColorStop(1, 'rgba(255, 60, 90, 0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, artBottom);
    const glow = ctx.createRadialGradient(
      width * 0.82, artBottom * 0.12, 0,
      width * 0.82, artBottom * 0.12, width * 0.45,
    );
    glow.addColorStop(0, 'rgba(255, 200, 110, 0.20)');
    glow.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, artBottom);
  }
  const vig = ctx.createRadialGradient(
    width / 2, artBottom / 2, Math.min(width, artBottom) * 0.42,
    width / 2, artBottom / 2, Math.max(width, artBottom) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, artBottom);
  ctx.restore();
}

function drawCornerBadge(ctx, rect) {
  const r = Math.min(rect.w, rect.h) * 0.16;
  const cx = rect.x + rect.w - r - Math.max(10, rect.w * 0.03);
  const cy = rect.y + r + Math.max(10, rect.h * 0.04);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12, 8, 24, 0.55)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = '#ffd166';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(cx, cy - r * 0.62, cx, cy + r * 0.62);
  g.addColorStop(0, '#ffd166');
  g.addColorStop(0.6, '#ff7a3d');
  g.addColorStop(1, '#ff3d77');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = 'rgba(12, 8, 24, 0.85)';
  const lineGap = r * 0.22;
  for (let i = 0; i < 3; i += 1) {
    const y = cy + r * 0.12 + i * lineGap;
    const half = Math.sqrt(Math.max(0, (r * 0.62) ** 2 - (y - cy) ** 2));
    ctx.fillRect(cx - half, y, half * 2, Math.max(1.5, r * 0.05));
  }
  ctx.restore();
}

export function drawCaptionLettering(ctx, state, width, height, bandTop) {
  const bandH = height - bandTop;
  const margin = Math.round(width * 0.045);
  ctx.save();
  const band = ctx.createLinearGradient(0, bandTop, 0, height);
  band.addColorStop(0, '#140a24');
  band.addColorStop(1, '#0a0616');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, width, bandH);
  const stripe = ctx.createLinearGradient(0, 0, width, 0);
  stripe.addColorStop(0, '#ffd166');
  stripe.addColorStop(0.45, '#ff7a3d');
  stripe.addColorStop(0.8, '#ff3d77');
  stripe.addColorStop(1, '#7a5cff');
  ctx.fillStyle = stripe;
  ctx.fillRect(0, bandTop, width, Math.max(3, Math.round(height * 0.005)));

  const title = (state.caption || 'SUNSET DRIVE').toUpperCase();
  let size = Math.round(height * 0.104 * (state.titleScale || 1));
  const gap = state.titleGap ?? 6;
  const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`; };
  try { ctx.letterSpacing = `${gap}px`; } catch { /* older canvas: ignore */ }
  setFont(size);
  const maxW = width - margin * 2;
  while (size > 20 && ctx.measureText(title).width > maxW) {
    size = Math.round(size * 0.94);
    setFont(size);
  }
  const titleY = bandTop + bandH * 0.56;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(size * 0.12);
  ctx.shadowOffsetY = Math.round(size * 0.05);
  ctx.strokeStyle = '#1c0b2e';
  ctx.lineWidth = Math.max(3, Math.round(size * 0.09));
  ctx.strokeText(title, margin, titleY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = state.titleColor || '#ffffff';
  ctx.fillText(title, margin, titleY);

  const sub = (state.subtitle || '').toUpperCase();
  const mark = 'SUNSET POSTER STUDIO';
  const markSize = Math.max(10, Math.round(height * 0.02));
  try { ctx.letterSpacing = `${Math.max(2, Math.round(markSize * 0.25))}px`; } catch { /* ignore */ }
  ctx.font = `700 ${markSize}px system-ui, sans-serif`;
  const markW = ctx.measureText(mark).width;
  if (sub) {
    let subSize = Math.max(11, Math.round(height * 0.026));
    const subGap = () => Math.max(2, Math.round(subSize * 0.22));
    const setSubFont = (s) => {
      try { ctx.letterSpacing = `${subGap()}px`; } catch { /* ignore */ }
      ctx.font = `700 ${s}px system-ui, sans-serif`;
    };
    setSubFont(subSize);
    const maxSubW = Math.max(60, width - margin * 2 - markW - Math.round(width * 0.03));
    while (subSize > 9 && ctx.measureText(sub).width > maxSubW) {
      subSize -= 1;
      setSubFont(subSize);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(sub, margin, bandTop + bandH * 0.86);
  }
  try { ctx.letterSpacing = `${Math.max(2, Math.round(markSize * 0.25))}px`; } catch { /* ignore */ }
  ctx.font = `700 ${markSize}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.95)';
  ctx.textAlign = 'right';
  ctx.fillText(mark, width - margin, bandTop + bandH * 0.86);
  ctx.textAlign = 'left';
  ctx.restore();
}

export function drawPosterPanels(ctx, state, width, height) {
  const band = Math.round(height * 0.2);
  const artBottom = height - band;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const rects = panelRects(width, height, state.layout || 'left');
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const photo = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
    cropAndPositionPhoto(ctx, photo ? photo.image : null, rect, panel || {}, state.grade || 'sunset');
    ctx.strokeStyle = 'rgba(20, 8, 30, 0.55)';
    ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0012));
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  });
  applySunsetGrade(ctx, state.grade || 'sunset', width, height, artBottom);
  drawCornerBadge(ctx, rects[0]);
  drawCaptionLettering(ctx, state, width, height, artBottom);
  ctx.restore();
  return rects;
}

export function exportCoverPNG(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawPosterPanels(ctx, state, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG export failed'));
    }, 'image/png');
  });
}

export function exportCoverDataURL(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawPosterPanels(ctx, state, width, height);
  return canvas.toDataURL('image/png');
}
