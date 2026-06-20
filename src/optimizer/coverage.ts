import { isSprinkler, scarecrowCoverage, sprinklerCoverage } from '../data/items';
import type { Offset, Placement } from '../types';

export const idx = (x: number, y: number, w: number) => y * w + x;
export const inBounds = (x: number, y: number, w: number, h: number) =>
  x >= 0 && y >= 0 && x < w && y < h;

/** Watering offsets for any placement (empty for non-sprinklers). */
export function wateringOffsets(p: Placement): Offset[] {
  return isSprinkler(p.kind) ? sprinklerCoverage(p.kind, !!p.nozzle) : [];
}

/** Protection offsets for any placement (empty for non-scarecrows). */
export function protectionOffsets(p: Placement): Offset[] {
  if (p.kind === 'scarecrow') return scarecrowCoverage(false);
  if (p.kind === 'deluxe_scarecrow') return scarecrowCoverage(true);
  return [];
}

/**
 * Set of tile indices covered (watered) by sprinklers. Only counts tiles that
 * are plantable and not occupied by an object.
 */
export function computeWatered(
  placements: Placement[],
  tillable: boolean[],
  w: number,
  h: number,
): Set<number> {
  const occupied = new Set(placements.map((p) => idx(p.x, p.y, w)));
  const watered = new Set<number>();
  for (const p of placements) {
    for (const o of wateringOffsets(p)) {
      const x = p.x + o.dx;
      const y = p.y + o.dy;
      if (!inBounds(x, y, w, h)) continue;
      const i = idx(x, y, w);
      if (tillable[i] && !occupied.has(i)) watered.add(i);
    }
  }
  return watered;
}

/** Set of plantable tile indices protected by scarecrows. */
export function computeProtected(
  placements: Placement[],
  tillable: boolean[],
  w: number,
  h: number,
): Set<number> {
  const occupied = new Set(placements.map((p) => idx(p.x, p.y, w)));
  const prot = new Set<number>();
  for (const p of placements) {
    for (const o of protectionOffsets(p)) {
      const x = p.x + o.dx;
      const y = p.y + o.dy;
      if (!inBounds(x, y, w, h)) continue;
      const i = idx(x, y, w);
      if (tillable[i] && !occupied.has(i)) prot.add(i);
    }
  }
  return prot;
}

/** Count plantable tiles inside an optional zone (excluding occupied tiles). */
export function countPlantable(
  tillable: boolean[],
  w: number,
  h: number,
  zone: { x: number; y: number; w: number; h: number } | null,
  occupied?: Set<number>,
): number {
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (zone && (x < zone.x || y < zone.y || x >= zone.x + zone.w || y >= zone.y + zone.h))
        continue;
      const i = idx(x, y, w);
      if (tillable[i] && !(occupied && occupied.has(i))) count++;
    }
  }
  return count;
}
