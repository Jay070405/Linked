import {useEffect, useRef} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {PRODUCT_HOME} from '../../content';
import {L, UI, useCaseLang} from '../../i18n';
import {protoUrl, shotSrc} from './kit/Device';
import {CHANGES, DECISIONS, HERO, inches, named, NUMBERS, PROBLEM, px, REFLECTION, REVIEW_NOTE, ROUNDS, STEPS, TASKS, TESTING, wallSrc, WORKS} from './data';
import {earnings, largestSharp, money, papers, printCheck, sizes} from './model';

/* "Skip the experience": the whole case as a plain page, in English or Chinese. Same words and numbers as the gallery,
   no pinning, no scroll-driven scenes, no lights; the interactive checks become the tables they compute. */
export default function Plain({item, next, onBack}) {
  const {t, zh} = useCaseLang();
  const blue = WORKS[0], top = largestSharp(blue), e = earnings(38, top, papers[0]);
  const title = useRef(null);
  // arriving here starts the page over, with focus on the title
  useEffect(() => {
    const node = title.current; if (!node) return;
    const scroller = node.closest('.portfolio-page-viewport');
    if (scroller) scroller.scrollTop = 0; else scrollTo(0, 0);
    node.focus({preventScroll: true});
  }, []);
  const colon = zh ? '：' : ': ';
  return <div className="atw-plain">
    <div className="atw-plain-bar">
      <p>{t(L('You’re reading the plain version of this case: the same content, without the gallery.', '这是简洁版：内容一样，只是没有展厅。'))}</p>
      <button type="button" className="atw-plain-back" onClick={onBack}>{t(L('Back to the gallery', '回到展厅'))}</button>
    </div>

    <header className="atw-plain-head">
      <Go to={PRODUCT_HOME} className="atw-plain-up"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
      <p className="atw-plain-kind">{item.kind}</p>
      <h1 ref={title} id="atw-plain-title" tabIndex={-1} lang="en">{HERO.title}</h1>
      <p className="atw-plain-lead">{t(HERO.outcome)}</p>
      <ul className="atw-plain-chips" aria-label={t(L('Project facts', '项目信息'))}>{HERO.chips.map(c => <li key={c.en}>{t(c)}</li>)}</ul>
      <p><a href={protoUrl('onboarding')} target="_blank" rel="noopener">{t(L('Open the prototype', '打开原型'))}<span className="atw-sr">{t(UI.opensInNewTab)}</span></a></p>
    </header>

    <section aria-labelledby="pl-numbers">
      <h2 id="pl-numbers">{t(L('In numbers', '几个数字'))}</h2>
      <ul>{NUMBERS.map(n => <li key={n.label.en}><b>{n.value}{n.unit ? ` ${n.unit}` : ''}</b>{colon}{zh ? `${t(n.label)}。${t(n.note)}。` : `${t(n.label).toLowerCase()}. ${t(n.note)}.`}</li>)}</ul>
    </section>

    <section aria-labelledby="pl-collection">
      <h2 id="pl-collection">{t(L('The collection', '作品陈列'))}</h2>
      <p>{t(L('Atelier’s catalog is eight of my own paintings, each with the label a collector would see. A size is listed only if the whole painting prints at 300 dpi or more inside a quarter-inch white border; $38 is the prototype’s default price for the largest size.',
        'Atelier 的作品库是我自己的八幅画，每幅都配着藏家会看到的标签。一个尺寸要列出来，整幅画留出四分之一英寸白边后，还得有 300 dpi 以上；最大尺寸在原型里默认卖 $38。'))}</p>
      <ul className="atw-plain-works">
        {WORKS.map(w => <li key={w.id}>
          <img src={wallSrc(w.id)} width={w.originalWidth} height={w.originalHeight} alt={zh ? `${named(w, zh)}（${w.zh}）：${t(w.about)}` : `${w.title}: ${t(w.about)}`} loading="lazy" decoding="async"/>
          {zh
            ? <p><b lang="en">{w.title}</b>（{w.zh}）。{t(w.about)}原图 {px(w.originalWidth)} × {px(w.originalHeight)} px；最大可印 {inches(w, w.top)} 英寸；$38。</p>
            : <p><b>{w.title}</b>. {t(w.about)} Original file {px(w.originalWidth)} × {px(w.originalHeight)} px; prints sharp up to {inches(w, w.top)} in; $38.</p>}
        </li>)}
      </ul>
    </section>

    <section aria-labelledby="pl-problem">
      <h2 id="pl-problem">{t(PROBLEM.heading)}</h2>
      {PROBLEM.paragraphs.map(p => <p key={p.en.slice(0, 20)}>{t(p)}</p>)}
      <p className="atw-plain-note"><Ev label="Hypothesis"/> {t(PROBLEM.hypothesis)}</p>
      {zh
        ? <p>四个工具：{PROBLEM.tools.map(x => `${t(x.name)}（${t(x.role)}）`).join('；')}。卡在它们之间的问题：{PROBLEM.seams.map(t).join('')}</p>
        : <p>The four tools: {PROBLEM.tools.map(x => `${t(x.name)} (${t(x.role)})`).join('; ')}. The questions that fall between them: {PROBLEM.seams.map(t).join(' ')}</p>}
      <p className="atw-plain-note"><Ev label="Hypothesis"/> {t(PROBLEM.seamsNote)}</p>
      <p className="atw-plain-note">{t(L('Placeholder', '占位'))}{colon}{t(PROBLEM.quote)}</p>
    </section>

    <section aria-labelledby="pl-flow">
      <h2 id="pl-flow">{t(L('Five steps to a drop, then share it', '五步完成上新，再分享出去'))}</h2>
      <ol className="atw-plain-steps">
        {STEPS.map((s, i) => <li key={s.id}>
          <img src={shotSrc(s.screen)} width={780} height={1688} alt={t(s.alt)} loading="lazy" decoding="async"/>
          <div><p className="atw-plain-kind">{i < 5 ? (zh ? `第 ${i + 1} 步，共 5 步` : `Step ${i + 1} of 5`) : t(L('After publishing', '发布之后'))}</p><h3>{t(s.title)}</h3><p>{t(s.text)}</p></div>
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="pl-check">
      <h2 id="pl-check">{t(L('The print check', '印前检查'))}</h2>
      <p>{t(L('A sharp print needs about 300 of the file’s pixels for every inch of paper. Fewer, and the printer has to stretch the file to fill the paper, and the print goes soft. Atelier does this arithmetic before an artist can offer a size, for the six sizes it sells.',
        '要印得清楚，每英寸纸面大约需要文件里的 300 个像素。少于这个数，打印机就得把文件拉伸到铺满纸面，印出来就会发虚。所以在画师上架之前，Atelier 会把它卖的六个尺寸全都算一遍。'))}</p>
      <div className="atw-plain-table" role="region" aria-label={t(L('Print check for each painting', '每幅画的印前检查'))} tabIndex={0}>
        <table>
          <caption>{t(L('Dots per inch at each size; sizes at 300 or more can be sold.', '各尺寸的 dpi；300 及以上的尺寸可以上架。'))}</caption>
          <thead><tr><th scope="col">{t(L('Painting', '画作'))}</th>{sizes.map(z => <th key={z.id} scope="col">{z.w} × {z.h} {zh ? '英寸' : 'in'}</th>)}</tr></thead>
          <tbody>{WORKS.map(w => <tr key={w.id}><th scope="row" lang="en">{w.title}</th>{sizes.map(z => { const r = printCheck(w, z); return <td key={z.id} className={r.ok ? '' : 'is-no'}>{r.dpi}{r.ok ? '' : <span className="atw-sr">{zh ? '（不上架）' : ' (not sold)'}</span>}</td>; })}</tr>)}</tbody>
        </table>
      </div>
      {zh
        ? <p>画师能拿多少：{named(blue, zh)}，{inches(blue, top)} 英寸，哑光纸，定价 {money(e.price)}。印刷和纸张 {money(e.printCost)}，手续费 {money(e.fee)}（8% + $0.30），画师到手 {money(e.keep)}。棉浆纸的制作成本多 $4。</p>
        : <p>What the artist keeps, for {blue.title} at {inches(blue, top)} in on studio matte, priced at {money(e.price)}: {money(e.printCost)} for print and paper, {money(e.fee)} in fees (8% + $0.30), {money(e.keep)} to the artist. Cotton rag adds $4 to the production cost.</p>}
      <p className="atw-plain-note"><Ev label="Estimated"/> {t(L('The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote. The arithmetic is the prototype’s, to the cent.', '8% + $0.30 的手续费是概念数字，印刷成本也是假设，不是供应商报价。算法和原型完全一致，精确到分。'))}</p>
    </section>

    <section aria-labelledby="pl-decisions">
      <h2 id="pl-decisions">{t(L('What I chose, and what I tried first', '选了什么，之前试过什么'))}</h2>
      {DECISIONS.map(d => <div key={d.id} className="atw-plain-decision">
        <h3>{t(d.title)}</h3>
        <p>{t(d.verdict)}</p>
        <p><b>{t(L('Tried', '试过'))}{colon}</b>{zh ? '' : ' '}{t(d.tried)}</p>
        <p><b>{t(L('Chose', '选定'))}{colon}</b>{zh ? '' : ' '}{t(d.chose)}</p>
      </div>)}
    </section>

    <section aria-labelledby="pl-rounds">
      <h2 id="pl-rounds">{t(L('Round 1 → Round 2', '第一轮 → 第二轮'))}</h2>
      <p><b>{t(L('A model-assisted design review.', '借模型做了一次设计评审。'))}</b> {t(REVIEW_NOTE)}</p>
      {ROUNDS.map(r => <figure key={r.id} className="atw-plain-pair">
        <img src={r.before.src} width={780} height={1688} alt={zh ? `${t(r.tab)}，第一轮` : `${t(r.tab)}, round 1`} loading="lazy" decoding="async"/>
        <img src={r.after.src} width={780} height={1688} alt={zh ? `${t(r.tab)}，第二轮` : `${t(r.tab)}, round 2`} loading="lazy" decoding="async"/>
        <figcaption>{t(r.caption)}</figcaption>
      </figure>)}
      <h3>{t(L('What changed and why', '改了什么，为什么改'))}</h3>
      <ul>{CHANGES.map(c => <li key={c.what.en}>{t(c.what)} <i>{t(c.why)}</i></li>)}</ul>
    </section>

    <section aria-labelledby="pl-try">
      <h2 id="pl-try">{t(L('Try it yourself', '自己试试'))}</h2>
      <p>{t(L('The prototype runs in your browser only: no account, no payment, no shipping. Each task opens it in a new tab.', '原型只在你的浏览器里运行，不用账号，不付款，不发货。任务会在新标签页打开。'))}</p>
      <ol>{TASKS.map(k => <li key={k.id}><a href={protoUrl(k.screen, k.art)} target="_blank" rel="noopener">{t(k.title)}</a>{zh ? '。' : '. '}{t(k.hint)}</li>)}</ol>
    </section>

    <section aria-labelledby="pl-testing">
      <h2 id="pl-testing">{t(L('Testing comes next', '接下来是测试'))}</h2>
      <p>{t(L('Nothing here has been tested with artists yet. This is the plan, and the space the results will fill.', '这里的内容都还没找画师测过。下面是测试计划，结果的位置也留好了。'))}</p>
      <h3>{t(L('Plan for test day', '测试日计划'))}</h3>
      <ul>{TESTING.plan.map(p => <li key={p.en}>{t(p)}</li>)}</ul>
      <h3>{t(L('Hypotheses to check', '待验证的假设'))}</h3>
      <ul>{TESTING.hypotheses.map(h => <li key={h.en}><Ev label="Hypothesis"/> {t(h)}</li>)}</ul>
      <p className="atw-plain-note">{zh
        ? `占位：测试日之后再填。${TESTING.results.map(([k, v]) => `${t(k)}：${t(v)}`).join('；')}。`
        : `Placeholder: results after test day. ${TESTING.results.map(([k, v]) => `${t(k)}: ${t(v)}`).join('; ')}.`}</p>
    </section>

    <section aria-labelledby="pl-reflection">
      <h2 id="pl-reflection">{t(L('Reflection', '复盘'))}</h2>
      {REFLECTION.map(r => <div key={r.title.en}><h3>{t(r.title)}</h3><p>{t(r.text)}</p></div>)}
    </section>

    <p className="atw-plain-next">{t(UI.nextProject)}{colon}<Go to={`${PRODUCT_HOME}/${next.slug}`} lang="en">{next.title}</Go></p>
  </div>;
}
