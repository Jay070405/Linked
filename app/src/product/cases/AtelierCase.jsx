import {lazy, useRef} from 'react';
import {Ev} from '../CaseKit';
import {ProductFooter} from '../ProductIndex';
import {nextCase} from '../content';
import CaseHero from '../v2/CaseHero';
import NumberStrip from '../v2/NumberStrip';
import Scrolly from '../v2/Scrolly';
import Decisions from '../v2/Decisions';
import BeforeAfter, {RoundChanges} from '../v2/BeforeAfter';
import LivePrototype from '../v2/LivePrototype';
import NextProject from '../v2/NextProject';
import CursorLabel from '../v2/CursorLabel';
import CaseChrome, {zoomable} from '../v2/CaseChrome';
import {Deferred} from '../v2/Try';
import {L100TileArt} from '../v2/TileArt';
import {Phone, ProtoScreen, protoUrl, shotSrc} from '../v2/Device';
import {ArrowDown, ArrowUpRight} from '../v2/icons';
import {PHONE, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './atelier.css';

// Sources: cases/d2-atelier/BRIEF.md and d2-atelier-prototype/README.md + DESIGN.md (Oct 19, 2026; round 2, after a
// model-assisted design review).
// Every number below comes from the prototype or the brief. Research is still a plan: illustrator pain points are
// labeled Hypothesis until Jay's interviews on test day.

const ART = '/proto/atelier/art/';
// The three checks load when their place on the page comes near (v2/Try Deferred).
const AtelierChecks = lazy(() => import('../v2/modules/AtelierChecks'));

// The chapter rail and chip (v2/CaseChrome): every id is an element on this page.
const CHAPTERS = [
  {id: 'at-problem-section', label: 'The problem'},
  {id: 'at-flow', label: 'Five steps to a drop'},
  {id: 'at-checks', label: 'Try the checks'},
  {id: 'at-decisions', label: 'Decisions'},
  {id: 'at-compare', label: 'Round 1 → 2'},
  {id: 'try', label: 'Try it'},
  {id: 'at-testing-section', label: 'Testing'},
  {id: 'at-reflection-section', label: 'Reflection'},
];

// Round 2 of the prototype: five named steps ("Step n of 5") with a saved-draft status, then publish and share.
const STEPS = [
  {id: 'upload', screen: 'upload', label: 'Artwork', title: 'Start from the finished piece',
    alt: 'Step 1 of 5, Artwork: a grid of eight paintings with their pixel sizes',
    body: <p>A drop begins with the original file, not a product form. The sample archive is eight of my own paintings, each listed with its real pixel&nbsp;size. Every step is named, and the draft saves as you go.</p>},
  {id: 'check', screen: 'check', label: 'Print quality', title: 'Check the print before anything else',
    alt: 'Step 2 of 5, Print check: offer prints up to 10 by 8 inches, sharp at 300 dpi, with the details folded away',
    body: <p>Atelier reads the file’s pixels and leads with the answer. <em>The Blue Hour</em> is 4,096&nbsp;×&nbsp;2,160&nbsp;px, so it can be sold up to 10&nbsp;×&nbsp;8&nbsp;in at 300&nbsp;dpi, whole, with a white border. The ruler and the dpi behind each size open on request.</p>},
  {id: 'sizes', screen: 'sizes', label: 'Sizes and paper', title: 'Offer only sizes that print well',
    alt: 'Step 3 of 5, Sizes and paper: 3 by 2, 5 by 3, 7 by 5 and 10 by 8 inches, with 7 by 5 and 10 by 8 offered',
    body: <p>Only sizes that passed the check are on the list, the paper turned to match the painting. Studio matte is included; cotton rag adds $4 to the production cost.</p>},
  {id: 'price', screen: 'price', label: 'Price', title: 'See what you keep before you publish',
    alt: 'Step 4 of 5, Set your price: $38 for 10 by 8, minus $11 print and paper and $3.34 fee, you keep $23.66',
    body: <p>At $38 for a 10&nbsp;×&nbsp;8: $11 for print and paper, $3.34 in fees (8%&nbsp;+&nbsp;$0.30), $23.66 to the artist. Other sizes are priced so the artist keeps the same amount.</p>},
  {id: 'preview', screen: 'preview', label: 'Review', title: 'Look at it the way a collector will',
    alt: 'Step 5 of 5, Review your drop: the painting large, the sizes on offer and the starting price, from $33.65',
    body: <p>The shop page before it goes live: the painting large inside its white border, the sizes on offer, and the starting price, from $33.65. No listing fee.</p>},
  {id: 'share', screen: 'share', label: 'Publish and share', title: 'Publish, then share the whole story',
    alt: 'Share this drop: the full 1080 by 1920 story image with the painting, title, price and a Shop tag, above Save story image and Copy shop link',
    body: <p>Publishing opens the share sheet with the whole 1080&nbsp;×&nbsp;1920 story in view: the painting, the title, the price and a Shop&nbsp;tag. Save the image or copy the shop link.</p>},
];

const DECISIONS = [
  {id: 'ruler', title: 'The answer first, the ruler on request', verdict: 'Lead with what the artist can sell; explain it when asked.',
    tried: 'A ladder of checkmarks, then a ruler of every paper size up front.',
    chose: '“Offer prints up to 10 × 8 inches” first. The ruler at 12 px per inch and the dpi behind each size open one tap away.',
    visual: <img src={shotSrc('check')} alt="" loading="lazy" style={{objectPosition: '50% 40%'}}/>},
  {id: 'fees', title: 'Earnings that don’t shrink', verdict: 'A bigger print shouldn’t pay the artist less.',
    tried: 'Raising each larger size by its extra print cost.',
    chose: 'Dividing the extra cost by 0.92 before rounding, so the 8% fee doesn’t eat into the artist’s cut.',
    visual: <img src={shotSrc('price')} alt="" loading="lazy" style={{objectPosition: '50% 66%'}}/>},
  {id: 'wall', title: 'Scale you can trust', verdict: 'A size only means something next to furniture.',
    tried: 'A flat room with a small, static print.',
    chose: 'A lit wall, a 36-inch console and a fixed 48-inch view. The print is drawn at its physical width; Apply keeps a size, Cancel puts it back.',
    visual: <img src="/assets/product/atelier/wall-room.webp" alt="" loading="lazy" style={{objectPosition: '50% 50%'}}/>},
  {id: 'ink', title: 'Ink for actions', verdict: 'The paintings should be the only color on screen.',
    tried: 'Royal-blue, full-width pill buttons.',
    chose: 'Deep ink buttons with 12 px corners; one muted ultramarine for links and selection.',
    visual: <InkVisual/>},
  {id: 'story', title: 'A story worth posting', verdict: 'If the image isn’t worth posting, the link never gets shared.',
    tried: 'A lavender card with small type.',
    chose: 'The painting large and framed on neutral paper, with a title, price and Shop tag you can read in a story.',
    visual: <img src="/assets/product/atelier/story.webp" alt="" loading="lazy" style={{objectPosition: '50% 40%'}}/>},
];

const TASKS = [
  {id: 'size', screen: 'check', art: 'blue-hour', title: 'Check whether The Blue Hour can be sold at 16 × 12 in',
    hint: 'Open Print quality & size details, then tap 16 × 12 on the ruler to see its dpi and the reason.'},
  {id: 'price', screen: 'price', art: 'blue-hour', title: 'Set a price for a 10 × 8 and see what you keep',
    hint: 'Change the price; the breakdown and “You keep” update as you type.'},
  {id: 'wall', screen: 'wall', art: 'signal', title: 'As a collector, try A Distant Signal on the wall in each size it’s sold in',
    hint: 'Pick a size: the print changes to its physical width next to the 36-inch console. Apply keeps it; Cancel puts it back.'},
  {id: 'buy', screen: 'drop', art: 'signal', title: 'Buy a print, then find the order in the artist’s studio',
    hint: 'Checkout takes no money: pay with the Apple Pay demo. After the receipt, open the screen menu (the three dots) and go to Orders.'},
];

// Round 1 → round 2 of the same screens, from the archived shots (scripts/build-round-pairs.mjs).
const R = '/assets/product/atelier/rounds/';
const ROUNDS = [
  {id: 'check', tab: 'Print check', caption: 'The print check. Round 1 put every paper size on a ruler; round 2 leads with the largest sharp size and keeps the ruler one tap away.',
    before: {src: `${R}check-r1.webp`, label: 'Round 1'}, after: {src: `${R}check-r2.webp`, label: 'Round 2'}},
  {id: 'wall', tab: 'Size sheet', caption: 'Choosing a size on the wall. Round 1 offered Done and Buy in the same sheet; round 2 has Cancel and Apply, and you buy on the product page.',
    before: {src: `${R}wall-r1.webp`, label: 'Round 1'}, after: {src: `${R}wall-r2.webp`, label: 'Round 2'}},
  {id: 'checkout', tab: 'Checkout', caption: 'Checkout. Round 1 placed the order as soon as the address was in; round 2 is step 1 of 3, before payment and a review of the total.',
    before: {src: `${R}checkout-r1.webp`, label: 'Round 1'}, after: {src: `${R}checkout-r2.webp`, label: 'Round 2'}},
];
// From d2-atelier-prototype/README.md, "Round 2: design review".
const CHANGES = [
  {what: 'Collectors choose only from sizes the artist offers and the file can print; other formats say why they’re missing.', why: 'No “Too small” options sitting next to the ones you can buy.'},
  {what: 'Cancel and Apply in the size sheet; Buy print lives on the product page.', why: 'Changing an option and committing to a purchase are different moments.'},
  {what: 'One price calculation everywhere: +$4 production cost for the artist, the exact +$4.35 retail difference for collectors.', why: 'The artist’s earnings hold, and every total on every screen agrees.'},
  {what: 'A full checkout: delivery, an Apple Pay-style demo or a card, a review with the total, and a way back from a declined card.', why: 'Round 1 created the order the moment an address went in. Now it exists only after a (simulated) payment.'},
  {what: 'Five named steps, “Step 2 of 5,” a saved-draft status, and a way back in from Home.', why: 'You can see how much is left, and leave and come back.'},
  {what: 'Larger artwork, a full-screen inspector with zoom, and the whole 9:16 story in view before you save it.', why: 'Collectors look at the actual work; artists see the image they’re about to post.'},
];

const NUMBERS = [
  {value: 22, label: 'Screens in the coded prototype', note: 'Artist and collector sides, checkout included, all clickable'},
  {value: 8, label: 'Paintings of mine as the catalog', note: 'No stock art and no generated images'},
  {value: 300, unit: 'dpi', label: 'Floor for every print size', note: 'A size below it can’t be sold'},
];

/** The rejected and chosen primary action, drawn rather than described. The blue one is recreated from my notes. */
function InkVisual() {
  return <div className="at-ink">
    <span className="at-ink-old">Publish drop</span>
    <span className="at-ink-new">Publish your drop</span>
  </div>;
}

/** Four tools an artist stitches together, and the questions that fall through the seams between them. */
function Seams() {
  const art = id => <img src={`${ART}${id}.webp`} alt="" loading="lazy" decoding="async"/>;
  return <figure className="at-seams" data-reveal="">
    <ol className="at-seams-row">
      <li className="at-tool"><span className="at-tool-sketch is-post">{art('return')}<i/><i/></span>
        <b>Instagram</b><span>where the audience is</span></li>
      <li className="at-seam"><span>Will this size print sharp?</span></li>
      <li className="at-tool"><span className="at-tool-sketch is-shop">{art('spring')}{art('clouds')}{art('quiet-gate')}{art('between')}</span>
        <b>A storefront</b><span>Etsy, Big Cartel, INPRNT or Shopify</span></li>
      <li className="at-seam"><span>What do I keep after fees?</span></li>
      <li className="at-tool"><span className="at-tool-sketch is-print">{art('red-planet')}<i>18 × 24 in</i><i/></span>
        <b>A print service</b><span>makes and ships the print</span></li>
      <li className="at-seam"><span>Where’s my order?</span></li>
      <li className="at-tool"><span className="at-tool-sketch is-dm"><i/><i/><i/><i/></span>
        <b>DMs</b><span>customer service, by hand</span></li>
    </ol>
    <figcaption className="v2-caption"><Ev label="Hypothesis"/> <span>The tools are real; the questions in the seams are my guess at where time and sales go missing.</span></figcaption>
  </figure>;
}

export default function AtelierCase({item, reduced}) {
  const root = useRef(null);
  const phone = useMedia(PHONE);
  useReveals(root, reduced, [phone]);
  const next = nextCase(item.slug);
  const scrollToTry = e => {
    const target = root.current?.querySelector('#try');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: reduced || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('button, a')?.focus({preventScroll: true});
  };

  return <article ref={root} className="pp-page v2-page at-page" lang="en" data-nav-tone="light">
    <CaseHero reduced={reduced} title="Atelier" kind={item.kind}
      outcome="A print studio for illustrators: from a finished painting to a published, shareable print in five named steps, with print quality and earnings checked before anything goes live."
      chips={['Solo: research, product and visual design, code', 'October 2026', 'iOS concept', 'Not yet tested with artists']}
      actions={phone
        ? <a className="v2-cta" href={protoUrl('onboarding')} target="_blank" rel="noopener"><span>Open the prototype</span><span className="v2-cta-icon"><ArrowUpRight/></span><span className="v2-sr"> (opens in a new tab)</span></a>
        : <a className="v2-cta" href="#try" onClick={scrollToTry}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}>
      <div className="at-stage" data-enter="stage">
        <div className="at-stage-print" data-enter="back">
          <div data-depth="10">
            <figure className="at-print" data-zoom-group="">
              <img src={`${ART}signal.webp`} width={1600} height={868} alt="A Distant Signal, one of my paintings: a lone traveler walking toward a beacon of light in a misty valley." fetchPriority="high"
                {...zoomable('A Distant Signal, one of my paintings: a lone traveler walking toward a beacon of light in a misty valley')}/>
            </figure>
          </div>
        </div>
        <div className="at-stage-device" data-enter="front">
          <div data-depth="22">
            <div className="at-float">
              <Phone label="The Atelier prototype">
                <ProtoScreen screen="drop" art="signal" load={phone ? 'never' : 'idle'} delay={1600} interactive={!phone} reduced={reduced}
                  title="Atelier prototype: the shop page for A Distant Signal" alt="The shop page for A Distant Signal: the framed print, $38, Buy print."/>
              </Phone>
            </div>
          </div>
        </div>
        <p className="at-stage-note" data-enter="note">{phone ? 'The shop page a collector opens from a shared link' : 'Live prototype. Tap around; nothing is saved outside your browser.'}</p>
      </div>
    </CaseHero>
    <CaseChrome root={root} chapters={CHAPTERS} reduced={reduced}/>

    <NumberStrip items={NUMBERS} reduced={reduced} label="Atelier in numbers"/>

    <section id="at-problem-section" className="v2-problem" aria-labelledby="at-problem">
      <div className="v2-problem-copy" data-reveal="">
        <h2 id="at-problem" className="v2-h2">Four tools to sell one print</h2>
        <div className="v2-prose">
          <p>The illustrators I studied with sell prints at conventions and online. Online means stitching tools together: Instagram for the audience, a storefront, a print-on-demand service, and DMs for customer service.</p>
          <p>Each tool works on its own. My hunch is that artists lose time and sales in the seams between them, so Atelier puts the whole drop in one place.</p>
        </div>
        <p className="v2-hyp"><Ev label="Hypothesis"/><span>From the artists I know, not from interviews yet. Test day will confirm or replace it.</span></p>
      </div>
      <aside className="v2-quote-slot" data-reveal="" aria-label="Interview quotes, not collected yet">
        <p className="v2-slot-badge">Placeholder</p>
        <p>Quotes from 3–5 illustrator classmates go here after test day: how they sell now, their last sale, what annoys them.</p>
      </aside>
      <Seams/>
    </section>

    <Scrolly id="at-flow" reduced={reduced} steps={STEPS} art="blue-hour" label="The drop flow" title="Atelier prototype, following the steps"
      heading="Five steps to a drop, then share it"
      lede="The artist side is where the product earns its keep. Scroll through a drop; the phone runs the real prototype."/>

    <section id="at-checks" className="at-checks" aria-labelledby="at-checks-title">
      <div className="v2-section-head" data-reveal="">
        <h2 id="at-checks-title" className="v2-h2">Three checks, by hand</h2>
        <p className="v2-lede">The print check, the price and the wall, with the prototype’s own numbers and eight of my paintings. Pick a painting once; all three follow it.</p>
      </div>
      <Deferred minHeight={1400} label="The print check, earnings and wall, to try"><AtelierChecks reduced={reduced}/></Deferred>
    </section>

    <Decisions id="at-decisions" items={DECISIONS}
      heading="What I chose, and what I tried first"
      lede="Five choices from three rounds of critique. Each card shows the choice; open it to see what it replaced."/>

    <BeforeAfter id="at-compare" reduced={reduced} pairs={ROUNDS} label="Compare round 1 with round 2"
      heading="Round 1 → Round 2"
      lede="Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.">
      <p className="v2-review-note"><span><b>A model-assisted design review.</b> I asked a model to critique round 1 as an Apple design lead would. It scored craft 6, interaction 5 and product thinking 7, and ranked eight fixes; round 2 builds all eight. It’s a critique, not a test with artists.</span></p>
      <RoundChanges items={CHANGES}/>
    </BeforeAfter>

    <LivePrototype id="try" reduced={reduced} tasks={TASKS} start={{screen: 'onboarding', art: 'blue-hour'}}
      heading="Try it yourself"
      lede="This is the same prototype, at full size. Pick a task; the phone opens on the right screen."
      phoneLede="This is the same prototype. Each task opens it full screen, on the screen where the task starts."
      note="It runs in your browser only: no account, no payment, no shipping. Drafts and test orders stay in this browser until you reset."/>

    <section id="at-testing-section" className="v2-testing" aria-labelledby="at-testing">
      <div className="v2-section-head" data-reveal="">
        <h2 id="at-testing" className="v2-h2">Testing comes next</h2>
        <p className="v2-lede">Nothing here has been tested with artists yet. This is the plan, and the space the results will fill.</p>
      </div>
      <div className="v2-testing-grid">
        <div className="v2-testing-plan" data-reveal="">
          <h3 className="v2-h3">Plan for test day</h3>
          <ul className="v2-list">
            <li>3–5 illustrator classmates each publish a drop of their own work and buy a print as a collector.</li>
            <li>Five extra minutes each: how they sell now, their last sale, what they’d pay.</li>
            <li>A desk scan of Etsy, INPRNT, Society6, Big Cartel, Shopify with Printful, Instagram Shop and Ko-fi.</li>
          </ul>
          <h3 className="v2-h3">Hypotheses to check</h3>
          <ul className="v2-hypotheses">
            <li><Ev label="Hypothesis"/><span>Artists lose time and sales in the seams between tools.</span></li>
            <li><Ev label="Hypothesis"/><span>Artists can’t tell which sizes of a file will print sharp.</span></li>
            <li><Ev label="Hypothesis"/><span>Seeing earnings before publishing changes the price they set.</span></li>
          </ul>
        </div>
        <div className="v2-results" data-reveal="" aria-label="Results, not collected yet">
          <p className="v2-slot-badge">Placeholder: results after test day</p>
          <dl>
            <div><dt>Published a drop without help</dt><dd>— of 5</dd></div>
            <div><dt>Time from upload to published</dt><dd>— min</dd></div>
            <div><dt>Would sell the sizes the check allowed</dt><dd>— of 5</dd></div>
          </dl>
          <p className="v2-results-note">Each result will sit next to the change it caused.</p>
        </div>
      </div>
    </section>

    <section id="at-reflection-section" className="v2-reflection" aria-labelledby="at-reflection">
      <h2 id="at-reflection" className="v2-h2" data-reveal="">Reflection</h2>
      <div className="v2-reflection-grid">
        <div data-reveal=""><h3 className="v2-h3">What I’d keep</h3><p>The print check at the center. It is the one thing a storefront or a print service can’t tell an artist before the sale, and everything after it (sizes, price, preview) gets simpler because of it.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What I don’t know yet</h3><p>Whether the money works at 2–20 sales a month. The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What’s next</h3><p>Test day. Round 2 answered a model’s critique; artists decide round 3. The collector side, now with a full checkout, gets the same scrutiny as the drop flow.</p></div>
      </div>
    </section>

    <NextProject item={next} visual={next.slug === 'last-100-feet' ? <L100TileArt/> : null} image={next.thumb}/>
    <ProductFooter/>
    <CursorLabel root={root} reduced={reduced}/>
  </article>;
}
