import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {author} from '../portfolioData';
import AboutBadge from './AboutBadge';
import {useCaseLang} from './i18n';
import {ART, COPY, EDUCATION, FACTS, LANGUAGES, SIDES, SIDE_IDS, STATIONS} from './about-content';
import {badgeHeight, clampOrigin, countText, openStations, smoothstep, wipeRadius} from './about-model';
import './worlds/arden/arden.css';
import './about.css';

function Count({number, play, reduced, index}) {
  const el = useRef(null);
  useEffect(() => {
    let raf, start;
    if (reduced) { el.current.textContent = countText(number.value, number.suffix, 1); return; }
    el.current.textContent = '0';
    if (!play) return;
    const tick = time => {
      start ??= time;
      const k = Math.max(0, Math.min(1, (time - start - index * 100) / 1100));
      el.current.textContent = countText(number.value, number.suffix, k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [number, play, reduced, index]);
  return <b ref={el} aria-label={countText(number.value, number.suffix, 1)}>{countText(number.value, number.suffix, reduced ? 1 : 0)}</b>;
}
function Contact({data, t, zh}) {
  const [copy, setCopy] = useState('idle'), timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(author.email); setCopy('copied'); }
    catch { setCopy('failed'); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setCopy('idle'), 2500);
  };
  return <div className="about-contact-content about-reveal">
    <div className="about-email"><a href={`mailto:${author.email}`}>{author.email}</a><button type="button" onClick={copyEmail} aria-label={zh ? '复制邮箱地址' : 'Copy email address'}>{copy === 'copied' ? (zh ? '已复制' : 'Copied') : (zh ? '复制' : 'Copy')}</button></div>
    <span className="ar-sr" role="status">{copy === 'copied' ? (zh ? '邮箱已复制' : 'Email copied') : copy === 'failed' ? (zh ? '暂时无法复制，请选中邮箱地址手动复制。' : 'Copy unavailable. Select the email address to copy it.') : ''}</span>
    <div className="about-contact-links"><a href={data.resume.href}>{t(data.resume.label)} ↗</a>{author.linkedin?.trim() && <a href={author.linkedin}>LinkedIn ↗</a>}<a href={data.allWork.href}>{t(data.allWork.label)} ↗</a></div>
  </div>;
}
function Rows({rows, t, loop = false}) {
  return rows.map((row, i) => {
    const Tag = row.href ? 'a' : 'div';
    return <Tag key={i} href={row.href} className="about-row about-reveal" style={{'--i': i}}>
      <span className="about-mono">{loop ? row.key : t(row.date)}</span><strong>{t(loop ? row.title : row.org)}</strong><small>{t(loop ? row.meta : row.note)}{row.href && <i aria-hidden="true"> ↗</i>}</small>
    </Tag>;
  });
}
function StationBody({id, data, t, zh, count, reduced}) {
  if (id === 'loop') return <Rows rows={data.loop} t={t} loop/>;
  if (id === 'experience') return <Rows rows={data.experience} t={t}/>;
  if (id === 'work') return <>
    <div className="about-cards">{data.work.map((work, i) => {
      const Tag = work.img ? 'a' : 'div';
      return <div key={i} className="about-reveal" style={{'--i': i}}><Tag className="about-work-card" href={work.img ? work.href : undefined}>
        <div className={`about-work-image${work.fit === 'phone' ? ' is-phone' : ''}`}>{work.img ? <img src={work.img} alt={t(work.title)} loading="lazy" width="560" height="336"/> : <span className="about-mono">{COPY.comingSoon}</span>}</div>
        <div className="about-work-text"><strong>{t(work.title)}</strong><p>{t(work.sub)}</p></div>
      </Tag></div>;
    })}</div>
    <div className="about-art about-reveal" style={{'--i': 5}}><p className="about-mono">{t(ART.label)}</p><div className="about-art-strip">{ART.images.map(img => <a href={ART.href} key={img.src}><img src={img.src} alt={t(img.alt)} width="320" height="192" loading="lazy"/></a>)}</div><a className="about-art-more" href={ART.href}>{t(ART.more)} ↗</a></div>
  </>;
  if (id === 'numbers') return <div className="about-numbers">{data.numbers.map((number, i) => <div className="about-reveal" style={{'--i': i}} key={i}><Count number={number} play={count} reduced={reduced} index={i}/><p>{t(number.what)}</p></div>)}</div>;
  if (id === 'skills') return <><div className="about-skills">{data.skills.map((group, i) => <div className="about-reveal" style={{'--i': i}} key={i}><p className="about-mono">{t(group.group)}</p><ul>{group.items.map((item, j) => <li key={j}>{t(item)}</li>)}</ul></div>)}</div><p className="about-languages about-reveal">{zh ? '语言 · ' : 'Languages · '}{t(LANGUAGES)}</p></>;
  if (id === 'education') return EDUCATION.map((row, i) => <div className="about-education about-reveal" key={i} style={{'--i': i}}><span className="about-mono">{t(row.date)}</span><div><strong>{t(row.school)}</strong><p>{t(row.note)}</p></div></div>);
  return <Contact data={data} t={t} zh={zh}/>;
}

export default function AboutPage({reduced = false}) {
  const {lang, t, htmlLang, zh} = useCaseLang();
  const root = useRef(null), worlds = useRef({}), center = useRef(null), triggerOrigin = useRef(null);
  const strapColor = useRef('#131315');
  const wipe = useRef(0), target = useRef('product'), wakeWipe = useRef(() => {});
  const [side, setSide] = useState('product'), [quiet, setQuiet] = useState(() => reduced || (typeof window !== 'undefined' && (matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('quiet'))));
  const [layout, setLayout] = useState({phone: false, height: 900, scroll: 0, block: 440});
  const [opened, setOpened] = useState(() => STATIONS.map(() => false));
  const instant = useRef(new Set()), initialized = useRef(false), restoreUntil = useRef(null);
  const [switchVisible, setSwitchVisible] = useState(false);
  const switchSide = useCallback((next, event) => {
    if (next === target.current) return;
    const button = event?.currentTarget, r = button?.getBoundingClientRect();
    if (r) triggerOrigin.current = {x: r.x + r.width / 2, y: r.y + r.height / 2};
    // A hint lives in the outgoing inert world. Transfer focus to its counterpart.
    const fromHint = button?.classList.contains('about-flip-hint') || worlds.current[target.current]?.contains(document.activeElement);
    target.current = next; setSide(next); wakeWipe.current();
    if (fromHint) requestAnimationFrame(() => worlds.current[next]?.querySelector('.about-flip-hint')?.focus({preventScroll: true}));
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setQuiet(reduced || media.matches || !!root.current?.closest('.quiet'));
    const observer = new MutationObserver(sync);
    // Only ancestor classes, not the animated world styles.
    for (let node = root.current?.parentElement; node; node = node.parentElement) observer.observe(node, {attributes: true, attributeFilter: ['class']});
    media.addEventListener('change', sync); sync();
    return () => { observer.disconnect(); media.removeEventListener('change', sync); };
  }, [reduced]);

  useLayoutEffect(() => {
    const el = root.current, scroller = el.closest('.portfolio-page-viewport') || window;
    restoreUntil.current ??= performance.now() + 250;
    let raf = 0, measureRaf = 0, disposed = false;
    const update = () => {
      raf = 0;
      const height = innerHeight, phone = innerWidth <= 900, scroll = Math.max(0, -el.getBoundingClientRect().top);
      const block = Math.max(360, Math.min(440, height * .52));
      setLayout(prev => prev.phone === phone && prev.height === height && prev.scroll === scroll ? prev : {phone, height, scroll, block});
      setSwitchVisible(!phone || scroll >= block);
      const sections = [...worlds.current.product.querySelectorAll('.about-station')];
      const tops = sections.map(node => node.getBoundingClientRect().top + scroll);
      const now = openStations(tops, scroll, height);
      if (!initialized.current || performance.now() < restoreUntil.current || quiet) now.forEach((yes, i) => { if (yes || quiet) instant.current.add(i); });
      initialized.current = true;
      setOpened(prev => { const next = prev.map((yes, i) => yes || now[i] || quiet); return next.every((v, i) => v === prev[i]) ? prev : next; });
      const contact = sections.at(-1), end = contact.getBoundingClientRect().bottom + scroll + 280;
      const begin = phone ? tops[0] : 0, tip = Math.max(begin, Math.min(end, scroll + (phone ? height * .45 : 150)));
      el.style.setProperty('--spine-start', `${begin}px`); el.style.setProperty('--spine-end', `${end}px`);
      el.style.setProperty('--travel', `${tip - begin}px`); el.style.setProperty('--tip', `${tip}px`);
      sections.forEach((node, i) => SIDE_IDS.forEach(id => worlds.current[id].querySelectorAll('.about-node')[i]?.classList.toggle('is-passed', tops[i] <= tip)));
    };
    const userScroll = () => { restoreUntil.current = 0; };
    scroller.addEventListener('wheel', userScroll, {passive: true}); scroller.addEventListener('touchstart', userScroll, {passive: true});
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const measure = () => {
      measureRaf = 0;
      const pairs = SIDE_IDS.map(id => [...worlds.current[id].querySelectorAll('[data-align]')]);
      pairs[0].forEach((node, i) => {
        const other = pairs[1][i];
        const h = Math.ceil(Math.max(node.firstElementChild.getBoundingClientRect().height, other.firstElementChild.getBoundingClientRect().height));
        for (const item of [node, other]) if (item.style.minHeight !== `${h}px`) item.style.minHeight = `${h}px`;
      });
      update();
    };
    const observer = new ResizeObserver(() => { if (!measureRaf) measureRaf = requestAnimationFrame(measure); });
    el.querySelectorAll('[data-align] > :first-child').forEach(node => observer.observe(node));
    const fonts = () => { if (!disposed) measure(); };
    document.fonts.ready.then(fonts); document.fonts.addEventListener('loadingdone', fonts);
    scroller.addEventListener('scroll', schedule, {passive: true}); window.addEventListener('resize', measure);
    measure();
    return () => { disposed = true; scroller.removeEventListener('wheel', userScroll); scroller.removeEventListener('touchstart', userScroll); observer.disconnect(); cancelAnimationFrame(raf); cancelAnimationFrame(measureRaf); scroller.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure); document.fonts.removeEventListener('loadingdone', fonts); };
  }, [lang, quiet]);

  useEffect(() => {
    let raf = 0, previous = 0;
    const paint = time => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(.05, (time - (previous || time - 16)) / 1000); previous = time;
      const goal = target.current === 'game' ? 1 : 0;
      wipe.current = quiet ? goal : wipe.current + (goal - wipe.current) * (1 - Math.exp(-dt / .22));
      if (Math.abs(goal - wipe.current) < .006) wipe.current = goal;
      const k = smoothstep(wipe.current), card = center.current;
      const inView = card && card.y + card.height / 2 > 0 && card.y - card.height / 2 < innerHeight;
      const origin = clampOrigin(inView ? card : triggerOrigin.current || {x: innerWidth / 2, y: innerHeight / 2}, innerWidth, innerHeight);
      const game = worlds.current.game, pageRect = root.current.getBoundingClientRect();
      game.style.visibility = k === 0 ? 'hidden' : 'visible';
      game.style.clipPath = k === 1 ? 'none' : `circle(${wipeRadius(origin, innerWidth, innerHeight) * k}px at ${origin.x - pageRect.left}px ${origin.y - pageRect.top}px)`;
      root.current.style.setProperty('--wipe', k);
      strapColor.current = `rgb(${Math.round(19 + 224 * k)}, ${Math.round(19 + 224 * k)}, ${Math.round(21 + 220 * k)})`;
      root.current.style.setProperty('--strap-ink', strapColor.current);
      document.body.dataset.navTone = k >= .5 ? 'dark' : 'light';
      if (wipe.current !== goal) raf = requestAnimationFrame(paint); else previous = 0;
    };
    const wake = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(paint); };
    wakeWipe.current = wake;
    document.addEventListener('visibilitychange', wake); wake();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', wake); delete document.body.dataset.navTone; };
  }, [quiet]);
  const onCenter = useCallback(value => { center.current = value; }, []);
  return <article ref={root} className={`about-page${quiet ? ' is-quiet' : ''}`} lang={htmlLang} data-side={side}>
    <div className="about-worlds">{SIDE_IDS.map(id => {
      const data = SIDES[id];
      return <div ref={node => { worlds.current[id] = node; }} key={id} className={`pp-page ar about-world about-world-${id}${zh ? ' is-zh' : ''}`} data-theme={id === 'game' ? 'dark' : 'light'} inert={id !== side ? true : undefined} aria-hidden={id !== side ? true : undefined} lang={htmlLang}>
        <div className="about-frame"><div className="about-spine" aria-hidden="true"><i/></div><i className="about-tip" aria-hidden="true"/>
          <section className="about-hero" data-align="hero"><div className="about-hero-inner"><div className="about-mobile-block"/><span className="about-backdrop" aria-hidden="true">{data.word}</span><header className="about-bio">
            <p className="about-mono">{t(data.label)}</p><h1>Jay Lin</h1><p className="about-pronouns">{COPY.pronouns}</p><p className="about-role">{t(data.role)}</p><p className="about-lead">{t(data.lead)}</p>
            <div className="about-facts">{Object.entries(FACTS).map(([key, fact]) => <div key={key}><b>{fact.label}</b><span>{t(key === 'openTo' ? data.openTo : fact.text)}</span></div>)}</div>
            <div className="about-hints about-mono"><button className="about-flip-hint" type="button" onClick={e => switchSide(id === 'game' ? 'product' : 'game', e)}>{t(COPY.flipHint)} ↻</button><span>{t(COPY.eggHint)} ↓</span></div>
          </header></div></section>
          {STATIONS.map((station, i) => <section key={station.id} data-align={station.id} className={`about-station${opened[i] ? ' is-open' : ''}${instant.current.has(i) ? ' is-instant' : ''}`} aria-labelledby={`${id}-${station.id}`}><div className="about-station-inner">
            <span className="about-node" aria-hidden="true"><span>{station.n}</span></span>
            <header className="about-station-head"><p className="about-mono">{station.n} / {station.en}</p><h2 id={`${id}-${station.id}`}>{t(station.title)}</h2>{station.note && <p className="about-station-note">{t(station.note === 'workNote' ? data.workNote : station.note)}</p>}</header>
            <StationBody id={station.id} data={data} t={t} zh={zh} count={opened[2] && side === id} reduced={quiet} />
          </div></section>)}
          <div className="about-tail"/>
        </div>
      </div>;
    })}</div>
    <AboutBadge strapColor={strapColor} lang={lang} t={t} side={side} onSideChange={switchSide} onCenter={onCenter} reducedMotion={quiet} phone={layout.phone} height={badgeHeight(layout.scroll, layout.height, layout.phone)} scroll={layout.scroll} blockHeight={layout.block}/>
    <div className="about-side-switch" role="group" aria-label={t(COPY.sideSwitch)} hidden={!switchVisible}>{SIDE_IDS.map(id => <button key={id} type="button" aria-pressed={id === side} onClick={e => switchSide(id, e)}>{t(COPY.sideName[id])}</button>)}</div>
  </article>;
}
