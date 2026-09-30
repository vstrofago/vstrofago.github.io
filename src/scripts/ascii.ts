// Player for ASCIIGen exports rendered by AsciiAnimation.astro ([data-ascii-anim]).
//
//   - Frame 1 is already in the <pre> (inlined at build time); it shows immediately.
//   - The other frames load lazily, once the box is near the viewport, four at a time, and are
//     cached. The text is kept exactly as exported and set with textContent (never as HTML).
//   - Playback follows elapsed time: frame = floor(elapsed * fps / 1000) % frameCount, only
//     counting time while the box is visible and the tab is shown. A frame that hasn't arrived
//     yet holds the previous one.
//   - Under prefers-reduced-motion it stays on frame 1 and loads nothing more.
//   - The <pre> keeps its character grid (10px, line-height 1) and is scaled to its box.
//   - Failed loads show the box's error text. Everything is torn down when the page unloads.
//   - `setRate(n)` speeds playback up or down (the black hole pulls harder while an exit is
//     hovered).

import { reduced, reducedQuery } from './stoico';

const CONCURRENCY = 4;

export interface AsciiPlayer { setRate(rate: number): void; destroy(): void }

export function attachAsciiAnimation(box: HTMLElement): AsciiPlayer {
  const pre = box.querySelector<HTMLPreElement>('.ascii-anim__pre');
  const error = box.querySelector<HTMLElement>('.ascii-anim__error');
  const noop = { setRate() {}, destroy() {} };
  if (!pre) return noop;

  const src = box.dataset.src ?? '';
  const cols = Number(box.dataset.cols) || 1;
  const rows = Number(box.dataset.rows) || 1;
  const count = Math.max(1, Number(box.dataset.frames) || 1);
  const fps = Math.max(1, Number(box.dataset.fps) || 20);
  const frames: (string | undefined)[] = new Array(count);
  frames[0] = pre.textContent ?? '';

  let shown = 0, elapsed = 0, last = 0, raf = 0, rate = 1;
  let visible = false, started = false, failed = false, dead = false;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

  /* Fit: measure one cell on the frame's own first line (a Range over the rendered text, divided
     by the scale already applied), then scale the grid to the box's width. */
  let scale = 1;
  const cellWidth = (): number => {
    const node = pre.firstChild;
    const text = node?.nodeType === Node.TEXT_NODE ? node.textContent ?? '' : '';
    const len = text.indexOf('\n') > 0 ? text.indexOf('\n') : text.length;
    if (!node || len < 1) return 6;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, len);
    return range.getBoundingClientRect().width / scale / len || 6;
  };
  const fit = (): void => {
    const w = cols * cellWidth(), h = rows * 10;
    scale = box.clientWidth / w;
    pre.style.width = `${w}px`;
    pre.style.transform = `scale(${scale})`;
    box.style.height = `${h * scale}px`;
  };

  const fail = (): void => {
    if (failed) return;
    failed = true;
    box.classList.add('is-error');
    if (error) error.hidden = false;
  };

  const url = (i: number): string => `${src}frame_${String(i + 1).padStart(5, '0')}.txt`;
  const load = async (): Promise<void> => {
    let next = 1;
    const worker = async (): Promise<void> => {
      while (next < count && !dead) {
        const i = next++;
        try {
          const res = await fetch(url(i), { signal: controller?.signal });
          if (!res.ok) throw new Error(String(res.status));
          frames[i] = await res.text();
        } catch {
          if (dead) return;
          fail();
          return;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, count - 1) }, worker));
  };

  const tick = (ts: number): void => {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(250, ts - last) : 0;
    last = ts;
    if (!visible || document.hidden || reduced()) return;
    elapsed += dt * rate;
    const i = Math.floor((elapsed * fps) / 1000) % count;
    if (i !== shown && frames[i] !== undefined) {
      pre.textContent = frames[i]!;
      shown = i;
    }
  };

  const start = (): void => {
    if (started || dead) return;
    started = true;
    if (reduced() || count < 2) return; // frame 1 stays
    void load();
    raf = requestAnimationFrame(tick);
  };

  const onReduced = (): void => {
    if (!reduced()) { start(); return; }
    pre.textContent = frames[0] ?? '';
    shown = 0;
    elapsed = 0;
  };

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
  ro?.observe(box);
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) start();
      }, { rootMargin: '200px 0px' })
    : null;
  if (io) io.observe(box); else { visible = true; start(); }
  reducedQuery()?.addEventListener?.('change', onReduced);
  fit();
  // The first fit may run before the web font arrives (fallback cells are wider); fit again
  // once fonts are ready, or the grid ends up narrower than its box.
  document.fonts?.ready.then(() => { if (!dead) fit(); });
  document.fonts?.addEventListener?.('loadingdone', fit);

  const destroy = (): void => {
    dead = true;
    cancelAnimationFrame(raf);
    controller?.abort();
    ro?.disconnect();
    io?.disconnect();
    reducedQuery()?.removeEventListener?.('change', onReduced);
    document.fonts?.removeEventListener?.('loadingdone', fit);
  };
  // Tear down when the page is really going away (not when it enters the back/forward cache).
  window.addEventListener('pagehide', (e) => { if (!e.persisted) destroy(); });
  return { setRate(r: number) { rate = r; }, destroy };
}
