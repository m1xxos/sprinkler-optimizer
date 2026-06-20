// Headless sanity test for the optimizer against real farm data.
import { readFileSync } from 'node:fs';
import { optimize } from '../src/optimizer/optimize';
import { sprinklerCoverage, scarecrowCoverage } from '../src/data/items';
import { computeWatered } from '../src/optimizer/coverage';
import type { FarmData, Inventory, OptimizeRequest } from '../src/types';

// Coverage pattern sanity
console.log('basic:', sprinklerCoverage('basic', false).length, '(exp 4)');
console.log('basic+nozzle:', sprinklerCoverage('basic', true).length, '(exp 8)');
console.log('quality:', sprinklerCoverage('quality', false).length, '(exp 8)');
console.log('quality+nozzle:', sprinklerCoverage('quality', true).length, '(exp 24)');
console.log('iridium:', sprinklerCoverage('iridium', false).length, '(exp 24)');
console.log('iridium+nozzle:', sprinklerCoverage('iridium', true).length, '(exp 48)');
console.log('scarecrow:', scarecrowCoverage(false).length, 'deluxe:', scarecrowCoverage(true).length);

const farm: FarmData = JSON.parse(readFileSync('public/maps/standard.json', 'utf8'));
farm.id = 'standard';

const inventory: Inventory = {
  basic: 0,
  quality: 0,
  iridium: 50,
  scarecrow: 4,
  deluxe_scarecrow: 0,
};
const req: OptimizeRequest = {
  width: farm.width,
  height: farm.height,
  tillable: farm.tillable,
  houseRect: farm.houseRect,
  zone: null,
  inventory,
  nozzles: 10,
};

const t0 = Date.now();
const res = optimize(req);
const ms = Date.now() - t0;

const sprinklers = res.placements.filter((p) => ['basic', 'quality', 'iridium'].includes(p.kind));
const nozzled = res.placements.filter((p) => p.nozzle).length;
const recomputed = computeWatered(res.placements, farm.tillable, farm.width, farm.height).size;

console.log('\n--- optimize (50 iridium + 10 nozzles + 4 scarecrows) ---');
console.log('time:', ms, 'ms');
console.log('sprinklers placed:', sprinklers.length, '/ 50');
console.log('nozzles applied:', nozzled, '/ 10');
console.log('watered:', res.wateredCount, '(recomputed', recomputed + ')');
console.log('protected:', res.protectedCount);
console.log('plantable remaining:', res.plantableCount);

// Validation: no two placements on the same tile
const seen = new Set(res.placements.map((p) => p.x + ',' + p.y));
console.log('unique positions:', seen.size === res.placements.length ? 'OK' : 'DUPLICATES!');
// Validation: watered count matches recomputation
console.log('watered consistent:', res.wateredCount === recomputed ? 'OK' : 'MISMATCH');
