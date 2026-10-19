// Small copies of the eight paintings in the embedded Atelier build (public/proto/atelier/art), for the case page's
// painting picker: public/assets/product/atelier/thumbs/<id>.webp, 320 px wide. The modules show the full file only
// for the painting you pick.
//
//   node scripts/build-atelier-thumbs.mjs
//
// Uses sharp from the Ready for agents prototype; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const sharp = createRequire(path.join(app, '../../../视觉设计作品集/pd-prototype/package.json'))('sharp');
const from = path.join(app, 'public/proto/atelier/art'), to = path.join(app, 'public/assets/product/atelier/thumbs');
await fs.mkdir(to, {recursive: true});
const log = [];
for (const file of (await fs.readdir(from)).filter(f => f.endsWith('.webp'))) {
  const info = await sharp(path.join(from, file)).resize({width: 320}).webp({quality: 78, effort: 6}).toFile(path.join(to, file));
  log.push(`${file} ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)} KB`);
}
console.log(`Atelier thumbnails:\n  ${log.join('\n  ')}`);
