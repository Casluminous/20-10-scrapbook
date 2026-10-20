(() => {
  'use strict';
  const config = window.WISH_CONFIG;
  const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/wishes`;
  const headers = { apikey: config.publishableKey };
  const fields = 'id,name,text,created_at,favorite_count';

  async function request(query, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${endpoint}?${query}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
        cache: 'no-store'
      });
      if (!response.ok) {
        const error = new Error('Không kết nối được nơi lưu lời nhắn.');
        error.status = response.status;
        throw error;
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  window.WishesAPI = Object.freeze({
    async liked(ids) {
      if (!ids.length) return [];
      const session = await window.WishSessions.visitor(false);
      if (!session) return [];
      const query = new URLSearchParams({ select: 'wish_id', wish_id: `in.(${ids.join(',')})` });
      const rows = await window.WishSessions.request(`/rest/v1/wish_favorites?${query}`, { token: session.access_token });
      return rows.map(row => row.wish_id);
    },

    async favorite(id, liked) {
      const session = await window.WishSessions.visitor(true);
      if (!session) throw new Error('Chưa tạo được phiên khách.');
      return window.WishSessions.request('/rest/v1/rpc/set_wish_favorite', {
        method: 'POST', token: session.access_token,
        body: JSON.stringify({ p_wish_id: id, p_liked: liked })
      });
    },

    async list(page = 0, pageSize = 9) {
      const query = new URLSearchParams({
        select: fields,
        order: 'created_at.desc,id.desc',
        limit: String(pageSize + 1),
        offset: String(page * pageSize)
      });
      const rows = await request(query);
      return { notes: rows.slice(0, pageSize), hasOlder: rows.length > pageSize };
    },

    async save(note) {
      try {
        const rows = await request(`select=${fields}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({ id: note.id, name: note.name, text: note.text })
        });
        if (!rows[0]?.id) throw new Error('Chưa xác nhận được lời nhắn đã lưu.');
        return rows[0];
      } catch (error) {
        // A previous attempt may have committed before its response was lost.
        if (error.status !== 409) throw error;
        const query = new URLSearchParams({ select: fields, id: `eq.${note.id}`, limit: '1' });
        const rows = await request(query);
        if (rows[0]?.name === note.name && rows[0]?.text === note.text) return rows[0];
        throw error;
      }
    }
  });
})();
