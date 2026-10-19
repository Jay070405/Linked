import {useRef} from 'react';
import {Ev} from '../CaseKit';
import {ProductFooter} from '../ProductIndex';
import {nextCase} from '../content';
import CaseHero from '../v2/CaseHero';
import NumberStrip from '../v2/NumberStrip';
import Scrolly from '../v2/Scrolly';
import Decisions from '../v2/Decisions';
import BeforeAfter from '../v2/BeforeAfter';
import LivePrototype from '../v2/LivePrototype';
import NextProject from '../v2/NextProject';
import CursorLabel from '../v2/CursorLabel';
import {Phone, ProtoScreen, protoUrl, shotSrc} from '../v2/Device';
import {ArrowDown, ArrowUpRight} from '../v2/icons';
import {PHONE, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './atelier.css';

// Sources: cases/d2-atelier/BRIEF.md and d2-atelier-prototype/README.md + DESIGN.md (Oct 19, 2026).
// Every number below comes from the prototype or the brief. Research is still a plan: illustrator pain points are
// labeled Hypothesis until Jay's interviews on test day.

const ART = '/proto/atelier/art/';

const STEPS = [
  {id: 'upload', screen: 'upload', label: 'Choose a work', title: 'Start from the finished piece',
    alt: 'Choose an artwork: a grid of eight paintings with their pixel sizes',
    body: <p>A drop begins with the original file, not a product form. The sample archive is eight of my own paintings, each listed with its real pixel&nbsp;size.</p>},
  {id: 'check', screen: 'check', label: 'Print check', title: 'Check the print before anything else',
    alt: 'Print check: sharp up to 8 by 10 inches, with paper sizes compared on a ruler',
    body: <p>Atelier reads the file’s pixels. <em>The Blue Hour</em> is 4,096&nbsp;×&nbsp;2,160&nbsp;px, so it prints sharp up to 8&nbsp;×&nbsp;10&nbsp;in at 300&nbsp;dpi. Bigger sizes stay on the ruler, greyed out, and a tap explains why.</p>},
  {id: 'sizes', screen: 'sizes', label: 'Sizes and paper', title: 'Offer only sizes that print well',
    alt: 'Sizes and paper: 5 by 7 and 8 by 10 offered, larger sizes marked too small',
    body: <p>Sizes that failed the check can’t be selected. Paper is one decision: studio matte is included, cotton rag adds $4 to the production cost.</p>},
  {id: 'price', screen: 'price', label: 'Price', title: 'See what you keep before you publish',
    alt: 'Set your price: $38 for 8 by 10, minus $11 print and paper and $3.34 fee, you keep $23.66',
    body: <p>At $38 for an 8&nbsp;×&nbsp;10: $11 for print and paper, $3.34 in fees (8%&nbsp;+&nbsp;$0.30), $23.66 to the artist. Other sizes are priced so the artist keeps the same amount.</p>},
  {id: 'preview', screen: 'preview', label: 'Preview', title: 'Look at it the way a collector will',
    alt: 'Review your drop: the shop page with the painting, sizes, paper and starting price',
    body: <p>The shop page before it goes live: the whole painting inside its white border, the offered sizes, the paper, the starting price. No listing fee.</p>},
  {id: 'share', screen: 'share', label: 'Publish and share', title: 'Publish and share in one step',
    alt: 'Share this drop: a story image with the painting, title, price and a Shop tag',
    body: <p>Publishing opens the share sheet: one shop link and a 1080&nbsp;×&nbsp;1920 story image with the title, the price and a Shop&nbsp;tag.</p>},
];

const DECISIONS = [
  {id: 'ruler', title: 'A ruler, not a checklist', verdict: 'Explain the one decision the product exists for.',
    tried: 'A ladder of sizes with checkmarks.',
    chose: 'Every paper size drawn on a ruler at 12 px per inch, the largest safe size named, and the dpi behind each verdict one tap away.',
    visual: <img src={shotSrc('check')} alt="" loading="lazy" style={{objectPosition: '50% 62%'}}/>},
  {id: 'fees', title: 'Earnings that don’t shrink', verdict: 'A bigger print shouldn’t pay the artist less.',
    tried: 'Raising each larger size by its extra print cost.',
    chose: 'Dividing the extra cost by 0.92 before rounding, so the 8% fee doesn’t eat into the artist’s cut.',
    visual: <img src={shotSrc('price')} alt="" loading="lazy" style={{objectPosition: '50% 66%'}}/>},
  {id: 'wall', title: 'Scale you can trust', verdict: 'A size only means something next to furniture.',
    tried: 'A flat room with a small, static print.',
    chose: 'A lit wall, a 36-inch console and a fixed 48-inch view. The print is drawn at its physical width.',
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
  {id: 'size', screen: 'check', art: 'blue-hour', title: 'Check whether The Blue Hour can be sold at 12 × 16 in',
    hint: 'Tap the 12 × 16 size on the ruler to see its dpi and the reason.'},
  {id: 'price', screen: 'price', art: 'blue-hour', title: 'Set a price for an 8 × 10 and see what you keep',
    hint: 'Change the price; the breakdown and “You keep” update as you type.'},
  {id: 'wall', screen: 'wall', art: 'signal', title: 'As a collector, try A Distant Signal on your wall in each size it’s sold in',
    hint: 'Pick a size: the frame changes to its physical width next to the 36-inch console.'},
  {id: 'buy', screen: 'drop', art: 'signal', title: 'Buy a print, then find the order in the artist’s studio',
    hint: 'Checkout takes no payment. After the receipt, open the screen menu (the three dots) and go to Orders.'},
];

const NUMBERS = [
  {value: 19, label: 'Screens in the coded prototype', note: 'Artist and collector sides, all clickable'},
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
      outcome="A print studio for illustrators: from a finished painting to a published, shareable print in six steps, with print quality and earnings checked before anything goes live."
      chips={['Solo: research, product and visual design, code', 'October 2026', 'iOS concept', 'Not yet tested with artists']}
      actions={phone
        ? <a className="v2-cta" href={protoUrl('onboarding')} target="_blank" rel="noopener"><span>Open the prototype</span><span className="v2-cta-icon"><ArrowUpRight/></span><span className="v2-sr"> (opens in a new tab)</span></a>
        : <a className="v2-cta" href="#try" onClick={scrollToTry}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}>
      <div className="at-stage" data-enter="stage">
        <div className="at-stage-print" data-enter="back">
          <div data-depth="10">
            <figure className="at-print">
              <img src={`${ART}signal.webp`} width={1600} height={868} alt="A Distant Signal, one of my paintings: a lone traveler walking toward a beacon of light in a misty valley." fetchPriority="high"/>
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

    <NumberStrip items={NUMBERS} reduced={reduced} label="Atelier in numbers"/>

    <section className="v2-problem" aria-labelledby="at-problem">
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
      heading="One drop, six steps"
      lede="The artist side is where the product earns its keep. Scroll through a drop; the phone runs the real prototype."/>

    <Decisions id="at-decisions" items={DECISIONS}
      heading="What I chose, and what I tried first"
      lede="Five choices from the first two rounds of critique. Each card shows the choice; open it to see what it replaced."/>

    <BeforeAfter id="at-compare" reduced={reduced} label="Compare round 1 and the round-2 build of the print check"
      heading="Round 1, and round 2 taking shape"
      lede="Drag across the phone to compare the print check as I first reviewed it with the round-2 build."
      before={{src: '/assets/product/atelier/round1-check.webp', label: 'Round 1', caption: 'Left: round 1, the build on this page.'}}
      after={{src: '/assets/product/atelier/round2-check-wip.webp', label: 'Round 2, in progress', caption: 'Right: round 2, captured mid-build on Oct 19.'}}>
      <p className="v2-slot-badge">Round 2 is still being built</p>
      <p>So far, round 2 centers the screen title, draws the step bar in ink instead of blue, sets the supporting text larger and turns the main action into a full pill.</p>
      <p>It isn’t finished or tested, so the prototype embedded on this page is still round 1. When round 2 is done I’ll write down why each change was made, and testing will decide which ones stay.</p>
    </BeforeAfter>

    <LivePrototype id="try" reduced={reduced} tasks={TASKS} start={{screen: 'onboarding', art: 'blue-hour'}}
      heading="Try it yourself"
      lede="This is the same prototype, at full size. Pick a task; the phone opens on the right screen."
      phoneLede="This is the same prototype. Each task opens it full screen, on the screen where the task starts."
      note="It runs in your browser only: no account, no payment, no shipping. Drafts and test orders stay in this browser until you reset."/>

    <section className="v2-testing" aria-labelledby="at-testing">
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

    <section className="v2-reflection" aria-labelledby="at-reflection">
      <h2 id="at-reflection" className="v2-h2" data-reveal="">Reflection</h2>
      <div className="v2-reflection-grid">
        <div data-reveal=""><h3 className="v2-h3">What I’d keep</h3><p>The print check at the center. It is the one thing a storefront or a print service can’t tell an artist before the sale, and everything after it (sizes, price, preview) gets simpler because of it.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What I don’t know yet</h3><p>Whether the money works at 2–20 sales a month. The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What’s next</h3><p>Test day, then round 2 of the prototype. The collector side, a smaller set of screens, gets the same scrutiny as the drop flow.</p></div>
      </div>
    </section>

    <NextProject item={next} image={next.thumb}/>
    <ProductFooter/>
    <CursorLabel root={root} reduced={reduced}/>
  </article>;
}
