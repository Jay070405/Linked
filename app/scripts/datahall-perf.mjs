// Measures Data Hall the way a visitor runs it: a cold load, then one continuous scroll through the whole film,
// recording every moving frame (nothing dropped but a page put away for 5 s or more), the stalls, the start-up split
// and every pixel-ratio change the frame budget makes. Four set-ups: a 1600 × 900 window at 2 device pixels per CSS
// pixel (a laptop's screen) and a 390 × 844 phone-sized one at 3, each as it is and with the CPU slowed 4× (Chrome's own throttling).
//   node scripts/datahall-perf.mjs [seconds]        (dev server on 4322; writes src/pages/data-hall/perf.json)
// This machine's GPU is the same in every run; the throttled runs show what the CPU side costs on a slower machine.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const {default: puppeteer} = await import(pathToFileURL(path.join(work, 'cases/d5-glasses/app/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4322') + '/other-project/data-hall';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SECONDS = Number(process.argv[2] || 40);
const RUNS = [
  {name: 'window at 2×', W: 1600, H: 900, dsf: 2, cpu: 1},
  {name: 'window at 2×, CPU ÷4', W: 1600, H: 900, dsf: 2, cpu: 4},
  {name: 'phone size', W: 390, H: 844, dsf: 3, cpu: 1},
  {name: 'phone size, CPU ÷4', W: 390, H: 844, dsf: 3, cpu: 4},
  // the cheaper set-up (what phones, integrated GPUs and unnamed GPUs get), forced on the same machine
  {name: 'window at 2×, modest set-up', W: 1600, H: 900, dsf: 2, cpu: 1, tier: 'modest'},
  {name: 'window at 2×, modest set-up, CPU ÷4', W: 1600, H: 900, dsf: 2, cpu: 4, tier: 'modest'},
];
// the chapter whose frames cost the GPU most (its 95th percentile), from [progress, ms] pairs
const CHAPTERS = [['plan', 0, 0.035], ['build', 0.035, 0.34], ['descent', 0.34, 0.47], ['walk', 0.47, 0.55], ['power on', 0.55, 0.6], ['turn', 0.6, 0.67], ['tray', 0.67, 0.77], ['dive', 0.77, 0.842], ['sheet', 0.842, 1]];
const worstChapter = g => CHAPTERS.map(([name, a, b]) => {const xs = g.filter(([p]) => p >= a && p < b).map(x => x[1]); return {name, p95: xs.length ? +stat(xs, 0.95).toFixed(2) : 0};}).sort((x, y) => y.p95 - x.p95)[0];
const stat = (xs, f) => {const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * f))] : 0;};
// the GPU's load from other programs before the runs (nvidia-smi, where there is one): the page shows it if it is high
let gpuLoad = null;
try {
  const {execSync} = await import('node:child_process');
  gpuLoad = Math.max(...[0, 1, 2].map(() => Number(String(execSync('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits')).trim().split('\n')[0])));
} catch { /* no nvidia-smi */ }
const out = {measured: new Date().toISOString().slice(0, 10), seconds: SECONDS, gpuLoad, runs: []};
console.log('GPU load from other programs before the runs:', gpuLoad == null ? 'unknown' : gpuLoad + '%');

// ONLY=<run name> runs one set-up (and leaves perf.json alone)
const ONLY = process.env.ONLY;
for (const run of RUNS.filter(r => !ONLY || r.name === ONLY)) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'datahall-perf-'));
  const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--hide-scrollbars', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11']});
  try {
    const page = await browser.newPage();
    await page.setViewport({width: run.W, height: run.H, deviceScaleFactor: run.dsf, isMobile: run.W < 700, hasTouch: run.W < 700});
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: run.cpu});
    await page.evaluateOnNewDocument(() => {sessionStorage.setItem('jl-arrived', '1'); localStorage.setItem('jay-lang', 'en');});
    await page.goto(PAGE + (run.tier ? '?tier=' + run.tier : ''), {waitUntil: 'load'});
    await page.waitForFunction(() => window.__dataHall?.ready(), {timeout: 180000, polling: 250});
    await page.evaluate(() => document.querySelectorAll('.studio-loading,.circular-transition').forEach(e => e.remove()));
    await new Promise(r => setTimeout(r, 3500));
    // one continuous scroll from the top of the film to its end, at an even rate
    await page.evaluate(seconds => new Promise(done => {
      const sc = document.querySelector('.portfolio-page-viewport'), film = document.querySelector('.dh-film');
      const a = film.offsetTop, b = film.offsetTop + film.offsetHeight - innerHeight, t0 = performance.now();
      const step = now => {const k = Math.min(1, (now - t0) / (seconds * 1000)); sc.scrollTop = a + (b - a) * k; if (k < 1) requestAnimationFrame(step); else setTimeout(done, 1500);};
      requestAnimationFrame(step);
    }), SECONDS);
    const p = await page.evaluate(() => window.__dataHall.perf());
    const ms = p.log.map(s => s * 1000);
    const result = {
      ...run, gpu: p.gpu, endDpr: p.dpr, dprChanges: p.dprChanges,
      boot: {fonts: Math.round(p.boot.fonts), camera: Math.round(p.boot.camera), plan: Math.round(p.boot.plan), scene: Math.round(p.boot.scene), first: Math.round(p.boot.first), longest: Math.round(p.boot.longest || 0), steps: p.boot.steps},
      frames: ms.length, median: +stat(ms, 0.5).toFixed(1), p95: +stat(ms, 0.95).toFixed(1), p99: +stat(ms, 0.99).toFixed(1), max: +Math.max(...ms).toFixed(1),
      over: +(ms.filter(x => x > 17.5).length / ms.length * 100).toFixed(1), stalls: p.stalls, stallAt: p.stallAt,
      cpu: {median: +stat(p.cpu, 0.5).toFixed(2), p95: +stat(p.cpu, 0.95).toFixed(2)},
      // the GPU's own time per frame (timer queries), when the browser offers them
      gpuFrame: p.gpuMs?.length ? {median: +stat(p.gpuMs.map(g => g[1]), 0.5).toFixed(2), p95: +stat(p.gpuMs.map(g => g[1]), 0.95).toFixed(2), frames: p.gpuMs.length, worstChapter: worstChapter(p.gpuMs)} : null,
      tier: p.tier,
    };
    out.runs.push(result);
    console.log(`${run.name}: ${result.frames} frames, median ${result.median} ms, p95 ${result.p95}, p99 ${result.p99}, max ${result.max}, ${result.over}% over 17.5 ms, ${result.stalls} stalls > 50 ms; opening drawn after ${result.boot.fonts + result.boot.camera + result.boot.plan + result.boot.first} ms (fonts ${result.boot.fonts} + camera ${result.boot.camera} + plan ${result.boot.plan} + first frame ${result.boot.first}), whole film ready after ${result.boot.fonts + result.boot.camera + result.boot.scene} ms (longest task ${result.boot.longest} ms; steps, busy/longest piece ${(result.boot.steps || []).map(([k, v, c]) => k + ' ' + v + '/' + c).join(', ')}); CPU per frame ${result.cpu.median} ms (p95 ${result.cpu.p95}); GPU per frame ${result.gpuFrame ? result.gpuFrame.median + ' ms (p95 ' + result.gpuFrame.p95 + '; heaviest chapter ' + result.gpuFrame.worstChapter.name + ', p95 ' + result.gpuFrame.worstChapter.p95 + ')' : 'not timed'}; set-up ${result.tier}; pixel ratio ${result.endDpr} after ${result.dprChanges} changes${result.stallAt?.length ? '; stalls at ' + result.stallAt.map(([q, t]) => `p ${q} (${t} ms)`).join(', ') : ''}`);
  } finally {await browser.close(); fs.rmSync(profile, {recursive: true, force: true});}
}
if (!ONLY) fs.writeFileSync(path.join(app, 'src/pages/data-hall/perf.json'), JSON.stringify(out, null, 1) + '\n');
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1) + '\n');
