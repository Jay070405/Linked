// Jay, the pixel blue jay, as data and as a 2D drawing. No three.js here: every page of the site can draw him.
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
export function drawJay(g, k, step, flip) { g.clearRect(0, 0, 17 * k, 14 * k); paintJay(g, k, step, flip); }
// the same, onto a picture that has other things in it: nothing is cleared first
export function paintJay(g, k, step, flip) {
  JAY.forEach((r, j) => { const row = j === 13 ? LEGS[step] : r;
    for (let i = 0; i < 17; i++) { const ch = row[i]; if (ch === '.') continue; g.fillStyle = INK[ch]; g.fillRect((flip ? 16 - i : i) * k, j * k, k, k); } });
}

// The cat. Jay Lin's own, drawn the way Jay is drawn: a rounded block and two ears, flat colours, the round eye's cross for a pupil.
// Grey mask and ears, a white blaze that widens down the face, pink nose, olive eyes. It is asleep nearly all the time.
// G fur, P ear and nose, W white, Y eye, K pupil.
export const CAT = [
  '..G...........G..',
  '.GGG.........GGG.',
  '.GPGG.......GGPG.',
  '.GGGGGGGGGGGGGGG.',
  'GGGGGGGGWGGGGGGGG',
  'GGGGGGGWWWGGGGGGG',
  'GGYKYGGWWWGGYKYGG',
  'GGKKKGWWWWWGKKKGG',
  'GGYKYGWWWWWGYKYGG',
  'GGGGWWWWPWWWWGGGG',
  '.GGWWWWWWWWWWWGG.',
  '.GWWWWWWWWWWWWWG.',
  '..WWWWWWWWWWWWW..',
  '...WW.......WW...',
];
export const CAT_INK = {G: '#9C958D', P: '#FF9FB0', W: '#FFFAF2', Y: '#B5B04A', K: '#14110D'};
// one cell of the cat, with its eyes open or shut: a shut eye is its middle row alone
export const catCell = (i, j, open) => { const ch = CAT[j][i]; return !open && (j === 6 || j === 8) && (ch === 'Y' || ch === 'K') ? 'G' : ch; };
export function drawCat(g, k, open) {
  g.clearRect(0, 0, 17 * k, 14 * k);
  for (let j = 0; j < 14; j++) for (let i = 0; i < 17; i++) { const ch = catCell(i, j, open); if (ch === '.') continue; g.fillStyle = CAT_INK[ch]; g.fillRect(i * k, j * k, k, k); }
}
