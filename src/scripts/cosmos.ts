// The star chart's behaviours, on top of stoico.ts (same rules: plain DOM, monochrome, every
// effect pauses offscreen or in a hidden tab and stills under prefers-reduced-motion).
//
//   [data-starfield]      faint fixed stars behind the chart; something unseen eats a few
//   [data-cosmos]         the page-wide plane: its grid, and the vertical Einstein–Rosen bridge
//   [data-sky]            the cursor readout: right ascension / declination, or the hovered star
//   canvas[data-planet]   a procedural planet, dithered to 1 bit against the Bayer matrix
//   [data-ficha]          the bodies' cards (<dialog>): opened from a star, a row, or each other
//   [data-screensaver]    after a minute idle, a starfield; any input wakes the page
//   [data-hud]            the on-board log: two tabs (bodies, exits) over one frame
//   [data-nav-menu]       wide screens: Projects / Outer spaces drop a plain list
//   [data-orbit-day]      "Day 0007": days since the site went up

import { reduced, reducedQuery, watchVisibility, toRGB, BAYER4, mhash } from './stoico';
import { coordsOf } from '../data/sky';

/** Planets and the starfield tick like the ASCII banner: 70–90ms, never every frame. */
const TICK = 80;

function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/* ---------------------------------------------------------------------------------------------
   Starfield: one CSS pixel per canvas pixel, positions from a hash so every visit sees the same
   sky. About one star per 2,600px²; one in twelve twinkles.
   And something invisible feeds on it: the vstrofago, a star-eater, drifts across the sky on
   a slow, looping path. A star it reaches flares, breaks into crumbs that fall toward a point
   nobody can see, and goes out; half a minute or so later it quietly lights again. It is the
   AsciiBanner's bite, told with stars. Stills (and stops eating) under reduced motion.
   --------------------------------------------------------------------------------------------- */
interface Star { x: number; y: number; s: number; a: number; tw: boolean; eaten: number; back: number }

function attachStarfield(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let stars: Star[] = [];
  let rgb: [number, number, number] = [237, 237, 234];
  let visible = true, frame = 0;
  const BITE = 24; // px
  const eater = { x: -99, y: -99 };

  const fill = (x: number, y: number, size: number, alpha: number): void => {
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  };
  const move = (): void => {
    const W = canvas.width, H = canvas.height, f = frame;
    eater.x = W * (0.5 + 0.46 * Math.sin(f * 0.0061) * Math.cos(f * 0.0017 + 0.4));
    eater.y = H * (0.5 + 0.42 * Math.sin(f * 0.0047 + 1.3));
  };
  const draw = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      if (st.eaten >= 0) {
        const age = frame - st.eaten;
        if (age < 3) {
          fill(st.x - 1, st.y - 1, st.s + 2, 1); // the flare
        } else if (age < 10) {
          const k = (age - 3) / 7; // crumbs fall toward the eater and fade
          for (let c = 0; c < 3; c++) {
            const jx = (mhash(i, c + 11) - 0.5) * 8 * (1 - k), jy = (mhash(i, c + 17) - 0.5) * 8 * (1 - k);
            fill(st.x + (eater.x - st.x) * k + jx, st.y + (eater.y - st.y) * k + jy, 1, 0.9 * (1 - k));
          }
        } else if (frame >= st.back) {
          st.eaten = -1; // relit; fades in below
        }
        if (st.eaten >= 0) continue;
      }
      let a = st.a;
      if (st.tw) a *= 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.09 + i));
      const since = frame - st.back;
      if (since >= 0 && since < 25) a *= since / 25;
      fill(st.x, st.y, st.s, a);
    }
  };
  const eat = (): void => {
    for (const st of stars) {
      if (st.eaten >= 0 || frame - st.back < 25) continue;
      const dx = st.x - eater.x, dy = st.y - eater.y;
      if (dx * dx + dy * dy < BITE * BITE) {
        st.eaten = frame;
        st.back = frame + 220 + Math.floor(mhash(st.x, st.y + frame) * 260);
      }
    }
  };
  const size = (): void => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width));
    canvas.height = Math.max(1, Math.round(r.height));
    const count = Math.round((canvas.width * canvas.height) / 2600);
    stars = Array.from({ length: count }, (_, i) => {
      const h = mhash(i, 7);
      return {
        x: Math.floor(mhash(i, 1) * canvas.width),
        y: Math.floor(mhash(i, 2) * canvas.height),
        s: h > 0.93 ? 2 : 1,
        a: 0.18 + mhash(i, 3) * 0.5,
        tw: h > 0.92,
        eaten: -1,
        back: -999,
      };
    });
    rgb = toRGB(canvas.parentElement ?? document.body, getComputedStyle(canvas).color);
    move();
    draw();
  };

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(canvas);
  document.addEventListener('stoico:theme', size);
  watchVisibility(canvas, (v) => { visible = v; });
  size();
  window.setInterval(() => {
    if (reduced() || !visible || document.hidden) return;
    frame++;
    move();
    eat();
    draw();
  }, TICK * 1.5);
}

/* ---------------------------------------------------------------------------------------------
   Planets. A sphere lit from the upper left, its surface from 3D value noise (continents for
   rocky worlds, bands for gas giants), optionally a ring and a moon, all thresholded against
   the same 4×4 Bayer matrix as the MarbleField. The status is drawn, not coloured:
     live  a formed world
     wip   part of the surface is still a wireframe: under construction
     soon  a faint core inside a disc of dust
   --------------------------------------------------------------------------------------------- */
function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t: number): number => t * t * (3 - 2 * t);
function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
  const l = (a: number, b: number, t: number): number => a + (b - a) * t;
  return l(
    l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
    l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy),
    fz,
  );
}
function fbm3(x: number, y: number, z: number, octaves: number): number {
  let v = 0, amp = 0.5, fr = 1, n = 0;
  for (let i = 0; i < octaves; i++) { v += amp * noise3(x * fr, y * fr, z * fr); n += amp; amp *= 0.5; fr *= 2.03; }
  return v / n;
}
const LIGHT = (() => { const l = [-0.55, -0.6, 0.58]; const m = Math.hypot(l[0], l[1], l[2]); return l.map((v) => v / m); })();

interface PlanetControl { play(): void; pause(): void }

function attachPlanet(canvas: HTMLCanvasElement): PlanetControl {
  const noop = { play() {}, pause() {} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;
  const ds = canvas.dataset;
  const block = Number(ds.blockSize ?? 3);
  const status = ds.status ?? 'live';
  const gas = ds.kind === 'gas';
  const soon = status === 'soon';
  const ring = ds.ring !== undefined && !soon;
  const moon = ds.moon !== undefined && !soon;
  const tilt = (Number(ds.tilt ?? 0) * Math.PI) / 180;
  const seed = strHash(ds.planet ?? 'x');
  const off = seed * 97;
  let spin = seed * Math.PI * 2;
  let w = 0, h = 0, timer = 0, visible = true, playing = false;
  let img: ImageData | null = null;
  let rgb: [number, number, number] = [237, 237, 234];

  const draw = (): void => {
    if (!img) return;
    const d = img.data;
    const R = Math.min(w, h) * (ring || soon ? 0.215 : moon ? 0.26 : 0.4);
    const core = soon ? 0.42 : 1;
    const cx = w / 2, cy = h / 2;
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const ca = Math.cos(spin), sa = Math.sin(spin);
    const mAng = spin * 2.6 + seed * 6;
    const mdx = Math.cos(mAng) * 1.7, mdy = Math.sin(mAng) * 0.3 * 1.7;
    const mx = mdx * ct - mdy * st, my = mdx * st + mdy * ct, mFront = Math.sin(mAng) > 0, mr = 0.2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R;
        const tx = dx * ct + dy * st, ty = -dx * st + dy * ct;
        let val = -1;

        // Ring or dust disc, in the tilted plane, flattened to an ellipse.
        let band = -1;
        const ry = ty / 0.3, rr = Math.sqrt(tx * tx + ry * ry);
        if (ring && rr > 1.35 && rr < 2.15 && Math.abs(rr - 1.78) > 0.05) {
          band = 0.42 + 0.3 * Math.sin(rr * 21) + 0.12 * (1 - Math.abs(ry) / 2.2);
        } else if (soon && rr > 0.5 && rr < 2.3) {
          const a = Math.atan2(ry, tx);
          const swirl = fbm3(Math.cos(a - spin * 1.4 + rr * 1.3) * 2 + off, Math.sin(a - spin * 1.4 + rr * 1.3) * 2, rr * 2.2, 3);
          band = Math.max(0, swirl * 1.25 - 0.28) * (1 - Math.abs(rr - 1.3) / 1.1);
        }
        const bandFront = ty > 0;

        // The sphere.
        const qx = dx / core, qy = dy / core, d2 = qx * qx + qy * qy;
        if (d2 <= 1) {
          const nz = Math.sqrt(1 - d2);
          const qtx = tx / core, qty = ty / core;
          const bx = qtx * ca + nz * sa, bz = -qtx * sa + nz * ca, by = qty;
          const lambert = Math.max(0, qx * LIGHT[0] + qy * LIGHT[1] + nz * LIGHT[2]);
          const light = 0.06 + 0.94 * Math.pow(lambert, 0.85);
          let s: number;
          if (gas) {
            s = 0.52 + 0.34 * Math.sin(by * 9.5 + 3.2 * fbm3(bx * 1.6 + off, by * 1.6, bz * 1.6, 3));
          } else {
            const n = fbm3(bx * 2.1 + off, by * 2.1, bz * 2.1, 4);
            const land = sm(Math.min(1, Math.max(0, (n - 0.47) / 0.09)));
            s = 0.3 + 0.62 * land + 0.2 * (n - 0.5);
          }
          val = s * light * (soon ? 0.85 : 1);

          if (status === 'wip') {
            const lon = Math.atan2(bx, bz), lat = Math.asin(Math.max(-1, Math.min(1, by)));
            if (Math.sin(lon + seed * 6) < -0.15) {
              const gl = Math.abs(((lon / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.42;
              const gp = Math.abs(((lat / (Math.PI / 8)) % 1 + 1) % 1 - 0.5) > 0.4;
              val = gl || gp || d2 > 0.9 ? 0.75 * (0.35 + 0.65 * nz) : 0;
            }
          }
          if (band >= 0 && bandFront) val = band;
        } else if (band >= 0) {
          val = band;
        }

        // The moon: in front of the planet or hidden behind it.
        if (moon) {
          const ex = (dx - mx) / mr, ey = (dy - my) / mr, e2 = ex * ex + ey * ey;
          if (e2 <= 1 && (mFront || d2 > 1)) {
            const ez = Math.sqrt(1 - e2);
            val = 0.08 + 0.85 * Math.max(0, ex * LIGHT[0] + ey * LIGHT[1] + ez * LIGHT[2]);
          }
        }

        const on = val > (BAYER4[y & 3][x & 3] + 0.5) / 16, i = (y * w + x) * 4;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = on ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  const recolor = (): void => { rgb = toRGB(canvas.parentElement ?? document.body, getComputedStyle(canvas).color); };
  const size = (): void => {
    // Layout size, not getBoundingClientRect: the card zooms the planet in with a transform.
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    w = Math.max(8, Math.round(cw / block));
    h = Math.max(8, Math.round(ch / block));
    canvas.width = w;
    canvas.height = h;
    img = ctx.createImageData(w, h);
    recolor();
    draw();
  };
  const tick = (): void => {
    if (!visible || document.hidden) return;
    spin += gas ? 0.03 : 0.022;
    draw();
  };
  const run = (): void => {
    window.clearInterval(timer);
    timer = playing && !reduced() ? window.setInterval(tick, TICK) : 0;
  };

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(canvas);
  watchVisibility(canvas, (v) => { visible = v; });
  document.addEventListener('stoico:theme', () => { recolor(); draw(); });
  reducedQuery()?.addEventListener?.('change', run);
  size();
  return {
    play() { playing = true; run(); },
    pause() { playing = false; run(); },
  };
}

/* ---------------------------------------------------------------------------------------------
   Chart readout: where the cursor is on the sky, or which star it is over.
   --------------------------------------------------------------------------------------------- */
function initReadout(): void {
  const sky = document.querySelector<HTMLElement>('[data-sky]');
  const out = document.querySelector<HTMLElement>('[data-readout-out]');
  if (!sky || !out) return;
  const idle = out.dataset.idle ?? '';
  let pinned = false;
  sky.addEventListener('pointermove', (e) => {
    if (pinned) return;
    const r = sky.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    out.textContent = coordsOf(Math.max(0, Math.min(99.9, x)), Math.max(0, Math.min(100, y)));
  });
  sky.addEventListener('pointerleave', () => { if (!pinned) out.textContent = idle; });
  sky.querySelectorAll<HTMLElement>('[data-readout]').forEach((star) => {
    const show = (): void => { pinned = true; out.textContent = star.dataset.readout ?? ''; };
    const hide = (): void => { pinned = false; out.textContent = idle; };
    star.addEventListener('pointerenter', show);
    star.addEventListener('pointerleave', hide);
    star.addEventListener('focus', show);
    star.addEventListener('blur', hide);
  });
}

/* ---------------------------------------------------------------------------------------------
   Cards. A star, a row's "Look closer", or a card's previous / next opens the matching dialog;
   Escape, the close button or a click outside closes it, and focus goes back to whatever opened
   the first one. Without <dialog> support the stars keep their plain link to the catalog row.
   --------------------------------------------------------------------------------------------- */
function initFichas(planets: Map<HTMLCanvasElement, PlanetControl>): void {
  const dialogs = new Map<string, HTMLDialogElement>();
  document.querySelectorAll<HTMLDialogElement>('dialog[data-ficha]').forEach((d) => dialogs.set(d.dataset.ficha ?? '', d));
  if (!dialogs.size || typeof HTMLDialogElement === 'undefined' || !('showModal' in HTMLDialogElement.prototype)) return;

  let opener: HTMLElement | null = null;
  let current: HTMLDialogElement | null = null;
  const planetOf = (d: HTMLDialogElement) => {
    const c = d.querySelector<HTMLCanvasElement>('canvas[data-planet]');
    return c ? planets.get(c) : undefined;
  };
  const open = (key: string): void => {
    const next = dialogs.get(key);
    if (!next) return;
    if (current && current !== next) {
      const prev = current;
      current = null;
      prev.close();
    }
    if (!opener) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    current = next;
    next.showModal();
    planetOf(next)?.play();
  };

  dialogs.forEach((d) => {
    d.addEventListener('close', () => {
      planetOf(d)?.pause();
      if (current === d) {
        current = null;
        opener?.focus();
        opener = null;
      }
    });
    // A click on the backdrop lands on the <dialog> itself.
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-star], [data-ficha-open], [data-ficha-go]');
    if (!el) return;
    const key = el.dataset.star ?? el.dataset.fichaOpen ?? el.dataset.fichaGo;
    if (!key || !dialogs.has(key)) return;
    e.preventDefault();
    open(key);
  });
}

/* ---------------------------------------------------------------------------------------------
   Screensaver: the old Starfield, flying outward from the centre, in the page's two tones.
   --------------------------------------------------------------------------------------------- */
function initScreensaver(): void {
  const box = document.querySelector<HTMLElement>('[data-screensaver]');
  const canvas = box?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!box || !canvas || !ctx) return;
  const IDLE = 60_000;
  let timer = 0, raf = 0, on = false;
  let stars: { x: number; y: number; z: number }[] = [];
  let rgb: [number, number, number] = [237, 237, 234];

  const frame = (): void => {
    raf = requestAnimationFrame(frame);
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.z -= 0.0045;
      if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
      const px = cx + (s.x / s.z) * cx, py = cy + (s.y / s.z) * cy;
      if (px < 0 || px > W || py < 0 || py > H) { s.z = 0; continue; }
      const k = 1 - s.z, size = k > 0.8 ? 3 : k > 0.5 ? 2 : 1;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(1, k * 1.4).toFixed(3)})`;
      ctx.fillRect(Math.round(px), Math.round(py), size, size);
    }
  };
  const show = (): void => {
    if (on || reduced() || document.hidden || document.querySelector('dialog[open]')) return arm();
    on = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rgb = toRGB(box, getComputedStyle(box).color);
    stars = Array.from({ length: 260 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-on'));
    frame();
  };
  const wake = (): void => {
    if (on) {
      on = false;
      box.classList.remove('is-on');
      window.setTimeout(() => { if (!on) { box.hidden = true; cancelAnimationFrame(raf); } }, 600);
    }
    arm();
  };
  function arm(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(show, IDLE);
  }
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']) {
    window.addEventListener(ev, wake, { passive: true, capture: true });
  }
  arm();
}

/* ---------------------------------------------------------------------------------------------
   Days in orbit, counted from the launch date in the markup.
   --------------------------------------------------------------------------------------------- */
function initOrbitDay(): void {
  document.querySelectorAll<HTMLElement>('[data-orbit-day]').forEach((el) => {
    const start = Date.parse(`${el.dataset.orbitDay}T00:00:00`);
    if (Number.isNaN(start)) return;
    const day = Math.max(1, Math.floor((Date.now() - start) / 86_400_000) + 1);
    const n = String(day).padStart(4, '0');
    el.textContent = el.dataset.label === 'T+' ? `T+${n}` : ` · ${el.dataset.label ?? ''} ${n}`;
  });
}

/* ---------------------------------------------------------------------------------------------
   The plane and its Einstein–Rosen bridge (wide screens). The whole section is one plane: its
   grid (redrawn here to the section's real size, faint, cells a twelfth of the width) runs
   straight down through the welcome and the upper space. In the bridge's zone, in the middle
   of the page, the vertical lines converge with a few rings into a mouth, run down an
   hourglass wireframe throat (far side dashed), and flare out past a second mouth into the
   lower space, where the grid runs straight again: another space, holding the outer spaces.
   Hour marks sit along the top, declination marks down the left of the upper space. Ghost
   stars fall along a grid line, through the throat, to each outer space (CSS offset-path);
   the throat's lines flow downward, faster while an outer space is pointed at.
   Not drawn when the plane is hidden (phones use the Registro); without JS a plain CSS grid
   shows instead.
   --------------------------------------------------------------------------------------------- */
interface Pt { x: number; y: number }
interface BridgeGeo { mouthA: number; mouthB: number; flare: number; radius: number; maxRadius: number; tilt: number }

function initBridge(): void {
  const sec = document.querySelector<HTMLElement>('[data-cosmos]');
  const svg = sec?.querySelector<SVGSVGElement>('svg[data-warp]');
  const upper = sec?.querySelector<HTMLElement>('[data-sky]');
  const zone = sec?.querySelector<HTMLElement>('[data-bridge-zone]');
  const lower = sec?.querySelector<HTMLElement>('[data-outer]');
  if (!sec || !svg || !upper || !zone || !lower) return;
  let geo: BridgeGeo;
  try { geo = JSON.parse(sec.dataset.bridge ?? ''); } catch { return; }
  const exits = Array.from(sec.querySelectorAll<HTMLElement>('[data-outer-exit]'));
  const ghosts = Array.from(sec.querySelectorAll<HTMLElement>('.bridge__ghost'));
  const r1 = (n: number): string => n.toFixed(1);
  const ease = (t: number): number => { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); };
  const top = (el: HTMLElement): number => el.getBoundingClientRect().top - sec.getBoundingClientRect().top;

  const draw = (): void => {
    if (getComputedStyle(upper).display === 'none') { sec.classList.remove('is-bridged'); return; }
    const W = sec.clientWidth, S = sec.clientHeight;
    if (!W || !S) return;
    const cx = W / 2, R0 = W / 2, k = geo.tilt;
    const Rm = Math.min(W * geo.radius, geo.maxRadius);
    const a0 = top(zone), zh = zone.offsetHeight;
    const aA = a0 + zh * geo.mouthA, aB = a0 + zh * geo.mouthB;
    // The flare ends just above the outer spaces, so they sit on the straight grid.
    const legendEl = lower.querySelector<HTMLElement>('.outer__legend');
    const aF = legendEl ? top(legendEl) - (W / 12) * 0.75 : top(lower) + lower.offsetHeight * geo.flare;
    const cell = W / 12;
    const rIn = (a: number): number => Rm + (R0 - Rm) * (1 - ease((a - a0) / (aA - a0)));
    const rOut = (a: number): number => Rm + (R0 - Rm) * ease((a - aB) / (aF - aB));
    const rThroat = (t: number): number => Rm * (0.38 + 0.62 * Math.pow(Math.abs(2 * t - 1), 1.6));

    const paths: string[] = [];
    const add = (cls: string, pts: Pt[]): void => {
      if (pts.length < 2) return;
      paths.push(`<path class="${cls}" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join('')}"/>`);
    };
    const ring = (a: number, r: number, cls: string): void => {
      const near: Pt[] = [], far: Pt[] = [];
      for (let i = 0; i <= 48; i++) {
        const th = (i / 48) * Math.PI; // the half facing down the page is the near one
        near.push({ x: cx + Math.cos(th) * r, y: a + Math.sin(th) * r * k });
        far.push({ x: cx + Math.cos(th) * r, y: a - Math.sin(th) * r * k });
      }
      add(`${cls} w-throat--back`, far);
      add(cls, near);
    };

    // Horizontal lines: the upper plane down to the zone, the lower plane from the flare on.
    for (let y = cell; y < a0 - 4; y += cell) add('w-grid', [{ x: 0, y }, { x: W, y }]);
    for (let y = aF + cell * 0.5; y < S; y += cell) add('w-grid', [{ x: 0, y }, { x: W, y }]);
    // Vertical lines: straight, converging into mouth A; out of mouth B, flaring, then straight.
    for (let i = 0; i <= 12; i++) {
      const f = (i / 12) * 2 - 1;
      const down: Pt[] = [{ x: cx + f * R0, y: 0 }];
      const aEnd = aA - Rm * k * Math.sqrt(Math.max(0, 1 - f * f));
      for (let a = a0; a <= aEnd; a += 4) down.push({ x: cx + f * rIn(a), y: a });
      down.push({ x: cx + f * rIn(aEnd), y: aEnd });
      add(i === 0 || i === 12 ? 'w-grid w-edge' : 'w-grid', down);
      const out: Pt[] = [];
      for (let a = aB + Rm * k * Math.sqrt(Math.max(0, 1 - f * f)); a <= aF; a += 4) out.push({ x: cx + f * rOut(a), y: a });
      out.push({ x: cx + f * R0, y: S });
      add(i === 0 || i === 12 ? 'w-grid w-edge' : 'w-grid', out);
    }
    for (const t of [0.55, 0.8, 0.94]) { const a = a0 + (aA - a0) * t; ring(a, rIn(a), 'w-ring'); }
    for (const t of [0.12, 0.35, 0.65]) { const a = aB + (aF - aB) * t; ring(a, rOut(a), 'w-ring'); }
    ring(aA, Rm, 'w-rim');
    ring(aB, Rm, 'w-rim');
    for (let i = 1; i < 6; i++) { const t = i / 6; ring(aA + (aB - aA) * t, rThroat(t), 'w-throat'); }
    for (let m = 0; m < 14; m++) {
      const th = (m / 14) * Math.PI * 2 + Math.PI / 28, pts: Pt[] = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, r = rThroat(t);
        pts.push({ x: cx + Math.cos(th) * r, y: aA + (aB - aA) * t + Math.sin(th) * r * k });
      }
      add(Math.sin(th) >= 0 ? 'w-merid' : 'w-merid w-throat--back', pts);
    }

    // Coordinates: hours along the top, declinations down the left of the upper space.
    const labels: string[] = [];
    for (let i = 1; i < 12; i++) labels.push(`<text class="w-label" x="${r1(i * cell)}" y="18" text-anchor="middle">${String(i * 2).padStart(2, '0')}h</text>`);
    const uTop = top(upper), uH = upper.offsetHeight;
    for (let y = cell; y < a0 - 4; y += cell) {
      const dec = Math.round(60 - ((y - uTop) / uH) * 120);
      if (y < uTop - 8 || dec < -90 || dec > 90) continue;
      labels.push(`<text class="w-label" x="8" y="${r1(y - 6)}">${dec > 0 ? '+' : dec < 0 ? '−' : ''}${Math.abs(dec)}°</text>`);
    }

    svg.setAttribute('viewBox', `0 0 ${r1(W)} ${r1(S)}`);
    svg.innerHTML = paths.join('') + labels.join('');

    // Ghosts: down a grid line, into the mouth, through the throat, out to an outer space.
    const secRect = sec.getBoundingClientRect();
    ghosts.forEach((el, i) => {
      const star = exits[i]?.querySelector('.outer__ship');
      if (!star) return;
      const r = star.getBoundingClientRect();
      const to = { x: r.left + r.width / 2 - secRect.left, y: r.top + r.height / 2 - secRect.top };
      const f = [-2 / 3, 2 / 3, -1 / 3, 1 / 3, -5 / 6, 5 / 6][i % 6];
      const pts: Pt[] = [{ x: cx + f * R0, y: Math.max(0, a0 - 260) }];
      for (let a = a0; a <= aA; a += 8) pts.push({ x: cx + f * rIn(a), y: a });
      pts.push({ x: cx, y: aA }, { x: cx, y: aB });
      for (let s = 1; s <= 14; s++) { const u = s / 14; pts.push({ x: cx + (to.x - cx) * ease(u), y: aB + (to.y - aB) * u }); }
      el.style.offsetPath = `path("${pts.map((p, j) => `${j ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join('')}")`;
      el.style.setProperty('--delay', `${(i * 1.7).toFixed(1)}s`);
    });
    sec.classList.add('is-bridged');
  };

  exits.forEach((a) => {
    const on = (): void => sec.classList.add('is-pulling');
    const off = (): void => sec.classList.remove('is-pulling');
    a.addEventListener('pointerenter', on);
    a.addEventListener('pointerleave', off);
    a.addEventListener('focus', on);
    a.addEventListener('blur', off);
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(draw).observe(sec);
  document.fonts?.ready.then(draw);
  draw();
}

/* ---------------------------------------------------------------------------------------------
   HUD tabs (WAI-ARIA tabs): one panel at a time, arrow keys / Home / End move between tabs.
   A hash that points into a panel (#vs-003, #hud-exits) opens that panel. Without JS the
   tab strip stays hidden and both panels show.
   --------------------------------------------------------------------------------------------- */
function initHud(): void {
  const hud = document.querySelector<HTMLElement>('[data-hud]');
  const list = hud?.querySelector<HTMLElement>('[data-hud-tabs]');
  if (!hud || !list) return;
  const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));
  const select = (i: number, focus = false): void => {
    tabs.forEach((tab, k) => {
      const on = k === i;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k]!.hidden = !on;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      const to = e.key === 'ArrowRight' ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
        : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1;
      if (to < 0) return;
      e.preventDefault();
      select(to, true);
    });
  });
  const follow = (): void => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    const k = panels.findIndex((p) => p && target && (p === target || p.contains(target)));
    if (k < 0) return;
    // Wide screens show the plane, not the Registro: the projects are the upper space, the
    // outer spaces the lower one.
    if (hud.offsetParent === null) {
      const alt = document.querySelector<HTMLElement>(k === 0 ? '[data-sky]' : '[data-outer]');
      alt?.scrollIntoView({ block: k === 0 ? 'center' : 'start', behavior: reduced() ? 'auto' : 'smooth' });
      return;
    }
    select(k);
    // A tab's own hash (#hud-bodies, #hud-exits) lands on the whole log, title included; a row
    // hash lands on the row. Both clear the sticky nav (scroll-margin-top in site.css).
    const to = target === panels[k] ? hud.closest('section') ?? hud : target;
    to?.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
  };
  // A whole vstro row opens its card, as its name does.
  hud.querySelectorAll<HTMLElement>('[data-row-open]').forEach((row) => {
    row.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a, button')) return;
      row.querySelector<HTMLElement>('[data-ficha-open]')?.click();
    });
  });
  hud.querySelectorAll<HTMLElement>('[data-hud-caption]').forEach((c) => { c.hidden = true; });
  list.hidden = false;
  select(0);
  follow();
  window.addEventListener('hashchange', follow);
}

/* ---------------------------------------------------------------------------------------------
   Nav menus (wide screens, where the plane replaces the Registro): Projects and Outer spaces
   become disclosure buttons that drop a plain list. Escape closes and returns focus to the
   button; so do a click outside or focus leaving the menu. Picking a project closes the menu
   and opens its card (the card hands focus back to the button when it closes). Narrower
   screens keep the plain links to the Registro.
   --------------------------------------------------------------------------------------------- */
function initNavMenus(): void {
  const wide = window.matchMedia?.('(min-width: 860px)');
  const menus = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-menu]')).flatMap((menu) => {
    const link = menu.querySelector<HTMLElement>('[data-menu-link]');
    const btn = menu.querySelector<HTMLButtonElement>('[data-menu-trigger]');
    const panel = menu.querySelector<HTMLElement>('[data-menu-panel]');
    return link && btn && panel ? [{ menu, link, btn, panel }] : [];
  });
  if (!wide || !menus.length) return;
  type Menu = (typeof menus)[number];
  const isOpen = (m: Menu): boolean => m.btn.getAttribute('aria-expanded') === 'true';
  const close = (m: Menu, focus = false): void => {
    m.btn.setAttribute('aria-expanded', 'false');
    m.panel.hidden = true;
    if (focus) m.btn.focus();
  };
  const mode = (): void => {
    menus.forEach((m) => {
      m.link.hidden = wide.matches;
      m.btn.hidden = !wide.matches;
      close(m);
    });
  };
  menus.forEach((m) => {
    m.btn.addEventListener('click', () => {
      const was = isOpen(m);
      menus.forEach((o) => close(o));
      if (was) return;
      m.btn.setAttribute('aria-expanded', 'true');
      m.panel.hidden = false;
    });
    m.menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen(m)) { e.stopPropagation(); close(m, true); }
    });
    // Capture: runs before the card opens, so the card remembers the button, not a hidden item.
    m.panel.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('a')) return;
      m.btn.focus();
      close(m);
    }, true);
    m.menu.addEventListener('focusout', (e) => {
      if (!m.menu.contains(e.relatedTarget as Node | null)) close(m);
    });
  });
  document.addEventListener('click', (e) => {
    menus.forEach((m) => { if (!m.menu.contains(e.target as Node)) close(m); });
  });
  wide.addEventListener?.('change', mode);
  mode();
}

export function initCosmos(): void {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-starfield]').forEach(attachStarfield);
  const planets = new Map<HTMLCanvasElement, PlanetControl>();
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-planet]').forEach((c) => planets.set(c, attachPlanet(c)));
  initBridge();
  initReadout();
  initHud();
  initNavMenus();
  initFichas(planets);
  initScreensaver();
  initOrbitDay();
}
