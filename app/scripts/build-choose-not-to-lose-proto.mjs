// Builds the "Choose Not to Lose" prototype (d4-choose-not-to-lose-prototype, a separate Vite project) into
// public/proto/choose-not-to-lose/ so /product/choose-not-to-lose can embed it from the same origin. The prototype's
// source is never edited here.
//
//   node scripts/build-choose-not-to-lose-proto.mjs [path-to-d4-choose-not-to-lose-prototype]
//
// The prototype reads its base path from VITE_BASE_PATH and builds every link relative to the current page, so the
// build needs only the base, and the same embed guard as the other prototypes.
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.CNTL_SRC || path.join(app, '../../../视觉设计作品集/d4-choose-not-to-lose-prototype'));
const BASE = '/proto/choose-not-to-lose/';
const out = path.join(app, 'public', 'proto', 'choose-not-to-lose');

if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`Choose Not to Lose prototype not found at ${source}`);
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
  {cwd: source, stdio: 'inherit', env: {...process.env, VITE_BASE_PATH: BASE}});

// When the case page embeds the flow (window !== top):
// - the app's own history entries replace instead of stacking, so the reader's Back button leaves the case page;
// - its focus() calls (the page heading after each step, the worked example) wait until the reader is using the
//   prototype, so loading or driving an embed never pulls keyboard focus out of the page;
// - the document scrollbar is hidden, as in an overlay-scrollbar browser: the page still scrolls, and the live frame
//   lays out exactly like the screenshots, which are taken without one.
const EMBED = `<script>if(window!==top){(function(){var h=history,p=HTMLElement.prototype,f=p.focus,on=false;`
  + `document.documentElement.classList.add('in-frame');`
  + `h.pushState=function(s,t,u){return h.replaceState(s,t,u)};`
  + `addEventListener('pointerdown',function(){on=true},true);addEventListener('keydown',function(){on=true},true);`
  + `addEventListener('blur',function(){on=false});`
  + `p.focus=function(o){if(on||document.hasFocus())return f.call(this,o)}})()}</script>`
  + `<style>html.in-frame{scrollbar-width:none}html.in-frame::-webkit-scrollbar{display:none}</style>`;
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8').replace('<head>', `<head><meta name="robots" content="noindex">${EMBED}`);
fs.writeFileSync(index, html);
const stray = fs.readdirSync(path.join(out, 'assets')).filter(f => /\.(js|css)$/.test(f))
  .flatMap(f => fs.readFileSync(path.join(out, 'assets', f), 'utf8').match(/url\(\/(?!proto\/)[^)]*\)|["'`]\/assets\//g) || []);
if (stray.length) throw new Error(`Root-relative paths in the build: ${stray.join(', ')}`);
console.log(`Choose Not to Lose prototype built into ${path.relative(app, out)}.`);
