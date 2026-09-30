// Words and pictures for the One Stroke homepage, in both languages. Projects, works and the author come from the
// site's own data, so the homepage always names things the way their pages do.
import {systems, allWorks, author, stats} from '../portfolioData';

const work = slug => allWorks.find(w => w.slug === slug);
const T = (zh, en) => ({zh, en});
export const pick = (value, lang) => (value && typeof value === 'object' && 'zh' in value ? value[lang === 'en' ? 'en' : 'zh'] : value);

// the four projects the thread runs past, in the order of the systems data
const PROJECT_EXTRA = {
  roco: {cat: 'SYSTEMS STUDY', tags: ['RESEARCH', 'PROPOSAL', 'PROTOTYPE'], cta: T('查看项目', 'View the project'), tex: '/assets/home/roco.jpg'},
  nexus: {cat: 'UNITY / VIDEO', tags: ['UNITY', 'GAMEPLAY', 'VIDEO'], cta: T('观看演示', 'Watch the demo'), tex: '/assets/home/nexus.jpg', serif: true},
  'league-of-legends': {cat: 'LIVE OPS', tags: ['RESEARCH', 'PROPOSAL'], cta: T('查看项目', 'View the project'), tex: '/assets/home/lol.jpg'},
  'genshin-impact': {cat: 'COMING SOON', tags: ['WISH SYSTEM', T('筹备中', 'IN PROGRESS')], cta: T('即将上线', 'Coming soon'), tex: null,
    desc: T('一个新的系统研究，正在路上。', 'A new systems study is on its way.')},
};
export const PROJECTS = systems.slice(0, 4).map(s => {
  const x = PROJECT_EXTRA[s.id] || {cat: s.kind || 'SYSTEMS', tags: [], cta: T('查看项目', 'View the project'), tex: null};
  return {
    id: s.id, item: s, ready: s.status !== 'coming-soon', cat: x.cat, tags: x.tags, cta: x.cta, tex: x.tex, serif: !!x.serif,
    title: T(s.title, s.titleEn || s.title), sub: T(s.subtitle, s.subtitleEn || s.subtitle),
    desc: x.desc || T(s.description, s.descriptionEn || s.description),
  };
});

// seven pictures in the art worlds; the Garden Cathedral is shown as painting against its Blender rebuild
const ART_SLUGS = ['world-tree', 'sword-immortal', 'background-painting', 'enchanted-forest', 'character-vis-dev', 'cathedral', 'sakura-village'];
export const ART = ART_SLUGS.map(slug => {
  if (slug === 'cathedral') return {slug, cmp: true, item: null, title: T('蓝紫花园教堂', 'Garden Cathedral'), en: 'PAINTING → BLENDER', year: '2026',
    tex: '/assets/home/cathedral-painting.jpg', tex2: '/assets/home/cathedral-3d.jpg'};
  const w = work(slug);
  return {slug, item: w, title: T(w.title, w.titleEn), en: (w.titleEn || '').toUpperCase(), year: w.year, tex: `/assets/home/${slug}.jpg`};
});

// the drafting sheet: who, what, where from
export const ABOUT = {
  label: T('02 / ABOUT — 关于我', '02 / ABOUT'),
  lines: T(['我研究目标、规则与反馈，', '也通过概念设计构建世界。'], ['I study goals, rules and feedback,', 'and build worlds through concept design.']),
  aside: T(['I explore goals, rules and feedback,', 'and build worlds through concept design.'], ['我研究目标、规则与反馈，', '也通过概念设计构建世界。']),
  name: `${author.name} · ${author.nameEn}`,
  role: T(author.role, 'Systems design · Visual worlds'),
  education: [
    {school: 'ArtCenter College of Design', what: T('插画本科（娱乐设计方向），辅修商科', 'BFA Illustration (Entertainment) · Business minor')},
    {school: 'Duke University, Fuqua', what: T('商业管理学硕士在读', 'Master of Management Studies · candidate')},
  ],
  stats: `${stats.archiveWorks} WORKS · ${systems.length} SYSTEMS PROJECTS · 1 LINE`,
  more: T('完整介绍 ↗', 'Full introduction ↗'),
};

// the timeline along the straightened stroke; each card knows where it leads
export const TIMELINE = [
  {x: 700, side: -1, year: '2023', tag: '2023.09 — 2026.05', title: T('ArtCenter College of Design', 'ArtCenter College of Design'), sub: T('插画本科（娱乐设计方向），辅修商科', 'BFA Illustration · Business minor'), w: 470, h: 250, go: 'about'},
  {x: 1400, side: 1, year: '2024', tag: 'VISUAL WORLDS', title: T('视觉世界', 'Visual worlds'), sub: T('场景设计与视觉开发：秘境森林、剑仙', 'Environments & vis dev: Enchanted Forest, Sword Immortal'), img: 'enchanted-forest', w: 380, h: 300, go: 'works'},
  {x: 2080, side: -1, year: '2025', tag: 'ENVIRONMENT', title: T('世界树 · 樱花村', 'World Tree · Sakura Village'), sub: T('可以走进去的幻想世界', 'Imagined worlds you could walk into'), img: 'world-tree', w: 520, h: 300, go: 'art:world-tree'},
  {x: 2760, side: 1, year: 'SYS', tag: 'SYSTEMS DESIGN', title: T('系统研究', 'Systems research'), sub: T('洛克王国：世界 · 英雄联盟 · NEXUS', 'Roco Kingdom · League of Legends · NEXUS'), img: 'roco', w: 400, h: 300, go: 'systems'},
  {x: 3380, side: -1, year: '2026', tag: '2026.05', title: T('ArtCenter 毕业', 'ArtCenter, graduated'), sub: T('插画本科 · 娱乐设计方向', 'BFA Illustration · Entertainment design'), w: 400, h: 220, go: 'about'},
  {x: 3960, side: 1, year: '2026', tag: '2026.07 — 2027.05', title: T('Duke University, Fuqua', 'Duke University, Fuqua'), sub: T('商业管理学硕士在读', 'Master of Management Studies'), w: 440, h: 230, go: 'about'},
  {x: 4560, side: -1, year: 'NOW', tag: 'NOW', title: T('在规则与奇想之间，', 'Between rules and wonder,'), sub: T('继续做世界。', 'still making worlds.'), w: 520, h: 300, now: true, go: 'contact'},
];

export const COPY = {
  headline: 'BETWEEN RULES',
  headSub: T('在规则与奇想之间', 'Somewhere between the rules and the wonder'),
  answer: '& wonder.',
  kvMeta: {name: `${author.name} · ${author.nameEn}`, role: T(author.role, 'Systems design · Visual worlds'), line: 'SYSTEMS DESIGN × VISUAL WORLDS'},
  hud: 'DRAG THE MARK · TOUCH THE WATER',
  timelineHead: T('03 / TIMELINE — 一条线，走到现在', '03 / TIMELINE — one line, all the way to now'),
  worlds: T('04 / VISUAL WORLDS — 想让人走进去的世界', '04 / VISUAL WORLDS — places worth entering'),
  count: stats.archiveWorks,
  browse: T('浏览全部作品 ↗', 'Browse all works ↗'),
  soon: T(['原神', 'COMING SOON · 抽卡系统策划'], ['Genshin Impact', 'COMING SOON · WISH SYSTEMS']),
  marquee: T(['把想法，做成体验。', 'Between rules & wonder.'], ['Ideas, made into experiences.', 'Between rules & wonder.']),
  outro: {
    top: ['05 / CONTACT', "LET'S WORK TOGETHER"],
    lead: T(['有想法、有项目，', '或者只是想聊聊——'], ['An idea, a project,', 'or just a conversation —']),
    letter: 'write me a letter.',
    write: T('写信给我 ↗', 'Write to me ↗'),
    foot: {systems: T('系统策划', 'Systems'), art: T('美术作品', 'Art'), about: T('关于我', 'About'), resume: T('简历 PDF ↗', 'Résumé PDF ↗'), top: T('回到顶部 ↑', 'Back to top ↑')},
  },
  cursor: {
    drag: T('拖动旋转', 'Drag to turn'), soon: T('即将上线', 'Coming soon'), open: T('展开', 'Open'), work: T('查看作品', 'View the work'),
    compare: T('原画 ↔ 模型', 'Painting ↔ Model'), enter: T('进入 →', 'Enter →'), write: T('写信给我 ↗', 'Write to me ↗'), rise: T('继续滚动', 'Keep scrolling'),
  },
  index: ['00 · INDEX', '01 · SYSTEMS', '02 · ABOUT', '03 · TIMELINE', '04 · WORLDS', '05 · CONTACT'],
};

export {author};
