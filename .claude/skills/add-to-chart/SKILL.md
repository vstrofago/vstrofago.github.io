---
name: add-to-chart
description: Add or change what the vstrofago chart shows. Covers a project (its star, constellation, Registro row, card and procedural planet), an outer space (a link and the pixel ship it flies) and a new ship hull. Use when asked to add, edit, move, retire or restyle a project, planet, star, link, outer space or ship on this site.
---

# Add to the chart

Everything on the chart is generated from one Markdown file per item. You fill in frontmatter,
the build checks it, and the components draw the rest. Don't touch components, scripts or CSS
to add content.

- Projects: `src/content/projects/<id>.md`, template `src/content/_templates/project.md`
- Outer spaces: `src/content/spaces/<id>.md`, template `src/content/_templates/space.md`
- Ship hulls: `src/data/ships.ts`
- Rules: `src/content.config.ts`. Full recipe and the why: `docs/assets.md`.

## Before you write

- **Don't invent facts.** Title, description, status, links and category come from the user
  or from the project itself (its repo README, its live page). If one is missing, ask.
- **Both languages.** Every visible text needs `_en` and `_es`. If the user gave only one,
  translate it in the site's voice (calm, precise, sentence case, no hype, no exclamation
  marks, no emoji) and tell them you did, so they can check it.
- Read the existing files in the same folder first, to match tone and find free spots and
  numbers.

## A project

1. Pick the id: kebab-case, short, stable. It's the file name and it seeds the planet, so
   never rename an existing file to "tidy" it.
2. Copy the template to `src/content/projects/<id>.md` and fill it in:
   - `catalog`: the highest `catalog` in `src/content/projects/` plus one. Never reuse one.
   - `field`: `automata` (AI: agent skills, MCP servers, anything for models), `systemis`
     (an application or a whole system someone uses) or `creavis` (themes, music,
     audiovisual). If it's unclear, ask.
   - `status`: `live` (usable now), `wip` (in progress) or `soon` (announced).
   - Links: at least one of `demo`, `github`, `more`.
3. Place the star near its constellation's other stars (look at their `x` / `y`):
   - `y` ≤ 66.6 (the −20° floor).
   - At least ~8 units from any other star, so labels don't collide.
   - `side: left` only if `x` > ~80.
4. Give it a planet that differs from its neighbours. Vary `rocky` / `gas`, `ring`, `moon`
   and `tilt` (−25…25).
5. Run `npm run build`. It must pass; if it fails, the message names the file and the field.

## An outer space

1. Copy the template to `src/content/spaces/<id>.md`.
2. `order` is the highest in use plus one. `handle` is the address without `https://`.
3. `ship`: prefer a hull no other space flies. If all five are taken and the user wants a
   new one, draw it (below).
4. `x` ≤ 78 and `y` 0–100, at least ~12 units from the other ships.
5. Run `npm run build`.

## A ship hull

In `src/data/ships.ts`, add the name to `shipKinds` and a 9×9 hull to `HULLS`:

- `#` is a lit pixel and `.` is empty. The build rejects any other shape.
- It points up and is symmetric left–right.
- At most ~45 lit pixels, with no isolated pixels inside the body.
- Keep the outer ring mostly empty, so it reads at 14px and never looks bigger than the
  star mark.

Start from the blank hull in `docs/assets.md`, "Drawing a new ship".

## Retiring or editing

- **Retire a project:** delete its file. Its catalog number stays retired (a gap is fine);
  don't renumber the others.
- **Change status or copy:** edit the frontmatter. Keep the id.

## Check your work

1. `npm run build` passes (and `npm run check`, if you touched any code). The site says
   nothing is done until it does.
2. If you moved a star or ship, look at it on a wide screen (≥860px) with `npm run dev`:
   - no label overlaps another;
   - nothing sits below the dashed −20° line;
   - the new ship doesn't sit on another one's patrol (ships drift up to two half-cells from
     their post).
3. If you changed how something is made (a new rule, a new field, a new hull convention),
   update `docs/assets.md` and the templates in the same change, so the next agent can repeat it.
