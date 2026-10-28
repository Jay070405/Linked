import {createContext, useContext, useMemo} from 'react';

/* Product pages in English and Chinese, following the site's EN/中文 switch (language.js keeps it in localStorage
   as 'jay-lang'). ProductShell (the standalone /product entry) and PortfolioPages (inside the full site) pass the site
   language to ProductRoute, which provides it below. Switching is live, without a reload; ProductShell and App keep
   <html lang> in step.

   On a page:
     import {L, UI, useCaseLang} from '../../i18n';            // the path from your folder
     const {t, zh, htmlLang} = useCaseLang();
     <article lang={htmlLang}> <h2>{t(L('Results', '结果'))}</h2> <button>{t(UI.light)}</button> … </article>
   In data, write any text as L('English', '中文') (that is {en, zh}). t() returns the current language's text, falls
   back to the English, and passes plain strings and React nodes through untouched, so a page can be translated piece
   by piece. A content.js case can carry a `zh: {…}` block; localize(item, lang) merges it.
   UI holds the words every case page shares (theme switch, skip link, plain page, concept notes, the figure viewer).
   Evidence labels stay in English inside <Ev> (CaseKit), with the Chinese meaning as a tooltip.

   A page switches only once its slug is in TRANSLATED: an English page never gets Chinese chrome around it. Add
   your slug when your page is translated. */
export const TRANSLATED = new Set(['product', 'ready-for-agents', 'choose-not-to-lose', 'atelier', 'last-100-feet', 'arden']);

const LangContext = createContext('en');

/** The language a product page renders in: the site's, if the page has been translated; English otherwise. */
export function pageLanguage(page, siteLang) {
  if (siteLang !== 'zh') return 'en';
  if (page?.type === 'about') return 'zh';
  if (page?.type === 'product') return TRANSLATED.has('product') ? 'zh' : 'en';
  if (page?.type === 'product-case') return TRANSLATED.has(page.item?.slug) ? 'zh' : 'en';
  return page ? 'en' : 'zh';     // a missing page is only chrome
}

export function LangProvider({lang, children}) {
  return <LangContext.Provider value={lang === 'zh' ? 'zh' : 'en'}>{children}</LangContext.Provider>;
}

/** A bilingual text. */
export const L = (en, zh) => ({en, zh});

const isPair = v => v && typeof v === 'object' && !Array.isArray(v) && !v.$$typeof && ('en' in v || 'zh' in v);
/** The text of `value` in `lang`: {en, zh} picks one (falling back to English); anything else passes through. */
export function pick(value, lang) {
  if (!isPair(value)) return value;
  return lang === 'zh' ? (value.zh ?? value.en) : (value.en ?? value.zh);
}

/** {lang: 'en' | 'zh', zh: boolean, htmlLang: 'en' | 'zh-CN', t(value)} for the page being rendered. */
export function useCaseLang() {
  const lang = useContext(LangContext);
  return useMemo(() => ({lang, zh: lang === 'zh', htmlLang: lang === 'zh' ? 'zh-CN' : 'en', t: v => pick(v, lang)}), [lang]);
}

/** A content.js item in `lang`: its `zh` block (if any) laid over the English fields. */
export function localize(item, lang) {
  if (!item || lang !== 'zh' || !item.zh) return item;
  return {...item, ...item.zh, proof: item.proof && item.zh.proof ? {...item.proof, ...item.zh.proof} : item.proof};
}

/** Words every case page shares. */
export const UI = {
  light: L('Light', '浅色'),
  dark: L('Dark', '深色'),
  theme: L('Color theme', '颜色主题'),
  skipToContent: L('Skip to content', '跳到正文'),
  readPlain: L('Read as a plain page', '换成简洁版阅读'),
  backToFull: L('Back to the full version', '回到完整版'),
  allWork: L('All product work', '全部产品作品'),
  nextProject: L('Next project', '下一个项目'),
  onThisPage: L('On this page', '本页目录'),
  contents: L('Contents', '目录'),
  view: L('View', '查看'),
  enlarge: L('Enlarge', '放大查看'),
  source: L('Source', '来源'),
  howLabeled: L('How claims are labeled', '结论怎么标注'),
  concept: name => L(`Concept, not affiliated with ${name}`, `概念作品，与 ${name} 官方无关`),
  independent: name => L(`Independent concept. Not affiliated with ${name}.`, `独立概念作品，与 ${name} 官方无关。`),
  opensInNewTab: L(' (opens in a new tab)', '（在新标签页打开）'),
  // the figure viewer (v2/Lightbox)
  figureViewer: L('Figure viewer', '图片查看器'),
  zoomIn: L('Zoom in', '放大'),
  zoomOut: L('Zoom out', '缩小'),
  fitToScreen: L('Fit to screen', '适应屏幕'),
  zoomTo200: L('Zoom to 200%', '放大到 200%'),
  close: L('Close', '关闭'),
  previousFigure: L('Previous figure', '上一张'),
  nextFigure: L('Next figure', '下一张'),
  // the walkthrough videos (v2/Walkthrough)
  watch: L('Watch the videos', '看视频'),
  walkthrough: L('Videos', '视频'),
  whichVideo: L('Which video', '看哪一段'),
  chooseVideo: L('Choose a video to play.', '选一段视频播放。'),
  caseVideo: L('The case', '案例讲解'),
  appVideo: L('The app', '原型演示'),
  filmVideo: L('The film', '宣传片'),
  caseVideoNote: L('The case study, explained', '把整个案例讲一遍'),
  appVideoNote: L('The prototype in use', '原型实际怎么用'),
  filmVideoNote: L('A launch film, no sound', '产品宣传片，无声'),
  halfMin: L('30 s', '30 秒'),
  oneMin: L('1 min', '1 分钟'),
  oneAndHalfMin: L('1.5 min', '1.5 分钟'),
  watchApp: L('Watch the app in use', '看看原型怎么用'),
  appVideoMeta: L('Video, 1.5 min', '视频，1.5 分钟'),
  captionsBurnedIn: L('Captions are burned into the video.', '字幕已经做进视频画面里了。'),
  filmSilent: L('The film has no sound; its words are on screen.', '宣传片没有声音，文字都在画面上。'),
  videoMissing: L('This video isn’t up yet.', '这段视频还没放上来。'),
  watchAppInstead: L('Watch the app instead', '先看原型演示'),
};

/** What each evidence label means (the tooltip in Chinese; the label itself stays English). */
export const EVIDENCE_ZH = {
  Measured: '实测：我自己数的或记下来的',
  Sourced: '引用：出自公开资料，标了出处',
  Estimated: '估算：我自己算的，写明了假设',
  Simulated: '模拟：模型算出来的，不是真实玩家',
  Hypothesis: '假设：我的预期，还没验证',
};
