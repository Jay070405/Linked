/**
 * Portfolio - Shared Logic
 * Pure vanilla JS, no jQuery.
 */

(function () {
  'use strict';

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
   * Mobile menu toggle (when .nav-toggle exists)
   */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('is-open'));
    });

    // Close on link click (for anchor or same-page nav)
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    setActiveNavLink();
    initMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
