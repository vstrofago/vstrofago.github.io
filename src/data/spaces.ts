import type { Localized } from '../i18n/ui';

// The "Find me elsewhere" list. A space without `url` renders as "soon" (no link).

export interface Space {
  name: Localized;
  handle: string;
  url?: string;
}

export const spaces: Space[] = [
  {
    name: { en: 'Blog', es: 'Blog' },
    handle: 'vstrofago.github.io/blog',
    url: 'https://vstrofago.github.io/blog/',
  },
  {
    name: { en: 'GitHub', es: 'GitHub' },
    handle: 'github.com/vstrofago',
    url: 'https://github.com/vstrofago',
  },
  {
    name: { en: 'X', es: 'X' },
    handle: 'x.com/vstrofago',
    url: 'https://x.com/vstrofago',
  },
  {
    name: { en: 'YouTube', es: 'YouTube' },
    handle: 'youtube.com/@vstrofago',
    url: 'https://www.youtube.com/@vstrofago',
  },
  {
    name: { en: 'Music for working', es: 'Música para trabajar' },
    handle: 'youtube.com/@robotvoices.mp3',
    url: 'https://www.youtube.com/@robotvoices.mp3',
  },
];

export const blogUrl = 'https://vstrofago.github.io/blog/';
