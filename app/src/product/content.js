// Product case studies: the list, the routes and the words shared by the index, the case pages and /for/*.
// The pages are English only for now; the Chinese site keeps its own systems and art pages.

export const PRODUCT_HOME = '/product';

export const POSITIONING = 'I build products for people who make things.';
export const POSITIONING_LINES = ['I build products for', 'people who make things.'];
export const SUBLINE = 'I’m an illustrator and a business student at Duke Fuqua, and I ship software with AI agents. I’m looking for product roles starting mid-2027.';

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
    page: true,
  },
  {
    slug: 'last-100-feet',
    title: 'Last 100 Feet',
    subtitle: 'A resident maps the way from the curb to their door once; every courier after them follows it without calling',
    kind: 'Service design, two-sided mobile',
    status: 'In progress',
    page: false,
  },
  {
    slug: 'choose-not-to-lose',
    title: 'Choose Not to Lose',
    subtitle: 'A health-plan picker that flags the plan costing more in every scenario, and shows the arithmetic',
    kind: 'Decision support, desktop web',
    status: 'In progress',
    page: false,
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

export function productTitle(page) {
  if (page?.type === 'product-case') return page.item.pageTitle || page.item.title;
  if (page?.type === 'for') return 'For the Figma team';
  if (page?.type === 'product') return 'Product design';
  if (page?.type === 'moved') return 'Moved';
  return 'Page not found';
}

/** The next case that has a page, wrapping around. */
export const nextCase = slug => {
  const i = PUBLISHED_CASES.findIndex(c => c.slug === slug);
  return PUBLISHED_CASES[(i + 1) % PUBLISHED_CASES.length];
};
