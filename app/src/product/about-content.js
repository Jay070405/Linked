// The same pair shape as i18n's L, defined here so node tests can import this file without JSX.
const L = (en, zh) => ({en, zh});

/* The /about page's words, side by side (study E, approved 2026-10-25). Sources: the English product résumé
   (/assets/docs/jay-lin-resume-en.pdf) and the Chinese systems résumé. Figures the sources disagree on are left out:
   the benchmark build count (24 vs 37) and alt.ctrl's team size and playtest rounds. No phone number or messaging ID. */

export const SIDE_IDS = ['product', 'game'];

const RESUME_EN = '/assets/docs/jay-lin-resume-en.pdf';
const RESUME_ZH = '/assets/docs/jay-lin-systems-resume-zh.pdf';

export const SIDES = {
  product: {
    label: L('PRODUCT SIDE', 'PRODUCT · 产品这一面'),
    word: 'PRODUCT',
    role: L('Product manager', '产品经理'),
    lead: L('Trained illustrator and business student who builds working software with AI coding agents. I work on the products people use to make things.',
      '插画出身，在读商科，用 AI coding agent 把软件真的做出来。我做的是人们用来做东西的产品。'),
    openTo: L('Product roles · mid-2027', '产品岗位 · 2027 年年中'),
    loop: [
      {key: 'GOAL', title: L('A courier reaches the door without calling', '让骑手不用打电话，也能找到门口'), meta: L('Last 100 Feet · service design', 'Last 100 Feet · 服务设计'), href: '/product/last-100-feet'},
      {key: 'RULES', title: L('An artist can’t sell a print size that will print blurry', '让画师上架的每个尺寸，都能印得清楚'), meta: L('Atelier · print studio', 'Atelier · 印品工作室'), href: '/product/atelier'},
      {key: 'FEEDBACK', title: L('Every coding-agent build, on the record', '每一次 coding agent 构建都有记录'), meta: L('Ready for agents · research', 'Ready for agents · 研究'), href: '/product/ready-for-agents'},
    ],
    workNote: L('Every case has a prototype you can try', '每个案例都有可以试用的原型'),
    work: [
      {title: 'Atelier', sub: L('A print studio for illustrators: sell prints without running a store', '给插画师的印品工作室：不用自己开店，也能把画印出来卖'), img: '/assets/about/atelier.webp', fit: 'phone', href: '/product/atelier'},
      {title: 'Last 100 Feet', sub: L('A resident maps the way to the door once; every courier after follows it without calling', '住户把路标一次，之后每位骑手都照着走，不用再打电话'), img: '/assets/about/last-100-feet.webp', href: '/product/last-100-feet'},
      {title: 'Ready for agents', sub: L('What an AI agent can’t read from a Figma file, and the handoff I designed around it', 'Figma 文件里有些信息 AI agent 读不出来，我围绕这一点设计交付方式'), img: '/assets/about/ready-for-agents.webp', href: '/product/ready-for-agents'},
      {title: 'Arden', sub: L('AI glasses designed as a whole product', '当成一个完整产品来设计的 AI 眼镜'), img: '/assets/about/arden.webp', href: '/product/arden'},
      {title: 'Choose Not to Lose', sub: L('A health-plan picker that prices the whole year and flags the plan costing more for the same coverage', '按全年算总账的医保方案选择器，标出保障一样却更贵的方案'), img: '/assets/about/choose-not-to-lose.webp', href: '/product/choose-not-to-lose'},
    ],
    numbers: [
      {value: 6632, suffix: '', what: L('throws logged to map a growth system Roco Kingdom players can’t see', '次投掷记录，拆出洛克王国里玩家看不见的成长系统')},
      {value: 54, suffix: '', what: L('person-weeks: the scope of three League of Legends live-ops changes', '人周：三项英雄联盟长线改动的范围估算')},
      {value: 40, suffix: '+', what: L('open-world environment and prop concept sets · Snail Games', '套开放世界环境与道具概念 · Snail Games')},
      {value: 15, suffix: '+', what: L('Asia and US market-entry analyses · UNISON', '份亚洲与美国市场进入分析 · UNISON')},
    ],
    skills: [
      {group: L('PRODUCT', '产品 · PRODUCT'), items: [L('User interviews and playtesting', '用户访谈与试玩测试'), L('Metric design', '指标设计'), L('Sizing and break-even models', '规模估算与盈亏平衡模型'), L('PRDs', 'PRD'), 'SQL · Excel · Python']},
      {group: L('BUILD', '搭建 · BUILD'), items: [L('Figma (auto layout, variables, components, MCP)', 'Figma（自动布局、变量、组件、MCP）'), 'Claude Code · Cursor · Codex', 'Next.js · Three.js', 'Unity · ComfyUI', L('Built and deployed shijiedesign.com', '自己搭建并上线 shijiedesign.com')]},
      {group: L('CRAFT', '手艺 · CRAFT'), items: ['Adobe Creative Cloud', 'Blender · Maya', 'Procreate']},
    ],
    experience: [
      {date: L('Oct 2026', '2026.10'), org: 'Design-to-Code Readiness', note: L('Figma MCP benchmark and plugin · independent', 'Figma MCP 基准测试与插件 · 独立项目'), href: '/product/design-to-code'},
      {date: L('Sep 2026', '2026.09'), org: L('League of Legends', '英雄联盟'), note: L('Live-ops proposals · three changes, about 54 person-weeks', '长线运营提案 · 三项改动，约 54 人周'), href: '/systems/league-of-legends'},
      {date: L('Aug – Sep 2026', '2026.08–09'), org: L('Roco Kingdom: World', '洛克王国：世界'), note: L('Hidden-progression teardown and redesign · 6,632 logged throws', '隐藏成长系统拆解与重设计 · 6,632 次投掷记录'), href: '/systems/roco'},
      {date: L('Sep – Dec 2025', '2025.09–12'), org: L('alt.ctrl.GDC submission', 'alt.ctrl.GDC 投稿'), note: L('Systems designer · a rhythm game about animal sounds', '系统策划 · 动物声音主题的节奏游戏'), href: '/systems#alt-ctrl'},
      {date: L('May – Aug 2025', '2025.05–08'), org: 'Snail Games USA', note: L('Concept design intern · 40+ open-world environment and prop sets', '概念设计实习 · 40+ 套开放世界环境与道具')},
      {date: L('Jan – Apr 2025', '2025.01–04'), org: 'Riot Games', note: L('2XKO external playtester · isolated two new-player comprehension gaps', '2XKO 外部试玩测试 · 找出两处新手理解断层')},
      {date: L('Jun – Sep 2024', '2024.06–09'), org: 'UNISON H.K. Holdings', note: L('Business intern · 15+ Asia and US market-entry analyses', '商务实习 · 15+ 份亚洲与美国市场进入分析')},
    ],
    resume: {label: L('Product résumé PDF · English', '产品简历 PDF · EN'), href: RESUME_EN},
    allWork: {label: L('All product cases', '全部产品案例'), href: '/product'},
  },
  game: {
    label: L('GAME SYSTEMS SIDE', 'GAME SYSTEMS · 游戏这一面'),
    word: 'SYSTEMS',
    role: L('Game systems designer', '游戏系统策划'),
    lead: L('Game design taught me to think in goals, rules and feedback. Game systems · product · player experience.',
      '做游戏让我习惯用目标、规则和反馈来想问题。游戏系统策划｜产品策划｜玩家体验设计。'),
    openTo: L('Game systems design · mid-2027', '游戏系统策划 · 2027 年年中'),
    loop: [
      {key: 'GOAL', title: L('Reward goals for a live season', '为持续运营的赛季设计奖励目标'), meta: L('League of Legends · systems study', '英雄联盟 · 系统研究'), href: '/systems/league-of-legends'},
      {key: 'RULES', title: L('State and settlement rules, built as a playable prototype', '把状态与结算规则做成能玩的原型'), meta: L('Roco Kingdom: World · systems study', '洛克王国：世界 · 系统研究'), href: '/systems/roco'},
      {key: 'FEEDBACK', title: L('Input and difficulty tuned through playtests', '通过试玩，调整输入方式和难度'), meta: L('GDC alt.ctrl · team project', 'GDC alt.ctrl · 团队项目'), href: '/systems#alt-ctrl'},
    ],
    workNote: L('Systems studies, proposals and Unity prototypes', '系统研究、提案与 Unity 原型'),
    work: [
      {title: L('Roco Kingdom: World', '洛克王国：世界'), sub: L('Shiny systems study · a growth system players can’t see', '异色系统研究 · 拆出一套玩家看不见的成长系统'), img: '/assets/about/roco.webp', href: '/systems/roco'},
      {title: L('League of Legends', '英雄联盟'), sub: L('Live operations · three system proposals', '长线运营 · 三个系统改进提案'), img: '/assets/about/league-of-legends.webp', href: '/systems/league-of-legends'},
      {title: L('Maoxianjia', '毛险家'), sub: L('A pet-finding party game · Unity prototype v0.8 in development', '宠物寻主 · 派对游戏系统设计，Unity 原型 v0.8 开发中'), img: '/assets/about/maoxianjia.webp', href: '/systems/maoxianjia'},
      {title: 'NEXUS', sub: L('Chapter 01 · The Island / Unity showcase', '第一章 · 孤岛 / Unity 作品演示'), img: '/assets/about/nexus.webp', href: '/systems/nexus'},
      {title: L('Genshin Impact', '原神'), sub: L('Wish systems design · coming soon', '抽卡系统策划 · 筹备中'), img: null, href: null},
    ],
    numbers: [
      {value: 3000, suffix: '+', what: L('hours of Genshin Impact, through five major versions of banners and pity', '小时原神，经历 5 个大版本的抽卡与保底节奏')},
      {value: 20, suffix: '+', what: L('major League of Legends patches of balance changes, followed closely', '个英雄联盟大版本的平衡改动，一直在跟')},
      {value: 400, suffix: '+', what: L('hours of Minecraft: redstone automation and multiplayer builds', '小时我的世界，红石自动化与多人建造')},
      {value: 20, suffix: '+', what: L('games across FPS, soulslike, sandbox and party', '款游戏：FPS、魂类、沙盒、派对')},
    ],
    skills: [
      {group: L('ART FOCUS', '美术方向 · ART FOCUS'), items: [L('Character design', '角色设计'), L('Prop design', '道具设计'), L('Environment design', '环境设计'), L('Worldbuilding', '世界观构建'), L('Visual development', '视觉开发')]},
      {group: L('SOFTWARE', '软件 · SOFTWARE'), items: [L('Adobe Creative Cloud · Procreate', 'Adobe 全家桶 · Procreate'), 'Maya · Blender', 'Figma · Git', 'XMind · Draw.io · Axure', 'Excel']},
      {group: '3D / AI', items: [L('3D modeling · rendering', '3D 建模 · 渲染'), 'Photobash', 'Claude Code · Cursor', 'Codex · ComfyUI']},
    ],
    experience: [
      {date: L('Sep – Dec 2025', '2025.09–12'), org: L('alt.ctrl.GDC submission', 'alt.ctrl.GDC 投稿'), note: L('Systems designer · rhythm mechanics built around animal sounds', '系统策划 · 动物声音主题的节奏互动机制'), href: '/systems#alt-ctrl'},
      {date: L('Sep – Dec 2025', '2025.09–12'), org: 'ISOLA: Four Keys Oath', note: L('Original IP · five regions and a main quest line in 14 weeks', '原创 IP · 14 周搭出 5 个区域与冒险主线')},
      {date: L('May – Aug 2025', '2025.05–08'), org: 'Snail Games USA', note: L('Concept design intern · environments and props, built for level readability', '概念设计实习 · 环境与道具，兼顾关卡可读性')},
      {date: L('Jan – Apr 2025', '2025.01–04'), org: 'Riot Games', note: L('2XKO playtesting and experience analysis', '2XKO 玩法测试与体验分析')},
      {date: L('2017 – now', '2017 至今'), org: L('League of Legends', '英雄联盟'), note: L('Following balance changes across 20+ major patches', '跟踪 20+ 个大版本的平衡改动')},
      {date: L('Since 1.6', '1.6 版本起'), org: L('Genshin Impact', '原神'), note: L('3,000+ hours, through five major versions of banners and pity', '累计 3000+ 小时，经历 5 个大版本的抽卡与保底节奏')},
      {date: L('Long-term', '长期'), org: L('Minecraft', '我的世界'), note: L('400+ hours of redstone automation and multiplayer builds', '累计 400+ 小时，红石自动化与多人建造')},
    ],
    resume: {label: L('Systems résumé PDF · Chinese', '系统策划简历 PDF · 中文'), href: RESUME_ZH},
    allWork: {label: L('All systems work', '全部系统策划'), href: '/systems'},
  },
};

export const STATIONS = [
  {n: '01', id: 'loop', en: 'THE LOOP', title: L('The loop', '循环'), note: L('The same loop, two kinds of problems', '同一个循环，两种题目')},
  {n: '02', id: 'work', en: 'WORK', title: L('Work', '作品'), note: 'workNote'},
  {n: '03', id: 'numbers', en: 'BY THE NUMBERS', title: L('Numbers', '数字'), note: L('All on the résumé', '都写在简历里')},
  {n: '04', id: 'skills', en: 'SKILLS', title: L('Skills', '技能')},
  {n: '05', id: 'experience', en: 'EXPERIENCE', title: L('Experience', '经历')},
  {n: '06', id: 'education', en: 'EDUCATION', title: L('Education', '教育')},
  {n: '07', id: 'contact', en: 'CONTACT', title: L('Contact', '联系')},
];

export const EDUCATION = [
  {date: L('Jul 2026 – May 2027', '2026.07 – 2027.05'), school: 'Duke University, Fuqua School of Business', note: L('Master of Management Studies (MMS) · expected May 2027', '商业管理学硕士（MMS）· 预计 2027 年 5 月毕业')},
  {date: L('Sep 2023 – May 2026', '2023.09 – 2026.05'), school: 'ArtCenter College of Design', note: L('BFA Illustration (Entertainment Design), Business Minor · GPA 3.6 · Honors · Merit Scholarship every term', '插画本科（娱乐设计方向），辅修商科 · GPA 3.6 · Honors · 每学期 Merit Scholarship')},
];

export const LANGUAGES = L('English, Mandarin (native)', '中文（母语）· 英文');

export const FACTS = {
  now: {label: 'NOW', text: 'Duke Fuqua · MMS'},
  openTo: {label: 'OPEN TO'},
  based: {label: 'BASED IN', text: L('Los Angeles · English / 中文', '洛杉矶 · 中文 / English')},
};

export const ART = {
  label: L('I ALSO DRAW', '也画画 · ALSO DRAW'),
  more: L('All artwork', '全部画作'),
  href: '/works',
  images: [
    {src: '/assets/about/art-world-tree.webp', alt: L('World Tree', '世界树')},
    {src: '/assets/about/art-sakura-village.webp', alt: L('Sakura Village', '樱花村')},
    {src: '/assets/about/art-enchanted-forest.webp', alt: L('Enchanted Forest', '秘境森林')},
    {src: '/assets/about/art-sword-immortal.webp', alt: L('Sword Immortal', '剑仙')},
    {src: '/assets/about/art-cathedral-painting.webp', alt: L('Cathedral', '大教堂')},
  ],
};

export const COPY = {
  pronouns: 'they/them · 林世杰',
  flipHint: L('Flick the badge to see the other side', '甩一下工牌，看看另一面'),
  eggHint: L('Pull it down, there’s a bit more of me behind it', '往下拉，后面还有一点我'),
  sideSwitch: L('Which side', '看哪一面'),
  sideName: {product: L('Product', '产品'), game: L('Systems', '系统策划')},
  egg: {title: L('final_final_FINAL_v27', 'final_final_真的最终版'), note: L('One last tiny change.', '这次真的不改了。')},
  eggAlt: L('An exhausted grey cat guarding a stack of final-version folders.', '一只疲惫的灰猫守着一叠最终版文件夹。'),
  comingSoon: 'COMING SOON',
};
