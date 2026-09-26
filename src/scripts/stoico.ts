// Stoico behaviours for the landing, as plain DOM code (the site ships no framework).
// MarbleField and AsciiBanner are ports of the design system's React components
// (components/motion/*.jsx): algorithms, ramps, matrices and timings are the system's own; only
// the wiring changed. Every effect pauses offscreen or when the tab is hidden, and freezes to a
// still frame under prefers-reduced-motion.
//
//   [data-theme-toggle]   dark ⇄ light, remembered in localStorage (shared with the blog)
//   [data-nav]            glass + hairline once the page has scrolled
//   [data-reveal]         fade + 16px rise, once, when it enters the viewport
//   [data-parallax]       the hero field follows the cursor by ≤14px
//   canvas[data-marble]   MarbleField: slowly swirling dithered marble
//   [data-paginate]       a list shown N rows at a time, with its [data-pager] after it
//   [data-ascii-banner]   AsciiBanner: the ASCII star, eaten and reformed

const THEME_KEY = 'stoico-theme';

const reducedQuery = (): MediaQueryList | null => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)');
  } catch {
    return null;
  }
};
const reduced = (): boolean => reducedQuery()?.matches ?? false;

function watchVisibility(el: Element, onChange: (visible: boolean) => void): void {
  if (typeof IntersectionObserver === 'undefined') return;
  new IntersectionObserver((entries) => onChange(entries[entries.length - 1].isIntersecting)).observe(el);
}

/** Resolves any CSS colour (including var(--…)) to RGB in the context of `el`. */
function toRGB(el: Element, color: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = color;
  probe.style.display = 'none';
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const m = c.match(/[\d.]+/g) ?? ['237', '237', '234'];
  return [+m[0], +m[1], +m[2]];
}

/* ---------------------------------------------------------------------------------------------
   Theme. The inline script in Base.astro applies the stored choice before first paint.
   --------------------------------------------------------------------------------------------- */
function initTheme(): void {
  const root = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const sync = (): void => {
    const light = root.dataset.theme === 'light';
    buttons.forEach((b) => b.setAttribute('aria-label', (light ? b.dataset.labelDark : b.dataset.labelLight) ?? ''));
    if (meta) meta.content = light ? '#FAFAF8' : '#0B0B0A';
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage blocked: the choice lasts for this page only */
      }
      sync();
      document.dispatchEvent(new CustomEvent('stoico:theme'));
    }),
  );
  sync();
}

/* ---------------------------------------------------------------------------------------------
   Nav: transparent at rest, glass + hairline after 24px of scroll.
   --------------------------------------------------------------------------------------------- */
function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;
  const update = (): void => nav.classList.toggle('nav--scrolled', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------------------------
   Reveal (components/motion/Reveal.jsx): once, as it enters view. CSS does the motion. The
   system uses a 15% threshold; a bottom rootMargin does the same job for elements taller than
   the viewport, which a ratio threshold would never reveal.
   --------------------------------------------------------------------------------------------- */
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (typeof IntersectionObserver === 'undefined') {
    els.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------------------------------------
   Pagination: `ol[data-paginate="3"]` shows three rows at a time; the [data-pager] that follows
   it is revealed with previous / next and "1 / 2". Without JS every row shows.
   --------------------------------------------------------------------------------------------- */
function initPagination(): void {
  document.querySelectorAll<HTMLElement>('[data-paginate]').forEach((list) => {
    const size = Math.max(1, Number(list.dataset.paginate) || 3);
    const rows = Array.from(list.children) as HTMLElement[];
    const pages = Math.ceil(rows.length / size);
    const pager = list.parentElement?.querySelector<HTMLElement>('[data-pager]');
    if (!pager || pages <= 1) return;
    const prev = pager.querySelector<HTMLButtonElement>('[data-pager-prev]');
    const next = pager.querySelector<HTMLButtonElement>('[data-pager-next]');
    const status = pager.querySelector<HTMLElement>('[data-pager-status]');
    let page = 0;
    const show = (to: number, from?: HTMLButtonElement | null): void => {
      page = Math.max(0, Math.min(pages - 1, to));
      rows.forEach((row, i) => { row.hidden = Math.floor(i / size) !== page; });
      if (status) status.textContent = `${page + 1} / ${pages}`;
      if (prev) prev.disabled = page === 0;
      if (next) next.disabled = page === pages - 1;
      if (!from) return;
      // The button just used may now be disabled, which drops focus; hand it to the other one.
      if (from.disabled) (from === next ? prev : next)?.focus();
      if (list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    };
    prev?.addEventListener('click', () => show(page - 1, prev));
    next?.addEventListener('click', () => show(page + 1, next));
    pager.hidden = false;
    show(0);
  });
}

/* ---------------------------------------------------------------------------------------------
   Hero parallax: the field drifts against the cursor, ≤14px across, ≤10px down (AuraHero.jsx).
   Fine pointers only; off under reduced motion.
   --------------------------------------------------------------------------------------------- */
function initParallax(): void {
  let fine = false;
  try {
    fine = window.matchMedia('(pointer: fine)').matches;
  } catch {
    /* no matchMedia: leave it off */
  }
  if (!fine) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((section) => {
    const layer = section.querySelector<HTMLElement>('[data-parallax-layer]');
    if (!layer) return;
    section.addEventListener('mousemove', (e) => {
      if (reduced()) return;
      const r = section.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layer.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0)`;
    });
    section.addEventListener('mouseleave', () => {
      layer.style.transform = '';
    });
  });
}

/* ---------------------------------------------------------------------------------------------
   MarbleField (components/motion/MarbleField.jsx). Domain-warped fbm thresholded against a 4×4
   Bayer matrix; one canvas pixel per `blockSize` CSS pixels. Colour from the canvas' CSS color.
   --------------------------------------------------------------------------------------------- */
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function mhash(ix: number, iy: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h >>> 0) / 4294967296;
}
const sm = (t: number): number => t * t * (3 - 2 * t);
function noise(x: number, y: number): number {
  const ix = Math.floor(x) | 0, iy = Math.floor(y) | 0, fx = x - ix, fy = y - iy, ux = sm(fx), uy = sm(fy);
  const a = mhash(ix, iy), b = mhash(ix + 1, iy), c = mhash(ix, iy + 1), d = mhash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x: number, y: number, o: number): number {
  let v = 0, amp = 0.5, fr = 1, n = 0;
  for (let i = 0; i < o; i++) { v += amp * noise(x * fr, y * fr); n += amp; amp *= 0.5; fr *= 2.07; }
  return v / n;
}

function attachMarble(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const blockSize = Number(canvas.dataset.blockSize ?? 5);
  const speed = Number(canvas.dataset.speed ?? 1);
  const scale = Number(canvas.dataset.scale ?? 1);
  const contrast = Number(canvas.dataset.contrast ?? 2.1);
  let raf = 0, frame = 0, visible = true, ow = 0, oh = 0;
  let img: ImageData | null = null;
  let rgb: [number, number, number] = [237, 237, 234];

  const draw = (): void => {
    if (!img) return;
    const d = img.data, t = frame * 0.003 * speed, s = scale * 0.016 * (blockSize / 5), warp = 3.8;
    for (let y = 0; y < oh; y++) {
      const py = y * s;
      for (let x = 0; x < ow; x++) {
        const px = x * s;
        const q0 = fbm(px + t, py, 3), q1 = fbm(px + 5.2, py + 1.3 + t * 0.6, 3);
        let v = fbm(px + warp * q0 + 1.7, py + warp * q1 + 9.2, 4);
        v = Math.min(v * v * contrast, 1);
        const on = v > (BAYER4[y & 3][x & 3] + 0.5) / 16, i = (y * ow + x) * 4;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = on ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  const recolor = (): void => {
    rgb = toRGB(canvas.parentElement ?? document.body, getComputedStyle(canvas).color);
  };
  const size = (): void => {
    const r = canvas.getBoundingClientRect();
    ow = Math.max(1, Math.ceil(r.width / blockSize));
    oh = Math.max(1, Math.ceil(r.height / blockSize));
    canvas.width = ow;
    canvas.height = oh;
    img = ctx.createImageData(ow, oh);
    recolor();
    draw();
  };
  const tick = (): void => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    frame++;
    draw();
  };
  const start = (): void => {
    cancelAnimationFrame(raf);
    if (!reduced()) raf = requestAnimationFrame(tick);
  };

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(canvas);
  watchVisibility(canvas, (v) => { visible = v; });
  document.addEventListener('stoico:theme', () => { recolor(); draw(); });
  reducedQuery()?.addEventListener?.('change', start);
  size();
  start();
}

/* ---------------------------------------------------------------------------------------------
   AsciiBanner (components/motion/AsciiBanner.jsx). A star sampled into ASCII density; it
   assembles (1.4s), something invisible eats it row by row (to 7.6s), the rest is gulped
   (to 8.4s), and it reforms on an 11s cycle. Three layers: field, star, the bite (--animation-accent, white here).
   --------------------------------------------------------------------------------------------- */
function hash(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
const FIELD_RAMP = ' .:-=+*';
function fieldChar(x: number, y: number, time: number): string {
  const waveA = 0.5 + 0.5 * Math.sin(x * 0.11 + time * 0.5 + 2 * Math.sin(y * 0.16 - time * 0.35));
  const waveB = 0.5 + 0.5 * Math.sin(y * 0.21 - time * 0.4 + x * 0.05);
  const field = waveA * waveB + (hash(x, y + Math.floor(time * 4)) - 0.5) * 0.16;
  const index = Math.floor(Math.pow(Math.max(field, 0), 1.25) * 9.5);
  return FIELD_RAMP.charAt(Math.max(0, Math.min(6, index)));
}
function sampleStar(columns: number, rows: number): number[][] {
  const output: number[][] = [];
  for (let y = 0; y < rows; y += 1) {
    const line: number[] = [];
    for (let x = 0; x < columns; x += 1) {
      const nx = ((x + 0.5) / columns) * 2 - 1;
      const ny = ((y + 0.5) / rows) * 2 - 1;
      const angle = Math.atan2(ny, nx);
      const radius = Math.sqrt(nx * nx + ny * ny);
      const edge = 0.32 + 0.14 * Math.cos(angle * 8);
      line.push(radius < edge ? Math.max(1, Math.min(9, Math.round((1 - radius / edge) * 9))) : 0);
    }
    output.push(line);
  }
  return output;
}

function attachAsciiBanner(box: HTMLElement): void {
  const [backgroundEl, foregroundEl, accentEl] = Array.from(box.querySelectorAll('pre'));
  if (!backgroundEl || !foregroundEl || !accentEl) return;
  const rowCount = Math.max(8, Math.floor(Number(box.dataset.rows ?? 30)));
  const size = Number(box.dataset.size ?? 11);
  const lineHeight = Math.round(size * 1.25);
  const characterWidth = size * 0.6;
  const aspect = lineHeight / characterWidth;

  const introDuration = 1.4, eatStart = 1.4, eatEnd = 7.6, gulpEnd = 8.4, cycle = 11;
  let columns = 0, logoColumns = 0, logoRows = 0, offsetX = 0, offsetY = 1;
  let logo: number[][] = [];
  let eaten = new Uint8Array(0);
  let born = new Float32Array(0);
  let crumbs: { x: number; y: number; age: number }[] = [];
  const mouth = { x: 0, y: 0, radius: 0, active: false };
  let time = 0, lastTime = 0, visible = true;

  const reset = (): void => {
    eaten = new Uint8Array(logoColumns * logoRows);
    born = new Float32Array(logoColumns * logoRows);
    crumbs = [];
    mouth.active = false;
  };
  const mouthAt = (now: number) => {
    const progress = (now - eatStart) / (eatEnd - eatStart);
    const radius = Math.max(1.3, logoRows * 0.055 * (0.8 + 0.4 * Math.abs(Math.sin(now * 16))));
    const count = Math.max(3, Math.ceil(logoRows / (radius * 1.7)));
    const index = Math.min(count - 1, Math.floor(progress * count));
    const fraction = progress * count - index;
    const span = logoColumns + 2 * radius * aspect;
    const across = index % 2 ? 1 - fraction : fraction;
    return {
      radius,
      x: across * span - radius * aspect,
      y: radius + (index / (count - 1)) * (logoRows - 2 * radius) + Math.sin(now * 9) * radius * 0.5,
    };
  };
  const eatAt = (m: { x: number; y: number; radius: number }, now: number): void => {
    const radius = m.radius;
    const minX = Math.max(0, Math.floor(m.x - radius * aspect - 1));
    const maxX = Math.min(logoColumns - 1, Math.ceil(m.x + radius * aspect + 1));
    const minY = Math.max(0, Math.floor(m.y - radius - 1));
    const maxY = Math.min(logoRows - 1, Math.ceil(m.y + radius + 1));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const index = y * logoColumns + x;
        if (eaten[index]) continue;
        const dx = (x - m.x) / aspect;
        const dy = y - m.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius * (1 + (hash(x * 1.3, y * 1.7) - 0.5) * 0.35)) {
          eaten[index] = 1;
          born[index] = now;
          if (logo[y][x] > 0 && crumbs.length < 40 && hash(x, y + now) > 0.6) crumbs.push({ x, y, age: 0 });
        }
      }
    }
  };
  const step = (now: number): void => {
    mouth.active = now >= eatStart && now <= eatEnd;
    if (mouth.active) {
      const start = Math.max(eatStart, lastTime);
      for (let index = 1; index <= 5; index += 1) {
        const sampleTime = start + (now - start) * index / 5;
        const m = mouthAt(sampleTime);
        eatAt(m, sampleTime);
        mouth.radius = m.radius;
        mouth.x = m.x;
        mouth.y = m.y;
      }
    } else if (now > eatEnd && now <= gulpEnd) {
      const progress = (now - eatEnd) / (gulpEnd - eatEnd);
      for (let index = 0; index < eaten.length; index += 1) {
        if (!eaten[index] && hash(index, 3.3) < progress) { eaten[index] = 1; born[index] = now; }
      }
    } else if (now > gulpEnd) {
      for (let index = 0; index < eaten.length; index += 1) {
        if (!eaten[index]) { eaten[index] = 1; born[index] = now; }
      }
    }
    lastTime = now;
    for (let index = crumbs.length - 1; index >= 0; index -= 1) {
      const crumb = crumbs[index];
      crumb.age += 1;
      const dx = mouth.x - crumb.x;
      const dy = (mouth.y - crumb.y) * aspect;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      crumb.x += dx / distance * 2.5;
      crumb.y += dy / distance / aspect * 2.5;
      if (crumb.age > 8 || !mouth.active || distance < mouth.radius * aspect * 0.6) crumbs.splice(index, 1);
    }
  };
  const renderFrame = (now: number): void => {
    const background: string[][] = [];
    const foreground: string[][] = [];
    const accent: string[][] = [];
    const reveal = Math.min(1, now / introDuration);
    const holeRadius = mouth.active ? mouth.radius : 0;
    for (let y = 0; y < rowCount; y += 1) {
      const bgLine: string[] = [], fgLine: string[] = [], accentLine: string[] = [];
      for (let x = 0; x < columns; x += 1) {
        const logoX = x - offsetX;
        const logoY = y - offsetY;
        const inLogo = logoX >= 0 && logoX < logoColumns && logoY >= 0 && logoY < logoRows;
        const density = inLogo ? logo[logoY][logoX] : 0;
        let foregroundChar = ' ';
        let accentChar = ' ';
        if (density > 0) {
          const index = logoY * logoColumns + logoX;
          const n = hash(logoX, logoY);
          if (now < introDuration && n > reveal) {
            foregroundChar = ' ';
          } else if (now < introDuration && n > reveal - 0.12) {
            accentChar = '#%&@$*+/\\'.charAt(Math.floor(hash(logoX + now * 9, logoY) * 9));
          } else if (eaten[index]) {
            const age = now - born[index];
            if (age < 0.4) {
              const level = Math.round(density * (1 - age / 0.4));
              if (level > 0) accentChar = ' .:-=+*#%@'.charAt(level);
            }
          } else {
            const dx = (logoX - mouth.x) / aspect;
            const dy = logoY - mouth.y;
            if (mouth.active && Math.sqrt(dx * dx + dy * dy) < holeRadius + 1.2 && hash(logoX + now * 7, logoY) > 0.35) {
              accentChar = '#%&@$*+/\\'.charAt(Math.floor(hash(logoX, logoY + now * 11) * 9));
            } else {
              foregroundChar = ' .:-=+*#%@'.charAt(density);
            }
          }
        }
        fgLine.push(foregroundChar);
        accentLine.push(accentChar);
        bgLine.push(foregroundChar === ' ' && accentChar === ' ' ? fieldChar(x, y, now + 2) : ' ');
      }
      background.push(bgLine);
      foreground.push(fgLine);
      accent.push(accentLine);
    }
    for (const crumb of crumbs) {
      const x = Math.round(crumb.x) + offsetX;
      const y = Math.round(crumb.y) + offsetY;
      if (x >= 0 && x < columns && y >= 0 && y < rowCount && accent[y][x] === ' ') {
        accent[y][x] = crumb.age > 9 ? '.' : crumb.age > 4 ? ':' : '*';
        foreground[y][x] = ' ';
        background[y][x] = ' ';
      }
    }
    const mouthX = mouth.x + offsetX;
    const mouthY = mouth.y + offsetY;
    for (let y = 0; y < rowCount; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        if (background[y][x] !== ' ' || accent[y][x] !== ' ') continue;
        const inHole = mouth.active
          && Math.pow((x - mouthX) / aspect, 2) + Math.pow(y - mouthY, 2) < Math.pow(holeRadius * 1.08, 2);
        const logoX = x - offsetX;
        const logoY = y - offsetY;
        const onLogo = logoX >= 0 && logoX < logoColumns && logoY >= 0 && logoY < logoRows
          && logo[logoY][logoX] > 0 && !eaten[logoY * logoColumns + logoX];
        if (!inHole && !onLogo) background[y][x] = fieldChar(x, y, now + 2);
      }
    }
    backgroundEl.textContent = background.map((line) => line.join('')).join('\n');
    foregroundEl.textContent = foreground.map((line) => line.join('')).join('\n');
    accentEl.textContent = accent.map((line) => line.join('')).join('\n');
  };
  const setup = (): void => {
    columns = Math.max(24, Math.floor(box.clientWidth / characterWidth));
    logoRows = rowCount - 4;
    logoColumns = Math.min(columns - 2, Math.round(logoRows * aspect));
    offsetX = Math.floor((columns - logoColumns) / 2);
    offsetY = 1;
    logo = sampleStar(logoColumns, logoRows);
    reset();
    if (reduced()) {
      for (let at = 0; at <= 4.6; at += 0.07) step(at);
      time = 4.6;
    }
    renderFrame(time);
  };

  setup();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(setup).observe(box);
  if (reduced()) return;
  watchVisibility(box, (v) => { visible = v; });
  window.setInterval(() => {
    if (document.hidden || !visible) return;
    time += 0.07;
    if (time >= cycle) {
      time = 0;
      lastTime = 0;
      reset();
    }
    step(time);
    renderFrame(time);
  }, 70);
}

export function initStoico(): void {
  initTheme();
  initNav();
  initReveal();
  initPagination();
  initParallax();
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-marble]').forEach(attachMarble);
  document.querySelectorAll<HTMLElement>('[data-ascii-banner]').forEach(attachAsciiBanner);
}
