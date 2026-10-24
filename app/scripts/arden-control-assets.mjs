/** Alpha bounds with 6% breathing room on each edge, bounded by the source. */
export function controlCrop(alpha, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!alpha[y * width + x]) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) throw new Error('Control render has no visible alpha');
  const px = (right - left + 1) * .06, py = (bottom - top + 1) * .06;
  right = Math.min(width, Math.ceil(right + 1 + px));
  bottom = Math.min(height, Math.ceil(bottom + 1 + py));
  left = Math.max(0, Math.floor(left - px)); top = Math.max(0, Math.floor(top - py));
  return {left, top, width: right - left, height: bottom - top};
}

/** Remap points, boxes and nested microphone/contact arrays into the cropped image. */
export function remapHotspots(value, sourceW, sourceH, crop, outputW = crop.width) {
  if (Array.isArray(value)) return value.map(v => remapHotspots(v, sourceW, sourceH, crop, outputW));
  if (!value || typeof value !== 'object') return value;
  const out = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, remapHotspots(v, sourceW, sourceH, crop, outputW)]));
  const outputH = Math.round(crop.height * outputW / crop.width);
  for (const [axis, source, offset, size, output] of [['x', sourceW, crop.left, crop.width, outputW], ['y', sourceH, crop.top, crop.height, outputH]]) {
    for (const key of [axis, `${axis}0`, `${axis}1`]) {
      if (typeof value[`${key}_pct`] !== 'number') continue;
      const fraction = (value[`${key}_pct`] * source / 100 - offset) / size;
      out[`${key}_pct`] = fraction * 100;
      out[key] = fraction * output;
    }
  }
  return out;
}
