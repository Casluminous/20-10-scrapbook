(() => {
  'use strict';
  const sessions = window.WishSessions;
  window.ChatAPI = Object.freeze({
    async list(before = null) {
      const query = new URLSearchParams({
        select: 'id,display_name,body,created_at',
        order: 'created_at.desc,id.desc', limit: '51'
      });
      if (before) query.set('or', `(created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id}))`);
      const rows = await sessions.request(`/rest/v1/chat_messages?${query}`);
      return { messages: rows.slice(0, 50), hasOlder: rows.length > 50 };
    },
    async send(note) {
      let session = await sessions.visitor(true);
      if (!session) session = await sessions.visitor(true);
      if (!session) throw new Error('Chưa tạo được phiên trò chuyện.');
      return sessions.request('/rest/v1/rpc/send_chat_message', {
        method: 'POST', token: session.access_token,
        body: JSON.stringify({ p_id: note.id, p_name: note.name, p_body: note.body })
      });
    }
  });
})();
