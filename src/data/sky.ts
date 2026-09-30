import type { ProjectStatus } from './projects';

// The star chart. Every project in projects.ts is a star; this file says where it sits, which
// constellation it belongs to and what its planet looks like up close.
// - `x` / `y`: position on the chart, 0–100 from the top left. Keep to the left (x < 38):
//   the black hole takes the right of the sky.
// - `side`: which side of the star its name goes on.
// - `planet`: the body drawn in its card. Omit it and one is derived from the id.
// A project with no entry here still appears, at a spot derived from its id.

export type PlanetKind = 'rocky' | 'gas';

export interface Planet {
  kind: PlanetKind;
  ring?: boolean;
  moon?: boolean;
  /** Axial tilt in degrees. */
  tilt?: number;
}

export interface Place {
  x: number;
  y: number;
  side?: 'left' | 'right';
  planet?: Planet;
}

export interface Constellation {
  /** Latin, as on real charts; the same in every language. */
  name: string;
  /** Where the name is written. */
  at: { x: number; y: number };
  /** Project ids, in the order the lines join them. */
  members: string[];
}

export const places: Record<string, Place> = {
  vigia: { x: 29, y: 12, side: 'right', planet: { kind: 'rocky', moon: true, tilt: 12 } },
  'zettelkasten-organizer': { x: 9, y: 56, side: 'right', planet: { kind: 'gas', tilt: -8 } },
  'pnpm-hardening': { x: 22, y: 72, side: 'right', planet: { kind: 'rocky', tilt: 4 } },
  'omarchy-brutalistoic': { x: 6, y: 20, side: 'right', planet: { kind: 'rocky', ring: true, tilt: -18 } },
  'hugo-theme-plano': { x: 18, y: 36, side: 'right', planet: { kind: 'gas', ring: true, tilt: 22 } },
  'music-for-work': { x: 8, y: 88, side: 'right', planet: { kind: 'gas' } },
};

export const constellations: Constellation[] = [
  { name: 'Lynx', at: { x: 29, y: 5 }, members: ['vigia'] },
  { name: 'Norma', at: { x: 7, y: 66 }, members: ['zettelkasten-organizer', 'pnpm-hardening'] },
  { name: 'Pictor', at: { x: 6, y: 30 }, members: ['omarchy-brutalistoic', 'hugo-theme-plano'] },
  { name: 'Lyra', at: { x: 8, y: 95 }, members: ['music-for-work'] },
];

/** The black hole (the design system's ASCII animation, public/ascii/hole): the centre of its
 *  box on the chart, and where its void sits inside that box (% of the box). */
export const hole = { x: 66, y: 50, core: { x: 49, y: 37 } };

/** The links in spaces.ts, as stars falling through the bridge: where each sits in the hole's
 *  box (% of the box; the drawing fills about 10–89% across and 22–68% down, so the
 *  exits keep to its margins) and which side its name goes on. More links than spots are
 *  spread on a ring. */
const exitSpots: { x: number; y: number; side: 'left' | 'right' }[] = [
  { x: 9, y: 46, side: 'left' },
  { x: 27, y: 12, side: 'left' },
  { x: 74, y: 10, side: 'right' },
  { x: 95, y: 48, side: 'right' },
  { x: 64, y: 86, side: 'right' },
];
export function exitSpot(i: number, count: number): { x: number; y: number; side: 'left' | 'right' } {
  if (count <= exitSpots.length) return exitSpots[i];
  const a = (i / count) * Math.PI * 2 - Math.PI / 2;
  const x = 50 + Math.cos(a) * 46;
  return { x, y: 45 + Math.sin(a) * 42, side: x < 50 ? 'left' : 'right' };
}

/** Small deterministic hash of a string, 0–1. */
function unit(id: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function placeOf(id: string): Required<Place> {
  const p = places[id];
  const x = p?.x ?? Math.round(58 + unit(id, 1) * 34);
  const y = p?.y ?? Math.round(8 + unit(id, 2) * 44);
  return {
    x,
    y,
    side: p?.side ?? (x > 70 ? 'left' : 'right'),
    planet: p?.planet ?? {
      kind: unit(id, 3) > 0.5 ? 'gas' : 'rocky',
      ring: unit(id, 4) > 0.65,
      moon: unit(id, 5) > 0.7,
      tilt: Math.round((unit(id, 6) - 0.5) * 40),
    },
  };
}

export function constellationOf(id: string): string | undefined {
  return constellations.find((c) => c.members.includes(id))?.name;
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

/** Catalog number from the position in projects.ts: VS-001, VS-002… */
export const catalogId = (index: number): string => `VS-${String(index + 1).padStart(3, '0')}`;
