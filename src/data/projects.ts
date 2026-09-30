import { getCollection } from 'astro:content';
import type { Localized } from '../i18n/ui';
import { fields, fieldKeys, placeFor, catalogId, type Constellation, type Field, type Place, type ProjectStatus } from './sky';

// The projects: stars on the chart, rows in the Registro, cards with a planet. Each one is a
// Markdown file in src/content/projects/ (template: src/content/_templates/project.md; rules:
// src/content.config.ts; recipe: docs/assets.md). This module reads them at build time, in
// catalog order, and fills in what a file leaves out.
// - `title` / `description`: empty in the file shows the bracketed placeholder.
// - `links`: demo, github, more, in that order; the first is the no-JS target of the name.
// - `status`: live (neutral badge with a dot) · wip (neutral badge) · soon (outline badge).
//   Always a word, never colour alone: the site is black and white.
// - `field`: which constellation the star joins (see `fieldKeys` in sky.ts).

export type { ProjectStatus, Field };

export interface ProjectLink {
  kind: 'demo' | 'github' | 'more';
  href: string;
}

export interface Project {
  /** The file name: kebab-case and stable, since it seeds the planet. */
  id: string;
  /** VS-001… */
  catalog: string;
  category: Localized;
  title?: Localized;
  description?: Localized;
  tags?: string;
  status: ProjectStatus;
  field: Field;
  links: ProjectLink[];
  place: Place;
}

export const placeholder = {
  title: { en: '[Project name]', es: '[Nombre del proyecto]' },
  description: {
    en: '[One line on what it is and why it exists.]',
    es: '[Una línea sobre qué es y por qué existe.]',
  },
  tags: { en: '[stack / tags]', es: '[stack / etiquetas]' },
} satisfies Record<string, Localized>;

const entries = (await getCollection('projects')).sort((a, b) => a.data.catalog - b.data.catalog);

// Rules that span files: a catalog number belongs to one project.
for (let i = 1; i < entries.length; i++) {
  if (entries[i].data.catalog === entries[i - 1].data.catalog) {
    throw new Error(
      `projects: ${entries[i - 1].id}.md and ${entries[i].id}.md share catalog ${entries[i].data.catalog}. Give the newer one the next free number.`,
    );
  }
}

export const projects: Project[] = entries.map(({ id, data }) => ({
  ...data,
  id,
  catalog: catalogId(data.catalog),
  place: placeFor(id, data.field, data.place),
}));

/** One constellation per field; its stars are joined in catalog order. */
export const constellations: Constellation[] = fieldKeys.map((f) => ({
  name: fields[f].name,
  at: fields[f].at,
  members: projects.filter((p) => p.field === f).map((p) => p.id),
}));
