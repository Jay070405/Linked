import {Ev} from '../../CaseKit';
import {L} from '../../i18n';

/* Everything the walk says, in English and Chinese (L(en, zh); components pick one with useCaseLang().t). Facts,
   numbers and labels are the case's own (cases/LastHundredFeetCase.jsx, from cases/d3-last-100-feet/BRIEF.md and
   d3-last-100-feet-prototype/README.md, round 2, Oct 19 2026): the photos are AI-generated illustrative images of a
   fictional complex; the counts on the prototype's screens (38 seconds, 9 couriers, 14 couriers) are illustrative;
   outside evidence is soft and labeled; nothing has been tested with couriers or residents yet. Here the case is
   regrouped along the route: each waypoint carries the beat of the story that happens there. In Chinese a courier
   is 骑手; street names stay in English, as on the plan. The prototype itself is English, so its button names are
   quoted in English. */

export const AI = L('Photos are AI-generated illustrative images, not a real location.', '照片是 AI 生成的示意图，不是真实地点。');
export const A = '/assets/product/last-100-feet/';
export const shot = id => `${A}screens/${id}.webp`;
export const photoSmall = name => `${A}photos/${name}.webp`;
export const photoLarge = name => `/proto/last-100-feet/photos/${name}.webp`;

/** The five waypoints by name (v2/data/l100-route.js WAYPOINTS, in both languages). */
export const WAYPOINT_NAMES = [
  L('Elm St curb', 'Elm St 路边'), L('Elm St gate', 'Elm St 大门'), L('Building 4', '4 号楼'), L('Stairs', '楼梯'), L('Door 214', '214 号门'),
];
export const stepOf = (i, name) => L(`Step ${i + 1} of 5, ${name.en}`, `第 ${i + 1} 步（共 5 步），${name.zh}`);

export const NUMBERS = [
  {value: '10', unit: L('to 15 min', '到 15 分钟'), label: L('Lost per delivery at complexes, by one company’s count', '公寓小区每单多花的时间，据一家公司统计'),
    note: L(<><Ev label="Sourced"/> Beans’ founder. Beans maps complexes for drivers; this is a company claim, not a study.</>,
      <><Ev label="Sourced"/> Beans 创始人的说法。Beans 专门给司机画小区地图；这是公司的说法，不是研究。</>)},
  {value: '40', label: L('States in the coded prototype', '代码原型里的状态'), note: L('Resident and courier, each with its own deep link', '住户端和骑手端，每个状态都有自己的深链接')},
  {value: '90', unit: L('s', '秒'), label: L('Target for a resident to map the way in', '住户标出进门路线的目标用时'),
    note: L(<><Ev label="Hypothesis"/> From the brief. The prototype’s “38 seconds” is illustrative until test day.</>,
      <><Ev label="Hypothesis"/> 来自项目简报。原型里的“38 秒”只是示意，要等测试那天实际计时。</>)},
];

/** One stop per waypoint: the resident's photo there, and what the case says at that point of the walk. */
export const STOPS = [
  {key: 'park', id: 'w3-curb', name: WAYPOINT_NAMES[0], photo: 'curb', card: L('Park by the olive tree, about 40 ft before the gate.', '停在橄榄树旁，大门前约 40 英尺处。'),
    alt: L('Curb on Elm St in front of the pedestrian gate, olive tree on the left, red curb on the right', 'Elm St 上人行大门前的路边，左边是橄榄树，右边是红色路缘')},
  {key: 'gate', id: 'w3-gate', name: WAYPOINT_NAMES[1], photo: 'gate', card: L('Call box on the left post. Pull the gate when it buzzes.', '对讲机在左边门柱上，听到蜂鸣就拉门。'),
    alt: L('Black metal pedestrian gate between stucco walls, call box on the left post', '两段灰泥墙之间的黑色金属人行门，对讲机在左边门柱上')},
  {key: 'building', id: 'w3-courtyard', name: WAYPOINT_NAMES[2], photo: 'courtyard', card: L('Keep right where the path splits. Look for the metal 4 on the wall.', '小路分岔处靠右。找墙上的金属“4”。'),
    alt: L('Courtyard walkway that splits in two, metal number 4 on the building to the right', '庭院里一分为二的步道，右侧楼上挂着金属门牌“4”')},
  {key: 'stairs', id: 'w3-stairs', name: WAYPOINT_NAMES[3], photo: 'stairs', card: L('Take the metal stairs up one floor.', '走金属楼梯上一层。'),
    alt: L('Open metal stairs up to the second floor, next to the number 4 plaque', '通往二楼的开放式金属楼梯，旁边是“4”号牌')},
  {key: 'door', id: 'w3-door', name: WAYPOINT_NAMES[4], photo: 'door', card: L('Keep straight on the walkway. Dark green door, plant on the right.', '沿走廊直走。深绿色的门，右边有盆栽。'),
    alt: L('Dark green door 214 on the second-floor walkway, coir mat, potted plant on the right', '二楼走廊上深绿色的 214 号门，门前有椰棕地垫，右边有盆栽')},
];
/** The prototype's five step cards (v2/data/l100-route.js STEPS) in Chinese, by key; the English is the data's own. */
export const STEP_ZH = {
  park: {title: 'Elm St 停车点', instr: '停在橄榄树旁，大门前约 40 英尺处。', alt: 'Elm St 上人行大门前的路边，左边是橄榄树，右边是红色路缘'},
  gate: {title: 'Elm St 大门', instr: '对讲机在左边门柱上，听到蜂鸣就拉门。', alt: '两段灰泥墙之间的黑色金属人行门，对讲机在左边门柱上'},
  building: {title: '4 号楼', instr: '小路分岔处靠右。找墙上的金属“4”。', alt: '庭院里一分为二的步道，右侧楼上挂着金属门牌“4”'},
  stairs: {title: '上楼梯', instr: '走金属楼梯上一层。', alt: '通往二楼的开放式金属楼梯，旁边是“4”号牌'},
  door: {title: '214 号门', instr: '沿走廊直走。深绿色的门，右边有盆栽。', alt: '二楼走廊上深绿色的 214 号门，门前有椰棕地垫，右边有盆栽'},
};

/** The walk between stops: where it leads and the card a courier reads on the way (the prototype's step cards). */
export const LEG_CARDS = [
  {to: L('the Elm St gate', 'Elm St 大门'), say: STOPS[1].card},
  {to: L('Building 4', '4 号楼'), say: STOPS[2].card},
  {to: L('the stairs', '楼梯'), say: STOPS[3].card},
  {to: L('door 214', '214 号门'), say: STOPS[4].card},
];

// The five choices, each where it happens on the route (formerly "What I chose, and what I tried first").
export const DECISIONS = {
  stop: {title: L('Where to stop isn’t how to get in', '停在哪里，和怎么进门是两回事'), verdict: L('Never suggest a red curb.', '绝不建议停在红色路缘旁。'),
    tried: L('“Park on Elm St” beside a photo with a red curb in it.', '写着“停在 Elm St”，配的照片上却能看到一段红色路缘。'),
    chose: L('A verified, unrestricted stop with the curb rules in words and color. Residents suggest stops; couriers verify them.', '给一个核实过、没有停车限制的停车点，路缘规定用文字和颜色标清楚。停车点由住户提议，骑手来核实。'),
    screen: 'c-step-park', focus: '50% 78%'},
  code: {title: L('The order authorizes; the gate reveals', '权限来自订单，大门只负责显示'), verdict: L('A geofence shouldn’t strand a courier at the right gate.', '骑手明明站在对的大门前，不该被地理围栏挡在外面。'),
    tried: L('Round 1: the code only within 50 m, and with weak GPS, “ask the resident to buzz you in.”', '第一轮：只在 50 米内显示门禁码；GPS 信号弱，就只能“请住户开门”。'),
    chose: L('Hold to show inside 160 ft. “At the gate already?” opens a photo self-check and a reason, logged for the resident.', '160 英尺内长按就能显示。点“已经到大门了？”会打开照片自查，再选一个原因；这些记录会留给住户。'),
    screen: 'c-gate-revealed', focus: '50% 72%'},
  card: {title: L('The photo is the instruction', '照片本身就是指引'), verdict: L('Glance, don’t read: one hand is holding a hot bag.', '扫一眼就够，不用细读：骑手一只手还提着保温袋。'),
    tried: L('A map pin with a typed note, read while walking.', '地图上一个定位点，加一段文字备注，让人边走边读。'),
    chose: L('Photo first, a landmark title, a distance that says what it measures, one sentence and one action in the thumb zone.', '照片放在最前面，标题写地标，距离写明量的是哪一段，一句说明，拇指区只放一个操作。'),
    screen: 'c-step-building', focus: '50% 38%'},
  stale: {title: L('Recovery doesn’t wait for the resident', '纠错不用等住户'), verdict: L('Buildings change; the route has to notice.', '楼一直在变，路线得跟上。'),
    tried: L('A flag that sat until the resident fixed the step.', '反馈一直挂着，要等住户改好那一步。'),
    chose: L('A flag is live for the next courier at once. Two in a week gray the photo, show the detour couriers used, and ask the manager.', '反馈立刻对下一位骑手生效。一周内收到两条，照片就变灰，显示其他骑手绕行的路线，并请物业确认。'),
    screen: 'c-step-stale', focus: '50% 70%'},
  blank: {title: L('Author the minimum, from zero', '从零开始，只填最少的内容'), verdict: L('A route that helps tonight beats a perfect one never finished.', '今晚就能用的路线，胜过永远做不完的完美路线。'),
    tried: L('Round 1: setup began with four of five photos done and the gates already known.', '第一轮：设置一开始，五张照片里已经有四张，大门位置也是现成的。'),
    chose: L('A blank plan from public map data: tap the way in, set access, done. Photos and a stop suggestion are optional.', '从空白平面图开始（用公开地图数据生成）：点出入口，设好通行方式，就好了。照片和停车点建议都可以不填。'),
    screen: 'r-pin-gate', focus: '50% 30%'},
};

// The prototype's steps, resident then courier (formerly the "Two roles, one route" scrolly), placed on the route.
export const BEATS = {
  arrive: {screen: 'c-arrive', label: L('Courier: arrival', '骑手：到达'), title: L('Arrive knowing where to stop and where to walk', '一到就知道停在哪、往哪走'),
    alt: L('Arrival card: stop on Elm St, walk in the front gate; the route drawn on the site plan from the stop to door 214, with curb rules', '到达卡片：停在 Elm St，从正门走进去；平面图上画出从停车点到 214 号门的路线，并标出路缘规定'),
    body: L('The arrival card names a verified stop on Elm St, then the gate, Building 4, the stairs and door 214, drawn on the site plan with the curb rules spelled out. The order stays on every card.',
      '到达卡片先给出 Elm St 上一个核实过的停车点，再依次是大门、4 号楼、楼梯和 214 号门，全都画在平面图上，路缘规定也写得清清楚楚。每张卡片上都带着订单信息。')},
  gate: {screen: 'c-gate-confirm', label: L('Courier: gate', '骑手：大门'), title: L('Get through the gate when GPS is wrong', 'GPS 出错时也能进门'),
    alt: L('Confirm you’re at the Elm St gate: the resident’s gate photo, GPS is weak here, a reason, and Show the code', '确认你在 Elm St 大门：住户拍的大门照片、此处 GPS 信号弱的提示、原因选项，以及显示门禁码的按钮'),
    body: L('The order authorizes the code; being at the gate only reveals it. When GPS can’t place the courier, they compare the resident’s gate photo, pick a reason, and the code opens, logged for the resident.',
      '门禁码的权限来自订单，站到大门前只是让它显示出来。GPS 定位不到骑手时，骑手对照住户拍的大门照片，选一个原因，门禁码就会显示，同时留下一条记录给住户。')},
  card: {screen: 'c-step-building', label: L('Courier: photo cards', '骑手：照片卡片'), title: L('Follow photos, not a pin', '跟着照片走，不跟定位点'),
    alt: L('Step 3 of 5, Building 4: a photo of the courtyard path, 125 ft walk, keep right where the path splits', '第 3 步（共 5 步），4 号楼：庭院小路的照片，步行 125 英尺，分岔处靠右'),
    body: L('Half the screen is the photo, because the photo is the instruction. A landmark, a distance that says what it measures, one sentence, and one action in the thumb zone. Swipe or tap to the next.',
      '照片占半屏，因为照片本身就是指引。下面是地标、距离（写明从哪量到哪）、一句话，拇指区只有一个操作。滑动或点按进入下一步。')},
  off: {screen: 'c-feedback', label: L('Courier: feedback', '骑手：反馈'), title: L('Directions were off? Fix it for the next courier', '路线不对？帮下一位骑手改过来'),
    alt: L('What was off? The five steps as thumbnails with the gate selected, reasons as large chips, and the courier’s own photo attached', '“哪里不对？”：五个步骤的缩略图，大门这一步已选中，原因是大号选项，还附着骑手自己拍的照片'),
    body: L('Three taps: the step, what was wrong, an optional photo. The note is live for the next courier at once. The resident gets the courier’s photo as “Not this gate,” and two flags in a week ask the building manager.',
      '点三下：哪一步、哪里不对、附一张照片（可选）。这条备注立刻对下一位骑手生效。住户会收到骑手拍的照片，标着“不是这个门”；一周内收到两条，就去问物业。')},
  door: {screen: 'c-dropoff-match', label: L('Courier: drop-off', '骑手：送达'), title: L('Check the door; don’t let the app decide', '门牌由你核对，别让 app 决定'),
    alt: L('Check the door: the courier’s photo next to the resident’s door photo, an auto-check hint, and checkboxes the courier ticks', '核对门牌：骑手拍的照片和住户拍的门照片并排，一条自动核对提示，以及由骑手勾选的复选框'),
    body: L('The courier’s photo sits beside the resident’s door photo. The auto-check is a labeled hint and the courier ticks what they see. No photo possible? They complete with where it was left and why.',
      '骑手拍的照片，和住户拍的门口照片并排放。自动核对明确标成“提示”，看到了什么，由骑手自己勾。拍不了照？写明东西放在哪、为什么，照样能完成送达。')},
  wayIn: {screen: 'r-pin-gate', label: L('Resident: way in', '住户：进门路线'), title: L('Mark the way in on a blank plan', '在空白平面图上标出进门的路'),
    alt: L('Where do couriers walk in? A blank site plan from public map data, a pin on the wall, and entrance types: gate with call box, open walkway, lobby door', '“骑手从哪里进来？”：用公开地图数据生成的空白平面图，墙上的一个标记点，以及入口类型：带对讲机的大门、开放步道、大堂门'),
    body: L('The resident starts from public map data: buildings, no gates, no walkways. One tap on the wall where couriers walk in, the kind of entrance, and the unit from the address.',
      '住户从公开地图数据开始：图上只有楼，没有大门，也没有步道。在骑手进来的那段墙上点一下，选好入口类型，门牌号会从地址里自动带出来。')},
  basics: {screen: 'r-basics', label: L('Resident: saved', '住户：已保存'), title: L('Useful before a single photo', '一张照片都没拍，已经能用'),
    alt: L('The basics are saved: the entrance and the code, stored privately; photos, a stop suggestion and privacy settings are optional', '基础信息已保存：入口和门禁码，私密保存；照片、停车点建议和隐私设置都是可选的'),
    body: L('The way in and the gate code are enough to help the next courier; the code is shown only to the courier on the order, at the gate. Photos of each turn are optional. The 38 seconds on screen is illustrative; test day will time it.',
      '有了进门路线和门禁码，就足以帮到下一位骑手。门禁码只显示给接了这一单、已经到大门前的骑手。每个拐角的照片都可以不拍。屏幕上的 38 秒只是示意，测试那天会实际计时。')},
};

const R = `${A}rounds/`;
const R1 = L('Round 1', '第一轮'), R2 = L('Round 2', '第二轮');
export const ROUNDS = [
  {id: 'gps', tab: L('Weak GPS', 'GPS 信号弱'), caption: L('Weak GPS at the gate. Round 1 hid the code and offered “ask Dana to buzz you in”; round 2 lets the courier confirm by hand.', '大门处 GPS 信号弱。第一轮把门禁码藏起来，只给一个“请 Dana 给你开门”；第二轮让骑手手动确认。'),
    before: {src: `${R}gps-r1.webp`, label: R1}, after: {src: `${R}gps-r2.webp`, label: R2}},
  {id: 'stop', tab: L('Where to stop', '停在哪里'), caption: L('Step 1. Round 1 said “Park on Elm St” over a red curb; round 2 names a verified stop and spells out the curb rules.', '第 1 步。第一轮在红色路缘上写着“停在 Elm St”；第二轮给出核实过的停车点，并写清路缘规定。'),
    before: {src: `${R}stop-r1.webp`, label: R1}, after: {src: `${R}stop-r2.webp`, label: R2}},
  {id: 'photos', tab: L('Photo steps', '照片步骤'), caption: L('Resident photos. Round 1 started at four of five done; round 2 starts at zero, and every photo is optional.', '住户照片。第一轮一开始，五张里就已经有四张；第二轮从零开始，每张照片都可以不拍。'),
    before: {src: `${R}photos-r1.webp`, label: R1}, after: {src: `${R}photos-r2.webp`, label: R2}},
  {id: 'dropoff', tab: L('Drop-off', '送达'), caption: L('The drop-off camera. Round 1 laid the resident’s photo over the view; round 2 is a clear camera with the reference as a thumbnail.', '送达时的相机。第一轮把住户的照片叠在取景画面上；第二轮取景干净，参考照片缩成一张缩略图。'),
    before: {src: `${R}dropoff-r1.webp`, label: R1}, after: {src: `${R}dropoff-r2.webp`, label: R2}},
];
// From d3-last-100-feet-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: L('The order authorizes the code and proximity only reveals it; “At the gate already?” opens a photo self-check and a reason.', '门禁码的权限来自订单，靠近只是让它显示；“已经到大门了？”会打开照片自查和原因选择。'),
    why: L('A hard 50 m boundary can strand a courier at the right gate, and GPS is unreliable between buildings.', '50 米的硬边界，可能把站对了门的骑手挡在外面；楼与楼之间，GPS 也靠不住。')},
  {what: L('Call and Message work: a private-number call, one-tap messages, the reply in place.', '打电话和发消息都能用：隐私号通话、一键发送的消息、回复直接显示在原处。'),
    why: L('Contact is the core recovery path, not decoration.', '联系住户是出问题时的主要补救办法，不是摆设。')},
  {what: L('A verified, unrestricted stop with the curb rules on the card, the arrival card and the plan.', '停车点要核实过、没有停车限制；路缘规定写在步骤卡、到达卡和平面图上。'),
    why: L('Implying a red curb is fine to stop at is a safety and ticket problem.', '暗示红色路缘能停车，既不安全，也可能吃罚单。')},
  {what: L('An order chip on every card, with the stacked orders and switching.', '每张卡片上都有订单标签，能看到合并的多个订单并切换。'),
    why: L('In a stacked delivery, “Door 214” alone invites a wrong handoff.', '多单合并配送时，只写“214 号门”很容易交错人。')},
  {what: L('Setup starts from a blank plan, is useful after the way in and the code, and treats photos as optional.', '设置从空白平面图开始，填完进门路线和门禁码就能用，照片是可选的。'),
    why: L('Round 1 measured finishing a prepared route, not creating one.', '第一轮测的是给现成路线收尾，不是从头建一条。')},
  {what: L('A flag is live for the next courier at once; two mark a step unverified and ask the building manager.', '反馈立刻对下一位骑手生效；收到两条，这一步就标成未核实，并去问物业。'),
    why: L('A resident might never respond, and buildings change.', '住户可能一直不回应，楼也会变。')},
];

export const TASKS = [
  {id: 'code', screen: 'c-gate-near', title: L('Show the gate code the way a courier would', '像骑手那样调出门禁码'),
    hint: L('Hold the red button about a second. The code hides after 20 seconds; one tap brings it back.', '按住红色按钮约一秒。门禁码 20 秒后隐藏，点一下就能再显示。')},
  {id: 'walk', screen: 'c-step-park', title: L('Walk from the stop on Elm St to door 214', '从 Elm St 的停车点走到 214 号门'),
    hint: L('Swipe the cards or press Next. The mini map lights the leg you’re on.', '滑动卡片或点 Next。小地图会高亮你正在走的那一段。')},
  {id: 'gps', screen: 'c-gps-weak', title: L('Get through the gate when GPS can’t place you', 'GPS 定位不到你时，照样进门'),
    hint: L('Tap I’m at the gate, compare the photo, pick a reason, then show the code.', '点 I’m at the gate，对照照片，选一个原因，再显示门禁码。')},
  {id: 'resident', screen: 'r-pin-gate', title: L('As the resident, mark the way in on a blank plan', '以住户身份，在空白平面图上标出进门路线'),
    hint: L('Tap the wall where couriers walk in; the pin snaps to it and Next unlocks.', '点骑手进来的那段墙，标记会吸附上去，Next 按钮随之可用。')},
];
