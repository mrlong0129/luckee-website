/* ============================================================
   Luckee homepage v2/v3 — interactions (vanilla, no React)
   - Growth loop: starts at 01 when scrolled into view, auto-cycles,
     progress trace via --loop-p; click to jump, hover to pause
   - Hero workbench: autopilot rotates decisions until the user
     interacts; click queue to swap; approve ripples through the UI
   - Approve + evidence (delegated); hero "See evidence" deep-links
     to the workbench decision card and opens its drawer
   - Depth: 3D tilt + parallax floats, card spotlight, horizon parallax
   All motion gated on prefers-reduced-motion; pointer FX on hover:hover.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ================= Growth loop ================= */
  var strip = document.querySelector(".loop-strip");
  var steps = strip ? Array.prototype.slice.call(strip.querySelectorAll(".loop-step")) : [];
  if (steps.length) {
    var active = 0, paused = false, loopTimer = null;
    var setLoop = function (i) {
      active = i;
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); s.classList.toggle("done", k < i); });
      strip.style.setProperty("--loop-p", String(i / (steps.length - 1)));
    };
    setLoop(0);
    var startLoop = function () {
      if (reduce || loopTimer) return;
      loopTimer = setInterval(function () { if (!paused) setLoop((active + 1) % steps.length); }, 2400);
    };
    if (!reduce && "IntersectionObserver" in window) {
      var lio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { setLoop(0); startLoop(); lio.disconnect(); } });
      }, { threshold: 0.35 });
      lio.observe(strip);
    } else {
      startLoop();
    }
    strip.addEventListener("mouseenter", function () { paused = true; });
    strip.addEventListener("mouseleave", function () { paused = false; });
    steps.forEach(function (s, k) { s.addEventListener("click", function () { setLoop(k); }); });
  }

  /* ================= Hero workbench ================= */
  var WB_DETAILS = ["<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>ChefEdge 15pc · BOKNF7O011</b><span class=\"wb-goal\">Goal: ACOS ≤ 8%</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Reduce bids on 14 search terms with zero conversions across 6,400 clicks in 90 days.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>$412/mo saved</strong> · ACOS −1.8 pts</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>90-day search term report · placement analysis</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Max −20% bid change · auto-rollback if ACOS +2 pts</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>","<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>PureAir 500 · BOAIR9O011</b><span class=\"wb-goal\">Goal: GMV +15%</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Shift $30/day from brand defense to exact-match winners with 4.1× ROAS.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>+$1,080/mo GMV</strong> · ROAS +0.6</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>Placement report · 30-day conversion paths</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Budget cap unchanged · revert if ROAS −10%</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>","<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>Kitchen rack · BOKRA2O044</b><span class=\"wb-goal\">Goal: Rufus ready</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Rewrite backend keywords around 9 buyer questions Rufus answers for this category.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>+9 answerable queries</strong> · indexable</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>Rufus query sample · competitor term gap</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Listing copy untouched · backend fields only</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>"];
  var hero = document.querySelector(".home-hero");
  var wbVisual = hero ? hero.querySelector(".wb-visual") : null;
  var wbBody = wbVisual ? wbVisual.querySelector(".wb-body") : null;
  var approvedSet = {};
  var queue = [], selectDecision = null;

  if (wbBody && WB_DETAILS.length) {
    queue = Array.prototype.slice.call(wbBody.querySelectorAll(".wb-queue .wb-q-item"));
    selectDecision = function (i) {
      queue.forEach(function (q, k) { q.classList.toggle("active", k === i); });
      var oldD = wbBody.querySelector(".wb-detail");
      if (oldD && WB_DETAILS[i]) {
        var tmp = document.createElement("div");
        tmp.innerHTML = WB_DETAILS[i];
        var fresh = tmp.firstElementChild;
        if (approvedSet[i]) {
          var btn = fresh.querySelector(".wb-approve");
          if (btn) { btn.classList.add("is-approved"); btn.textContent = "\u2713 Approved"; }
        }
        oldD.replaceWith(fresh);
      }
    };
    queue.forEach(function (item, i) {
      item.addEventListener("click", function () { stopAutopilot(); selectDecision(i); });
    });

    /* --- autopilot: the demo runs itself until the user takes over --- */
    var apTimer = null, apIdx = 0, apStopped = reduce;
    var stopAutopilot = function () {
      apStopped = true;
      if (apTimer) { clearInterval(apTimer); apTimer = null; }
    };
    var startAutopilot = function () {
      if (apStopped || apTimer) return;
      apTimer = setInterval(function () {
        apIdx = (apIdx + 1) % WB_DETAILS.length;
        selectDecision(apIdx);
      }, 4200);
    };
    if (!apStopped) {
      // engage after the hero overture settles
      setTimeout(startAutopilot, 3200);
      // any real interaction hands over control for good
      wbVisual.addEventListener("pointerdown", stopAutopilot);
      if (finePointer) wbVisual.addEventListener("pointerenter", function () { if (apTimer) { clearInterval(apTimer); apTimer = null; } });
      if (finePointer) wbVisual.addEventListener("pointerleave", function () { startAutopilot(); });
      // pause while offscreen
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) { if (apTimer) { clearInterval(apTimer); apTimer = null; } }
            else startAutopilot();
          });
        }, { threshold: 0.2 }).observe(wbVisual);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && apTimer) { clearInterval(apTimer); apTimer = null; }
        else if (!document.hidden) startAutopilot();
      });
    }
  } else {
    var stopAutopilot = function () {};
  }

  /* decisions-ready counter in the hero browser bar */
  var hdLive = hero ? hero.querySelector(".wb-bar .hd-live") : null;
  var syncReadyCount = function () {
    if (!hdLive) return;
    var left = WB_DETAILS.length - Object.keys(approvedSet).length;
    var dot = hdLive.querySelector(".hd-live-dot");
    hdLive.textContent = left > 0 ? left + (left === 1 ? " decision ready" : " decisions ready") : "All approved \u2713";
    if (dot) hdLive.insertBefore(dot, hdLive.firstChild);
  };

  /* ================= Approve + Evidence (delegated) ================= */
  document.addEventListener("click", function (e) {
    var ap = e.target.closest ? e.target.closest(".wb-approve") : null;
    if (ap) {
      if (ap.classList.contains("is-approved")) return;
      ap.classList.add("is-approved");
      ap.textContent = "\u2713 Approved";
      var frame = ap.closest(".wb-frame") || ap.closest(".decision-card");
      if (frame) {
        frame.classList.remove("is-approved-flow");
        void frame.offsetWidth; /* restart the ripple animation */
        frame.classList.add("is-approved-flow");
      }
      var inHero = ap.closest(".home-hero");
      if (inHero) {
        stopAutopilot();
        var sf = inHero.querySelector(".slack-float");
        if (sf) sf.classList.add("is-approved");
        var mf = inHero.querySelector(".monitor-float");
        if (mf) { mf.classList.remove("flash"); void mf.offsetWidth; mf.classList.add("flash"); }
        var activeIdx = queue.findIndex(function (q) { return q.classList.contains("active"); });
        if (activeIdx >= 0) {
          approvedSet[activeIdx] = true;
          var b = queue[activeIdx].querySelector("b");
          if (b && !b.querySelector(".wb-q-done")) {
            var ic = document.createElement("i");
            ic.className = "wb-q-done"; ic.style.fontStyle = "normal"; ic.textContent = " \u2713";
            b.appendChild(ic);
          }
          syncReadyCount();
        }
      } else {
        /* workbench decision card: chip flips to monitoring */
        var card = ap.closest(".decision-card");
        var chip = card ? card.querySelector(".dc-head .pill-live") : null;
        if (chip) { chip.classList.add("is-monitoring"); chip.textContent = "Monitoring \u00b7 live"; }
      }
      return;
    }
    var ev = e.target.closest ? e.target.closest(".wb-evidence") : null;
    if (ev) {
      var scope = ev.closest(".decision-card") || ev.closest(".wb-detail") || document;
      var drawer = scope.querySelector(".evidence-drawer");
      if (!drawer && ev.closest(".home-hero")) {
        stopAutopilot();
        /* hero deep-link: open the evidence inside the workbench section */
        var card2 = document.querySelector("#workbench .decision-card");
        drawer = card2 ? card2.querySelector(".evidence-drawer") : null;
        if (drawer) {
          drawer.classList.add("open");
          var btn2 = card2.querySelector(".wb-evidence");
          if (btn2) btn2.textContent = "Hide evidence";
          card2.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
        return;
      }
      if (drawer) {
        var open = drawer.classList.toggle("open");
        ev.textContent = open ? "Hide evidence" : "See evidence";
      }
      return;
    }
  });

  /* ================= Depth: tilt + float parallax ================= */
  if (wbVisual && finePointer && !reduce) {
    var tiltTick = false;
    wbVisual.addEventListener("pointermove", function (e) {
      if (tiltTick) return;
      tiltTick = true;
      window.requestAnimationFrame(function () {
        tiltTick = false;
        var r = wbVisual.getBoundingClientRect();
        var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        wbVisual.style.setProperty("--ry", (nx * 3).toFixed(2) + "deg");
        wbVisual.style.setProperty("--rx", (ny * -2.4).toFixed(2) + "deg");
        wbVisual.style.setProperty("--nx", nx.toFixed(3));
        wbVisual.style.setProperty("--ny", ny.toFixed(3));
      });
    });
    wbVisual.addEventListener("pointerleave", function () {
      ["--rx", "--ry", "--nx", "--ny"].forEach(function (p) { wbVisual.style.setProperty(p, "0"); });
    });
  }

  /* ================= Depth: card spotlight ================= */
  if (finePointer && !reduce) {
    document.querySelectorAll(".grid-3, .kernel-grid").forEach(function (grid) {
      grid.addEventListener("pointermove", function (e) {
        var card = e.target.closest(".kernel-cell") || (e.target.closest(".grid-3 > *") || null);
        if (!card || !grid.contains(card)) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", Math.round(e.clientX - r.left) + "px");
        card.style.setProperty("--my", Math.round(e.clientY - r.top) + "px");
      });
    });
  }

  /* ================= Vision horizon parallax ================= */
  var band = document.querySelector(".vision-band");
  var horizon = band ? band.querySelector(".vision-horizon") : null;
  if (band && horizon && !reduce) {
    var hTick = false;
    var setParallax = function () {
      hTick = false;
      var r = band.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      horizon.style.transform = "translateY(" + ((p - 0.5) * 70).toFixed(1) + "px) scale(1.12)";
    };
    window.addEventListener("scroll", function () {
      if (!hTick) { hTick = true; window.requestAnimationFrame(setParallax); }
    }, { passive: true });
    setParallax();
  }
})();
