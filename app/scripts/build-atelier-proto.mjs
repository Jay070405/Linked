// Builds the Atelier prototype (a separate Vite project, not in this repo) into public/proto/atelier/,
// so /product/atelier can embed it from the same origin. The prototype's source is never edited here.
//
//   node scripts/build-atelier-proto.mjs [path-to-d2-atelier-prototype]
//
// The prototype was written to live at "/": its artwork paths, the brand-sheet route and its own history
// entries are absolute. Vite's --base only rewrites what Vite resolves (CSS urls, the entry script), so this
// script points the remaining absolute strings at /proto/atelier/ in the built files.
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.ATELIER_SRC || path.join(app, '../../../视觉设计作品集/d2-atelier-prototype'));
const BASE = '/proto/atelier/';
// The page is addressed as index.html: dev servers answer a bare directory with the site's own index instead.
const PAGE = BASE + 'index.html';
const out = path.join(app, 'public', 'proto', 'atelier');

if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`Atelier prototype not found at ${source}`);
execSync(`npx vite build --configLoader native --base ${BASE} --outDir "${out}" --emptyOutDir`, {cwd: source, stdio: 'inherit'});

// "/art/x.webp" (artworks.json) and "/icon.svg" are runtime strings; "/brand" is both a link and the route check;
// "/?screen=..." builds the shop links. The brand sheet becomes a static brand.html beside index.html.
const rewrites = [
  [/(["'`])\/art\//g, `$1${BASE}art/`],
  [/(["'`])\/icon\.svg/g, `$1${BASE}icon.svg`],
  [/(["'`])\/brand(["'`])/g, `$1${BASE}brand.html$2`],
  [/(["'`])\/\?screen=/g, `$1${PAGE}?screen=`],
  [/\}\/\?screen=/g, `}${PAGE}?screen=`],
  // the screen switcher writes ?screen= onto pathname "/"; keep it on the prototype's own page
  [/\.pathname=(["'`])\/\1/g, `.pathname="${PAGE}"`],
];
const assets = path.join(out, 'assets');
let patched = 0;
for (const file of fs.readdirSync(assets).filter(f => f.endsWith('.js'))) {
  const full = path.join(assets, file);
  let text = fs.readFileSync(full, 'utf8');
  for (const [pattern, replacement] of rewrites) {
    patched += (text.match(pattern) || []).length;
    text = text.replace(pattern, replacement);
  }
  fs.writeFileSync(full, text);
}
// Embedded copies should not be indexed on their own; the case page is the canonical place for them.
// When the case page embeds the prototype (window !== top), two things change, both in the host's favour:
// - screen changes replace the history entry, so the reader's Back button leaves the case page instead of
//   stepping back through prototype screens;
// - the app's own focus() calls wait until the reader is using the prototype (pointer or key inside it, or focus
//   moved in by Tab), so loading or driving an embed never pulls keyboard focus out of the page.
const EMBED = `<script>if(window!==top){(function(){var h=history,p=HTMLElement.prototype,f=p.focus,on=false;`
  + `h.pushState=function(s,t,u){return h.replaceState(s,t,u)};`
  + `addEventListener('pointerdown',function(){on=true},true);addEventListener('keydown',function(){on=true},true);`
  + `addEventListener('blur',function(){on=false});`
  + `p.focus=function(o){if(on||document.hasFocus())return f.call(this,o)}})()}</script>`;
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8').replace('<head>', `<head><meta name="robots" content="noindex">${EMBED}`);
fs.writeFileSync(index, html);
fs.writeFileSync(path.join(out, 'brand.html'), html);
const left = fs.readdirSync(assets).filter(f => f.endsWith('.js')).flatMap(f => fs.readFileSync(path.join(assets, f), 'utf8').match(/["'`]\/(art\/|icon\.svg|brand["'`]|\?screen)|\.pathname=["'`]\/["'`]/g) || []);
if (left.length) throw new Error(`Unpatched root paths remain: ${left.join(', ')}`);
console.log(`Atelier prototype built into ${path.relative(app, out)} (${patched} root paths moved under ${BASE}).`);
