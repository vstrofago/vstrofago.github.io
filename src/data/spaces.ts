import { getCollection } from 'astro:content';
import type { Localized } from '../i18n/ui';
import type { ShipKind } from './ships';

// The outer spaces: the links whose ships explore my space, in the nav's menu and in the
// Registro. Each one is a Markdown file in src/content/spaces/ (template:
// src/content/_templates/space.md; rules: src/content.config.ts; recipe: docs/assets.md),
// read here at build time in `order`. A space without `url` renders without a link. `ship` is
// the pixel ship it flies (src/data/ships.ts); `at` is its post, where it starts: x 4–92 across
// my space, y 0–100 down the band under the −20° line. Its name sits under it.

export interface Space {
  id: string;
  name: Localized;
  handle: string;
  url?: string;
  ship: ShipKind;
  at: { x: number; y: number };
}

const entries = (await getCollection('spaces')).sort((a, b) => a.data.order - b.data.order);

for (let i = 1; i < entries.length; i++) {
  if (entries[i].data.order === entries[i - 1].data.order) {
    throw new Error(`spaces: ${entries[i - 1].id}.md and ${entries[i].id}.md share order ${entries[i].data.order}.`);
  }
}

export const spaces: Space[] = entries.map(({ id, data }) => ({ id, ...data }));

export const blogUrl = 'https://vstrofago.github.io/blog/';
