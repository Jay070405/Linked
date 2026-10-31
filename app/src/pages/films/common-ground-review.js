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
 {k:{en:'Render',zh:'渲染'},file:'render-mb.mjs',body:{en:'Remotion renders 16 samples for each frame from the React source, and Node averages them in 16-bit.',zh:'Remotion 从 React 源码给每一帧渲染 16 个采样，再在 Node 里按 16 位精度求平均。'}},
 {k:{en:'Scan',zh:'扫描'},file:'jolts.mjs · motion.mjs',body:{en:'Scripts look for one-frame jumps and still stretches, and make a contact sheet with one frame every half second.',zh:'脚本找出单帧跳变和静止段，再做一张每半秒一帧的联系表。'}},
 {k:{en:'Review',zh:'评审'},file:'Motion 30 · Craft 30 · Story 25 · Polish 15',body:{en:'A separate AI agent, briefed as a strict creative director, looks at the frames and scores them. It cannot edit files.',zh:'另一个独立的 AI agent 按严格的创意总监的标准看画面、打分，它不能改文件。'}},
 {k:{en:'Rule',zh:'规则'},file:'RESEARCH.md §六',body:{en:'Each note is written up as a rule that applies to all the films.',zh:'每条意见都写成一条规则，所有片子都照着改。'}},
 {k:{en:'Code',zh:'代码'},file:'src/films/*.tsx · src/kit/*',body:{en:'A fix script patches the source and the film is rendered again.',zh:'用修复脚本改源码，再把整支片子重新渲染一遍。'}},
];

// a diff line: [sign, text]; sign '+', '-', ' ' (context) or '…' (elided lines)
export const ROUNDS=[
 {
  n:1,total:58,sub:[14,17,18,9],
  film:{en:'30 s · 30 fps · in-browser blur, 8–10 samples',zh:'30 秒 · 30 帧 · 浏览器内模糊，8–10 次采样'},
  title:{en:'Blur and counters rendered as stacked copies',zh:'模糊和计数器都渲染成了错开的叠影'},
  flagged:[
   {t:'4–19',en:'The same chart stays on screen for about 15 s and is completely still from 12.3 to 13.7 s.',zh:'同一张图表在画面上停了大约 15 秒，12.3 到 13.7 秒完全不动。'},
   {t:'11.5',en:'Counters draw two digits on top of each other.',zh:'计数器把两个数字叠在一起画。'},
   {t:'24.6',en:'The UI smears into repeated glyphs while it moves.',zh:'界面移动时糊成一串重复的字形。'},
   {t:'26.8–29.7',en:'The end card holds still for 3 s.',zh:'结尾卡有 3 秒完全不动。'},
   {t:{en:'all films',zh:'所有片子'},en:'The motion blur is a few offset copies stacked on top of each other, and text and edges show steps.',zh:'运动模糊是几份错开的副本叠在一起，文字和边缘上能看出一格一格的重影。'},
  ],
  rules:[
   {en:'Final renders take 16 shutter samples per frame and average them in Node, in 16-bit, with one rounding.',zh:'成片每帧取 16 个快门采样，在 Node 里按 16 位精度求平均，只取整一次。'},
   {en:'Anything that changes in steps, like a counter or typed text, keeps one value for the whole frame, so all 16 samples match.',zh:'跳着变的东西，比如计数器和打字，一整帧只取一个值，16 个采样就都一致。'},
   {en:'The chart is cut into several shots, and end cards run about 2 s and keep moving.',zh:'图表拆成几个镜头；结尾卡缩到 2 秒左右，并且一直在动。'},
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
  note:{en:'Before the blur moved to Node, the in-browser samples were raised from 8 to 17, and the coloured blotches went away only where nothing moved. Remotion’s blur draws each sample as its own layer at 1/N opacity and adds the layers, and each layer is stored at 8 bits.',zh:'把模糊挪到 Node 之前，先试过把浏览器里的采样从 8 加到 17，彩色斑块只在不动的地方消失了。Remotion 的模糊把每个采样画成单独一层，透明度 1/N，再把各层加起来，每一层都按 8 位存储。'},
  next:{en:'Counters show whole digits now. The 8 chart shots are reframes of the same dark chart.',zh:'计数器现在只显示完整的数字。图表的 8 个镜头还是同一张深色图表换构图。'},
  demo:'blur',
 },
 {
  n:2,total:69,sub:[19,20,19,11],
  film:{en:'29 s · 30 fps · 16 samples, averaged offline',zh:'29 秒 · 30 帧 · 16 个采样，离线平均'},
  title:{en:'A white flash and a generic opening',zh:'一道白闪，开场太泛'},
  flagged:[
   {t:'19.83–20.3',en:'The whole frame flashes white, from near-black to near-white in 4 frames.',zh:'整个画面闪白，4 帧之内从接近全黑变成接近全白。'},
   {t:'11.9',en:'The “+$600” pills stack into unreadable text.',zh:'几个 “+$600” 标签叠成一团，读不出来。'},
   {t:'4.4–6.0',en:'Still a stretch where nothing moves.',zh:'这一段仍然完全不动。'},
   {t:'0–3.5',en:'The opening line is still “Four health plans.”',zh:'开场第一句还是 “Four health plans.”。'},
   {t:{en:'suggestion',zh:'建议'},en:'Make the $600 a gap that physically opens between the two plan bars.',zh:'把 $600 做成两条方案价格条之间真的拉开的一道缺口。'},
  ],
  rules:[
   {en:'Transitions are hard cuts, pushes or match cuts, with no flashes, dissolves or irises.',zh:'转场只用硬切、推镜和匹配剪辑，不用闪白、叠化和圆形遮罩。'},
   {en:'No shot holds still for 0.8 s or more. Only the headline goes in the title-safe zone, and labels are at least 24 px.',zh:'没有一个镜头静止 0.8 秒以上。标题安全区里只放标题，标签至少 24 px。'},
   {en:'Each film acts out its main line once.',zh:'每支片子要把最主要的那句话用画面演一次。'},
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
  note:{en:'The CUT change was not on the reviewer’s list. After round 1 the chart’s cuts were placed a quarter frame past the beat, so they would fall between two frames’ samples. Once each frame’s 16 samples ran forward from its start, a quarter frame in was the middle of a shutter, so CUT was set to 0.',zh:'CUT 这一处不在评审的清单上。第 1 轮之后，图表的剪辑点放在拍点后四分之一帧，想让它落在两帧的采样之间。后来每帧的 16 个采样改成从帧起点往后取，四分之一帧就落在了快门中间，所以 CUT 改成了 0。'},
  next:{en:'The white flash is gone and the cuts are clean. You can follow the $600 slide and spring-back without sound.',zh:'白闪没了，剪辑干净。$600 那一下滑开再弹回，不开声音也看得懂。'},
 },
 {
  n:3,total:78,sub:[23,22,21,12],
  film:{en:'28.4 s · 30 fps · 16 samples',zh:'28.4 秒 · 30 帧 · 16 个采样'},
  title:{en:'Overlapping text and unreadable product screens',zh:'文字重叠，产品界面上的字太小'},
  flagged:[
   {t:'7.9–8.2',en:'“for the whole year.” sits on the “Plan A” label as the chart lays out.',zh:'图表展开时，“for the whole year.” 压在 “Plan A” 标签上。'},
   {t:'25.6–26.2',en:'After the cut to the lockup the frame is near-black with tiny lines.',zh:'切到结尾以后，画面几乎全黑，只有几条细线。'},
   {t:'12.3–13.7',en:'The chart is frozen; only the bills counter ticks.',zh:'图表定住了，只有账单计数器在跳。'},
   {t:'3.3',en:'The headline’s fast vertical exit blurs into stepped stripes.',zh:'标题快速向上退场，糊成一格一格的条纹。'},
   {t:'20–25',en:'The product screens are dense web UI with 12–15 px copy.',zh:'产品界面是密密麻麻的网页，字只有 12–15 px。'},
  ],
  rules:[
   {en:'Each product screen gets one label of 40 px or more that says what the shot is about.',zh:'每张产品界面上放一个 40 px 以上的标注，说明这个镜头讲的是什么。'},
   {en:'The first frame after a cut already shows something large and moving.',zh:'剪辑后的第一帧上就要有大而且正在动的东西。'},
   {en:'A headline leaves before the next shot lays out its labels.',zh:'标题在下一个镜头摆出标签之前离场。'},
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
  next:{en:'The callouts are large and readable. The lockup cuts cleanly onto the lines at 25.6 s.',zh:'标注够大，读得清。结尾在 25.6 秒干净地切到那几条线上。'},
 },
 {
  n:4,total:82,sub:[25,23,22,12],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'Labels sliding across text, and a 12 px tag',zh:'标签从文字上滑过，还有一个 12 px 的小标签'},
  flagged:[
   {t:'21.0',en:'The page heading is sliced by the blue headline band.',zh:'页面标题被蓝色标题带切掉一截。'},
   {t:'23.35',en:'The “+$600 a year” pill slides in as a red streak across the body copy.',zh:'“+$600 a year” 标签滑进来时，在正文上拖出一道红色残影。'},
   {t:'8.1–8.3',en:'“From a quiet year…” sits about 40 px above “Plan A”.',zh:'“From a quiet year…” 离 “Plan A” 只有 40 px 左右。'},
   {t:'2.9–3.3',en:'The “★ Lowest premium” tag is about 12 px and squashes during the morph.',zh:'“★ Lowest premium” 标签只有约 12 px，变形时还被压扁。'},
  ],
  rules:[
   {en:'Labels scale up in place from their centre, and nothing slides across text.',zh:'标签从中心原地放大出现，任何东西都不从文字上滑过。'},
   {en:'A tag that has to be read is at least 24 px and fades out before a morph.',zh:'要读的标签至少 24 px，变形之前先淡出。'},
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
  note:{en:'The change the reviewer expected to add the most points this round was to rebuild the four product screens as sharp vector panels. That was never done.',zh:'这一轮评审认为最能加分的改动，是把四张产品截图重画成清晰的矢量面板。这一条一直没做。'},
  next:{en:'The callouts pop in place. The shot at 8.0 s has clear space around the text.',zh:'标注原地弹出。8.0 秒的镜头里，文字周围留出了空间。'},
 },
 {
  n:5,total:84,sub:[26,23,22,13],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'Headline exits blur into stepped copies',zh:'标题退场时糊成一层层叠影'},
  flagged:[
   {t:'19.45',en:'“Plan B never is.” leaves as stepped red copies, and the “★ Cheapest” badge smears.',zh:'“Plan B never is.” 退场时变成一格一格的红色重影，“★ Cheapest” 标签也糊了。'},
   {t:{en:'all films',zh:'所有片子'},en:'In every film, a headline that leaves on a fast vertical move blurs into stacked, stepped copies. The reviewer said fixing this one thing would raise every film’s score.',zh:'所有片子里，快速向上退场的标题都会糊成一层层错开的叠影。评审说只改这一处，每支片子都会加分。'},
   {t:'23.9',en:'The blue band slices the top line of text; the “+$600” pill covers the start of the page copy.',zh:'蓝色标题带切掉了最上面一行字；“+$600” 标签盖住了正文开头。'},
  ],
  rules:[
   {en:'Type moves no more than about 1.5 px between shutter samples. Lines enter on a quartic ease-out and leave by fading out while rising 24% of their height.',zh:'文字在两个快门采样之间最多移动约 1.5 px。进场用四次方缓出，退场时淡出，同时上移自身高度的 24%。'},
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
  note:{en:'The change was in the shared kit, so every film got it. In round 6 all six files went up 1–3 points, and this one went from 84 to 87.',zh:'这处改在共用的 kit 里，所有片子都用上了。第 6 轮六个文件都涨了 1–3 分，这一支从 84 到 87。'},
  next:{en:'Headline exits are fixed in every film.',zh:'所有片子的标题退场都修好了。'},
  demo:'exit',
 },
 {
  n:6,total:87,sub:[27,24,22,14],
  film:{en:'27.8 s · 30 fps · 16 samples',zh:'27.8 秒 · 30 帧 · 16 个采样'},
  title:{en:'Soft product screenshots',zh:'产品截图发虚'},
  flagged:[
   {t:'23.4, 24.9',en:'The pills pop in with a 2-frame blur over the page text.',zh:'标签弹出时，在正文上有 2 帧模糊。'},
   {t:'20.05',en:'The product screenshots are still soft and look second-hand next to the sharp chart.',zh:'产品截图还是发虚，放在清晰的图表旁边像二手素材。'},
  ],
  verdict:{en:'The film was not sent for review again. None of the six rounds reached the 95 I had asked for. The reviewer’s last remaining item was to redraw the product screens as vector panels.',zh:'这之后没有再送评审。六轮都没到我要求的 95 分。评审最后剩下的一条，是把产品界面重画成矢量面板。'},
 },
];

/** After round 6: the stutter I saw when watching the film, which the scores did not measure. */
export const AFTER={
 title:{en:'Fixing the stutter',zh:'解决卡顿'},
 body:{en:'When I watched the round 6 version the next morning, it stuttered. The review scores had not picked that up. The cameras eased to a stop at every keyframe and before every cut. Some shots ended too fast while others dragged. Devices were positioned with left/top, which Chrome snaps to whole pixels, so slow drifts moved in steps every few frames.',zh:'第二天早上我看第 6 轮的版本，画面一卡一卡的，评审分数没有反映出这一点。镜头在每个关键帧和剪辑点前都会减速停住；有的镜头结束得太快，有的拖得太长；设备用 left/top 定位，Chrome 会把它吸附到整像素，慢速漂移时每隔几帧就跳一下。'},
 rules:[
  {en:'Each span between two cuts plays at its own length, so speed changes only on a cut.',zh:'两个剪辑点之间的每一段按自己的长度播放，速度只在剪辑点上变化。'},
  {en:'Anything that moves slowly is positioned with transform, and the film renders at 60 fps.',zh:'慢速移动的东西都用 transform 定位；整片按 60 帧渲染。'},
  {en:'Smoothness is checked on a measured motion curve.',zh:'顺不顺用量出来的运动曲线检查。'},
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
 note:{en:'Inside, the film still runs on its own 27.8 s clock. The table gives each of its 14 shots a new length, 31.7 s in all. Counters still show whole digits for each output frame.',zh:'片子内部仍用自己 27.8 秒的时间线。这张表给 14 个镜头各定一个新长度，加起来 31.7 秒。计数器仍然每个输出帧只显示完整的数字。'},
};

/** Found by stepping through the final file: frame 786, and three more cuts like it. */
export const OPEN={
 title:{en:'One stray sample at four cuts',zh:'四个剪辑点各多了一个错位的采样'},
 body:{en:'Frame 786, the first frame after the cut at 13.1 s, has a faint ghost. One of its 16 samples still shows the previous shot. The re-pacing table adds shot lengths in floating point, so this cut is stored as 13.100000000000001, slightly after the frame’s first sample at 13.1. Recomputing the sums gives the same error at 8.6, 11.2 and 15.0 s; the other nine cuts are clean. At 1/16 strength for one frame it is hard to see at normal speed. The fix is a tolerance in one comparison and a re-render. I found it while stepping through the final file frame by frame.',zh:'第 786 帧是 13.1 秒剪辑点后的第一帧，上面有一层很淡的残影，16 个采样里有一个还是上一个镜头。重新定速的表用浮点数累加镜头长度，这个剪辑点被存成 13.100000000000001，比这一帧第一个采样的 13.1 稍晚一点。重算这些加法，8.6、11.2 和 15.0 秒也有同样的误差，其余九个剪辑点没有问题。强度只有 1/16，又只出现一帧，正常播放很难看出来。修法是给一处比较加上容差，再重新渲染。这是我逐帧检查成片时发现的。'},
 diff:{file:'src/kit/time.ts',proposed:true,lines:[
  ['-','    while (i < S.length - 1 && tn >= starts[i + 1]) i++;'],
  ['+','    while (i < S.length - 1 && tn >= starts[i + 1] - 1e-9) i++;'],
 ]},
 frame:786,
};

/** The 14 shots of the final file (cntl2-time.ts), in output seconds. */
export const SHOTS=[
 {en:'The pills, sorted; the trap',zh:'胶囊按保费排好，引出陷阱'},
 {en:'Close on C: lowest premium, costliest worst year',zh:'C 的近景：保费最低，最坏的一年最贵'},
 {en:'Every plan, priced for the whole year',zh:'每个方案按全年计价'},
 {en:'The bills sweep from a quiet year to the worst one',zh:'账单从平静的一年扫到最糟的一年'},
 {en:'B lines up with A, then $600',zh:'B 对齐 A，然后是 $600'},
 {en:'The gap rides the sweep',zh:'缺口跟着账单走'},
 {en:'Which plan is cheapest',zh:'哪个方案最便宜'},
 {en:'Close on the cheapest row',zh:'最便宜那一行的近景'},
 {en:'Pull back: “Plan B never is.”',zh:'拉远：“Plan B never is.”'},
 {en:'Product: every plan’s whole year',zh:'产品界面：每个方案的全年费用'},
 {en:'The most it can cost',zh:'最多会花多少'},
 {en:'Save B only after the $600',zh:'确认 $600 之后才能保存 B'},
 {en:'A choice you can explain',zh:'一个说得清的选择'},
 {en:'Lockup',zh:'结尾署名'},
];

/** Frames 772–803 of the site's file: [frame, counter as drawn (held), lowest and highest of its 16 samples had it not
    been held]. All three are computed with the film's own code. */
export const STEPS=[[772,1570,1570,1700],[773,1840,1840,1980],[774,2140,2140,2300],[775,2480,2480,2650],[776,2850,2850,3030],[777,3250,3250,3460],[778,3700,3700,3920],[779,4180,4180,4420],[780,4710,4710,4970],[781,5270,5270,5550],[782,5880,5880,6170],[783,6520,6520,6840],[784,7210,7210,7550],[785,7940,7940,8290],[786,8710,8710,9080],[787,9510,9510,9900],[788,10360,10360,10760],[789,11240,11240,11660],[790,12150,12150,12590],[791,13100,13100,13550],[792,14070,14070,14540],[793,15070,15070,15550],[794,16100,16100,16580],[795,17140,17140,17630],[796,18200,18200,18700],[797,19270,19270,19780],[798,20350,20350,20860],[799,21440,21440,21950],[800,22520,22520,23030],[801,23610,23610,24110],[802,24680,24680,25180],[803,25740,25740,26240]];
