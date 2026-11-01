import {useEffect, useRef, useState} from 'react';
import {createScene} from './data-hall/scene';
import {retimeMs, SCROLL_LENGTH, scrollToP, pToScroll} from './data-hall/camera';
import {fontsReady} from './data-hall/drawing';
import {CAPTIONS, T, seg, smoother} from './data-hall/timeline';
import MakingOf from './data-hall/MakingOf';
import './data-hall/data-hall.css';

// Data Hall: an AI data centre that builds itself from its floor plan as the page scrolls, then walks in, opens a
// rack and goes down to one GPU's dies, whose drawing turns back into the plan. The scene lives in data-hall/;
// this page owns the scroll, the spring that smooths it, the captions and the frame budget.
// (1100 vh as if evenly spread; where the camera is fast it gets more, camera.js)
const FILM_VH = Math.round(1100 * SCROLL_LENGTH);
// reduced motion: no camera moves; the film steps between held frames, one in the middle of every caption's window (so
// no caption is skipped), and the first frame
const STILLS = [0, ...CAPTIONS.map(c => (c.at[0] + Math.min(c.at[1], 1)) / 2)];

export default function DataHall({lang, reduced, onNavigate}) {
  const en = lang === 'en';
  // (builds run one after another: a new one starts once the last has finished or been cancelled)
  const building = useRef(Promise.resolve());
  const film = useRef(null), stage = useRef(null), canvas = useRef(null), caps = useRef([]), bar = useRef(null), head = useRef(null), stats = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // the drawings are lettered in the site’s own fonts: wait for them (at most 1.5 s) before the sheets are drawn
    // (a class on the body while the page is up, for the navigation's rules: cheaper to match than body:has(.dh-stage))
    document.body.classList.add('dh-page');
    let stop = null, gone = false;
    const mounted = performance.now();
    // (whether the visitor has scrolled since the page mounted: a scroll position past the plan with no input is the
    // browser's restoration, which the film cuts to once ready; the visitor's own scrolling it follows)
    let touched = false;
    const touch = () => {touched = true;}, inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    for (const e of inputs) addEventListener(e, touch, {passive: true, capture: true});
    // the longest task that blocked the main thread from here to the first frame (where the browser reports long tasks)
    let blocked = 0;
    const watch = typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask') ? new PerformanceObserver(list => {for (const e of list.getEntries()) blocked = Math.max(blocked, e.duration);}) : null;
    watch?.observe({type: 'longtask'});
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))]).then(() => {if (!gone) stop = start();});
    return () => {gone = true; watch?.disconnect(); stop?.(); document.body.classList.remove('dh-page'); for (const e of inputs) removeEventListener(e, touch, {capture: true});};
    function start() {
      const el = film.current, scroller = el.closest('.portfolio-page-viewport') || window;
      // start-up, in ms: waiting for the fonts, building the scene (geometry, drawings, textures, shaders), the first
      // frame. The opening (the paper and the plan) starts drawing as soon as the plan is ready (boot.plan); the rest
      // builds behind it in steps that give the page back its main thread between them (boot.scene, until the whole
      // film is ready). boot.longest is the longest task the browser saw block the main thread from the start until a
      // second after that (boot.steps, each step's busy time and longest piece)
      const boot = {fonts: performance.now() - mounted, camera: retimeMs, plan: 0, scene: 0, first: 0, longest: 0};
      const t = performance.now();
      // (leaving the page, or switching motion modes, while the scene is building cancels the build: it stops at its
      // next step and frees what it made. Each motion mode draws on a canvas of its own, so a cancelled build never
      // holds the next one's context)
      let dead = false, stopRun = null;
      const cancel = new AbortController();
      const node = canvas.current;
      const early = scene => {if (dead || stopRun) return; boot.plan = performance.now() - t; stopRun = run(scene);};
      // (the opening has drawn itself in, or the visitor has scrolled: the build's heavy steps may go ahead)
      let settle = null;
      const settled = new Promise(r => {settle = r;});
      const build = building.current.then(() => (dead ? null : createScene(node, {small: matchMedia('(max-width: 700px)').matches, signal: cancel.signal, onEarly: early, settled}))).then(scene => {
        if (!scene) return;
        if (dead) {scene.dispose(); return;}
        boot.scene = performance.now() - t; boot.steps = scene.info().steps;
        setTimeout(() => {boot.longest = watch ? blocked : scene.info().longest; watch?.disconnect();}, 1000);
        early(scene);
      }, error => {if (error?.name === 'AbortError') return; console.warn('Data Hall: WebGL unavailable', error); if (!dead) setFailed(true);});
      building.current = build;
      return () => {dead = true; cancel.abort(); stopRun?.();};

      function run(scene) {
        const size = () => {const r = stage.current.getBoundingClientRect(); scene.resize(Math.max(1, r.width), Math.max(1, r.height));};
        size();
        const ro = new ResizeObserver(size); ro.observe(stage.current);

        const target = () => {
          const r = el.getBoundingClientRect(), span = r.height - innerHeight;
          return span > 0 ? scrollToP(-r.top / span) : 0;
        };
        // a critically damped spring between the scroll and the film: wheel steps arrive as one smooth move
        const restored = !touched && target() > 0.05;
        let x = Math.min(target(), T.plan[1] - 0.01), v = 0, last = performance.now(), raf = 0, visible = true, tone = '', pinned = null, lastP = -1, fastSince = 0, slowSince = 0, sinceRaise = 99, raiseLocked = false, movedAt = 0, barTone = '', introT = 0, wasReady = false, stills = false, atFloor = 0, sinceDrop = 99, dropMissed = 0, dropLocked = false;
        let born = 0, stalls = 0, dprChanges = 0, work = 0; const frames = [], log = [], cpuLog = [], gpuLog = [], fresh = [], stallAt = [];
        // the case page's numbers: intervals and CPU times in 0.25 ms bins (the last bin holds everything over 100 ms)
        const hist = new Uint32Array(401), cpuHist = new Uint32Array(401), bin = ms => Math.min(400, Math.floor(ms * 4));
        let worst = 0;
        const q = (h, n, f) => {let k = 0, c = 0; while (k < 400 && c + h[k] <= f * n) c += h[k++]; return (k + 0.5) / 4;};
        const gl = canvas.current.getContext('webgl2') || canvas.current.getContext('webgl'), dbg = gl?.getExtension('WEBGL_debug_renderer_info');
        // the renderer string, without ANGLE's wrapper and driver details: "ANGLE (NVIDIA, NVIDIA GeForce …(0x…) Direct3D11…)"
        const gpuRaw = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
        const gpu = (gpuRaw.match(/^ANGLE \([^,]+, ([^,(]+?)\s*(?:\(0x|,|\)|Direct)/)?.[1] || gpuRaw).trim();
        let heavy = {calls: 0, triangles: 0};
        const io = new IntersectionObserver(([e]) => {visible = e.isIntersecting; tone = ''; document.body.classList.toggle('dh-film-on', visible); document.body.classList.toggle('nav-tone-owned', visible);}, {root: scroller === window ? null : scroller});
        io.observe(el);
        const tick = now => {
          raf = requestAnimationFrame(tick);
          const begun = performance.now(), raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
          if (!visible || document.hidden) return;
          // (until the whole film is built the film holds on the plan, captions and all; then the spring carries it to
          // wherever the page has been scrolled)
          const goal = scene.ready() ? target() : Math.min(target(), T.plan[1] - 0.01);
          // (a return visit restores the scroll far into the film: once the film is ready it cuts there, rather than
          // sweeping through everything between. Only then: a visitor who scrolls while it loads is carried there)
          if (!wasReady && scene.ready()) {
            wasReady = true;
            // (and only if the visitor still hasn't scrolled: input while it loads means the spring carries it)
            if (pinned == null && restored && !touched && Math.abs(goal - x) > 0.05) {x = goal; v = 0;}
          }
          if (pinned != null) {x = pinned; v = 0;}
          else if (reduced) x = STILLS.reduce((a, b) => (Math.abs(b - goal) < Math.abs(a - goal) ? b : a));
          else {
            // (on a GPU that can't keep up, the spring heads for the nearest held frame instead of the scroll position: the
            // picture rests on a still between moves, and never snaps)
            const aim = stills ? STILLS.reduce((a, b) => (Math.abs(b - goal) < Math.abs(a - goal) ? b : a)) : goal;
            const w = 8.5, a = w * w * (aim - x) - 2 * w * v; v += a * dt; x += v * dt;
          }
          const p = Math.min(1, Math.max(0, x));
          // the plan draws itself over 2.6 s, from the first rendered frame
          // (by frame time, each frame counted at most 1/30 s, so a stalled frame pauses the drawing instead of skipping it)
          if (born) introT += Math.min(raw, 1 / 30);
          if (settle && (introT >= 2.6 || target() > 0.005 || reduced)) {settle(); settle = null;}
          const intro = reduced ? 1 : born ? smoother(Math.min(1, introT / 2.6)) : 0;
          const t0 = performance.now(), drew = scene.update(p, now / 1000, intro), cpu = performance.now() - t0, moved = Math.abs(p - lastP) > 1e-5; lastP = p;
          if (!born && drew) {born = performance.now(); boot.first = born - t0;}
          // a caption is on while progress is inside its window; the fade itself runs on a short clock (CSS), so a
          // visitor who stops scrolling never reads a half-faded card
          CAPTIONS.forEach((c, i) => {
            const node = caps.current[i]; if (!node) return;
            const on = p >= c.at[0] && (p < c.at[1] || (c.at[1] >= 1 && p >= 1));
            if (node.classList.contains('is-on') !== on) node.classList.toggle('is-on', on);
          });
          if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
          // the title stands over the plan at both ends of the film
          if (head.current) head.current.style.opacity = Math.max(1 - smoother(seg(p, [0.035, 0.07])), smoother(seg(p, T.swap))).toFixed(3);
          const power = seg(p, T.power), paper = seg(p, T.paper);
          const next = power > 0.3 && paper < 0.5 && p < T.swap[1] ? 'dark' : 'light';
          // (the navigation's tone is set on its bar directly: a change of the stage's data-nav-tone would have the
          // navigation hit-test the page and re-render, a hitch on a slow CPU, at both tone changes)
          if (next !== tone) {tone = next; stage.current.classList.toggle('is-dark', tone === 'dark'); const bar = document.querySelector('.v16-navigation'); if (bar) bar.dataset.tone = tone;}
          // the scroll container's background and scrollbar follow the tone once the film is still: restyling the container
          // restyles the whole page (the scrollbar colour is inherited), a hitch on a slow CPU, so never while it moves
          // It goes dark earlier than the navigation: the near racks reach the screen's right edge just after the walk
          // starts, long before the power-on darkens the top
          if (moved) movedAt = now;
          const barNext = p > T.walk[0] + 0.015 && paper < 0.5 && p < T.swap[1] ? 'dark' : 'light';
          if (scroller !== window && barTone !== barNext && now - movedAt > 250) {barTone = barNext; scroller.style.backgroundColor = barNext === 'dark' ? '#0c0d0f' : ''; scroller.style.scrollbarColor = barNext === 'dark' ? '#3a3c41 #0c0d0f' : '';}
          // the case page shows the raw time between moving frames (not clamped; a stall over 50 ms is counted, and only
          // a gap of 5 s or more, a page put away, is left out) and the heaviest frame seen while the film ran
          frames.push(dt);
          const info = scene.info();
          if (info.calls > heavy.calls) heavy = {calls: info.calls, triangles: info.triangles};
          // (only once the whole film is built: the frames of the opening drawn meanwhile wait on the build)
          if (drew && moved && raw < 5 && scene.ready()) {
            // (the scripted runs read the raw log: kept up to 50,000 frames, about 14 minutes of scrolling at 60 fps)
            if (log.length < 50000) {log.push(raw); cpuLog.push(cpu);}
            hist[bin(raw * 1000)]++; cpuHist[bin(cpu)]++; worst = Math.max(worst, raw * 1000);
            // (each stall over 50 ms is kept with where in the film it happened, for the scripted runs)
            if (raw > 0.05) {stalls++; if (stallAt.length < 50) stallAt.push([+p.toFixed(3), Math.round(raw * 1000)]);}
            // the interval that ends now was spent on the previous frame: it is judged against that frame's work
            fresh.push([raw, work / 1000]);
          }
          if (frames.length >= 60) {
            const avg = frames.reduce((a, b) => a + b, 0) / frames.length; frames.length = 0;
            const n = hist.reduce((a, b) => a + b, 0);
            stats.current = {gpu, dpr: info.dpr, instances: info.instances, ...heavy, median: n ? q(hist, n, 0.5) : 0, p95: n ? q(hist, n, 0.95) : 0, max: worst, cpu: n ? q(cpuHist, n, 0.5) : 0, frames: n, stalls, dprChanges, boot};
          }
          // The frame budget, judged on moving frames rendered since the last check, long stalls included. A frame
          // interval over 17.5 ms missed it (at 60 Hz, a refresh). One check with more than one miss in six, or two in a
          // row with more than one in twenty, steps the pixel ratio down, to 0.75 at the least (a softer picture, but a
          // smooth one); three clean checks in a row (no miss, 95% of frames within 1.1 refreshes) step it up toward the
          // cap for this screen (integrated and phone GPUs start at 1, scene.js). Fewer pixels only help a slow GPU:
          // where the browser times the GPU, a step down also needs the GPU's own time near the budget (90th percentile
          // over 85% of it), and a step up needs room for the larger ratio. Elsewhere it is a heuristic: a miss counts
          // only if its frame (its whole callback) took little script time, and a step down that doesn't cut the misses
          // by a third is undone, and not tried again this visit. A step up followed by a step down within two checks
          // stays down for the visit
          if (fresh.length >= 45) {
            const times = fresh.map(f => f[0]).sort((a, b) => a - b), refresh = Math.min(1 / 60, times[Math.floor(times.length * 0.2)]);
            const budget = Math.max(refresh * 1.05, 0.0175);
            const missed = fresh.filter(([t, c]) => t > budget && c < budget * 0.6).length / fresh.length, anyMiss = fresh.some(([t]) => t > budget);
            const p95 = times[Math.floor(times.length * 0.95)];
            fresh.length = 0;
            const dpr = scene.info().dpr, gpu = scene.gpuTimes();
            let gpuSlow = null, gpuRoom = null;
            if (gpu) for (const x of gpu) if (gpuLog.length < 50000) gpuLog.push(x);
            if (gpu && gpu.length >= 10) {
              const g = gpu.map(x => x[1]).sort((a, b) => a - b), p90 = g[Math.floor(g.length * 0.9)];
              gpuSlow = p90 > budget * 1000 * 0.85; gpuRoom = p90 * ((dpr + 0.25) / dpr) ** 2 < budget * 1000 * 0.6;
            }
            sinceRaise++; sinceDrop++;
            slowSince = missed > 0.05 ? slowSince + 1 : 0;
            // (checks running in which frames missed at the lowest pixel ratio: any other check starts the count again)
            atFloor = dpr <= 0.75 && (missed > 1 / 6 || slowSince >= 2) && gpuSlow !== false ? atFloor + 1 : 0;
            if (gpuSlow === null && sinceDrop === 1 && missed > dropMissed * 0.67) {
              scene.setDpr(Math.min(startDpr, dpr + 0.25)); dprChanges++; dropLocked = true; fastSince = 0; slowSince = 0;
            } else if ((missed > 1 / 6 || slowSince >= 2) && !dropLocked && gpuSlow !== false) {
              fastSince = 0; slowSince = 0;
              if (dpr > 0.75) {scene.setDpr(Math.max(0.75, dpr - 0.25)); dprChanges++; sinceDrop = 0; dropMissed = missed; if (sinceRaise <= 2) raiseLocked = true;}
              // (a GPU that still misses at the lowest pixel ratio, three checks running, can't play the film smoothly at all:
              // it steps between the held frames reduced motion uses instead, as a smooth still beats a juddering move)
              else if (atFloor >= 3) stills = true;
            } else if (gpuRoom !== false && (gpuRoom || (!anyMiss && p95 <= refresh * 1.1))) {
              if (++fastSince >= 3 && dpr < startDpr && !raiseLocked) {scene.setDpr(Math.min(startDpr, dpr + 0.25)); dprChanges++; fastSince = 0; sinceRaise = 0;}
            } else fastSince = 0;
          }
          work = performance.now() - begun;
        };
        raf = requestAnimationFrame(tick);
        // for the capture and probe scripts: pin the film at a progress, read where it is
        const startDpr = scene.info().maxDpr;
        window.__dataHall = {scene, ready: () => scene.ready(), progress: () => x, pin: value => {pinned = value;}, perf: () => ({log: [...log], cpu: [...cpuLog], gpuMs: [...gpuLog], stallAt: [...stallAt], boot, stalls, dprChanges, dpr: scene.info().dpr, gpu, tier: scene.info().tier})};
        return () => {cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); scene.dispose(); delete window.__dataHall; document.body.classList.remove('dh-film-on', 'nav-tone-owned'); if (scroller !== window) {scroller.style.backgroundColor = ''; scroller.style.scrollbarColor = '';}};
      }
    }
  }, [reduced]);

  // the build schedule's bars jump the film to a moment
  const jump = p => {
    const el = film.current, scroller = el.closest('.portfolio-page-viewport');
    const top = el.offsetTop + pToScroll(p) * (el.offsetHeight - innerHeight);
    (scroller || window).scrollTo({top, behavior: reduced ? 'auto' : 'smooth'});
  };

  return <div className="dh">
    <section className={'dh-film' + (failed ? ' is-static' : '')} ref={film} style={{height: failed ? 'auto' : FILM_VH + 'vh'}} aria-label={en ? 'Data Hall, built as you scroll' : 'Data Hall，随滚动盖起来'}>
      <div className="dh-stage" ref={stage} data-nav-tone="light">
        {failed ? <img className="dh-fallback" src="/assets/other-project/data-hall/cover.webp" alt={en ? 'The data hall’s floor plan' : '数据中心的平面图'}/> : <canvas key={reduced ? 'still' : 'moving'} ref={canvas} className="dh-canvas" aria-hidden="true"/>}
        <header className="dh-head" ref={head}>
          <span>OTHER PROJECT · 2026</span>
          <h1>Data Hall</h1>
        </header>
        <div className="dh-captions" aria-live="off">
          {CAPTIONS.map((c, i) => <div key={i} ref={n => {caps.current[i] = n;}} className={'dh-caption' + (failed || c.at[0] <= 0 ? ' is-on' : '')}>
            <h2>{c.title[lang]}</h2><p>{c.body[lang]}</p>
          </div>)}
        </div>
        <div className="dh-progress" aria-hidden="true"><i ref={bar}/>{[T.slab[0], T.racks[0], T.descend[0], T.power[0], T.slide[0], T.dive[0], T.swap[1]].map(v => <b key={v} style={{left: v * 100 + '%'}}/>)}</div>
      </div>
    </section>
    <MakingOf lang={lang} onJump={jump} onNavigate={onNavigate} stats={stats}/>
  </div>;
}
