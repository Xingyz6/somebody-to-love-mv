/* Somebody to Love — 播放、字幕、控件 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const audio = $('audio');
  const stage = $('stage');
  const lyricEl = $('lyric');
  const enEl = $('lyricEn');
  const zhEl = $('lyricZh');
  const annoEl = $('anno');
  const annoText = $('annoText');
  const secLabel = $('secLabel');
  const titleCard = $('titleCard');
  const gate = $('gate');
  const seek = $('seek');
  const seekFill = $('seekFill');
  const seekHead = $('seekHead');
  const clock = $('clock');
  const btnPlay = $('btnPlay');
  const essay = $('essay');
  const essayBody = $('essayBody');
  const transport = $('transport');

  const clamp = (v, a, b) => Math.min(b || 1, Math.max(a || 0, v));
  const fmt = s => {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- 音频 ---------- */
  let ac = null, analyser = null, freqData = new Uint8Array(64), level = 0;
  let useAnalyser = location.protocol !== 'file:';

  function initAudio() {
    if (!useAnalyser || ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaElementSource(audio);
      analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.76;
      src.connect(analyser);
      analyser.connect(ac.destination);
      freqData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      analyser = null;
    }
  }

  function audioState(t) {
    if (analyser) {
      analyser.getByteFrequencyData(freqData);
      let s = 0;
      for (let i = 0; i < 48; i++) s += freqData[i];
      level = s / (48 * 255);
      if (audio.paused || level < 0.02) {
        // 暂停中，或 Safari 没把数据交给 WebAudio：用确定性包络兜底
        const tt = audio.currentTime || t;
        for (let i = 0; i < 64; i++) {
          freqData[i] = 26 + 74 * Math.abs(Math.sin(tt * 1.3 + i * 0.3)) * (1 - i / 90);
        }
        level = audio.paused ? 0.26 : 0.32;
      }
      return { level: level, freq: freqData };
    }
    // 无 WebAudio（比如直接 file:// 打开）：用确定性包络，画面照常有反应
    const playing = !audio.paused;
    for (let i = 0; i < 64; i++) {
      const v = Math.abs(Math.sin(t * 1.9 + i * 0.23)) * (1 - i / 90);
      freqData[i] = playing ? 30 + v * 190 : 20 + v * 30;
    }
    level = playing ? 0.42 + 0.26 * Math.abs(Math.sin(t * 2.7)) : 0.12;
    return { level: level, freq: freqData };
  }

  /* ---------- 字幕 ---------- */
  let curIdx = -2, token = 0, lastAnno = null, curSec = null;

  function markup(s, mark) {
    let out = esc(s);
    if (mark) {
      const safe = mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp('(' + safe + ')', 'i'), '<em>$1</em>');
    }
    return out;
  }

  function chaosAt(t) { return clamp((t - 205) / 85); }

  let baseT = { x: 0, y: 0, r: 0 }, chaos = 0;
  const ghost = $('lyricGhost');

  function renderLine(line) {
    ghost.innerHTML = enEl.innerHTML;
    enEl.innerHTML = line.en.map(s => '<span class="l">' + markup(s, line.mark) + '</span>').join('');
    zhEl.textContent = line.zh || '';
    lyricEl.classList.toggle('small', !!line.small);

    chaos = chaosAt(line.t);
    baseT.x = (rnd(line.t * 3.7) - 0.5) * chaos * 150;
    baseT.y = (rnd(line.t * 8.1) - 0.5) * chaos * 80;
    baseT.r = (rnd(line.t * 5.3) - 0.5) * chaos * 12;
    enEl.style.fontSize = chaos > 0.02 ? 'calc(clamp(24px,3.5vw,56px) * ' + (1 + chaos * 0.55).toFixed(2) + ')' : '';
    ghost.style.opacity = chaos > 0.35 ? (chaos - 0.35) * 0.55 : 0;
  }

  /* 逐帧抖动：越到后面越站不住 */
  function jitter(t) {
    if (chaos <= 0.02) {
      lyricEl.classList.remove('mad');
      lyricEl.style.transform = '';
      return;
    }
    lyricEl.classList.toggle('mad', chaos > 0.4);
    const jx = (rnd(Math.floor(t * 22)) - 0.5) * chaos * chaos * 34;
    const jy = (rnd(Math.floor(t * 22) + 11) - 0.5) * chaos * chaos * 22;
    lyricEl.style.transform = 'translate(' + (baseT.x + jx).toFixed(1) + 'px,' + (baseT.y + jy).toFixed(1) + 'px) rotate(' + baseT.r.toFixed(2) + 'deg)';
  }

  function showLine(line) {
    const my = ++token;
    if (!line) {
      lyricEl.classList.remove('in');
      setTimeout(() => { if (my === token) { enEl.innerHTML = ''; zhEl.textContent = ''; } }, 150);
      return;
    }
    if (line.last) {
      lyricEl.classList.remove('in');
      return;
    }
    lyricEl.classList.remove('in');
    setTimeout(() => {
      if (my !== token) return;
      renderLine(line);
      lyricEl.classList.add('in');
    }, 140);
  }

  function setAnno(text) {
    if (!text) {
      annoEl.classList.remove('on');
      lastAnno = null;
      return;
    }
    if (text === lastAnno) return;
    lastAnno = text;
    annoText.textContent = text;
    annoEl.classList.add('on');
  }

  function lineAt(t) {
    let idx = -1;
    for (let i = 0; i < LINES.length; i++) {
      if (t >= LINES[i].t - 0.12) idx = i; else break;
    }
    return idx;
  }

  function syncText(t) {
    const sec = MV.sectionAt(t);
    if (sec !== curSec) {
      curSec = sec;
      secLabel.textContent = sec.label;
      setAnno(sec.note);
    }
    titleCard.classList.toggle('on', t > 4 && t < 23);
    stage.classList.toggle('fade-ui', t > 287.5);

    const idx = t > 288 ? -1 : lineAt(t);
    if (idx !== curIdx) {
      curIdx = idx;
      const line = idx >= 0 ? LINES[idx] : null;
      showLine(line);
      if (line && line.note) setAnno(line.note);
      else if (line) setAnno(sec.note);
    }
  }

  /* ---------- 循环 ---------- */
  let raf = 0;
  function tick() {
    const t = overrideT !== null ? overrideT : (audio.currentTime || 0);
    const A = audioState(t);
    MV.render(t, A);
    syncText(t);
    jitter(t);

    const d = audio.duration || SONG.dur;
    const k = clamp(t / d);
    seekFill.style.width = (k * 100) + '%';
    seekHead.style.left = (k * 100) + '%';
    clock.textContent = fmt(t) + ' / ' + fmt(d);

    raf = requestAnimationFrame(tick);
  }

  /* ---------- 控件 ---------- */
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';

  function setPlaying(p) {
    btnPlay.innerHTML = p ? ICON_PAUSE : ICON_PLAY;
    btnPlay.setAttribute('aria-label', p ? '暂停' : '播放');
  }

  function toggle() {
    if (audio.paused) {
      if (ac && ac.state === 'suspended') ac.resume();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  btnPlay.addEventListener('click', toggle);
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('error', () => {
    clock.textContent = '音频未加载';
  });

  $('btnStart').addEventListener('click', () => {
    gate.classList.add('off');
    initAudio();
    if (ac && ac.state === 'suspended') ac.resume();
    audio.play().catch(() => {
      // 浏览器还没给播放许可：保持暂停图标，点播放键再试
      setPlaying(false);
    });
  });

  $('btnFs').addEventListener('click', () => {
    if (!document.fullscreenElement) stage.requestFullscreen && stage.requestFullscreen();
    else document.exitFullscreen();
  });

  $('btnEssay').addEventListener('click', () => {
    essay.classList.add('open');
    $('btnEssay').classList.add('active');
  });
  $('btnEssayClose').addEventListener('click', () => {
    essay.classList.remove('open');
    $('btnEssay').classList.remove('active');
  });

  $('btnAnno').addEventListener('click', function () {
    const off = annoEl.style.display === 'none';
    annoEl.style.display = off ? '' : 'none';
    this.classList.toggle('active', !off);
  });

  let scrubbing = false;
  function seekTo(clientX) {
    const r = seek.getBoundingClientRect();
    const k = clamp((clientX - r.left) / r.width);
    const d = audio.duration || SONG.dur;
    audio.currentTime = k * d;
    curIdx = -2;
  }
  seek.addEventListener('pointerdown', e => {
    scrubbing = true;
    seek.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  });
  seek.addEventListener('pointermove', e => { if (scrubbing) seekTo(e.clientX); });
  seek.addEventListener('pointerup', () => { scrubbing = false; });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowRight') { audio.currentTime = Math.min((audio.duration || SONG.dur), audio.currentTime + 5); curIdx = -2; }
    else if (e.code === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); curIdx = -2; }
    else if (e.key === 'f' || e.key === 'F') { $('btnFs').click(); }
    else if (e.key === 'Escape') { essay.classList.remove('open'); $('btnEssay').classList.remove('active'); }
  });

  let idleTimer = 0;
  document.addEventListener('mousemove', () => {
    transport.classList.add('show');
    document.body.style.cursor = '';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      transport.classList.remove('show');
      if (!audio.paused) document.body.style.cursor = 'none';
    }, 2400);
  });

  /* ---------- 解析 ---------- */
  essayBody.innerHTML = ESSAY.map(s => '<h3>' + esc(s.h) + '</h3><p>' + esc(s.p) + '</p>').join('');

  /* ---------- 启动 ---------- */
  const q = new URLSearchParams(location.search);
  const overrideT = q.has('t') ? parseFloat(q.get('t')) : null;

  function resize() {
    MV.resize();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  setPlaying(false);
  $('clock').textContent = '0:00 / ' + fmt(SONG.dur);
  resize();

  // 允许外部直接定位（方便验收截图）
  if (overrideT !== null) {
    audio.currentTime = overrideT;
    gate.classList.add('off');
    curIdx = -2;
  }
  if (q.has('essay')) {
    essay.classList.add('open');
  }

  tick();
})();
