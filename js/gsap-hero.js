/**
 * Hero 页：GSAP 时间轴 - 逐字揭示、磁性按钮、展示图入场
 * 依赖：GSAP 3 + ScrollTrigger（见 index.html CDN）
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.hero-title .char').forEach((el) => { el.style.opacity = '1'; });
    var t = document.querySelector('.hero-tagline-gsap'); if (t) t.style.opacity = '1';
    var a = document.querySelector('.hero-actions'); if (a) a.style.opacity = '1';
    var s = document.getElementById('hero-showcase'); if (s) s.style.opacity = '1';
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var hero = document.getElementById('hero-3d');
  var titleEl = document.getElementById('hero-title');
  if (!hero || !titleEl) return;

  // 将标题拆成单字（便于逐字动画）
  var text = titleEl.textContent.trim();
  titleEl.innerHTML = text.split('').map(function (c) {
    return c === ' ' ? '<span class="char space">\u00A0</span>' : '<span class="char">' + c + '</span>';
  }).join('');

  var chars = titleEl.querySelectorAll('.char:not(.space)');
  var tagline = document.querySelector('.hero-tagline-gsap');
  var actions = document.querySelector('.hero-actions');
  var showcase = document.getElementById('hero-showcase');

  gsap.set([chars, tagline, actions, showcase], { opacity: 0 });
  gsap.set(chars, { y: 32 });
  gsap.set(tagline, { y: 24 });
  gsap.set(actions, { y: 20 });
  gsap.set(showcase, { scale: 0.96, y: 30 });

  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to(chars, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04 })
    .to(tagline, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
    .to(actions, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
    .to(showcase, { opacity: 1, scale: 1, y: 0, duration: 0.9 }, '-=0.2');

  // 磁性按钮：鼠标靠近时按钮轻微跟随
  var magneticBtns = document.querySelectorAll('.btn-magnetic');
  magneticBtns.forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      var y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      gsap.to(btn, { x: x, y: y, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', function () {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });

})();
