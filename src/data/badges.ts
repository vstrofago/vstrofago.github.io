import type { Localized } from '../i18n/ui';

// The footer's 88×31 buttons, an homage to the late-90s web. Two short lines each (≤ 9
// characters, they are 88px wide). Only a button with `href` is a link.

export interface Badge {
  lines: [Localized, Localized];
  href?: string;
}

export const badges: Badge[] = [
  { lines: [{ en: 'Built with', es: 'Hecho con' }, { en: 'Astro', es: 'Astro' }], href: 'https://astro.build' },
  { lines: [{ en: 'No', es: 'Sin' }, { en: 'cookies', es: 'cookies' }] },
  { lines: [{ en: 'Made', es: 'Hecho' }, { en: 'slowly', es: 'despacio' }] },
  { lines: [{ en: 'Best at', es: 'Mejor de' }, { en: 'night', es: 'noche' }] },
];
