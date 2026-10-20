import {L} from '../../i18n';

// The case's facts, carried over unchanged from the v4 page (cases/ReadyForAgentsCase.jsx), in English and Chinese.
// Sources: cases/p2-design-to-code/draft.md and p2-benchmark/results/results.md (37 scored builds, Oct 19 2026);
// cases/pd-ready-for-agents/BRIEF.md and pd-prototype/README.md (round 2, after a model-assisted design review).
// Concept work, not affiliated with Figma. Nothing in the design chapter has been tested with designers yet; Jay runs
// the sessions next. Chinese keeps Figma's own words (variables, auto layout, Check designs, frame, token, MCP) in
// English, as Chinese designers say them; the prototype itself stays English, so its labels are quoted as they appear.

export const A = '/assets/product/ready-for-agents/';

/** The canvas: one Figma section per chapter, its frames left to right. `name` is the frame's name on the canvas and
    in the Layers list. `hold` keeps the camera on a frame for that many screens of story; `stops` are where it rests
    there, as shares of that stretch (camera.js pages one stop per gesture). */
export const SECTIONS = [
  {id: 'case', name: L('Ready for agents', 'Ready for agents'), frames: [{id: 'cover', name: L('Cover', '封面')}]},
  {id: 'research', name: L('Research', '研究'), frames: [
    {id: 'question', name: L('The question', '问题')},
    {id: 'compile', name: L('What the agent reads', 'agent 读到了什么'), wide: true, hold: 1.5, stops: [.02, .36, .665, .985]},
    {id: 'finding', name: L('Try the finding', '先试试结论')},
    {id: 'method', name: L('Six screens, four versions', '六个界面，四个版本')},
    {id: 'structure', name: L('Same picture, different structure', '画面一样，结构不同')},
    {id: 'pipeline', name: L('One build', '一次构建')},
    {id: 'result-1', name: L('Result 1', '结果 1')},
    {id: 'result-2', name: L('Result 2, the ablation', '结果 2：消融实验')},
    {id: 'insight', name: L('What agents never recovered', 'agent 还原不了的东西')},
  ]},
  {id: 'design', name: L('Design', '设计'), frames: [
    {id: 'brief', name: L('Where it lives', '放在哪里')},
    {id: 'principles', name: L('Principles', '原则')},
    {id: 'directions', name: L('Directions', '方向')},
    {id: 'flow-1', name: L('Flow / Panel row', '流程 / 面板行'), flow: 0},
    {id: 'flow-2', name: L('Flow / Check designs', '流程 / Check designs'), flow: 1},
    {id: 'flow-3', name: L('Flow / Hover outline', '流程 / 悬停描边'), flow: 2},
    {id: 'flow-4', name: L('Flow / Picker', '流程 / 选择器'), flow: 3},
    {id: 'flow-5', name: L('Flow / Apply and undo', '流程 / 应用与撤销'), flow: 4},
    {id: 'flow-6', name: L('Flow / Applied', '流程 / 已应用'), flow: 5},
    {id: 'flow-7', name: L('Flow / Agents tab', '流程 / Agents 标签页'), flow: 6},
    {id: 'rounds', name: L('Round 1 → 2', '第一轮 → 第二轮')},
    {id: 'theme', name: L('Light and dark', '浅色和深色')},
    {id: 'agent', name: L('The agent’s side', 'agent 那一端')},
  ]},
  {id: 'try', name: L('Try it', '试一试'), frames: [{id: 'try', name: L('Prototype, live', '可交互原型'), wide: true}]},
  {id: 'testing', name: L('Testing', '测试'), frames: [{id: 'testing', name: L('Five sessions', '五场测试')}, {id: 'reflection', name: L('Reflection', '复盘')}]},
];
export const FRAMES = SECTIONS.flatMap((s, si) => s.frames.map(f => ({...f, section: s.id, sectionIndex: si})));
export const indexOf = id => FRAMES.findIndex(f => f.id === id);

export const NUMBERS = [
  {value: '37', label: L('Agent builds scored', '次 agent 构建，每次都打了分'), note: L('24 in round 1, including the ablation, and 13 round-2 repeats so far', '第一轮 24 次（含消融实验），第二轮目前重复 13 次')},
  {value: '9', unit: L('of 9', '/ 9'), label: L('Followed every token change', '每次 token 改动都跟上了'), note: L('Builds from a raw file with only variables added', '用原始文件构建，只加了 variables')},
  {value: '50', unit: '%', label: L('Median that reached the code without variables', '不加 variables，改动传到代码里的中位比例'), note: L('18 builds; none followed the whole change', '18 次构建，没有一次完整跟上改动')},
];

// Pre-registered measures, medians of all scored builds per level (n = 9, 9, 10).
export const FLAT = [
  {name: L('Looks like the Figma export (SSIM)', '与 Figma 导出图的相似度（SSIM）'), values: ['0.983', '0.983', '0.984'], share: [.983, .983, .984]},
  {name: L('Passes the resize checks', '通过缩放检查'), values: ['100%', '100%', '100%'], share: [1, 1, 1]},
  {name: L('Absolutely positioned elements', '绝对定位元素'), values: ['2', '2', '2'], share: [.4, .4, .4]},
  {name: L('Colors routed through CSS variables', '走 CSS 变量的颜色占比'), values: ['97%', '94%', '97%'], share: [.97, .94, .97]},
];

// The handoff flow. Camera rects are in the editor's own 1440 x 900 pixels (round 2 of the prototype).
export const FLOW = [
  {id: 'row', screen: 'row', label: L('Panel row', '面板行'), title: L('Selecting a frame says what isn’t bound', '选中一个 frame，就知道哪些值没绑'),
    camera: {x: 640, y: 50, w: 800}, phoneCamera: {x: 1120, y: 90, w: 320},
    alt: L('The properties panel with a Variables row under the frame header: 12 unbound values, and a Check button', '属性面板里，frame 标题下方有一行 Variables：12 unbound values，以及一个 Check 按钮'),
    body: L('One 40 px row sits under the frame header: 12 unbound values, Check, and a menu. It counts values the agent will read as plain hex and px. No score.',
      'frame 标题下面只多了一行，高 40 px：写着 12 unbound values，一个 Check 按钮，一个菜单。它只数 agent 会读成纯 hex 和 px 的值，不打分。')},
  {id: 'review', screen: 'review', label: L('Check designs', 'Check designs'), title: L('Check opens a lens on Check designs', '点 Check，进到 Check designs 里'),
    camera: {x: 440, y: 130, w: 1000}, phoneCamera: {x: 840, y: 140, w: 360},
    alt: L('Check designs with the Variables for agents lens: one row per value and role, each with a checkbox, and Apply 9', 'Check designs 里的 Variables for agents 视图：每个值和用途占一行，各带一个复选框，底部是 Apply 9'),
    body: L('Figma’s Check designs already suggests variables for hard-coded values. The concept adds a Variables for agents lens: one row per value and role, a checkbox on each, and Apply 9 for what’s checked.',
      'Figma 的 Check designs 本来就会给写死的值推荐 variables。这个概念在上面加了一个 Variables for agents 视图：每个“值 + 用途”占一行，每行一个复选框；Apply 9 只应用勾上的项。')},
  {id: 'hover', screen: 'hover', label: L('Hover outline', '悬停描边'), title: L('Hover a row to see where it lives', '悬停在一行上，看它用在哪里'),
    camera: {x: 380, y: 40, w: 1060}, phoneCamera: {x: 410, y: 60, w: 470},
    alt: L('Hovering the FFFFFF frame fill row outlines three print cards on the canvas, dashed, with a 3 layers badge', '悬停在 FFFFFF（frame 填充）这一行时，画布上三张印品卡片出现虚线描边，并显示“3 layers”标记'),
    body: L('Hovering FFFFFF as a frame fill outlines its three print cards, dashed so it never reads as the selection, with a count badge in one fixed spot. That’s direction B, folded into A.',
      '悬停在“FFFFFF，frame 填充”这一行，画布上用到它的三张印品卡片会出现虚线框。用虚线，是为了不和选中状态混在一起。数量标记一直在同一个位置。这就是方向 B，已经并进了方向 A。')},
  {id: 'picker', screen: 'picker', label: L('Picker', '选择器'), title: L('Pick a variable, don’t flip a toggle', '挑一个 variable，不拨开关'),
    camera: {x: 540, y: 250, w: 760}, phoneCamera: {x: 556, y: 286, w: 300},
    alt: L('The variable picker for FFFFFF as frame fill: two variables allowed here, one hidden from pickers, others below, with Light and Dark swatches', 'FFFFFF（frame 填充）的 variable 选择器：两个能用在这里的 variables，一个设成在选择器里隐藏，下面是其他 variables，每个都带浅色和深色色块'),
    body: L('#FFFFFF matches two variables. The picker searches every variable, separates the ones allowed in this role from the ones that aren’t (and says why), and shows each one’s Light and Dark values. The Dark value settles it: surface goes dark, on-accent stays white.',
      '#FFFFFF 能对上两个 variables。选择器能搜全部 variables，把这个用途能用的和不能用的分开，并说明原因；每个 variable 的浅色值和深色值都摆出来。看深色值就能定：surface 变暗，on-accent 还是白色。')},
  {id: 'bound', screen: 'bound', label: L('Apply and undo', '应用与撤销'), title: L('Apply in one step, undo in one step', '一步应用，一步撤销'),
    camera: {x: 560, y: 300, w: 880}, phoneCamera: {x: 600, y: 640, w: 420},
    alt: L('A toast reads Bound 9 values on 29 layers, with Undo; three rows are left to review', '提示条显示“Bound 9 values on 29 layers”和 Undo；还剩三行待处理'),
    body: L('Apply binds what’s checked as one history entry: 9 values on 29 layers. The toast’s Undo and ⌘Z both take it back. Applied rows fold away; the three that need a decision stay.',
      'Apply 把勾上的项一次绑定，只记一条历史：29 个图层上的 9 个值。提示条里的 Undo 和 ⌘Z 都能撤回。应用过的行会收起来，还要拿主意的三行留着。')},
  {id: 'ready', screen: 'ready-review', label: L('Applied', '已应用'), title: L('Applied, exempt, and quiet when it’s done', '已应用、已豁免，处理完就不再打扰'),
    camera: {x: 480, y: 150, w: 960}, phoneCamera: {x: 1100, y: 120, w: 340},
    alt: L('Check designs with an Applied list, each FFFFFF choice remembered per role with Forget, and the gold kept as a raw value; the panel row reads All values use variables', 'Check designs 里的 Applied 列表：每个 FFFFFF 的选择按用途记住，可以 Forget；金色保留为原始值；面板行显示 All values use variables'),
    body: L('To review, applied and exempt stay apart. A choice is remembered per value and role, only after Apply, and can be forgotten. When nothing is left, the row reads All values use variables, in secondary text.',
      '待处理、已应用、已豁免分开放。选择按“值 + 用途”记下，点了 Apply 才记，也可以让它忘掉。全部处理完，那一行就用次要文字显示 All values use variables。')},
  {id: 'agent', screen: 'agent', label: L('Agents tab', 'Agents 标签页'), title: L('The agent hears the same counts', 'agent 收到的是同样的数字'),
    camera: {x: 0, y: 0, w: 960}, phoneCamera: {x: 64, y: 140, w: 400},
    alt: L('The Agents tab: the note names the 3 unbound values and asks which variable FFFFFF should use as a frame fill', 'Agents 标签页：说明列出 3 个未绑定的值，并询问 FFFFFF 作为 frame 填充应该用哪个 variable'),
    body: L('In the Agents tab, the note uses the same words: Home has 3 unbound values, which ones, and a question about FFFFFF instead of an invented token name.',
      'Agents 标签页里的说明，用的是同一套说法：Home 有 3 个未绑定的值，列出是哪几个，再就 FFFFFF 问一个问题，不自己编 token 名。')},
];

// Each principle shows the piece of the prototype that passes its test, at the editor's own size (dw x dh CSS px).
export const PRINCIPLES = [
  {title: L('Say what the agent will miss, not a score', '说清 agent 会漏掉什么，不打分'), test: L('“12 unbound values,” and a Check button. No grade, and no percentage without a count.', '“12 unbound values”，加一个 Check 按钮。不评级；有百分比，就一定有数量。'), img: 'principle-row.webp', dw: 239, dh: 53},
  {title: L('Fix it where it lives, in one undo', '在原处修，一步就能撤销'), test: L('No new window or mode. Apply is one history entry, and one Undo reverts it.', '不开新窗口，不切模式。Apply 是一条历史记录，一次 Undo 就能还原。'), img: 'principle-toast.webp', dw: 254, dh: 52},
  {title: L('Never guess between equal options', '几个选项一样合适时，不替人猜'), test: L('A value that matches two variables is asked about per role, and the answer is remembered only after Apply.', '一个值对得上两个 variables，就按用途分别问；点了 Apply 才记住答案。'), img: 'principle-choice.webp', dw: 344, dh: 76},
  {title: L('Quiet when it’s fine', '没问题就不出声'), test: L('A frame with nothing left reads “All values use variables,” in secondary text.', '全部处理完的 frame，只用次要文字显示“All values use variables”。'), img: 'principle-ready.webp', dw: 239, dh: 53},
  {title: L('Same words on both sides', '两边用同一套说法'), test: L('The row, Check designs and the agent’s note all say “unbound values,” with the same counts.', '面板行、Check designs 和 agent 的说明都叫“unbound values”，数字也一样。'), img: 'principle-words.webp', dw: 227, dh: 112},
];

export const DIRECTIONS = [
  {id: 'a', name: L('Properties panel section', '属性面板区块'), short: L('Panel row', '面板行'),
    idea: L('A one-line Variables row for the selected frame; Check opens Check designs with a Variables for agents lens.', '给选中的 frame 加一行 Variables；点 Check 会打开 Check designs，并切到 Variables for agents 视图。'),
    plus: [L('Visible at selection in one 40 px row; details open on demand', '一选中就看得到，只占一行 40 px；细节想看再展开'), L('Reuses Check designs: pick scoped variables, apply in one undo', '复用 Check designs：挑有作用域的 variables，一步应用，一步撤销')],
    minus: [L('One row in a dense panel is easy to scroll past', '面板很密，一行字很容易滚过去没看见')], role: L('The home, as a lens on Check designs', '主入口，做成 Check designs 的一个视图'), chosen: true},
  {id: 'b', name: L('Canvas overlay', '画布叠加层'), short: L('Canvas', '画布'),
    idea: L('A toggle outlines every raw-value layer and labels it on the canvas.', '打开开关，画布上每个用了原始值的图层都会描边、加标签。'),
    plus: [L('Spatial: you see exactly where each raw value sits', '空间直观：一眼看出每个原始值在哪里')],
    minus: [L('Noisy fast: 9 labels already crowd one phone screen', '很快就乱：9 个标签就挤满了一屏手机界面'), L('Competes with selection, hover and annotations', '和选中、悬停、标注抢注意力')], role: L('Folded into A as the hover outline', '并入 A，成为悬停描边')},
  {id: 'c', name: L('Ready-for-dev checklist', 'Ready for dev 检查清单'), short: L('Checklist', '清单'),
    idea: L('Marking a section ready for dev runs the same check as one step of a checklist.', '把 section 标成 ready for dev 时，跑同样的检查，作为清单里的一项。'),
    plus: [L('Fits a ritual teams already have at handoff', '团队交付时本来就要走这一步，顺势接上')],
    minus: [L('Late: people have stopped editing by then', '太晚：到那一步大家已经不改了'), L('Only reaches teams that use dev status', '只有用 dev 状态的团队才看得到')], role: L('Reuses A’s row in the dev status flow', '在 dev 状态流程里复用 A 的那一行')},
];

export const TASKS = [
  {id: 'miss', screen: 'row', title: L('Find what an agent would miss on the Home frame', '找出 agent 在 Home frame 上会漏掉什么'), hint: L('Read the Variables row in the right panel, then press Check.', '看右侧面板里的 Variables 行，然后点 Check。')},
  {id: 'bind', screen: 'review', title: L('Apply the suggested variables, then undo', '应用推荐的 variables，再撤销'), hint: L('Press Apply 9, then Undo in the toast or ⌘Z.', '点 Apply 9，再点提示条里的 Undo，或者按 ⌘Z。')},
  {id: 'white', screen: 'review', title: L('Decide what #FFFFFF should be in each role', '决定 #FFFFFF 在每种用途下该用什么'), hint: L('It’s a frame fill and a text color. Open each row’s picker; the Dark swatch is the tell.', '它既是 frame 填充，也是文字颜色。打开每一行的选择器，看深色色块就知道。')},
  {id: 'agent', screen: 'after', title: L('Check what the agent will be told', '看看 agent 会收到什么说明'), hint: L('Open Agents in the left navigation bar.', '在左侧导航栏里打开 Agents。')},
];

// Round 1 → round 2 of the same states, cropped to Check designs and the properties panel (scripts/build-round-pairs.mjs).
const R = `${A}rounds/`;
const R1 = L('Round 1', '第一轮'), R2 = L('Round 2', '第二轮');
export const ROUNDS = [
  {id: 'row', tab: L('Panel row', '面板行'), size: [800, 946], caption: L('Home selected. Round 1 added an 88 px Agent handoff section above Position; round 2 is one 40 px row.', '选中 Home。第一轮在 Position 上方加了一块 88 px 高的 Agent handoff；第二轮只剩一行，40 px。'),
    before: {src: `${R}row-r1.webp`, label: R1}, after: {src: `${R}row-r2.webp`, label: R2}},
  {id: 'review', tab: L('Review', '审阅'), caption: L('The review. Round 1 was its own popover; round 2 is Check designs with a Variables for agents lens.', '审阅界面。第一轮是单独的弹出层；第二轮是 Check designs 里的 Variables for agents 视图。'),
    before: {src: `${R}review-r1.webp`, label: R1}, after: {src: `${R}review-r2.webp`, label: R2}},
  {id: 'choice', tab: L('#FFFFFF', '#FFFFFF'), caption: L('Deciding #FFFFFF. Round 1 asked once, with a two-way toggle; round 2 asks per role, from a picker.', '决定 #FFFFFF。第一轮只问一次，用二选一的开关；第二轮按用途分别问，从选择器里挑。'),
    before: {src: `${R}choice-r1.webp`, label: R1}, after: {src: `${R}choice-r2.webp`, label: R2}},
];
// From pd-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: L('Rows are a value plus its role, and only variables scoped to that role are proposed.', '每一行是“值 + 用途”，只推荐作用域允许这个用途的 variables。'), why: L('One hex value can mean different things. An unscoped exact match can be confidently wrong.', '同一个 hex 值可能代表不同的东西。不看作用域的精确匹配，可能错得理直气壮。')},
  {what: L('A lens on Check designs instead of a separate checker.', '做成 Check designs 里的一个视图，而不是另做一个检查工具。'), why: L('It extends what Figma already ships instead of duplicating it.', '扩展 Figma 已有的功能，不重复做一遍。')},
  {what: L('A checkbox on every row and layer, and a button that counts: Apply 9.', '每一行、每个图层都有复选框，按钮上写明数量：Apply 9。'), why: L('The designer decides exactly what changes; round 1 bound every match at once.', '改什么由设计师决定；第一轮会一次全部绑上。')},
  {what: L('One 40 px row replaces the 88 px section above Position.', 'Position 上方 88 px 的区块，缩成一行 40 px。'), why: L('An occasional check shouldn’t outrank everyday editing.', '偶尔才用的检查，不该压过日常编辑。')},
  {what: L('A searchable picker replaces the two-option toggle.', '二选一的开关，换成可搜索的选择器。'), why: L('Real libraries have more than two candidates, and the Dark value settles surface vs on-accent.', '真实的设计库里，候选不止两个；看深色值，才分得清 surface 和 on-accent。')},
  {what: L('“Unbound values” replaces “raw values,” “agents invent names” and “Ready for agents.”', '“raw values”“agents invent names”“Ready for agents”都换成“Unbound values”。'), why: L('Name the issue and the action without overclaiming readiness.', '说清问题和该做的事，不夸口说“已经准备好了”。')},
];

// Figma's own words for the four file habits (the question's list, Figma developer docs).
export const HABITS = [
  {icon: 'instance', name: L('Components', '组件'), note: L('Instances of a library', '来自组件库的实例')},
  {icon: 'variable', name: L('Variables', 'Variables'), note: L('Colors, spacing and radii bound to tokens', '颜色、间距和圆角绑定到 token')},
  {icon: 'text', name: L('Layer names', '图层命名'), note: L('Frames called what they are', 'frame 的名字说明它是什么')},
  {icon: 'frame-v', name: L('Auto layout', 'Auto layout'), note: L('Stacks instead of fixed positions', '靠堆叠排布，不靠固定坐标')},
];

// The agent's note, as the Agents tab and the terminal mock word it (the same summary as the designer's row).
export const AGENT_NOTE = L('Home has 3 unbound values: FFFFFF as frame fill and FFFFFF as text each match more than one; C9A66B matches none. I’ll use variables where they’re bound and ask about the rest instead of inventing names.',
  'Home 有 3 个未绑定的值：FFFFFF 用作 frame 填充，FFFFFF 用作文字，各自都能对上不止一个 variable；C9A66B 一个也对不上。绑好的我直接用 variables，其余的我先问清楚，不自己编名字。');
