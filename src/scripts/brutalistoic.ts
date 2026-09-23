// brutalistoic behaviours, ported from the design system's React bundle (components/bundle.js)
// to plain DOM code so the site ships no framework. The algorithms, timings and glyph ramps are
// the system's own; what changed is only the wiring: markup is rendered by Astro, and these
// functions attach to it. Everything stops under prefers-reduced-motion and pauses offscreen.
//
//   [data-ascii-fill]   Button / Tab effect: an ASCII ramp sweeps across until the control is solid.
//   canvas.bl-bayer     BayerField: the 8×8 ordered-dither ground used by Card.
//   [data-ascii-banner] AsciiBanner: the logo in ASCII, eaten by something invisible.

import { LOGO_GRID } from './logo-grid';

const reduced = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** Runs `onChange(visible)` when the element enters or leaves the viewport. */
function watchVisibility(el: Element, onChange: (visible: boolean) => void): void {
  if (typeof IntersectionObserver === 'undefined') return;
  new IntersectionObserver((entries) => onChange(entries[entries.length - 1].isIntersecting), {
    rootMargin: '120px',
  }).observe(el);
}

/* ---------------------------------------------------------------------------------------------
   useAsciiFill (Button, Tab). Outline at rest; when active (hover, focus, or held: aria-current /
   aria-pressed) the ramp sweeps from the top-left until the whole control is solid.
   --------------------------------------------------------------------------------------------- */
const RAMP = ' ░▒▓█';

function attachAsciiFill(el: HTMLElement): void {
  const isTab = el.classList.contains('bl-tab');
  const filledCls = isTab ? 'bl-tab--filled' : 'bl-btn--filled';
  const halfCls = isTab ? 'bl-tab--half' : 'bl-btn--half';
  const held = (): boolean =>
    el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-pressed') === 'true';

  const fill = document.createElement('span');
  fill.className = 'bl-btn__fill';
  fill.setAttribute('aria-hidden', 'true');

  let dims = { c: 12, r: 4 };
  let prog = 0;
  let hot = false;
  let timer = 0;
  const max = (): number => dims.c * 0.6 + dims.r * 1.2 + 4;
  const on = (): boolean => (hot || held()) && !el.hasAttribute('disabled');

  function render(): void {
    const active = on();
    const m = max();
    const filled = active && prog >= m;
    el.classList.toggle(filledCls, filled);
    el.classList.toggle(halfCls, active && prog > m * 0.5);
    if (active && !filled) {
      const lines: string[] = [];
      for (let y = 0; y < dims.r; y++) {
        let row = '';
        for (let x = 0; x < dims.c; x++) {
          const v = Math.floor(prog - (x * 0.6 + y * 1.2));
          row += RAMP.charAt(Math.max(0, Math.min(4, v)));
        }
        lines.push(row);
      }
      fill.textContent = lines.join('\n');
      if (!fill.isConnected) el.prepend(fill);
    } else if (fill.isConnected) {
      fill.remove();
    }
  }

  function start(): void {
    window.clearInterval(timer);
    const r = el.getBoundingClientRect();
    dims = { c: Math.ceil(r.width / 6) + 1, r: Math.ceil(r.height / 10) };
    if (reduced()) {
      prog = max();
      render();
      return;
    }
    render();
    timer = window.setInterval(() => {
      prog = Math.min(max(), prog + 1.6);
      render();
      if (prog >= max()) window.clearInterval(timer);
    }, 28);
  }

  function update(): void {
    if (on()) {
      if (prog === 0) start();
    } else {
      window.clearInterval(timer);
      prog = 0;
      render();
    }
  }

  const enter = (): void => { hot = true; update(); };
  const leave = (): void => { hot = false; update(); };
  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('focus', enter);
  el.addEventListener('blur', leave);
  update();
}

/* ---------------------------------------------------------------------------------------------
   BayerField (canvas.bl-bayer). Each canvas pixel is one `cell`; a slow wave modulates the
   threshold against the 8×8 Bayer matrix. Colour comes from the canvas' CSS `color`.
   --------------------------------------------------------------------------------------------- */
const BAYER8: number[][] = (() => {
  let m = [[0, 2], [3, 1]];
  const q = [[0, 2], [3, 1]];
  let n = 2;
  while (n < 8) {
    const nm: number[][] = [];
    for (let y = 0; y < n * 2; y++) {
      nm[y] = [];
      for (let x = 0; x < n * 2; x++) nm[y][x] = 4 * m[y % n][x % n] + q[Math.floor(y / n)][Math.floor(x / n)];
    }
    m = nm;
    n *= 2;
  }
  return m;
})();

function attachBayer(cv: HTMLCanvasElement): void {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const cell = Number(cv.dataset.cell) || 3;
  const animated = cv.dataset.animated !== 'false';
  let img: ImageData | null = null;
  let t = Number(cv.dataset.seed) || 1.3;
  let timer = 0;
  let visible = true;

  function draw(): void {
    if (!ctx) return;
    const w = Math.max(1, Math.ceil(cv.clientWidth / cell));
    const h = Math.max(1, Math.ceil(cv.clientHeight / cell));
    if (cv.width !== w || cv.height !== h || !img) {
      cv.width = w;
      cv.height = h;
      img = ctx.createImageData(w, h);
    }
    const m = getComputedStyle(cv).color.match(/[\d.]+/g) ?? ['128', '128', '128'];
    const r = +m[0], g = +m[1], b = +m[2];
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const ny = y / h;
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const base = 1 - (nx * 0.55 + ny * 0.45);
        const wave = 0.5 + 0.5 * Math.sin(nx * 6 + t * 0.9) * Math.cos(ny * 5 - t * 0.7);
        const f = base * (0.35 + 0.9 * wave);
        const i = (y * w + x) * 4;
        if (f > (BAYER8[y & 7][x & 7] + 0.5) / 64) {
          d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        } else {
          d[i + 3] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function run(): void {
    window.clearInterval(timer);
    if (!animated || reduced() || !visible || document.hidden) return;
    timer = window.setInterval(() => { t += 0.09; draw(); }, 90);
  }

  draw();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(draw).observe(cv);
  watchVisibility(cv, (v) => { visible = v; run(); });
  document.addEventListener('visibilitychange', run);
  run();
}

/* ---------------------------------------------------------------------------------------------
   AsciiBanner. Three stacked <pre>: the drifting field (line tone), the logo (fgplus) and the
   hot layer (og: the glitching bite edge and the crumbs). An 11-second cycle: the logo builds in,
   a small fast mouth snakes through it, the rest is gulped, and it starts over.
   `data-rows` sets the height in text rows; `data-fill` sizes the rows to the parent instead.
   --------------------------------------------------------------------------------------------- */
const DENS = ' .:-=+*#%@';
const GLITCH = '#%&@$*+/\\';
const FIELD_RAMP = ' .:-=+*';
const CYCLE = 11, T_IN = 1.4, T_EAT0 = 1.4, T_EAT1 = 7.6, T_GULP = 8.4;

function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function fieldChar(x: number, y: number, t: number): string {
  const v = 0.5 + 0.5 * Math.sin(x * 0.11 + t * 0.5 + 2 * Math.sin(y * 0.16 - t * 0.35));
  const w = 0.5 + 0.5 * Math.sin(y * 0.21 - t * 0.4 + x * 0.05);
  const f = v * w + (hash(x, y + Math.floor(t * 4)) - 0.5) * 0.16;
  const i = Math.floor(Math.pow(Math.max(f, 0), 1.25) * 9.5);
  return FIELD_RAMP.charAt(Math.max(0, Math.min(6, i)));
}

function logoSample(lc: number, lr: number): number[][] {
  const out: number[][] = [];
  const sw = 128, sh = 64;
  for (let y = 0; y < lr; y++) {
    const row: number[] = [];
    for (let x = 0; x < lc; x++) {
      const x0 = Math.floor((x * sw) / lc), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / lc));
      const y0 = Math.floor((y * sh) / lr), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / lr));
      let s = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { s += LOGO_GRID[yy].charCodeAt(xx) - 48; n++; }
      row.push(Math.min(9, Math.round((s / n) * 1.25)));
    }
    out.push(row);
  }
  return out;
}

function attachBanner(box: HTMLElement): void {
  const fs = Number(box.dataset.size) || 11;
  const lh = Math.round(fs * 1.25);
  const cw = fs * 0.6;
  const aspect = lh / cw;
  const fillParent = box.hasAttribute('data-fill');
  const [bgEl, fgEl, hotEl] = Array.from(box.querySelectorAll('pre'));
  if (!bgEl || !fgEl || !hotEl) return;
  for (const pre of [bgEl, fgEl, hotEl]) { pre.style.fontSize = `${fs}px`; pre.style.lineHeight = `${lh}px`; }

  let rowsN = Number(box.dataset.rows) || 30;
  let cols = 0, lc = 0, lr = 0, ox = 0, oy = 0;
  let D: number[][] = [];
  let eaten = new Uint8Array(0);
  let born = new Float32Array(0);
  let parts: { x: number; y: number; a: number }[] = [];
  const mouth = { x: 0, y: 0, r: 0, on: false };
  let tt = 0, lastT = 0, timer = 0, visible = true;

  function reset(): void {
    eaten = new Uint8Array(lc * lr);
    born = new Float32Array(lc * lr);
    parts = [];
    mouth.on = false;
  }

  function setup(): void {
    if (fillParent && box.parentElement) {
      rowsN = Math.max(24, Math.ceil(box.parentElement.clientHeight / lh));
    }
    box.style.height = `${rowsN * lh}px`;
    cols = Math.max(24, Math.floor(box.clientWidth / cw));
    lr = rowsN - 4;
    lc = Math.min(cols - 2, Math.round(lr * aspect));
    ox = Math.floor((cols - lc) / 2);
    oy = 1;
    // In a tall, narrow box the logo is width-bound: keep it square-ish and centred vertically.
    if (lc < Math.round(lr * aspect)) {
      lr = Math.max(8, Math.round(lc / aspect));
      oy = Math.floor((rowsN - lr) / 2);
    }
    D = logoSample(lc, lr);
    reset();
    lastT = 0;
    frame(tt);
  }

  function mouthAt(t: number) {
    const u = (t - T_EAT0) / (T_EAT1 - T_EAT0);
    const R = Math.max(1.3, lr * 0.055 * (0.8 + 0.4 * Math.abs(Math.sin(t * 16))));
    const n = Math.max(3, Math.ceil(lr / (R * 1.7)));
    const k = Math.min(n - 1, Math.floor(u * n));
    const f = u * n - k;
    const span = lc + 2 * R * aspect;
    const xf = k % 2 ? 1 - f : f;
    return { r: R, x: xf * span - R * aspect, y: R + (k / (n - 1)) * (lr - 2 * R) + Math.sin(t * 9) * R * 0.5 };
  }

  function eatAt(m: { r: number; x: number; y: number }, t: number): void {
    const R = m.r;
    const x0 = Math.max(0, Math.floor(m.x - R * aspect - 1)), x1 = Math.min(lc - 1, Math.ceil(m.x + R * aspect + 1));
    const y0 = Math.max(0, Math.floor(m.y - R - 1)), y1 = Math.min(lr - 1, Math.ceil(m.y + R + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * lc + x;
      if (eaten[i]) continue;
      const dx = (x - m.x) / aspect, dy = y - m.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < R * (1 + (hash(x * 1.3, y * 1.7) - 0.5) * 0.35)) {
        eaten[i] = 1;
        born[i] = t;
        if (D[y][x] > 0 && parts.length < 40 && hash(x, y + t) > 0.6) parts.push({ x, y, a: 0 });
      }
    }
  }

  function step(t: number): void {
    mouth.on = t >= T_EAT0 && t <= T_EAT1;
    if (mouth.on) {
      const t0 = Math.max(T_EAT0, lastT), sub = 5;
      for (let si = 1; si <= sub; si++) {
        const ts = t0 + ((t - t0) * si) / sub, m = mouthAt(ts);
        eatAt(m, ts);
        mouth.r = m.r; mouth.x = m.x; mouth.y = m.y;
      }
    } else if (t > T_EAT1 && t <= T_GULP) {
      const g = (t - T_EAT1) / (T_GULP - T_EAT1);
      for (let j = 0; j < eaten.length; j++) if (!eaten[j] && hash(j, 3.3) < g) { eaten[j] = 1; born[j] = t; }
    } else if (t > T_GULP) {
      for (let k = 0; k < eaten.length; k++) if (!eaten[k]) { eaten[k] = 1; born[k] = t; }
    }
    lastT = t;
    for (let q = parts.length - 1; q >= 0; q--) {
      const pt = parts[q];
      pt.a += 1;
      const ddx = mouth.x - pt.x, ddy = (mouth.y - pt.y) * aspect, dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      pt.x += (ddx / dl) * 2.5;
      pt.y += (ddy / dl / aspect) * 2.5;
      if (pt.a > 8 || !mouth.on || dl < mouth.r * aspect * 0.6) parts.splice(q, 1);
    }
  }

  function frame(t: number): void {
    const A: string[][] = [], B: string[][] = [], C: string[][] = [];
    for (let y = 0; y < rowsN; y++) { A.push(new Array(cols)); B.push(new Array(cols)); C.push(new Array(cols)); }
    const reveal = Math.min(1, t / T_IN), R2 = mouth.on ? mouth.r : 0;
    for (let y = 0; y < rowsN; y++) for (let x = 0; x < cols; x++) {
      const lx = x - ox, ly = y - oy;
      let fgc = ' ', hc = ' ';
      const d0 = lx >= 0 && lx < lc && ly >= 0 && ly < lr ? D[ly][lx] : 0;
      if (d0 > 0) {
        const i = ly * lc + lx, hv = hash(lx, ly);
        if (t < T_IN && hv > reveal) fgc = ' ';
        else if (t < T_IN && hv > reveal - 0.12) hc = GLITCH.charAt(Math.floor(hash(lx + t * 9, ly) * GLITCH.length));
        else if (eaten[i]) {
          const age = t - born[i];
          if (age < 0.4) { const dd = Math.round(d0 * (1 - age / 0.4)); if (dd > 0) hc = DENS.charAt(dd); }
        } else {
          const dx2 = (lx - mouth.x) / aspect, dy2 = ly - mouth.y;
          if (mouth.on && Math.sqrt(dx2 * dx2 + dy2 * dy2) < R2 + 1.2 && hash(lx + t * 7, ly) > 0.35)
            hc = GLITCH.charAt(Math.floor(hash(lx, ly + t * 11) * GLITCH.length));
          else fgc = DENS.charAt(d0);
        }
      }
      C[y][x] = hc;
      B[y][x] = hc === ' ' ? fgc : ' ';
    }
    for (const p of parts) {
      const px = Math.round(p.x) + ox, py = Math.round(p.y) + oy;
      if (px >= 0 && px < cols && py >= 0 && py < rowsN && C[py][px] === ' ') {
        C[py][px] = p.a > 9 ? '.' : p.a > 4 ? ':' : '*';
        B[py][px] = ' ';
      }
    }
    const mx = mouth.x + ox, my = mouth.y + oy;
    for (let y = 0; y < rowsN; y++) for (let x = 0; x < cols; x++) {
      let ch = ' ';
      if (B[y][x] === ' ' && C[y][x] === ' ') {
        const inVoid = mouth.on && Math.pow((x - mx) / aspect, 2) + Math.pow(y - my, 2) < Math.pow(R2 * 1.08, 2);
        const lx = x - ox, ly = y - oy;
        const onLogo = lx >= 0 && lx < lc && ly >= 0 && ly < lr ? D[ly][lx] > 0 && !eaten[ly * lc + lx] : false;
        if (!inVoid && !onLogo) ch = fieldChar(x, y, t + 2);
      }
      A[y][x] = ch;
    }
    bgEl.textContent = A.map((r) => r.join('')).join('\n');
    fgEl.textContent = B.map((r) => r.join('')).join('\n');
    hotEl.textContent = C.map((r) => r.join('')).join('\n');
  }

  function run(): void {
    window.clearInterval(timer);
    if (reduced() || !visible || document.hidden) return;
    timer = window.setInterval(() => {
      tt += 0.07;
      if (tt >= CYCLE) { tt = 0; lastT = 0; reset(); }
      step(tt);
      frame(tt);
    }, 70);
  }

  setup();
  if (reduced()) {
    for (let s = 0; s <= 4.6; s += 0.07) step(s);
    tt = 4.6;
    frame(tt);
  }
  let lastW = box.clientWidth, lastH = box.parentElement?.clientHeight ?? 0;
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      const w = box.clientWidth, h = box.parentElement?.clientHeight ?? 0;
      if (w === lastW && (!fillParent || h === lastH)) return;
      lastW = w; lastH = h;
      setup();
    }).observe(fillParent && box.parentElement ? box.parentElement : box);
  }
  watchVisibility(box, (v) => { visible = v; run(); });
  document.addEventListener('visibilitychange', run);
  run();
}

export function initBrutalistoic(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-ascii-fill]').forEach(attachAsciiFill);
  root.querySelectorAll<HTMLCanvasElement>('canvas.bl-bayer').forEach(attachBayer);
  root.querySelectorAll<HTMLElement>('[data-ascii-banner]').forEach(attachBanner);
}
