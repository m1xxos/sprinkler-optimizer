import { isSprinkler, sprinklerCoverage } from '../data/items';
import type {
  Offset,
  OptimizeRequest,
  OptimizeResult,
  Placement,
  SprinklerKind,
} from '../types';
import {
  computeProtected,
  computeWatered,
  countPlantable,
  idx,
  inBounds,
  protectionOffsets,
} from './coverage';

/** Distance from a tile to the nearest edge of the house rectangle. */
function houseDist(x: number, y: number, house: OptimizeRequest['houseRect']): number {
  const dx = Math.max(house.x - x, 0, x - (house.x + house.w - 1));
  const dy = Math.max(house.y - y, 0, y - (house.y + house.h - 1));
  return Math.hypot(dx, dy);
}

function inZone(x: number, y: number, zone: OptimizeRequest['zone']): boolean {
  if (!zone) return true;
  return x >= zone.x && y >= zone.y && x < zone.x + zone.w && y < zone.y + zone.h;
}

/** Candidate tiles where we may place an object: plantable tiles inside the zone. */
function candidates(req: OptimizeRequest): number[] {
  const out: number[] = [];
  for (let y = 0; y < req.height; y++) {
    for (let x = 0; x < req.width; x++) {
      if (!inZone(x, y, req.zone)) continue;
      if (req.tillable[idx(x, y, req.width)]) out.push(idx(x, y, req.width));
    }
  }
  return out;
}

// House proximity bias: scales with gain so a zero-gain tile never wins, but
// among comparable gains the tile closest to the house is preferred.
const PROXIMITY_BETA = 3;

interface Ctx {
  req: OptimizeRequest;
  w: number;
  h: number;
  occupied: Set<number>;
  watered: Set<number>;
  protectedSet: Set<number>;
  cand: number[];
}

/** Count new watered plantable tiles if a sprinkler of given coverage is placed at (x,y). */
function wateringGain(c: Ctx, x: number, y: number, offs: Offset[]): number {
  let gain = 0;
  for (const o of offs) {
    const nx = x + o.dx;
    const ny = y + o.dy;
    if (!inBounds(nx, ny, c.w, c.h)) continue;
    if (!inZone(nx, ny, c.req.zone)) continue;
    const i = idx(nx, ny, c.w);
    if (c.req.tillable[i] && !c.occupied.has(i) && !c.watered.has(i)) gain++;
  }
  return gain;
}

function placeBestSprinkler(c: Ctx, kind: SprinklerKind): Placement | null {
  const offs = sprinklerCoverage(kind, false);
  let best: { i: number; score: number; gain: number } | null = null;
  for (const i of c.cand) {
    if (c.occupied.has(i)) continue;
    const x = i % c.w;
    const y = Math.floor(i / c.w);
    const gain = wateringGain(c, x, y, offs);
    if (gain <= 0) continue;
    const dist = houseDist(x, y, c.req.houseRect);
    const score = gain + (PROXIMITY_BETA * gain) / (1 + dist);
    if (!best || score > best.score) best = { i, score, gain };
  }
  if (!best) return null;
  const x = best.i % c.w;
  const y = Math.floor(best.i / c.w);
  c.occupied.add(best.i);
  c.watered.delete(best.i);
  for (const o of offs) {
    const nx = x + o.dx;
    const ny = y + o.dy;
    if (!inBounds(nx, ny, c.w, c.h) || !inZone(nx, ny, c.req.zone)) continue;
    const j = idx(nx, ny, c.w);
    if (c.req.tillable[j] && !c.occupied.has(j)) c.watered.add(j);
  }
  return { id: crypto.randomUUID(), kind, x, y };
}

function placeBestScarecrow(c: Ctx, deluxe: boolean): Placement | null {
  const kind = deluxe ? 'deluxe_scarecrow' : 'scarecrow';
  const offs = protectionOffsets({ id: '', kind, x: 0, y: 0 });
  let best: { i: number; score: number } | null = null;
  for (const i of c.cand) {
    if (c.occupied.has(i)) continue;
    const x = i % c.w;
    const y = Math.floor(i / c.w);
    let gain = 0;
    for (const o of offs) {
      const nx = x + o.dx;
      const ny = y + o.dy;
      if (!inBounds(nx, ny, c.w, c.h) || !inZone(nx, ny, c.req.zone)) continue;
      const j = idx(nx, ny, c.w);
      if (c.req.tillable[j] && !c.occupied.has(j) && !c.protectedSet.has(j)) gain++;
    }
    if (gain <= 0) continue;
    const dist = houseDist(x, y, c.req.houseRect);
    const score = gain + (PROXIMITY_BETA * gain) / (1 + dist);
    if (!best || score > best.score) best = { i, score };
  }
  if (!best) return null;
  const x = best.i % c.w;
  const y = Math.floor(best.i / c.w);
  c.occupied.add(best.i);
  for (const o of offs) {
    const nx = x + o.dx;
    const ny = y + o.dy;
    if (!inBounds(nx, ny, c.w, c.h) || !inZone(nx, ny, c.req.zone)) continue;
    const j = idx(nx, ny, c.w);
    if (c.req.tillable[j] && !c.occupied.has(j)) c.protectedSet.add(j);
  }
  return { id: crypto.randomUUID(), kind, x, y };
}

/** Distribute pressure nozzles to placed sprinklers for the largest extra coverage. */
function applyNozzles(c: Ctx, placements: Placement[], count: number) {
  let remaining = count;
  while (remaining > 0) {
    let best: { p: Placement; kind: SprinklerKind; extra: number } | null = null;
    for (const p of placements) {
      const kind = p.kind;
      if (!isSprinkler(kind) || p.nozzle) continue;
      const upgraded = sprinklerCoverage(kind, true);
      let extra = 0;
      for (const o of upgraded) {
        const nx = p.x + o.dx;
        const ny = p.y + o.dy;
        if (!inBounds(nx, ny, c.w, c.h) || !inZone(nx, ny, c.req.zone)) continue;
        const j = idx(nx, ny, c.w);
        if (c.req.tillable[j] && !c.occupied.has(j) && !c.watered.has(j)) extra++;
      }
      if (extra > 0 && (!best || extra > best.extra)) best = { p, kind, extra };
    }
    if (!best) break;
    best.p.nozzle = true;
    for (const o of sprinklerCoverage(best.kind, true)) {
      const nx = best.p.x + o.dx;
      const ny = best.p.y + o.dy;
      if (!inBounds(nx, ny, c.w, c.h) || !inZone(nx, ny, c.req.zone)) continue;
      const j = idx(nx, ny, c.w);
      if (c.req.tillable[j] && !c.occupied.has(j)) c.watered.add(j);
    }
    remaining--;
  }
}

export type Progress = (fraction: number) => void;

/** Run the greedy optimizer once. */
export function optimize(req: OptimizeRequest, onProgress?: Progress): OptimizeResult {
  const c: Ctx = {
    req,
    w: req.width,
    h: req.height,
    occupied: new Set(),
    watered: new Set(),
    protectedSet: new Set(),
    cand: candidates(req),
  };

  const placements: Placement[] = [];
  // Place larger-coverage sprinklers first so they grab the open space.
  const order: SprinklerKind[] = ['iridium', 'quality', 'basic'];
  const totalSprinklers =
    req.inventory.iridium + req.inventory.quality + req.inventory.basic;
  let done = 0;
  for (const kind of order) {
    for (let n = 0; n < req.inventory[kind]; n++) {
      const p = placeBestSprinkler(c, kind);
      done++;
      if (onProgress && totalSprinklers > 0) onProgress((done / totalSprinklers) * 0.7);
      if (!p) break; // no more useful spots for this tier
      placements.push(p);
    }
  }

  applyNozzles(c, placements, req.nozzles);
  if (onProgress) onProgress(0.85);

  // Scarecrows: protect the most planted tiles, deluxe first (larger area).
  for (let n = 0; n < req.inventory.deluxe_scarecrow; n++) {
    const p = placeBestScarecrow(c, true);
    if (!p) break;
    placements.push(p);
  }
  for (let n = 0; n < req.inventory.scarecrow; n++) {
    const p = placeBestScarecrow(c, false);
    if (!p) break;
    placements.push(p);
  }
  if (onProgress) onProgress(1);

  const watered = computeWatered(placements, req.tillable, req.width, req.height);
  const occupied = new Set(placements.map((p) => idx(p.x, p.y, req.width)));
  const protectedSet = computeProtected(placements, req.tillable, req.width, req.height);
  const plantableCount = countPlantable(
    req.tillable,
    req.width,
    req.height,
    req.zone,
    occupied,
  );

  return {
    placements,
    wateredCount: watered.size,
    plantableCount,
    protectedCount: protectedSet.size,
  };
}
