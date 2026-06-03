/* ============================================================
   Luckee AI — Marketing Site · shared behavior
   - Scroll-reveal (IntersectionObserver + scroll fallback so a
     fast scroll can never leave a section stuck invisible)
   - Mobile navigation drawer
   - Tap-to-open mega menus (touch / keyboard friendly)
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll reveal ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-stagger'));

  function show(el) {
    if (el && !el.classList.contains('in')) el.classList.add('in');
  }

  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(show);
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });

      // Fallback: reveal everything already in (or scrolled past) the viewport.
      // Runs on scroll/resize AND on a short safety interval, so no scroll
      // speed — however fast or coalesced — can leave a section stuck hidden.
      var ticking = false, poll = null;
      function sweep() {
        ticking = false;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var remaining = false;
        revealEls.forEach(function (el) {
          if (el.classList.contains('in')) return;
          if (el.getBoundingClientRect().top < vh * 0.92) { show(el); if (io) io.unobserve(el); }
          else remaining = true;
        });
        if (!remaining) {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
          if (poll) { clearInterval(poll); poll = null; }
        }
      }
      function onScroll() {
        if (!ticking) { ticking = true; window.requestAnimationFrame(sweep); }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      poll = setInterval(sweep, 200); // safety net for fast/coalesced scrolls
      sweep(); // reveal above-the-fold content immediately on load
    }
  }

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var open = function () { menu.classList.add('open'); document.body.style.overflow = 'hidden'; toggle.setAttribute('aria-expanded', 'true'); };
    var close = function () { menu.classList.remove('open'); document.body.style.overflow = ''; toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', open);
    menu.addEventListener('click', function (e) {
      if (e.target === menu || e.target.closest('.mm-close') || e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---- Mega menus: hover-intent (gap-proof) + tap (touch) + keyboard ----
     Pure CSS :hover drops the menu while the cursor crosses the gap between
     the nav link and the panel, so items become unclickable. We keep the
     panel open with a short close delay so you can always reach an item. */
  var navItems = document.querySelectorAll('.site-header .nav-item');
  navItems.forEach(function (item) {
    var mega = item.querySelector('.mega');
    if (!mega) return;
    var trigger = item.querySelector('.nav-link');
    var closeTimer;
    var openNow = function () { clearTimeout(closeTimer); item.classList.add('mega-open'); };
    var closeSoon = function () { clearTimeout(closeTimer); closeTimer = setTimeout(function () { item.classList.remove('mega-open'); }, 260); };
    item.addEventListener('mouseenter', openNow);
    item.addEventListener('mouseleave', closeSoon);
    mega.addEventListener('mouseenter', openNow);   // re-entering the panel cancels the close
    item.addEventListener('focusin', openNow);
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) item.classList.remove('mega-open'); });
    // Coarse pointers (touch): first tap opens the menu instead of navigating.
    if (trigger) trigger.addEventListener('click', function (e) {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        if (!item.classList.contains('open-tap')) {
          e.preventDefault();
          navItems.forEach(function (n) { n.classList.remove('open-tap'); });
          item.classList.add('open-tap');
        }
      }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) {
      navItems.forEach(function (n) { n.classList.remove('open-tap'); n.classList.remove('mega-open'); });
    }
  });
})();
