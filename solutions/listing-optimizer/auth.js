/* Luckee Listing auth bridge: mirrors the main Luckee login/register flow. */
(function () {
  const USER_STORAGE_KEY = "luckee-listing:user";
  const LEGACY_USER_STORAGE_KEY = "user";
  const ANONYMOUS_ID_KEY = "anonymous_id";
  const REGISTER_CHANNEL_KEY = "register_channel";
  const GOOGLE_AUTH_REDIRECT_STORAGE_KEY = "luckee_google_auth_redirect_url";
  const LISTING_APP_BASE = "/solutions/listing-optimizer/";
  const LISTING_GOOGLE_CALLBACK_PATH = "/solutions/listing-optimizer/google-auth/callback";
  const REQUEST_TIMEOUT_MS = 20000;
  const SESSION_REFRESH_TTL_MS = 5 * 60 * 1000;
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const API_PATHS = {
    register: "luckee/user/web/user/register.do",
    sendEmail: "luckee/user/web/user/sendEmail.do",
    validEmailCode: "luckee/user/web/user/validEmailCode.do",
    checkInviteLink: "luckee/user/web/inviteLinks/checkInviteLink.do",
    getGoogleAuthUrl: "luckee/user/web/google/getAuthUrl.do",
    googleAuth: "luckee/user/web/google/googleAuth.do",
    login: "luckee/user/web/user/login.do",
    getUser: "luckee/user/web/user/getUser.do",
    getUserCredits: "luckee/user/web/user/getUserCredits.do",
    getUserRelatedToolAvailable: "luckee/user/web/user/getUserRelatedToolAvailable.do",
    exitLogin: "luckee/user/web/user/exitLogin.do"
  };

  function md5(input) {
    function add32(a, b) { return (a + b) & 0xffffffff; }
    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function cycle(x, k) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function block(s) {
      const out = [];
      for (let i = 0; i < 64; i += 4) out[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      return out;
    }
    function hash(s) {
      let i;
      const n = s.length;
      const state = [1732584193, -271733879, -1732584194, 271733878];
      for (i = 64; i <= n; i += 64) cycle(state, block(s.substring(i - 64, i)));
      s = s.substring(i - 64);
      const tail = Array(16).fill(0);
      for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) { cycle(state, tail); tail.fill(0); }
      tail[14] = n * 8;
      cycle(state, tail);
      return state;
    }
    function hex(n) {
      let s = "";
      for (let j = 0; j < 4; j++) s += ((n >> (j * 8 + 4)) & 15).toString(16) + ((n >> (j * 8)) & 15).toString(16);
      return s;
    }
    return hash(unescape(encodeURIComponent(String(input)))).map(hex).join("");
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

  function buildUrl(path) {
    const cleanPath = String(path).replace(/^\/+/, "");
    const localHosts = ["localhost", "127.0.0.1", "::1"];
    if (localHosts.includes(window.location.hostname)) return `/${cleanPath}`;
    const domain = window.appInfo?.services?.USER_API_DOMAIN;
    return domain ? `${String(domain).replace(/\/+$/, "")}/${cleanPath}` : `/${cleanPath}`;
  }

  function readSession() {
    try {
      return JSON.parse(
        window.localStorage.getItem(USER_STORAGE_KEY)
        || window.localStorage.getItem(LEGACY_USER_STORAGE_KEY)
        || "{}"
      ) || {};
    }
    catch (err) { return {}; }
  }

  function clearStoredSession() {
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    } catch (err) {}
  }

  function normalizeSession(session) {
    const source = session && typeof session === "object" ? session : {};
    const userInfo = source.userInfo && typeof source.userInfo === "object" ? source.userInfo : {};
    const loginToken = String(source.loginToken || userInfo.loginToken || "").trim();
    const userId = String(userInfo.id || userInfo.userId || source.userId || "").trim();
    const validatedAt = Number(source.validatedAt || 0);
    const normalizedUserInfo = Object.assign({}, userInfo, {
      id: userId || userInfo.id || userInfo.userId || "",
      loginToken
    });
    return Object.assign({}, source, {
      loginToken,
      userId,
      validatedAt: Number.isFinite(validatedAt) ? validatedAt : 0,
      isAuthenticated: !!loginToken,
      userInfo: normalizedUserInfo
    });
  }

  function hasSessionToken(session) {
    return !!normalizeSession(session).loginToken;
  }

  function isSessionFresh(session) {
    const normalized = normalizeSession(session);
    return !!normalized.validatedAt && (Date.now() - normalized.validatedAt) < SESSION_REFRESH_TTL_MS;
  }

  function isSessionUsable(session) {
    const normalized = normalizeSession(session);
    return !!(normalized.loginToken && normalized.userId);
  }

  function isSessionReady(session) {
    return isSessionUsable(session) && isSessionFresh(session);
  }

  function notifySessionChange(session, reason) {
    try {
      window.dispatchEvent(new CustomEvent("luckee-auth-changed", {
        detail: {
          session: session ? normalizeSession(session) : null,
          reason: reason || ""
        }
      }));
    } catch (err) {}
  }

  function writeSession(patch) {
    const nextSession = normalizeSession(Object.assign({}, readSession(), patch));
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextSession));
      window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    } catch (err) {}
    notifySessionChange(nextSession, "write");
    return nextSession;
  }

  function invalidateSession(reason) {
    clearStoredSession();
    notifySessionChange(null, reason || "invalidated");
    return null;
  }

  function normalizeToken(data) {
    if (typeof data === "string") return data.trim();
    if (data && typeof data.token === "string") return data.token.trim();
    return "";
  }

  function normalizeSource(data) {
    const source = data && typeof data === "object" ? Number(data.source) : NaN;
    return source === 0 || source === 1 ? source : undefined;
  }

  function normalizeUserInfo(data, loginToken, fallbackSource) {
    return Object.assign({}, data || {}, {
      id: data?.userId || data?.id,
      loginToken,
      source: data?.source ?? fallbackSource
    });
  }

  function pickFirstFiniteNumber(candidates) {
    for (const candidate of candidates) {
      const value = Number(candidate);
      if (Number.isFinite(value)) return value;
    }
    return null;
  }

  function normalizeUserCredits(data) {
    const source = data && typeof data === "object" ? data : {};
    const remaining = pickFirstFiniteNumber([
      source.remaining,
      source.remainingCredits,
      source.leftCredits,
      source.summary?.remaining,
      source.summary?.remainingCredits
    ]);
    const total = pickFirstFiniteNumber([
      source.total,
      source.totalCredits,
      source.summary?.total,
      source.summary?.totalCredits
    ]);
    const used = pickFirstFiniteNumber([
      source.used,
      source.usedCredits,
      source.summary?.used,
      source.summary?.usedCredits
    ]);

    return Object.assign({}, source, {
      remaining,
      total,
      used
    });
  }

  function shouldInvalidateSession(error, responsePayload) {
    const message = String(
      responsePayload?.message
      || error?.message
      || ""
    ).toLowerCase();
    return (
      message.includes("401")
      || message.includes("403")
      || message.includes("unauthorized")
      || message.includes("forbidden")
      || message.includes("sign in")
      || message.includes("login")
      || message.includes("token")
    );
  }

  function readStorage(storage, key) {
    try {
      return storage.getItem(key) || "";
    } catch (err) {
      return "";
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (err) {}
  }

  function createAnonymousId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
      const random = Math.floor(Math.random() * 16);
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function getAnonymousId() {
    const storageId = readStorage(window.localStorage, ANONYMOUS_ID_KEY);
    if (storageId) return storageId;
    const anonymousId = createAnonymousId();
    writeStorage(window.localStorage, ANONYMOUS_ID_KEY, anonymousId);
    return anonymousId;
  }

  function getRegisterChannel() {
    return readStorage(window.sessionStorage, REGISTER_CHANNEL_KEY) || "tool-luckee-listing";
  }

  function getSiteSource() {
    const override = window.appInfo?.region?.REGION_OVERRIDE;
    if (override === "cn") return 0;
    if (override === "overseas") return 1;
    const hostname = String(window.location.hostname || "").toLowerCase();
    const cnHosts = [
      "luckee.net",
      "luckee-frontend-staging-950663559455.us-central1.run.app",
      "staging-app.motse.ai"
    ];
    return cnHosts.some(host => hostname === host || hostname.endsWith(`.${host}`)) ? 0 : 1;
  }

  function getSafeRedirectPath(value, fallback) {
    const safeFallback = fallback || "/";
    if (!value) return safeFallback;
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin) return safeFallback;
      return `${url.pathname}${url.search}${url.hash}` || safeFallback;
    } catch (err) {
      return safeFallback;
    }
  }

  function rememberGoogleAuthRedirect(redirectUrl) {
    writeStorage(
      window.sessionStorage,
      GOOGLE_AUTH_REDIRECT_STORAGE_KEY,
      getSafeRedirectPath(redirectUrl, "/")
    );
  }

  function consumeGoogleAuthRedirect() {
    const redirectUrl = getSafeRedirectPath(
      readStorage(window.sessionStorage, GOOGLE_AUTH_REDIRECT_STORAGE_KEY),
      LISTING_APP_BASE
    );
    try {
      window.sessionStorage.removeItem(GOOGLE_AUTH_REDIRECT_STORAGE_KEY);
    } catch (err) {}
    return redirectUrl;
  }

  function getGoogleAuthCallbackUri() {
    return new URL(LISTING_GOOGLE_CALLBACK_PATH, window.location.origin).toString();
  }

  async function request(path, options) {
    await loadRuntimeConfig();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const finalOptions = Object.assign({}, options, {
      signal: controller.signal
    });
    let response;
    try {
      response = await fetch(buildUrl(path), finalOptions);
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (error?.name === "AbortError") {
        throw new Error("Request timed out. Please check your network or local proxy and try again.");
      }
      throw error;
    }
    window.clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  async function sendEmailCode(email) {
    if (!EMAIL_REGEX.test(String(email || "").trim())) {
      throw new Error("Please enter a valid email address.");
    }
    const response = await request(API_PATHS.sendEmail, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify({ email: String(email).trim() })
    });
    if (response.code !== 200) {
      throw new Error(response.message || "Failed to send verification code.");
    }
    return response;
  }

  async function fetchGoogleAuthUrl() {
    const response = await request(API_PATHS.getGoogleAuthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify({ redirectUri: getGoogleAuthCallbackUri() })
    });
    const authUrl = typeof response.data === "string" ? response.data.trim() : "";
    if (response.code !== 200 || !authUrl) {
      throw new Error(response.message || "Unable to get the Google authorization link.");
    }
    return authUrl;
  }

  async function startGoogleAuth(redirectUrl) {
    rememberGoogleAuthRedirect(redirectUrl || `${window.location.pathname}${window.location.search}${window.location.hash}`);
    return fetchGoogleAuthUrl();
  }

  async function completeGoogleAuthIfNeeded() {
    const params = new URLSearchParams(window.location.search || "");
    const code = (params.get("code") || "").trim();
    const state = (params.get("state") || "").trim();

    if (!code || !state) {
      return { handled: false };
    }

    const requestSource = getSiteSource();
    const authRes = await request(API_PATHS.googleAuth, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify({
        code,
        state,
        source: requestSource
      })
    });

    const loginToken = normalizeToken(authRes.data);
    const source = normalizeSource(authRes.data);
    if (authRes.code !== 200 || !loginToken) {
      throw new Error(authRes.message || "Google authorization failed.");
    }

    writeSession({
      loginToken,
      isAuthenticated: true,
      validatedAt: Date.now(),
      userInfo: Object.assign({ loginToken }, source === undefined ? {} : { source })
    });

    const userInfo = await getCurrentUser({ loginToken, fallbackSource: source ?? requestSource });
    writeSession({ loginToken, isAuthenticated: true, validatedAt: Date.now(), userInfo });

    const redirectUrl = consumeGoogleAuthRedirect();
    const cleanCurrentPath = `${window.location.pathname}${window.location.hash || ""}`;

    if (redirectUrl && redirectUrl !== cleanCurrentPath) {
      window.location.replace(redirectUrl);
      return { handled: true, redirected: true, loginToken, userInfo };
    }

    const cleanUrl = `${LISTING_GOOGLE_CALLBACK_PATH}${window.location.hash || ""}`;
    window.history.replaceState({}, document.title, cleanUrl);
    return { handled: true, redirected: false, loginToken, userInfo };
  }

  async function registerWithEmail(payload) {
    const email = String(payload?.email || "").trim();
    const code = String(payload?.code || "").trim();
    const userName = String(payload?.userName || "").trim();
    const password = String(payload?.password || "");
    const inviteCode = String(payload?.inviteCode || "").trim();
    const confirmInviteIssue = typeof payload?.confirmInviteIssue === "function"
      ? payload.confirmInviteIssue
      : null;

    const verifyRes = await request(API_PATHS.validEmailCode, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify({ email, code })
    });

    if (verifyRes.code !== 200) {
      throw new Error(verifyRes.message || "Invalid verification code.");
    }

    const uuid = verifyRes.data || "";

    if (inviteCode) {
      const checkRes = await request(API_PATHS.checkInviteLink, {
        method: "POST",
        headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
        body: JSON.stringify({ linkCode: inviteCode })
      });

      if (checkRes.code === 662 || checkRes.code === 663) {
        const shouldContinue = confirmInviteIssue
          ? await Promise.resolve(confirmInviteIssue(checkRes.message || "There is an issue with this invite code. Do you want to continue registering?"))
          : window.confirm(checkRes.message || "There is an issue with this invite code. Do you want to continue registering?");
        if (!shouldContinue) {
          throw new Error("Registration cancelled.");
        }
      } else if (checkRes.code !== 200) {
        throw new Error(checkRes.message || "Registration failed.");
      }
    }

    const registerRes = await request(API_PATHS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify(Object.assign({
        anonymousId: getAnonymousId(),
        password: md5(password),
        userName,
        uuid,
        source: getSiteSource(),
        registerChannel: getRegisterChannel()
      }, inviteCode ? { linkCode: inviteCode } : {}))
    });

    if (registerRes.code !== 200) {
      throw new Error(registerRes.message || "Registration failed.");
    }

    return {
      email,
      userName
    };
  }

  async function loginWithPassword(userName, password) {
    const loginRes = await request(API_PATHS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json", USER_LANGUAGE: "EN" },
      body: JSON.stringify({ userName, password: md5(password) })
    });
    const loginToken = normalizeToken(loginRes.data);
    const source = normalizeSource(loginRes.data);
    if (loginRes.code !== 200 || !loginToken) throw new Error(loginRes.message || "Login failed");

    writeSession({
      loginToken,
      isAuthenticated: true,
      validatedAt: Date.now(),
      userInfo: Object.assign({ loginToken }, source === undefined ? {} : { source })
    });

    const userInfo = await getCurrentUser({ loginToken, fallbackSource: source });
    writeSession({ loginToken, isAuthenticated: true, validatedAt: Date.now(), userInfo });
    return { loginToken, userInfo };
  }

  async function getCurrentUser(options) {
    const session = readSession();
    const loginToken = String(options?.loginToken || session.loginToken || session.userInfo?.loginToken || "").trim();
    if (!loginToken) throw new Error("Please sign in before continuing.");

    try {
      const userRes = await request(API_PATHS.getUser, {
        method: "GET",
        headers: {
          USER_LANGUAGE: "EN",
          "Luckee-Authorization": loginToken,
          "x-user-token": loginToken
        }
      });
      if (userRes.code !== 200) {
        if (options?.invalidateOnFailure !== false && shouldInvalidateSession(null, userRes)) {
          invalidateSession("get-user-failed");
        }
        throw new Error(userRes.message || "Unable to load your account.");
      }

      const userInfo = normalizeUserInfo(userRes.data, loginToken, options?.fallbackSource ?? session.userInfo?.source);
      writeSession({ loginToken, isAuthenticated: true, validatedAt: Date.now(), userInfo });
      return userInfo;
    } catch (error) {
      if (options?.invalidateOnFailure !== false && shouldInvalidateSession(error)) {
        invalidateSession("get-user-error");
      }
      throw error;
    }
  }

  async function getUserRelatedToolAvailable(toolName, options) {
    const normalizedToolName = String(toolName || "").trim();
    if (!normalizedToolName) throw new Error("toolName is required.");

    const session = readSession();
    const loginToken = String(options?.loginToken || session.loginToken || session.userInfo?.loginToken || "").trim();
    if (!loginToken) throw new Error("Please sign in before continuing.");

    const response = await request(API_PATHS.getUserRelatedToolAvailable, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        USER_LANGUAGE: "EN",
        "Luckee-Authorization": loginToken,
        "x-user-token": loginToken
      },
      body: JSON.stringify({ toolName: normalizedToolName })
    });
    if (response.code !== 200) {
      throw new Error(response.message || "Unable to check your remaining tool usage.");
    }
    return {
      toolAvailable: response.data?.toolAvailable === true
    };
  }

  async function getUserCredits(options) {
    const session = readSession();
    const loginToken = String(options?.loginToken || session.loginToken || session.userInfo?.loginToken || "").trim();
    if (!loginToken) throw new Error("Please sign in before continuing.");

    const response = await request(API_PATHS.getUserCredits, {
      method: "GET",
      headers: {
        USER_LANGUAGE: "EN",
        "Luckee-Authorization": loginToken,
        "x-user-token": loginToken
      }
    });
    if (response.code !== 200) {
      throw new Error(response.message || "Unable to check your remaining credits.");
    }
    return normalizeUserCredits(response.data);
  }

  async function signOut() {
    const token = normalizeSession(readSession()).loginToken;
    clearStoredSession();
    notifySessionChange(null, "signout");
    if (token) {
      request(API_PATHS.exitLogin, {
        method: "GET",
        headers: {
          USER_LANGUAGE: "EN",
          "Luckee-Authorization": token,
          "x-user-token": token
        }
      }).catch(() => {});
    }
  }

  async function ensureValidSession(options) {
    const settings = Object.assign({ force: false }, options || {});
    const session = normalizeSession(readSession());
    if (!hasSessionToken(session)) {
      invalidateSession("missing-token");
      return null;
    }
    if (!settings.force && isSessionReady(session)) {
      return session;
    }
    if (ensureValidSession.promise && !settings.force) return ensureValidSession.promise;
    const validation = getCurrentUser({
      loginToken: session.loginToken,
      fallbackSource: session.userInfo?.source,
      invalidateOnFailure: true
    })
      .then((userInfo) => normalizeSession(Object.assign({}, readSession(), {
        loginToken: session.loginToken,
        validatedAt: Date.now(),
        userInfo
      })))
      .catch(() => null)
      .finally(() => {
        if (ensureValidSession.promise === validation) ensureValidSession.promise = null;
      });
    ensureValidSession.promise = validation;
    return validation;
  }

  window.LuckeeAuth = {
    sendEmailCode,
    registerWithEmail,
    startGoogleAuth,
    completeGoogleAuthIfNeeded,
    loginWithPassword,
    getCurrentUser,
    getUserCredits,
    getUserRelatedToolAvailable,
    ensureValidSession,
    invalidateSession,
    signOut,
    getSession(options) {
      const session = normalizeSession(readSession());
      if (options?.requireReady) {
        return isSessionReady(session) ? session : null;
      }
      return hasSessionToken(session) ? session : null;
    }
  };
})();
