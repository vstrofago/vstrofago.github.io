// The star chart's behaviours, on top of stoico.ts (same rules: plain DOM, monochrome, every
// effect pauses offscreen or in a hidden tab and stills under prefers-reduced-motion).
//
//   [data-starfield]      faint fixed stars behind the chart; something unseen eats a few
//   canvas[data-nebula]   the chart's nebula: warped clouds and filaments, very slow
//   canvas[data-hole]     the black hole the links orbit (accretion disc, lensed far side)
//   [data-sky]            the cursor readout: right ascension / declination, or the hovered star
//   canvas[data-planet]   a procedural planet, dithered to 1 bit against the Bayer matrix
//   [data-ficha]          the bodies' cards (<dialog>): opened from a star, a row, or each other
//   [data-screensaver]    after a minute idle, a starfield; any input wakes the page
//   [data-hud]            the on-board log: two tabs (bodies, exits) over one frame
//   [data-orbit-day]      "Day 0007": days since the site went up

import { reduced, reducedQuery, watchVisibility, toRGB, BAYER4, mhash, fbm } from './stoico';
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
  document.querySelectorAll<HTMLElement>('[data-closer]').forEach((li) => { li.hidden = false; });
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
   Nebula: a slow, faint texture behind the sky. Three layers of the system's fbm, one warping
   another (the billow), with a ridged pass for thin filaments. Spread evenly and capped to a
   sparse dither, so it reads as grain that drifts, never as a grey shape. Time moves at a
   fraction of the MarbleField's pace and the whole field breathes over about a minute.
   --------------------------------------------------------------------------------------------- */
function attachNebula(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const block = Number(canvas.dataset.blockSize ?? 5);
  let w = 0, h = 0, t = 17.3, visible = true, timer = 0;
  let img: ImageData | null = null;
  let rgb: [number, number, number] = [237, 237, 234];

  const draw = (): void => {
    if (!img) return;
    const d = img.data, s = 0.009 * (block / 5) * (360 / Math.max(240, w)) * 1.4;
    const breath = 0.85 + 0.15 * Math.sin(t * 0.9);
    for (let y = 0; y < h; y++) {
      const py = y * s;
      for (let x = 0; x < w; x++) {
        const px = x * s;
        const q0 = fbm(px + t * 0.6, py - t * 0.25, 3);
        const q1 = fbm(px + 5.2 - t * 0.3, py + 1.3 + t * 0.4, 3);
        const v = fbm(px + 3.2 * q0 + 1.7, py + 3.2 * q1 + 9.2, 4);
        // A texture, not a body: spread evenly, and capped so even the densest cloud stays a
        // sparse dither (at most ~5 dots in 16), never a patch of light grey.
        const cloud = Math.max(0, Math.min(1, (v - 0.36) / 0.4));
        const ridge = 1 - Math.abs(2 * fbm(px * 2.3 + q1 * 2 + 3.1, py * 2.3 - q0 * 2 + t * 0.5, 3) - 1);
        const val = Math.min(0.3, breath * (0.22 * cloud + 0.16 * ridge ** 6 * cloud));
        // Half Bayer, half fixed per-cell noise: at these low densities pure Bayer is a
        // regular lattice (a screen door); the mix keeps it grain.
        const thr = 0.5 * (BAYER4[y & 3][x & 3] + 0.5) / 16 + 0.5 * mhash(x, y + 97);
        const on = val > thr, i = (y * w + x) * 4;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = on ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  const recolor = (): void => { rgb = toRGB(canvas.parentElement ?? document.body, getComputedStyle(canvas).color); };
  const size = (): void => {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    w = Math.max(1, Math.ceil(cw / block));
    h = Math.max(1, Math.ceil(ch / block));
    canvas.width = w;
    canvas.height = h;
    img = ctx.createImageData(w, h);
    recolor();
    draw();
  };
  const run = (): void => {
    window.clearInterval(timer);
    if (reduced()) return;
    timer = window.setInterval(() => {
      if (!visible || document.hidden) return;
      t += 0.0025;
      draw();
    }, 100);
  };

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(canvas);
  watchVisibility(canvas, (v) => { visible = v; });
  document.addEventListener('stoico:theme', () => { recolor(); draw(); });
  reducedQuery()?.addEventListener?.('change', run);
  size();
  run();
}

/* ---------------------------------------------------------------------------------------------
   Black hole (an Einstein–Rosen bridge, for the links). A void, a thin photon ring, a tilted
   accretion disc turning faster near the centre, and the disc's far side lensed into an arc
   over and under the void, the way it bends around a real one. The approaching side is a
   little brighter (Doppler beaming): brightness only, no colour. Pointing at an exit makes
   the disc turn faster for a moment, as if it pulled.
   --------------------------------------------------------------------------------------------- */
function attachHole(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const block = Number(canvas.dataset.blockSize ?? 2);
  const box = canvas.closest<HTMLElement>('.hole') ?? canvas;
  const RH = 0.19, IN = 0.3, OUT = 0.96, FLAT = 0.2;
  const tilt = (-7 * Math.PI) / 180, ct = Math.cos(tilt), st = Math.sin(tilt);
  let w = 0, h = 0, spin = 0, pull = 0, pullTo = 0, visible = true, timer = 0;
  let img: ImageData | null = null;
  let fg: [number, number, number] = [237, 237, 234];
  let bg: [number, number, number] = [11, 11, 10];
  let ink = true;

  const disc = (rr: number, ang: number): number => {
    if (rr < IN || rr > OUT) return -1;
    const b = Math.pow(1 - (rr - IN) / (OUT - IN), 1.3);
    const a = ang + spin / (rr + 0.12);
    const tex = noise3(Math.cos(a) * 1.3 + 11, Math.sin(a) * 1.3, rr * 11);
    return b * (0.4 + 0.85 * tex);
  };
  const draw = (): void => {
    if (!img) return;
    const d = img.data, half = w / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = (x + 0.5 - half) / half, v = (y + 0.5 - h / 2) / half;
        const X = u * ct + v * st, Yr = -u * st + v * ct, Y = Yr / FLAT;
        const rr = Math.sqrt(X * X + Y * Y);
        const r2 = Math.sqrt(u * u + v * v);
        let val = -1, voidPx = false, ringPx = false;

        const flat = disc(rr, Math.atan2(Y, X));
        const doppler = 1 + 0.4 * (-X / (rr || 1));
        if (flat >= 0 && Yr > 0) {
          val = flat * doppler; // the near side, in front of everything
        } else if (r2 < RH) {
          voidPx = true;
        } else {
          if (r2 < RH * 1.09) { val = 1; ringPx = true; } // photon ring
          if (r2 >= RH * 1.12 && r2 < RH * 2.2) {
            const th = Math.atan2(v, u);
            const lensed = disc(IN + ((r2 - RH * 1.12) / (RH * 1.08)) * (OUT - IN) * 0.9, th * 2);
            if (lensed >= 0) val = Math.max(val, lensed * 0.85 * Math.pow(Math.abs(Math.sin(th)), 0.55));
          }
          if (flat >= 0) val = Math.max(val, flat * doppler * 0.9); // the far side, behind
        }
        const i = (y * w + x) * 4;
        if (voidPx) {
          // The horizon is always dark: ground colour on ink, ink on paper.
          const c = ink ? bg : fg;
          d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
        } else if (ringPx && !ink) {
          // On paper the ring is a thread of paper between the ink void and the ink disc.
          d[i] = bg[0]; d[i + 1] = bg[1]; d[i + 2] = bg[2]; d[i + 3] = 255;
        } else {
          const on = val > (BAYER4[y & 3][x & 3] + 0.5) / 16;
          d[i] = fg[0]; d[i + 1] = fg[1]; d[i + 2] = fg[2]; d[i + 3] = on ? 255 : 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  const recolor = (): void => {
    fg = toRGB(box, getComputedStyle(canvas).color);
    bg = toRGB(box, 'var(--bg)');
    ink = bg[0] + bg[1] + bg[2] < 384;
  };
  const size = (): void => {
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
  const run = (): void => {
    window.clearInterval(timer);
    if (reduced()) return;
    timer = window.setInterval(() => {
      if (!visible || document.hidden) return;
      pull += (pullTo - pull) * 0.12;
      spin += 0.012 * (1 + 5 * pull);
      draw();
    }, TICK);
  };

  box.querySelectorAll<HTMLElement>('[data-hole-exit]').forEach((a) => {
    const on = (): void => { pullTo = 1; };
    const off = (): void => { pullTo = 0; };
    a.addEventListener('pointerenter', on);
    a.addEventListener('pointerleave', off);
    a.addEventListener('focus', on);
    a.addEventListener('blur', off);
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(canvas);
  watchVisibility(canvas, (v) => { visible = v; });
  document.addEventListener('stoico:theme', () => { recolor(); draw(); });
  reducedQuery()?.addEventListener?.('change', run);
  size();
  run();
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
    select(k);
    target?.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
  };
  hud.querySelectorAll<HTMLElement>('[data-hud-caption]').forEach((c) => { c.hidden = true; });
  list.hidden = false;
  select(0);
  follow();
  window.addEventListener('hashchange', follow);
}

export function initCosmos(): void {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-starfield]').forEach(attachStarfield);
  const planets = new Map<HTMLCanvasElement, PlanetControl>();
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-planet]').forEach((c) => planets.set(c, attachPlanet(c)));
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-nebula]').forEach(attachNebula);
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-hole]').forEach(attachHole);
  initReadout();
  initHud();
  initFichas(planets);
  initScreensaver();
  initOrbitDay();
}
