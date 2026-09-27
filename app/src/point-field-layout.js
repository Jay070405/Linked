import {random} from './world-points.js';

/** Layouts for PointField: the rules (a dot grid) and the shape imagination makes
 *  of them (the site's cherry petal, in points). Pure, so they can be tested. */

// The petal from v16.css (.petal's mask): a 100 × 130 box, notch at the top, base at the bottom.
const PETAL = [[50, 128], [46, 116, 30, 98, 16, 78], [4, 60, 2, 34, 14, 18], [22, 8, 38, 5, 45, 9], [47, 10, 49, 12, 50, 15],
  [51, 12, 53, 10, 55, 9], [62, 5, 78, 8, 86, 18], [98, 34, 96, 60, 84, 78], [70, 98, 54, 116, 50, 128]];

/** The petal outline as a closed polygon in its 100 × 130 box. */
export function petalOutline(steps = 16) {
  let [x, y] = PETAL[0];
  const points = [[x, y]];
  for (const [c1x, c1y, c2x, c2y, ex, ey] of PETAL.slice(1)) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      points.push([u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
        u * u * u * y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]);
    }
    [x, y] = [ex, ey];
  }
  return points;
}

// Petal space: centred, y up, one unit tall.
const toBox = (x, y) => [50 + x * 130, 65 - y * 130];
const fromBox = (x, y) => [(x - 50) / 130, (65 - y) / 130];

/** Is (x, y), in petal space, inside the outline? Even-odd ray casting. */
export function insidePetal(x, y, outline) {
  const [px, py] = toBox(x, y);
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i], [xj, yj] = outline[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** `count` points in petal space as [x, y, line] triples, drawn like a stippled study.
 *  Line points (line = 1) trace the outline, with extra weight at the notch that makes it
 *  a cherry petal. The rest shade it (line = 0): a few fine veins fanning from the base,
 *  and a fill that is dense at the base and light toward the tip. */
export function samplePetal(count, seed = 1, edge = 0.34, notch = 0.08, veins = 0.1) {
  const next = random(seed), outline = petalOutline(), out = new Float32Array(count * 3);
  const lengths = [0];
  for (let i = 1; i < outline.length; i++) lengths.push(lengths[i - 1] + Math.hypot(outline[i][0] - outline[i - 1][0], outline[i][1] - outline[i - 1][1]));
  const total = lengths.at(-1);
  const onOutline = () => {
    const at = next() * total;
    let k = 1;
    while (lengths[k] < at) k++;
    const t = (at - lengths[k - 1]) / (lengths[k] - lengths[k - 1] || 1);
    return [outline[k - 1][0] + (outline[k][0] - outline[k - 1][0]) * t, outline[k - 1][1] + (outline[k][1] - outline[k - 1][1]) * t];
  };
  const edges = Math.round(count * edge), notches = edges + Math.round(count * notch), veined = notches + Math.round(count * veins);
  for (let i = 0; i < count; i++) {
    if (i < notches) {
      // Anywhere along the outline (or, for the notch share, only across the two lobes),
      // pulled in a hair so the line has some weight.
      let bx, by;
      do [bx, by] = onOutline(); while (i >= edges && by > 26);
      const pull = next() * 0.012;
      out.set([...fromBox(bx + (50 - bx) * pull, by + (66 - by) * pull), 1], i * 3);
      continue;
    }
    if (i < veined) {
      // Five fine veins from the base toward the rim, stopping short of it.
      const vein = Math.floor(next() * 5), t = 0.08 + next() * 0.72;
      const [rx, ry] = [[20, 40], [33, 16], [50, 20], [67, 16], [80, 40]][vein];
      const x = 50 + (rx - 50) * t + Math.sin(t * Math.PI) * (rx - 50) * 0.12, y = 122 + (ry - 122) * t;
      out.set([...fromBox(x + (next() - 0.5) * 0.8, y), 0], i * 3);
      continue;
    }
    let x, y;
    do { x = (next() - 0.5) * 0.76; y = (next() - 0.5) * 1.0; }
    while (!insidePetal(x, y, outline) || next() > 0.3 + 0.7 * Math.max(0, Math.min(1, (0.46 - y) / 0.95)) ** 1.2);
    out.set([x, y, 0], i * 3);
  }
  return out;
}

/** A centred dot grid at `spacing` px over width × height. `originY` is the area's top
 *  in page coordinates: rows sit on one page-wide rhythm, so neighbouring sections line up. */
export function gridLayout(width, height, spacing, originY = 0) {
  const columns = Math.max(1, Math.floor(width / spacing));
  const x0 = (width - (columns - 1) * spacing) / 2;
  const y0 = (((spacing / 2 - originY) % spacing) + spacing) % spacing;
  const rows = Math.max(0, Math.floor((height - y0 - 1e-9) / spacing) + 1);
  const positions = new Float32Array(columns * rows * 2);
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) positions.set([x0 + c * spacing, y0 + r * spacing], (r * columns + c) * 2);
  return {count: columns * rows, positions};
}

/** 0 as a section's top enters the bottom of the viewport, 1 as its bottom leaves the top. */
export const sectionProgress = (top, height, viewport) => Math.max(0, Math.min(1, (viewport - top) / (viewport + height)));
