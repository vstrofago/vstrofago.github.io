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
    'hero.title': 'projects, notes, and other things.',
    'hero.lead':
      'a running portfolio of experiments: code, writing, philosophy on video, productivity systems and music.',
    'hero.ctaProjects': 'see projects',
    'hero.ctaBlog': 'read the blog ↗',
    'hero.prompt': 'dev / writing / thinking / systems / music',
    'ticker': ['important announcement goes here', 'no, really, a big one', 'we are still deciding what', 'stay tuned', 'this space intentionally left blank'],
    'projects.kicker': '01 / projects',
    'projects.title': 'Selected experiments',
    'projects.lead': 'Some finished, some in progress, all built in public.',
    'status.live': 'LIVE',
    'status.wip': 'WIP',
    'status.soon': 'SOON',
    'elsewhere.kicker': '02 / elsewhere',
    'elsewhere.title': 'Find me elsewhere',
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
    'hero.title': 'proyectos, notas y otras cosas.',
    'hero.lead':
      'un portafolio vivo de experimentos: código, escritura, filosofía en video, sistemas de productividad y música.',
    'hero.ctaProjects': 'ver proyectos',
    'hero.ctaBlog': 'leer el blog ↗',
    'hero.prompt': 'dev / escritura / pensamiento / sistemas / música',
    'ticker': ['aquí va un anuncio importante', 'no, en serio, uno grande', 'seguimos decidiendo cuál', 'no se vayan', 'espacio dejado en blanco a propósito'],
    'projects.kicker': '01 / proyectos',
    'projects.title': 'Experimentos seleccionados',
    'projects.lead': 'Algunos terminados, otros en curso, todos hechos en público.',
    'status.live': 'ACTIVO',
    'status.wip': 'EN CURSO',
    'status.soon': 'PRONTO',
    'elsewhere.kicker': '02 / otros espacios',
    'elsewhere.title': 'Encuéntrame en otros lados',
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
