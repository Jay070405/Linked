// Builds the before/after pairs the product case pages compare: the same prototype state in round 1 and round 2
// (after a model-assisted design review), and for Choose Not to Lose also the familiar benefits portal vs the yearly
// view. Round 1 comes from each case's shots-v1/ (archived before round 2 started), round 2 from shots/; every pair
// is cropped to the same rectangle so the slider compares like with like.
//
//   node scripts/build-round-pairs.mjs [path-to-视觉设计作品集]
//
// Run capture-choose-not-to-lose-screens.mjs first: its round-2 compare page is used instead of shots/compare.png,
// whose capture caught the prototype's skip link in focus.
// Uses sharp from the Ready for agents prototype; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const work = path.resolve(process.argv[2] || process.env.WORK_ROOT || path.join(app, '../../../视觉设计作品集'));
const sharp = createRequire(path.join(work, 'pd-prototype/package.json'))('sharp');
const cases = path.join(work, 'cases');
const assets = path.join(app, 'public/assets/product');
const log = [];

/** crop: {left, top, width, height} in source pixels; the area past the source's bottom edge is filled with `fill`. */
async function pair(from, to, crop, size, fill = '#ffffff') {
  let img = sharp(from);
  const meta = await img.metadata();
  if (crop) {
    const height = Math.min(crop.height, meta.height - crop.top);
    img = sharp(await img.extract({...crop, height}).toBuffer());
    if (height < crop.height) img = sharp(await img.extend({bottom: crop.height - height, background: fill}).toBuffer());
  }
  if (size) img = img.resize(size[0], size[1], {fit: 'fill'});
  await fs.mkdir(path.dirname(to), {recursive: true});
  const info = await img.webp({quality: 80, effort: 6}).toFile(to);
  log.push(`${path.relative(assets, to)} ${info.width}x${info.height}`);
}

// Ready for agents: 1440 x 900 editor at 2x. The right third (Check designs over the canvas, and the properties
// panel) is where round 2 changed.
const rfa = path.join(cases, 'pd-ready-for-agents');
// The row pair frames the properties panel closer, at the same aspect ratio.
const panel = {left: 1680, top: 260, width: 1200, height: 1420}, row = {left: 2080, top: 80, width: 800, height: 946};
for (const [name, shot, crop] of [['row', '01-row', row], ['review', '02-review', panel], ['choice', '04-choice', panel]]) {
  await pair(path.join(rfa, 'shots-v1', `${shot}.png`), path.join(assets, 'ready-for-agents/rounds', `${name}-r1.webp`), crop);
  await pair(path.join(rfa, 'shots', `${shot}.png`), path.join(assets, 'ready-for-agents/rounds', `${name}-r2.webp`), crop);
}

// Atelier: whole 390 x 844 screens at 2x.
const at = path.join(cases, 'd2-atelier');
for (const [name, shot] of [['check', '06-check'], ['wall', '17-wall'], ['checkout', '18-checkout']]) {
  await pair(path.join(at, 'shots-v1', `${shot}.png`), path.join(assets, 'atelier/rounds', `${name}-r1.webp`));
  await pair(path.join(at, 'shots', `${shot}.png`), path.join(assets, 'atelier/rounds', `${name}-r2.webp`));
}

// Last 100 Feet: whole 390 x 844 screens at 2x. Round 2 renumbered some screens, so each pair names both files.
const l1 = path.join(cases, 'd3-last-100-feet');
for (const [name, v1, v2] of [['gps', 'e02-c-gps-weak', 'e02-c-gps-weak'], ['stop', 'c02-c-step-park', 'c04-c-step-park'],
  ['photos', 'r04-r-steps', 'r06-r-steps'], ['dropoff', 'c10-c-dropoff', 'c12-c-dropoff']]) {
  await pair(path.join(l1, 'shots-v1', `${v1}.png`), path.join(assets, 'last-100-feet/rounds', `${name}-r1.webp`));
  await pair(path.join(l1, 'shots', `${v2}.png`), path.join(assets, 'last-100-feet/rounds', `${name}-r2.webp`));
}

// Choose Not to Lose: full pages at 1440 wide. Round 1 vs round 2: the top 1310 px, both cost-difference notes
// included. Portal vs yearly view: the baseline page's own height, so neither side ends in blank paper.
const cn = path.join(cases, 'd4-choose-not-to-lose');
const top = {left: 0, top: 0, width: 1440, height: 1310}, portal = {left: 0, top: 0, width: 1440, height: 1119};
await pair(path.join(cn, 'shots', 'baseline.png'), path.join(assets, 'choose-not-to-lose/rounds', 'portal.webp'), portal);
await pair(path.join(cn, 'shots-v1', 'compare.png'), path.join(assets, 'choose-not-to-lose/rounds', 'compare-r1.webp'), top);
// round 2 from this site's own capture (1.25x), scaled to the same 1440 px width
const r2 = await sharp(path.join(assets, 'choose-not-to-lose/pages/compare.webp')).resize(1440).png().toBuffer();
const r2file = path.join(app, 'node_modules/.cache/compare-r2.png');
await fs.mkdir(path.dirname(r2file), {recursive: true});
await fs.writeFile(r2file, r2);
await pair(r2file, path.join(assets, 'choose-not-to-lose/rounds', 'compare-r2.webp'), top);
await pair(r2file, path.join(assets, 'choose-not-to-lose/rounds', 'compare-portal.webp'), portal);

console.log(`Built ${log.length} images:\n  ${log.join('\n  ')}`);
