/* ============================================================
   Luckee homepage v2 — interactions (vanilla, no React)
   - Growth loop auto-cycle (2.4s, pause on hover, click to jump)
   - Hero workbench: click a queue item to swap the decision detail
   - Approve buttons + evidence drawer (event-delegated, swap-safe)
   ============================================================ */
(function () {
  "use strict";

  /* ---- Growth loop auto-cycle ---- */
  var steps = Array.prototype.slice.call(document.querySelectorAll(".loop-strip .loop-step"));
  if (steps.length) {
    var active = 0, paused = false;
    var setLoop = function (i) {
      active = i;
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); s.classList.toggle("done", k < i); });
    };
    setLoop(0);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setInterval(function () { if (!paused) setLoop((active + 1) % steps.length); }, 2400);
    var strip = document.querySelector(".loop-strip");
    if (strip) {
      strip.addEventListener("mouseenter", function () { paused = true; });
      strip.addEventListener("mouseleave", function () { paused = false; });
    }
    steps.forEach(function (s, k) { s.addEventListener("click", function () { setLoop(k); }); });
  }

  /* ---- Hero workbench: queue -> detail swap ---- */
  var WB_DETAILS = ["<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>ChefEdge 15pc · BOKNF7O011</b><span class=\"wb-goal\">Goal: ACOS ≤ 8%</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Reduce bids on 14 search terms with zero conversions across 6,400 clicks in 90 days.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>$412/mo saved</strong> · ACOS −1.8 pts</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>90-day search term report · placement analysis</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Max −20% bid change · auto-rollback if ACOS +2 pts</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>","<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>PureAir 500 · BOAIR9O011</b><span class=\"wb-goal\">Goal: GMV +15%</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Shift $30/day from brand defense to exact-match winners with 4.1× ROAS.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>+$1,080/mo GMV</strong> · ROAS +0.6</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>Placement report · 30-day conversion paths</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Budget cap unchanged · revert if ROAS −10%</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>","<div class=\"wb-detail wb-detail-swap\"><div class=\"wb-sku\"><b>Kitchen rack · BOKRA2O044</b><span class=\"wb-goal\">Goal: Rufus ready</span></div><div class=\"wb-action\"><em>Recommended action</em><p>Rewrite backend keywords around 9 buyer questions Rufus answers for this category.</p></div><div class=\"wb-rows\"><div class=\"wb-row\"><b>Expected impact</b><span><span><strong>+9 answerable queries</strong> · indexable</span></span></div><div class=\"wb-row\"><b>Evidence</b><span>Rufus query sample · competitor term gap</span></div><div class=\"wb-row\"><b>Risk boundary</b><span>Listing copy untouched · backend fields only</span></div><div class=\"wb-row\"><b>Outcome review</b><span>Scheduled after approval</span></div></div><div class=\"wb-cta\"><button class=\"wb-approve\">Approve action</button><button class=\"wb-evidence\">See evidence</button></div></div>"];
  var wbBody = document.querySelector(".home-hero .wb-body");
  if (wbBody && WB_DETAILS.length) {
    var queue = Array.prototype.slice.call(wbBody.querySelectorAll(".wb-queue .wb-q-item"));
    queue.forEach(function (item, i) {
      item.addEventListener("click", function () {
        queue.forEach(function (q, k) { q.classList.toggle("active", k === i); });
        var old = wbBody.querySelector(".wb-detail");
        if (old && WB_DETAILS[i]) {
          var tmp = document.createElement("div");
          tmp.innerHTML = WB_DETAILS[i];
          var fresh = tmp.firstElementChild;
          old.replaceWith(fresh);
        }
      });
    });
  }

  /* ---- Approve + Evidence (delegated so it survives detail swaps) ---- */
  document.addEventListener("click", function (e) {
    var ap = e.target.closest ? e.target.closest(".wb-approve") : null;
    if (ap) {
      if (!ap.classList.contains("is-approved")) {
        ap.classList.add("is-approved");
        ap.textContent = "✓ Approved";
        var hero = ap.closest(".home-hero");
        if (hero) {
          var sf = hero.querySelector(".slack-float");
          if (sf) sf.classList.add("is-approved");
          var activeB = hero.querySelector(".wb-q-item.active b");
          if (activeB && !activeB.querySelector(".wb-q-done")) {
            var ic = document.createElement("i");
            ic.className = "wb-q-done"; ic.style.fontStyle = "normal"; ic.textContent = " ✓";
            activeB.appendChild(ic);
          }
        }
      }
      return;
    }
    var ev = e.target.closest ? e.target.closest(".wb-evidence") : null;
    if (ev) {
      var card = ev.closest(".decision-card") || ev.closest(".wb-detail") || ev.closest("section") || document;
      var drawer = card.querySelector(".evidence-drawer");
      if (drawer) {
        var open = drawer.classList.toggle("open");
        ev.textContent = open ? "Hide evidence" : "See evidence";
      }
      return;
    }
  });
})();
