import type { Localized } from '../i18n/ui';

// The "Selected experiments" grid. Edit this list to add real projects.
// - `title` / `description`: leave undefined to show the bracketed placeholder.
// - `url`: when set, the whole card becomes a link.
// - `status`: live (og accent badge) · wip (muted outline) · soon (dashed outline).

export type ProjectStatus = 'live' | 'wip' | 'soon';

export interface Project {
  id: string;
  category: Localized;
  title?: Localized;
  description?: Localized;
  tags?: string;
  status: ProjectStatus;
  url?: string;
}

export const placeholder = {
  title: { en: '[Project name]', es: '[Nombre del proyecto]' },
  description: {
    en: '[One line on what it is and why it exists.]',
    es: '[Una línea sobre qué es y por qué existe.]',
  },
  tags: { en: '[stack / tags]', es: '[stack / etiquetas]' },
} satisfies Record<string, Localized>;

export const projects: Project[] = [
  { id: 'dev', category: { en: 'dev', es: 'dev' }, status: 'live' },
  { id: 'blog', category: { en: 'blog', es: 'blog' }, status: 'live', url: 'https://vstrofago.github.io/blog/' },
  { id: 'video', category: { en: 'philosophy · youtube', es: 'filosofía · youtube' }, status: 'live' },
  { id: 'productivity', category: { en: 'productivity', es: 'productividad' }, status: 'wip' },
  { id: 'notes', category: { en: 'notes', es: 'notas' }, status: 'wip' },
  { id: 'music', category: { en: 'music', es: 'música' }, status: 'soon' },
];
