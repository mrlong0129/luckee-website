/* Luckee Analytics SDK v1. Framework-free client for small-tool funnels. */
(function () {
  const sharedConfig = window.LuckeeAnalyticsConfig || {};
  const DEFAULTS = {
    appId: sharedConfig.APP_ID || "luckee-listing",
    sourceApp: sharedConfig.SOURCE_APP || "listing-optimizer",
    toolId: sharedConfig.TOOL_ID || "listing-optimizer",
    endpoint: "luckee/user/web/analytics/events/batch.do",
    schemaVersion: "analytics_v1",
    sdkVersion: "1.0.0",
    storagePrefix: "luckee-analytics",
    flushDebounceMs: 2000,
    flushIntervalMs: 60000,
    maxBatchSize: 20,
    sessionTimeoutMs: 30 * 60 * 1000,
    maxQueueSize: 200,
    maxStringLength: 500,
    maxArrayLength: 30,
    maxDepth: 5,
    debug: false,
    defaultAuthEventName: sharedConfig.DEFAULT_AUTH_EVENT_NAME || "listing_auth_complete",
    userStorageKeys: sharedConfig.USER_STORAGE_KEYS || ["luckee-listing:user", "user"]
  };

  const SENSITIVE_KEY_RE = /(password|passwd|pwd|token|authorization|secret|credential|cookie|listingInput|pastedListing|aplusCopy|filePath|file_path|screenshotPath|screenshotContent|attachmentPath|attachmentUrl|rawContent|stack)/i;
  const ATTRIBUTION_KEYS = sharedConfig.ATTRIBUTION_KEYS || [
    "gclid",
    "gbraid",
    "wbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "google_campaign_id",
    "google_ad_group_id",
    "google_keyword",
    "google_target_id",
    "google_match_type",
    "google_network",
    "google_device",
    "google_creative_id",
    "google_keyword_id",
    "landing_variant"
  ];
  const TOP_LEVEL_KEYS = sharedConfig.TOP_LEVEL_KEYS || [
    "asin",
    "marketplace",
    "audit_id",
    "auditId",
    "report_id",
    "reportId",
    "bundle_id",
    "bundleId",
    "thread_id",
    "threadId",
    "workspace_id",
    "workspaceId",
    "subscription_id",
    "subscriptionId",
    "checkout_session_id",
    "checkoutSessionId",
    "order_id",
    "orderId",
    "conversion_value",
    "conversionValue",
    "currency",
    "plan_id",
    "planId",
    "plan_price",
    "planPrice",
    "purchase_type",
    "purchaseType",
    "checkout_type",
    "checkoutType",
    "product_type",
    "productType",
    "billing_type",
    "billingType",
    "pack_id",
    "packId",
    "stripe_price_id",
    "stripePriceId",
    "is_sample",
    "isSample",
    "dataMode"
  ];

  function createAnalyticsSdk(config) {
    const cfg = Object.assign({}, DEFAULTS, config || {});
    const keys = {
      anonymousId: `${cfg.storagePrefix}:anonymous-id`,
      session: `${cfg.storagePrefix}:session`,
      firstTouch: `${cfg.storagePrefix}:first-touch`,
      lastTouch: `${cfg.storagePrefix}:last-touch`,
      context: `${cfg.storagePrefix}:context`,
      queue: `${cfg.storagePrefix}:queue`
    };
    let memoryQueue = [];
    let debounceTimer = 0;
    let flushPromise = null;
    let flushAfterCurrent = false;

    function padTimePart(value) {
      return String(value).padStart(2, "0");
    }

    function formatEventTime(input) {
      const date = input instanceof Date ? input : new Date(input == null ? Date.now() : input);
      if (Number.isNaN(date.getTime())) return "1970-01-01 00:00:00";
      return [
        date.getFullYear(),
        padTimePart(date.getMonth() + 1),
        padTimePart(date.getDate())
      ].join("-") + " " + [
        padTimePart(date.getHours()),
        padTimePart(date.getMinutes()),
        padTimePart(date.getSeconds())
      ].join(":");
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function safeJsonParse(value, fallback) {
      try {
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    }

    function readStorage(store, key) {
      try {
        return store.getItem(key);
      } catch (err) {
        return "";
      }
    }

    function writeStorage(store, key, value) {
      try {
        store.setItem(key, value);
      } catch (err) {}
    }

    function removeStorage(store, key) {
      try {
        store.removeItem(key);
      } catch (err) {}
    }

    function readLocal(key) {
      return readStorage(window.localStorage, key);
    }

    function writeLocal(key, value) {
      writeStorage(window.localStorage, key, value);
    }

    function readSessionStore(key) {
      return readStorage(window.sessionStorage, key);
    }

    function writeSessionStore(key, value) {
      writeStorage(window.sessionStorage, key, value);
    }

    function readCookie(name) {
      try {
        const prefix = `${encodeURIComponent(name)}=`;
        const cookie = String(document.cookie || "")
          .split(";")
          .map(item => item.trim())
          .find(item => item.startsWith(prefix));
        return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
      } catch (err) {
        return "";
      }
    }

    function createId(prefix) {
      if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
      return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    }

    function urlParams() {
      try {
        return new URLSearchParams(window.location.search || "");
      } catch (err) {
        return new URLSearchParams();
      }
    }

    // OAuth / auth-callback params must never reach analytics events, the Manage
    // detail view, or any third-party (GTM / Google Ads) URL/referrer chain.
    const SENSITIVE_URL_PARAMS = [
      "code", "state", "scope", "authuser", "prompt",
      "session_state", "id_token", "access_token",
      "hd", "code_challenge", "code_verifier"
    ];

    function sanitizeSearch(search) {
      try {
        const params = new URLSearchParams(search || "");
        let changed = false;
        SENSITIVE_URL_PARAMS.forEach(key => {
          if (params.has(key)) { params.delete(key); changed = true; }
        });
        if (!changed) return search || "";
        const next = params.toString();
        return next ? `?${next}` : "";
      } catch (err) {
        return search || "";
      }
    }

    function sanitizeUrl(value) {
      if (!value) return value || "";
      try {
        const url = new URL(String(value), window.location.origin);
        SENSITIVE_URL_PARAMS.forEach(key => url.searchParams.delete(key));
        return url.toString();
      } catch (err) {
        return value;
      }
    }

    function normalizePath() {
      return window.location.pathname || "/";
    }

    function pageUrl() {
      const origin = window.location.origin || '';
      const path = (window.location.pathname || '/').replace(/\/{2,}/g, '/');
      return `${origin}${path}${sanitizeSearch(window.location.search)}${window.location.hash}`;
    }

    function environment() {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return "local";
      if (/test|staging|dev/i.test(host)) return "staging";
      return "prod";
    }

    function compactString(value) {
      const text = String(value == null ? "" : value);
      return text.length > cfg.maxStringLength ? `${text.slice(0, cfg.maxStringLength)}...` : text;
    }

    function sanitize(value, depth) {
      if (value == null) return null;
      if (depth > cfg.maxDepth) return null;
      if (typeof value === "string") return compactString(value);
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (typeof value === "boolean") return value;
      if (value instanceof Date) return value.toISOString();
      if (Array.isArray(value)) {
        return value
          .slice(0, cfg.maxArrayLength)
          .map(item => sanitize(item, depth + 1))
          .filter(item => item !== undefined);
      }
      if (typeof value === "object") {
        const out = {};
        Object.keys(value).forEach(key => {
          if (SENSITIVE_KEY_RE.test(key)) return;
          const next = sanitize(value[key], depth + 1);
          if (next !== undefined) out[key] = next;
        });
        return out;
      }
      return null;
    }

    function cleanObject(value) {
      const input = sanitize(value || {}, 0) || {};
      const out = {};
      Object.keys(input).forEach(key => {
        const item = input[key];
        if (item !== undefined) out[key] = item;
      });
      return out;
    }

    function getParam(params, snake, camel) {
      return getParamAny(params, snake, camel || snake);
    }

    function getParamAny(params) {
      for (let index = 1; index < arguments.length; index += 1) {
        const name = arguments[index];
        if (!name) continue;
        const value = params.get(name);
        if (value) return value;
      }
      return "";
    }

    function paramsFromUrl(value) {
      try {
        const url = new URL(String(value || ""), window.location.origin);
        return url.searchParams;
      } catch (err) {
        return new URLSearchParams();
      }
    }

    function readGoogleAdsAttribution(params) {
      const googleTargetId = getParamAny(
        params,
        "google_target_id",
        "googleTargetId",
        "target_id",
        "targetId",
        "targetid",
        "criterion_id",
        "criterionId",
        "criterionid"
      );
      return {
        google_campaign_id: getParamAny(
          params,
          "google_campaign_id",
          "googleCampaignId",
          "campaign_id",
          "campaignId",
          "campaignid"
        ),
        google_ad_group_id: getParamAny(
          params,
          "google_ad_group_id",
          "googleAdGroupId",
          "ad_group_id",
          "adGroupId",
          "adgroupid"
        ),
        google_keyword: getParamAny(params, "google_keyword", "googleKeyword", "keyword"),
        google_target_id: googleTargetId,
        google_keyword_id: getParamAny(
          params,
          "google_keyword_id",
          "googleKeywordId",
          "keyword_id",
          "keywordId",
          "keywordid",
          "targetid",
          "target_id",
          "targetId",
          "criterionid",
          "criterion_id",
          "criterionId"
        ) || googleTargetId,
        google_match_type: getParamAny(params, "google_match_type", "googleMatchType", "match_type", "matchType", "matchtype"),
        google_network: getParamAny(params, "google_network", "googleNetwork", "network"),
        google_device: getParamAny(params, "google_device", "googleDevice", "device"),
        google_creative_id: getParamAny(params, "google_creative_id", "googleCreativeId", "creative_id", "creativeId", "creative")
      };
    }

    function normalizeAttributionTouch(value) {
      const touch = Object.assign({}, value || {});
      const fromCurrentUrl = readGoogleAdsAttribution(urlParams());
      const fromLandingUrl = readGoogleAdsAttribution(paramsFromUrl(touch.landing_url || touch.url || ""));
      Object.keys(fromLandingUrl).forEach(key => {
        if (!touch[key] && fromLandingUrl[key]) touch[key] = fromLandingUrl[key];
      });
      Object.keys(fromCurrentUrl).forEach(key => {
        if (!touch[key] && fromCurrentUrl[key]) touch[key] = fromCurrentUrl[key];
      });
      return touch;
    }

    function captureAttribution() {
      const params = urlParams();
      const googleAdsAttribution = readGoogleAdsAttribution(params);
      const touch = {
        gclid: getParam(params, "gclid"),
        gbraid: getParam(params, "gbraid"),
        wbraid: getParam(params, "wbraid"),
        utm_source: getParam(params, "utm_source", "utmSource"),
        utm_medium: getParam(params, "utm_medium", "utmMedium"),
        utm_campaign: getParam(params, "utm_campaign", "utmCampaign"),
        utm_content: getParam(params, "utm_content", "utmContent"),
        utm_term: getParam(params, "utm_term", "utmTerm"),
        google_campaign_id: googleAdsAttribution.google_campaign_id,
        google_ad_group_id: googleAdsAttribution.google_ad_group_id,
        google_keyword: googleAdsAttribution.google_keyword,
        google_target_id: googleAdsAttribution.google_target_id,
        google_keyword_id: googleAdsAttribution.google_keyword_id,
        google_match_type: googleAdsAttribution.google_match_type,
        google_network: googleAdsAttribution.google_network,
        google_device: googleAdsAttribution.google_device,
        google_creative_id: googleAdsAttribution.google_creative_id,
        landing_variant: getParam(params, "landing_variant", "landingVariant"),
        landing_url: pageUrl(),
        referrer: sanitizeUrl(document.referrer || ""),
        captured_at: nowIso()
      };
      const existingFirstRaw = safeJsonParse(readLocal(keys.firstTouch), null);
      const existingFirst = existingFirstRaw ? normalizeAttributionTouch(existingFirstRaw) : null;
      const hasAttribution = ATTRIBUTION_KEYS.some(key => touch[key]);
      if (existingFirst && JSON.stringify(existingFirst) !== JSON.stringify(existingFirstRaw)) {
        writeLocal(keys.firstTouch, JSON.stringify(existingFirst));
      }
      if (!existingFirst || hasAttribution) writeLocal(keys.firstTouch, JSON.stringify(touch));
      if (hasAttribution) writeSessionStore(keys.lastTouch, JSON.stringify(touch));
      return {
        first: !existingFirst || hasAttribution ? touch : existingFirst,
        last: normalizeAttributionTouch(safeJsonParse(readSessionStore(keys.lastTouch), null) || (hasAttribution ? touch : null))
      };
    }

    function getAttribution() {
      const captured = captureAttribution();
      const first = captured.first || {};
      const last = captured.last || first || {};
      const result = {};
      ATTRIBUTION_KEYS.forEach(key => {
        result[key] = last[key] || first[key] || null;
      });
      result.landing_url = first.landing_url || last.landing_url || pageUrl();
      result.referrer = first.referrer || last.referrer || sanitizeUrl(document.referrer) || null;
      result.first_touch_at = first.captured_at || null;
      result.last_touch_at = last.captured_at || null;
      return result;
    }

    function getAnonymousId() {
      const cookieId = readCookie("anonymous_id");
      if (cookieId) {
        writeLocal("anonymous_id", cookieId);
        writeLocal(keys.anonymousId, cookieId);
        return cookieId;
      }
      const sharedId = readLocal("anonymous_id");
      if (sharedId) {
        writeLocal(keys.anonymousId, sharedId);
        return sharedId;
      }
      const localId = readLocal(keys.anonymousId);
      if (localId) {
        writeLocal("anonymous_id", localId);
        return localId;
      }
      const nextId = createId("anon");
      writeLocal("anonymous_id", nextId);
      writeLocal(keys.anonymousId, nextId);
      return nextId;
    }

    function ensureSessionId() {
      const state = safeJsonParse(readSessionStore(keys.session), null);
      const now = Date.now();
      if (state?.session_id && now - Number(state.last_activity_at || 0) <= cfg.sessionTimeoutMs) {
        writeSessionStore(keys.session, JSON.stringify({ session_id: state.session_id, last_activity_at: now }));
        return state.session_id;
      }
      const sessionId = createId("sess");
      writeSessionStore(keys.session, JSON.stringify({ session_id: sessionId, last_activity_at: now }));
      return sessionId;
    }

    function readContext() {
      return safeJsonParse(readSessionStore(keys.context), {}) || {};
    }

    function writeContext(next) {
      writeSessionStore(keys.context, JSON.stringify(cleanObject(next || {})));
    }

    function setContext(partial) {
      const current = readContext();
      writeContext(Object.assign({}, current, cleanObject(partial || {})));
    }

    function readSessionUser() {
      try {
        if (window.LuckeeAuth?.getSession) return window.LuckeeAuth.getSession() || {};
      } catch (err) {}
      const storageKeys = Array.isArray(cfg.userStorageKeys) && cfg.userStorageKeys.length
        ? cfg.userStorageKeys
        : DEFAULTS.userStorageKeys;
      for (let index = 0; index < storageKeys.length; index += 1) {
        const user = safeJsonParse(readLocal(storageKeys[index]), null);
        if (user) return user;
      }
      return {};
    }

    function getIdentity() {
      const context = readContext();
      const session = readSessionUser();
      const userInfo = session?.userInfo || session || {};
      const token = session?.loginToken || userInfo.loginToken || "";
      const userId = context.user_id || context.userId || userInfo.id || userInfo.userId || null;
      const accountId = context.account_id || context.accountId || userInfo.accountId || userInfo.account_id || userInfo.account?.id || null;
      return {
        anonymous_id: getAnonymousId(),
        session_id: ensureSessionId(),
        user_id: userId || null,
        account_id: accountId || null,
        auth_state: token || userId ? "authenticated" : "anonymous",
        login_token: token || ""
      };
    }

    function loadRuntimeConfig() {
      if (window.appInfo?.services) return Promise.resolve();
      if (window.__luckeeRuntimeConfigPromise) return window.__luckeeRuntimeConfigPromise;
      window.__luckeeRuntimeConfigPromise = new Promise(resolve => {
        const existing = document.querySelector('script[data-luckee-runtime-config="1"], script[src^="/config.js"]');
        if (existing) {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", resolve, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.setAttribute("data-luckee-runtime-config", "1");
        script.src = `/config.js?v=${Date.now()}`;
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
      });
      return window.__luckeeRuntimeConfigPromise;
    }

    function buildUrl(path) {
      const cleanPath = String(path || "").replace(/^\/+/, "");
      const localHosts = ["localhost", "127.0.0.1", "::1"];
      if (localHosts.includes(window.location.hostname)) return `/${cleanPath}`;
      const domain = window.appInfo?.services?.USER_API_DOMAIN;
      return domain ? `${String(domain).replace(/\/+$/, "")}/${cleanPath}` : `/${cleanPath}`;
    }

    function headers(identity) {
      const base = {
        "Content-Type": "application/json",
        "USER_LANGUAGE": "EN",
        "X-Anonymous-ID": identity.anonymous_id
      };
      if (identity.login_token) {
        base["Luckee-Authorization"] = identity.login_token;
        base["x-user-token"] = identity.login_token;
      }
      if (identity.user_id) base["X-User-ID"] = identity.user_id;
      return base;
    }

    function retryableBatchItem(item) {
      const status = String(item?.status || item?.parse_status || "").toLowerCase();
      const errorCode = String(item?.error_code || item?.errorCode || "").toLowerCase();
      const message = String(item?.message || item?.error_message || item?.errorMessage || "").toLowerCase();
      if (!status && !errorCode) return false;
      if (status === "retry" || status === "retryable" || status === "transient") return true;
      if (status === "accepted" || status === "success" || status === "duplicate" || status === "invalid") return false;
      if (status !== "failed" && status !== "error") return false;
      return /(timeout|tempor|transient|retry|rate|limit|throttl|server|unavailable|5\d\d)/i.test(`${errorCode} ${message}`);
    }

    function batchResultItems(result) {
      if (Array.isArray(result?.items)) return result.items;
      if (Array.isArray(result?.data)) return result.data;
      return [];
    }

    function retryableEventsFromBatchResult(events, result) {
      const items = batchResultItems(result);
      if (!items.length) return [];
      const eventsById = new Map(events.map(event => [event.event_id, event]));
      return items
        .filter(retryableBatchItem)
        .map(item => eventsById.get(item.event_id || item.eventId))
        .filter(Boolean);
    }

    function pickTopLevel(raw) {
      const top = {};
      TOP_LEVEL_KEYS.forEach(key => {
        if (raw[key] === undefined || raw[key] === null || raw[key] === "") return;
        const normalized = key
          .replace(/[A-Z]/g, char => `_${char.toLowerCase()}`)
          .replace(/^is_sample$/, "is_sample");
        top[normalized] = raw[key];
      });
      if (raw.dataMode) top.is_sample = raw.dataMode === "sample" || raw.isSample === true || raw.is_sample === true;
      if (top.bundle_id && !top.workspace_id) top.workspace_id = top.bundle_id;
      return cleanObject(top);
    }

    function splitMetrics(raw) {
      const metrics = Object.assign({}, raw.metrics || {});
      Object.keys(raw || {}).forEach(key => {
        const value = raw[key];
        if (typeof value === "number" && Number.isFinite(value)) metrics[key] = value;
      });
      return cleanObject(metrics);
    }

    function buildEvent(eventName, properties, options) {
      const raw = cleanObject(properties || {});
      const context = readContext();
      const merged = cleanObject(Object.assign({}, context, raw));
      const identity = getIdentity();
      const attribution = getAttribution();
      const topLevel = pickTopLevel(merged);
      const eventProperties = cleanObject(merged);
      const metrics = splitMetrics(merged);
      const eventId = options?.event_id || options?.eventId || raw.event_id || raw.eventId || createId("evt");
      const event = Object.assign({
        schema_version: cfg.schemaVersion,
        sdk_version: cfg.sdkVersion,
        event_id: eventId,
        event_name: eventName,
        event_time: options?.event_time || options?.eventTime || formatEventTime(),
        environment: cfg.environment || environment(),
        app_id: cfg.appId,
        source_app: cfg.sourceApp,
        tool_id: cfg.toolId,
        page_url: pageUrl(),
        page_path: normalizePath(),
        anonymous_id: identity.anonymous_id,
        session_id: identity.session_id,
        user_id: identity.user_id,
        account_id: identity.account_id,
        auth_state: identity.auth_state,
        gclid: attribution.gclid,
        gbraid: attribution.gbraid,
        wbraid: attribution.wbraid,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        landing_url: attribution.landing_url,
        referrer: attribution.referrer,
        google_campaign_id: attribution.google_campaign_id,
        google_ad_group_id: attribution.google_ad_group_id,
        google_keyword: attribution.google_keyword,
        google_target_id: attribution.google_target_id,
        google_keyword_id: attribution.google_keyword_id,
        google_match_type: attribution.google_match_type,
        google_network: attribution.google_network,
        google_device: attribution.google_device,
        google_creative_id: attribution.google_creative_id,
        landing_variant: attribution.landing_variant,
        asin: topLevel.asin || null,
        marketplace: topLevel.marketplace || null,
        audit_id: topLevel.audit_id || null,
        report_id: topLevel.report_id || null,
        bundle_id: topLevel.bundle_id || null,
        thread_id: topLevel.thread_id || null,
        workspace_id: topLevel.workspace_id || null,
        subscription_id: topLevel.subscription_id || null,
        checkout_session_id: topLevel.checkout_session_id || null,
        order_id: topLevel.order_id || null,
        conversion_value: topLevel.conversion_value || null,
        currency: topLevel.currency || null,
        plan_id: topLevel.plan_id || null,
        plan_price: topLevel.plan_price || null,
        purchase_type: topLevel.purchase_type || null,
        checkout_type: topLevel.checkout_type || null,
        product_type: topLevel.product_type || null,
        billing_type: topLevel.billing_type || null,
        pack_id: topLevel.pack_id || null,
        stripe_price_id: topLevel.stripe_price_id || null,
        is_sample: topLevel.is_sample === true,
        properties: eventProperties,
        metrics
      }, options?.extraTopLevel || {});
      return cleanObject(event);
    }

    function attributionPayload(event) {
      const out = {};
      ATTRIBUTION_KEYS.forEach(key => {
        out[key] = event[key] || null;
      });
      out.landing_url = event.landing_url || null;
      out.referrer = event.referrer || null;
      return cleanObject(out);
    }

    function backendEventPayload(event) {
      const attribution = attributionPayload(event);
      const context = cleanObject(Object.assign({}, event.context || {}, {
        schema_version: event.schema_version,
        app_id: event.app_id,
        tool_id: event.tool_id,
        environment: event.environment,
        auth_state: event.auth_state,
        page_url: event.page_url,
        page_path: event.page_path,
        is_sample: event.is_sample,
        metrics: event.metrics || {}
      }));
      return cleanObject(Object.assign({}, event, {
        page: event.page || event.properties?.page || event.page_path || null,
        url: event.page_url || null,
        attribution,
        context
      }));
    }

    function queueEvent(event) {
      memoryQueue.push(event);
      if (memoryQueue.length > cfg.maxQueueSize) memoryQueue = memoryQueue.slice(-cfg.maxQueueSize);
      persistQueue();
    }

    function readQueue() {
      if (memoryQueue.length) return memoryQueue;
      memoryQueue = safeJsonParse(readLocal(keys.queue), []) || [];
      return memoryQueue;
    }

    function persistQueue() {
      writeLocal(keys.queue, JSON.stringify(memoryQueue.slice(-cfg.maxQueueSize)));
    }

    function clearQueue() {
      memoryQueue = [];
      removeStorage(window.localStorage, keys.queue);
    }

    async function postBatch(events, options) {
      await loadRuntimeConfig();
      const identity = getIdentity();
      const body = {
        schema_version: cfg.schemaVersion,
        sdk_version: cfg.sdkVersion,
        source_app: cfg.sourceApp,
        tool_id: cfg.toolId,
        sent_at: nowIso(),
        events: events.map(backendEventPayload)
      };
      return fetch(buildUrl(cfg.endpoint), {
        method: "POST",
        headers: headers(identity),
        body: JSON.stringify(body),
        keepalive: !!options?.keepalive
      });
    }

    function flush(options) {
      try {
        if (flushPromise) {
          flushAfterCurrent = true;
          return flushPromise;
        }
        const queue = readQueue();
        if (!queue.length) return Promise.resolve({ skipped: true });
        const events = queue.splice(0, cfg.maxBatchSize);
        persistQueue();
        flushAfterCurrent = false;
        let delivered = false;
        let retryEvents = [];
        flushPromise = postBatch(events, options)
          .then(async response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            delivered = true;
            const result = await response.json().catch(() => null);
            retryEvents = retryableEventsFromBatchResult(events, result);
            if (retryEvents.length) {
              memoryQueue = retryEvents.concat(readQueue()).slice(0, cfg.maxQueueSize);
              persistQueue();
            }
            return {
              ok: true,
              sent: events.length - retryEvents.length,
              retry: retryEvents.length,
              result
            };
          })
          .catch(error => {
            memoryQueue = events.concat(readQueue()).slice(0, cfg.maxQueueSize);
            persistQueue();
            if (cfg.debug) console.warn("[LuckeeAnalyticsSDK] flush failed", error);
            return { ok: false, error };
          })
          .finally(() => {
            const hasMore = readQueue().length > 0;
            const shouldContinue = hasMore && (delivered || flushAfterCurrent);
            const nextDelay = delivered && !retryEvents.length ? 0 : cfg.flushDebounceMs;
            flushPromise = null;
            flushAfterCurrent = false;
            if (shouldContinue) scheduleFlush(nextDelay);
          });
        return flushPromise;
      } catch (err) {
        if (cfg.debug) console.warn("[LuckeeAnalyticsSDK] flush error", err);
        return Promise.resolve({ ok: false, error: err });
      }
    }

    function scheduleFlush(delay) {
      if (debounceTimer) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = 0;
        flush();
      }, typeof delay === "number" ? delay : cfg.flushDebounceMs);
    }

    function track(eventName, properties, options) {
      try {
        if (!eventName || typeof eventName !== "string") return null;
        const event = buildEvent(eventName, properties, options || {});
        queueEvent(event);
        if (options?.immediate || readQueue().length >= cfg.maxBatchSize) flush(options);
        else scheduleFlush();
        return event.event_id;
      } catch (err) {
        if (cfg.debug) console.warn("[LuckeeAnalyticsSDK] track failed", err);
        return null;
      }
    }

    function trackPageView(pageName, properties, options) {
      return track(`${cfg.toolId.replace(/-/g, "_")}_page_view`, Object.assign({
        page: pageName || null
      }, properties || {}), Object.assign({ behaviorType: "PAGE_VIEW" }, options || {}));
    }

    function identify(user, options) {
      const userInfo = user?.userInfo || user || {};
      const userId = userInfo.id || userInfo.userId || userInfo.user_id || "";
      const accountId = userInfo.accountId || userInfo.account_id || userInfo.account?.id || "";
      setContext({
        user_id: userId || null,
        account_id: accountId || null,
        auth_method: options?.auth_method || options?.authMethod || null
      });
      return track(cfg.defaultAuthEventName, {
        user_id: userId || null,
        account_id: accountId || null,
        auth_method: options?.auth_method || options?.authMethod || "unknown"
      }, {
        immediate: true,
        keepalive: options?.keepalive === true
      });
    }

    captureAttribution();
    readQueue();
    window.setInterval(() => flush(), cfg.flushIntervalMs);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush({ keepalive: true });
    });
    window.addEventListener("pagehide", () => flush({ keepalive: true }));

    return {
      config: cfg,
      track,
      trackPageView,
      identify,
      setContext,
      getContext: readContext,
      getAnonymousId,
      getSessionId: ensureSessionId,
      getIdentity,
      getAttribution,
      flush,
      buildEvent,
      clearQueue,
      sanitize: cleanObject
    };
  }

  window.LuckeeAnalytics = window.LuckeeAnalytics || {};
  window.LuckeeAnalytics.create = createAnalyticsSdk;
})();
