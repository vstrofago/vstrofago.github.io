# Reproducible assets

Everything on the page that looks drawn is generated from a few lines of data, in code, so it
can be made again (or made for a new project) without an image editor. This file is the recipe
for each one. Nothing here uses colour: every asset draws in `currentColor` or `--fg` and works
in both themes.

## Layout rules (the plane)

These are rules, not suggestions. Check them in the browser after any change to the plane.

1. **Information sits above the grid.** The welcome, the coordinate readout, the magnitude
   legend and the hour marks always sit above the grid's first row. On wide screens the welcome
   and the readout stay put (`.cosmos__head`) while the map moves under them; the grid starts at
   the top of each side's `[data-sky]` box, under all of them. Declination marks sit by the left
   edge of each side, on their own row lines, never over a star's label.
2. **No project below −20°.** The rows are 20° of declination apart (+60° at the top, the −20°
   line drawn dashed). A star's `y` must be ≤ `FLOOR_Y` (66.6): the build fails on a file that
   breaks it, and `placeFor` clamps derived positions. Under the line is where the ships start.
3. **One size per star.** Every star is the same size (27px; the ships are 18px). Brightness says
   the status: live full (with a soft glow), wip 60%, soon 30%, and always a word beside it.
4. **One screen, no scroll** (wide screens, with JS). The plane is a map, dragged sideways: my
   space, the bridge, the archive. The footer and the Registro are hidden there; phones keep the
   welcome over the sketch, the Registro and the footer, and no-JS stacks everything.

## Where things are edited

Every project and every outer space is one Markdown file whose frontmatter is the data:
`src/content/projects/<id>.md` and `src/content/spaces/<id>.md`. The file name is the id.
Start from the templates in `src/content/_templates/` (they explain every field in comments).

- Copy the template into the folder and fill it, in any text or Markdown editor (GitHub's web
  editor works too).
- The frontmatter is flat (`title_en`, `title_es`, `x`, `y`…), so editors' property panels can
  edit every field as plain text, numbers and checkboxes.
- Don't rename a project's file unless you mean to: the name is the id, and the id seeds the
  planet.
- **Checked on every build:** `src/content.config.ts` validates each file (both languages,
  at least one link, the −20° floor, known fields, statuses, planet kinds and ships) and
  `src/data/projects.ts` / `spaces.ts` reject a `catalog` or `order` used twice. A broken
  rule fails `npm run build` with the file and the field. Run it after every change.
- The Markdown body under the frontmatter isn't rendered: use it for notes, remembering
  that the repo is public.
- Agents: `.claude/skills/add-to-chart/SKILL.md` is the step-by-step checklist.

## A new project (a star, its row and its card)

1. **Copy `src/content/_templates/project.md` to `src/content/projects/<id>.md`.**
   - `<id>`: kebab-case, stable. It seeds the planet, so renaming the file changes the planet.
   - `catalog`: the next free number (one more than the highest in use): it becomes `VS-00n`
     and sets the order everywhere. Never reuse or renumber one.
   - `category_en` / `category_es`, `title_*`, `description_*` (one line), `stack`
     (`stack / tags`, the card's composition; not `tags`, which Markdown editors reserve). Every
     text in both languages; empty titles show the placeholder.
   - `status`: `live` · `wip` · `soon` (magnitude 1.0 / 3.0 / 5.5, the star's brightness and
     the planet's state).
   - `archive`: `true` sends it past the bridge, to the archive (finished work, rarely
     touched): there it's a vstro in a row in catalog order, and its `x` / `y` are unused.
     Leave it `false` for featured and still-forming work, a star in my space.
   - `field`: `automata` (AI: agent skills, MCP servers) · `systemis` (an application or a
     whole system someone uses) · `creavis` (themes, music, audiovisual, anything artistic).
     This picks the constellation; there are no others.
   - `demo`, `github` ("Source"), `more`: at least one. They show in that order, and the
     first one set is the no-JS target of the project's name in the Registro.
2. **Its place:** `x`, `y` and `side`, near its constellation's other stars. `x` 0–100 across
   the upper space, `y` 0–66.6 (`FLOOR_Y`) down it, `side` is where the label hangs (`right`
   unless it would run off the page). Leave `x` and `y` empty and the star lands near its
   field's `center` (`fields` in `src/data/sky.ts`): fine for a first draft, not for keeping.
3. **The planet** (the card's picture): `planet`, `ring`, `moon`, `tilt`.
   - `planet`: `rocky` (continents: 3D value noise thresholded) or `gas` (bands along the
     latitude, warped by noise). Empty derives the whole planet (kind, ring, moon, tilt) from
     the id; `ring`, `moon` and `tilt` only apply with a `planet` set.
   - `ring`: a flat ring in the tilted plane, drawn in front of and behind the sphere.
   - `moon`: a small lit moon on a tilted orbit, hidden when it passes behind.
   - `tilt`: axial tilt in degrees (−25…25 reads well).
   - The surface pattern and the start of the spin come from a hash of `id`: the same id always
     draws the same world. The light comes from the upper left.
   - `status` changes the body, never a colour: `live` is a formed world; `wip` keeps part of
     the surface as a latitude/longitude wireframe ("under construction"); `soon` is a faint
     core inside a swirling dust disc (no ring, no moon).
   - Rendering: 1 bit, thresholded against the MarbleField's 4×4 Bayer matrix, one canvas
     pixel per `data-block-size` CSS pixels (3 in the card), ticking every 80ms while the card
     is open, still under reduced motion. Code: `attachPlanet` in `src/scripts/cosmos.ts`.
4. **Nothing else.** The star on the chart, its constellation line, the Registro row, the nav
   menu entry and the card are all generated from that one file. Copy (labels like
   "Magnitude", "Under construction") lives in `src/i18n/ui.ts`.

### Card anatomy (`src/components/Fichas.astro`)

One native `<dialog>` per project, `id="ficha-vs-00n"`:

- Left: the planet canvas (large, 1-bit, turning) and its caption (`planet.live|wip|soon`).
- Right: a `Label` with the catalog number and the category; the title (`heading--1`); the
  description; a fact list (constellation, magnitude with its word, composition = `tags`,
  coordinates from `coordsOf(x, y)`); the links as secondary buttons.
- Bottom: previous / next (wrap around the list); top right: close.
- Opened from a star, a Registro row, a nav menu entry or another card; focus returns to
  whatever opened the first one.
- Phones (≤760px): the planet steps back into the card's backdrop (faint, cut by the top
  right corner, not interactive) and its caption goes, so the whole card, previous / next and
  close fit one screen without scrolling (spacing tightens further under 720px of height).
  Check a new project's card at 360×640 if its description is long.

## A new outer space (a link and its ship)

**Copy `src/content/_templates/space.md` to `src/content/spaces/<id>.md`**:
`order`, `name_en` / `name_es`, `handle`, `url`, `ship`, `x`, `y`.

- `order`: the next free number; it sets the Registro's channel (`CH 01`…) and the menu order.
- `handle`: the address as shown, without `https://`. `url` empty renders it without a link.
- `ship`: one of the hulls in `src/data/ships.ts` (`probe`, `fighter`, `shuttle`, `saucer`,
  `rocket`). Prefer a hull no other space uses; for a new one, see below.
- `x`, `y`: where the ship starts: `x` 4–92 across my space (the build checks it), `y` 0–100
  down the band under the −20° line. Keep ~16 units between ships.

### The fleet (ships explore my space)

`initFleet` (`src/scripts/cosmos.ts`), styles in `site.css` (`.outer__spot`, `.outer__ship-btn`,
`.outer__go`):

- A ship is a button: its hull, centred on its point, and its name under it (11px mono,
  `--fg-subtle`). A click reveals its address under the name, the link (`.outer__go`, with
  `aria-expanded` on the button); another click, Escape or a click elsewhere hides it. Without
  JS the address always shows.
- Each ship rests at its post for a few seconds, then picks a destination 140–560px away that
  is clear of every star, star name and constellation name (+22px) and of the other ships'
  destinations (a ship's box is its hull, its name and room for the address). It turns toward
  it at `TURN` (80°/s; 0° is up), cruises at `SPEED` (30px/s), slowing over the last 80px and
  barely moving until its nose points the right way, parks 2.5–7.5s and sets off again.
- Ships fly under the stars (`z-index`), so a star is always clickable. A ship under the
  cursor, holding focus or opened holds still.
- The fleet stops offscreen, in hidden tabs and when the plane is hidden (phones), and stays at
  its posts under reduced motion.
- To tune it: `SPEED`, `TURN`, `HALF` (half a ship's box) and `CLEAR` in `initFleet`.

It then appears as a ship in my space, in the nav's Outer spaces menu and in the Registro's
second tab.

### Drawing a new ship (`src/data/ships.ts`)

A hull is nine strings of nine characters: `#` is a lit pixel, `.` is empty (the build
fails on any other shape). `ds/Ship.astro` turns each `#` into a 1×1 square in a
`viewBox="0 0 9 9"` path, `shape-rendering="crispEdges"`, filled with `currentColor`, exactly
like `Mark.astro`.

- Point it up (0° is up; the hull turns to its heading). Keep it symmetric left–right.
- Keep a clear silhouette at 14px (the nav menu) and 18px (the plane): no single isolated
  pixels inside the body, at most ~45 lit pixels of the 81.
- Leave the outer ring of pixels mostly empty where you can, so ships don't look bigger than
  the star mark.
- Add the name to `shipKinds` and the hull to `HULLS` in `src/data/ships.ts`; that's all
  (the content schema accepts the new name from there). A blank hull to start from:

  ```
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  ```

## The mark

`src/components/ds/Mark.astro` (and `public/favicon.svg`): the 9×9 pixel star, drawn as eight
path groups (core, three arm rings, four diagonals) so `motion="spin"` / `"build"` can animate
them. Don't redraw it; it's the design system's.

## The plane: a map, the bridge and coordinates

All in `initBridge` (`src/scripts/cosmos.ts`), redrawn to the world's real size on resize:

- **The map.** `.cosmos__world` is my space (a screen wide), the bridge's zone (`bridge.width`
  screens) and the archive (a screen), side by side, translated under `.cosmos__viewport`.
  Drag (a press that moves more than 5px pans and swallows the click that follows; it coasts
  at ×0.92 per frame when let go), a trackpad's swipe or the wheel, the arrow keys, or the tabs
  (`[data-map-go]`, a 450–1300ms cubic glide). Focus that lands out of view glides its side in.
  Reduced motion jumps instead of gliding.
- **The welcome rewrites itself.** When the middle of the screen crosses the middle of the
  bridge, `transmute()` turns the title and lead into the other side's (`data-words` on
  `.cosmos__head`): every 75ms positions settle left to right, each flickering through a few
  ASCII glyphs (`#%&*+=-/\<>_|:;~^`, `--fg-subtle`) first. Instant under reduced motion. The
  title keeps a 2-line height so the grid never jumps. Screen readers get the h1's fixed text.
- **The grid.** Cells are a twelfth of the screen's width; rows a sixth of the `[data-sky]`
  box's height (20° each), on both sides. Lines are `--border`; the −20° floor is dashed
  `--border-strong`. Hours along the top and declinations down the left of each side.
- **The bridge.** `bridge` in `src/data/sky.ts`: `width` (screens), `lead` (cells before the
  zone where the rows start bending, a hint at my space's right edge, and after it where they
  straighten), `mouthA` / `mouthB` (fractions of the zone), `radius` (of the grid's height)
  and `tilt` (how flat the rings look). The rows converge with `smoothstep` into mouth A while
  the columns become rings that crowd toward it (`--border`, then `--border-strong` near the
  rim); the throat is a slim hourglass (`r = Rm·(0.42 + 0.58·|2t−1|^1.8)`) of 6 rings and 18
  meridians, far halves dashed, over a `--bg` shadow; the rims are `--fg-muted` at 1.25px; the
  rows flare out past mouth B into the archive. Near meridians flow toward the archive, faster
  while the map moves or a ship is pointed at. Ghost stars ride a row through the throat to
  each archived vstro.
- **The archive.** Archived projects, as vstros in a row across the middle (evenly spaced,
  catalog order), names under them, a little dimmer, no constellations. A star opens its card.
- Coordinates: `coordsOf(x, y)` maps x 0–100 to 00h–24h and y 0–100 to +60°…−60°.

## The phones' sky sketch

Under 860px the plane is hidden, and `Chart.astro` renders a still sketch of the same sky
behind the welcome, at build time: the 12×6 grid with the −20° floor dashed, the constellation
lines, each project's star (one size, dimmed by status, no animation) and 56 dust stars from a
fixed hash. It's `aria-hidden`, takes no pointer events, sits at low opacity and fades out
at its edges (`.cosmos__sketch` in `site.css`). It follows the content by itself: nothing to
do when a project is added.

## Background stars and the star-eater

`attachStarfield` (`cosmos.ts`): about one star per 2,600px², positions and brightness from
`mhash(i, …)`, so every visit sees the same sky; one in twelve twinkles. The eater follows a
fixed Lissajous path (`sin`/`cos` of the frame count), bites within 24px, and relit stars fade
back in after 220–480 ticks.

## ASCII animations

ASCIIGen exports go in `public/ascii/<name>/{low,medium,high}/` exactly as exported
(`meta.json`, `frame_00001.txt`…). `AsciiAnimation.astro` inlines frame 1 at build time and
`src/scripts/ascii.ts` plays the rest (see `CLAUDE.md`). Only monochrome (`utf8`) exports are
supported. The `hole` export is kept there but not on the page.

## The ASCII footer

`AsciiBanner` is a port of the design system's component: keep its algorithm, ramps and
timings as they are (`src/scripts/stoico.ts`).
