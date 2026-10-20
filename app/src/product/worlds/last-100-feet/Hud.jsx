import {ADDRESS, WAYPOINTS} from '../../v2/data/l100-route';
import {L, useCaseLang} from '../../i18n';
import {WAYPOINT_NAMES, stepOf} from './content';
import {NOTE_WORDS, useBag, warmthWord} from './walk';

/* The courier's screen, top right: the order chip the prototype keeps on every card (Dana, unit 214, order 1 of 2
   in a stacked delivery), the hot bag, and the five stops as the route's own tokens. The tokens jump to their stop.
   On phones it collapses into one chip. The bag is illustrative: it cools while you wait at the locked gate or send
   the courier to the garage in "Find the door", and stays warm on the photo route. */

const GLYPH = ['P', 'gate', '4', 'stairs', '214'];

function Glyph({g}) {
  if (g === 'gate') return <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 9.5v-7M9.5 9.5v-7M2.5 4.4h7M4.8 4.4v5.1M7.2 4.4v5.1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
  if (g === 'stairs') return <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 10h2.6V7.4h2.6V4.8h2.6V2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <span aria-hidden="true">{g}</span>;
}
export const StopGlyph = ({i, state = 'current'}) => <span className={`w3-glyph${GLYPH[i] === '214' ? ' is-wide' : ''}`} data-state={state}><Glyph g={GLYPH[i]}/></span>;

export const BagIcon = () => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
  <path d="M7 5.2V4a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 13 4v1.2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
  <rect x="2.6" y="5.2" width="14.8" height="12" rx="2.6" fill="currentColor"/>
  <path d="M2.6 10.4h14.8" stroke="#10131c" strokeWidth="1.1" opacity=".55"/>
</svg>;

export default function Hud({reached, onJump, plainLink}) {
  const b = useBag();
  const {t, zh} = useCaseLang();
  const w = t(warmthWord(b.warmth)), note = b.note ? t(NOTE_WORDS[b.note] || b.note) : null;
  const word = b.delivered ? (zh ? `已送达，${w}` : `Delivered ${w.toLowerCase()}`) : w;
  const temp = Math.round(b.warmth * 100);
  return <aside className="w3-hud" aria-label={t(L('Your delivery', '你的配送'))} data-warmth={b.warmth >= .62 ? 'hot' : b.warmth >= .42 ? 'cooling' : 'cold'}>
    <div className="w3-hud-pill">
    <p className="w3-order"><span className="w3-order-dot" aria-hidden="true"/><span className="w3-order-text">{zh ? `${ADDRESS.resident} · ${ADDRESS.unit} 室 · 第 1/2 单` : `${ADDRESS.resident} · Apt ${ADDRESS.unit} · 1 of 2`}</span></p>
    <div className="w3-bag">
      <span className="w3-bag-icon"><BagIcon/></span>
      <span className="w3-bag-meter" aria-hidden="true"><span style={{transform: `scaleX(${b.warmth})`}}/></span>
      <span className="w3-bag-word" aria-live="polite"><span className="w3-sr">{t(L('Hot bag: ', '保温袋：'))}</span>{word}</span>
      <span className="w3-sr">{temp >= 85 || !note ? '' : zh ? `（${note}）` : ` (${note})`}</span>
    </div>
    </div>
    {note ? <p className="w3-bag-note" aria-hidden="true">{note}</p> : null}
    <nav className="w3-rail" aria-label={t(L('Stops on the route', '路线上的站点'))}>
      <ol>
        {WAYPOINTS.map((w, i) => <li key={w.key}>
          <button type="button" onClick={e => onJump(i, e)} aria-current={reached === i ? 'step' : undefined}
            aria-label={t(stepOf(i, WAYPOINT_NAMES[i]))} data-state={i < reached ? 'done' : i === reached ? 'current' : 'upcoming'}>
            <Glyph g={GLYPH[i]}/>
          </button>
        </li>)}
      </ol>
    </nav>
    {plainLink}
  </aside>;
}
