(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const room = $('#page-7');
  const feed = $('#chatFeed');
  const form = $('#chatForm');
  if (!room || !feed || !form) return;
  const api = window.ChatAPI;
  const name = $('#chatName');
  const message = $('#chatMessage');
  const sendButton = $('#chatSend');
  const olderButton = $('#chatOlder');
  const refreshButton = $('#chatRefresh');
  const connection = $('#chatConnection');
  const hint = $('#chatHint');
  const records = new Map();
  const nameKey = 'scrapbook-chat-display-name-v1';
  const ownKey = 'scrapbook-chat-own-ids-v1';
  let ownIds = new Set();
  let timer = 0;
  let hintTimer = 0;
  let latestLoading = false;
  let olderLoading = false;
  let sending = false;
  let hasOlder = false;
  let initialized = false;
  let historyLoaded = false;
  let revision = 0;
  let pending = null;
  const defaultHint = 'Tin nhắn được lưu trực tuyến và mọi người đều đọc được.';
  try {
    name.value = (localStorage.getItem(nameKey) || '').slice(0, 24);
    const saved = JSON.parse(localStorage.getItem(ownKey));
    if (Array.isArray(saved)) ownIds = new Set(saved.filter(id => typeof id === 'string').slice(-100));
  } catch (_) { /* The room also works without local storage. */ }

  function active() { return Number($('#pageNow').textContent) === 7 && room.classList.contains('is-active') && !document.hidden; }
  function compare(a, b) { return Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id); }
  function controls() {
    olderButton.disabled = latestLoading || olderLoading || !hasOlder;
    refreshButton.disabled = latestLoading || olderLoading;
    feed.setAttribute('aria-busy', String(latestLoading || olderLoading));
  }
  function setHint(text, type = '') {
    clearTimeout(hintTimer);
    hint.textContent = text;
    hint.classList.toggle('is-error', type === 'error');
    hint.classList.toggle('is-ok', type === 'ok');
    if (type === 'ok') hintTimer = setTimeout(() => setHint(defaultHint), 6000);
  }
  function count() { $('#chatCount').textContent = `${message.value.length} / 500`; }
  function rememberName() { try { localStorage.setItem(nameKey, name.value.slice(0, 24)); } catch (_) {} }
  function schedule() {
    clearTimeout(timer);
    if (active()) timer = setTimeout(() => loadLatest(), 5000);
  }

  function render({ forceBottom = false, prepend = false } = {}) {
    const previousHeight = feed.scrollHeight;
    const previousTop = feed.scrollTop;
    const nearBottom = previousHeight - previousTop - feed.clientHeight < 65;
    const sorted = [...records.values()].sort(compare);
    const existing = new Map([...feed.querySelectorAll('.chat-message')].map(node => [node.dataset.id, node]));
    if (!sorted.length) {
      feed.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'chat-empty hand';
      empty.textContent = 'Góc này còn yên ắng.\nBạn chào mọi người trước nhé.';
      feed.appendChild(empty);
      return;
    }
    feed.querySelectorAll('.chat-empty').forEach(node => node.remove());
    existing.forEach((node, id) => { if (!records.has(id)) node.remove(); });
    sorted.forEach((record, index) => {
      let node = existing.get(record.id);
      if (!node) {
        node = document.createElement('article');
        node.className = 'chat-message';
        node.dataset.id = record.id;
        const header = document.createElement('div');
        header.className = 'chat-message__header';
        const sender = document.createElement('span');
        sender.className = 'chat-message__name';
        const time = document.createElement('time');
        header.append(sender, time);
        const body = document.createElement('p');
        body.className = 'chat-message__body';
        node.append(header, body);
      }
      node.classList.toggle('is-own', ownIds.has(record.id));
      const sender = node.querySelector('.chat-message__name');
      const body = node.querySelector('.chat-message__body');
      if (sender.textContent !== record.display_name) sender.textContent = record.display_name;
      if (body.textContent !== record.body) body.textContent = record.body;
      const time = node.querySelector('time');
      if (time.dateTime !== record.created_at) {
        time.dateTime = record.created_at;
        time.textContent = new Date(record.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
      }
      if (feed.children[index] !== node) feed.insertBefore(node, feed.children[index] || null);
    });
    if (forceBottom || (nearBottom && !prepend)) feed.scrollTop = feed.scrollHeight;
    else feed.scrollTop = prepend ? previousTop + feed.scrollHeight - previousHeight : previousTop;
  }

  async function loadLatest(reset = false) {
    if (!active()) return;
    if (latestLoading || olderLoading) { schedule(); return; }
    latestLoading = true;
    const requestRevision = revision;
    controls();
    try {
      const result = await api.list();
      if (requestRevision !== revision) return;
      if (reset || !initialized) {
        records.clear();
        historyLoaded = false;
        hasOlder = result.hasOlder;
      } else if (result.messages.length) {
        const oldest = result.messages[result.messages.length - 1];
        const visibleIds = new Set(result.messages.map(row => row.id));
        records.forEach((row, id) => { if ((!historyLoaded || compare(row, oldest) >= 0) && !visibleIds.has(id)) records.delete(id); });
        if (records.size <= 50) hasOlder = result.hasOlder;
      } else { records.clear(); hasOlder = false; }
      result.messages.forEach(row => records.set(row.id, row));
      render({ forceBottom: reset || !initialized });
      initialized = true;
      connection.textContent = 'Tin mới tự cập nhật khoảng 5 giây khi bạn ở đây.';
    } catch (_) {
      connection.textContent = 'Chưa kết nối được phòng chat. Đang thử lại; bạn cũng có thể nhấn Làm mới.';
      if (!initialized) {
        const empty = $('#chatEmpty');
        if (empty) empty.textContent = 'Chưa mở được góc trò chuyện.\nBạn thử lại sau một chút nhé.';
      }
    } finally {
      latestLoading = false;
      controls();
      schedule();
    }
  }

  async function loadOlder() {
    if (olderLoading || latestLoading || !records.size || !hasOlder) return;
    olderLoading = true;
    controls();
    const oldest = [...records.values()].sort(compare)[0];
    try {
      const result = await api.list(oldest);
      historyLoaded = true;
      result.messages.forEach(row => records.set(row.id, row));
      hasOlder = result.hasOlder;
      render({ prepend: true });
      connection.textContent = result.messages.length ? 'Đã mở thêm tin trước. Tin mới vẫn được cập nhật ở cuối.' : 'Bạn đã đọc đến tin đầu tiên.';
    } catch (_) { connection.textContent = 'Chưa tải được tin trước. Bạn bấm lại để thử nhé.'; }
    finally { olderLoading = false; controls(); schedule(); }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const sender = name.value.trim();
    const body = message.value.trim();
    if (!sender || sender.length > 24) {
      setHint('Bạn cho mọi người biết tên nhé, tối đa 24 ký tự.', 'error');
      name.focus();
      return;
    }
    if (!body || body.length > 500) {
      setHint('Viết một lời trước khi gửi nhé, tối đa 500 ký tự.', 'error');
      message.focus();
      return;
    }
    if (!pending || pending.name !== sender || pending.body !== body) pending = { id:crypto.randomUUID(), name:sender, body };
    sending = true;
    sendButton.disabled = true;
    name.readOnly = true;
    message.readOnly = true;
    form.setAttribute('aria-busy', 'true');
    setHint('Đang gửi tin…');
    try {
      const row = await api.send(pending);
      if (row.deleted_at) {
        pending = null;
        setHint('Tin này đã được quản trị viên ẩn. Bạn có thể viết một tin khác.', 'error');
        return;
      }
      ++revision;
      records.set(row.id, row);
      ownIds.add(row.id);
      try { localStorage.setItem(ownKey, JSON.stringify([...ownIds].slice(-100))); } catch (_) {}
      pending = null;
      message.value = '';
      count();
      rememberName();
      render({ forceBottom:true });
      setHint('Đã gửi. Mọi người đều đọc được tin của bạn.', 'ok');
      schedule();
    } catch (error) {
      setHint(error.code === 'P0001' ? error.message : 'Chưa xác nhận được tin đã gửi. Nội dung vẫn ở đây; bạn bấm Gửi tin để thử lại nhé.', 'error');
    } finally {
      sending = false;
      sendButton.disabled = false;
      name.readOnly = false;
      message.readOnly = false;
      form.removeAttribute('aria-busy');
    }
  });
  name.addEventListener('input', rememberName);
  message.addEventListener('input', () => {
    count();
    if (hint.classList.contains('is-error')) setHint(defaultHint);
  });
  message.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); form.requestSubmit(); }
  });
  olderButton.addEventListener('click', loadOlder);
  refreshButton.addEventListener('click', () => loadLatest(true));
  function visibility() { clearTimeout(timer); if (active()) loadLatest(); }
  window.addEventListener('bookpagechange', visibility);
  document.addEventListener('visibilitychange', visibility);
  count();
  visibility();
})();
