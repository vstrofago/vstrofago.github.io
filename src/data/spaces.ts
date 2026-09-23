import type { Localized } from '../i18n/ui';

// The "Find me elsewhere" list. A space without `url` renders as "soon" (no link).

export interface Space {
  name: Localized;
  description: Localized;
  handle: string;
  url?: string;
}

export const spaces: Space[] = [
  {
    name: { en: 'Blog', es: 'Blog' },
    description: { en: 'Long-form writing and notes.', es: 'Escritura larga y notas.' },
    handle: 'vstrofago.github.io/blog',
    url: 'https://vstrofago.github.io/blog/',
  },
  {
    name: { en: 'GitHub', es: 'GitHub' },
    description: { en: 'Code, tools and experiments.', es: 'Código, herramientas y experimentos.' },
    handle: 'github.com/vstrofago',
    url: 'https://github.com/vstrofago',
  },
  {
    name: { en: 'X', es: 'X' },
    description: { en: 'Short thoughts, in public.', es: 'Ideas cortas, en público.' },
    handle: 'x.com/vstrofago',
    url: 'https://x.com/vstrofago',
  },
  {
    name: { en: 'YouTube', es: 'YouTube' },
    description: { en: 'Philosophy, explained on video.', es: 'Filosofía divulgada en video.' },
    handle: 'youtube.com/@vstrofago',
    url: 'https://www.youtube.com/@vstrofago',
  },
  {
    name: { en: 'Music for working', es: 'Música para trabajar' },
    description: { en: 'Soundtracks for deep work.', es: 'Música para concentrarse.' },
    handle: '—',
  },
];

export const blogUrl = 'https://vstrofago.github.io/blog/';
