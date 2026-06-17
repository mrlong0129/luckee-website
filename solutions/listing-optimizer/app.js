/* ============================================================
   Luckee Listing — shared helpers (vanilla JS, no build)
   Exposed as window.Luckee
   ============================================================ */
(function () {
  const L = {};

  function trackListingEvent(eventName, payload, options) {
    try {
      return window.LuckeeListingTrack?.track?.(eventName, payload || {}, options || {}) || null;
    } catch (err) {
      return null;
    }
  }

  function setListingTrackContext(payload) {
    try {
      window.LuckeeListingTrack?.setContext?.(payload || {});
    } catch (err) {}
  }

  L.trackListingEvent = trackListingEvent;
  L.setListingTrackContext = setListingTrackContext;

  /* ---- escape ---- */
  L.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* ---- word-level diff (LCS) ---- */
  function tokenize(str) {
    // keep words and whitespace as separate tokens so spacing is preserved
    return String(str).match(/\s+|[^\s]+/g) || [];
  }
  function lcs(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { ops.push({ t: "eq", v: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: "del", v: a[i] }); i++; }
      else { ops.push({ t: "add", v: b[j] }); j++; }
    }
    while (i < m) { ops.push({ t: "del", v: a[i++] }); }
    while (j < n) { ops.push({ t: "add", v: b[j++] }); }
    return ops;
  }
  L.diffOps = function (oldS, newS) { return lcs(tokenize(oldS), tokenize(newS)); };

  // Current pane: original text with deletions struck through
  L.diffCurrent = function (oldS, newS) {
    return L.diffOps(oldS, newS).filter(o => o.t !== "add")
      .map(o => o.t === "del" ? `<span class="diff-del">${L.esc(o.v)}</span>` : L.esc(o.v)).join("");
  };
  // Suggested pane: new text with additions highlighted
  L.diffSuggested = function (oldS, newS) {
    return L.diffOps(oldS, newS).filter(o => o.t !== "del")
      .map(o => o.t === "add" ? `<span class="diff-add">${L.esc(o.v)}</span>` : L.esc(o.v)).join("");
  };

  /* ---- chips ---- */
  const SUPPORT = { CLEAR: "chip-clear", PARTIAL: "chip-partial", UNKNOWN: "chip-unknown", CONFLICT: "chip-conflict" };
  L.supportChip = function (s) { return `<span class="chip ${SUPPORT[s] || "chip-unknown"}"><span class="dot"></span>${L.esc(s)}</span>`; };
  L.riskChip = function (r) {
    const m = { HIGH: "risk-high", MEDIUM: "risk-med", MED: "risk-med", LOW: "risk-low" };
    return `<span class="chip ${m[r] || "chip-unknown"}">${L.esc(r === "MEDIUM" ? "MED" : r)}</span>`;
  };
  L.prioChip = function (p) {
    const m = { P0: "prio-p0", P1: "prio-p1", P2: "prio-p2" };
    return `<span class="chip prio ${m[p] || "prio-p2"}">${L.esc(p)}</span>`;
  };
  // module coverage status (benchmark / suggest modules)
  L.statusChip = function (s) {
    if (s === "available") return `<span class="chip chip-clear"><span class="dot"></span>Covered</span>`;
    if (s === "partial") return `<span class="chip chip-partial"><span class="dot"></span>Partial</span>`;
    return `<span class="chip chip-conflict"><span class="dot"></span>Missing</span>`;
  };
  L.coverIcon = function (s) {
    if (s === "available") return `<span style="color:var(--success-600);font-weight:700">●</span>`;
    if (s === "partial") return `<span style="color:var(--warning-600);font-weight:700">◐</span>`;
    return `<span style="color:var(--error-600);font-weight:700">○</span>`;
  };

  /* ---- shared chrome ---- */
  /* Official luckee.ai top nav, ported to the product's own design tokens so
     /solutions/listing-optimizer reads as part of the official site. Keeps the
     product funnel hooks intact (account slot + Get-my-free-audit CTA). Brand
     and the marketing links are root-absolute, so <base href> doesn't rewrite
     them; only the audit CTA stays relative (lives inside the product). */
  L.topNav = function (active) {
    return `
    <nav class="nav"><div class="container nav-inner">
      <a class="brand" href="/luckee-website/" aria-label="Luckee AI home"><span class="mark">L</span>Luckee <span style="color:var(--muted);font-weight:400">Listing</span></a>
      <ul class="nav-list">
        <li class="nav-item">
          <a class="nav-link" href="/luckee-website/products/amazon-operation-assistant.html">Products</a>
          <div class="mega" aria-label="Product links">
            <a href="/luckee-website/products/amazon-operation-assistant.html"><strong>Amazon Operation Assistant</strong><span>Daily Amazon account operations in plain language.</span></a>
            <a href="/luckee-website/products/amazon-ads-workbench.html"><strong>Amazon Ads Workbench</strong><span>Human-approved PPC execution from diagnosis to outcome.</span></a>
          </div>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/luckee-website/solutions">Solutions</a>
          <div class="mega" aria-label="Solution links">
            <a href="/luckee-website/solutions/listing-optimizer/"${active === "listing" ? ' aria-current="page"' : ""}><strong>Listing Optimizer</strong><span>Listing copy, A+ content, backend keywords, and answerability.</span></a>
            <a href="/luckee-website/solutions/ads-audit.html"><strong>Ads Audit</strong><span>PPC diagnosis for TACoS, ROAS, CPC, placement, and waste.</span></a>
            <a href="/luckee-website/solutions/ads-automation.html"><strong>Ads Automation</strong><span>Human-approved bid, budget, keyword, and negative changes.</span></a>
            <a href="/luckee-website/solutions/image-generation.html"><strong>E-commerce Image Generation</strong><span>Conversion-focused product, lifestyle, and comparison visuals.</span></a>
            <a href="/luckee-website/solutions/review-analysis.html"><strong>Review Analysis</strong><span>Complaint themes, buyer language, and product improvement signals.</span></a>
            <a href="/luckee-website/solutions/competition-analysis.html"><strong>Competition Analysis</strong><span>Competitor pricing, creatives, keywords, reviews, and market moves.</span></a>
          </div>
        </li>
        <li class="nav-item"><a class="nav-link" href="/luckee-website/#loop">How it works</a></li>
        <li class="nav-item"><a class="nav-link" href="/luckee-website/#why">Why Luckee</a></li>
      </ul>
      <div class="nav-actions">
        <span data-account-slot></span>
        <a class="btn btn-outline btn-sm nav-see-solutions" href="/luckee-website/solutions">See solutions</a>
        <a class="btn btn-primary btn-sm" href="audit.html" aria-label="Get my free audit" data-nav-free-audit><span class="cta-full" aria-hidden="true">Get my free audit</span><span class="cta-short" aria-hidden="true">Free audit</span></a>
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="listing-mobile-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </div></nav>
    <div id="listing-mobile-menu" class="mobile-menu" aria-hidden="true">
      <div class="mobile-menu-panel">
        <div class="mm-head">
          <a class="brand" href="/luckee-website/"><span class="mark">L</span>Luckee <span style="color:var(--muted);font-weight:400">Listing</span></a>
          <button class="mm-close" type="button" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <span class="mm-group-label">Products</span>
        <a href="/luckee-website/products/amazon-operation-assistant.html">Amazon Operation Assistant</a>
        <a href="/luckee-website/products/amazon-ads-workbench.html">Amazon Ads Workbench</a>
        <span class="mm-group-label">Solutions</span>
        <a href="/luckee-website/solutions/listing-optimizer/">Listing Optimizer</a>
        <a href="/luckee-website/solutions/ads-audit.html">Ads Audit</a>
        <a href="/luckee-website/solutions/ads-automation.html">Ads Automation</a>
        <a href="/luckee-website/solutions/image-generation.html">E-commerce Image Generation</a>
        <a href="/luckee-website/solutions/review-analysis.html">Review Analysis</a>
        <a href="/luckee-website/solutions/competition-analysis.html">Competition Analysis</a>
        <span class="mm-group-label">More</span>
        <a href="/luckee-website/#loop">How it works</a>
        <a href="/luckee-website/#why">Why Luckee</a>
        <div class="mm-actions">
          <a class="btn btn-outline btn-block" href="/luckee-website/solutions">See solutions</a>
          <a class="btn btn-primary btn-block" href="audit.html" data-nav-free-audit>Get my free audit</a>
        </div>
      </div>
    </div>`;
  };

  /* Mega hover-intent + mobile drawer wiring. Call after every L.topNav mount. */
  L.wireMarketingNav = function () {
    var navItems = document.querySelectorAll('.nav .nav-item');
    navItems.forEach(function (item) {
      var mega = item.querySelector('.mega');
      if (!mega) return;
      var closeTimer;
      var openNow = function () { clearTimeout(closeTimer); item.classList.add('mega-open'); };
      var closeSoon = function () { clearTimeout(closeTimer); closeTimer = setTimeout(function () { item.classList.remove('mega-open'); }, 260); };
      item.addEventListener('mouseenter', openNow);
      item.addEventListener('mouseleave', closeSoon);
      mega.addEventListener('mouseenter', openNow);
      item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) item.classList.remove('mega-open'); });
    });
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('listing-mobile-menu');
    if (toggle && menu && !menu.dataset.wired) {
      menu.dataset.wired = '1';
      var open = function () { menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; toggle.setAttribute('aria-expanded', 'true'); };
      var close = function () { if (!menu.classList.contains('open')) return; menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; toggle.setAttribute('aria-expanded', 'false'); };
      toggle.addEventListener('click', open);
      menu.addEventListener('click', function (e) { if (e.target === menu || e.target.closest('.mm-close') || e.target.closest('a')) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  };

  L.appBar = function (step) {
    // step: 'audit' | 'report' | 'workspace' — kept only to pick the right CTA
    const params = new URLSearchParams(window.location.search || "");
    const sampleSuffix = params.get("sample") === "1" ? "?sample=1" : "";
    return `
    <header class="appbar"><div class="container nav-inner">
      <a class="brand" href="index.html" style="font-size:1.15rem"><span class="mark" style="width:26px;height:26px;font-size:1rem">L</span>Luckee Listing</a>
      <div class="row app-actions" style="gap:10px">
        ${step === "report"
          ? `<a class="btn btn-primary btn-sm" href="workspace.html${sampleSuffix}" data-credit-action="optimize">Generate fixes →</a>`
          : step === "workspace"
            ? `<a class="btn btn-outline btn-sm" href="report.html${sampleSuffix}">← Back to report</a>`
            : `<a class="btn btn-outline btn-sm" href="index.html">Cancel</a>`}
        <span data-account-slot></span>
      </div>
    </div></header>`;
  };

  L.footer = function () {
    return `
    <footer class="footer grain"><div class="container footer-compact">
      <div class="footer-grid">
        <div class="footer-lede">
          <div class="brand footer-brand"><span class="mark">L</span>Luckee Listing</div>
          <h2>Find what your listing still cannot answer.</h2>
          <p>Amazon listing answerability: buyer questions, evidence gaps and field-level fixes in one audit.</p>
        </div>
        <div class="footer-nav">
          <strong>Product</strong>
          <a href="index.html#why">Why Luckee</a>
          <a href="index.html#how">Workflow</a>
          <a href="index.html#workspace">Workspace</a>
          <a href="index.html#pricing">Pricing</a>
        </div>
        <div class="footer-nav">
          <strong>Prototype</strong>
          <a href="audit.html">Audit flow</a>
          <a href="report.html?sample=1">Sample report</a>
          <a href="workspace.html?sample=1">Workspace demo</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Luckee. Listing optimization for the AI buying era.</span>
        <span>Evidence-gated · brand-aware · never invents</span>
      </div>
    </div></footer>`;
  };

  /* ---- prototype funnel state ----
     Production should replace this with Luckee 1.0 account, usage and credit APIs. */
  const FUNNEL_KEY = "luckee-listing:funnel-v1";
  const FUNNEL_DEFAULT = {
    signedIn: false,
    authMode: "guest",
    accountName: "",
    accountEmail: "",
    loginToken: "",
    userId: "",
    freeAuditUsed: false,
    freeOptimizationUsed: false,
    auditRuns: 0,
    optimizationRuns: 0
  };

  function readFunnelState() {
    try {
      const raw = window.localStorage && window.localStorage.getItem(FUNNEL_KEY);
      return Object.assign({}, FUNNEL_DEFAULT, raw ? JSON.parse(raw) : {});
    } catch (err) {
      return Object.assign({}, FUNNEL_DEFAULT);
    }
  }

  function writeFunnelState(next) {
    const state = Object.assign({}, FUNNEL_DEFAULT, next || {});
    try {
      if (window.localStorage) window.localStorage.setItem(FUNNEL_KEY, JSON.stringify(state));
    } catch (err) {
      // localStorage can be blocked in private browsing; keep the prototype usable.
    }
    return state;
  }

  function defaultAccount() {
    const D = window.LUCKEE_DATA || {};
    const account = (D.funnel && D.funnel.account) || {};
    return {
      accountName: account.name || "Luckee user",
      accountEmail: account.email || "demo@luckee.ai"
    };
  }

  function readGlobalSession() {
    return window.LuckeeAuth?.getSession ? window.LuckeeAuth.getSession() : null;
  }

  function accountFromSession(session) {
    const userInfo = session?.userInfo || {};
    return {
      accountName: userInfo.userName || userInfo.name || userInfo.nickName || "Luckee user",
      accountEmail: userInfo.email || userInfo.userName || defaultAccount().accountEmail,
      loginToken: session?.loginToken || userInfo.loginToken || "",
      userId: userInfo.id || userInfo.userId || ""
    };
  }

  function signedOutState(state) {
    return Object.assign({}, state || {}, {
      signedIn: false,
      authMode: "guest",
      accountName: "",
      accountEmail: "",
      loginToken: "",
      userId: ""
    });
  }

  L.funnel = {
    getState() {
      const state = readFunnelState();
      const session = readGlobalSession();
      if (!session?.loginToken) return state?.signedIn ? signedOutState(state) : state;
      return Object.assign({}, state, {
        signedIn: true,
        authMode: "login"
      }, accountFromSession(session));
    },
    setState: writeFunnelState,
    update(patch) {
      const state = writeFunnelState(Object.assign({}, readFunnelState(), patch || {}));
      L.refreshFunnelStrips();
      if (typeof L.refreshAccountSlots === "function") L.refreshAccountSlots();
      if (typeof L.refreshPricing === "function") L.refreshPricing();
      return state;
    },
    reset() {
      try {
        if (window.localStorage) window.localStorage.removeItem(FUNNEL_KEY);
      } catch (err) {}
      L.refreshFunnelStrips();
      if (typeof L.refreshAccountSlots === "function") L.refreshAccountSlots();
      if (typeof L.refreshPricing === "function") L.refreshPricing();
      return Object.assign({}, FUNNEL_DEFAULT);
    },
    markSignedIn(mode, account) {
      const nextAccount = account || defaultAccount();
      return this.update(Object.assign({
        signedIn: true,
        authMode: mode || "login"
      }, nextAccount));
    },
    markSignedOut() {
      return this.update({
        signedIn: false,
        authMode: "guest",
        accountName: "",
        accountEmail: "",
        loginToken: "",
        userId: ""
      });
    },
    markAuditViewed() {
      const state = readFunnelState();
      return this.update(Object.assign({
        freeAuditUsed: true,
        auditRuns: state.freeAuditUsed ? state.auditRuns : state.auditRuns + 1
      }, state.signedIn ? {} : { authMode: "guest" }));
    },
    markOptimizationGenerated() {
      const state = readFunnelState();
      return this.update(Object.assign({
        freeOptimizationUsed: true,
        optimizationRuns: state.freeOptimizationUsed ? state.optimizationRuns : state.optimizationRuns + 1
      }, state.signedIn ? {} : { authMode: "guest" }));
    }
  };

  L.syncFunnelFromUrl = function () {
    const session = readGlobalSession();
    if (session?.loginToken && !L.funnel.getState().signedIn) {
      L.funnel.markSignedIn("login", accountFromSession(session));
    }
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("reset") === "1") L.funnel.reset();
    if (params.get("audit") === "free") L.funnel.markAuditViewed();
    if (params.get("opt") === "1") L.funnel.markOptimizationGenerated();
  };

  L.funnelStrip = function (context) {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const trial = F.trial || {};
    const state = L.funnel.getState();
    const isWorkspace = context === "workspace";
    const title = isWorkspace
      ? "Optimization bundle generated"
      : (state.signedIn ? "Free loop attached to your Luckee account" : "First complete loop is free");
    const body = isWorkspace
      ? "This generation used the free optimization bundle. Editing, approving and exporting this bundle do not cost extra."
      : (trial.noCardCopy || "No card needed for the first loop. Later runs use Luckee credits.");
    const account = state.signedIn ? (state.accountEmail || defaultAccount().accountEmail) : "Account step pending";
    const audit = state.freeAuditUsed ? "Free audit used" : (trial.auditLabel || "1 free audit report");
    const opt = state.freeOptimizationUsed ? "Optimization used" : (trial.optimizationLabel || "1 free optimization bundle");
    const optClass = state.freeOptimizationUsed ? "spent" : "available";
    return `
      <div class="funnel-strip" data-funnel-strip="${L.esc(context || "default")}">
        <div class="funnel-main">
          <span class="funnel-kicker">Luckee 1.0 account · credits</span>
          <strong>${L.esc(title)}</strong>
          <span>${L.esc(body)}</span>
        </div>
        <div class="funnel-ledger" aria-label="Prototype account and credit state">
          <span class="ledger-pill">${L.esc(account)}</span>
          <span class="ledger-pill ${state.freeAuditUsed ? "spent" : "available"}">${L.esc(audit)}</span>
          <span class="ledger-pill ${optClass}">${L.esc(opt)}</span>
          ${state.signedIn ? '' : '<button class="ledger-action" type="button" data-auth-action="register">Sign up</button><button class="ledger-action ghost" type="button" data-auth-action="login">Sign in</button>'}
        </div>
      </div>`;
  };

  L.refreshFunnelStrips = function () {
    document.querySelectorAll("[data-funnel-slot]").forEach(slot => {
      slot.innerHTML = L.funnelStrip(slot.getAttribute("data-funnel-slot") || "default");
    });
    L.wireAuthActions();
  };

  L.accountWidget = function () {
    const D = window.LUCKEE_DATA || {};
    const accountCopy = (D.funnel && D.funnel.account) || {};
    const state = L.funnel.getState();
    if (!state.signedIn) {
      return `
        <div class="account-auth">
          <button class="btn btn-ghost btn-sm" type="button" data-auth-action="login">Sign in</button>
          <button class="btn btn-outline btn-sm" type="button" data-auth-action="register">Sign up</button>
        </div>`;
    }
    const name = state.accountName || accountCopy.name || "Luckee user";
    const email = state.accountEmail || accountCopy.email || "demo@luckee.ai";
    const credit = accountCopy.creditsValue || "Shared credits";
    return `
      <div class="account-pill" title="Shared with Luckee 1.0 user management and credit subscription">
        <span class="account-avatar">${L.esc(name.slice(0, 1).toUpperCase())}</span>
        <span class="account-copy"><b>${L.esc(name)}</b><em>${L.esc(credit)}</em></span>
        <button class="account-signout" type="button" data-auth-action="signout">Sign out</button>
      </div>`;
  };

  L.refreshAccountSlots = function () {
    document.querySelectorAll("[data-account-slot]").forEach(slot => {
      slot.innerHTML = L.accountWidget();
    });
    L.refreshNavCtas();
    L.wireAuthActions();
  };

  L.refreshNavCtas = function () {
    const state = L.funnel.getState();
    document.querySelectorAll("[data-nav-free-audit]").forEach(cta => {
      const signedIn = !!state.signedIn;
      cta.hidden = signedIn;
      cta.style.display = signedIn ? "none" : "";
      cta.setAttribute("aria-hidden", signedIn ? "true" : "false");
    });
  };

  function addParam(href, key, value) {
    const url = new URL(href, window.location.href);
    url.searchParams.set(key, value);
    return url.pathname.split("/").pop() + url.search + url.hash;
  }

  L.showAuthModal = function (opts) {
    const D = window.LUCKEE_DATA || {};
    const auth = (D.funnel && D.funnel.auth) || {};
    const options = Object.assign({ mode: "register", onSuccess: null }, opts || {});
    const old = document.getElementById("auth-modal-overlay");
    if (old) old.remove();
    const mode = options.mode === "login" ? "login" : "register";
    trackListingEvent("LISTING_AUTH_MODAL_OPEN", {
      mode,
      reason: options.reason || "",
      placement: options.placement || ""
    });
    const inviteCode = new URLSearchParams(window.location.search || "").get("inviteCode") || "";
    const overlay = document.createElement("div");
    overlay.className = "funnel-modal-overlay open";
    overlay.id = "auth-modal-overlay";
    overlay.innerHTML = `
      <div class="auth-modal card card-pad-lg" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="funnel-modal-close" type="button" aria-label="Close dialog">×</button>
        <div class="auth-logo">L</div>
        <h2 id="auth-title">${L.esc(auth.title || "Welcome to Luckee")}</h2>
        <p>${L.esc(auth.subtitle || "AI E-commerce helper, making operations easier")}</p>
        <button class="auth-google" type="button" data-auth-google>
          <span class="google-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
          </span>
          Continue with Google
        </button>
        <div class="auth-divider"><span>or use email</span></div>
        <div class="auth-tabs" role="tablist" aria-label="Luckee account">
          <button type="button" role="tab" data-auth-tab="login">${L.esc(auth.loginTab || "Login")}</button>
          <button type="button" role="tab" data-auth-tab="register">${L.esc(auth.registerTab || "Sign up")}</button>
        </div>
        <div class="auth-panel" data-auth-panel="login">
          <label>Username/Email<input class="input" type="text" autocomplete="username" data-login-username placeholder="Username/Email" value="${L.esc(defaultAccount().accountEmail)}"></label>
          <label>Password<input class="input" type="password" autocomplete="current-password" data-login-password placeholder="Password"></label>
          <div class="auth-row"><a href="https://luckee.ai/amazon-assistant/forgot-password" target="_blank" rel="noreferrer">Forgot password?</a></div>
          <p class="auth-success" data-auth-success hidden style="margin:0 0 10px;color:var(--success-600);font-size:.78rem;line-height:1.45"></p>
          <p class="auth-error" data-auth-error hidden style="margin:0 0 10px;color:var(--error-600);font-size:.78rem;line-height:1.45"></p>
          <button class="btn btn-primary btn-block" type="button" data-auth-login-submit>${L.esc(auth.loginSubmit || "SIGN IN")}</button>
          <p class="auth-legal">${L.esc(auth.legalLogin || "By logging in, you agree to our Terms of Service and Privacy Policy")}</p>
        </div>
        <div class="auth-panel" data-auth-panel="register">
          <label>Email<span class="auth-inline"><input class="input" type="email" autocomplete="email" data-register-email placeholder="Enter your email" value="${L.esc(defaultAccount().accountEmail)}"><button class="btn btn-outline btn-sm" type="button" data-register-send>Send</button></span></label>
          <div class="auth-grid">
            <label>Code<input class="input" type="text" inputmode="numeric" data-register-code placeholder="Enter code"></label>
            <label>Username<input class="input" type="text" autocomplete="username" data-register-username placeholder="Username" value="${L.esc(defaultAccount().accountName)}"></label>
            <label>Password<input class="input" type="password" autocomplete="new-password" data-register-password placeholder="Password"></label>
            <label>Confirm<input class="input" type="password" autocomplete="new-password" data-register-confirm placeholder="Repeat password"></label>
          </div>
          ${inviteCode ? `<p class="auth-legal" style="margin-bottom:12px!important">Invite code detected: ${L.esc(inviteCode)}</p>` : ""}
          <p class="auth-error" data-register-error hidden style="margin:0 0 10px;color:var(--error-600);font-size:.78rem;line-height:1.45"></p>
          <p class="auth-success" data-register-success hidden style="margin:0 0 10px;color:var(--success-600);font-size:.78rem;line-height:1.45"></p>
          <button class="btn btn-primary btn-block" type="button" data-register-submit>${L.esc(auth.registerSubmit || "SIGN UP")}</button>
          <p class="auth-legal">${L.esc(auth.legalRegister || "By signing up, you agree to our Terms of Service and Privacy Policy")}</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function close() {
      stopCountdown();
      overlay.remove();
    }
    function setMode(next) {
      overlay.querySelectorAll("[data-auth-tab]").forEach(btn => {
        const active = btn.getAttribute("data-auth-tab") === next;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });
      overlay.querySelectorAll("[data-auth-panel]").forEach(panel => {
        panel.hidden = panel.getAttribute("data-auth-panel") !== next;
      });
    }
    setMode(mode);
    overlay.querySelectorAll("[data-auth-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        const nextMode = btn.getAttribute("data-auth-tab");
        if (nextMode === "register") {
          trackListingEvent("LISTING_SIGNUP_INTENT", {
            placement: "auth_modal_tab",
            reason: options.reason || ""
          });
        }
        setMode(nextMode);
      });
    });
    const loginSubmit = overlay.querySelector("[data-auth-login-submit]");
    const loginUsername = overlay.querySelector("[data-login-username]");
    const loginPassword = overlay.querySelector("[data-login-password]");
    const googleAuthButton = overlay.querySelector("[data-auth-google]");
    const authSuccess = overlay.querySelector("[data-auth-success]");
    const authError = overlay.querySelector("[data-auth-error]");
    const registerEmail = overlay.querySelector("[data-register-email]");
    const registerCode = overlay.querySelector("[data-register-code]");
    const registerUsername = overlay.querySelector("[data-register-username]");
    const registerPassword = overlay.querySelector("[data-register-password]");
    const registerConfirm = overlay.querySelector("[data-register-confirm]");
    const registerSend = overlay.querySelector("[data-register-send]");
    const registerSubmit = overlay.querySelector("[data-register-submit]");
    const registerError = overlay.querySelector("[data-register-error]");
    const registerSuccess = overlay.querySelector("[data-register-success]");
    let registerCountdown = 0;
    let countdownTimer = 0;

    function setAuthError(message) {
      if (!authError) return;
      authError.textContent = message || "";
      authError.hidden = !message;
    }

    function setAuthSuccess(message) {
      if (!authSuccess) return;
      authSuccess.textContent = message || "";
      authSuccess.hidden = !message;
    }

    function setRegisterError(message) {
      if (!registerError) return;
      registerError.textContent = message || "";
      registerError.hidden = !message;
    }

    function setRegisterSuccess(message) {
      if (!registerSuccess) return;
      registerSuccess.textContent = message || "";
      registerSuccess.hidden = !message;
    }

    function clearRegisterMessages() {
      setRegisterError("");
      setRegisterSuccess("");
    }

    function stopCountdown() {
      if (countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = 0;
      }
      registerCountdown = 0;
      if (registerSend) {
        registerSend.disabled = false;
        registerSend.textContent = "Send";
      }
    }

    function startCountdown() {
      stopCountdown();
      registerCountdown = 60;
      if (registerSend) {
        registerSend.disabled = true;
        registerSend.textContent = `${registerCountdown}s`;
      }
      countdownTimer = window.setInterval(() => {
        registerCountdown -= 1;
        if (!registerSend) return;
        if (registerCountdown <= 0) {
          stopCountdown();
          return;
        }
        registerSend.textContent = `${registerCountdown}s`;
      }, 1000);
    }

    async function submitLogin() {
      const userName = String(loginUsername?.value || "").trim();
      const password = String(loginPassword?.value || "");
      if (!userName || !password) {
        setAuthError("Please enter your username/email and password.");
        return;
      }
      if (!window.LuckeeAuth?.loginWithPassword) {
        setAuthError("Login service is not ready. Please refresh and try again.");
        return;
      }
      const originalText = loginSubmit.textContent;
      loginSubmit.disabled = true;
      loginSubmit.textContent = "SIGNING IN...";
      setAuthError("");
      setAuthSuccess("");
      trackListingEvent("LISTING_LOGIN_SUBMIT", {
        placement: options.placement || "auth_modal",
        usernameType: userName.includes("@") ? "email" : "username"
      });
      try {
        const result = await window.LuckeeAuth.loginWithPassword(userName, password);
        const userInfo = result.userInfo || {};
        L.funnel.markSignedIn("login", {
          accountName: userInfo.userName || userInfo.name || userInfo.nickName || userName,
          accountEmail: userInfo.email || userInfo.userName || userName,
          loginToken: result.loginToken || "",
          userId: userInfo.id || ""
        });
        window.LuckeeListingTrack?.identify?.(userInfo, { auth_method: "password" });
        close();
        if (typeof options.onSuccess === "function") options.onSuccess("login");
      } catch (err) {
        setAuthError(err?.message || "Login failed. Please check your credentials.");
        trackListingEvent("LISTING_LOGIN_RESULT", {
          success: false,
          errorCode: "login_failed",
          placement: options.placement || "auth_modal"
        }, { immediate: true });
      } finally {
        loginSubmit.disabled = false;
        loginSubmit.textContent = originalText;
      }
    }

    async function startGoogleAuth(button, setError) {
      if (!window.LuckeeAuth?.startGoogleAuth) {
        setError("Google authorization is not ready. Please refresh and try again.");
        return;
      }
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Connecting to Google...";
      try {
        const authUrl = await window.LuckeeAuth.startGoogleAuth(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        );
        window.location.href = authUrl;
      } catch (err) {
        button.disabled = false;
        button.textContent = originalText;
        setError(err?.message || "Unable to get the Google authorization link.");
      }
    }

    async function sendRegisterCode() {
      const email = String(registerEmail?.value || "").trim();
      clearRegisterMessages();
      if (!email) {
        setRegisterError("Please enter your email address.");
        return;
      }
      if (!window.LuckeeAuth?.sendEmailCode) {
        setRegisterError("Registration service is not ready. Please refresh and try again.");
        return;
      }
      const originalText = registerSend.textContent;
      registerSend.disabled = true;
      registerSend.textContent = "Sending...";
      try {
        await window.LuckeeAuth.sendEmailCode(email);
        setRegisterSuccess("Verification code sent.");
        startCountdown();
      } catch (err) {
        registerSend.disabled = false;
        registerSend.textContent = originalText;
        setRegisterError(err?.message || "Failed to send verification code.");
      }
    }

    async function submitRegister() {
      const email = String(registerEmail?.value || "").trim();
      const code = String(registerCode?.value || "").trim();
      const userName = String(registerUsername?.value || "").trim();
      const password = String(registerPassword?.value || "");
      const confirmPassword = String(registerConfirm?.value || "");

      clearRegisterMessages();
      if (!email || !code || !userName || !password || !confirmPassword) {
        setRegisterError("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setRegisterError("Passwords do not match.");
        return;
      }
      if (!window.LuckeeAuth?.registerWithEmail) {
        setRegisterError("Registration service is not ready. Please refresh and try again.");
        return;
      }

      const originalText = registerSubmit.textContent;
      registerSubmit.disabled = true;
      registerSubmit.textContent = "REGISTERING...";
      try {
        const result = await window.LuckeeAuth.registerWithEmail({
          email,
          code,
          userName,
          password,
          inviteCode,
          confirmInviteIssue(message) {
            return window.confirm(message);
          }
        });
        stopCountdown();
        registerCode.value = "";
        registerPassword.value = "";
        registerConfirm.value = "";
        loginUsername.value = result.email || userName;
        loginPassword.value = "";
        setMode("login");
        setAuthSuccess("Registration successful. Please sign in.");
        if (typeof loginUsername?.focus === "function") loginUsername.focus();
      } catch (err) {
        setRegisterError(err?.message || "Registration failed. Please try again.");
      } finally {
        registerSubmit.disabled = false;
        registerSubmit.textContent = originalText;
      }
    }

    loginSubmit.addEventListener("click", submitLogin);
    registerSend.addEventListener("click", sendRegisterCode);
    registerSubmit.addEventListener("click", submitRegister);
    googleAuthButton?.addEventListener("click", () => {
      setAuthSuccess("");
      setAuthError("");
      clearRegisterMessages();
      startGoogleAuth(googleAuthButton, function (message) {
        if ((overlay.querySelector("[data-auth-panel=\"login\"]")?.hidden)) {
          setRegisterError(message);
          return;
        }
        setAuthError(message);
      });
    });
    [loginUsername, loginPassword].forEach(input => {
      input?.addEventListener("keydown", event => {
        if (event.key === "Enter") submitLogin();
      });
    });
    [registerEmail, registerCode, registerUsername, registerPassword, registerConfirm].forEach(input => {
      input?.addEventListener("keydown", event => {
        if (event.key === "Enter") submitRegister();
      });
    });
    overlay.querySelector(".funnel-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector("[data-auth-tab].is-active").focus();
  };

  L.wireAuthActions = function () {
    document.querySelectorAll("[data-auth-action]").forEach(el => {
      if (el.dataset.authBound === "1") return;
      el.dataset.authBound = "1";
      el.addEventListener("click", e => {
        e.preventDefault();
        const action = el.getAttribute("data-auth-action");
        if (action === "signout") {
          if (window.LuckeeAuth?.signOut) window.LuckeeAuth.signOut();
          L.funnel.markSignedOut();
          L.refreshAccountSlots();
          L.refreshFunnelStrips();
          return;
        }
        if (action === "register") {
          trackListingEvent("LISTING_SIGNUP_INTENT", {
            placement: el.closest("[data-funnel-strip]") ? "funnel_strip" : "account_widget"
          });
        }
        L.showAuthModal({
          mode: action === "login" ? "login" : "register",
          reason: action,
          placement: el.closest("[data-funnel-strip]") ? "funnel_strip" : "account_widget"
        });
      });
    });
  };

  L.showFunnelModal = function (opts) {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const options = Object.assign({
      eyebrow: "Credit checkpoint",
      title: "",
      body: "",
      cost: "",
      footnote: "",
      primary: "Continue",
      secondary: "",
      showCancel: true,
      onConfirm: null,
      onCancel: null,
      trackingPayload: null
    }, opts || {});
    const old = document.getElementById("funnel-modal-overlay");
    if (old) old.remove();
    const overlay = document.createElement("div");
    overlay.className = "funnel-modal-overlay open";
    overlay.id = "funnel-modal-overlay";
    overlay.innerHTML = `
      <div class="funnel-modal card card-pad-lg" role="dialog" aria-modal="true" aria-labelledby="funnel-modal-title">
        <button class="funnel-modal-close" type="button" aria-label="Close dialog">×</button>
        ${options.eyebrow ? `<span class="eyebrow">${L.esc(options.eyebrow)}</span>` : ""}
        <h2 id="funnel-modal-title">${L.esc(options.title)}</h2>
        <p>${L.esc(options.body)}</p>
        ${options.cost ? `<div class="credit-cost"><span>${L.esc(options.cost)}</span></div>` : ""}
        ${options.footnote ? `<p class="credit-foot">${L.esc(options.footnote)}</p>` : ""}
        <div class="funnel-modal-actions">
          <button class="btn btn-primary" type="button" data-confirm>${L.esc(options.primary)}</button>
          ${options.showCancel ? `<button class="btn btn-ghost" type="button" data-cancel>${L.esc(options.secondary || F.optimizationConfirm?.cancel || "Cancel")}</button>` : ""}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const trackingPayload = Object.assign({
      cost: options.cost || "",
      title: options.title || ""
    }, options.trackingPayload || {});
    const isFreeBundleGate = trackingPayload.reason === "free_optimization";
    const isSubscriptionGate = trackingPayload.reason === "subscription_required";
    if (trackingPayload.reason === "free_optimization") {
      trackListingEvent("LISTING_FREE_BUNDLE_GATE_VIEW", trackingPayload);
    } else if (trackingPayload.reason === "subscription_required") {
      trackListingEvent("LISTING_SUBSCRIPTION_GATE_VIEW", trackingPayload);
    } else if (trackingPayload.reason || options.cost) {
      trackListingEvent("LISTING_CREDIT_MODAL_VIEW", trackingPayload);
    }
    let resolved = false;
    const close = () => {
      overlay.remove();
    };
    const cancel = () => {
      if (!resolved) {
        resolved = true;
        if (!isFreeBundleGate && !isSubscriptionGate && (trackingPayload.reason || options.cost)) {
          trackListingEvent("LISTING_CREDIT_MODAL_DECISION", Object.assign({
            decision: "cancel"
          }, trackingPayload));
        }
        if (typeof options.onCancel === "function") options.onCancel();
      }
      close();
    };
    const cancelBtn = overlay.querySelector("[data-cancel]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", cancel);
    }
    overlay.querySelector(".funnel-modal-close").addEventListener("click", cancel);
    overlay.addEventListener("click", e => { if (e.target === overlay) cancel(); });
    overlay.addEventListener("keydown", e => {
      if (e.key === "Escape") cancel();
    });
    overlay.querySelector("[data-confirm]").addEventListener("click", () => {
      if (resolved) return;
      resolved = true;
      if (isFreeBundleGate) {
        trackListingEvent("LISTING_FREE_BUNDLE_CONFIRM", Object.assign({
          decision: "confirm"
        }, trackingPayload), { immediate: true });
      } else if (isSubscriptionGate) {
        trackListingEvent("LISTING_CTA_CLICK", Object.assign({
          ctaId: "open_pricing",
          decision: "confirm"
        }, trackingPayload), { immediate: true });
      } else if (trackingPayload.reason || options.cost) {
        trackListingEvent("LISTING_CREDIT_MODAL_DECISION", Object.assign({
          decision: "confirm"
        }, trackingPayload), { immediate: true });
      }
      close();
      if (typeof options.onConfirm === "function") options.onConfirm();
    });
    overlay.querySelector("[data-confirm]").focus();
  };

  L.showNoticeModal = function (opts) {
    L.showFunnelModal(Object.assign({
      eyebrow: "Notice",
      primary: "OK",
      showCancel: false
    }, opts || {}));
  };

  L.wireOptimizationCreditLinks = function () {
    const D = window.LUCKEE_DATA || {};
    const F = D.funnel || {};
    const params = new URLSearchParams(window.location.search || "");
    const isSampleMode = params.get("sample") === "1";

    function continueToOptimization(link, runOptions) {
      if (isSampleMode) {
        window.location.href = link.getAttribute("href") || "workspace.html?sample=1";
        return;
      }
      const state = L.funnel.getState();
      const href = link.getAttribute("href") || "workspace.html";
      if (!runOptions?.skipCtaTrack) {
        trackListingEvent("LISTING_OPTIMIZATION_CTA_CLICK", {
          placement: link.closest(".appbar") ? "appbar" : "report",
          targetPage: href
        });
      }
      if (!state.signedIn) {
        L.showAuthModal({
          mode: "register",
          reason: "optimize",
          placement: "optimization_cta",
          onSuccess: () => {
            L.funnel.markAuditViewed();
            continueToOptimization(link, { skipCtaTrack: true });
          }
        });
        return;
      }

      L.funnel.markOptimizationGenerated();
      trackListingEvent("LISTING_FREE_BUNDLE_GATE_VIEW", {
        reason: "free_optimization",
        gate_type: "implicit",
        placement: link.closest(".appbar") ? "appbar" : "report",
        targetPage: href
      });
      trackListingEvent("LISTING_FREE_BUNDLE_CONFIRM", {
        reason: "free_optimization",
        gate_type: "implicit",
        placement: link.closest(".appbar") ? "appbar" : "report",
        targetPage: href
      }, { immediate: true });
      window.location.href = addParam(href, "opt", "1");
    }

    document.querySelectorAll('[data-credit-action="optimize"]').forEach(link => {
      if (link.dataset.creditBound === "1") return;
      link.dataset.creditBound = "1";
      link.addEventListener("click", e => {
        e.preventDefault();
        continueToOptimization(link);
      });
    });
  };

  L.bootstrapFunnelPage = function () {
    L.syncFunnelFromUrl();
    L.refreshAccountSlots();
    L.refreshFunnelStrips();
    L.wireOptimizationCreditLinks();
    L.wireAuthActions();

    if (!L._authBridgeBound) {
      window.addEventListener("luckee-auth-changed", (event) => {
        const session = event?.detail?.session || null;
        if (session?.loginToken) {
          L.funnel.markSignedIn("login", accountFromSession(session));
          return;
        }
        L.funnel.markSignedOut();
      });
      L._authBridgeBound = true;
    }

    if (window.LuckeeAuth?.ensureValidSession) {
      window.LuckeeAuth.ensureValidSession()
        .then((session) => {
          if (!session?.loginToken) {
            L.funnel.markSignedOut();
            return;
          }
          L.funnel.markSignedIn("login", accountFromSession(session));
        })
        .catch(() => {
          L.funnel.markSignedOut();
        });
    }

    if (window.LuckeeAuth?.completeGoogleAuthIfNeeded) {
      window.LuckeeAuth.completeGoogleAuthIfNeeded()
        .then(result => {
          if (!result?.handled || result?.redirected) return;
          const userInfo = result.userInfo || {};
          L.funnel.markSignedIn("google", {
            accountName: userInfo.userName || userInfo.name || userInfo.nickName || "Luckee user",
            accountEmail: userInfo.email || userInfo.userName || "demo@luckee.ai",
            loginToken: result.loginToken || "",
            userId: userInfo.id || userInfo.userId || ""
          });
          window.LuckeeListingTrack?.identify?.(userInfo, { auth_method: "google" });
          L.refreshAccountSlots();
          L.refreshFunnelStrips();
        })
        .catch(error => {
          console.error("Luckee Listing Google auth callback failed:", error);
        });
    }
  };

  /* ---- load stagger ---- */
  L.initReveal = function (root) {
    const els = (root || document).querySelectorAll("[data-reveal]");
    els.forEach((el, i) => { el.classList.add("reveal"); el.style.animationDelay = (i * 70) + "ms"; });
  };

  /* ---- simple tab controller ----
     usage: data-tab-group="x" on buttons (data-tab="key") and panels (data-panel="key") */
  L.initTabs = function () {
    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.closest("[data-tabs]") || document;
        group.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("tab-active", b === btn));
        const key = btn.getAttribute("data-tab");
        document.querySelectorAll("[data-panel]").forEach(p => {
          p.style.display = p.getAttribute("data-panel") === key ? "" : "none";
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  };

  window.Luckee = L;
  document.addEventListener("DOMContentLoaded", () => { L.initReveal(); });
})();
