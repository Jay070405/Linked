/**
 * 作品集页：GSAP ScrollTrigger - 区块与卡片滚动触发动画
 */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  // 每个 .section.reveal：整区淡入 + 标题与卡片交错动画
  gsap.utils.toArray('.section.reveal').forEach(function (section) {
    var title = section.querySelector('.section-title');
    var grid = section.querySelector('.reveal-stagger');
    var items = grid ? grid.children : [];

    gsap.set(section, { opacity: 0 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    });

    tl.to(section, { opacity: 1, duration: 0.4, ease: 'power2.out' });

    if (title) {
      tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2');
    }
    if (items.length) {
      tl.fromTo(items, { opacity: 0, y: 50 }, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.05,
        ease: 'power3.out'
      }, '-=0.4');
    }
  });
})();
