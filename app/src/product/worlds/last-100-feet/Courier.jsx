import {forwardRef, memo} from 'react';

/* The courier, seen from above, facing up (north) at rotation 0: cap, shoulders, a phone glowing in the left hand,
   the red insulated bag in the right. Four walk frames (left step, pass, right step, pass) and a standing pose; the
   page picks one from the distance walked, so the legs move exactly as fast as you scroll. Units: plan feet, drawn
   a little larger than life so a person reads at site-plan scale. */

const RED = '#eb1700', RED_SIDE = '#a51000', RED_LIT = '#ff6a4c';
const JACKET = '#39415e', JACKET_LIT = '#56628a', SKIN = '#c98f6b', CAP = '#1a1e2b';

// [left foot y, right foot y, left arm swing, right arm swing, torso tilt]
const POSES = {
  stand: [.6, .6, 0, 0, 0],
  0: [-3.6, 2.8, 2.2, -1.6, -3],
  1: [-.6, .4, .4, -.3, 0],
  2: [2.8, -3.6, -2.2, 1.6, 3],
  3: [.4, -.6, -.4, .3, 0],
};

function Figure({pose, glow = "w3-phone-glow"}) {
  const [lf, rf, la, ra, tilt] = POSES[pose];
  return <g data-f={pose}>
    {/* shoes poke out ahead of and behind the body */}
    <rect x={-3.6} y={lf - 1.9} width={2.6} height={3.8} rx="1.2" fill="#13151d"/>
    <rect x={1} y={rf - 1.9} width={2.6} height={3.8} rx="1.2" fill="#13151d"/>
    <g transform={`rotate(${tilt})`}>
      {/* left arm and the phone */}
      <path d={`M-4.6 -.2 Q-6.4 ${.6 + la * .5} -6.2 ${-2.2 + la}`} stroke={JACKET} strokeWidth="2.3" strokeLinecap="round" fill="none"/>
      <circle cx={-6.2} cy={-3.4 + la} r="5" fill={`url(#${glow})`}/>
      <rect x={-7.3} y={-5.4 + la} width={2.2} height={3.4} rx=".6" fill="#cfe6ff"/>
      <circle cx={-6.2} cy={-2 + la} r="1.05" fill={SKIN}/>
      {/* torso: shoulders in a jacket, lit from the west */}
      <ellipse cx="0" cy=".4" rx="5.4" ry="3.3" fill={JACKET}/>
      <path d="M-5.2 .2 A5.4 3.3 0 0 1 1.6 -2.7 A5.4 3.6 0 0 0 -3.6 1.6 Z" fill={JACKET_LIT} opacity=".9"/>
      {/* right arm and the hot bag */}
      <path d={`M4.6 -.2 Q6.6 ${.8 + ra * .4} 7 ${1.6 + ra}`} stroke={JACKET} strokeWidth="2.3" strokeLinecap="round" fill="none"/>
      <g className="w3-bagheld" transform={`translate(${8.6} ${3.4 + ra})`}>
        <rect x="-3.4" y="-2.2" width="6.8" height="6.2" rx="1.3" fill={RED_SIDE}/>
        <rect x="-3.4" y="-2.8" width="6.8" height="5.6" rx="1.3" fill={RED}/>
        <rect x="-2.6" y="-2.2" width="5.2" height="1.1" rx=".5" fill={RED_LIT} opacity=".8"/>
        <rect x="-3.4" y=".7" width="6.8" height=".55" fill="#ffd9cf" opacity=".75"/>
      </g>
      <circle cx={7.2} cy={1.4 + ra} r="1.05" fill={SKIN}/>
      {/* head: a cap with its brim forward */}
      <circle cx="0" cy="-.4" r="2.9" fill={CAP}/>
      <path d="M-2.2 -2.6 Q0 -5.4 2.2 -2.6 Z" fill="#2c3247"/>
      <circle cx="-.9" cy="-1.2" r=".9" fill="#ffffff" opacity=".12"/>
    </g>
  </g>;
}

export const SPRITE = 26;   // the sprite's box, plan units

/** The sprite. The page moves `ref` (position, camera zoom) and its first child (heading, stairs), and sets
    data-frame on the root ('stand' or 0..3). */
const Courier = forwardRef(function Courier({px}, ref) {
  const size = SPRITE * px;
  return <div ref={ref} className="w3-courier" data-frame="stand" style={{width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2}}>
    {/* the long dusk shadow falls east and doesn't turn with the courier */}
    <svg className="w3-courier-shadow" viewBox={`${-SPRITE / 2} ${-SPRITE / 2} ${SPRITE} ${SPRITE}`} width={size} height={size} aria-hidden="true">
      <ellipse cx="5.6" cy="2.4" rx="8.4" ry="3.2" transform="rotate(19 5.6 2.4)" fill="#04060d" opacity=".5"/>
    </svg>
    <div className="w3-courier-turn">
      <svg viewBox={`${-SPRITE / 2} ${-SPRITE / 2} ${SPRITE} ${SPRITE}`} width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id="w3-phone-glow"><stop offset="0" stopColor="#bfe0ff" stopOpacity=".55"/><stop offset="1" stopColor="#bfe0ff" stopOpacity="0"/></radialGradient>
        </defs>
        {['stand', 0, 1, 2, 3].map(p => <Figure key={p} pose={p}/>)}
      </svg>
    </div>
  </div>;
});

export default memo(Courier);

/** A still courier for small scenes (the "Find the door" plan): plan units, drawn at `x, y` facing `angle`. */
export function CourierMark({x, y, angle = 0, frame = 'stand', scale = 1, glow = 'w3-phone-glow-mark'}) {
  return <g transform={`translate(${x} ${y})`} className="w3-courier-mark" data-frame={frame}>
    <ellipse cx="5.6" cy="2.4" rx="8.4" ry="3.2" transform={`scale(${scale}) rotate(19 5.6 2.4)`} fill="#04060d" opacity=".5"/>
    <g transform={`rotate(${angle}) scale(${scale})`}>
      {['stand', 0, 1, 2, 3].map(p => <Figure key={p} pose={p} glow={glow}/>)}
    </g>
  </g>;
}

/** The gradient a page defines once for every CourierMark's phone glow. */
export const MarkGlow = ({id = 'w3-phone-glow-mark'}) => <radialGradient id={id}><stop offset="0" stopColor="#bfe0ff" stopOpacity=".55"/><stop offset="1" stopColor="#bfe0ff" stopOpacity="0"/></radialGradient>;
