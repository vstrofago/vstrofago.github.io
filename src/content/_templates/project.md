---
# A project: a star on the chart, a row in the Registro, a card with its planet.
# Save it as src/content/projects/<id>.md. The file name is the id: kebab-case and stable,
# because it seeds the planet (rename the file and the planet changes).
# The build checks every rule below (src/content.config.ts). Recipe: docs/assets.md.
catalog:          # next free number (1 → VS-001); never reuse or renumber one
field:            # automata (AI: agent skills, MCP servers) · systemis (an application or a whole system) · creavis (themes, music, audiovisual)
status:           # live (a formed world) · wip (part wireframe) · soon (a dust disc)
category_en:      # what it is, lowercase: "agent skill", "hugo theme"
category_es:
title_en:         # leave both titles empty to show the [Project name] placeholder
title_es:
description_en:   # one line on what it is and why it exists; both languages or neither
description_es:
stack:            # stack / tags, e.g. "astro / typescript" (not `tags`: editors reserve it)
demo:             # links: at least one of demo, github, more (in that order;
github:           #   the first one set is where the name goes without JS)
more:
x:                # 0–100 across the upper space, near its constellation's other stars;
y:                #   0–66.6 down it (the −20° floor). Both empty: lands near the field's centre
side: right       # where the name hangs: right, or left near the right edge
planet:           # rocky · gas; empty derives the whole planet from the id
ring: false
moon: false
tilt: 0           # axial tilt in degrees, −25…25 reads well
---
