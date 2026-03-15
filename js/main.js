/**
 * Premium Portfolio - 3D 视差、微交互、响应式
 * Parallax (scroll + mouse), card tilt, hero entrance. Vanilla JS.
 */

(function () {
  'use strict';

  let ticking = false;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * 首页 Hero 入场：由 gsap-hero.js 驱动时间轴，此处仅占位（兼容无 GSAP 时由 CSS 兜底已移除）
   */
  function initHeroEntrance() {
    /* Hero 动画已迁移至 gsap-hero.js */
  }

  /**
   * 鼠标视差：data-depth 层级位移、data-tilt-layer 的 3D 倾斜
   */
  function initMouseParallax() {
    if (reduceMotion()) return;
    const scene = document.querySelector('.hero-parallax-scene');
    const layers = scene ? scene.querySelectorAll('[data-depth]') : [];
    const tiltEl = document.querySelector('[data-tilt-layer]');
    let mouseX = 0.5;
    let mouseY = 0.5;
    let raf = null;

    function update() {
      const cx = (mouseX - 0.5) * 2;
      const cy = (mouseY - 0.5) * 2;
      layers.forEach((el) => {
        const depth = parseFloat(el.getAttribute('data-depth')) || 0.1;
        const x = cx * depth * 30;
        const y = cy * depth * 30;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      if (tiltEl) {
        const tiltX = (mouseY - 0.5) * -12;
        const tiltY = (mouseX - 0.5) * 12;
        const rect = tiltEl.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const vh = window.innerHeight / 2;
        const scrollOffset = (centerY - vh) * 0.25;
        tiltEl.style.transform = `translate(-50%, ${scrollOffset}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
      raf = null;
    }

    function onMove(e) {
      mouseX = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) / window.innerWidth;
      mouseY = (e.clientY ?? e.touches?.[0]?.clientY ?? 0) / window.innerHeight;
      if (raf == null) raf = requestAnimationFrame(update);
    }

    if (layers.length || tiltEl) {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('scroll', () => { if (tiltEl && raf == null) raf = requestAnimationFrame(update); }, { passive: true });
      update();
    }
  }

  /**
   * 作品集卡片 3D 倾斜：data-tilt 随鼠标轻微旋转
   */
  function initCardTilt() {
    if (reduceMotion()) return;
    const cards = document.querySelectorAll('[data-tilt]');
    const tiltMax = 8;
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = -y * tiltMax;
        const ry = x * tiltMax;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
        card.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  /**
   * Set active state on nav link matching current page
   */
  function setActiveNavLink() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkFile = href.split('/').pop() || 'index.html';
      if (linkFile === filename) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Mobile menu toggle
   */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('is-open'));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /**
   * 滚动视差：data-parallax 元素随滚动 Y 位移（不含 data-tilt-layer，由鼠标视差处理）
   */
  function initParallax() {
    if (reduceMotion()) return;

    const elements = document.querySelectorAll('[data-parallax]:not([data-tilt-layer])');
    if (!elements.length) return;

    function updateParallax() {
      elements.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const offset = (centerY - viewportCenter) * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
  }

  /**
   * Scroll reveal: Intersection Observer adds .is-visible to .reveal / .reveal-stagger
   * 作品集页由 GSAP ScrollTrigger 驱动，此处跳过避免重复动画
   */
  function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('script[src*="gsap-portfolio"]')) return;

    const revealSelectors = '.reveal, .reveal-stagger';
    const elements = document.querySelectorAll(revealSelectors);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /**
   * Nav: hide on scroll down, show on scroll up
   */
  function initNavScrollHide() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const nav = document.getElementById('nav');
    if (!nav) return;

    const threshold = 80;
    let lastScrollY = window.scrollY || 0;

    function onScrollNav() {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > threshold) {
        if (scrollY > lastScrollY) {
          nav.classList.add('is-hidden');
        } else {
          nav.classList.remove('is-hidden');
        }
      } else {
        nav.classList.remove('is-hidden');
      }
      lastScrollY = scrollY;
    }

    window.addEventListener('scroll', onScrollNav, { passive: true });
  }

  function init() {
    setActiveNavLink();
    initMobileNav();
    initHeroEntrance();
    initParallax();
    initMouseParallax();
    initCardTilt();
    initScrollReveal();
    initNavScrollHide();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
