import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {scrollerOf} from '../../v2/motion';
import {offsetWithin} from './camera';
import {useWorld} from './context';
import {indexOf} from './data';
import {FigIcon} from './icons';

/* The compile, scrubbed by the scroll. Two fresh agents built the pricing screen (S2) from two files with the same 142
   layers and the same meaningless names: one raw (L0), one with its colors bound to variables (L0V). As you scroll,
   layers fly out of the layer list into the two index.html files the agents wrote. Structure lands the same in both.
   Colors leave L0V as variables and keep their color; from L0 they leave as hex, lose the name on the way, and land
   under a name the agent made up (or happened to guess). Scrolling back takes them back.
   Canvas: progress is the camera's place inside this frame's (held) read segment. Stack: the module's place in the
   viewport. Plain and reduced motion: the finished files.
   Sources: layer names, boxes and bindings from the benchmark file through Figma's MCP server (get_metadata on
   S2-L0V 14:600 and S2-L0 10:2232, get_variable_defs), 19 Oct 2026. Code lines and line numbers quoted from
   public/proto/benchmark/S2-L0V-r1 and S2-L0-r1 (the agents' files, unchanged). */

const LAYERS = [
  {id: 'root', name: 'S2-L0V', depth: 0, icon: 'frame', box: [0, 0, 1440, 960]},
  {id: 'f19', name: 'Frame 19', depth: 1, icon: 'frame', box: [0, 0, 1440, 79]},
  {id: 'f26', name: 'Frame 26', depth: 1, icon: 'frame', box: [0, 79, 1440, 881]},
  {id: 'f27', name: 'Frame 27', depth: 2, icon: 'frame', box: [368, 111, 704, 214]},
  {id: 'text', name: 'Text', depth: 3, icon: 'text', box: [368, 179, 704, 48]},
  {id: 'f31', name: 'Frame 31', depth: 2, icon: 'frame', box: [132, 357, 1176, 523]},
  {id: 'f32', name: 'Frame 32', depth: 3, icon: 'frame', box: [132, 357, 376, 523]},
  {id: 'f50', name: 'Frame 50', depth: 3, icon: 'frame', box: [532, 357, 376, 523]},
];

const css = (n, sel, slot, group) => ({n, code: [['sel', sel], ['p', ' {']], group, slot});
const decl = (n, prop, pre, slot) => ({n, code: [['ws', '  '], ['prop', prop], ['p', ': '], ...pre], slot, end: ';'});
const tag = (n, ind, name, cls, more = '>') => ({n, code: [['ws', ind], ['p', '<'], ['tag', name], ['attr', ' class'], ['p', '='], ['str', `"${cls}"`], ['p', more]]});
const FILES = {
  L0V: [
    css(60, 'body', null, 'c0'), decl(65, 'background', [], 'c0'), decl(66, 'color', [], 'c1'), {fold: true},
    css(283, '.plan', null, 'c3'), decl(289, 'border', [['num', '1px'], ['p', ' solid ']], 'c3'),
    css(293, '.plan--featured', null, 'c2'), decl(294, 'border', [['num', '2px'], ['p', ' solid ']], 'c2'), {fold: true},
    {...tag(475, '', 'header', 'site-header'), slot: 'h0'}, {...tag(500, '    ', 'h1', 'pricing__title', ' …>'), slot: 'h1'},
    {...tag(509, '  ', 'div', 'plans'), slot: 'h2'}, {...tag(542, '    ', 'article', 'plan plan--featured', ' …>'), slot: 'h3'},
  ],
  L0: [
    css(42, 'body', null, 'c0'), decl(44, 'background', [], 'c0'), decl(45, 'color', [], 'c1'), {fold: true},
    css(230, '.plan', null, 'c3'), decl(235, 'border', [['num', '1px'], ['p', ' solid ']], 'c3'),
    css(240, '.plan--featured', null, 'c2'), decl(241, 'border', [['num', '2px'], ['p', ' solid ']], 'c2'), {fold: true},
    {...tag(364, '', 'header', 'site-header'), slot: 'h0'}, {...tag(390, '    ', 'h1', 'pricing__title', ' …>'), slot: 'h1'},
    {...tag(399, '  ', 'div', 'plans'), slot: 'h2'}, {...tag(430, '    ', 'article', 'plan plan--featured', ' …>'), slot: 'h3'},
  ],
};

// The flights, in order, each with its window on the 0..1 progress. Structure first, then the four colors.
const STEPS = [
  {layer: 'f19', slot: 'h0', label: 'Frame 19', at: [.03, .17]},
  {layer: 'text', slot: 'h1', label: 'Text', at: [.09, .23]},
  {layer: 'f31', slot: 'h2', label: 'Frame 31', at: [.15, .29]},
  {layer: 'f50', slot: 'h3', label: 'Frame 50', at: [.21, .35]},
  {layer: 'root', slot: 'c0', color: '#f6f7f9', variable: 'color/background', bound: '--color-background', raw: '--color-bg', fate: 'invented', at: [.37, .53]},
  {layer: 'text', slot: 'c1', color: '#101828', variable: 'color/text-primary', bound: '--color-text-primary', raw: '--color-text', fate: 'invented', at: [.49, .65]},
  {layer: 'f50', slot: 'c2', color: '#4f46e5', variable: 'color/primary', bound: '--color-primary', raw: '--color-primary', fate: 'guessed', at: [.61, .77]},
  {layer: 'f32', slot: 'c3', color: '#e4e7ec', variable: 'color/border', bound: '--color-border', raw: '--color-border', fate: 'guessed', at: [.73, .89]},
];
const ALL = new Set(STEPS.map(s => s.slot));
const hexOf = c => c.slice(1).toUpperCase();
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function Code({parts}) {
  return parts.map(([k, t], i) => <span key={i} className={`cp-${k}`}>{t}</span>);
}

function Value({step, file}) {
  const bound = file === 'L0V';
  const keeps = bound || step.fate === 'guessed';
  return <span className={`cp-val${bound ? ' is-bound' : ` is-${step.fate}`}`}>
    <span className="cp-p">var(</span>
    <span className="cp-swatch" style={{'--c': keeps ? step.color : '#b3b3b3'}} aria-hidden="true"/>
    <span className="cp-name">{bound ? step.bound : step.raw}</span><span className="cp-p">)</span>
  </span>;
}

function Pane({file, title, landed, tally}) {
  return <figure className={`cp-pane is-${file}`} aria-label={title}>
    <figcaption className="cp-pane-head">
      <span className="cp-file"><FigIcon name="code"/>index.html</span>
      <span className="cp-pane-title">{title}</span>
    </figcaption>
    <pre className="cp-code"><code>
      {FILES[file].map((line, i) => {
        if (line.fold) return <span key={i} className="cp-line is-fold" aria-hidden="true"><span className="cp-n"/><span className="cp-fold">⋯</span></span>;
        const key = line.slot || line.group;
        const step = STEPS.find(s => s.slot === key);
        const on = landed.has(key);
        const isValue = step?.color && line.slot && !line.group;
        return <span key={i} className={`cp-line${on ? ' is-on' : ''}`} data-slot={line.slot && !line.group ? `${file}-${line.slot}` : undefined}>
          <span className="cp-n">{line.n}</span>
          <span className="cp-text"><Code parts={line.code}/>{isValue ? (on ? <Value step={step} file={file}/> : <span className="cp-hole"/>) : null}{line.end && on ? <span className="cp-p">{line.end}</span> : null}
            {isValue && on && file === 'L0' ? <span className={`cp-fate is-${step.fate}`}>{step.fate === 'invented' ? 'made up' : 'guessed'}</span> : null}</span>
        </span>;
      })}
    </code></pre>
    <p className="cp-tally" aria-live="polite">{tally}</p>
  </figure>;
}

export default function Compile({reduced = false, root, title, lede}) {
  const {mode, camera} = useWorld();
  const finished = reduced || mode === 'plain';
  const host = useRef(null), chips = useRef(null), geo = useRef(null);
  const [landed, setLanded] = useState(() => (finished ? ALL : new Set()));
  const [reading, setReading] = useState(null);
  const last = useRef({key: '', reading: null});

  // the chips: two per step, one per file, built once
  useLayoutEffect(() => {
    const layer = chips.current;
    if (!layer || finished) return undefined;
    layer.innerHTML = '';
    STEPS.forEach((step, si) => ['L0V', 'L0'].forEach(file => {
      const chip = document.createElement('span');
      const bound = file === 'L0V';
      chip.className = `cp-chip${step.color ? (bound ? ' is-var' : ` is-hex is-${step.fate}`) : ' is-layer'}`;
      chip.dataset.k = `${si}-${file}`;
      chip.innerHTML = step.color
        ? (bound ? `<i class="cp-chip-sw" style="--c:${step.color}"></i><b class="cp-chip-a">${step.variable}</b>`
          : `<i class="cp-chip-sw" style="--c:${step.color}"></i><b class="cp-chip-a">${hexOf(step.color)}</b><b class="cp-chip-b">${step.raw}</b>`)
        : `<b class="cp-chip-a">${step.label}</b>`;
      layer.append(chip);
    }));
    return () => { layer.innerHTML = ''; };
  }, [finished]);

  // where each chip starts (its layer row) and lands (its line), in the module's own pixels
  useLayoutEffect(() => {
    const node = host.current;
    if (!node || finished) return undefined;
    const measure = () => {
      geo.current = STEPS.map(step => ['L0V', 'L0'].map((file, k) => {
        const row = node.querySelector(`[data-layer="${step.layer}"]`), line = node.querySelector(`[data-slot="${file}-${step.slot}"]`);
        if (!row || !line) return null;
        const a = offsetWithin(row, node), b = offsetWithin(line, node);
        const text = line.querySelector('.cp-text');
        let x = b.x + (text?.offsetLeft || 40);
        if (step.color && text) for (const c of text.children) { if (c.classList.contains('cp-hole') || c.classList.contains('cp-val')) break; x += c.offsetWidth; }
        const from = {x: a.x + row.offsetWidth - 74, y: a.y + 2}, to = {x, y: b.y - 1};
        return {from, to, ctrl: {x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 70 - k * 22}};
      }));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(node);
    return () => ro.disconnect();
  }, [finished]);

  // progress -> chips, landed lines, the layer being read
  useEffect(() => {
    const node = host.current, layer = chips.current;
    if (!node || finished) return undefined;
    const apply = P => {
      const g = geo.current;
      const now = new Set();
      let read = null;
      STEPS.forEach((step, si) => {
        const t = clamp01((P - step.at[0]) / (step.at[1] - step.at[0]));
        if (t >= 1) now.add(step.slot);
        if (t > 0 && t < 1) read = step.layer;
        ['L0V', 'L0'].forEach((file, k) => {
          const chip = layer.querySelector(`[data-k="${si}-${file}"]`);
          const path = g?.[si]?.[k];
          if (!chip || !path) return;
          const show = t > 0 && t < 1;
          chip.style.opacity = show ? String(Math.min(1, t * 12, (1 - t) * 14)) : '0';
          if (!show) return;
          const u = ease(t), v = 1 - u;
          const x = v * v * path.from.x + 2 * v * u * path.ctrl.x + u * u * path.to.x;
          const y = v * v * path.from.y + 2 * v * u * path.ctrl.y + u * u * path.to.y;
          chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          if (step.color && file === 'L0') {
            // the raw value loses its name on the way: hex out, a made-up (or guessed) name in, and the color drains
            const out = smooth(.3, .46, t), inn = smooth(.5, .66, t);
            const a = chip.querySelector('.cp-chip-a'), b = chip.querySelector('.cp-chip-b'), sw = chip.querySelector('.cp-chip-sw');
            a.style.opacity = String(1 - out); a.style.filter = `blur(${(out * 3).toFixed(2)}px)`;
            b.style.opacity = String(inn); b.style.filter = `blur(${((1 - inn) * 3).toFixed(2)}px)`;
            if (step.fate === 'invented') sw.style.setProperty('--c', `color-mix(in srgb, ${step.color} ${Math.round((1 - smooth(.4, .7, t)) * 100)}%, #b3b3b3)`);
          }
        });
      });
      const key = [...now].join();
      if (key !== last.current.key) { last.current.key = key; setLanded(now); }
      if (read !== last.current.reading) {
        last.current.reading = read;
        setReading(read);
        const r = root?.current;
        if (r && mode === 'canvas') {
          if (read) r.dispatchEvent(new CustomEvent('rfaw:agent', {detail: {el: node.querySelector(`[data-layer="${read}"]`)}}));
          else r.dispatchEvent(new CustomEvent('rfaw:agent-release'));
        }
      }
    };

    if (mode === 'canvas' && camera) {
      const i = indexOf('compile');
      return camera.subscribe(() => {
        const seg = camera.readStart(i);
        if (!seg) return;
        apply(seg.len ? (camera.p - seg.start) / seg.len : 1);
      });
    }
    // stack: the module's travel through the viewport
    const scroller = scrollerOf(node);
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = node.getBoundingClientRect(), vh = innerHeight;
      apply((vh * .72 - r.top) / Math.max(1, r.height - vh * .2));
    };
    const on = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    scroller.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { scroller.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(frame); };
  }, [finished, mode, camera, root]);

  useEffect(() => { if (finished) { setLanded(ALL); setReading(null); } }, [finished]);

  const box = reading ? LAYERS.find(l => l.id === reading)?.box : null;
  const colorsIn = STEPS.filter(s => s.color && landed.has(s.slot));
  const guessed = colorsIn.filter(s => s.fate === 'guessed').length;
  const tallyV = colorsIn.length ? `${colorsIn.length} of ${colorsIn.length} colors keep the file’s names` : 'Waiting for colors';
  const made = colorsIn.length - guessed;
  const tally0 = colorsIn.length ? `Of ${colorsIn.length}: ${made} name${made === 1 ? '' : 's'} made up${guessed ? `, ${guessed} guessed right` : ''}` : 'Waiting for colors';

  return <div ref={host} className={`cp${finished ? ' is-finished' : ''}`}>
    <header className="rfaw-head cp-head">
      <h3 className="rfaw-h3" data-agent="Text">{title}</h3>
      <p className="rfaw-lede" data-agent="Text">{lede}</p>
    </header>
    <div className="cp-shot" data-jay=".96,.1">
      <img src="/assets/product/test-set-s2.webp" width="800" height="433" alt="The pricing screen both agents saw, identical for both files" loading="lazy" decoding="async"/>
      <svg viewBox="0 0 1440 779" aria-hidden="true">{box ? <rect key={reading} x={box[0] + 3} y={box[1] + 3} width={box[2] - 6} height={Math.min(box[3], 776 - box[1]) - 3}/> : null}</svg>
      <p className="cp-shot-note">The picture both agents saw</p>
    </div>
    <section className="cp-layers" aria-label="The pricing screen's layers, the same in both files">
      <header><span>Layers</span><span className="cp-page">S2, pricing</span></header>
      <ol>
        {LAYERS.map(l => <li key={l.id} data-layer={l.id} data-agent={l.name} style={{'--depth': l.depth}} className={reading === l.id ? 'is-read' : ''}>
          <FigIcon name={l.icon}/><span>{l.name}</span>
        </li>)}
      </ol>
      <p className="cp-same">Same 142 layers and names in both files. Only L0V binds its colors.</p>
    </section>
    <Pane file="L0V" title="from the file with variables (L0V)" landed={landed} tally={tallyV}/>
    <Pane file="L0" title="from the raw file (L0)" landed={landed} tally={tally0}/>
    <p className="cp-legend" aria-hidden="true">
      <span className="cp-chip is-var is-static"><i className="cp-chip-sw" style={{'--c': '#4f46e5'}}/><b className="cp-chip-a">color/primary</b></span><span>a bound variable</span>
      <span className="cp-chip is-hex is-static"><i className="cp-chip-sw" style={{'--c': '#4f46e5'}}/><b className="cp-chip-a">4F46E5</b></span><span>a raw value</span>
      {finished ? null : <span className="cp-scroll">Scroll to compile; scroll back to undo it.</span>}
    </p>
    <p className="v2-sr">In the build from the file with variables, all four colors use the file’s names: --color-background, --color-text-primary, --color-primary and --color-border. In the build from the raw file, the agent made up --color-bg and --color-text, and happened to guess --color-primary and --color-border.</p>
    <div ref={chips} className="cp-chips" aria-hidden="true"/>
    <p className="rfaw-caption cp-caption"><Ev label="Measured"/><span>Lines and line numbers quoted from the two agents’ files, S2-L0V-r1 and S2-L0-r1. Layer names, boxes and bindings read from the benchmark file with Figma’s MCP server.</span></p>
  </div>;
}
