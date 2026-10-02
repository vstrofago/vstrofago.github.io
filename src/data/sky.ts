// The star chart's rules and maths: the fields (constellations), the bridge, the −20° floor,
// coordinates, magnitudes and catalog numbers. No data lives here: every project (and where
// its star sits, and its planet) is one Markdown file in src/content/projects/, read by
// src/data/projects.ts. This module is pure on purpose: the browser (cosmos.ts) and the
// content schema (src/content.config.ts) both import it.

export const statuses = ['live', 'wip', 'soon'] as const;
export type ProjectStatus = (typeof statuses)[number];

/** The three fixed constellations, one per project `field`:
 *  automata (AI: agent skills, MCP servers, anything for models) · systemis (an application or
 *  a whole system someone uses) · creavis (artistic and creative work: themes, music, audiovisual). */
export const fieldKeys = ['automata', 'systemis', 'creavis'] as const;
export type Field = (typeof fieldKeys)[number];

export const planetKinds = ['rocky', 'gas'] as const;
export type PlanetKind = (typeof planetKinds)[number];

export interface Planet {
  kind: PlanetKind;
  ring?: boolean;
  moon?: boolean;
  /** Axial tilt in degrees. */
  tilt?: number;
}

/** Where a star sits in the upper space (the stars' box under the welcome), 0–100 from its top
 *  left, which side its name goes on, and the planet drawn in its card. y maps to declination
 *  (+60° at 0, −60° at 100). */
export interface Place {
  x: number;
  y: number;
  side: 'left' | 'right';
  planet: Planet;
}

export interface Constellation {
  /** Latin, as on real charts; the same in every language. */
  name: string;
  /** Where the name is written. */
  at: { x: number; y: number };
  /** Project ids, in the order the lines join them. */
  members: string[];
}

/** Each field's constellation, named in the Latin of star charts, with a centre (a project
 *  without a position lands around it) and a spot for its name. */
export const fields: Record<Field, { name: string; center: { x: number; y: number }; at: { x: number; y: number } }> = {
  automata: { name: 'Automata', center: { x: 78, y: 46 }, at: { x: 74, y: 50 } },
  systemis: { name: 'Systemis', center: { x: 50, y: 30 }, at: { x: 48, y: 12 } },
  creavis: { name: 'Creavis', center: { x: 16, y: 50 }, at: { x: 10, y: 50 } },
};

/** The Einstein–Rosen bridge (wide screens). The plane is a map, dragged sideways: my space
 *  (the stars, and the outer spaces' ships under the −20° line) on the left, the archive (the
 *  archived projects, still planets) on the right, each a screen wide, and between them the
 *  bridge's zone, `width` screens wide. cosmos.ts draws it along the grid's rows: they start
 *  bending `lead` grid cells before the zone (a hint, at the edge of the screen, that the map
 *  goes on), converge into a first mouth at `mouthA` of the zone, run through an hourglass
 *  wireframe throat to a second mouth at `mouthB`, and flare out again until `lead` cells into
 *  the archive. `radius` is the mouths' radius as a fraction of the grid's height; `tilt`
 *  flattens the rings. */
export const bridge = { width: 0.5, lead: 0.75, mouthA: 0.34, mouthB: 0.66, radius: 0.13, tilt: 0.28 };

/** The −20° line, as y in the upper space: no project sits below it. */
export const FLOOR_Y = (80 / 120) * 100;

/** Small deterministic hash of a string, 0–1. */
function unit(id: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** A star's full place: what its file sets, the rest derived from its id (the same id always
 *  gives the same spot and planet). Without x / y it lands near its field's centre; anything
 *  derived is clamped above FLOOR_Y. */
export function placeFor(id: string, field: Field, given: Partial<Place> = {}): Place {
  const c = fields[field].center;
  const x = given.x ?? Math.round(c.x + (unit(id, 1) - 0.5) * 20);
  const y = Math.min(FLOOR_Y, Math.max(4, given.y ?? Math.round(c.y + (unit(id, 2) - 0.5) * 30)));
  return {
    x,
    y,
    side: given.side ?? (x > 70 ? 'left' : 'right'),
    planet: given.planet ?? {
      kind: unit(id, 3) > 0.5 ? 'gas' : 'rocky',
      ring: unit(id, 4) > 0.65,
      moon: unit(id, 5) > 0.7,
      tilt: Math.round((unit(id, 6) - 0.5) * 40),
    },
  };
}

/** Chart position as right ascension / declination, for the card and the cursor readout. */
export function coordsOf(x: number, y: number): string {
  const ra = (x / 100) * 24;
  const h = Math.floor(ra);
  const m = Math.floor((ra - h) * 60);
  const dec = 60 - y * 1.2;
  const d = Math.floor(Math.abs(dec));
  const dm = Math.floor((Math.abs(dec) - d) * 60);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(h)}h ${two(m)}m · ${dec < 0 ? '−' : '+'}${two(d)}° ${two(dm)}′`;
}

/** Apparent magnitude per status: brighter (smaller) is more finished. */
export const magnitude: Record<ProjectStatus, string> = { live: '1.0', wip: '3.0', soon: '5.5' };

/** Catalog number, from a project's `catalog`: 1 → VS-001. */
export const catalogId = (n: number): string => `VS-${String(n).padStart(3, '0')}`;
