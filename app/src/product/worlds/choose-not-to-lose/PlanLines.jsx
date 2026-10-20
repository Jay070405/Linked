import {useState} from 'react';
import {Ev} from '../../CaseKit';
import {L, useCaseLang} from '../../i18n';
import {annualPremium, dominator, money, plans, premiumDifference, rate} from '../../v2/data/cntl-model.js';
import {Ask, Rule, Takeaway, usd} from './bits';
import {Register, useKeyed} from './print';

/* "Which plan would you pick?", as the receipt's opening line items. The baseline table from the prototype (its
   Baseline screen: the same rows and the same four fictional plans, data/cntl-model.js), printed as a ledger with a
   box to tick per plan. Ticking one prints whether that plan is dominated and by how much a year, from the
   prototype's own all-spend test (dominates()). Nothing is stored or sent. (Re-skin of v2/modules/PlanQuiz.jsx.)
   In Chinese this is where the insurance terms first appear, so each carries its English term once. */

const ROWS = [
  {label: L('Employee premium per month', '员工每月保费（premium）'), short: L('Premium a month', '月保费'), value: p => money(p.monthlyPremium), key: 'monthlyPremium'},
  {label: L('Deductible per year', '每年免赔额（deductible）'), short: L('Deduct­ible', '免赔额'), value: p => money(p.deductible), key: 'deductible'},
  {label: L('Member coinsurance', '共同保险比例（coinsurance）'), short: L('Coins­urance', '共同保险'), value: p => rate(p.coinsuranceBps), key: 'coinsuranceBps'},
  {label: L('Out-of-pocket maximum per year', '每年自付额上限（out-of-pocket maximum）'), short: L('Max out of pocket', '自付额上限'), value: p => money(p.oopMax), key: 'oopMax'},
];
const A = plans[0], B = plans[1];
const GAP = premiumDifference(B, A);   // 60000 cents: $600 a year

const T = {
  ask: L('Tick the plan you’d enroll in.', '勾选你会投保的方案。'),
  crumb: L('Benefits / Open enrollment / Medical', '福利 / 开放投保期（open enrollment）/ 医疗'),
  title: L('Medical plan selection', '医疗方案选择'),
  coverage: L('Coverage level', '保障对象'), employeeOnly: L('Employee only', '仅员工本人'),
  effective: L('Effective date', '生效日期'), effectiveDate: L('01/01/2027', '2027 年 1 月 1 日'),
  available: L('Available plans', '可选方案'),
  caption: L('Available medical plans. Tick one to see whether it is dominated.', '可选的医疗方案。勾选一个，看看它是不是被占优的方案。'),
  plan: L('Plan', '方案'), benefit: L('Benefit', '保障项目'), ppo: L('PPO, in-network', 'PPO，网络内'),
  election: L('Plan election', '方案选择'), select: L('Select ', '选择 '),
  glossary: L('', '表头术语：保费（premium）、免赔额（deductible）、共同保险（coinsurance）、自付额上限（out-of-pocket maximum）。'),
  care: L('Primary care, specialists and prescription drugs, on every plan: the deductible, then that plan’s coinsurance.', '初级保健、专科和处方药，每个方案都一样：先付免赔额，再按这个方案的共同保险比例付。'),
  notice: L('Amounts shown apply to covered in-network services. Premiums do not apply toward your deductible or out-of-pocket maximum. All four plans use the same provider network and covered services.',
    '金额按网络内（in-network）的承保（covered）服务算。保费不算进免赔额，也不算进自付额上限。四个方案用同一个医疗网络，承保服务也一样。'),
  same: L('= A', '同 A'),
  moreThanA: d => L(`+${d} vs A`, `比 A 多 ${d}`),
  wait: L('Your pick stays on this page. Nothing is sent or saved.', '你的选择只留在这页上，不发送，也不保存。'),
  takeaway: L('Every number you needed was in the table. The $600 wasn’t.', '你需要的每个数字表里都有，唯独没有那 $600。'),
  gap: L(`a year more on Plan B: ${money(annualPremium(B))} in premiums against ${money(annualPremium(A))} for Plan A, whatever the year’s bills.`,
    `选 Plan B，每年就多花这么多：它的保费是 ${money(annualPremium(B))}，Plan A 是 ${money(annualPremium(A))}；这一年账单多少都一样。`),
  study: L('In a study of 23,894 employees choosing from a menu that included plans like Plan B, most picked one. Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017.',
    '有一项研究看了 23,894 名员工，他们的方案菜单里有像 Plan B 这样被占优（dominated）的方案，多数人选了这类方案。Bhargava、Loewenstein 和 Sydnor，《经济学季刊》（Quarterly Journal of Economics），2017。'),
};

function Verdict({chosen, beatenBy}) {
  const {zh} = useCaseLang();
  if (zh) return beatenBy
    ? <>保障相同，<b>{chosen.name}</b> 却比 {beatenBy.name} <b>每年多花 {money(GAP)}</b>：免赔额、共同保险和自付额上限都一样，保费更高。</>
    : <>这里没有哪个方案在每项条款上都比 {chosen.name} 好。但有一个方案被比下去了：<b>Plan B</b> 的免赔额、共同保险和上限都和 Plan A 一样，<b>每年却多花 {money(GAP)}</b>。</>;
  return beatenBy
    ? <><b>{chosen.name}</b> costs <b>{money(GAP)} more a year</b> than {beatenBy.name} for the same coverage: the same deductible, coinsurance and out-of-pocket maximum, and a higher premium.</>
    : <>{chosen.name} isn’t beaten on every term by another plan here. But one plan is: <b>Plan B</b> has Plan A’s deductible, coinsurance and maximum, and costs <b>{money(GAP)} more a year</b>.</>;
}

/** What a cell in Plan B's column says once you've picked: which terms match A's, and what the premium costs. */
function Mark({pick, plan, row, compact}) {
  const {t} = useCaseLang();
  if (!pick || plan.id !== 'b') return null;
  const d = money(B.monthlyPremium - A.monthlyPremium);
  if (row.key === 'monthlyPremium') return <span className="cnr-q-mark is-loss">{compact ? `+${d}` : t(T.moreThanA(d))}</span>;
  return plan[row.key] === A[row.key] ? <span className="cnr-q-mark">{t(T.same)}</span> : null;
}

export default function PlanLines({compact = false, still = false, onPick}) {
  const {t, zh} = useCaseLang();
  const [pick, setPick] = useState(null);
  const mode = useKeyed();
  const chosen = plans.find(p => p.id === pick);
  const beatenBy = chosen ? dominator(chosen) : null;
  const instant = still || mode.keyed.current;
  const choose = id => { setPick(id); onPick?.(id); };
  const box = p => <label className="cnr-q-box">
    <input type="radio" name="cnr-plan" value={p.id} checked={pick === p.id} onChange={() => choose(p.id)}/>
    <span>{compact ? p.name : <><span className="cnr-sr">{t(T.select)}</span>{p.name}</>}</span>
  </label>;

  return <div className={`cnr-q${pick ? ' is-picked' : ''}${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <Ask>{t(T.ask)}</Ask>
    <div className="cnr-q-head" data-print="">
      <p className="cnr-q-crumb">{t(T.crumb)}</p>
      <p className="cnr-q-title">{t(T.title)}</p>
    </div>
    <dl className="cnr-q-meta" data-print="">
      <div><dt>{t(T.coverage)}</dt><dd>{t(T.employeeOnly)}</dd></div>
      <div><dt>{t(T.effective)}</dt><dd>{t(T.effectiveDate)}</dd></div>
      <div><dt>{t(T.available)}</dt><dd>4</dd></div>
    </dl>
    <Rule/>
    {compact
      ? <table className="cnr-q-table is-compact" data-print="">
          <caption className="cnr-sr">{t(T.caption)}</caption>
          <thead><tr><th scope="col">{t(T.plan)}</th>{ROWS.map(r => <th key={r.key} scope="col">{t(r.short)}</th>)}</tr></thead>
          <tbody>{plans.map(p => <tr key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>
            <th scope="row">{box(p)}</th>
            {ROWS.map(r => <td key={r.key}>{r.value(p)}<Mark pick={pick} plan={p} row={r} compact/></td>)}
          </tr>)}</tbody>
        </table>
      : <table className="cnr-q-table" data-print="">
          <caption className="cnr-sr">{t(T.caption)}</caption>
          <thead><tr><th scope="col"><span className="cnr-sr">{t(T.benefit)}</span></th>{plans.map(p => <th key={p.id} scope="col" className={pick && p.id === 'b' ? 'is-flag' : ''}>{p.name}<small>{t(T.ppo)}</small></th>)}</tr></thead>
          <tbody>
            {ROWS.map(r => <tr key={r.key}>
              <th scope="row">{t(r.label)}</th>
              {plans.map(p => <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>{r.value(p)}<Mark pick={pick} plan={p} row={r}/></td>)}
            </tr>)}
            <tr className="cnr-q-pick">
              <th scope="row">{t(T.election)}</th>
              {plans.map(p => <td key={p.id} className={`${pick && p.id === 'b' ? 'is-flag' : ''}${pick === p.id ? ' is-mine' : ''}`}>{box(p)}</td>)}
            </tr>
          </tbody>
        </table>}
    {compact && zh ? <p className="cnr-q-note is-small" data-print="">{t(T.glossary)}</p> : null}
    <p className="cnr-q-note" data-print="">{t(T.care)}</p>
    <Rule/>
    <p className="cnr-q-note is-small" data-print="">{t(T.notice)}</p>

    <div className="cnr-q-out" aria-live="polite">
      {chosen ? <div key={instant ? 'still' : chosen.id} className="cnr-q-answer">
        <p className="cnr-q-verdict"><Verdict chosen={chosen} beatenBy={beatenBy}/></p>
        <div className="cnr-q-sum">
          <p className="cnr-q-gap"><span className="cnr-q-gap-n"><Register text={`+${usd(GAP)}`} instant={instant}/></span>
            <span>{t(T.gap)}</span></p>
          <p className="cnr-q-study"><Ev label="Sourced"/><span>{t(T.study)}</span></p>
        </div>
      </div> : <p className="cnr-q-wait">{t(T.wait)}</p>}
    </div>
    <Takeaway show={!!pick} instant={instant}>{t(T.takeaway)}</Takeaway>
  </div>;
}
