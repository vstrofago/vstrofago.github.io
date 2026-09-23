// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages:
// - User site (repo named "<user>.github.io")   → served at https://<user>.github.io/        → BASE_PATH="/"
// - Project site (any other repo name, e.g. "site") → served at https://<user>.github.io/site/ → BASE_PATH="/site"
// The deploy workflow sets both variables automatically. Locally they default to the user site.
const site = process.env.SITE_URL ?? 'https://vstrofago.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    // Small pages: inline the CSS so the first paint needs no extra request.
    inlineStylesheets: 'always',
  },
});
