# CLAUDE.md

Landing page for **vstrofago** ("Projects, notes and other things."). Astro, fully static, deployed to GitHub Pages. Bilingual: English is the default at `/`, Spanish at `/es/`.

## Commands

- `npm run dev`: dev server at http://localhost:4321
- `npm run build`: static build to `dist/`. Run it before calling any change done.
- `npm run preview`: serve the build

## How it's put together

- `src/pages/index.astro` and `src/pages/es/index.astro` only pick a language and render `src/components/Landing.astro`.
- Sections, in order: `Header` (sticky nav), `Chart` (the plane), `Hud` ("Registro"), then `Fichas` (one `<dialog>` card per project), `Footer` (the AsciiBanner; on wide screens the wordmark, one line and days in orbit sit inside its bottom band, so the plane gets the room) and `Screensaver`. No section numbering (no "00", "01"). The browser tab title is just `vstrofago`.
- **One view per device.** Wide screens (≥860px) get the plane and hide the Registro (only with JS; without JS both stay, so nothing is out of reach). Phones get the welcome (title only) and the Registro, for legibility; the plane is hidden. Nav: Proyectos / Notas / Espacios exteriores (Projects / Notes / Outer spaces). They are links to `#hud-bodies` / `#hud-exits`; on wide screens with JS, cosmos.ts turns Projects and Outer spaces into disclosure menus that drop a plain list (projects open their card, outer spaces go to their link), for quick, accessible navigation.
- **The plane** (`Chart.astro`): the whole section is one plane; cosmos.ts draws its grid (faint, cells a twelfth of the width) and the bridge to the section's real size, hours along the top and declinations down the left. Down the page: the centred, small welcome; the readout and magnitudes; the upper space (every project in `projects.ts` as a star at its position in `src/data/sky.ts`, grouped by proximity into three fixed constellations, one per project `field` in `projects.ts`: **Automata** (AI: agent skills, MCP servers), **Systemis** (an application or whole system someone uses) and **Creavis** (artistic and creative work: themes, music, audiovisual); `fields` in `sky.ts` gives each its name, centre and label spot, and a project without a place lands near its centre); then, in the middle of the page, a vertical Einstein–Rosen bridge (the grid's lines converge into a mouth, an hourglass wireframe throat, a second mouth) that flares into the lower space, another space holding the outer spaces (the links in `spaces.ts`) scattered on its straight grid like the stars above, each flying a 9×9 pixel ship (`ds/Ship.astro`); `ship` and `at` (position) are set per link in `spaces.ts`. `bridge` in `sky.ts` sets the mouths and the flare as fractions of the bridge zone / lower space, plus the mouth radius and ring tilt. Catalog numbers (`VS-001`…) come from the order in `projects.ts`. Stars open their card; without JS they link to the Registro rows.
- **The Registro** (`Hud.astro`): a ship's-HUD frame with two tabs, Vstros (projects; each row opens its card, where the links live) and Espacios exteriores / Outer spaces (links), each a plain data table. Keep it clean and unsold (corner brackets, a tab strip, mono readouts, hairline rows, no effects beyond the caret).
- Copy lives in `src/i18n/ui.ts`. Every key exists in both `en` and `es`; add new strings to both. Never hard-code visible text in a component.
- Content lists live in `src/data/` (`projects.ts`, `sky.ts`, `spaces.ts`), with `{ en, es }` for anything translated. Octicon paths live in `src/data/icons.ts`.
- Internal links go through `homeFor(lang)` / `withBase(path)` from `src/i18n/ui.ts`, because the site may be served from a sub-path (`BASE_PATH`). Never write a bare `/something` href.
- There is no UI framework on the client. Scripts, loaded once from `src/layouts/Base.astro`: `src/scripts/stoico.ts` (the Stoico behaviours) and `src/scripts/cosmos.ts` (the chart's, which uses `src/scripts/ascii.ts`, the ASCIIGen player), plus a tiny inline script in `<head>` that applies the stored theme before first paint. They attach behaviour to markup:
  - `[data-theme-toggle]`: dark ⇄ light. Stored in `localStorage` under `stoico-theme`, the same key the blog uses (same origin), so the choice carries over. Every storage access is in `try/catch`; without storage it stays dark.
  - `[data-nav]`: glass + hairline only after scrolling.
  - `[data-reveal]`: fade + 16px rise, once. Hidden only when `html.js` is set, so no-JS shows everything.
  - `[data-parallax]` / `[data-parallax-layer]`: the chart's field follows the cursor by ≤14px.
  - `canvas[data-marble]`: MarbleField (not on this page now; kept as the system's port). `[data-ascii-banner]`: AsciiBanner.
  - cosmos.ts: `canvas[data-starfield]` (faint fixed stars; an invisible star-eater, the vstrofago, drifts across and devours a few, which relight later), `[data-cosmos]` (the plane: grid, coordinate marks and the vertical bridge, redrawn on resize; the throat's lines flow down, faster while an outer space is hovered or focused; ghost stars ride offset-paths down a grid line, through the throat, to each outer space; not drawn when the plane is hidden; without JS a CSS grid stands in), `[data-sky]` (the upper space: the RA/Dec readout), `canvas[data-planet]` (procedural 1-bit planets: live is a formed world, wip is part wireframe, soon is a dust disc), `dialog[data-ficha]` (cards, opened from `[data-star]` / `[data-ficha-open]` / `[data-ficha-go]`), `[data-hud]` (accessible tabs; follows `#vs-…` / `#hud-bodies` / `#hud-exits`, landing on the whole log clear of the nav, or on the plane's spaces when the Registro is hidden; a vstro row opens its card), `[data-nav-menu]` (wide screens: the Projects / Outer spaces disclosures; Escape, a click outside or focus leaving closes them and focus returns to the button), `[data-screensaver]` (a starfield after 60s idle), `[data-orbit-day]`.
  - `[data-ascii-anim]` (ascii.ts): an ASCIIGen export (monochrome utf8 only). Frame 1 is inlined at build; the rest lazy-load 4 at a time, play by elapsed time at the component's `fps` (the hole uses 12, inside the ASCII tick range; its export says 20 by default), pause offscreen and in hidden tabs, stay on frame 1 under reduced motion, show the error text if a frame fails, and scale to the box without changing the grid (10px, line-height 1). Not on the page now (the `hole` export stays in `public/ascii/hole/`); to use one: export into `public/ascii/<name>/` and use `<AsciiAnimation name="<name>" errorText={…} />`, and wire `attachAsciiAnimation` from cosmos.ts.
  MarbleField and AsciiBanner are ports of the Stoico React components (`components/motion/*.jsx`); keep the algorithms, ramps and timings as they are. The planets use the MarbleField's Bayer matrix; they tick at 80–100ms like the ASCII. New effects must respect `prefers-reduced-motion` and pause offscreen, like the existing ones.

## Design system: Stoico (follow it, don't improvise)

The source of truth is the **Stoico** design system (the vstrofago design language, built in Claude Design). `src/styles/stoico/` mirrors its `tokens/` and `components/` folders verbatim, except `tokens/fonts.css`, which is replaced by the self-hosted `src/styles/fonts.css`. Don't edit them; if the system changes, copy them again. Page layout and the typography primitives go in `src/styles/site.css`, tokens only.

**Philosophy.** One philosophy, four voices. This page speaks **Aura** in mode **A02 Atmospheric**, but as a place to explore rather than a pitch: no calls to action, a star chart instead of a hero. Ink ground, no dither behind the chart (it only hurt legibility). The page is a plane; in its middle the grid sinks into an Einstein–Rosen bridge, and the outer spaces (the links) sit in the other space below it. Y2K touches (screensaver, days in orbit, the HUD) stay quiet and monochrome. Target: 90% calm, 10% surprise. Before shipping anything, run the design test: clarity, breathing, one priority, restraint (could something go?), one memorable moment, coherence, right voice, works without motion, colour or effects.

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
- **Voice.** Calm, precise, a little literary. Sentence case everywhere (buttons, nav, headings). Labels are mono uppercase; this page drops the section index numbers (`01`, `02`). Headlines 2–6 words, often a full sentence with a period. No emoji, no exclamation marks, no hype, no "NEW" badges.
- **The mark.** The 9×9 pixel star (`Mark.astro`, same drawing as `public/favicon.svg`, which is white on dark tabs and ink on light ones).

## Accessibility

Keep: the skip link, one `h1`, section `aria-labelledby`, the Stoico focus ring (2px gap + 2px `--fg`), decorative ASCII and canvases `aria-hidden`, `lang`/`hreflang` on the language links, a labelled theme toggle. Text contrast stays at 4.5:1 or more in both themes.

## Fonts

`src/assets/fonts/` holds WOFF2 files subset to Latin + Latin-1, general punctuation, arrows and `⌘ ✓ ●`: Geist and Geist Mono (variable, from the `geist` npm package) and Geist Pixel Square (from `@fontsource/geist-pixel`). Geist Pixel has no arrows: never put `→ ↗` in pixel text. If new copy needs other characters, re-subset with fontTools `pyftsubset`.
