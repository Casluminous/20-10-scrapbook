(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    });

    index = next;
    updateChrome();
    announce();
    syncInert();
    setHash(index);

    window.setTimeout(() => {
      from.style.zIndex = '';
      to.style.zIndex = '';
      busy = false;
    }, 960);
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
  const STORAGE_KEY = 'vietnamese-womens-day-wishes-v1';
  const MAX_USER_NOTES = 5;
  const wishForm = $('#wishForm');
  const wishName = $('#wishName');
  const wishText = $('#wishText');
  const wishCount = $('#wishCount');
  const wishHint = $('#wishHint');
  const wishWall = $('#wishWall');

  const SAMPLES = [
    { name: 'Gửi mẹ', text: 'Con biết mẹ mệt. Con chỉ mong mẹ nói ra.' },
    { name: 'Gửi em', text: 'Cứ sống như em muốn. Chị vẫn ở đây.' },
    { name: 'Gửi chính mình', text: 'Hôm nay, mình được ưu tiên mình một chút.' },
    { name: 'Gửi bạn', text: 'Cảm ơn vì đã dịu dàng với thế giới này.' },
    { name: 'Gửi bà', text: 'Cháu nhớ mùi trầu, tiếng quạt, và cả mùa hè đó.' },
    { name: 'Gửi chị', text: 'Chị đã gánh giúp em nhiều thứ mà em chưa kịp cảm ơn.' },
    { name: 'Gửi cô', text: 'Cô dạy em đọc chữ, và cả cách tử tế.' },
    { name: 'Gửi đồng nghiệp', text: 'Cảm ơn vì những ngày bạn đã đỡ giúp mình.' },
    { name: 'Gửi người xa', text: 'Mong nơi ấy có người nhớ mình vào tháng Mười.' }
  ];

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

  let userNotes = loadNotes();
  let lastSubmitAt = 0;
  let hintTimer = 0;
  const defaultHint = 'Lời nhắn được lưu trên trình duyệt của bạn. Tường giữ 5 lời mới nhất.';

  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((note) => note && typeof note.name === 'string' && typeof note.text === 'string')
        .map((note) => ({
          name: note.name.slice(0, 24).trim(),
          text: note.text.slice(0, 140).trim()
        }))
        .filter((note) => note.text.length > 0)
        .slice(-MAX_USER_NOTES);
    } catch (err) {
      console.warn('Không đọc được tường lời chúc đã lưu.', err);
      return [];
    }
  }

  function saveNotes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userNotes));
      return true;
    } catch (err) {
      console.warn('Không lưu được tường lời chúc.', err);
      return false;
    }
  }

  function renderWall(isFresh = false) {
    if (!wishWall) return;

    const all = [...userNotes].reverse().concat(SAMPLES).slice(0, POSITIONS.length);
    wishWall.innerHTML = '';

    all.forEach((note, i) => {
      const spot = POSITIONS[i];
      const card = document.createElement('article');
      card.className = 'wish-note';
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

      card.append(pin, name, text);
      wishWall.appendChild(card);
    });

    if (isFresh && wishWall.firstElementChild) {
      wishWall.firstElementChild.classList.add('is-new');
    }
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
    if (kind) {
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
    renderWall();
    updateCount();

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

    wishForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (Date.now() - lastSubmitAt < 500) return;

      const message = wishText.value.trim();
      if (!message) {
        setFieldError(true);
        setHint('Viết một chút gì đó trước khi ghim nhé.', 'error');
        wishText.focus();
        return;
      }

      lastSubmitAt = Date.now();
      const name = wishName.value.trim() || 'một người bạn';
      userNotes.push({ name, text: message });
      userNotes = userNotes.slice(-MAX_USER_NOTES);

      const saved = saveNotes();
      renderWall(true);
      wishForm.reset();
      updateCount();
      setFieldError(false);
      setHint(
        saved ? 'Đã ghim lời nhắn của bạn lên tường.' : 'Đã ghim lời nhắn, nhưng trình duyệt không cho lưu lâu dài.',
        saved ? 'ok' : 'error'
      );

      const rect = wishWall.getBoundingClientRect();
      burstAt(rect.left + rect.width * 0.25, rect.top + Math.min(rect.height * 0.3, 140), 18);
    });
  }

  /* ---------------------------------------------------------
     Ambient audio
     --------------------------------------------------------- */
  const bgMusic = $('#bgMusic');
  const soundToggle = $('#soundToggle');
  const MUSIC_VOLUME = 0.32;
  let musicFadeFrame = 0;
  let userPausedMusic = false;

  function setSoundUI(isPlaying) {
    if (!soundToggle) return;
    soundToggle.classList.toggle('is-playing', isPlaying);
    soundToggle.setAttribute('aria-pressed', String(isPlaying));
    soundToggle.setAttribute('aria-label', isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  }

  function fadeMusic(target, duration, done) {
    if (!bgMusic) return;
    cancelAnimationFrame(musicFadeFrame);
    const start = bgMusic.volume;
    const startedAt = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - k, 2);
      bgMusic.volume = Math.min(1, Math.max(0, start + (target - start) * eased));
      if (k < 1) musicFadeFrame = requestAnimationFrame(tick);
      else if (done) done();
    };
    musicFadeFrame = requestAnimationFrame(tick);
  }

  function removeFirstGesture() {
    window.removeEventListener('click', onFirstGesture, true);
    window.removeEventListener('keydown', onFirstGesture, true);
  }

  async function playMusic() {
    if (!bgMusic) return false;
    if (!bgMusic.paused) {
      setSoundUI(true);
      return true;
    }
    try {
      bgMusic.volume = Math.min(bgMusic.volume, 0.08);
      await bgMusic.play();
      setSoundUI(true);
      fadeMusic(MUSIC_VOLUME, 1400);
      removeFirstGesture();
      return true;
    } catch (err) {
      setSoundUI(false);
      return false;
    }
  }

  function pauseMusic() {
    if (!bgMusic) return;
    userPausedMusic = true;
    removeFirstGesture();
    fadeMusic(0, 260, () => bgMusic.pause());
    setSoundUI(false);
  }

  function onFirstGesture(event) {
    if (event.target.closest && event.target.closest('#soundToggle')) return;
    removeFirstGesture();
    if (!userPausedMusic) playMusic();
  }

  if (bgMusic) {
    bgMusic.loop = true;
    bgMusic.volume = 0;
    setSoundUI(false);

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
          userPausedMusic = false;
          playMusic();
        } else {
          pauseMusic();
        }
      });
    }

    bgMusic.addEventListener('play', () => setSoundUI(true));
    bgMusic.addEventListener('pause', () => setSoundUI(false));
    bgMusic.addEventListener('error', () => {
      if (soundToggle) {
        soundToggle.classList.add('is-unavailable');
        soundToggle.setAttribute('aria-disabled', 'true');
        soundToggle.setAttribute('aria-label', 'Không tải được nhạc nền');
      }
      setSoundUI(false);
    });

    playMusic().then((started) => {
      if (!started) {
        window.addEventListener('click', onFirstGesture, true);
        window.addEventListener('keydown', onFirstGesture, true);
      }
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  seedPetals();
  init();
})();
