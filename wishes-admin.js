(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const api = window.WishesAdmin;
  const list = $('#adminWishes');
  let active = false;
  let kind = 'wishes';
  let trash = false;
  let page = 0;
  let hasOlder = false;
  let busy = false;
  let generation = 0;
  let liked = new Set();
  let likesKnown = false;

  function status(message, error = false) {
    $('#adminStatus').textContent = message;
    $('#adminStatus').classList.toggle('is-error', error);
  }

  function controls() {
    $('#adminPrevious').disabled = busy || page === 0;
    $('#adminNext').disabled = busy || !hasOlder;
    $('#adminPage').textContent = `Trang ${page + 1}`;
    $('#adminWishes').setAttribute('aria-busy', String(busy));
    for (const selector of ['#refreshButton', '#visibleFilter', '#trashFilter', '#searchForm button', '#wishesKind', '#chatKind']) $(selector).disabled = busy;
    $('#adminSort').disabled = busy || kind === 'chat';
    list.querySelectorAll('button').forEach(button => {
      button.disabled = busy || (button.classList.contains('heart-button') && (!likesKnown || trash));
    });
  }

  function empty() {
    const box = document.createElement('div');
    box.className = 'empty-letter';
    const title = document.createElement('p');
    title.textContent = trash ? 'Thùng rác đang trống.' : kind === 'chat' ? 'Góc trò chuyện còn yên ắng.' : 'Một góc sổ còn trống.';
    const text = document.createElement('span');
    text.textContent = $('#adminSearch').value.trim() ? 'Không tìm thấy nội dung phù hợp. Thử một từ khác nhé.' : trash ? 'Nội dung bạn cất khỏi trang chung sẽ ở đây.' : kind === 'chat' ? 'Tin nhắn ở trang 7 sẽ xuất hiện tại đây.' : 'Lời chúc mọi người gửi sẽ xuất hiện tại đây.';
    box.append(title, text);
    list.appendChild(box);
  }

  function render(notes) {
    list.replaceChildren();
    if (!notes.length) return empty();
    for (const note of notes) {
      const card = document.createElement('article');
      card.className = 'letter';
      card.dataset.id = note.id;
      const meta = document.createElement('div');
      meta.className = 'letter__meta';
      const name = document.createElement('h2');
      name.className = 'letter__name';
      name.textContent = `${kind === 'chat' ? 'TỪ' : 'GỬI'} ${note.name}`;
      const date = document.createElement('time');
      date.dateTime = note.created_at;
      date.textContent = new Date(note.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      meta.append(name, date);
      const text = document.createElement('p');
      text.className = 'letter__text';
      text.textContent = note.text;
      const actions = document.createElement('div');
      actions.className = 'letter__actions';
      const heart = document.createElement('button');
      heart.type = 'button';
      heart.className = 'heart-button';
      heart.setAttribute('aria-pressed', String(liked.has(note.id)));
      heart.setAttribute('aria-label', `${liked.has(note.id) ? 'Bỏ yêu thích' : 'Yêu thích'} lời chúc gửi ${note.name}`);
      heart.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span></span>';
      heart.querySelector('span').textContent = `${note.favorite_count || 0}`;
      heart.disabled = trash || !likesKnown;
      if (trash) heart.title = 'Khôi phục lời chúc trước khi yêu thích.';
      heart.addEventListener('click', async () => {
        if (busy || trash) return;
        busy = true;
        controls();
        try {
          const result = await api.favorite(note.id, !liked.has(note.id));
          result.liked ? liked.add(note.id) : liked.delete(note.id);
          status(result.liked ? 'Đã yêu thích lời chúc.' : 'Đã bỏ yêu thích.');
          await load(page, true);
        } catch (_) { status('Chưa cập nhật được lượt yêu thích. Hãy làm mới và thử lại.', true); }
        finally { busy = false; controls(); }
      });
      const moderate = document.createElement('button');
      moderate.type = 'button';
      moderate.className = `moderate-button${trash ? ' restore' : ''}`;
      moderate.textContent = trash ? 'Khôi phục ↶' : 'Đưa vào thùng rác';
      moderate.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        controls();
        try {
          await api.moderate(note.id, !trash, kind);
          status(trash ? 'Đã khôi phục nội dung lên trang chung.' : 'Đã đưa vào thùng rác. Bạn có thể khôi phục bất cứ lúc nào.');
          await load(page, true);
        } catch (_) { status('Chưa xác nhận được thay đổi. Hãy làm mới để kiểm tra và thử lại.', true); }
        finally { busy = false; controls(); }
      });
      if (kind === 'chat') {
        const label = document.createElement('span');
        label.className = 'chat-admin-label';
        label.textContent = 'TIN NHẮN · TRANG 7';
        actions.append(label, moderate);
      } else actions.append(heart, moderate);
      card.append(meta, text, actions);
      list.appendChild(card);
    }
  }

  async function load(nextPage = 0, preserveStatus = false) {
    const requestId = ++generation;
    busy = true;
    controls();
    if (!preserveStatus) status('Đang mở những lời được giữ lại…');
    try {
      const [result, counts] = await Promise.all([
        api.list({ page:nextPage, trash, search:$('#adminSearch').value, sort:$('#adminSort').value, kind }),
        api.counts(kind).catch(() => null)
      ]);
      if (!active || requestId !== generation) return;
      if (!result.notes.length && nextPage > 0) return load(nextPage - 1, preserveStatus);
      page = nextPage;
      hasOlder = result.hasOlder;
      likesKnown = false;
      try { liked = new Set(await api.liked(result.notes.map(note => note.id), kind)); likesKnown = true; }
      catch (_) { /* Reading the letters still works if favorite state cannot load. */ }
      if (!active || requestId !== generation) return;
      if (counts) {
        $('#visibleCount').textContent = counts.visible;
        $('#trashCount').textContent = counts.trash;
        $('#favoriteCount').textContent = counts.favorites;
      }
      render(result.notes);
      if (!preserveStatus) status(`${result.notes.length} ${kind === 'chat' ? 'tin nhắn' : 'lời chúc'} trong trang này.${likesKnown ? '' : ' Chưa tải được trạng thái yêu thích; nhấn Làm mới để thử lại.'}`);
    } catch (_) {
      if (active && requestId === generation) status('Không tải được dữ liệu hoặc phiên đã hết hạn. Thử Làm mới; nếu vẫn lỗi, đăng xuất rồi đăng nhập lại.', true);
    } finally {
      if (requestId === generation) { busy = false; controls(); }
    }
  }

  function filter(value) {
    trash = value;
    $('#visibleFilter').classList.toggle('is-active', !trash);
    $('#trashFilter').classList.toggle('is-active', trash);
    $('#visibleFilter').setAttribute('aria-pressed', String(!trash));
    $('#trashFilter').setAttribute('aria-pressed', String(trash));
    load(0);
  }

  function changeKind(value) {
    kind = value;
    const chat = kind === 'chat';
    $('#wishesKind').setAttribute('aria-pressed', String(!chat));
    $('#chatKind').setAttribute('aria-pressed', String(chat));
    $('#favoriteTotal').hidden = chat;
    $('#visibleCountLabel').textContent = chat ? 'Tin đang hiển thị' : 'Đang trên tường';
    $('#visibleFilter').textContent = chat ? 'Trong phòng chat' : 'Trên tường';
    $('#adminSearchLabel').textContent = chat ? 'Tìm trong trò chuyện' : 'Tìm trong lời chúc';
    $('#adminSearch').placeholder = chat ? 'Tên người gửi hoặc nội dung…' : 'Người nhận hoặc một điều bạn nhớ…';
    $('#adminSearch').value = '';
    $('#adminSort').value = 'newest';
    $('#adminEndnote').textContent = chat ? 'Tin đưa vào thùng rác sẽ ẩn khỏi phòng chat. Bạn luôn có thể khôi phục lại.' : 'Lời đưa vào thùng rác sẽ ẩn khỏi tường chung. Bạn luôn có thể khôi phục lại.';
    $('#visibleCount').textContent = $('#trashCount').textContent = $('#favoriteCount').textContent = '—';
    filter(false);
  }

  $('#showPassword').addEventListener('click', () => {
    const show = $('#adminPassword').type === 'password';
    $('#adminPassword').type = show ? 'text' : 'password';
    $('#showPassword').textContent = show ? 'Ẩn' : 'Hiện';
    $('#showPassword').setAttribute('aria-pressed', String(show));
    $('#showPassword').setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  });

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    if ($('#loginButton').disabled) return;
    $('#loginButton').disabled = true;
    $('#loginStatus').textContent = 'Đang kiểm tra tài khoản…';
    $('#loginStatus').classList.remove('is-error');
    try {
      const user = await api.signIn($('#adminEmail').value.trim(), $('#adminPassword').value);
      active = true;
      $('#accountEmail').textContent = user.email;
      $('#loginPanel').hidden = true;
      $('#dashboard').hidden = false;
      $('#dashboardTitle').tabIndex = -1;
      $('#dashboardTitle').focus();
      await load();
    } catch (error) {
      $('#loginStatus').textContent = error.message.includes('không có quyền') ? error.message : 'Chưa đăng nhập được. Kiểm tra email, mật khẩu và kết nối rồi thử lại.';
      $('#loginStatus').classList.add('is-error');
    } finally {
      $('#adminPassword').value = '';
      $('#loginButton').disabled = false;
    }
  });

  $('#logoutButton').addEventListener('click', async () => {
    ++generation;
    active = false;
    $('#dashboard').hidden = true;
    list.replaceChildren();
    $('#accountEmail').textContent = '';
    $('#visibleCount').textContent = $('#trashCount').textContent = $('#favoriteCount').textContent = '—';
    $('#loginPanel').hidden = false;
    $('#loginStatus').textContent = 'Đã đóng sổ. Đăng nhập để mở lại.';
    $('#loginStatus').classList.remove('is-error');
    $('#adminEmail').focus();
    await api.signOut();
  });
  $('#visibleFilter').addEventListener('click', () => filter(false));
  $('#wishesKind').addEventListener('click', () => changeKind('wishes'));
  $('#chatKind').addEventListener('click', () => changeKind('chat'));
  $('#trashFilter').addEventListener('click', () => filter(true));
  $('#refreshButton').addEventListener('click', () => load(page));
  $('#adminPrevious').addEventListener('click', () => load(page - 1));
  $('#adminNext').addEventListener('click', () => load(page + 1));
  $('#searchForm').addEventListener('submit', event => { event.preventDefault(); if (!busy) load(0); });
  $('#adminSort').addEventListener('change', () => load(0));
})();
