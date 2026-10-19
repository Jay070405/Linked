import {Ev} from '../../CaseKit';

/* Everything the walk says. Facts, numbers and labels are the case's own (cases/LastHundredFeetCase.jsx, from
   cases/d3-last-100-feet/BRIEF.md and d3-last-100-feet-prototype/README.md, round 2, Oct 19 2026): the photos are
   AI-generated illustrative images of a fictional complex; the counts on the prototype's screens (38 seconds,
   9 couriers, 14 couriers) are illustrative; outside evidence is soft and labeled; nothing has been tested with
   couriers or residents yet. Here the case is regrouped along the route: each waypoint carries the beat of the
   story that happens there. */

export const AI = 'Photos are AI-generated illustrative images, not a real location.';
export const A = '/assets/product/last-100-feet/';
export const shot = id => `${A}screens/${id}.webp`;
export const photoSmall = name => `${A}photos/${name}.webp`;
export const photoLarge = name => `/proto/last-100-feet/photos/${name}.webp`;

export const NUMBERS = [
  {value: '10', unit: 'to 15 min', label: 'Lost per delivery at complexes, by one company’s count', note: <><Ev label="Sourced"/> Beans’ founder. Beans maps complexes for drivers; this is a company claim, not a study.</>},
  {value: '40', label: 'States in the coded prototype', note: 'Resident and courier, each with its own deep link'},
  {value: '90', unit: 's', label: 'Target for a resident to map the way in', note: <><Ev label="Hypothesis"/> From the brief. The prototype’s “38 seconds” is illustrative until test day.</>},
];

/** One stop per waypoint: the resident's photo there, and what the case says at that point of the walk. */
export const STOPS = [
  {key: 'park', id: 'w3-curb', name: 'Elm St curb', photo: 'curb', card: 'Park by the olive tree, about 40 ft before the gate.',
    alt: 'Curb on Elm St in front of the pedestrian gate, olive tree on the left, red curb on the right'},
  {key: 'gate', id: 'w3-gate', name: 'Elm St gate', photo: 'gate', card: 'Call box on the left post. Pull the gate when it buzzes.',
    alt: 'Black metal pedestrian gate between stucco walls, call box on the left post'},
  {key: 'building', id: 'w3-courtyard', name: 'Building 4', photo: 'courtyard', card: 'Keep right where the path splits. Look for the metal 4 on the wall.',
    alt: 'Courtyard walkway that splits in two, metal number 4 on the building to the right'},
  {key: 'stairs', id: 'w3-stairs', name: 'Stairs', photo: 'stairs', card: 'Take the metal stairs up one floor.',
    alt: 'Open metal stairs up to the second floor, next to the number 4 plaque'},
  {key: 'door', id: 'w3-door', name: 'Door 214', photo: 'door', card: 'Keep straight on the walkway. Dark green door, plant on the right.',
    alt: 'Dark green door 214 on the second-floor walkway, coir mat, potted plant on the right'},
];

/** The walk between stops: the leg's length and the card a courier reads on the way (the prototype's step cards). */
export const LEG_CARDS = [
  {to: 'the Elm St gate', say: 'Call box on the left post. Pull the gate when it buzzes.'},
  {to: 'Building 4', say: 'Keep right where the path splits. Look for the metal 4 on the wall.'},
  {to: 'the stairs', say: 'Take the metal stairs up one floor.'},
  {to: 'door 214', say: 'Keep straight on the walkway. Dark green door, plant on the right.'},
];

// The five choices, each where it happens on the route (formerly "What I chose, and what I tried first").
export const DECISIONS = {
  stop: {title: 'Where to stop isn’t how to get in', verdict: 'Never suggest a red curb.',
    tried: '“Park on Elm St” beside a photo with a red curb in it.',
    chose: 'A verified, unrestricted stop with the curb rules in words and color. Residents suggest stops; couriers verify them.',
    screen: 'c-step-park', focus: '50% 78%'},
  code: {title: 'The order authorizes; the gate reveals', verdict: 'A geofence shouldn’t strand a courier at the right gate.',
    tried: 'Round 1: the code only within 50 m, and with weak GPS, “ask the resident to buzz you in.”',
    chose: 'Hold to show inside 160 ft. “At the gate already?” opens a photo self-check and a reason, logged for the resident.',
    screen: 'c-gate-revealed', focus: '50% 72%'},
  card: {title: 'The photo is the instruction', verdict: 'Glance, don’t read: one hand is holding a hot bag.',
    tried: 'A map pin with a typed note, read while walking.',
    chose: 'Photo first, a landmark title, a distance that says what it measures, one sentence and one action in the thumb zone.',
    screen: 'c-step-building', focus: '50% 38%'},
  stale: {title: 'Recovery doesn’t wait for the resident', verdict: 'Buildings change; the route has to notice.',
    tried: 'A flag that sat until the resident fixed the step.',
    chose: 'A flag is live for the next courier at once. Two in a week gray the photo, show the detour couriers used, and ask the manager.',
    screen: 'c-step-stale', focus: '50% 70%'},
  blank: {title: 'Author the minimum, from zero', verdict: 'A route that helps tonight beats a perfect one never finished.',
    tried: 'Round 1: setup began with four of five photos done and the gates already known.',
    chose: 'A blank plan from public map data: tap the way in, set access, done. Photos and a stop suggestion are optional.',
    screen: 'r-pin-gate', focus: '50% 30%'},
};

// The prototype's steps, resident then courier (formerly the "Two roles, one route" scrolly), placed on the route.
export const BEATS = {
  arrive: {screen: 'c-arrive', label: 'Courier: arrival', title: 'Arrive knowing where to stop and where to walk',
    alt: 'Arrival card: stop on Elm St, walk in the front gate; the route drawn on the site plan from the stop to door 214, with curb rules',
    body: 'The arrival card names a verified stop on Elm St, then the gate, Building 4, the stairs and door 214, drawn on the site plan with the curb rules spelled out. The order stays on every card.'},
  gate: {screen: 'c-gate-confirm', label: 'Courier: gate', title: 'Get through the gate when GPS is wrong',
    alt: 'Confirm you’re at the Elm St gate: the resident’s gate photo, GPS is weak here, a reason, and Show the code',
    body: 'The order authorizes the code; being at the gate only reveals it. When GPS can’t place the courier, they compare the resident’s gate photo, pick a reason, and the code opens, logged for the resident.'},
  card: {screen: 'c-step-building', label: 'Courier: photo cards', title: 'Follow photos, not a pin',
    alt: 'Step 3 of 5, Building 4: a photo of the courtyard path, 125 ft walk, keep right where the path splits',
    body: 'Half the screen is the photo, because the photo is the instruction. A landmark, a distance that says what it measures, one sentence, and one action in the thumb zone. Swipe or tap to the next.'},
  off: {screen: 'c-feedback', label: 'Courier: feedback', title: 'Directions were off? Fix it for the next courier',
    alt: 'What was off? The five steps as thumbnails with the gate selected, reasons as large chips, and the courier’s own photo attached',
    body: 'Three taps: the step, what was wrong, an optional photo. The note is live for the next courier at once. The resident gets the courier’s photo as “Not this gate,” and two flags in a week ask the building manager.'},
  door: {screen: 'c-dropoff-match', label: 'Courier: drop-off', title: 'Check the door; don’t let the app decide',
    alt: 'Check the door: the courier’s photo next to the resident’s door photo, an auto-check hint, and checkboxes the courier ticks',
    body: 'The courier’s photo sits beside the resident’s door photo. The auto-check is a labeled hint and the courier ticks what they see. No photo possible? They complete with where it was left and why.'},
  wayIn: {screen: 'r-pin-gate', label: 'Resident: way in', title: 'Mark the way in on a blank plan',
    alt: 'Where do couriers walk in? A blank site plan from public map data, a pin on the wall, and entrance types: gate with call box, open walkway, lobby door',
    body: 'The resident starts from public map data: buildings, no gates, no walkways. One tap on the wall where couriers walk in, the kind of entrance, and the unit from the address.'},
  basics: {screen: 'r-basics', label: 'Resident: saved', title: 'Useful before a single photo',
    alt: 'The basics are saved: the entrance and the code, stored privately; photos, a stop suggestion and privacy settings are optional',
    body: 'The way in and the gate code are enough to help the next courier; the code is shown only to the courier on the order, at the gate. Photos of each turn are optional. The 38 seconds on screen is illustrative; test day will time it.'},
};

const R = `${A}rounds/`;
export const ROUNDS = [
  {id: 'gps', tab: 'Weak GPS', caption: 'Weak GPS at the gate. Round 1 hid the code and offered “ask Dana to buzz you in”; round 2 lets the courier confirm by hand.',
    before: {src: `${R}gps-r1.webp`, label: 'Round 1'}, after: {src: `${R}gps-r2.webp`, label: 'Round 2'}},
  {id: 'stop', tab: 'Where to stop', caption: 'Step 1. Round 1 said “Park on Elm St” over a red curb; round 2 names a verified stop and spells out the curb rules.',
    before: {src: `${R}stop-r1.webp`, label: 'Round 1'}, after: {src: `${R}stop-r2.webp`, label: 'Round 2'}},
  {id: 'photos', tab: 'Photo steps', caption: 'Resident photos. Round 1 started at four of five done; round 2 starts at zero, and every photo is optional.',
    before: {src: `${R}photos-r1.webp`, label: 'Round 1'}, after: {src: `${R}photos-r2.webp`, label: 'Round 2'}},
  {id: 'dropoff', tab: 'Drop-off', caption: 'The drop-off camera. Round 1 laid the resident’s photo over the view; round 2 is a clear camera with the reference as a thumbnail.',
    before: {src: `${R}dropoff-r1.webp`, label: 'Round 1'}, after: {src: `${R}dropoff-r2.webp`, label: 'Round 2'}},
];
// From d3-last-100-feet-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: 'The order authorizes the code and proximity only reveals it; “At the gate already?” opens a photo self-check and a reason.', why: 'A hard 50 m boundary can strand a courier at the right gate, and GPS is unreliable between buildings.'},
  {what: 'Call and Message work: a private-number call, one-tap messages, the reply in place.', why: 'Contact is the core recovery path, not decoration.'},
  {what: 'A verified, unrestricted stop with the curb rules on the card, the arrival card and the plan.', why: 'Implying a red curb is fine to stop at is a safety and ticket problem.'},
  {what: 'An order chip on every card, with the stacked orders and switching.', why: 'In a stacked delivery, “Door 214” alone invites a wrong handoff.'},
  {what: 'Setup starts from a blank plan, is useful after the way in and the code, and treats photos as optional.', why: 'Round 1 measured finishing a prepared route, not creating one.'},
  {what: 'A flag is live for the next courier at once; two mark a step unverified and ask the building manager.', why: 'A resident might never respond, and buildings change.'},
];

export const TASKS = [
  {id: 'code', screen: 'c-gate-near', title: 'Show the gate code the way a courier would',
    hint: 'Hold the red button about a second. The code hides after 20 seconds; one tap brings it back.'},
  {id: 'walk', screen: 'c-step-park', title: 'Walk from the stop on Elm St to door 214',
    hint: 'Swipe the cards or press Next. The mini map lights the leg you’re on.'},
  {id: 'gps', screen: 'c-gps-weak', title: 'Get through the gate when GPS can’t place you',
    hint: 'Tap I’m at the gate, compare the photo, pick a reason, then show the code.'},
  {id: 'resident', screen: 'r-pin-gate', title: 'As the resident, mark the way in on a blank plan',
    hint: 'Tap the wall where couriers walk in; the pin snaps to it and Next unlocks.'},
];
