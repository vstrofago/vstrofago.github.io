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
    'meta.title': 'vstrofago',
    'meta.description':
      'A running portfolio by vstrofago: code, writing, thinking, productivity systems and music. Built slowly, in public.',
    'a11y.skip': 'Skip to content',
    'a11y.home': 'vstrofago, home',
    'a11y.mainNav': 'Main',
    'a11y.langNav': 'Language',
    'theme.toLight': 'Switch to the light theme',
    'theme.toDark': 'Switch to the dark theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'nav.work': 'Work',
    'nav.notes': 'Notes',
    'nav.elsewhere': 'Elsewhere',
    'hero.title': 'Projects, notes',
    'hero.titleQuiet': 'and other things.',
    'hero.lead': 'Code, writing, thinking, systems and music. Made by one person, slowly, in public.',
    'hero.ctaWork': 'See the work',
    'hero.ctaNotes': 'Read the notes',
    'work.label': 'Work',
    'work.title': 'Selected experiments',
    'work.lead': 'Some finished, some in progress. All of them in public.',
    'work.pager': 'Experiments pages',
    'work.newer': 'Previous',
    'work.older': 'Next',
    'work.demo': 'Demo',
    'work.github': 'Source',
    'work.more': 'More',
    'status.live': 'Live',
    'status.wip': 'In progress',
    'status.soon': 'Soon',
    'elsewhere.label': 'Elsewhere',
    'elsewhere.title': 'Find me elsewhere',
    'footer.note': 'Made with a terminal and too much coffee.',
  },
  es: {
    'meta.title': 'vstrofago',
    'meta.description':
      'Un portafolio vivo de vstrofago: código, escritura, pensamiento, sistemas de productividad y música. Hecho despacio, en público.',
    'a11y.skip': 'Saltar al contenido',
    'a11y.home': 'vstrofago, inicio',
    'a11y.mainNav': 'Principal',
    'a11y.langNav': 'Idioma',
    'theme.toLight': 'Cambiar al tema claro',
    'theme.toDark': 'Cambiar al tema oscuro',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'nav.work': 'Trabajo',
    'nav.notes': 'Notas',
    'nav.elsewhere': 'Otros lados',
    'hero.title': 'Proyectos, notas',
    'hero.titleQuiet': 'y otras cosas.',
    'hero.lead': 'Código, escritura, pensamiento, sistemas y música. Hecho por una persona, despacio, en público.',
    'hero.ctaWork': 'Ver el trabajo',
    'hero.ctaNotes': 'Leer las notas',
    'work.label': 'Trabajo',
    'work.title': 'Experimentos seleccionados',
    'work.lead': 'Algunos terminados, otros en curso. Todos en público.',
    'work.pager': 'Páginas de experimentos',
    'work.newer': 'Anterior',
    'work.older': 'Siguiente',
    'work.demo': 'Demo',
    'work.github': 'Código',
    'work.more': 'Más',
    'status.live': 'Activo',
    'status.wip': 'En curso',
    'status.soon': 'Pronto',
    'elsewhere.label': 'Otros lados',
    'elsewhere.title': 'Encuéntrame en otros lados',
    'footer.note': 'Hecho con una terminal y demasiado café.',
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
