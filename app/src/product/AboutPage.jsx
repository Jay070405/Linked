import {useEffect, useId, useRef, useState} from 'react';
import {author, otherProjects} from '../portfolioData';
import {ContactRows} from '../components/Contact';
import {L, useCaseLang} from './i18n';
import {ThemeToggle, useCaseTheme} from './worlds/arden/theme';
import './worlds/arden/arden.css';
import './about.css';

const NODES=[L('Goal','目标'),L('Rules','规则'),L('Feedback','反馈')];
export const LOOP_CASES={
  game:[
    {title:L('Reward goals for a live season','为持续运营的赛季设计奖励目标'),meta:L('League of Legends · systems study','英雄联盟 · 系统研究'),href:'/systems/league-of-legends'},
    {title:L('State and settlement rules, built as a playable prototype','把状态与结算规则做成能玩的原型'),meta:L('Roco Kingdom: World · systems study','洛克王国：世界 · 系统研究'),href:'/systems/roco'},
    {title:L('Input and difficulty tuned through playtests','通过试玩，调整输入方式和难度'),meta:L('GDC alt.ctrl · team project','GDC alt.ctrl · 团队项目'),href:'/systems#alt-ctrl'},
  ],
  product:[
    {title:L('A courier reaches the door without calling','让骑手不用打电话，也能找到门口'),meta:L('Last 100 Feet · service design','Last 100 Feet · 服务设计'),href:'/product/last-100-feet'},
    {title:L('An artist can’t sell a print size that will print blurry','让画师上架的每个尺寸，都能印得清楚'),meta:L('Atelier · print studio','Atelier · 印品工作室'),href:'/product/atelier'},
    {title:L('37 coding-agent builds, each one counted','37 次 coding agent 构建，每次都有记录'),meta:L('Ready for agents · research','Ready for agents · 研究'),href:'/product/ready-for-agents',measured:true},
  ],
};
const RING='M300 65 A220 85 0 1 1 300 235 A220 85 0 1 1 300 65';
const POSITIONS=[[300,65],[490.5,192.5],[109.5,192.5]];

export default function AboutPage({reduced=false}) {
  const {lang,t,htmlLang,zh}=useCaseLang(), {theme,toggle,fading}=useCaseTheme(reduced);
  const [mode,setMode]=useState('game'), [shown,setShown]=useState('game'), [active,setActive]=useState(-1);
  const ring=useRef(null), timer=useRef(), animation=useRef(), id=useId();
  useEffect(()=>()=>{clearTimeout(timer.current);animation.current?.cancel();},[]);
  const switchMode=next=>{
    if(next===mode)return;
    setMode(next);setActive(-1);clearTimeout(timer.current);animation.current?.cancel();
    if(reduced){setShown(next);return;}
    animation.current=ring.current?.animate([{transform:'scaleY(1)'},{transform:'scaleY(.02)',offset:.5},{transform:'scaleY(1)'}],{duration:440,easing:'ease-in-out'});
    timer.current=setTimeout(()=>setShown(next),220);
  };
  const focus=(i)=>({onMouseEnter:()=>setActive(i),onMouseLeave:()=>setActive(-1),onFocus:()=>setActive(i),onBlur:()=>setActive(-1)});
  return <article className={`pp-page ar about-page${zh?' is-zh':''}${fading?' is-theming':''}`} data-theme={theme} data-nav-tone={theme} lang={htmlLang}>
    <div className="about-toolbar"><a href="/product">{t(L('Product ↗','产品 ↗'))}</a><ThemeToggle theme={theme} onToggle={toggle}/></div>
    <section className="about-intro" aria-labelledby="about-name">
      <header className="about-bio">
        <p className="ar-eyebrow">About · 关于我</p><h1 id="about-name">Jay Lin</h1><p className="about-pronouns">they/them · 林世杰</p>
        <div className="about-roles"><p className={mode==='product'?'is-active':''}>{t(L('Product manager','产品经理'))}</p><p className={mode==='game'?'is-active':''}>{t(L('Game systems designer','游戏系统策划'))}</p></div>
        <p className="about-statement">{t(L('Game design taught me to work in goals, rules and feedback. I use the same loop on products.','做游戏让我习惯用目标、规则和反馈来想问题。做产品，我用的是同一个循环。'))}</p>
      </header>
      <div className="about-loop">
        <div className="about-switch" role="group" aria-label={t(L('Explore the loop','看看这个循环'))}>
          {['game','product'].map(m=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>switchMode(m)}>{t(m==='game'?L('Game systems','游戏系统'):L('Product','产品'))}</button>)}
        </div>
        <div className="about-ring" ref={ring}>
          <svg viewBox="0 0 600 300" aria-label={t(L('Goal to rules to feedback, then back to goal','从目标到规则，再到反馈，回到目标'))}>
            <path className="about-ring-line" d={RING} pathLength="1"/>
            <g className="about-arrows" aria-hidden="true"><path d="m481 104 9 4-3-10M307 229l-8 6 8 6M116 108l3-10-9 4"/></g>
            {!reduced&&<circle className="about-pulse" r="4" aria-hidden="true"><animateMotion dur="4s" repeatCount="indefinite" path={RING}/></circle>}
            <text className="about-ring-center" x="300" y="151" textAnchor="middle">{t(shown==='game'?L('Game systems','游戏系统'):L('Product','产品'))}</text>
            <text className="about-ring-sub" x="300" y="174" textAnchor="middle">{t(L('THE SAME LOOP','同一个循环'))}</text>
            {POSITIONS.map(([x,y],i)=><a key={i} href={LOOP_CASES[shown][i].href} aria-label={`${t(NODES[i])}: ${t(LOOP_CASES[shown][i].title)}`} {...focus(i)} className={active===i?'is-active':''} aria-describedby={`${id}-card-${i}`}>
              <circle className="about-node-hit" cx={x} cy={y} r="22"/><circle className="about-node" cx={x} cy={y} r={active===i?7:5}/><text x={x} y={y+(i?32:-23)} textAnchor="middle">{t(NODES[i])}</text>
            </a>)}
          </svg>
        </div>
        <div className="about-loop-cards">{LOOP_CASES[shown].map((card,i)=><a key={card.href} id={`${id}-card-${i}`} className={`about-loop-card${active===i?' is-active':''}`} href={card.href} {...focus(i)}>
          <span className="about-card-label">{t(NODES[i])}<span aria-hidden="true">↗</span></span><h2>{t(card.title)}</h2>
          {card.measured&&<span className="about-measured" title={t(L('Measured: each build was recorded','实测：每次构建都有记录'))}>Measured</span>}<p>{t(card.meta)}</p>
        </a>)}</div>
      </div>
    </section>
    <section className="about-facts" aria-label={t(L('Facts','基本信息'))}>
      <div className="about-fact"><h2>{t(L('Education','教育'))}</h2><div>{[...author.education].reverse().map(e=><p key={e.institution}><strong>{e.institution}</strong><span>{zh?e.qualification:e.qualificationEn}</span><small>{e.period}</small></p>)}</div></div>
      <div className="about-fact"><h2>{t(L('Experience','经历'))}</h2><div>{otherProjects.map(p=><details key={p.id}><summary><span>{zh?p.title:p.titleEn}<small>{zh?p.classification:p.classificationEn}</small></span><span className="about-expand" aria-hidden="true">+</span></summary><p>{zh?p.contribution:p.contributionEn}</p></details>)}</div></div>
      <div className="about-fact"><h2>{t(L('Builds with','常用工具'))}</h2><p>Figma, Blender, Claude Code, Codex</p></div>
      <div className="about-fact"><h2>{t(L('Looking for','求职方向'))}</h2><p>{t(L('Product roles, full-time from mid-2027','产品岗位，2027 年年中起可全职入职'))}</p></div>
      <div className="about-fact"><h2>{t(L('Languages','工作语言'))}</h2><p>{t(L('English, Mandarin','英语、普通话'))}</p></div>
    </section>
    <footer className="about-contact"><h2>{t(L('Contact','联系'))}</h2><ContactRows lang={lang}/></footer>
  </article>;
}
