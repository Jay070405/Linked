import {zoomable} from './v2/zoom';
import {L, useCaseLang} from './i18n';

// Design-to-code figures built from the study's own material: the six test screens, the real layer trees of the
// sign-in screen, and the benchmark pipeline. HTML and CSS, so the text stays real text at every width.

/* The test set. Source: p2-benchmark/reference/S1-L2.png … S6-L2.png (top of each frame). */
const DESKTOP = [
  {file: 's2', id: 'S2', name: L('Pricing', '定价页'), alt: L('S2, pricing: three plan cards with the Pro plan highlighted.', 'S2 定价页：三张套餐卡片，Pro 套餐突出显示。')},
  {file: 's4', id: 'S4', name: L('Product grid', '商品列表'), alt: L('S4, product grid: filter chips and a grid of product cards.', 'S4 商品列表：筛选标签和商品卡片网格。')},
  {file: 's5', id: 'S5', name: L('Dashboard', '仪表盘'), alt: L('S5, dashboard: a sidebar, four stat tiles and a transactions table.', 'S5 仪表盘：侧边栏、四个数据卡片和一张交易表格。')},
];
const MOBILE = [
  {file: 's1', id: 'S1', name: L('Sign-in', '登录'), alt: L('S1, sign-in: email and password fields, a sign-in button and an SSO button.', 'S1 登录页：邮箱和密码输入框、登录按钮和 SSO 按钮。')},
  {file: 's3', id: 'S3', name: L('Settings', '设置'), alt: L('S3, settings: grouped rows with toggles and chevrons.', 'S3 设置页：分好组的设置项，带开关和箭头。')},
  {file: 's6', id: 'S6', name: L('Profile', '个人主页'), alt: L('S6, profile: an avatar, three stats, tabs and a list of projects.', 'S6 个人主页：头像、三项数据、标签页和项目列表。')},
];

/** zoom: each screen opens in the case page's figure viewer. */
export function TestSet({zoom = false}) {
  const {t, lang} = useCaseLang();
  const z = s => (zoom ? zoomable(t(s.alt), {lang}) : {});
  return <div className="pp-stage pp-testset">
    <ul className="pp-testset-row is-desktop">
      {DESKTOP.map(s => <li key={s.id}>
        <div className="pp-browser">
          <div className="pp-browser-bar" aria-hidden="true"><i/><i/><i/><b/></div>
          <img src={`/assets/product/test-set-${s.file}.webp`} width={800} height={433} alt={t(s.alt)} loading="lazy" decoding="async" {...z(s)}/>
        </div>
        <p className="pp-device-label"><b>{s.id}</b> {t(s.name)}</p>
      </li>)}
    </ul>
    <ul className="pp-testset-row is-mobile">
      {MOBILE.map(s => <li key={s.id}>
        <div className="pp-phone"><img src={`/assets/product/test-set-${s.file}.webp`} width={390} height={760} alt={t(s.alt)} loading="lazy" decoding="async" {...z(s)}/></div>
        <p className="pp-device-label"><b>{s.id}</b> {t(s.name)}</p>
      </li>)}
    </ul>
  </div>;
}

/* The sign-in screen's layer trees, read (never written) from the benchmark file with the Figma MCP server on
   19 Oct 2026: fileKey 1PYbZtPUlwIkd6rZDY552l, S1-L2 = node 6:62 on page 0:1, S1-L0 = node 10:2195 on page 1:3.
   Each entry: [depth, name, type, layoutMode, bound variable fields]. Instances were not expanded. */
export const L2 = [
  [0, 'S1-L2', 'FRAME', 'VERTICAL', ['paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'fills']],
  [1, 'Main', 'FRAME', 'VERTICAL', ['itemSpacing']],
  [2, 'Brand', 'FRAME', 'HORIZONTAL', ['itemSpacing']],
  [3, 'Logo mark', 'FRAME', 'HORIZONTAL', ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'fills']],
  [4, 'Logo glyph', 'TEXT', null, ['fills']],
  [3, 'Wordmark', 'TEXT', null, ['fills']],
  [2, 'Header', 'FRAME', 'VERTICAL', ['itemSpacing']],
  [3, 'Title', 'TEXT', null, ['fills']],
  [3, 'Subtitle', 'TEXT', null, ['fills']],
  [2, 'Sign in form', 'FRAME', 'VERTICAL', ['itemSpacing']],
  [3, 'Email field', 'INSTANCE', 'VERTICAL', ['itemSpacing']],
  [3, 'Password field', 'INSTANCE', 'VERTICAL', ['itemSpacing']],
  [3, 'Form options', 'FRAME', 'HORIZONTAL', []],
  [4, 'Remember me', 'INSTANCE', 'HORIZONTAL', ['itemSpacing']],
  [4, 'Forgot password link', 'TEXT', null, ['fills']],
];
export const L0 = [
  [0, 'S1-L0', 'FRAME', 'NONE', []],
  [1, 'Frame 1', 'FRAME', 'NONE', []],
  [2, 'Frame 2', 'FRAME', 'NONE', []],
  [3, 'Frame 3', 'FRAME', 'NONE', []],
  [4, 'Text', 'TEXT', null, []],
  [3, 'Text', 'TEXT', null, []],
  [2, 'Frame 4', 'FRAME', 'NONE', []],
  [3, 'Text', 'TEXT', null, []],
  [3, 'Text', 'TEXT', null, []],
  [2, 'Frame 5', 'FRAME', 'NONE', []],
  [3, 'Frame 6', 'FRAME', 'NONE', []],
  [4, 'Text', 'TEXT', null, []],
  [4, 'Frame 7', 'FRAME', 'NONE', []],
  [3, 'Frame 8', 'FRAME', 'NONE', []],
  [4, 'Text', 'TEXT', null, []],
];
export const SHOWN = 14;
export const kindsOf = fields => [
  fields.some(f => f === 'fills' || f === 'strokes') && 'color',
  fields.some(f => f === 'itemSpacing' || f.startsWith('padding')) && 'spacing',
  fields.some(f => f.endsWith('Radius')) && 'radius',
].filter(Boolean);

export function LayerIcon({type, layout}) {
  const p = {width: 14, height: 14, viewBox: '0 0 14 14', 'aria-hidden': true, className: 'pp-layer-icon'};
  if (type === 'TEXT') return <svg {...p}><path d="M3.5 3.5h7M7 3.5v7.5" /></svg>;
  if (type === 'RECTANGLE') return <svg {...p}><rect x="3" y="3" width="8" height="8" rx="1"/></svg>;
  if (type === 'INSTANCE') return <svg {...p}><path d="M7 2.2 11.8 7 7 11.8 2.2 7Z"/></svg>;
  if (layout === 'VERTICAL') return <svg {...p}><path d="M3 3.5h8M3 7h8M3 10.5h8"/></svg>;
  if (layout === 'HORIZONTAL') return <svg {...p}><path d="M3.5 3v8M7 3v8M10.5 3v8"/></svg>;
  return <svg {...p}><path d="M4.5 2v10M9.5 2v10M2 4.5h10M2 9.5h10"/></svg>;
}

function LayersPanel({tree, page, label}) {
  const rows = tree.slice(0, SHOWN);
  const auto = rows.filter(r => r[3] === 'VERTICAL' || r[3] === 'HORIZONTAL').length;
  const bound = rows.filter(r => r[4].length).length;
  const instances = rows.filter(r => r[2] === 'INSTANCE').length;
  return <section className="pp-layers-panel" aria-label={label}>
    <header><span>Layers</span><span className="pp-layers-page">{page}</span></header>
    <ol>
      {rows.map(([depth, name, type, layout, fields], i) => {
        const open = (tree[i + 1]?.[0] ?? -1) > depth;
        return <li key={i} className={type === 'INSTANCE' ? 'is-instance' : undefined} style={{'--depth': depth}}>
          <span className="pp-layer-caret" aria-hidden="true">{open ? <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 2.5 4 5.2l2.5-2.7"/></svg> : null}</span>
          <LayerIcon type={type} layout={layout}/>
          <span className="pp-layer-name">{name}</span>
          <span className="pp-layer-vars">{kindsOf(fields).map(k => <span key={k} className="pp-var-chip"><svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><path d="M4.5.8 8.2 2.9v4.2L4.5 9.2.8 7.1V2.9Z"/></svg>{k}</span>)}</span>
        </li>;
      })}
    </ol>
    <dl className="pp-layers-sum">
      <div><dt>Auto layout</dt><dd>{auto} of {SHOWN}</dd></div>
      <div><dt>Component instances</dt><dd>{instances}</dd></div>
      <div><dt>Bound to variables</dt><dd>{bound} of {SHOWN}</dd></div>
    </dl>
  </section>;
}

export const LayersCompare = () => <div className="pp-stage pp-layers">
  <LayersPanel tree={L2} page="L2 Systematized" label="The first 14 layers of the sign-in screen in the L2 file"/>
  <LayersPanel tree={L0} page="L0 Raw" label="The first 14 layers of the sign-in screen in the L0 file"/>
</div>;

/* How one build was made and scored (the protocol, as run). */
const STEPS = [
  {name: 'Figma frame', detail: L('6 screens, each in 4 versions', '6 个界面，每个 4 个版本')},
  {name: 'Figma MCP', detail: <code>get_design_context</code>},
  {name: L('Fresh agent', '新开的 agent'), detail: L('Claude Sonnet 5.5, the same prompt every time', 'Claude Sonnet 5.5，每次的提示词都一样')},
  {name: <code>index.html</code>, detail: L('One self-contained file per build', '每次构建只出一个独立文件')},
  {name: 'Headless Chrome', detail: L('Renders the build at the frame’s width and two others', '按 frame 的宽度渲染，再试另外两种宽度')},
  {name: L('Scores', '评分'), detail: L(<ul><li>Similarity to the Figma export</li><li>Resize checks</li><li>Code structure</li><li>Token-change test</li></ul>,
    <ul><li>像不像 Figma 导出图</li><li>缩放检查</li><li>代码结构</li><li>token 改动测试</li></ul>)},
];
export function Pipeline() {
  const {t} = useCaseLang();
  return <ol className="pp-pipeline">
    {STEPS.map((step, i) => <li key={i} className={i === STEPS.length - 1 ? 'is-last' : undefined}>
      <span className="pp-step-n" aria-hidden="true">{i + 1}</span>
      <p className="pp-step-name">{t(step.name)}</p>
      <div className="pp-step-detail">{t(step.detail)}</div>
    </li>)}
  </ol>;
}
