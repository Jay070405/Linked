import {useState} from 'react';
import {Ev} from '../../CaseKit';
import {annualPremium, dominator, money, plans, premiumDifference, rate} from '../../v2/data/cntl-model.js';
import {Ask, Rule, Takeaway, usd} from './bits';
import {Register, useKeyed} from './print';

/* "Which plan would you pick?", as the receipt's opening line items. The baseline table from the prototype (its
   Baseline screen: the same rows and the same four fictional plans, data/cntl-model.js), printed as a ledger with a
   box to tick per plan. Ticking one prints whether that plan is dominated and by how much a year, from the
   prototype's own all-spend test (dominates()). Nothing is stored or sent. (Re-skin of v2/modules/PlanQuiz.jsx.) */

const ROWS = [
  {label: 'Employee premium per month', short: 'Premium a month', value: p => money(p.monthlyPremium), key: 'monthlyPremium'},
  {label: 'Deductible per year', short: 'Deduct­ible', value: p => money(p.deductible), key: 'deductible'},
  {label: 'Member coinsurance', short: 'Coins­urance', value: p => rate(p.coinsuranceBps), key: 'coinsuranceBps'},
  {label: 'Out-of-pocket maximum per year', short: 'Max out of pocket', value: p => money(p.oopMax), key: 'oopMax'},
];
const A = plans[0], B = plans[1];
const GAP = premiumDifference(B, A);   // 60000 cents: $600 a year

/** What a cell in Plan B's column says once you've picked: which terms match A's, and what the premium costs. */
function Mark({pick, plan, row}) {
  if (!pick || plan.id !== 'b') return null;
  if (row.key === 'monthlyPremium') return <span className="cnr-q-mark is-loss">+{money(B.monthlyPremium - A.monthlyPremium)} vs A</span>;
  return plan[row.key] === A[row.key] ? <span className="cnr-q-mark">= A</span> : null;
}

export default function PlanLines({compact = false, still = false, onPick}) {
  const [pick, setPick] = useState(null);
  const mode = useKeyed();
  const chosen = plans.find(p => p.id === pick);
  const beatenBy = chosen ? dominator(chosen) : null;
  const instant = still || mode.keyed.current;
  const choose = id => { setPick(id); onPick?.(id); };
  const box = p => <label className="cnr-q-box">
    <input type="radio" name="cnr-plan" value={p.id} checked={pick === p.id} onChange={() => choose(p.id)}/>
    <span>{compact ? p.name : <><span className="cnr-sr">Select </span>{p.name}</>}</span>
  </label>;

  return <div className={`cnr-q${pick ? ' is-picked' : ''}${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <Ask>Tick the plan you’d enroll in.</Ask>
    <div className="cnr-q-head" data-print="">
      <p className="cnr-q-crumb">Benefits / Open enrollment / Medical</p>
      <p className="cnr-q-title">Medical plan selection</p>
    </div>
    <dl className="cnr-q-meta" data-print="">
      <div><dt>Coverage level</dt><dd>Employee only</dd></div>
      <div><dt>Effective date</dt><dd>01/01/2027</dd></div>
      <div><dt>Available plans</dt><dd>4</dd></div>
    </dl>
    <Rule/>
    {compact
      ? <table className="cnr-q-table is-compact" data-print="">
          <caption className="cnr-sr">Available medical plans. Tick one to see whether it is dominated.</caption>
          <thead><tr><th scope="col">Plan</th>{ROWS.map(r => <th key={r.key} scope="col">{r.short}</th>)}</tr></thead>
          <tbody>{plans.map(p => <tr key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>
            <th scope="row">{box(p)}</th>
            {ROWS.map(r => <td key={r.key}>{r.value(p)}<Mark pick={pick} plan={p} row={r}/></td>)}
          </tr>)}</tbody>
        </table>
      : <table className="cnr-q-table" data-print="">
          <caption className="cnr-sr">Available medical plans. Tick one to see whether it is dominated.</caption>
          <thead><tr><th scope="col"><span className="cnr-sr">Benefit</span></th>{plans.map(p => <th key={p.id} scope="col" className={pick && p.id === 'b' ? 'is-flag' : ''}>{p.name}<small>PPO, in-network</small></th>)}</tr></thead>
          <tbody>
            {ROWS.map(r => <tr key={r.key}>
              <th scope="row">{r.label}</th>
              {plans.map(p => <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>{r.value(p)}<Mark pick={pick} plan={p} row={r}/></td>)}
            </tr>)}
            <tr className="cnr-q-pick">
              <th scope="row">Plan election</th>
              {plans.map(p => <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>{box(p)}</td>)}
            </tr>
          </tbody>
        </table>}
    <p className="cnr-q-note" data-print="">Primary care, specialists and prescription drugs, on every plan: the deductible, then that plan’s coinsurance.</p>
    <Rule/>
    <p className="cnr-q-note is-small" data-print="">Amounts shown apply to covered in-network services. Premiums do not apply toward your deductible or out-of-pocket maximum. All four plans use the same provider network and covered services.</p>

    <div className="cnr-q-out" aria-live="polite">
      {chosen ? <div key={instant ? 'still' : chosen.id} className="cnr-q-answer">
        <p className="cnr-q-verdict">{beatenBy
          ? <><b>{chosen.name}</b> costs <b>{money(GAP)} more a year</b> than {beatenBy.name} for the same coverage: the same deductible, coinsurance and out-of-pocket maximum, and a higher premium.</>
          : <>{chosen.name} isn’t beaten on every term by another plan here. But one plan is: <b>Plan B</b> has Plan A’s deductible, coinsurance and maximum, and costs <b>{money(GAP)} more a year</b>.</>}</p>
        <div className="cnr-q-sum">
          <p className="cnr-q-gap"><span className="cnr-q-gap-n"><Register text={`+${usd(GAP)}`} instant={instant}/></span>
            <span>a year more on Plan B: {money(annualPremium(B))} in premiums against {money(annualPremium(A))} for Plan A, whatever the year’s bills.</span></p>
          <p className="cnr-q-study"><Ev label="Sourced"/><span>In a study of 23,894 employees choosing from a menu that included plans like Plan B, most picked one. Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017.</span></p>
        </div>
      </div> : <p className="cnr-q-wait">Your pick stays on this page. Nothing is sent or saved.</p>}
    </div>
    <Takeaway show={!!pick} instant={instant}>Every number you needed was in the table. The $600 wasn’t.</Takeaway>
  </div>;
}
