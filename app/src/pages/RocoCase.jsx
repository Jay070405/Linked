import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Maximize,Minus,Plus,X} from 'lucide-react';
import data,{text} from './roco-model-core';
import {ModelCalculator,RecordLedger} from './RocoModel';
import './roco-pages.css';
import ExpressiveTitle from '../components/ExpressiveTitle';
import spec from './roco-spec-data.json';
import {RocoOpening,RocoChapterNav,RocoSwitch,RocoRouteLens} from './RocoExperience';
import {readingTitles} from './roco-experience-content';
import './roco-experience.css';

const chapters = Object.fromEntries(data.case.chapters.map(chapter=>[chapter.id,chapter]));
const PROTOTYPE = 'https://s5-encounter-lab.linke0704.chatgpt.site';
const DOCS = 'https://dlarkus6pgedgdu9.usttp.larksuite.com/docx/';

function FlowDialog({source,title,lang,onClose}) {
 const en=lang==='en',dialog=useRef(null),stage=useRef(null),image=useRef(null),origin=useRef(null),pan=useRef(null),anchor=useRef(null);
 const [zoom,setZoom]=useState(1),[fit,setFit]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 const scales=[1,1.5,2,3,4,6];
 useEffect(()=>{
  const node=dialog.current;origin.current=document.activeElement;
  const viewport=origin.current?.closest('.portfolio-page-viewport'),overflow=viewport?.style.overflow;
  if(viewport)viewport.style.overflow='hidden';node.showModal();
  const measure=()=>{const box=stage.current,picture=image.current;if(!box||!picture?.naturalWidth)return;setFit(Math.max(1,Math.min(box.clientWidth-32,(box.clientHeight-32)*picture.naturalWidth/picture.naturalHeight)));};
  const observer=new ResizeObserver(measure);observer.observe(stage.current);image.current.addEventListener('load',measure);measure();
  return()=>{observer.disconnect();image.current?.removeEventListener('load',measure);node.close();if(viewport)viewport.style.overflow=overflow;if(origin.current?.isConnected)origin.current.focus({preventScroll:true});};
 },[]);
 useLayoutEffect(()=>{
  const box=stage.current,picture=image.current,point=anchor.current;if(!box||!picture||!point)return;
  box.scrollLeft=Math.max(0,picture.offsetLeft+picture.offsetWidth*point.x-box.clientWidth/2);
  box.scrollTop=Math.max(0,picture.offsetTop+picture.offsetHeight*point.y-box.clientHeight/2);anchor.current=null;
 },[zoom,fit]);
 const resize=(next,point)=>{
  const box=stage.current,picture=image.current;if(!box||!picture||next===zoom)return;
  anchor.current=point||{x:(box.scrollLeft+box.clientWidth/2-picture.offsetLeft)/picture.offsetWidth,y:(box.scrollTop+box.clientHeight/2-picture.offsetTop)/picture.offsetHeight};setZoom(next);
 };
 const change=direction=>resize(scales[Math.max(0,Math.min(scales.length-1,scales.indexOf(zoom)+direction))]);
 return createPortal(<dialog ref={dialog} className="rco-flow-dialog" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}} onKeyDown={event=>{if(event.key==='+'||event.key==='='){event.preventDefault();change(1);}else if(event.key==='-'){event.preventDefault();change(-1);}else if(event.key==='0'){event.preventDefault();resize(1);}}}>
  <header className="rco-flow-toolbar"><p>{title}</p><div role="group" aria-label={en?'Diagram magnification':'流程图缩放'}><button type="button" onClick={()=>change(-1)} disabled={zoom===1||!loaded} aria-label={en?'Zoom out':'缩小流程图'}><Minus size={17}/></button><output aria-live="polite">{Math.round(zoom*100)}%</output><button type="button" onClick={()=>change(1)} disabled={zoom===6||!loaded} aria-label={en?'Zoom in':'放大流程图'}><Plus size={17}/></button><button type="button" onClick={()=>resize(1)} disabled={zoom===1} aria-label={en?'Fit full diagram':'显示完整流程图'}><Maximize size={16}/></button></div><button type="button" autoFocus className="rco-flow-close" onClick={onClose} aria-label={en?'Close diagram':'关闭流程图'}><X size={20}/></button></header>
  <div ref={stage} className={'rco-flow-stage'+(zoom>1?' is-zoomed':'')} tabIndex={0} role="region" aria-label={en?'Diagram; scroll or use arrow keys to explore':'流程图，可滚动或用方向键查看'} onPointerDown={event=>{if(zoom===1||event.pointerType!=='mouse'||event.button!==0)return;pan.current={x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{const start=pan.current;if(!start)return;event.currentTarget.scrollLeft=start.left-(event.clientX-start.x);event.currentTarget.scrollTop=start.top-(event.clientY-start.y);}} onPointerUp={()=>{pan.current=null;}} onPointerCancel={()=>{pan.current=null;}}>
   <div className="rco-flow-canvas"><img ref={image} src={source+'.svg'} alt={title} draggable={false} style={{width:fit?fit*zoom:undefined,visibility:loaded?'visible':'hidden'}} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} onDoubleClick={event=>{const bounds=event.currentTarget.getBoundingClientRect();resize(zoom===1?3:1,{x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height});}}/></div>
   {!loaded&&<p className="rco-flow-status" role="status">{failed?(en?'The diagram could not load. Please close and try again.':'流程图未能加载，请关闭后重试。'):(en?'Loading the full diagram…':'正在加载完整流程图…')}</p>}
  </div>
  <p className="rco-flow-hint">{en?'Zoom with + / −; drag or scroll for details. Press Esc to close.':'＋／− 放大缩小，拖动或滚动查看细节；Esc 关闭。'}</p>
 </dialog>,document.body);
}

function FlowFigure({name,title,lang}) {
 const source=`/assets/roco/current/${name}`,[open,setOpen]=useState(false);
 return <figure className="rco-current-flow"><button type="button" className="rco-flow-open" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-label={`${title} · ${lang==='en'?'open full size':'打开完整图'}`}><img src={`${source}.jpg`} alt={title} width="2560" height="2560" loading="lazy"/></button><figcaption><span>{title}</span><button type="button" onClick={()=>setOpen(true)} aria-haspopup="dialog">{lang==='en'?'Enlarge complete diagram · Chinese':'放大查看完整流程图'} ↗</button></figcaption>{open&&<FlowDialog source={source} title={title} lang={lang} onClose={()=>setOpen(false)}/>}</figure>;
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

function FlowExplorer({lang,reduced}) {
 const en=lang==='en',chapter=chapters['s3-loop'];
 const [index,setIndex]=useState(1),[branch,setBranch]=useState('storybook');
 const labels=en?['Season entrances','Capture & trigger','Storybook reveal','Picture Book','Collect & review']:spec.functions.map(item=>item.title);
 const copy=[
  'F1 and the S3 menu open the same season hall and share its configured dates.',
  'Every throw consumes one ball; only a successful normal-world capture advances the chain and triggers a book.',
  'Touch the Storybook to create the clover encounter; break its shield to reveal the saved candidate, then capture it.',
  'Complete five acts to generate ten candidates, including at least one shiny; each still needs to be caught.',
  'Successful captures enter storage; claim exploration income to buy more balls without consuming collected creatures.',
 ];
 return <>

  <div className="rco-gameplay"><RocoSwitch label={en?'Gameplay steps':'实机操作步骤'} value={index} onChange={setIndex} options={labels.map((label,i)=>[i,label])} reduced={reduced} hover/><div key={index} className={`rco-gameplay-images${index===0?' is-entrance':''}`}>{spec.functions[index].images.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.caption} width={image.width} height={image.height} loading="lazy"/></a><figcaption lang="zh">{image.caption}</figcaption></figure>)}</div><p>{en?copy[index]:spec.functions[index].notes[0]}</p></div>
  <div className="rco-branch"><RocoSwitch label={en?'Inspect event branches':'查看事件分支'} value={branch} onChange={setBranch} options={Object.entries(chapter.branch_detail).map(([key,value])=>[key,text(value.title,lang)])} reduced={reduced} hover/><p>{text(chapter.branch_detail[branch].body,lang)}</p></div>
  <p className="rco-limit">{text(chapter.visible_limit,lang)}</p>
  <FlowFigure name="s3-flow" title={en?'S3 · Complete player–system flow':'S3 · 玩家—系统完整主流程'} lang={lang}/>
  <ConfigTables tables={spec.s3Tables} lang={lang} source={DOCS+'BD1Pdtpd7o5qDsx8v2kuKFVDtC9'}/>
  <details className="rco-config-entry"><summary>{en?'Failure, re-entry and season end':'失败、重入与赛季结束'}<span aria-hidden="true">＋</span></summary><SourceTable rows={spec.s3Exceptions} title={en?'S3 special cases · Chinese':'S3 特殊情况'}/></details>
  <details className="rco-config-entry"><summary>{en?'Game screen wireframes':'游戏界面位置线框'}<span aria-hidden="true">＋</span></summary><p>{en?'Blue: actions. Orange: feedback. Green: status and income.':'蓝色为操作，橙色为反馈，绿色为状态与收益。'}</p><div className="rco-wireframes">{spec.wireframes.map(image=><figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.caption} width={image.width} height={image.height} loading="lazy"/></a><figcaption lang="zh">{image.caption}</figcaption></figure>)}</div></details>
 </>;
}

function SchemeComparison({lang}){
 const en=lang==='en',chapter=chapters['s5-options'];const [choice,setChoice]=useState('B');
 const selected=chapter.options[choice];
 return <div className="rco-schemes"><p className="rco-draft">{text(chapter.design_badge,lang)}</p><div className="rco-scheme-tabs" aria-label={en?'Select proposal':'选择方案'}>{['B','A'].map(key=><button key={key} type="button" onClick={()=>setChoice(key)} aria-pressed={key===choice}><b>{key}</b><span>{text(chapter.options[key].short_name,lang)}<small>{text(chapter.options[key].role,lang)}</small></span><i>↗</i></button>)}</div>
  <div key={'scheme-'+choice} className="rco-scheme-detail"><div className="rco-scheme-intro"><span className="rco-kicker">ORIGINAL PROPOSAL / {choice}</span><h3>{text(selected.full_name,lang)}</h3><p>{text(selected.concept,lang)}</p></div><RocoRouteLens key={choice} choice={choice} loop={text(selected.loop,lang)} lang={lang}/><div className="rco-proposal-rules">{selected.rules.map((rule,i)=><p key={i}><span>0{i+1}</span>{text(rule,lang)}</p>)}<p className="rco-lock-note"><b>{en?'The lock point':'结果锁定点'}</b>{choice==='A'?(en?'Confirming a performance locks its result; previewing does not. An earlier target-shiny generation resets the miss counter; a non-target shiny does not.':'确认演奏时锁定结果，预览不开奖。提前生成目标异色会重置未出计数，非目标异色不会。'):(en?'Locating a zone spends clues and creates an instance. The reward locks only after all three tasks and reward-focus confirmation; opening a preview does not generate it.':'定位会消耗线索并创建调查实例；完成三项任务、确认奖励方向后才锁定奖励，预览不生成结果。')}</p></div></div>
  <FlowFigure key={'flow-'+choice} name={`s5-${choice.toLowerCase()}-flow`} title={en?`S5 ${choice} · Complete player–system flow`:`S5 方案 ${choice} · 玩家—系统完整主流程`} lang={lang}/>
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
 return <div className="rco-prototype"><div className="rco-prototype-heading"><div><span className="rco-kicker">S5 / PLAY THE RULES</span><h3>{en?'Try both proposals.':'试一轮捕捉与调查。'}</h3><p>{en?'Existing v1.2 demo · Chinese · Desktop recommended. It demonstrates selected interactions; the current proposal above is the complete specification.':'既有v1.2演示原型 · 中文 · 建议桌面体验；用于演示部分交互，完整规则以本页最新版提案为准。'}</p></div><div className="rco-prototype-actions"><button type="button" className="rco-solid-link" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?(en?'Close embedded prototype':'收起页面内原型'):(en?'Run the prototype':'在这里体验原型')} {open?'−':'↗'}</button><a href={local} target="_blank" rel="noreferrer">{en?'Open in a new tab':'新窗口完整体验'} ↗</a></div></div>{open&&<div className={'rco-prototype-frame is-'+status}><div className="rco-prototype-stage"><iframe ref={frame} key={attempt} src={local} onLoad={checkReady} onError={()=>setStatus('error')} title={en?'S5 original two-concept interactive sandbox, Chinese':'S5 原创双方案交互沙盒 · 中文'} allow="fullscreen" tabIndex={status==='ready'?0:-1}/>{status!=='ready'&&<div className="rco-prototype-status" role="status"><span className="rco-kicker">S5 / {status==='error'?'RETRY':'LOADING'}</span><h4>{status==='error'?(en?'The prototype did not finish loading.':'原型暂时未能完成加载。'):(en?'Opening the original sandbox…':'正在启动原始双方案沙盒…')}</h4><p>{status==='error'?(en?'Your saved progress has not been cleared. Retry here or open the local standalone page.':'已有进度没有清空。可以重试，或直接打开本地完整页面。'):(en?'Preparing the original rules, interface and local progress.':'正在准备原有规则、界面和本机进度。')}</p>{status==='error'&&<div><button type="button" className="rco-solid-link" onClick={()=>{setStatus('loading');setAttempt(value=>value+1)}}>{en?'Retry':'重新加载'} ↺</button><a href={local} target="_blank" rel="noreferrer">{en?'Open standalone':'独立打开'} ↗</a></div>}</div>}</div><p className="rco-fine">{en?'The same existing rules and artwork; local packaging changes loading paths only. Saves on this origin are separate from the original hosted site.':'沿用原有规则与素材，本地打包只调整加载路径。这里的存档与原始托管站点分别保存在各自域名下。'} <a href={PROTOTYPE} target="_blank" rel="noreferrer">{en?'Original hosted version':'原始托管版本'} ↗</a></p></div>}</div>;
}

export default function RocoCase({lang='zh',reduced=false,onNavigate}) {
 const en=lang==='en',page=useRef(null),[active,setActive]=useState('roco-overview');
 const jumpTarget=useRef(null),scrollAnimation=useRef(null),syncChapter=useRef(null);
 const overview=chapters.contribution,evidence=chapters.evidence,s5=chapters['s5-options'],prototype=chapters.prototype,review=chapters.review;
 const nav=[['roco-overview',en?'Overview':'概述'],['roco-s3',en?'S3 loop':'S3 现状'],['roco-evidence',en?'Evidence':'观察与投入'],['roco-s5',en?'S5 A / B':'S5 双方案'],['roco-calc',en?'Model':'模型'],['roco-review',en?'Review':'验证']];
 useEffect(()=>{
  const node=page.current,root=node?.closest('.portfolio-page-viewport');if(!root)return;
  const sections=[...node.querySelectorAll('.rco-case-chapter')];let frame=0;
  const update=()=>{frame=0;if(jumpTarget.current)return;const nav=node.querySelector('.rco-chapter-nav'),line=root.getBoundingClientRect().top+parseFloat(getComputedStyle(nav).top)+nav.offsetHeight+80;let current=sections[0]?.id;for(const section of sections){if(section.getBoundingClientRect().top<=line)current=section.id;else break;}if(current)setActive(previous=>previous===current?previous:current);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const interrupt=()=>{if(!scrollAnimation.current)return;scrollAnimation.current();schedule();};
  const onKey=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)&&!event.target.closest('input,textarea,select,[contenteditable="true"]')&&!(event.key===' '&&event.target.closest('button')))interrupt();};
  syncChapter.current=schedule;
  root.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  for(const event of ['wheel','touchstart','pointerdown'])root.addEventListener(event,interrupt,{passive:true});root.addEventListener('keydown',onKey);update();
  return()=>{scrollAnimation.current?.();syncChapter.current=null;root.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);for(const event of ['wheel','touchstart','pointerdown'])root.removeEventListener(event,interrupt);root.removeEventListener('keydown',onKey);if(frame)cancelAnimationFrame(frame);};
 },[]);
 const jump=id=>{
  const node=page.current?.querySelector(`#${id}`),root=page.current?.closest('.portfolio-page-viewport'),nav=page.current?.querySelector('.rco-chapter-nav');if(!node||!root)return;
  scrollAnimation.current?.();setActive(id);jumpTarget.current=id;
  const destination=()=>{const offset=(nav?parseFloat(getComputedStyle(nav).top)+nav.offsetHeight:160)+20;return Math.max(0,Math.min(root.scrollHeight-root.clientHeight,root.scrollTop+node.getBoundingClientRect().top-root.getBoundingClientRect().top-offset));};
  const start=root.scrollTop,target=destination(),duration=Math.min(420,Math.max(220,Math.abs(target-start)*.08));
  if(reduced||Math.abs(target-start)<2){root.scrollTo({top:target,behavior:'instant'});jumpTarget.current=null;return;}
  let frame=0,began=null;
  const finish=()=>{if(frame)cancelAnimationFrame(frame);jumpTarget.current=null;scrollAnimation.current=null;};
  // Keep the clicked chapter selected while passing other sections. A new click
  // cancels this frame loop, and direct scrolling immediately gives control back.
  const tick=now=>{if(began===null)began=now;const progress=Math.min(1,(now-began)/duration),eased=1-Math.pow(1-progress,3);root.scrollTo({top:start+(destination()-start)*eased,behavior:'instant'});if(progress<1)frame=requestAnimationFrame(tick);else{finish();syncChapter.current?.();}};
  scrollAnimation.current=finish;frame=requestAnimationFrame(tick);
 };
 return <article ref={page} className={`rco-page rco-case-page${reduced?' rco-reduced':''}`} data-nav-tone="light" lang={en?'en':'zh-CN'}>
  <RocoOpening lang={lang} reduced={reduced} onRead={jump} onNavigate={onNavigate}/>
  <RocoChapterNav items={nav} active={active} onSelect={jump} lang={lang} reduced={reduced}/>
  <Section id="roco-overview" number="01" label={en?'THE CONTRIBUTION':'项目概述'} title={text(readingTitles.contribution,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(overview.body,lang)}</p><div className="rco-contribution-grid">{overview.contributions.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(overview.scope_note,lang)}</p></Section>
  <Section id="roco-s3" number="02" label="S3 / THE CURRENT LOOP" title={text(readingTitles['s3-loop'],lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(chapters['s3-loop'].judgment,lang)}</p><FlowExplorer lang={lang} reduced={reduced}/></Section>
  <Section id="roco-evidence" number="03" label={en?'EVIDENCE & COST':'观察与投入'} title={text(readingTitles.evidence,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(evidence.body,lang)}</p><div className="rco-evidence-metrics">{evidence.metrics.map(metric=><div key={metric.value}><strong>{metric.value}</strong><span>{text(metric.label,lang)}</span></div>)}</div><p className="rco-fine">{text(evidence.metric_caption,lang)}</p><p className="rco-evidence-judgment">{text(evidence.judgment,lang)}</p><div className="rco-insight-grid">{evidence.expanded.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(evidence.visible_limit,lang)}</p><RecordLedger lang={lang} reduced={reduced} observedOnly/></Section>
  <Section id="roco-s5" number="04" label="S5 / TWO DIRECTIONS" title={text(readingTitles['s5-options'],lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(s5.judgment,lang)}</p><p className="rco-prose">{text(s5.body,lang)}</p><SchemeComparison lang={lang}/><Prototype lang={lang}/></Section>
  <Section id="roco-calc" number="05" label={en?'THE WORKING MODEL':'可检查的模型'} title={en?'What does a different input change?':'换一种投入，会改变什么？'} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{en?'Try a scenario before opening the full ledger. The S3 model uses observed coefficients; it does not calculate S5 guarantees.':'先调整一组情景，再进入完整台账。这里用 S3 观察系数演算投入，不计算 S5 原创保障。'}</p><ModelCalculator lang={lang} reduced={reduced} compact/><div className="rco-model-invitation"><p>{en?'Inspect all four presets, 20 ledger entries, exact formulas and their limits.':'继续核对四组预设、20 条台账、完整公式与适用边界。'}</p><button type="button" className="rco-solid-link" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Open the full model':'进入完整模型'} ↗</button></div></Section>
  <Section id="roco-review" number="06" label={en?'RULES & VERIFICATION':'规则与验证'} title={text(readingTitles.prototype,lang)} className="rco-case-chapter" reduced={reduced}><p className="rco-lead">{text(prototype.judgment,lang)}</p><div className="rco-state-line" aria-label={en?'Outcome state separation':'结果状态分离'}>{(en?['Generate once','Reveal the result','Capture to collect']:['一次生成','揭晓结果','捕获入库']).map((label,i)=><div key={label}><span>0{i+1}</span><b>{label}</b>{i<2&&<i aria-hidden="true">→</i>}</div>)}</div><div className="rco-rule-grid">{prototype.rules.map((item,i)=><article key={i}><span>0{i+1}</span><h3>{text(item.title,lang)}</h3><p>{text(item.body,lang)}</p></article>)}</div><p className="rco-limit">{text(prototype.scope,lang)}</p><div className="rco-review-columns"><div><span className="rco-kicker">COMPLETED / SCOPE</span><h3>{en?'What is documented.':'已经完成的工作。'}</h3><ul>{review.completed.map((item,i)=><li key={i}>{text(item,lang)}</li>)}</ul><p className="rco-fine">{text(review.validation_note,lang)}</p></div><div><span className="rco-kicker">NEXT / PLAYER VALIDATION</span><h3>{en?'What still needs testing.':'还需要真实试玩。'}</h3>{review.next_validation.map((item,i)=><p key={i}><b>{text(item.title,lang)}</b>{text(item.body,lang)}</p>)}</div></div><div className="rco-resources"><div><span className="rco-kicker">READ THE SOURCE</span><h3>{en?'Source documents and records.':'继续查看原始资料。'}</h3><p>{text(review.closing,lang)}</p></div><div className="rco-resource-list">{data.case.resources.map((resource,i)=><a href={resource.id==='prototype'?'/assets/roco/s5/index.html':resource.url} key={resource.id} target="_blank" rel="noreferrer"><span>{String(i+1).padStart(2,'0')}</span><div><b>{text(resource.title,lang)}</b><small>{resource.id==='prototype'?(en?'Chinese · Existing interactive sandbox':'中文 · 已有双方案交互沙盒'):text(resource.detail,lang)}</small></div><i>↗</i></a>)}</div></div>{en&&<p className="rco-fine">English item and system names are descriptive portfolio translations. Source diagrams, gameplay records and linked specifications retain their original Chinese text.</p>}</Section>
  <footer className="rco-page-footer rco-width"><span>{en?'ROCO KINGDOM: WORLD / SHINY SYSTEMS':'洛克王国：世界 · 异色系统研究'}</span><button type="button" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Explore the numbers':'进入模型，核对数字'} ↗</button></footer>
 </article>;
}
