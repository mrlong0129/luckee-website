/* Luckee Website analytics adapter. Exposes window.LuckeeWebsiteTrack. */
(function () {
  var config     = window.LuckeeAnalyticsConfig || {};
  var APP_ID     = config.APP_ID     || "luckee-website";
  var SOURCE_APP = config.SOURCE_APP || "luckee-website";
  var TOOL_ID    = config.TOOL_ID    || "luckee-website";
  var ENDPOINT   = config.ENDPOINT   || "luckee/user/web/analytics/events/batch.do";
  var EVENTS     = config.CANONICAL_EVENTS || Object.freeze({});

  var HOMEPAGE_VERSION = "ai_growth_operator";

  function noop() {}

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  function urlParams() {
    return safe(function () { return new URLSearchParams(window.location.search || ""); }, new URLSearchParams());
  }

  function sourcePage() {
    return safe(function () {
      var path = window.location.pathname
        .replace(/\/$/, "")
        .replace(/\.html$/i, "")
        .replace(/^\//, "");
      return path || "homepage";
    }, "homepage");
  }

  function normalizePayload(payload) {
    return Object.assign(
      {
        source:           "website",
        source_app:       SOURCE_APP,
        tool_id:          TOOL_ID,
        source_page:      sourcePage(),
        homepage_version: HOMEPAGE_VERSION
      },
      payload || {}
    );
  }

  function createSdk() {
    if (!window.LuckeeAnalytics || !window.LuckeeAnalytics.create) return null;
    return window.LuckeeAnalytics.create({
      appId:         APP_ID,
      sourceApp:     SOURCE_APP,
      toolId:        TOOL_ID,
      endpoint:      ENDPOINT,
      storagePrefix: config.STORAGE_PREFIX || "luckee-website:analytics",
      debug:         urlParams().get("analytics_debug") === "1"
    });
  }

  var sdk = createSdk();

  if (!sdk) {
    window.LuckeeWebsiteTrack = {
      EVENTS:         EVENTS,
      track:          noop,
      trackPageView:  noop,
      flush:          noop,
      getAnonymousId: function () { return ""; },
      getSessionId:   function () { return ""; },
      getAttribution: function () { return {}; },
      safe:           safe
    };
    return;
  }

  function track(eventName, payload, options) {
    if (!eventName) return null;
    return sdk.track(eventName, normalizePayload(payload || {}), options || {});
  }

  function trackPageView(payload) {
    return track(
      EVENTS.PAGE_VIEW || "website_page_view",
      payload || {},
      { immediate: true, behaviorType: "PAGE_VIEW" }
    );
  }

  window.LuckeeWebsiteTrack = {
    EVENTS:         EVENTS,
    track:          track,
    trackPageView:  trackPageView,
    flush:          sdk.flush,
    getAnonymousId: sdk.getAnonymousId,
    getSessionId:   sdk.getSessionId,
    getAttribution: sdk.getAttribution,
    safe:           safe
  };
})();
