/**
 * Premium Portfolio - Parallax, scroll reveal, nav behavior
 * Vanilla JS only.
 */

(function () {
  'use strict';

  let ticking = false;

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
   * Parallax: scroll-linked transform for elements with data-parallax (speed factor)
   */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('[data-parallax]');
    if (!elements.length) return;

    function updateParallax() {
      const scrollY = window.scrollY || window.pageYOffset;
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
   */
  function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
    initParallax();
    initScrollReveal();
    initNavScrollHide();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
