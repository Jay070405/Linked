// Every word JL-01 says, in the site's two languages. The Chinese was reworked with Gemini (2026-11-18) to stop sounding
// machine-written: nouns and numbers before sentences, nothing over two lines, and Jay's bubbles stay under eight characters.
// Anything set in the Songti (headings, Jay's bubbles, the pointer's label, the dots' caption) has to stay inside the font's subset
// (public/assets/fonts/jl01/subset-chars.txt), or Windows shows a second face in the middle of a line; the mono labels are free.
// What the machine's own screen shows (screen.js) is English in both languages, the way a device's firmware is.
const zh = {
  h1: 'Jay Lin 林世杰 · 游戏策划 / 产品经理',
  roles: '游戏策划　产品经理',
  side: {product: '产品', game: '策划'},
  role: {product: '产品经理', game: '游戏策划', none: '游戏策划 / 产品经理'},
  swap: '换卡带',
  standby: '按任意键开机',
  // Jay's bubbles
  say: {pick: '选一张卡带', scroll: '往下滚 ↓', hello: who => who + '，你好 · 往下滚 ↓', layers: '一共 5 层', log: '翻过来看', score: '都写在简历里', demo: '我先玩 · 空格接管', demoTouch: '我先玩 · 点屏幕接管',
    jump: '跳！', clear: '通关！', choose: '挑一张', printing: '打印中…', printed: '拿着'},
  quips: ['啾', '蓝松鸦，不是鸽子', '别戳', '没做彩蛋', '算了，给你翻一个'],
  // 01 about
  about: {kick: '01 — 关于', for: who => ' · 给 ' + who, title: ['拆开 JL-01，', '里面是林世杰。'],
    lead: {product: '画画 → 念商科 → 用 agent 写软件。', game: '6,632 次投掷记录，54 人周的范围估算，1 个 Unity 原型。', none: '游戏策划 / 产品经理。先选一张卡带。'},
    parts: ['ArtCenter 插画', '目标 · 规则 · 反馈', '5 个可试用的原型', 'Claude Code · Codex', 'Duke Fuqua · 商科'],
    facts: ['在读 · Duke Fuqua MMS', '到岗 · 2027 年中', '洛杉矶']},
  // 02 the changelog on the machine's back (patch notes, for the game cartridge)
  log: {kick: {product: '02 — 更新记录', game: '02 — 版本更新', none: '02 — 更新记录'}, open: '打开 ↗', swap: '← → 换一条'},
  // 03 play
  play: {kick: '03 — 试玩', title: ['怎么赢。怎么玩。', '爽在哪。'], jump: '跳 ␣'},
  // 04 the numbers
  score: {kick: '04 — 数字', hint: '点一下墙'},
  // 05 selected work
  work: {kick: '05 — 精选作品', insert: '插入卡带 ↵', swap: '← → 换一张', eject: '← 退出卡带 · ESC', open: '打开案例 ↗', next: '下一张 →', cover: '精选作品', coverSub: n => 'SELECTED WORK  ·  ' + n + ' CARTRIDGES',
    units: {ROCO: '次投掷记录', LOL: '人周', MAOXIANJIA: 'Unity 原型'}},
  // 06 the last screen and the receipt
  end: {kick: '06 — 联系', title: {product: ['缺 PM？', '小票上有邮箱。'], game: ['缺策划？', '小票上有邮箱。'], none: ['缺策划？缺 PM？', '小票上有邮箱。']}},
  rec: {place: '林世杰 · 洛杉矶', guest: '访客', role: '方向', play: '试玩', seen: '看过', time: '用时', items: '经历', avail: '到岗', when: '2027 年中', resume: '简历 PDF', mail: '发邮件', copy: '复制', copied: '已复制', all: '全部案例', again: '再玩一次 ↺'},
  rail: ['开机', '关于', '记录', '试玩', '数字', '作品', '联系'],
  // the dots that cover the page say where you are going
  wipe: {top: '开机', about: '关于', log: '更新记录', play: '试玩', score: '数字', work: '精选作品', contact: '联系', game: '游戏策划', product: '产品经理', again: '再玩一次'},
  // the pointer's own label
  tip: {insertGame: '策划 · 插入', insertProduct: '产品 · 插入', insert: '插入 ↵', knob: '滚动来转', swap: '换卡带', key: n => '按 ' + n, poke: '戳一下', log: '看这一项'},
};

const en = {
  h1: 'Jay Lin · Game design / Product',
  roles: 'Game design　Product',
  side: {product: 'Product', game: 'Game'},
  role: {product: 'Product', game: 'Game design', none: 'Game design / Product'},
  swap: 'Swap cart',
  standby: 'Press any key',
  say: {pick: 'Pick a cart', scroll: 'Scroll ↓', hello: who => 'Hi, ' + who + ' · Scroll ↓', layers: '5 layers', log: 'Check the back.', score: 'All on the résumé.', demo: 'Demo · Space to play', demoTouch: 'Demo · Tap to play',
    jump: 'Jump!', clear: 'Clear!', choose: 'Pick one', printing: 'Printing…', printed: 'Take it.'},
  quips: ['Chirp.', 'Blue jay. Not a pigeon.', 'Don’t.', 'No easter egg.', 'Fine. One flip.'],
  about: {kick: '01 — About', for: who => ' · for ' + who, title: ['Pop the hood.', 'Jay Lin inside.'],
    lead: {product: 'Art school → business school → shipping apps with AI agents.', game: '6,632 logged throws. A 54 person-week scope. 1 Unity prototype.', none: 'Game design / product. Pick a cart first.'},
    parts: ['ArtCenter illustration', 'Goals · rules · feedback', '5 prototypes you can try', 'Claude Code · Codex', 'Duke Fuqua · business'],
    facts: ['NOW · Duke Fuqua MMS', 'AVAIL · MID-2027', 'Los Angeles']},
  log: {kick: {product: '02 — Changelog', game: '02 — Patch notes', none: '02 — Changelog'}, open: 'Open ↗', swap: '← → Step'},
  play: {kick: '03 — Play', title: ['How you win. How you play.', 'Why it clicks.'], jump: 'Jump ␣'},
  score: {kick: '04 — Numbers', hint: 'Tap the wall'},
  work: {kick: '05 — Selected work', insert: 'Insert cart ↵', swap: '← → Swap', eject: '← Eject · ESC', open: 'Open case ↗', next: 'Next →', cover: 'SELECTED WORK', coverSub: n => n + ' CARTRIDGES',
    units: {ROCO: 'logged throws', LOL: 'person-weeks', MAOXIANJIA: 'Unity prototype'}},
  end: {kick: '06 — Contact', title: {product: ['Need a PM?', 'Email’s on the receipt.'], game: ['Need a game designer?', 'Email’s on the receipt.'], none: ['Need a designer or a PM?', 'Email’s on the receipt.']}},
  rec: {place: 'Jay Lin · Los Angeles', guest: 'GUEST', role: 'ROLE', play: 'PLAY', seen: 'SEEN', time: 'TIME', items: 'ITEMS', avail: 'AVAIL', when: 'MID-2027', resume: 'Résumé PDF', mail: 'Email', copy: 'Copy', copied: 'Copied', all: 'All work', again: 'Play again ↺'},
  rail: ['Boot', 'About', 'Log', 'Play', 'Score', 'Work', 'Contact'],
  wipe: {top: 'Boot', about: 'About', log: 'Changelog', play: 'Play', score: 'Numbers', work: 'Selected work', contact: 'Contact', game: 'Game design', product: 'Product', again: 'Play again'},
  tip: {insertGame: 'Game · insert', insertProduct: 'Product · insert', insert: 'Insert ↵', knob: 'Scroll to turn', swap: 'Swap cart', key: n => 'Press ' + n, poke: 'Poke', log: 'Read this one'},
};

export const COPY = {zh, en};
// a value from the site's own content is either a plain string or a pair {en, zh}
export const pick = (value, lang) => (value && typeof value === 'object' && 'zh' in value ? value[lang === 'en' ? 'en' : 'zh'] : value);
