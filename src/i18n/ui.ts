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
    'nav.catalog': 'Catalog',
    'nav.notes': 'Notes',
    'nav.elsewhere': 'Elsewhere',
    'chart.label': 'Star chart',
    'chart.title': 'You are in orbit.',
    'chart.lead': 'Every star is something I made, or am still making. Get close to any of them.',
    'chart.stars': 'Stars on the chart',
    'chart.hint': 'Choose a star',
    'chart.magnitude': 'Magnitude',
    'catalog.label': 'Catalog',
    'catalog.title': 'Bodies observed.',
    'catalog.lead': 'Everything on the chart, in order. Some finished, some still forming.',
    'catalog.closer': 'Look closer',
    'catalog.demo': 'Demo',
    'catalog.github': 'Source',
    'catalog.more': 'More',
    'status.live': 'Live',
    'status.wip': 'In progress',
    'status.soon': 'Soon',
    'planet.live': 'Stable orbit',
    'planet.wip': 'Under construction',
    'planet.soon': 'Still forming',
    'ficha.constellation': 'Constellation',
    'ficha.magnitude': 'Magnitude',
    'ficha.class': 'Class',
    'ficha.composition': 'Composition',
    'ficha.coords': 'Coordinates',
    'ficha.close': 'Close',
    'ficha.prev': 'Previous body',
    'ficha.next': 'Next body',
    'elsewhere.label': 'Elsewhere',
    'elsewhere.title': 'Other frequencies',
    'footer.orbit': 'In orbit since',
    'footer.day': 'Day',
    'footer.badges': 'Buttons, the old way',
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
    'nav.catalog': 'Catálogo',
    'nav.notes': 'Notas',
    'nav.elsewhere': 'Otros lados',
    'chart.label': 'Carta estelar',
    'chart.title': 'Estás en órbita.',
    'chart.lead': 'Cada estrella es algo que hice, o que sigo haciendo. Acércate a cualquiera.',
    'chart.stars': 'Estrellas de la carta',
    'chart.hint': 'Elige una estrella',
    'chart.magnitude': 'Magnitud',
    'catalog.label': 'Catálogo',
    'catalog.title': 'Cuerpos observados.',
    'catalog.lead': 'Todo lo que aparece en la carta, en orden. Algunos terminados, otros aún en formación.',
    'catalog.closer': 'Acercarse',
    'catalog.demo': 'Demo',
    'catalog.github': 'Código',
    'catalog.more': 'Más',
    'status.live': 'Activo',
    'status.wip': 'En curso',
    'status.soon': 'Pronto',
    'planet.live': 'Órbita estable',
    'planet.wip': 'En construcción',
    'planet.soon': 'Aún en formación',
    'ficha.constellation': 'Constelación',
    'ficha.magnitude': 'Magnitud',
    'ficha.class': 'Clase',
    'ficha.composition': 'Composición',
    'ficha.coords': 'Coordenadas',
    'ficha.close': 'Cerrar',
    'ficha.prev': 'Cuerpo anterior',
    'ficha.next': 'Cuerpo siguiente',
    'elsewhere.label': 'Otros lados',
    'elsewhere.title': 'Otras frecuencias',
    'footer.orbit': 'En órbita desde',
    'footer.day': 'Día',
    'footer.badges': 'Botones, a la antigua',
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
