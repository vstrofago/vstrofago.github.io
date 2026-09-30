// The pixel ships the outer spaces fly (see src/components/ds/Ship.astro, which draws them, and
// docs/assets.md, "Drawing a new ship"). A hull is nine strings of nine characters, pointing up:
// `#` is a lit pixel, `.` is empty. To add one: add its name to `shipKinds` and its hull to
// `HULLS`. Pure data: src/content.config.ts checks every space's `ship` against `shipKinds`.

export const shipKinds = ['rocket', 'shuttle', 'fighter', 'saucer', 'probe'] as const;
export type ShipKind = (typeof shipKinds)[number];

export const HULLS: Record<ShipKind, readonly string[]> = {
  rocket: [
    '....#....',
    '...###...',
    '...#.#...',
    '...###...',
    '..#####..',
    '..##.##..',
    '.#######.',
    '.#.#.#.#.',
    '...#.#...',
  ],
  shuttle: [
    '....#....',
    '...###...',
    '...###...',
    '..##.##..',
    '.#######.',
    '#########',
    '#.#####.#',
    '...#.#...',
    '..#...#..',
  ],
  fighter: [
    '#.......#',
    '#...#...#',
    '#..###..#',
    '#########',
    '#..#.#..#',
    '#..###..#',
    '#...#...#',
    '#.......#',
    '.........',
  ],
  saucer: [
    '.........',
    '...###...',
    '..#...#..',
    '.#######.',
    '#.#.#.#.#',
    '.#######.',
    '..#...#..',
    '.#.....#.',
    '.........',
  ],
  probe: [
    '....#....',
    '....#....',
    '..#####..',
    '###.#.###',
    '#.#####.#',
    '###.#.###',
    '..#####..',
    '...#.#...',
    '..#...#..',
  ],
};

// A malformed hull fails the build instead of drawing a broken ship.
for (const [kind, hull] of Object.entries(HULLS)) {
  if (hull.length !== 9 || hull.some((row) => !/^[#.]{9}$/.test(row))) {
    throw new Error(`ships.ts: the "${kind}" hull must be 9 rows of 9 characters, each "#" or "."`);
  }
}
