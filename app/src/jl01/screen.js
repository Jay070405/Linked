// The JL-01's dot-matrix display: everything on it is drawn as dots on a 96 x 64 grid, then painted to a texture.
import {CanvasTexture, SRGBColorSpace} from 'three';
import {RUN} from './game';

const GW = 96, GH = 64, CELL = 8;

// a 3 x 5 bitmap font: five rows per glyph, each row three bits
const F = {A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34652', 7: '71222', 8: '25252', 9: '25316', '-': '00700', '.': '00002', '!': '22202', ':': '02020', '/': '11244', '>': '42124', '<': '12421', ',': '00024', "'": '22000', '=': '07070', '+': '02720'};

// Jay, the pixel blue jay: X body, O belly, B beak, L legs, E eyes (one square, one round)
export const JAY = [
  '........XX.......',
  '.......XXX.......',
  '......XXXX.......',
  '....XXXXXXXXX....',
  '...XXXXXXXXXXX...',
  '...XEEEXXXXXEXX..',
  '...XEEEXXXXEEEX..',
  '...XEEEXBBXXEXX..',
  '...XXXXXBBXXXXX..',
  '...XXOOOOOOOOXX..',
  '...XXOOOOOOOOXX..',
  '...XXXOOOOOOXXX..',
  '....XXXXXXXXXX...',
  '.....LL....LL....',
];
const LEGS = ['.....LL....LL....', '.......LL.LL.....'];
const INK = {X: '#3d63ff', L: '#ff8a2b', O: '#ffffff', B: '#ff8a2b', E: '#0c0e13'};
// Jay off the screen, in his own colours: the walker that follows the scroll along the bottom rail
export function drawJay(g, k, step, flip) {
  g.clearRect(0, 0, 17 * k, 14 * k);
  JAY.forEach((r, j) => { const row = j === 13 ? LEGS[step] : r;
    for (let i = 0; i < 17; i++) { const ch = row[i]; if (ch === '.') continue; g.fillStyle = INK[ch]; g.fillRect((flip ? 16 - i : i) * k, j * k, k, k); } });
}

const PAL = {
  // 0 off, 1 text, 2 body, 3 belly, 4 beak, 5 dim, 6 accent, 7 extra
  mono: ['#0e1211', '#e9f1ee', '#e9f1ee', '#ffffff', '#8b9692', '#6d7774', '#ff6a2b', '#aab4b0'],
  game: ['#191b20', '#f4ecdc', '#3d63ff', '#ffffff', '#ff8a2b', '#ffc83d', '#ff5533', '#2fa36b'],
};
// a cover picture on a dot matrix: four greys through an ordered dither for the product machine, a small colour set for the game one
const RAMP = ['#0e1211', '#48524f', '#98a39f', '#e9f1ee'];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const STRIP = 255;

export const clockText = s => { const n = Math.max(0, Math.floor(s)); return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };

export function createScreen() {
  const cv = document.createElement('canvas'); cv.width = GW * CELL; cv.height = GH * CELL;
  const g = cv.getContext('2d');
  const lo = document.createElement('canvas'); lo.width = GW; lo.height = GH;
  const l = lo.getContext('2d', {willReadFrequently: true});
  const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8;
  const buf = new Uint8Array(GW * GH);
  const covers = new Map();

  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < GW && y < GH) buf[y * GW + x] = c; };
  const textW = (s, k = 1) => s.length * 4 * k - k;
  const text = (s, x, y, c = 1, k = 1) => {
    [...s].forEach((ch, n) => { const gl = F[ch]; if (!gl) return;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (+gl[j] & (4 >> i))
        for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) set(x + n * 4 * k + i * k + a, y + j * k + b, c); });
  };
  const ctext = (s, y, c = 1, k = 1) => text(s, Math.round((GW - textW(s, k)) / 2), y, c, k);
  const fit = (s, y, c, max = 4) => { let k = max; while (k > 1 && textW(s, k) > GW - 8) k--; ctext(s, y, c, k); return k; };
  // names the bitmap font cannot spell (a company name in Chinese): the system font, thresholded to dots
  const han = (s, x, y, c) => {
    l.clearRect(0, 0, GW, GH); l.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif'; l.textBaseline = 'top'; l.fillStyle = '#fff'; l.fillText(s, x, y);
    const d = l.getImageData(0, 0, GW, GH).data; for (let i = 0; i < GW * GH; i++) if (d[i * 4 + 3] > 105) buf[i] = c;
  };
  const jay = (x, y, closed, k = 1) => JAY.forEach((r, j) => { for (let i = 0; i < r.length; i++) { let ch = r[i]; if (ch === '.') continue;
    if (ch === 'E' && closed && j !== 6) ch = 'X';
    const c = ch === 'X' || ch === 'L' ? 2 : ch === 'O' ? 3 : ch === 'B' ? 4 : 0;
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) set(x + i * k + a, y + j * k + b, c); } });
  const bar = (y, p, w = 60) => { const x0 = Math.round((GW - w) / 2); for (let x = 0; x < w; x++) { set(x0 + x, y, 5); if (x < p * w) { set(x0 + x, y - 1, 1); set(x0 + x, y, 1); set(x0 + x, y + 1, 1); } } };
  // a work's cover, reduced once to one colour per dot
  const cover = src => {
    if (!src) return null;
    let e = covers.get(src);
    if (!e) { e = {}; covers.set(src, e);
      const im = new Image();
      im.onload = () => {
        const k = Math.max(GW / im.width, GH / im.height), w = im.width * k, h = im.height * k;
        l.clearRect(0, 0, GW, GH); l.drawImage(im, (GW - w) / 2, (GH - h) / 2, w, h);
        const d = l.getImageData(0, 0, GW, GH).data, mono = [], game = [];
        for (let y = 0, i = 0; y < GH; y++) for (let x = 0; x < GW; x++, i++) {
          const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], th = (BAYER[y & 3][x & 3] + .5) / 16 - .5;
          mono.push(RAMP[Math.max(0, Math.min(3, Math.round((.299 * r + .587 * gg + .114 * b) / 255 * 3 + th * .9)))]);
          const q = v => Math.max(0, Math.min(255, Math.round(v / 255 * 4 + th * .7) * 64));
          game.push(`rgb(${q(r)},${q(gg)},${q(b)})`);
        }
        e.mono = mono; e.game = game;
      };
      im.src = src; }
    return e.mono ? e : null;
  };

  function draw({phase, t, now, side, pick, company, part = 0, label = '', work, index = 0, total = 3, print = 0, run, score = '', num = 0}) {
    buf.fill(0);
    const blink = now % 3.7 < .14;
    let bright = 1, pic = null;
    if (phase === 'standby') {
      bright = .78 + Math.sin(now * 1.6) * .08;
      jay(27, 9 + (Math.sin(now * 1.6) > .3 ? 1 : 0), true, 2);
      const k = Math.floor(now * 1.5) % 3;
      text('Z', 66, 14, 5, 2); if (k > 0) text('Z', 75, 8, 5); if (k > 1) text('Z', 81, 3, 5);
      if (now % 1.2 < .8) ctext('PRESS ANY KEY', 52, 1);
    } else if (phase === 'boot') {
      if (t < .22) { const w = Math.round(GW * t / .22 / 2); for (let x = GW / 2 - w; x < GW / 2 + w; x++) { set(x, 31, 1); set(x, 32, 1); } }
      else { ctext('JL-01', 14, 1, 3); ctext('JAY LIN', 35, 5); bar(48, Math.min(1, (t - .3) / 1.0)); }
    } else if (phase === 'choose') {
      jay(31, 2, blink, 2);
      ctext('INSERT CARTRIDGE', 35, 1);
      text('< PRODUCT', 6, 46, pick === 'product' ? 1 : 5); text('GAME >', 68, 46, pick === 'game' ? 1 : 5);
      if (now % .9 < .6) { const [x0, w] = pick === 'product' ? [6, 35] : [68, 23]; for (let x = 0; x < w; x++) set(x0 + x, 53, 6); }
    } else if (phase === 'load') {
      jay(31, 8 - (t > .3 && t < .52 ? 4 : 0), false, 2);
      ctext('LOADING' + '.'.repeat(1 + Math.floor(now * 6) % 3), 46, 1);
    } else if (phase === 'hello') {
      text('HELLO,', 6, 6, 1, 2);
      const who = company || 'PLAYER 1';
      if (/^[\x20-\x7e]+$/.test(who)) text(who.toUpperCase().slice(0, 20), 6, 22, 6, who.length > 10 ? 1 : 2); else han(who, 6, 19, 6);
      text(side === 'game' ? 'GAME DESIGN' : 'PRODUCT', 6, 40, 5);
      text('SCROLL', 6, 52, 1); const a = Math.floor(now * 3) % 3; for (let i = 0; i < 3; i++) { set(33 + i, 53 + a, 6); set(33 + i, 52 + a, i === 1 ? 0 : 6); }
      jay(74, 40, blink);
    } else if (phase === 'who') {
      text('ABOUT', 3, 2, 5); text('0' + (part + 1) + '/05', GW - 21, 2, 5);
      fit(label, 20, 1, 3);
      for (let i = 0; i < 5; i++) for (let x = 0; x < 12; x++) { set(14 + i * 14 + x, 50, i === part ? 6 : 5); if (i === part) set(14 + i * 14 + x, 51, 6); }
    } else if (phase === 'work') {
      const nm = (work?.short || '').slice(0, 14), e = cover(work?.img);
      if (e) pic = side === 'game' ? e.game : e.mono; else fit(nm, 20, 1, 4);
      for (let i = 53 * GW; i < GW * GH; i++) buf[i] = STRIP;
      text(String(index + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0'), 3, 56, 5); text(nm, GW - textW(nm) - 3, 56, 1);
    } else if (phase === 'run' && run) { // the game: see game.js
      const gy = RUN.ground, jx = RUN.jx;
      [...'GRF'].forEach((ch, i) => { text(ch, 4 + i * 8, 3, run.got[i] ? 6 : 5); if (run.got[i]) for (let x = 0; x < 5; x++) set(3 + i * 8 + x, 9, 6); });
      if (run.demo && now % 1 < .6) text('DEMO', GW - 19, 3, 5);
      for (let x = 0; x < GW; x++) if ((x + Math.floor(run.dist)) % 6 < 3) set(x, gy + 1, 5);
      run.obs.forEach(o => { const x0 = Math.round(o.x);
        for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) set(x0 + x, gy - y, o.bumped ? 5 : 1);
        if (o.token >= 0 && !(o.done && !o.bumped)) text('GRF'[o.token], x0 + 1, gy - o.h - 8, o.ghost ? 5 : 6); });
      if (!(run.hit > 0 && Math.floor(now * 16) % 2)) jay(jx, gy - 13 - Math.round(run.h), run.hit > 0, 1);
      if (run.land > 0) { const k = Math.round((1 - run.land / .18) * 3), up = k > 1 ? 1 : 0; set(jx + 1 - k, gy - up, 5); set(jx + 15 + k, gy - up, 5); if (k < 2) { set(jx - k, gy - 1, 5); set(jx + 16 + k, gy - 1, 5); } } // a little dust where he lands
      if (run.clear > 0) { ctext('CLEAR!', 16, 6, 2); run.sparks.forEach((p, i) => set(Math.round(p.x), Math.round(p.y), i % 2 ? 4 : 6)); if (run.clear > 1.2 && now % 1 < .6) ctext('SPACE = AGAIN', 58, 5); }
      else if (run.demo && now % 1 < .6) ctext('SPACE = JUMP', 58, 1);
    } else if (phase === 'score') { // the numbers stand in the room behind the machine; its own screen keeps the tally
      text('HI-SCORE', 3, 3, 5); text('0' + (num + 1) + '/04', GW - 21, 3, 5);
      fit(score, 20, 6, 4);
      jay(76, 46, blink); for (let i = 0; i < 4; i++) for (let x = 0; x < 10; x++) { set(4 + i * 13 + x, 56, i === num ? 6 : 5); if (i === num) set(4 + i * 13 + x, 57, 6); }
    } else { // printing the receipt
      if (print < 1) { ctext('PRINTING', 14, 1, 2); bar(36, print, 72); ctext("LET'S WORK", 48, 5); }
      else { ctext('THANK', 8, 1, 3); ctext('YOU', 28, 6, 3); jay(76, 46, blink); text('JL-01', 4, 55, 5); }
    }
    const pal = PAL[side === 'game' ? 'game' : 'mono'];
    g.globalAlpha = 1; g.fillStyle = '#060808'; g.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0, i = 0; y < GH; y++) for (let x = 0; x < GW; x++, i++) {
      const c = buf[i];
      g.globalAlpha = c && c !== STRIP ? bright : 1;
      g.fillStyle = c === STRIP ? pal[0] : c ? pal[c] : pic ? pic[i] : pal[0];
      g.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    }
    tex.needsUpdate = true;
  }
  return {tex, draw};
}
