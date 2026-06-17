/* Luckee Listing Google Ads tag. */
(function () {
  const CUSTOMER_ID = "495-339-6258";
  const CONVERSION_ID = "AW-18224787700";
  const COMPLETED_LOOP_SEND_TO = "AW-18224787700/0Ga_COvjq70cEPThoPJD";
  const COMPLETED_LOOP_VALUE = 1;
  const COMPLETED_LOOP_CURRENCY = "USD";
  const SCRIPT_ID = "luckee-google-ads-tag";
  const DEBUG_PARAM = "google_ads_debug";
  const COMPLETED_LOOP_DEDUPE_KEY = "luckee-listing:google-ads:completed-loop-dedupe";
  const MAX_DEDUPE_KEYS = 100;
  const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7-day completed-loop window
  const SENSITIVE_URL_PARAMS = [
    "code", "state", "scope", "authuser", "prompt",
    "session_state", "id_token", "access_token",
    "hd", "code_challenge", "code_verifier"
  ];
  const DISABLED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
  const memoryDedupeKeys = new Set();

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

  function urlParams() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (err) {
      return new URLSearchParams();
    }
  }

  function shouldLoad() {
    const params = urlParams();
    if (params.get(DEBUG_PARAM) === "1") return true;
    return !DISABLED_HOSTS.has(window.location.hostname);
  }

  const enabled = shouldLoad();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function readLocal(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return "";
    }
  }

  function writeLocal(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {}
  }

  function cleanPart(value) {
    return String(value == null ? "" : value).trim();
  }

  function isSample(payload) {
    const params = urlParams();
    if (params.get("sample") === "1") return true;
    if (params.get("replay") === "1" || params.get("replayed") === "1" || params.get("replay_thread_id")) return true;
    return payload?.is_sample === true || payload?.isSample === true || payload?.dataMode === "sample";
  }

  function completedLoopActor(payload) {
    let identity = {};
    try {
      identity = (window.LuckeeListingTrack && window.LuckeeListingTrack.getIdentity
        && window.LuckeeListingTrack.getIdentity()) || {};
    } catch (err) {}
    return cleanPart(
      payload?.user_id || payload?.userId || identity.user_id
      || payload?.anonymous_id || payload?.anonymousId || identity.anonymous_id
    );
  }

  function completedLoopDedupeKey(payload) {
    // Canonical completed-loop identity: one Google Ads main conversion per
    // actor + ASIN + marketplace + report, regardless of which completion action
    // (accept / copy / export / download) fired it within the 7-day window.
    return [
      completedLoopActor(payload),
      payload?.asin,
      payload?.marketplace,
      payload?.report_id || payload?.reportId
    ].map(cleanPart).join("|");
  }

  function hashString(value) {
    const text = String(value || "");
    let hash = 5381;
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function readDedupeEntries() {
    const stored = safeJsonParse(readLocal(COMPLETED_LOOP_DEDUPE_KEY), []);
    if (!Array.isArray(stored)) return [];
    const now = Date.now();
    return stored.filter(item =>
      item && item.k && typeof item.t === "number" && (now - item.t) < DEDUPE_WINDOW_MS
    );
  }

  function hasDedupeKey(key) {
    if (memoryDedupeKeys.has(key)) return true;
    return readDedupeEntries().some(item => item.k === key);
  }

  function rememberDedupeKey(key) {
    if (!key) return;
    memoryDedupeKeys.add(key);
    const next = [{ k: key, t: Date.now() }]
      .concat(readDedupeEntries().filter(item => item.k !== key))
      .slice(0, MAX_DEDUPE_KEYS);
    writeLocal(COMPLETED_LOOP_DEDUPE_KEY, JSON.stringify(next));
  }

  function buildCompletedLoopTransactionId(payload, options) {
    const explicit = options?.transaction_id || options?.transactionId || payload?.transaction_id || payload?.transactionId;
    if (explicit) return cleanPart(explicit);
    return `listing_completed_loop_${hashString(options?.dedupeKey || completedLoopDedupeKey(payload || {}))}`;
  }

  function trackCompletedLoopConversion(payload, options) {
    const rawPayload = payload || {};
    const opts = options || {};
    if (isSample(rawPayload)) return { ok: false, reason: "sample" };

    const dedupeKey = cleanPart(opts.dedupeKey || completedLoopDedupeKey(rawPayload));
    if (!dedupeKey) return { ok: false, reason: "missing_dedupe_key" };
    if (hasDedupeKey(dedupeKey)) {
      return {
        ok: false,
        reason: "duplicate",
        transaction_id: buildCompletedLoopTransactionId(rawPayload, { dedupeKey })
      };
    }

    const params = {
      send_to: COMPLETED_LOOP_SEND_TO,
      value: COMPLETED_LOOP_VALUE,
      currency: COMPLETED_LOOP_CURRENCY,
      transaction_id: buildCompletedLoopTransactionId(rawPayload, { dedupeKey })
    };

    try {
      window.gtag("event", "conversion", params);
      rememberDedupeKey(dedupeKey);
      window.LuckeeGoogleAds.lastCompletedLoopConversion = {
        sent: enabled,
        queued_only: !enabled,
        params,
        dedupe_key: dedupeKey,
        tracked_at: new Date().toISOString()
      };
      return {
        ok: true,
        sent: enabled,
        queued_only: !enabled,
        transaction_id: params.transaction_id
      };
    } catch (err) {
      return { ok: false, reason: "gtag_error" };
    }
  }

  window.LuckeeGoogleAds = {
    customerId: CUSTOMER_ID,
    conversionId: CONVERSION_ID,
    completedLoopSendTo: COMPLETED_LOOP_SEND_TO,
    completedLoopValue: COMPLETED_LOOP_VALUE,
    completedLoopCurrency: COMPLETED_LOOP_CURRENCY,
    enhancedConversions: false,
    enabled,
    mode: "base_tag_and_completed_loop_conversion",
    buildCompletedLoopTransactionId,
    trackCompletedLoopConversion
  };

  if (!enabled) return;

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONVERSION_ID)}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", CONVERSION_ID, {
    page_location: sanitizeUrl(window.location.href),
    page_referrer: sanitizeUrl(document.referrer)
  });
})();
