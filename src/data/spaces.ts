import type { Localized } from '../i18n/ui';
import type { ShipKind } from '../components/ds/Ship.astro';

// The outer spaces: the links in the plane's lower space and in the Registro. A space without
// `url` renders without a link. `ship` is the pixel ship it flies (see ds/Ship.astro).

export interface Space {
  name: Localized;
  handle: string;
  url?: string;
  ship: ShipKind;
}

export const spaces: Space[] = [
  {
    name: { en: 'Blog', es: 'Blog' },
    handle: 'vstrofago.github.io/blog',
    ship: 'probe',
    url: 'https://vstrofago.github.io/blog/',
  },
  {
    name: { en: 'GitHub', es: 'GitHub' },
    handle: 'github.com/vstrofago',
    ship: 'fighter',
    url: 'https://github.com/vstrofago',
  },
  {
    name: { en: 'X', es: 'X' },
    handle: 'x.com/vstrofago',
    ship: 'shuttle',
    url: 'https://x.com/vstrofago',
  },
  {
    name: { en: 'YouTube', es: 'YouTube' },
    handle: 'youtube.com/@vstrofago',
    ship: 'saucer',
    url: 'https://www.youtube.com/@vstrofago',
  },
  {
    name: { en: 'Music for working', es: 'Música para trabajar' },
    handle: 'youtube.com/@robotvoices.mp3',
    ship: 'rocket',
    url: 'https://www.youtube.com/@robotvoices.mp3',
  },
];

export const blogUrl = 'https://vstrofago.github.io/blog/';
