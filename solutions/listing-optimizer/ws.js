/* Luckee Listing WS runner. Sends listing diagnosis queries and logs the message stream. */
(function () {
  const USER_STORAGE_KEY = "luckee-listing:user";
  const LEGACY_USER_STORAGE_KEY = "user";
  const LANGUAGE_STORAGE_KEY = "luckee-listing:ad-zh";
  const LEGACY_LANGUAGE_STORAGE_KEY = "ad-zh";
  const LISTING_DIAGNOSIS_SKILL = "listing-diagnosis-orchestrator";
  const LISTING_TOOL_NAME = "luckee-listing";

  function readJsonStorage(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "{}") || {};
    } catch (err) {
      return {};
    }
  }

  function readLanguagePreference() {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
      || window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)
      || "";
  }

  function readSession() {
    const session = readJsonStorage(USER_STORAGE_KEY);
    const fallbackSession = session && Object.keys(session).length ? session : readJsonStorage(LEGACY_USER_STORAGE_KEY);
    const loginToken = session.loginToken || session.userInfo?.loginToken || "";
    const effectiveSession = session && Object.keys(session).length ? session : fallbackSession;
    const effectiveToken = effectiveSession.loginToken || effectiveSession.userInfo?.loginToken || "";
    const userId = effectiveSession.userInfo?.id || effectiveSession.userInfo?.userId || "";
    const userInfo = Object.assign({}, effectiveSession.userInfo || {}, {
      id: userId,
      loginToken: effectiveToken
    });
    return Object.assign({}, effectiveSession, { loginToken: effectiveToken, userInfo });
  }

  function loadRuntimeConfig() {
    if (window.appInfo?.services) return Promise.resolve();
    if (window.__luckeeRuntimeConfigPromise) return window.__luckeeRuntimeConfigPromise;
    window.__luckeeRuntimeConfigPromise = new Promise((resolve) => {
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

  function cleanDomain(value) {
    return String(value || "").replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "").replace(/\/+$/, "");
  }

  function wsProtocolFor(value) {
    const raw = String(value || "");
    if (raw.startsWith("wss://")) return "wss";
    if (raw.startsWith("ws://")) return "ws";
    if (raw.startsWith("https://")) return "wss";
    if (raw.startsWith("http://")) return "ws";
    return window.location.protocol === "https:" ? "wss" : "ws";
  }

  function domainsAreSame(base, enhanced) {
    return !!(base && enhanced && cleanDomain(base) === cleanDomain(enhanced));
  }

  function isLocalHost() {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  function createThreadId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `luckee-listing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function isAmazonUrl(value) {
    try {
      const url = new URL(value);
      return /(^|\.)amazon\./i.test(url.hostname);
    } catch (err) {
      return false;
    }
  }

  function compactList(value) {
    if (Array.isArray(value)) return value.map(item => String(item || "").trim()).filter(Boolean);
    return String(value || "")
      .split(/\n|,|，|;/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function buildAdvancedContext(payload) {
    const advanced = payload?.advancedOptions || {};
    const lines = [];
    const marketplaceLabel = String(payload?.marketplaceLabel || payload?.marketplace || "").trim();
    const category = String(advanced.category || "").trim();
    const audience = String(advanced.audience || "").trim();
    const focusQuestions = compactList(advanced.focusQuestions);
    const competitors = compactList(advanced.competitorAsins);
    const keywords = compactList(advanced.keywords);

    if (marketplaceLabel) lines.push(`- Marketplace: ${marketplaceLabel}`);
    if (category) lines.push(`- Category: ${category}`);
    if (audience) lines.push(`- Target audience: ${audience}`);
    if (focusQuestions.length) {
      lines.push("- Focus questions:");
      focusQuestions.forEach((question, index) => {
        lines.push(`  ${index + 1}. ${question}`);
      });
    }
    if (competitors.length) lines.push(`- Competitor ASINs: ${competitors.join(", ")}`);
    if (keywords.length) lines.push(`- Keywords: ${keywords.join(", ")}`);

    return lines.length ? `\n\n补充诊断要求：\n${lines.join("\n")}` : "";
  }

  function buildPastedListingContext(payload) {
    const pasted = payload?.pastedListing || {};
    const lines = [];
    const title = String(pasted.title || "").trim();
    const bullets = compactList(pasted.bullets);
    const description = String(pasted.description || "").trim();
    const aplusCopy = String(pasted.aplusCopy || "").trim();

    if (title) lines.push(`Title:\n${title}`);
    if (bullets.length) lines.push(`Bullet points:\n${bullets.map((item, index) => `${index + 1}. ${item}`).join("\n")}`);
    if (description) lines.push(`Description:\n${description}`);
    if (aplusCopy) lines.push(`A+ copy:\n${aplusCopy}`);
    if (Array.isArray(payload?.attachments) && payload.attachments.length) {
      lines.push("A+ screenshots: 已上传为附件，请结合附件图片诊断 A+ 内容。");
    }

    return lines.join("\n\n");
  }

  function buildListingDiagnosisQuery(payload) {
    if (payload?.sourceType === "pasted_listing") {
      const listingContext = buildPastedListingContext(payload);
      if (!listingContext) throw new Error("Pasted listing content is required.");
      return `必须使用${LISTING_DIAGNOSIS_SKILL}这个SKILL 帮我诊断下面这份Amazon listing内容。\n\n${listingContext}${buildAdvancedContext(payload)}`;
    }

    const input = String(payload?.listingInput || payload?.asin || "").trim();
    if (!input) throw new Error("ASIN or product URL is required.");
    const advancedContext = buildAdvancedContext(payload);
    if (isAmazonUrl(input)) {
      return `必须使用${LISTING_DIAGNOSIS_SKILL}这个SKILL 帮我诊断一下${input}这个产品${advancedContext}`;
    }
    return `必须使用${LISTING_DIAGNOSIS_SKILL}这个SKILL 帮我诊断一下${input}这个ASIN${advancedContext}`;
  }

  function buildWsUrl({ userId, token, threadId, isReconnect }) {
    const services = window.appInfo?.services || {};
    const features = window.appInfo?.features || {};
    const useEnhanced = features.AGENT_ENHANCED_MODE === true;
    const baseDomain = services.AGENT_WS_DOMAIN || services.ADS_API_DOMAIN;
    const enhancedDomain = services.AGENT_WS_DOMAIN_ENHANCED || services.AGENT_WS_DOMAIN || services.ADS_API_DOMAIN;
    const rawDomain = useEnhanced ? enhancedDomain : baseDomain;
    const domain = cleanDomain(rawDomain);
    if (!domain) throw new Error("AGENT_WS_DOMAIN is missing in /config.js");

    const useEnhancedPath = useEnhanced || domainsAreSame(baseDomain, enhancedDomain);
    const params = new URLSearchParams({
      thread_id: threadId,
      User_language: readLanguagePreference() === "zh" ? "EN" : "CN",
      userToken: token,
      is_reconnect: isReconnect ? "1" : "0"
    });
    const path = useEnhancedPath
      ? `/api/v2/agent/ws/${encodeURIComponent(userId)}?${params.toString()}`
      : `/api/v2/agent/ws/v3?${params.toString()}`;
    if (isLocalHost()) {
      const localProtocol = window.location.protocol === "https:" ? "wss" : "ws";
      return `${localProtocol}://${window.location.host}${path}`;
    }
    const protocol = wsProtocolFor(rawDomain);
    return `${protocol}://${domain}${path}`;
  }

  function buildTaskApiUrl(path) {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    if (!cleanPath) throw new Error("Upload path is missing.");
    const domain = window.appInfo?.services?.TASK_API_DOMAIN;
    if (!domain) throw new Error("TASK_API_DOMAIN is missing in /config.js");
    return `${String(domain).replace(/\/+$/, "")}/${cleanPath}`;
  }

  function uploadAttachment(file, options) {
    return loadRuntimeConfig().then(() => {
      const session = readSession();
      const token = session.loginToken || session.userInfo?.loginToken || "";
      const userId = options?.userId || session.userInfo?.id || "";
      const threadId = options?.threadId || "";
      if (!token || !userId) throw new Error("Please sign in before uploading attachments.");
      if (!threadId) throw new Error("threadId is required before uploading attachments.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("thread_id", threadId);
      formData.append("user_id", userId);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable || typeof options?.onProgress !== "function") return;
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            return;
          }
          try {
            const response = JSON.parse(xhr.responseText || "{}");
            const data = response.data || {};
            const filePath = data.relative_path || response.relative_path || data.file_url || response.file_url || "";
            resolve({
              name: data.file_name || response.file_name || file.name,
              description: "",
              type: data.content_type || file.type || response.content_type || "application/octet-stream",
              file_path: filePath,
              file_id: data.file_id || response.file_id || ""
            });
          } catch (err) {
            reject(new Error("Invalid JSON response from upload API."));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
        xhr.addEventListener("abort", () => reject(new Error("Upload was aborted.")));
        xhr.open("POST", buildTaskApiUrl("api/v2/upload_attachment"));
        xhr.setRequestHeader("Luckee-Authorization", token);
        xhr.setRequestHeader("X-User-ID", userId);
        xhr.setRequestHeader("x-user-token", token);
        xhr.setRequestHeader("USER_LANGUAGE", readLanguagePreference() === "zh" ? "EN" : "CN");
        xhr.send(formData);
      });
    });
  }

  function normalizeMessage(raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return { type: "raw", raw };
    }
  }

  function normalizeErrorUpdate(msg) {
    if (!msg || msg.type !== "error_update") return null;
    const errorMessage = String(
      msg.error_message
      || msg.errorMessage
      || msg.message
      || "Diagnosis failed before the agent could finish."
    ).trim();
    return {
      type: "error_update",
      errorCode: msg.error_code ?? msg.errorCode ?? "",
      errorMessage,
      originalRequest: String(msg.original_request || msg.request || "").trim(),
      messageId: msg.message_id || msg.messageId || msg.id || "",
      parentId: msg.parent_id || msg.parentId || "",
      timestamp: msg.timestamp || msg.ts || new Date().toISOString(),
      raw: msg
    };
  }

  function createErrorUpdateError(update) {
    const error = new Error(update?.errorMessage || "Diagnosis failed before completion.");
    error.name = "LuckeeListingErrorUpdate";
    error.code = update?.errorCode || "";
    error.messageId = update?.messageId || "";
    error.parentId = update?.parentId || "";
    error.originalRequest = update?.originalRequest || "";
    error.raw = update?.raw || null;
    return error;
  }

  async function runListingDiagnosis(payload) {
    await loadRuntimeConfig();
    const session = readSession();
    const token = session.loginToken || session.userInfo?.loginToken || "";
    const userId = session.userInfo?.id || "";
    console.log("[Luckee Listing WS] session", { hasToken: !!token, userId: userId || "(missing)" });
    if (!token || !userId) {
      throw new Error("Please sign in before testing the agent WS.");
    }

    const replayOnly = payload?.replayOnly === true;
    const toolName = String(payload?.toolName || "").trim();
    const message = replayOnly ? null : {
      type: "query",
      message_id: `luckee-listing-diagnosis-${Date.now()}`,
      query: buildListingDiagnosisQuery(payload),
      user_id: userId,
      attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
      config: Object.assign({
        source_type: "tool",
        source: LISTING_TOOL_NAME,
        user_token: token,
        launch_listing: {
          source: LISTING_TOOL_NAME,
          action: "listing_diagnosis",
          skill: LISTING_DIAGNOSIS_SKILL,
          source_type: payload?.sourceType || "asin_url",
          listing_input: payload?.listingInput || payload?.asin || "",
          asin: payload?.asin || "",
          marketplace: payload?.marketplace || "",
          marketplace_label: payload?.marketplaceLabel || "",
          advanced_options: payload?.advancedOptions || {},
          pasted_listing: payload?.pastedListing || null
        }
      }, toolName ? { tool_name: toolName } : {})
    };
    return new Promise((resolve, reject) => {
      const received = [];
      const threadId = payload?.threadId || createThreadId();
      const maxReconnectAttempts = Number(payload?.maxReconnectAttempts ?? 8);
      const messageIdleTimeoutMs = Number(payload?.messageIdleTimeoutMs ?? 90000);
      let settled = false;
      let sentInitialQuery = replayOnly;
      let messageIdleTimer = null;
      let lastMessageAt = 0;
      let reconnectAttempts = 0;
      let activeSocket = null;

      function notifyStatus(status) {
        if (typeof payload?.onStatus === "function") payload.onStatus(status);
      }

      function clearMessageIdleTimer() {
        if (messageIdleTimer) {
          window.clearTimeout(messageIdleTimer);
          messageIdleTimer = null;
        }
      }

      function scheduleMessageIdleTimer(ws) {
        if (!Number.isFinite(messageIdleTimeoutMs) || messageIdleTimeoutMs <= 0) return;
        clearMessageIdleTimer();
        messageIdleTimer = window.setTimeout(() => {
          if (settled || activeSocket !== ws) return;
          const idleMs = lastMessageAt ? Date.now() - lastMessageAt : messageIdleTimeoutMs;
          notifyStatus({ state: "message_idle", threadId, idleMs, timeoutMs: messageIdleTimeoutMs, reconnectAttempts });
          try { ws.close(4000, "message idle timeout"); } catch (err) {}
        }, messageIdleTimeoutMs);
      }

      function connect(isReconnect) {
        const wsUrl = buildWsUrl({ userId, token, threadId, isReconnect });
        console.log("[Luckee Listing WS] connecting", {
          url: wsUrl,
          threadId,
          isReconnect,
          reconnectAttempts
        });
        notifyStatus({ state: isReconnect ? "reconnecting" : "connecting", threadId, reconnectAttempts });
        const ws = new WebSocket(wsUrl);
        activeSocket = ws;

        ws.onopen = () => {
          console.log("[Luckee Listing WS] open", { threadId, isReconnect });
          lastMessageAt = Date.now();
          scheduleMessageIdleTimer(ws);
          notifyStatus({ state: "open", threadId, isReconnect, reconnectAttempts });
          if (replayOnly) {
            console.log("[Luckee Listing WS] replay mode open, waiting for historical messages", { threadId });
          } else {
            if (!sentInitialQuery) {
              console.log("[Luckee Listing WS] sending", {
                threadId,
                message_id: message?.message_id,
                type: message?.type,
                hasAttachments: Array.isArray(message?.attachments) && message.attachments.length > 0,
                source: message?.config?.source || "",
                toolName: message?.config?.tool_name || "",
                sourceType: message?.config?.launch_listing?.source_type || "",
                marketplace: message?.config?.launch_listing?.marketplace || ""
              });
              ws.send(JSON.stringify(message));
              sentInitialQuery = true;
            }
          }
        };

        ws.onmessage = (event) => {
          lastMessageAt = Date.now();
          scheduleMessageIdleTimer(ws);
          reconnectAttempts = 0;
          const msg = normalizeMessage(event.data);
          received.push(msg);
          console.log("[Luckee Listing WS] message", msg);
          if (typeof payload?.onMessage === "function") payload.onMessage(msg);
          if (msg?.type === "collection_plan" && typeof payload?.onPlan === "function") {
            payload.onPlan(msg.plan, msg);
          }
          const errorUpdate = normalizeErrorUpdate(msg);
          if (errorUpdate) {
            const error = createErrorUpdateError(errorUpdate);
            settled = true;
            clearMessageIdleTimer();
            console.error("[Luckee Listing WS] error_update", errorUpdate);
            if (typeof payload?.onErrorUpdate === "function") payload.onErrorUpdate(errorUpdate);
            if (typeof payload?.onError === "function") payload.onError(error);
            ws.close();
            reject(error);
            return;
          }
          if (msg?.type === "turn_state" && msg?.state === "idle") {
            settled = true;
            clearMessageIdleTimer();
            ws.close();
            if (typeof payload?.onComplete === "function") payload.onComplete(received);
            resolve(received);
          }
        };

        ws.onerror = (event) => {
          console.error("[Luckee Listing WS] error", event);
          if (typeof payload?.onError === "function") payload.onError(event);
        };

        ws.onclose = (event) => {
          if (activeSocket !== ws) return;
          clearMessageIdleTimer();
          console.log("[Luckee Listing WS] closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            threadId
          });
          if (settled) return;
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(30000, 1000 * Math.pow(1.7, reconnectAttempts - 1));
            notifyStatus({ state: "reconnect_scheduled", threadId, reconnectAttempts, delay });
            window.setTimeout(() => {
              if (!settled) connect(true);
            }, delay);
            return;
          }
          const error = new Error(`WS closed before diagnosis completed (${event.code || "unknown"})`);
          if (typeof payload?.onError === "function") payload.onError(error);
          reject(error);
        };
      }

      connect(replayOnly);
    });
  }

  window.LuckeeAgentWs = {
    createThreadId,
    uploadAttachment,
    runTest: runListingDiagnosis,
    runListingDiagnosis,
    buildListingDiagnosisQuery,
    LISTING_TOOL_NAME
  };
})();
