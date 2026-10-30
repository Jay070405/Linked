// Common Ground's review log (CommonGroundPage.jsx). Every entry is from the project's own record:
// - scores and sub-scores, flagged issues and the "next round" lines: the independent reviewer's six reports
//   (a separate AI agent that could read frames but not edit files), 27 Oct 2026, aigc-vibecoding/product-films
//   RESEARCH.md §六 and the session transcript;
// - diffs: the fix scripts that patched the film's source in each round (old lines from the scripts, new lines as they
//   stand in src/ today); long lines are elided with "…", nothing else is changed;
// - the stepper rows: frames 772–803 of public/video/d4-choose-not-to-lose-film.mp4; the counter values are computed
//   with the film's own code (billsAt, cntl2-time.ts, frameT) and match the pixels;
// - "open": found while building this page by stepping through that file (frame 786) and re-running time.ts's sums.
// Times in "flagged" are seconds in that round's render (27.8–30 s long, 30 fps).

export const RUBRIC=[
 {key:'motion',max:30,en:'Motion',zh:'动效'},
 {key:'craft',max:30,en:'Craft',zh:'工艺'},
 {key:'story',max:25,en:'Story',zh:'叙事'},
 {key:'polish',max:15,en:'Polish',zh:'完成度'},
];

export const LOOP=[
 {k:{en:'Render',zh:'渲染'},file:'render-mb.mjs',body:{en:'Remotion renders 16 samples per frame from the React source; Node averages them in 16-bit.',zh:'Remotion 从 React 源码每帧渲染 16 个采样，再在 Node 里用 16 位精度求平均。'}},
 {k:{en:'Scan',zh:'扫描'},file:'jolts.mjs · motion.mjs',body:{en:'One-frame pops, still stretches, and a contact sheet at one frame every half second.',zh:'找单帧跳变和静止段，再出一张每半秒一格的联系表。'}},
 {k:{en:'Review',zh:'评审'},file:'Motion 30 · Craft 30 · Story 25 · Polish 15',body:{en:'A separate AI agent, briefed as a strict creative director, reads the frames but cannot edit files.',zh:'另一个独立的 AI agent，按严格的创意总监来要求：只看画面，不能改文件。'}},
 {k:{en:'Rule',zh:'规则'},file:'RESEARCH.md §六',body:{en:'Each note becomes a rule for every film, not a patch for one frame.',zh:'每条意见都变成所有片子都要守的规则，而不只是补那一帧。'}},
 {k:{en:'Code',zh:'代码'},file:'src/films/*.tsx · src/kit/*',body:{en:'A fix script patches the source, and the film renders again.',zh:'用修复脚本改源码，然后整支片子重新渲染。'}},
];

// a diff line: [sign, text]; sign '+', '-', ' ' (context) or '…' (elided lines)
export const ROUNDS=[
 {
  n:1,total:58,sub:[14,17,18,9],
  film:{en:'30 s · 30 fps · in-browser blur, 8–10 samples',zh:'30 秒 · 30 帧 · 浏览器内模糊，8–10 次采样'},
  title:{en:'Stepped echoes, garbled counters, one chart for 15 seconds',zh:'拖影一格一格，计数器糊成一团，一张图表停了 15 秒'},
  flagged:[
   {t:'4–19',en:'Essentially one chart for 15 s; fully static from 12.3 to 13.7.',zh:'基本是同一张图表停了 15 秒，12.3 到 13.7 秒完全不动。'},
   {t:'11.5',en:'Counters draw two digits on top of each other.',zh:'计数器把两个数字叠在一起画。'},
   {t:'24.6',en:'The UI smears into repeated glyphs during a move.',zh:'界面一移动就糊成一串重复的字形。'},
   {t:'26.8–29.7',en:'A 3-second end card that doesn’t move.',zh:'结尾卡 3 秒一动不动。'},
   {t:{en:'all films',zh:'所有片子'},en:'The blur is a few offset copies stacked on top of each other, not a smooth smear.',zh:'运动模糊是几份错开的副本叠在一起，不是一道顺滑的拖影。'},
  ],
  rules:[
   {en:'Final renders average 16 shutter samples per frame in Node, in 16-bit, rounded once.',zh:'成片每帧 16 个快门采样，在 Node 里用 16 位精度求平均，只取整一次。'},
   {en:'Anything discrete, like a counter or typed text, holds one value for the whole frame, so all 16 samples agree.',zh:'凡是跳着变的东西，比如计数器和打字，整帧只取一个值，16 个采样看到的都一样。'},
   {en:'The chart is cut into shots. End cards run about 2 s and keep moving.',zh:'图表拆成多个镜头；结尾卡缩到 2 秒左右，并且一直在动。'},
  ],
  diffs:[
   {file:'src/kit/look.tsx',lines:[
    ['+','/**'],
    ['+',' * The film time at the start of the current frame. CameraMotionBlur renders each frame several times at sub-frame'],
    ['+',' * times; text that changes discretely (counters, scrambles) must use this so every sample shows the same value.'],
    ['+',' */'],
    ['+','export const frameT = (t: number, fps: number) => Math.floor(t * fps + 1e-6) / fps;'],
   ]},
   {file:'src/films/ChooseNotToLose2.tsx',lines:[
    ['-','{money(t < 8.0 ? mid : year(p, bills))}'],
    ['+','{money(t < 8.0 ? mid : year(p, billsAt(frameT(t, CNTL2_FPS))))}'],
    ['…',''],
    ['-','export const ChooseNotToLose2: React.FC = () => ('],
    ['-','  <CameraMotionBlur shutterAngle={180} samples={17}>'],
    ['-','    <Film />'],
    ['-','  </CameraMotionBlur>'],
    ['-',');'],
    ['+','/** Motion blur is added offline (scripts/render-mb.mjs renders the `Sub` composition and averages the shutter). */'],
    ['+','export const ChooseNotToLose2: React.FC = () => <Film />;'],
   ]},
   {file:'src/kit/subframes.tsx',isNew:true,lines:[
    ['+','    const m = useCurrentFrame();'],
    ['+','    const F = Math.floor(m / SHUTTER_SAMPLES), j = m % SHUTTER_SAMPLES;'],
    ['+',"    // in the Sub composition's own frames: output frame F starts at 16F; sample j is j/32 of an output frame later"],
    ['+','    return ('],
    ['+','      <Freeze frame={SHUTTER_SAMPLES * F + j / 2}>'],
   ]},
   {file:'scripts/render-mb.mjs',isNew:true,lines:[
    ['+','      const sum = a.sum;'],
    ['+','      for (let i = 0; i < data.length; i++) sum[i] += data[i];'],
    ['+','      if (++a.n === S) {'],
    ['…',''],
    ['+','        for (let i = 0; i < sum.length; i++) out[i] = (sum[i] + S / 2) >> 4; // ÷ 16, rounded once'],
   ]},
  ],
  note:{en:'On the way there: raising the in-browser samples from 8 to 17 hid the coloured blotches only where nothing moved. Remotion’s blur draws each sample as its own layer at 1/N opacity and adds the layers, and each layer is stored at 8 bits.',zh:'中间试过：把浏览器里的采样从 8 加到 17，彩色斑块只在不动的地方消失。Remotion 的模糊把每个采样画成一层，透明度 1/N，再把各层加起来；每一层都只按 8 位存。'},
  next:{en:'“Counters now show whole digits.” But the chart’s 8 cuts were “reframes of the same dark chart”.',zh:'“计数器现在只显示完整的数字。”但图表的 8 个镜头只是“同一张深色图表换了构图”。'},
  demo:'blur',
 },
 {
  n:2,total:69,sub:[19,20,19,11],
  film:{en:'29 s · 30 fps · 16 samples, averaged offline',zh:'29 秒 · 30 帧 · 16 个采样，离线平均'},
  title:{en:'A white flash, piled-up labels, a hook that only lists',zh:'一道白闪，标签叠成一团，开场只是在列名字'},
  flagged:[
   {t:'19.83–20.3',en:'A full-frame white flash: near-black to near-white in 4 frames.',zh:'整屏白闪：4 帧之内从近黑跳到近白。'},
   {t:'11.9',en:'The “+$600” pills stack into unreadable text.',zh:'几个 “+$600” 标签叠成一团，读不出来。'},
   {t:'4.4–6.0',en:'Still a dead hold.',zh:'还是一段死停。'},
   {t:'0–3.5',en:'The hook is still “Four health plans.”',zh:'开场还是 “Four health plans.”。'},
   {t:{en:'idea',zh:'建议'},en:'“The $600 could be the gap that physically opens between the plan bars.”',zh:'“$600 可以是两条方案价格条之间真的拉开的一道缺口。”'},
  ],
  rules:[
   {en:'Only cuts, pushes and match cuts. No flashes, dissolves or irises.',zh:'转场只用硬切、推镜和匹配剪辑，不用闪白、叠化和圆形遮罩。'},
   {en:'No hold of 0.8 s or more. A title-safe zone nothing enters. Labels 24 px or larger.',zh:'不允许 0.8 秒以上的静止；标题有安全区，什么都不准进；标签至少 24 px。'},
   {en:'Each film acts out its key line once.',zh:'每支片子都要把它最关键的那句话演出来一次。'},
  ],
  diffs:[
   {file:'src/films/ChooseNotToLose2.tsx',lines:[
    ['-','      {t >= 4.0 && t < 20.05 && <ChartScene t={t} />}'],
    ['-','      {t < 4.05 && <Hook t={t} />}'],
    ['-','      {t >= 19.97 && t < 26.2 && <Product t={t} />}'],
    ['-','      {/* the dive: a white flash at the bottom of the zoom */}'],
    ['-','      {t > 19.8 && t < 20.35 && <AbsoluteFill style={{ background: "#fff", opacity: … }} />}'],
    ['-','      {t >= 25.45 && <End t={t} />}'],
    ['+','      {t >= 4.0 && t < 19.6 && <ChartScene t={t} />}'],
    ['+','      {t < 4.0 && <Hook t={t} />}'],
    ['+','      {t >= 19.6 && t < 25.6 && <Product t={t} />}'],
    ['+','      {t >= 25.6 && <End t={t} />}'],
    ['…',''],
    ['-','            { at: 0.3, text: "Four health plans." },'],
    ['-','            { at: 1.3, text: "One year." },'],
    ['-','            { at: 2.25, text: "Which one costs less?" },'],
    ['+','            { at: 0.15, text: "Pick the lowest premium?" },'],
    ['+','            { at: 2.35, text: "Look at the whole year.", style: { color: "#fff" } },'],
    ['…',''],
    ['-'," * frames' motion-blur samples (a quarter frame past the beat) so no frame mixes two shots."],
    ['-','const CUT = 0.25 / 30;'],
    ['+',' * The chart is cut into shots: each one frames a different part and keeps moving. Cuts land on frame boundaries:'],
    ['+'," * a frame's shutter samples run forward from its start, so a cut there never mixes two shots in one frame."],
    ['+','const CUT = 0;'],
   ]},
  ],
  note:{en:'The last change wasn’t on the reviewer’s list; it fixed round 1’s fix. The chart’s cuts had been set a quarter frame past the beat so they would fall between two frames’ samples. Once each frame’s 16 samples ran forward from its start, a quarter frame in was the middle of a shutter, so CUT went to 0.',zh:'最后一处不在评审的清单上，是对上一轮修复的修复：图表的剪辑点原本放在拍点后四分之一帧，想让它落在两帧的采样之间。改成每帧 16 个采样从帧起点往后取以后，四分之一帧正好在快门中间，于是 CUT 改成 0。'},
  next:{en:'“The white flash is gone; the cuts are clean.” “The $600 slide-and-spring reads without sound.”',zh:'“白闪没了，剪辑干净了。”“$600 那一下滑开再弹回，不开声音也看得懂。”'},
 },
 {
  n:3,total:78,sub:[23,22,21,12],
  film:{en:'28.4 s · 30 fps · 16 samples',zh:'28.4 秒 · 30 帧 · 16 个采样'},
  title:{en:'Text on text, black after a cut, screens nobody can read',zh:'字压着字，切完一片黑，界面上的字没人看得清'},
  flagged:[
   {t:'7.9–8.2',en:'“for the whole year.” sits on the “Plan A” label as the chart lays out.',zh:'图表展开时，“for the whole year.” 压在 “Plan A” 标签上。'},
   {t:'25.6–26.2',en:'After the cut to the lockup the frame is near-black with tiny lines.',zh:'切到结尾以后，画面几乎全黑，只有几条细线。'},
   {t:'12.3–13.7',en:'The chart is frozen; only the bills counter ticks.',zh:'图表定住了，只有账单计数器在跳。'},
   {t:'3.3',en:'The headline’s fast vertical exit blurs into stepped stripes.',zh:'标题快速向上退场，糊成一格一格的条纹。'},
   {t:'20–25',en:'The product screens are dense web UI with 12–15 px copy.',zh:'产品界面是密密麻麻的网页，字只有 12–15 px。'},
  ],
  rules:[
   {en:'Every screen gets one element 40 px or larger that tells the beat.',zh:'每一屏都要有一个 40 px 以上、能讲清这一拍的元素。'},
   {en:'No dark, empty frame after a cut: land on something already big and moving.',zh:'剪辑点之后不能是一片黑的空画面：直接落在已经很大、正在动的东西上。'},
   {en:'A headline leaves before the next shot lays out its labels.',zh:'标题要在下一个镜头摆出标签之前离场。'},
  ],
  diffs:[
   {file:'src/films/ChooseNotToLose2.tsx',lines:[
    ['-','          <Reveal t={t} at={6.05} out={7.75} text="Every plan, priced" font={{ ...H1, size: 84 }} />'],
    ['-','          <Reveal t={t} at={6.2} out={7.8} text="for the whole year." font={{ ...H1, size: 84, color: MUTED }} />'],
    ['+','          <Reveal t={t} at={6.05} out={7.4} text="Every plan, priced" font={{ ...H1, size: 84 }} />'],
    ['+','          <Reveal t={t} at={6.2} out={7.45} text="for the whole year." font={{ ...H1, size: 84, color: MUTED }} />'],
    ['…',''],
    ['+','const CALLOUTS: Record<string, { x: number; y: number; text: string; bg: string; fg: string }> = {'],
    ['+','  compare: { x: 760, y: 300, text: "Plan A · $4,160 this year", bg: "#8a3ffc", fg: "#fff" },'],
    ['+','  "worst-year": { x: 720, y: 392, text: "Plan C at most: $8,820", bg: "#da1e28", fg: "#fff" },'],
    ['+','  "review-b": { x: 30, y: 468, text: "+$600 a year · same coverage", bg: "#da1e28", fg: "#fff" },'],
    ['+','  confirmation: { x: 30, y: 500, text: "✓ Plan A saved · $4,160 a year", bg: "#24a148", fg: "#fff" },'],
    ['+','};'],
    ['…',''],
    ['-','  const out = smoother(prog(t, 28.0, 28.4));'],
    ['+','  const out = smoother(prog(t, 27.4, 27.8));'],
    ['+','  const zoom = lerp(5, 1, expoOut(prog(t, 25.6, 26.4)));'],
   ]},
  ],
  next:{en:'“The callouts are large and readable.” “The lockup is a clean cut onto the lines at 25.6.”',zh:'“标注够大，读得清。”“结尾在 25.6 秒干净地切到那几条线上。”'},
 },
 {
  n:4,total:82,sub:[25,23,22,12],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'Labels that slide over copy, a tag too small to read',zh:'标签从正文上滑过，小标签小到读不出'},
  flagged:[
   {t:'21.0',en:'The page heading is sliced by the blue headline band.',zh:'页面标题被蓝色标题带切掉一截。'},
   {t:'23.35',en:'The “+$600 a year” pill slides in as a red streak across the body copy.',zh:'“+$600 a year” 标签滑进来时，在正文上拖出一道红色残影。'},
   {t:'8.1–8.3',en:'“From a quiet year…” sits about 40 px above “Plan A”.',zh:'“From a quiet year…” 离 “Plan A” 只有 40 px 左右。'},
   {t:'2.9–3.3',en:'The “★ Lowest premium” tag is about 12 px and squashes during the morph.',zh:'“★ Lowest premium” 标签只有约 12 px，变形时还被压扁。'},
  ],
  rules:[
   {en:'Labels pop in place from their centre. Nothing slides across text.',zh:'标签从自己的中心原地弹出，任何东西都不从文字上滑过。'},
   {en:'A tag that has to be read is 24 px or larger, and fades before a morph instead of squashing.',zh:'要读的标签至少 24 px；遇到变形先淡出，不被压扁。'},
  ],
  diffs:[
   {file:'src/films/ChooseNotToLose2.tsx',lines:[
    ['-','    <div style={{ …, transform: `scale(${k})`, transformOrigin: "left center" }}>'],
    ['+','    <div style={{ …, transform: `scale(${k})`, transformOrigin: "center", opacity: clamp(k * 2) }}>'],
    ['…',''],
    ['-','              <span style={{ position: "absolute", top: -58, …, fontSize: 26 }}>★ Lowest premium</span>'],
    ['+','              <span style={{ position: "absolute", top: -74, …, fontSize: 34 }}>★ Lowest premium</span>'],
   ]},
  ],
  note:{en:'The reviewer’s biggest single item this round was material, not timing: rebuild the four product screens as crisp vector panels. That stayed open.',zh:'这一轮评审认为最值分的一处是素材，不是节奏：把四张产品截图重画成清晰的矢量面板。这一条一直没做。'},
  next:{en:'“The callouts pop in place.” “The 8.0 shot has clean air.”',zh:'“标注原地弹出了。”“8.0 秒那个镜头留出了干净的空间。”'},
 },
 {
  n:5,total:84,sub:[26,23,22,13],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'Every headline leaves in stepped copies',zh:'每条标题退场时都碎成一格一格的副本'},
  flagged:[
   {t:'19.45',en:'“Plan B never is.” exits as stepped red echoes, and the “★ Cheapest” badge smears.',zh:'“Plan B never is.” 退场时变成一格一格的红色重影，“★ Cheapest” 标签也糊了。'},
   {t:{en:'all films',zh:'所有片子'},en:'“When a headline leaves on a fast vertical move, the motion blur turns it into stacked, stepped copies of the text.” “That single fix would lift every film.”',zh:'“标题快速向上退场时，运动模糊会把它变成一层层错开的文字副本。”“只改这一处，每支片子都会涨分。”'},
   {t:'23.9',en:'The blue band slices the top line of text; the “+$600” pill covers the start of the page copy.',zh:'蓝色标题带切掉了最上面一行字；“+$600” 标签盖住了正文开头。'},
  ],
  rules:[
   {en:'Type never moves much faster than 1.5 px per shutter sample. Lines enter on a quartic ease-out and leave by fading with a short lift, 24% of their height.',zh:'文字每两个快门采样之间的位移不超过约 1.5 px：进场用四次方缓出，退场改成淡出，同时轻轻上移自身高度的 24%。'},
  ],
  diffs:[
   {file:'src/kit/kinetic.tsx',shared:true,lines:[
    ['+','const quartOut = (x: number) => 1 - Math.pow(1 - clamp(x), 4);'],
    ['+','const TEXT_LIFT = 24; // % of the line height a line rises while it fades out'],
    ['…',''],
    ['-','        const p = expoOut(prog(t, at + i * stagger, at + i * stagger + dur));'],
    ['-','        const q = out === undefined ? 0 : expoIn(prog(t, out + i * stagger * 0.6, out + i * stagger * 0.6 + 0.35));'],
    ['-','        const y = (1 - p) * 110 - q * 110;'],
    ['+','        const p = quartOut(prog(t, at + i * stagger, at + i * stagger + dur));'],
    ['+','        const q = out === undefined ? 0 : smoother(prog(t, out + i * stagger * 0.4, out + i * stagger * 0.4 + 0.24));'],
    ['+','        const y = (1 - p) * 110 - q * TEXT_LIFT;'],
    ['…',''],
    ['-','      const pout = leaveAt === undefined ? 0 : expoOut(prog(t, leaveAt - 0.06, leaveAt + 0.22));'],
    ['+','      const pout = leaveAt === undefined ? 0 : smoother(prog(t, leaveAt - 0.06, leaveAt + 0.16));'],
    ['-','            transform: `translateY(${(1 - pin) * 100 - pout * 100}%)`,'],
    ['+','            transform: `translateY(${(1 - pin) * 100 - pout * TEXT_LIFT}%)`,'],
    ['+','            opacity: 1 - pout,'],
   ]},
  ],
  note:{en:'One change in the shared kit, so every film got it at once. All six files went up 1–3 points that round; this one went from 84 to 87.',zh:'改在共用的 kit 里，所有片子一次全改到。那一轮六个文件都涨了 1–3 分，这一支从 84 到 87。'},
  next:{en:'“Headline exits are fixed everywhere.”',zh:'“所有标题的退场都修好了。”'},
  demo:'exit',
 },
 {
  n:6,total:87,sub:[27,24,22,14],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'What timing can’t fix',zh:'靠调节奏修不好的部分'},
  flagged:[
   {t:'23.4, 24.9',en:'The pills pop in with a 2-frame blur over the page text.',zh:'标签弹出时，在正文上有 2 帧模糊。'},
   {t:'20.05',en:'The product screenshots are still soft, so they look second-hand next to the crisp chart.',zh:'产品截图还是发虚，放在清晰的图表旁边，像是二手素材。'},
  ],
  verdict:{en:'Not sent back after this. No round reached the 95 I had asked for. The reviewer’s last gap was material, redrawing the screens as vector panels, not timing.',zh:'这之后没有再送评审。六轮都没到我要求的 95 分；评审最后指出的差距在素材上（把界面重画成矢量面板），不在节奏上。'},
 },
];

/** After round 6: the user's own viewing, which no score had measured. */
export const AFTER={
 quote:'非常不 smooth',
 title:{en:'“Very not smooth”',zh:'“非常不 smooth”'},
 body:{en:'Watching it the next morning, my verdict was “非常不 smooth”, “一卡一卡”: it stuttered. The review had never measured that. Three causes turned up. Cameras eased to a stop at their keys and before every cut. Some shots ended too fast while others dragged. And devices were placed by left/top, which Chrome snaps to whole pixels, so a slow drift stepped every few frames.',zh:'第二天早上我看完，结论是“非常不 smooth”，“一卡一卡”的。评审从来没量过这一点。查出三个原因：镜头在关键帧和每个剪辑点前都会减速停下；有的镜头结束得太快，有的又拖得太久；设备用 left/top 定位，Chrome 会把它吸附到整像素，慢慢漂移时每隔几帧就跳一下。'},
 rules:[
  {en:'Speed changes only on a cut: each span between two cuts plays at its own length.',zh:'速度只在剪辑点上变：两个剪辑点之间的每一段按自己的长度播放。'},
  {en:'Anything that moves slowly is placed by transform. 60 fps.',zh:'慢慢移动的东西一律用 transform 定位；60 帧。'},
  {en:'Smoothness is judged on a measured motion curve, not by the score.',zh:'顺不顺看量出来的运动曲线，不看分数。'},
 ],
 diffs:[
  {file:'src/films/cntl2-time.ts',isNew:true,lines:[
   ['+','export const CNTL2_FPS = 60;'],
   ['+','export const CNTL2_TIME = remap('],
   ['+','  ['],
   ['+','    { from: 0, to: 4.0, len: 4.0 }, // the pills, sorted; the trap'],
   ['+','    { from: 4.0, to: 6.0, len: 2.4 }, // close on C: lowest premium, costliest worst year'],
   ['+','    { from: 6.0, to: 8.0, len: 2.2 }, // every plan, priced for the whole year'],
   ['+','    { from: 8.0, to: 10.0, len: 2.6 }, // the bills sweep from a quiet year to the worst one'],
   ['+','    { from: 10.0, to: 12.0, len: 1.9 }, // B lines up with A, then $600'],
   ['+','    { from: 12.0, to: 14.0, len: 1.9 }, // the gap rides the sweep'],
   ['+','    { from: 14.0, to: 16.3, len: 2.1 }, // which plan is cheapest'],
   ['+','    { from: 16.3, to: 17.8, len: 1.4 }, // close on the cheapest row'],
   ['+','    { from: 17.8, to: 19.6, len: 2.5 }, // pull back: Plan B never is'],
   ['+',"    { from: 19.6, to: 21.6, len: 2.4 }, // product: every plan's whole year"],
   ['+','    { from: 21.6, to: 23.0, len: 2.1 }, // the most it can cost'],
   ['+','    { from: 23.0, to: 24.5, len: 2.1 }, // save B only after the $600'],
   ['+','    { from: 24.5, to: 25.6, len: 1.7 }, // a choice you can explain'],
   ['+','    { from: 25.6, to: 27.8, len: 2.4 }, // lockup'],
   ['+','  ],'],
  ]},
  {file:'src/kit/devices.tsx',shared:true,lines:[
   ['-','  left: x - w / 2,'],
   ['-','  top: y - h / 2,'],
   ['+','  left: 0,'],
   ['+','  top: 0,'],
   [' ','  width: w,'],
   [' ','  height: h,'],
   [' ','  transformStyle: "preserve-3d",'],
   ['+','  willChange: "transform",'],
   ['-','  transform: `translate3d(0,0,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,'],
   ['+','  transform: `translate3d(${x - w / 2}px, ${y - h / 2}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`,'],
  ]},
  {file:'src/kit/look.tsx',shared:true,lines:[
   ['-','export const frameT = (t: number, fps: number) => Math.floor(t * fps + 1e-6) / fps;'],
   ['+','export const frameT = (t: number, fps: number) => (heldClock ? heldClock(t, fps) : Math.floor(t * fps + 1e-6) / fps);'],
  ]},
 ],
 note:{en:'The film still runs on its own 27.8 s clock; the table plays each of its 14 shots at a new length, 31.7 s in all. Counters still hold whole digits, now for whole output frames.',zh:'片子仍然跑在自己 27.8 秒的时间线上；这张表让 14 个镜头各按新的长度播放，总长 31.7 秒。计数器照样整帧只显示完整的数字，只是“帧”换成了输出的帧。'},
};

/** Found while building this page: frame 786, and three more cuts like it. */
export const OPEN={
 title:{en:'Four cuts carry one stray sample',zh:'有四个剪辑点多了一个错位的采样'},
 body:{en:'Stepping through the final file for this page turned up a faint ghost on frame 786, the first frame after the cut at 13.1 s: one of its 16 samples still shows the shot before. The re-pacing table adds shot lengths in floating point, so that cut is stored as 13.100000000000001, a hair after the frame’s first sample at 13.1. Re-running the sums puts the same slip at 8.6, 11.2 and 15.0 s; the other nine cuts are clean. At 1/16 strength for one frame it is hard to see at speed. The fix is a tolerance in one comparison, then a re-render.',zh:'为这一页逐帧检查成片时，在第 786 帧发现了一层很淡的残影。这是 13.1 秒剪辑点后的第一帧，它的 16 个采样里有一个还是上一个镜头。重新定速的表用浮点数累加镜头长度，这个剪辑点被存成 13.100000000000001，比这一帧第一个采样的 13.1 晚了一丝。把这些加法重算一遍，8.6、11.2 和 15.0 秒也是这样，其余九个剪辑点是干净的。只有 1/16 的强度、只出现一帧，正常播放时很难看出来。修法是给一处比较加上容差，再重新渲染。'},
 diff:{file:'src/kit/time.ts',proposed:true,lines:[
  ['-','    while (i < S.length - 1 && tn >= starts[i + 1]) i++;'],
  ['+','    while (i < S.length - 1 && tn >= starts[i + 1] - 1e-9) i++;'],
 ]},
 frame:786,
};

/** The 14 shots of the final file (cntl2-time.ts), in output seconds. */
export const SHOTS=[
 {en:'The pills, sorted; the trap',zh:'胶囊排好序；陷阱'},
 {en:'Close on C: lowest premium, costliest worst year',zh:'C 的近景：保费最低，最坏的一年最贵'},
 {en:'Every plan, priced for the whole year',zh:'每个方案按全年计价'},
 {en:'The bills sweep from a quiet year to the worst one',zh:'账单从平静的一年扫到最糟的一年'},
 {en:'B lines up with A, then $600',zh:'B 对齐 A，然后是 $600'},
 {en:'The gap rides the sweep',zh:'缺口跟着账单走'},
 {en:'Which plan is cheapest',zh:'哪个方案最便宜'},
 {en:'Close on the cheapest row',zh:'最便宜那一行的近景'},
 {en:'Pull back: Plan B never is',zh:'拉远：Plan B 永远不是'},
 {en:'Product: every plan’s whole year',zh:'产品：每个方案的全年'},
 {en:'The most it can cost',zh:'最多会花多少'},
 {en:'Save B only after the $600',zh:'确认 $600 之后才能保存 B'},
 {en:'A choice you can explain',zh:'说得清的选择'},
 {en:'Lockup',zh:'结尾署名'},
];

/** Frames 772–803 of the site's file: [frame, counter as drawn (held), lowest and highest of its 16 samples had it not
    been held]. All three are computed with the film's own code. */
export const STEPS=[[772,1570,1570,1700],[773,1840,1840,1980],[774,2140,2140,2300],[775,2480,2480,2650],[776,2850,2850,3030],[777,3250,3250,3460],[778,3700,3700,3920],[779,4180,4180,4420],[780,4710,4710,4970],[781,5270,5270,5550],[782,5880,5880,6170],[783,6520,6520,6840],[784,7210,7210,7550],[785,7940,7940,8290],[786,8710,8710,9080],[787,9510,9510,9900],[788,10360,10360,10760],[789,11240,11240,11660],[790,12150,12150,12590],[791,13100,13100,13550],[792,14070,14070,14540],[793,15070,15070,15550],[794,16100,16100,16580],[795,17140,17140,17630],[796,18200,18200,18700],[797,19270,19270,19780],[798,20350,20350,20860],[799,21440,21440,21950],[800,22520,22520,23030],[801,23610,23610,24110],[802,24680,24680,25180],[803,25740,25740,26240]];
