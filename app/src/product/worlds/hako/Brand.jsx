import {useRef, useState} from 'react';
import {L, useCaseLang} from '../../i18n';
import {T} from './content';

/* The brand, from saas-film/src/brand.ts and ui/Logo.tsx: the mark on its 100-unit grid, the wordmark whose "o" is the
   selection box (a rounded-square ring, drawn), the palette with each colour's one job, the three typefaces and the
   motion tokens. */

const MARK = {inset: 19, stroke: 11, handle: 26, handleR: 4.5};

/** The mark: a square frame with four handles. `pop` makes the handles spring a little on hover (CSS). */
export function Mark({size = 64, frame = '#0E0E11', handle = '#FF5A1F', className = ''}) {
  const {inset: a, stroke: s, handle: hs, handleR} = MARK, b = 100 - a;
  return <svg className={`hw-mark ${className}`} width={size || undefined} height={size || undefined} viewBox="0 0 100 100" aria-hidden="true">
    <rect x={a} y={a} width={b - a} height={b - a} fill="none" stroke={frame} strokeWidth={s}/>
    {[[a, a], [b, a], [b, b], [a, b]].map(([x, y]) => <rect key={`${x}-${y}`} className="hw-mark-h" x={x - hs / 2} y={y - hs / 2} width={hs} height={hs} rx={handleR} fill={handle}/>)}
  </svg>;
}

// the wordmark's "o", in em (Logo.tsx WORD): a ring as tall as the x-height, sides as heavy as the stems
const WORD = {side: 0.54, width: 0.585, stemV: 0.183, stemH: 0.143, gap: 0.08};
const rrect = (x, y, w, h, r) => `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
const RING = (() => {
  const {side: h, width: w, stemV: sv, stemH: sh} = WORD;
  const R = (MARK.handleR / MARK.handle) * h, r = R * 0.5;
  return rrect(0, 0, w, h, R) + ' ' + rrect(sv, sh, w - 2 * sv, h - 2 * sh, r);
})();

/** "hako": "hak" set in Mona Sans (820, width 112), the "o" drawn as the selection box. Decorative; name it nearby. */
export function Wordmark({className = ''}) {
  return <span className={`hw-word ${className}`} aria-hidden="true" lang="en">hak<svg viewBox={`0 0 ${WORD.width} ${WORD.side}`} style={{width: `${WORD.width}em`, height: `${WORD.side}em`, marginLeft: `${WORD.gap}em`}}><path d={RING} fillRule="evenodd" fill="currentColor"/></svg></span>;
}

const SWATCHES = [
  {name: 'Paper', hex: '#F2F0EB', role: L('the canvas', '画布'), ink: '#0E0E11'},
  {name: 'Ink', hex: '#0E0E11', role: L('type · your cursor', '文字 · 你的光标'), ink: '#F2F0EB'},
  {name: 'Persimmon', hex: '#FF5A1F', role: L('your selection · brand', '你的选框 · 品牌'), ink: '#fff'},
  {name: 'Ultraviolet', hex: '#5B4BFF', role: L('agents only', '只给 agent'), ink: '#fff'},
  {name: 'Live', hex: '#17B26A', role: L('shipped', '已上线'), ink: '#fff'},
];
const MATES = [['Mia', '#E8467C'], ['Theo', '#0FA3A3'], ['Ren', '#E8A21A']];

export function Palette() {
  const {t} = useCaseLang();
  return <div className="hw-palette">
    <ul className="hw-swatches">{SWATCHES.map(s => <li key={s.name} style={{background: s.hex, color: s.ink}}>
      <b lang="en">{s.name}</b><code>{s.hex}</code><span>{t(s.role)}</span>
    </li>)}</ul>
    <p className="hw-mates"><span>{t(T.teammates)}</span>{MATES.map(([n, c]) => <span key={n} className="hw-mate"><i style={{background: c}} aria-hidden="true"/><b lang="en">{n}</b><code>{c}</code></span>)}</p>
  </div>;
}

/** The three typefaces, with Mona Sans's width axis on a slider (the brand's "width stretch" entrance uses it). */
export function TypeSpecimens() {
  const {t} = useCaseLang();
  const [wdth, setWdth] = useState(112);
  return <div className="hw-types">
    <div className="hw-type is-display">
      <p className="hw-type-name"><b>Mona Sans</b><span>{t(T.typeDisplay)}</span></p>
      <p className="hw-type-sample" lang="en" style={{fontVariationSettings: `"wdth" ${wdth}`, fontStretch: `${wdth}%`}}>Draw a box. <span>Ship a product.</span></p>
      <label className="hw-range"><span>{t(T.width)}</span><input type="range" min="75" max="125" step="1" value={wdth} onChange={e => setWdth(Number(e.target.value))}/><code>{wdth}</code></label>
    </div>
    <div className="hw-type is-ui">
      <p className="hw-type-name"><b>Inter</b><span>{t(T.typeUi)}</span></p>
      <p className="hw-type-sample" lang="en">Make it real — dark, live data</p>
    </div>
    <div className="hw-type is-mono">
      <p className="hw-type-name"><b>Geist Mono</b><span>{t(T.typeMono)}</span></p>
      <p className="hw-type-sample" lang="en">1280 × 800 · highlight="sat"</p>
    </div>
  </div>;
}

const DURS = [['instant', 100], ['fast', 250], ['normal', 450], ['moderate', 700], ['slow', 1100], ['deliberate', 1800]];
const DUR_USE = {instant: L('click compress', '点击回弹'), fast: L('handle pop, chip in', '控制点弹出、标签进场'), normal: L('UI element enters', '界面元素进场'), moderate: L('panel moves', '面板移动'), slow: L('camera segment', '一段镜头'), deliberate: L('a hero transformation', '主角级的变形')};
const EASES = [['snap', '.35,0,.15,1', L('UI arrivals', '界面进场')], ['soft', '.33,0,.2,1', L('type, surfaces', '文字、面')], ['glide', '.45,0,.2,1', L('camera, never to a stop', '镜头，永不急停')]];

/** The motion tokens, playable: pick a duration and an ease, and the mark crosses the track with them. */
export function MotionTokens({still}) {
  const {t} = useCaseLang();
  const [dur, setDur] = useState('normal'), [ease, setEase] = useState('snap'), [side, setSide] = useState(0);
  const ms = DURS.find(d => d[0] === dur)[1], curve = EASES.find(e => e[0] === ease)[1];
  const box = useRef(null);
  return <div className="hw-motion">
    <div className="hw-motion-pick">
      <div className="hw-tokens" role="group" aria-label={t(L('Duration', '时长'))}>{DURS.map(([n, v]) => <button key={n} type="button" aria-pressed={dur === n} onClick={() => setDur(n)}><b lang="en">{n}</b><code>{v} ms</code></button>)}</div>
      <div className="hw-eases" role="group" aria-label={t(L('Ease', '缓动'))}>{EASES.map(([n, c]) => <button key={n} type="button" aria-pressed={ease === n} onClick={() => setEase(n)}><b lang="en">{n}</b><code>cubic-bezier({c})</code></button>)}</div>
    </div>
    <div className="hw-motion-stage">
      <div className="hw-motion-track" aria-hidden="true">
        <span ref={box} className="hw-motion-box" style={{transform: `translate3d(calc(${side} * (100cqw - 56px)), 0, 0)`, transition: still ? 'none' : `transform ${ms}ms cubic-bezier(${curve})`}}><Mark size={56} frame="#0E0E11"/></span>
      </div>
      <div className="hw-mini-foot">
        <p className="hw-mini-read"><code>{dur} · {ms} ms · {ease}</code> — {t(DUR_USE[dur])}; {t(EASES.find(e => e[0] === ease)[2])}</p>
        <button type="button" className="hw-mini-btn" onClick={() => setSide(s => 1 - s)}>{t(T.play)}</button>
      </div>
    </div>
  </div>;
}
