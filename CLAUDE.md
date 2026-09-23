# CLAUDE.md

Landing page for **vstrofago** ("Projects, Notes, and other things."). Astro, fully static, deployed to GitHub Pages. Bilingual: English is the default at `/`, Spanish at `/es/`.

## Commands

- `npm run dev`: dev server at http://localhost:4321
- `npm run build`: static build to `dist/`. Run it before calling any change done.
- `npm run preview`: serve the build

## How it's put together

- `src/pages/index.astro` and `src/pages/es/index.astro` only pick a language and render `src/components/Landing.astro`.
- Copy lives in `src/i18n/ui.ts`. Every key exists in both `en` and `es`; add new strings to both. Never hard-code visible text in a component.
- Content lists live in `src/data/` (`projects.ts`, `spaces.ts`), with `{ en, es }` for anything translated.
- Internal links go through `homeFor(lang)` / `withBase(path)` from `src/i18n/ui.ts`, because the site may be served from a sub-path (`BASE_PATH`). Never write a bare `/something` href.
- There is no UI framework on the client. The only script is `src/scripts/brutalistoic.ts`, loaded once from `src/layouts/Base.astro`. It attaches behaviour to markup:
  - `[data-ascii-fill]` on `.bl-btn` / `.bl-tab`: the ASCII fill on hover and focus. Held filled when `aria-current="page"` or `aria-pressed="true"`.
  - `canvas.bl-bayer`: the animated Bayer dither (the Card ground).
  - `[data-ascii-banner]`: the AsciiBanner (the logo eaten by something invisible).
  These are ports of the brutalistoic React bundle; keep the algorithms, ramps and timings as they are. New effects must respect `prefers-reduced-motion` and pause offscreen, like the existing ones.

## Design system: brutalistoic (follow it, don't improvise)

The source of truth is the brutalistoic design system. `src/styles/tokens.css` and `src/styles/brutalistoic.css` are copies of its `tokens.css` (fonts removed, see `fonts.css`) and `components/bundle.css`. Don't edit them; if the system changes, copy them again. Page layout goes in `src/styles/site.css` and uses tokens only.

- **One dark theme.** Everything sits on `--bg` (#141414). Surfaces are set apart by a frame (`--bl-line`, 2px), never by a lighter fill. Flat 2D: square corners, no shadows, no gradients as decoration, no translate on press.
- **Colour.** `--fg` body, `--fgplus` headings and selected states, `--bl-muted` muted text and control borders, `--bl-line` frames, rules and dither (decorative only, never text). `--og` is the brand accent: primary button, selected tab, eyebrow rule, the ASCII bite. At most one other signal colour per piece (`--mg`, `--gr`, `--yl`, `--rd`, `--bl`), and status always carries a word, never colour alone. Links in prose are `--bl`.
- **Type, one job per face.**
  - Jacquard24 (`.bl-gothic`, `.bl-h1`): the page's H1 only, plus the footer wordmark. It runs small, so it is always the largest title on the page. `.bl-gothic` multiplies the *inherited* size by `--gothic-scale` (1.3); the hero overrides that with an explicit `clamp()` size (90px on desktop, the approved design).
  - Techno Vibe (`.bl-subtitle`, `.bl-eyebrow`, card titles): section heads (28px), eyebrows, card titles.
  - Space Grotesk: body and interface. `.bl-label` (12px uppercase, tracked) for buttons, tabs, badges and nav; `.bl-caption` (13px, muted) for hints.
  - Geist Mono: code, ASCII, the brand name in the header, handles.
  - Sanchez: notes, TL;DR and README titles only (not used on this page). IBM Plex Serif: blog entries only.
- **Components** (in `src/components/ds/`) mirror the system's React components class for class. Use them rather than new markup:
  - `Button`: `primary` once per view, `secondary` default, `ghost` text-only. Labels are one or two verbs.
  - `Card`: kicker, title, a paragraph. `titleFont="gothic"` only if the card *is* the page hero. Cards never get HUD corners.
  - `Badge`: `accent` (og) for LIVE, `default` for WIP, `outline` for SOON on this site.
  - `AsciiBanner`: once per page, as a hero or opening banner.
- **Spacing** on the 4px grid: `--space-1` … `--space-8` (4, 8, 12, 16, 24, 32, 48, 64).
- **Motion** in steps, not easing, for blinks and ASCII frames; hover fades 150–250ms. Everything stops under reduced motion.
- **Voice.** Short, direct, no exclamation marks, no emoji. Eyebrows lowercase and letter-spaced (`01 / projects`).
- **The mark.** The navbar uses the 9×9 pixel star in `StarMark.astro` (same drawing as `public/favicon.svg`), in `--og`.

## Accessibility

Keep: the skip link, one `h1`, section `aria-labelledby`, a visible 2px `--bl` focus ring, decorative ASCII and canvases `aria-hidden`, `lang`/`hreflang` on the language links. Text contrast stays at 4.5:1 or more (`--bl-muted` on `--bg` is 5.2:1; `--bl-line` is never used for text).

## Fonts

`src/assets/fonts/` holds WOFF files subset to Latin + Latin-1 plus the arrows, `✦ ✓` and block elements the system uses. If new copy needs other characters, re-subset from the full font files in the design system (fontTools `pyftsubset`).
