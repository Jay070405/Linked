import {lazy, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {L, UI, localize, useCaseLang} from '../../i18n';
import {scrollerOf} from '../../v2/motion';
import {ArrowDown, ArrowRight, Info} from '../../v2/icons';
import {LEGS} from '../../v2/data/l100-route';
import Stage from './Stage';
import Hud from './Hud';
import {ThemeContext, ThemeToggle, useCaseTheme} from './theme';
import GateLock from './GateLock';
import {Beat, Decision, Deferred, PhoneShot, PhotoCard, PhotoViewer, Step} from './parts';
import {AI, BEATS, CHANGES, DECISIONS, LEG_CARDS, NUMBERS, ROUNDS, STOPS, TASKS} from './content';
import {NOTE_WORDS, TOTAL_FEET, bag, useBag, warmthWord} from './walk';
import './world.css';

/* D3, Last 100 Feet: "The delivery run" (site-spec/WORLDS.md, D3). The page is the complex at dusk, seen from above,
   and scrolling walks a courier along the resident's route: the Elm St curb, the gate, Building 4, the stairs, door
   214. Each waypoint is a chapter: the resident's photo for that turn, and the part of the case that happens there.
   The gate locks the walk until you show the code (Skip is always there); a hot-bag HUD cools while you hesitate or
   send the courier to the garage. "Skip the walk" switches to a plain reading mode with the same content, and
   reduced motion gets the same page without the glide. */

const DoorRun = lazy(() => import('./DoorRun'));
const GateCode = lazy(() => import('./GateCode'));
const Compare = lazy(() => import('./Compare'));
const LiveTry = lazy(() => import('./LiveTry'));

const OUTCOME = L('The resident maps the way from the curb to their door once. Every courier after them follows it, photo by photo, without calling, and still gets in when the gate or the GPS doesn’t cooperate.',
  '住户只需把从路边到家门口的路标一次。之后每位骑手都能照着照片一步步走到门口，不用打电话；遇到大门或 GPS 不配合，也照样进得去。');
const CHIPS = [L('Solo: research, design and prototype', '独立完成：调研、设计和原型'), L('October 2026', '2026 年 10 月'), L('iOS concept, two roles', 'iOS 概念，两种角色'), L('Not yet tested with couriers', '尚未找骑手测试')];
const FT = L(' ft', ' 英尺');

const TRIED = L('Tried first', '先试过的'), CHOSE = L('Chose', '最后的选择');
const PLAN = [
  L('Four first-time visitors try to reach one unit: two with a pin and a text note, two with the door route.', '四位第一次来的人尝试找到同一户：两人用定位点加文字备注，两人用入户路线。'),
  L('Measures: time from the car to the door, wrong turns, and calls needed.', '记录从下车到门口的时间、走错的次数，以及需要打几个电话。'),
  L('Two residents author a route from a blank plan, timed against the 90-second target.', '两位住户从空白平面图开始制作路线，用时和 90 秒的目标对比。'),
  L('Real photos of the complex replace the AI-generated ones, and GPS error at the gate decides whether 160 ft is the right radius.', '用小区的真实照片替换 AI 生成的照片，再根据大门处的 GPS 误差，判断 160 英尺的半径是否合适。'),
  L('Before that, three conversations with couriers about apartment drop-offs.', '在此之前，先和三位骑手聊聊送公寓的经历。'),
];
const HYPS = [
  L('A photo route cuts car-to-door time and calls for first-time visitors.', '对第一次来的人，照片路线能缩短从下车到门口的时间，也能少打电话。'),
  L('A resident can map the way in from a blank plan in under 90 seconds.', '住户能在 90 秒内，从空白平面图标出进门路线。'),
  L('Couriers can follow the cards at a glance with one hand busy.', '骑手一只手占着，扫一眼卡片也能跟着走。'),
];
const RESULTS = [
  [L('Car to door, pin and note', '下车到门口：定位点加备注'), L('— min', '— 分钟')],
  [L('Car to door, door route', '下车到门口：入户路线'), L('— min', '— 分钟')],
  [L('Calls needed', '需要打的电话'), L('— of 4', '— / 4')],
  [L('Time to map the way in', '标出进门路线的用时'), L('— s', '— 秒')],
];
const REFLECT = [
  [L('What I’d keep', '我会保留的'), L('Two separations: where to stop is not how to get in, and the order, not the courier’s position, is what grants the code. Both came from asking what happens when something goes wrong at the gate.',
    '两个区分：停在哪里和怎么进门是两回事；给出门禁码的是订单，而不是骑手的位置。两者都来自同一个问题：大门那里出了岔子会怎样。')],
  [L('What I don’t know yet', '我还不知道的'), L('Whether residents map a route at all without a nudge, and how far off GPS is between buildings at a real complex. The 160 ft radius and every count on the screens are placeholders until then.',
    '没人提醒的话，住户会不会去标路线；在真实小区里，楼与楼之间的 GPS 会偏多远。弄清楚之前，160 英尺的半径和屏幕上的所有数字都只是占位。')],
  [L('What’s next', '下一步'), L('The field test with real photos. Then the two states round 2 only describes: the building manager’s confirmation, and what a courier sees when access ends.',
    '用真实照片做实地测试。然后补上第 2 轮只描述过的两个状态：物业经理的确认，以及通行权限结束后骑手看到的画面。')],
];

function useViewport(root) {
  const [size, setSize] = useState(() => ({w: typeof document === 'undefined' ? 1440 : document.documentElement.clientWidth, h: typeof innerHeight === 'number' ? innerHeight : 900}));
  useLayoutEffect(() => {
    const sc = scrollerOf(root.current);
    const measure = () => setSize(s => {
      const w = sc === window ? document.documentElement.clientWidth : sc.clientWidth, h = sc === window ? innerHeight : sc.clientHeight;
      return s.w === w && s.h === h ? s : {w, h};
    });
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, [root]);
  return size;
}

/** The walk between two stops: the card a courier reads on the way, and the feet left, counting down as you scroll. */
function Leg({i}) {
  const {t} = useCaseLang();
  return <div className="w3-leg" data-leg={i}>
    <div className="w3-leg-card">
      <p className="w3-leg-count"><span data-count={i}>{LEGS[i].feet}</span><span className="w3-leg-unit">{t(FT)}</span></p>
      <p className="w3-leg-to">{t(L('to ', '到'))}{t(LEG_CARDS[i].to)}</p>
      <p className="w3-leg-say">{t(LEG_CARDS[i].say)}</p>
    </div>
  </div>;
}

function Delivered() {
  const b = useBag();
  const {zh, t} = useCaseLang();
  const word = t(warmthWord(b.warmth)), notes = b.notes.map(n => t(NOTE_WORDS[n] || n));
  return <p className="w3-delivered" aria-live="polite">
    <span className="w3-delivered-dot" data-on={b.delivered || undefined} aria-hidden="true"/>
    {b.delivered
      ? zh ? <>已送达，保温袋{word}，离停车点 {TOTAL_FEET} 英尺。{b.gateSeconds ? `你用 ${b.gateSeconds} 秒通过了大门。` : ''}{notes.length ? `路上保温袋变凉了：${notes.join('、')}。` : ''}</>
        : <>Delivered {word.toLowerCase()}, {TOTAL_FEET} ft from the stop.{b.gateSeconds ? ` You were through the gate in ${b.gateSeconds} s.` : ''}{notes.length ? ` The bag cooled on the way: ${notes.join(', ').toLowerCase()}.` : ''}</>
      : <>{t(L(`${TOTAL_FEET} ft from the stop to this door, five turns.`, `从停车点到这扇门 ${TOTAL_FEET} 英尺，分五步。`))}</>}
  </p>;
}

export default function LastHundredFeetWorld({item, reduced}) {
  const root = useRef(null);
  const size = useViewport(root);
  const [plain, setPlain] = useState(false);
  const {theme, toggle: toggleTheme, fading} = useCaseTheme(reduced);
  const [gate, setGate] = useState('closed');     // closed | open | skipped
  const [reached, setReached] = useState(0);
  const {t, zh, lang, htmlLang} = useCaseLang();
  const next = localize(nextCase(item.slug), lang), here = localize(item, lang);
  useEffect(() => { bag.reset(); }, []);

  const onOpen = useCallback(() => setGate('open'), []);
  const onSkip = useCallback(() => setGate(g => (g === 'closed' ? 'skipped' : g)), []);
  const scrollToId = (id, e) => {
    const target = root.current?.querySelector(`#${id}`);
    if (!target) return;
    e?.preventDefault();
    target.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    const h = target.querySelector('h2, h3') || target;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({preventScroll: true});
    // modules mount on the way and push the target down: land on it once things settle, unless the reader moved on
    let moved = false;
    const stop = () => { moved = true; };
    addEventListener('wheel', stop, {once: true, passive: true}); addEventListener('touchstart', stop, {once: true, passive: true}); addEventListener('keydown', stop, {once: true});
    const settle = (left, last) => setTimeout(() => {
      if (moved) return;
      const top = target.getBoundingClientRect().top;
      if (Math.abs(top) > 6 && Math.abs(scrollY - last) < 2) scrollBy(0, top);
      if (left > 0) settle(left - 1, scrollY);
      else { removeEventListener('wheel', stop); removeEventListener('touchstart', stop); removeEventListener('keydown', stop); }
    }, 420);
    settle(4, -1e9);
  };
  // jumping past the gate opens it on the way: a link is a skip, not a walk
  const jump = (id, e, pastGate) => {
    if (pastGate) flushSync(() => setGate(g => (g === 'closed' ? 'skipped' : g)));
    scrollToId(id, e);
  };
  const onRail = (i, e) => jump(STOPS[i].id, e, i >= 1);
  const togglePlain = e => {
    e.preventDefault();
    const to = !plain;
    flushSync(() => setPlain(to));
    scrollToId(to ? 'w3-curb' : 'w3-top', {preventDefault() {}, detail: 0});
  };

  return <ThemeContext.Provider value={theme}><article ref={root} id="w3-top" className={`w3${plain ? ' is-plain' : ''}${reduced ? ' is-reduced' : ''}${fading ? ' is-theming' : ''}`} lang={htmlLang} data-theme={theme} data-nav-tone={theme === 'dark' ? 'dark' : 'light'} tabIndex={-1}>
    <ThemeToggle theme={theme} onToggle={toggleTheme}/>
    <a className="w3-skipwalk" href="#w3-curb" onClick={togglePlain}>{t(plain ? L('Take the walk instead', '改为跟着路线走') : L('Skip the walk: read the case plainly', '跳过这段路，直接读案例'))}</a>
    <PhotoViewer>
      <div className="w3-run">
        {plain ? null : <>
          <Stage root={root} size={size} reduced={reduced} gateOpen={gate !== 'closed'} onReach={setReached}/>
          <div className="w3-hudbar"><Hud reached={reached} onJump={onRail}/></div>
        </>}

        <header className="w3-hero" data-w3-hero="">
          <div className="w3-hero-copy">
            <p className="w3-flag"><Info/>{t(L('Independent concept, not affiliated with any delivery company', '独立概念作品，与任何配送公司无关联'))}</p>
            <p className="w3-kind">{here.kind}</p>
            <h1 className="w3-title">Last 100 Feet</h1>
            <p className="w3-outcome">{t(OUTCOME)}</p>
            <div className="w3-hero-actions">
              <a className="w3-cta" href="#w3-curb" onClick={e => scrollToId('w3-curb', e)}><span>{t(plain ? L('Start reading', '开始阅读') : L('Start the walk', '开始走'))}</span><ArrowDown width={18} height={18}/></a>
              <a className="w3-textlink" href="#w3-try" onClick={e => jump('w3-try', e, true)}>{t(L('Try the prototype', '试用原型'))}</a>
            </div>
            <ul className="w3-chips" aria-label={t(L('About this project', '项目概况'))}>{CHIPS.map(c => <li key={c.en}>{t(c)}</li>)}</ul>
          </div>
          {plain ? null : <p className="w3-hero-hint" aria-hidden="true">{t(L(`Scroll to walk the route: ${TOTAL_FEET} ft from the stop to door 214.`, `向下滚动，沿路线往前走：从停车点到 214 号门共 ${TOTAL_FEET} 英尺。`))}</p>}
        </header>

        {/* ---------- 1. Elm St curb: the problem ---------- */}
        <section id="w3-curb" className="w3-stop" data-stop="0" aria-labelledby="w3-curb-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={0}/>
              <h2 id="w3-curb-title" className="w3-h2">{t(L('The map ends at the curb', '地图在路边就到头了'))}</h2>
              <div className="w3-prose">
                <p>{t(L('Delivery apps route to an address. In a garden-style complex, the pin can land on the leasing office or the garage, the walk-in gate is around the corner, and the building numbers face the courtyard. Couriers call, guess, or walk the whole complex with a hot bag in one hand.',
                  '配送 app 只导航到地址。在花园式公寓小区里，定位点可能落在租赁办公室或车库，步行入口在拐角另一边，楼号又朝着内院。骑手只能打电话、靠猜，或者一手提着保温袋把整个小区走一遍。'))}</p>
                <p>{t(L('Others are working on the same gap. Amazon added building-entrance routing for Flex drivers in June 2026 and says apartment stops “can be challenging.” Beans, an app that only maps complexes, exists because of it.',
                  '也有人在填补同一个缺口。Amazon 在 2026 年 6 月为 Flex 司机加入了楼栋入口导航，并表示公寓站点“可能很棘手”。Beans 是一款只做小区地图的 app，正是因为这个问题才出现。'))}</p>
              </div>
              <p className="w3-ev"><Ev label="Sourced"/><span>{t(L('Amazon, June 2026. The Beans figure below is its founder’s claim.', 'Amazon，2026 年 6 月。下方 Beans 的数字是其创始人的说法。'))}</span></p>
              <p className="w3-ev"><Ev label="Hypothesis"/><span>{t(L('No delivery company publishes this. Three courier conversations and a field test come next.', '没有配送公司公布过这类数据。接下来会和三位骑手聊一聊，再做一次实地测试。'))}</span></p>
              <ul className="w3-numbers" aria-label={t(L('The case in numbers', '用数字看这个案例'))}>
                {NUMBERS.map(n => <li key={n.value}>
                  <p className="w3-num"><b>{n.value}</b>{n.unit ? <span> {t(n.unit)}</span> : null}</p>
                  <p className="w3-num-label">{t(n.label)}</p>
                  <p className="w3-num-note">{t(n.note)}</p>
                </li>)}
              </ul>
              <aside className="w3-slot" aria-label={t(L('Courier quotes, not collected yet', '骑手原话，尚未收集'))}>
                <p className="w3-slot-badge">{t(L('Placeholder', '占位'))}</p>
                <p>{t(L('Quotes from three courier conversations go here: what they do when the pin lands on the leasing office.', '这里将放上和三位骑手交流时的原话：定位点落在租赁办公室时，他们会怎么做。'))}</p>
              </aside>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[0]} i={0}/></div>
          </div>

          <div id="w3-find" className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">{t(L('Find the door', '找到那扇门'))}</h3>
              <p className="w3-lede">{t(L('You’re delivering to unit 214. The app gives you what most apps give a courier: the address, and its pin.', '你要把餐送到 214 室。app 给你的，和大多数 app 给骑手的一样：一个地址，加一个定位点。'))}</p>
            </div>
            <Deferred minHeight={760} label={t(L('A site plan to try', '可以试一试的平面图'))}><DoorRun reduced={reduced}/></Deferred>
          </div>

          <div className="w3-stop-main">
            <div className="w3-col">
              <Beat beat={BEATS.arrive}/>
              <Decision d={DECISIONS.stop}/>
            </div>
            <div className="w3-aside"/>
          </div>
        </section>

        <Leg i={0}/>

        {/* ---------- 2. Elm St gate: the lock, then the code ---------- */}
        <GateLock reduced={reduced} plain={plain} state={gate} onOpen={onOpen} onSkip={onSkip}/>
        <section className="w3-stop" data-stop="1" data-zoom=".9" aria-labelledby="w3-code-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <h2 id="w3-code-title" className="w3-h2">{t(DECISIONS.code.title)}</h2>
              <p className="w3-lede">{t(DECISIONS.code.verdict)}</p>
              <dl className="w3-tc">
                <div><dt>{t(TRIED)}</dt><dd>{t(DECISIONS.code.tried)}</dd></div>
                <div><dt>{t(CHOSE)}</dt><dd>{t(DECISIONS.code.chose)}</dd></div>
              </dl>
              <Beat beat={BEATS.gate}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[1]} i={1}/></div>
          </div>
          <div className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">{t(L('The gate code, in your hands', '门禁码，交给你来试'))}</h3>
              <p className="w3-lede">{t(L('The courier’s gate step from the prototype, on its own. The code belongs to the order; walking up to the gate only reveals it, and it hides again on its own.', '原型里骑手过大门的这一步，单独拿出来。门禁码属于订单，走到大门前只是让它显示出来，过一会儿它会自动隐藏。'))}</p>
            </div>
            <Deferred minHeight={560} label={t(L('The gate step, to try', '可以试一试的大门步骤'))}><GateCode reduced={reduced}/></Deferred>
          </div>
        </section>

        <Leg i={1}/>

        {/* ---------- 3. Building 4: photo cards ---------- */}
        <section id="w3-courtyard" className="w3-stop" data-stop="2" aria-labelledby="w3-courtyard-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={2}/>
              <h2 id="w3-courtyard-title" className="w3-h2">{t(BEATS.card.title)}</h2>
              <div className="w3-prose"><p>{t(BEATS.card.body)}</p></div>
              <div className="w3-pair">
                <PhoneShot screen={BEATS.card.screen} alt={t(BEATS.card.alt)}/>
                <Decision d={DECISIONS.card}/>
              </div>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[2]} i={2}/></div>
          </div>
        </section>

        <Leg i={2}/>

        {/* ---------- 4. The stairs: when the building changes; round 1 to round 2 ---------- */}
        <section id="w3-stairs" className="w3-stop" data-stop="3" aria-labelledby="w3-stairs-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={3}/>
              <h2 id="w3-stairs-title" className="w3-h2">{t(DECISIONS.stale.verdict)}</h2>
              <div className="w3-pair">
                <PhoneShot screen={DECISIONS.stale.screen} alt={t(L('Stairs flagged twice: the photo grayed, the detour recent couriers used on the mini map, the building manager asked to confirm', '楼梯被反馈了两次：照片变灰，小地图上显示最近骑手绕行的路线，并请物业经理确认'))}/>
                <Decision d={{...DECISIONS.stale, verdict: null}}/>
              </div>
              <Beat beat={BEATS.off}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[3]} i={3}/></div>
          </div>
          <div id="w3-rounds" className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">{t(L('Round 1 → Round 2', '第 1 轮 → 第 2 轮'))}</h3>
              <p className="w3-lede">{t(L('Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.', '第 2 轮来自一次设计评审。选一个界面，在手机上左右拖动，对比两轮。'))}</p>
            </div>
            <div className="w3-rounds">
              <Deferred minHeight={640} label={t(L('Compare round 1 with round 2', '对比第 1 轮和第 2 轮'))}><Compare pairs={ROUNDS} reduced={reduced}/></Deferred>
              <div className="w3-rounds-text">
                <p className="w3-review">{zh
                  ? <><b>一次借助模型的设计评审。</b>我让一个模型以配送 app 设计负责人的身份点评第 1 轮。它给的分数是：工艺 8 分，交互 6 分，产品思考 5 分。看上去很有说服力，但它靠预先准备好的内容，让棘手的物流问题显得已经解决了。第 2 轮就是对这一点的回应。这只是一次点评，不是下文的实地测试。</>
                  : <><b>A model-assisted design review.</b> I asked a model to critique round 1 as a delivery-app design lead would. It scored craft 8, interaction 6 and product thinking 5: convincing to look at, but it made hard logistics look solved with prepared content. Round 2 answers that. It’s a critique, not the field test below.</>}</p>
                <h4 className="w3-h3">{t(L('What changed and why', '改了什么，为什么改'))}</h4>
                <ul className="w3-changes">{CHANGES.map(c => <li key={c.what.en}><p>{t(c.what)}</p><p className="w3-why">{t(c.why)}</p></li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <Leg i={3}/>

        {/* ---------- 5. Door 214: the drop-off, the resident behind the door, then try it ---------- */}
        <section id="w3-door" className="w3-stop" data-stop="4" data-zoom="1.12" aria-labelledby="w3-door-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={4}/>
              <h2 id="w3-door-title" className="w3-h2">{t(BEATS.door.title)}</h2>
              <Delivered/>
              <div className="w3-pair">
                <PhoneShot screen={BEATS.door.screen} alt={t(BEATS.door.alt)}/>
                <div className="w3-prose"><p>{t(BEATS.door.body)}</p></div>
              </div>
              <h3 className="w3-h2 is-sub">{t(L('Behind the door, the resident who drew the route', '门后，是画出这条路线的住户'))}</h3>
              <div className="w3-prose"><p>{t(L('Dana set this route up once, from a blank plan, so that this walk could happen without a call.', 'Dana 从一张空白平面图开始，把这条路线设置了一次，这一趟才能一个电话都不用打。'))}</p></div>
              <Beat beat={BEATS.wayIn}/>
              <Beat beat={BEATS.basics}/>
              <Decision d={DECISIONS.blank}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[4]} i={4}/></div>
          </div>

          <div id="w3-try" className="w3-sheet is-try">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">{t(L('Try it yourself', '自己试试'))}</h3>
              <p className="w3-lede">{t(L('The same prototype, at full size. Pick a task; the phone opens on the screen where it starts.', '同一个原型，完整尺寸。选一个任务，手机会打开到这个任务开始的界面。'))}</p>
            </div>
            <Deferred minHeight={760} label={t(L('The live prototype', '可交互的原型'))}><LiveTry tasks={TASKS} reduced={reduced}
              note={t(L(`It runs in your browser only; nothing is sent anywhere. Reset starts over. ${AI.en}`, `原型只在你的浏览器里运行，不会发送任何数据，点“重置原型”可以从头开始。原型界面是英文的。${AI.zh}`))}/></Deferred>
          </div>

          <div className="w3-stop-main is-epilogue">
            <div className="w3-col">
              <h2 id="w3-testing" className="w3-h2">{t(L('Testing comes next', '下一步：测试'))}</h2>
              <p className="w3-lede">{t(L('Nothing here has been tested with couriers or residents yet. This is the plan, and the space the results will fill.', '这里的内容还没有找骑手或住户测试过。下面是测试计划，也给结果留好了位置。'))}</p>
              <h3 className="w3-h3">{t(L('Plan for one afternoon at a real complex', '计划：在一个真实小区待一个下午'))}</h3>
              <ul className="w3-list">{PLAN.map(p => <li key={p.en}>{t(p)}</li>)}</ul>
              <h3 className="w3-h3">{t(L('Hypotheses to check', '要验证的假设'))}</h3>
              <ul className="w3-hyps">{HYPS.map(h => <li key={h.en}><Ev label="Hypothesis"/><span>{t(h)}</span></li>)}</ul>
              <div className="w3-slot is-results" aria-label={t(L('Results, not collected yet', '结果，尚未收集'))}>
                <p className="w3-slot-badge">{t(L('Placeholder: results after the field test', '占位：实地测试后的结果'))}</p>
                <dl>{RESULTS.map(([k, v]) => <div key={k.en}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>)}</dl>
                <p>{t(L('Each result will sit next to the change it caused.', '每个结果都会放在它带来的改动旁边。'))}</p>
              </div>

              <h2 id="w3-reflection" className="w3-h2 is-gap">{t(L('Reflection', '回顾'))}</h2>
              <div className="w3-reflect">{REFLECT.map(([h, p]) => <div key={h.en}><h3 className="w3-h3">{t(h)}</h3><p>{t(p)}</p></div>)}</div>
            </div>
            <div className="w3-aside"/>
          </div>
        </section>
        <div className="w3-run-end" aria-hidden="true"/>
      </div>
    </PhotoViewer>

    <nav className="w3-next" aria-label={t(UI.nextProject)}>
      <Go to={`${PRODUCT_HOME}/${next.slug}`} className="w3-next-link">
        <span className="w3-next-text">
          <span className="w3-next-label">{t(UI.nextProject)}</span>
          <span className="w3-next-title">{next.title}</span>
          <span className="w3-next-sub">{next.subtitle || next.summary}</span>
          <span className="w3-next-go" aria-hidden="true"><ArrowRight width={20} height={20}/></span>
        </span>
        {next.thumb ? <span className="w3-next-media"><img src={next.thumb.src} width={next.thumb.width} height={next.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
      </Go>
    </nav>
    <div className="w3-foot"><ProductFooter/></div>
  </article></ThemeContext.Provider>;
}
