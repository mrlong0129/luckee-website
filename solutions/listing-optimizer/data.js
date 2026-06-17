/* ============================================================
   LUCKEE_DATA — fixed sample for the Luckee Listing prototype
   Product: Funflow 6-in-1 Hair Dryer Brush · ASIN B0G1MJWK3Z · US
   Shapes mirror listing-sandbox-analyzer (Evidence Pack / Q&A / suggest bundle)
   ============================================================ */
window.LUCKEE_DATA = {
  product: {
    asin: "B0G1MJWK3Z",
    country: "US",
    marketplace: "Amazon.com (US)",
    brand: "Funflow",
    category: "Beauty & Personal Care › Hair Styling Tools",
    title: "Funflow 6-in-1 Hair Dryer Brush with Premium Aluminum Body, 110,000 RPM High-Speed Air Styler with Auto-Wrap Curlers, 200 Million Negative Ions, for Drying, Curling, Smoothing & Volumizing",
    price: "$59.99",
    rating: 4.3,
    reviews: 1284,
    image: "https://m.media-amazon.com/images/I/61Funflow.jpg", /* placeholder; rendered as styled tile */
    reportId: "B0G1MJWK3Z_US_20260602_100000",
    createdAt: "2026-06-02T10:00:00+08:00"
  },

  // NOTE: report/landing recompute these live from qaGroups so they can never drift.
  // Source of truth = the 21 simulated questions (CLEAR 3 · PARTIAL 8 · UNKNOWN 10; risk HIGH 3 · MED 8 · LOW 10).
  answerability: { clear: 3, total: 21, projectedClear: 14, high: 3, med: 8, low: 10 },

  executiveSummary:
    "The Funflow 6-in-1 Hair Dryer Brush listing communicates core functionality and versatility well across its 6 attachments, and its high-speed motor and negative-ion claims are clearly stated. However, Alexa for Shopping cannot confidently answer several decision-critical buyer questions. The single most damaging gap is hair-type suitability — no text anywhere states which hair types (thick, fine, curly) the tool serves, so shoppers searching \"hair dryer brush for thick hair\" get no matching signal. Temperature behaviour, exact package contents, and the premium-aluminum differentiator are also under-expressed. Closing these gaps is projected to lift clearly-answered questions from 3/21 to about 14/21 and improve conversion on long-tail, intent-rich searches.",

  /* ---- Risk / Gap / Impact ---- */
  risks: [
    { level: "HIGH", gap: "Hair type suitability completely missing", impact: "Buyers searching \"hair dryer brush for thick / fine / curly hair\" get no matching signal — Alexa for Shopping answers UNKNOWN and the shopper moves on.", fix: "Bullets · Title · A+ lifestyle" },
    { level: "MED", gap: "Temperature settings have no values", impact: "\"How hot does it get?\" and heat-damage concerns are unanswerable; heat-sensitive shoppers hesitate.", fix: "Bullet 4 · Spec table" },
    { level: "MED", gap: "Package contents scattered / incomplete", impact: "\"What's in the box?\" cannot be answered cleanly — 6-in-1 value is undersold.", fix: "Bullet 5 · A+" },
    { level: "MED", gap: "Premium aluminum body USP only in title", impact: "Key durability/quality differentiator is invisible in bullets and A+, so it does not register at decision time.", fix: "Bullet 1 · A+ hero" },
    { level: "MED", gap: "High-volume category synonyms absent from all frontend text", impact: "\"blow dryer brush\", \"hot air brush\" never appear — weak retrieval on the biggest search terms.", fix: "Search Terms (backend)" }
  ],

  /* ---- Evidence Pack (extraction-schema) ---- */
  evidencePack: {
    input: { asin: "B0G1MJWK3Z", url: "https://www.amazon.com/dp/B0G1MJWK3Z", source_mode: "fetch_product" },
    sections: [
      { section: "Title", status: "retrieved", summary: "Full title retrieved. Strong on specs (110,000 RPM, 200M ions, aluminum) and functions (dry/curl/smooth/volumize). Missing audience / hair-type." },
      { section: "Bullets (5)", status: "retrieved", summary: "5 bullets retrieved. Benefit-led but no hair-type, no temperature values, package contents only partially listed." },
      { section: "Description / A+", status: "partially_retrieved", summary: "A+ present: 13 modules detected & analyzed. Visually rich (hero, ion feature, lifestyle), but several modules make performance claims without quantified specs." },
      { section: "Product overview", status: "retrieved", summary: "Brand recognized: Funflow. Attachment count (6) and primary use (hair styling) confirmed." },
      { section: "Spec table", status: "partially_retrieved", summary: "Wattage (1200W) and motor speed present; heat settings, weight, and cord length not exposed." },
      { section: "Images", status: "retrieved", summary: "Main image + 6 secondary images. On-image text emphasizes speed & ions; no hair-type or temperature callouts legible." }
    ],
    inventory: {
      product_type: "Hot-air hair styler (dryer brush)",
      likely_category: "Beauty & Personal Care · Hair Styling Tools",
      explicit_claims: ["110,000 RPM motor", "200 Million negative ions", "Premium aluminum body", "6-in-1 attachments", "1200W"],
      strong_areas: ["Motor speed / power", "Versatility (6 attachments)", "Ion technology"],
      missing_dimensions: ["Hair-type suitability", "Temperature / heat settings", "Complete package contents", "Weight & ergonomics", "Heat-protection / safety"]
    },
    notes: ["Evidence-gated: no specs, certifications, or compatibility inferred beyond what the page states.", "Brand 'Funflow' detected — not treated as a generic keyword."]
  },

  /* ---- Alexa Shopping Q&A Simulation (>=20), grouped by decision area ---- */
  qaGroups: [
    { area: "Functionality & performance", items: [
      { q: "Can this dry and style my hair at the same time?", intent: "Core function", support: "CLEAR", answer: "Yes — it is a 6-in-1 hot-air styler that dries while curling, smoothing and volumizing.", evidence: "Title; Bullet 1", gap: "None", risk: "LOW", fix: "—" },
      { q: "How is 110,000 RPM better for me in practice?", intent: "Performance benefit", support: "PARTIAL", answer: "The 110,000 RPM motor is marketed as high-speed for faster drying, but no dry-time or comparison is given.", evidence: "Title; A+ hero", gap: "No measurable outcome (e.g. dry time)", risk: "MED", fix: "Bullet 1 · A+ hero" },
      { q: "What do the 6 attachments actually do?", intent: "Versatility", support: "PARTIAL", answer: "Six attachments support drying, curling, smoothing and volumizing; individual attachment names/uses are not all listed.", evidence: "Title; A+ feature", gap: "Per-attachment naming incomplete", risk: "MED", fix: "Bullet 2 · A+" },
      { q: "Will it make my hair frizzy?", intent: "Result quality", support: "CLEAR", answer: "200 million negative ions are stated to reduce frizz and add shine.", evidence: "Title; A+ ion module", gap: "None", risk: "LOW", fix: "—" }
    ]},
    { area: "Power, heat & charging", items: [
      { q: "How hot does it get? Are there heat settings?", intent: "Heat control", support: "UNKNOWN", answer: "I don't see specific temperature values or named heat settings on this listing.", evidence: "—", gap: "No temperature values anywhere", risk: "HIGH", fix: "Bullet 4 · Spec table" },
      { q: "Is it corded or cordless? Cord length?", intent: "Power format", support: "PARTIAL", answer: "It is a 1200W corded styler; cord length is not stated.", evidence: "Spec table (1200W)", gap: "Cord length missing", risk: "LOW", fix: "Spec table" },
      { q: "Will it overheat or damage my hair?", intent: "Heat safety", support: "UNKNOWN", answer: "No heat-protection feature or safe-temperature claim is described.", evidence: "—", gap: "No heat-protection claim", risk: "MED", fix: "Bullet 3 · A+" },
      { q: "What wattage is it?", intent: "Power spec", support: "CLEAR", answer: "1200W.", evidence: "Spec table", gap: "None", risk: "LOW", fix: "—" }
    ]},
    { area: "Compatibility & fit (hair type)", items: [
      { q: "Is this good for thick hair?", intent: "Hair-type fit", support: "UNKNOWN", answer: "The listing does not state which hair types it is designed for.", evidence: "—", gap: "Hair-type suitability missing", risk: "HIGH", fix: "Bullet 2 · Title · A+ lifestyle" },
      { q: "Will it work on fine or thin hair without damage?", intent: "Hair-type fit", support: "UNKNOWN", answer: "No guidance for fine/thin hair is provided.", evidence: "—", gap: "Hair-type suitability missing", risk: "HIGH", fix: "Bullet 2 · A+ lifestyle" },
      { q: "Can it curl curly or coily hair?", intent: "Hair-type fit", support: "UNKNOWN", answer: "Curl function is stated, but suitability for curly/coily textures is not addressed.", evidence: "Title (curling)", gap: "Texture suitability unclear", risk: "MED", fix: "A+ lifestyle" },
      { q: "Is it suitable for short hair?", intent: "Length fit", support: "PARTIAL", answer: "Styling functions imply versatility, but hair length is not addressed.", evidence: "A+ lifestyle", gap: "Length range not stated", risk: "LOW", fix: "A+" }
    ]},
    { area: "Ease of use & maintenance", items: [
      { q: "Is it easy to use for beginners?", intent: "Learning curve", support: "PARTIAL", answer: "Auto-wrap curlers suggest ease of use, but no beginner guidance is given.", evidence: "Title (Auto-Wrap)", gap: "No beginner framing", risk: "LOW", fix: "Bullet 2" },
      { q: "How do I clean it / remove lint?", intent: "Maintenance", support: "UNKNOWN", answer: "No cleaning or filter-maintenance instructions are described.", evidence: "—", gap: "Maintenance not covered", risk: "LOW", fix: "A+ · FAQ" },
      { q: "Are the attachments easy to swap?", intent: "Usability", support: "PARTIAL", answer: "Multiple attachments are included; the swap mechanism is not described.", evidence: "Title", gap: "Attachment mechanism unclear", risk: "LOW", fix: "A+ feature" },
      { q: "Is it travel-friendly / dual voltage?", intent: "Portability", support: "UNKNOWN", answer: "No travel or dual-voltage information is provided.", evidence: "—", gap: "Voltage / travel missing", risk: "MED", fix: "Spec table" }
    ]},
    { area: "Safety, limits & trust", items: [
      { q: "What exactly comes in the box?", intent: "Package contents", support: "PARTIAL", answer: "Six attachments plus the main unit are implied; an explicit contents list is not provided.", evidence: "Title (6-in-1)", gap: "No explicit contents list", risk: "MED", fix: "Bullet 5" },
      { q: "Is it certified / safety-tested?", intent: "Trust / safety", support: "UNKNOWN", answer: "No certification (e.g. ETL/UL) is mentioned.", evidence: "—", gap: "No certification claim", risk: "MED", fix: "Spec table · A+" },
      { q: "What's the warranty?", intent: "After-sales", support: "UNKNOWN", answer: "No warranty or support terms are stated.", evidence: "—", gap: "Warranty missing", risk: "LOW", fix: "A+ · Bullet 5" },
      { q: "Is the aluminum body actually more durable?", intent: "Build quality", support: "PARTIAL", answer: "A 'premium aluminum body' is claimed in the title only, with no durability detail elsewhere.", evidence: "Title", gap: "USP only in title", risk: "MED", fix: "Bullet 1 · A+ hero" },
      { q: "Will it tangle long hair with the auto-wrap?", intent: "Risk / limitation", support: "UNKNOWN", answer: "Auto-wrap is described as a feature; tangle handling for long hair is not addressed.", evidence: "Title", gap: "Limitation not addressed", risk: "LOW", fix: "FAQ · A+" }
    ]}
  ],

  /* ---- Competitor benchmark (module coverage) ---- */
  // Competitors are sourced + dated so the benchmark is auditable (not opaque placeholders).
  benchmarkSource: "Competitors are the top organic results for \"hair dryer brush\" on Amazon US, captured 2026-06-01. Coverage = whether the module is present on their PDP, not a judgement of their product.",
  competitors: [
    { name: "Funflow (You)", self: true, asin: "B0G1MJWK3Z", brand: "Funflow", price: "$59.99", rating: 4.3 },
    { name: "Shark FlexStyle", asin: "B0B8QYNRT4", brand: "Shark", price: "$199.99", rating: 4.6 },
    { name: "Revlon One-Step", asin: "B07K3DLM9F", brand: "Revlon", price: "$41.88", rating: 4.5 },
    { name: "Dyson Airwrap", asin: "B0CX1FZ9QK", brand: "Dyson", price: "$599.99", rating: 4.4 }
  ],
  benchmark: [
    { module: "Core function",          you: "available",  comp: ["available", "available", "available"] },
    { module: "Hair-type suitability",  you: "not_available", comp: ["available", "available", "available"] },
    { module: "Temperature / heat",     you: "not_available", comp: ["available", "partial", "available"] },
    { module: "Included items",         you: "partial",    comp: ["available", "available", "available"] },
    { module: "Material / build",       you: "partial",    comp: ["partial", "not_available", "available"] },
    { module: "Safety / certification", you: "not_available", comp: ["available", "available", "available"] },
    { module: "Ion / technology",       you: "available",  comp: ["available", "partial", "available"] },
    { module: "Differentiator / USP",   you: "partial",    comp: ["available", "available", "available"] }
  ],

  /* ---- Priority actions ---- */
  priorityActions: [
    { prio: "P0", action: "Add hair-type suitability (thick / fine / curly) to Bullet 2 and the title", area: "Bullets · Title", why: "Resolves the largest UNKNOWN cluster and 2 HIGH-risk gaps.", resolves: 3, effort: "Low", needsConfirmation: true, complianceRisk: true },
    { prio: "P0", action: "Add temperature values and named heat settings to Bullet 4 + spec table", area: "Bullets · Spec", why: "Answers heat-control & heat-damage questions (2 UNKNOWN).", resolves: 2, effort: "Low", needsConfirmation: true, complianceRisk: false },
    { prio: "P1", action: "Rewrite Bullet 5 as a complete package-contents list + warranty", area: "Bullets", why: "Sells the 6-in-1 value and answers \"what's in the box\".", resolves: 2, effort: "Low", needsConfirmation: true, complianceRisk: false },
    { prio: "P1", action: "Surface the premium aluminum USP in Bullet 1 and the A+ hero", area: "Bullets · A+", why: "Moves the durability differentiator into the decision path.", resolves: 1, effort: "Medium", needsConfirmation: false, complianceRisk: false, assetDependency: true },
    { prio: "P2", action: "Add high-volume synonyms to backend Search Terms", area: "Search Terms", why: "Improves retrieval on \"blow dryer brush\", \"hot air brush\".", resolves: 2, effort: "Low", needsConfirmation: false, complianceRisk: false }
  ],

  /* ---- Optimization suggest bundle (alexa_suggest_checklist_bundle) ---- */
  bundle: {
    type: "alexa_suggest_checklist_bundle", version: "1.0", source: "listing-sandbox-analyzer",
    report_id: "B0G1MJWK3Z_US_20260602_100000", asin: "B0G1MJWK3Z", country: "US",
    created_at: "2026-06-02T10:00:00+08:00",
    modules: {
      title: {
        label: "Title", status: "available", priority: "P1", riskLevel: "low",
        currentValue: "Funflow 6-in-1 Hair Dryer Brush with Premium Aluminum Body, 110,000 RPM High-Speed Air Styler with Auto-Wrap Curlers, 200 Million Negative Ions, for Drying, Curling, Smoothing & Volumizing",
        suggestedValue: "Funflow 6-in-1 Hair Dryer Brush for All Hair Types, Premium Aluminum Body, 110,000 RPM High-Speed Air Styler with Auto-Wrap Curlers, 200 Million Negative Ions, for Drying, Curling, Smoothing & Volumizing",
        reason: "Adding \"for All Hair Types\" helps Alexa for Shopping answer hair-type suitability questions and captures long-tail searches. The current title covers specs well but lacks audience targeting.",
        impact: "Resolves the top HIGH-risk gap signal in the most-weighted field.",
        sourceEvidence: ["Title", "Q&A: hair-type cluster"],
        embeddedKeywords: ["hair dryer brush", "air styler"],
        scenarioTerms: ["for all hair types"],
        uspTerms: ["premium aluminum body", "110,000 RPM"],
        factStatus: "needs_confirmation",
        factNote: "\"for All Hair Types\" is a suitability claim not currently established on your page — confirm it genuinely applies before publishing (it is also an Amazon claim-substantiation risk)."
      },
      bullets: {
        label: "Bullets", priority: "P0", riskLevel: "high",
        description: "Current bullets are benefit-led but miss hair-type (HIGH risk), lack temperature values, scatter package contents, and bury the aluminum USP.",
        reason: "Inject hair-type, temperature values, complete contents and the aluminum USP across the 5 bullets.",
        impact: "Closes 1 HIGH + 3 MED gaps; projected +5 CLEAR answers.",
        currentItems: [
          "HIGH-SPEED DRYING: 110,000 RPM motor dries hair fast",
          "6-IN-1 VERSATILITY: dry, curl, smooth and volumize with included attachments",
          "200 MILLION NEGATIVE IONS: reduces frizz for shiny, smooth results",
          "AUTO-WRAP CURLERS: effortless curls at the touch of a button",
          "PREMIUM DESIGN: sleek body, great as a gift"
        ],
        // Evidence-gated: facts present on the page are written; facts that are MISSING become
        // [confirm …] placeholders the seller must fill — we never invent specs.
        suggestedItems: [
          "FAST DRYING, PREMIUM ALUMINUM BODY — A 110,000 RPM high-speed motor and 1200W in a premium aluminum-alloy body for fast drying and a durable, premium feel.",
          "FOR THICK, FINE & WAVY HAIR — Auto-wrap curls, blowout volume and sleek styles. [confirm the exact hair types you officially support]",
          "200 MILLION NEGATIVE IONS — Seal the cuticle to cut frizz and static and lock in shine. [confirm whether it is safe for color-treated hair]",
          "HEAT & SPEED CONTROL — [confirm number of heat / speed levels and max temperature in °F] with a cool-shot to set styles and protect heat-sensitive hair.",
          "COMPLETE 6-IN-1 SET IN THE BOX — Main handle + [confirm the exact attachments included], plus [confirm warranty term]."
        ],
        // fact status per bullet — drives the workspace badges and the export gate
        itemFacts: [
          { index: 1, status: "verified", note: "110,000 RPM, 1200W and the aluminum body are all present in the title/spec evidence — safe to publish as-is." },
          { index: 2, status: "needs_confirmation", note: "Hair-type suitability is not on your page. Confirm which types you support — it is also a suitability claim Amazon may ask you to substantiate." },
          { index: 3, status: "needs_confirmation", note: "\"Color-treated\" suitability is not evidenced. Confirm before publishing." },
          { index: 4, status: "needs_confirmation", note: "Temperature and heat/speed settings are MISSING from your listing. Enter your real values — we never invent specs." },
          { index: 5, status: "needs_confirmation", note: "Exact box contents and warranty term are not evidenced. Confirm before publishing." }
        ],
        itemNotes: [
          { index: 1, targetPosition: "Bullet 1", embeddedKeywords: ["high-speed motor"], scenarioTerms: [], uspTerms: ["premium aluminum body", "1200W"], reason: "Promote the aluminum USP out of the title into the lead bullet." },
          { index: 2, targetPosition: "Bullet 2", embeddedKeywords: ["for thick hair", "for fine hair"], scenarioTerms: ["thick to fine hair"], uspTerms: [], reason: "Resolve the HIGH-risk hair-type gap." },
          { index: 4, targetPosition: "Bullet 4", embeddedKeywords: ["heat settings"], scenarioTerms: ["heat-sensitive hair"], uspTerms: ["cool-shot"], reason: "Add temperature values to answer heat-control questions." },
          { index: 5, targetPosition: "Bullet 5", embeddedKeywords: ["6-in-1 set"], scenarioTerms: [], uspTerms: ["12-month warranty"], reason: "Explicit contents list + warranty for trust." }
        ],
        sourceEvidence: ["Bullets 1-5", "Q&A: hair-type, heat, contents clusters"]
      },
      aplus: {
        label: "A+ Page", priority: "P1", riskLevel: "medium",
        imageCountDetected: 13, imageCountAnalyzed: 13,
        summary: "13 well-designed modules cover all 6 attachments, ion tech and brand story. Key gaps: the hero makes speed/performance claims without quantified specs, the ion module is inconsistent with the bullets (missing the 200M count), and the versatility module lacks explicit hair-type text despite showing diverse models.",
        modules: [
          { id: "m01", moduleType: "hero", needsRedesign: false,
            current: { visualSummary: "Model with blowout brush on a lavender background.", visibleText: ["FUNFLOW", "Fast Drying. Easier Styling. Smoother Results."], claims: ["Fast drying", "Easier styling"] },
            issue: "Makes speed/performance claims with no quantifiable data (RPM, wattage, weight) on-image.",
            suggestion: { suggestedHeadline: "110,000 RPM · 1200W · Premium Aluminum Body", suggestedBody: "Quantify the speed claim and surface the aluminum USP directly on the hero.", suggestedVisualDirection: "Overlay a small spec strip (RPM / W / ions) on the existing hero image.", keepImage: true } },
          { id: "m04", moduleType: "feature", needsRedesign: false,
            current: { visualSummary: "Negative-ion technology module with abstract ion graphic.", visibleText: ["Negative Ion Technology", "Frizz-free shine"], claims: ["Reduces frizz"] },
            issue: "Inconsistent with bullets/title — the '200 Million' ion count shown elsewhere is missing here.",
            suggestion: { suggestedHeadline: "200 Million Negative Ions", suggestedBody: "Restate the exact 200M figure to stay consistent with the title and bullets.", suggestedVisualDirection: "Keep the graphic; add the 200M numeral as a large callout.", keepImage: true } },
          { id: "m09", moduleType: "lifestyle", needsRedesign: true,
            current: { visualSummary: "Grid of diverse models with different hairstyles.", visibleText: ["For everyone"], claims: ["Versatile styling"] },
            issue: "Shows diverse models but never states hair-type suitability in text — the HIGH-risk gap is visible but unverbalized.",
            suggestion: { suggestedHeadline: "Funflow 6-in-1 Air Styler — For All Hair Types", suggestedBody: "Label the grid with explicit hair types: thick, fine, wavy, curly, color-treated.", suggestedVisualDirection: "Add a text band naming each hair type under the model grid.", keepImage: true } }
        ],
        sourceEvidence: ["A+ modules 1, 4, 9", "Q&A: hair-type, performance clusters"]
      },
      searchTerms: {
        label: "Search Terms", priority: "P2", riskLevel: "medium",
        currentValue: "not available (backend search terms not retrievable)",
        suggestedTerms: ["blow dryer brush","hot air brush","hair styling tool for women","one step hair dryer and styler","volumizing hair dryer brush","ionic hair dryer brush","heated brush straightener curler","salon blowout brush","all in one hair tool","hair dryer brush for thick hair","hair dryer brush for fine hair"],
        reason: "High-volume category synonyms (blow dryer brush, hot air brush) and hair-type long-tail terms are absent from all frontend text. Backend Search Terms is the correct placement since these are synonyms rather than naturally readable phrases.",
        impact: "Improves retrieval on the highest-volume category queries without keyword-stuffing the frontend.",
        sourceEvidence: ["Title", "Bullets", "Keyword gap analysis"],
        unusedFrontendTerms: ["blow dryer brush", "hot air brush"],
        byteLimit: 250,
        bannedWords: ["best seller", "#1", "guaranteed", "fda approved", "amazon's choice", "free shipping"],
        mergeNote: "We can't read your current backend Search Terms in this prototype. Paste your existing block so we merge & de-dupe instead of overwriting — and we keep the total under 250 bytes."
      }
    }
  },

  /* ---- Landing-page content ---- */
  landingCopy: {
    dualOpt: "Check the fields Amazon sellers can actually edit: Title, Bullets, A+, Search Terms.",
    // Replaces the unsourced "1 in 3 buyers" line. Still flagged for citation before launch.
    sourcedStat: {
      text: "AI shopping assistants are now a core pre-purchase touchpoint: Alexa for Shopping reached an estimated ~38% of Amazon-app shoppers by Black Friday 2025, with AI-driven shopping at ~$14.2B globally.",
      source: "Industry estimates 2025–26 — replace with a primary citation before launch."
    }
  },
  // Category-defining comparison (true = full, 'partial' = limited, false = none)
  compareTable: {
    cols: ["Luckee Listing", "Generic AI rewriter", "Website AI-search tool"],
    rows: [
      { feature: "Optimizes for Amazon Alexa for Shopping + COSMO", vals: [true, false, "partial"] },
      { feature: "Evidence-gated — never invents specs", vals: [true, false, "partial"] },
      { feature: "20+ shopper-question answerability audit", vals: [true, false, false] },
      { feature: "Top-competitor module benchmark", vals: [true, "partial", false] },
      { feature: "Ready-to-paste fixes in the exact field", vals: [true, "partial", false] },
      { feature: "Works inside the Amazon buying funnel", vals: [true, true, false] },
      { feature: "Transparent self-serve pricing", vals: [true, "partial", false] }
    ]
  },
  // Landing sample outcome — uses the same prototype ASIN as the report.
  caseProof: {
    label: "Sample prototype output. Confirm claims before publishing.",
    who: "the Funflow sample ASIN in this prototype",
    metrics: [
      { label: "Clearly answered questions", before: "3 / 21", after: "14 / 21" },
      { label: "Priority fixes drafted", before: "0", after: "5" },
      { label: "Seller confirmations surfaced", before: "hidden", after: "4 checks" }
    ]
  },
  differentiators: [
    { icon: "scan", title: "Reads the real page", body: "Title, bullets, specs, A+ and visible evidence in one audit." },
    { icon: "swords", title: "Benchmarks competitors", body: "See which modules top listings already answer." },
    { icon: "shield-check", title: "Tests buyer questions", body: "Clear, partial or unknown for each purchase concern." },
    { icon: "wand", title: "Writes field fixes", body: "Drafts for Title, Bullets, A+ and Search Terms." }
  ],
  howItWorks: [
    { step: "01", title: "Extract", body: "Read the listing evidence.", youGet: "A complete map of what your page actually says." },
    { step: "02", title: "Ask", body: "Run buyer questions.", youGet: "The buyer questions blocking the sale." },
    { step: "03", title: "Score", body: "Find Clear, Partial and Unknown answers.", youGet: "A prioritized list of what to fix first." },
    { step: "04", title: "Fix", body: "Draft exact field edits.", youGet: "Seller-Central-ready copy to paste." }
  ],
  pricing: [
    {
      id: "free",
      type: 0,
      name: "First loop free",
      tagline: "Audit + fix one listing",
      price: "$0",
      monthlyPrice: 0,
      yearlyPrice: 0,
      per: "/month",
      cta: "Get my free audit",
      creditsValue: 1500,
      credits: "1,500 Credits",
      features: ["1 full audit", "Full 20+ Q&A simulation", "Competitor benchmark", "1 optimization bundle (Title · Bullets · A+ · Search Terms)", "Ready-to-paste export", "Prioritized fix list"]
    },
    {
      id: "standard",
      type: 1,
      name: "Seller",
      tagline: "Fix and ship",
      price: "$29.25",
      monthlyPrice: 39.9,
      yearlyPrice: 29.25,
      per: "/month",
      badge: "Most Popular",
      badgeTone: "gold",
      cta: "Subscribe",
      yearlySavingsAmount: 127.8,
      savings: "Save $127.8 / year",
      creditsValue: 30000,
      credits: "30,000 Credits",
      featured: true,
      features: ["20 audits / mo", "Full 20+ Q&A simulation", "Full competitor benchmark", "Title · Bullets · A+ · Search Terms fixes", "Ready-to-paste export", "Compliance & claim checks", "Re-audit + history"],
      note: "Includes monitoring & re-audits"
    },
    {
      id: "pro",
      type: 2,
      name: "Agency",
      tagline: "Scale across listings",
      price: "$74.25",
      monthlyPrice: 99,
      yearlyPrice: 74.25,
      per: "/month",
      cta: "Subscribe",
      yearlySavingsAmount: 297,
      savings: "Save $297 / year",
      creditsValue: 100000,
      credits: "100,000 Credits",
      features: ["100 audits / mo", "Multi-ASIN management", "Batch reports", "White-label exports", "Team collaboration", "Client report templates"]
    }
  ],
  creditPack: {
    title: "Credit Pack",
    remaining: "97,785.3 / 100,000 remaining",
    status: "Active",
    price: "$39.9",
    creditsValue: 100000,
    cta: "Buy More",
    progress: 97.8
  },

  /* ---- Funnel / credit policy (prototype-level; production reuses Luckee 1.0) ---- */
  funnel: {
    selectedStrategy: "Auth-first: attach the first loop to a Luckee account before analysis, then let the rest of the flow continue without another auth gate.",
    notSelectedStrategy: "Aha-first: ASIN input is open, report viewing asks for account, optimization asks for credit confirmation.",
    trial: {
      label: "First complete loop is free",
      auditLabel: "1 free audit report",
      optimizationLabel: "1 free optimization bundle",
      accountCopy: "Create or sign in to a Luckee account to save this report and use the free optimization bundle.",
      noCardCopy: "No card needed for the first loop. Later runs use your Luckee credits."
    },
    account: {
      name: "Luckee user",
      email: "demo@luckee.ai",
      creditsLabel: "Luckee credits",
      creditsValue: "Shared Luckee credits"
    },
    auth: {
      title: "Welcome to Luckee",
      subtitle: "AI E-commerce helper, making operations easier",
      loginTab: "Login",
      registerTab: "Sign up",
      loginSubmit: "SIGN IN",
      registerSubmit: "SIGN UP",
      loginFields: ["Username/Email", "Password"],
      registerFields: ["Email", "Code", "Username", "Password", "Confirm"],
      legalLogin: "By logging in, you agree to our Terms of Service and Privacy Policy",
      legalRegister: "By signing up, you agree to our Terms of Service and Privacy Policy"
    },
    creditRules: [
      { event: "Enter ASIN", cost: "No credit", note: "Keep the first action frictionless." },
      { event: "Generate report", cost: "Audit credit", note: "First report uses the free audit allowance." },
      { event: "View existing report", cost: "No extra credit", note: "Do not punish browsing or sharing." },
      { event: "Generate optimization bundle", cost: "Optimization credit", note: "Confirm before consuming credit." },
      { event: "Edit, approve, export", cost: "No extra credit", note: "The generated bundle can be worked through freely." },
      { event: "Re-audit after publish", cost: "Audit credit", note: "Production should treat this as a new measurable run." }
    ],
    reportGate: {
      title: "Your report is ready.",
      body: "The audit is complete. Open the diagnosis report to see the answerability score, evidence gaps and field-level fixes.",
      primary: "View report",
      secondary: "Audit complete · first report remains free"
    },
    optimizationConfirm: {
      title: "Generate the optimization bundle?",
      body: "This creates the Title, Bullets, A+ and Search Terms fixes for this report.",
      cost: "Uses 1 Optimization Credit",
      footnote: "After generation, editing, approving and exporting this bundle do not cost extra.",
      primary: "Use 1 credit and generate",
      cancel: "Not now"
    },
    paywall: {
      title: "No optimization credits left",
      body: "The free optimization bundle has already been used. Continue with Luckee credits, invite a teammate, or upgrade before generating another bundle.",
      primary: "View pricing",
      secondary: "Not now"
    }
  },

  /* ---- Compliance / safety section (landing) ---- */
  compliance: {
    eyebrow: "Built safe for Amazon",
    title: "Optimizations that never get your listing suppressed.",
    points: [
      { t: "Never invents specs", d: "Missing facts become a [confirm …] placeholder — never fabricated." },
      { t: "Flags claims to verify", d: "Suitability & performance claims are flagged for you to confirm first." },
      { t: "Enforces Amazon limits", d: "Rewrites respect Amazon's character & 250-byte limits — nothing truncated." },
      { t: "Checks banned words", d: "Screens terms like \"best seller\" or \"FDA approved\" to avoid suppression." }
    ]
  },

  /* ---- Lifecycle / ongoing optimization section (landing) ---- */
  lifecycle: {
    eyebrow: "Built for ongoing optimization",
    title: "Listing optimization is a loop, not a one-off.",
    points: [
      { t: "Re-audit to measure the lift", d: "Re-run after publishing to see your before → after answerability lift." },
      { t: "Version history per ASIN", d: "Every audit & edit saved per ASIN — track changes, roll back anytime." },
      { t: "Manage many ASINs", d: "Run & compare audits across a whole catalog — built for agencies." }
    ]
  }
};
