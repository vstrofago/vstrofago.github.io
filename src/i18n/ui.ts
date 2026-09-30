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
    'nav.catalog': 'Projects',
    'nav.notes': 'Notes',
    'nav.elsewhere': 'Outer spaces',
    'chart.label': 'Star chart',
    'chart.title': 'Welcome to my space (literally).',
    'chart.lead': 'Every star is something I made, or am still making.',
    'chart.stars': 'Stars on the chart',
    'chart.hint': 'Choose a star',
    'chart.magnitude': 'Magnitude',
    'hole.links': 'Other spaces',
    'hud.label': 'Log',
    'hud.tabs': 'Records',
    'tab.bodies': 'Vstros',
    'tab.exits': 'Anomalies',
    'hole.jump': 'Jump to',
    'table.id': 'ID',
    'table.body': 'Vstro',
    'table.class': 'Class',
    'table.status': 'Status',
    'table.channel': 'Ch',
    'table.dest': 'Destination',
    'table.address': 'Address',
    'term.records': 'records',
    'term.end': 'end of record',
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
    'nav.catalog': 'Proyectos',
    'nav.notes': 'Notas',
    'nav.elsewhere': 'Espacios exteriores',
    'chart.label': 'Carta estelar',
    'chart.title': 'Bienvenido a mi espacio (literalmente).',
    'chart.lead': 'Cada estrella es algo que hice, o que sigo haciendo.',
    'chart.stars': 'Estrellas de la carta',
    'chart.hint': 'Elige una estrella',
    'chart.magnitude': 'Magnitud',
    'hole.links': 'Otros espacios',
    'hud.label': 'Registro',
    'hud.tabs': 'Registros',
    'tab.bodies': 'Vstros',
    'tab.exits': 'Anomalías',
    'hole.jump': 'Salto a',
    'table.id': 'ID',
    'table.body': 'Vstro',
    'table.class': 'Clase',
    'table.status': 'Estado',
    'table.channel': 'Canal',
    'table.dest': 'Destino',
    'table.address': 'Dirección',
    'term.records': 'registros',
    'term.end': 'fin del registro',
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
