// Atelier (D2), the words and facts of the case, shared by the gallery world and its plain reading mode.
// Sources: cases/d2-atelier/BRIEF.md and d2-atelier-prototype/README.md + DESIGN.md + src/artworks.json (Oct 19, 2026;
// round 2, after a model-assisted design review). Every number comes from the prototype or the brief. Research is still
// a plan: illustrator pain points are labeled Hypothesis until Jay's interviews on test day.
import {art, largestSharp, printCheck, sizes} from './model';

export const HERO = {
  title: 'Atelier',
  outcome: 'A print studio for illustrators: from a finished painting to a published, shareable print in five named steps, with print quality and earnings checked before anything goes live.',
  chips: ['Solo: research, product and visual design, code', 'October 2026', 'iOS concept', 'Not yet tested with artists'],
};

export const NUMBERS = [
  {value: '22', label: 'Screens in the coded prototype', note: 'Artist and collector sides, checkout included, all clickable'},
  {value: '8', label: 'Paintings of mine as the catalog', note: 'No stock art and no generated images'},
  {value: '300', unit: 'dpi', label: 'Floor for every print size', note: 'A size below it can’t be sold'},
];

/** The eight paintings as the prototype lists them (artworks.json), in the order they hang on the gallery wall:
    the drop painting first, the collector's painting last. `focus` is a point worth a close look, as fractions of
    the image (the press's loupe starts there). */
const HANG = [
  {id: 'blue-hour', about: 'A winter village at dawn, painted in violet and rose.', focus: [.52, .74]},
  {id: 'quiet-gate', about: 'A stone gate beneath a dense forest canopy.', focus: [.56, .26]},
  {id: 'spring', about: 'Cherry trees in bloom above an island village.', focus: [.4, .3]},
  {id: 'between', about: 'A ruined archway in a mountain landscape.', focus: [.62, .5]},
  {id: 'return', about: 'Afternoon light across a temple courtyard.', focus: [.3, .68]},
  {id: 'red-planet', about: 'A creature crossing the red terrain of Mars.', focus: [.42, .34]},
  {id: 'clouds', about: 'A vast tree rising above a bank of clouds.', focus: [.46, .3]},
  {id: 'signal', about: 'A lone traveler approaching a distant beacon.', focus: [.56, .5]},
];
export const WORKS = HANG.map(h => {
  const a = art.find(x => x.id === h.id);
  return {...a, ...h, top: largestSharp(a)};
});
export const workOf = id => WORKS.find(w => w.id === id);

/** Base images (the embedded prototype's copies) and the original files at their own pixel size. */
export const wallSrc = id => `/proto/atelier/art/${id}.webp`;
export const fullSrc = id => `/assets/product/atelier/world/full/${id}.webp`;
export const thumbSrc = id => `/assets/product/atelier/thumbs/${id}.webp`;

/** Paper size in inches, in the painting's orientation, as the prototype writes it: "10 × 8". */
export const inches = (a, s) => { const r = printCheck(a, s); return `${r.w} × ${r.h}`; };
export const px = n => n.toLocaleString('en-US');
export {sizes};

// Round 2 of the prototype: five named steps ("Step n of 5") with a saved-draft status, then publish and share.
export const STEPS = [
  {id: 'upload', screen: 'upload', label: 'Artwork', title: 'Start from the finished piece',
    alt: 'Step 1 of 5, Artwork: a grid of eight paintings with their pixel sizes',
    text: 'A drop begins with the original file, not a product form. The sample archive is eight of my own paintings, each listed with its real pixel size. Every step is named, and the draft saves as you go.'},
  {id: 'check', screen: 'check', label: 'Print quality', title: 'Check the print before anything else',
    alt: 'Step 2 of 5, Print check: offer prints up to 10 by 8 inches, sharp at 300 dpi, with the details folded away',
    text: 'Atelier reads the file’s pixels and leads with the answer. The Blue Hour is 4,096 × 2,160 px, so it can be sold up to 10 × 8 in at 300 dpi, whole, with a white border. The ruler and the dpi behind each size open on request.'},
  {id: 'sizes', screen: 'sizes', label: 'Sizes and paper', title: 'Offer only sizes that print well',
    alt: 'Step 3 of 5, Sizes and paper: 3 by 2, 5 by 3, 7 by 5 and 10 by 8 inches, with 7 by 5 and 10 by 8 offered',
    text: 'Only sizes that passed the check are on the list, the paper turned to match the painting. Studio matte is included; cotton rag adds $4 to the production cost.'},
  {id: 'price', screen: 'price', label: 'Price', title: 'See what you keep before you publish',
    alt: 'Step 4 of 5, Set your price: $38 for 10 by 8, minus $11 print and paper and $3.34 fee, you keep $23.66',
    text: 'At $38 for a 10 × 8: $11 for print and paper, $3.34 in fees (8% + $0.30), $23.66 to the artist. Other sizes are priced so the artist keeps the same amount.'},
  {id: 'preview', screen: 'preview', label: 'Review', title: 'Look at it the way a collector will',
    alt: 'Step 5 of 5, Review your drop: the painting large, the sizes on offer and the starting price, from $33.65',
    text: 'The shop page before it goes live: the painting large inside its white border, the sizes on offer, and the starting price, from $33.65. No listing fee.'},
  {id: 'share', screen: 'share', label: 'Publish and share', title: 'Publish, then share the whole story',
    alt: 'Share this drop: the full 1080 by 1920 story image with the painting, title, price and a Shop tag, above Save story image and Copy shop link',
    text: 'Publishing opens the share sheet with the whole 1080 × 1920 story in view: the painting, the title, the price and a Shop tag. Save the image or copy the shop link.'},
];

export const DECISIONS = [
  {id: 'ruler', title: 'The answer first, the ruler on request', verdict: 'Lead with what the artist can sell; explain it when asked.',
    tried: 'A ladder of checkmarks, then a ruler of every paper size up front.',
    chose: '“Offer prints up to 10 × 8 inches” first. The ruler at 12 px per inch and the dpi behind each size open one tap away.',
    image: {screen: 'check', position: '50% 40%'}},
  {id: 'fees', title: 'Earnings that don’t shrink', verdict: 'A bigger print shouldn’t pay the artist less.',
    tried: 'Raising each larger size by its extra print cost.',
    chose: 'Dividing the extra cost by 0.92 before rounding, so the 8% fee doesn’t eat into the artist’s cut.',
    image: {screen: 'price', position: '50% 66%'}},
  {id: 'wall', title: 'Scale you can trust', verdict: 'A size only means something next to furniture.',
    tried: 'A flat room with a small, static print.',
    chose: 'A lit wall, a 36-inch console and a fixed 48-inch view. The print is drawn at its physical width; Apply keeps a size, Cancel puts it back.',
    image: {src: '/assets/product/atelier/wall-room.webp', position: '50% 50%'}},
  {id: 'ink', title: 'Ink for actions', verdict: 'The paintings should be the only color on screen.',
    tried: 'Royal-blue, full-width pill buttons.',
    chose: 'Deep ink buttons with 12 px corners; one muted ultramarine for links and selection.',
    image: null},
  {id: 'story', title: 'A story worth posting', verdict: 'If the image isn’t worth posting, the link never gets shared.',
    tried: 'A lavender card with small type.',
    chose: 'The painting large and framed on neutral paper, with a title, price and Shop tag you can read in a story.',
    image: {src: '/assets/product/atelier/story.webp', position: '50% 40%'}},
];

export const TASKS = [
  {id: 'size', screen: 'check', art: 'blue-hour', title: 'Check whether The Blue Hour can be sold at 16 × 12 in',
    hint: 'Open Print quality & size details, then tap 16 × 12 on the ruler to see its dpi and the reason.'},
  {id: 'price', screen: 'price', art: 'blue-hour', title: 'Set a price for a 10 × 8 and see what you keep',
    hint: 'Change the price; the breakdown and “You keep” update as you type.'},
  {id: 'wall', screen: 'wall', art: 'signal', title: 'As a collector, try A Distant Signal on the wall in each size it’s sold in',
    hint: 'Pick a size: the print changes to its physical width next to the 36-inch console. Apply keeps it; Cancel puts it back.'},
  {id: 'buy', screen: 'drop', art: 'signal', title: 'Buy a print, then find the order in the artist’s studio',
    hint: 'Checkout takes no money: pay with the Apple Pay demo. After the receipt, open the screen menu (the three dots) and go to Orders.'},
];

// Round 1 → round 2 of the same screens, from the archived shots (scripts/build-round-pairs.mjs).
const R = '/assets/product/atelier/rounds/';
export const ROUNDS = [
  {id: 'check', tab: 'Print check', caption: 'The print check. Round 1 put every paper size on a ruler; round 2 leads with the largest sharp size and keeps the ruler one tap away.',
    before: {src: `${R}check-r1.webp`, label: 'Round 1'}, after: {src: `${R}check-r2.webp`, label: 'Round 2'}},
  {id: 'wall', tab: 'Size sheet', caption: 'Choosing a size on the wall. Round 1 offered Done and Buy in the same sheet; round 2 has Cancel and Apply, and you buy on the product page.',
    before: {src: `${R}wall-r1.webp`, label: 'Round 1'}, after: {src: `${R}wall-r2.webp`, label: 'Round 2'}},
  {id: 'checkout', tab: 'Checkout', caption: 'Checkout. Round 1 placed the order as soon as the address was in; round 2 is step 1 of 3, before payment and a review of the total.',
    before: {src: `${R}checkout-r1.webp`, label: 'Round 1'}, after: {src: `${R}checkout-r2.webp`, label: 'Round 2'}},
];
// From d2-atelier-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: 'Collectors choose only from sizes the artist offers and the file can print; other formats say why they’re missing.', why: 'No “Too small” options sitting next to the ones you can buy.'},
  {what: 'Cancel and Apply in the size sheet; Buy print lives on the product page.', why: 'Changing an option and committing to a purchase are different moments.'},
  {what: 'One price calculation everywhere: +$4 production cost for the artist, the exact +$4.35 retail difference for collectors.', why: 'The artist’s earnings hold, and every total on every screen agrees.'},
  {what: 'A full checkout: delivery, an Apple Pay-style demo or a card, a review with the total, and a way back from a declined card.', why: 'Round 1 created the order the moment an address went in. Now it exists only after a (simulated) payment.'},
  {what: 'Five named steps, “Step 2 of 5,” a saved-draft status, and a way back in from Home.', why: 'You can see how much is left, and leave and come back.'},
  {what: 'Larger artwork, a full-screen inspector with zoom, and the whole 9:16 story in view before you save it.', why: 'Collectors look at the actual work; artists see the image they’re about to post.'},
];
export const REVIEW_NOTE = 'I asked a model to critique round 1 as an Apple design lead would. It scored craft 6, interaction 5 and product thinking 7, and ranked eight fixes; round 2 builds all eight. It’s a critique, not a test with artists.';

export const PROBLEM = {
  heading: 'Four tools to sell one print',
  paragraphs: [
    'The illustrators I studied with sell prints at conventions and online. Online means stitching tools together: Instagram for the audience, a storefront, a print-on-demand service, and DMs for customer service.',
    'Each tool works on its own. My hunch is that artists lose time and sales in the seams between them, so Atelier puts the whole drop in one place.',
  ],
  hypothesis: 'From the artists I know, not from interviews yet. Test day will confirm or replace it.',
  quote: 'Quotes from 3–5 illustrator classmates go here after test day: how they sell now, their last sale, what annoys them.',
  tools: [
    {name: 'Instagram', role: 'where the audience is'},
    {name: 'A storefront', role: 'Etsy, Big Cartel, INPRNT or Shopify'},
    {name: 'A print service', role: 'makes and ships the print'},
    {name: 'DMs', role: 'customer service, by hand'},
  ],
  seams: ['Will this size print sharp?', 'What do I keep after fees?', 'Where’s my order?'],
  seamsNote: 'The tools are real; the questions in the seams are my guess at where time and sales go missing.',
};

export const TESTING = {
  plan: [
    '3–5 illustrator classmates each publish a drop of their own work and buy a print as a collector.',
    'Five extra minutes each: how they sell now, their last sale, what they’d pay.',
    'A desk scan of Etsy, INPRNT, Society6, Big Cartel, Shopify with Printful, Instagram Shop and Ko-fi.',
  ],
  hypotheses: [
    'Artists lose time and sales in the seams between tools.',
    'Artists can’t tell which sizes of a file will print sharp.',
    'Seeing earnings before publishing changes the price they set.',
  ],
  results: [['Published a drop without help', '— of 5'], ['Time from upload to published', '— min'], ['Would sell the sizes the check allowed', '— of 5']],
};

export const REFLECTION = [
  {title: 'What I’d keep', text: 'The print check at the center. It is the one thing a storefront or a print service can’t tell an artist before the sale, and everything after it (sizes, price, preview) gets simpler because of it.'},
  {title: 'What I don’t know yet', text: 'Whether the money works at 2–20 sales a month. The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote.'},
  {title: 'What’s next', text: 'Test day. Round 2 answered a model’s critique; artists decide round 3. The collector side, now with a full checkout, gets the same scrutiny as the drop flow.'},
];

/** The four inks of the press, in the order they go down. */
export const INKS = [
  {id: 'c', name: 'Cyan', color: '#1aa3dc', text: 'Cyan goes down first, wherever the file has blue or green.'},
  {id: 'm', name: 'Magenta', color: '#dc2a7d', text: 'Magenta adds the reds and violets. Over cyan it makes blue.'},
  {id: 'y', name: 'Yellow', color: '#f3d23a', text: 'Yellow warms everything. Over magenta it makes red and orange.'},
  {id: 'k', name: 'Black', color: '#1d1916', text: 'Black, the key, carries the darks and the edges, so the colors don’t have to.'},
];
