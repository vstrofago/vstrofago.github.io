import type { Localized } from '../i18n/ui';
import type { ShipKind } from '../components/ds/Ship.astro';

// The outer spaces: the links in the plane's lower space and in the Registro. A space without
// `url` renders without a link. `ship` is the pixel ship it flies (see ds/Ship.astro); `at` is
// where it flies in the plane's lower space (0–100 from the top left of that space's field),
// scattered like the stars above; its name goes to the right.

export interface Space {
  name: Localized;
  handle: string;
  url?: string;
  ship: ShipKind;
  at: { x: number; y: number };
}

export const spaces: Space[] = [
  {
    name: { en: 'Blog', es: 'Blog' },
    handle: 'vstrofago.github.io/blog',
    ship: 'probe',
    at: { x: 14, y: 26 },
    url: 'https://vstrofago.github.io/blog/',
  },
  {
    name: { en: 'GitHub', es: 'GitHub' },
    handle: 'github.com/vstrofago',
    ship: 'fighter',
    at: { x: 36, y: 64 },
    url: 'https://github.com/vstrofago',
  },
  {
    name: { en: 'X', es: 'X' },
    handle: 'x.com/vstrofago',
    ship: 'shuttle',
    at: { x: 58, y: 22 },
    url: 'https://x.com/vstrofago',
  },
  {
    name: { en: 'YouTube', es: 'YouTube' },
    handle: 'youtube.com/@vstrofago',
    ship: 'saucer',
    at: { x: 74, y: 58 },
    url: 'https://www.youtube.com/@vstrofago',
  },
  {
    name: { en: 'Music for working', es: 'Música para trabajar' },
    handle: 'youtube.com/@robotvoices.mp3',
    ship: 'rocket',
    at: { x: 22, y: 86 },
    url: 'https://www.youtube.com/@robotvoices.mp3',
  },
];

export const blogUrl = 'https://vstrofago.github.io/blog/';
