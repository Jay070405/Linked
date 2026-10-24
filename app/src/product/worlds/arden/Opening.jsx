import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import {ASSETS} from './media';
import {Photo} from './Pic';
import {EVIDENCE, OPENING, PROBLEM, PROBLEM_CARDS, WORN} from './content';
import {Sources} from './Chapters';
import {Statement, Words} from './Type';

/* The front of the page after the opening film (ArdenWorld): the worn photo, full bleed, and the problem as three
   image-led cards. */


/* ---------- the worn photo, full bleed ---------- */
export function WornPhoto() {
  const {t} = useCaseLang();
  if (!ASSETS.lifestyle?.['try-on-natural']) return null;
  return <section className="ar-wornhero" aria-labelledby="ar-wornhero-h">
    <figure className="ar-wornhero-fig">
      <Photo dir="lifestyle" name="try-on-natural" alt={t(WORN.alts['try-on-natural'])}/>
      <figcaption>{t(WORN.label)}</figcaption>
    </figure>
    <h2 id="ar-wornhero-h" className="ar-wornhero-line">{t(OPENING.worn)}</h2>
  </section>;
}

/* ---------- the problem, made visual ---------- */
export function ProblemCards({reduced}) {
  const {t} = useCaseLang();
  const [weights] = EVIDENCE;
  const rows = weights.rows.map(([n, g, src, href]) => ({n, g, src, href, max: Math.max(...g.replace(' g', '').split('–').map(Number))}));
  const top = Math.max(...rows.map(r => r.max));
  const C = PROBLEM_CARDS;
  return <section className="ar-chapter ar-problem has-say" aria-labelledby="ar-problem">
    <Statement id="ar-problem" label={PROBLEM.eyebrow} text={PROBLEM.heading} lede={PROBLEM.lede} reduced={reduced}/>
    <ol className="ar-pcards">
      <li className="ar-pcard">
        <div className="ar-pcard-art is-bars" aria-hidden="true">
          {[...rows].sort((a, b) => a.max - b.max).map(r => <div key={r.src} className={`ar-wbar${r.max === top ? ' is-top' : ''}`}>
            <span className="ar-wbar-name">{t(r.n)}</span>
            <span className="ar-wbar-track"><span style={{'--w': (r.max / 75).toFixed(3)}}/></span>
            <span className="ar-wbar-g">{r.g}</span>
          </div>)}
          <span className="ar-wbar-scale"><span>0</span><span>25 g</span><span>50 g</span><span>75 g</span></span>
        </div>
        <Words className="ar-h3" text={C.heavy.title} reduced={reduced}/>
        <p>{t(C.heavy.text)}</p>
        <p className="ar-pcard-src"><Ev label="Sourced"/> <Sources list={rows.map(r => ({name: r.src, href: r.href}))} inline/></p>
        <div className="ar-sr"><table><tbody>{rows.map(r => <tr key={r.src}><th>{t(r.n)}</th><td>{r.g}</td></tr>)}</tbody></table></div>
      </li>
      <li className="ar-pcard">
        <div className="ar-pcard-art is-photo"><Photo dir="lifestyle" name="try-on-desert" alt={t(C.camera.alt)}/></div>
        <Words className="ar-h3" text={C.camera.title} reduced={reduced}/>
        <p>{t(C.camera.text)}</p>
        <p className="ar-pcard-note">{t(C.camera.note)}</p>
        <p className="ar-pcard-src"><Ev label="Sourced"/> <Sources list={[...EVIDENCE[1].sources, ...EVIDENCE[2].sources]} inline/></p>
        <p className="ar-pcard-ai">{t(WORN.label)}</p>
      </li>
      <li className="ar-pcard">
        <div className="ar-pcard-art is-app"><AppSketch t={t}/></div>
        <Words className="ar-h3" text={C.app.title} reduced={reduced}/>
        <p>{t(C.app.text)}</p>
        <p className="ar-pcard-src"><Ev label="Hypothesis"/></p>
      </li>
    </ol>
  </section>;
}

/** Two phones as wireframes, drawn, not copied: a companion built around a viewfinder and a grid of captures, and
    Arden's Glasses tab (the glasses, one battery for the glasses and one for the case, quick controls). */
function AppSketch({t}) {
  const C = PROBLEM_CARDS.app;
  const phone = (x, children, label, strong) => <g transform={`translate(${x} 0)`}>
    <rect x="0" y="8" width="150" height="300" rx="24" className="ar-sk-body"/>
    <rect x="58" y="16" width="34" height="9" rx="4.5" className="ar-sk-ink"/>
    {children}
    <text x="75" y="334" textAnchor="middle" className={`ar-sk-label${strong ? ' is-strong' : ''}`}>{label}</text>
  </g>;
  return <svg viewBox="0 0 360 344" role="img" aria-label={t(C.alt)} className="ar-sketch">
    {phone(10, <>
      {/* a viewfinder, a shutter, and the captures */}
      <rect x="14" y="38" width="122" height="104" rx="10" className="ar-sk-fill"/>
      <circle cx="75" cy="90" r="16" className="ar-sk-line"/>
      <circle cx="75" cy="162" r="11" className="ar-sk-ink"/>
      {[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={14 + c * 42} y={186 + r * 38} width="38" height="34" rx="5" className="ar-sk-fill"/>))}
    </>, t(C.camera), false)}
    {phone(200, <>
      {/* the glasses, the glasses' battery and the case's, two controls */}
      <path d="M22 66h106M24 66c0 18 6 28 22 28s20-10 21-28M83 66c1 18 5 28 21 28s22-10 22-28" className="ar-sk-line is-strong"/>
      {[0, 1].map(i => <g key={i} transform={`translate(${14 + i * 63} 118)`}><rect width="59" height="40" rx="7" className="ar-sk-fill"/><rect x="10" y="26" width={i ? 30 : 22} height="4" rx="2" className="ar-sk-ink"/></g>)}
      {[0, 1].map(i => <g key={i} transform={`translate(14 ${176 + i * 40})`}><rect width="122" height="32" rx="8" className="ar-sk-fill"/><rect x="12" y="14" width="98" height="4" rx="2" className="ar-sk-line-bg"/><circle cx={i ? 92 : 58} cy="16" r="6" className="ar-sk-ink"/></g>)}
      <rect x="14" y="258" width="122" height="30" rx="15" className="ar-sk-fill"/>
    </>, t(C.arden), true)}
  </svg>;
}
