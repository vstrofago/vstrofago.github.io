# CLAUDE.md

Landing page for **vstrofago** ("Projects, notes and other things."). Astro, fully static, deployed to GitHub Pages. Bilingual: English is the default at `/`, Spanish at `/es/`.

## Commands

- `npm run dev`: dev server at http://localhost:4321
- `npm run build`: static build to `dist/`. Run it before calling any change done.
- `npm run preview`: serve the build

## How it's put together

- `src/pages/index.astro` and `src/pages/es/index.astro` only pick a language and render `src/components/Landing.astro`.
- Sections, in order: `Header` (sticky nav), `Chart` (00: a short welcome with the `h1` under the nav, then the sky at full width, with the black hole whose exits are the links), `Catalog` (01, every project in a terminal-style data table), `Elsewhere` (02, the links in the same kind of table), then `Fichas` (one `<dialog>` card per project), `Footer` (the AsciiBanner, the wordmark, one line, days in orbit, 88×31 buttons) and `Screensaver`. The browser tab title is just `vstrofago`.
- The chart: each project in `projects.ts` is a star at the position given in `src/data/sky.ts` (which also holds constellations and each planet's look; a project missing there gets a derived spot). Catalog numbers (`VS-001`…) come from the order in `projects.ts`. Stars are links to their catalog row, so without JS the chart is a table of contents. The black hole's position and the angles of its exits are in `sky.ts` too; its exits are the links in `spaces.ts`. The two tables below are the plain-text twin of the sky: keep them clean (mono status bar, hairline rows, no effects beyond the caret).
- Copy lives in `src/i18n/ui.ts`. Every key exists in both `en` and `es`; add new strings to both. Never hard-code visible text in a component.
- Content lists live in `src/data/` (`projects.ts`, `sky.ts`, `spaces.ts`, `badges.ts`), with `{ en, es }` for anything translated. Octicon paths live in `src/data/icons.ts`.
- Internal links go through `homeFor(lang)` / `withBase(path)` from `src/i18n/ui.ts`, because the site may be served from a sub-path (`BASE_PATH`). Never write a bare `/something` href.
- There is no UI framework on the client. Two scripts, loaded once from `src/layouts/Base.astro`: `src/scripts/stoico.ts` (the Stoico behaviours) and `src/scripts/cosmos.ts` (the chart's), plus a tiny inline script in `<head>` that applies the stored theme before first paint. They attach behaviour to markup:
  - `[data-theme-toggle]`: dark ⇄ light. Stored in `localStorage` under `stoico-theme`, the same key the blog uses (same origin), so the choice carries over. Every storage access is in `try/catch`; without storage it stays dark.
  - `[data-nav]`: glass + hairline only after scrolling.
  - `[data-reveal]`: fade + 16px rise, once. Hidden only when `html.js` is set, so no-JS shows everything.
  - `[data-parallax]` / `[data-parallax-layer]`: the chart's field follows the cursor by ≤14px.
  - `canvas[data-marble]`: MarbleField (not on this page now; kept as the system's port). `[data-ascii-banner]`: AsciiBanner.
  - cosmos.ts: `canvas[data-starfield]` (faint fixed stars), `canvas[data-nebula]` (the nebula: warped fbm clouds and ridged filaments, very slow, very faint), `canvas[data-hole]` (the black hole: void, photon ring, accretion disc, lensed far side; turns faster while an exit is hovered or focused), `[data-sky]` (the RA/Dec readout), `canvas[data-planet]` (procedural 1-bit planets: live is a formed world, wip is part wireframe, soon is a dust disc), `dialog[data-ficha]` (cards, opened from `[data-star]` / `[data-ficha-open]` / `[data-ficha-go]`), `[data-screensaver]` (a starfield after 60s idle), `[data-orbit-day]`.
  MarbleField and AsciiBanner are ports of the Stoico React components (`components/motion/*.jsx`); keep the algorithms, ramps and timings as they are. The nebula uses the MarbleField's `fbm`, and the nebula, planets and black hole its Bayer matrix; they tick at 80–100ms like the ASCII. New effects must respect `prefers-reduced-motion` and pause offscreen, like the existing ones.

## Design system: Stoico (follow it, don't improvise)

The source of truth is the **Stoico** design system (the vstrofago design language, built in Claude Design). `src/styles/stoico/` mirrors its `tokens/` and `components/` folders verbatim, except `tokens/fonts.css`, which is replaced by the self-hosted `src/styles/fonts.css`. Don't edit them; if the system changes, copy them again. Page layout and the typography primitives go in `src/styles/site.css`, tokens only.

**Philosophy.** One philosophy, four voices. This page speaks **Aura** in mode **A02 Atmospheric**, but as a place to explore rather than a pitch: no calls to action, a star chart instead of a hero. Ink ground, a faint nebula. The links are exits around a black hole (an Einstein–Rosen bridge): they lead to other spaces. Y2K touches (screensaver, 88×31 buttons, days in orbit, the terminal tables) stay quiet and monochrome. Target: 90% calm, 10% surprise. Before shipping anything, run the design test: clarity, breathing, one priority, restraint (could something go?), one memorable moment, coherence, right voice, works without motion, colour or effects.

- **Themes.** Dark is the default (`--bg` #0B0B0A). Light is `[data-theme="light"]` on `<html>`. The ASCII footer is always ink (`data-theme="dark"` on the footer); `site.css` restates the dark aliases for that case.
- **Colour.** Neutral first; it must work in monochrome. `--fg` / `--fg-muted` / `--fg-subtle` for text, `--border` (hairline) and `--border-strong` (controls). **No colour: the site is black and white.** Stoico's one accent (Ember) is mapped to `--fg` in `site.css` (`--accent`, `--accent-strong`, `--animation-accent`, `--selection`), so its moments (the ASCII bite, the brightest stars) stay monochrome. Don't reintroduce Ember or signal colours. Semantic colours only with a word. In the light theme `--fg-subtle` is lifted to gray-700 in `site.css` so text stays at 4.5:1.
- **Type, one job per face.**
  - Geist Pixel (`--font-pixel`): headlines, the hero Display, and every mention of **vstrofago** (always lowercase, via `Wordmark`). Never below ~28px except the wordmark.
  - Geist (`--font-sans`): everything general. Headings weight 500 with tight tracking; body 15/1.6.
  - Geist Mono (`--font-mono`): labels (11px, uppercase, +0.08em), indices, handles, metadata, code.
  - IBM Plex Serif: long-form reading only (the blog), not used here.
  - Weights stay 400–500: hierarchy comes from scale and space, not bold.
- **Components** live in `src/components/ds/` and mirror the system's React components class for class: `Button` (`st-btn`: primary once per surface, secondary, ghost, link; `accent` is not used here), `Badge`, `Label`, `Icon` (Octicons, inline SVG), `Mark` (the 9×9 pixel star), `Wordmark`. Use them rather than new markup.
- **Layout.** 12-column asymmetric grids: sticky label left (4) + content right (8). Marketing sections breathe at 160px. Lists use hairline rows, not boxed cards.
- **Spacing** on the 4px grid: `--space-1` … `--space-12` (4 … 256). 16 within a group, 48 between groups, 128+ between sections.
- **Motion** smooth and optional: `--ease-out` for entrances, durations from `--dur-*`. Reveal once, on a section's one moment, not on every block. ASCII ticks at 70–90ms. Everything stops under reduced motion.
- **Voice.** Calm, precise, a little literary. Sentence case everywhere (buttons, nav, headings). Labels are mono uppercase with an index (`01  Work`). Headlines 2–6 words, often a full sentence with a period. No emoji, no exclamation marks, no hype, no "NEW" badges.
- **The mark.** The 9×9 pixel star (`Mark.astro`, same drawing as `public/favicon.svg`, which is white on dark tabs and ink on light ones).

## Accessibility

Keep: the skip link, one `h1`, section `aria-labelledby`, the Stoico focus ring (2px gap + 2px `--fg`), decorative ASCII and canvases `aria-hidden`, `lang`/`hreflang` on the language links, a labelled theme toggle. Text contrast stays at 4.5:1 or more in both themes.

## Fonts

`src/assets/fonts/` holds WOFF2 files subset to Latin + Latin-1, general punctuation, arrows and `⌘ ✓ ●`: Geist and Geist Mono (variable, from the `geist` npm package) and Geist Pixel Square (from `@fontsource/geist-pixel`). Geist Pixel has no arrows: never put `→ ↗` in pixel text. If new copy needs other characters, re-subset with fontTools `pyftsubset`.
