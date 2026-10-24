// Builds the Arden companion prototype (cases/d5-glasses/app, a separate Vite project) into public/proto/arden/ so
// /product/arden can embed it from the same origin. The prototype's source is never edited here.
//
//   node scripts/build-arden-proto.mjs [path-to-d5-glasses/app]
//
// The prototype builds every asset URL from Vite's base (scripts, styles, the Inter subset, scenes, library photos,
// renders), so the build needs only --base, and the same embed guard as the other prototypes. It keeps navigation in
// React state and never touches history or focus on load; the guard holds that if it ever changes.
import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.ARDEN_SRC || path.join(app, '../../../视觉设计作品集/cases/d5-glasses/app'));
const BASE = '/proto/arden/';
const out = path.join(app, 'public', 'proto', 'arden');

if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`Arden prototype not found at ${source}`);
// Vite keeps an outDir outside the prototype's own root even with --emptyOutDir; start clean so stale hashed
// bundles from an earlier build don't ship. (A file-by-file walk: recursive fs.rmSync silently leaves files on some
// Windows setups.)
const clean = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) clean(full); else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
};
clean(out);
// Run through Node (not Git Bash), so the base path isn't rewritten into a Windows path.
execSync(`npx vite build --configLoader native --base ${BASE} --outDir "${out}" --emptyOutDir`, {cwd: source, stdio: 'inherit'});

// When the case page embeds the app (window !== top), any history entries replace instead of stacking, and the app's
// focus() calls wait until the reader is using the prototype (pointer or key inside it, or focus moved in by Tab), so
// loading it never pulls keyboard focus out of the page.
const EMBED = `<script>if(window!==top){(function(){var h=history,p=HTMLElement.prototype,f=p.focus,on=false;`
  + `h.pushState=function(s,t,u){return h.replaceState(s,t,u)};`
  + `addEventListener('pointerdown',function(){on=true},true);addEventListener('keydown',function(){on=true},true);`
  + `addEventListener('blur',function(){on=false});`
  + `p.focus=function(o){if(on||document.hasFocus())return f.call(this,o)}})()}</script>`;
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8').replace('<head>', `<head><meta name="robots" content="noindex">${EMBED}`);
fs.writeFileSync(index, html);
const stray = fs.readdirSync(path.join(out, 'assets')).filter(f => /\.(js|css)$/.test(f))
  .flatMap(f => fs.readFileSync(path.join(out, 'assets', f), 'utf8').match(/url\(\/(?!proto\/)[^)]*\)|["'`]\/(assets|renders|fonts|scenes|library)\//g) || []);
if (stray.length) throw new Error(`Root-relative paths in the build: ${stray.join(', ')}`);

// The prototype copies its renders as they come from Blender. Opaque ones wider than the phone ever shows (the two
// 2400 px camera details are 2.7 MB each) ship as 1200 px WebP instead, with the bundle pointed at them; renders with
// alpha stay as they are. sharp comes from pd-prototype, as in build-arden-assets.mjs.
const sharp = createRequire(path.join(app, '../../../视觉设计作品集/pd-prototype/package.json'))('sharp');
const bundles = fs.readdirSync(path.join(out, 'assets')).filter(f => f.endsWith('.js')).map(f => path.join(out, 'assets', f));
const rendersDir = path.join(out, 'renders');
let slimmed = 0, saved = 0;
for (const f of fs.existsSync(rendersDir) ? fs.readdirSync(rendersDir).filter(f => f.endsWith('.png')) : []) {
  const png = path.join(rendersDir, f), meta = await sharp(png).metadata();
  if (meta.hasAlpha || meta.width <= 1200) continue;
  const ref = `renders/${f}`, to = ref.replace(/\.png$/, '.webp');
  const hits = bundles.filter(b => fs.readFileSync(b, 'utf8').includes(ref));
  if (!hits.length) continue;
  await sharp(png).resize({width: 1200}).webp({quality: 86, effort: 5}).toFile(path.join(out, to));
  for (const b of hits) fs.writeFileSync(b, fs.readFileSync(b, 'utf8').replaceAll(ref, to));
  saved += fs.statSync(png).size - fs.statSync(path.join(out, to)).size;
  fs.unlinkSync(png);
  slimmed++;
}
const total = dir => fs.readdirSync(dir, {withFileTypes: true}).reduce((s, e) => s + (e.isDirectory() ? total(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`Arden prototype built into ${path.relative(app, out)} (${(total(out) / 1048576).toFixed(1)} MB${slimmed ? `; ${slimmed} oversized renders as 1200 px WebP, ${(saved / 1048576).toFixed(1)} MB smaller` : ''}).`);
