import {useState} from 'react';
import {annualPremium, dominator, plans} from '../../v2/data/cntl-model.js';
import {usd} from './bits';
import {MIXES} from './year-mix.js';

/* The end of the receipt (WORLDS.md, D4: "a torn-off receipt summary card the visitor can save as an image"). A short
   slip, torn off the tape, that totals up what you did on this page: the plan you ticked, the year you scrubbed to,
   the years you rolled. "Save as image" draws the same lines onto a canvas in the browser and downloads a PNG; nothing
   leaves the page. */

const A = plans[0], B = plans[1];

/** The slip's lines, shared by the HTML card and the canvas: [left, right?, kind?]. */
function lines({pick, scrub, roll}) {
  const out = [];
  const picked = plans.find(p => p.id === pick);
  out.push(['Your pick in the table', picked ? picked.name : 'None yet']);
  if (picked) {
    const by = dominator(picked);
    out.push(by ? [`${picked.name} costs ${usd(annualPremium(picked) - annualPremium(by))} more a year than ${by.name}, same coverage`, null, 'loss']
      : [`${picked.name} isn’t beaten on every term`, null, 'note']);
  }
  out.push(['rule']);
  out.push([`A year with ${usd(scrub.bills * 100)} in covered bills`, null, 'head']);
  scrub.now.forEach(n => out.push([n.p.name, usd(n.total), n.p.id === 'b' ? 'loss-row' : n.total === scrub.low ? 'low' : '']));
  out.push(['rule']);
  const rolled = Object.entries(roll.books).filter(([, b]) => b.n);
  if (!rolled.length) out.push(['Years rolled', 'None yet']);
  rolled.forEach(([id, b]) => {
    out.push([`${MIXES.find(m => m.id === id).label}, illustrative`, `${b.n} ${b.n === 1 ? 'year' : 'years'}`, 'head']);
    out.push([`Cheapest: ${plans.map(p => `${p.id.toUpperCase()} ${b.tally[p.id]}`).join(', ')}`, null, 'note']);
    out.push(['Plan B instead of Plan A', `−${usd(b.lost)}`, 'loss-row']);
  });
  out.push(['rule']);
  out.push(['Fictional plans, not advice. Every total is the prototype’s tested cost model; rolled bills are made up.', null, 'fine']);
  return out;
}

function draw(rows) {
  const W = 760, pad = 48, s = 2;
  const wrap = (ctx, text, max) => {
    const words = text.split(' '), out = [];
    let cur = '';
    words.forEach(w => { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; });
    if (cur) out.push(cur);
    return out;
  };
  const probe = document.createElement('canvas').getContext('2d');
  // measure first, then paint at that height
  const layout = [];
  let y = 150;
  rows.forEach(([l, r, kind]) => {
    if (l === 'rule') { layout.push({rule: y + 14}); y += 34; return; }
    probe.font = kind === 'fine' || kind === 'note' ? '400 21px Mono, monospace' : '500 24px Mono, monospace';
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
  ctx.font = '500 40px Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('Choose Not to Lose', W / 2, 74);
  ctx.font = '400 21px Mono, monospace'; ctx.fillStyle = '#525252'; ctx.fillText('Your receipt, from the case study by Jay Lin', W / 2, 110);
  layout.forEach(item => {
    if (item.rule != null) { ctx.strokeStyle = '#c6c6c6'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pad, item.rule); ctx.lineTo(W - pad, item.rule); ctx.stroke(); ctx.setLineDash([]); return; }
    const {kind} = item;
    ctx.font = kind === 'fine' || kind === 'note' ? '400 21px Mono, monospace' : `${kind === 'head' || kind === 'low' ? 600 : 500} 24px Mono, monospace`;
    ctx.fillStyle = kind === 'loss' || kind === 'loss-row' ? '#da1e28' : kind === 'fine' || kind === 'note' ? '#525252' : '#161616';
    ctx.textAlign = 'left';
    item.l.forEach((t, i) => ctx.fillText(t, pad, item.y + i * (kind === 'fine' ? 30 : 34)));
    if (item.r) { ctx.textAlign = 'right'; ctx.fillText(item.r, W - pad, item.y); }
  });
  return c;
}

export default function TearOff({pick, scrub, roll}) {
  const [saved, setSaved] = useState(false);
  const rows = lines({pick, scrub, roll});
  const save = async () => {
    try { await document.fonts?.ready; } catch { /* draw with what's loaded */ }
    const canvas = draw(rows);
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
      <h2 id="cnr-stub-title" className="cnr-stub-title">Your receipt</h2>
      <p className="cnr-stub-sub">What you did on this page, totaled. It updates as you go.</p>
      <div className="cnr-stub-lines">{rows.map(([l, r, kind], i) => l === 'rule'
        ? <hr key={i} className="cnr-rule" aria-hidden="true"/>
        : <p key={i} className={`cnr-stub-line${kind ? ` is-${kind}` : ''}`}><span>{l}</span>{r ? <b>{r}</b> : null}</p>)}</div>
      <p className="cnr-stub-tools">
        <button type="button" className="cnr-key is-primary" onClick={save}>Save as image</button>
        <span className="cnr-stub-note" aria-live="polite">{saved ? 'Saved as choose-not-to-lose-receipt.png.' : 'A PNG, made in your browser. Nothing is sent.'}</span>
      </p>
    </div>
  </section>;
}
