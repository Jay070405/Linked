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

export const PRODUCT_CASES = [
  {
    slug: 'design-to-code',
    title: 'Design-to-code readiness',
    summary: 'What breaks when coding agents build from Figma files, and what Figma could do about it.',
    kind: 'Benchmark and plugin',
    when: 'Oct 2026 – now',
    status: 'In progress',
    proof: {label: 'Hypothesis', text: 'A file can look right and still be built wrong.'},
  },
  {
    slug: 'roco',
    title: 'Reverse-engineering a hidden system from 6,632 logged throws',
    summary: 'Roco Kingdom: World never shows collectors how close they are to the shiny they want. I logged my own play until the rules showed, then redesigned the loop.',
    kind: 'Personal research',
    when: 'Aug – Sep 2026',
    proof: {label: 'Measured', text: '6,632 throws and 499 clover sketches, logged over 10 co-op sessions.'},
  },
  {
    slug: 'where-players-break',
    title: 'Finding where players break',
    summary: 'In three settings, players broke where information arrived late or not at all. That pattern became three League of Legends live-ops proposals, sized and put in order.',
    kind: 'Playtests and live-ops research',
    when: 'Jan 2025 – Sep 2026',
    proof: {label: 'Simulated', text: '20,000 simulated matches set the tiers for a fairer loading screen.'},
  },
];

// Unlisted pages for one reader. Not in the navigation, not indexed.
export const FOR_PAGES = {
  figma: {slug: 'figma', title: 'Hi, Figma team.', first: 'design-to-code'},
};

const clean = pathname => (String(pathname).split(/[?#]/)[0].replace(/\/+$/, '') || '/');

/** The product page a path names, or null. Shared by the homepage router and the standalone product entry. */
export function resolveProductPath(pathname) {
  const path = clean(pathname);
  if (path === PRODUCT_HOME) return {type: 'product'};
  const match = path.match(/^\/product\/([a-z0-9-]+)$/);
  if (match) {
    const item = PRODUCT_CASES.find(c => c.slug === match[1]);
    return item ? {type: 'product-case', item} : null;
  }
  const unlisted = path.match(/^\/for\/([a-z0-9-]+)$/);
  if (unlisted && FOR_PAGES[unlisted[1]]) return {type: 'for', item: FOR_PAGES[unlisted[1]]};
  return null;
}

export function productRouteFor(page) {
  if (page?.type === 'product') return PRODUCT_HOME;
  if (page?.type === 'product-case') return PRODUCT_CASES.some(c => c.slug === page.item?.slug) ? `${PRODUCT_HOME}/${page.item.slug}` : null;
  if (page?.type === 'for') return FOR_PAGES[page.item?.slug] ? `/for/${page.item.slug}` : null;
  return null;
}

/** True for every path the standalone product entry should own (including unknown /product/* paths, which get a 404 view). */
export const isProductPath = pathname => /^\/(product|for)(\/|$)/.test(clean(pathname) + '/');

export function productTitle(page) {
  if (page?.type === 'product-case') return page.item.title;
  if (page?.type === 'for') return 'For the Figma team';
  if (page?.type === 'product') return 'Product work';
  return 'Page not found';
}

export const nextCase = slug => {
  const i = PRODUCT_CASES.findIndex(c => c.slug === slug);
  return PRODUCT_CASES[(i + 1) % PRODUCT_CASES.length];
};
