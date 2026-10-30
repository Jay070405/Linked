// The three product launch films on Other Project, one page each (FilmCase.jsx). Times are seconds of the site's
// own files (public/video/*-film.mp4, 60 fps, silent): cuts from each film's pacing remap in aigc-vibecoding/
// product-films, confirmed frame by frame; motion is measured from the same files (films/<slug>.json).
import variablesForAgents from './films/variables-for-agents.json';
import lastHundredFeet from './films/last-100-feet.json';
import commonGround from './films/common-ground.json';

const research={
 en:'So I studied nine app launch films from Apple, Notion, Figma, Linear, Raycast and The Browser Company, one frame a second. They crop a single component until it fills the frame, give each line a shot of its own, keep every shot moving, and give each film a colour world. Every film was rebuilt that way, motion first.',
 zh:'于是我把 Apple、Notion、Figma、Linear、Raycast 和 The Browser Company 的九支 App 宣传片按每秒一帧铺开来看。它们把一个组件裁到占满画面，一句话给一个镜头，镜头里一直在动，每支片子有自己的颜色世界。三支片子都按这个思路、以动效为先重做了一遍。',
};

export const FILMS={
 'variables-for-agents':{
  name:'Variables for agents',file:'variables-for-agents.mp4',stem:'d1-ready-for-agents',caseSlug:'ready-for-agents',accent:'#3d8bff',duration:29.4,
  caseName:{en:'The Ready for agents case',zh:'Ready for agents 案例'},
  tagline:['Hand off the design system,','not just the picture.'],
  intro:{
   en:'Variables for agents is the design half of my Ready for agents case: a lens on Figma’s Check designs that binds the values you choose in one step, undoes in one, and tells the coding agent about the rest. The film follows one file from twelve unbound values to bound variables, then the agent asking instead of inventing names, and the measurement behind it. As its lockup says, it is a concept, not affiliated with Figma, measured across 37 builds with one model family and one small design system, and not yet tested with designers.',
   zh:'Variables for agents 是我 Ready for agents 案例里设计的那一半：在 Figma 的 Check designs 里加一个视图，你选中的值一步绑定、一步撤销，剩下的告诉 coding agent。片子跟着一个文件走：从 12 个未绑定的值到绑定好的 variables，再到 agent 不自己编名字、而是开口问，最后是背后的测量结果。片尾写明：这是一个概念，与 Figma 没有隶属关系；数据来自 37 次构建，只用了一个模型系列和一个小型设计系统；还没有找设计师测试过。',
  },
  cuts:[20.4,24,27.4],
  beats:[
   {to:1.85,name:'Stream',what:{en:'Lanes of hex values and pixel sizes stream past: “Coding agents copy what they see.”',zh:'一排排色值和像素尺寸流过画面：“Coding agents copy what they see.”'},camera:{en:'Locked off; six lanes at different speeds and three blur levels give the depth',zh:'机位不动；六排数值速度不同、虚化分三档，拉出纵深'}},
   {to:4.45,name:'Names',what:{en:'The lanes brake, five values are pulled out, and each scrambles into a name an agent made up: bgLight, darkText, grey600, greenPrimary, cardBg2.',zh:'数值流刹住，五个值被拽出来，各自乱码变成 agent 编出来的名字：bgLight、darkText、grey600、greenPrimary、cardBg2。'},camera:{en:'A slow 10% push in, ending as the names collapse to the centre',zh:'缓慢推近 10%，最后名字收拢到画面中央'}},
   {to:6.95,name:'Title',what:{en:'The icon springs up where the names vanished, and the name rises over faint lanes of values: “A lens for handing design files to coding agents.”',zh:'名字消失的地方弹出图标，片名在淡淡的数值流上升起：“A lens for handing design files to coding agents.”'},camera:{en:'Keeps pushing in, then the card rushes past the lens',zh:'一直往前推，最后整张标题卡冲过镜头'}},
   {to:10.25,name:'Unbound',what:{en:'The design file flies up on a tilted plane and a giant 12 rolls up beside the Variables row: “12 unbound values”.',zh:'设计文件在倾斜的平面上飞入，Variables 那一行旁边滚出一个巨大的 12：“12 unbound values”。'},camera:{en:'The window flies in from below, then one spline move pushes onto the panel row',zh:'窗口从下方飞入，再沿一条样条曲线推到面板那一行'}},
   {to:12.35,name:'Guess',what:{en:'A scan line runs down the canvas and tags each unbound layer with its value and what it might be.',zh:'一道扫描线扫过画布，给每个未绑定的图层贴上标签：它的值，以及它可能是什么。'},camera:{en:'Swings left from the panel to the canvas, still tilted',zh:'从面板横摇到左边的画布，保持倾斜'}},
   {to:17.85,name:'Choose',what:{en:'Check designs opens with the lens; a #F7F7F5 chip scrambles into color/background, and a diagonal wipe turns the file dark to show each variable’s light and dark values.',zh:'Check designs 打开并切到这个视图；一个 #F7F7F5 芯片乱码变成 color/background，一道斜向擦除把文件切到深色，每个 variable 的浅色值和深色值都看得到。'},camera:{en:'Glides over Check designs, slides to the picker, then a slow push in',zh:'滑过 Check designs，横移到选择器，然后缓慢推近'}},
   {to:20.4,name:'Bind',what:{en:'“Bound 9 values on 29 layers · Undo”. Nine raw values flip into their token names on one frame and arc down into the canvas.',zh:'“Bound 9 values on 29 layers · Undo”。九个原始值在同一帧翻成各自的 token 名，划着弧线落进画布。'},camera:{en:'A fast pull back to the whole window, still drifting on the cut',zh:'快速拉远到整个窗口，到剪辑点时仍在漂移'}},
   {to:24,name:'Agent',what:{en:'The agent reads the frame, lists the three unbound values, and asks: “Which variable should #FFFFFF use as frame fill?”',zh:'agent 读取 frame，列出 3 个未绑定的值，然后发问：“Which variable should #FFFFFF use as frame fill?”'},camera:{en:'Hard cut, then a slow push down a tilted, scrolling terminal',zh:'硬切，然后沿着倾斜、滚动的终端缓慢推近'}},
   {to:27.4,name:'Result',what:{en:'Two rings fill: 100% of token changes followed with variables bound (9 of 9 builds), 50% with hex values (median build). 37 dots, one per build.',zh:'两个圆环填满：绑定 variables 时 token 改动 100% 跟上（9 次构建全部做到），只有 hex 值时中位数是 50%。37 个圆点，一个代表一次构建。'},camera:{en:'Hard cut; the pair turns from 6° to −6° while it pushes in',zh:'硬切；两个圆环从 6° 转到 −6°，同时推近'}},
   {to:29.4,name:'Lockup',what:{en:'Icon, name and the end line, then “A product concept by Jay Lin” and the case’s fine print.',zh:'图标、名字和收尾的那句话，然后是 “A product concept by Jay Lin” 和案例的说明小字。'},camera:{en:'Hard cut, then a slow push that never stops',zh:'硬切，然后缓慢推近，一直没有停'}},
  ],
  headlines:[[.3,1.9,'Coding agents copy what they see.'],[3.03,4.1,'But they invent the names.'],[4.45,6.95,'Variables for agents'],[7.9,10.25,'See what an agent can’t read.'],[10.25,12.6,'Every value it would guess at.'],[12.6,15.7,'Choose the variable each value should use.'],[15.7,18.15,'Light and dark, side by side.'],[18.15,20.25,'Bind them in one step. Undo in one.'],[20.75,24,'The agent builds with your names, and asks about the rest.'],[25.6,27.4,'Measured across 37 builds.'],[27.7,29.4,'Hand off the design system, not just the picture.']],
  firstCutText:{
   en:`The first cut ran 37 s on light grey: measured one frame a second, 11 seconds looked almost the same as the second before, there were only 6 big changes, and it ended on a 5-second still card. ${research.en}`,
   zh:`第一版 37 秒，浅灰底：按每秒一帧测量，有 11 秒和前一秒几乎一样，大变化只有 6 次，最后停在一张 5 秒不动的结尾卡上。${research.zh}`,
  },
  firstCut:[
   {final:3.6,caption:{en:'“But they invent the names.” The first cut listed five invented names in red on light grey. The final pulls five chips out of a stream of values and scrambles each one into its name.',zh:'“But they invent the names.” 第一版在浅灰底上列出五个编出来的名字，标成红色；终版从一串流动的数值里拽出五个芯片，逐个乱码变成名字。'}},
   {final:8.9,caption:{en:'Twelve unbound values. The first cut set a caption beside the whole window and outlined the row; the final pushes into the panel row and rolls up a giant 12 beside it.',zh:'12 个未绑定的值。第一版把说明文字放在整个窗口旁边，再给那一行描边；终版直接推到面板那一行，旁边滚出一个巨大的 12。'}},
  ],
  signatureText:{
   en:'Each film acts out its key line once. Here it is “But they invent the names.”: five values come out of the stream the agent sees and scramble into names it made up, in red, before they collapse into the product’s icon. Later in the film the file’s real token names are blue. Click a frame to play from there.',
   zh:'每支片子都要把它最关键的那句话演出来一次。这支是 “But they invent the names.”：五个值从 agent 看到的数值流里被拽出来，乱码变成它自己编的名字，标成红色，然后收拢成产品的图标。片子后面，文件里真正的 token 名都是蓝色。点击画面可以从那里开始播放。',
  },
  signature:[
   {t:1.6,label:{en:'Hex values stream past: what the agent sees',zh:'色值流过：这就是 agent 看到的'}},
   {t:2.2,label:{en:'The lanes brake; five values are pulled out',zh:'数值流刹住，五个值被拽出来'}},
   {t:3.2,label:{en:'Each scrambles, left to right, into a name',zh:'每个值从左到右乱码成一个名字'}},
   {t:3.6,label:{en:'All five renamed, in red',zh:'五个全部改名，标成红色'}},
   {t:4.4,label:{en:'The invented names collapse to the centre',zh:'编出来的名字收拢到中央'}},
   {t:4.6,label:{en:'The icon springs up; the name rises',zh:'图标弹出，片名升起'}},
  ],
  smoothText:{
   en:'This film is nearly one take: for its first 20.4 seconds there is no cut. From 6.9 s the camera follows one monotone spline through 12 framings of the file, so it never stops between them and never overshoots; the screens swap inside the moving window. The nine token chips arc into the canvas on a 16-sample shutter, so each name fades before its chip picks up speed, which keeps the text from smearing. Slow drifts are placed by transform, and the film runs at 60 fps.',
   zh:'这支片子几乎是一个长镜头：前 20.4 秒没有一个剪辑点。从 6.9 秒起，镜头沿着一条单调的样条曲线经过文件的 12 个构图，中间不停、也不冲过头；界面在运动的窗口里切换。九个 token 芯片划着弧线落进画布时用的是 16 次采样的快门，所以每个名字在芯片加速之前就淡掉，文字不会拖影。慢速漂移用 transform 定位，全片 60 帧。',
  },
  scores:[68,73,75,79,82,85],
  notes:[
   {note:{en:'Each headline sat on a band of the room’s dark that faded down over the window and hid the interface under it.',zh:'每条标题下面垫着一条暗带，从上往下渐隐着盖在窗口上，把下面的界面也挡住了。'},fix:{en:'A dark plate only as big as the words, so the interface around them stays in view.',zh:'换成一块只和文字一样大的深色底板，周围的界面都露在外面。'}},
   {note:{en:'The nine token chips arcing into the canvas left smeared trails of text.',zh:'九个 token 芯片划着弧线飞进画布时，文字拖出了残影。'},fix:{en:'Each name fades out as its chip starts to fly, before it picks up speed, so only the blank pills arc down.',zh:'每个芯片刚起飞、还没加速时名字就淡掉，落进画布的只剩空白的胶囊。'}},
   {note:{en:'The title card was too still.',zh:'标题卡太静了。'},fix:{en:'The name now rises over drifting lanes of values, keeps pushing in the whole time, and leaves by rushing past the lens.',zh:'片名现在浮在缓缓漂移的数值流上，一直往前推，最后冲过镜头离场。'}},
  ],
  ...variablesForAgents,
 },
 'last-100-feet':{
  name:'Last 100 Feet',file:'last-hundred-feet.mp4',stem:'d3-last-100-feet',caseSlug:'last-100-feet',accent:'#e3241b',duration:29.2,
  caseName:{en:'The Last 100 Feet case',zh:'Last 100 Feet 案例'},
  tagline:['Curb to door.','No phone call.'],
  intro:{
   en:'Last 100 Feet is my two-sided concept for apartment deliveries: a resident maps the way from the curb to their door once, and every courier after them follows it photo by photo, without calling. The film follows one order from the wrong pin at the garage, through the gate code, to door 214, using the prototype’s own screens, route and numbers. Its closing card states the limits: an independent concept, not affiliated with any delivery company, not yet tested with couriers or residents; the address is fictional and the photos are AI-generated illustrations.',
   zh:'Last 100 Feet 是我做的一个公寓配送双边概念：住户把从路边到家门口的路标一次，之后每位骑手都照着照片一步步走到门口，不用打电话。片子跟着一单走完全程：从落在车库的错误定位点，到门禁码，再到 214 号门，用的都是原型自己的界面、路线和数字。结尾卡写明了边界：独立概念作品，与任何配送公司无关，还没找骑手或住户测试过；地址是虚构的，照片是 AI 生成的示意图。',
  },
  cuts:[13,15.45,17,23,26.4],
  beats:[
   {to:1.733,name:'Pin',what:{en:'A map pin slams down on the garage: “The map says you’re here.”',zh:'地图定位点砸在车库上：“The map says you’re here.”'},camera:{en:'Top-down on the site plan, pushing in and tipping 12°',zh:'俯视小区平面图，一边推近一边倾斜 12°'}},
   {to:3.25,name:'Leap',what:{en:'The pin leaps across the complex to door 214 and turns red: “The door says otherwise.”',zh:'定位点跨过整个小区跳到 214 号门，变成红色：“The door says otherwise.”'},camera:{en:'A whip-pan that travels with the pin, then a slow push on the door',zh:'跟着定位点甩镜头，再慢慢推向门口'}},
   {to:6.5,name:'Route',what:{en:'The plan tilts into 3D and the red route draws itself from the Elm St stop to 214; the icon and the name come in.',zh:'平面图倾斜成 3D，红色路线从 Elm St 停车点一路画到 214；接着出现图标和片名。'},camera:{en:'Tilts the plan to 40° while pulling back, then keeps turning under the title',zh:'把平面图压到 40° 的同时拉远，片名出现时继续转动'}},
   {to:10.4,name:'Resident',what:{en:'On the resident’s phone: a tap on the wall where couriers walk in, “Gate with call box”, saved in the prototype’s illustrative 38 seconds.',zh:'住户的手机上：在骑手进来的那段墙上点一下，选 “Gate with call box”，就存好了；38 秒是原型里的示意数字。'},camera:{en:'The phone glides in over the softened plan, grows, then flies out to the left',zh:'手机滑进来压在虚化的平面图上，慢慢变大，再向左飞出'}},
   {to:13,name:'Curb',what:{en:'The courier parks on Elm St; the first photo signposts stand up on the plan and the feet from the curb start counting.',zh:'骑手停在 Elm St；第一批照片路牌在平面图上立起来，离路边的英尺数开始计数。'},camera:{en:'A dive from the overview into a steep follow cam that turns the map with the courier',zh:'从全景俯冲下去，变成大倾角跟拍，地图随骑手转动'}},
   {to:17,name:'Gate',what:{en:'The code 4721 flips in on split-flap tiles over the gate photo, only for the courier on this order. Weak GPS? A photo check opens it.',zh:'门禁码 4721 用翻牌一位位翻出来，压在大门照片上，只给接了这一单的骑手看。GPS 信号弱？对照照片确认后照样打开。'},camera:{en:'Lands from a fast push and keeps drifting in',zh:'从一个快推落定，持续缓推'}},
   {to:20.2,name:'Walk',what:{en:'One walk with no stops: Building 4, the north stairs, door 214. Each photo stands up as the courier reaches it, while the count runs toward 290 ft.',zh:'一口气走完，中间不停：4 号楼、北侧楼梯、214 号门。骑手走到哪，那张照片就在哪立起来，英尺数一路往 290 跑。'},camera:{en:'One continuous follow; the map turns at every corner',zh:'一个连续的跟拍镜头，每个拐角地图都跟着转'}},
   {to:23,name:'Delivered',what:{en:'The phone puts the courier’s photo beside the resident’s to check the door, and “✓ Delivered to 214” pops up.',zh:'手机把骑手拍的照片和住户拍的门照片并排核对，随后弹出 “✓ Delivered to 214”。'},camera:{en:'Eases into a slow orbit around the door',zh:'缓缓转成绕着门口的慢速环绕'}},
   {to:26.4,name:'Overview',what:{en:'The whole route from above with all five photos standing on it: 290 ft, five photos.',zh:'整条路线的俯瞰，五张照片都立在上面：290 英尺，五张照片。'},camera:{en:'One steady turn across the shot, from −22° to 18°',zh:'整个镜头匀速转动，从 −22° 转到 18°'}},
   {to:29.2,name:'Lockup',what:{en:'The route alone, drawn huge, folds into the app icon, then the name and “A product concept by Jay Lin”.',zh:'单独一条路线画得很大，折进 app 图标，然后是片名和 “A product concept by Jay Lin”。'},camera:{en:'Flat, pushing in until the fade',zh:'平面构图，一直推近，直到淡出'}},
  ],
  headlines:[[.49,2.04,'The map says you’re here.'],[2.04,3.42,'The door says otherwise.'],[4.5,6.77,'Last 100 Feet'],[6.77,9.02,'Residents mark it once.'],[9.02,10.3,'Saved in 38 seconds.'],[11.38,12.27,'Park on Elm St.'],[12.27,13,'Walk in at the gate.'],[13.3,15.43,'The code shows up at the gate.'],[15.43,16.81,'Weak GPS? A photo opens it.'],[17,19.56,'Building 4, up the north stairs.'],[19.56,21.13,'Door 214.'],[21.13,22.95,'Delivered.'],[23,26.4,'Curb to door. No phone call.'],[27.19,29.2,'Mapped once by the resident. Followed by every courier.']],
  firstCutText:{
   en:`The first cut ran 38 s: measured one frame a second, 9 seconds looked almost the same as the second before, and it ended on a still card that held for 7 seconds. ${research.en}`,
   zh:`第一版 38 秒：按每秒一帧测量，有 9 秒和前一秒几乎一样，结尾是一张停了 7 秒的静止卡。${research.zh}`,
  },
  firstCut:[
   {final:15,caption:{en:'The gate code. The first cut said it in a caption beside a whole phone; the final shows the code itself, 4721 on split-flap tiles over the resident’s gate photo.',zh:'门禁码。第一版用一行字幕加一整台手机来讲；终版直接给出门禁码本身：4721 以翻牌的形式压在住户拍的大门照片上。'}},
   {final:24.5,caption:{en:'“Curb to door. No phone call.” The first cut moved a dot up a flat, top-down plan; the final shows the whole route on a tilted plan with all five photos standing on it, 290 ft.',zh:'“Curb to door. No phone call.” 第一版是一个点在平铺的俯视图上往上走；终版是倾斜平面上的整条路线，五张照片都立在上面，290 英尺。'}},
  ],
  signatureText:{
   en:'Each film acts out its key line once. Here it is “The door says otherwise.”: the pin that map apps drop on the garage lifts off, turns red at the top of its arc and lands on door 214 in 0.54 s, while the camera whips along with it. The name points at the stretch from the curb to the door, not at a measurement: this route runs 290 ft. Click a frame to play from there.',
   zh:'每支片子都要把它最关键的那句话演出来一次。这支是 “The door says otherwise.”：地图 app 落在车库的定位点飞起来，在弧线最高点变红，0.54 秒后落在 214 号门上，镜头跟着它一起甩过去。片名指的是“从路边到门口”这最后一段，不是一个实测距离：这条路线实际是 290 英尺。点击画面可以从那里开始播放。',
  },
  signature:[
   {t:1,label:{en:'Map apps drop the pin on the garage',zh:'地图 app 把定位点放在车库'}},
   {t:1.9,label:{en:'The camera starts to whip; the pin lifts off',zh:'镜头开始甩，定位点离开车库'}},
   {t:2.033,label:{en:'At the top of its arc it turns red',zh:'飞到弧线最高点时变红'}},
   {t:2.1,label:{en:'It drops toward Building 4',zh:'朝 4 号楼落下'}},
   {t:2.3,label:{en:'It lands on door 214',zh:'落在 214 号门上'}},
   {t:2.75,label:{en:'Rings ripple out; the 214 tag pops up',zh:'红色圆环扩散，弹出 214 标签'}},
  ],
  smoothText:{
   en:'The motion-first cut still juddered: cameras eased to a stop at every framing and before every cut, and the courier walked the route in stop-and-go legs. The film was animated on its own 27-second clock and is now re-paced shot by shot to 29.2 s, so speed changes only on a cut; cameras keep moving through their keys, the courier walks from the gate to door 214 in one 3.2-second move, slow drifts are placed by transform because Chrome snaps left/top to whole pixels, and the film runs at 60 fps.',
   zh:'以动效为先重做之后，画面还是一卡一卡的：每到一个构图、每到剪辑点前，镜头都会减速停下，骑手也是走一段停一段。片子原本在自己 27 秒的时间线上做动画，现在按镜头逐个重新定速到 29.2 秒，速度只在剪辑点上变化；镜头经过关键帧时不再停，骑手从大门到 214 号门 3.2 秒一口气走完；慢速漂移用 transform 定位，因为 Chrome 会把 left/top 吸附到整像素；全片 60 帧。',
  },
  scores:[73,78,81,82,84,86],
  notes:[
   {note:{en:'It stuttered: cameras eased to a stop at every framing and before every cut, and the courier walked the route in stop-and-go legs.',zh:'一卡一卡的：每到一个构图、每到剪辑点前，镜头都会减速停下；骑手也是走一段停一段。'},fix:{en:'Each shot plays at its own length between its cuts, cameras keep moving through their keys, and the courier walks from the gate to door 214 in one move.',zh:'每个镜头在两个剪辑点之间按自己的长度播放，镜头经过关键帧时不再停下，骑手从大门到 214 号门一口气走完。'}},
   {note:{en:'The first cut read like a slide deck and ended on a still card that held for 7 seconds.',zh:'第一版像幻灯片，结尾是一张停了 7 秒的静止卡。'},fix:{en:'Rebuilt around one object, the site plan as a 3D ground with the photos standing on it. The closing card lasts 2.8 s and never holds: the route folds into the icon while the frame pushes in.',zh:'整支片子由一个东西串起来：小区平面图变成一块 3D 地面，照片像路牌一样立在上面。结尾卡缩到 2.8 秒，而且一直在动：路线折进图标，画面一路推近。'}},
   {note:{en:'Every film had to act out its key line once. In the first cut the pin stayed on the garage while the camera moved on to door 214 by itself.',zh:'每支片子都要把关键的那句话演一次。第一版里，定位点一直留在车库，只有镜头自己移到了 214 号门。'},fix:{en:'The pin makes the trip itself: it lifts off the garage, turns red at the top of its arc and lands on door 214 as the line changes.',zh:'让定位点自己走这一趟：离开车库，在弧线最高点变红，落在 214 号门上，同时字幕换成下一句。'}},
  ],
  ...lastHundredFeet,
 },
 'common-ground':{
  name:'Common Ground',file:'common-ground.mp4',stem:'d4-choose-not-to-lose',caseSlug:'choose-not-to-lose',accent:'#ef5b67',duration:31.7,
  caseName:{en:'The Choose Not to Lose case',zh:'Choose Not to Lose 案例'},
  tagline:['A health-plan picker','that shows its arithmetic.'],
  intro:{
   en:'Choose Not to Lose is my benefits-enrollment concept: four fictional health plans on one yearly axis, proof of which one costs more for the same coverage, and still the freedom to pick it. The film calls the product Common Ground, the name on the prototype’s own header. Its lockup states the limits: a concept and working prototype, fictional plans, not advice, not yet tested with people; every number on screen is the model’s own arithmetic.',
   zh:'Choose Not to Lose 是我做的员工选保概念：四个虚构的医保方案放在同一条全年费用轴上，证明哪个方案保障一样却更贵，但仍然让你自己选。片子里产品叫 Common Ground，这是原型页头上的名字。结尾写明了边界：这是概念和可用原型，方案是虚构的，不构成建议，还没做用户测试；画面上的每个数字都只是模型自己的算式。',
  },
  cuts:[4,6.4,8.6,11.2,13.1,15,17.1,18.5,21,23.4,25.5,27.6,29.3],
  beats:[
   {to:4,name:'Pills',what:{en:'Four plans drop in as pills with their monthly premiums and sort themselves cheapest first; Plan C gets “★ Lowest premium”. Then the pills stretch into yearly bars.',zh:'四个方案以胶囊的样子落下，带着月保费，自己按价格排好；Plan C 挂上“★ Lowest premium”。随后胶囊拉长成全年费用条。'},camera:{en:'Locked frame on a blue room; the pills arc past each other',zh:'固定机位，蓝色背景；胶囊划着弧线互换位置'}},
   {to:6.4,name:'Trap',what:{en:'The same bars become a yearly chart, and a red ring pulses at the far end of Plan C: “$8,820 worst year”.',zh:'同样四条线变成全年费用图，Plan C 最右端一个红圈在跳：“$8,820 worst year”。'},camera:{en:'Match cut on the bars, then a push toward C’s far end',zh:'在四条线上做匹配剪辑，再推向 C 的最右端'}},
   {to:8.6,name:'Whole year',what:{en:'Each plan’s yearly total at $4,000 of covered bills: $4,160, $4,760, $4,760.',zh:'承保医疗费用为 $4,000 时，每个方案的全年总额：$4,160、$4,760、$4,760。'},camera:{en:'Close on the totals column, a slow push down the rows',zh:'贴近总额那一列，沿着各行慢慢下推'}},
   {to:11.2,name:'Sweep',what:{en:'Covered bills sweep from $0 to $40,000, and a dot on every plan moves with the counter.',zh:'承保医疗费用从 $0 扫到 $40,000，每个方案上的圆点跟着计数器一起移动。'},camera:{en:'Runs sideways with the dots',zh:'跟着圆点横移'}},
   {to:15,name:'$600',what:{en:'The room turns wine-dark. Plan B lines up under Plan A, same coverage, then slides $600 to the right and a +$600 tag pops; the bills sweep again and the gap rides along.',zh:'背景转成酒红色。Plan B 对齐到 Plan A 下方，保障相同；再向右滑出 $600，弹出 +$600 标签；账单再扫一遍，缺口一路跟着走。'},camera:{en:'Close on A and B, then a cut to a camera that follows the gap',zh:'贴近 A 和 B，再切到一个跟着缺口走的镜头'}},
   {to:18.5,name:'Cheapest',what:{en:'“Which plan is cheapest?” “Depends on the year.” The ★ Cheapest badge jumps from Plan C at $300 of bills to Plan A at $4,000.',zh:'“Which plan is cheapest?” “Depends on the year.” 账单 $300 时 ★ Cheapest 在 Plan C，到 $4,000 时跳到 Plan A。'},camera:{en:'The whole table, then a cut close on the cheapest row',zh:'先拍整张表，再切到最便宜那一行的近景'}},
   {to:21,name:'Never',what:{en:'At $40,000 the badge lands on Plan D. “Plan B never is.”: B’s row flashes red and its name is struck through.',zh:'到 $40,000 时标签落在 Plan D。“Plan B never is.”：B 那一行闪红，名字被划掉。'},camera:{en:'Pull back to the whole table',zh:'拉回整张表'}},
   {to:25.5,name:'Screens',what:{en:'The prototype’s own screens: every plan’s whole year on the comparison page, then each plan’s maximum lighting up in its colour.',zh:'原型自己的界面：比较页上每个方案的全年费用，接着每个方案的上限依次亮起各自的颜色。'},camera:{en:'One steady push per screen in a tilted browser window, cut while moving',zh:'每屏一个匀速推镜，浏览器窗口略带倾斜，在运动中切走'}},
   {to:29.3,name:'Choice',what:{en:'Plan B can be saved only after its $600 is confirmed; then “A choice you can explain.” on the confirmation page.',zh:'只有确认过那 $600，Plan B 才能保存；然后是确认页上的 “A choice you can explain.”。'},camera:{en:'The same steady pushes, one per screen',zh:'同样每屏一个匀速推镜'}},
   {to:31.7,name:'Mark',what:{en:'A hard cut onto the four plan lines, huge and in flight; they shrink into the product’s mark, Plan B’s line in red, and the lockup.',zh:'硬切到四条方案线，巨大、还在飞；它们缩成产品的标志，Plan B 那条是红色，然后是结尾署名。'},camera:{en:'Starts 7× close on the mark and pulls back in under a second',zh:'从 7 倍特写开始，不到一秒拉回'}},
  ],
  headlines:[[.15,2.5,'Pick the lowest premium?'],[2.48,3.46,'Look at the whole year.'],[4.06,6.4,'Lowest premium, costliest worst year.'],[6.46,8.33,'Every plan, priced for the whole year.'],[8.67,10.1,'From a quiet year…'],[10.07,11.2,'…to the worst one.'],[11.3,14.84,'Plan B: same coverage as A. $600 more.'],[15.05,16.24,'Which plan is cheapest?'],[16.21,20.18,'Depends on the year.'],[20.14,21,'Plan B never is.'],[21.06,23.4,'See every plan’s whole year.'],[23.48,25.5,'Know the most it can cost.'],[25.57,27.6,'Save Plan B only after the $600.'],[27.68,29.3,'A choice you can explain.'],[29.79,31.7,'Common Ground']],
  firstCutText:{
   en:`Measured one frame a second, 20 of the first cut’s 37 seconds looked almost the same as the second before: the whole chart sat flat on white for most of 4–22 s. ${research.en}`,
   zh:`按每秒一帧测量，第一版 37 秒里有 20 秒和前一秒几乎一样：整张图表平铺在白底上，4 到 22 秒的大部分时间都是这一个构图。${research.zh}`,
  },
  firstCut:[
   {final:7.6,caption:{en:'The same line in both cuts. The first cut kept the whole chart in one framing; the final gives the line a 2.2 s shot of its own, close on the yearly totals.',zh:'两版是同一句话。第一版一直是整张图表一个构图；终版给这句话一个 2.2 秒的单独镜头，贴近全年总额。'}},
   {final:12.2,caption:{en:'The first cut marked the $600 with three thin red brackets on the same wide chart. In the final, B lines up under A, slides $600 to the right, and the gap glows red.',zh:'第一版在同一张大图上用三道细细的红色标注表示 $600。终版里，B 先对齐到 A 下方，再向右滑出 $600，缺口发出红光。'}},
  ],
  signatureText:{
   en:'Each film acts out its key line once. Here it is the $600: Plan B and Plan A have the same deductible, coinsurance and maximum, and B’s premium is $50 a month higher, so at every bill amount B costs $600 more a year. On screen the gap opens and rides along as the bills sweep. Click a frame to play from there.',
   zh:'每支片子都要把它最关键的那句话演出来一次。这支是那 $600：Plan B 和 Plan A 的免赔额、共同保险和上限都一样，B 的保费每月贵 $50，所以不管账单多少，B 每年都多花 $600。画面上，缺口拉开，再随着账单一路扫过去。点击画面可以从那里开始播放。',
  },
  signature:[
   {t:11.3,label:{en:'Close on the plans, still at $40,000 of bills',zh:'切到方案近景，账单停在 $40,000'}},
   {t:11.62,label:{en:'B lines up under A: same coverage',zh:'B 对齐到 A 下方：保障相同'}},
   {t:11.85,label:{en:'B slides right; red opens at both ends',zh:'B 向右滑开，两端露出红色'}},
   {t:12.1,label:{en:'“$600 more.” and the gap gets its tag',zh:'“$600 more.” 落定，缺口挂上标签'}},
   {t:13,label:{en:'The bills sweep again; the gap rides along',zh:'账单再扫一遍，缺口一路跟着'}},
   {t:14,label:{en:'At $40,000: $8,160 against $8,760',zh:'到 $40,000：$8,160 对 $8,760'}},
  ],
  smoothText:{
   en:'The motion-first cut still juddered: cameras eased to a stop at their keys and before cuts, and some shots ended too fast while others dragged. Now every camera keeps a steady speed and is cut while it is still moving, each of the 14 shots has its own length (a remap of the film’s own timeline, so speed changes only on a cut), slow drifts are placed by transform because Chrome snaps left/top to whole pixels, and the film runs at 60 fps.',
   zh:'以动效为先重做之后，画面还是一卡一卡的：镜头在关键帧和剪辑点前减速停住，有的镜头结束得太快，有的又拖得太久。现在每个镜头都匀速运动，在运动中切走；14 个镜头各自定时长（对片子自己的时间线重新映射，所以速度只在剪辑点上变化）；慢速漂移改用 transform 定位，因为 Chrome 会把 left/top 吸附到整像素；全片 60 帧。',
  },
  scores:[58,69,78,82,84,87],
  notes:[
   {note:{en:'One chart stayed on screen for about 15 seconds; 20 of the first cut’s 37 seconds looked almost the same as the second before.',zh:'同一张图表在画面上停了大约 15 秒；第一版 37 秒里有 20 秒和前一秒几乎一样。'},fix:{en:'The chart is cut into eight shots, each framing a different part and still moving when it is cut: C’s far end, the totals, the dots, A and B, the gap, the cheapest row.',zh:'把这张图切成 8 个镜头，每个拍不同的部分，切走时都还在动：C 的最右端、总额、圆点、A 和 B、缺口、最便宜的那一行。'}},
   {note:{en:'A 5-second end card that did not move.',zh:'结尾卡 5 秒一动不动。'},fix:{en:'The end card is 2.4 s and keeps moving: the four lines fly in huge and shrink into the mark.',zh:'结尾卡缩到 2.4 秒，并且一直在动：四条线巨大地飞进来，再缩成标志。'}},
   {note:{en:'The counters came out garbled: motion blur averages 16 samples per frame, and a number that changed between samples printed two values on top of each other.',zh:'计数器的数字是糊的：运动模糊每帧叠 16 个采样，数字在采样之间一变，就会两个数叠在一起。'},fix:{en:'Counters show whole digits, held for the whole frame, so every sample agrees.',zh:'计数器只显示完整的数字，并在整帧内保持不变，每个采样看到的都是同一个数。'}},
  ],
  ...commonGround,
 },
};

export const FILM_ORDER=['variables-for-agents','last-100-feet','common-ground'];
