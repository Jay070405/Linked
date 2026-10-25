import {PRODUCT_STATIONS, productCopy, TOKEN_CHIPS, productAnchors2D} from './product-layout.js';
import {money, plans, scenarios} from '../product/v2/data/cntl-model.js';
import {ARDEN_PARTS} from './arden-parts.js';
import {jlStrokes2D} from './line.js';

export function ProductChapter({lang}) {
  const en = lang === 'en', rfa = productCopy(PRODUCT_STATIONS[2],lang);
  return <>
    {PRODUCT_STATIONS.map((s,i)=>{const p=productCopy(s,lang);return <article key={s.slug} className="os-l os-product-caption" data-os-product={i}>
      <div className="os-mono">0{i+1} / 05 · {p.kind}</div><h3>{p.title}</h3><p>{p.summary}</p>
      <a data-h href={`/product/${s.slug}`}>{en?'Open the case ↗':'查看案例 ↗'}</a>
    </article>;})}
    <div className="os-l os-product-code"><code/><div className="os-product-proof"><b className="os-mono">Measured</b><p>{rfa.proof.text}</p></div></div>
    {TOKEN_CHIPS.map((chip,i)=><span className="os-l os-product-chip" data-product-chip={i} key={chip} style={chip.startsWith('#')?{background:chip,color:i===1?'#fff':'#1c1d21'}:undefined}>{chip.startsWith('#')?'':chip}</span>)}
    <span className="os-l os-product-tag" data-product-tag="parking">P</span>
    <span className="os-l os-product-tag" data-product-tag="door">{en?'Door 214':'214 号门'}</span>
    {['projector','board','camera','battery'].map(id=><div key={id} className={`os-l os-arden-part os-arden-${id}`} data-arden-part={id}><i/><b/><span>{ARDEN_PARTS.find(p=>p.id===id)[en?'en':'zh']}</span></div>)}
    <div className="os-l os-arden-part os-arden-hover" data-arden-hover data-lang={lang}><i/><b/><span/></div>
    {plans.map((p,i)=><a href="/product/choose-not-to-lose" className="os-l os-cost-row" data-cost-row={i} key={p.id}>{p.name.toUpperCase()}</a>)}
    {plans.map((p,i)=><span className="os-l os-cost-value" data-cost-value={i} key={p.id}/>)}
    {[0,300000,600000,900000].map((cost,i)=><span className="os-l os-cost-tick" data-cost-tick={i} key={cost}>{cost?money(cost/1000)+'k':money(cost)}</span>)}
    <div className="os-l os-cost-axis" data-cost-axis><div>{en?'YEARLY COST · FICTIONAL PLANS':'全年费用 · 虚构方案'}</div><div>{en?'EACH LINE: PREMIUM ONLY → WORST YEAR':'每条线：只交保费 → 最坏的一年'}</div></div>
    <div className="os-l os-cost-controls" data-cost-controls data-lang={lang} role="group" aria-label={en?'Covered bills':'承保医疗费用'}>
      <span>{en?'COVERED BILLS':'承保医疗费用'}</span>
      {scenarios.map(s=><button key={s.id} type="button" data-cost-scenario={s.id} aria-pressed={s.id==='typical'}>{s.short}</button>)}
    </div>
    <svg className="os-l os-cost-proof" data-cost-proof aria-hidden="true"><defs><mask id="os-cost-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="10000" height="10000"><path data-cost-proof-mask fill="none" stroke="white" strokeWidth="4"/></mask></defs><path data-cost-proof-line fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 4" mask="url(#os-cost-reveal)"/></svg>
    <span className="os-l os-cost-difference" data-cost-difference/>
    <div className="os-l os-cost-flag" data-cost-flag/>
    {PRODUCT_STATIONS.map((s,i)=><a className="os-l os-product-point" data-os-point={i} data-h key={s.slug} href={`/product/${s.slug}`}><i/><span>{s.case.title}</span></a>)}
    <div className="os-l os-product-end"><a href="/product" data-h>{en?'Five products ↗':'五个产品 ↗'}</a><p>{en?'Each case has a prototype you can try.':'每个案例都有一个可以试用的原型。'}</p></div>
  </>;
}

export function ProductMark({lang}) {
  const anchors=productAnchors2D(), labels=[[95,350],[198,505],[220.5,99],[349,197],[382,400]];
  return <a className="oss-product-mark" href="/product" aria-label={lang==='en'?'Five products — explore the cases':'五个产品——查看案例'}>
    <div className="oss-product-diagram"><svg viewBox="-55 65 640 470" role="img" aria-label="JL — Atelier, Last 100 Feet, Ready for agents, Arden, Choose Not to Lose">
      {jlStrokes2D().map((s,i)=><polyline key={i} points={s.map(p=>p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>)}
      {PRODUCT_STATIONS.map((s,i)=><g key={s.slug}><circle cx={anchors[i][0]} cy={anchors[i][1]} r="3" fill="currentColor"/><text x={labels[i][0]} y={labels[i][1]} textAnchor={i===0?'end':i<3?'middle':'start'}>{s.case.title}</text></g>)}
    </svg>{PRODUCT_STATIONS.map((s,i)=><span key={s.slug} className="oss-product-mobile-label" aria-hidden="true" style={{left:`${(labels[i][0]+55)/640*100}%`,top:`${(labels[i][1]-65)/470*100}%`}}>{s.case.title}</span>)}</div>
    <span>{lang==='en'?'Five products ↗':'五个产品 ↗'}</span><p>{lang==='en'?'Each case has a prototype you can try.':'每个案例都有一个可以试用的原型。'}</p>
  </a>;
}
