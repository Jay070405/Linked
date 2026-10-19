import {useState} from 'react';
import {Ev} from '../../CaseKit';
import {Browser} from '../Device';
import {PHONE, useMedia} from '../motion';
import {Ask, Takeaway, useInputMode} from '../Try';
import {annualPremium, dominator, money, plans, premiumDifference, rate} from '../data/cntl-model';
import './quiz.css';

/* D4, "Which plan would you pick?": the baseline benefits table from the prototype (its Baseline screen, same rows and
   the same four fictional plans, from data/cntl-model.js), with a radio per plan. Picking one reveals whether that plan
   is dominated and by how much a year, using the prototype's own all-spend test (dominates()). Nothing is stored or
   sent: the choice lives in this component's state. */

const ROWS = [
  {label: 'Employee premium per month', value: p => money(p.monthlyPremium), key: 'monthlyPremium'},
  {label: 'Deductible per year', value: p => money(p.deductible), key: 'deductible'},
  {label: 'Member coinsurance', value: p => rate(p.coinsuranceBps), key: 'coinsuranceBps'},
  {label: 'Out-of-pocket maximum per year', value: p => money(p.oopMax), key: 'oopMax'},
  {label: 'Primary care / specialist', value: p => `Deductible, then ${rate(p.coinsuranceBps)}`},
  {label: 'Prescription drugs', value: p => `Deductible, then ${rate(p.coinsuranceBps)}`},
];
const A = plans[0], B = plans[1];
const GAP = premiumDifference(B, A);   // 60000 cents: $600 a year

/** Phones: the same table turned on its side, one plan per row, the four terms that differ as columns. */
function Compact({pick, setPick}) {
  const cols = ROWS.slice(0, 4);
  const short = ['Premium a month', 'Deduct­ible', 'Coins­urance', 'Max out of pocket'];
  return <table className="cq-table is-compact">
    <caption className="v2-sr">Available medical plans. Choose one to see whether it is dominated.</caption>
    <thead><tr><th scope="col">Plan</th>{short.map(s => <th key={s} scope="col">{s}</th>)}</tr></thead>
    <tbody>{plans.map(p => <tr key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>
      <th scope="row"><label><input type="radio" name="cq-plan" value={p.id} checked={pick === p.id} onChange={() => setPick(p.id)}/>{p.name}</label></th>
      {cols.map(r => {
        const same = pick && p.id === 'b' && r.key !== 'monthlyPremium' && p[r.key] === A[r.key];
        const more = pick && p.id === 'b' && r.key === 'monthlyPremium';
        return <td key={r.label}>{r.value(p)}{same ? <span className="cq-note">= A</span> : null}{more ? <span className="cq-note is-more">+{money(B.monthlyPremium - A.monthlyPremium)}</span> : null}</td>;
      })}
    </tr>)}</tbody>
  </table>;
}

export default function PlanQuiz({reduced = false}) {
  const [pick, setPick] = useState(null);
  const mode = useInputMode();
  const compact = useMedia(PHONE);
  const chosen = plans.find(p => p.id === pick);
  const beatenBy = chosen ? dominator(chosen) : null;
  const instant = reduced || mode.keyed.current;

  return <div className={`cq${pick ? ' is-picked' : ''}${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <Ask>Pick the plan you’d enroll in.</Ask>
    <Browser address="Benefits, open enrollment: fictional plans" ratio="auto" className="cq-browser">
      <div className="cq-portal">
        <p className="cq-crumb">Benefits / Open enrollment / Medical</p>
        <p className="cq-title">Medical plan selection</p>
        <p className="cq-meta"><span>Coverage level: <b>Employee only</b></span><span>Effective date: <b>01/01/2027</b></span><span>4 available plans</span></p>
        {compact ? <Compact pick={pick} setPick={setPick}/> : <div className="cq-scroll">
          <table className="cq-table">
            <caption className="v2-sr">Available medical plans. Choose one to see whether it is dominated.</caption>
            <thead><tr><th scope="col">Benefit</th>{plans.map(p => <th key={p.id} scope="col" className={pick && p.id === 'b' ? 'is-flag' : ''}>
              {p.name}<small>PPO, in-network</small>
            </th>)}</tr></thead>
            <tbody>
              {ROWS.map(r => <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {plans.map(p => {
                  // once you've picked, B's terms that match A's say so; its premium says by how much
                  const same = pick && p.id === 'b' && r.key && r.key !== 'monthlyPremium' && p[r.key] === A[r.key];
                  const more = pick && p.id === 'b' && r.key === 'monthlyPremium';
                  return <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>
                    {r.value(p)}
                    {same ? <span className="cq-note">Same as A</span> : null}
                    {more ? <span className="cq-note is-more">+{money(B.monthlyPremium - A.monthlyPremium)} vs A</span> : null}
                  </td>;
                })}
              </tr>)}
              <tr className="cq-select">
                <th scope="row">Plan election</th>
                {plans.map(p => <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>
                  <label><input type="radio" name="cq-plan" value={p.id} checked={pick === p.id} onChange={() => setPick(p.id)}/>Select {p.name}</label>
                </td>)}
              </tr>
            </tbody>
          </table>
        </div>}
        <p className="cq-notice">Amounts shown apply to covered in-network services. Premiums do not apply toward your deductible or out-of-pocket maximum. All four plans use the same provider network and covered services.</p>
      </div>
    </Browser>

    <div className="cq-reveal" aria-live="polite">
      {chosen ? <div key={instant ? 'still' : chosen.id} className="cq-answer">
        <p className="cq-verdict">{beatenBy
          ? <><b>{chosen.name}</b> costs <b>{money(GAP)} more a year</b> than {beatenBy.name} for the same coverage: the same deductible, coinsurance and out-of-pocket maximum, and a higher premium.</>
          : <>{chosen.name} isn’t beaten on every term by another plan here. But one plan is: <b>Plan B</b> has Plan A’s deductible, coinsurance and maximum, and costs <b>{money(GAP)} more a year</b>.</>}</p>
        <div className="cq-sum">
          <p className="cq-gap"><span className="cq-gap-n">{money(GAP)}</span><span>a year more on Plan B: {money(annualPremium(B))} in premiums against {money(annualPremium(A))} for Plan A, whatever the year’s bills.</span></p>
          <p className="cq-study"><Ev label="Sourced"/><span>In a study of 23,894 employees choosing from a menu that included plans like Plan B, most picked one. Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017.</span></p>
        </div>
      </div> : <p className="cq-wait">Your pick stays on this page. Nothing is sent or saved.</p>}
    </div>
    <Takeaway show={!!pick} instant={instant}>Every number you needed was in the table. The $600 wasn’t.</Takeaway>
  </div>;
}
