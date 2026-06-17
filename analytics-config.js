/* Luckee Website analytics constants. */
(function () {
  var APP_ID    = "luckee-website";
  var SOURCE_APP = "luckee-website";
  var TOOL_ID   = "luckee-website";

  var CANONICAL_EVENTS = Object.freeze({
    // Page
    PAGE_VIEW:                    "website_page_view",

    // Homepage CTAs
    HOMEPAGE_PRIMARY_CTA_CLICK:   "homepage_primary_cta_click",
    HOMEPAGE_SECONDARY_CTA_CLICK: "homepage_secondary_cta_click",

    // Nav
    SOLUTION_NAV_CLICK:           "solution_nav_click",
    PRODUCT_NAV_CLICK:            "product_nav_click",
    NAV_CTA_CLICK:                "nav_cta_click",

    // Product / Solution CTAs
    LISTING_OPTIMIZER_CTA_CLICK:  "listing_optimizer_cta_click",
    ADS_WORKBENCH_CTA_CLICK:      "ads_workbench_cta_click",

    // Contact
    CONTACT_CLICK:                "contact_click",

    // Hero interactive demo
    HERO_DEMO_APPROVE_CLICK:      "hero_demo_approve_click",
    HERO_DEMO_EVIDENCE_CLICK:     "hero_demo_evidence_click"
  });

  var ATTRIBUTION_KEYS = Object.freeze([
    "gclid", "gbraid", "wbraid",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "google_campaign_id", "google_ad_group_id", "google_keyword",
    "google_target_id", "google_match_type", "google_network",
    "google_device", "google_creative_id", "google_keyword_id",
    "landing_variant"
  ]);

  // Fields promoted to top-level columns in the backend event table.
  var TOP_LEVEL_KEYS = Object.freeze([
    "source",
    "source_page",
    "section",
    "cta_label",
    "target_type",
    "target_url",
    "homepage_version"
  ]);

  window.LuckeeAnalyticsConfig = Object.freeze({
    APP_ID:         APP_ID,
    SOURCE_APP:     SOURCE_APP,
    TOOL_ID:        TOOL_ID,
    ENDPOINT:       "luckee/user/web/analytics/events/batch.do",
    STORAGE_PREFIX: "luckee-website:analytics",
    CANONICAL_EVENTS: CANONICAL_EVENTS,
    ATTRIBUTION_KEYS: ATTRIBUTION_KEYS,
    TOP_LEVEL_KEYS:   TOP_LEVEL_KEYS
  });
})();
