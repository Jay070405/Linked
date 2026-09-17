import {useEffect,useRef,useState} from 'react';
import data,{text} from './roco-model-core';
import {ModelCalculator,RecordLedger} from './RocoModel';
import './roco-pages.css';
import ExpressiveTitle from '../components/ExpressiveTitle';
import spec from './roco-spec-data.json';

const chapters = Object.fromEntries(data.case.chapters.map(chapter=>[chapter.id,chapter]));
const PROTOTYPE = 'https://s5-encounter-lab.linke0704.chatgpt.site';
const DOCS = 'https://dlarkus6pgedgdu9.usttp.larksuite.com/docx/';

function FlowFigure({name,title,lang}) {
 const source=`/assets/roco/current/${name}`;
 return <figure className="rco-current-flow"><a href={`${source}.svg`} target="_blank" rel="noreferrer" aria-label={`${title} — ${lang==='en'?'open full size':'打开完整图'}`}><img src={`${source}.jpg`} alt={title} loading="lazy"/></a><figcaption><span>{title}</span><a href={`${source}.svg`} target="_blank" rel="noreferrer">{lang==='en'?'Open full-size diagram · Chinese':'放大查看完整流程图'} ↗</a></figcaption></figure>;
}

function SourceTable({rows,title,config=false}) {
 const headerCount=config?3:1;
 return <div className="rco-table-scroll rco-spec-table" tabIndex={0} role="region" aria-label={title}><table><caption>{title}</caption><thead>{rows.slice(0,headerCount).map((row,i)=><tr key={i}>{row.map((cell,j)=><th scope="col" className={config&&j===row.length-1?'rco-note':''} key={j}>{cell}</th>)}</tr>)}</thead><tbody>{rows.slice(headerCount).map((row,i)=><tr key={i}>{row.map((cell,j)=><td className={config&&j===row.length-1?'rco-note':''} key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function ConfigTables({tables,lang,source}) {
 const en=lang==='en';
 return <div className="rco-config"><div className="rco-config-heading"><h3>{en?'Configuration tables':'配置表'}</h3><a href={source} target="_blank" rel="noreferrer">{en?'Read the specification':'查看飞书原文'} ↗</a></div><p className="rco-fine">{en?'Chinese source tables: meaning / program field / data type. IDs and unpublished values are labeled examples; yellow cells are designer notes.':'中文含义／程序字段／数据类型三行表头；内部编号和未公开数值为示例，黄色列为策划备注。'}</p>{tables.map(table=><details className="rco-config-entry" key={table.title}><summary>{table.title}<span aria-hidden="true">＋</span></summary><p lang="zh">{table.notes[0]}</p><SourceTable rows={table.rows} title={table.title} config/>{table.notes.slice(1).map((note,i)=><p lang="zh" key={i}>{note}</p>)}</details>)}</div>;
}

function Section({id,number:sectionNumber,label,title,children,className='',reduced=false}){
 return <section id={id} className={`rco-section rco-width ${className}`}><div className="rco-section-label"><b>{sectionNumber}</b><span>{label}</span></div><div className="rco-section-body"><h2><ExpressiveTitle reduced={reduced}>{title}</ExpressiveTitle></h2>{children}</div></section>;
}

function FlowExplorer({lang}) {
 const en=lang==='en',chapter=chapters['s3-loop'];
 const [index,setIndex]=useState(0),[branch,setBranch]=useState('storybook');
 const labels=en?['Season entrances','Capture & trigger','Storybook reveal','Picture Book','Collect & review']:spec.functions.map(item=>item.title);
 const copy=[
  'F1 and the S3 menu open the same season hall and share its configured dates.',
  'Every throw consumes one ball; only a successful normal-world capture advances the chain and triggers a book.',
  'Touch the Storybook to create the clover encounter; break its shield to reveal the saved candidate, then capture it.',
  'Complete five acts to generate ten candidates, including at least one shiny; each still needs to be caught.',
  'Successful captures enter storage; claim exploration income to buy more balls without consuming collected creatures.',
 ];
 return <>
  <FlowFigure name="s3-flow" title={en?'S3 · Player–system flow':'S3 · 玩家—系统完整主流程'} lang={lang}/>
  <div className="rco-gameplay"><div className="rco-tabs" aria-label={en?'Gameplay steps':'实机操作步骤'}>{labels.map((label,i)=><button type="button" key={label} aria-pressed={index===i} onClick={()=>setIndex(i)}>{label}</button>)}</div><div className={`rco-gameplay-images${index===0?' is-entrance':''}`}>{spec.functions[index].images.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.caption} width={image.width} height={image.height} loading="lazy"/></a><figcaption lang="zh">{image.caption}</figcaption></figure>)}</div><p>{en?copy[index]:spec.functions[index].notes[0]}</p></div>
  <div className="rco-branch"><div className="rco-tabs" aria-label={en?'Inspect event branches':'查看事件分支'}>{Object.entries(chapter.branch_detail).map(([key,value])=><button key={key} type="button" aria-pressed={key===branch} onClick={()=>setBranch(key)}>{text(value.title,lang)}</button>)}</div><p>{text(chapter.branch_detail[branch].body,lang)}</p></div>
  <p className="rco-limit">{text(chapter.visible_limit,lang)}</p>
  <ConfigTables tables={spec.s3Tables} lang={lang} source={DOCS+'BD1Pdtpd7o5qDsx8v2kuKFVDtC9'}/>
  <details className="rco-config-entry"><summary>{en?'Failure, re-entry and season end':'失败、重入与赛季结束'}<span aria-hidden="true">＋</span></summary><SourceTable rows={spec.s3Exceptions} title={en?'S3 special cases · Chinese':'S3 特殊情况'}/></details>
  <details className="rco-config-entry"><summary>{en?'Game screen wireframes':'游戏界面位置线框'}<span aria-hidden="true">＋</span></summary><p>{en?'Blue: actions. Orange: feedback. Green: status and income.':'蓝色为操作，橙色为反馈，绿色为状态与收益。'}</p><div className="rco-wireframes">{spec.wireframes.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.caption} width={image.width} height={image.height} loading="lazy"/></a><figcaption lang="zh">{image.caption}</figcaption></figure>)}</div></details>
 </>;
}

function SchemeComparison({lang}){
 const en=lang==='en',chapter=chapters['s5-options'];const [choice,setChoice]=useState('B');
 const selected=chapter.options[choice];
 return <div className="rco-schemes"><p className="rco-draft">{text(chapter.design_badge,lang)}</p><div className="rco-scheme-tabs" aria-label={en?'Select proposal':'选择方案'}>{['B','A'].map(key=><button key={key} type="button" onClick={()=>setChoice(key)} aria-pressed={key===choice}><b>{key}</b><span>{text(chapter.options[key].short_name,lang)}<small>{text(chapter.options[key].role,lang)}</small></span><i>↗</i></button>)}</div>
  <div className="rco-scheme-detail"><div className="rco-scheme-intro"><span className="rco-kicker">ORIGINAL PROPOSAL / {choice}</span><h3>{text(selected.full_name,lang)}</h3><p>{text(selected.concept,lang)}</p></div><ol className="rco-proposal-loop">{text(selected.loop,lang).split(' → ').map((step,i)=><li key={step}><span>0{i+1}</span><b>{step}</b>{i<5&&<i aria-hidden="true">↓</i>}</li>)}</ol><div className="rco-proposal-rules">{selected.rules.map((rule,i)=><p key={i}><span>0{i+1}</span>{text(rule,lang)}</p>)}<p className="rco-lock-note"><b>{en?'The lock point':'结果锁定点'}</b>{choice==='A'?(en?'Confirming a performance locks its result; previewing does not. An earlier target-shiny generation resets the miss counter; a non-target shiny does not.':'确认演奏时锁定结果，预览不开奖。提前生成目标异色会重置未出计数，非目标异色不会。'):(en?'Locating a zone spends clues and creates an instance. The reward locks only after all three tasks and reward-focus confirmation; opening a preview does not generate it.':'定位会消耗线索并创建调查实例；完成三项任务、确认奖励方向后才锁定奖励，预览不生成结果。')}</p></div></div>
  <FlowFigure name={`s5-${choice.toLowerCase()}-flow`} title={en?`S5 ${choice} · Player–system flow`:`S5 方案 ${choice} · 玩家—系统主流程`} lang={lang}/>
  <ConfigTables key={choice} tables={spec.s5Tables.filter((table,i)=>i<3||table.title.startsWith(choice))} lang={lang} source={DOCS+'Pg7ddGzZLoihiaxgHaouBo87txh'}/>
  <details className="rco-config-entry"><summary>{en?'Special cases · A / B':'特殊情况 · A / B'}<span aria-hidden="true">＋</span></summary><SourceTable rows={spec.s5Exceptions} title={en?'S5 special cases · Chinese':'S5 特殊情况'}/></details>
  <div className="rco-table-scroll rco-comparison"><table><thead><tr><th>{en?'Design decision':'设计取舍'}</th><th>A / {en?'Woodland Echoes':'林间回响'}</th><th>B / {en?'Migration':'生态迁徙'}</th></tr></thead><tbody>{chapter.comparison.map((row,i)=><tr key={i}><th>{text(row.dimension,lang)}</th><td>{text(row.A,lang)}</td><td>{text(row.B,lang)}</td></tr>)}</tbody></table></div><p className="rco-limit">{text(chapter.visible_limit,lang)}</p>
 </div>;
}

function Prototype({lang}){
 const en=lang==='en',frame=useRef(null);const [open,setOpen]=useState(false),[status,setStatus]=useState('idle'),[attempt,setAttempt]=useState(0);
 const local='/assets/roco/s5/index.html';
 useEffect(()=>{
  if(!open)return;setStatus('loading');
  const timeout=setTimeout(()=>setStatus(current=>current==='loading'?'error':current),12000);
  const receive=event=>{if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='jay-s5-local')return;if(event.data.type==='s5-ready'){clearTimeout(timeout);setStatus('ready')}else if(event.data.type==='s5-error'){clearTimeout(timeout);setStatus('error')}};
  window.addEventListener('message',receive);return()=>{clearTimeout(timeout);window.removeEventListener('message',receive)};
 },[open,attempt]);
 const checkReady=()=>{try{if(frame.current?.contentDocument?.documentElement.dataset.s5Ready==='true')setStatus('ready')}catch{setStatus('error')}};
 return <div className="rco-prototype"><div className="rco-prototype-heading"><div><span className="rco-kicker">S5 / PLAY THE RULES</span><h3>{en?'Put both loops to work.':'把两套规则，实际走一遍。'}</h3><p>{en?'Existing v1.2 demo · Chinese · Desktop recommended. It demonstrates selected interactions; the current proposal above is the complete specification.':'既有v1.2演示原型 · 中文 · 建议桌面体验；用于演示部分交互，完整规则以本页最新版提案为准。'}</p></div><div className="rco-prototype-actions"><button type="button" className="rco-solid-link" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?(en?'Close embedded prototype':'收起页面内原型'):(en?'Run the prototype':'在这里体验原型')} {open?'−':'↗'}</button><a href={local} target="_blank" rel="noreferrer">{en?'Open in a new tab':'新窗口完整体验'} ↗</a></div></div>{open&&<div className={'rco-prototype-frame is-'+status}><div className="rco-prototype-stage"><iframe ref={frame} key={attempt} src={local} onLoad={checkReady} onError={()=>setStatus('error')} title={en?'S5 original two-concept interactive sandbox, Chinese':'S5 原创双方案交互沙盒 · 中文'} allow="fullscreen" tabIndex={status==='ready'?0:-1}/>{status!=='ready'&&<div className="rco-prototype-status" role="status"><span className="rco-kicker">S5 / {status==='error'?'RETRY':'LOADING'}</span><h4>{status==='error'?(en?'The prototype did not finish loading.':'原型暂时未能完成加载。'):(en?'Opening the original sandbox…':'正在启动原始双方案沙盒…')}</h4><p>{status==='error'?(en?'Your saved progress has not been cleared. Retry here or open the local standalone page.':'已有进度没有清空。可以重试，或直接打开本地完整页面。'):(en?'Preparing the original rules, interface and local progress.':'正在准备原有规则、界面和本机进度。')}</p>{status==='error'&&<div><button type="button" className="rco-solid-link" onClick={()=>{setStatus('loading');setAttempt(value=>value+1)}}>{en?'Retry':'重新加载'} ↺</button><a href={local} target="_blank" rel="noreferrer">{en?'Open standalone':'独立打开'} ↗</a></div>}</div>}</div><p className="rco-fine">{en?'The same existing rules and artwork; local packaging changes loading paths only. Saves on this origin are separate from the original hosted site.':'沿用原有规则与素材，本地打包只调整加载路径。这里的存档与原始托管站点分别保存在各自域名下。'} <a href={PROTOTYPE} target="_blank" rel="noreferrer">{en?'Original hosted version':'原始托管版本'} ↗</a></p></div>}</div>;
}

export default function RocoCase({lang='zh',reduced=false,onNavigate}) {
 const en=lang==='en',page=useRef(null),[active,setActive]=useState('roco-overview');
 const overview=chapters.contribution,evidence=chapters.evidence,s5=chapters['s5-options'],prototype=chapters.prototype,review=chapters.review;
 const nav=[['roco-overview',en?'Overview':'概述'],['roco-s3',en?'S3 loop':'S3 现状'],['roco-evidence',en?'Evidence':'观察与投入'],['roco-s5',en?'S5 A / B':'S5 双方案'],['roco-calc',en?'Model':'模型'],['roco-review',en?'Review':'验证']];
 useEffect(()=>{
  const node=page.current;if(!node)return;const root=node.closest('.portfolio-page-viewport');
  const observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])setActive(visible[0].target.id);},{root,rootMargin:'-18% 0px -55% 0px',threshold:0});
  node.querySelectorAll('.rco-case-chapter').forEach(section=>observer.observe(section));return()=>observer.disconnect();
 },[]);
 const jump=id=>{setActive(id);page.current?.querySelector(`#${id}`)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});};
 return <article ref={page} className={`rco-page rco-case-page${reduced?' rco-reduced':''}`} data-nav-tone="light">
  <header className="rco-case-header rco-width"><div className="rco-case-meta"><span>ROCO KINGDOM: WORLD / SYSTEMS DESIGN</span><span>{en?'Personal study · Original proposal':'个人系统研究 · 原创提案'}</span></div><div className="rco-case-title"><h1><ExpressiveTitle reduced={reduced}>{en?<>From waiting<br/>to <em>choosing.</em></>:<>从等待结果，<br/>到<em>规划路线。</em></>}</ExpressiveTitle></h1><div><h2>{en?'Shiny encounters, examined.':'洛克王国：世界 · 异色系统'}</h2><p>{en?'S3 gameplay, configuration and resource loops; two original S5 directions.':'S3玩法、配置与资源循环，以及S5双方案提案。'}</p><p className="rco-fine">{en?'Synced with Lark · 17 Sep 2026':'飞书内容同步 · 2026.09.17'}</p><div className="rco-case-top-links"><button type="button" onClick={()=>jump('roco-s5')}>{en?'Compare the proposals':'查看双方案'} ↓</button><button type="button" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Open the model':'打开模型'} ↗</button></div></div></div><figure className="rco-cover"><img src="/assets/projects/roco-cover.png" alt={en?'Personal S5 forest concept cover with fantasy creatures':'个人 S5 森林概念封面与幻想精灵'}/><figcaption><span>01 / CONCEPT COVER</span><span>{en?'Personal S5 concept · Unofficial · AI-assisted cover':'个人 S5 概念 · 非官方 · AI 辅助封面'}</span></figcaption></figure></header>
  <nav className="rco-chapter-nav" aria-label={en?'Case study chapters':'案例章节'}><div className="rco-width">{nav.map(([id,label],i)=><button type="button" key={id} aria-current={active===id?'location':undefined} onClick={()=>jump(id)}><span>0{i+1}</span>{label}</button>)}</div></nav>
  <Section id="roco-overview" number="01" label={en?'THE CONTRIBUTION':'项目概述'} title={text(overview.title,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(overview.body,lang)}</p><div className="rco-contribution-grid">{overview.contributions.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(overview.scope_note,lang)}</p></Section>
  <Section id="roco-s3" number="02" label="S3 / THE CURRENT LOOP" title={text(chapters['s3-loop'].title,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(chapters['s3-loop'].judgment,lang)}</p><FlowExplorer lang={lang}/></Section>
  <Section id="roco-evidence" number="03" label={en?'EVIDENCE & COST':'观察与投入'} title={text(evidence.title,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(evidence.body,lang)}</p><div className="rco-evidence-metrics">{evidence.metrics.map(metric=><div key={metric.value}><strong>{metric.value}</strong><span>{text(metric.label,lang)}</span></div>)}</div><p className="rco-fine">{text(evidence.metric_caption,lang)}</p><p className="rco-evidence-judgment">{text(evidence.judgment,lang)}</p><div className="rco-insight-grid">{evidence.expanded.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(evidence.visible_limit,lang)}</p><RecordLedger lang={lang} observedOnly/></Section>
  <Section id="roco-s5" number="04" label="S5 / TWO DIRECTIONS" title={text(s5.title,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(s5.judgment,lang)}</p><p className="rco-prose">{text(s5.body,lang)}</p><SchemeComparison lang={lang}/><Prototype lang={lang}/></Section>
  <Section id="roco-calc" number="05" label={en?'THE WORKING MODEL':'可检查的模型'} title={en?'What does a different input change?':'换一种投入，会改变什么？'} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{en?'Try a scenario before opening the full ledger. The S3 model uses observed coefficients; it does not calculate S5 guarantees.':'先调整一组情景，再进入完整台账。这里用 S3 观察系数演算投入，不计算 S5 原创保障。'}</p><ModelCalculator lang={lang} compact/><div className="rco-model-invitation"><p>{en?'Inspect all four presets, 20 ledger entries, exact formulas and their limits.':'继续核对四组预设、20 条台账、完整公式与适用边界。'}</p><button type="button" className="rco-solid-link" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Open the full model':'进入完整模型'} ↗</button></div></Section>
  <Section id="roco-review" number="06" label={en?'RULES & VERIFICATION':'规则与验证'} title={text(prototype.title,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(prototype.judgment,lang)}</p><div className="rco-state-line" aria-label={en?'Outcome state separation':'结果状态分离'}>{(en?['Generate once','Reveal the result','Capture to collect']:['一次生成','揭晓结果','捕获入库']).map((label,i)=><div key={label}><span>0{i+1}</span><b>{label}</b>{i<2&&<i aria-hidden="true">→</i>}</div>)}</div><div className="rco-rule-grid">{prototype.rules.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(prototype.scope,lang)}</p><div className="rco-review-columns"><div><span className="rco-kicker">COMPLETED / SCOPE</span><h3>{en?'What is documented.':'已经完成的工作。'}</h3><ul>{review.completed.map((item,i)=><li key={i}>{text(item,lang)}</li>)}</ul><p className="rco-fine">{text(review.validation_note,lang)}</p></div><div><span className="rco-kicker">NEXT / PLAYER VALIDATION</span><h3>{en?'What still needs testing.':'还需要真实试玩。'}</h3>{review.next_validation.map((item,i)=><p key={i}><b>{text(item.title,lang)}</b>{text(item.body,lang)}</p>)}</div></div><div className="rco-resources"><div><span className="rco-kicker">READ THE SOURCE</span><h3>{en?'Follow the evidence.':'继续查看原始资料。'}</h3><p>{text(review.closing,lang)}</p></div><div className="rco-resource-list">{data.case.resources.map((resource,i)=><a href={resource.id==='prototype'?'/assets/roco/s5/index.html':resource.url} key={resource.id} target="_blank" rel="noreferrer"><span>{String(i+1).padStart(2,'0')}</span><div><b>{text(resource.title,lang)}</b><small>{resource.id==='prototype'?(en?'Chinese · Existing interactive sandbox':'中文 · 已有双方案交互沙盒'):text(resource.detail,lang)}</small></div><i>↗</i></a>)}</div></div>{en&&<p className="rco-fine">English item and system names are descriptive portfolio translations. Source diagrams, gameplay records and linked specifications retain their original Chinese text.</p>}</Section>
  <footer className="rco-page-footer rco-width"><span>{en?'A CLEARER RULE. A MORE DELIBERATE CHOICE.':'规则更清楚，选择才成立。'}</span><button type="button" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Explore the numbers':'进入模型，核对数字'} ↗</button></footer>
 </article>;
}
