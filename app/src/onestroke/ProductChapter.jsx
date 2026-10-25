import {PRODUCT_STATIONS, productCopy, TOKEN_CHIPS, COST_BARS, COST_DIFFERENCE, productAnchors2D} from './product-layout.js';
import {money} from '../product/v2/data/cntl-model.js';
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
    {COST_BARS.map((b,i)=><div key={b.id} className="os-l os-product-bar" data-product-bar={i}><span>{b.label}</span><small>{en?'Premium':'保费'} {money(b.premium)}<br/>{en?'Out-of-pocket':'自付'} {money(b.outOfPocket)}</small></div>)}
    <div className="os-l os-product-flag"><b>{en?`+${money(COST_DIFFERENCE)} a year · same coverage as A`:`每年多 ${money(COST_DIFFERENCE)} · 保障与 A 相同`}</b><span>{en?'Fictional plans · $4,000 in covered bills':'虚构方案 · $4,000 承保医疗费用'}</span></div>
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
