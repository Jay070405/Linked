import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {plans} from '../../v2/data/cntl-model.js';
import {Ask, Takeaway, usd} from './bits';
import {Register} from './print';
import {DEFAULT_MIX, MIXES, bDominator, rollYear} from './year-mix.js';

/* "Roll your year", the receipt's signature (site-spec/WORLDS.md, D4). One key draws a year of covered bills from an
   ILLUSTRATIVE mix (year-mix.js: made up, and labeled so wherever it shows) and prints a line item per plan with that
   year's total, priced by the prototype's tested cost model. "Simulate 100 years" runs it a hundred times and stacks
   a tally of which plan was cheapest each year. The mix moves the winners between A, C and D; Plan B stays at zero
   under every mix, because Plan A has its terms for $600 less (dominates(), the model's own test).
   The state lives in useRollBook() so the log (on the receipt) and the tally (on the desk beside it) share it. */

const EMPTY = () => ({n: 0, tally: Object.fromEntries(plans.map(p => [p.id, 0])), recent: [], lost: 0});
const RECENT = 4, RUN = 100, TICK = 28;
const add = (book, y) => {
  const n = book.n + 1;
  const tally = {...book.tally};
  y.winners.forEach(id => { tally[id] += 1; });
  return {n, tally, recent: [{...y, k: n}, ...book.recent].slice(0, RECENT), lost: book.lost + (y.rows[1].total - y.rows[0].total)};
};
const mixOf = id => MIXES.find(m => m.id === id);
const tallyWords = book => plans.map(p => `${p.name} ${book.tally[p.id]}`).join(', ');

export function useRollBook(still = false) {
  const [mix, setMix] = useState(DEFAULT_MIX);
  const [books, setBooks] = useState(() => Object.fromEntries(MIXES.map(m => [m.id, EMPTY()])));
  const [running, setRunning] = useState(false);
  const [said, setSaid] = useState('');
  const [keyed, setKeyed] = useState(false);
  const timer = useRef(0), left = useRef(0), mixRef = useRef(mix), announce = useRef(false);
  mixRef.current = mix;
  useEffect(() => () => clearInterval(timer.current), []);
  const book = books[mix];
  const all = Object.values(books).reduce((s, b) => ({n: s.n + b.n, b: s.b + b.tally.b}), {n: 0, b: 0});

  // a finished run is announced once, with the tally it ended on
  useEffect(() => {
    if (!announce.current || running) return;
    announce.current = false;
    setSaid(`${book.n} illustrative years, ${mixOf(mix).label.toLowerCase()}. Cheapest: ${tallyWords(book)}.`);
  }, [books, running, book, mix]);

  const settle = useCallback(() => {
    clearInterval(timer.current);
    const m = mixRef.current, rest = [];
    for (; left.current > 0; left.current--) rest.push(rollYear(m));
    announce.current = true;
    setBooks(b => { let cur = b[m]; rest.forEach(y => { cur = add(cur, y); }); return {...b, [m]: cur}; });
    setRunning(false);
  }, []);

  const roll = e => {
    setKeyed(e?.detail === 0);
    if (running) return;
    const y = rollYear(mix);
    setBooks(b => ({...b, [mix]: add(b[mix], y)}));
    const cheapest = y.rows.filter(r => y.winners.includes(r.id));
    setSaid(`${usd(y.bills)} in illustrative covered bills. Cheapest: ${cheapest.map(r => `${r.name} at ${usd(r.total)}`).join(' and ')}. Plan B: ${usd(y.rows[1].total)}, ${usd(y.rows[1].total - y.rows[0].total)} more than Plan A.`);
  };
  const simulate = e => {
    setKeyed(e?.detail === 0);
    if (running) { settle(); return; }
    left.current = RUN;
    if (still) { settle(); return; }
    setRunning(true);
    timer.current = setInterval(() => {
      if (left.current <= 0) { settle(); return; }
      left.current -= 1;
      const m = mixRef.current, y = rollYear(m);
      setBooks(b => ({...b, [m]: add(b[m], y)}));
    }, TICK);
  };
  const clear = () => { clearInterval(timer.current); left.current = 0; setRunning(false); setBooks(b => ({...b, [mix]: EMPTY()})); setSaid('Tally cleared for this mix.'); };
  return {mix, setMix, book, books, all, running, said, keyed, roll, simulate, clear, instant: still || keyed};
}

function Year({y, fresh, instant, compact}) {
  return <li className={`cnr-y${fresh ? ' is-fresh' : ''}`}>
    <p className="cnr-y-head"><span className="cnr-y-n">Year {y.k}</span><span className="cnr-y-stamp">Illustrative bills</span><span className="cnr-y-bills">{fresh ? <Register text={usd(y.bills)} instant={instant}/> : usd(y.bills)}</span></p>
    <ul className="cnr-y-rows">
      {y.rows.map(r => {
        const win = y.winners.includes(r.id);
        return <li key={r.id} className={`${win ? 'is-low' : ''}${r.id === 'b' ? ' is-b' : ''}`}>
          <span className="cnr-y-name">{r.name}</span>
          {compact ? null : <span className="cnr-y-parts">{usd(r.premium)} + {usd(r.outOfPocket)}</span>}
          <span className="cnr-y-total">{fresh ? <Register text={usd(r.total)} instant={instant}/> : usd(r.total)}</span>
          <span className="cnr-y-tag">{win ? 'Cheapest' : r.id === 'b' ? `+${usd(r.total - y.rows[0].total)} vs A` : ''}</span>
        </li>;
      })}
    </ul>
  </li>;
}

/** Before the first roll: the blank form a year will print into. */
function Blank({compact}) {
  return <div className="cnr-y is-blank">
    <p className="cnr-y-head"><span className="cnr-y-n">Year 1</span><span className="cnr-y-stamp">Illustrative bills</span><span className="cnr-y-bills" aria-hidden="true">$ —</span></p>
    <ul className="cnr-y-rows" aria-hidden="true">{plans.map(p => <li key={p.id}>
      <span className="cnr-y-name">{p.name}</span>{compact ? null : <span className="cnr-y-parts">premiums + care</span>}<span className="cnr-y-total">$ —</span><span className="cnr-y-tag"/>
    </li>)}</ul>
    <p className="cnr-r-empty">Nothing rolled yet. Each year prints here, newest first.</p>
  </div>;
}

/** The tally: one notch per year a plan came out cheapest. */
export function Tally({r}) {
  const {book, mix, all} = r;
  const most = Math.max(1, ...Object.values(book.tally));
  const by = bDominator();
  return <div className="cnr-tally" role="group" aria-label="Cheapest plan, year by year">
    <p className="cnr-tally-title">Cheapest plan, year by year</p>
    <p className="cnr-tally-sub">{mixOf(mix).label}, illustrative: {book.n} {book.n === 1 ? 'year' : 'years'} rolled</p>
    <ul className="cnr-tally-rows">
      {plans.map(p => {
        const c = book.tally[p.id];
        return <li key={p.id} className={`is-${p.id}${p.id === 'b' && c === 0 && book.n ? ' is-zero' : ''}`}>
          <span className="cnr-tally-name">{p.name}</span>
          <span className="cnr-tally-track" aria-hidden="true"><i style={{width: `${c / most * 100}%`, backgroundSize: `${100 / Math.max(1, c)}% 100%`}}/></span>
          <span className="cnr-tally-n">{c}</span>
        </li>;
      })}
    </ul>
    <p className="cnr-tally-why"><b>Plan B can’t win a year.</b> Plan {by?.id.toUpperCase()} has its deductible, coinsurance and maximum for $600 less, so B is $600 behind A at any amount of bills.</p>
    {book.n ? <p className="cnr-tally-lost"><span>Plan B instead of Plan A, these {book.n} {book.n === 1 ? 'year' : 'years'}</span><b>−{usd(book.lost)}</b></p> : null}
    {all.n > book.n ? <p className="cnr-tally-all">Every mix you’ve run: Plan B cheapest in {all.b} of {all.n} years.</p> : null}
  </div>;
}

export default function RollYear({r, compact = false, tallyHere = false}) {
  const {mix, setMix, book, running, said, roll, simulate, clear, instant} = r;
  const list = useRef(null), topKey = useRef(0);

  // a printed year feeds out under the printer: the log slides down by the new year's height (FLIP, transform only)
  useLayoutEffect(() => {
    const el = list.current, first = el?.firstElementChild;
    const k = book.recent[0]?.k || 0;
    if (!el || !first || k === topKey.current) { topKey.current = k; return; }
    topKey.current = k;
    if (instant || running || book.recent.length < 2) return;
    const h = first.getBoundingClientRect().height;
    el.style.transition = 'none';
    el.style.transform = `translateY(${-h}px)`;
    el.getBoundingClientRect();
    el.style.transition = 'transform 340ms cubic-bezier(.2,0,.38,.9)';
    el.style.transform = '';
  });

  return <div className={`cnr-r${running ? ' is-running' : ''}${instant ? ' is-instant' : ''}`}>
    <Ask>Roll a year. Then roll a hundred.</Ask>
    <div className="cnr-r-keys" data-print="">
      <button type="button" className="cnr-key is-primary" onClick={roll} disabled={running}>Roll a year</button>
      <button type="button" className="cnr-key" onClick={simulate} aria-pressed={running}>{running ? 'Finish the run' : 'Simulate 100 years'}</button>
      {book.n && !running ? <button type="button" className="cnr-key is-quiet" onClick={clear}>Clear</button> : null}
    </div>
    <fieldset className="cnr-r-mix" data-print="" disabled={running}>
      <legend>Mix of years to draw from</legend>
      <div className="cnr-r-mix-opts">{MIXES.map(m => <label key={m.id} className={mix === m.id ? 'is-on' : ''}>
        <input type="radio" name="cnr-mix" value={m.id} checked={mix === m.id} onChange={() => setMix(m.id)}/><span>{m.label}</span>
      </label>)}</div>
      <p className="cnr-r-mix-words"><span className="cnr-stamp">Illustrative</span> {mixOf(mix).words} Made up to show the mechanics: no forecast, no claims data, nobody’s health.</p>
    </fieldset>
    <p className="cnr-sr" aria-live="polite">{said}</p>

    {tallyHere ? <Tally r={r}/> : null}
    <div className="cnr-r-printer" data-print="">
      <div className="cnr-r-slot" aria-hidden="true"><i/></div>
      <div className={`cnr-r-window${book.recent.length ? '' : ' is-blank'}`}>
        {book.recent.length
          ? <ol ref={list} className="cnr-r-log" aria-label="Rolled years, newest first">{book.recent.map((y, i) => <Year key={y.k} y={y} fresh={i === 0} instant={instant || running} compact={compact}/>)}</ol>
          : <Blank compact={compact}/>}
      </div>
    </div>
    <Takeaway show={book.n >= 10} instant={instant}>Which plan is cheapest depends on the year. Plan B never is.</Takeaway>
    <p className="cnr-cap" data-print=""><Ev label="Simulated"/><span>The bills are drawn at random from the made-up mix above. Every total is the prototype’s tested cost model; Plan B’s zero follows from its terms, not from the mix.</span></p>
  </div>;
}
