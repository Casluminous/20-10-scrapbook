(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const panel = $('#wordTracker');
  const results = $('#trackResults');
  const status = $('#trackStatus');
  let allowed = false;
  let generation = 0;
  let busy = false;
  let term = '';
  let page = 0;
  let count = 0;

  function controls() {
    $('#trackButton').disabled = busy;
    $('#trackPrevious').disabled = busy || page === 0;
    $('#trackNext').disabled = busy || (page + 1) * 20 >= count;
    results.setAttribute('aria-busy', String(busy));
  }

  function clear() {
    ++generation;
    busy = false;
    term = '';
    count = 0;
    page = 0;
    results.replaceChildren();
    $('#trackPagination').hidden = true;
    status.textContent = 'Nhập nội dung rồi bấm Theo dõi để xem tổng số và danh sách.';
    status.classList.remove('is-error');
    controls();
  }

  function highlight(element, text, search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
    let end = 0;
    for (const match of text.matchAll(pattern)) {
      element.append(document.createTextNode(text.slice(end, match.index)));
      const mark = document.createElement('mark');
      mark.textContent = match[0];
      element.append(mark);
      end = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(end)));
  }

  async function track(search, nextPage = 0) {
    if (!allowed || !search.trim()) return;
    const query = search.trim();
    const requestId = ++generation;
    busy = true;
    results.replaceChildren();
    $('#trackPagination').hidden = true;
    status.textContent = 'Đang đếm trên toàn bộ lời chúc ở trang 5…';
    status.classList.remove('is-error');
    controls();
    try {
      const data = await window.WishesAdmin.track(query, nextPage);
      if (!allowed || requestId !== generation) return;
      if (nextPage > 0 && nextPage * 20 >= data.count) return track(query, 0);
      term = query;
      page = nextPage;
      count = data.count;
      status.textContent = `${count.toLocaleString('vi-VN')} lời chúc có chứa “${term}”.`;
      for (const note of data.notes) {
        const card = document.createElement('article');
        card.className = 'letter';
        const meta = document.createElement('div');
        meta.className = 'letter__meta';
        const name = document.createElement('h3');
        name.className = 'letter__name';
        name.textContent = `GỬI ${note.name}`;
        const date = document.createElement('time');
        date.dateTime = note.created_at;
        date.textContent = new Date(note.created_at).toLocaleString('vi-VN');
        meta.append(name, date);
        const text = document.createElement('p');
        text.className = 'letter__text';
        highlight(text, note.text, term);
        card.append(meta, text);
        results.append(card);
      }
      $('#trackPage').textContent = `Trang ${page + 1} / ${Math.max(1, Math.ceil(count / 20))}`;
      $('#trackPagination').hidden = count <= 20;
    } catch (error) {
      if (!allowed || requestId !== generation) return;
      if (error.status === 416 && nextPage > 0) return track(query, 0);
      status.textContent = 'Chưa đếm được lời chúc. Nội dung tìm vẫn còn; bạn bấm Theo dõi để thử lại.';
      status.classList.add('is-error');
    } finally {
      if (requestId === generation) { busy = false; controls(); }
    }
  }

  $('#trackForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!busy) track($('#trackTerm').value);
  });
  $('#trackPrevious').addEventListener('click', () => { if (!busy && page > 0) track(term, page - 1); });
  $('#trackNext').addEventListener('click', () => { if (!busy && (page + 1) * 20 < count) track(term, page + 1); });
  window.addEventListener('adminstatechange', event => {
    allowed = event.detail.active && event.detail.kind === 'wishes';
    panel.hidden = event.detail.kind !== 'wishes';
    clear();
    if (!event.detail.active) { $('#trackTerm').value = ''; panel.open = false; }
  });
  window.addEventListener('adminwisheschange', () => { if (allowed && term) track(term, page); });
  controls();
})();
