import type { ProjectStatus } from './projects';

// The star chart. Every project in projects.ts is a star; this file says where it sits, which
// constellation it belongs to and what its planet looks like up close.
// - `x` / `y`: position on the chart, 0–100 from the top left. Keep the left side quiet
//   (x < 38): the headline lives there on wide screens.
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
  vigia: { x: 72, y: 18, side: 'right', planet: { kind: 'rocky', moon: true, tilt: 12 } },
  'zettelkasten-organizer': { x: 84, y: 40, side: 'left', planet: { kind: 'gas', tilt: -8 } },
  'pnpm-hardening': { x: 90, y: 62, side: 'left', planet: { kind: 'rocky', tilt: 4 } },
  'omarchy-brutalistoic': { x: 42, y: 20, side: 'right', planet: { kind: 'rocky', ring: true, tilt: -18 } },
  'hugo-theme-plano': { x: 55, y: 38, side: 'right', planet: { kind: 'gas', ring: true, tilt: 22 } },
  'music-for-work': { x: 66, y: 80, side: 'right', planet: { kind: 'gas' } },
};

export const constellations: Constellation[] = [
  { name: 'Lynx', at: { x: 72, y: 9 }, members: ['vigia'] },
  { name: 'Norma', at: { x: 93, y: 49 }, members: ['zettelkasten-organizer', 'pnpm-hardening'] },
  { name: 'Pictor', at: { x: 42, y: 31 }, members: ['omarchy-brutalistoic', 'hugo-theme-plano'] },
  { name: 'Lyra', at: { x: 66, y: 90 }, members: ['music-for-work'] },
];

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
