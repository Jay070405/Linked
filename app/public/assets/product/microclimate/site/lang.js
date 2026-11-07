// The page is written in Chinese. ?lang=en (the portfolio passes the site's language in) swaps in the English below
// before the modules run, so the words split and animate in whichever language the page opens in. main.js and app.js
// write their own lines as MC.T('中文', 'English').
//
// Inside the portfolio the page sits in an iframe under the site's header: it tells the site which tone the current
// section has (main.js), and when the site's language switch changes, it reloads itself in the other language at the
// same scroll position.
(() => {
  let lang = 'zh';
  try { lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh'; } catch { /* stays Chinese */ }
  const en = lang === 'en';
  window.MC = { lang, en, T: (zh, english) => (en ? english : zh), embedded: window.parent !== window };
  document.documentElement.lang = en ? 'en' : 'zh-CN';

  // back where the reader was, after a language switch
  try {
    const y = sessionStorage.getItem('mc-y');
    if (y !== null) { sessionStorage.removeItem('mc-y'); if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; scrollTo(0, +y); }
  } catch { /* storage is optional */ }
  if (window.MC.embedded) {
    addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.mc !== 'lang' || (e.data.lang === 'en' ? 'en' : 'zh') === lang) return;
      try { sessionStorage.setItem('mc-y', String(scrollY)); } catch { /* starts at the top */ }
      const u = new URL(location.href); u.searchParams.set('lang', e.data.lang === 'en' ? 'en' : 'zh'); location.replace(u.href);
    });
  }
  if (!en) return;

  const w = (s) => s;      // English breaks at its spaces; the Chinese keeps its phrases whole with .w
  // [selector, innerHTML] or [selector, value, attribute]
  const EN = [
    ['title', 'Microclimate'],
    ['.ld-text', 'Loading the chair'],
    ['.nav-name', 'Microclimate'],
    ['.nav nav', 'Sections', 'aria-label'],
    ['.nav nav', '<a href="#zones">Zones</a><a href="#thermal">Thermal</a><a href="#posture">Posture</a><a href="#adjust">Adjust</a><a href="#finish">Finish</a><a href="#parts">Parts</a><a href="#app">App</a><a href="#specs">Specs</a><a href="#process">Process</a>'],

    ['.hero-kicker', 'Industrial design, 3D modelling, iOS app'],
    ['#hero h1', 'Microclimate'],
    ['.hero-lede', 'An ergonomic office chair. The upper back, the lower back and the seat are three zones, and each one heats or blows air on its own. The backrest and the lumbar support move on motors.'],
    ['.hero-meta', '<span>Jay Lin</span><span>November 2026</span><span>Concept, not built yet</span>'],

    ['#zones .statement', `The thermostat sets one temperature.<span class="lo">${w('Where you touch the chair,')} ${w('your back, lower back and thighs')} ${w('each run warmer or cooler.')}</span>`],
    ['.zones-note', 'So the chair has three zones, and each one heats or cools on its own.'],
    ['.callouts', '<div class="callout" data-zone="A"><b>Upper back</b><span>3 heat levels, 3 air levels</span></div><div class="callout" data-zone="B"><b>Lower back</b><span>3 heat levels, 3 air levels</span></div><div class="callout" data-zone="C"><b>Seat</b><span>3 heat levels, 3 air levels</span></div>'],

    ['#thermal h2', 'Through a thermal camera'],
    ['#thermal .seg', 'View', 'aria-label'],
    ['#thermal .seg [data-th="0"]', 'Photo'],
    ['#thermal .seg [data-th="1"]', 'Thermal'],
    ['.th-steps', [
      ['09:00', 'Just sat down', 'The room is 24°C, and so is the chair.'],
      ['09:02', 'Seat on heat 2, upper back on heat 1', 'Heat spreads out from the wire under the fabric. The seat reaches 35°C and the upper back 33°C.'],
      ['09:32', 'After 30 minutes the heat turns itself off', 'The fabric surface stays at or under 43°C. If the wire passes 45°C, the hardware cuts the power without waiting for software.'],
      ['14:00', 'The room is up to 27°C, so it switches to air', 'Seat on air 2, lower back on air 1. Air comes up through the fabric, and the wire stays off while it does.'],
      ['18:30', 'Ten seconds after you stand up, all three zones turn off', 'With nobody in the seat, the chair stops the heat and the fans.'],
    ].map(([t, h, p]) => `<li><time>${t}</time><h3>${h}</h3><p>${p}</p></li>`).join('')],
    ['.th-zones', '<div data-z="A"><span>Upper back</span><b>24.0°</b></div><div data-z="B"><span>Lower back</span><b>24.0°</b></div><div data-z="C"><span>Seat</span><b>24.0°</b></div>'],
    ['.th-tip', 'Hover over the chair to read the temperature at that spot'],

    ['#posture .statement', `${w('The backrest and lumbar')} ${w('move on motors.')}<span class="lo">${w('Use the keys on the armrest,')} ${w('or let the AI set them the way you usually sit.')}</span>`],
    ['.readouts > div:nth-child(1) span', 'Recline'],
    ['.readouts > div:nth-child(2) span', 'Lumbar height'],
    ['.readouts > div:nth-child(3) span', 'Lumbar depth'],
    ['.panel', 'Armrest control panel', 'aria-label'],
    ['.rocker[data-axis="recl"] > span', 'Back'],
    ['.rocker[data-axis="lum"] > span', 'Lumbar'],
    ['.rocker[data-axis="recl"] [data-dir="-1"]', 'Backrest forward', 'aria-label'],
    ['.rocker[data-axis="recl"] [data-dir="1"]', 'Backrest back', 'aria-label'],
    ['.c-up', 'Lumbar up', 'aria-label'],
    ['.c-dn', 'Lumbar down', 'aria-label'],
    ['.c-fwd', 'Lumbar forward', 'aria-label'],
    ['.c-back', 'Lumbar back', 'aria-label'],
    ['#aiKey', 'AI: reading posture'],
    ['#stopKey', 'Pause AI'],
    ['#aiStatus', 'Hold an arrow to move the backrest or lumbar, or tap “AI: reading posture” and let the AI do it.'],
    ['.posture-note', 'The lumbar key moves four ways: up and down for height, forward and back for depth. The AI changes one thing at a time, at most 8° of recline, 10 mm of lumbar height or 5 mm of depth, with at least 10 minutes between changes. Seat height, seat depth, the armrests and the headrest are set by hand.'],

    ['#adjust .statement', `The chair adjusts in 11 ways.<span class="lo">${w('8 by hand,')} ${w('3 by motor.')}</span>`],

    ['#finish .statement', `Two finishes.<span class="lo">${w('A white frame with light grey fabric,')} ${w('a black frame with dark grey.')}</span>`],
    ['.swatches', 'Finish', 'aria-label'],
    ['.swatches [data-fin="white"]', '<i></i>White'],
    ['.swatches [data-fin="black"]', '<i></i>Black'],
    ['.mats', [
      ['Fabric', 'Knit. The covers on all three pads zip off for washing.'],
      ['Frame and shells', 'The spine and upright are die-cast aluminium, painted. The pad shells are injection-moulded PP in the frame colour.'],
      ['Base', 'Die-cast aluminium: polished on the white chair, painted black on the black one.'],
      ['Arm pads', 'PU foam, replaceable on their own when they wear.'],
    ].map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')],

    ['#parts .statement', `Taken apart, it is 12 parts.<span class="lo">${w('Pick a route')} ${w('to see which parts it runs through.')}</span>`],
    ['#parts .tabs', 'Routes', 'aria-label'],
    ['#parts .tabs [data-path="all"]', 'All'],
    ['#parts .tabs [data-path="heat"]', '<i class="dot heat"></i>Heat'],
    ['#parts .tabs [data-path="air"]', '<i class="dot air"></i>Air'],
    ['#parts .tabs [data-path="power"]', '<i class="dot power"></i>Power'],
    ['#parts .tabs [data-path="motion"]', '<i class="dot motion"></i>Motion'],
    ['#pathText', 'Keep scrolling and the chair comes apart.'],

    ['#make .title', `${w('What it is made of,')} ${w('and what you replace')}`],
    ['#make .sub', 'The chair is 11 modules. The heating wire and sensors in each pad come out on one plug, so a broken one is swapped whole. The materials follow what similar office chairs use; structural engineers and suppliers would still need to confirm them.'],
    ['.mk', '<div class="mk-h"><span>Module</span><span>Material and process</span><span>Service</span></div>' + [
      ['Headrest', 'PA injection-moulded shell; knit fabric over foam; aluminium stem.', 'Slides out whole.'],
      ['Upper back pad', 'Injection-moulded PP shell, knit cover. Inside: heating wire, a temperature and humidity sensor, an air plenum and a fan.', 'The cover unzips for washing; the heating layer is replaced whole.'],
      ['Lumbar', 'Built like the upper back, plus a spring-steel plate and the motor that moves it up and down.', 'The cover comes off for washing.'],
      ['Lumbar dock and core', 'Die-cast dock, painted; aluminium extrusion core. Inside: the small depth motor and a self-locking lead screw.', 'Usually stays on.'],
      ['Spine and upright', 'Die-cast aluminium, painted. The back’s distribution board and the three zone lights sit inside.', 'Stays on.'],
      ['Seat', 'PP seat pan; a softer foam front edge; a pressure film that tells whether anyone is sitting.', 'Cover off for washing; heating layer replaced whole.'],
      ['Seat plate and skirt', 'Stamped steel plate, PP skirt, TPE seal along the front.', '—'],
      ['Armrests, two', 'Die-cast aluminium posts, PU foam pads. The right arm carries the control panel and NFC.', 'The pads can be replaced.'],
      ['Under-seat pod', 'Die-cast aluminium tray, PC/ABS cover. Inside: battery, main board, seat fan and filter, two recliners and the recline motor.', 'The battery slides out through its door; the filter is replaceable; four screws on the cover give access to the board.'],
      ['Gas lift', 'Class 4 gas lift, 130 mm stroke, a standard part.', 'Replaceable.'],
      ['Base and casters', 'Die-cast aluminium base; standard casters.', 'Replaceable.'],
    ].map(([b, m, r]) => `<div class="mk-r"><b>${b}</b><p>${m}</p><p>${r}</p></div>`).join('')],

    ['#app .statement', `Or use the phone app.<span class="lo">${w('Set the three zones, switch scenes,')} ${w('and see what the AI has learned.')}</span>`],
    ['.app-copy p', 'Open a zone and drag the slider: up for heat, down for air, and the chair on the right follows. You don’t need the phone; the armrest does all of it too.'],
    ['#iphone', 'App prototype, clickable', 'aria-label'],
    ['.glance-head', 'Lock Screen and Dynamic Island'],
    ['.glance-sub', 'Heat runs for 30 minutes at most. While it’s on, the Lock Screen and the Dynamic Island show how long is left, so you don’t have to open the app.'],

    ['#specs .title', 'Specs'],
    ['#specs .sub', 'Seat height is measured to the seat with someone sitting on it. Battery life is an estimate and hasn’t been measured.'],
    ['.sb:nth-child(1) h3', 'Heat'],
    ['.sb:nth-child(1) > p:last-child', 'Three levels, with the heating wire under the fabric. Each zone switches on separately and turns off after 30 minutes. The fabric surface tops out at 43°C; at 45°C a hardware cut-off trips without going through software.'],
    ['.sb:nth-child(2) h3', 'Air'],
    ['.sb:nth-child(2) > p:last-child', 'Three centrifugal fans. The seat’s sits in the pod and draws air through the grille underneath; the lower and upper back’s sit behind their pads. Air comes out under the fabric, and the heating wire is off while it does.'],
    ['.sb:nth-child(3) h3', 'Battery'],
    ['.sb:nth-child(3) > p:last-child', 'Slots into the pod and slides out to charge on its own. You can also use the chair while it charges.'],
    ['.sb:nth-child(4) h3', 'Finger gaps'],
    ['.sb:nth-child(4) .big', '≤8 or ≥25<small>mm</small>'],
    ['.sb:nth-child(4) > p:last-child', 'Gaps between powered parts that a hand can reach follow EN 1335-2: small enough that a finger can’t get in, or big enough that it can’t get caught.'],
    ['.sb-ai', '<h3>What the AI can change</h3><ul class="chips"><li>Zone levels</li><li>Recline</li><li>Lumbar height</li><li>Lumbar depth</li></ul>' +
      '<p>It moves only once you’ve settled, and one thing at a time: at most 8° of recline, 10 mm of lumbar height or 5 mm of depth, at least 10 minutes apart. Touch a key, the knob or a zone button and the AI pauses.</p>' +
      '<h3>How it knows who is sitting</h3><ul class="chips plain"><li>Armrest menu</li><li>NFC</li><li>Phone</li></ul>'],

    ['#process .title', 'How it was made'],
    ['#process .sub', 'Over a dozen rounds, each with someone pointing out what was wrong. These were the big changes.'],
    ['.versions', [
      ['v3', 'V3 chair render', 'V3–V7', 'Forms I made up: side rails, a hip pivot, a one-piece shell. They looked bad and weren’t ergonomic.'],
      ['v8', 'V8 chair render', 'V8', 'Switched to a proven synchro-tilt base, with separate pads on a thin frame. It didn’t wrap around you.'],
      ['v9', 'V9 chair render', 'V9', 'Rebuilt on a reference chair’s Y spine and twin backrest, then added the heating and the motors.'],
      ['v9c', 'V9c chair render', 'V9b–c', 'A deeper underside for the battery and board; a sturdier lumbar and base; the wiring, motors and air paths drawn in.'],
      ['v9e', 'V9e chair render', 'V9d–e', 'Dimensions checked against European and Chinese standards; the pivot moved under the hips with a real synchro linkage; two rounds of outside review.'],
      ['v9h', 'V9h chair render', 'V9g–i', 'Chasing gap numbers went too far: the gaps grew and the proportions got thin.'],
      ['v9k', 'V9k chair render', 'V9j–k', 'Back to the approved proportions; lumbar depth on a core you can see; a seal under the seat.'],
      ['v9l', 'V9l exploded render', 'V9l', 'The AI can also move the recline and lumbar height; a pause key on the armrest; the chair split into 11 modules; the phone app.'],
      ['v9m', 'V9m side render at 30° recline', 'V9m', 'At 30° of recline the rubber boot under the seat ran 3.6 mm into the fork, so the boot was reshaped. Lumbar depth became motorised, and the armrest’s lumbar key now moves four ways.'],
    ].map(([f, alt, b, p]) => `<li><img src="assets/process/${f}.webp" alt="${alt}" loading="lazy"><b>${b}</b><p>${p}</p></li>`).join('')],

    ['.foot-in', '<div><b>Microclimate</b><p>Concept design, November 2026. Not built or tested yet.</p></div><div><b>Design</b><p>Jay Lin</p></div>' +
      '<div><b>This page</b><p>The chair on this page is the Blender model itself, exported and rendered live in the browser with three.js. The app is a clickable prototype.</p></div>'],
  ];
  for (const [sel, value, attr] of EN) {
    const el = document.querySelector(sel); if (!el) { console.warn('lang.js: nothing at', sel); continue; }
    if (attr) el.setAttribute(attr, value); else el.innerHTML = value;
  }
})();
