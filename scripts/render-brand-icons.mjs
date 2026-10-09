/**
 * Rasteriza el isotipo oficial de AlivIA a los PNG de Expo.
 * Comando: node scripts/render-brand-icons.mjs
 *
 * Fuente: mismos trazos y degradados que
 * AlivIACare/src/app/icon.svg y LogoMark (Brand.tsx / BrandLogo.tsx).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public');

const SAGE = '#eef1ec';
const WHITE = '#ffffff';

/** Trazos del isotipo. `gap` es el color del fondo: separa el arco de las piernas. */
function mark(gap) {
  return `
  <defs>
    <linearGradient id="l" x1="50" y1="10" x2="30" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8DC85F"/>
      <stop offset="1" stop-color="#2A9D86"/>
    </linearGradient>
    <linearGradient id="r" x1="50" y1="10" x2="74" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7DBE63"/>
      <stop offset="1" stop-color="#1E93B0"/>
    </linearGradient>
    <linearGradient id="s" x1="22" y1="70" x2="86" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2E8F9A"/>
      <stop offset="1" stop-color="#A6D0EE"/>
    </linearGradient>
  </defs>
  <path d="M50 16L23 82" stroke="url(#l)" stroke-width="17" stroke-linecap="round"/>
  <path d="M50 16L75 82" stroke="url(#r)" stroke-width="15" stroke-linecap="round"/>
  <path d="M22 63Q50 82 84 46" stroke="${gap}" stroke-width="13" stroke-linecap="round"/>
  <path d="M22 63Q50 82 84 46" stroke="url(#s)" stroke-width="6.5" stroke-linecap="round"/>`;
}

function svg({ width, height, viewBox, bg, gap }) {
  const [x, y, w, h] = viewBox;
  const plate = bg
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}" fill="none">
  ${plate}
  ${mark(gap)}
</svg>`;
}

function render(svgText, background) {
  const resvg = new Resvg(svgText, {
    shapeRendering: 2,
    textRendering: 2,
    imageRendering: 0,
    background,
    font: { loadSystemFonts: false },
  });
  const image = resvg.render();
  return { png: image.asPng(), rgba: image.pixels, width: image.width, height: image.height };
}

/** PNG RGB sin canal alfa (icono iOS no admite transparencia). */
function encodeRgbPng(width, height, rgba) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = row + 1 + x * 3;
      const a = rgba[s + 3] / 255;
      raw[d] = Math.round(rgba[s] * a + 255 * (1 - a));
      raw[d + 1] = Math.round(rgba[s + 1] * a + 255 * (1 - a));
      raw[d + 2] = Math.round(rgba[s + 2] * a + 255 * (1 - a));
    }
  }
  return packPng(width, height, 2, deflateSync(raw));
}

function packPng(width, height, colorType, compressed) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeInt32BE(crc, 8 + data.length);
  return out;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

function inkBounds(rgba, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let maxR = 0;
  const cx = width / 2;
  const cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
      if (a < 12) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (r > maxR) maxR = r;
    }
  }
  return { minX, minY, maxX, maxY, maxR };
}

mkdirSync(outDir, { recursive: true });

const icon = render(
  svg({
    width: 1024,
    height: 1024,
    viewBox: [0, 0, 100, 100],
    bg: WHITE,
    gap: WHITE,
  }),
  WHITE,
);
if (icon.width !== 1024 || icon.height !== 1024) {
  throw new Error(`icon size ${icon.width}x${icon.height}`);
}
writeFileSync(join(outDir, 'icon.png'), encodeRgbPng(icon.width, icon.height, icon.rgba));

const favicon = render(
  svg({
    width: 64,
    height: 64,
    viewBox: [0, 0, 100, 100],
    bg: WHITE,
    gap: WHITE,
  }),
  WHITE,
);
if (favicon.width !== 64 || favicon.height !== 64) {
  throw new Error(`favicon size ${favicon.width}x${favicon.height}`);
}
writeFileSync(join(outDir, 'favicon.png'), encodeRgbPng(favicon.width, favicon.height, favicon.rgba));

// El dibujo oficial ocupa ~100 unidades. Se escala para que toda la tinta
// quede dentro del círculo seguro de Android (66/108 del lado).
const tight = render(
  svg({ width: 1000, height: 1000, viewBox: [0, 0, 100, 100], gap: SAGE }),
);
const tightBox = inkBounds(tight.rgba, tight.width, tight.height);
const pxPerUnit = tight.width / 100;
const contentW = (tightBox.maxX - tightBox.minX + 1) / pxPerUnit;
const contentH = (tightBox.maxY - tightBox.minY + 1) / pxPerUnit;
const contentCx = (tightBox.minX + tightBox.maxX + 1) / 2 / pxPerUnit;
const contentCy = (tightBox.minY + tightBox.maxY + 1) / 2 / pxPerUnit;
let maxUserR = 0;
for (let y = tightBox.minY; y <= tightBox.maxY; y++) {
  for (let x = tightBox.minX; x <= tightBox.maxX; x++) {
    const a = tight.rgba[(y * tight.width + x) * 4 + 3];
    if (a < 12) continue;
    const ux = (x + 0.5) / pxPerUnit;
    const uy = (y + 0.5) / pxPerUnit;
    maxUserR = Math.max(maxUserR, Math.hypot(ux - contentCx, uy - contentCy));
  }
}

const adaptiveSide = 1024;
const safeR = ((adaptiveSide * 66) / 108) * 0.5 * 0.96;
const scale = safeR / maxUserR;
const viewW = adaptiveSide / scale;
const viewH = adaptiveSide / scale;
const adaptive = render(
  svg({
    width: adaptiveSide,
    height: adaptiveSide,
    viewBox: [contentCx - viewW / 2, contentCy - viewH / 2, viewW, viewH],
    gap: SAGE,
  }),
);
if (adaptive.width !== 1024 || adaptive.height !== 1024) {
  throw new Error(`adaptive size ${adaptive.width}x${adaptive.height}`);
}
const adaptiveBox = inkBounds(adaptive.rgba, adaptive.width, adaptive.height);
const androidSafeR = ((adaptive.width * 66) / 108) / 2;
if (adaptiveBox.maxR > androidSafeR) {
  throw new Error(
    `adaptive ink radius ${adaptiveBox.maxR.toFixed(1)} > safe ${androidSafeR.toFixed(1)}`,
  );
}
writeFileSync(join(outDir, 'adaptive-icon.png'), adaptive.png);

const splashW = 1284;
const splashH = 2778;
const splashMark = 560;
const splashScale = splashMark / 100;
const splash = render(
  svg({
    width: splashW,
    height: splashH,
    viewBox: [
      50 - splashW / splashScale / 2,
      50 - splashH / splashScale / 2,
      splashW / splashScale,
      splashH / splashScale,
    ],
    bg: SAGE,
    gap: SAGE,
  }),
  SAGE,
);
if (splash.width !== splashW || splash.height !== splashH) {
  throw new Error(`splash size ${splash.width}x${splash.height}`);
}
writeFileSync(join(outDir, 'splash.png'), encodeRgbPng(splash.width, splash.height, splash.rgba));

const report = {
  icon: '1024x1024',
  favicon: '64x64',
  adaptive: {
    size: '1024x1024',
    inkRadiusPx: Number(adaptiveBox.maxR.toFixed(1)),
    safeRadiusPx: Number(androidSafeR.toFixed(1)),
    inkBox: adaptiveBox,
    contentUserUnits: { w: Number(contentW.toFixed(2)), h: Number(contentH.toFixed(2)) },
  },
  splash: `${splashW}x${splashH}`,
};
console.log(JSON.stringify(report, null, 2));
