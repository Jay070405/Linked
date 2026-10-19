// Builds the "Last 100 Feet" prototype (d3-last-100-feet-prototype, a separate Vite project) into
// public/proto/last-100-feet/ so /product/last-100-feet can embed it from the same origin. The prototype's source is
// never edited here.
//
//   node scripts/build-last-100-feet-proto.mjs [path-to-d3-last-100-feet-prototype]
//
// The prototype reads its base path from BASE_PATH (photos follow import.meta.env.BASE_URL), so the build needs only
// the base, and the same embed guard as the other prototypes. The case page embeds the bare phone screen (?shot).
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.L100_SRC || path.join(app, '../../../视觉设计作品集/d3-last-100-feet-prototype'));
const BASE = '/proto/last-100-feet/';
const out = path.join(app, 'public', 'proto', 'last-100-feet');

if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`Last 100 Feet prototype not found at ${source}`);
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
execSync(`npx vite build --configLoader native --base ${BASE} --outDir "${out}" --emptyOutDir`,
  {cwd: source, stdio: 'inherit', env: {...process.env, BASE_PATH: BASE}});

// When the case page embeds the phone (window !== top), any history entries replace instead of stacking, and the app's
// focus() calls wait until the reader is using the prototype (pointer or key inside it, or focus moved in by Tab), so
// loading or switching a screen never pulls keyboard focus out of the page.
const EMBED = `<script>if(window!==top){(function(){var h=history,p=HTMLElement.prototype,f=p.focus,on=false;`
  + `h.pushState=function(s,t,u){return h.replaceState(s,t,u)};`
  + `addEventListener('pointerdown',function(){on=true},true);addEventListener('keydown',function(){on=true},true);`
  + `addEventListener('blur',function(){on=false});`
  + `p.focus=function(o){if(on||document.hasFocus())return f.call(this,o)}})()}</script>`;
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8').replace('<head>', `<head><meta name="robots" content="noindex">${EMBED}`);
fs.writeFileSync(index, html);
const stray = fs.readdirSync(path.join(out, 'assets')).filter(f => /\.(js|css)$/.test(f))
  .flatMap(f => fs.readFileSync(path.join(out, 'assets', f), 'utf8').match(/url\(\/(?!proto\/)[^)]*\)|["'`]\/(photos|assets)\//g) || []);
if (stray.length) throw new Error(`Root-relative paths in the build: ${stray.join(', ')}`);
console.log(`Last 100 Feet prototype built into ${path.relative(app, out)}.`);
