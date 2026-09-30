# Reproducible assets

Everything on the page that looks drawn is generated from a few lines of data, in code, so it
can be made again (or made for a new project) without an image editor. This file is the recipe
for each one. Nothing here uses colour: every asset draws in `currentColor` or `--fg` and works
in both themes.

## Layout rules (the plane)

These are rules, not suggestions. Check them in the browser after any change to the plane.

1. **Information sits above the grid.** The welcome, the coordinate readout, the magnitude
   legend and the hour marks always sit above the grid's first row. The grid starts at the top
   of the upper space (`[data-sky]`), under all of them; cosmos.ts draws nothing above that line,
   and the no-JS CSS grid starts there too. Declination marks sit by the left edge, on their own
   row lines, never over a star's label.
2. **No project below −20°.** The upper space's rows are 20° of declination apart (+60° at its
   top, the −20° line drawn dashed). A star's `y` in `sky.ts` must be ≤ `FLOOR_Y` (66.6); `placeOf`
   clamps anything lower, so a mistake can't break the rule, but place stars above it on purpose.

## A new project (a star, its row and its card)

1. **`src/data/projects.ts`**: add an entry. Its position in the list sets its catalog number
   (`VS-001`, `VS-002`…), so append rather than insert unless you mean to renumber.
   - `id`: kebab-case, stable. It seeds the planet, so changing it changes the planet.
   - `category` (`{ en, es }`), `title`, `description`, `tags` (`stack / tags`).
   - `status`: `live` · `wip` · `soon` (magnitude 1.0 / 3.0 / 5.5 and the planet's state).
   - `field`: `automata` (AI: agent skills, MCP servers) · `systemis` (an application or a
     whole system someone uses) · `creavis` (themes, music, audiovisual, anything artistic).
     This picks the constellation; there are no others.
   - `links`: at least one; `github` ("Source"), `demo` or `more`. The first is also the
     no-JS target of the project's name in the Registro.
2. **`src/data/sky.ts` → `places`**: give it a spot near its constellation's other stars:
   `{ x, y, side, planet }`. `x` 0–100 across the upper space, `y` 0–`FLOOR_Y` down it, `side` is
   where the label hangs (`right` unless it would run off the page). Skip it and the star lands
   near its field's `center`, which is fine for a first draft but not for keeping.
3. **The planet** (the card's picture), in the same `places` entry:
   `planet: { kind, ring?, moon?, tilt? }`.
   - `kind`: `rocky` (continents: 3D value noise thresholded) or `gas` (bands along the
     latitude, warped by noise).
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
   menu entry and the card are all generated from those two entries. Copy (labels like
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

## A new outer space (a link and its ship)

**`src/data/spaces.ts`**: `{ name: { en, es }, handle, url, ship, at }`.

- `ship`: one of the hulls in `ds/Ship.astro` (`probe`, `fighter`, `shuttle`, `saucer`,
  `rocket`). Prefer a hull no other space uses.
- `at`: `{ x, y }`, 0–100 across and down the lower space's field (the straight grid under
  the bridge). The label hangs to the right, so keep `x` ≤ 78; keep at least ~12 units between
  ships so labels never touch.

It then appears as a ship in the lower space, in the nav's Outer spaces menu and in the
Registro's second tab, and a ghost star falls through the bridge to it.

### Drawing a new ship (`src/components/ds/Ship.astro`)

A hull is nine strings of nine characters: `#` is a lit pixel, `.` is empty. The component
turns each `#` into a 1×1 square in a `viewBox="0 0 9 9"` path, `shape-rendering="crispEdges"`,
filled with `currentColor`, exactly like `Mark.astro`.

- Point it up (it travels up the page, out of the bridge). Keep it symmetric left–right.
- Keep a clear silhouette at 14px (the nav menu) and 18px (the plane): no single isolated
  pixels inside the body, at most ~45 lit pixels of the 81.
- Leave the outer ring of pixels mostly empty where you can, so ships don't look bigger than
  the star mark.
- Add the name to `ShipKind` and the hull to `HULLS`; that's all.

## The mark

`src/components/ds/Mark.astro` (and `public/favicon.svg`): the 9×9 pixel star, drawn as eight
path groups (core, three arm rings, four diagonals) so `motion="spin"` / `"build"` can animate
them. Don't redraw it; it's the design system's.

## The plane: grid, bridge and coordinates

All in `initBridge` (`src/scripts/cosmos.ts`), redrawn to the section's real size on resize:

- Grid cells are a twelfth of the page's width; in the upper space the rows are a sixth of its
  height (20° each). Lines are `--border`; the −20° floor is dashed `--border-strong`.
- The bridge: `bridge` in `sky.ts` sets `mouthA` / `mouthB` (fractions of the bridge zone's
  height), `radius` / `maxRadius` (the mouths) and `tilt` (how flat the rings look). The
  vertical lines converge with `smoothstep` into mouth A, the throat is an hourglass
  (`r = Rm·(0.38 + 0.62·|2t−1|^1.6)`) drawn as rings and meridians (far halves dashed), and the
  lines flare out after mouth B until just above the outer spaces' legend, then run straight.
- The zone heights live in `site.css` (`.cosmos__upper`, `.cosmos__bridge`, `.cosmos__lower`);
  the bridge sits roughly mid-page.
- Coordinates: `coordsOf(x, y)` maps x 0–100 to 00h–24h and y 0–100 to +60°…−60°.

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
