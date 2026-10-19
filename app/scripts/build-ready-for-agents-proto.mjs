// Builds the "Ready for agents" prototype (pd-prototype, a separate Vite project) into public/proto/ready-for-agents/
// so /product/ready-for-agents can embed it from the same origin. The prototype's source is never edited here.
//
//   node scripts/build-ready-for-agents-proto.mjs [path-to-pd-prototype]
//
// The prototype already reads Vite's base URL for its art and its /agent and /explore routes, so the build only needs
// --base, the two route folders its own build script makes, and the embed guard below.
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.PD_PROTOTYPE_SRC || path.join(app, '../../../视觉设计作品集/pd-prototype'));
const BASE = '/proto/ready-for-agents/';
const out = path.join(app, 'public', 'proto', 'ready-for-agents');

if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`pd-prototype not found at ${source}`);
// Run through Node (not Git Bash), so the base path isn't rewritten into a Windows path.
execSync(`npx vite build --configLoader native --base ${BASE} --outDir "${out}" --emptyOutDir`, {cwd: source, stdio: 'inherit'});

// When the case page embeds the editor (window !== top), the app's own focus() calls wait until the reader is using it
// (pointer or key inside the frame, or focus moved in by Tab), so loading or switching a state never pulls keyboard
// focus out of the page. Any history entries the app makes replace instead of stacking.
const EMBED = `<script>if(window!==top){(function(){var h=history,p=HTMLElement.prototype,f=p.focus,on=false;`
  + `h.pushState=function(s,t,u){return h.replaceState(s,t,u)};`
  + `addEventListener('pointerdown',function(){on=true},true);addEventListener('keydown',function(){on=true},true);`
  + `addEventListener('blur',function(){on=false});`
  + `p.focus=function(o){if(on||document.hasFocus())return f.call(this,o)}})()}</script>`;
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8').replace('<head>', `<head><meta name="robots" content="noindex">${EMBED}`);
fs.writeFileSync(index, html);
// Same as the prototype's scripts/spa-routes.mjs: a copy per route so /agent/ and /explore/ work on any static host.
for (const route of ['agent', 'explore']) {
  fs.mkdirSync(path.join(out, route), {recursive: true});
  fs.writeFileSync(path.join(out, route, 'index.html'), html);
}
const stray = fs.readdirSync(path.join(out, 'assets')).filter(f => f.endsWith('.js'))
  .flatMap(f => fs.readFileSync(path.join(out, 'assets', f), 'utf8').match(/["'`]\/art\//g) || []);
if (stray.length) throw new Error('Root-relative /art/ paths in the build; the prototype should use import.meta.env.BASE_URL');
console.log(`Ready for agents prototype built into ${path.relative(app, out)}.`);
