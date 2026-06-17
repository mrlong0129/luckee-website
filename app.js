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
  var LISTING_EMAIL = 'hello@luckee.ai';
  var PRIMARY_CTA_HREF = '/amazon-assistant/';

  /* ---- Shared nav config — update here to change nav on all pages ---- */
  var NAV_PRODUCTS = [
    { href: '/luckee-website/products/amazon-operation-assistant.html', title: 'Amazon Operation Assistant', desc: 'Daily Amazon account operations in plain language.' },
    { href: '/luckee-website/products/amazon-ads-workbench.html', title: 'Amazon Ads Workbench', desc: 'Human-approved PPC execution from diagnosis to outcome.' }
  ];
  var NAV_SOLUTIONS = [
    { href: '/luckee-website/solutions/listing-optimizer/', title: 'Listing Optimizer', desc: 'Listing copy, A+ content, backend keywords, and answerability.' },
    { href: '/luckee-website/solutions/ads-audit.html', title: 'Ads Audit', desc: 'PPC diagnosis for TACoS, ROAS, CPC, placement, and waste.' },
    { href: '/luckee-website/solutions/ads-automation.html', title: 'Ads Automation', desc: 'Human-approved bid, budget, keyword, and negative changes.' },
    { href: '/luckee-website/solutions/image-generation.html', title: 'E-commerce Image Generation', desc: 'Conversion-focused product, lifestyle, and comparison visuals.' },
    { href: '/luckee-website/solutions/review-analysis.html', title: 'Review Analysis', desc: 'Complaint themes, buyer language, and product improvement signals.' },
    { href: '/luckee-website/solutions/competition-analysis.html', title: 'Competition Analysis', desc: 'Competitor pricing, creatives, keywords, reviews, and market moves.' }
  ];

  function mkMegaItems(items) {
    return items.map(function (it) {
      return '<a href="' + it.href + '"><strong>' + it.title + '</strong><span>' + it.desc + '</span></a>';
    }).join('');
  }

  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    siteHeader.innerHTML = [
      '<nav class="wrap nav" aria-label="Primary navigation">',
      '<a class="brand" href="/luckee-website/" aria-label="Luckee AI home">',
      '<span class="brand-mark" aria-hidden="true"></span><span>Luckee AI</span>',
      '</a>',
      '<ul class="nav-list">',
      '<li class="nav-item">',
      '<a class="nav-link" href="/luckee-website/products/amazon-operation-assistant.html">Products</a>',
      '<div class="mega" aria-label="Product links">' + mkMegaItems(NAV_PRODUCTS) + '</div>',
      '</li>',
      '<li class="nav-item">',
      '<a class="nav-link" href="/luckee-website/solutions.html">Solutions</a>',
      '<div class="mega" aria-label="Solution links">' + mkMegaItems(NAV_SOLUTIONS) + '</div>',
      '</li>',
      '<li class="nav-item"><a class="nav-link" href="/luckee-website/#loop">How it works</a></li>',
      '<li class="nav-item"><a class="nav-link" href="/luckee-website/#why">Why Luckee</a></li>',
      '</ul>',
      '<div class="nav-actions">',
      '<a class="btn btn-outline btn-sm" href="/luckee-website/solutions.html">See solutions</a>',
      '<a class="btn btn-primary btn-sm" href="/luckee-website/#contact">Hire a team</a>',
      '<button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
      '</button>',
      '</div>',
      '</nav>'
    ].join('');
  }

  var mobileMenuEl = document.getElementById('mobile-menu');
  if (mobileMenuEl) {
    mobileMenuEl.innerHTML = [
      '<div class="mobile-menu-panel">',
      '<div class="mm-head">',
      '<a class="brand" href="/luckee-website/"><span class="brand-mark" aria-hidden="true"></span><span>Luckee AI</span></a>',
      '<button class="mm-close" aria-label="Close menu">',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      '</button>',
      '</div>',
      '<span class="mm-group-label">Products</span>',
      NAV_PRODUCTS.map(function (p) { return '<a href="' + p.href + '">' + p.title + '</a>'; }).join(''),
      '<span class="mm-group-label">Solutions</span>',
      NAV_SOLUTIONS.map(function (s) { return '<a href="' + s.href + '">' + s.title + '</a>'; }).join(''),
      '<span class="mm-group-label">More</span>',
      '<a href="/luckee-website/#loop">How it works</a>',
      '<a href="/luckee-website/#why">Why Luckee</a>',
      '<div class="mm-actions">',
      '<a class="btn btn-outline btn-block" href="/luckee-website/solutions.html">See solutions</a>',
      '<a class="btn btn-primary btn-block" href="/luckee-website/#contact">Hire a team</a>',
      '</div>',
      '</div>'
    ].join('');
  }

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

  /* ---- Contact links ----
     Emails are wired at runtime from JS constants and are never shipped as
     literal mailto:/text in the HTML, so Cloudflare Email Obfuscation cannot
     rewrite them into broken /cdn-cgi/l/email-protection links. Markup uses
     data-contact-mailto (optionally ="hello") and data-contact-mailto-text. */
  var CONTACT_EMAIL_BY_KEY = { '': CONTACT_EMAIL, contact: CONTACT_EMAIL, hello: LISTING_EMAIL };
  var contactLinks = [];
  Array.prototype.slice.call(document.querySelectorAll('a[data-contact-mailto]')).forEach(function (link) {
    if (link.hasAttribute('data-primary-cta')) return;
    var email = CONTACT_EMAIL_BY_KEY[link.getAttribute('data-contact-mailto') || ''] || CONTACT_EMAIL;
    link.href = 'mailto:' + email;
    if (link.hasAttribute('data-contact-mailto-text')) link.textContent = email;
    // contact@ links open the in-page contact dialog (wired further below).
    if (email === CONTACT_EMAIL) contactLinks.push(link);
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

  /* ---- Website analytics tracking ---- */
  (function () {
    var T = window.LuckeeWebsiteTrack;
    if (!T || !T.track) return;

    // Page view — immediate on load
    T.trackPageView();

    function getHref(el) { return el ? (el.getAttribute('href') || '') : ''; }
    function getLabel(el) {
      if (!el) return '';
      var strong = el.querySelector && el.querySelector('strong');
      return ((strong ? strong.textContent : (el.textContent || el.innerText || '')) || '').trim();
    }
    function targetTypeFromHref(href) {
      href = String(href || '');
      if (href.indexOf('listing-optimizer') >= 0) return 'listing_optimizer';
      if (href.indexOf('ads-workbench') >= 0)      return 'ads_workbench';
      if (href === '#contact' || href === '/#contact') return 'contact';
      if (href === '#products' || href === '/#products') return 'products_overview';
      return 'page';
    }

    // Nav: Solutions dropdown
    var solutionMega = document.querySelector('.mega[aria-label="Solution links"]');
    if (solutionMega) {
      solutionMega.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = getHref(a);
        var label = getLabel(a);
        var ttype = targetTypeFromHref(href);
        T.track(T.EVENTS.SOLUTION_NAV_CLICK, { section: 'nav', cta_label: label, target_url: a.href, target_type: ttype });
        if (ttype === 'listing_optimizer') {
          T.track(T.EVENTS.LISTING_OPTIMIZER_CTA_CLICK, { section: 'nav', cta_label: label, target_url: a.href, target_type: ttype });
        }
      });
    }

    // Nav: Products dropdown
    var productMega = document.querySelector('.mega[aria-label="Product links"]');
    if (productMega) {
      productMega.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = getHref(a);
        var label = getLabel(a);
        var ttype = targetTypeFromHref(href);
        T.track(T.EVENTS.PRODUCT_NAV_CLICK, { section: 'nav', cta_label: label, target_url: a.href, target_type: ttype });
        if (ttype === 'ads_workbench') {
          T.track(T.EVENTS.ADS_WORKBENCH_CTA_CLICK, { section: 'nav', cta_label: label, target_url: a.href, target_type: ttype });
        }
      });
    }

    // Hero CTAs and demo interactions
    var heroSection = document.querySelector('.home-hero');
    if (heroSection) {
      var heroLinks = heroSection.querySelectorAll('.hero-actions a');
      if (heroLinks[0]) {
        heroLinks[0].addEventListener('click', function () {
          T.track(T.EVENTS.HOMEPAGE_PRIMARY_CTA_CLICK, {
            section: 'hero', cta_label: getLabel(heroLinks[0]),
            target_url: heroLinks[0].href, target_type: targetTypeFromHref(getHref(heroLinks[0]))
          });
        });
      }
      if (heroLinks[1]) {
        heroLinks[1].addEventListener('click', function () {
          T.track(T.EVENTS.HOMEPAGE_SECONDARY_CTA_CLICK, {
            section: 'hero', cta_label: getLabel(heroLinks[1]),
            target_url: heroLinks[1].href, target_type: targetTypeFromHref(getHref(heroLinks[1]))
          });
        });
      }
      var wbApprove = heroSection.querySelector('.wb-approve');
      if (wbApprove) {
        wbApprove.addEventListener('click', function () {
          T.track(T.EVENTS.HERO_DEMO_APPROVE_CLICK, { section: 'hero' });
        });
      }
      var wbEvidence = heroSection.querySelector('.wb-evidence');
      if (wbEvidence) {
        wbEvidence.addEventListener('click', function () {
          T.track(T.EVENTS.HERO_DEMO_EVIDENCE_CLICK, { section: 'hero' });
        });
      }
    }

    // Product guide section — Ads Workbench and Listing Optimizer cards
    var productGuideSection = document.getElementById('products');
    if (productGuideSection) {
      productGuideSection.addEventListener('click', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var ttype = targetTypeFromHref(getHref(a));
        var label = getLabel(a);
        if (ttype === 'ads_workbench') {
          T.track(T.EVENTS.ADS_WORKBENCH_CTA_CLICK, { section: 'products', cta_label: label, target_url: a.href, target_type: ttype });
        } else if (ttype === 'listing_optimizer') {
          T.track(T.EVENTS.LISTING_OPTIMIZER_CTA_CLICK, { section: 'products', cta_label: label, target_url: a.href, target_type: ttype });
        }
      });
    }

    // Contact clicks — "Hire a team" in nav / footer / CTA section.
    // Exclude hero primary CTA (already tracked as homepage_primary_cta_click).
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href], button[data-contact]');
      if (!a) return;
      if (getHref(a) !== '#contact' && getHref(a) !== '/#contact') return;
      if (a.closest('.home-hero')) return; // hero CTA already tracked above
      var sectionEl = a.closest('[id]');
      var sectionId = sectionEl ? sectionEl.id : '';
      var section = a.closest('.site-header') ? 'nav'
                  : sectionId === 'contact'   ? 'contact_cta'
                  : sectionId || 'unknown';
      T.track(T.EVENTS.CONTACT_CLICK, {
        section: section, cta_label: getLabel(a), target_type: 'contact'
      });
    });
  }());
})();
