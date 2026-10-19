/* The press's four plates: a plain RGB-to-CMYK split of the painting, drawn as ink on white paper.
   Each plate is an opaque canvas in the color its ink leaves on paper (cyan plate = 1 - c in the red channel, and so
   on), so the four multiply back to the original file exactly: (1 - c)(1 - k) = r, and likewise for g and b.
   It's an approximation of how a print is built, not a printer's real separation (no ICC profile, no dot gain). */

const cache = new Map();

/** Loads an image (same origin) and resolves when it can be drawn. */
export function loadImage(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  cache.set(src, p);
  p.catch(() => cache.delete(src));
  return p;
}

const plateCache = new Map();

/** Four plate canvases for `img`, at most `max` px on the long side. Cached per source and size. */
export function separate(img, key, max = 1100) {
  const id = `${key}@${max}`;
  if (plateCache.has(id)) return plateCache.get(id);
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d', {willReadFrequently: true});
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(img, 0, 0, w, h);
  const data = sctx.getImageData(0, 0, w, h).data;
  const plates = [0, 1, 2, 3].map(() => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  });
  const out = plates.map(c => c.getContext('2d').createImageData(w, h));
  const [C, M, Y, K] = out.map(o => o.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const key0 = 1 - Math.max(r, g, b);
    const d = 1 - key0;
    const c = d > 0 ? (1 - r - key0) / d : 0, m = d > 0 ? (1 - g - key0) / d : 0, y = d > 0 ? (1 - b - key0) / d : 0;
    C[i] = 255 * (1 - c); C[i + 1] = 255; C[i + 2] = 255; C[i + 3] = 255;
    M[i] = 255; M[i + 1] = 255 * (1 - m); M[i + 2] = 255; M[i + 3] = 255;
    Y[i] = 255; Y[i + 1] = 255; Y[i + 2] = 255 * (1 - y); Y[i + 3] = 255;
    const kv = 255 * d;
    K[i] = kv; K[i + 1] = kv; K[i + 2] = kv; K[i + 3] = 255;
  }
  plates.forEach((c, i) => c.getContext('2d').putImageData(out[i], 0, 0));
  const result = {w, h, plates};
  plateCache.set(id, result);
  return result;
}

/** The first `n` plates printed on top of each other, into `target` (for the static, reduced-motion view). */
export function composite(target, sep, n) {
  target.width = sep.w; target.height = sep.h;
  const ctx = target.getContext('2d');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, sep.w, sep.h);
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < n; i++) ctx.drawImage(sep.plates[i], 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}
