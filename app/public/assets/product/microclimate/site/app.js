// The iOS app, as a clickable prototype in an iPhone frame. Built to the platform's own patterns: large titles, inset
// grouped lists, a half sheet with a Control Center style slider, system switches, a floating tab bar, and the 30-minute
// heating timer as a Live Activity (Dynamic Island in the prototype, Lock Screen in the row below).
const ORANGE = '#FF9500', CYAN = '#32ADE6', BLUE = '#007AFF', GREEN = '#34C759', INDIGO = '#5856D6', RED = '#FF3B30';
const LABEL = '#000', SEC = 'rgba(60,60,67,.6)', SEP = 'rgba(60,60,67,.18)', FILL = 'rgba(120,120,128,.16)';
const TEMP = [0, 33, 35, 37];
// lang.js: the page in Chinese or, with ?lang=en, in English
const tr = window.MC ? window.MC.T : (zh) => zh;
const ZN = { A: tr('上背', 'Upper'), B: tr('腰', 'Lower'), C: tr('座垫', 'Seat') };
const POS = { A: [.58, .30], B: [.53, .44], C: [.435, .59] };       // zone centres in the chair image

const I = {
  flame: (c = ORANGE, s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><path fill="${c}" d="M8.2 1c.4 2.2-.6 3.4-1.6 4.6C5.6 6.8 4.5 8 4.5 10a3.5 3.5 0 0 0 7 0c0-1.5-.7-2.6-1.3-3.4-.2 1-.7 1.7-1.4 2 .6-2.6-.1-5.6-.6-7.6z"/></svg>`,
  wind: (c = CYAN, s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M1.5 6h8.2a2 2 0 1 0-2-2.2M1.5 9.5h11a2 2 0 1 1-2 2.2M1.5 13h5"/></svg>`,
  off: (c = SEC, s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><path d="M8 2v5.5M4.4 4.2a5 5 0 1 0 7.2 0"/></svg>`,
  chev: () => `<svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true"><path d="M1.5 1.5 6.5 6.5l-5 5" fill="none" stroke="rgba(60,60,67,.3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: (c = BLUE) => `<svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><path d="M1.5 7.5 6 12 14.5 1.8" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x: () => `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(60,60,67,.6)" stroke-width="2" stroke-linecap="round"/></svg>`,
  spark: (c = INDIGO, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><path fill="${c}" d="M6.5 1l1.2 3.6L11.3 6 7.7 7.4 6.5 11 5.3 7.4 1.7 6l3.6-1.4zM12.3 9l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z"/></svg>`,
  chair: (c) => `<svg width="25" height="25" viewBox="0 0 25 25" aria-hidden="true" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5h9v8.5H8z M6 13.5h13l-1 3H7z M12.5 16.5v4.5 M8.5 21.5h8"/></svg>`,
  stack: (c) => `<svg width="25" height="25" viewBox="0 0 25 25" aria-hidden="true" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="9" width="17" height="12" rx="3"/><path d="M6.5 6h12M9 3h7" stroke-linecap="round"/></svg>`,
  ai: (c) => `<svg width="25" height="25" viewBox="0 0 25 25" aria-hidden="true"><path fill="${c}" d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>`,
  brief: () => `<svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.6"><rect x="2" y="5" width="13" height="9" rx="2"/><path d="M6 5V3.5h5V5"/></svg>`,
  book: () => `<svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"><path d="M8.5 4.5C7 3.4 5 3 2.5 3v10c2.5 0 4.5.4 6 1.5 1.5-1.1 3.5-1.5 6-1.5V3c-2.5 0-4.5.4-6 1.5zM8.5 4.5v10"/></svg>`,
  moon: () => `<svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true"><path fill="#fff" d="M10.8 2.2A6.5 6.5 0 1 0 14.8 11 5.5 5.5 0 0 1 10.8 2.2z"/></svg>`,
};
const statusBar = (dark) => { const c = dark ? '#fff' : '#000'; return `<div class="ios-sb" style="color:${c}"><span>9:41</span><span class="ios-sb-r">
  <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><g fill="${c}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>
  <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path fill="${c}" d="M8 2.3c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .6C5.3.6 2.8 1.6.9 3.5L2 4.7a8.5 8.5 0 0 1 6-2.4zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.8 6.8 0 0 0 8 4c-1.8 0-3.4.7-4.7 1.9l1.1 1.2c1-.9 2.2-1.4 3.6-1.4zm0 3.4c-.6 0-1.2.2-1.6.6L8 11.4l1.6-1.7c-.4-.4-1-.6-1.6-.6z"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="${c}" opacity=".4"/><rect x="2" y="2" width="15" height="9" rx="2" fill="${c}"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="${c}" opacity=".45"/></svg></span></div>`; };

const CSS = `
.ios-sb{position:absolute;left:0;right:0;top:0;height:54px;display:flex;align-items:center;justify-content:space-between;padding:6px 34px 0 46px;font:600 17px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;z-index:8}
.ios-sb-r{display:flex;gap:6px;align-items:center}
.ios-body{position:absolute;inset:0;overflow:hidden}
.ios-scroll{position:absolute;inset:0;padding:54px 0 120px}
.ios-navbar{height:44px;display:flex;align-items:center;justify-content:flex-end;padding:0 16px}
.ios-circle{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.75);display:grid;place-items:center;border:0;box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.06);cursor:pointer}
.ios-lt{margin:0;padding:0 16px;font-size:34px;line-height:41px;font-weight:700;letter-spacing:.01em}
.ios-sub{margin:2px 16px 0;font-size:15px;color:${SEC}}
.ios-h{margin:22px 16px 8px;font-size:20px;font-weight:700;letter-spacing:.01em;display:flex;justify-content:space-between;align-items:baseline}
.ios-h small{font-size:15px;font-weight:400;color:${SEC}}
.ios-card{margin:0 16px;background:#fff;border-radius:26px}
.hero-c{position:relative;height:262px;margin-top:14px;overflow:hidden;background:linear-gradient(180deg,#fff,#f4f5f7)}
.hero-img{position:absolute;left:50%;top:6px;height:290px;aspect-ratio:4/5;transform:translateX(-50%)}
.hero-img img{width:100%;height:100%}
.chip{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:4px;height:30px;padding:0 11px 0 9px;border-radius:15px;border:0;cursor:pointer;
  background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(12px) saturate(1.6);backdrop-filter:blur(12px) saturate(1.6);box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 4px 14px rgba(0,0,0,.1);
  font:600 15px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif;color:#000;white-space:nowrap;transition:transform .2s}
.chip:active{transform:translate(-50%,-50%) scale(.94)}
.hero-meta{position:absolute;left:16px;bottom:13px;font-size:13px;color:${SEC};display:flex;gap:6px;align-items:center}
.hero-meta i{width:7px;height:7px;border-radius:50%;background:${GREEN};display:inline-block}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 16px}
.tile{position:relative;height:108px;border-radius:22px;background:#fff;border:0;text-align:left;padding:12px 12px 10px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;
  font-family:inherit;color:#000;transition:transform .15s}
.tile:active{transform:scale(.96)}
.tile .t-top{display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600}
.tile b{font:600 30px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;letter-spacing:-.01em}
.tile span.s{font-size:13px;color:${SEC}}
.tile.heat{background:linear-gradient(160deg,#FFB340,#FF8A00)}
.tile.air{background:linear-gradient(160deg,#5AC8FA,#2D9CDB)}
.tile.heat,.tile.air{color:#fff}.tile.heat span.s,.tile.air span.s{color:rgba(255,255,255,.85)}
.sugg{margin:12px 16px 0;padding:14px 16px;border-radius:22px;background:#fff}
.sugg-h{display:flex;gap:6px;align-items:center;font-size:13px;font-weight:600;color:${INDIGO}}
.sugg p{margin:6px 0 2px;font-size:17px;font-weight:600;line-height:22px}
.sugg small{display:block;font-size:13px;color:${SEC}}
.sugg-b{display:flex;gap:8px;margin-top:12px}
.btn{flex:1;height:38px;border-radius:19px;border:0;font:600 15px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif;cursor:pointer}
.btn.pri{background:${BLUE};color:#fff}.btn.sec{background:${FILL};color:${BLUE}}
.list{margin:0 16px;background:#fff;border-radius:22px;overflow:hidden}
.row{display:flex;align-items:center;gap:12px;min-height:52px;padding:8px 16px;position:relative;border:0;background:transparent;width:100%;text-align:left;font-family:inherit;color:#000;cursor:pointer}
.row+.row::before{content:"";position:absolute;top:0;left:60px;right:0;height:.5px;background:${SEP}}
.row.plain+.row.plain::before{left:16px}
.row .ic{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex:none}
.row .tx{flex:1;min-width:0;display:flex;flex-direction:column}
.row .tx b{font-size:17px;font-weight:400}
.row .tx small{font-size:13px;color:${SEC};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .tag{font-size:13px;font-weight:600;padding:3px 9px;border-radius:9px}
.foot{margin:7px 32px 0;font-size:13px;line-height:18px;color:${SEC}}
.sw{width:51px;height:31px;border-radius:16px;background:rgba(120,120,128,.16);position:relative;flex:none;transition:background .25s}
.sw::after{content:"";position:absolute;left:2px;top:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.15),0 3px 1px rgba(0,0,0,.06);transition:transform .25s}
.sw.on{background:${GREEN}}.sw.on::after{transform:translateX(20px)}
.red{color:${RED}!important;justify-content:center}
.tabbar{position:absolute;z-index:6;left:21px;right:21px;bottom:22px;height:64px;border-radius:32px;display:grid;grid-template-columns:repeat(3,1fr);padding:4px;
  background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(20px) saturate(1.8);backdrop-filter:blur(20px) saturate(1.8);box-shadow:0 0 0 .5px rgba(0,0,0,.08),0 8px 30px rgba(0,0,0,.1)}
.tabbar button{border:0;background:transparent;border-radius:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font:500 10px/1.2 -apple-system,BlinkMacSystemFont,Inter,sans-serif;color:#000;cursor:pointer}
.tabbar button[aria-selected="true"]{background:rgba(120,120,128,.14);color:${BLUE}}
.dim{position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.22);opacity:0;pointer-events:none;transition:opacity .35s}
.dim.on{opacity:1;pointer-events:auto}
.sheet{position:absolute;z-index:11;left:8px;right:8px;bottom:8px;height:590px;border-radius:44px;background:#fff;transform:translateY(105%);transition:transform .45s cubic-bezier(.2,.9,.25,1);padding:10px 22px 0}
.sheet.on{transform:none}
.grab{width:36px;height:5px;border-radius:3px;background:rgba(60,60,67,.3);margin:0 auto 10px}
.sh-h{display:flex;justify-content:space-between;align-items:center}
.sh-h h4{margin:0;font-size:22px;font-weight:700}
.sh-state{margin:4px 0 0;font-size:15px;color:${SEC};min-height:20px}
.slider-wrap{display:flex;justify-content:center;gap:22px;margin-top:22px}
.vs{position:relative;width:118px;height:364px;border-radius:38px;background:${FILL};overflow:hidden;touch-action:none;cursor:ns-resize}
.vs .fill{position:absolute;left:0;right:0;transition:top .18s,bottom .18s,background .2s}
.vs .mid{position:absolute;left:30px;right:30px;top:50%;height:2px;margin-top:-1px;background:rgba(60,60,67,.25);border-radius:1px}
.vs .glyph{position:absolute;left:0;right:0;display:grid;place-items:center;pointer-events:none}
.ticks{display:flex;flex-direction:column;justify-content:space-between;height:364px;padding:14px 0}
.ticks button{border:0;background:transparent;font:500 15px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif;color:${SEC};text-align:left;cursor:pointer;padding:2px 0;min-width:76px}
.ticks button.on{color:#000;font-weight:700}
.sh-foot{margin:22px 4px 0;font-size:13px;line-height:18px;color:${SEC};text-align:center}
.lock{position:relative;width:100%;height:100%;border-radius:52px;overflow:hidden;color:#fff;
  background:radial-gradient(120% 70% at 20% 10%,#5b6cff 0%,rgba(91,108,255,0) 55%),radial-gradient(90% 60% at 90% 80%,#ff8a3d 0%,rgba(255,138,61,0) 60%),linear-gradient(180deg,#1b2a6b,#0b0f24)}
.lock .date{position:absolute;left:0;right:0;top:92px;text-align:center;font:600 21px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif;opacity:.9}
.lock .clock{position:absolute;left:0;right:0;top:112px;text-align:center;font:600 112px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;letter-spacing:-.02em}
.la{position:absolute;left:12px;right:12px;bottom:118px;border-radius:26px;padding:15px 16px 14px;background:rgba(30,30,32,.5);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6)}
.la-top{display:flex;justify-content:space-between;align-items:center}
.la-l{display:flex;gap:10px;align-items:center}
.la-ic{width:40px;height:40px;border-radius:12px;background:rgba(255,149,0,.22);display:grid;place-items:center}
.la b{display:block;font-size:17px}.la small{display:block;font-size:14px;opacity:.7}
.la-t{font:600 30px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;color:${ORANGE};font-variant-numeric:tabular-nums}
.la-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.18);margin-top:13px;overflow:hidden}.la-bar i{display:block;height:100%;width:60%;background:${ORANGE};border-radius:3px}
.la-z{display:flex;gap:14px;margin-top:10px;font-size:13px;opacity:.75}
.lock .torch{position:absolute;bottom:46px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.lock .home{position:absolute;left:50%;bottom:9px;width:140px;height:5px;margin-left:-70px;border-radius:3px;background:#fff}
.di{width:393px;height:240px;border-radius:44px;background:linear-gradient(180deg,#e9ecf0,#dfe3e8);position:relative;overflow:hidden}
.di-pill{position:absolute;left:50%;top:22px;transform:translateX(-50%);background:#000;color:#fff;border-radius:44px;display:flex;flex-direction:column;padding:16px 20px;width:360px;height:150px}
.di-pill .r1{display:flex;justify-content:space-between;align-items:center}
.di-pill .r1 b{font-size:16px}
.di-pill .big{font:600 34px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",Inter,sans-serif;color:${ORANGE};font-variant-numeric:tabular-nums}
.di-pill .r2{display:flex;justify-content:space-between;margin-top:16px;gap:8px}
.di-pill .r2 button{flex:1;height:40px;border-radius:20px;border:0;background:rgba(255,255,255,.14);color:#fff;font:600 15px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif}
.di-compact{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);height:37px;width:220px;border-radius:20px;background:#000;display:flex;justify-content:space-between;align-items:center;padding:0 14px;color:${ORANGE};font:600 15px/1 -apple-system,BlinkMacSystemFont,Inter,sans-serif}
.wg{width:170px;height:170px;border-radius:24px;background:#fff;padding:14px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 10px 30px -14px rgba(0,0,0,.3);color:#000}
.wg-h{font-size:13px;font-weight:600;display:flex;justify-content:space-between}
.wg-row{display:flex;justify-content:space-between;align-items:center;font-size:15px}
.wg-row b{font-weight:600;display:flex;gap:4px;align-items:center}
`;

export function initApp(host, glanceHost, onZones, onPosture) {
  if (!host) return;
  // every rule is scoped to the phone and the glance row, so names like .row or .dim never reach the page
  const scoped = CSS.replace(/(^|})\s*([^{}@]+)\{/g, (m, close, sel) => `${close}
${sel.split(',').map((x) => `.ios ${x.trim()}`).join(',')}{`);
  const st = document.createElement('style'); st.textContent = scoped; document.head.appendChild(st);
  host.classList.add('ios'); if (glanceHost) glanceHost.classList.add('ios');
  host.innerHTML = `<div class="device"><div class="screen"><div class="island"><span class="il-l">${I.flame(ORANGE, 15)}</span><span class="il-r num">30:00</span></div>
    ${statusBar(false)}<div class="ios-body"></div><div class="dim"></div><div class="sheet" role="dialog" aria-label="${tr("调区域", "Adjust zone")}"></div>
    <nav class="tabbar" role="tablist"></nav></div></div>`;
  const body = host.querySelector('.ios-body'), sheet = host.querySelector('.sheet'), dim = host.querySelector('.dim'), tabbar = host.querySelector('.tabbar'), island = host.querySelector('.island');
  const S = { tab: 'home', zone: null, z: { A: 1, B: 0, C: 2 }, scene: 'work', ai: true, auto: true, sugg: 'open', t0: performance.now() };
  // v: -3..3 (negative = air level, positive = heat level)
  const emit = () => { const o = {}; for (const z of 'ABC') { const v = S.z[z]; o[z] = v > 0 ? ['heat', v] : v < 0 ? ['air', -v] : ['off', 0]; } onZones && onZones(o); };
  const desc = (v) => v > 0 ? tr(`加热 ${v} 档`, `heat ${v}`) : v < 0 ? tr(`风 ${-v} 档`, `air ${-v}`) : tr('关', 'off');
  const big = (v) => v > 0 ? TEMP[v] + '°' : v < 0 ? tr('风 ', 'Air ') + (-v) : tr('关', 'Off');
  const chip = (z) => { const v = S.z[z]; return `<button class="chip" data-zone="${z}" style="left:${POS[z][0] * 100}%;top:${POS[z][1] * 100}%" aria-label="${ZN[z]}${tr('，', ', ')}${desc(v)}">${v > 0 ? I.flame() : v < 0 ? I.wind() : I.off()}<span style="color:${v > 0 ? '#C93400' : v < 0 ? '#0071A4' : SEC}">${v > 0 ? TEMP[v] + '°' : v < 0 ? tr('风', 'Air ') + -v : tr('关', 'Off')}</span></button>`; };
  const home = () => `<div class="ios-scroll">
    <div class="ios-navbar"><button class="ios-circle" aria-label="${tr("更多", "More")}"><svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true"><g fill="#000"><circle cx="2" cy="2" r="2"/><circle cx="9" cy="2" r="2"/><circle cx="16" cy="2" r="2"/></g></svg></button></div>
    <h1 class="ios-lt">${tr("小气候", "Microclimate")}</h1><p class="ios-sub">${tr("办公室的椅子，已连接，电量 64%", "Office chair, connected, 64% battery")}</p>
    <div class="ios-card hero-c"><div class="hero-img"><img src="assets/app/s_08.webp" alt="${tr(tr('椅子', "Chair"), 'Chair')}">${chip('A')}${chip('B')}${chip('C')}</div>
      <div class="hero-meta"><i></i>${tr("坐着 18 分钟", "Seated 18 min")}</div></div>
    <div class="ios-h">${tr("三个区", "Zones")}<small>${tr("点开调", "Tap to adjust")}</small></div>
    <div class="tiles">${['A', 'B', 'C'].map((z) => { const v = S.z[z]; return `<button class="tile ${v > 0 ? 'heat' : v < 0 ? 'air' : ''}" data-zone="${z}" aria-label="${ZN[z]}${tr('，', ', ')}${desc(v)}">
      <span class="t-top">${ZN[z]}${v > 0 ? I.flame('#fff', 14) : v < 0 ? I.wind('#fff', 14) : ''}</span><span><b>${big(v)}</b><br><span class="s">${desc(v)}</span></span></button>`; }).join('')}</div>
    ${S.sugg === 'open' ? `<div class="sugg"><div class="sugg-h">${I.spark()}${tr("AI 建议", "AI suggestion")}</div><p>${tr("看书时把靠背放到 16° 吗？", "Recline to 16° while you read?")}</p><small>${tr("这周你有 4 次看书时这样调。", "You did this 4 times this week while reading.")}</small>
      <div class="sugg-b"><button class="btn pri" data-act="sugg-yes">${tr("调整", "Adjust")}</button><button class="btn sec" data-act="sugg-no">${tr("不用", "Not now")}</button></div></div>`
      : `<div class="sugg"><div class="sugg-h">${I.spark()}${tr("AI 建议", "AI suggestion")}</div><p style="font-weight:400;font-size:15px;color:${SEC}">${S.sugg === 'yes' ? tr('靠背正在调到 16°，停稳 5 秒后再调腰托。', "Reclining to 16°. The lumbar follows 5 seconds after.") : tr('好的，这次不调。', "OK, not this time.")}</p></div>`}
  </div>`;
  const SC = [['work', tr('办公', "Work"), I.brief(), BLUE, tr('靠背 8°，腰托 205，座垫加热 2', "Back 8°, lumbar 205, seat heat 2")], ['read', tr('阅读', "Reading"), I.book(), ORANGE, tr('靠背 16°，腰托 195，上背风 1', "Back 16°, lumbar 195, upper back air 1")], ['rest', tr('休息', "Rest"), I.moon(), INDIGO, tr('靠背 26°，腰托 182，三区加热', "Back 26°, lumbar 182, all zones on heat")]];
  const scenes = () => `<div class="ios-scroll"><div class="ios-navbar"></div><h1 class="ios-lt">${tr("场景", "Scenes")}</h1>
    <div class="list" style="margin-top:18px">${SC.map(([id, n, ic, c, s]) => `<button class="row" data-scene="${id}"><span class="ic" style="background:${c}">${ic}</span>
      <span class="tx"><b>${n}</b><small>${s}</small></span>${S.scene === id ? I.check() : ''}</button>`).join('')}</div>
    <p class="foot">${tr("换场景时，椅子先调靠背，停稳 5 秒再调腰托。", "When you switch scenes, the chair sets the back first and the lumbar 5 seconds later.")}</p>
    <div class="list" style="margin-top:28px"><button class="row plain" data-act="auto"><span class="tx"><b>${tr("自动换场景", "Switch scenes automatically")}</b></span><span class="sw ${S.auto ? 'on' : ''}"></span></button></div>
    <p class="foot">${tr("椅子觉得你换了场景时，先在扶手屏幕上问你，你按了才换。", "When the chair thinks your scene has changed, it asks on the armrest screen first and switches only if you confirm.")}</p></div>`;
  const ai = () => `<div class="ios-scroll"><div class="ios-navbar"></div><h1 class="ios-lt">AI</h1>
    <div class="list" style="margin-top:18px"><button class="row plain" data-act="ai"><span class="tx"><b>${tr("让 AI 调整", "Let the AI adjust")}</b></span><span class="sw ${S.ai ? 'on' : ''}"></span></button></div>
    <p class="foot">${tr("只用你保存过的修改来学。记录存在椅子里，不上传。", "It learns only from changes you saved. The record stays on the chair and is never uploaded.")}</p>
    <div class="ios-h" style="font-size:15px;font-weight:400;color:${SEC};margin:26px 32px 7px">${tr("它能动的", "What it can change")}</div>
    <div class="list">${[[tr('三个区的档位', "Zone levels"), ORANGE], [tr('靠背角度，每次最多 8°', "Recline, up to 8° at a time"), INDIGO], [tr('腰托高度，每次最多 10 mm', "Lumbar height, up to 10 mm at a time"), INDIGO], [tr('腰托深度，每次最多 5 mm', "Lumbar depth, up to 5 mm at a time"), INDIGO]].map(([t, c]) => `<div class="row plain"><span class="tx"><b>${t}</b></span>${I.check(c)}</div>`).join('')}</div>
    <p class="foot">${tr("两次调整至少隔 10 分钟。座高、座深、扶手和头枕它不碰。", "At least 10 minutes between changes. It never touches seat height, seat depth, the armrests or the headrest.")}</p>
    <div class="ios-h" style="font-size:15px;font-weight:400;color:${SEC};margin:26px 32px 7px">${tr("最近学到的", "Recently learned")}</div>
    <div class="list"><div class="row plain"><span class="tx"><b>${tr("座垫 关 → 风 2", "Seat off → air 2")}</b><small>${tr("今天 14:10，屋里 26°C", "Today 14:10, room at 26°C")}</small></span><span class="tag" style="background:rgba(52,199,89,.15);color:#248A3D">${tr("已学", "Learned")}</span></div>
      <div class="row plain"><span class="tx"><b>${tr("靠背 14° → 16°", "Back 14° → 16°")}</b><small>${tr("今天 10:05，没有保存", "Today 10:05, not saved")}</small></span><span class="tag" style="background:${FILL};color:${SEC}">${tr("只用一次", "Used once")}</span></div></div>
    <div class="list" style="margin-top:28px"><button class="row plain red" data-act="noop"><span style="color:${RED}">${tr("删除学习记录", "Delete learning history")}</span></button></div></div>`;
  const tabs = () => { tabbar.innerHTML = [['home', tr('椅子', "Chair"), I.chair], ['scenes', tr('场景', "Scenes"), I.stack], ['ai', 'AI', I.ai]].map(([id, n, ic]) =>
    `<button role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${ic(S.tab === id ? BLUE : '#000')}<span>${n}</span></button>`).join(''); };
  const render = () => { body.innerHTML = S.tab === 'home' ? home() : S.tab === 'scenes' ? scenes() : ai(); tabs(); live(); };
  // the sheet
  const DET = [3, 2, 1, 0, -1, -2, -3], H = 364;
  const sheetHTML = (z) => `<div class="grab"></div><div class="sh-h"><h4>${ZN[z]}</h4><button class="ios-circle" data-act="close" aria-label="${tr("关闭", "Close")}" style="width:30px;height:30px;background:${FILL};box-shadow:none">${I.x()}</button></div>
    <p class="sh-state"></p><div class="slider-wrap"><div class="vs" role="slider" tabindex="0" aria-label="${ZN[z]}${tr('档位', ' level')}" aria-valuemin="-3" aria-valuemax="3"><div class="fill"></div><div class="mid"></div><div class="glyph g-top" style="top:22px">${I.flame(ORANGE, 22)}</div><div class="glyph g-bot" style="bottom:22px">${I.wind(CYAN, 22)}</div></div>
    <div class="ticks">${DET.map((v) => `<button data-v="${v}">${v > 0 ? tr(`热 ${v}　${TEMP[v]}°`, `Heat ${v}  ${TEMP[v]}°`) : v < 0 ? tr(`风 ${-v}`, `Air ${-v}`) : tr('关', 'Off')}</button>`).join('')}</div></div><p class="sh-foot"></p>`;
  const sheetUpdate = () => {
    const z = S.zone; if (!z) return; const v = S.z[z], vs = sheet.querySelector('.vs'), f = sheet.querySelector('.fill');
    const y = (val) => (3 - val) / 6 * (H - 52) + 26;          // centre of each detent
    if (v > 0) { f.style.top = (y(v) - 26) + 'px'; f.style.bottom = (H / 2) + 'px'; f.style.background = `linear-gradient(180deg,#FF7A00,#FFB340)`; }
    else if (v < 0) { f.style.top = (H / 2) + 'px'; f.style.bottom = (H - y(v) - 26) + 'px'; f.style.background = `linear-gradient(0deg,#1E8FD6,#5AC8FA)`; }
    else { f.style.top = (H / 2) + 'px'; f.style.bottom = (H / 2) + 'px'; }
    vs.setAttribute('aria-valuenow', v); vs.setAttribute('aria-valuetext', desc(v));
    sheet.querySelectorAll('.ticks button').forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
    sheet.querySelector('.sh-state').textContent = v > 0 ? tr(`加热 ${v} 档，表面 ${TEMP[v]}°C`, `Heat ${v}, surface ${TEMP[v]}°C`) : v < 0 ? tr(`风 ${-v} 档`, `Air ${-v}`) : tr('关着', 'Off');
    sheet.querySelector('.sh-foot').textContent = v > 0 ? tr('加热每次最长 30 分钟，到时间自动关。剩余时间显示在锁屏上。', "Heat runs for 30 minutes at most, then turns off. The time left shows on the Lock Screen.") : v < 0 ? tr('吹风时电热丝不通电。', "The heating wire is off while air runs.") : tr('往上拖是加热，往下拖是风。', "Drag up for heat, down for air.");
  };
  const setZ = (z, v) => { if (S.z[z] === v) return; S.z[z] = v; if (v > 0) S.t0 = performance.now(); emit(); sheetUpdate(); };
  const openSheet = (z) => { S.zone = z; sheet.innerHTML = sheetHTML(z); sheet.classList.add('on'); dim.classList.add('on'); sheetUpdate(); bindSlider(); };
  const closeSheet = () => { S.zone = null; sheet.classList.remove('on'); dim.classList.remove('on'); render(); };
  function bindSlider() {
    const vs = sheet.querySelector('.vs');
    const fromY = (e) => { const r = vs.getBoundingClientRect(), k = (e.clientY - r.top) / r.height; return Math.max(-3, Math.min(3, Math.round(3 - k * 6))); };
    let drag = false;
    vs.addEventListener('pointerdown', (e) => { drag = true; vs.setPointerCapture(e.pointerId); setZ(S.zone, fromY(e)); });
    vs.addEventListener('pointermove', (e) => { if (drag) setZ(S.zone, fromY(e)); });
    vs.addEventListener('pointerup', () => { drag = false; }); vs.addEventListener('pointercancel', () => { drag = false; });
    vs.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); setZ(S.zone, Math.min(3, S.z[S.zone] + 1)); } if (e.key === 'ArrowDown') { e.preventDefault(); setZ(S.zone, Math.max(-3, S.z[S.zone] - 1)); } });
  }
  host.addEventListener('click', (e) => {
    const t = e.target.closest('button,[data-zone]'); if (!t || !host.contains(t)) return;
    if (t.dataset.tab) { S.tab = t.dataset.tab; render(); return; }
    if (t.dataset.zone) { openSheet(t.dataset.zone); return; }
    if (t.dataset.v !== undefined) { setZ(S.zone, +t.dataset.v); return; }
    if (t.dataset.scene) { S.scene = t.dataset.scene; const m = { work: [1, 0, 2, 8, 205], read: [-1, 0, 0, 16, 195], rest: [2, 2, 1, 26, 182] }[S.scene];
      S.z = { A: m[0], B: m[1], C: m[2] }; S.t0 = performance.now(); emit(); onPosture && onPosture(m[3], m[4]); render(); return; }
    const a = t.dataset.act;
    if (a === 'close') closeSheet();
    if (a === 'sugg-yes') { S.sugg = 'yes'; onPosture && onPosture(16, 195); render(); }
    if (a === 'sugg-no') { S.sugg = 'no'; render(); }
    if (a === 'ai') { S.ai = !S.ai; render(); }
    if (a === 'auto') { S.auto = !S.auto; render(); }
  });
  dim.addEventListener('click', closeSheet);
  // Live Activity in the island while any zone heats
  function live() { const on = Object.values(S.z).some((v) => v > 0); island.classList.toggle('live', on); }
  setInterval(() => { const left = Math.max(0, 1800 - (performance.now() - S.t0) / 1000), m = Math.floor(left / 60), s = Math.floor(left % 60);
    const t = `${m}:${String(s).padStart(2, '0')}`; island.querySelector('.il-r').textContent = t; document.querySelectorAll('.ios .tmr').forEach((e) => { e.textContent = t; }); live(); }, 1000);
  render(); emit();
  // scale the phone to the space it has
  const fit = () => { const narrow = innerWidth < 760; const s = narrow ? Math.min(1, (innerWidth - 40) / 393) : Math.min(1, (innerHeight - 110) / 852, 360 / 393);
    host.style.setProperty('--s', s.toFixed(3)); };
  fit(); addEventListener('resize', fit);

  // Lock Screen, Dynamic Island, widget
  if (glanceHost) {
    const ph = (inner, s) => `<div class="iphone" style="--s:${s}"><div class="device"><div class="screen" style="background:#000">${inner}</div></div></div>`;
    glanceHost.innerHTML = `
      <figure>${ph(`<div class="lock">${statusBar(true)}<div class="date">${tr("11月5日 星期三", "Wednesday, November 5")}</div><div class="clock">9:41</div>
        <div class="la"><div class="la-top"><div class="la-l"><span class="la-ic">${I.flame(ORANGE, 22)}</span><span><b>${tr("座垫加热 2 档", "Seat heat 2")}</b><small>${tr("35°C，到时间自动关", "35°C, turns off on time")}</small></span></div><span class="la-t tmr">18:24</span></div>
        <div class="la-bar"><i></i></div><div class="la-z"><span>${tr("上背 加热 1", "Upper heat 1")}</span><span>${tr("腰 关", "Lower off")}</span><span>${tr("座垫 加热 2", "Seat heat 2")}</span></div></div>
        <span class="torch" style="left:46px"></span><span class="torch" style="right:46px"></span><span class="home"></span></div>`, .62)}
        <figcaption>${tr("锁屏上的实时活动：哪个区在加热、还剩多久。", "A Live Activity on the Lock Screen: which zone is heating and how long is left.")}</figcaption></figure>
      <figure><div class="di"><div class="di-pill"><div class="r1"><span style="display:flex;gap:8px;align-items:center">${I.flame(ORANGE, 20)}<b>${tr("座垫加热 2 档", "Seat heat 2")}</b></span><span class="big tmr">18:24</span></div>
        <div class="r2"><button>${tr("打开 App", "Open app")}</button><button>${tr("关掉加热", "Turn off heat")}</button></div></div><div class="di-compact">${I.flame(ORANGE, 15)}<span class="tmr">18:24</span></div></div>
        <figcaption>${tr("灵动岛：平时只显示火焰和剩余时间，长按展开，可以直接关掉加热。", "The Dynamic Island shows a flame and the time left; press and hold to open it and turn the heat off.")}</figcaption>
        <div style="height:28px"></div>
        <div class="wg"><div class="wg-h"><span>${tr("小气候", "Microclimate")}</span>${I.spark(INDIGO, 14)}</div>
          <div class="wg-row"><span>${tr("上背", "Upper")}</span><b style="color:#C93400">${I.flame(ORANGE, 13)}33°</b></div>
          <div class="wg-row"><span>${tr("腰", "Lower")}</span><b style="color:${SEC}">${tr('关', 'Off')}</b></div>
          <div class="wg-row"><span>${tr("座垫", "Seat")}</span><b style="color:#C93400">${I.flame(ORANGE, 13)}35°</b></div></div>
        <figcaption>${tr("小组件：三个区的状态，点一下打开对应的区。", "A widget with the three zones; tap one to open it.")}</figcaption></figure>`;
  }
}
