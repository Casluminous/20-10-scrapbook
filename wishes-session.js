(() => {
  'use strict';
  const config = window.WISH_CONFIG;
  const storageKey = 'scrapbook-visitor-session-v1';
  let visitorSession = null;
  let visitorPending = null;

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const { token, includeCount, ...rest } = options;
    try {
      const response = await fetch(`${config.url}${path}`, {
        ...rest,
        headers: {
          apikey: config.publishableKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
          ...rest.headers
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        const error = new Error(data?.msg || data?.message || 'Không kết nối được máy chủ.');
        error.status = response.status;
        error.code = data?.code || data?.error_code;
        throw error;
      }
      if (includeCount) {
        const total = response.headers.get('content-range')?.match(/\/(\d+)$/);
        return { data, count: total ? Number(total[1]) : null };
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function normalize(session) {
    if (!session?.access_token || !session.refresh_token || !session.user?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
    return { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in };
  }

  function rememberVisitor(session) {
    visitorSession = session;
    try {
      if (session) localStorage.setItem(storageKey, JSON.stringify(session));
      else localStorage.removeItem(storageKey);
    } catch (_) { /* The current tab still works when storage is unavailable. */ }
  }

  function readVisitor() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.user?.is_anonymous === true) visitorSession = saved;
    } catch (_) { /* Ignore invalid storage. */ }
    return visitorSession;
  }

  async function refresh(session) {
    return normalize(await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token })
    }));
  }

  async function visitor(create = false) {
    let session = readVisitor();
    if (!session && !create) return null;
    if (session?.expires_at > Date.now() / 1000 + 60) return session;
    if (visitorPending) return visitorPending;
    visitorPending = (async () => {
      if (session) {
        try { session = await refresh(session); }
        catch (error) {
          if (![400, 401, 403].includes(error.status)) throw error;
          session = null;
          rememberVisitor(null);
        }
      }
      if (!session && create) {
        session = normalize(await request('/auth/v1/signup', { method: 'POST', body: '{}' }));
      }
      if (session?.user?.is_anonymous !== true && session) throw new Error('Không dùng được phiên khách.');
      rememberVisitor(session);
      return session;
    })();
    try { return await visitorPending; }
    finally { visitorPending = null; }
  }

  window.WishSessions = Object.freeze({
    request, visitor, refresh,
    async signIn(email, password) {
      return normalize(await request('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email, password })
      }));
    },
    async signOut(session) {
      if (session) await request('/auth/v1/logout?scope=local', { method: 'POST', token: session.access_token });
    }
  });
})();
