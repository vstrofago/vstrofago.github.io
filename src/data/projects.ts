import type { Localized } from '../i18n/ui';

// The "Selected experiments" list, numbered in this order. Edit it to add real projects.
// - `title` / `description`: leave undefined to show the bracketed placeholder.
// - `links`: quiet text links on the row, each with an arrow. Every project gets at least one:
//   `github` (the repo), `demo` (a live page) or `more` (anywhere else with details).
// - `status`: live (neutral badge with a dot) · wip (neutral badge) · soon (outline badge).
//   Always a word, never colour alone; Ember stays reserved for the hero.

export type ProjectStatus = 'live' | 'wip' | 'soon';

export interface ProjectLink {
  kind: 'demo' | 'github' | 'more';
  href: string;
}

export interface Project {
  id: string;
  category: Localized;
  title?: Localized;
  description?: Localized;
  tags?: string;
  status: ProjectStatus;
  links: ProjectLink[];
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
  {
    id: 'vigia',
    category: { en: 'twitch tool', es: 'herramienta para twitch' },
    title: { en: 'Vigia', es: 'Vigia' },
    description: {
      en: 'A self-hosted chat watchman for Twitch streamers: rules in plain language, powered by TypeSafe AI\'s Jev.',
      es: 'Un vigía de chat autoalojado para streamers de Twitch: reglas en lenguaje natural, con Jev de TypeSafe AI.',
    },
    tags: 'twitch / jev',
    status: 'wip',
    links: [{ kind: 'demo', href: 'https://vstrofago.github.io/vigia/' }, { kind: 'github', href: 'https://github.com/vstrofago/vigia' }],
  },
  {
    id: 'zettelkasten-organizer',
    category: { en: 'agent skill', es: 'skill para agentes' },
    title: { en: 'Zettelkasten organizer', es: 'Zettelkasten organizer' },
    description: {
      en: 'Audits, maintains and builds Zettelkasten slip-boxes in Obsidian.',
      es: 'Audita, mantiene y construye slip-boxes Zettelkasten en Obsidian.',
    },
    tags: 'obsidian / claude code',
    status: 'live',
    links: [{ kind: 'github', href: 'https://github.com/vstrofago/zettelkasten-organizer-skill' }],
  },
  {
    id: 'pnpm-hardening',
    category: { en: 'agent skill', es: 'skill para agentes' },
    title: { en: 'pnpm hardening', es: 'pnpm hardening' },
    description: {
      en: 'Hardens pnpm installs against supply-chain attacks and migrates projects off pnpm 9.',
      es: 'Blinda las instalaciones de pnpm contra ataques a la cadena de suministro y migra proyectos fuera de pnpm 9.',
    },
    tags: 'pnpm / security',
    status: 'live',
    links: [{ kind: 'github', href: 'https://github.com/vstrofago/pnpm-supply-chain-hardening-skill' }],
  },
  {
    id: 'omarchy-brutalistoic',
    category: { en: 'omarchy theme', es: 'tema de omarchy' },
    title: { en: 'Omarchy brutalistoic', es: 'Omarchy brutalistoic' },
    description: {
      en: 'A brutalist dark theme: concrete greys, one cobalt accent, ASCII wallpaper.',
      es: 'Un tema oscuro brutalista: grises de concreto, un acento cobalto, fondo ASCII.',
    },
    tags: 'hyprland / omarchy',
    status: 'live',
    links: [{ kind: 'github', href: 'https://github.com/vstrofago/omarchy-brutalistoic-theme' }],
  },
  {
    id: 'hugo-theme-plano',
    category: { en: 'hugo theme', es: 'tema de hugo' },
    title: { en: 'Plano', es: 'Plano' },
    description: {
      en: 'A blueprint-flavored Hugo theme: warm paper, a cobalt grid, one accent.',
      es: 'Un tema de Hugo con aire de plano técnico: papel cálido, retícula cobalto, un solo acento.',
    },
    tags: 'hugo / css',
    status: 'live',
    links: [{ kind: 'github', href: 'https://github.com/vstrofago/hugo-theme-plano' }],
  },
  {
    id: 'music-for-work',
    category: { en: 'music', es: 'música' },
    title: { en: 'Music for work', es: 'Música para trabajar' },
    description: { en: 'Soundtracks for deep work.', es: 'Música para concentrarse.' },
    tags: '—',
    status: 'soon',
    links: [{ kind: 'more', href: 'https://www.youtube.com/@robotvoices.mp3' }],
  },
];
