// All interface copy, per language. English is the default and lives at "/", Spanish at "/es/".
// To add a language: add it to `languages`, copy the `en` block, then add src/pages/<code>/index.astro.

export const languages = {
  en: 'EN',
  es: 'ES',
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'meta.title': 'vstrofago — Projects, Notes, and other things',
    'meta.description':
      'A running portfolio of experiments by vstrofago: code, writing, philosophy on video, productivity systems and music.',
    'a11y.skip': 'Skip to content',
    'a11y.home': 'vstrofago, home',
    'a11y.mainNav': 'Main',
    'a11y.langNav': 'Language',
    'nav.projects': 'Projects',
    'nav.elsewhere': 'Elsewhere',
    'hero.eyebrow': '00 / index',
    'hero.title': 'Projects, Notes, and other things.',
    'hero.lead':
      'A running portfolio of experiments: code, writing, philosophy on video, productivity systems and music.',
    'hero.ctaProjects': 'See projects',
    'hero.ctaBlog': 'Read the blog ↗',
    'hero.prompt': 'dev / writing / philosophy / systems / music',
    'ticker': ['dev', 'blog', 'philosophy', 'productivity', 'notes', 'music', 'systems', 'writing'],
    'projects.kicker': '01 / projects',
    'projects.title': 'Selected experiments',
    'projects.lead': 'Some finished, some in progress, all built in public.',
    'status.live': 'LIVE',
    'status.wip': 'WIP',
    'status.soon': 'SOON',
    'elsewhere.kicker': '02 / elsewhere',
    'elsewhere.title': 'Find me elsewhere',
    'elsewhere.lead': 'Each space has its own pace. Pick the one that fits yours.',
    'elsewhere.visit': 'Visit ↗',
    'footer.note': 'Made with a terminal and too much coffee.',
    'footer.top': 'Back to top ↑',
  },
  es: {
    'meta.title': 'vstrofago — Proyectos, notas y otras cosas',
    'meta.description':
      'Un portafolio vivo de experimentos de vstrofago: código, escritura, filosofía en video, sistemas de productividad y música.',
    'a11y.skip': 'Saltar al contenido',
    'a11y.home': 'vstrofago, inicio',
    'a11y.mainNav': 'Principal',
    'a11y.langNav': 'Idioma',
    'nav.projects': 'Proyectos',
    'nav.elsewhere': 'Otros espacios',
    'hero.eyebrow': '00 / índice',
    'hero.title': 'Proyectos, notas y otras cosas.',
    'hero.lead':
      'Un portafolio vivo de experimentos: código, escritura, filosofía en video, sistemas de productividad y música.',
    'hero.ctaProjects': 'Ver proyectos',
    'hero.ctaBlog': 'Leer el blog ↗',
    'hero.prompt': 'dev / escritura / filosofía / sistemas / música',
    'ticker': ['dev', 'blog', 'filosofía', 'productividad', 'notas', 'música', 'sistemas', 'escritura'],
    'projects.kicker': '01 / proyectos',
    'projects.title': 'Experimentos seleccionados',
    'projects.lead': 'Algunos terminados, otros en curso, todos hechos en público.',
    'status.live': 'ACTIVO',
    'status.wip': 'EN CURSO',
    'status.soon': 'PRONTO',
    'elsewhere.kicker': '02 / otros espacios',
    'elsewhere.title': 'Encuéntrame en otros lados',
    'elsewhere.lead': 'Cada espacio tiene su propio ritmo. Elige el que vaya con el tuyo.',
    'elsewhere.visit': 'Visitar ↗',
    'footer.note': 'Hecho con una terminal y demasiado café.',
    'footer.top': 'Volver arriba ↑',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function useTranslations(lang: Lang) {
  return function t<K extends UiKey>(key: K): (typeof ui)['en'][K] {
    return (ui[lang][key] ?? ui[defaultLang][key]) as (typeof ui)['en'][K];
  };
}

/** A string in every language, e.g. `{ en: 'notes', es: 'notas' }`. */
export type Localized = Record<Lang, string>;

/** Joins the site base (e.g. "/" or "/my-repo") with a path, without doubling slashes. */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');
  return `${base}/${clean}`;
}

/** The home page URL for a language. */
export function homeFor(lang: Lang): string {
  return lang === defaultLang ? withBase('') : withBase(`${lang}/`);
}
