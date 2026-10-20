(() => {
  'use strict';
  const audio = document.querySelector('#bgMusic');
  const toggle = document.querySelector('#soundToggle');
  const controls = document.querySelector('#musicControls');
  const settings = document.querySelector('#musicSettings');
  const panel = document.querySelector('#musicPanel');
  const slider = document.querySelector('#musicVolume');
  const output = document.querySelector('#musicVolumeValue');
  if (!audio || !toggle || !slider) return;
  const storageKey = 'scrapbook-music-volume-v1';
  let volume = 0.22;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null && Number.isFinite(Number(saved))) volume = Math.min(1, Math.max(0, Number(saved) / 100));
  } catch (_) { /* Volume still works without storage. */ }
  let context = null;
  let gain = null;
  let attemptedGraph = false;
  let fadeFrame = 0;
  let userPaused = false;
  let playRequest = 0;

  function graph() {
    if (attemptedGraph) return;
    attemptedGraph = true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.value = volume;
      context.createMediaElementSource(audio).connect(gain);
      gain.connect(context.destination);
      audio.volume = 1;
    } catch (_) {
      context = null;
      gain = null;
    }
  }

  function level(value) {
    if (gain) gain.gain.value = value;
    else audio.volume = value;
  }

  function soundUI() {
    const playing = !audio.paused && !userPaused && (!context || context.state === 'running');
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  }

  function volumeUI() {
    const percent = Math.round(volume * 100);
    slider.value = String(percent);
    slider.setAttribute('aria-valuetext', `${percent}%`);
    output.value = `${percent}%`;
    output.textContent = `${percent}%`;
  }

  function removeGesture() {
    window.removeEventListener('click', firstGesture, true);
    window.removeEventListener('keydown', firstGesture, true);
  }

  async function play() {
    const requestId = ++playRequest;
    userPaused = false;
    graph();
    cancelAnimationFrame(fadeFrame);
    level(0);
    try {
      await Promise.all([context?.resume(), audio.play()]);
      if (requestId !== playRequest || userPaused) return false;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min(1, (now - start) / 900);
        level(volume * (1 - Math.pow(1 - progress, 2)));
        if (progress < 1) fadeFrame = requestAnimationFrame(tick);
      };
      fadeFrame = requestAnimationFrame(tick);
      removeGesture();
      soundUI();
      return true;
    } catch (_) {
      soundUI();
      return false;
    }
  }

  function pause() {
    ++playRequest;
    userPaused = true;
    cancelAnimationFrame(fadeFrame);
    audio.pause();
    removeGesture();
    soundUI();
  }

  function firstGesture(event) {
    if (event.target.closest?.('#musicControls')) return;
    removeGesture();
    if (!userPaused) play();
  }

  function closePanel(restoreFocus = false) {
    panel.hidden = true;
    settings.setAttribute('aria-expanded', 'false');
    if (restoreFocus) settings.focus();
  }

  toggle.addEventListener('click', () => {
    if (audio.paused || userPaused) play();
    else pause();
  });
  settings.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    settings.setAttribute('aria-expanded', String(opening));
    if (opening) slider.focus();
  });
  document.addEventListener('click', event => {
    if (!controls.contains(event.target)) closePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closePanel(true);
  });
  slider.addEventListener('input', () => {
    volume = Math.max(0, Math.min(1, Number(slider.value) / 100));
    cancelAnimationFrame(fadeFrame);
    level(volume);
    volumeUI();
    try { localStorage.setItem(storageKey, String(Math.round(volume * 100))); } catch (_) { /* Optional. */ }
  });
  audio.addEventListener('play', soundUI);
  audio.addEventListener('pause', soundUI);
  audio.addEventListener('error', () => {
    toggle.classList.add('is-unavailable');
    toggle.disabled = true;
    slider.disabled = true;
    toggle.setAttribute('aria-label', 'Không tải được nhạc nền');
  });
  audio.loop = true;
  audio.volume = volume;
  volumeUI();
  soundUI();
  window.addEventListener('click', firstGesture, true);
  window.addEventListener('keydown', firstGesture, true);
  play();
})();
