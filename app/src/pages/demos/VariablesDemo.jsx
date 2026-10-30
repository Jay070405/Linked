import {useEffect, useLayoutEffect, useReducer, useRef, useState} from 'react';
import './vd-demo.css';

/* Variables for agents, playable: the design half of the Ready for agents case.
   Three linked panes: the Atelier Home frame (the case's design file), the Variables for agents lens on Check designs,
   and the CSS a coding agent writes from that frame. Apply binds the checked rows in one undo step; the code switches
   from names the agent made up to the file's variable names, and the three values that need a person become a question.
   "Change a token" switches Atelier tokens to Dark, the way the benchmark redefined design-system variables on the page:
   only code wired to the tokens' names follows.

   Sources (all real; nothing here is a new palette):
   - Variables, Light/Dark values, scopes, the 12 unbound values on Home, their roles and layer counts:
     視觉设计作品集/pd-prototype/src/data/atelier.ts (VARIABLES, HOME_RAW, C). Matching, row copy and the agent's note:
     pd-prototype/src/state/model.ts (candidatesFor, rowCopy, agentNote) and editor.ts (toast wording).
     Picker, Check designs and the agent's question: components/VariablePicker.tsx, ReviewPopover.tsx, routes/AgentTerminal.tsx.
   - AGENT_NOTE (the 3-left note, both languages): copied verbatim from app/src/product/worlds/ready-for-agents/data.js
     (not imported, so this lazy chunk doesn't carry the whole case's copy).
   - Names an agent invents: bgLight, darkText, grey600, cardBg2 from the film (product-films/src/films/VariablesForAgents2.tsx,
     TOKENS[].guess). The two names it "happens to guess" (--color-accent, --color-border) follow the benchmark's finding
     (cases/p2-design-to-code/draft.md: changes reached "only the tokens whose generic names the agent happened to guess,
     mostly --color-primary and --color-border"; Compile.jsx marks those two as fate 'guessed'). Atelier calls its primary
     color/accent, so the film's greenPrimary is shown as the guessed --color-accent. cardBg, white and gold are written
     in the same style for the three values the film doesn't name.
   - Measured result: 9 of 9 builds followed every token change with variables; median 50% without; 37 builds
     (data.js NUMBERS). The card shows the four token kinds the benchmark changed (background, text, primary/accent,
     border): two followed by guessed names, two not, which is the median build, drawn as an illustration. */

const T = 'Atelier tokens', P = 'Primitives';
const VARS = {
  bg: {name: 'color/background', light: '#F7F7F5', dark: '#141516', coll: T, scope: 'Frame fill, Shape fill'},
  surface: {name: 'color/surface', light: '#FFFFFF', dark: '#1C1D21', coll: T, scope: 'All fills', usage: 'fills 9 layers'},
  onAccent: {name: 'color/on-accent', light: '#FFFFFF', dark: '#FFFFFF', coll: T, scope: 'Any property', usage: 'colors text on 4 layers'},
  text: {name: 'color/text-primary', light: '#1C1D21', dark: '#F2F2F0', coll: T, scope: 'Text'},
  text2: {name: 'color/text-secondary', light: '#6E6F78', dark: '#A0A1A8', coll: T, scope: 'Text'},
  accent: {name: 'color/accent', light: '#2F5D50', dark: '#6FA593', coll: T, scope: 'All fills'},
  sunken: {name: 'color/surface-sunken', light: '#EDECE8', dark: '#232426', coll: T, scope: 'All fills'},
  border: {name: 'color/border', light: '#E4E3DF', dark: '#2E2F33', coll: T, scope: 'Stroke'},
  white: {name: 'white', light: '#FFFFFF', coll: P, scope: 'Hidden from pickers'},
  green700: {name: 'green/700', light: '#2F5D50', coll: P, scope: 'Hidden from pickers'},
  s20: {name: 'space/20', num: 20, coll: T, scope: 'Gap and padding'},
  s16: {name: 'space/16', num: 16, coll: T, scope: 'Gap and padding'},
  rmd: {name: 'radius/md', num: 12, coll: T, scope: 'Corner radius'},
};

// HOME_RAW, in the prototype's order: the three that need a decision first.
const ROWS = [
  {id: 'white-frame', kind: 'color', value: 'FFFFFF', prop: 'Frame fill', layers: 3, usage: 'fill on 3 print cards', cand: ['surface', 'onAccent'], blocked: ['white'], raw: 'cardBg'},
  {id: 'white-text', kind: 'color', value: 'FFFFFF', prop: 'Text', layers: 1, usage: 'text on the “All” chip', cand: ['surface', 'onAccent'], blocked: ['white'], raw: 'white'},
  {id: 'gold', kind: 'color', value: 'C9A66B', prop: 'Frame fill', layers: 2, usage: 'fill on 2 “Signed” badges', cand: [], blocked: [], raw: 'gold'},
  {id: 'bg', kind: 'color', value: 'F7F7F5', prop: 'Frame fill', layers: 1, cand: ['bg'], raw: 'bgLight'},
  {id: 'text', kind: 'color', value: '1C1D21', prop: 'Text', layers: 6, cand: ['text'], raw: 'darkText'},
  {id: 'text2', kind: 'color', value: '6E6F78', prop: 'Text', layers: 7, cand: ['text2'], raw: 'grey600'},
  {id: 'accent', kind: 'color', value: '2F5D50', prop: 'Frame fill', layers: 2, cand: ['accent'], blocked: ['green700'], raw: 'color-accent', guessed: true},
  {id: 'sunken', kind: 'color', value: 'EDECE8', prop: 'Frame fill', layers: 4, cand: ['sunken'], raw: 'cardBg2'},
  {id: 'border', kind: 'color', value: 'E4E3DF', prop: 'Stroke', layers: 2, cand: ['border'], raw: 'color-border', guessed: true},
  {id: 's20', kind: 'spacing', value: 20, prop: 'Padding', layers: 2, cand: ['s20']},
  {id: 's16', kind: 'spacing', value: 16, prop: 'Gap', layers: 2, cand: ['s16']},
  {id: 'r12', kind: 'radius', value: 12, prop: 'Radius', layers: 3, cand: ['rmd']},
];
const ROW = Object.fromEntries(ROWS.map(r => [r.id, r]));
const ROOT_ORDER = ['bg', 'text', 'text2', 'accent', 'sunken', 'border', 'white-frame', 'white-text', 'gold'];
const RULES = [
  {sel: '.home', decls: [['background', 'bg'], ['padding', 's20', '0 '], ['gap', 's16']]},
  {sel: '.title', decls: [['color', 'text']]},
  {sel: '.meta', decls: [['color', 'text2']]},
  {sel: '.chip--all', decls: [['background', 'accent'], ['color', 'white-text']]},
  {sel: '.chip', decls: [['background', 'sunken']]},
  {sel: '.divider', decls: [['border-top', 'border', '1px solid ']]},
  {sel: '.print-card', decls: [['background', 'white-frame'], ['border-radius', 'r12']]},
  {sel: '.badge', decls: [['background', 'gold']]},
];
const TALLY = ['bg', 'text', 'accent', 'border'];
// ready-for-agents/data.js, AGENT_NOTE: the agent's note once Apply 9 has left three values.
const AGENT_NOTE = {
  en: 'Home has 3 unbound values: FFFFFF as frame fill and FFFFFF as text each match more than one; C9A66B matches none. I’ll use variables where they’re bound and ask about the rest instead of inventing names.',
  zh: 'Home 有 3 个未绑定的值：FFFFFF 用作 frame 填充，FFFFFF 用作文字，各自都能对上不止一个 variable；C9A66B 一个也对不上。绑好的我直接用 variables，其余的我先问清楚，不自己编名字。',
};
const ART = '/proto/ready-for-agents/art/enchanted-forest.webp';
const SCRAMBLE_FRAMES = 8;
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789-/';
const PROP_ZH = {'Frame fill': 'frame 填充', Text: '文字', Stroke: '描边', Padding: '内边距', Gap: '间距', Radius: '圆角'};

const fmt = r => (r.kind === 'color' ? r.value : String(r.value));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cssVar = id => `--${VARS[id].name.replace('/', '-')}`;
const shortName = id => VARS[id].name.split('/').pop();
const roleOf = r => `${fmt(r)} as ${r.prop.toLowerCase()}`;
const pick = (lang, en, zh) => (lang === 'zh' ? zh : en);

/* ---------- state: the document (bound, exempt) and the open review (choice, checked), one undo stack ---------- */

const isOpen = (s, r) => !s.bound[r.id] && !s.exempt[r.id];
const target = (s, r) => s.choice[r.id] || (r.cand.length === 1 ? r.cand[0] : undefined);
function isChecked(s, r) {
  if (!isOpen(s, r) || !target(s, r)) return false;
  const x = s.checked[r.id];
  if (x !== undefined) return x;
  return !!s.choice[r.id] || r.cand.length === 1;
}
const snap = s => ({bound: s.bound, exempt: s.exempt, choice: s.choice, checked: s.checked});
const INITIAL = {bound: {}, exempt: {}, choice: {}, checked: {}, history: [], toast: null, seq: 0};

function reducer(s, a) {
  switch (a.type) {
    case 'check': return {...s, checked: {...s.checked, [a.id]: a.on}};
    case 'check-all': {
      const checked = {...s.checked};
      ROWS.forEach(r => { if (isOpen(s, r) && target(s, r)) checked[r.id] = a.on; });
      return {...s, checked};
    }
    case 'choose': return {...s, choice: {...s.choice, [a.id]: a.v}, checked: {...s.checked, [a.id]: true}};
    case 'apply': {
      const items = ROWS.filter(r => isChecked(s, r));
      if (!items.length) return s;
      const bound = {...s.bound}, choice = {...s.choice}, checked = {...s.checked};
      items.forEach(r => { bound[r.id] = target(s, r); delete choice[r.id]; delete checked[r.id]; });
      const layers = items.reduce((n, r) => n + r.layers, 0);
      return {...s, bound, choice, checked, history: [...s.history, snap(s)], seq: s.seq + 1,
        toast: {id: s.seq + 1, text: `Bound ${plural(items.length, 'value', 'values')} on ${plural(layers, 'layer', 'layers')}`}};
    }
    case 'answer': { // the agent's question, answered: binds that one row (prototype: agent-answer)
      const r = ROW[a.id];
      if (!isOpen(s, r)) return s;
      const choice = {...s.choice}, checked = {...s.checked};
      delete choice[r.id]; delete checked[r.id];
      return {...s, bound: {...s.bound, [r.id]: a.v}, choice, checked, history: [...s.history, snap(s)], seq: s.seq + 1,
        toast: {id: s.seq + 1, text: `Bound 1 value on ${plural(r.layers, 'layer', 'layers')}`}};
    }
    case 'exempt': {
      const checked = {...s.checked};
      delete checked[a.id];
      return {...s, exempt: {...s.exempt, [a.id]: true}, checked, history: [...s.history, snap(s)], toast: null};
    }
    case 'restore': {
      const exempt = {...s.exempt};
      delete exempt[a.id];
      return {...s, exempt, history: [...s.history, snap(s)], toast: null};
    }
    case 'undo': {
      const last = s.history[s.history.length - 1];
      return last ? {...s, ...last, history: s.history.slice(0, -1), toast: null} : s;
    }
    case 'toast-done': return s.toast && s.toast.id === a.id ? {...s, toast: null} : s;
    case 'reset': return {...INITIAL, seq: s.seq};
    default: return s;
  }
}

function summarize(s) {
  const open = ROWS.filter(r => isOpen(s, r));
  return {
    open,
    suggested: open.filter(r => r.cand.length === 1),
    amb: open.filter(r => r.cand.length > 1),
    none: open.filter(r => r.cand.length === 0),
    exempt: ROWS.filter(r => s.exempt[r.id]),
    bound: ROWS.filter(r => s.bound[r.id]),
  };
}

// The agent's note, in the same words as the panel row (model.ts agentNote), plus the case's Chinese.
function agentNote(sum, lang) {
  const n = sum.open.length;
  if (!n) {
    if (sum.exempt.length) {
      const kept = sum.exempt.map(r => `#${fmt(r)}`).join(', ');
      return pick(lang, `Every value on Home uses a variable except ${kept}, which you marked exempt. I’ll keep ${sum.exempt.length === 1 ? 'that value' : 'those values'} as is.`,
        `Home 上除了 ${kept}（你标成了豁免）以外，所有值都用了 variables。这些值我保持原样。`);
    }
    return pick(lang, 'Every value on Home uses a variable. I’ll use your variable names throughout.', 'Home 上所有值都用了 variables。我会全程用你的 variable 名。');
  }
  if (n === 3 && sum.amb.length === 2 && sum.none.length === 1) return AGENT_NOTE[lang === 'zh' ? 'zh' : 'en'];
  const en = [], zh = [];
  if (sum.suggested.length) {
    const k = sum.suggested.length;
    en.push(`${k} ${k === 1 ? 'has' : 'have'} a suggested variable`);
    zh.push(`${k} 个有推荐的 variable`);
  }
  if (sum.amb.length) {
    en.push(`${sum.amb.map(roleOf).join(' and ')} ${sum.amb.length === 1 ? 'matches' : 'each match'} more than one`);
    const asZh = r => `${fmt(r)} 用作${/^[a-z]/i.test(PROP_ZH[r.prop]) ? ' ' : ''}${PROP_ZH[r.prop]}`;
    zh.push(`${sum.amb.map(asZh).join('，')}，${sum.amb.length === 1 ? '能' : '各自都能'}对上不止一个 variable`);
  }
  if (sum.none.length) {
    en.push(`${sum.none.map(fmt).join(', ')} ${sum.none.length === 1 ? 'matches' : 'match'} none`);
    zh.push(`${sum.none.map(fmt).join('、')} 一个也对不上`);
  }
  return pick(lang,
    `Home has ${plural(n, 'unbound value', 'unbound values')}: ${en.join('; ')}. I’ll use variables where they’re bound and ask about the rest instead of inventing names.`,
    `Home 有 ${n} 个未绑定的值：${zh.join('；')}。绑好的我直接用 variables，其余的我先问清楚，不自己编名字。`);
}

/* ---------- colour resolution: what the agent's code paints, before and after a token change ---------- */

// 'hex': the untouched file, the agent named every value itself. 'vars': the designer has acted in the lens.
const modeOf = s => (Object.keys(s.bound).length || Object.keys(s.exempt).length ? 'vars' : 'hex');
function follows(s, mode, id) {
  if (s.bound[id]) return true;
  return mode === 'hex' && !!ROW[id].guessed; // a guessed name happens to be the token's own name
}
function paint(s, mode, theme, id) {
  const r = ROW[id], v = s.bound[id];
  if (v) return VARS[v][theme] || VARS[v].light;
  if (mode === 'hex' && r.guessed) return VARS[r.cand[0]][theme];
  return `#${r.value}`;
}

/* ---------- small parts ---------- */

const PATHS = {
  check: 'M4 8.25l2.6 2.6L12 5.25',
  minus: 'M3.75 8h8.5',
  chevron: 'M5.5 7l2.5 2.5L10.5 7',
  close: 'M4.75 4.75l6.5 6.5m0-6.5l-6.5 6.5',
  variable: 'M8 2l5.2 3v6L8 14l-5.2-3V5z',
  split: 'M2.5 8h4.25l3-3.5h3.75m-7.5 3.5l3 3.5h4.5M11 3l2.5 1.5L11 6m0 4l2.5 1.5L11 13',
  padding: 'M2.75 3v10m10.5-10v10M5.5 5.5h5v5h-5z',
  gap: 'M3 3.25h10m-10 9.5h10M8 5.75v4.5m-1.5-1.5L8 10.25l1.5-1.5m-3-1.5L8 5.75l1.5 1.5',
  radius: 'M3.25 12.75V7.5a4.25 4.25 0 014.25-4.25h5.25',
  lock: 'M5.5 7.25V5.5a2.5 2.5 0 015 0v1.75M4.75 7.25h6.5a1 1 0 011 1v4a1 1 0 01-1 1h-6.5a1 1 0 01-1-1v-4a1 1 0 011-1z',
  ok: 'M8 2.25a5.75 5.75 0 110 11.5 5.75 5.75 0 010-11.5zM5.5 8.1l1.75 1.75 3.25-3.6',
};
function Icon({name, size = 16, className}) {
  return <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]}/></svg>;
}

/** Text that flips to a new value through a short scramble (at most 8 frames), then settles. */
function Scramble({text, reduced}) {
  const [shown, setShown] = useState(text);
  const settled = useRef(text); // the last value that finished settling (survives StrictMode's effect re-run)
  useLayoutEffect(() => {
    if (reduced || settled.current === text) { settled.current = text; setShown(text); return undefined; }
    const n = text.length;
    let f = 0, raf = 0;
    const frame = () => {
      f += 1;
      if (f >= SCRAMBLE_FRAMES) { settled.current = text; setShown(text); return; }
      const p = f / SCRAMBLE_FRAMES;
      let out = '';
      for (let i = 0; i < n; i++) {
        const fixed = p * (n + 4) - i >= 4; // characters settle left to right
        out += fixed ? text[i] : GLYPHS[((Math.imul(i + 1, 374761393) + Math.imul(f, 668265263)) >>> 0) % GLYPHS.length];
      }
      setShown(out);
      raf = requestAnimationFrame(frame);
    };
    frame(); // first scrambled frame before paint, so the old value never flashes
    return () => cancelAnimationFrame(raf);
  }, [text, reduced]);
  return <span className="vd-scr">{shown}</span>;
}

function ValueGlyph({r}) {
  if (r.kind === 'color') return <i className="vd-sw" style={{background: `#${r.value}`}} aria-hidden="true"/>;
  return <span className="vd-numg" aria-hidden="true"><Icon name={r.kind === 'radius' ? 'radius' : r.prop === 'Gap' ? 'gap' : 'padding'} size={14}/></span>;
}

function VarChip({id}) {
  const v = VARS[id];
  return <span className="vd-vchip" translate="no">
    {v.num === undefined ? <i className="vd-dot" style={{background: v.light}}/> : <Icon name="variable" size={12}/>}
    <span>{v.num === undefined ? shortName(id) : v.name}</span>
  </span>;
}

/* ---------- pane 1: the design file ---------- */

function BagGlyph() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 8.5h13l-1 11.5h-11z"/><path d="M9 8.5V7a3 3 0 016 0v1.5"/>
  </svg>;
}

function Card({s, mode, theme, hot, lang}) {
  const c = id => paint(s, mode, theme, id);
  const hotIn = ids => (ids.includes(hot) ? ' is-hot' : '');
  const flag = theme === 'dark' && mode === 'vars' && !s.bound['white-frame'];
  return <figure className="vd-figure" aria-label={pick(lang, 'The Home frame, painted by the agent’s code', '由 agent 代码渲染的 Home frame')}>
    <figcaption className="vd-frame-name" translate="no">Home</figcaption>
    <div className={`vd-home vd-part${hotIn(['bg', 's20', 's16'])}`} style={{background: c('bg'), '--pad': `${ROW.s20.value}px`, '--gap': `${ROW.s16.value}px`}}>
      <div className="vd-home-head">
        <span className={`vd-wordmark vd-part${hotIn(['text'])}`} style={{color: c('text')}}>Atelier</span>
        <span className="vd-bag" style={{color: c('text')}}><BagGlyph/><i className={`vd-count vd-part${hotIn(['accent'])}`} style={{background: c('accent')}}>2</i></span>
      </div>
      <div className="vd-home-body">
        <p className={`vd-title vd-part${hotIn(['text'])}`} style={{color: c('text')}}>New this week</p>
        <div className="vd-chips">
          <span className={`vd-chip vd-part${hotIn(['accent', 'white-text'])}`} style={{background: c('accent'), color: c('white-text')}}>All</span>
        </div>
        <div className={`vd-print vd-part${hotIn(['white-frame', 'r12'])}${flag ? ' is-flag' : ''}`} style={{background: c('white-frame'), borderRadius: `${ROW.r12.value}px`}}>
          <div className="vd-print-img">
            <img src={ART} alt="" width="600" height="350" loading="lazy" decoding="async"/>
            <span className={`vd-badge vd-part${hotIn(['gold'])}`} style={{background: c('gold')}}>Signed</span>
          </div>
          <div className="vd-print-meta">
            <span className={`vd-print-title vd-part${hotIn(['text'])}`} style={{color: c('text')}}>Enchanted Forest</span>
            <span className={`vd-price vd-part${hotIn(['text'])}`} style={{color: c('text')}}>$48</span>
          </div>
          <span className="vd-flag" aria-hidden={!flag}>{pick(lang, '#FFFFFF · not bound yet', '#FFFFFF · 还没绑定')}</span>
        </div>
        <div className={`vd-divider vd-part${hotIn(['border'])}`} style={{borderTopColor: c('border')}}/>
        <p className={`vd-more vd-part${hotIn(['text'])}`} style={{color: c('text')}}>More from Jay</p>
      </div>
    </div>
  </figure>;
}

function Tally({s, mode, theme, lang, setHot}) {
  const dark = theme === 'dark';
  const done = TALLY.filter(id => follows(s, mode, id)).length;
  let line;
  if (!dark) line = pick(lang, 'Switch to Dark: every token gets a new value, as when the design system ships a change.', '切到 Dark：每个 token 都换了值，就像设计系统发布了一次改动。');
  else if (mode === 'hex') line = pick(lang, `${done} of 4 followed: only the names the agent happened to guess, --color-accent and --color-border, are the tokens’ own.`, `4 个里跟上了 ${done} 个：只有 agent 碰巧猜中的 --color-accent 和 --color-border 是 token 自己的名字。`);
  else if (done === 4) line = pick(lang, '4 of 4 followed: bound values carry the tokens’ names into the code.', '4 个全部跟上：绑定之后，token 的名字直接写进了代码。');
  else line = pick(lang, `${done} of 4 followed: only the bound ones.`, `4 个里跟上了 ${done} 个：只有绑定了的。`);
  const notes = [];
  if (dark && mode === 'vars') {
    const wf = s.bound['white-frame'], wt = s.bound['white-text'];
    if (!wf) notes.push(pick(lang, 'The print card is #FFFFFF, still waiting for a choice. Its Dark value settles it.', '印品卡片是 #FFFFFF，还在等你选。看它的深色值就能定。'));
    else if (wf === 'onAccent') notes.push(pick(lang, 'The card uses color/on-accent, which stays white in Dark.', '卡片用了 color/on-accent，它在深色模式下还是白色。'));
    if (wt === 'surface') notes.push(pick(lang, 'The “All” label uses color/surface, which turns dark in Dark.', '“All”的文字用了 color/surface，它在深色模式下会变暗。'));
  }
  return <section className="vd-tally" aria-label={pick(lang, 'Token change', 'token 改动')}>
    <span className="vd-label">{pick(lang, 'Token change', 'token 改动')}</span>
    <ul className="vd-tchips">
      {TALLY.map(id => {
        const ok = follows(s, mode, id);
        const state = !dark ? 'idle' : ok ? 'ok' : 'no';
        return <li key={id} className={`vd-tchip is-${state}`} onMouseEnter={() => setHot(id)} onMouseLeave={() => setHot(null)}>
          <i className="vd-tsw" style={{background: paint(s, mode, theme, id)}} aria-hidden="true"/>
          <span translate="no">{shortName(ROW[id].cand[0])}</span>
          <b aria-hidden="true">{state === 'ok' ? <Icon name="check" size={14}/> : state === 'no' ? <Icon name="close" size={14}/> : <Icon name="minus" size={14}/>}</b>
          <span className="vd-sr">{state === 'ok' ? pick(lang, 'followed', '跟上了') : state === 'no' ? pick(lang, 'did not follow', '没跟上') : ''}</span>
        </li>;
      })}
    </ul>
    <p className="vd-tline" aria-live="polite">{line}</p>
    {notes.map(n => <p key={n} className="vd-tnote">{n}</p>)}
    <p className="vd-illus">{pick(lang,
      'Illustration of the measured result: 100% of token changes followed with variables bound (9 of 9 builds) · 50% with hex values (median build), across 37 builds.',
      '示意实测结果：绑定 variables 时，token 改动 100% 跟上（9/9 次构建）；只有 hex 值时，中位构建只跟上 50%；共 37 次构建。')}</p>
  </section>;
}

/* ---------- pane 2: the lens ---------- */

function Picker({r, s, theme, dispatch, onClose}) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('[data-opt]:not([aria-disabled="true"]), .vd-picker-foot button')?.focus({preventScroll: true});
    const away = e => { if (!ref.current?.contains(e.target) && !e.target.closest?.(`[data-pick="${r.id}"]`)) onClose(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [r.id, onClose]);
  const onBlur = e => {
    const next = e.relatedTarget;
    if (next && !ref.current?.contains(next) && !next.closest?.(`[data-pick="${r.id}"]`)) onClose(false);
  };
  const chosen = target(s, r);
  const onKeyDown = e => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(true); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const els = [...ref.current.querySelectorAll('[data-opt]:not([aria-disabled="true"])')];
    if (!els.length) return;
    e.preventDefault();
    const i = els.indexOf(document.activeElement);
    els[e.key === 'ArrowDown' ? Math.min(els.length - 1, i + 1) : Math.max(0, i - 1)].focus();
  };
  const option = (id, disabled) => {
    const v = VARS[id];
    return <li key={id} role="presentation">
      <button type="button" role="option" data-opt aria-selected={chosen === id} aria-disabled={disabled || undefined}
        className={`vd-opt${chosen === id ? ' is-sel' : ''}${disabled ? ' is-off' : ''}`} title={`${v.coll} · ${v.scope}`}
        onClick={disabled ? undefined : () => { dispatch({type: 'choose', id: r.id, v: id}); onClose(true); }}>
        <i className="vd-sw" style={{background: v[theme] || v.light}} aria-hidden="true"/>
        <span className="vd-opt-txt">
          <span className="vd-opt-name" translate="no">{v.name}</span>
          <span className="vd-opt-meta">{disabled ? `${v.coll} · ${v.scope}` : <>Light {v.light.slice(1)} · <b>Dark {v.dark.slice(1)}</b></>}</span>
        </span>
        {v.dark ? <span className="vd-pair" aria-hidden="true"><i style={{background: v.light}}/><i style={{background: v.dark}}/></span> : <span/>}
      </button>
    </li>;
  };
  return <div ref={ref} className="vd-picker" role="dialog" aria-label={`Variables for ${roleOf(r)}`} onKeyDown={onKeyDown} onBlur={onBlur}>
    <div className="vd-picker-head">
      <span className="vd-picker-t">Variables</span>
      <span className="vd-picker-for" translate="no">{fmt(r)} · {r.prop}</span>
      <button type="button" className="vd-ibtn" aria-label="Close" onClick={() => onClose(true)}><Icon name="close"/></button>
    </div>
    <div className="vd-picker-body">
      <div className="vd-picker-sec">Same value, allowed for {r.prop.toLowerCase()}<span>{r.cand.length}</span></div>
      {r.cand.length
        ? <ul role="listbox" aria-label="Variables">{r.cand.map(id => option(id, false))}</ul>
        : <p className="vd-picker-empty">No variable has this value in a scope that allows {r.prop.toLowerCase()}.</p>}
      {r.blocked?.length ? <>
        <div className="vd-picker-sec">Same value, not available here</div>
        <ul role="listbox" aria-label="Not available">{r.blocked.map(id => option(id, true))}</ul>
      </> : null}
    </div>
    {r.cand.length ? null : <div className="vd-picker-foot">
      <button type="button" className="vd-btn" onClick={() => { dispatch({type: 'exempt', id: r.id}); onClose(true); }}>Keep as a raw value</button>
    </div>}
  </div>;
}

function Row({r, s, theme, hot, setHot, picker, openPicker, closePicker, dispatch, reduced, triggers, rowsRef}) {
  const bound = s.bound[r.id], exempt = s.exempt[r.id];
  const t = target(s, r), checked = isChecked(s, r);
  const open = picker === r.id;
  const value = bound ? VARS[bound].name : fmt(r);
  let end;
  if (bound) end = <span className="vd-done">Applied</span>;
  else if (exempt) end = <button type="button" className="vd-textbtn" onClick={() => dispatch({type: 'restore', id: r.id})}>Restore</button>;
  else if (r.cand.length === 1) end = <span className="vd-static"><VarChip id={t}/></span>;
  else end = <button type="button" ref={el => { triggers.current[r.id] = el; }} data-pick={r.id}
    className={`vd-pick${open ? ' is-open' : ''}`} aria-haspopup="dialog" aria-expanded={open}
    aria-label={t ? `Variable: ${VARS[t].name}. Change` : r.cand.length ? `${r.cand.length} matches. Choose a variable` : 'No match. Options'}
    onClick={() => (open ? closePicker(false) : openPicker(r.id))}>
    {t ? <VarChip id={t}/> : <span className={`vd-hintchip${r.cand.length ? ' is-warn' : ''}`}>{r.cand.length ? `${r.cand.length} matches` : 'No match'}</span>}
    <Icon name="chevron" size={14}/>
  </button>;
  return <li ref={el => { rowsRef.current[r.id] = el; }} className={`vd-row${hot === r.id ? ' is-hot' : ''}${bound ? ' is-bound' : ''}${exempt ? ' is-exempt' : ''}${open ? ' is-open' : ''}`}
    onMouseEnter={() => setHot(r.id)} onMouseLeave={() => setHot(null)}
    onFocus={() => setHot(r.id)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHot(null); }}>
    <span className="vd-row-state">
      {bound ? <span className="vd-state is-ok"><Icon name="check"/></span>
        : exempt ? <span className="vd-state"><Icon name="lock" size={14}/></span>
          : <button type="button" role="checkbox" aria-checked={checked} disabled={!t} className={`vd-cbx${checked ? ' is-on' : ''}`}
            aria-label={`Include ${roleOf(r)}`} onClick={() => dispatch({type: 'check', id: r.id, on: !checked})}>
            <i><Icon name="check" size={12}/></i>
          </button>}
    </span>
    <span className="vd-row-main">
      <span className={`vd-val${bound ? ' is-token' : ''}`} translate="no"><ValueGlyph r={r}/><Scramble text={value} reduced={reduced}/></span>
      <span className="vd-role">{r.prop} · {exempt ? 'kept raw' : <>{r.layers}<span className="vd-role-unit"> {r.layers === 1 ? 'layer' : 'layers'}</span></>}</span>
    </span>
    <span className="vd-row-end">{end}</span>
    {open ? <Picker r={r} s={s} theme={theme} dispatch={dispatch} onClose={closePicker}/> : null}
  </li>;
}

function Toast({toast, onUndo, onDone, reduced}) {
  const [shown, setShown] = useState(toast);
  const [phase, setPhase] = useState('in');
  const hovering = useRef(false);
  useEffect(() => {
    if (toast) { setShown(toast); setPhase('in'); return undefined; }
    setPhase('out');
    const t = setTimeout(() => setShown(null), reduced ? 0 : 180);
    return () => clearTimeout(t);
  }, [toast, reduced]);
  useEffect(() => {
    if (!toast) return undefined;
    let t;
    const tick = () => { if (hovering.current) t = setTimeout(tick, 800); else onDone(toast.id); };
    t = setTimeout(tick, 6000);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  return <div className="vd-toast-wrap" role="status" aria-live="polite">
    {shown ? <div className={`vd-toast is-${phase}`} onMouseEnter={() => { hovering.current = true; }} onMouseLeave={() => { hovering.current = false; }}
      onFocus={() => { hovering.current = true; }} onBlur={() => { hovering.current = false; }}>
      <span>{shown.text}</span>
      <i aria-hidden="true"/>
      <button type="button" onClick={onUndo} disabled={phase === 'out'}>Undo</button>
    </div> : null}
  </div>;
}

/* ---------- pane 3: the agent's code ---------- */

function Tag({kind}) {
  if (!kind) return null;
  return <span className={`vd-ctag is-${kind.replace(' ', '-')}`}>{kind === 'asks' ? '? asks' : kind}</span>;
}

function CodeValue({r, s, mode, theme, reduced}) {
  const v = s.bound[r.id], color = r.kind === 'color';
  let cls, core, wrap = false, sw = false;
  if (mode === 'hex') {
    if (color) { cls = r.guessed ? 'is-guess' : 'is-made'; core = `--${r.raw}`; wrap = true; sw = true; }
    else { cls = 'is-raw'; core = `${r.value}px`; }
  } else if (v) { cls = 'is-token'; core = cssVar(v); wrap = true; sw = color; }
  else { cls = 'is-raw'; core = color ? `#${r.value}` : `${r.value}px`; sw = color; }
  const parts = [];
  if (wrap) parts.push(<span key="a" className="vd-c-p">var(</span>);
  if (sw) parts.push(<i key="sw" className="vd-csw" style={{background: paint(s, mode, theme, r.id)}} aria-hidden="true"/>);
  parts.push(<span key="core" className="vd-c-core"><Scramble text={core} reduced={reduced}/></span>);
  if (wrap) parts.push(<span key="b" className="vd-c-p">)</span>);
  return <span className={`vd-c-val ${cls}`}>{parts}</span>;
}

function CodeLines({s, mode, theme, hot, reduced}) {
  const lines = [];
  lines.push({key: 'head', body: <span className="vd-c-com">{mode === 'hex' ? '/* Home.css, written from hex values */' : '/* Home.css, written from Atelier tokens */'}</span>});
  if (mode === 'hex') {
    lines.push({key: 'root', body: <><span className="vd-c-sel">:root</span><span className="vd-c-p"> {'{'}</span></>});
    ROOT_ORDER.forEach(id => {
      const r = ROW[id];
      lines.push({key: `root-${id}`, row: id, body: <>
        {'  '}<span className={`vd-c-def ${r.guessed ? 'is-guess' : 'is-made'}`}>--{r.raw}</span><span className="vd-c-p">: </span>
        <i className="vd-csw" style={{background: `#${r.value}`}} aria-hidden="true"/><span className="vd-c-hex">#{r.value}</span><span className="vd-c-p">;</span>
        {r.guessed ? <Tag kind="guessed"/> : null}
      </>});
    });
    lines.push({key: 'root-end', body: <span className="vd-c-p">{'}'}</span>});
  }
  RULES.forEach(rule => {
    lines.push({key: `${rule.sel}-open`, body: <><span className="vd-c-sel">{rule.sel}</span><span className="vd-c-p"> {'{'}</span></>});
    rule.decls.forEach(([prop, id, pre]) => {
      const tag = mode === 'vars' && !s.bound[id] ? (s.exempt[id] ? 'kept raw' : 'asks') : null;
      lines.push({key: `${rule.sel}-${prop}`, row: id, body: <>
        {'  '}<span className="vd-c-prop">{prop}</span><span className="vd-c-p">: </span>{pre ? <span className="vd-c-hex">{pre}</span> : null}
        <CodeValue r={ROW[id]} s={s} mode={mode} theme={theme} reduced={reduced}/><span className="vd-c-p">;</span><Tag kind={tag}/>
      </>});
    });
    lines.push({key: `${rule.sel}-close`, body: <span className="vd-c-p">{'}'}</span>});
  });
  return lines.map((l, i) => <span key={l.key} className={`vd-ln${l.row && l.row === hot ? ' is-hot' : ''}`}>
    <span className="vd-n" aria-hidden="true">{i + 1}</span><span className="vd-t">{l.body}</span>
  </span>);
}

function AgentStrip({s, mode, lang, sum, deferred, setDeferred, dispatch, openInLens}) {
  if (mode === 'hex') {
    return <div className="vd-agent">
      <p className="vd-agent-explain">{pick(lang,
        'The file has only hex and px, so the agent names what it sees: 7 names made up, 2 that happen to match your tokens, 3 px values copied.',
        '文件里只有 hex 和 px，agent 只能照着看到的样子起名：7 个名字是编的，2 个碰巧和 token 同名，3 个 px 值直接照抄。')}</p>
      <p className="vd-legend"><span><i className="is-made"/>{pick(lang, 'name the agent made up', 'agent 编的名字')}</span><span><i className="is-token"/>{pick(lang, 'your variable’s name', '你的 variable 名')}</span></p>
    </div>;
  }
  const note = agentNote(sum, 'en');
  const ask = sum.amb.find(r => !deferred.includes(r.id));
  const gold = !ask ? sum.none.find(r => !deferred.includes(r.id)) : null;
  const waiting = sum.suggested;
  return <div className="vd-agent" lang="en">
    <p className="vd-agent-line"><span className="vd-dot-ok" aria-hidden="true">⏺</span>
      <span>{note}{lang === 'zh' ? <span className="vd-agent-zh" lang="zh-CN">{agentNote(sum, 'zh')}</span> : null}</span></p>
    {waiting.length ? <p className="vd-agent-dim">{waiting.length} suggested, not bound yet: {waiting.slice(0, 2).map(r => VARS[r.cand[0]].name).join(', ')}{waiting.length > 2 ? ` … +${waiting.length - 2}` : ''}</p> : null}
    {ask ? <div key={ask.id} className="vd-ask" role="group" aria-label="The agent’s question">
      <p className="vd-ask-q"><b aria-hidden="true">?</b>Which variable should #{fmt(ask)} use as {ask.prop.toLowerCase()} ({ask.usage})?</p>
      {ask.cand.map((id, i) => <button key={id} type="button" className="vd-ask-opt" onClick={() => dispatch({type: 'answer', id: ask.id, v: id})}>
        <span className="vd-ask-n">{i + 1}</span><span className="vd-ask-name" translate="no">{VARS[id].name}</span><span className="vd-ask-use">{VARS[id].usage}</span>
      </button>)}
      <button type="button" className="vd-ask-opt" onClick={() => setDeferred(d => [...d, ask.id])}>
        <span className="vd-ask-n">{ask.cand.length + 1}</span><span className="vd-ask-keep">Keep the hex for now</span>
      </button>
    </div> : gold ? <div key={gold.id} className="vd-ask" role="group" aria-label="The agent’s question">
      <p className="vd-ask-q"><b aria-hidden="true">?</b>Before I name #{fmt(gold)}: should it be a new variable, or stay raw?</p>
      <button type="button" className="vd-ask-opt" onClick={() => dispatch({type: 'exempt', id: gold.id})}><span className="vd-ask-n">1</span><span className="vd-ask-keep">Keep it raw</span></button>
      <button type="button" className="vd-ask-opt" onClick={() => openInLens(gold.id)}><span className="vd-ask-n">2</span><span className="vd-ask-keep">Open in Check designs</span></button>
    </div> : null}
  </div>;
}

/* ---------- the demo ---------- */

export default function VariablesDemo({lang = 'en', reduced = false}) {
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const [theme, setTheme] = useState('light');
  const [listOpen, setListOpen] = useState(true);
  const [picker, setPicker] = useState(null);
  const [hot, setHot] = useState(null);
  const [deferred, setDeferred] = useState([]);
  const triggers = useRef({}), rowsRef = useRef({}), applyRef = useRef(null), checkRef = useRef(null);
  const sum = summarize(s), mode = modeOf(s);
  const items = ROWS.filter(r => isChecked(s, r));
  const selectable = sum.open.filter(r => target(s, r));
  const allState = !items.length ? false : items.length === selectable.length ? true : 'mixed';
  const nOpen = sum.open.length;
  const pristine = !s.history.length && !Object.keys(s.choice).length && !Object.keys(s.checked).length && theme === 'light' && !deferred.length;
  const zh = lang === 'zh';

  const closePicker = useRef(null);
  closePicker.current = focus => {
    const id = picker;
    setPicker(null);
    if (focus && id) requestAnimationFrame(() => triggers.current[id]?.focus({preventScroll: true}));
  };
  const close = useRef(focus => closePicker.current(focus)).current;
  const onDone = useRef(id => dispatch({type: 'toast-done', id})).current;

  const undo = () => { dispatch({type: 'undo'}); setPicker(null); };
  const reset = () => { dispatch({type: 'reset'}); setTheme('light'); setPicker(null); setDeferred([]); setListOpen(true); };
  const openInLens = id => {
    setListOpen(true);
    setPicker(id);
    requestAnimationFrame(() => rowsRef.current[id]?.scrollIntoView({block: 'nearest', behavior: reduced ? 'auto' : 'smooth'}));
  };
  const onKeyDown = e => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z' && s.history.length) {
      e.preventDefault();
      undo();
    }
  };

  const rowTitle = nOpen ? plural(nOpen, 'unbound value', 'unbound values') : 'All values use variables';
  const cdSummary = !nOpen
    ? `Every value on Home uses a variable${sum.exempt.length ? `, except ${sum.exempt.length} you marked exempt` : ''}.`
    : `${nOpen} ${nOpen === 1 ? 'value isn’t' : 'values aren’t'} bound to variables. ${sum.suggested.length
      ? `${sum.suggested.length} ${sum.suggested.length === 1 ? 'has' : 'have'} a suggested variable.`
      : `Choose a variable for ${nOpen === 1 ? 'it' : 'each'}, or exempt ${nOpen === 1 ? 'it' : 'the ones you mean to keep'}.`} Coding agents read unbound values as plain hex and px.`;
  const split = sum.amb.length > 1;

  return <div className={`vd${reduced ? ' vd-reduced' : ''}`} lang={zh ? 'zh-CN' : 'en'} onKeyDown={onKeyDown}>
    <div className="vd-top">
      <p className="vd-hint">{pick(lang,
        'Switch the tokens to Dark: only 2 of the 4 changes reach the card. Then press Apply 9 and switch again.',
        '先把 tokens 切到 Dark：4 处改动只有 2 处传到卡片上。再点 Apply 9，然后再切一次。')}</p>
      <button type="button" className="vd-reset" onClick={reset} disabled={pristine}>{pick(lang, 'Reset', '重置')}</button>
    </div>

    <div className="vd-board">
      {/* 1. the design file */}
      <section className="vd-pane vd-pane-card" aria-labelledby="vd-p1">
        <header className="vd-pane-head"><span className="vd-label" id="vd-p1"><b>01</b>{pick(lang, 'Design file', '设计文件')}</span></header>
        <div className="vd-mode-row">
          <span className="vd-mode-label">{pick(lang, 'Change a token', '改一个 token')}<small translate="no">Atelier tokens</small></span>
          <div className="vd-seg" role="radiogroup" aria-label="Atelier tokens mode" data-on={theme} lang="en">
            <i className="vd-seg-thumb" aria-hidden="true"/>
            {['light', 'dark'].map(m => <button key={m} type="button" role="radio" aria-checked={theme === m} onClick={() => setTheme(m)}>{m === 'light' ? 'Light' : 'Dark'}</button>)}
          </div>
        </div>
        <div className="vd-card-body">
          <Card s={s} mode={mode} theme={theme} hot={hot} lang={lang}/>
          <Tally s={s} mode={mode} theme={theme} lang={lang} setHot={setHot}/>
        </div>
      </section>

      {/* 2. the lens */}
      <section className="vd-pane vd-pane-lens" aria-labelledby="vd-p2" lang="en">
        <header className="vd-pane-head">
          <span className="vd-label" id="vd-p2"><b>02</b>Variables for agents</span>
          <span className="vd-scope" translate="no">Frame · Home</span>
        </header>
        <div className={`vd-prow${nOpen ? '' : ' is-quiet'}`}>
          <Icon name={nOpen ? 'variable' : 'ok'} className="vd-prow-ic"/>
          <span className="vd-prow-t" aria-live="polite">{rowTitle}</span>
          {sum.exempt.length && !nOpen ? <span className="vd-prow-d">{sum.exempt.length} exempt</span> : null}
          <button ref={checkRef} type="button" className={`vd-btn-ghost${listOpen ? ' is-on' : ''}`} aria-expanded={listOpen} aria-controls="vd-cd" onClick={() => { setListOpen(o => !o); setPicker(null); }}>Check</button>
        </div>

        {listOpen ? <div className="vd-cd" id="vd-cd" role="region" aria-label="Check designs">
          <div className="vd-cd-head">
            <span className="vd-cd-name"><span className="vd-cd-title">Check designs</span><span className="vd-lens"><Icon name="variable" size={14}/>Variables for agents</span></span>
            <button type="button" className="vd-ibtn" aria-label="Close Check designs" onClick={() => { setListOpen(false); setPicker(null); checkRef.current?.focus(); }}><Icon name="close"/></button>
          </div>
          <p className="vd-cd-sum">{cdSummary}{split ? <span className="vd-cd-split"><Icon name="split" size={13}/>FFFFFF is used in two roles, each on its own row.</span> : null}</p>
          <div className="vd-list-head">
            <button type="button" role="checkbox" aria-checked={allState} disabled={!selectable.length} className={`vd-cbx${allState === true ? ' is-on' : allState === 'mixed' ? ' is-mixed' : ''}`}
              aria-label="Select all values to review" onClick={() => dispatch({type: 'check-all', on: allState !== true})}>
              <i>{allState === 'mixed' ? <Icon name="minus" size={12}/> : <Icon name="check" size={12}/>}</i>
            </button>
            <span className="vd-list-t">To review</span><span className="vd-list-n">{nOpen}</span>
            <span className="vd-grow"/>
            {sum.bound.length ? <span className="vd-list-applied">{sum.bound.length} applied</span> : null}
          </div>
          <ul className="vd-list" onMouseLeave={() => setHot(null)}>
            {ROWS.map(r => <Row key={r.id} r={r} s={s} theme={theme} hot={hot} setHot={setHot} picker={picker} openPicker={setPicker} closePicker={close}
              dispatch={dispatch} reduced={reduced} triggers={triggers} rowsRef={rowsRef}/>)}
          </ul>
          <div className="vd-cd-foot">
            <span className="vd-cd-note">One undo step</span>
            <button ref={applyRef} type="button" className="vd-apply" disabled={!items.length} onClick={() => { dispatch({type: 'apply'}); setPicker(null); }}>
              {items.length ? `Apply ${items.length}` : 'Apply'}
            </button>
          </div>
        </div> : <p className="vd-cd-closed" lang={zh ? 'zh-CN' : 'en'}>{pick(lang,
          'Check opens Check designs with the Variables for agents lens: one row per value and role.',
          '点 Check，会打开 Check designs 并切到 Variables for agents 视图：每个“值 + 用途”占一行。')}</p>}
        <Toast toast={s.toast} reduced={reduced} onDone={onDone} onUndo={() => { undo(); applyRef.current?.focus({preventScroll: true}); }}/>
      </section>

      {/* 3. the agent's code */}
      <section className="vd-pane vd-pane-code" aria-labelledby="vd-p3">
        <header className="vd-pane-head">
          <span className="vd-label" id="vd-p3"><b>03</b>{pick(lang, 'What the agent writes', 'agent 写出的代码')}</span>
          <span className={`vd-file is-${mode}`} lang="en"><i aria-hidden="true"/>{mode === 'hex' ? 'from hex values' : 'from variables'}</span>
        </header>
        <div className="vd-code-body">
          <pre className={`vd-code is-${mode}`} tabIndex={0} aria-label="Home.css" lang="en" translate="no">
            <code><CodeLines s={s} mode={mode} theme={theme} hot={hot} reduced={reduced}/></code>
          </pre>
        </div>
        <AgentStrip s={s} mode={mode} lang={lang} sum={sum} deferred={deferred} setDeferred={setDeferred} dispatch={dispatch} openInLens={openInLens}/>
      </section>
    </div>

    <p className="vd-fine">{pick(lang, 'Concept, not affiliated with Figma.', '概念设计，与 Figma 没有隶属关系。')}</p>
  </div>;
}
