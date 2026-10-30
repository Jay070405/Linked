import {L} from '../../i18n';

/* Hako: the words and the film moments. Sources: aigc-vibecoding/saas-film/STORYBOARD.md (the product, the brand and
   the ten beats), src/brand.ts (palette and motion tokens), src/ui/Daybreak.tsx (the dashboard's numbers) and the
   film itself (public/assets/other-project/hako/hako.mp4; the stills under /assets/product/hako/ are frames of it,
   taken at the times below). Hako and Daybreak are fictional and untested; every usefulness claim is a Hypothesis. */

export const FILM_SRC = '/assets/other-project/hako/hako.mp4';
export const FILM_LENGTH = 50;
export const still = (name, w = 1600) => `/assets/product/hako/${name}-${w}.webp`;

export const T = {
  skip: L('Skip the experience: read it as a plain page', '跳过体验，直接读简洁版'),
  back: L('Back to the canvas', '回到画布'),
  flag: L('Fictional product, not tested with people', '虚构产品，还没找人测试'),
  taglineZh: L('', '画一个框，发布一个产品。'),
  outcome: L('Hako (箱, “box”) is a canvas for teams. Draw a box around anything you already have, a napkin sketch, a board, a chart, and agents build what’s inside while your teammates watch, comment and tick off their notes. When it’s right, the box you drew is what ships.',
    'Hako（箱，就是“盒子”）是给团队用的画布。在已有的东西外面画一个框，餐巾纸上的草图、一块白板、一张图表都行，agent 就把框里的东西做出来；队友在旁边看着、留评论、勾掉自己的便签。做对了，你画的那个框就是要上线的东西。'),
  role: L('Designed for a 50-second launch film: the product, its brand and the film. This page is the design thinking: how Hako is used, and why it works the way it does.',
    '这是为一支 50 秒的发布片设计的：产品、品牌和片子本身。这一页讲设计思路：Hako 怎么用，为什么这样设计。'),
  tryIt: L('Try it', '试一试'),
  watch: L('Watch the film', '看发布片'),
  watchLen: L('50 s', '50 秒'),
  chips: [L('October 2026', '2026 年 10 月'), L('Product, brand and launch film', '产品、品牌和发布片'), L('Fictional, untested', '虚构，未测试')],
  about: L('About this project', '项目概况'),
  effect: L('Each section below arrives the way Hako works: a sketch, a selection box, agents in dashed frames, then a scan line. It’s a page effect, nothing is generated, and the words are readable from the start. Can’t wait? Drag a box around a sketch.',
    '下面每一节都按 Hako 的方式出场：先是草图，再被框选，agent 在虚线框里干活，最后一道扫描线把它变成成品。这只是页面效果，没有任何东西是实时生成的，文字从一开始就能读到。等不及的话，在草图外面拖一个框。'),
  filmLabel: L('hako.mp4 · launch film · 0:50 · 1080p60', 'hako.mp4 · 发布片 · 0:50 · 1080p60'),
  filmAlt: L('The opening of the Hako launch film: a persimmon selection box drawn around the words “Draw a box.”', 'Hako 发布片的开头：一个柿子橙选框框住 “Draw a box.” 这几个字'),
  playFilm: L('Play the film', '播放发布片'),
  filmNote: L('With sound. Hako and Daybreak are fictional.', '有声音。Hako 和 Daybreak 都是虚构的。'),

  // 01
  k1: L('01 · How it’s used', '01 · 怎么用'),
  h1: L('One gesture: draw a box around what you have', '只有一个手势：在已有的东西外面画个框'),
  l1: L('In the film, Mia, Theo and Ren have sketched a home-energy dashboard, Daybreak, and stuck notes beside it. Nobody writes a spec. Someone draws a box around the sketch, types six words and presses Build.',
    '片子里，Mia、Theo 和 Ren 已经画好了家庭能源仪表盘 Daybreak 的草图，旁边贴着各自的便签。没人写需求文档。有人在草图外面画个框，打一行字，按下 Build。'),
  demoTitle: L('Try it on the team’s sketch', '在团队的草图上试试'),
  demoLede: L('Draw a box, press Build, and watch the agents take a region each. When the build covers a teammate’s note, they tick it off. Ship when it’s ready.',
    '画一个框，按 Build，看 agent 各自认领一块区域。做出来的东西满足了谁的便签，谁就自己勾掉。做好了就发布。'),
  stepsTitle: L('The whole flow, in the film', '完整流程，看片子里怎么走'),
  stepsLede: L('Eight moments from the 50-second film. Each one plays from that point.', '从 50 秒的片子里挑了八个时刻，每个都能从那一刻开始播放。'),
  playFrom: s => L(`Play from ${s}`, `从 ${s} 开始播放`),
  stepOf: (i, n) => L(`Step ${i} of ${n}`, `第 ${i} 步，共 ${n} 步`),

  // 02
  k2: L('02 · Why it’s built this way', '02 · 为什么这样设计'),
  h2: L('Six choices, each one a bet', '六个设计决定，每个都是一次押注'),
  l2: L('Hako and Daybreak are fictional and no one has used them. These are the choices the product and its brand were designed around, and why I expect each to help. Every one is labelled Hypothesis: expected, not yet checked.',
    'Hako 和 Daybreak 都是虚构的，还没有人用过。下面是产品和品牌围绕的六个设计决定，以及我为什么觉得它们有用。每一条都标着 Hypothesis：是我的预期，还没验证。'),
  expect: L('Expected', '预期'),

  // 03
  k3: L('03 · The brand', '03 · 品牌'),
  h3: L('The selection box is the logo', '选框就是 logo'),
  l3: L('The mark is a selection box: a square frame with four handles. It also reads as 口, a box. In the wordmark the “o” is the selection box again, and in the film the same box draws the first words, becomes the agents’ frames, extrudes into the box that ships and ends as the logo.',
    '标志就是一个选框：方框加四个控制点。它也可以读成“口”，一个盒子。字标里的 o 又是那个选框。片子里，同一个框先框出第一句话，再变成 agent 的工作框，然后被拉伸成发出去的盒子，最后收成 logo。'),
  paletteTitle: L('One hot accent on warm paper', '暖纸色上，只有一个热烈的强调色'),
  paletteRule: L('Persimmon belongs to your own selection and to brand moments; ultraviolet marks agents and nothing else; the product being built keeps its own palette. Never two accents leading one frame.',
    '柿子橙只属于你自己的选框和品牌时刻；紫外色只标 agent，别无他用；正在做的产品保留自己的配色。一个画面里，永远不让两个强调色同时领衔。'),
  teammates: L('Teammates: cursors and frames only', '队友色：只用在光标和选框上'),
  typeTitle: L('Three typefaces, three jobs', '三种字体，各管一件事'),
  typeDisplay: L('Display: heavy and wide, 820–880, width 110–118, −0.045 em.', '标题：粗而宽，字重 820–880，字宽 110–118，字距 −0.045 em。'),
  typeUi: L('Product UI: what you read while you work.', '产品界面：干活时读的字。'),
  typeMono: L('Readouts: sizes, timings, code.', '读数：尺寸、时间、代码。'),
  width: L('Width', '字宽'),
  motionTitle: L('Six durations, three eases', '六个时长，三条缓动曲线'),
  motionLede: L('Every move in the film is one of a few named decisions. Every ease starts from rest and peaks under three times its average speed. Pick a token and an ease, and the box moves with them.',
    '片子里的每个动作，都是几个有名字的决定之一。每条缓动都从静止开始，峰值速度不超过平均速度的三倍。选一个时长和一条曲线，盒子就按它来动。'),
  play: L('Move the box', '让盒子动一下'),
  boardTitle: L('The brand board', '品牌板'),
  boardAlt: L('The Hako brand board: the mark and wordmark, the line “Draw a box. Ship a product.”, the palette with each colour’s role, the three typefaces, the motion tokens and the signature components (your selection, an agent’s frame, a teammate’s cursor)',
    'Hako 品牌板：标志和字标，标语 “Draw a box. Ship a product.”，每种颜色的用途，三种字体，动效参数，以及几个标志性组件（你的选框、agent 的工作框、队友的光标）'),

  // 04
  k4: L('04 · Limits, and what I’d test', '04 · 局限，以及我会怎么测'),
  h4: L('What this doesn’t show', '这里没有展示的'),
  l4: L('A film shows the path where everything goes right. These are the parts it leaves out, and the first tests I’d run.', '片子展示的是一切顺利的那条路。下面是它没拍到的部分，以及我会先做的几项测试。'),
  testsTitle: L('What I’d test first', '我会先测什么'),
  resultsTitle: L('Results, not run yet', '结果（还没测）'),
  resultsBadge: L('Placeholder: filled in after the sessions', '占位：测完再填'),
  filmMade: L('How the launch film was made', '这支发布片是怎么做出来的'),
  filmMadeNote: L('The technical side, on Other Project.', '技术部分，在 Other Project 里。'),
};

/** The flow, in the film: the moment (seconds), the still, what happens and why it matters. */
export const STEPS = [
  {t: 5.3, img: 'draw', title: L('Draw a box around the team’s sketch', '在团队的草图外面画个框'),
    body: L('The sketch is already on the canvas, with Mia’s, Theo’s and Ren’s notes beside it. The box says which part you mean, and its size tag says how big it is.', '草图本来就在画布上，旁边是 Mia、Theo 和 Ren 的便签。框说明你指的是哪一块，尺寸标签写着它有多大。'),
    alt: L('A persimmon selection box around a hand-drawn dashboard sketch, with three sticky notes beside it', '一个柿子橙选框框住手绘的仪表盘草图，旁边贴着三张便签')},
  {t: 8.6, img: 'agents', title: L('Say what you want; agents split the box', '说一句想要什么，agent 把框分了'),
    body: L('“Make it real — dark, live data.” Three agents take a region each, Layout, Metrics and Devices, and each shows it’s thinking as a dashed frame on its region.', '“Make it real — dark, live data.” 三个 agent 各认领一块：Layout、Metrics、Devices。每个 agent 在自己那块上用虚线框表示正在思考。'),
    alt: L('The prompt “Make it real — dark, live data” under the sketch; three ultraviolet agent cursors, Layout, Metrics and Devices, each over a dashed frame', '草图下方的提示 “Make it real — dark, live data”；三个紫外色的 agent 光标 Layout、Metrics、Devices，各自停在一个虚线框上')},
  {t: 9.6, img: 'build', title: L('A scan line turns the sketch into the product', '扫描线把草图变成产品'),
    body: L('Each agent lays its region down under an ultraviolet scan line. Its chip says what it’s doing and how far along it is.', '每个 agent 在一道紫外色扫描线下铺出自己的区域，标签上写着它在做什么、做到了多少。'),
    alt: L('The sketch half turned into a dark dashboard, with agent chips such as “3 cards · tokens/surface 21%”', '草图有一半已经变成深色仪表盘，agent 标签写着 “3 cards · tokens/surface 21%” 之类的进度')},
  {t: 16.4, img: 'team', title: L('The team is on the same canvas', '团队在同一张画布上'),
    body: L('Mia, Theo and Ren tick their own notes once the build covers them. Theo flips the chart from Day to Week. Their cursors and frames carry their colours.', '构建结果满足了便签上的要求，Mia、Theo 和 Ren 就各自勾掉。Theo 把图表从“日”切到“周”。他们的光标和选框都带着各自的颜色。'),
    alt: L('The finished Daybreak dashboard with three teammate cursors, Theo, Mia and Ren, each in their own colour', '做好的 Daybreak 仪表盘上，有三位队友的光标：Theo、Mia、Ren，各是各的颜色')},
  {t: 19.7, img: 'thread', title: L('Ask on the canvas; the agent answers in the thread', '在画布上提问，agent 在同一个讨论串里回答'),
    body: L('Mia pins a comment: “Can we see this per room?” Hako answers in the same thread and adds a per-room breakdown to the dashboard.', 'Mia 钉了一条评论：“Can we see this per room?” Hako 在同一个讨论串里回复，并在仪表盘上加了按房间的明细。'),
    alt: L('A comment thread beside the dashboard: Mia asks “Can we see this per room?”, Hako, marked as an agent, replies “Added a per-room breakdown”', '仪表盘旁的讨论串：Mia 问 “Can we see this per room?”，标着 agent 的 Hako 回复 “Added a per-room breakdown”')},
  {t: 28.4, img: 'layers', title: L('Every layer is code', '每一层都是代码'),
    body: L('Pull the screen apart into its layers. Pick Saturday’s bar on the data layer and the inspector writes highlight="sat" into the chart’s code.', '把界面拆成一层层。在数据层上点选周六那根柱子，检查器就把 highlight="sat" 写进图表的代码里。'),
    alt: L('The dashboard exploded into tagged layers (Surface, Panels, Content); an inspector shows the chart’s code with the new line highlight="sat"', '仪表盘被拆成带标签的几层（Surface、Panels、Content）；检查器里显示图表的代码，新加了一行 highlight="sat"')},
  {t: 36.3, img: 'ship', title: L('The selection becomes the box that ships', '选框变成要发出去的盒子'),
    body: L('Press Ship and the selection extrudes into a box. It rides the deploy track past Build, Checks and Edge, and you see each stage pass.', '按下 Ship，选框被拉伸成一个盒子，沿着部署轨道经过 Build、Checks、Edge，每一关通过都看得见。'),
    alt: L('A persimmon carton printed with the Hako mark and “Daybreak · v1” rides past a deploy stage marked Edge, 38 regions', '印着 Hako 标志和 “Daybreak · v1” 的柿子橙纸箱，正经过标着 “Edge, 38 regions” 的部署阶段')},
  {t: 39.6, img: 'live', title: L('Live', '上线'),
    body: L('It unpacks into the browser at daybreak.energy, and the first visitors arrive.', '盒子在浏览器里拆开，daybreak.energy 上线，第一批访客来了。'),
    alt: L('Daybreak live in a browser, with a “Shipped to production · just now” notice and a visitors-since-launch card', 'Daybreak 在浏览器里上线了，旁边是 “Shipped to production · just now” 的提示和一张“上线以来访客数”的卡片')},
];

/** The six choices. `mini` names the small working model beside each. */
export const PRINCIPLES = [
  {id: 'point', mini: 'point', title: L('Point instead of describe', '指出来，而不是描述出来'),
    body: L('Teams rarely start from nothing: the thing is already half-made on a canvas. Describing it again in a prompt throws away what’s drawn. A box points at it, and sets the prompt’s scope at the same time. There’s one gesture to learn, and every design tool already teaches it.',
      '团队很少从零开始，东西往往已经在画布上做了一半。再用一段提示词把它描述一遍，等于把画好的东西扔掉。画一个框就能指着它，同时也划定了提示词的范围。要学的手势只有一个，而且每个设计工具早就教过。'),
    claim: L('A box and a short prompt reach a first build worth keeping with fewer re-prompts than a written description.', '画框加一句短提示，比写一段描述更快做出第一版值得保留的东西，返工的提示也更少。')},
  {id: 'colour', mini: 'colour', title: L('Colour says who is acting', '颜色说明是谁在动手'),
    body: L('Persimmon is only ever your own selection. Ultraviolet is only ever an agent. Mia’s, Theo’s and Ren’s colours appear only on their cursors and frames, and green only on what has shipped. With agents and people editing one canvas, you can tell at a glance what a person did and what an agent did. The brief asked for “the rush of speed with full control”: the control is knowing who changed what. A name travels with every colour, so it never rests on colour alone.',
      '柿子橙只用在你自己的选框上，紫外色只属于 agent。Mia、Theo、Ren 的颜色只出现在他们的光标和选框上，绿色只出现在已经发布的东西上。agent 和人一起改同一张画布时，一眼就能看出哪些是人做的、哪些是 agent 做的。brief 里要的是“速度带来的快感，加上完全的掌控”：掌控，就是知道谁改了什么。每种颜色旁边都带着名字，所以不会只靠颜色区分。'),
    claim: L('People can point at everything the agent changed without asking.', '不用问，大家就能指出 agent 改过的所有地方。')},
  {id: 'frames', mini: 'frames', title: L('Agents work in frames you can see', 'agent 在看得见的框里干活'),
    body: L('Each agent takes a region, shows it’s thinking as a dashed frame, then builds under a scan line. Progress is spatial: you see where the work is, not a log of what was said, and you can watch one region and ignore the rest. Every section of this page arrived that way.',
      '每个 agent 认领一块区域，思考时显示虚线框，然后在扫描线下把它做出来。进度是空间上的：你看到的是活儿在哪儿，而不是一串聊天记录；可以只盯着一块，其他的不管。这一页的每一节都是这样出场的。'),
    claim: L('People catch an agent’s wrong turn sooner in a frame on the canvas than in a chat log.', '在画布上的框里，比在聊天记录里更早发现 agent 走偏了。')},
  {id: 'team', mini: 'team', title: L('The team stays in the loop', '团队一直在场'),
    body: L('Comments are pinned to the thing they’re about, and the agent answers in the same thread, so a request and its result sit together. Notes are ticked off by the people who wrote them, not by the agent: the agent can say it’s done, but the author decides.',
      '评论钉在它所说的东西上，agent 就在同一个讨论串里回复，请求和结果放在一起。便签由写它的人自己勾掉，而不是 agent：agent 可以说做完了，但算不算数由作者决定。'),
    claim: L('Requests left on the canvas get resolved without a meeting.', '留在画布上的请求，不开会也能解决。')},
  {id: 'code', mini: 'code', title: L('The canvas is the code', '画布就是代码'),
    body: L('Every layer is production-ready, so selecting a bar writes a prop. There’s no handoff in which the design loses its meaning on the way to code. My Ready for agents case measured that loss from the other side, with coding agents building from Figma files; here it’s only a premise of a fictional product.',
      '每一层都能直接上生产，所以选中一根柱子，就会写出一个属性。设计交给代码的路上，没有哪一步会把含义弄丢。我在 Ready for agents 那个案例里，从另一头量过这种丢失（让 coding agent 照着 Figma 文件写代码）；在这里，它只是一个虚构产品的设计前提。'),
    claim: L('Edits made on the canvas arrive in the code unchanged.', '在画布上改的东西，原样进到代码里。')},
  {id: 'ship', mini: 'ship', title: L('What you select is what ships', '选中什么，就发布什么'),
    body: L('The box you drew at the start is the box that ships. It carries a visible deploy track, Build, Checks and Edge, so shipping is something you watch happen, not a button you hope worked.',
      '一开始画的那个框，就是最后发出去的那个盒子。它带着一条看得见的部署轨道：Build、Checks、Edge。发布是你看着它发生的事，而不是按下按钮后只能祈祷。'),
    claim: L('Seeing the track is what lets people trust a one-click ship from a selection.', '看得见部署轨道，大家才敢从一个选框一键发布。')},
];

export const LIMITS = [
  L('Hako and Daybreak are fictional. The film and this page are the only places they exist, and no one has used them.', 'Hako 和 Daybreak 都是虚构的。除了这支片子和这一页，它们不存在于任何地方，也没有人用过。'),
  L('The demo on this page is scripted: the agents reveal UI made in advance, on a timer. No model runs.', '这一页上的演示是写好脚本的：agent 按时间揭开事先做好的界面，没有调用任何模型。'),
  L('The film never shows an agent getting it wrong, or two people and an agent editing one region at once. Those are the cases the design has to survive.', '片子里从没出现 agent 做错的情况，也没有两个人和一个 agent 同时改同一块区域。这些才是设计真正要扛住的场景。'),
  L('Three teammate colours work for a team of three. A team of thirty needs another rule; names carry it for now.', '三种队友颜色够三个人用。三十个人的团队需要另一套规则，眼下靠的是名字。'),
  L('“The canvas is the code” assumes a component library and tokens the agents build with (Daybreak tokens, in the film). That library is the hard part, and it isn’t designed here.', '“画布就是代码”的前提，是 agent 有一套现成的组件库和 token（片子里叫 Daybreak tokens）。真正难的是这套库，这里没有设计它。'),
  L('Ship goes from a selection to production through Checks, with no human review step.', 'Ship 从选框直接发到生产环境，中间有 Checks，但没有人工审核这一步。'),
];

export const TESTS = [
  {claim: L('Pointing beats describing', '指出来比描述出来好'), how: L('Give six designers a half-made board. Half build with a box and a short prompt, half with a written description. Count re-prompts, and time to the first build they’d keep.', '找六位设计师，给一块做了一半的白板。一半人用画框加短提示，一半人写描述。记下返工提示的次数，以及做出第一版愿意保留的结果用了多久。')},
  {claim: L('Colour tells you who did what', '颜色能说明谁做了什么'), how: L('After five minutes with one agent and two teammates, ask each person to point at everything the agent changed, and score it against the canvas history.', '一个 agent 和两位队友一起做五分钟，然后请每个人指出 agent 改过的所有地方，和画布的历史记录对照打分。')},
  {claim: L('Frames beat a chat log', '工作框比聊天记录好'), how: L('Plant one wrong turn in an agent’s build. Compare how soon people catch it with frames on the canvas and with a chat log.', '在 agent 的构建里故意埋一个错误，比较大家在画布框里和在聊天记录里分别多快发现。')},
  {claim: L('The canvas is the code', '画布就是代码'), how: L('Have an engineer review the diff after a session of canvas edits: did every edit arrive as made, and would they merge it?', '做完一轮画布修改后，请一位工程师看代码 diff：每处修改是不是原样到达？他们愿不愿意合并？')},
  {claim: L('The track earns trust in Ship', '部署轨道让人敢按 Ship'), how: L('Watch what people check before pressing Ship, with and without the track.', '观察大家按 Ship 之前会检查什么，有轨道和没轨道各看一次。')},
];

export const RESULTS = [
  [L('Re-prompts, box and description', '返工提示次数：画框 / 描述'), L('— / —', '— / —')],
  [L('Agent edits found, of all made', '找出的 agent 修改 / 全部修改'), L('— of —', '— / —')],
  [L('Wrong turn caught, frames and log', '发现错误用时：工作框 / 聊天记录'), L('— s / — s', '— 秒 / — 秒')],
  [L('Edits arriving unchanged', '原样到达的修改'), L('— of —', '— / —')],
];
