// The star chart's behaviours, on top of stoico.ts (same rules: plain DOM, monochrome, every
// effect pauses offscreen or in a hidden tab and stills under prefers-reduced-motion).
//
//   [data-starfield]      faint fixed stars behind the chart; something unseen eats a few
//   [data-cosmos]         the plane: one space at a time, joined by a 2D Einstein–Rosen bridge
//   [data-sky]            the cursor readout: right ascension / declination, or the hovered star
//   canvas[data-planet]   a procedural planet, dithered to 1 bit against the Bayer matrix
//   [data-ficha]          the bodies' cards (<dialog>): opened from a star, a row, or each other
//   [data-screensaver]    after a minute idle, a starfield; any input wakes the page
//   [data-hud]            the on-board log: two tabs (bodies, exits) over one frame
//   [data-nav-menu]       wide screens: Projects / Outer spaces drop a plain list
//   .outer__field         the fleet: the outer spaces' ships patrol their grid
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
   The plane and its Einstein–Rosen bridge, in 2D (wide screens). The page doesn't scroll: the
   plane shows one space at a time, mine (the stars) or the outer spaces (the ships). Its grid
   (redrawn here to the section's real size, faint, cells a twelfth of the width) starts under
   all the information; hour marks sit along its top, declination marks down the left of mine.
   Near the grid's top right corner the plane sinks into a mouth: every point within `reach`
   cells is pulled toward it and twisted, and rings flow in. Crossing (the mouth, or the tabs in
   the tabs prototype, or a #outer / #hud-exits link) pulls the whole space, grid and all, into
   the mouth, and the other space comes out of its own. Under reduced motion it simply swaps.
   Not drawn when the plane is hidden (phones use the Registro); without JS both spaces stack on
   one scrolling page over a plain CSS grid.
   --------------------------------------------------------------------------------------------- */
interface Pt { x: number; y: number }
interface BridgeGeo { col: number; row: number; reach: number; pull: number; twist: number }
type SpaceKey = 'here' | 'outer';
/** The warp: how hard the mouth pulls (0–1), how far (px), how much it twists (radians). */
interface Warp { m: Pt; pull: number; reach: number; twist: number }

const DECK_QUERY = '(min-width: 860px)';

function initBridge(): void {
  const sec = document.querySelector<HTMLElement>('[data-cosmos]');
  const svg = sec?.querySelector<SVGSVGElement>('svg[data-warp]');
  const upper = sec?.querySelector<HTMLElement>('[data-sky]');
  const field = sec?.querySelector<HTMLElement>('.outer__field');
  if (!sec || !svg || !upper || !field) return;
  let geo: BridgeGeo;
  try { geo = JSON.parse(sec.dataset.bridge ?? ''); } catch { return; }
  // Prototype switch: ?portal=tabs shows the tab strip instead of the mouth.
  const asked = new URLSearchParams(location.search).get('portal');
  if (asked === 'tabs' || asked === 'corner') sec.dataset.portal = asked;
  const tabsMode = sec.dataset.portal === 'tabs';
  const spaces: Record<SpaceKey, HTMLElement | null> = {
    here: sec.querySelector<HTMLElement>('[data-space="here"]'),
    outer: sec.querySelector<HTMLElement>('[data-space="outer"]'),
  };
  if (!spaces.here || !spaces.outer) return;
  const tablist = sec.querySelector<HTMLElement>('[data-space-tabs]');
  const tabs = Array.from(tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
  const portals = Array.from(sec.querySelectorAll<HTMLButtonElement>('[data-portal-go]'));
  const field0 = sec.querySelector<HTMLElement>('.cosmos__field');
  const deck = window.matchMedia?.(DECK_QUERY);
  const r1 = (n: number): string => n.toFixed(1);
  const ease = (t: number): number => { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c); };
  const top = (el: HTMLElement): number => el.getBoundingClientRect().top - sec.getBoundingClientRect().top;
  const ns = 'http://www.w3.org/2000/svg';
  const layer = (): SVGGElement => svg.appendChild(document.createElementNS(ns, 'g'));
  svg.innerHTML = '';
  const gGrid = layer(), gRings = layer(), gLabels = layer();

  let current: SpaceKey = 'here';
  let busy = false;
  let hover = 0; // 0–1, eased: the mouth deepens while pointed at or focused
  let phase = 0; // the rings' inward flow
  let crossing: { p: number; m: Pt } | null = null; // during a crossing: progress and the mouth

  const isDeck = (): boolean => !!deck?.matches && getComputedStyle(upper).display !== 'none';

  // Where the grid starts, its rows, and the mouth, for the space on show.
  const layout = () => {
    const W = sec.clientWidth, H = sec.clientHeight, cell = W / 12;
    const gTop = current === 'here' ? top(upper) : top(field);
    const row = current === 'here' ? upper.offsetHeight / 6 : cell;
    const mouth = tabsMode
      ? { x: W / 2, y: (gTop + H) / 2 }
      : { x: W - cell * geo.col, y: gTop + Math.min(row, cell) * geo.row };
    return { W, H, cell, gTop, row, mouth };
  };

  const warpAt = (p: Pt, w: Warp): Pt => {
    const vx = p.x - w.m.x, vy = p.y - w.m.y, d = Math.hypot(vx, vy);
    if (!d || !w.pull) return p;
    const g = Math.exp(-((d / w.reach) ** 2));
    const dd = d * (1 - w.pull * g), th = Math.atan2(vy, vx) + w.twist * g;
    return { x: w.m.x + Math.cos(th) * dd, y: w.m.y + Math.sin(th) * dd };
  };

  const warpNow = (L: ReturnType<typeof layout>): Warp => {
    const reach0 = L.cell * geo.reach;
    const rest = tabsMode ? 0 : geo.pull + (0.86 - geo.pull) * hover * 0.35;
    const twist0 = tabsMode ? 0 : geo.twist + hover * 0.35;
    if (!crossing) return { m: L.mouth, pull: rest, reach: reach0, twist: twist0 };
    const e = ease(crossing.p), diag = Math.hypot(L.W, L.H);
    return {
      m: crossing.m,
      pull: rest + (0.985 - rest) * e,
      reach: reach0 + diag * 1.6 * crossing.p * crossing.p,
      twist: twist0 + 2.2 * e,
    };
  };

  const pathOf = (pts: Pt[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join('');
  const line = (a: Pt, b: Pt, w: Warp): Pt[] => {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    return Array.from({ length: n + 1 }, (_, i) => warpAt({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }, w));
  };

  const drawGrid = (): void => {
    const L = layout(), w = warpNow(L);
    const paths: string[] = [];
    const add = (cls: string, pts: Pt[]): void => { paths.push(`<path class="${cls}" d="${pathOf(pts)}"/>`); };
    const decAt = (y: number): number => Math.round(60 - ((y - L.gTop) / L.row) * 20);
    for (let y = L.gTop, k = 0; y < L.H + 1; y += L.row, k++) {
      add(current === 'here' && decAt(y) === -20 ? 'w-grid w-floor' : 'w-grid', line({ x: 0, y }, { x: L.W, y }, w));
    }
    for (let i = 0; i <= 12; i++) add(i === 0 || i === 12 ? 'w-grid w-edge' : 'w-grid', line({ x: i * L.cell, y: L.gTop }, { x: i * L.cell, y: L.H }, w));
    gGrid.innerHTML = paths.join('');

    // Coordinates, above and beside the grid, never inside it: hours just over the first row,
    // declinations on each row of mine, by the left edge. They fade while crossing.
    const labels: string[] = [];
    if (current === 'here') {
      for (let i = 1; i < 12; i++) labels.push(`<text class="w-label" x="${r1(i * L.cell)}" y="${r1(L.gTop - 10)}" text-anchor="middle">${String(i * 2).padStart(2, '0')}h</text>`);
      for (let y = L.gTop + L.row; y < L.H - 4; y += L.row) {
        const dec = decAt(y);
        labels.push(`<text class="w-label" x="8" y="${r1(y - 6)}">${dec > 0 ? '+' : dec < 0 ? '−' : ''}${Math.abs(dec)}°</text>`);
      }
    }
    gLabels.innerHTML = labels.join('');
    gLabels.style.opacity = crossing ? String(1 - ease(crossing.p * 3)) : '';
    drawRings(L, w);
  };

  // The mouth: rings flowing inward, denser toward the middle as the plane falls away, and the
  // dark hole they fall into (the corner mouth, at rest). While crossing, the throat: rings
  // rushing out of the mouth, as if flying through it, strongest at the swap.
  const drawRings = (L: ReturnType<typeof layout>, w: Warp): void => {
    const out: string[] = [];
    const R = L.cell * geo.reach * 0.66;
    if (crossing) {
      const k = ease(crossing.p * 1.4), diag = Math.hypot(L.W, L.H), t = performance.now() / 1000;
      for (let i = 0; i < 12; i++) {
        const u = ((i + t * 3.2) % 12) / 12, r = 4 * Math.pow(diag / 4, u);
        out.push(`<circle class="w-ring" cx="${r1(w.m.x)}" cy="${r1(w.m.y)}" r="${r1(r)}" stroke-opacity="${(k * (1 - u) * 0.9).toFixed(2)}"/>`);
      }
    } else if (!tabsMode) {
      const N = 7;
      for (let i = 0; i < N; i++) {
        const f = ((i + N - phase) % N) / N, r = R * f * f;
        if (r < 3) continue;
        out.push(`<circle class="w-ring" cx="${r1(w.m.x)}" cy="${r1(w.m.y)}" r="${r1(r)}" stroke-opacity="${(Math.min(1, f * 3) * (1 - f) * 1.4).toFixed(2)}"/>`);
      }
      out.push(`<circle class="w-hole" cx="${r1(w.m.x)}" cy="${r1(w.m.y)}" r="${r1(Math.max(4, R * 0.07))}"/>`);
    }
    gRings.innerHTML = out.join('');
  };

  const place = (): void => {
    if (!isDeck()) { sec.classList.remove('is-bridged'); return; }
    const L = layout();
    sec.style.setProperty('--mx', `${r1(L.mouth.x)}px`);
    sec.style.setProperty('--my', `${r1(L.mouth.y)}px`);
    sec.style.setProperty('--mr', `${r1(L.cell * geo.reach * 0.5)}px`);
    svg.setAttribute('viewBox', `0 0 ${r1(L.W)} ${r1(L.H)}`);
    drawGrid();
    sec.classList.add('is-bridged');
  };

  // The space on show; the other one is hidden (and so inert). The tabs follow.
  const show = (key: SpaceKey): void => {
    current = key;
    (Object.keys(spaces) as SpaceKey[]).forEach((k) => { spaces[k]!.hidden = isDeck() && k !== key; });
    tabs.forEach((tab) => {
      const on = tab.getAttribute('aria-controls') === key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    sec.dataset.space = key;
  };

  const tween = (dur: number, from: number, to: number, step: (p: number) => void): Promise<void> => new Promise((done) => {
    const t0 = performance.now();
    const frame = (now: number): void => {
      const u = Math.min(1, (now - t0) / dur);
      step(from + (to - from) * u);
      if (u < 1) requestAnimationFrame(frame); else done();
    };
    requestAnimationFrame(frame);
  });

  // The space itself falls with the grid: shrunk and turned toward the mouth, fading out.
  const fall = (el: HTMLElement, m: Pt, p: number): void => {
    const e = ease(p);
    el.style.transformOrigin = `${r1(m.x)}px ${r1(m.y)}px`;
    el.style.transform = p ? `rotate(${r1((2.2 * e * 180) / Math.PI)}deg) scale(${(1 - 0.97 * e).toFixed(3)})` : '';
    el.style.opacity = p ? String(1 - ease(p * 1.25)) : '';
    if (field0) field0.style.scale = p ? String(1 + 0.25 * e) : '';
  };

  const go = async (to: SpaceKey, { animate = true, focus = true } = {}): Promise<void> => {
    if (busy || to === current) return;
    if (!isDeck()) { spaces[to]!.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); return; }
    const from = current;
    if (animate && !reduced()) {
      busy = true;
      sec.classList.add('is-crossing');
      const mFrom = layout().mouth;
      crossing = { p: 0, m: mFrom };
      await tween(700, 0, 1, (p) => { crossing!.p = p; drawGrid(); fall(spaces[from]!, mFrom, p); });
      show(to);
      fall(spaces[from]!, mFrom, 0);
      const mTo = layout().mouth;
      crossing = { p: 1, m: mTo };
      fall(spaces[to]!, mTo, 1);
      await tween(800, 1, 0, (p) => { crossing!.p = p; drawGrid(); fall(spaces[to]!, mTo, p); });
      crossing = null;
      sec.classList.remove('is-crossing');
      busy = false;
    } else {
      show(to);
    }
    place();
    if (focus) spaces[to]!.focus({ preventScroll: true });
  };

  portals.forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.portalGo as SpaceKey));
    const ease0 = (to: number): void => {
      if (reduced() || tabsMode) return;
      const from = hover;
      tween(260, 0, 1, (u) => { hover = from + (to - from) * ease(u); if (!crossing) drawGrid(); });
    };
    b.addEventListener('pointerenter', () => ease0(1));
    b.addEventListener('pointerleave', () => ease0(0));
    b.addEventListener('focus', () => ease0(1));
    b.addEventListener('blur', () => ease0(0));
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => go(tab.getAttribute('aria-controls') as SpaceKey, { focus: false }));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const k = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[k].focus();
      go(tabs[k].getAttribute('aria-controls') as SpaceKey, { focus: false });
    });
  });
  // The nav and the Registro's links cross too (#outer, #hud-exits; #here, #hud-bodies).
  document.addEventListener('cosmos:go', (e) => {
    const d = (e as CustomEvent<{ to: SpaceKey; animate?: boolean }>).detail;
    go(d.to, { animate: d.animate ?? true, focus: d.animate ?? true });
  });

  const mode = (): void => {
    const on = !!deck?.matches;
    if (tablist) tablist.hidden = !(on && tabsMode);
    portals.forEach((b) => { b.hidden = !on || tabsMode; });
    if (tabsMode) {
      (Object.keys(spaces) as SpaceKey[]).forEach((k) => {
        spaces[k]!.setAttribute('role', on ? 'tabpanel' : 'region');
      });
    }
    show(current);
    place();
  };

  // The rings flow inward at the ASCII's tick, only while the mouth is on show.
  let visible = true;
  watchVisibility(sec, (v) => { visible = v; });
  window.setInterval(() => {
    if (tabsMode || crossing || reduced() || !visible || document.hidden || !isDeck()) return;
    phase = (phase + 0.05 + hover * 0.1) % 7;
    drawRings(layout(), warpNow(layout()));
  }, TICK);

  deck?.addEventListener?.('change', mode);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { if (!crossing) place(); }).observe(sec);
  document.fonts?.ready.then(place);
  mode();
  const id = decodeURIComponent(location.hash.slice(1));
  if (id === 'outer' || id === 'hud-exits') go('outer', { animate: false, focus: false });
  window.addEventListener('hashchange', () => {
    const to = decodeURIComponent(location.hash.slice(1));
    if (to === 'outer' || to === 'here') go(to);
  });
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
      document.dispatchEvent(new CustomEvent('cosmos:go', { detail: { to: k === 0 ? 'here' : 'outer' } }));
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

/* ---------------------------------------------------------------------------------------------
   The fleet: the outer spaces' ships patrol their grid. Every 1.4s one ship takes a step of
   half a grid cell along a grid axis (never diagonally), turning its hull to the heading, and
   never strays more than two steps from its post (its `x` / `y` in src/content/spaces/) or
   comes too close to another ship. A ship being pointed at or focused holds still, so it's always easy to click;
   the others keep moving. Still under reduced motion, paused offscreen and in hidden tabs.
   --------------------------------------------------------------------------------------------- */
function initFleet(): void {
  const field = document.querySelector<HTMLElement>('.outer__field');
  const sec = document.querySelector<HTMLElement>('[data-cosmos]');
  if (!field || !sec) return;
  const spots = Array.from(field.querySelectorAll<HTMLElement>('.outer__spot'));
  if (!spots.length) return;
  const pos = spots.map(() => ({ gx: 0, gy: 0 }));
  const RANGE = 2, GAP_X = 170, GAP_Y = 56;
  const DIRS = [
    { dx: 0, dy: -1, deg: 0 },
    { dx: 1, dy: 0, deg: 90 },
    { dx: 0, dy: 1, deg: 180 },
    { dx: -1, dy: 0, deg: -90 },
  ];
  let visible = true;
  watchVisibility(field, (v) => { visible = v; });
  const home = (el: HTMLElement): { x: number; y: number } => ({ x: el.offsetLeft, y: el.offsetTop });
  const tick = (): void => {
    if (reduced() || !visible || document.hidden || getComputedStyle(field).display === 'none') return;
    const step = sec.clientWidth / 24; // half a grid cell
    const i = Math.floor(Math.random() * spots.length);
    const el = spots[i];
    if (el.matches(':hover') || el.contains(document.activeElement)) return;
    const here = pos[i];
    const options = DIRS.filter(({ dx, dy }) => {
      const gx = here.gx + dx, gy = here.gy + dy;
      if (Math.abs(gx) > RANGE || Math.abs(gy) > RANGE) return false;
      const a = home(el);
      const ax = a.x + gx * step, ay = a.y + gy * step;
      return spots.every((o, j) => {
        if (j === i) return true;
        const b = home(o);
        return Math.abs(b.x + pos[j].gx * step - ax) > GAP_X || Math.abs(b.y + pos[j].gy * step - ay) > GAP_Y;
      });
    });
    if (!options.length) return;
    const d = options[Math.floor(Math.random() * options.length)];
    here.gx += d.dx;
    here.gy += d.dy;
    el.style.setProperty('--heading', `${d.deg}deg`);
    el.style.transform = `translate(${here.gx * step}px, ${here.gy * step}px)`;
  };
  window.setInterval(tick, 1400);
}

export function initCosmos(): void {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-starfield]').forEach(attachStarfield);
  const planets = new Map<HTMLCanvasElement, PlanetControl>();
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-planet]').forEach((c) => planets.set(c, attachPlanet(c)));
  initBridge();
  initReadout();
  initHud();
  initNavMenus();
  initFleet();
  initFichas(planets);
  initScreensaver();
  initOrbitDay();
}
