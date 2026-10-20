import {useState} from 'react';
import {L, useCaseLang} from '../../i18n';
import {annualPremium, dominator, plans} from '../../v2/data/cntl-model.js';
import {usd} from './bits';
import {MIXES} from './year-mix.js';

/* The end of the receipt (WORLDS.md, D4: "a torn-off receipt summary card the visitor can save as an image"). A short
   slip, torn off the tape, that totals up what you did on this page: the plan you ticked, the year you scrubbed to,
   the years you rolled. "Save as image" draws the same lines onto a canvas in the browser and downloads a PNG; nothing
   leaves the page. */

const T = {
  pick: L('Your pick in the table', '你在表格里选的方案'),
  none: L('None yet', '还没有'),
  costsMore: (a, d, b) => L(`${a} costs ${d} more a year than ${b}, same coverage`, `保障相同，${a} 每年比 ${b} 多花 ${d}`),
  notBeaten: a => L(`${a} isn’t beaten on every term`, `${a} 没有在每项条款上都被比下去`),
  aYear: v => L(`A year with ${v} in covered bills`, `承保医疗费用为 ${v} 的一年`),
  rolled: L('Years rolled', '抽过的年份'),
  mix: m => L(`${m.en}, illustrative`, `${m.zh}，示意`),
  years: n => L(`${n} ${n === 1 ? 'year' : 'years'}`, `${n} 年`),
  cheapest: list => L(`Cheapest: ${list}`, `最便宜的次数：${list}`),
  insteadOfA: L('Plan B instead of Plan A', '选 Plan B 而不选 Plan A'),
  fine: L('Fictional plans, not advice. Every total is the prototype’s tested cost model; rolled bills are made up.', '虚构方案，不构成建议。每个总额都来自原型经过测试的费用模型；抽到的账单是编出来的。'),
  title: L('Your receipt', '你的收据'),
  byline: L('Your receipt, from the case study by Jay Lin', '你的收据，来自 Jay Lin 的案例研究'),
  sub: L('What you did on this page, totaled. It updates as you go.', '你在这个页面上做过的事，在这里合计，随你的操作更新。'),
  save: L('Save as image', '存为图片'),
  saved: L('Saved as choose-not-to-lose-receipt.png.', '已存为 choose-not-to-lose-receipt.png。'),
  png: L('A PNG, made in your browser. Nothing is sent.', '一张在你的浏览器里生成的 PNG，不会上传任何内容。'),
};
const A = plans[0], B = plans[1];

/** The slip's lines, shared by the HTML card and the canvas: [left, right?, kind?]. */
function lines({pick, scrub, roll}, t, zh) {
  const out = [];
  const picked = plans.find(p => p.id === pick);
  out.push([t(T.pick), picked ? picked.name : t(T.none)]);
  if (picked) {
    const by = dominator(picked);
    out.push(by ? [t(T.costsMore(picked.name, usd(annualPremium(picked) - annualPremium(by)), by.name)), null, 'loss']
      : [t(T.notBeaten(picked.name)), null, 'note']);
  }
  out.push(['rule']);
  out.push([t(T.aYear(usd(scrub.bills * 100))), null, 'head']);
  scrub.now.forEach(n => out.push([n.p.name, usd(n.total), n.p.id === 'b' ? 'loss-row' : n.total === scrub.low ? 'low' : '']));
  out.push(['rule']);
  const rolled = Object.entries(roll.books).filter(([, b]) => b.n);
  if (!rolled.length) out.push([t(T.rolled), t(T.none)]);
  rolled.forEach(([id, b]) => {
    out.push([t(T.mix(MIXES.find(m => m.id === id).label)), t(T.years(b.n)), 'head']);
    out.push([t(T.cheapest(plans.map(p => `${p.id.toUpperCase()} ${b.tally[p.id]}`).join(zh ? '，' : ', '))), null, 'note']);
    out.push([t(T.insteadOfA), `−${usd(b.lost)}`, 'loss-row']);
  });
  out.push(['rule']);
  out.push([t(T.fine), null, 'fine']);
  return out;
}

function draw(rows, {title, byline}) {
  const W = 760, pad = 48, s = 2;
  // words stay whole; Chinese can break between any two characters
  const wrap = (ctx, text, max) => {
    const tokens = text.match(/[A-Za-z0-9$,.%’'()+\-−]+ ?|\s+|./gu) || [text], out = [];
    let cur = '';
    tokens.forEach(tok => { const next = cur + tok; if (ctx.measureText(next.trimEnd()).width > max && cur.trim()) { out.push(cur.trimEnd()); cur = tok.trimStart(); } else cur = next; });
    if (cur.trim()) out.push(cur.trimEnd());
    return out;
  };
  const probe = document.createElement('canvas').getContext('2d');
  // measure first, then paint at that height
  const layout = [];
  let y = 150;
  rows.forEach(([l, r, kind]) => {
    if (l === 'rule') { layout.push({rule: y + 14}); y += 34; return; }
    probe.font = kind === 'fine' || kind === 'note' ? '400 21px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace' : '500 24px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace';
    const parts = wrap(probe, l, W - pad * 2 - (r ? 190 : 0));
    layout.push({l: parts, r, kind, y});
    y += parts.length * (kind === 'fine' ? 30 : 34) + (kind === 'head' ? 6 : 4);
  });
  const H = y + 70;
  const c = document.createElement('canvas');
  c.width = W * s; c.height = H * s;
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  // paper with torn top and bottom edges
  ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff'; ctx.beginPath();
  ctx.moveTo(0, 12); for (let x = 0; x <= W; x += 14) ctx.lineTo(x + 7, x / 14 % 2 ? 12 : 0);
  ctx.lineTo(W, H - 12); for (let x = W; x >= 0; x -= 14) ctx.lineTo(x - 7, x / 14 % 2 ? H - 12 : H);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#161616'; ctx.textBaseline = 'alphabetic';
  ctx.font = '500 40px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace'; ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 74);
  ctx.font = '400 21px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace'; ctx.fillStyle = '#525252'; ctx.fillText(byline, W / 2, 110);
  layout.forEach(item => {
    if (item.rule != null) { ctx.strokeStyle = '#c6c6c6'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pad, item.rule); ctx.lineTo(W - pad, item.rule); ctx.stroke(); ctx.setLineDash([]); return; }
    const {kind} = item;
    ctx.font = kind === 'fine' || kind === 'note' ? '400 21px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace' : `${kind === 'head' || kind === 'low' ? 600 : 500} 24px Mono, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", monospace`;
    ctx.fillStyle = kind === 'loss' || kind === 'loss-row' ? '#da1e28' : kind === 'fine' || kind === 'note' ? '#525252' : '#161616';
    ctx.textAlign = 'left';
    item.l.forEach((t, i) => ctx.fillText(t, pad, item.y + i * (kind === 'fine' ? 30 : 34)));
    if (item.r) { ctx.textAlign = 'right'; ctx.fillText(item.r, W - pad, item.y); }
  });
  return c;
}

export default function TearOff({pick, scrub, roll}) {
  const {t, zh} = useCaseLang();
  const [saved, setSaved] = useState(false);
  const rows = lines({pick, scrub, roll}, t, zh);
  const save = async () => {
    try { await document.fonts?.ready; } catch { /* draw with what's loaded */ }
    const canvas = draw(rows, {title: 'Choose Not to Lose', byline: t(T.byline)});
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'choose-not-to-lose-receipt.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSaved(true);
    }, 'image/png');
  };
  return <section className="cnr-stub" aria-labelledby="cnr-stub-title">
    <div className="cnr-stub-paper">
      <h2 id="cnr-stub-title" className="cnr-stub-title">{t(T.title)}</h2>
      <p className="cnr-stub-sub">{t(T.sub)}</p>
      <div className="cnr-stub-lines">{rows.map(([l, r, kind], i) => l === 'rule'
        ? <hr key={i} className="cnr-rule" aria-hidden="true"/>
        : <p key={i} className={`cnr-stub-line${kind ? ` is-${kind}` : ''}`}><span>{l}</span>{r ? <b>{r}</b> : null}</p>)}</div>
      <p className="cnr-stub-tools">
        <button type="button" className="cnr-key is-primary" onClick={save}>{t(T.save)}</button>
        <span className="cnr-stub-note" aria-live="polite">{t(saved ? T.saved : T.png)}</span>
      </p>
    </div>
  </section>;
}
