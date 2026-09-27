import {useRef} from 'react';
import BlossomScene from './BlossomScene';
import {channels} from './finale-cut';
import './finale.css';

const COPY={
 zh:{invite:'继续向下，让想法盛放。',title:['从一个念头，','到一个世界。'],philosophy:'我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。',details:'以系统思维构建世界的逻辑，\n以视觉创作留下值得记住的瞬间。',about:'认识我 ↗',ending:'每个结束，都可以是下一幕的开始。'},
 en:{invite:'Keep going. Let it bloom.',title:['FROM A THOUGHT,','TO A WORLD.'],philosophy:'I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.',details:'Systems thinking gives a world its logic. Art gives it a reason to be remembered.',about:'Meet the person behind it ↗',ending:'Every ending is somewhere to start.'},
};
const DISCIPLINES='WORLDBUILDING · NARRATIVE · SYSTEM DESIGN · VISUAL DEVELOPMENT · ';
const Line=({children})=><span className="mask"><span className="mask-in">{children}</span></span>;

/** The blossom finale: markup, film grade and the director's timeline. */
export default function Finale({lang,reduced,onAbout}){
 const en=lang==='en',copy=COPY[en?'en':'zh'],root=useRef(null),clock=useRef(channels(0));
 const words=en?copy.philosophy.split(' ').map(word=>word+' '):Array.from(copy.philosophy);
 return <section ref={root} className="finale-journey" id="practice" data-nav-tone={reduced?'dark':'light'}><div className="finale-stage">
  <div className="finale-ground"/>
  <div className="finale-halo" aria-hidden="true"><div className="finale-halo-glow"/></div>
  <div className="blossom-wrap"><div className="blossom-lens"><BlossomScene getChannels={()=>clock.current} reducedMotion={reduced}/></div></div>
  <div className="finale-iris" aria-hidden="true"/>
  <div className="philosophy-ribbon" aria-hidden="true"><span>{DISCIPLINES.repeat(4)}</span></div>
  <div className="blossom-small-copy"><span className="eyebrow"><Line>A SMALL IDEA. AN ENTIRE WORLD.</Line></span><p><Line>{copy.invite}</Line></p></div>
  <div className="bloom-title">{copy.title.map(line=><Line key={line}>{line}</Line>)}</div>
  <div className="philosophy">
   <span className="eyebrow"><Line>03 / PHILOSOPHY & PRACTICE</Line></span>
   <p className="reading-text">{words.map((word,i)=><span key={i}>{word}</span>)}</p>
   <div className="philosophy-details"><p><Line>{copy.details}</Line></p><button onClick={onAbout} className="text-link">{copy.about}</button></div>
  </div>
  <div className="return-copy"><i><Line>Back to a beginning.</Line></i><span><Line>{copy.ending}</Line></span></div>
  <div className="finale-grain" aria-hidden="true"/>
 </div></section>;
}
