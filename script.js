(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lightEffects = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const pages = $$('.page');
  const total = pages.length;
  const book = $('#book');
  const pageNow = $('#pageNow');
  const chapterLabel = $('#chapterLabel');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const dots = $$('.dot');
  const live = $('#live');
  const petalsLayer = $('#petals');
  const burstLayer = $('#burst');

  let index = 0;
  let busy = false;
  let suppressClick = false;

  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------------------------------------------------
     Navigation
     --------------------------------------------------------- */
  function parseHash() {
    const match = location.hash.match(/trang-(\d+)/);
    if (!match) return 0;
    const i = Number(match[1]) - 1;
    return i >= 0 && i < total ? i : 0;
  }

  function setHash(i) {
    try {
      history.replaceState(null, '', `#trang-${i + 1}`);
    } catch (err) {
      /* Some file:// contexts reject replaceState — deep links just stop updating. */
      console.warn('Không cập nhật được hash trang.', err);
    }
  }

  function updateChrome() {
    $('#pageTotal').textContent = pad(total);
    pageNow.textContent = pad(index + 1);
    pageNow.classList.remove('pop');
    void pageNow.offsetWidth;
    pageNow.classList.add('pop');

    chapterLabel.textContent = pages[index].dataset.title || '';
    document.title = `${pages[index].dataset.title || '20.10'} — Ngày Phụ nữ Việt Nam`;

    dots.forEach((dot, i) => {
      const isOn = i === index;
      dot.classList.toggle('is-on', isOn);
      if (isOn) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    window.dispatchEvent(new CustomEvent('bookpagechange', { detail: { page: index + 1 } }));
  }

  function announce() {
    live.textContent = `Trang ${index + 1} trên ${total}: ${pages[index].dataset.title || ''}`;
  }

  function syncInert() {
    pages.forEach((page, i) => {
      if (i === index) page.removeAttribute('inert');
      else page.setAttribute('inert', '');
    });
  }

  function clearTurnClasses() {
    pages.forEach((page) => {
      page.classList.remove('leave-left', 'leave-right', 'enter-from-right', 'enter-from-left');
      page.style.zIndex = '';
    });
  }

  function go(next, options = {}) {
    if (busy || next === index || next < 0 || next >= total) return;

    const instant = options.instant === true || prefersReduced;
    const from = pages[index];
    const to = pages[next];

    clearTurnClasses();

    if (instant) {
      from.classList.remove('is-active');
      to.classList.add('is-active');
      index = next;
      updateChrome();
      announce();
      syncInert();
      setHash(index);
      return;
    }

    busy = true;
    const dir = next > index ? 1 : -1;

    to.classList.add('is-active');
    to.classList.add(dir > 0 ? 'enter-from-right' : 'enter-from-left');
    to.style.zIndex = '1';
    from.style.zIndex = '3';

    void to.offsetWidth; // flush the starting transform before animating

    requestAnimationFrame(() => {
      to.classList.remove('enter-from-right', 'enter-from-left');
      from.classList.remove('is-active');
      from.classList.add(dir > 0 ? 'leave-left' : 'leave-right');
      window.setTimeout(() => {
        from.classList.remove('leave-left', 'leave-right');
        from.style.zIndex = '';
        to.style.zIndex = '';
        busy = false;
      }, lightEffects ? 300 : 960);
    });

    index = next;
    updateChrome();
    announce();
    syncInert();
    setHash(index);
  }

  function init() {
    const start = parseHash();
    index = start;
    pages.forEach((page, i) => {
      page.classList.toggle('is-active', i === start);
      page.style.zIndex = '';
    });
    updateChrome();
    syncInert();
    setHash(index);
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => go(i));
  });

  $$('[data-next]').forEach((el) => {
    el.addEventListener('click', () => go(index + 1));
  });

  $$('[data-go]').forEach((el) => {
    el.addEventListener('click', () => go(Number(el.dataset.go)));
  });

  $$('a[href^="#trang-"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      go(0);
    });
  });

  window.addEventListener('hashchange', () => {
    const target = parseHash();
    if (target !== index) go(target);
  });

  book.addEventListener('click', (event) => {
    if (suppressClick) return;
    if (event.target.closest('button, a, input, textarea, label, select, form, .no-advance')) return;
    if (String(window.getSelection?.() || '').length > 0) return;

    if (index === total - 1) {
      burstAt(event.clientX, event.clientY, 14);
      return;
    }
    go(index + 1);
  });

  /* touch swipes */
  let startX = 0;
  let startY = 0;
  let pointerDown = false;

  book.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    if (event.target.closest('input, textarea, button, a, .no-advance')) return;
    startX = event.clientX;
    startY = event.clientY;
    pointerDown = true;
  });

  book.addEventListener('pointerup', (event) => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      suppressClick = true;
      go(index + (dx < 0 ? 1 : -1));
      window.setTimeout(() => { suppressClick = false; }, 420);
    }
  });

  book.addEventListener('pointercancel', () => {
    pointerDown = false;
  });

  document.addEventListener('keydown', (event) => {
    const inField = event.target.closest('input, textarea, select');
    if (inField) return;

    const onControl = event.target.closest('button, a');
    if (event.key === ' ' && onControl) return;

    if (event.key === 'ArrowRight' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey)) {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey)) {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(total - 1);
    }
  });

  /* ---------------------------------------------------------
     Gentle 3D tilt on desktop
     --------------------------------------------------------- */
  if (finePointer && !prefersReduced) {
    pages.forEach((page) => {
      const wrap = page.querySelector('.paper-wrap');
      if (!wrap) return;
      let raf = 0;

      page.addEventListener('pointermove', (event) => {
        if (!page.classList.contains('is-active') || busy) return;
        const rect = page.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          wrap.style.setProperty('--ry', `${(x * 1.15).toFixed(2)}deg`);
          wrap.style.setProperty('--rx', `${(-y * 0.8).toFixed(2)}deg`);
        });
      });

      page.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        wrap.style.setProperty('--ry', '0deg');
        wrap.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------
     Petals & confetti
     --------------------------------------------------------- */
  const PETAL_COLORS = ['#e9d7bb', '#e3c3bd', '#dfcfae', '#cbb79a', '#d9b3b0', '#f2e2cd'];
  const CONFETTI_COLORS = ['#9c4030', '#a66f7a', '#b18b52', '#59654a', '#c98f86', '#d9c49a'];

  function seedPetals(count = 11) {
    if (prefersReduced) return;
    if (lightEffects) count = Math.min(count, 3);
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal-float';
      petal.style.setProperty('--x', `${Math.random() * 100}%`);
      petal.style.setProperty('--w', `${6 + Math.random() * 9}px`);
      petal.style.setProperty('--c', PETAL_COLORS[i % PETAL_COLORS.length]);
      petal.style.setProperty('--dur', `${22 + Math.random() * 22}s`);
      petal.style.setProperty('--delay', `${-Math.random() * 34}s`);
      petal.style.setProperty('--drift', `${(Math.random() * 2 - 1) * 150}px`);
      petal.style.setProperty('--op', `${0.18 + Math.random() * 0.22}`);
      petal.style.setProperty('--blur', `${Math.random() * 1.2}px`);
      petalsLayer.appendChild(petal);
    }
  }

  function burstAt(x, y, count = 24) {
    if (prefersReduced) return;
    if (lightEffects) count = Math.min(count, 8);
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 230;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance + 70;
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.setProperty('--tx', `${tx}px`);
      piece.style.setProperty('--ty', `${ty}px`);
      piece.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
      piece.style.setProperty('--w', `${7 + Math.random() * 8}px`);
      piece.style.setProperty('--c', CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      piece.style.setProperty('--dur', `${1.4 + Math.random() * 1.2}s`);
      burstLayer.appendChild(piece);
      window.setTimeout(() => piece.remove(), 2900);
    }
  }

  const flowerBtn = $('#flowerBtn');
  if (flowerBtn) {
    flowerBtn.addEventListener('click', () => {
      const rect = flowerBtn.getBoundingClientRect();
      burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
    });
  }

  /* ---------------------------------------------------------
     Wish wall
     --------------------------------------------------------- */
  const wishForm = $('#wishForm');
  const wishName = $('#wishName');
  const wishText = $('#wishText');
  const wishCount = $('#wishCount');
  const wishHint = $('#wishHint');
  const wishWall = $('#wishWall');
  const wishNewer = $('#wishNewer');
  const wishOlder = $('#wishOlder');
  const wishRefresh = $('#wishRefresh');
  const wishPageInfo = $('#wishPageInfo');
  const wishWallStatus = $('#wishWallStatus');
  const wishSubmit = wishForm?.querySelector('[type="submit"]');

  const POSITIONS = [
    { x: '1%', y: '0%', r: -3, bg: '#f3e3b3' },
    { x: '34.5%', y: '3%', r: 2, bg: '#efd6d4' },
    { x: '68%', y: '0%', r: -1.5, bg: '#f6ecd6' },
    { x: '2%', y: '32%', r: 2.5, bg: '#dfe4cf' },
    { x: '35%', y: '35%', r: -2, bg: '#dfe7ea' },
    { x: '67.5%', y: '32%', r: 1.5, bg: '#e8d3c4' },
    { x: '0%', y: '64%', r: -1, bg: '#f3e3b3' },
    { x: '33%', y: '67%', r: 3, bg: '#efd6d4' },
    { x: '66%', y: '64%', r: -2.5, bg: '#f6ecd6' }
  ];

  let userNotes = [];
  let wallPage = 0;
  let wallHasOlder = false;
  let wallLoading = false;
  let wallRequest = 0;
  let submitting = false;
  let pendingNote = null;
  let favoriteReady = false;
  let favoriteIds = new Set();
  const favoritePending = new Set();
  let hintTimer = 0;
  const defaultHint = 'Lời nhắn được lưu trực tuyến và hiển thị công khai cho mọi người.';

  function updateWallControls() {
    wishNewer.disabled = wallLoading || wallPage === 0;
    wishOlder.disabled = wallLoading || !wallHasOlder;
    wishRefresh.disabled = wallLoading;
    wishPageInfo.textContent = `Trang ${wallPage + 1}`;
    wishWall.setAttribute('aria-busy', String(wallLoading));
  }

  async function loadWall(page = 0, isFresh = false) {
    const requestId = ++wallRequest;
    wallLoading = true;
    wishWallStatus.textContent = 'Đang tải lời nhắn…';
    updateWallControls();
    try {
      const result = await window.WishesAPI.list(page, POSITIONS.length);
      if (requestId !== wallRequest) return;
      // A previously full page can become empty after owner moderation.
      if (!result.notes.length && page > 0) return loadWall(page - 1);
      userNotes = result.notes;
      wallPage = page;
      wallHasOlder = result.hasOlder;
      favoriteReady = false;
      renderWall(isFresh);
      wishWallStatus.textContent = userNotes.length
        ? 'Lời nhắn chung của mọi người. Nhấn Làm mới để xem lời vừa gửi.'
        : 'Chưa có lời nhắn nào. Bạn ghim lời đầu tiên nhé.';
      try {
        const ids = await window.WishesAPI.liked(result.notes.map(note => note.id));
        if (requestId !== wallRequest) return;
        favoriteIds = new Set(ids);
        favoriteReady = true;
        updateFavoriteButtons();
      } catch (_) {
        if (requestId === wallRequest) wishWallStatus.textContent = 'Đã tải lời chúc, nhưng chưa tải được trạng thái yêu thích. Nhấn Làm mới để thử lại.';
      }
    } catch (error) {
      if (requestId !== wallRequest) return;
      wishWallStatus.textContent = 'Chưa tải được lời nhắn. Nhấn Làm mới để thử lại.';
    } finally {
      if (requestId === wallRequest) {
        wallLoading = false;
        updateWallControls();
      }
    }
  }

  function renderWall(isFresh = false) {
    if (!wishWall) return;

    const all = userNotes.slice(0, POSITIONS.length);
    wishWall.innerHTML = '';
    wishWall.classList.toggle('is-empty', all.length === 0);
    if (!all.length) {
      const empty = document.createElement('p');
      empty.className = 'wish-wall-empty hand';
      empty.textContent = 'Một góc giấy còn trống.\nGhim lời đầu tiên nhé.';
      wishWall.appendChild(empty);
    }

    all.forEach((note, i) => {
      const spot = POSITIONS[i];
      const card = document.createElement('article');
      card.className = 'wish-note no-advance';
      card.style.setProperty('--x', spot.x);
      card.style.setProperty('--y', spot.y);
      card.style.setProperty('--nr', `${spot.r}deg`);
      card.style.setProperty('--nbg', spot.bg);
      card.style.setProperty('--z', String(10 + all.length - i));

      const pin = document.createElement('span');
      pin.className = `pin ${i % 3 === 1 ? 'pin--blue' : i % 3 === 2 ? 'pin--gold' : 'pin--red'}`;
      pin.setAttribute('aria-hidden', 'true');

      const name = document.createElement('p');
      name.className = 'wish-note__name';
      name.textContent = note.name || 'một người bạn';

      const text = document.createElement('p');
      text.className = 'wish-note__text';
      text.textContent = note.text;
      text.title = note.text;
      text.tabIndex = 0;

      card.append(pin, name, text);
      const footer = document.createElement('div');
      footer.className = 'wish-note__footer';
      if (note.created_at) {
        const sent = document.createElement('time');
        sent.className = 'wish-note__time';
        sent.dateTime = note.created_at;
        sent.textContent = new Date(note.created_at).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        footer.appendChild(sent);
      }
      const heart = document.createElement('button');
      heart.type = 'button';
      heart.className = 'wish-heart';
      heart.dataset.favorite = note.id;
      heart.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span></span>';
      heart.addEventListener('click', async event => {
        event.stopPropagation();
        if (!favoriteReady || favoritePending.has(note.id)) return;
        favoritePending.add(note.id);
        updateFavoriteButtons();
        try {
          const result = await window.WishesAPI.favorite(note.id, !favoriteIds.has(note.id));
          result.liked ? favoriteIds.add(note.id) : favoriteIds.delete(note.id);
          const current = userNotes.find(item => item.id === note.id);
          if (current) current.favorite_count = result.favorite_count;
          wishWallStatus.textContent = result.liked ? 'Đã thả một trái tim. Bấm lại để bỏ yêu thích.' : 'Đã bỏ yêu thích lời chúc.';
        } catch (_) {
          // Reconcile in case a committed request lost its response.
          await loadWall(wallPage);
          wishWallStatus.textContent = 'Chưa xác nhận được lượt yêu thích. Đã làm mới tường; bạn kiểm tra và thử lại nhé.';
        } finally {
          favoritePending.delete(note.id);
          updateFavoriteButtons();
        }
      });
      footer.appendChild(heart);
      card.appendChild(footer);
      wishWall.appendChild(card);
    });

    updateFavoriteButtons();

    if (isFresh && wishWall.firstElementChild) {
      wishWall.firstElementChild.classList.add('is-new');
    }
  }

  function updateFavoriteButtons() {
    if (!wishWall) return;
    wishWall.querySelectorAll('[data-favorite]').forEach(button => {
      const id = button.dataset.favorite;
      const note = userNotes.find(item => item.id === id);
      const isLiked = favoriteIds.has(id);
      button.disabled = !favoriteReady || favoritePending.has(id);
      button.setAttribute('aria-pressed', String(isLiked));
      button.setAttribute('aria-label', `${isLiked ? 'Bỏ yêu thích' : 'Yêu thích'} lời chúc gửi ${note?.name || 'bạn'}; ${note?.favorite_count || 0} lượt`);
      button.title = isLiked ? 'Bỏ yêu thích' : 'Yêu thích lời chúc';
      button.querySelector('span').textContent = String(note?.favorite_count || 0);
    });
  }

  function updateCount() {
    if (!wishCount || !wishText) return;
    const len = wishText.value.length;
    wishCount.textContent = `${len} / 140`;
    wishCount.classList.toggle('is-near', len >= 120);
  }

  function setHint(message, kind = '') {
    if (!wishHint) return;
    window.clearTimeout(hintTimer);
    wishHint.textContent = message;
    wishHint.classList.toggle('is-error', kind === 'error');
    wishHint.classList.toggle('is-ok', kind === 'ok');
    if (kind === 'ok') {
      hintTimer = window.setTimeout(() => {
        wishHint.textContent = defaultHint;
        wishHint.classList.remove('is-error', 'is-ok');
      }, 5000);
    }
  }

  function setFieldError(isError) {
    const field = wishText.closest('.field');
    if (!field) return;
    field.classList.toggle('is-error', isError);
    wishText.setAttribute('aria-invalid', String(isError));
    if (isError) {
      window.setTimeout(() => field.classList.remove('is-error'), 420);
    }
  }

  if (wishForm && wishWall) {
    loadWall();
    updateCount();
    wishNewer.addEventListener('click', () => loadWall(wallPage - 1));
    wishOlder.addEventListener('click', () => loadWall(wallPage + 1));
    wishRefresh.addEventListener('click', () => loadWall(0));

    wishText.addEventListener('input', () => {
      updateCount();
      setFieldError(false);
      if (wishHint.classList.contains('is-error')) setHint(defaultHint);
    });

    wishName.addEventListener('input', () => {
      if (wishHint.classList.contains('is-error')) setHint(defaultHint);
    });

    wishText.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        wishForm.requestSubmit();
      }
    });

    wishForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting) return;

      const message = wishText.value.trim();
      if (!message) {
        setFieldError(true);
        setHint('Viết một chút gì đó trước khi ghim nhé.', 'error');
        wishText.focus();
        return;
      }

      const name = wishName.value.trim() || 'một người bạn';
      if (name.length > 24 || message.length > 140) {
        setHint('Người nhận tối đa 24 ký tự, lời nhắn tối đa 140 ký tự nhé.', 'error');
        return;
      }
      if (!pendingNote || pendingNote.name !== name || pendingNote.text !== message) {
        pendingNote = { id: crypto.randomUUID(), name, text: message };
      }
      submitting = true;
      wishSubmit.disabled = true;
      wishName.readOnly = true;
      wishText.readOnly = true;
      wishForm.setAttribute('aria-busy', 'true');
      setHint('Đang lưu lời nhắn…');
      try {
        const saved = await window.WishesAPI.save(pendingNote);
        pendingNote = null;
        wishForm.reset();
        updateCount();
        setFieldError(false);
        setHint('Đã lưu lời nhắn. Mọi người đều có thể đọc trên tường.', 'ok');
        // Show the confirmed record even if the following read loses its connection.
        ++wallRequest;
        wallLoading = false;
        wallPage = 0;
        wallHasOlder = true;
        userNotes = [saved, ...userNotes.filter(note => note.id !== saved.id)].slice(0, POSITIONS.length);
        renderWall(true);
        await loadWall(0, true);
        const rect = wishWall.getBoundingClientRect();
        burstAt(rect.left + rect.width * 0.25, rect.top + Math.min(rect.height * 0.3, 140), 18);
      } catch (error) {
        setHint('Chưa xác nhận được lời nhắn đã lưu. Nội dung vẫn ở đây, bạn bấm ghim để thử lại nhé.', 'error');
      } finally {
        submitting = false;
        wishSubmit.disabled = false;
        wishName.readOnly = false;
        wishText.readOnly = false;
        wishForm.removeAttribute('aria-busy');
      }
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  seedPetals();
  init();
})();
