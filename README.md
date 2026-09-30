# vstrofago

**Projects, notes and other things.** The landing for vstrofago: a portfolio of experiments across code, writing, philosophy on video, productivity systems and music.

Static site built with [Astro](https://astro.build), styled with **Stoico**, the vstrofago design language (Aura voice, dark by default with a light theme), bilingual (English at `/`, Spanish at `/es/`), deployed to GitHub Pages. The landing is a star chart: every project is a star, and each opens a card with its own procedural planet; the grid sinks into an Einstein–Rosen bridge whose far side holds the links. Below the sky, an on-board HUD lists the same projects and links in two tabs. It ships no framework to the browser: small scripts run the theme toggle, reveals, the chart, the bridge, the planets, the cards, a screensaver and the ASCII banner footer.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run check     # type-check (.ts and .astro)
npm run preview   # serve dist/ locally
```

Node 20.3 or newer.

### With Docker

No Node needed on the host, only Docker:

```sh
docker compose up                        # dev server with hot reload: http://localhost:4321
docker compose --profile build up serve  # the static build behind nginx: http://localhost:8080
docker compose down                      # stop
```

`PORT` and `BUILD_PORT` change the host ports and `COMPOSE_BRANCH` the Compose project name, so two copies of the repo can run at once.

After `package.json` changes, rebuild with `docker compose up --build`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes.

Where it ends up depends on the repository name. The workflow sets the base path for you:

| Repository name | URL |
| --- | --- |
| `vstrofago.github.io` | `https://vstrofago.github.io/` |
| anything else, e.g. `site` | `https://vstrofago.github.io/site/` |
| any name + `public/CNAME` with your domain | `https://your-domain/` |

This site is deployed from the `vstrofago.github.io` repository, so it serves `/`. The blog is a separate site, published from its own repository at `/blog/`; the two share the origin, which is why the theme choice carries over between them.

To build locally for a sub-path: `BASE_PATH=/site SITE_URL=https://vstrofago.github.io npm run build`.

## Edit content

Projects and links are Markdown files: the frontmatter is the data, one file each. Start from the templates in `src/content/_templates/` and edit them in any text or Markdown editor (GitHub's web editor works too). The build checks every file (both languages, at least one link, the chart's rules) and says which file and field are wrong.

| What | Where |
| --- | --- |
| A project (its star, catalog row, card and planet) | `src/content/projects/<id>.md` · template `src/content/_templates/project.md` |
| A link (an outer space and its ship) | `src/content/spaces/<id>.md` · template `src/content/_templates/space.md` |
| The rules each file must follow | `src/content.config.ts` |
| Ship hulls | `src/data/ships.ts` |
| Constellations, the bridge, the −20° floor | `src/data/sky.ts` |
| All interface copy, both languages | `src/i18n/ui.ts` |
| ASCII animations (ASCIIGen exports) | `public/ascii/` |

Projects show bracketed placeholders until you give them a `title` and `description`. Links show as `demo`, `github` ("Source") and `more`, in that order. `docs/assets.md` is the recipe for every drawn thing. Agents: see `AGENTS.md` and the `add-to-chart` skill in `.claude/skills/`.

## Structure

```
src/
  pages/            index.astro (en) · es/index.astro (es)
  layouts/Base.astro  <head>, SEO, hreflang, fonts, theme-before-paint, the one client script
  components/       Header, Chart, Hud, Fichas, Footer, Screensaver
    ds/             Stoico components as Astro markup: Button, Badge, Label, Icon, Mark, Wordmark
  scripts/          stoico.ts: theme, nav, reveal, parallax, MarbleField, AsciiBanner
                    cosmos.ts: starfield, bridge, readout, planets, HUD, cards, screensaver, days in orbit
                    ascii.ts: ASCIIGen player (frames in public/ascii/<name>/<quality>/)
  styles/           fonts · stoico/ (the system, verbatim) · site (layout + type primitives)
  assets/fonts/     self-hosted, subset WOFF2 (Geist, Geist Mono, Geist Pixel)
  content/          projects/ · spaces/ (one Markdown file each) · _templates/
  content.config.ts the content's schema and rules
  data/             sky.ts (chart rules and maths) · ships.ts · projects.ts / spaces.ts (read the content) · icons.ts
  i18n/
```

See `AGENTS.md` for the design rules to follow when changing things, and `docs/assets.md` for how every drawn asset (stars, planets and cards, ships, the bridge) is made and how to add new ones.
