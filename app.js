/* ============================================================
   Luckee AI — Marketing Site · shared behavior
   - Scroll-reveal (IntersectionObserver + scroll fallback so a
     fast scroll can never leave a section stuck invisible)
   - Mobile navigation drawer
   - Tap-to-open mega menus (touch / keyboard friendly)
   ============================================================ */
(function () {
  'use strict';

  var CONTACT_EMAIL = 'contact@luckee.ai';
  var PRIMARY_CTA_HREF = '/amazon-assistant/';

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
    var open = function () {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    };
    var close = function () {
      if (!menu.classList.contains('open')) return;
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', open);
    menu.addEventListener('click', function (e) {
      if (e.target === menu || e.target.closest('.mm-close') || e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---- Contact links ---- */
  var contactMailto = 'mailto:' + CONTACT_EMAIL;
  var contactLinks = Array.prototype.slice.call(document.querySelectorAll('a[href^="mailto:"]')).filter(function (link) {
    var href = link.getAttribute('href') || '';
    if (link.hasAttribute('data-primary-cta')) return false;
    return /^mailto:contact@luckee\.ai/i.test(href);
  });
  contactLinks.forEach(function (link) {
    link.href = contactMailto;
  });

  var primaryCtaLinks = Array.prototype.slice.call(document.querySelectorAll('[data-primary-cta]'));
  primaryCtaLinks.forEach(function (link) {
    if (link && link.tagName === 'A') link.href = PRIMARY_CTA_HREF;
  });

  var contactDialog = null;
  var copyButton = null;
  var copyFeedback = null;
  var closeContactDialog = function () {};

  function ensureContactDialog() {
    if (contactDialog) return;
    contactDialog = document.createElement('div');
    contactDialog.className = 'contact-dialog';
    contactDialog.setAttribute('aria-hidden', 'true');
    contactDialog.innerHTML = [
      '<div class="contact-dialog__backdrop" data-contact-close></div>',
      '<div class="contact-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">',
      '<button class="contact-dialog__close" type="button" aria-label="Close" data-contact-close>×</button>',
      '<p class="contact-dialog__eyebrow">Contact</p>',
      '<h2 id="contact-dialog-title">Reach the Luckee team</h2>',
      '<p class="contact-dialog__copy">Use the email below to book a demo or ask product questions.</p>',
      '<div class="contact-dialog__email">',
      '<strong>' + CONTACT_EMAIL + '</strong>',
      '<span class="contact-dialog__feedback" aria-live="polite"></span>',
      '</div>',
      '<div class="contact-dialog__actions">',
      '<button class="btn btn-primary" type="button" data-contact-copy>Copy email</button>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(contactDialog);

    copyButton = contactDialog.querySelector('[data-contact-copy]');
    copyFeedback = contactDialog.querySelector('.contact-dialog__feedback');

    function resetCopyFeedback() {
      if (copyFeedback) copyFeedback.textContent = '';
    }

    closeContactDialog = function () {
      if (!contactDialog.classList.contains('open')) return;
      contactDialog.classList.remove('open');
      contactDialog.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('contact-dialog-open');
      resetCopyFeedback();
    };

    contactDialog.addEventListener('click', function (e) {
      if (e.target.closest('[data-contact-close]')) closeContactDialog();
    });

    if (copyButton) {
      copyButton.addEventListener('click', function () {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          if (copyFeedback) copyFeedback.textContent = 'Copy unavailable';
          return;
        }
        navigator.clipboard.writeText(CONTACT_EMAIL)
          .then(function () {
            if (copyFeedback) copyFeedback.textContent = 'Copied';
          })
          .catch(function () {
            if (copyFeedback) copyFeedback.textContent = 'Copy failed';
          });
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeContactDialog();
    });
  }

  function openContactDialog() {
    ensureContactDialog();
    contactDialog.classList.add('open');
    contactDialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('contact-dialog-open');
  }

  contactLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openContactDialog();
    });
  });

  /* ---- Dynamic pricing ---- */
  var pricingRoot = document.getElementById('pricing');
  if (pricingRoot && window.fetch) {
    var endpoint = 'https://staging-user-api.motse.ai/luckee/user/web/stripe/pricingPage.do';
    var currency = 'USD';
    var cardConfigs = [
      { selector: '.price-card-starter', type: 1 },
      { selector: '.price-card-growth', type: 2 }
    ];

    function formatMoney(value, currentCurrency) {
      var amount = Number(value);
      if (!isFinite(amount)) return '';
      var hasCents = Math.round(amount * 100) % 100 !== 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2
      }).format(amount);
    }

    function clearPricingState() {
      pricingRoot.classList.remove('pricing-live');
      pricingRoot.classList.remove('pricing-fallback');
      pricingRoot.classList.remove('pricing-loading');
      pricingRoot.removeAttribute('aria-busy');
    }

    function finishPricing(stateClass) {
      clearPricingState();
      if (stateClass) pricingRoot.classList.add(stateClass);
    }

    function findPlan(data, type) {
      return Array.prototype.slice.call(data.monthPricingList || []).find(function (item) {
        return Number(item.type) === type;
      }) || null;
    }

    function renderCard(card, plan) {
      var priceNode = card && card.querySelector('[data-plan-price]');
      if (!priceNode || !plan) return;
      priceNode.textContent = formatMoney(plan.price, (plan.currency || currency).toUpperCase()) + '/mo';
      card.setAttribute('data-price-id', plan.priceId || '');
    }

    function renderPricing(data) {
      cardConfigs.forEach(function (config) {
        renderCard(pricingRoot.querySelector(config.selector), findPlan(data, config.type));
      });
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = null;
    var requestOptions = {
      method: 'POST',
      credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currency: currency })
    };
    if (controller) {
      requestOptions.signal = controller.signal;
      timeoutId = window.setTimeout(function () { controller.abort(); }, 8000);
    }

    pricingRoot.classList.add('pricing-loading');
    pricingRoot.setAttribute('aria-busy', 'true');

    fetch(endpoint, requestOptions)
      .then(function (response) {
        if (!response.ok) throw new Error('Pricing request failed');
        return response.json();
      })
      .then(function (payload) {
        if (!payload || Number(payload.code) !== 200 || !payload.data) throw new Error('Invalid pricing payload');
        if (timeoutId) window.clearTimeout(timeoutId);
        renderPricing(payload.data);
        finishPricing('pricing-live');
      })
      .catch(function () {
        if (timeoutId) window.clearTimeout(timeoutId);
        finishPricing('pricing-fallback');
      });
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
