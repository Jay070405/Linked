// Assets for the Atelier case page's world (src/product/worlds/atelier): the gallery and the press.
//   - public/assets/product/atelier/world/full/<id>.webp: each of the eight paintings at the original file's own pixel
//     size, from Jay's sources in public/assets/art. The gallery's light and the press's loupe read these, so what you
//     see under the light is the file's real pixels.
//   - public/assets/product/atelier/world/fonts: Fraunces (the Atelier wordmark face) and InterVariable, copied from the
//     embedded prototype build so the page doesn't depend on its hashed file names.
//
//   node scripts/build-atelier-world.mjs
//
// Uses sharp from the Atelier prototype; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const sharp = createRequire(path.join(app, '../../../视觉设计作品集/d2-atelier-prototype/package.json'))('sharp');
const art = path.join(app, 'public/assets/art');
const out = path.join(app, 'public/assets/product/atelier/world');
await fs.mkdir(path.join(out, 'full'), {recursive: true});
await fs.mkdir(path.join(out, 'fonts'), {recursive: true});

// id -> source file, from d2-atelier-prototype/src/artworks.json ("sourceFile")
const SOURCES = {
  'blue-hour': 'background-painting.png', 'quiet-gate': 'enchanted-forest.png', spring: 'sakura-village.png',
  clouds: 'world-tree.png', between: 'sword-immortal.png', return: 'temple-sketch.jpg', 'red-planet': 'mars-monster.png',
  signal: 'personal-project.jpg',
};
const log = [];
for (const [id, file] of Object.entries(SOURCES)) {
  const info = await sharp(path.join(art, file)).webp({quality: 86, effort: 6}).toFile(path.join(out, 'full', `${id}.webp`));
  log.push(`full/${id}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
}

const proto = path.join(app, 'public/proto/atelier');
const fraunces = (await fs.readdir(path.join(proto, 'assets'))).find(f => /^fraunces-latin-wght-normal-.*\.woff2$/.test(f));
if (!fraunces) throw new Error('Fraunces not found in public/proto/atelier/assets: run build-atelier-proto.mjs first');
await fs.copyFile(path.join(proto, 'assets', fraunces), path.join(out, 'fonts/fraunces-latin-wght.woff2'));
await fs.copyFile(path.join(proto, 'fonts/InterVariable.woff2'), path.join(out, 'fonts/InterVariable.woff2'));
await fs.copyFile(path.join(proto, 'fonts/Inter-LICENSE.txt'), path.join(out, 'fonts/Inter-LICENSE.txt')).catch(() => {});
log.push(`fonts: ${fraunces} -> fraunces-latin-wght.woff2, InterVariable.woff2`);
console.log(`Atelier world assets:\n  ${log.join('\n  ')}`);
