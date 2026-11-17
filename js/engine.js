/* Somebody to Love — canvas 2D 渲染引擎
   情绪线：窒息(0-98) → 被指认(98-158) → 撒手(158-297)
   所有画面只由时间 t 与音频包络决定。
*/
window.MV = (function () {
  'use strict';

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, grain = null;

  const BONE = '233,227,214';
  const GOLD = '200,162,83';
  const BLOOD = '139,47,36';

  const clamp = (v, a, b) => {
    const lo = a === undefined ? 0 : a, hi = b === undefined ? 1 : b;
    return v < lo ? lo : v > hi ? hi : v;
  };
  const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };
  const rgba = (c, a) => 'rgba(' + c + ',' + a + ')';
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ---------- 尺寸 ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || window.innerWidth;
    H = cv.clientHeight || window.innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildGrain();
  }

  function buildGrain() {
    const s = 180;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const img = g.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 90;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grain = ctx.createPattern(c, 'repeat');
  }

  function sectionAt(t) {
    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      if (t >= SECTIONS[i].t0) return SECTIONS[i];
    }
    return SECTIONS[0];
  }

  let off = null;
  function getOff() {
    if (!off) off = document.createElement('canvas');
    if (off.width !== cv.width || off.height !== cv.height) {
      off.width = cv.width;
      off.height = cv.height;
    }
    return off;
  }

  const prog = (t, s) => clamp((t - s.t0) / Math.max(0.001, s.t1 - s.t0));

  /* ---------- 情绪参数 ---------- */
  function madAt(t) {
    if (t < 177.6) return 0;
    const k = (t - 177.6) / (297.0 - 177.6);
    let m = Math.pow(clamp(k), 0.8) * 0.95;
    if (t > 262) m = Math.min(1, m + (t - 262) / 30 * 0.3);
    return clamp(m);
  }
  function dreadAt(t) {
    if (t < 25.6) return 0;
    return clamp((t - 25.6) / 132.0);
  }

  /* ---------- 基础图形 ---------- */
  function line(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function haze(cx, cy, rx, ry, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, rgba(BONE, a));
    g.addColorStop(0.28, rgba(GOLD, a * 0.34));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rx, cy - rx, rx * 2, rx * 2);
    ctx.restore();
  }

  function pillar(cx, yBottom, yTop, w, a, col) {
    if (a <= 0) return;
    // 外辉光
    const gg = ctx.createLinearGradient(0, yTop, 0, yBottom);
    gg.addColorStop(0, rgba(col, 0));
    gg.addColorStop(0.4, rgba(col, a * 0.12));
    gg.addColorStop(1, rgba(col, a * 0.3));
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(cx - w * 9, yBottom);
    ctx.lineTo(cx - w * 1.4, yTop);
    ctx.lineTo(cx + w * 1.4, yTop);
    ctx.lineTo(cx + w * 9, yBottom);
    ctx.closePath();
    ctx.fill();

    const g = ctx.createLinearGradient(0, yTop, 0, yBottom);
    g.addColorStop(0, 'rgba(232,224,203,0)');
    g.addColorStop(0.32, 'rgba(232,224,203,' + (a * 0.3) + ')');
    g.addColorStop(1, 'rgba(240,232,210,' + (a * 0.8) + ')');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w * 3.2, yBottom);
    ctx.lineTo(cx - w * 0.5, yTop);
    ctx.lineTo(cx + w * 0.5, yTop);
    ctx.lineTo(cx + w * 3.2, yBottom);
    ctx.closePath();
    ctx.fill();

    const g2 = ctx.createLinearGradient(0, yTop, 0, yBottom);
    g2.addColorStop(0, rgba(BONE, 0));
    g2.addColorStop(0.45, rgba(BONE, a * 0.55));
    g2.addColorStop(1, rgba(BONE, a * 0.95));
    ctx.fillStyle = g2;
    ctx.fillRect(cx - w * 0.2, yTop, w * 0.4, yBottom - yTop);
  }

  /* 地面：只留水平线与两条侧线 */
  function floorLines(vx, vy, a, squeeze, n) {
    if (a <= 0) return;
    ctx.strokeStyle = rgba(BONE, a);
    ctx.lineWidth = 1;
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      const y = vy + (H * 1.06 - vy) * Math.pow(k, squeeze);
      line(-W * 0.1, y, W * 1.1, y);
    }
    ctx.strokeStyle = rgba(BONE, a * 0.5);
    line(W * 0.02, H * 1.04, vx, vy);
    line(W * 0.98, H * 1.04, vx, vy);
  }

  /* 拱：只有最外层落柱 */
  function arches(vx, vy, R, a, n, flat) {
    if (a <= 0) return;
    for (let i = 1; i <= n; i++) {
      const r = R * i / n;
      ctx.strokeStyle = rgba(BONE, a * (0.45 + 0.55 * i / n));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(vx, vy, r, r * flat, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(BONE, a * 0.7);
    line(vx - R, vy, vx - R, H * 1.02);
    line(vx + R, vy, vx + R, H * 1.02);
  }

  /* 人：长袍剪影（唱诗班/修士的轮廓）。kneel 0-1 */
  function figure(x, yBase, h, a, kneel, lean) {
    if (a <= 0) return null;
    const k = clamp(kneel);
    const hh = h * (1 - 0.16 * k);
    const cx = x + lean * hh * 0.06;
    const headRy = hh * 0.058, headRx = hh * 0.045;
    const headY = yBase - hh + headRy;
    const shoulderY = headY + headRy * 1.5;
    const waistY = yBase - hh * 0.42;
    const shW = hh * 0.128, waistW = hh * 0.083, hemW = hh * 0.108;

    // 背后的光
    haze(cx, headY + hh * 0.34, hh * 0.44, hh * 0.54, 0.05 * a);

    ctx.save();
    ctx.fillStyle = rgba(BONE, 0.09 * a);

    // 头
    ctx.beginPath();
    ctx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 颈
    ctx.fillRect(cx - headRx * 0.6, headY + headRy * 0.5, headRx * 1.2, headRy * 1.1);

    // 袍身
    ctx.beginPath();
    ctx.moveTo(cx - shW, shoulderY);
    ctx.bezierCurveTo(cx - shW * 1.03, shoulderY + hh * 0.1, cx - waistW * 1.12, waistY - hh * 0.06, cx - waistW, waistY);
    ctx.bezierCurveTo(cx - waistW * 1.06, waistY + hh * 0.16, cx - hemW * 0.98, yBase - hh * 0.12, cx - hemW, yBase);
    ctx.lineTo(cx + hemW, yBase);
    ctx.bezierCurveTo(cx + hemW * 0.98, yBase - hh * 0.12, cx + waistW * 1.06, waistY + hh * 0.16, cx + waistW, waistY);
    ctx.bezierCurveTo(cx + waistW * 1.12, waistY - hh * 0.06, cx + shW * 1.03, shoulderY + hh * 0.1, cx + shW, shoulderY);
    ctx.quadraticCurveTo(cx, shoulderY - hh * 0.042, cx - shW, shoulderY);
    ctx.closePath();
    ctx.fill();

    // 手臂的褶皱
    ctx.strokeStyle = rgba(BONE, 0.1 * a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - shW * 0.86, shoulderY + hh * 0.02);
    ctx.bezierCurveTo(cx - shW * 0.92, shoulderY + hh * 0.12, cx - waistW * 0.95, waistY, cx - waistW * 0.8, waistY + hh * 0.06);
    ctx.moveTo(cx + shW * 0.86, shoulderY + hh * 0.02);
    ctx.bezierCurveTo(cx + shW * 0.92, shoulderY + hh * 0.12, cx + waistW * 0.95, waistY, cx + waistW * 0.8, waistY + hh * 0.06);
    ctx.stroke();
    ctx.restore();

    // 轮廓：两圈（柔边 + 实线）
    ctx.strokeStyle = rgba(BONE, 0.08 * a);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - shW, shoulderY);
    ctx.bezierCurveTo(cx - shW * 1.03, shoulderY + hh * 0.1, cx - waistW * 1.12, waistY - hh * 0.06, cx - waistW, waistY);
    ctx.bezierCurveTo(cx - waistW * 1.06, waistY + hh * 0.16, cx - hemW * 0.98, yBase - hh * 0.12, cx - hemW, yBase);
    ctx.stroke();

    ctx.strokeStyle = rgba(BONE, 0.26 * a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - shW, shoulderY);
    ctx.bezierCurveTo(cx - shW * 1.03, shoulderY + hh * 0.1, cx - waistW * 1.12, waistY - hh * 0.06, cx - waistW, waistY);
    ctx.bezierCurveTo(cx - waistW * 1.06, waistY + hh * 0.16, cx - hemW * 0.98, yBase - hh * 0.12, cx - hemW, yBase);
    ctx.lineTo(cx + hemW, yBase);
    ctx.bezierCurveTo(cx + hemW * 0.98, yBase - hh * 0.12, cx + waistW * 1.06, waistY + hh * 0.16, cx + waistW, waistY);
    ctx.bezierCurveTo(cx + waistW * 1.12, waistY - hh * 0.06, cx + shW * 1.03, shoulderY + hh * 0.1, cx + shW, shoulderY);
    ctx.stroke();

    // 胸口的核
    const cy = shoulderY + hh * 0.1;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hh * 0.075);
    rg.addColorStop(0, rgba(GOLD, 0.5 * a));
    rg.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, hh * 0.075, 0, Math.PI * 2);
    ctx.fill();

    return { cx: cx, cy: cy, h: hh };
  }

  /* 胸口的声带 */
  function voice(cy, cx, halfW, freq, a, scale) {
    if (a <= 0) return;
    const n = 40;
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const f = (freq[Math.floor(k * 26)] || 0) / 255;
      const w = f * scale * Math.sin(Math.PI * k * 0.96);
      top.push([cx - halfW + k * halfW * 2, cy - w]);
      bot.push([cx - halfW + k * halfW * 2, cy + w * 0.8]);
    }
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (let i = 1; i < top.length; i++) ctx.lineTo(top[i][0], top[i][1]);
    for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
    ctx.fillStyle = rgba(GOLD, a * 0.18);
    ctx.fill();
    ctx.strokeStyle = rgba(BONE, a * 0.55);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function rings(cx, cy, R, a, n, phase, flat) {
    if (a <= 0) return;
    for (let i = 0; i < n; i++) {
      const k = ((i / n) + phase) % 1;
      const r = R * (0.08 + k * 0.95);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * flat, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(BONE, a * (1 - k) * 0.75);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* 众声：两侧涌进来的文字墙 */
  function crowd(t, p, a) {
    if (a <= 0) return;
    const line = "THEY SAY I'M CRAZY";
    ctx.save();
    ctx.font = '600 9px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    for (let col = 0; col < 6; col++) {
      const side = col % 2 ? 1 : -1;
      const k = Math.floor(col / 2) / 3;
      const depth = (k + p * 0.5 + rnd(col) * 0.15) % 1;
      const inset = 0.03 + depth * (0.28 - 0.22 * p);
      const x = side < 0 ? W * inset : W * (1 - inset);
      const step = 26;
      for (let j = 0, y = -20; y < H + 20; y += step, j++) {
        const jitter = (rnd(col * 31 + j) * 2 - 1) * 3.5;
        ctx.fillStyle = rgba(BONE, a * (0.55 - depth * 0.32) * (0.45 + rnd(col + j) * 0.55));
        ctx.fillText(line, x + jitter, y + Math.sin(t * 0.3 + col) * 2);
      }
    }
    ctx.restore();
  }


  /* 台阶：劳作的具象 */
  function steps(t, p, a) {
    if (a <= 0) return;
    const rows = 7;
    ctx.strokeStyle = rgba(BONE, a);
    ctx.lineWidth = 1;
    for (let i = 0; i < rows; i++) {
      const k = i / rows;
      const y = H * (0.68 + k * 0.34);
      const inset = W * (0.16 - k * 0.06);
      const grow = smooth(clamp(p * 1.4 - k * 0.3));
      if (grow <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(inset, y);
      ctx.lineTo(inset + (W - inset * 2) * grow, y);
      ctx.stroke();
      // 台阶立面
      ctx.strokeStyle = rgba(BONE, a * 0.5);
      ctx.beginPath();
      ctx.moveTo(inset, y);
      ctx.lineTo(inset, y + H * 0.048);
      ctx.moveTo(W - inset, y);
      ctx.lineTo(W - inset, y + H * 0.048);
      ctx.stroke();
      ctx.strokeStyle = rgba(BONE, a);
    }
  }

  /* 空气里的浮尘 */
  function dust(t, a) {
    for (let i = 0; i < 46; i++) {
      const x = (rnd(i * 3.1) * 1.12 - 0.06) * W;
      const drift = (t * (0.003 + rnd(i) * 0.008) + rnd(i * 7.7)) % 1;
      const y = H * (1.08 - drift * 1.16);
      const s = 0.5 + rnd(i * 2.3) * 1.5;
      ctx.fillStyle = rgba(BONE, a * (0.15 + 0.55 * rnd(i * 5.5)));
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* 牢房栅格 */
  function cell(a, brk, tilt) {
    if (a <= 0) return;
    const n = 9;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(tilt);
    ctx.translate(-W / 2, -H / 2);
    for (let i = 0; i <= n; i++) {
      const x = W * (i / n);
      const alive = 1 - brk;
      for (let s = 0; s < 7; s++) {
        if (rnd(i * 31 + s * 7) > alive) continue;
        const y0 = H * (s / 7), y1 = H * ((s + 1) / 7);
        const off = brk * (rnd(i * 13 + s) - 0.5) * 150;
        ctx.strokeStyle = rgba(BONE, a * (0.8 + 0.2 * rnd(i + s)));
        ctx.lineWidth = 1.4;
        line(x + off, y0, x + off, y1);
      }
    }
    for (let j = 0; j < 4; j++) {
      if (rnd(j * 17) > 1 - brk) continue;
      const y = H * (0.16 + j * 0.22);
      ctx.strokeStyle = rgba(BONE, a * 0.7);
      ctx.lineWidth = 1.4;
      line(0, y + brk * (rnd(j) - 0.5) * 110, W, y + brk * (rnd(j + 3) - 0.5) * 110);
    }
    ctx.restore();
  }

  /* outro：向上疯长的梯级 */
  function ladder(count, a, mad) {
    if (a <= 0 || count <= 0) return;
    const x0 = W * 0.855;
    const step = Math.min(22, (H * 0.62) / Math.max(count, 6));
    for (let i = 0; i < count; i++) {
      const wob = mad * (rnd(i * 3.3) - 0.5) * 60;
      const y = H * 0.92 - i * step;
      const len = W * 0.045 + mad * rnd(i * 7.7) * W * 0.26;
      ctx.strokeStyle = rgba(BONE, a * (0.6 - i / count * 0.3));
      ctx.lineWidth = 1 + mad * 2.4 * rnd(i * 11);
      line(x0 + wob, y, x0 + wob + len, y - wob * 0.15);
    }
    ctx.strokeStyle = rgba(BONE, a * 0.45);
    ctx.lineWidth = 1;
    line(x0, H * 0.95, x0, H * 0.92 - count * step - 30);
  }

  /* ---------- 主渲染 ---------- */
  function render(t, A) {
    const freq = (A && A.freq) || new Uint8Array(64);
    const level = (A && A.level) || 0;
    const sec = sectionAt(t);
    const p = prog(t, sec);
    const mad = madAt(t);
    const dread = dreadAt(t);
    const id = sec.id;

    // 消失点漂移（迷茫）
    const drift = 1 + dread * 1.6;
    const vx = W * 0.5 + Math.sin(t * 0.117) * W * 0.016 * drift + Math.sin(t * 0.041 + 1.3) * W * 0.012 * drift;
    const vy = H * 0.35 + Math.sin(t * 0.083 + 0.6) * H * 0.013 * drift;

    // 镜头
    const zoom = 1 + 0.03 * clamp(t / 177.6) + mad * mad * 0.18;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060607';
    ctx.fillRect(0, 0, W, H);

    // 抖动
    const jx = (rnd(Math.floor(t * 26)) - 0.5) * mad * mad * 60;
    const jy = (rnd(Math.floor(t * 26) + 9) - 0.5) * mad * mad * 38;
    const rot = (id === 'bridge' ? 0.02 * p : 0) + mad * mad * (rnd(Math.floor(t * 8)) - 0.5) * 0.13;

    ctx.save();
    ctx.translate(W / 2 + jx, H / 2 + jy);
    ctx.rotate(rot);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    /* —— 空间参数 —— */
    let archA = 0, floorA = 0, figA = 0, kneel = 0;
    let figH = H * 0.21, figY = H * 0.875, archR = H * 0.3, flat = 0.5;
    let figX = vx + W * 0.1;

    if (id === 'intro') {
      archA = 0.04 * smooth(p * 1.5);
      floorA = 0.03 * smooth(p * 1.3);
      figA = 0.12 * smooth(p * 1.6);
      figH = H * 0.17;
    } else if (id === 'verse1') {
      archA = 0.07 + 0.06 * p;
      floorA = 0.05 + 0.06 * p;
      figA = 0.85;
    } else if (id === 'verse2') {
      archA = 0.16 - 0.05 * p;
      floorA = 0.09 + 0.07 * p;
      figA = 0.92;
      kneel = smooth(p * 1.2);
      figH = H * 0.2 * (1 - 0.05 * p);
    } else if (id === 'bridge') {
      archA = 0.08;
      floorA = 0.16;
      figA = 0.5;
      figH = H * 0.17;
      figX = vx + Math.sin(t * 0.4) * 8;
    } else if (id === 'chorus') {
      archA = 0.18;
      floorA = 0.09;
      figA = 0.95;
      archR = H * (0.3 + 0.09 * p);
    } else if (id === 'verse3') {
      archA = 0.07;
      floorA = 0.06;
      figA = 0.82;
      figH = H * 0.2;
    } else if (id === 'outro') {
      archA = 0.05 - 0.035 * p;
      floorA = 0.05 - 0.04 * p;
      figA = 0.85 * (1 - 0.25 * p);
      figH = H * 0.2;
    }

    // 雾
    haze(vx, vy + H * 0.08, H * (0.5 + (id === 'chorus' ? 0.22 : 0)), H * (0.62 + (id === 'chorus' ? 0.3 : 0)),
      0.09 + level * 0.13 + (id === 'chorus' ? 0.1 : 0));

    // 拱 / 地面
    arches(vx, vy, archR, archA, 6, flat);
    floorLines(vx, vy, floorA, 2.4 + (1 - dread) * 0.5, 9);

    // 侧柱 + 浮尘
    ctx.strokeStyle = rgba(BONE, 0.04 + archA * 0.35);
    ctx.lineWidth = 1;
    line(W * 0.045, 0, W * 0.045, H);
    line(W * 0.955, 0, W * 0.955, H);
    dust(t, 0.42);

    // 中轴光柱
    const pilarTop = id === 'chorus' ? H * 0.04 : vy;
    let pilarA = 0.22 + level * 0.48;
    if (id === 'intro') pilarA = 0.1 + level * 0.5;
    if (id === 'verse3') pilarA = 0.15 + level * 0.32;
    pillar(vx, H * 0.94, pilarTop, (id === 'chorus' ? 6 + level * 14 : 3.4 + level * 9), pilarA, GOLD);

    // 高潮：从顶上打下来的光锥
    if (id === 'chorus') {
      const bw = W * (0.07 + 0.06 * p);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgba(BONE, 0.3));
      g.addColorStop(0.45, rgba(GOLD, 0.16));
      g.addColorStop(1, rgba(GOLD, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(vx - bw * 0.2, 0);
      ctx.lineTo(vx + bw * 0.2, 0);
      ctx.lineTo(vx + bw * 1.7, H);
      ctx.lineTo(vx - bw * 1.7, H);
      ctx.closePath();
      ctx.fill();
    }

    // 水面
    if (id === 'intro' || id === 'verse1') {
      rings(vx, H * 0.9, H * 0.3, 0.14, 5, (t * 0.05) % 1, 0.11);
    }

    // 人
    const f = figure(figX, figY, figH, figA, kneel, kneel * 0.5 + mad * 0.5);
    if (f && figA > 0.25) {
      voice(f.cy, f.cx, H * 0.2, freq, figA * (0.3 + level * 0.55), 10 + level * 30);
    }

    // 章节专属
    if (id === 'chorus') {
      rings(vx, vy, H * (0.45 + 0.3 * p), 0.3, 6, (t * 0.09) % 1, 0.85);
    }
    if (id === 'bridge') {
      crowd(t, p, 0.72 * smooth(p * 1.8));
      ctx.fillStyle = rgba(BLOOD, 0.5);
      const lw = W * 0.005;
      ctx.fillRect(-W * 0.02 + p * W * 0.05, 0, lw, H);
      ctx.fillRect(W * 0.98 - p * W * 0.05, 0, lw, H);
    }
    if (id === 'verse2') {
      steps(t, p, 0.22 + 0.14 * p);
    }
    if (id === 'verse3') {
      cell(0.3, clamp((t - 172.9) / 4.2), 0);
    }
    if (id === 'outro') {
      const cnt = Math.max(0, Math.floor((t - 177.6) / 4.3) + 1);
      ladder(cnt, 0.4 + 0.35 * mad, mad);
    }

    ctx.restore();

    /* —— 重影：整帧复制，mad 越大层数越多 —— */
    if (mad > 0.14) {
      const off = getOff();
      const octx = off.getContext('2d');
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.clearRect(0, 0, off.width, off.height);
      octx.drawImage(cv, 0, 0);
      const ghosts = 1 + Math.round(mad * 3);
      for (let g = 1; g <= ghosts; g++) {
        const ox = (rnd(g * 7.7 + Math.floor(t * 11)) - 0.5) * mad * 95 * g;
        const oy = (rnd(g * 3.1 + Math.floor(t * 11)) - 0.5) * mad * 55 * g;
        ctx.save();
        ctx.globalAlpha = 0.13 * (1 - g / (ghosts + 1));
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(off, ox, oy, W, H);
        ctx.restore();
      }
    }

    /* —— 暗角 —— */
    const vg = ctx.createRadialGradient(W / 2, H * 0.44, H * 0.22, W / 2, H * 0.44, H * 1.02);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.86)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* —— 颗粒 —— */
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.globalCompositeOperation = 'overlay';
      const ox = Math.floor(rnd(Math.floor(t * 24)) * 180);
      const oy = Math.floor(rnd(Math.floor(t * 24) + 5) * 180);
      ctx.translate(-ox, -oy);
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, W + 180, H + 180);
      ctx.restore();
    }

    /* —— 信号故障：画面被横向切开错位 —— */
    if (mad > 0.42) {
      const snap = getOff();
      const sx = snap.getContext('2d');
      sx.setTransform(1, 0, 0, 1, 0, 0);
      sx.clearRect(0, 0, snap.width, snap.height);
      sx.drawImage(cv, 0, 0);
      ctx.fillStyle = '#060607';
      ctx.fillRect(0, 0, W, H);
      const N = 9;
      for (let i = 0; i < N; i++) {
        const sy = snap.height * i / N, sh = snap.height / N;
        const dy = H * i / N, dh = H / N;
        const dx = (rnd(i * 5.1 + Math.floor(t * 17)) - 0.5) * mad * mad * 90;
        ctx.drawImage(snap, 0, sy, snap.width, sh, dx, dy, W, dh);
      }
    }

    /* —— 闪白：4:16 之后不规则地打断 —— */
    if (t > 256 && t < 287) {
      const beat = t * 2.6;
      const ph = beat - Math.floor(beat);
      const r = rnd(Math.floor(beat) * 3.7);
      if (ph < 0.06 && r > 0.55) {
        ctx.fillStyle = 'rgba(240,236,226,' + (0.25 + mad * 0.4) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* —— 结尾：过曝 → 反相 → 黑字 —— */
    const wash = clamp((t - 264) / 24);
    if (wash > 0) {
      ctx.fillStyle = 'rgba(233,227,214,' + (wash * 0.09) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    const inv = clamp((t - 286) / 5);
    if (inv > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = 'rgba(255,255,255,' + inv + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      const white = clamp((inv - 0.9) / 0.1);
      if (white > 0) {
        ctx.fillStyle = 'rgba(252,250,246,' + white + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* —— 最后一句 —— */
    if (t > 291.0) {
      const k = clamp((t - 291.0) / 1.1);
      const shake = (rnd(Math.floor(t * 17)) - 0.5) * 2.4;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#060607';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const size = Math.min(W * 0.115, H * 0.2);
      ctx.font = '400 ' + size + 'px "Songti SC","STSong","Times New Roman",serif';
      ctx.fillText('无所谓了', W / 2 + shake, H * 0.5 + shake * 0.3);
      ctx.restore();
    }
  }

  return { resize: resize, render: render, sectionAt: sectionAt };
})();
