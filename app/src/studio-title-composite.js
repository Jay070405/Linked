/**
 * The office heading is authored here, not baked into a screenshot. All bounds
 * are in the untouched room image's coordinates; the same canvas feeds the
 * liquid renderer and the still-image fallback.
 */
export const STUDIO_TITLE_FONT = '700 200px "TikTok Sans", Arial, sans-serif';

export function studioTitleLayout(imageWidth, imageHeight, viewportWidth, viewportHeight) {
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const visibleWidth = viewportWidth / scale;
  const visibleHeight = viewportHeight / scale;
  const cropX = (imageWidth - visibleWidth) / 2;
  const cropY = (imageHeight - visibleHeight) / 2;
  // Leave the nav's real screen-space clearance even on a very wide display.
  // On portrait screens, re-typeset inside the center crop instead of allowing
  // the cover image to remove the beginning and end of the word.
  const left = Math.max(imageWidth * .185, cropX + visibleWidth * .065);
  const right = Math.min(imageWidth * .935, cropX + visibleWidth * .935);
  const bottom = imageHeight * .317;
  const navClearance = viewportHeight < 600 ? 74 : 98;
  const minimumCap = imageHeight * .035;
  const top = Math.min(bottom - minimumCap, Math.max(imageHeight * .194, cropY + navClearance / scale));
  return {
    left, top, width: Math.max(1, right - left),
    height: bottom - top,
    cropX, cropY, visibleWidth, visibleHeight, scale,
  };
}

export function composeStudioTitle(image, viewportWidth, viewportHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Office title canvas is unavailable.');
  context.drawImage(image, 0, 0);

  const letters = document.createElement('canvas');
  letters.width = canvas.width; letters.height = canvas.height;
  const ink = letters.getContext('2d', { willReadFrequently: true });
  if (!ink) throw new Error('Office title mask is unavailable.');
  const box = studioTitleLayout(canvas.width, canvas.height, viewportWidth, viewportHeight);
  ink.font = STUDIO_TITLE_FONT;
  ink.textBaseline = 'alphabetic';
  const metrics = ink.measureText('PORTFOLIO');
  const ascent = metrics.actualBoundingBoxAscent || 146;
  const descent = metrics.actualBoundingBoxDescent || 0;
  const leftBearing = metrics.actualBoundingBoxLeft || 0;
  const glyphWidth = metrics.actualBoundingBoxRight + leftBearing || metrics.width;
  // Uniform scaling preserves the actual glyph shape, including the round Os.
  const fit = Math.min(box.width / glyphWidth, box.height / (ascent + descent));
  const x = box.left + (box.width - glyphWidth * fit) / 2;
  const y = box.top + (box.height - (ascent + descent) * fit) / 2;
  ink.save();
  ink.translate(x, y); ink.scale(fit, fit);
  ink.fillStyle = '#fff';
  ink.fillText('PORTFOLIO', leftBearing, ascent);
  ink.restore();

  // Paint only the letter pixels. Modulate the pigment with the source wall's
  // own illumination so its existing side light and texture remain continuous.
  // There is no rectangular patch, new background, bevel, or synthetic noise.
  const bounds = {
    x: Math.max(0, Math.floor(x - 2)), y: Math.max(0, Math.floor(y - 2)),
    width: Math.ceil(glyphWidth * fit + 4), height: Math.ceil((ascent + descent) * fit + 4),
  };
  bounds.width = Math.min(bounds.width, canvas.width - bounds.x);
  bounds.height = Math.min(bounds.height, canvas.height - bounds.y);
  const pixels = context.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
  const mask = ink.getImageData(bounds.x, bounds.y, bounds.width, bounds.height).data;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const alpha = mask[i + 3] / 255;
    if (!alpha) continue;
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    const light = .82 + (.2126 * r + .7152 * g + .0722 * b) / 255 * .60;
    pixels.data[i] = r + (208 * light - r) * alpha;
    pixels.data[i + 1] = g + (214 * light - g) * alpha;
    pixels.data[i + 2] = b + (211 * light - b) * alpha;
  }
  context.putImageData(pixels, bounds.x, bounds.y);
  // The heading ends above the original monitor (its top is at ~32% height).
  // Nothing is drawn over the monitor, lamp, desk, or window foreground.
  canvas.dataset.titleBounds = JSON.stringify({ x, y, width: glyphWidth * fit, height: (ascent + descent) * fit });
  return canvas;
}
