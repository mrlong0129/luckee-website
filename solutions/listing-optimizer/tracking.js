/* Luckee Listing analytics adapter. Keeps legacy calls, emits SDK v1 events. */
(function () {
  const config = window.LuckeeAnalyticsConfig || {};
  const APP_ID = config.APP_ID || "luckee-listing";
  const SOURCE_APP = config.SOURCE_APP || "listing-optimizer";
  const TOOL_ID = config.TOOL_ID || "listing-optimizer";
  const ENDPOINT = config.ENDPOINT || "luckee/user/web/analytics/events/batch.do";
  const REGISTER_CHANNEL_KEY = config.REGISTER_CHANNEL_KEY || "register_channel";
  const EVENTS = config.LEGACY_EVENTS || Object.freeze({});
  const CANONICAL_EVENTS = config.CANONICAL_EVENTS || Object.freeze({});
  const EVENT_ALIASES = config.EVENT_ALIASES || Object.freeze({});

  function noop() {}

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (err) {
      return fallback;
    }
  }

  function urlParams() {
    return safe(() => new URLSearchParams(window.location.search || ""), new URLSearchParams());
  }

  function readSessionStorage(key) {
    return safe(() => window.sessionStorage.getItem(key), "");
  }

  function writeSessionStorage(key, value) {
    safe(() => window.sessionStorage.setItem(key, value));
  }

  function pageKeyFromLocation() {
    const name = (window.location.pathname.split("/").pop() || "index.html").replace(/\.html$/i, "");
    return name === "index" || name === "" ? "index" : name;
  }

  function defaultDataMode() {
    const params = urlParams();
    if (params.get("sample") === "1") return "sample";
    if (params.get("replay") === "1" || params.get("replayed") === "1" || params.get("replay_thread_id")) {
      return "replay";
    }
    return "live";
  }

  function captureRegisterChannel() {
    const params = urlParams();
    const channel = params.get("channel") || "";
    if (channel && !readSessionStorage(REGISTER_CHANNEL_KEY)) writeSessionStorage(REGISTER_CHANNEL_KEY, channel);
    return readSessionStorage(REGISTER_CHANNEL_KEY) || channel || "";
  }

  function toSnake(value) {
    return String(value || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
  }

  function normalizeDataMode(value) {
    if (value === "sample" || value === "replay" || value === "live") return value;
    return defaultDataMode();
  }

  function canonicalEventName(eventName, payload) {
    if (!eventName) return "";
    if (eventName.indexOf("listing_") === 0) return eventName;
    if (eventName === EVENTS.PAGE_VIEW) {
      const page = payload?.pageKey || payload?.page || pageKeyFromLocation();
      if (page === "index") return CANONICAL_EVENTS.LANDING_VIEW || "listing_landing_view";
      return CANONICAL_EVENTS.PAGE_VIEW || "listing_page_view";
    }
    if (eventName === EVENTS.PLAN_CTA_CLICK) {
      const planId = String(payload?.planId || payload?.plan_id || "");
      return planId && planId !== "free"
        ? CANONICAL_EVENTS.SUBSCRIBE_CLICK || "listing_subscribe_click"
        : CANONICAL_EVENTS.CTA_CLICK || "listing_cta_click";
    }
    if (eventName === EVENTS.AUDIT_RUN_RESULT) {
      return payload?.success === false
        ? CANONICAL_EVENTS.AUDIT_FAILED || "listing_audit_failed"
        : CANONICAL_EVENTS.AUDIT_PHASE_VIEW || "listing_audit_phase_view";
    }
    if (eventName === EVENTS.CREDIT_MODAL_DECISION) {
      const reason = String(payload?.reason || "");
      if (payload?.decision === "confirm" && reason.indexOf("free") >= 0) {
        return CANONICAL_EVENTS.FREE_BUNDLE_CONFIRM || "listing_free_bundle_confirm";
      }
      if (payload?.decision === "confirm") return CANONICAL_EVENTS.CREDIT_CONFIRM || "listing_credit_confirm";
      return CANONICAL_EVENTS.CREDIT_GATE_DECISION || "listing_credit_gate_decision";
    }
    if (eventName === EVENTS.SUGGESTION_DECISION) {
      const decision = String(payload?.decision || "");
      if (decision === "accept") return CANONICAL_EVENTS.FIX_ACCEPT || "listing_fix_accept";
      if (decision === "edit") return CANONICAL_EVENTS.FIX_EDIT || "listing_fix_edit";
      if (decision === "reject") return CANONICAL_EVENTS.FIX_REJECT || "listing_fix_reject";
      return CANONICAL_EVENTS.SUGGESTION_DECISION || "listing_suggestion_decision";
    }
    return EVENT_ALIASES[eventName] || toSnake(eventName);
  }

  // Backend batch ingestion reads the structured columns (report_id/thread_id/…)
  // only from snake_case keys inside event.properties. UI callers pass camelCase
  // (reportId/threadId/…) via both event payloads and setContext, so mirror those
  // to snake_case here — same shape `asin` already has at the source. Without this
  // the columns land NULL and the conversion can't be attributed to a report/thread.
  const SNAKE_ID_ALIASES = {
    reportId: "report_id",
    threadId: "thread_id",
    auditId: "audit_id",
    bundleId: "bundle_id",
    workspaceId: "workspace_id"
  };
  function mirrorSnakeIdAliases(obj) {
    if (!obj || typeof obj !== "object") return obj || {};
    const out = Object.assign({}, obj);
    for (const camel in SNAKE_ID_ALIASES) {
      const snake = SNAKE_ID_ALIASES[camel];
      if (out[camel] != null && out[camel] !== "" && out[snake] == null) {
        out[snake] = out[camel];
      }
    }
    return out;
  }

  function normalizePayload(eventName, payload) {
    const page = payload?.pageKey || payload?.page || pageKeyFromLocation();
    const dataMode = normalizeDataMode(payload?.dataMode);
    return Object.assign({
      source: "listing",
      source_app: SOURCE_APP,
      tool_id: TOOL_ID,
      page,
      dataMode,
      is_sample: dataMode === "sample",
      channel: captureRegisterChannel()
    }, mirrorSnakeIdAliases(payload || {}), {
      legacy_event_name: eventName && eventName.indexOf("LISTING_") === 0 ? eventName : null
    });
  }

  function createSdk() {
    if (!window.LuckeeAnalytics?.create) return null;
    return window.LuckeeAnalytics.create({
      appId: APP_ID,
      sourceApp: SOURCE_APP,
      toolId: TOOL_ID,
      endpoint: ENDPOINT,
      storagePrefix: config.STORAGE_PREFIX || "luckee-listing:analytics",
      debug: urlParams().get("analytics_debug") === "1"
    });
  }

  const sdk = createSdk();
  if (!sdk) {
    window.LuckeeListingTrack = {
      EVENTS,
      track: noop,
      trackPageView: noop,
      setContext: noop,
      getContext: () => ({}),
      identify: noop,
      flush: noop,
      getAnonymousId: () => "",
      getSessionId: () => "",
      getIdentity: () => ({}),
      getAttribution: () => ({}),
      getCheckoutContext: () => ({}),
      safe
    };
    return;
  }

  function track(eventName, payload, options) {
    const canonicalName = canonicalEventName(eventName, payload || {});
    if (!canonicalName) return null;
    return sdk.track(canonicalName, normalizePayload(eventName, payload || {}), options || {});
  }

  function trackPageView(pageKey, payload) {
    return track(EVENTS.PAGE_VIEW, Object.assign({
      pageKey: pageKey || pageKeyFromLocation()
    }, payload || {}), {
      immediate: true,
      behaviorType: "PAGE_VIEW"
    });
  }

  function setContext(partial) {
    const dataMode = normalizeDataMode(partial?.dataMode);
    sdk.setContext(Object.assign({
      dataMode,
      is_sample: dataMode === "sample"
    }, mirrorSnakeIdAliases(partial || {})));
  }

  function identify(user, options) {
    return sdk.identify(user || {}, options || {});
  }

  function getCheckoutContext(extra) {
    const identity = sdk.getIdentity();
    const attribution = sdk.getAttribution();
    const context = sdk.getContext();
    return Object.assign({
      source: "listing",
      source_app: SOURCE_APP,
      tool_id: TOOL_ID,
      anonymous_id: identity.anonymous_id || null,
      session_id: identity.session_id || null,
      user_id: identity.user_id || null,
      account_id: identity.account_id || null,
      auth_state: identity.auth_state || "anonymous",
      gclid: attribution.gclid || null,
      gbraid: attribution.gbraid || null,
      wbraid: attribution.wbraid || null,
      utm_source: attribution.utm_source || null,
      utm_medium: attribution.utm_medium || null,
      utm_campaign: attribution.utm_campaign || null,
      utm_content: attribution.utm_content || null,
      utm_term: attribution.utm_term || null,
      landing_url: attribution.landing_url || null,
      referrer: attribution.referrer || null,
      google_campaign_id: attribution.google_campaign_id || null,
      google_ad_group_id: attribution.google_ad_group_id || null,
      google_keyword: attribution.google_keyword || null,
      google_target_id: attribution.google_target_id || null,
      google_keyword_id: attribution.google_keyword_id || null,
      google_match_type: attribution.google_match_type || null,
      google_network: attribution.google_network || null,
      google_device: attribution.google_device || null,
      google_creative_id: attribution.google_creative_id || null,
      landing_variant: attribution.landing_variant || null,
      asin: context.asin || null,
      marketplace: context.marketplace || null,
      audit_id: context.audit_id || context.auditId || null,
      report_id: context.report_id || context.reportId || null,
      bundle_id: context.bundle_id || context.bundleId || null,
      thread_id: context.thread_id || context.threadId || null,
      is_sample: context.is_sample === true || context.dataMode === "sample"
    }, extra || {});
  }

  captureRegisterChannel();

  window.LuckeeListingTrack = {
    EVENTS,
    track,
    trackPageView,
    setContext,
    getContext: sdk.getContext,
    identify,
    flush: sdk.flush,
    getAnonymousId: sdk.getAnonymousId,
    getSessionId: sdk.getSessionId,
    getIdentity: sdk.getIdentity,
    getAttribution: sdk.getAttribution,
    getCheckoutContext,
    safe
  };
})();
