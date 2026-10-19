// The case's facts, carried over unchanged from the v4 page (cases/ReadyForAgentsCase.jsx).
// Sources: cases/p2-design-to-code/draft.md and p2-benchmark/results/results.md (37 scored builds, Oct 19 2026);
// cases/pd-ready-for-agents/BRIEF.md and pd-prototype/README.md (round 2, after a model-assisted design review).
// Concept work, not affiliated with Figma. Nothing in the design chapter has been tested with designers yet; Jay runs
// the sessions next.

export const A = '/assets/product/ready-for-agents/';

/** The canvas: one Figma section per chapter, its frames left to right. `name` is the frame's name on the canvas and
    in the Layers list. */
export const SECTIONS = [
  {id: 'case', name: 'Ready for agents', frames: [{id: 'cover', name: 'Cover'}]},
  {id: 'research', name: 'Research', frames: [
    {id: 'question', name: 'The question'},
    {id: 'compile', name: 'What the agent reads', wide: true, hold: 1.5},
    {id: 'finding', name: 'Try the finding'},
    {id: 'method', name: 'Six screens, four versions'},
    {id: 'structure', name: 'Same picture, different structure'},
    {id: 'pipeline', name: 'One build'},
    {id: 'result-1', name: 'Result 1'},
    {id: 'result-2', name: 'Result 2, the ablation'},
    {id: 'insight', name: 'What agents never recovered'},
  ]},
  {id: 'design', name: 'Design', frames: [
    {id: 'brief', name: 'Where it lives'},
    {id: 'principles', name: 'Principles'},
    {id: 'directions', name: 'Directions'},
    {id: 'flow-1', name: 'Flow / Panel row', flow: 0},
    {id: 'flow-2', name: 'Flow / Check designs', flow: 1},
    {id: 'flow-3', name: 'Flow / Hover outline', flow: 2},
    {id: 'flow-4', name: 'Flow / Picker', flow: 3},
    {id: 'flow-5', name: 'Flow / Apply and undo', flow: 4},
    {id: 'flow-6', name: 'Flow / Applied', flow: 5},
    {id: 'flow-7', name: 'Flow / Agents tab', flow: 6},
    {id: 'rounds', name: 'Round 1 → 2'},
    {id: 'theme', name: 'Light and dark'},
    {id: 'agent', name: 'The agent’s side'},
  ]},
  {id: 'try', name: 'Try it', frames: [{id: 'try', name: 'Prototype, live', wide: true}]},
  {id: 'testing', name: 'Testing', frames: [{id: 'testing', name: 'Five sessions'}, {id: 'reflection', name: 'Reflection'}]},
];
export const FRAMES = SECTIONS.flatMap((s, si) => s.frames.map(f => ({...f, section: s.id, sectionIndex: si})));
export const indexOf = id => FRAMES.findIndex(f => f.id === id);

export const NUMBERS = [
  {value: '37', label: 'Agent builds scored', note: '24 in round 1, including the ablation, and 13 round-2 repeats so far'},
  {value: '9', unit: 'of 9', label: 'Followed every token change', note: 'Builds from a raw file with only variables added'},
  {value: '50', unit: '%', label: 'Median that reached the code without variables', note: '18 builds; none followed the whole change'},
];

// Pre-registered measures, medians of all scored builds per level (n = 9, 9, 10).
export const FLAT = [
  {name: 'Looks like the Figma export (SSIM)', values: ['0.983', '0.983', '0.984'], share: [.983, .983, .984]},
  {name: 'Passes the resize checks', values: ['100%', '100%', '100%'], share: [1, 1, 1]},
  {name: 'Absolutely positioned elements', values: ['2', '2', '2'], share: [.4, .4, .4]},
  {name: 'Colors routed through CSS variables', values: ['97%', '94%', '97%'], share: [.97, .94, .97]},
];

// The handoff flow. Camera rects are in the editor's own 1440 x 900 pixels (round 2 of the prototype).
export const FLOW = [
  {id: 'row', screen: 'row', label: 'Panel row', title: 'Selecting a frame says what isn’t bound',
    camera: {x: 640, y: 50, w: 800}, phoneCamera: {x: 1120, y: 90, w: 320},
    alt: 'The properties panel with a Variables row under the frame header: 12 unbound values, and a Check button',
    body: 'One 40 px row sits under the frame header: 12 unbound values, Check, and a menu. It counts values the agent will read as plain hex and px. No score.'},
  {id: 'review', screen: 'review', label: 'Check designs', title: 'Check opens a lens on Check designs',
    camera: {x: 440, y: 130, w: 1000}, phoneCamera: {x: 840, y: 140, w: 360},
    alt: 'Check designs with the Variables for agents lens: one row per value and role, each with a checkbox, and Apply 9',
    body: 'Figma’s Check designs already suggests variables for hard-coded values. The concept adds a Variables for agents lens: one row per value and role, a checkbox on each, and Apply 9 for what’s checked.'},
  {id: 'hover', screen: 'hover', label: 'Hover outline', title: 'Hover a row to see where it lives',
    camera: {x: 380, y: 40, w: 1060}, phoneCamera: {x: 410, y: 60, w: 470},
    alt: 'Hovering the FFFFFF frame fill row outlines three print cards on the canvas, dashed, with a 3 layers badge',
    body: 'Hovering FFFFFF as a frame fill outlines its three print cards, dashed so it never reads as the selection, with a count badge in one fixed spot. That’s direction B, folded into A.'},
  {id: 'picker', screen: 'picker', label: 'Picker', title: 'Pick a variable, don’t flip a toggle',
    camera: {x: 540, y: 250, w: 760}, phoneCamera: {x: 556, y: 286, w: 300},
    alt: 'The variable picker for FFFFFF as frame fill: two variables allowed here, one hidden from pickers, others below, with Light and Dark swatches',
    body: '#FFFFFF matches two variables. The picker searches every variable, separates the ones allowed in this role from the ones that aren’t (and says why), and shows each one’s Light and Dark values. The Dark value settles it: surface goes dark, on-accent stays white.'},
  {id: 'bound', screen: 'bound', label: 'Apply and undo', title: 'Apply in one step, undo in one step',
    camera: {x: 560, y: 300, w: 880}, phoneCamera: {x: 600, y: 640, w: 420},
    alt: 'A toast reads Bound 9 values on 29 layers, with Undo; three rows are left to review',
    body: 'Apply binds what’s checked as one history entry: 9 values on 29 layers. The toast’s Undo and ⌘Z both take it back. Applied rows fold away; the three that need a decision stay.'},
  {id: 'ready', screen: 'ready-review', label: 'Applied', title: 'Applied, exempt, and quiet when it’s done',
    camera: {x: 480, y: 150, w: 960}, phoneCamera: {x: 1100, y: 120, w: 340},
    alt: 'Check designs with an Applied list, each FFFFFF choice remembered per role with Forget, and the gold kept as a raw value; the panel row reads All values use variables',
    body: 'To review, applied and exempt stay apart. A choice is remembered per value and role, only after Apply, and can be forgotten. When nothing is left, the row reads All values use variables, in secondary text.'},
  {id: 'agent', screen: 'agent', label: 'Agents tab', title: 'The agent hears the same counts',
    camera: {x: 0, y: 0, w: 960}, phoneCamera: {x: 64, y: 140, w: 400},
    alt: 'The Agents tab: the note names the 3 unbound values and asks which variable FFFFFF should use as a frame fill',
    body: 'In the Agents tab, the note uses the same words: Home has 3 unbound values, which ones, and a question about FFFFFF instead of an invented token name.'},
];

// Each principle shows the piece of the prototype that passes its test, at the editor's own size (dw x dh CSS px).
export const PRINCIPLES = [
  {title: 'Say what the agent will miss, not a score', test: '“12 unbound values,” and a Check button. No grade, and no percentage without a count.', img: 'principle-row.webp', dw: 239, dh: 53},
  {title: 'Fix it where it lives, in one undo', test: 'No new window or mode. Apply is one history entry, and one Undo reverts it.', img: 'principle-toast.webp', dw: 254, dh: 52},
  {title: 'Never guess between equal options', test: 'A value that matches two variables is asked about per role, and the answer is remembered only after Apply.', img: 'principle-choice.webp', dw: 344, dh: 76},
  {title: 'Quiet when it’s fine', test: 'A frame with nothing left reads “All values use variables,” in secondary text.', img: 'principle-ready.webp', dw: 239, dh: 53},
  {title: 'Same words on both sides', test: 'The row, Check designs and the agent’s note all say “unbound values,” with the same counts.', img: 'principle-words.webp', dw: 227, dh: 112},
];

export const DIRECTIONS = [
  {id: 'a', name: 'Properties panel section', short: 'Panel row', idea: 'A one-line Variables row for the selected frame; Check opens Check designs with a Variables for agents lens.',
    plus: ['Visible at selection in one 40 px row; details open on demand', 'Reuses Check designs: pick scoped variables, apply in one undo'],
    minus: ['One row in a dense panel is easy to scroll past'], role: 'The home, as a lens on Check designs', chosen: true},
  {id: 'b', name: 'Canvas overlay', short: 'Canvas', idea: 'A toggle outlines every raw-value layer and labels it on the canvas.',
    plus: ['Spatial: you see exactly where each raw value sits'],
    minus: ['Noisy fast: 9 labels already crowd one phone screen', 'Competes with selection, hover and annotations'], role: 'Folded into A as the hover outline'},
  {id: 'c', name: 'Ready-for-dev checklist', short: 'Checklist', idea: 'Marking a section ready for dev runs the same check as one step of a checklist.',
    plus: ['Fits a ritual teams already have at handoff'],
    minus: ['Late: people have stopped editing by then', 'Only reaches teams that use dev status'], role: 'Reuses A’s row in the dev status flow'},
];

export const TASKS = [
  {id: 'miss', screen: 'row', title: 'Find what an agent would miss on the Home frame', hint: 'Read the Variables row in the right panel, then press Check.'},
  {id: 'bind', screen: 'review', title: 'Apply the suggested variables, then undo', hint: 'Press Apply 9, then Undo in the toast or ⌘Z.'},
  {id: 'white', screen: 'review', title: 'Decide what #FFFFFF should be in each role', hint: 'It’s a frame fill and a text color. Open each row’s picker; the Dark swatch is the tell.'},
  {id: 'agent', screen: 'after', title: 'Check what the agent will be told', hint: 'Open Agents in the left navigation bar.'},
];

// Round 1 → round 2 of the same states, cropped to Check designs and the properties panel (scripts/build-round-pairs.mjs).
const R = `${A}rounds/`;
export const ROUNDS = [
  {id: 'row', tab: 'Panel row', size: [800, 946], caption: 'Home selected. Round 1 added an 88 px Agent handoff section above Position; round 2 is one 40 px row.',
    before: {src: `${R}row-r1.webp`, label: 'Round 1'}, after: {src: `${R}row-r2.webp`, label: 'Round 2'}},
  {id: 'review', tab: 'Review', caption: 'The review. Round 1 was its own popover; round 2 is Check designs with a Variables for agents lens.',
    before: {src: `${R}review-r1.webp`, label: 'Round 1'}, after: {src: `${R}review-r2.webp`, label: 'Round 2'}},
  {id: 'choice', tab: '#FFFFFF', caption: 'Deciding #FFFFFF. Round 1 asked once, with a two-way toggle; round 2 asks per role, from a picker.',
    before: {src: `${R}choice-r1.webp`, label: 'Round 1'}, after: {src: `${R}choice-r2.webp`, label: 'Round 2'}},
];
// From pd-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: 'Rows are a value plus its role, and only variables scoped to that role are proposed.', why: 'One hex value can mean different things. An unscoped exact match can be confidently wrong.'},
  {what: 'A lens on Check designs instead of a separate checker.', why: 'It extends what Figma already ships instead of duplicating it.'},
  {what: 'A checkbox on every row and layer, and a button that counts: Apply 9.', why: 'The designer decides exactly what changes; round 1 bound every match at once.'},
  {what: 'One 40 px row replaces the 88 px section above Position.', why: 'An occasional check shouldn’t outrank everyday editing.'},
  {what: 'A searchable picker replaces the two-option toggle.', why: 'Real libraries have more than two candidates, and the Dark value settles surface vs on-accent.'},
  {what: '“Unbound values” replaces “raw values,” “agents invent names” and “Ready for agents.”', why: 'Name the issue and the action without overclaiming readiness.'},
];

// Figma's own words for the four file habits (the question's list, Figma developer docs).
export const HABITS = [
  {icon: 'instance', name: 'Components', note: 'Instances of a library'},
  {icon: 'variable', name: 'Variables', note: 'Colors, spacing and radii bound to tokens'},
  {icon: 'text', name: 'Layer names', note: 'Frames called what they are'},
  {icon: 'frame-v', name: 'Auto layout', note: 'Stacks instead of fixed positions'},
];
