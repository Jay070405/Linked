import {useEffect, useRef, useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import {loopSteps, decisions, iterations, metrics, simulationNote, contributions} from './maoxianjia-content';
import './maoxianjia-case.css';

const media = '/assets/maoxianjia/';
const chapters = [
  ['film', '先看一局', 'The film'],
  ['rules', '玩法系统', 'The system'],
  ['decisions', '设计取舍', 'Decisions'],
  ['iteration', '迭代过程', 'Iteration'],
  ['resources', '试玩与资料', 'Play & read'],
];

function Picture({name, alt, caption, eager = false, className = ''}) {
  const [width, height] = name === 'map-iteration' ? [1600, 550] : name === 'ui-iteration' ? [1280, 390] : [1920, 1080];
  return <figure className={`mxj-picture ${className}`}>
    <a href={media + name + '.webp'} target="_blank" rel="noreferrer"><img src={media + name + '.webp'} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" width={width} height={height} style={{aspectRatio: `${width} / ${height}`}}/></a>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

export default function MaoxianjiaCase({lang = 'zh', reduced = false, onNavigate}) {
  const en = lang === 'en', L = value => value[en ? 'en' : 'zh'];
  const video = useRef(null), film = useRef(null);
  const [failed, setFailed] = useState(false), [stage, setStage] = useState('current');
  const {setSuppressed} = useMusic();
  useEffect(() => {
    const pause = () => {if (document.hidden) video.current?.pause();};
    document.addEventListener('visibilitychange', pause);
    return () => {document.removeEventListener('visibilitychange', pause); setSuppressed(false);};
  }, [setSuppressed]);
  const jump = (event, id) => {
    event.preventDefault();
    const target = document.getElementById('mxj-' + id);
    target?.scrollIntoView({behavior: reduced ? 'instant' : 'smooth', block: 'start'});
    target?.focus({preventScroll: true});
  };
  const watch = event => {
    jump(event, 'film');
    video.current?.play().catch(() => {});
  };

  return <article className="mxj-page" lang={en ? 'en' : 'zh-CN'} data-nav-tone="light">
    <header className="mxj-head mxj-width">
      <div className="mxj-eyebrow"><span>SYSTEMS / ORIGINAL GAME</span><span>2026 · UNITY · WIP 0.8</span></div>
      <div className="mxj-heading">
        <div><p className="mxj-roman">MAOXIANJIA</p><h1>毛险家<span className="mxj-title-dot">。</span></h1></div>
        <div className="mxj-pitch"><h2>{en ? <>Four lost pets.<br/>One way home.</> : <>四只宠物，<br/>一次回家的冒险。</>}</h2><p>{en ? 'A board game about finding your person. Roll the dice, follow the clues, and decide when you know enough to take a chance.' : '把掷骰探索和线索推理放进同一张棋盘。边走边找，在“再查一条”与“现在就认”之间做决定。'}</p></div>
      </div>
      <div className="mxj-header-bottom"><span>{en ? 'SYSTEM DESIGN · UI/UX · AI-ASSISTED DEVELOPMENT' : '系统设计 · UI/UX · AI 协作开发'}</span><div><a className="mxj-button mxj-primary" href="#mxj-film" onClick={watch}>{en ? 'Watch the film' : '观看宣传片'} <span>↗ 00:48</span></a><a className="mxj-text-link" href="#mxj-resources" onClick={e => jump(e, 'resources')}>{en ? 'Play the prototype' : '下载试玩'} ↓</a></div></div>
    </header>

    <div className="mxj-cover mxj-width"><Picture name="cover" eager alt={en ? 'Star Island, the town and board routes in Maoxianjia.' : '毛险家星星岛实机全景，展示小镇与棋盘路线。'}/><div className="mxj-cover-label"><span>PLAYABLE PROTOTYPE</span><span>{en ? 'A little town. A lot to figure out.' : '小镇很大，线索慢慢拼起来。'}</span></div></div>

    <div className="mxj-width"><dl className="mxj-facts">
      {[[en ? 'PLAYERS' : '参与方式', en ? 'Solo + 3 bots / 2–4 LAN' : '单人 + 3 机器人 / 2–4 人局域网'], [en ? 'CORE LOOP' : '核心循环', en ? 'Explore · Deduce · Reunite' : '探索 · 推理 · 相认'], [en ? 'CONTENT' : '内容规模', en ? '2 islands / 15 minigames' : '2 张地图 / 15 种小游戏'], [en ? 'BUILD' : '当前版本', en ? 'Windows / v0.8 prototype' : 'Windows / v0.8 试玩版']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></div>

    <nav className="mxj-chapters mxj-width" aria-label={en ? 'Project chapters' : '项目章节'}>{chapters.map(([id, zh, english], i) => <a key={id} href={'#mxj-' + id} onClick={e => jump(e, id)}><span>0{i + 1}</span>{en ? english : zh}</a>)}</nav>

    <section id="mxj-film" className="mxj-section mxj-width" tabIndex={-1} ref={film}>
      <div className="mxj-section-head"><p className="mxj-kicker">01 / IN MOTION</p><h2>{en ? 'A small adventure, in 48 seconds.' : '48 秒，认识这场小小冒险。'}</h2><p>{en ? 'From a missing-pet notice to the moment of reunion. A project trailer built from the game’s own characters, cards and footage.' : '从一张寻宠启示，到最后认出主人的一刻。用游戏自己的角色、卡牌与实机片段，讲清一局的目标。'}</p></div>
      <figure className="mxj-film"><video ref={video} controls playsInline preload="none" poster={media + 'poster.webp'} aria-label={en ? 'Maoxianjia project trailer, 48 seconds' : '毛险家宣传片，48 秒'} onPlay={() => setSuppressed(true)} onPause={() => setSuppressed(false)} onEnded={() => setSuppressed(false)} onError={() => {setFailed(true); setSuppressed(false);}}>
        <source src={media + 'trailer.mp4'} type="video/mp4"/>
        <track kind="captions" src={media + 'trailer-en.vtt'} srcLang="en" label="English"/>
        <track kind="captions" src={media + 'trailer-zh.vtt'} srcLang="zh" label="中文"/>
        <a href={media + 'trailer.mp4'}>{en ? 'Open the film' : '打开视频'}</a>
      </video><figcaption><span>{en ? 'PROJECT TRAILER / GAME FOOTAGE & MOTION DESIGN' : '项目宣传片 / 实机画面与动态设计'}</span><a href={media + 'trailer.mp4'} target="_blank" rel="noreferrer">{en ? 'Open video' : '单独打开视频'} ↗</a></figcaption></figure>
      {failed && <p className="mxj-error" role="alert">{en ? 'The video could not load. Use “Open video” to watch it directly.' : '视频暂时未能加载，可点击“单独打开视频”观看。'}</p>}
      <details className="mxj-transcript"><summary>{en ? 'Read the film summary' : '阅读视频内容概要'}</summary><p>{en ? 'Four pets are lost and must find their owners. Roll to move through the town, collect clues and eliminate candidates among 20 residents. You can guess before collecting every clue, but a wrong guess costs time and food. Item cards disrupt other pets, a minigame happens every five rounds, and two islands offer different routes. Play solo or with two to four players over LAN. The first pet to reunite with its owner wins.' : '四只宠物走丢了，这次要自己寻找主人。掷骰探索小镇、收集线索，从二十位居民中逐步排除候选人。不必等到线索集齐就能相认，但认错需要付出时间与饱食度。道具可以干扰其他宠物，每五轮举行一场小游戏，两座小岛提供不同路线。可以单人试玩，也可以二至四人局域网游玩，先与主人团聚的宠物获胜。'}</p></details>
    </section>

    <section id="mxj-rules" className="mxj-section mxj-width" tabIndex={-1}>
      <div className="mxj-section-head"><p className="mxj-kicker">02 / THE SYSTEM</p><h2>{en ? <>Knowing who.<br/>Working out how to get there.</> : <>知道主人是谁，<br/>也要想办法走到他身边。</>}</h2><p>{en ? 'Information and position are two kinds of progress. Clues narrow your choices; routes decide when you can act on them.' : '信息与位置是两种进度。线索缩小候选范围，路线决定你何时拥有相认机会；两者互相牵动，而不是各玩各的。'}</p></div>
      <ol className="mxj-loop">{loopSteps.map((step, i) => <li key={i}><span>0{i + 1} <b aria-hidden="true">{i === 3 ? '↺' : '→'}</b></span><h3>{L(step.title)}</h3><p>{L(step.body)}</p></li>)}</ol>
      <div className="mxj-spread"><Picture name="recognition" alt={en ? 'Owner recognition panel with resident candidates and a confirmation button.' : '相认面板展示居民候选与确认按钮。'} caption={en ? 'THE DECISION / Commit now, or keep investigating.' : '决策时刻 / 现在就认，还是继续寻找。'}/><div className="mxj-side-note"><span className="mxj-big-number">20<span>→ 1</span></span><h3>{en ? 'A person, hidden in plain sight.' : '从二十位街坊里，找到那一个。'}</h3><p>{en ? 'Hat, glasses, bag, then location: five clues gradually reduce the possibilities. Residents move between districts each game, so the route cannot be memorized once and reused forever.' : '帽子、眼镜、背包，再到区域信息，五条线索逐步收窄范围。居民每局重新分区，避免把一次记住的路线变成固定答案。'}</p><p className="mxj-small">{en ? '29 item types · 32 event types · A minigame every five rounds' : '29 种道具 · 32 种事件 · 每五轮一次小游戏'}</p></div></div>
      <Picture name="clues" alt={en ? 'The resident list and clue notebook in the playable prototype.' : '试玩版中的居民名单与线索本。'} caption={en ? 'INFORMATION DESIGN / Turn collected clues into visible exclusions.' : '信息设计 / 把收集到的线索，变成看得见的排除过程。'} className="mxj-wide-shot"/>
    </section>

    <section id="mxj-decisions" className="mxj-section mxj-width" tabIndex={-1}>
      <div className="mxj-section-head"><p className="mxj-kicker">03 / DESIGN DECISIONS</p><h2>{en ? 'The choices behind the rules.' : '规则背后，是取舍。'}</h2><p>{en ? 'The goal was to preserve meaningful choices: where to go, what to believe, and when to risk a guess.' : '设计要保留的，是玩家能做判断的空间：往哪走、相信哪些线索，以及什么时候愿意冒险。'}</p></div>
      <div className="mxj-decisions">{decisions.map((decision, i) => <div key={i}><span className="mxj-kicker">0{i + 1}</span><h3>{L(decision.title)}</h3><p>{L(decision.body)}</p></div>)}</div>
      <div className="mxj-map-spread"><Picture name="map-iteration" alt={en ? 'Earlier and revised layouts for map option C.' : '地图 C 方案调整前后的路网对比。'} caption={en ? 'ROUTE STUDY / Revising connections, not just moving scenery.' : '路网推敲 / 调整连接关系，让路线选择真正变化。'}/><Picture name="river-island" alt={en ? 'Riverbend Island map overview.' : '河湾岛地图全景。'} caption={en ? 'RIVERBEND ISLAND / 151 spaces, with shortcuts through the town.' : '河湾岛 / 151 格，以多条捷径连接小镇。'}/></div>
      <div className="mxj-simulation"><div><p className="mxj-kicker">CHECKING THE RULES</p><h3>{en ? 'A model to question the design.' : '用模拟，追问规则是否成立。'}</h3><p>{en ? 'Compare both boards under the same rule agents. A shorter match alone is not enough; reckless guessing and time spent unable to act also matter.' : '用同一组规则机器人比较两张棋盘。局长更短不等于设计更好，还要看盲猜的收益，以及玩家有多少回合无法行动。'}</p></div><div><div className="mxj-table-wrap"><table><caption className="mxj-sr">{en ? 'Rule simulation results cited in the presentation' : '讲解 PPT 采用的规则模拟结果'}</caption><thead><tr><th scope="col">{en ? 'Metric' : '观察指标'}</th><th scope="col">{en ? 'Star Island' : '星星岛'}</th><th scope="col">{en ? 'Riverbend' : '河湾岛'}</th></tr></thead><tbody>{metrics.map((metric, i) => <tr key={i}><th scope="row">{L(metric.label)}</th><td>{metric.star}</td><td>{metric.river}</td></tr>)}</tbody></table></div><p className="mxj-small mxj-source-note">{L(simulationNote)}</p></div></div>
    </section>

    <section id="mxj-iteration" className="mxj-section mxj-width" tabIndex={-1}>
      <div className="mxj-section-head"><p className="mxj-kicker">04 / BUILD, PLAY, REVISE</p><h2>{en ? <>From rules on a page<br/>to a world you can play.</> : <>从纸面规则，<br/>走到可以玩的世界。</>}</h2><p>{en ? 'The interface evolved with the game. The next action, the cost of a decision and the result of a card should all be readable at the moment they matter.' : '界面跟着玩法一起迭代。下一步做什么、这次决定付出什么、刚才那张牌改变了什么，都要在需要的那一刻看得懂。'}</p></div>
      <div className="mxj-stage-picker" role="group" aria-label={en ? 'Compare prototype stages' : '对比原型阶段'}><button type="button" aria-pressed={stage === 'early'} onClick={() => setStage('early')}>{en ? 'Early prototype' : '早期原型'} <span>v0.3</span></button><button type="button" aria-pressed={stage === 'current'} onClick={() => setStage('current')}>{en ? 'Refined interface' : '界面迭代后'} <span>UI / UX</span></button></div>
      <Picture name={stage === 'early' ? 'early-prototype' : 'gameplay'} alt={stage === 'early' ? (en ? 'Earlier v0.3 prototype interface.' : 'v0.3 早期原型界面。') : (en ? 'Updated gameplay interface with paper cards and a clearer turn hierarchy.' : '更新后的实机界面，纸片卡牌与更清晰的回合层级。')} caption={stage === 'early' ? (en ? 'ARCHIVE / Earlier rules and presentation, shown for comparison.' : '过程存档 / 保留当时的规则与界面，仅用于迭代对比。') : (en ? 'GAMEPLAY / Turn prompts, readable cards and contextual feedback.' : '实机界面 / 回合提示、卡牌阅读与情境反馈。')}/>
      <ol className="mxj-timeline">{iterations.map((item, i) => <li key={i}><span className="mxj-kicker">{item.version}</span><h3>{L(item.label)}</h3><p>{L(item.body)}</p></li>)}</ol>
      <div className="mxj-detail-pair"><Picture name="ui-iteration" alt={en ? 'Before and after the first visual refresh.' : '早期第一步换皮的前后对比。'} caption={en ? 'ITERATION RECORD / Before and after the first visual refresh.' : '迭代记录 / 早期第一步换皮前后对比。'}/><Picture name="lobby" alt={en ? 'The pet selection lobby with missing-pet notices.' : '以寻宠启示组织选角与准备状态的大厅。'} caption={en ? 'LOBBY / Character, player and ready state on a missing-pet notice.' : '大厅 / 用寻宠启示承载选角、玩家与准备状态。'}/></div>
      <div className="mxj-contribution"><p className="mxj-kicker">MY ROLE & COLLABORATION</p><div><h3>{en ? 'Design ownership, with an assisted build.' : '主导设计，协作把它做出来。'}</h3><p>{L(contributions)}</p><p className="mxj-small">{en ? 'Still in progress: owner difficulty varies; low-satiety guessing needs further tuning. The build has run on a small number of PCs. Broader playtesting and a full multiplayer end-to-end check remain necessary.' : '仍在推进：不同主人的难度差异、低饱食度时冒险相认的收益还需要继续调整。目前仅在少数电脑上运行过，更广泛的真人试玩与联机完整流程验证仍待补充。'}</p></div></div>
    </section>

    <section id="mxj-resources" className="mxj-section mxj-resources mxj-width" tabIndex={-1}>
      <div className="mxj-section-head"><p className="mxj-kicker">05 / PLAY & READ</p><h2>{en ? 'Take a look. Take a turn.' : '看过思路，也来走一局。'}</h2><p>{en ? 'The playable build, design presentation and controls are here. The game and original documents are in Chinese.' : '试玩版、完整讲解和操作说明放在这里，可以沿着页面里的设计判断，回到实际游戏中验证。'}</p></div>
      <div className="mxj-resource-list">
        <a href="https://github.com/Jay070405/Linked/releases/download/maoxianjia-v0.8/Maoxianjia-v0.8-Windows.zip" target="_blank" rel="noreferrer"><span className="mxj-resource-no">01</span><span><strong>{en ? 'Download the playable build' : '下载毛险家试玩版'}</strong><small>{en ? 'Windows · v0.8 · ZIP / 322 MB · Chinese' : 'Windows · v0.8 · ZIP / 322 MB · 中文版'}</small></span><span aria-hidden="true">↓</span></a>
        <a href={media + 'maoxianjia-design.pptx'} download="毛险家_设计讲解.pptx"><span className="mxj-resource-no">02</span><span><strong>{en ? 'Read the design presentation' : '下载完整设计讲解'}</strong><small>{en ? '15 slides · PPTX / 22.4 MB · Chinese' : '15 页 · PPTX / 22.4 MB · 中文'}</small></span><span aria-hidden="true">↓</span></a>
        <a href={media + 'readme-zh.txt'} target="_blank" rel="noreferrer"><span className="mxj-resource-no">03</span><span><strong>{en ? 'Controls & multiplayer guide' : '查看操作与联机说明'}</strong><small>{en ? 'Getting started · Controls · LAN setup · Known issues · Chinese' : '开始游戏 · 按键 · 局域网连接 · 已知问题'}</small></span><span aria-hidden="true">↗</span></a>
      </div>
      <p className="mxj-install-note">{en ? 'Extract the full ZIP and open Maoxianjia.exe. Keep its Data folder and companion files together. Solo play starts with three bots; multiplayer needs the same build and a shared LAN or virtual LAN.' : '解压完整文件夹后打开 Maoxianjia.exe，请保留旁边的 Data 文件夹和配套文件。默认可与三位机器人单人试玩；联机需要同版本游戏，并处于同一局域网或虚拟局域网。'}</p>
    </section>
    <footer className="mxj-footer mxj-width"><span>MAOXIANJIA / JAY LIN / 2026</span><a href="/systems" onClick={event => {if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onNavigate?.('/systems');}}>{en ? 'Back to Systems' : '返回系统策划'} ↗</a></footer>
  </article>;
}
