(() => {
  'use strict';
  const api = window.WishSessions;
  let session = null;
  let renewing = null;

  async function token() {
    if (!session) throw new Error('Bạn cần đăng nhập lại.');
    if (session.expires_at < Date.now() / 1000 + 60) {
      if (!renewing) renewing = api.refresh(session).then(next => { session = next; }).finally(() => { renewing = null; });
      await renewing;
    }
    return session.access_token;
  }

  async function request(path, options) {
    return api.request(path, { ...options, token: await token() });
  }

  window.WishesAdmin = Object.freeze({
    async signIn(email, password) {
      session = await api.signIn(email, password);
      try {
        const allowed = await request('/rest/v1/rpc/is_wishes_admin', { method: 'POST', body: '{}' });
        if (allowed !== true || session.user.is_anonymous) throw new Error('Tài khoản này không có quyền quản trị.');
        return { email: session.user.email };
      } catch (error) {
        const previous = session;
        session = null;
        await api.signOut(previous).catch(() => {});
        throw error;
      }
    },
    async signOut() {
      const previous = session;
      session = null;
      await api.signOut(previous).catch(() => {});
    },
    async list({ page = 0, trash = false, search = '', sort = 'newest', kind = 'wishes' } = {}) {
      const chat = kind === 'chat';
      const query = new URLSearchParams({
        select: chat ? 'id,display_name,body,created_at,deleted_at' : 'id,name,text,created_at,deleted_at,favorite_count',
        deleted_at: trash ? 'not.is.null' : 'is.null',
        order: !chat && sort === 'favorites' ? 'favorite_count.desc,created_at.desc,id.desc' : 'created_at.desc,id.desc',
        limit: '21', offset: String(page * 20)
      });
      const term = search.replace(/[,().*%\\"]/g, ' ').trim().slice(0, 140);
      if (term) query.set('or', chat ? `(display_name.ilike.*${term}*,body.ilike.*${term}*)` : `(name.ilike.*${term}*,text.ilike.*${term}*)`);
      const rows = await request(`/rest/v1/${chat ? 'chat_messages' : 'wishes'}?${query}`);
      const notes = rows.slice(0, 20).map(row => chat ? { ...row, name:row.display_name, text:row.body, favorite_count:0 } : row);
      return { notes, hasOlder: rows.length > 20 };
    },
    counts: (kind = 'wishes') => request(`/rest/v1/rpc/${kind === 'chat' ? 'admin_chat_counts' : 'admin_wish_counts'}`, { method: 'POST', body: '{}' }),
    async track(search, page = 0) {
      const term = search.trim();
      if (!term || term.length > 140) throw new Error('Nhập từ hoặc cụm từ từ 1 đến 140 ký tự.');
      const literal = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const query = new URLSearchParams({
        select: 'id,name,text,created_at', deleted_at: 'is.null',
        text: `imatch.${literal}`, order: 'created_at.desc,id.desc',
        limit: '20', offset: String(page * 20)
      });
      const result = await request(`/rest/v1/wishes?${query}`, {
        includeCount: true, headers: { Prefer: 'count=exact' }
      });
      if (!Number.isSafeInteger(result.count)) throw new Error('Chưa lấy được tổng số lời chúc.');
      return { notes: result.data, count: result.count };
    },
    async moderate(id, trash, kind = 'wishes') {
      const query = new URLSearchParams({ id: `eq.${id}`, select: 'id,deleted_at' });
      const rows = await request(`/rest/v1/${kind === 'chat' ? 'chat_messages' : 'wishes'}?${query}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ deleted_at: trash ? new Date().toISOString() : null })
      });
      if (!rows?.[0]?.id) throw new Error('Chưa xác nhận được thay đổi. Hãy làm mới và thử lại.');
      return rows[0];
    },
    async liked(ids, kind = 'wishes') {
      if (!ids.length || kind === 'chat') return [];
      const query = new URLSearchParams({ select: 'wish_id', wish_id: `in.(${ids.join(',')})` });
      return (await request(`/rest/v1/wish_favorites?${query}`)).map(row => row.wish_id);
    },
    favorite: (id, liked) => request('/rest/v1/rpc/set_wish_favorite', {
      method: 'POST', body: JSON.stringify({ p_wish_id: id, p_liked: liked })
    })
  });
})();
