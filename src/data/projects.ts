import type { Localized } from '../i18n/ui';

// The "Selected experiments" grid. Edit this list to add real projects.
// - `title` / `description`: leave undefined to show the bracketed placeholder.
// - `links`: shown as small buttons under the card. Every project gets at least one:
//   `github` (the repo), `demo` (a live page) or `more` (anywhere else with details).
// - `status`: live (og accent badge) · wip (muted outline) · soon (dashed outline).

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
    id: 'jev-chat-moderator',
    category: { en: 'playground', es: 'playground' },
    title: { en: 'Jev chat moderator', es: 'Jev chat moderator' },
    description: {
      en: 'TypeSafe AI\'s Jev moderating a simulated live-stream chat in real time.',
      es: 'Jev de TypeSafe AI moderando en tiempo real un chat de stream simulado.',
    },
    tags: 'astro / typescript',
    status: 'live',
    links: [{ kind: 'demo', href: 'https://vstrofago.github.io/jev-chat-moderator/' }, { kind: 'github', href: 'https://github.com/vstrofago/jev-chat-moderator' }],
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
    category: { en: 'blog theme', es: 'tema del blog' },
    title: { en: 'Plano', es: 'Plano' },
    description: {
      en: 'The Hugo theme behind the blog: warm paper, a cobalt grid, one accent.',
      es: 'El tema de Hugo detrás del blog: papel cálido, retícula cobalto, un solo acento.',
    },
    tags: 'hugo / css',
    status: 'live',
    links: [{ kind: 'demo', href: 'https://vstrofago.github.io/blog/' }, { kind: 'github', href: 'https://github.com/vstrofago/hugo-theme-plano' }],
  },
  {
    id: 'music-for-work',
    category: { en: 'music', es: 'música' },
    title: { en: 'Music for work', es: 'Música para trabajar' },
    description: { en: 'Soundtracks for deep work.', es: 'Música para concentrarse.' },
    tags: '—',
    status: 'soon',
    links: [],
  },
];
