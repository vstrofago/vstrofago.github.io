import type { ProjectStatus } from './projects';

// The star chart. Every project in projects.ts is a star; this file says where it sits, which
// constellation it belongs to and what its planet looks like up close.
// - `x` / `y`: position on the chart's grid, 0–100 from its top left. Keep to the left
//   (x < 56): the Einstein–Rosen bridge takes the right of the grid.
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
  vigia: { x: 40, y: 16, side: 'right', planet: { kind: 'rocky', moon: true, tilt: 12 } },
  'zettelkasten-organizer': { x: 10, y: 62, side: 'right', planet: { kind: 'gas', tilt: -8 } },
  'pnpm-hardening': { x: 27, y: 78, side: 'right', planet: { kind: 'rocky', tilt: 4 } },
  'omarchy-brutalistoic': { x: 8, y: 16, side: 'right', planet: { kind: 'rocky', ring: true, tilt: -18 } },
  'hugo-theme-plano': { x: 21, y: 36, side: 'right', planet: { kind: 'gas', ring: true, tilt: 22 } },
  'music-for-work': { x: 44, y: 52, side: 'right', planet: { kind: 'gas' } },
};

/** Constellations are named after what their stars are, in the Latin of real star charts:
 *  Themata (themes), Automata (agent skills), Instrumenta (tools), Lyra (music: the real Lyra
 *  is the lyre). */
export const constellations: Constellation[] = [
  { name: 'Instrumenta', at: { x: 40, y: 8 }, members: ['vigia'] },
  { name: 'Automata', at: { x: 9, y: 73 }, members: ['zettelkasten-organizer', 'pnpm-hardening'] },
  { name: 'Themata', at: { x: 8, y: 28 }, members: ['omarchy-brutalistoic', 'hugo-theme-plano'] },
  { name: 'Lyra', at: { x: 44, y: 60 }, members: ['music-for-work'] },
];

/** The Einstein–Rosen bridge, drawn by cosmos.ts over the right of the grid: the grid sinks into
 *  a mouth (`top`), runs down a wireframe throat, and opens onto another plane (`bottom`),
 *  where the links in spaces.ts sit as stars. Positions are % of the grid; `rx` is the mouths'
 *  radius as % of the grid's width (their height is `tilt` × that, for perspective). `mobile`
 *  replaces them under 860px. `exits` are the links' angles around the far mouth (degrees,
 *  0 = right, 90 = down) and their distance in mouth radii. */
export const bridge = {
  top: { x: 76, y: 24 },
  bottom: { x: 76, y: 74 },
  rx: 10,
  tilt: 0.3,
  mobile: { top: { x: 68, y: 66 }, bottom: { x: 68, y: 88 }, rx: 20 },
  exits: { angles: [240, 208, 180, 152, 124], distance: 2.1 },
};

/** Where an exit sits, as % of the grid, for a grid of the given aspect (width / height).
 *  cosmos.ts recomputes it with the real aspect; this is the no-JS / first-paint position. */
export function exitAt(i: number, aspect = 2, geo: { bottom: { x: number; y: number }; rx: number } = bridge): { x: number; y: number } {
  const angles = bridge.exits.angles;
  const deg = i < angles.length ? angles[i] : 124 - (i - angles.length + 1) * 28;
  const a = (deg * Math.PI) / 180, d = bridge.exits.distance;
  return {
    x: geo.bottom.x + Math.cos(a) * d * geo.rx,
    y: geo.bottom.y + Math.sin(a) * d * geo.rx * bridge.tilt * aspect,
  };
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
