# 樱花收尾动效重做 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把作品区之后的樱花收尾改成一支带惯性、有剪辑语言和胶片后期的电影片头式滚动段落。

**Architecture:** 一份纯数据的剪辑表 `CUT` + 纯函数 `channels(p)` 给出全部连续通道;`Finale.jsx` 用一条被 ScrollTrigger `scrub` 的 GSAP 时间轴推进平滑进度,并在同一条时间轴上编排遮罩字幕;`BlossomScene` 与 DOM 读同一组通道值。后期层(光晕、跟焦、光圈、颗粒)是叠在舞台里的 DOM 层。

**Tech Stack:** React 19、Vite 7、three 0.180、gsap 3.15(含 ScrollTrigger),测试用 `node:test` + esbuild(已是依赖)。

**Spec:** `docs/superpowers/specs/2026-09-27-finale-motion-design.md`

**执行方式:** 用户已授权全部决定;本会话内联执行(superpowers:executing-plans),不等待逐任务评审。

## Global Constraints

- 不新增任何依赖。
- 所有文案逐字保留(中英两套)。
- 收尾段总高度不变:`680vh`,手机 `610svh`(v16.css 现有值)。
- `.quiet`(减少动态效果)下的静态深色排版保持现状;该模式不建时间轴。
- 站点其他段落(开场、影片、系统策划、作品区、联系页)的动效不改,桥段/跨段花瓣的外形与翻飞除外。
- 字幕的初始隐藏态只能由 JS(`gsap.fromTo` / `gsap.set`)施加,CSS 默认态必须可读。
- 所有测试从 `app/` 目录运行:`node <file>`。
- 提交信息末尾带 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

1. **收尾段上方的内容在加载后改变高度**(NEXUS 海报/视频、字体、图片)→ 期望时间轴仍与滚动对齐。由 Task 4 的 `document.body` ResizeObserver + 浏览器检查 4c 固定。
2. **在收尾段中途切换语言**(字数与换行都变)→ 期望没有卡在隐藏态的字幕,阅读光标重新从当前进度起算。由 Task 4 的清理逻辑 + 浏览器检查 4d 固定。
3. **在收尾段中途打开「减少动态效果」**→ 期望所有内联样式被清除、静态排版全部可读。由 Task 4 清理逻辑 + 浏览器检查 4e 固定。
4. **快速跳过整段**(导航直接点「联系」,或拖动滚动条从顶到底)再倒回中间 → 期望各镜状态正确,不残留半截字幕。由浏览器检查 4f 固定。
5. **在收尾段上弹出作品页再关闭** → 期望颗粒与画布在弹出期间暂停,关闭后恢复。由 Task 3 的 `body.portfolio-route-open` 规则 + 浏览器检查 4g 固定。

---

### Task 0: 基线测量(改动前)

**Files:**
- Modify: `E:\工作\作品集网站\.claude\launch.json`(会话启动目录下的预览配置,不在仓库内)

- [ ] **Step 1: 加一个指向工作区的预览配置(端口 4317)**

在 `configurations` 数组里追加:

```json
{
  "name": "finale",
  "runtimeExecutable": "node",
  "runtimeArgs": ["repo/.worktrees/finale-motion/app/node_modules/vite/bin/vite.js", "repo/.worktrees/finale-motion/app", "--host", "127.0.0.1", "--port", "4317", "--strictPort"],
  "port": 4317,
  "url": "http://127.0.0.1:4317"
}
```

- [ ] **Step 2: 启动并跳过开场**

`preview_start` name=`finale`,然后在页面里执行:

```js
[...document.querySelectorAll('button')].find(b=>/进入作品集|Enter the studio/.test(b.textContent))?.click();
```

- [ ] **Step 3: 跑帧时间脚本,记录基线**

```js
const f=document.querySelector('.finale-journey'),top=f.offsetTop,len=f.offsetHeight-innerHeight;
scrollTo(0,top-innerHeight);await new Promise(r=>setTimeout(r,800));
const deltas=[];let last=performance.now();
for(let i=0;i<=360;i++){scrollTo(0,top-innerHeight+(len+innerHeight)*i/360);await new Promise(r=>requestAnimationFrame(r));const now=performance.now();deltas.push(now-last);last=now;}
deltas.sort((a,b)=>a-b);const pick=q=>deltas[Math.floor(q*(deltas.length-1))];
({p50:+pick(.5).toFixed(1),p95:+pick(.95).toFixed(1),max:+deltas.at(-1).toFixed(1),long:deltas.filter(d=>d>33).length});
```

Expected:返回四个数字。若 `p50 > 100`,说明预览面板在后台、`requestAnimationFrame` 被节流,测量无效——先把浏览器面板切到前台再测。把结果记进本文件末尾的「测量记录」。

---

### Task 1: 剪辑表与通道函数

**Files:**
- Create: `app/src/finale-cut.js`
- Test: `app/src/finale-cut.test.mjs`

**Interfaces:**
- Produces: `EASE`(曲线名对象)、`CUT`(`{[beat]: [start, end]}`)、`span(p, [a, b]) → 0..1`、`channels(p) → {p, approach, retreat, close, dark, iris, focus, depth, read, halo, haloScale, grain}`,全部数值。

- [ ] **Step 1: 写失败的测试**

`app/src/finale-cut.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {CUT, channels} from './finale-cut.js';

const samples = Array.from({length: 10001}, (_, i) => i / 10000);

test('every beat sits inside the finale and runs forward', () => {
  for (const [name, [a, b]] of Object.entries(CUT)) assert.ok(a >= 0 && b <= 1 && a < b, `${name} = [${a}, ${b}]`);
});

test('the finale opens on the whole sculpture and ends pulled back in the light', () => {
  const start = channels(0), end = channels(1);
  assert.deepEqual([start.approach, start.dark, start.retreat, start.close, start.iris], [0, 0, 0, 0, 0]);
  assert.deepEqual([end.retreat, end.dark, end.close, end.iris], [1, 0, 0, 0]);
});

test('the reading happens in full darkness', () => {
  for (const p of samples.filter(p => p >= 0.50 && p <= 0.70)) assert.ok(channels(p).dark > 0.99, `dark ${channels(p).dark} at ${p}`);
});

test('the ground only changes colour while the petal fills the frame', () => {
  // close >= 0.7 keeps the camera within ~0.5 units of the petal skin, where the
  // petal covers the frame; below that the flower reads as an object again.
  for (const p of samples) {
    const c = channels(p);
    if (c.dark > 0.02) assert.ok(c.close > 0.7, `dark ${c.dark.toFixed(3)} with close ${c.close.toFixed(3)} at ${p}`);
  }
});

test('the camera never backs up on the dive or creeps forward on the way out', () => {
  let approach = -1, retreat = -1;
  for (const p of samples) {
    const c = channels(p);
    assert.ok(c.approach >= approach && c.retreat >= retreat, `at ${p}`);
    ({approach, retreat} = c);
  }
});

test('no channel jumps between neighbouring scroll positions', () => {
  const keys = ['approach', 'retreat', 'dark', 'iris', 'focus', 'depth', 'halo', 'haloScale', 'read', 'grain'];
  let previous = channels(0);
  for (const p of samples.slice(1)) {
    const c = channels(p);
    for (const key of keys) assert.ok(Math.abs(c[key] - previous[key]) < 0.012, `${key} jumps ${Math.abs(c[key] - previous[key]).toFixed(4)} at ${p}`);
    previous = c;
  }
});

test('the read head sweeps exactly across its beat', () => {
  const [a, b] = CUT.read;
  assert.equal(channels(a - 0.005).read, 0);
  assert.equal(channels(b + 0.005).read, 1);
  assert.ok(Math.abs(channels((a + b) / 2).read - 0.5) < 1e-9);
});

test('the iris settles into a spotlight for the reading', () => {
  const reading = channels(0.6);
  assert.ok(reading.iris > 0.55 && reading.iris < 0.65, `iris ${reading.iris}`);
});

test('malformed progress falls back to a valid frame', () => {
  assert.equal(channels(NaN).p, 0);
  assert.equal(channels(-3).p, 0);
  assert.equal(channels(7).p, 1);
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `node src/finale-cut.test.mjs`
Expected: FAIL,`Cannot find module ... finale-cut.js`

- [ ] **Step 3: 写实现**

`app/src/finale-cut.js`:

```js
import gsap from 'gsap';

/** Named curves, shared by the pure channels below and the timeline tweens in
 *  Finale.jsx, so a beat never moves on two different speed graphs. */
export const EASE = {
  camera: 'expo.inOut',
  light: 'power2.inOut',
  cutIn: 'expo.out',
  cutOut: 'expo.in',
  settle: 'power2.out',
};

/** The edit list. Every beat is [start, end] in finale scroll progress; beats
 *  overlap on purpose, like offset layers in a comp. See the design spec. */
export const CUT = {
  inviteOut: [0.07, 0.15],
  dive: [0.13, 0.40],
  titleIn: [0.17, 0.26],
  focusIn: [0.20, 0.27],
  focusOut: [0.34, 0.40],
  titleOut: [0.35, 0.42],
  irisClose: [0.37, 0.47],
  darkIn: [0.40, 0.48],
  depth: [0.47, 0.77],
  eyebrow: [0.48, 0.53],
  irisRelax: [0.48, 0.54],
  read: [0.51, 0.69],
  details: [0.62, 0.70],
  philOut: [0.71, 0.76],
  darkOut: [0.74, 0.84],
  retreat: [0.80, 0.96],
  ending: [0.90, 1.00],
};

const camera = gsap.parseEase(EASE.camera);
const light = gsap.parseEase(EASE.light);
const clamp01 = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
export const span = (p, [a, b]) => clamp01((p - a) / (b - a));

/** Every continuous value the finale needs at smoothed progress p. Pure, so the
 *  3D camera and the DOM read the same numbers and cannot drift apart. */
export function channels(p) {
  p = clamp01(Number.isFinite(p) ? p : 0);
  const approach = camera(span(p, CUT.dive));
  const retreat = camera(span(p, CUT.retreat));
  const close = approach * (1 - retreat);
  const lightsOn = light(span(p, CUT.darkOut));
  const dark = light(span(p, CUT.darkIn)) * (1 - lightsOn);
  // The iris shuts ahead of the cut, relaxes into a spotlight for the reading,
  // and opens with the returning light.
  const iris = light(span(p, CUT.irisClose)) * (1 - 0.4 * light(span(p, CUT.irisRelax))) * (1 - lightsOn);
  const focus = light(span(p, CUT.focusIn)) * (1 - light(span(p, CUT.focusOut)));
  const [d0, d1] = CUT.depth;
  const depth = light(span(p, [d0, d0 + 0.05])) * (1 - light(span(p, [d1 - 0.05, d1])));
  return {
    p, approach, retreat, close, dark, iris, focus, depth,
    read: span(p, CUT.read),
    halo: (1 - dark) * mix(0.55, 0.95, close),
    haloScale: 1 + 1.4 * close,
    grain: mix(0.05, 0.10, dark),
  };
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `node src/finale-cut.test.mjs`
Expected: 9 个测试全部 `ok`,`fail 0`

- [ ] **Step 5: 提交**

```bash
git add app/src/finale-cut.js app/src/finale-cut.test.mjs
git commit -m "feat(finale): edit list and pure channels for the blossom finale"
```

---

### Task 2: BlossomScene 改读通道

**Files:**
- Modify: `app/src/BlossomScene.jsx`(文件头的 `clamp`/`smooth` 两行、组件签名与注释、`render()` 里的阶段计算、`darkUniform` 赋值、`dataset.phase`)

**Interfaces:**
- Consumes: `channels`、`CUT`(Task 1)
- Produces: `BlossomScene({progress = 0, reducedMotion = false, getChannels, getProgress})`——`getChannels()` 返回 `channels()` 的对象;`getProgress` 仅为过渡期兼容,Task 3 删除。

- [ ] **Step 1: 换掉本地的阶段数学**

把

```js
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
```

替换为

```js
import { CUT, channels } from './finale-cut';
```

(放到文件顶部 import 区,删除这两行。)

- [ ] **Step 2: 签名与注释**

把组件上方的注释和签名替换为:

```js
/**
 * Renders the flower from the finale's channels (see finale-cut.js). The
 * timeline owns the scroll clock; getChannels() hands this scene the same
 * smoothed values the DOM uses, without a React rerender per frame.
 * The plain progress prop remains supported.
 */
export default function BlossomScene({ progress = 0, reducedMotion = false, getChannels, getProgress }) {
  const mountRef = useRef(null);
  const inputs = useRef({ progress, reducedMotion, getChannels, getProgress });
  inputs.current = { progress, reducedMotion, getChannels, getProgress };
```

- [ ] **Step 3: `render()` 里读通道**

把

```js
      const input = inputs.current;
      const supplied = input.getProgress ? input.getProgress() : input.progress;
      const p = clamp(Number.isFinite(supplied) ? supplied : 0);
      const still = input.reducedMotion;
      const approach = smooth(0.15, 0.38, p);
      const retreat = smooth(0.72, 0.94, p);
      const close = approach * (1 - retreat);
      const dark = smooth(0.38, 0.50, p) * (1 - smooth(0.745, 0.90, p));
```

替换为

```js
      const input = inputs.current;
      const { p, retreat, close, dark } = input.getChannels ? input.getChannels()
        : channels(input.getProgress ? input.getProgress() : input.progress);
      const still = input.reducedMotion;
```

把 `darkUniform.value = dark;` 改为

```js
      // Keep 6% of the painted skin: the dark reads as the inside of the petal, not a void.
      darkUniform.value = dark * 0.94;
```

把 `mount.dataset.phase = ...` 整行替换为

```js
      mount.dataset.phase = p < CUT.dive[0] ? 'sculpture' : p < CUT.darkIn[0] ? 'approach' : p < CUT.darkIn[1] ? 'pink-to-black' : p < CUT.darkOut[0] ? 'philosophy' : p < CUT.retreat[1] ? 'return' : 'ending';
```

- [ ] **Step 4: 构建与现有测试**

Run: `npm run build` → Expected: `✓ built`
Run: `node src/finale-cut.test.mjs` → Expected: `fail 0`
(此时旧 `Finale` 仍传 `getProgress`,站点行为应与改动前一致。)

- [ ] **Step 5: 提交**

```bash
git add app/src/BlossomScene.jsx
git commit -m "refactor(finale): BlossomScene reads shared channels instead of its own phase math"
```

---

### Task 3: Finale 组件、后期层与接线

**Files:**
- Create: `app/src/Finale.jsx`、`app/src/finale.css`
- Test: `app/src/finale.test.mjs`
- Modify: `app/src/App.jsx:5,64-66,72,74,104`、`app/src/usePostJourney.js`、`app/src/BlossomScene.jsx`(去掉 `getProgress`)

**Interfaces:**
- Consumes: `channels`(Task 1)、`BlossomScene({getChannels, reducedMotion})`(Task 2)
- Produces: `Finale({lang, reduced, onAbout})`;DOM 结构:`.finale-stage` 内依次为 `.finale-ground`、`.finale-halo>.finale-halo-glow`、`.blossom-wrap>.blossom-lens>BlossomScene`、`.finale-iris`、`.philosophy-ribbon>span`、`.blossom-small-copy`、`.bloom-title`、`.philosophy`、`.return-copy`、`.finale-grain`;字幕行为 `.mask>.mask-in`,共 8 个。

- [ ] **Step 1: 写失败的渲染测试**

`app/src/finale.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {outputFiles} = await build({entryPoints: [path.join(here, 'Finale.jsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false, external: ['react', 'react-dom', 'three', 'gsap', 'gsap/ScrollTrigger'], loader: {'.css': 'empty'}});
const module = {exports: {}};
vm.runInNewContext(outputFiles[0].text, {module, exports: module.exports, require, console, URL}, {filename: 'Finale.jsx'});
const Finale = module.exports.default;
const render = props => renderToStaticMarkup(React.createElement(Finale, {onAbout() {}, ...props}));

const PHILOSOPHY = {
  zh: '我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。',
  en: 'I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.',
};

for (const lang of ['zh', 'en']) for (const reduced of [false, true]) {
  test(`renders · ${lang}${reduced ? ' · reduced motion' : ''}`, () => {
    const html = render({lang, reduced});
    assert.ok(!/undefined|\[object Object\]/.test(html), 'nothing leaked into the markup');
    assert.match(html, /<section[^>]*class="finale-journey"[^>]*id="practice"/);
    assert.match(html, new RegExp(`data-nav-tone="${reduced ? 'dark' : 'light'}"`));
    assert.equal((html.match(/class="mask"/g) || []).length, 8, 'eight masked lines');
    assert.ok(!html.includes('expressive-title'), 'the scrubbed titles do not use the one-shot ExpressiveTitle');
    assert.match(html, /class="blossom-scene"/, 'the 3D mount renders on the server');
  });

  test(`keeps the philosophy word for word · ${lang}`, () => {
    const paragraph = render({lang, reduced: false}).match(/<p class="reading-text">(.*?)<\/p>/)[1];
    const text = [...paragraph.matchAll(/<span>(.*?)<\/span>/g)].map(match => match[1]).join('');
    assert.equal(text.trim().replaceAll('&#x27;', "'"), PHILOSOPHY[lang]);
  });
}

test('every film-grade layer is decorative', () => {
  const html = render({lang: 'zh', reduced: false});
  for (const layer of ['finale-halo', 'finale-iris', 'finale-grain', 'philosophy-ribbon']) {
    assert.match(html, new RegExp(`class="${layer}"[^>]*aria-hidden="true"`), `${layer} is hidden from assistive tech`);
  }
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `node src/finale.test.mjs`
Expected: FAIL,esbuild 报 `Could not resolve ".../Finale.jsx"`

- [ ] **Step 3: 写 `Finale.jsx`(本任务先不接时间轴)**

```jsx
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

/** The blossom finale: markup, film grade and (Task 4) the director's timeline. */
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
```

- [ ] **Step 4: 写 `finale.css`**

```css
/* Cinematic finale, layered on v16.css (loaded first, from main.jsx).
   .mask and the grain carry no finale assumptions: lift them into a shared
   file when a second section uses them. */

/* Masked cuts. The timeline moves .mask-in; initial states are set in JS only,
   so reduced motion and a failed script both leave every line readable. */
.mask{display:block;overflow:hidden;padding:0 .08em .1em;margin:0 -.08em -.1em}
.mask-in{display:block}
.finale-journey .blossom-small-copy .eyebrow,.finale-journey .philosophy>.eyebrow,.finale-journey .return-copy i{display:block}
.finale-journey .reading-text span{transition:none}

/* The grade, bottom to top: ground · halo · lens · iris · type · grain. */
.finale-halo,.finale-halo-glow,.blossom-lens,.finale-iris{position:absolute;inset:0;pointer-events:none}
.finale-halo{opacity:0}
.finale-halo-glow{margin:auto;width:min(92vmin,860px);height:min(92vmin,860px);border-radius:50%;background:radial-gradient(circle,rgba(236,192,202,.5) 0%,rgba(236,192,202,.2) 40%,rgba(236,192,202,0) 70%);opacity:.55}
.finale-iris{--iris-in:38vmax;--iris-out:80vmax;--iris-a:.14;background:radial-gradient(circle at 50% 50%,rgba(9,9,11,0) var(--iris-in),rgba(9,9,11,var(--iris-a)) var(--iris-out))}

/* The depth layer: out-of-focus disciplines drifting behind the reading. */
.finale-journey .philosophy-ribbon{top:50%;bottom:auto;left:0;margin-top:-.6em;font-size:clamp(96px,15vw,260px);font-weight:300;letter-spacing:-.04em;line-height:1.2;color:#fff;filter:blur(2.5px);z-index:2;transform:none}
.finale-journey .philosophy-ribbon>span{animation:finale-drift 80s linear infinite;animation-play-state:paused}
.finale-journey .philosophy{z-index:3}

/* Film grain: a stepped 24fps-style jitter of a grey noise tile, over everything. */
.finale-grain{position:absolute;inset:-60%;z-index:6;pointer-events:none;opacity:.05;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E") 0 0/220px 220px;animation:film-grain .9s steps(8) infinite;animation-play-state:paused}
.finale-grain.is-running,.finale-journey .philosophy-ribbon.is-running>span{animation-play-state:running}
body.portfolio-route-open .finale-grain{animation-play-state:paused}
@keyframes film-grain{0%,100%{transform:translate3d(0,0,0)}12%{transform:translate3d(-7%,4%,0)}25%{transform:translate3d(5%,-8%,0)}37%{transform:translate3d(-10%,9%,0)}50%{transform:translate3d(8%,6%,0)}62%{transform:translate3d(-4%,-10%,0)}75%{transform:translate3d(10%,2%,0)}87%{transform:translate3d(-8%,-4%,0)}}
@keyframes finale-drift{to{transform:translate3d(-50%,0,0)}}

.quiet .finale-halo,.quiet .finale-iris,.quiet .finale-grain{display:none}
@media(max-width:699px){.finale-journey .philosophy-ribbon{font-size:22vw}}
```

- [ ] **Step 5: 运行渲染测试,确认通过**

Run: `node src/finale.test.mjs`
Expected: 9 个测试 `ok`,`fail 0`

- [ ] **Step 6: `App.jsx` 接线**

- 第 5 行 `import BlossomScene from './BlossomScene';` 改为 `import Finale from './Finale';`
- 删除第 64–66 行(`zhPhilosophy`、`enPhilosophy`、旧 `function Finale`)
- 第 72 行 `const quiet=reduced||mediaFailed,blossomProgress=useRef(0);` → `const quiet=reduced||mediaFailed;`
- 第 74 行 `usePostJourney({reduced:quiet,blossomProgress,lang});` → `usePostJourney({reduced:quiet,lang});`
- 第 104 行 `<Finale lang={lang} reduced={quiet} blossomProgress={blossomProgress} onAbout={()=>setAbout(true)}/>` → `<Finale lang={lang} reduced={quiet} onAbout={()=>setAbout(true)}/>`

- [ ] **Step 7: `usePostJourney.js` 删除收尾块**

逐条替换:

1. `export function usePostJourney({reduced,blossomProgress,lang}) {` → `export function usePostJourney({reduced,lang}) {`
2. `const ambient=useRef({art:0,ribbon:0});` → `const ambient=useRef({art:0});`
3. `if(reduced){blossomProgress.current=0;return;}` → `if(reduced)return;`
4. `...,bridge=q('.art-bridge'),finale=q('.finale-journey');` → `...,bridge=q('.art-bridge');`
5. 删除整行 `const ground=q('.finale-ground'),small=q('.blossom-small-copy'),bloom=q('.bloom-title'),philosophy=q('.philosophy'),ribbon=q('.philosophy-ribbon'),returnCopy=q('.return-copy');`
6. `const words=qa('.reading-text span'),cards=qa('.art-work');` → `const cards=qa('.art-work');`
7. 删除 `const show=(el,a,y=0)=>{opacity(el,a);el.style.transform=\`translate3d(0,${y}px,0)\`;};`
8. `resize()` 里删掉 `finale:finale.offsetTop,finaleH:finale.offsetHeight-he,`
9. `[intro,q('.systems-section'),track,art,bridge,finale]` → `[intro,q('.systems-section'),track,art,bridge]`
10. 删除 `draw()` 中从 `const f=clamp((y-m.finale)/m.finaleH);blossomProgress.current=f;` 到 `show(returnCopy,ease(range(f,.91,.96)),mix(25,0,ease(range(f,.91,.96))));` 的全部行(共 12 行),保留其后的 `journey-indicator` 一行。
11. 文件头注释末尾追加一句:`// The blossom finale runs its own timeline (Finale.jsx).`

- [ ] **Step 8: BlossomScene 去掉过渡期兼容**

签名改为 `({ progress = 0, reducedMotion = false, getChannels })`,`inputs` 两处同步去掉 `getProgress`,`render()` 里改为:

```js
      const { p, retreat, close, dark } = input.getChannels ? input.getChannels() : channels(input.progress);
```

- [ ] **Step 9: 全部测试 + 构建**

Run(在 `app/`):
```bash
node src/finale-cut.test.mjs && node src/finale.test.mjs && node src/pages/roco-model.test.mjs && node src/pages/lol-model.test.mjs && node src/components/MusicToggle.test.mjs && node src/components/lanyard-physics.test.mjs && node src/office3d/camera.test.mjs && node src/office3d/drag.test.mjs && node src/office3d/physics.test.mjs && npm run build
```
Expected: 全部通过,`✓ built`。此时收尾段是静态的(樱花停在雕塑态,标题与理念隐藏)——下一个任务接上时间轴。

- [ ] **Step 10: 提交**

```bash
git add app/src/Finale.jsx app/src/finale.css app/src/finale.test.mjs app/src/App.jsx app/src/usePostJourney.js app/src/BlossomScene.jsx
git commit -m "feat(finale): Finale component with masked lines and film-grade layers"
```

---

### Task 4: 导演时间轴

**Files:**
- Modify: `app/src/Finale.jsx`

**Interfaces:**
- Consumes: `CUT`、`EASE`、`channels`、`span`(Task 1);Task 3 的 DOM 结构
- Produces: 无新导出;`clock.current` 在每次时间轴更新时被写成最新的 `channels(p)`

- [ ] **Step 1: 替换 `Finale.jsx` 的 import 与工具**

文件头替换为:

```jsx
import {useLayoutEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import BlossomScene from './BlossomScene';
import {CUT,EASE,channels,span} from './finale-cut';
import './finale.css';
```

在 `Line` 之后追加:

```jsx
const D=100;                                          // timeline length = 100% of the finale scroll
const at=([a])=>a*D, len=([a,b])=>(b-a)*D;
const mix=(a,b,t)=>a+(b-a)*t;
const rgb=(from,to,t)=>`rgb(${from.map((v,i)=>Math.round(mix(v,to[i],t))).join(',')})`;
const PAPER=[250,251,252], INK=[9,9,11], DIM=[58,58,66], LIT=[245,245,247];

/** Lines cut in across `beat`: each offset, the whole set landing inside the beat. */
const cutIn=(tl,targets,beat,from={},to={})=>tl.fromTo(targets,{yPercent:110,...from},{yPercent:0,...to,ease:EASE.cutIn,duration:len(beat)*.78,stagger:{amount:len(beat)*.22}},at(beat));
const cutOut=(tl,targets,beat,to={})=>tl.to(targets,{yPercent:-110,...to,ease:EASE.cutOut,duration:len(beat)*.8,stagger:{amount:len(beat)*.2}},at(beat));

/** Builds the finale for one media condition. GSAP's matchMedia reverts every
 *  tween and trigger made here; the returned cleanup undoes the manual writes. */
function direct(root,clock,{scrub,lens}){
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const ground=q('.finale-ground'),glow=q('.finale-halo-glow'),lensEl=q('.blossom-lens'),iris=q('.finale-iris'),grain=q('.finale-grain'),ribbon=q('.philosophy-ribbon');
 const words=qa('.reading-text span'),lit=new Float32Array(words.length).fill(-1);
 // Write only on change: most channels sit still across long stretches of scroll.
 const memo=new Map();
 const set=(el,prop,value)=>{let last=memo.get(el);if(!last)memo.set(el,last={});if(last[prop]===value)return;last[prop]=value;if(prop.startsWith('--'))el.style.setProperty(prop,value);else el.style[prop]=value;};
 const state={p:0};
 const apply=()=>{
  const c=channels(state.p);clock.current=c;
  set(ground,'background',rgb(PAPER,INK,c.dark));
  set(glow,'opacity',c.halo.toFixed(3));set(glow,'transform',`scale(${c.haloScale.toFixed(3)})`);
  set(iris,'--iris-in',`${mix(38,0,c.iris).toFixed(1)}vmax`);set(iris,'--iris-out',`${mix(80,14,c.iris).toFixed(1)}vmax`);set(iris,'--iris-a',mix(.14,1,c.iris).toFixed(3));
  set(grain,'opacity',c.grain.toFixed(3));
  set(ribbon,'opacity',(c.depth*.07).toFixed(4));set(ribbon,'transform',`translate3d(${(-span(c.p,CUT.depth)*35).toFixed(2)}vw,0,0)`);
  if(lens){set(lensEl,'filter',c.focus>.004?`blur(${(c.focus*5).toFixed(2)}px)`:'none');set(lensEl,'transform',`scale(${(1+c.focus*.015).toFixed(4)})`);}
  const head=c.read*(words.length+6);                 // a six-glyph soft leading edge
  for(let i=0;i<words.length;i++){const t=Math.round(Math.max(0,Math.min(1,(head-i)/6))*40)/40;if(t!==lit[i]){lit[i]=t;words[i].style.color=rgb(DIM,LIT,t);}}
  const tone=c.dark>.48?'dark':'light';if(root.dataset.navTone!==tone)root.dataset.navTone=tone;
 };

 const tl=gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub}});
 tl.to(state,{p:1,duration:D,ease:'none',onUpdate:apply},0);
 gsap.set([q('.bloom-title'),q('.return-copy')],{autoAlpha:1});
 cutOut(tl,qa('.blossom-small-copy .mask-in'),CUT.inviteOut);
 cutIn(tl,qa('.bloom-title .mask-in'),CUT.titleIn,{letterSpacing:'.06em',filter:'blur(8px)'},{letterSpacing:'-.07em',filter:'blur(0px)'});
 tl.fromTo(q('.bloom-title'),{yPercent:4},{yPercent:-4,ease:'none',duration:len([CUT.titleIn[0],CUT.titleOut[1]])},at(CUT.titleIn));
 cutOut(tl,qa('.bloom-title .mask-in'),CUT.titleOut,{filter:'blur(6px)'});
 tl.fromTo(q('.philosophy'),{autoAlpha:0},{autoAlpha:1,ease:'none',duration:len(CUT.eyebrow)*.5},at(CUT.eyebrow));
 cutIn(tl,q('.philosophy>.eyebrow .mask-in'),CUT.eyebrow);
 cutIn(tl,q('.philosophy-details .mask-in'),CUT.details);
 tl.fromTo(q('.philosophy-details button'),{autoAlpha:0,y:14},{autoAlpha:1,y:0,ease:EASE.cutIn,duration:len(CUT.details)*.7},at(CUT.details)+len(CUT.details)*.3);
 tl.to(q('.philosophy'),{autoAlpha:0,yPercent:-6,filter:'blur(6px)',ease:'power2.in',duration:len(CUT.philOut)},at(CUT.philOut));
 cutIn(tl,qa('.return-copy .mask-in'),CUT.ending);

 // Entry: the flower rises into frame with parallax as the section arrives.
 gsap.fromTo(q('.blossom-wrap'),{yPercent:14,scale:.9},{yPercent:0,scale:1,ease:EASE.settle,scrollTrigger:{trigger:root,start:'top bottom',end:'top top',scrub:true}});
 gsap.fromTo(q('.finale-halo'),{autoAlpha:0},{autoAlpha:1,ease:'none',scrollTrigger:{trigger:root,start:'top 60%',end:'top top',scrub:true}});
 ScrollTrigger.create({trigger:root,start:'top bottom',end:'bottom top',onToggle:self=>{grain.classList.toggle('is-running',self.isActive);ribbon.classList.toggle('is-running',self.isActive);}});

 // Anything above the finale can change height after load (posters, video, fonts).
 let queued=0;
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>ScrollTrigger.refresh());});
 resize.observe(document.body);
 apply();

 return()=>{
  resize.disconnect();cancelAnimationFrame(queued);
  for(const el of memo.keys())el.removeAttribute('style');
  for(const word of words)word.style.removeProperty('color');
  grain.classList.remove('is-running');ribbon.classList.remove('is-running');
  root.dataset.navTone='light';clock.current=channels(0);
 };
}
```

- [ ] **Step 2: 在组件里挂上时间轴**

在 `Finale` 组件的 `words` 那一行之后插入:

```jsx
 useLayoutEffect(()=>{
  const node=root.current;
  if(reduced||!node){clock.current=channels(0);return undefined;}
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  // Touch scrolling already carries momentum; a long scrub on top reads as float.
  media.add({desktop:'(min-width: 700px)',mobile:'(max-width: 699px)'},({conditions})=>direct(node,clock,{scrub:conditions.desktop?1.2:.8,lens:conditions.desktop}));
  return()=>media.revert();
 },[reduced,lang]);
```

- [ ] **Step 3: 测试 + 构建**

Run: `node src/finale-cut.test.mjs && node src/finale.test.mjs && npm run build`
Expected: 全部通过(服务端渲染不跑 `useLayoutEffect`,所以渲染测试不受影响)。

- [ ] **Step 4: 浏览器逐镜核对**

`preview_start` name=`finale`,跳过开场,执行下列脚本把进度停在某一镜,等 1.6s(惯性追上)后截图。

```js
async function goto(f){const s=document.querySelector('.finale-journey');scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*f);await new Promise(r=>setTimeout(r,1600));return document.querySelector('.blossom-scene').dataset.phase;}
```

逐个检查(括号内为应看到的画面):
- a. `scrollTo(0,document.querySelector('.finale-journey').offsetTop-innerHeight*.6)`,等 1.6s(段落顶部位于视口 40% 高处:樱花正从下方升起,光晕渐亮)
- b. `goto(.05)`(完整樱花 + 两行邀请语,phase=`sculpture`)
- c. `goto(.24)`(标题两行已切入,花瓣虚化,phase=`approach`)
- d. `goto(.44)`(光圈收拢,花瓣沉向黑色,phase=`pink-to-black`)
- e. `goto(.60)`(黑底,正文前半段亮、后半段暗,背后有失焦的大字漂过,phase=`philosophy`)
- f. `goto(.82)`(花瓣表面重新亮起,镜头仍贴近,phase=`return`)
- g. `goto(.99)`(樱花全景、花瓣合拢,结尾两行已切入,phase=`ending`)

- [ ] **Step 5: Review Focus 检查(浏览器)**

- 4c 高度变化:`goto(.5)` 后执行 `document.querySelector('.systems-section').style.paddingTop='600px'`,等 1s,再 `goto(0)`,读 `document.querySelector('.blossom-scene').dataset.phase` → Expected `sculpture`;然后把 `paddingTop` 清空。
- 4d 切语言:`goto(.6)` 后点击语言切换(`EN`/`中文`),等 1.6s → 正文可见、没有停在 `yPercent:110` 的行:`[...document.querySelectorAll('.finale-journey .mask-in')].filter(el=>el.getBoundingClientRect().height===0)` 应为空数组,且截图里正文按当前进度亮起。
- 4e 减少动态效果:`goto(.3)` 后点击 `.motion-toggle` → Expected:`[...document.querySelectorAll('.finale-journey [style]')].map(el=>el.className)` 只剩 BlossomScene 自己的 `blossom-scene` 与画布;截图为静态深色排版,全部文字可读。再点一次恢复动态。
- 4f 快速跳转:从 `goto(0)` 直接 `scrollTo(0,document.documentElement.scrollHeight)`,等 2s,再 `goto(.3)` → 标题两行完整在位、没有残留的邀请语。
- 4g 弹出作品页:`goto(.6)`,打开任意作品页 → `getComputedStyle(document.querySelector('.finale-grain')).animationPlayState` 为 `paused`;关闭后回到 `running`。

- [ ] **Step 6: 提交**

```bash
git add app/src/Finale.jsx
git commit -m "feat(finale): damped director's timeline with masked cuts, rack focus, iris and grain"
```

---

### Task 5: 花瓣轮廓与翻飞

**Files:**
- Modify: `app/src/v16.css`(`.petal{...}` 与 `.petal:after{...}` 两条规则)、`app/src/usePostJourney.js`(跨段花瓣与桥段花瓣的 `transform`)

- [ ] **Step 1: `.petal` 换成樱花瓣轮廓**

`.petal{...}` 规则改为(`transform:rotate(var(--r,25deg))` 等原有定位属性保留):

```css
.petal{position:absolute;display:block;width:46px;height:62px;background:radial-gradient(ellipse at 38% 30%,#fbeef3 0%,rgba(251,238,243,0) 46%),linear-gradient(160deg,#f3d9e4 5%,#e2a9bf 55%,#b5708d);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'%3E%3Cpath d='M50 128C30 118 6 88 5 52C4 26 19 6 38 6C44 6 48 11 50 18C52 11 56 6 62 6C81 6 96 26 95 52C94 88 70 118 50 128Z'/%3E%3C/svg%3E") center/100% 100% no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'%3E%3Cpath d='M50 128C30 118 6 88 5 52C4 26 19 6 38 6C44 6 48 11 50 18C52 11 56 6 62 6C81 6 96 26 95 52C94 88 70 118 50 128Z'/%3E%3C/svg%3E") center/100% 100% no-repeat;transform:rotate(var(--r,25deg));pointer-events:none}
```

`.petal:after{...}` 改为居中的一条细脉:

```css
.petal:after{content:'';position:absolute;inset:22% 49% 5% 49%;border-right:1px solid #fff7}
```

- [ ] **Step 2: 翻飞**

`usePostJourney.js` 的 `mix` 定义之后加:

```js
// Airborne petals tumble through depth instead of spinning flat.
const flutter=t=>`rotateX(${(Math.sin(t*Math.PI*3.2)*58).toFixed(1)}deg) rotateY(${(Math.cos(t*Math.PI*2.4)*42).toFixed(1)}deg)`;
```

跨段花瓣:

```js
shared.style.transform=`translate3d(${wi*(.5+Math.sin(fp*Math.PI*1.6)*.16)}px,${he*mix(.54,.19,fp)}px,0) rotate(${fp*190-30}deg) scale(${.8+Math.sin(fp*Math.PI)*2.5})`;
```
→
```js
shared.style.transform=`perspective(700px) translate3d(${wi*(.5+Math.sin(fp*Math.PI*1.6)*.16)}px,${he*mix(.54,.19,fp)}px,0) ${flutter(fp)} rotate(${fp*190-30}deg) scale(${.8+Math.sin(fp*Math.PI)*2.5})`;
```

桥段花瓣:

```js
q('.bridge-petal').style.transform=`translate3d(${mix(-wi*.25,wi*.3,bp)}px,${mix(-90,180,bp)}px,0) rotate(${bp*220}deg) scale(${mix(.4,3,bp)})`;
```
→
```js
q('.bridge-petal').style.transform=`perspective(700px) translate3d(${mix(-wi*.25,wi*.3,bp)}px,${mix(-90,180,bp)}px,0) ${flutter(bp)} rotate(${bp*220}deg) scale(${mix(.4,3,bp)})`;
```

- [ ] **Step 3: 构建 + 浏览器核对**

Run: `npm run build` → `✓ built`
浏览器:滚到桥段(`document.querySelector('.art-bridge')` 顶部进入视口约 40%),截图 → 花瓣是带顶端缺刻的樱花瓣形,不是椭圆;连续三次各滚 120px 截图 → 花瓣在翻转(宽窄变化)。

- [ ] **Step 4: 提交**

```bash
git add app/src/v16.css app/src/usePostJourney.js
git commit -m "feat(petals): real cherry-petal silhouette and a tumbling flight"
```

---

### Task 6: 性能对比、全量回归、打磨

**Files:**
- Modify(仅在打磨需要时):`app/src/finale-cut.js`(`CUT` 区间)、`app/src/Finale.jsx`(`scrub`、模糊像素、光圈尺寸)、`app/src/finale.css`

- [ ] **Step 1: 帧时间对比**

用 Task 0 Step 3 的同一脚本、同一视口(1440×900)再测一次,写进「测量记录」。Expected:新 p95 ≤ 基线 p95。若超出:先把跟焦模糊上限从 5px 降到 3px,再测;仍超出则在手机与桌面都关掉跟焦(`lens:false`)。

- [ ] **Step 2: 打磨清单(对照截图逐条过)**

每条若不满足,只允许调右侧的旋钮,改完重跑 `node src/finale-cut.test.mjs`:

| 检查 | 不满足时调 |
|---|---|
| 标题完整停留时至少能读完两行(停留段 ≥ 本段 8%) | `CUT.titleIn` / `CUT.titleOut` |
| 钻入的最后 20% 明显减速「刹住」,没有撞墙感 | `CUT.dive` 终点后移 ≤ 0.02 |
| 黑场前没有看到花朵外轮廓变暗(匹配剪辑测试已保证,目视复核) | 不调,若出现说明测试漏了,补测试 |
| 阅读光标前沿柔和,不出现逐字跳亮 | `Finale.jsx` 里 `head` 的 `6` → `8` |
| 景深层可见但不抢正文(0.07 以内) | `c.depth*.07` 的系数 |
| 停手后镜头滑停约 1 秒,不拖沓 | `scrub` 1.2 → 1.0 |
| 颗粒在白底上不脏 | `channels().grain` 的下限 0.05 → 0.04 |

- [ ] **Step 3: 全量回归**

Run(在 `app/`):
```bash
node src/finale-cut.test.mjs && node src/finale.test.mjs && node src/pages/roco-model.test.mjs && node src/pages/lol-model.test.mjs && node src/components/MusicToggle.test.mjs && node src/components/lanyard-physics.test.mjs && node src/office3d/camera.test.mjs && node src/office3d/drag.test.mjs && node src/office3d/physics.test.mjs && npm run build
```
Expected:全部通过。浏览器控制台无报错(`read_console_messages onlyErrors`)。手机视口(375×812)走一遍 b / e / g 三镜。

- [ ] **Step 4: 提交(若有打磨改动)**

```bash
git add -A app/src
git commit -m "polish(finale): tune beats after review in the browser"
```

---

## 测量记录

| 时机 | p50 | p95 | max | >33ms |
|---|---|---|---|---|
| 基线(改动前) | | | | |
| 改动后 | | | | |
