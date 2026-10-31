import {L} from '../../i18n';

/* Hako: the words and the film moments. Sources: aigc-vibecoding/saas-film/STORYBOARD.md (the product, the brand and
   the ten beats), src/brand.ts (palette and motion tokens), src/ui/Daybreak.tsx (the dashboard's numbers) and the
   film itself (public/assets/other-project/hako/hako.mp4; the stills under /assets/product/hako/ are frames of it,
   taken at the times below). Hako and Daybreak are fictional and untested; every usefulness claim is a Hypothesis.
   Copy: plain working notes. Headings name the subject; no staged lines, no dashes between clauses. The product's own
   UI text (the prompt, Daybreak, the code) stays in English in both languages. */

export const FILM_SRC = '/assets/other-project/hako/hako.mp4';
export const FILM_LENGTH = 50;
export const still = (name, w = 1600) => `/assets/product/hako/${name}-${w}.webp`;

export const T = {
  skip: L('Read without the animation', '不看动画，直接阅读'),
  back: L('Back to the animated version', '回到动画版'),
  flag: L('Fictional product, not tested with people', '虚构产品，还没有找人测试'),
  taglineZh: L('', '画一个框，发布一个产品。'),
  outcome: L('Hako (箱, “box”) is a canvas for teams. You draw a box around something the team already has, such as a napkin sketch, a board or a chart, and agents build what’s inside while your teammates watch, comment and tick off their notes. When the result is right, the box you drew is what ships.',
    'Hako（箱，意思是“盒子”）是给团队用的画布。在团队已有的东西外面画一个框，比如餐巾纸上的草图、一块白板或一张图表，agent 就会把框里的内容做出来，队友在旁边看、留评论、勾掉自己的便签。结果没问题以后，你画的这个框就是要发布的东西。'),
  role: L('The product and its brand were designed for a 50-second launch film.', '产品和品牌是为一支 50 秒的发布片设计的。'),
  tryIt: L('Try the demo', '试用演示'),
  watch: L('Watch the film', '看发布片'),
  watchLen: L('50 s', '50 秒'),
  chips: [L('October 2026', '2026 年 10 月'), L('Product, brand and launch film', '产品、品牌和发布片'), L('Fictional, untested', '虚构，未测试')],
  about: L('About this project', '项目概况'),
  effect: L('The sections below load as sketches. When one scrolls into view it is selected, agents mark its parts with dashed frames, and a scan line turns it into the finished section, the same steps Hako uses to build. This is an animation over text that is already on the page; nothing is generated. To build a sketch sooner, drag a box around it.',
    '下面各节先以草图出现。滚动到某一节时，它会被框选，agent 用虚线框标出各个部分，再由一道扫描线把它变成完成的样子，步骤和 Hako 构建时一样。这只是动画，文字一开始就在页面里，没有实时生成任何内容。想早点看到某一节，可以在它的草图外面拖一个框。'),
  filmLabel: L('hako.mp4 · launch film · 0:50 · 1080p60', 'hako.mp4 · 发布片 · 0:50 · 1080p60'),
  filmAlt: L('The opening of the Hako launch film: a persimmon selection box drawn around the words “Draw a box.”', 'Hako 发布片的开头：一个柿子橙色的选框框住 “Draw a box.” 这几个字'),
  playFilm: L('Play the film', '播放发布片'),
  filmNote: L('With sound. Hako and Daybreak are fictional.', '有声音。Hako 和 Daybreak 都是虚构的。'),

  // 01
  k1: L('01 · How it’s used', '01 · 怎么用'),
  h1: L('Building from a selection box', '用选框发起构建'),
  l1: L('In the film, Mia, Theo and Ren have sketched a home-energy dashboard called Daybreak and left notes beside it. Someone draws a box around the sketch, types a six-word prompt and presses Build.',
    '片子里，Mia、Theo 和 Ren 已经画好了家庭能源仪表盘 Daybreak 的草图，旁边贴着各自的便签。有人在草图外面画一个框，输入一句六个单词的提示，按下 Build。'),
  demoTitle: L('Demo with the sketch from the film', '用片子里的草图做的演示'),
  demoLede: L('Drag a box over part of the sketch and press Build. Each agent takes one region. When a finished region covers what a teammate’s note asked for, that teammate ticks the note. Ship becomes available once one region is built.',
    '在草图上拖一个框，按 Build。每个 agent 负责一块区域。某块做好以后，如果正好是谁便签上要的，那个人会把便签勾掉。有一块做好，就可以点 Ship。'),
  stepsTitle: L('The full flow in the film', '片子里的完整流程'),
  stepsLede: L('Eight frames from the 50-second film, in order. Each button plays the film from that frame.', '从 50 秒的片子里按顺序取了八帧，每帧下面的按钮会从这一帧开始播放。'),
  playFrom: s => L(`Play from ${s}`, `从 ${s} 开始播放`),

  // 02
  k2: L('02 · Why it’s built this way', '02 · 为什么这样设计'),
  h2: L('Six design decisions and the reasons for them', '六个设计决定和各自的理由'),
  l2: L('Hako and Daybreak are fictional, and no one has used them. These are the decisions the product and its brand were designed around, each with the reason I expect it to help. None has been tested, so each is labelled Hypothesis.',
    'Hako 和 Daybreak 都是虚构的，没有人用过。下面是产品和品牌设计时围绕的六个决定，以及我认为每一个有用的理由。这些都还没验证，所以都标为 Hypothesis。'),

  // 03
  k3: L('03 · The brand', '03 · 品牌'),
  h3: L('The logo is a selection box', 'logo 是一个选框'),
  l3: L('The mark is a square frame with four handles, the selection box, and it also reads as 口, a box. The “o” in the wordmark is the same box. In the film the box draws the first words, becomes the agents’ frames, extrudes into the box that ships and ends as the logo.',
    '标志是一个带四个控制点的方框，也就是选框，也可以读成“口”，一个盒子。字标里的 o 也是这个框。片子里，这个框先框出第一句话，再变成 agent 的工作框，然后被拉伸成发布出去的盒子，最后变成 logo。'),
  paletteTitle: L('Colours and what each one is for', '颜色和各自的用途'),
  paletteRule: L('Persimmon is for your own selection and for brand moments. Ultraviolet marks agents and nothing else. The product being built keeps its own palette, and two accents never lead the same frame.',
    '柿子橙用在你自己的选框和品牌画面上，紫外色只用来标 agent。正在做的产品用它自己的配色。同一个画面里不会有两个强调色同时作主色。'),
  teammates: L('Teammates, on cursors and frames only', '队友的颜色，只用在光标和选框上'),
  typeTitle: L('Typefaces', '字体'),
  typeDisplay: L('Display type. Weight 820–880, width 110–118, letter spacing −0.045 em.', '标题字。字重 820–880，字宽 110–118，字距 −0.045 em。'),
  typeUi: L('Text in the product interface.', '产品界面里的文字。'),
  typeMono: L('Readouts such as sizes, timings and code.', '尺寸、时间、代码这类读数。'),
  width: L('Width', '字宽'),
  motionTitle: L('Motion tokens', '动效参数'),
  motionLede: L('Every move in the film uses one of these named durations and eases. Each ease starts from rest, and its peak speed stays under three times its average speed. Choose a duration and an ease to move the box with them.',
    '片子里的每个动作，都用这里的一个时长和一条缓动曲线。每条曲线都从静止开始，峰值速度不超过平均速度的三倍。选一个时长和一条曲线，盒子就按它们移动。'),
  play: L('Move the box', '移动盒子'),
  boardTitle: L('The brand board', '品牌板'),
  boardAlt: L('The Hako brand board: the mark and wordmark, the line “Draw a box. Ship a product.”, the palette with the role of each colour, the three typefaces, the motion tokens and three components (your selection, an agent’s frame and a teammate’s cursor)',
    'Hako 品牌板：标志和字标，标语 “Draw a box. Ship a product.”，每种颜色的用途，三种字体，动效参数，以及三个组件（你的选框、agent 的工作框、队友的光标）'),

  // 04
  k4: L('04 · Limits, and what I’d test', '04 · 局限，以及我会怎么测'),
  h4: L('What the film and the demo leave out', '片子和演示没有涉及的部分'),
  l4: L('The film only shows the case where everything works. Below are the cases it leaves out, then the tests I would run first.', '片子只拍了一切顺利的情况。下面先列出它没拍到的情况，再列出我会先做的测试。'),
  testsTitle: L('What I’d test first', '我会先测什么'),
  resultsTitle: L('Results (not run yet)', '结果（还没测）'),
  resultsBadge: L('Placeholder until the sessions are run', '占位，测完再填'),
  filmMade: L('How the launch film was made', '这支发布片是怎么做出来的'),
  filmMadeNote: L('Technical notes, on Other Project.', '技术说明在 Other Project 里。'),
};

/** The flow, in the film: the moment (seconds), the still, what happens. */
export const STEPS = [
  {t: 5.3, img: 'draw', title: L('Draw a box around the team’s sketch', '在团队的草图外面画一个框'),
    body: L('The sketch is already on the canvas, with notes from Mia, Theo and Ren beside it. The box marks the part you mean, and the tag under it gives its size.', '草图已经在画布上了，旁边是 Mia、Theo 和 Ren 的便签。框标出你要的那一块，下面的标签写着它的尺寸。'),
    alt: L('A persimmon selection box around a hand-drawn dashboard sketch, with three sticky notes beside it', '一个柿子橙色的选框框住手绘的仪表盘草图，旁边贴着三张便签')},
  {t: 8.6, img: 'agents', title: L('Type a prompt, and three agents divide the box', '输入提示，三个 agent 分掉这个框'),
    body: L('The prompt is “Make it real — dark, live data.” Three agents named Layout, Metrics and Devices each take a region and mark it with a dashed frame while they work out what to build.', '提示是 “Make it real — dark, live data.”。三个 agent（Layout、Metrics、Devices）各领一块区域，想好怎么做之前，先用虚线框把这块标出来。'),
    alt: L('The prompt “Make it real — dark, live data” under the sketch; three ultraviolet agent cursors, Layout, Metrics and Devices, each over a dashed frame', '草图下方是提示 “Make it real — dark, live data”；三个紫外色的 agent 光标 Layout、Metrics、Devices，各自停在一个虚线框上')},
  {t: 9.6, img: 'build', title: L('Agents build their regions under a scan line', 'agent 在扫描线下做出各自的区域'),
    body: L('Each agent builds its region under an ultraviolet scan line. Its label shows what it is working on and the percentage done.', '每个 agent 在一道紫外色扫描线下把自己那块做出来，标签上写着正在做什么、完成了百分之几。'),
    alt: L('The sketch half turned into a dark dashboard, with agent labels such as “3 cards · tokens/surface 21%”', '草图有一半已经变成深色仪表盘，agent 的标签上写着 “3 cards · tokens/surface 21%” 这样的进度')},
  {t: 16.4, img: 'team', title: L('Teammates on the same canvas', '队友在同一张画布上'),
    body: L('Mia, Theo and Ren tick off their own notes once the build covers them, and Theo switches the chart from Day to Week. Each teammate’s cursor and frames use their own colour.', '做出来的东西满足了便签上的要求，Mia、Theo 和 Ren 就各自勾掉便签，Theo 还把图表从“日”切到了“周”。每个人的光标和选框都用自己的颜色。'),
    alt: L('The finished Daybreak dashboard with three teammate cursors, Theo, Mia and Ren, each in their own colour', '做好的 Daybreak 仪表盘上有三位队友的光标，Theo、Mia、Ren 各用一种颜色')},
  {t: 19.7, img: 'thread', title: L('An agent answers a comment', 'agent 回复画布上的评论'),
    body: L('Mia pins a comment asking “Can we see this per room?” Hako replies in the same thread and adds a per-room breakdown to the dashboard.', 'Mia 钉了一条评论：“Can we see this per room?”（能按房间看吗？）Hako 在同一个讨论串里回复，并在仪表盘上加了按房间的明细。'),
    alt: L('A comment thread beside the dashboard: Mia asks “Can we see this per room?”, Hako, marked as an agent, replies “Added a per-room breakdown”', '仪表盘旁的讨论串：Mia 问 “Can we see this per room?”，标着 agent 的 Hako 回复 “Added a per-room breakdown”')},
  {t: 28.4, img: 'layers', title: L('Picking a bar writes code', '选中一根柱子就写出代码'),
    body: L('The screen separates into its layers. Picking Saturday’s bar on the data layer makes the inspector add highlight="sat" to the chart’s code.', '界面拆开成几层。在数据层上选中周六的柱子，检查器就在图表代码里加上 highlight="sat"。'),
    alt: L('The dashboard separated into labelled layers (Surface, Panels, Content); an inspector shows the chart’s code with the new line highlight="sat"', '仪表盘被拆成带标签的几层（Surface、Panels、Content）；检查器里是图表的代码，多了一行 highlight="sat"')},
  {t: 36.3, img: 'ship', title: L('Shipping the selection', '发布选中的部分'),
    body: L('Pressing Ship extrudes the selection into a box, which travels along a deploy track past Build, Checks and Edge. Each stage shows when it has passed.', '按下 Ship，选框被拉伸成一个盒子，沿部署轨道依次经过 Build、Checks、Edge，每一关通过时都会显示出来。'),
    alt: L('A persimmon carton printed with the Hako mark and “Daybreak · v1” passes a deploy stage marked Edge, 38 regions', '印着 Hako 标志和 “Daybreak · v1” 的柿子橙色纸箱，正经过标着 “Edge, 38 regions” 的部署阶段')},
  {t: 39.6, img: 'live', title: L('Live at daybreak.energy', '在 daybreak.energy 上线'),
    body: L('The box unpacks into a browser showing daybreak.energy, and a card counts visitors since launch.', '盒子在浏览器里展开，打开的是 daybreak.energy，旁边有一张卡片记录上线以来的访客数。'),
    alt: L('Daybreak live in a browser, with a “Shipped to production · just now” notice and a visitors-since-launch card', 'Daybreak 在浏览器里上线了，旁边是 “Shipped to production · just now” 的提示和一张上线以来访客数的卡片')},
];

/** The six decisions. `mini` names the small working model beside each. */
export const PRINCIPLES = [
  {id: 'point', mini: 'point', title: L('Selecting what already exists', '直接框选已有的东西'),
    body: L('Teams usually have the thing half-made on a canvas already. Describing it again in a prompt leaves out what is drawn. A box points at the drawing and sets the scope of the prompt at the same time. It is a single gesture, and design tools already use it for selecting.',
      '团队手里的东西，通常已经在画布上做了一半。再用提示词描述一遍，画好的部分就用不上了。画一个框可以直接指着草图，同时划定提示词作用的范围。只有这一个手势，设计工具里本来就用它来选择。'),
    claim: L('A box and a short prompt reach a first build worth keeping with fewer re-prompts than a written description.', '用框加一句短提示，得到第一版值得保留的结果，需要的返工提示比写一段描述少。')},
  {id: 'colour', mini: 'colour', title: L('Colour shows who made a change', '用颜色区分谁做的改动'),
    body: L('Persimmon is used only for your own selection, and ultraviolet only for agents. Mia’s, Theo’s and Ren’s colours appear only on their cursors and frames, and green only on what has shipped. With people and agents editing the same canvas, you can see which changes a person made and which an agent made. The brief asked for “the rush of speed with full control”, and here control means knowing who changed what. Every colour has a name next to it, so nothing depends on colour alone.',
      '柿子橙只用于你自己的选框，紫外色只用于 agent。Mia、Theo、Ren 的颜色只出现在各自的光标和选框上，绿色只出现在已经发布的内容上。人和 agent 同时改一张画布时，能看出哪些改动是人做的，哪些是 agent 做的。brief 里写的是 “the rush of speed with full control”（又快，又完全可控），这里的“可控”指的是知道谁改了什么。每种颜色旁边都有名字，不会只靠颜色区分。'),
    claim: L('People can point at everything the agent changed without asking.', '不用问别人，就能指出 agent 改过的所有地方。')},
  {id: 'frames', mini: 'frames', title: L('Showing agent progress on the canvas', '在画布上显示 agent 的进度'),
    body: L('Each agent takes a region, marks it with a dashed frame while it works out what to build, then builds it under a scan line. The progress appears on the canvas itself, so you can see where work is happening, follow one region and leave the others.',
      '每个 agent 认领一块区域，想怎么做的时候用虚线框标出来，然后在扫描线下把它做出来。进度直接显示在画布上，能看到哪里正在做，也可以只盯一块，别的先不管。'),
    claim: L('People catch an agent’s wrong turn sooner in a frame on the canvas than in a chat log.', '在画布的框里，比在聊天记录里更早发现 agent 走错了方向。')},
  {id: 'team', mini: 'team', title: L('Comments and notes stay with the work', '评论和便签留在对应的位置'),
    body: L('Comments are pinned to the part they are about, and the agent replies in the same thread, so a request and its result are in one place. Notes are ticked off by the person who wrote them. The agent can report that it is done, and only the author ticks the note.',
      '评论钉在它说的那一部分上，agent 在同一个讨论串里回复，请求和结果就放在一处。便签由写它的人勾掉。agent 可以说自己做完了，但只有作者能勾。'),
    claim: L('Requests left on the canvas get resolved without a meeting.', '留在画布上的请求，不用开会就能解决。')},
  {id: 'code', mini: 'code', title: L('Canvas layers are production code', '画布上的图层就是生产代码'),
    body: L('Every layer is production-ready, so selecting a bar writes a prop. There is no handoff step in which the design can lose its meaning on the way to code. In my Ready for agents case I measured that loss from the other side, with coding agents building from Figma files. Here it is only a premise of a fictional product.',
      '每一层都能直接用在生产环境，所以选中一根柱子就会写出一个属性。从设计到代码中间没有交接，含义也就不会在交接时丢失。我在 Ready for agents 案例里从另一头测过这种丢失（让 coding agent 照着 Figma 文件写代码）。在这里，它只是一个虚构产品的设计前提。'),
    claim: L('Edits made on the canvas arrive in the code unchanged.', '在画布上做的修改，原样进入代码。')},
  {id: 'ship', mini: 'ship', title: L('Shipping the box you drew', '发布你画的那个框'),
    body: L('The box drawn at the start is the box that ships. It travels a deploy track with Build, Checks and Edge stages, so after pressing Ship you can watch each stage pass.',
      '一开始画的框，就是最后发布的那个盒子。它会走一条部署轨道，上面有 Build、Checks、Edge 三个阶段，按下 Ship 之后能看到每一关通过。'),
    claim: L('Seeing the track lets people trust a one-click ship from a selection.', '能看到部署轨道，大家才会放心从一个选框一键发布。')},
];

export const LIMITS = [
  L('Hako and Daybreak are fictional. They exist only in the film and on this page, and no one has used them.', 'Hako 和 Daybreak 都是虚构的，只存在于这支片子和这一页上，没有人用过。'),
  L('The demo on this page is scripted. The agents reveal UI made in advance, on a timer, and no model runs.', '这一页的演示是预先写好的。agent 按计时揭开提前做好的界面，没有调用任何模型。'),
  L('The film never shows an agent getting something wrong, or two people and an agent editing one region at once. The design has to handle both.', '片子里没有出现 agent 出错，也没有出现两个人和一个 agent 同时改同一块区域。这两种情况设计都得能处理。'),
  L('Three teammate colours are enough for a team of three. A team of thirty would need a different rule; for now the names do that job.', '三种队友颜色够三个人用。三十个人的团队需要别的规则，目前靠名字区分。'),
  L('“The canvas is the code” assumes the agents have a component library and tokens to build with (Daybreak tokens, in the film). That library is the hard part, and it isn’t designed here.', '“画布就是代码”的前提，是 agent 有一套组件库和 token 可用（片子里叫 Daybreak tokens）。难的是这套库，这里没有设计它。'),
  L('Ship goes from a selection to production through Checks, with no human review step.', 'Ship 从选框直接发布到生产环境，中间经过 Checks，没有人工审核。'),
];

export const TESTS = [
  {claim: L('Box versus written description', '框选和文字描述对比'), how: L('Give six designers a half-made board. Half build with a box and a short prompt, half with a written description. Count the re-prompts and the time to the first build each person would keep.', '找六位设计师，给一块做了一半的白板。一半人用框加短提示，另一半写文字描述。记下返工提示的次数，以及每人得到第一版愿意保留的结果用了多久。')},
  {claim: L('Telling who made each change', '分辨每处改动是谁做的'), how: L('After five minutes with one agent and two teammates, ask each person to point at everything the agent changed, and score it against the canvas history.', '一个 agent 和两位队友一起做五分钟，然后请每个人指出 agent 改过的所有地方，和画布的历史记录对照打分。')},
  {claim: L('Frames versus a chat log', '工作框和聊天记录对比'), how: L('Plant one wrong turn in an agent’s build, and compare how soon people catch it with frames on the canvas and with a chat log.', '在 agent 的构建里故意埋一个错误，比较大家在画布的框里和在聊天记录里分别多快发现。')},
  {claim: L('Canvas edits in the code', '画布上的修改是否进入代码'), how: L('After a session of canvas edits, have an engineer review the diff. Did every edit arrive as made, and would they merge it?', '做完一轮画布修改后，请一位工程师看代码 diff：每处修改是不是原样到达，他们愿不愿意合并。')},
  {claim: L('Trust in Ship', '对 Ship 的信任'), how: L('Watch what people check before pressing Ship, with the track and without it.', '观察大家按 Ship 之前会检查什么，有轨道和没轨道各看一次。')},
];

export const RESULTS = [
  [L('Re-prompts, box and description', '返工提示次数：画框 / 描述'), L('— / —', '— / —')],
  [L('Agent edits found, of all made', '找出的 agent 修改 / 全部修改'), L('— of —', '— / —')],
  [L('Wrong turn caught, frames and log', '发现错误用时：工作框 / 聊天记录'), L('— s / — s', '— 秒 / — 秒')],
  [L('Edits arriving unchanged', '原样到达的修改'), L('— of —', '— / —')],
];
