# CLAUDE.md

Landing page for **vstrofago** ("Projects, notes and other things."). Astro, fully static, deployed to GitHub Pages. Bilingual: English is the default at `/`, Spanish at `/es/`.

## Commands

- `npm run dev`: dev server at http://localhost:4321
- `npm run build`: static build to `dist/`. Run it before calling any change done.
- `npm run preview`: serve the build

## How it's put together

- `src/pages/index.astro` and `src/pages/es/index.astro` only pick a language and render `src/components/Landing.astro`.
- Sections, in order: `Header` (sticky nav), `Hero`, `Work` (01, paged three at a time), `Elsewhere` (02), `Footer` (the AsciiBanner, then the wordmark and one line; no links, since the nav and Elsewhere already carry them). The browser tab title is just `vstrofago`.
- Copy lives in `src/i18n/ui.ts`. Every key exists in both `en` and `es`; add new strings to both. Never hard-code visible text in a component.
- Content lists live in `src/data/` (`projects.ts`, `spaces.ts`), with `{ en, es }` for anything translated. Octicon paths live in `src/data/icons.ts`.
- Internal links go through `homeFor(lang)` / `withBase(path)` from `src/i18n/ui.ts`, because the site may be served from a sub-path (`BASE_PATH`). Never write a bare `/something` href.
- There is no UI framework on the client. The only script is `src/scripts/stoico.ts`, loaded once from `src/layouts/Base.astro`, plus a tiny inline script in `<head>` that applies the stored theme before first paint. `stoico.ts` attaches behaviour to markup:
  - `[data-theme-toggle]`: dark ⇄ light. Stored in `localStorage` under `stoico-theme`, the same key the blog uses (same origin), so the choice carries over. Every storage access is in `try/catch`; without storage it stays dark.
  - `[data-nav]`: glass + hairline only after scrolling.
  - `[data-reveal]`: fade + 16px rise, once. Hidden only when `html.js` is set, so no-JS shows everything.
  - `[data-parallax]` / `[data-parallax-layer]`: the hero field follows the cursor by ≤14px.
  - `[data-paginate="3"]` + `[data-pager]`: the Work list shows three rows per page; the pager is `hidden` in the markup and revealed by the script, so without JS every row shows.
  - `canvas[data-marble]`: MarbleField. `[data-ascii-banner]`: AsciiBanner.
  These are ports of the Stoico React components (`components/motion/*.jsx`); keep the algorithms, ramps and timings as they are. New effects must respect `prefers-reduced-motion` and pause offscreen, like the existing ones.

## Design system: Stoico (follow it, don't improvise)

The source of truth is the **Stoico** design system (the vstrofago design language, built in Claude Design). `src/styles/stoico/` mirrors its `tokens/` and `components/` folders verbatim, except `tokens/fonts.css`, which is replaced by the self-hosted `src/styles/fonts.css`. Don't edit them; if the system changes, copy them again. Page layout and the typography primitives go in `src/styles/site.css`, tokens only.

**Philosophy.** One philosophy, four voices. This page speaks **Aura** ("Look at this.", marketing) in mode **A02 Atmospheric**: ink ground, a masked MarbleField behind the hero. Target: 90% calm, 10% surprise. Before shipping anything, run the design test: clarity, breathing, one priority, restraint (could something go?), one memorable moment, coherence, right voice, works without motion, colour or effects.

- **Themes.** Dark is the default (`--bg` #0B0B0A). Light is `[data-theme="light"]` on `<html>`. The ASCII footer is always ink (`data-theme="dark"` on the footer); `site.css` restates the dark aliases for that case.
- **Colour.** Neutral first; it must work in monochrome. `--fg` / `--fg-muted` / `--fg-subtle` for text, `--border` (hairline) and `--border-strong` (controls). **One accent, Ember `--accent` (#F47B53), for one moment per composition**: on this page, the hero's "See the work" button (and the ASCII bite in the banner). Semantic colours only with a word. In the light theme `--fg-subtle` is lifted to gray-700 in `site.css` so text stays at 4.5:1.
- **Type, one job per face.**
  - Geist Pixel (`--font-pixel`): headlines, the hero Display, and every mention of **vstrofago** (always lowercase, via `Wordmark`). Never below ~28px except the wordmark.
  - Geist (`--font-sans`): everything general. Headings weight 500 with tight tracking; body 15/1.6.
  - Geist Mono (`--font-mono`): labels (11px, uppercase, +0.08em), indices, handles, metadata, code.
  - IBM Plex Serif: long-form reading only (the blog), not used here.
  - Weights stay 400–500: hierarchy comes from scale and space, not bold.
- **Components** live in `src/components/ds/` and mirror the system's React components class for class: `Button` (`st-btn`: primary once per surface, secondary, ghost, accent for the Aura hero only, link), `Badge`, `Label`, `Icon` (Octicons, inline SVG), `Mark` (the 9×9 pixel star), `Wordmark`. Use them rather than new markup.
- **Layout.** 12-column asymmetric grids: sticky label left (4) + content right (8). Marketing sections breathe at 160px. Lists use hairline rows, not boxed cards.
- **Spacing** on the 4px grid: `--space-1` … `--space-12` (4 … 256). 16 within a group, 48 between groups, 128+ between sections.
- **Motion** smooth and optional: `--ease-out` for entrances, durations from `--dur-*`. Reveal once, on a section's one moment, not on every block. ASCII ticks at 70–90ms. Everything stops under reduced motion.
- **Voice.** Calm, precise, a little literary. Sentence case everywhere (buttons, nav, headings). Labels are mono uppercase with an index (`01  Work`). Headlines 2–6 words, often a full sentence with a period. No emoji, no exclamation marks, no hype, no "NEW" badges.
- **The mark.** The 9×9 pixel star (`Mark.astro`, same drawing as `public/favicon.svg` in Ember).

## Accessibility

Keep: the skip link, one `h1`, section `aria-labelledby`, the Stoico focus ring (2px gap + 2px `--fg`), decorative ASCII and canvases `aria-hidden`, `lang`/`hreflang` on the language links, a labelled theme toggle. Text contrast stays at 4.5:1 or more in both themes.

## Fonts

`src/assets/fonts/` holds WOFF2 files subset to Latin + Latin-1, general punctuation, arrows and `⌘ ✓ ●`: Geist and Geist Mono (variable, from the `geist` npm package) and Geist Pixel Square (from `@fontsource/geist-pixel`). Geist Pixel has no arrows: never put `→ ↗` in pixel text. If new copy needs other characters, re-subset with fontTools `pyftsubset`.
