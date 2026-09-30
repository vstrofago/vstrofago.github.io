# vstrofago

**Projects, notes and other things.** The landing for vstrofago: a portfolio of experiments across code, writing, philosophy on video, productivity systems and music.

Static site built with [Astro](https://astro.build), styled with **Stoico**, the vstrofago design language (Aura voice, dark by default with a light theme), bilingual (English at `/`, Spanish at `/es/`), deployed to GitHub Pages. The landing is a star chart: every project is a star, and each opens a card with its own procedural planet; the grid sinks into an Einstein–Rosen bridge whose far side holds the links. Below the sky, an on-board HUD lists the same projects and links in two tabs. It ships no framework to the browser: small scripts run the theme toggle, reveals, the chart, the bridge, the planets, the cards, a screensaver and the ASCII banner footer.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
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

To compare two branches side by side, check each one out in its own worktree and give each its own ports and project name:

```sh
git worktree add ../vstro-a claude/practical-ramanujan-tlu07e
git worktree add ../vstro-b claude/transmision-tlu07e
(cd ../vstro-a && COMPOSE_BRANCH=a PORT=4321 docker compose up -d)
(cd ../vstro-b && COMPOSE_BRANCH=b PORT=4322 docker compose up -d)
```

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

**Your blog already lives at `vstrofago.github.io/blog/`.** If the blog is its own repository called `blog`, you can put this landing in a repository called `vstrofago.github.io` and both keep working: the landing at `/`, the blog at `/blog/`. If instead the blog is inside a `vstrofago.github.io` repository already, deploy this one under a different repository name (or a custom domain) so they don't overwrite each other.

To build locally for a sub-path: `BASE_PATH=/site SITE_URL=https://vstrofago.github.io npm run build`.

## Edit content

| What | Where |
| --- | --- |
| All interface copy, both languages | `src/i18n/ui.ts` |
| Projects (stars, catalog rows and cards) | `src/data/projects.ts` |
| Where each star sits, constellations, planet looks, the bridge | `src/data/sky.ts` |
| ASCII animations (ASCIIGen exports) | `public/ascii/` |
| Links (the bridge's far side and the HUD's Anomalías tab) | `src/data/spaces.ts` |

Projects show bracketed placeholders until you give them a `title` and `description`. Each row lists its `links` as quiet text links: `github` ("Source"), `demo`, or `more` for anywhere else with details.

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
  i18n/ · data/
```

See `CLAUDE.md` for the design rules to follow when changing things.
