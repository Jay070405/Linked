// Product case studies: the list, the routes and the words shared by the index, the case pages and /for/*.
// Chinese: each case may carry a `zh` block (localize() in i18n.jsx lays it over the English); pages switch language once
// they are listed in i18n.jsx TRANSLATED.

export const PRODUCT_HOME = '/product';

export const POSITIONING = 'I build products for people who make things.';
export const POSITIONING_LINES = ['I build products for', 'people who make things.'];
export const SUBLINE = 'I’m an illustrator and a business student at Duke Fuqua, and I ship software with AI agents. I’m looking for product roles starting mid-2027.';
export const POSITIONING_LINES_ZH = ['我为创作者', '做产品。'];
export const SUBLINE_ZH = '我是插画师，也在杜克大学富卡商学院读商科。我和 AI agent 一起写软件，把产品做出来、发上线。现在在找 2027 年年中入职的产品岗位。';

// What each evidence label means across the case studies. A case can narrow a meaning in its own legend.
export const EVIDENCE = ['Measured', 'Sourced', 'Estimated', 'Simulated', 'Hypothesis'];
export const EVIDENCE_MEANING = {
  Measured: 'Counted or recorded by me',
  Sourced: 'From a public source, named',
  Estimated: 'My math, with stated assumptions',
  Simulated: 'Model output, not real players',
  Hypothesis: 'Expected, not yet checked',
};

// The product-design portfolio, in reading order. Cases without a page yet (`page: false`) show on /product as
// in-progress tiles and are skipped by "next case".
export const PRODUCT_CASES = [
  {
    slug: 'ready-for-agents',
    title: 'Ready for agents',
    subtitle: 'What an AI agent can’t recover from a Figma file — and the handoff I designed around it',
    pageTitle: 'Ready for agents',
    summary: 'I measured what coding agents lose when they build from a Figma file (37 builds), then designed a lens on Figma’s Check designs that binds what you choose in one undo and tells the agent the rest.',
    kind: 'Research, then product design',
    when: 'Oct 2026',
    status: 'Testing next',
    proof: {label: 'Measured', text: 'With only variables bound, 9 of 9 builds followed every token change; without them, the median was 50%.'},
    zh: {
      subtitle: 'Figma 文件里有些信息，AI agent 读不出来；我围绕这一点设计了交付方式',
      summary: '我先测了 coding agent 照着 Figma 文件写代码会丢掉什么（37 次构建），再在 Figma 的 Check designs 里设计了一个视图：你选中的值一次绑定，一步就能撤销；剩下的告诉 agent。',
      kind: '先研究，再做产品设计',
      when: '2026 年 10 月',
      status: '即将测试',
      proof: {text: '文件只加了 variables 绑定，9 次构建就全都跟上了每次 token 改动；不加，中位数只有 50%。'},
    },
    // The review state of the prototype (round 2), cropped to the canvas, Check designs and the properties panel.
    thumb: {src: '/assets/product/ready-for-agents/tile.webp', width: 1280, height: 830},
    page: true,
  },
  {
    slug: 'atelier',
    title: 'Atelier',
    subtitle: 'A print studio for illustrators: sell prints of your work without running a store',
    pageTitle: 'Atelier, a print studio for illustrators',
    summary: 'A mobile app that turns a finished illustration into a print people can buy, and won’t let the artist sell a size that will print badly.',
    kind: 'Mobile product design, coded prototype',
    when: 'Oct 2026',
    status: 'Testing next',
    zh: {
      pageTitle: 'Atelier，给插画师的印品工作室',
      subtitle: '给插画师的印品工作室：用不着自己开一家店，也能把画印出来卖',
      summary: '一个手机 app，把画好的插画变成别人能买的印品；印出来会糊的尺寸，不让上架。',
      kind: '移动端产品设计，代码原型',
      when: '2026 年 10 月',
      status: '即将测试',
    },
    page: true,
  },
  {
    slug: 'last-100-feet',
    title: 'Last 100 Feet',
    subtitle: 'A resident maps the way from the curb to their door once; every courier after them follows it without calling',
    pageTitle: 'Last 100 Feet, door routes for apartment deliveries',
    summary: 'A two-sided mobile concept: the resident marks the way in on a blank site plan, and couriers follow photo cards from the stop to the door, with a gate code that still opens when GPS is wrong.',
    kind: 'Service design, two-sided mobile',
    when: 'Oct 2026',
    status: 'Testing next',
    zh: {
      pageTitle: 'Last 100 Feet：公寓配送的入户路线',
      subtitle: '住户把从路边到家门口的路标一次，之后每位骑手都照着走，不用再打电话',
      summary: '一个双边移动端概念。住户在空白的小区平面图上标出进门的路；骑手从停车点出发，跟着照片卡片走到门口。GPS 出错时，门禁码照样能用。',
      kind: '服务设计，双边移动端',
      when: '2026 年 10 月',
      status: '即将测试',
    },
    // The prototype's site plan with the whole route (presentation frame 1).
    thumb: {src: '/assets/product/last-100-feet/plan.webp', width: 808, height: 768},
    page: true,
  },
  {
    slug: 'choose-not-to-lose',
    title: 'Choose Not to Lose',
    subtitle: 'A health-plan picker that prices the whole year and flags the plan costing more for the same coverage, with the arithmetic',
    pageTitle: 'Choose Not to Lose, a health-plan picker',
    summary: 'A benefits-enrollment concept that puts four fictional plans on one yearly axis, proves which plan costs more for the same coverage, and still lets you choose it.',
    kind: 'Decision support, desktop web',
    when: 'Oct 2026',
    status: 'Testing next',
    zh: {
      pageTitle: 'Choose Not to Lose：医保方案选择器',
      subtitle: '医保方案选择器：按全年算总账，标出保障一样却更贵的方案，附上算式',
      summary: '员工选保的概念设计：四个虚构方案放在同一条全年费用轴上，证明哪个方案保障一样却更贵，但仍然让你选它。',
      kind: '决策辅助，桌面网页',
      when: '2026 年 10 月',
      status: '即将测试',
    },
    // The comparison chart of the prototype (round 2); the cost-difference note is lifted in front on the tile.
    thumb: {src: '/assets/product/choose-not-to-lose/tile.webp', width: 2192, height: 1340},
    page: true,
  },
  {
    slug: 'arden',
    title: 'Arden',
    subtitle: 'AI glasses designed as a whole product: glasses first, for the wearer and for the people around them',
    pageTitle: 'Arden, AI glasses that are glasses first',
    summary: 'A titanium pair of AI glasses with a camera, open-ear audio and a small display, designed as glasses first: a capture light that is visible but not loud, an app for the glasses rather than the camera, and Hearing Check-in.',
    kind: 'Hardware and iOS concept',
    when: 'Oct 2026',
    status: 'Testing next',
    zh: {
      pageTitle: 'Arden：先是一副眼镜的 AI 眼镜',
      subtitle: '当成一个完整产品来设计的 AI 眼镜：对佩戴者和身边的人来说，它首先是一副眼镜',
      summary: '一副钛金属 AI 眼镜，有摄像头、开放式音频和一块小显示屏，先按眼镜来设计：拍摄指示灯看得见但不刺眼，app 为眼镜服务而不是为摄像头服务，还有 Hearing Check-in。',
      kind: '硬件与 iOS 概念设计',
      when: '2026 年 10 月',
      status: '即将测试',
    },
    // The CMF still in natural titanium (cases/d5-glasses/renders/cmf-natural.png).
    thumb: {src: '/assets/product/arden/still/cmf-natural-800.webp', width: 800, height: 533},
    page: true,
  },
];
export const PUBLISHED_CASES = PRODUCT_CASES.filter(c => c.page);

// Long-form pages that sit behind a case: reachable by address and linked from their case, but not a tile and not in
// the "next case" cycle (their "next" leads back into the cycle).
export const APPENDIX_PAGES = [
  {
    slug: 'design-to-code',
    parent: 'ready-for-agents',
    title: 'Design-to-code readiness',
    // The case page leads with the question.
    pageTitle: 'What an AI agent can’t recover from a Figma file',
    summary: 'What coding agents can and can’t recover from a Figma file, tested on 24 builds.',
    dek: 'I gave coding agents clean and messy versions of the same six screens, 24 builds in all. The messy files produced code that looked just as good. Only variable bindings decided whether that code followed the design system.',
    kind: 'Benchmark, ablation and plugin prototype',
    when: 'Oct 2026',
    proof: {label: 'Measured', text: 'Variable bindings alone took token-change coverage from 50% to 100% (6 of 6 builds).'},
    // Two of the six test screens (S2 pricing, S1 sign-in) in browser and phone frames.
    thumb: {src: '/assets/product/thumb-design-to-code.webp', width: 1080, height: 676},
    page: true,
  },
];
const PAGES = [...PUBLISHED_CASES, ...APPENDIX_PAGES];

// Research cases that moved to Systems. Their old product addresses redirect there (vercel.json, and the routers
// for moves inside the app); /for/* notes still list them, linking to their Systems pages.
export const MOVED = {
  '/product/roco': '/systems/roco',
  '/product/where-players-break': '/systems/league-of-legends',
};
export const SYSTEMS_CASES = [
  {
    slug: 'roco',
    href: '/systems/roco',
    title: 'Reverse-engineering a hidden system from 6,632 logged throws',
    summary: 'Roco Kingdom: World never shows collectors how close they are to the shiny they want. I logged my own play until the rules showed, then redesigned the loop.',
    kind: 'Personal research',
    when: 'Aug – Sep 2026',
    proof: {label: 'Measured', text: '6,632 throws and 499 clover sketches, logged over 10 co-op sessions.'},
    // A crop of the case's own gameplay screenshot (assets/roco/current/s3-4.png), below the in-game banner.
    thumb: {src: '/assets/product/thumb-roco.webp', width: 960, height: 600},
  },
  {
    slug: 'where-players-break',
    href: '/systems/league-of-legends',
    title: 'Finding where players break',
    summary: 'In three settings, players broke where information arrived late or not at all. That pattern became three League of Legends live-ops proposals, sized and put in order.',
    kind: 'Playtests and live-ops research',
    when: 'Jan 2025 – Sep 2026',
    proof: {label: 'Simulated', text: '20,000 simulated matches set the tiers for a fairer loading screen.'},
    // The case's gap-distribution chart, redrawn at card size (charts.jsx, GapThumb).
    thumb: {chart: 'gap'},
  },
];

// Unlisted pages for one reader. Not in the navigation, not indexed.
export const FOR_PAGES = {
  figma: {
    slug: 'figma',
    title: 'For the Figma team',
    order: ['ready-for-agents', 'where-players-break', 'roco'],
    // Source: cases/for-figma.md (the note only).
    note: [
      'Hi, I’m Jay. I trained as an illustrator at ArtCenter, I’m finishing a management degree at Duke Fuqua, and most of what I build now starts as a Figma file that an AI agent turns into code.',
      'That handoff is what I want to work on. This month I tested it: 24 agent builds from clean and messy versions of the same screens. Agents rebuilt messy layouts just fine; what they couldn’t recover was the design system’s names, unless the file carried them as variables. The case study below has the data, the ablation that isolated variables, and where I think Figma could surface that check.',
      'The other two cases come from games, where I spent a lot of time watching where players get stuck, and measuring systems that hide their own rules.',
    ],
    signoff: ['Thanks for reading.', 'Jay'],
  },
};

const clean = pathname => (String(pathname).split(/[?#]/)[0].replace(/\/+$/, '') || '/');

/** Where an old product address lives now, or null. */
export const movedProductPath = pathname => MOVED[clean(pathname)] || null;

/** The product page a path names, or null. Shared by the homepage router and the standalone product entry.
    A moved address resolves to {type: 'moved', to}; each router sends it on to its new home. */
export function resolveProductPath(pathname) {
  const path = clean(pathname);
  if (path === PRODUCT_HOME) return {type: 'product'};
  if (MOVED[path]) return {type: 'moved', to: MOVED[path]};
  const match = path.match(/^\/product\/([a-z0-9-]+)$/);
  if (match) {
    const item = PAGES.find(c => c.slug === match[1]);
    return item ? {type: 'product-case', item} : null;
  }
  const unlisted = path.match(/^\/for\/([a-z0-9-]+)$/);
  if (unlisted && FOR_PAGES[unlisted[1]]) return {type: 'for', item: FOR_PAGES[unlisted[1]]};
  return null;
}

export function productRouteFor(page) {
  if (page?.type === 'product') return PRODUCT_HOME;
  if (page?.type === 'product-case') return PAGES.some(c => c.slug === page.item?.slug) ? `${PRODUCT_HOME}/${page.item.slug}` : null;
  if (page?.type === 'for') return FOR_PAGES[page.item?.slug] ? `/for/${page.item.slug}` : null;
  return null;
}

/** True for every path the standalone product entry should own (including unknown /product/* paths, which get a 404 view). */
export const isProductPath = pathname => /^\/(product|for)(\/|$)/.test(clean(pathname) + '/');

/** The page's title for the browser tab, in the site language (lang 'zh' or 'en'). */
export function productTitle(page, lang = 'en') {
  const zh = lang === 'zh';
  if (page?.type === 'product-case') return (zh && page.item.zh?.pageTitle) || page.item.pageTitle || page.item.title;
  if (page?.type === 'for') return 'For the Figma team';
  if (page?.type === 'product') return zh ? '产品设计' : 'Product design';
  if (page?.type === 'moved') return zh ? '已迁移' : 'Moved';
  return zh ? '页面不存在' : 'Page not found';
}

/** The next case that has a page, wrapping around. */
export const nextCase = slug => {
  const i = PUBLISHED_CASES.findIndex(c => c.slug === slug);
  return PUBLISHED_CASES[(i + 1) % PUBLISHED_CASES.length];
};
