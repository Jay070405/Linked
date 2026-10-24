import {useState} from 'react';
import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import DIMS from './data/dimensions.json';
import {has, stillSrc} from './media';
import {dimension, massByGroup, power} from './model';
import {BATTERY, BELIEVE, COMPARE, MASS_GROUPS, MASS_ROWS, POWER_ROWS, RESERVE_G, TARGET_G} from './content';
import {Rich, strip} from './Type';

/* "Built to be believed": the dimension drawing with the model's own numbers (data/dimensions.json, copied from the
   render at build time), the weight budget against shipped glasses, the power budget, and how it would be made. */

/** What each drawn dimension says: the model's measured value for that line (mm). */
const VALUE = {
  front: {front_width: DIMS.front_width, lens_w_left: DIMS.lens_opening_w_x_h?.[0], lens_h_left: DIMS.lens_opening_w_x_h?.[1], bridge: DIMS.bridge_dbl, front_height: DIMS.front_height_brow_to_rim},
  side: {temple_length: DIMS.temple_length_nominal, overall_depth: DIMS.overall_depth_front_to_tips},
  top: {overall_width: DIMS.overall_width_with_temples, front_width: DIMS.front_width},
};
const fmtMm = v => (v == null ? '—' : (Math.round(v * 10) / 10).toFixed(v >= 100 ? 1 : 1).replace(/\.0$/, ''));

export function Dimensions() {
  const {t} = useCaseLang();
  const views = ['front', 'side', 'top'].filter(v => DIMS.views?.[v] && has(`dimensions-${v}`));
  const [view, setView] = useState(views[0]);
  if (!views.length) return null;
  const v = DIMS.views[view], [W, H] = v.size_px;
  const lines = Object.keys(v.anchors_px).map(k => ({k, ...dimension(v, k)}));
  return <div className="ar-dims">
    <div className="ar-seg" role="group" aria-label={t(BELIEVE.dimsHeading)}>
      {views.map(id => <button key={id} type="button" className="ar-seg-opt" aria-pressed={view === id} onClick={() => setView(id)}>{t(BELIEVE.views[id])}</button>)}
    </div>
    <figure className="ar-dims-fig" style={{'--ar': `${W} / ${H}`}}>
      <img className="ar-dims-img" src={stillSrc(`dimensions-${view}`, 1600)} width={W} height={H} alt="" loading="lazy" decoding="async"/>
      <svg viewBox={`0 0 ${W} ${H}`} className="ar-dims-svg" role="img"
        aria-label={lines.map(l => `${t(BELIEVE.dimLabels[l.k] || {en: l.k, zh: l.k})} ${fmtMm(VALUE[view]?.[l.k] ?? l.mm)} mm`).join(', ')}>
        {lines.map(l => {
          const vertical = Math.abs(l.x2 - l.x1) < Math.abs(l.y2 - l.y1);
          const mx = (l.x1 + l.x2) / 2, my = (l.y1 + l.y2) / 2, tick = 18;
          const label = `${fmtMm(VALUE[view]?.[l.k] ?? l.mm)}`;
          return <g key={l.k} className="ar-dim">
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}/>
            {vertical
              ? <><line x1={l.x1 - tick} y1={l.y1} x2={l.x1 + tick} y2={l.y1}/><line x1={l.x2 - tick} y1={l.y2} x2={l.x2 + tick} y2={l.y2}/></>
              : <><line x1={l.x1} y1={l.y1 - tick} x2={l.x1} y2={l.y1 + tick}/><line x1={l.x2} y1={l.y2 - tick} x2={l.x2} y2={l.y2 + tick}/></>}
            <g transform={`translate(${mx} ${my})${vertical ? ' rotate(-90)' : ''}`}>
              <rect x={-58} y={-26} width={116} height={52} rx={26}/>
              <text y={12} textAnchor="middle">{label}</text>
            </g>
          </g>;
        })}
      </svg>
    </figure>
    <ul className="ar-dims-key">
      {lines.map(l => <li key={l.k}><span>{t(BELIEVE.dimLabels[l.k] || {en: l.k, zh: l.k})}</span><b>{fmtMm(VALUE[view]?.[l.k] ?? l.mm)} mm</b></li>)}
    </ul>
    <p className="ar-note"><Rich text={BELIEVE.dimsNote}/></p>
  </div>;
}

export function Weight() {
  const {t, zh} = useCaseLang();
  const m = massByGroup(MASS_ROWS, MASS_GROUPS);
  const total = Math.round((m.total + RESERVE_G) * 100) / 100;
  const MAX = 75, pct = g => `${(g / MAX) * 100}%`;
  return <div className="ar-weight">
    <div className="ar-bars">
      <div className="ar-bar-row is-arden">
        <p className="ar-bar-name"><b>Arden</b> <Ev label="Estimated"/></p>
        <div className="ar-bar-track">
          <div className="ar-bar-stack" style={{width: pct(total)}}>
            {m.groups.map((g, i) => <span key={g.id} className={`ar-seg-${i}`} style={{flexGrow: g.g}} title={`${t(g.name)} ${g.g.toFixed(2)} g`}/>)}
            <span className="ar-seg-reserve" style={{flexGrow: RESERVE_G}} title={`${t(BELIEVE.reserve)} ${RESERVE_G.toFixed(2)} g`}/>
          </div>
          <span className="ar-bar-target" style={{left: pct(TARGET_G)}}><span>{zh ? `目标 ${TARGET_G} 克` : `target ${TARGET_G} g`}</span></span>
        </div>
        <p className="ar-bar-val">{total.toFixed(2)} g</p>
      </div>
      <p className="ar-small-head ar-bars-sub">{t(BELIEVE.weightCompare)} <Ev label="Sourced"/></p>
      {COMPARE.map(c => <div key={c.name} className="ar-bar-row">
        <p className="ar-bar-name"><a href={c.href} target="_blank" rel="noopener">{c.name}<span className="ar-sr">{t({en: ' (opens in a new tab)', zh: '（在新标签页打开）'})}</span></a> <span className="ar-dim">{t(c.note)}</span></p>
        <div className="ar-bar-track">
          <div className="ar-bar-plain" style={{width: pct(c.g[1])}}>{c.g[0] !== c.g[1] ? <span className="ar-bar-range" style={{left: `${(c.g[0] / c.g[1]) * 100}%`}}/> : null}</div>
          <span className="ar-bar-target is-ghost" style={{left: pct(TARGET_G)}}/>
        </div>
        <p className="ar-bar-val">{c.g[0] === c.g[1] ? `${c.g[0]} g` : `${c.g[0]}–${c.g[1]} g`}</p>
      </div>)}
    </div>
    <ul className="ar-weight-key">
      {m.groups.map((g, i) => <li key={g.id}><span className={`ar-key ar-seg-${i}`} aria-hidden="true"/>{t(g.name)} <b>{g.g.toFixed(2)} g</b></li>)}
      <li><span className="ar-key ar-seg-reserve" aria-hidden="true"/>{t(BELIEVE.reserve)} <b>{RESERVE_G.toFixed(2)} g</b></li>
    </ul>
    <p className="ar-weight-path">{t(BELIEVE.weightPath)}</p>
  </div>;
}

export function Power() {
  const {t} = useCaseLang();
  const p = power(POWER_ROWS, BATTERY);
  const c = BELIEVE.powerCols;
  return <div className="ar-power">
    <div className="ar-table-wrap" tabIndex={0} role="region" aria-label={strip(t(BELIEVE.powerHeading))}>
      <table className="ar-table">
        <thead><tr><th scope="col">{t(c.load)}</th><th scope="col">{t(c.active)}</th><th scope="col">{t(c.duty)}</th><th scope="col">{t(c.avg)}</th></tr></thead>
        <tbody>
          {POWER_ROWS.map(r => <tr key={r[1] + '-' + r[2]}><th scope="row">{t(r[0])}</th><td data-label={t(c.active)}>{r[1]} mW</td><td data-label={t(c.duty)}>{r[2]}%</td><td>{r[3]} mW</td></tr>)}
        </tbody>
        <tfoot><tr><th scope="row">{t({en: 'Total', zh: '合计'})}</th><td/><td/><td>{p.avgMw} mW</td></tr></tfoot>
      </table>
    </div>
    <p className="ar-power-big"><span className="ar-num">{(BATTERY.wh * BATTERY.usable).toFixed(3)} Wh ÷ {(p.avgMw / 1000).toFixed(3)} W =</span> <b>{p.hours.toFixed(1)} h</b></p>
    <ul className="ar-list">{BELIEVE.powerNotes.map((n, i) => <li key={i}>{t(n)}</li>)}</ul>
  </div>;
}

export function Make() {
  const {t} = useCaseLang();
  return <div className="ar-make">{BELIEVE.make.map(([h, text]) => <div key={h.en}><h4>{t(h)}</h4><p>{t(text)}</p></div>)}</div>;
}
