import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import {PHONE, scrollerOf, useMedia} from '../../v2/motion';
import {ASSETS, BASE, photoSrc} from './media';
import {Photo, Pic} from './Pic';
import {drawFit, filmFor, filmInfo, useFilm} from './film';
import {SideSwitch} from './Sides';
import {indicatorCdm2, luxAt, nice, tAt} from './model';
import {CAPTURE, DAY} from './content';
import {Fill, tokens} from './Type';
import {SUN, sunMix} from './sun';
import {ControlCard} from './ControlCard';

/* "A day with Arden" (site-spec/WORLD-ARDEN-V3.md): one pinned, full-viewport stage, about eight screens of scroll.
   It opens with "Put them on": the glasses come toward you over a blurred street, and as they reach your face the
   street comes into focus and the frame is gone; you are looking at the world through Arden. Then five scenes, each a
   full-bleed photograph (the app's AI-generated scenes) crossfading into the next, with the display where the right
   eye's really is (upper centre-right) in the app's HUD language: warm-white type with a soft halo over a little
   dimming, never a card. A clock in the display and a timeline at the bottom (07:00 to 22:00) move with the day; a
   stop on the timeline jumps there. Things to do on the stage: the capture control (13:05), a squeeze to ask (16:40),
   You / Them in three scenes, the ambient light for the capture light. The day ends at 22:00 in the case, where the
   charging moment takes over. Reduced motion: the scenes as a column of stills, each in its final state; the controls
   still work.
   v4 (WORLD-ARDEN-V4.md): the title fills in word by word as the stage arrives, and a sun beat at 12:20: brightness
   rises with the scroll (or the sun slider), the overexposed street calms down as the lenses tint 0 to 85%, the
   display gets easier to read ("Tint 70% · auto"), and Them shows the lenses darkening from outside (renders/sun). */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = u => u * u * (3 - 2 * u);
// scroll, in screens, for each part of the day
const SPANS = [['putOn', 1.5], ['walk', 1.1], ['cafe', 1.3], ['music', .8], ['sun', 1.6], ['park', 1.35], ['ask', 1.2], ['dinner', 1.5], ['case', .6]];
const STARTS = SPANS.reduce((a, [, s], i) => [...a, (a[i - 1] ?? 0) + (i ? SPANS[i - 1][1] : 0)], []);
const TOTAL = SPANS.reduce((a, [, s]) => a + s, 0);
const SUN_INDEX = SPANS.findIndex(([id]) => id === 'sun');
const SCENES = DAY.scenes.filter(s => s.scene);            // the five with a photograph
const byId = Object.fromEntries(DAY.scenes.map(s => [s.id, s]));
const DAY_START = 420, DAY_END = 1320;                       // 07:00 to 22:00, in minutes
const LED = [36.8, 46];                                      // the capture light in detail-camera-on (percent)
const sidesOf = s => (s.sides === 'sun' ? SUN.length > 1 : !!s.sides);
/** How bright it is (0 to 1) and how far the lenses have tinted (0 to .85): the scroll raises the sun through the
    beat unless the slider has set it; the tint follows the light. */
export function sunAt(q, manual) {
  const sun = manual ?? smooth(clamp((q - .04) / .7));
  // the tint follows the light a little behind it, so the glare shows first and then calms
  const tint = .85 * smooth(clamp((sun - .4) / .55));
  return {sun, tint};
}
const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

/** Where the day is at `u` screens into the stage: the part, its local progress, and the clock. */
function at(u) {
  let i = 0;
  while (i < SPANS.length - 1 && u >= STARTS[i + 1]) i++;
  const [id, span] = SPANS[i], q = clamp((u - STARTS[i]) / span);
  const s = byId[id];
  const clock = id === 'putOn' ? 478 + q * 14 : s.min + Math.floor(q * (id === 'case' ? 1 : 9));
  return {id, i, q, clock};
}
/** Scroll position (y) that puts the day at part `id`, a third of the way in. */
function yFor(run, id) {
  const i = SPANS.findIndex(([k]) => k === id);
  const u = STARTS[i] + SPANS[i][1] * .34;
  const stage = run.firstElementChild, top = parseFloat(getComputedStyle(stage).top) || 0;
  return run.getBoundingClientRect().top + window.scrollY - top + u / TOTAL * (run.offsetHeight - stage.offsetHeight);
}

export default function Day({reduced}) {
  const {t} = useCaseLang();
  const phone = useMedia(PHONE);
  const [sides, setSides] = useState({cafe: 'you', sun: 'you', park: 'you', dinner: 'you'});
  const setSide = id => v => setSides(s => ({...s, [id]: v}));
  const controls = useControls(reduced);
  if (reduced) return <section id="ar-day" className="ar-day ar-black is-list" aria-labelledby="ar-day-h">
    <div className="ar-day-intro">
      <p className="ar-eyebrow">{t(DAY.heading)}</p>
      <h2 id="ar-day-h" className="ar-h2" tabIndex={-1}>{t(DAY.putOn)}</h2>
      <p className="ar-lede">{t(DAY.putOnLine)}</p>
    </div>
    {DAY.scenes.map(s => <figure key={s.id} className="ar-day-still">
      <div className="ar-day-frame">
        <Stage id={s.id} q={s.id === 'cafe' ? 1 : s.id === 'walk' ? .2 : .9} side={sides[s.id] || 'you'} phone={phone} controls={controls}
          onSide={sidesOf(s) ? setSide(s.id) : null}/>
      </div>
    </figure>)}
    <p className="ar-day-ai is-list">{t(DAY.ai)}</p>
  </section>;
  return <Pinned sides={sides} setSide={setSide} controls={controls} phone={phone}/>;
}

/* ---------- the pinned stage ---------- */
function Pinned({sides, setSide, controls, phone}) {
  const {t, zh} = useCaseLang();
  const run = useRef(null), stage = useRef(null), canvas = useRef(null), sceneEls = useRef([]), title = useRef(null);
  const name = useMemo(() => filmFor('puton'), []);
  const info = name ? filmInfo(name) : null;
  const {store, loaded} = useFilm(name, run, {when: 'near', margin: '1500px 0px', enabled: !!info});
  const [u, setU] = useState(0);
  const uRef = useRef(0);

  // scroll → u (screens into the day); the photographs, their blur and the put-on film are set here directly
  const paint = useCallback(v => {
    const putOn = clamp(v / SPANS[0][1]);
    // the new put-on (constant field of view) leaves the frame by about four-fifths in; the street is sharp by then
    const focus = smooth(clamp((putOn - .5) / .28));
    SCENES.forEach((s, i) => {
      const el = sceneEls.current[i];
      if (!el) return;
      const start = STARTS[SPANS.findIndex(([id]) => id === s.id)];
      // each scene fades in over the one before it, around its boundary; the walk is there from the start
      const o = i === 0 ? 1 : smooth(clamp((v - (start - .14)) / .28));
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > .001 ? 'visible' : 'hidden';
      if (i === 0) el.style.filter = focus < 1 ? `blur(${(24 * (1 - focus)).toFixed(1)}px) brightness(${(.62 + .38 * focus).toFixed(3)})` : '';
    });
    const c = canvas.current;
    if (c && info) {
      c.style.opacity = (1 - smooth(clamp((putOn - .74) / .18))).toFixed(3);
      const img = store?.nearest(Math.round(clamp(putOn / .85) * (info.count - 1)));
      if (img && v < SPANS[0][1] + .2) drawFit(c, img, 'contain');
    }
  }, [store, info]);
  useLayoutEffect(() => {
    const node = run.current, st = stage.current;
    if (!node || !st) return undefined;
    const sc = scrollerOf(node);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect(), top = parseFloat(getComputedStyle(st).top) || 0;
      const v = clamp((top - r.top) / Math.max(1, r.height - st.offsetHeight)) * TOTAL;
      // the title's words fill in from when the stage is half in view to a fifth of the way into the put-on
      const unit = Math.max(1, r.height - st.offsetHeight) / TOTAL, vh = sc === window ? innerHeight : sc.clientHeight;
      title.current?.style.setProperty('--p', clamp((top - r.top + vh * .5) / (vh * .5 + unit * SPANS[0][1] * .2)).toFixed(4));
      uRef.current = v;
      paint(v);
      // the React side (display, captions, controls) only needs a few hundred steps across the day
      setU(Math.round(v * 200) / 200);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [paint]);
  useEffect(() => { paint(uRef.current); }, [loaded, paint]);

  const now = at(u);
  const s = byId[now.id] || byId.walk;
  const inPutOn = now.id === 'putOn';
  const putOn = clamp(u / SPANS[0][1]);
  // near a boundary the words fade, so one scene's words never sit on the next scene's picture
  const edge = Math.min(u - STARTS[now.i], STARTS[now.i] + SPANS[now.i][1] - u);
  const wordsIn = inPutOn ? smooth(clamp((putOn - .88) / .1)) : smooth(clamp(edge / .14));
  const side = sides[now.id] || 'you';
  const night = .62 * smooth(clamp((u - STARTS[SPANS.length - 1]) / .4));   // the evening dims; the stage never goes blank
  const sun = sunAt(now.id === 'sun' ? now.q : u > STARTS[SUN_INDEX] ? 1 : 0, now.id === 'sun' ? controls.sunManual : null);
  const sunVis = smooth(clamp((u - (STARTS[SUN_INDEX] - .14)) / .28)) * (1 - smooth(clamp((u - (STARTS[SUN_INDEX + 1] - .14)) / .28)));   // the sun scene's own fade
  const sunOn = sunVis > .002;
  const titleN = tokens(t(DAY.putOn), zh).length;
  const jump = id => { const y = yFor(run.current, id); window.scrollTo({top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };

  return <section id="ar-day" className="ar-day ar-black" aria-labelledby="ar-day-h">
    <div ref={run} className="ar-day-run" style={{'--units': TOTAL}}>
      <div ref={stage} className="ar-day-stage" data-side={side} data-scene={now.id}>
        <div className="ar-day-scenes" aria-hidden="true">
          {SCENES.map((x, i) => <img key={x.id} ref={el => { sceneEls.current[i] = el; }} className="ar-day-scene" alt="" decoding="async"
            src={photoSrc('scenes', x.scene, phone ? 800 : 1600)} style={{objectPosition: phone ? x.focusM : x.focus, filter: x.id === 'sun' ? sunFilter(sun) : undefined}} loading={i ? 'lazy' : 'eager'}/>)}
          {sunOn ? <SunLight sun={sun} vis={sunVis}/> : null}
        </div>
        {info ? <canvas ref={canvas} className="ar-day-film" aria-hidden="true"/> : null}
        <div className="ar-day-shade" aria-hidden="true"/>
        <Them id={now.id} side={side} controls={controls} phone={phone} q={now.q} sun={sun}/>
        <div className="ar-day-hud-wrap" style={{opacity: side === 'them' ? 0 : wordsIn * (1 - night * .2) * (now.id === 'sun' ? .5 + .5 * sun.tint / .85 : 1)}}>
          <Hud id={inPutOn ? 'walk' : now.id} q={inPutOn ? 0 : now.q} clock={now.clock} controls={controls} sun={sun}/>
        </div>
        <div className="ar-day-night" aria-hidden="true" style={{opacity: night}}/>
        {/* the opening words of the day, over the blur */}
        <div ref={title} className="ar-day-title" style={{opacity: 1 - smooth(clamp((putOn - .22) / .16)), visibility: putOn > .4 ? 'hidden' : 'visible', '--n': titleN + tokens(t(DAY.putOnLine), zh).length}}>
          <p className="ar-eyebrow">{t(DAY.heading)}</p>
          <h2 id="ar-day-h" className="ar-day-h" tabIndex={-1}><Fill text={DAY.putOn}/></h2>
          <p className="ar-day-line"><Fill text={DAY.putOnLine} offset={titleN}/></p>
        </div>
        <div className="ar-day-copy" style={{opacity: wordsIn, visibility: wordsIn < .02 ? 'hidden' : 'visible'}}>
          <Caption s={inPutOn ? byId.walk : s} side={side} onSide={sidesOf(s) && !inPutOn ? setSide(now.id) : null}/>
          {inPutOn ? null : <SceneControls key={now.id} id={now.id} side={side} controls={controls} sun={sun}/>}
        </div>
        {now.id === 'dinner' && side === 'you' ? <CheckIn q={now.q}/> : null}
        {now.id === 'park' ? <SyncNotice controls={controls}/> : null}
        <Timeline clock={now.clock} current={inPutOn ? null : now.id} onJump={jump} shown={!inPutOn || putOn > .9}/>
        <p className="ar-day-ai" style={{opacity: inPutOn ? 0 : 1}}>{t(DAY.ai)}</p>
        <p className="ar-sr" aria-live="polite">{inPutOn ? '' : `${s.time}, ${t(s.name)}. ${t(DAY.sceneAlts[now.id] || {en: '', zh: ''})}`}</p>
      </div>
    </div>
  </section>;
}

/* ---------- the display, in the app's HUD language ---------- */
function Hud({id, q, clock, controls, sun}) {
  const H = DAY.hud;
  let body = null;
  if (id === 'walk') {
    const go = clamp(q / .72), turned = clamp((q - .72) / .1), arrived = q > .84;
    const m = Math.max(0, Math.ceil(80 * (1 - go) / 5) * 5);
    body = arrived
      ? <div className="ar-hud-row"><svg className="ar-hud-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 25l8 8 16-18"/></svg>
        <div><p className="ar-hud-main">{H.arrived}</p><p className="ar-hud-sub">{H.arrivedSub}</p></div></div>
      : <div className="ar-hud-row"><svg className="ar-hud-icon" viewBox="0 0 48 48" aria-hidden="true" style={{transform: `rotate(${(-90 * turned).toFixed(1)}deg)`}}><path d="M14 40V20q0-4 4-4h18M30 10l6 6-6 6"/></svg>
        <div><p className="ar-hud-main is-num">{m} m</p><p className="ar-hud-sub">{H.turn}</p><p className="ar-hud-small">{H.street}</p></div></div>;
  } else if (id === 'cafe') {
    const typed = (text, a, b) => text.slice(0, Math.round(text.length * clamp((q - a) / (b - a))));
    const second = q > .5;
    const [src, dst] = H.lines[second ? 1 : 0];
    const shown = typed(dst, second ? .52 : .08, second ? .86 : .42);
    body = <div><p className="ar-hud-meta">{H.translated}</p>
      {second ? <p className="ar-hud-sub is-dim">“{H.lines[0][1]}”</p> : null}
      <p className="ar-hud-main is-sub">“{shown}<span className="ar-hud-caret" aria-hidden="true"/>{shown.length === dst.length ? '”' : ''}</p>
      <p className="ar-hud-small is-dim">{src}</p></div>;
  } else if (id === 'music') {
    body = <MusicHud q={q} controls={controls}/>;
  } else if (id === 'sun' && sun) {
    body = <div className="ar-hud-row"><svg className="ar-hud-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7"/><path d="M24 7v5M24 36v5M7 24h5M36 24h5M12 12l3.5 3.5M32.5 32.5L36 36M12 36l3.5-3.5M32.5 15.5L36 12"/></svg>
      <div><p className="ar-hud-main is-sub">{H.sun}</p><p className="ar-hud-sub is-num">{H.tint(Math.round(sun.tint * 100))}</p></div></div>;
  } else if (id === 'park') {
    const r = controls.rec;
    body = r.state === 'rec'
      ? <div className="ar-hud-center"><span className="ar-hud-dot" aria-hidden="true"/><p className="ar-hud-main is-sub">{H.recording} 0:{String(r.sec).padStart(2, '0')}</p><p className="ar-hud-small">{H.finish}</p></div>
      : r.state === 'saved'
        ? <div className="ar-hud-center"><p className="ar-hud-main is-sub">{r.kind === 'photo' ? 'Photo saved' : H.saved}</p><p className="ar-hud-small">{H.library}</p></div>
        : null;
  } else if (id === 'ask') {
    const a = controls.ask;
    body = a === 'listening'
      ? <div><p className="ar-hud-main is-sub">{H.listening}</p><p className="ar-hud-dots" aria-hidden="true"><span/><span/><span/></p></div>
      : a === 'answer'
        ? <div><svg className="ar-hud-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>
          <p className="ar-hud-main is-sub">{H.answer}</p><p className="ar-hud-sub">{H.answerSub}</p><p className="ar-hud-small">{H.more}</p></div>
        : null;
  } else if (id === 'dinner') {
    body = <div className="ar-hud-center"><svg className="ar-hud-boost" viewBox="0 0 60 30" aria-hidden="true"><path d="M6 15v0M18 9v12M30 3v24M42 9v12M54 15v0"/></svg>
      <p className="ar-hud-main is-sub">{H.boost}</p><p className="ar-hud-small">{H.boostSub}</p></div>;
  } else if (id === 'case') {
    body = <div className="ar-hud-center"><p className="ar-hud-main is-sub is-num">{H.low}</p><p className="ar-hud-sub is-num">{H.lowTime}</p><p className="ar-hud-small">{H.night}</p></div>;
  }
  return <div className="ar-hud" aria-hidden="true">
    <p className="ar-hud-clock">{fmt(clock)}</p>
    {body}
  </div>;
}

function MusicHud({q, controls}) {
  const {t} = useCaseLang();
  const [message, setMessage] = useState(false);
  const halfway = q >= .5;
  useEffect(() => {
    setMessage(halfway);
    if (!halfway) return;
    const timer = setTimeout(() => setMessage(false), 2400);
    return () => clearTimeout(timer);
  }, [halfway]);
  return <div>
    <p className="ar-hud-small" data-playing={controls.playing}>{t(controls.playing ? DAY.hud.playing : DAY.hud.paused)}</p>
    <p className="ar-hud-sub ar-hud-message" data-on={controls.reduced || (message && q < .82) || undefined}>{t(DAY.hud.message)}</p>
  </div>;
}

/* ---------- words, the switch and the controls ---------- */
function Caption({s, side, onSide}) {
  const {t} = useCaseLang();
  return <div className="ar-day-caption">
    <p className="ar-day-when"><span>{s.time}</span> · {t(s.name)}</p>
    <p className="ar-day-say">{t(side === 'them' && s.them ? s.them : s.caption)}</p>
    {onSide ? <SideSwitch side={side} onSide={onSide} tone="glass"/> : null}
  </div>;
}

function SceneControls({id, side, controls, sun}) {
  const {t} = useCaseLang();
  if (id === 'sun' && sun) {
    return <div className="ar-day-controls is-light">
      <label className="ar-day-range">
        <span className="ar-day-range-head"><span>{t(DAY.sunLight)}</span><b>{Math.round(sun.sun * 100)}%</b></span>
        <input type="range" min={0} max={1000} value={Math.round(sun.sun * 1000)} onChange={e => controls.setSunManual(+e.target.value / 1000)}
          aria-valuetext={`${Math.round(sun.sun * 100)}%, ${t(DAY.tintOut)} ${Math.round(sun.tint * 100)}%`}/>
        <span className="ar-day-range-ends" aria-hidden="true"><span>{t(DAY.shade)}</span><span>{t(DAY.fullSun)}</span></span>
      </label>
      <p className="ar-day-out">{t(DAY.tintOut)} <b>{Math.round(sun.tint * 100)}%</b> <Ev label="Estimated"/></p>
    </div>;
  }
  if (['park', 'ask', 'walk', 'cafe', 'music'].includes(id)) {
    return <div className="ar-day-controls has-card">
      <ControlCard key={id} id={id} controls={controls}/>
      <div className="ar-day-control-tools">
        {id === 'park' && side === 'them' ? <CaptureLight controls={controls}/> : null}
        <SoundToggle controls={controls}/>
      </div>
    </div>;
  }
  return null;
}

function CaptureLight({controls}) {
  const {t} = useCaseLang();
  const lux = luxAt(controls.light), cd = indicatorCdm2(lux);
  return <div className="ar-day-control-light">
      <label className="ar-day-range">
        <span className="ar-day-range-head"><span>{t(DAY.light)}</span><b>{Math.round(lux).toLocaleString('en-US')} lux</b></span>
        <input type="range" min={0} max={1000} value={Math.round(controls.light * 1000)} onChange={e => controls.setLight(+e.target.value / 1000)}
          aria-valuetext={`${Math.round(lux).toLocaleString('en-US')} lux`}/>
        <span className="ar-day-range-ends" aria-hidden="true"><span>{t(DAY.dim)}</span><span>{t(DAY.sun)}</span></span>
      </label>
      <p className="ar-day-out">{t(DAY.indicator)} <b>≈ {nice(cd)} cd/m²</b> <Ev label="Estimated"/></p>
  </div>;
}

function SoundToggle({controls}) {
  const {t} = useCaseLang();
  return <button type="button" className="ar-day-sound" aria-pressed={controls.sound} onClick={() => controls.setSound(v => !v)}>
    {t(controls.sound ? DAY.sound.on : DAY.sound.off)}
  </button>;
}

/** The capture control (a five-second clip, a soft tick if sound is on), the squeeze, the ambient light, sound. */
function useControls(reduced) {
  const [rec, setRec] = useState({state: 'idle', sec: 0});
  const [ask, setAsk] = useState('idle');
  const [playing, setPlaying] = useState(true);
  const toggleMusic = useCallback(() => setPlaying(p => !p), []);
  const [light, setLight] = useState(tAt(500));
  const [sound, setSound] = useState(false);
  const [sunManual, setSunManual] = useState(null);     // null: the scroll sets the sun
  const [indicator, setIndicator] = useState(false);
  const timer = useRef(0), hold = useRef(0), indicatorTimer = useRef(0), audio = useRef(null), recording = useRef(false), seconds = useRef(0);
  const tick = useCallback(() => {
    if (!sound) return;
    try {
      const A = audio.current || (audio.current = new (window.AudioContext || window.webkitAudioContext)());
      const len = Math.floor(A.sampleRate * .05), buf = A.createBuffer(1, len, A.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * .16));
      const src = A.createBufferSource(), g = A.createGain(), f = A.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .9; g.gain.value = .1;
      src.buffer = buf; src.connect(f).connect(g).connect(A.destination); src.start();
    } catch { /* no audio: the display still shows it */ }
  }, [sound]);
  useEffect(() => () => { clearInterval(timer.current); clearTimeout(hold.current); clearTimeout(indicatorTimer.current); }, []);
  const flash = useCallback(() => {
    clearTimeout(indicatorTimer.current);
    setIndicator(true);
    indicatorTimer.current = setTimeout(() => setIndicator(false), 1200);
  }, []);
  const save = useCallback(kind => {
    clearInterval(timer.current);
    recording.current = false;
    setRec({state: 'saved', kind, sec: seconds.current});
    timer.current = setTimeout(() => setRec({state: 'idle', sec: 0}), 2600);
  }, []);
  const photo = useCallback(() => {
    tick();
    if (recording.current) save('video');
    else { flash(); save('photo'); }
  }, [tick, save, flash]);
  const capture = useCallback(() => {
    clearInterval(timer.current);
    tick();
    if (recording.current) { save('video'); return; }
    recording.current = true;
    seconds.current = 0;
    flash();
    setRec({state: 'rec', sec: 0});
    timer.current = setInterval(() => {
      seconds.current++;
      if (seconds.current >= 5) { save('video'); tick(); }
      else setRec({state: 'rec', sec: seconds.current});
    }, 1000);
  }, [tick, save, flash]);
  // squeeze and hold: listening while held; after a moment the answer comes, and stays
  const press = useCallback(() => {
    clearTimeout(hold.current);
    setAsk('listening');
    hold.current = setTimeout(() => setAsk('answer'), 900);
  }, []);
  const lift = useCallback(() => { clearTimeout(hold.current); setAsk(a => (a === 'listening' ? 'idle' : a)); }, []);
  return {rec, capture, photo, indicator, ask, press, voice: press, lift, playing, toggleMusic, reduced, light, setLight, sound, setSound, sunManual, setSunManual};
}

function SyncNotice({controls}) {
  const {t} = useCaseLang();
  const saved = controls.rec.state === 'saved';
  return <div className="ar-day-sync" data-on={saved || undefined} role="status">
    <img src={photoSrc('scenes', 'capture', 800)} alt="" width={44} height={44}/>
    <span>{saved ? t(controls.rec.kind === 'photo' ? DAY.photoSynced : DAY.videoSynced) : ''}</span>
  </div>;
}

/* ---------- Them: what the person across from you sees ---------- */
function Them({id, side, controls, phone, sun}) {
  const {t} = useCaseLang();
  const on = side === 'them';
  const lux = luxAt(controls.light), cd = indicatorCdm2(lux);
  const glow = Math.min(1, .5 + .5 * (Math.log10(cd) - Math.log10(30)) / (Math.log10(6000) - Math.log10(30)));
  return <div className="ar-day-them" data-on={on || undefined} aria-hidden={on ? undefined : 'true'}>
    {id === 'cafe' ? <>
      <Photo dir="lifestyle" name="try-on-desert" alt={t(DAY.themAlts.cafe)} className="ar-day-them-photo"/>
      <span className="ar-day-phone"><span className="ar-phone-frame"><img src={`${BASE}/app/show-person-light.webp`} width={780} height={1688} alt={t(DAY.themAlts.phone)} loading="lazy" decoding="async"/></span></span>
    </> : null}
    {id === 'park' ? <figure className="ar-day-led" style={{'--room': (.48 + .62 * controls.light).toFixed(3), '--glow': glow.toFixed(3)}}>
      <Pic name="detail-camera-on" alt={t(DAY.themAlts.park)} className="ar-day-led-img"/>
      <span className="ar-day-led-glow" aria-hidden="true" style={{left: `${LED[0]}%`, top: `${LED[1]}%`}}/>
    </figure> : null}
    {id === 'sun' && SUN.length > 1 && sun ? <figure className="ar-day-sunfig">
      {SUN.map((x, i) => <Pic key={x.name} name={x.name} alt={i ? '' : t(DAY.themAlts.sun)} className="ar-day-sunimg" style={{opacity: sunMix(SUN, sun.tint * 100, i)}}/>)}
    </figure> : null}
    {id === 'dinner' ? <div className="ar-day-quiet">
      <p className="ar-day-quiet-big">{t(byId.dinner.them)}</p>
      <p>{t(DAY.check.themSub)}</p>
    </div> : null}
  </div>;
}

/* ---------- Hearing Check-in at dinner ---------- */
const WEEKS = [.9, 1.1, .8, 1.2, 1.3, 1.8, 2.3, 2.8];
function CheckIn({q, still}) {
  const {t} = useCaseLang();
  const C = DAY.check;
  const marks = C.marks.map((m, i) => ({m, on: still || q > .1 + i * .09}));
  const fill = still ? 1 : clamp((q - .36) / .36);
  const card = still || q > .78;
  return <div className={`ar-check${still ? ' is-still' : ''}`}>
    <div className="ar-check-panel">
      <p className="ar-check-title">{C.title} <span>{t(C.sample)}</span></p>
      <div className="ar-check-talk" aria-hidden="true">
        {marks.map((k, i) => <span key={i} className="ar-check-mark" data-on={k.on || undefined}>{k.m}</span>)}
      </div>
      <span className="ar-check-line" aria-hidden="true"/>
      <p className="ar-check-label">{t(C.chart)}</p>
      <div className="ar-check-bars" role="img" aria-label={`${t(C.chart)}: ${WEEKS.join(', ')}`}>
        {WEEKS.map((w, i) => <span key={i} style={{height: `${(w / 3) * 100 * clamp(fill * 8 - i)}%`}}/>)}
      </div>
    </div>
    <div className="ar-check-card" data-on={card || undefined} role="status">
      <span className="ar-check-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 9a4 4 0 1 1 8 0c0 3-3 3.5-3 6.5a2.5 2.5 0 0 1-5 0"/><path d="M11 9.5a1.5 1.5 0 0 1 3 0"/></svg></span>
      <span><b>{C.card}</b> {C.cardSub}</span>
    </div>
  </div>;
}

/* ---------- the day's timeline ---------- */
function Timeline({clock, current, onJump, shown}) {
  const {t} = useCaseLang();
  const pos = m => `${((m - DAY_START) / (DAY_END - DAY_START)) * 100}%`;
  return <nav className="ar-day-timeline" aria-label={t(DAY.timeline)} style={{opacity: shown ? 1 : 0, visibility: shown ? 'visible' : 'hidden'}}>
    <span className="ar-day-track" aria-hidden="true"><span style={{width: pos(clamp(clock, DAY_START, DAY_END))}}/></span>
    {DAY.scenes.map((s, i) => <button key={s.id} type="button" className="ar-day-stop" style={{left: pos(s.min)}} aria-current={current === s.id ? 'step' : undefined}
      data-up={s.id === 'music' || (i && s.min - DAY.scenes[i - 1].min < 60 && DAY.scenes[i - 1].id !== 'music') ? true : undefined}
      aria-label={t(DAY.goTo(s.time, t(s.name)))} onClick={() => onJump(s.id)}>
      <span className="ar-day-stop-dot" aria-hidden="true"/><span className="ar-day-stop-label" aria-hidden="true">{s.time} {t(s.timelineName || s.name)}</span>
    </button>)}
    <span className="ar-day-ends" aria-hidden="true"><span>07:00</span><span>22:00</span></span>
  </nav>;
}

/* ---------- reduced motion: one scene, still ---------- */
function Stage({id, q, side, phone, controls, onSide}) {
  const s = byId[id];
  const {t} = useCaseLang();
  const scene = s.scene || 'boost';
  const sun = id === 'sun' ? sunAt(.75, controls.sunManual) : null;
  return <div className="ar-day-stage is-still" data-side={side} data-scene={id}>
    <img className="ar-day-scene" src={photoSrc('scenes', scene, phone ? 800 : 1600)} alt={t(DAY.sceneAlts[id] || DAY.sceneAlts.dinner)} loading="lazy" decoding="async"
      style={{objectPosition: phone ? s.focusM : s.focus, filter: id === 'case' ? 'brightness(.25)' : sun ? sunFilter(sun) : undefined}}/>
    {sun ? <SunLight sun={sun}/> : null}
    <div className="ar-day-shade" aria-hidden="true"/>
    <Them id={id} side={side} controls={controls} phone={phone} sun={sun}/>
    <div className="ar-day-hud-wrap" style={{opacity: side === 'them' ? 0 : 1}}><Hud id={id} q={q} clock={s.min + 3} controls={controls} sun={sun}/></div>
    {id === 'dinner' && side === 'you' ? <CheckIn q={1} still/> : null}
    {id === 'park' ? <SyncNotice controls={controls}/> : null}
    <div className="ar-day-copy">
      <Caption s={s} side={side} onSide={onSide}/>
      <SceneControls id={id} side={side} controls={controls} sun={sun}/>
    </div>
  </div>;
}

/* ---------- sun mode ---------- */
/** The street in the sun, through the lenses: overexposed at first, calmer as the tint comes in. */
function sunFilter({sun, tint}) {
  const k = tint / .85;
  return `brightness(${(1 + .8 * sun - .62 * k).toFixed(3)}) contrast(${(1 - .3 * sun + .26 * k).toFixed(3)}) saturate(${(1 - .4 * sun + .36 * k).toFixed(3)})`;
}
/** The glare (a bloom from the sky) and the tint (a warm grey, multiplied), over the sun scene. */
function SunLight({sun: {sun, tint}, vis = 1}) {
  const k = tint / .85;
  return <>
    <span className="ar-day-glare" style={{opacity: (vis * Math.min(1, sun * 1.25) * (1 - .92 * k)).toFixed(3)}}/>
    <span className="ar-day-tint" style={{opacity: (vis * tint * .9).toFixed(3)}}/>
  </>;
}
