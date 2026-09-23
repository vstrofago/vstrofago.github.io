# vstrofago

**Projects, Notes, and other things.** The landing for vstrofago: a portfolio of experiments across code, writing, philosophy on video, productivity systems and music.

Static site built with [Astro](https://astro.build), styled with the **brutalistoic** design system, bilingual (English at `/`, Spanish at `/es/`), deployed to GitHub Pages. It ships no framework to the browser: one small script (15 KB, under 5 KB gzipped) runs the ASCII and dither effects.

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/ locally
```

Node 20.3 or newer.

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
| Project cards | `src/data/projects.ts` |
| Links in "Find me elsewhere" | `src/data/spaces.ts` |

Project cards show bracketed placeholders until you give them a `title` and `description`. Each card lists its `links` as small buttons: `github`, `demo`, or `more` for anywhere else with details.

## Structure

```
src/
  pages/            index.astro (en) · es/index.astro (es)
  layouts/Base.astro  <head>, SEO, hreflang, fonts, the one client script
  components/       Header, Hero, Ticker, Projects, Elsewhere, Footer, StarMark
    ds/             brutalistoic components as Astro markup: Button, Card, Badge, AsciiBanner
  scripts/          brutalistoic.ts: ASCII fill, Bayer dither, AsciiBanner (ported from the system)
  styles/           fonts · tokens (system) · brutalistoic (system) · site (layout only)
  assets/fonts/     self-hosted, subset WOFF
  i18n/ · data/
```

See `CLAUDE.md` for the design rules to follow when changing things.
