import {Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Go} from '../../Go';
import {Ev} from '../../CaseKit';
import {ProductFooter} from '../../ProductIndex';
import {nextCase} from '../../content';
import {Pipeline, TestSet} from '../../figures';
import BeforeAfter, {RoundChanges} from '../../v2/BeforeAfter';
import NextProject from '../../v2/NextProject';
import {Deferred} from '../../v2/Try';
import {rfaShot} from '../../v2/Device';
import {AtelierTileArt} from '../../v2/TileArt';
import {PHONE, useMedia} from '../../v2/motion';
import Camera from './camera';
import Cursors from './Cursors';
import Compile from './Compile';
import {WorldCtx} from './context';
import {AgentSide, Crop, Directions, FlatResult, LiveEditor, Principles, ThemeMoment} from './parts';
import {AGENT_NOTE, CHANGES, FLOW, FRAMES, HABITS, indexOf, NUMBERS, ROUNDS, SECTIONS, TASKS} from './data';
import {L, UI, useCaseLang} from '../../i18n';
import {FigIcon} from './icons';
import {WalkthroughProvider, WatchButton} from '../../v2/Walkthrough';
import '../../v2/v2.css';
import '../../v2/chrome.css';
import './world.css';

/* D1, Ready for agents, as its own world: the case is a Figma file. Chapters are sections, beats are frames, and the
   page scroll is a camera that flies from frame to frame (camera.js). Jay and the Agent are on the file with you
   (Cursors.jsx). The research chapter's signature is the compile (Compile.jsx); the live editor sits in the last
   frame, life-size. Phones, reduced motion and "Read as a plain page" get the same frames in one column.
   Reused from the shared kit, unchanged: Try the finding, the ablation chart, the linked layer trees, BeforeAfter,
   the prototype screen (Device), TestSet and Pipeline, NextProject and the lightbox. */

const TryFinding = lazy(() => import('../../v2/modules/TryFinding'));
const AblationChart = lazy(() => import('../../v2/modules/AblationChart'));
const LinkedLayers = lazy(() => import('../../v2/modules/LinkedLayers'));
const LightboxViewer = lazy(() => import('../../v2/Lightbox'));

const CANVAS_MIN = '(min-width: 1000px) and (min-height: 600px)';
const SIDEBAR_MIN = 1200;
const PREF = 'rfaw-plain';
// Light or dark, shared by every case page (Figma UI3's light and dark themes here).
const THEME_KEY = 'jl-case-theme';
const readTheme = () => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };
const readPref = () => { try { return sessionStorage.getItem(PREF) === '1'; } catch { return false; } };
const writePref = v => { try { sessionStorage.setItem(PREF, v ? '1' : '0'); } catch { /* storage blocked */ } };

/** Where the stage is: the part of the viewport the camera frames, clear of the site nav, the panel and the toolbar. */
function insetsFor(r, vp) {
  const side = vp.w >= SIDEBAR_MIN ? 12 + 300 + 36 : 12 + 48 + 32;
  // the site's nav bar takes the top 96 px
  return r.wide ? {l: 32, r: 32, t: 128, b: 80} : {l: side, r: 36, t: 136, b: 84};
}

/** Catches what a part of the page throws while rendering, so one broken module can't take the page down with it (an
    uncaught render error unmounts the whole tree: a blank page until reload). */
class Guard extends Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch(error) { console.error(`[ready-for-agents] ${this.props.name || 'a part'} failed to render`, error); }
  retry = () => this.setState({failed: false});
  render() {
    if (!this.state.failed) return this.props.children;
    const {fallback} = this.props;
    return typeof fallback === 'function' ? fallback(this.retry) : fallback ?? null;
  }
}

/** What a frame shows when its content failed: the frame stays on the canvas, with a way to try again. */
function FrameFallback({retry}) {
  const {t} = useCaseLang();
  return <div className="rfaw-fallback" role="status">
    <p className="rfaw-body">{t(L('This part of the file didn’t load.', '这部分没加载出来。'))}</p>
    <button type="button" className="rfaw-btn is-small" onClick={retry}>{t(L('Try again', '再试一次'))}</button>
  </div>;
}

function Frame({f, index, children, go, className = '', current}) {
  const {t} = useCaseLang();
  return <div className={`rfaw-frame ${className}${current ? ' is-current' : ''}`} data-frame={f.id} data-wide={f.wide ? '' : undefined} data-hold={f.hold || undefined}
    data-stops={f.stops?.join(',') || undefined} id={`rfa-${f.id}`}>
    <button type="button" className="rfaw-frame-label" tabIndex={-1} aria-hidden="true" onClick={() => go(f.id)}>
      <FigIcon name="frame" size={12}/><span>{t(f.name)}</span>
    </button>
    <div className="rfaw-frame-body" data-frame-body="" data-index={index}>
      <Guard name={`frame ${f.id}`} fallback={retry => <FrameFallback retry={retry}/>}>{children}</Guard>
    </div>
  </div>;
}

/** Frame heading: a title and an optional lede, as text layers the Agent can read. */
function Head({title, lede, level = 3, id}) {
  const {t} = useCaseLang();
  const H = `h${level}`;
  return <header className="rfaw-head">
    <H id={id} className={level === 2 ? 'rfaw-h2' : 'rfaw-h3'} data-agent="Text">{t(title)}</H>
    {lede ? <p className="rfaw-lede" data-agent="Text">{t(lede)}</p> : null}
  </header>;
}

/** The world, guarded as a whole: if the canvas itself fails, the same frames come back as the plain page; if even that
    fails, a short note with a reload link. Never a blank page. */
export default function ReadyForAgentsWorld(props) {
  return <Guard name="canvas" fallback={<Guard name="plain page" fallback={<WorldFailed/>}><World {...props} forcePlain/></Guard>}>
    <World {...props}/>
  </Guard>;
}

function WorldFailed() {
  const {t, htmlLang} = useCaseLang();
  return <article className="rfaw is-plain rfaw-failed" lang={htmlLang} data-theme={readTheme()} data-nav-tone="light">
    <p className="rfaw-body">{t(L('This page didn’t load properly.', '这个页面没能正常加载。'))}</p>
    <a className="rfaw-btn" href={typeof location === 'undefined' ? '' : location.href}>{t(L('Reload', '重新加载'))}</a>
  </article>;
}

function World({item, reduced, forcePlain = false}) {
  const {t, zh, htmlLang} = useCaseLang();
  const root = useRef(null), track = useRef(null), viewport = useRef(null), world = useRef(null), zoomText = useRef(null);
  const roomy = useMedia(CANVAS_MIN), phone = useMedia(PHONE);
  const [plain, setPlain] = useState(readPref);
  const mode = plain || forcePlain ? 'plain' : roomy && !reduced ? 'canvas' : 'stack';
  const [camera, setCamera] = useState(null);
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(null);
  const [free, setFree] = useState(false);
  const [tool, setTool] = useState('move');
  const [zoomMenu, setZoomMenu] = useState(false);
  const [tab, setTab] = useState('file');
  const [zoom, setZoom] = useState(null);
  const [theme, setThemeState] = useState(readTheme);
  const themeTimer = useRef(0);
  // a 200 ms crossfade of every color while the theme changes; instant with reduced motion
  const setTheme = useCallback(t => {
    if (t === theme) return;
    const node = root.current;
    if (node && !reduced) {
      clearTimeout(themeTimer.current);
      node.classList.add('is-theming');
      themeTimer.current = setTimeout(() => node.classList.remove('is-theming'), 240);
    }
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* storage blocked */ }
  }, [theme, reduced]);
  // another case page (or tab) changed it
  useEffect(() => {
    const sync = e => { if (e.key === THEME_KEY) setThemeState(e.newValue === 'dark' ? 'dark' : 'light'); };
    addEventListener('storage', sync);
    return () => { removeEventListener('storage', sync); clearTimeout(themeTimer.current); };
  }, []);
  const place = useRef(0);          // the frame the reader is on, kept across mode switches
  const next = nextCase(item.slug);

  // ---------- the camera (canvas mode only) ----------
  useLayoutEffect(() => {
    if (mode !== 'canvas') return undefined;
    const cam = new Camera({root: root.current, track: track.current, viewport: viewport.current, world: world.current, insets: insetsFor,
      onActive: (a, arr) => { setActive(a); place.current = a; setArrived(arr >= 0 ? FRAMES[arr]?.id : null); },
      onFree: setFree,
      onChange: c => {
        if (zoomText.current) zoomText.current.textContent = `${Math.round(c.cam.s * 100)}%`;
        root.current?.classList.toggle('is-scrolled', c.p > 30);
        root.current?.classList.toggle('is-past-end', c.pt >= c.total - 1);
      }});
    cam.start();
    // keep the reader's place when coming back from the plain page; on a fresh visit, fly in from the canvas
    if (place.current > 0) cam.jump(place.current); else cam.intro();
    setCamera(cam);
    // for the canvas stress test (scripts/qa-canvas-paging.mjs, against the dev server)
    if (import.meta.env.DEV) window.__rfaCamera = cam;
    return () => { cam.stop(); setCamera(null); setFree(false); };
  }, [mode]);
  useEffect(() => { camera?.setTool(tool); }, [camera, tool]);

  // As in the editor, names on the canvas and the dot grid keep their size on screen at any zoom. Written per element
  // (about thirty), never as an inherited custom property on the world.
  useEffect(() => {
    if (!camera) return undefined;
    const labels = [...world.current.querySelectorAll('.rfaw-frame-label')], tags = [...world.current.querySelectorAll('.rfaw-section-tag')];
    const dots = viewport.current.querySelector('.rfaw-dots');
    let lastS = 0;
    return camera.subscribe(c => {
      const s = c.s;
      let g = 24 * s;
      while (g < 12) g *= 2;
      while (g > 48) g /= 2;
      dots.style.backgroundSize = `${g.toFixed(2)}px ${g.toFixed(2)}px`;
      dots.style.backgroundPosition = `${(-c.x * s % g).toFixed(1)}px ${(-c.y * s % g).toFixed(1)}px`;
      dots.style.opacity = s < .2 ? (s / .2).toFixed(2) : '';
      if (Math.abs(s - lastS) < .002) return;
      lastS = s;
      const inv = s < 1 ? Math.min(1 / s, 14) : 1, t = inv === 1 ? '' : `scale(${inv.toFixed(3)})`;
      // a frame's name never runs past its frame; far out, only the sections keep their names
      labels.forEach(l => { l.style.transform = t; l.style.maxWidth = `${(100 / inv).toFixed(2)}%`; l.style.opacity = s < .16 ? '0' : ''; });
      tags.forEach(l => { l.style.transform = t; });
    });
  }, [camera]);

  // stack and plain: which frame is on screen (for the place, and the panel)
  useEffect(() => {
    if (mode === 'canvas') return undefined;
    const frames = [...root.current.querySelectorAll('[data-frame]')];
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { const i = frames.indexOf(e.target); if (i >= 0) { place.current = i; setActive(i); } }
    }), {rootMargin: '-45% 0px -50% 0px'});
    frames.forEach(f => io.observe(f));
    return () => io.disconnect();
  }, [mode]);

  const go = useCallback((id, e) => {
    const i = indexOf(id);
    if (i < 0) return;
    e?.preventDefault?.();
    if (camera) { camera.jump(i); return; }
    const el = root.current?.querySelector(`[data-frame="${id}"]`);
    el?.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
  }, [camera, reduced]);

  const togglePlain = e => {
    e?.preventDefault();
    const v = !plain;
    writePref(v); setPlain(v);
  };
  // after a switch into a column, put the reader back on their frame
  useLayoutEffect(() => {
    if (mode === 'canvas') return;
    const el = root.current?.querySelector(`[data-frame="${FRAMES[place.current]?.id}"]`);
    if (el && place.current > 0) el.scrollIntoView({block: 'start'});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // V and H pick the tool, as in the editor
  useEffect(() => {
    if (mode !== 'canvas') return undefined;
    const key = e => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'v' || e.key === 'V') setTool('move');
      else if (e.key === 'h' || e.key === 'H') setTool('hand');
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [mode]);

  // the figure viewer: any [data-zoom] in the page opens it; arrows step through the figures of the same group
  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const toItem = t => {
      const img = t.tagName === 'IMG' ? t : t.querySelector('img');
      return {src: t.getAttribute('data-zoom') || img?.currentSrc || img?.src, alt: t.getAttribute('data-zoom-alt') || img?.alt || '',
        w: Number(t.getAttribute('data-zoom-w')) || img?.naturalWidth || 0, h: Number(t.getAttribute('data-zoom-h')) || img?.naturalHeight || 0};
    };
    const open = (trigger, keyboard) => {
      const group = trigger.closest('[data-zoom-group]') || trigger.closest('[data-frame]') || node;
      const all = [...group.querySelectorAll('[data-zoom]')].filter(t => t.getClientRects().length);
      const list = all.length ? all : [trigger];
      setZoom({items: list.map(toItem), index: Math.max(0, list.indexOf(trigger)), keyboard, opener: trigger});
    };
    const click = e => {
      const t = e.target.closest?.('[data-zoom]');
      if (!t || !node.contains(t) || e.defaultPrevented || viewport.current?.classList.contains('is-hand')) return;
      e.preventDefault();
      open(t, e.detail === 0);
    };
    const key = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target.closest?.('[data-zoom]');
      if (!t || t !== e.target || t.tagName === 'BUTTON' || t.tagName === 'A') return;
      e.preventDefault();
      open(t, true);
    };
    node.addEventListener('click', click);
    node.addEventListener('keydown', key);
    return () => { node.removeEventListener('click', click); node.removeEventListener('keydown', key); };
  }, []);

  const ctx = useMemo(() => ({mode, arrived, camera, go, theme}), [mode, arrived, camera, go, theme]);
  const activeFrame = FRAMES[active];
  const minimized = mode === 'canvas' && activeFrame?.wide && !free;
  const motionOff = reduced || mode === 'plain';
  const rounds = useMemo(() => ROUNDS.map(r => ({...r, tab: t(r.tab), caption: t(r.caption), before: {...r.before, label: t(r.before.label)}, after: {...r.after, label: t(r.after.label)}})), [t]);
  const changes = useMemo(() => CHANGES.map(c => ({what: t(c.what), why: t(c.why)})), [t]);

  const frame = (id, content, className) => {
    const i = indexOf(id);
    return <Frame key={id} f={FRAMES[i]} index={i} go={go} className={className} current={i === active}>{content}</Frame>;
  };

  return <WorldCtx.Provider value={ctx}>
    <article ref={root} className={`rfaw is-${mode}${minimized ? ' is-minimized' : ''}${free ? ' is-free' : ''}${active > 0 ? ' is-past-cover' : ''}${zh ? ' is-zh' : ''}`} lang={htmlLang} data-theme={theme} data-nav-tone={theme === 'dark' ? 'dark' : 'light'}>
      <WalkthroughProvider slug={item.slug} title="Ready for agents" reduced={reduced}>
      {forcePlain ? null : <a className="rfaw-skip" href="#rfa-cover" onClick={togglePlain}>
        <FigIcon name={plain ? 'frame' : 'page'}/>{plain ? t(roomy && !reduced ? L('Back to the canvas', '回到画布') : UI.backToFull) : t(UI.readPlain)}
      </a>}

      <div className="rfaw-themes" role="group" aria-label={t(UI.theme)}>
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} title={t(UI.light)}><FigIcon name="sun"/><span className="v2-sr">{t(UI.light)}</span></button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} title={t(UI.dark)}><FigIcon name="moon"/><span className="v2-sr">{t(UI.dark)}</span></button>
      </div>

      <div ref={track} className="rfaw-track">
        <div ref={viewport} className="rfaw-viewport">
          <div className="rfaw-dots" aria-hidden="true"/>
          <div ref={world} className="rfaw-world">
            {SECTIONS.map(s => <section key={s.id} className={`rfaw-section is-${s.id}`} data-section={s.id} aria-label={t(s.name)}>
              <p className="rfaw-section-tag" aria-hidden="true"><FigIcon name="section" size={12}/>{t(s.name)}</p>
              {s.frames.map(f => {
                switch (f.id) {
                  case 'cover': return frame('cover', <Cover go={go} phone={phone}/>, 'is-cover');
                  case 'question': return frame('question', <>
                    <Head level={2} id="research-title" title={L('Which file habits change what an agent builds?', '哪些文件习惯，会传到代码里？')}
                      lede={L('Designers now hand Figma files straight to coding agents. The advice is to clean up the file first: components, variables, layer names, auto layout. Nothing says which of those reaches the code.',
                        '现在，设计师会把 Figma 文件直接交给 coding agent。常听到的建议是先把文件整理干净：组件、variables、图层命名、auto layout。可没人说过，其中哪几项真的会影响 agent 写出的代码。')}/>
                    <ul className="rfaw-habits" aria-label={t(L('The four habits', '四种习惯'))} data-jay=".97,.2">
                      {HABITS.map(h => <li key={h.icon} data-agent={t(h.name)}><FigIcon name={h.icon} size={16}/><b>{t(h.name)}</b><span>{t(h.note)}</span></li>)}
                    </ul>
                    <p className="rfaw-caption"><Ev label="Sourced"/><span>{t(L('The list of habits is from Figma’s developer docs.', '这四种习惯出自 Figma 的开发者文档。'))}</span></p>
                  </>);
                  case 'compile': return frame('compile', <Compile reduced={motionOff} root={root} title={L('The agent reads the layers, then writes the page', 'agent 先读图层，再写页面')}
                    lede={L('Two fresh agents built the same pricing screen. Both files have the same layers, named like Frame 26; one also binds its colors to variables. Watch what each build calls the colors.',
                      '两个新开的 agent 做了同一个定价页。两份文件的图层一模一样，名字都是 Frame 26 这种；其中一份还把颜色绑到了 variables 上。看看两边各自怎么给这些颜色起名。')}/>, 'is-compile');
                  case 'finding': return frame('finding', <>
                    <Head title={L('Try the finding first', '先试试这个结论')} lede={L('A fresh agent built this pricing screen twice from the same picture: from the raw Figma file, and from the same file with its colors bound to variables. These are the pages it wrote.',
                      '一个新开的 agent 照着同一张画面，把这个定价页做了两次：一次读原始的 Figma 文件，一次读同一份文件，只是颜色绑了 variables。下面是它写出来的两个页面。')}/>
                    <div data-jay=".5,.04"><Deferred minHeight={720} label={t(L('Live demo of the two pages', '两个页面的实时演示'))}><TryFinding reduced={motionOff}/></Deferred></div>
                  </>, 'is-xl');
                  case 'method': return frame('method', <div className="rfaw-split">
                    <div><Head title={L('Six screens, four versions each', '六个界面，每个四个版本')}/>
                      <p className="rfaw-body" data-agent="Text">{t(L('Each screen exists fully systematized (L2), structured without variables (L1), raw (L0), and raw plus the same variable bindings as L2 (L0V). All four export to byte-identical images, so the agent always sees the same picture.',
                        '每个界面做了四个版本：完全系统化（L2）；有结构、没有 variables（L1）；原始（L0）；原始文件加上和 L2 一样的 variable 绑定（L0V）。四个版本导出的图片逐字节相同，所以 agent 看到的永远是同一张画面。'))}</p></div>
                    <div data-jay=".95,.05"><TestSet zoom/></div>
                  </div>, 'is-xl');
                  case 'structure': return frame('structure', <>
                    <Head title={L('Same picture, different structure', '画面一样，结构不同')} lede={L('In L2 the sign-in screen’s layers have names, auto layout, instances and variable bindings. In L0 they’re generic frames and text with nothing bound. Both export the same PNG.',
                      '在 L2 里，登录页的图层有名字、auto layout、组件实例和 variable 绑定。在 L0 里，只有通用的 frame 和文本，什么都没绑。两份导出的 PNG 一模一样。')}/>
                    <div data-jay=".5,.06"><Deferred minHeight={560} label={t(L('The sign-in screen’s layers in both files', '两个文件里登录页的图层'))}><LinkedLayers reduced={motionOff}/></Deferred></div>
                  </>, 'is-xl');
                  case 'pipeline': return frame('pipeline', <>
                    <Head title={L('One build, start to finish', '一次构建，从头到尾')} lede={L('A fresh Claude agent got each frame through Figma’s MCP tools with the same prompt; my harness rendered every result in headless Chrome and scored it. I wrote down five hypotheses before the first run.',
                      '每个 frame 都交给一个新开的 Claude agent，用 Figma 的 MCP 工具读取，提示词每次都一样。我的测试框架在 headless Chrome 里渲染每个结果，再打分。开跑之前，我先写下了五个假设。')}/>
                    <div className="rfaw-pipeline" data-jay=".96,.1"><Pipeline/></div>
                  </>);
                  case 'result-1': return frame('result-1', <div className="rfaw-split is-result">
                    <div><p className="rfaw-kicker">{t(L('Result 1, pre-registered', '结果 1，预先登记'))}</p>
                      <Head title={L('The layout survived the mess', '文件再乱，布局也没坏')}/>
                      <p className="rfaw-body" data-agent="Text">{t(L('My main hypothesis was that raw files without auto layout would break when resized. They didn’t: agents rebuilt the layout with flex and grid from the picture.',
                        '我的主要假设是：没有 auto layout 的原始文件，一缩放就会坏。结果没有坏：agent 照着画面，用 flex 和 grid 重建了布局。'))}</p></div>
                    <FlatResult reduced={motionOff} id="result-1"/>
                  </div>);
                  case 'result-2': return frame('result-2', <>
                    <div className="rfaw-split is-result is-top">
                      <div><p className="rfaw-kicker">{t(L('Result 2, the ablation', '结果 2：消融实验'))}</p><Head title={L('Only variables carried the system’s names', '只有 variables，带上了系统的名字')}/></div>
                      <p className="rfaw-body" data-agent="Text">{t(L('L0V is the raw file with variable bindings added and nothing else: no auto layout, no components, meaningless layer names. Every one of those builds followed the whole change. Without variables, agents invented their own names, and a change reached only the ones they happened to guess.',
                        'L0V 就是原始文件加上 variable 绑定，别的都没有：没有 auto layout，没有组件，图层名也毫无意义。这组构建每一次都完整跟上了改动。没有 variables，agent 就自己起名字，改动只能传到它碰巧猜对名字的那几处。'))}</p>
                    </div>
                    <div data-jay=".96,.08"><Deferred minHeight={460} label={t(L('Chart of every build', '每次构建的图表'))}><AblationChart reduced={motionOff}/></Deferred></div>
                  </>, 'is-xl');
                  case 'insight': return frame('insight', <div className="rfaw-insight">
                    <p className="rfaw-insight-text" data-agent="Text" data-jay=".98,.15">{t(L('Agents recovered the layout from the picture. They never recovered the design system’s names unless the file carried them as variables.',
                      'agent 能照着画面还原布局。可设计系统里的名字，文件不用 variables 带过去，它就从来还原不出来。'))}</p>
                    <Go to="/product/design-to-code" className="rfaw-link"><span>{t(L('Full research write-up', '完整研究报告（英文）'))}</span><FigIcon name="arrow-right"/></Go>
                  </div>, 'is-short');
                  case 'brief': return frame('brief', <>
                    <Head level={2} id="design-title" title={L('Say what the agent will miss, and fix it where it lives', '先说清会漏掉什么，再在原处把它修好')}
                      lede={L('Figma already has the parts: variables, a replace-with-variable fix in Check designs, Dev Mode, an MCP server. But that check sits in a panel you have to remember to open, only on Organization and Enterprise plans, and the agent never hears that values are raw.',
                        'Figma 其实零件都有了：variables、Check designs 里“替换为 variable”的修复、Dev Mode、MCP server。但这项检查在一个得记着去打开的面板里，只有 Organization 和 Enterprise 方案能用；agent 也从来不知道哪些是原始值。')}/>
                    <p className="rfaw-caption"><Ev label="Sourced"/><span>{t(L('Plan availability of Check designs: Figma help center.', '哪些方案能用 Check designs：见 Figma 帮助中心。'))}</span></p>
                  </>, 'is-short');
                  case 'principles': return frame('principles', <>
                    <Head title={L('Five principles, each one a test the design has to pass', '我定了五条原则，每条都是一道关')}/>
                    <Principles/>
                  </>, 'is-xl');
                  case 'directions': return frame('directions', <>
                    <Head title={L('Where should the check live?', '这个检查该放在哪里？')} lede={L('Three directions on the same Home frame and the same 12 unbound values.', '三个方向，都用同一个 Home frame、同样 12 个未绑定的值。')}/>
                    <Directions reduced={motionOff}/>
                  </>, 'is-xl');
                  case 'rounds': return frame('rounds', <BeforeAfter id="rfaw-compare" reduced={motionOff} frame="panel" ratio="1200 / 1420" size={[1200, 1420]} pairs={rounds}
                    label={t(L('Compare round 1 with round 2', '对比第一轮和第二轮'))} heading={t(L('Round 1 → Round 2', '第一轮 → 第二轮'))}
                    lede={t(L('Round 2 came out of a design review. Pick a state and drag across it to compare the two rounds.', '第二轮的改动来自一次设计评审。选一个状态，左右拖动，对比两轮。'))}>
                    <p className="v2-review-note"><span>{zh
                      ? <><b>借模型做了一次设计评审。</b>我让模型站在 Figma 设计负责人的角度评第一轮。它打的分是：工艺 7，交互 5，产品思维 6，还按轻重排了八项修改；第二轮全做了。这只是评审，不是找设计师做的测试。</>
                      : <><b>A model-assisted design review.</b> I asked a model to critique round 1 as a Figma design lead would. It scored craft 7, interaction 5 and product thinking 6, and ranked eight fixes; round 2 builds them. It’s a critique, not a test with designers.</>}</span></p>
                    <RoundChanges items={changes} title={t(L('What changed and why', '改了什么，为什么改'))}/>
                  </BeforeAfter>, 'is-xl');
                  case 'theme': return frame('theme', <ThemeMoment reduced={motionOff} id="theme"/>, 'is-xl');
                  case 'agent': return frame('agent', <>
                    <Head title={L('The other side of the handoff', '交付的另一端')} lede={L('The designer reads “3 unbound values.” The agent, reading the frame through Figma’s MCP server, gets the same three values, in the same roles, with the same names.',
                      '设计师看到的是“3 unbound values”。agent 通过 Figma 的 MCP server 读取这个 frame，拿到的是同样的三个值、同样的用途、同样的名字。')}/>
                    <AgentSide/>
                  </>, 'is-xl');
                  case 'try': return frame('try', <>
                    <LiveEditor tasks={TASKS} reduced={motionOff} head={<Head level={2} id="try-title" title={L('Try it yourself', '自己试试')} lede={L('The same prototype, life-size. Pick a task; the editor opens where it starts.', '还是这个原型，原尺寸。选一个任务，编辑器会停在任务开始的地方。')}/>}/>
                  </>, 'is-live');
                  case 'testing': return frame('testing', <Testing/>, 'is-xl');
                  case 'reflection': return frame('reflection', <Reflection/>, 'is-xl');
                  default: {
                    if (f.flow != null) {
                      const step = FLOW[f.flow];
                      return frame(f.id, <FlowStep step={step} i={f.flow} n={FLOW.length}/>, `is-flow${f.flow === FLOW.length - 1 ? ' is-flow-last' : ''}`);
                    }
                    return null;
                  }
                }
              })}
            </section>)}
          </div>
          {mode === 'canvas' && camera ? <Guard name="cursors"><Cursors camera={camera} root={root.current} active={active} arrived={arrived}/></Guard> : null}
          {mode === 'canvas' ? <div className="rfaw-ui rfaw-toolbar" role="toolbar" aria-label={t(L('Canvas', '画布'))}>
            <button type="button" className="rfaw-tool" aria-pressed={tool === 'move'} onClick={() => setTool('move')} title={t(L('Move (V)', '移动 (V)'))}><FigIcon name="move"/><span className="v2-sr">{t(L('Move', '移动'))}</span></button>
            <button type="button" className="rfaw-tool" aria-pressed={tool === 'hand'} onClick={() => setTool('hand')} title={t(L('Hand tool (H): drag to pan', '抓手工具 (H)：拖动画布'))}><FigIcon name="hand"/><span className="v2-sr">{t(L('Hand tool', '抓手工具'))}</span></button>
            <span className="rfaw-tool-sep" aria-hidden="true"/>
            <div className="rfaw-zoom">
              <button type="button" className="rfaw-zoom-btn" aria-haspopup="menu" aria-expanded={zoomMenu} onClick={() => setZoomMenu(v => !v)} title={t(L('Zoom', '缩放'))}>
                <span ref={zoomText}>100%</span><FigIcon name="chevron-down"/><span className="v2-sr">{t(L(' zoom options', ' 缩放选项'))}</span>
              </button>
              {zoomMenu ? <ZoomMenu camera={camera} onClose={() => setZoomMenu(false)}/> : null}
            </div>
            <button type="button" className={`rfaw-back${free ? ' is-on' : ''}`} onClick={() => camera?.backToStory()} tabIndex={free ? 0 : -1} aria-hidden={!free}>
              <FigIcon name="story"/>{t(BACK)}
            </button>
          </div> : null}
          {mode === 'canvas' ? <Panel tab={tab} setTab={setTab} active={active} go={go} minimized={minimized}/> : null}
          {mode === 'canvas' ? <p className="rfaw-hint" aria-hidden="true">{t(L('Scroll to follow the story. Drag the canvas, or ⌘/Ctrl + scroll, to look around.', '滚动，跟着故事往下走。拖动画布，或按住 ⌘/Ctrl 滚动，可以随便看看。'))}</p> : null}
        </div>
      </div>

      <div className="rfaw-after">
        <NextProject item={next} visual={next.slug === 'atelier' ? <AtelierTileArt/> : null} image={next.thumb}/>
        <ProductFooter/>
      </div>
      {zoom ? <Guard name="figure viewer"><Suspense fallback={null}><LightboxViewer {...zoom} reduced={reduced} onClose={() => setZoom(null)}/></Suspense></Guard> : null}
      </WalkthroughProvider>
    </article>
  </WorldCtx.Provider>;
}

const BACK = L('Back to the story', '回到主线');

function Cover({go, phone}) {
  const {t} = useCaseLang();
  const chips = [L('Solo: study, analysis, design and prototype', '独立完成：研究、分析、设计与原型'), L('October 2026', '2026 年 10 月'), L('Desktop, Figma UI3', '桌面端，Figma UI3'), UI.concept('Figma')];
  return <div className="rfaw-cover">
    <div className="rfaw-cover-top">
      <Go to="/product" className="rfaw-back-link"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
      <p className="rfaw-kind" data-agent="Text">{t(L('Research, then product design', '先研究，再做产品设计'))}</p>
      <h1 className="rfaw-title" data-agent="Title" data-jay=".99,.25"><span lang="en">Ready for agents</span></h1>
    </div>
    <div className="rfaw-cover-copy">
      <p className="rfaw-outcome" data-agent="Text">{t(L('Coding agents rebuild a Figma frame’s layout from the picture but invent their own names for its design tokens. I measured that across 37 builds, then designed a lens on Figma’s Check designs that binds what you choose in one undo and tells the agent the rest.',
        'Coding agent 能照着画面还原 Figma frame 的布局，设计 token 的名字却会自己编。我用 37 次构建测出了这一点，再在 Figma 的 Check designs 里设计了一个视图：你选中的值一次绑定，一步就能撤销；剩下的告诉 agent。'))}</p>
      <ul className="rfaw-chips" aria-label={t(L('Project facts', '项目信息'))}>
        {chips.map(c => <li key={c.en}>{t(c)}</li>)}
      </ul>
      <div className="rfaw-actions">
        {phone ? null : <a className="rfaw-btn is-primary" href="#rfa-try" onClick={e => go('try', e)}><FigIcon name="play"/>{t(L('Try the prototype', '试用原型'))}</a>}
        <WatchButton className={`rfaw-btn${phone ? ' is-primary' : ''}`} icon={<FigIcon name="video"/>}/>
        <a className="rfaw-btn" href="#rfa-question" onClick={e => go('question', e)}><FigIcon name="arrow-down"/>{t(L('Start with the research', '从研究开始看'))}</a>
      </div>
    </div>
    <figure className="rfaw-cover-shot">
      <img src={rfaShot('review')} width="1800" height="1125" alt={t(L('The prototype: a Figma-style editor with the Home frame of a print shop app, a Variables row in the properties panel, and Check designs listing 12 unbound values',
        '原型：一个 Figma 风格的编辑器，画布上是一个印品商店 app 的 Home frame，属性面板里有一行 Variables，Check designs 列出了 12 个未绑定的值'))} decoding="async" fetchPriority="high"/>
      <figcaption><span className="rfaw-status">{t(L('Testing next', '即将测试'))}</span>{t(L('Round 2 of the prototype: Check designs with the Variables for agents lens.', '原型第二轮：Check designs 里的 Variables for agents 视图。'))}</figcaption>
    </figure>
    <dl className="rfaw-numbers" aria-label={t(L('The study in numbers', '研究里的几个数字'))}>
      {NUMBERS.map(n => <div key={n.value} data-agent={t(L('Number', '数字'))}>
        <dt>{t(n.label)}</dt>
        <dd><b>{n.value}</b>{n.unit ? <span>{t(n.unit)}</span> : null}</dd>
        <dd className="rfaw-number-note">{t(n.note)}</dd>
      </div>)}
    </dl>
  </div>;
}

function FlowStep({step, i, n}) {
  const {t, zh} = useCaseLang();
  return <div className="rfaw-flow">
    {i === 0 ? <div className="rfaw-flow-intro">
      <h2 className="rfaw-h2 is-flow" data-agent="Text">{t(L('From unbound to applied, in seven states', '从“未绑定”到“已应用”'))}</h2>
      <p className="rfaw-lede">{t(L('Each frame shows the real prototype, cropped to the part a step is about. Scroll on to move along the flow.', '一共七个状态。每个 frame 里都是真实原型，只裁出和这一步有关的部分。继续滚动，顺着流程往下走。'))}</p>
    </div> : null}
    <div className="rfaw-flow-shot" data-jay=".96,.08"><Crop step={step} alt={t(step.alt)}/></div>
    <p className="rfaw-kicker">{zh ? `第 ${i + 1} 步，共 ${n} 步` : `Step ${i + 1} of ${n}`}</p>
    <h3 className="rfaw-h3" data-agent="Text">{t(step.title)}</h3>
    <p className="rfaw-body" data-agent="Text">{t(step.body)}</p>
    {i < n - 1 ? <svg className="rfaw-noodle" viewBox="0 0 200 16" aria-hidden="true"><circle cx="5" cy="8" r="4"/><path d="M9 8h178"/><path d="m183 3 7 5-7 5"/></svg> : null}
  </div>;
}

const PLAN = [
  L('Five designers or design students who use Figma weekly, ideally two who have handed a file to an agent.', '找五位每周都用 Figma 的设计师或设计学生，最好其中两位把文件交给过 agent。'),
  L('Twenty minutes each, thinking aloud, on this prototype.', '每人 20 分钟，用这个原型，边做边把想法说出来。'),
  L('Tasks: is this frame ready, and what would the agent miss; fix what you can; make the call on #FFFFFF; what happens to values that match nothing; what do you expect the agent to do now.',
    '任务：这个 frame 准备好了吗，agent 会漏掉什么；能修的先修好；决定 #FFFFFF 怎么处理；对不上任何 variable 的值会怎样；你觉得 agent 接下来会做什么。'),
  L('Measures: task success, time on task, a 1–7 ease rating per task, quotes, and where people hesitate.', '记录：任务完成率、用时、每项任务的易用性打分（1–7）、原话，以及大家在哪里停下来犹豫。'),
  L('Anything that blocks two of five people gets redesigned before this case is final, and the page will show the before and after.', '五个人里只要有两个卡在同一处，定稿前就重做那一处，页面上也会放出改前和改后。'),
];
const HYPOTHESES = [
  L('A row in the properties panel gets noticed at selection time (direction A’s weak spot).', '选中 frame 时，大家会注意到属性面板里的那一行（这正是方向 A 的弱点）。'),
  L('Designers act on counts faster than on a score.', '比起分数，设计师看到数量时会更快动手。'),
  L('Designers expect the agent to ask about the colors left raw.', '设计师会预期 agent 主动来问那些还是原始值的颜色。'),
];
const RESULTS = [
  L('Said what the agent would miss', '说出了 agent 会漏掉什么'),
  L('Bound the exact matches unaided', '没靠提示，自己绑好了精确匹配的值'),
  L('Made the #FFFFFF call with confidence', '有把握地定下了 #FFFFFF'),
  L('Expected the agent to ask', '预期 agent 会主动来问'),
];

function Testing() {
  const {t, zh} = useCaseLang();
  return <div className="rfaw-testing">
    <Head level={2} id="testing-title" title={L('Five sessions decide what stays', '五场测试决定去留')} lede={L('Nothing in the design chapter has been tested with designers yet. This is the plan, and the space the results will fill.', '设计这部分还没找设计师测过。下面是测试计划，结果的位置也留好了。')}/>
    <div className="rfaw-testing-grid">
      <div>
        <h3 className="rfaw-h4">{t(L('Plan', '计划'))}</h3>
        <ul className="rfaw-list">{PLAN.map(p => <li key={p.en} data-agent="Text">{t(p)}</li>)}</ul>
        <h3 className="rfaw-h4">{t(L('Hypotheses to check', '待验证的假设'))}</h3>
        <ul className="rfaw-hyps">{HYPOTHESES.map(h => <li key={h.en}><Ev label="Hypothesis"/><span>{t(h)}</span></li>)}</ul>
      </div>
      <div className="rfaw-results" aria-label={t(L('Results, not collected yet', '结果（还没收集）'))} data-jay=".95,.06">
        <p className="rfaw-slot"><FigIcon name="frame" size={12}/>{t(L('Placeholder: results after the sessions', '占位：测完再填'))}</p>
        <dl>{RESULTS.map(r => <div key={r.en}><dt>{t(r)}</dt><dd>{zh ? '— / 5' : '— of 5'}</dd></div>)}</dl>
        <p className="rfaw-results-note">{t(L('Each result will sit next to the change it caused.', '每条结果都会放在它带来的改动旁边。'))}</p>
      </div>
    </div>
  </div>;
}

function Reflection() {
  const {t} = useCaseLang();
  return <div className="rfaw-reflection">
    <Head level={2} id="rfaw-reflection" title={L('Reflection', '复盘')}/>
    <div className="rfaw-reflection-grid">
      <div data-agent="Text"><h3 className="rfaw-h4">{t(L('What I’d keep', '我会保留的'))}</h3><p className="rfaw-body">{t(L('Counting what the agent will miss instead of grading the file. The study supports one strong finding, about variables, and the design says exactly that and nothing more.',
        '数清 agent 会漏掉什么，不给文件打分。这项研究只撑得起一个明确的结论，关于 variables；设计也只说这一点，不多说。'))}</p></div>
      <div data-agent="Text"><h3 className="rfaw-h4">{t(L('What I don’t know yet', '我还不知道的'))}</h3><p className="rfaw-body">{t(L('Whether a row in a dense panel gets noticed, and whether the finding holds beyond 37 builds from one model family and one small design system.',
        '面板那么密，这一行会不会有人注意到。还有，这个结论只来自 37 次构建、一个模型家族、一个小设计系统；出了这个范围，还成不成立。'))}</p></div>
      <div data-agent="Text" data-jay=".96,.1"><h3 className="rfaw-h4">{t(L('What’s next', '下一步'))}</h3><p className="rfaw-body">{t(L('The five sessions, then a second model family and a Code Connect condition on the research side. I expected auto layout to matter most; pre-registering kept me honest when it didn’t.',
        '先做五场测试；研究这边再加一个模型家族和一个 Code Connect 条件。我原本以为 auto layout 最关键，结果不是；幸好假设是提前登记的，我没法事后改口。'))}</p></div>
    </div>
  </div>;
}


/** The left side of the editor: the 2026 navigation bar (File, Agents) and the sidebar. In File, the Layers list is
    the table of contents: one row per frame, the current one selected; a row flies the camera there. */
function Panel({tab, setTab, active, go, minimized}) {
  const {t} = useCaseLang();
  const list = useRef(null);
  // keep the current frame's row in view inside the list (never by scrolling the page)
  useEffect(() => {
    const box = list.current, row = box?.querySelector('.is-selected');
    if (!box || !row) return;
    const top = row.offsetTop - box.offsetTop, h = row.offsetHeight;
    if (top < box.scrollTop + 32) box.scrollTop = Math.max(0, top - 64);
    else if (top + h > box.scrollTop + box.clientHeight - 32) box.scrollTop = top + h - box.clientHeight + 64;
  }, [active, tab]);
  const tabs = [{id: 'file', label: L('File', '文件'), icon: 'file'}, {id: 'agents', label: L('Agents', 'Agents'), icon: 'agent'}];
  const onKey = e => {
    const step = {ArrowDown: 1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const i = (tabs.findIndex(x => x.id === tab) + step + tabs.length) % tabs.length;
    setTab(tabs[i].id);
    e.currentTarget.querySelectorAll('[role=tab]')[i]?.focus();
  };
  return <aside className={`rfaw-ui rfaw-panel${minimized ? ' is-hidden' : ''}`} aria-label={t(L('File', '文件'))} inert={minimized ? true : undefined}>
    <div className="rfaw-rail" role="tablist" aria-orientation="vertical" aria-label={t(L('Navigation bar', '导航栏'))} onKeyDown={onKey}>
      {tabs.map(x => <button key={x.id} type="button" role="tab" id={`rfaw-tab-${x.id}`} aria-selected={tab === x.id} aria-controls="rfaw-side" tabIndex={tab === x.id ? 0 : -1}
        onClick={() => setTab(x.id)}><FigIcon name={x.icon}/><span>{t(x.label)}</span></button>)}
    </div>
    <div id="rfaw-side" className="rfaw-side" role="tabpanel" aria-labelledby={`rfaw-tab-${tab}`}>
      <header className="rfaw-side-head">
        <p className="rfaw-file-name" lang="en">Ready for agents</p>
        <p className="rfaw-file-meta">{t(L('Jay Lin, case study', 'Jay Lin 的案例'))}</p>
        <div className="rfaw-people" aria-label={t(L('On this file: Jay and the Agent', '在这个文件里的：Jay 和 Agent'))}><span className="is-jay">J</span><span className="is-agent"><FigIcon name="agent" size={12}/></span></div>
      </header>
      {tab === 'file' ? <nav ref={list} className="rfaw-layers" aria-label={t(L('Frames', 'Frame 列表'))}>
        <p className="rfaw-side-title">{t(L('Layers', '图层'))}</p>
        <ol>
          {SECTIONS.map(s => <li key={s.id} className="rfaw-layer-section">
            <p className="rfaw-layer-row is-section"><FigIcon name="section"/><span>{t(s.name)}</span></p>
            <ol>
              {s.frames.map(f => {
                const i = indexOf(f.id);
                return <li key={f.id}>
                  <a href={`#rfa-${f.id}`} className={`rfaw-layer-row${i === active ? ' is-selected' : ''}`} aria-current={i === active ? 'location' : undefined}
                    onClick={e => go(f.id, e)}><FigIcon name="frame"/><span>{t(f.name)}</span>{i === active ? <i className="rfaw-layer-here" aria-hidden="true"/> : null}</a>
                </li>;
              })}
            </ol>
          </li>)}
        </ol>
      </nav> : <div className="rfaw-agents">
        <p className="rfaw-side-title">Agents</p>
        <div className="rfaw-chat">
          <p className="rfaw-chat-who"><FigIcon name="agent" size={12}/>{t(L('Agent, on the Home frame', 'Agent，在 Home frame 上'))}</p>
          <p className="rfaw-chat-msg">{t(AGENT_NOTE)}</p>
          <button type="button" className="rfaw-btn is-small" onClick={e => go('agent', e)}>{t(L('See the agent’s side', '看看 agent 那一端'))}</button>
        </div>
      </div>}
      <p className="rfaw-legal">{t(UI.independent('Figma'))}</p>
    </div>
  </aside>;
}

function ZoomMenu({camera, onClose}) {
  const {t} = useCaseLang();
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const out = e => { if (!ref.current?.parentElement?.contains(e.target)) onClose(); };
    const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc, true); };
  }, [onClose]);
  const act = fn => () => { fn(); onClose(); };
  const onKey = e => {
    const items = [...ref.current.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    const step = {ArrowDown: 1, ArrowUp: -1}[e.key];
    if (step) { e.preventDefault(); items[(i + step + items.length) % items.length]?.focus(); }
  };
  return <div ref={ref} className="rfaw-menu" role="menu" aria-label={t(L('Zoom', '缩放'))} onKeyDown={onKey}>
    <button type="button" role="menuitem" onClick={act(() => camera?.zoomBy(2))}><span>{t(UI.zoomIn)}</span></button>
    <button type="button" role="menuitem" onClick={act(() => camera?.zoomBy(.5))}><span>{t(UI.zoomOut)}</span></button>
    <button type="button" role="menuitem" onClick={act(() => camera?.zoomToFit())}><span>{t(L('Zoom to fit', '缩放到合适大小'))}</span><kbd>⇧1</kbd></button>
    <button type="button" role="menuitem" onClick={act(() => camera?.zoomTo100())}><span>{t(L('Zoom to 100%', '缩放到 100%'))}</span><kbd>⇧0</kbd></button>
    <span className="rfaw-menu-sep" role="separator"/>
    <button type="button" role="menuitem" onClick={act(() => camera?.backToStory())}><span>{t(BACK)}</span><kbd>Esc</kbd></button>
  </div>;
}
