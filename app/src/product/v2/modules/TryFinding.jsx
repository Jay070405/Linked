import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Browser} from '../Device';
import {Ask, Takeaway, useInputMode} from '../Try';
import './finding.css';

/* D1, "Try the finding": the two real pages from the benchmark, side by side. Picking a color injects the same :root
   overrides the benchmark's theme test used (p2-benchmark/harness/lib/coherence.js, themeCSS) into both. The page
   built from variables follows all four; the one built from the raw file follows only the names its agent happened to
   pick. What each page calls its colors is read live from its own stylesheet. */

const RUNS = [
  {id: 'S2-L0-r1', level: 'L0', name: 'Raw file', address: 'Built from the raw file (L0)'},
  {id: 'S2-L0V-r1', level: 'L0V', name: 'Raw file + variables', address: 'Built from the same file with variables (L0V)'},
];
const W = 1440, H = 960;
// The design system's four colors under test, with their values (p2-benchmark/reference/tokens.json).
const TOKENS = [
  {css: '--color-primary', label: 'Primary', value: '#4f46e5'},
  {css: '--color-text-primary', label: 'Text', value: '#101828'},
  {css: '--color-background', label: 'Background', value: '#f6f7f9'},
  {css: '--color-border', label: 'Border', value: '#e4e7ec'},
];
const theme = (primary, text, background, border) => ({'--color-primary': primary, '--color-text-primary': text, '--color-background': background, '--color-border': border});
const SWATCHES = [
  {id: 'test', name: 'Test colors', colors: theme('#FF00FF', '#00A000', '#FFF4CC', '#00B4FF'), note: 'The benchmark’s own theme test'},
  {id: 'forest', name: 'Forest', colors: theme('#1E7B4F', '#10301F', '#EAF3EC', '#A9CDB5')},
  {id: 'ember', name: 'Ember', colors: theme('#D9480F', '#3D1708', '#FFF1E8', '#F4B999')},
  {id: 'ocean', name: 'Ocean', colors: theme('#0A66C2', '#0B2545', '#E9F2FB', '#9DC1E8')},
  {id: 'plum', name: 'Plum', colors: theme('#8E2C8A', '#33102F', '#F7ECF6', '#D9A8D4')},
];

const hex = n => n.toString(16).padStart(2, '0');
const mix = (a, b, t) => {
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => hex(Math.round(v + (y[i] - v) * t))).join('');
};
/** A custom brand color becomes a whole theme: the color as primary, a near-black of it for text, tints for the page
    and its borders. */
const custom = c => theme(c, mix(c, '#000000', .78), mix(c, '#ffffff', .92), mix(c, '#ffffff', .6));

/** The benchmark's injected stylesheet, verbatim in form (coherence.js themeCSS). */
const themeCSS = colors => `:root {\n${Object.entries(colors).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')}\n}`;

/** Custom properties a page defines on :root, read from its own stylesheets. */
function rootVars(doc) {
  const out = {};
  for (const sheet of doc.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }   // cross-origin (the font stylesheet)
    for (const rule of rules) {
      if (rule.selectorText !== ':root') continue;
      for (const prop of rule.style) if (prop.startsWith('--')) out[prop] = rule.style.getPropertyValue(prop).trim().toLowerCase();
    }
  }
  return out;
}
/** For each design-system color: does the page use its name, and if not, what did the agent call it? */
function readNames(doc) {
  const vars = rootVars(doc);
  return TOKENS.map(t => vars[t.css] ? {ok: true} : {ok: false, as: Object.keys(vars).find(k => vars[k] === t.value) || null});
}

function Page({run, colors, onNames, scale}) {
  const frame = useRef(null);
  const apply = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head) return;
    let style = doc.getElementById('theme-test');
    if (!colors) { style?.remove(); return; }
    if (!style) { style = doc.createElement('style'); style.id = 'theme-test'; doc.head.append(style); }
    style.textContent = themeCSS(colors);
  }, [colors]);
  useEffect(() => { apply(); }, [apply]);
  const load = () => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    onNames(run.id, readNames(doc));
    apply();
  };
  return <div className="rf-page-stage" style={{width: W, height: H, transform: `scale(${scale})`}}>
    <iframe ref={frame} src={`/proto/benchmark/${run.id}/index.html`} title={`The pricing page ${run.address.toLowerCase()}`} width={W} height={H}
      scrolling="no" tabIndex={-1} inert onLoad={load}/>
  </div>;
}

export default function TryFinding({reduced = false}) {
  const [pick, setPick] = useState(null);          // swatch id, 'custom' or null
  const [customColor, setCustomColor] = useState('#2f6f73');
  const [names, setNames] = useState({});
  const [hostW, setHostW] = useState(0);
  const host = useRef(null), group = useRef(null);
  const mode = useInputMode();
  const colors = pick === 'custom' ? custom(customColor) : SWATCHES.find(s => s.id === pick)?.colors || null;
  const onNames = useCallback((id, list) => setNames(n => ({...n, [id]: list})), []);

  useLayoutEffect(() => {
    const el = host.current; if (!el) return undefined;
    const measure = () => setHostW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // a radio group: arrows move the choice, as native radios do
  const ids = SWATCHES.map(s => s.id);
  const onKey = e => {
    const i = Math.max(0, ids.indexOf(pick));
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = ids[(i + step + ids.length) % ids.length];
    setPick(next);
    group.current?.querySelector(`[data-id="${next}"]`)?.focus();
  };
  const followed = id => names[id] ? names[id].filter(n => n.ok).length : null;

  return <div className="rf" {...mode.bind}>
    <div className="rf-controls">
      <Ask>Pick a brand color for the pricing page.</Ask>
      <div className="rf-picker">
        <div ref={group} className="rf-swatches" role="radiogroup" aria-label="Brand colors" onKeyDown={onKey}>
          {SWATCHES.map((s, i) => <button key={s.id} type="button" role="radio" data-id={s.id} aria-checked={pick === s.id}
            tabIndex={SWATCHES.some(x => x.id === pick) ? (pick === s.id ? 0 : -1) : (i === 0 ? 0 : -1)} title={s.note} onClick={() => setPick(s.id)}
            className="rf-swatch">
            <span className="rf-dot" aria-hidden="true" style={{'--a': s.colors['--color-primary'], '--b': s.colors['--color-background']}}/>
            <span>{s.name}</span>
          </button>)}
        </div>
        <label className="rf-swatch is-custom" data-checked={pick === 'custom' || undefined}>
          <span className="rf-dot" aria-hidden="true" style={{'--a': customColor, '--b': mix(customColor, '#ffffff', .92)}}/>
          <span>Your color</span>
          <input type="color" value={customColor} aria-label="Your own brand color" onClick={() => setPick('custom')}
            onInput={e => { setCustomColor(e.target.value); setPick('custom'); }} onChange={e => { setCustomColor(e.target.value); setPick('custom'); }}/>
        </label>
        <button type="button" className="rf-reset" onClick={() => setPick(null)} disabled={!pick}>Original</button>
      </div>
    </div>

    <div className="rf-pair">
      {RUNS.map(run => {
        const list = names[run.id], n = followed(run.id);
        return <figure key={run.id} className={`rf-col${run.level === 'L0V' ? ' is-bound' : ''}`}>
          <figcaption className="rf-head">
            <span className="rf-level">{run.level}</span>
            <span className="rf-name">{run.name}</span>
            <span className="rf-score" aria-live="polite">{pick && n != null ? <><b>{n}</b> of 4 colors followed</> : 'Same page, as built'}</span>
          </figcaption>
          <div ref={run.level === 'L0' ? host : undefined}>
            <Browser address={run.address} ratio={`${W} / ${H}`}>
              {hostW ? <Page run={run} colors={colors} onNames={onNames} scale={hostW / W}/> : null}
            </Browser>
          </div>
          <ul className={`rf-tokens${pick ? ' is-on' : ''}`} aria-label={`What the ${run.level} page calls the design system’s colors`}>
            {TOKENS.map((t, i) => {
              const s = list?.[i];
              return <li key={t.css} className={s ? (s.ok ? 'is-ok' : 'is-miss') : ''}>
                <span className="rf-mark" aria-hidden="true">{s && pick ? (s.ok ? <Check/> : <Miss/>) : null}</span>
                <span className="rf-chip" aria-hidden="true" style={{background: colors?.[t.css] || t.value}}/>
                <span className="rf-token">{t.label}</span>
                <span className="rf-why">{!s || !pick ? '' : s.ok ? <><span className="v2-sr">Followed: </span>uses <code>{t.css}</code></>
                  : <><span className="v2-sr">Missed: </span>{s.as ? <>calls it <code>{s.as}</code></> : 'no variable'}</>}</span>
              </li>;
            })}
          </ul>
        </figure>;
      })}
    </div>

    <table className="rf-table">
      <caption className="v2-sr">What each page calls the design system’s colors</caption>
      <thead><tr><th scope="col"><span className="v2-sr">Color</span></th>{RUNS.map(r => <th key={r.id} scope="col">{r.level}</th>)}</tr></thead>
      <tbody>{TOKENS.map((t, i) => <tr key={t.css}>
        <th scope="row"><span className="rf-chip" aria-hidden="true" style={{background: colors?.[t.css] || t.value}}/>{t.label}</th>
        {RUNS.map(r => { const st = names[r.id]?.[i]; return <td key={r.id} className={st && pick ? (st.ok ? 'is-ok' : 'is-miss') : ''}>
          {st && pick ? (st.ok ? <><Check/><span className="v2-sr">followed</span></> : <><Miss/><span className="v2-sr">missed, </span>{st.as ? <code>{st.as}</code> : null}</>) : null}
        </td>; })}
      </tr>)}</tbody>
    </table>

    <Takeaway show={!!pick} instant={reduced || mode.keyed.current}>Same screen. Only the right one was built from variables.</Takeaway>
    <p className="v2-caption"><Ev label="Measured"/><span>Both pages are the agents’ own output, unchanged (S2-L0-r1 and S2-L0V-r1). Your color goes in the way the benchmark’s theme test did: four design-system variables overridden on :root. On its test colors the harness measured 2 of 4 colors followed for L0 and 4 of 4 for L0V.</span></p>
  </div>;
}

const mark = {viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round'};
const Check = () => <svg {...mark}><path d="m3.5 8.5 3 3 6-7"/></svg>;
const Miss = () => <svg {...mark}><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>;
