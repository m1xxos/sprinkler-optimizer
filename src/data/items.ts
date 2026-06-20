import type { ItemKind, Offset, SprinklerKind } from '../types';

/** Build a square ring pattern: all tiles within Chebyshev `radius`, minus center. */
function square(radius: number): Offset[] {
  const out: Offset[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      out.push({ dx, dy });
    }
  }
  return out;
}

/** Plus/cross pattern (the basic sprinkler). */
const CROSS: Offset[] = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

/** Euclidean disc of a given radius, minus center (scarecrow protection). */
function disc(radius: number): Offset[] {
  const out: Offset[] = [];
  const r2 = radius * radius;
  const b = Math.ceil(radius);
  for (let dy = -b; dy <= b; dy++) {
    for (let dx = -b; dx <= b; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy <= r2) out.push({ dx, dy });
    }
  }
  return out;
}

/**
 * Watering coverage for a sprinkler, depending on tier and pressure nozzle.
 *  basic:   cross (4) -> nozzle 3x3 (8)
 *  quality: 3x3 (8)   -> nozzle 5x5 (24)
 *  iridium: 5x5 (24)  -> nozzle 7x7 (48)
 */
export function sprinklerCoverage(kind: SprinklerKind, nozzle: boolean): Offset[] {
  switch (kind) {
    case 'basic':
      return nozzle ? square(1) : CROSS;
    case 'quality':
      return nozzle ? square(2) : square(1);
    case 'iridium':
      return nozzle ? square(3) : square(2);
  }
}

// Scarecrow protection radii (approximate the in-game protected area; ~248 and
// a much larger area for the deluxe version). Tunable against the wiki.
// Tuned so the disc tile count matches the in-game protected areas
// (~248 tiles for a regular scarecrow, ~800 for the deluxe).
export const SCARECROW_RADIUS = 8.95;
export const DELUXE_SCARECROW_RADIUS = 16;

export function scarecrowCoverage(deluxe: boolean): Offset[] {
  return disc(deluxe ? DELUXE_SCARECROW_RADIUS : SCARECROW_RADIUS);
}

export const SPRINKLER_KINDS: SprinklerKind[] = ['basic', 'quality', 'iridium'];

export const ITEM_COLORS: Record<ItemKind, string> = {
  basic: '#c8a45a',
  quality: '#5aa0c8',
  iridium: '#a05ac8',
  scarecrow: '#6f9e4c',
  deluxe_scarecrow: '#3f7e2c',
};

/** Short glyph used to draw an object on the canvas. */
export const ITEM_GLYPH: Record<ItemKind, string> = {
  basic: 'S',
  quality: 'Q',
  iridium: 'I',
  scarecrow: '✶',
  deluxe_scarecrow: '✷',
};

export const ALL_ITEM_KINDS: ItemKind[] = [
  'basic',
  'quality',
  'iridium',
  'scarecrow',
  'deluxe_scarecrow',
];

export function isSprinkler(kind: ItemKind): kind is SprinklerKind {
  return kind === 'basic' || kind === 'quality' || kind === 'iridium';
}
