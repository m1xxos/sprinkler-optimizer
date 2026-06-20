// Builds public/maps/<id>.json from tillable layer data (sourced from the
// Apache-2.0 hpeinar/stardewplanner project; see public/maps/CREDITS.md).
// Tillable JSONs are expected in /tmp/till/<id>.json and background images
// already in public/maps/<id>.jpg (downloaded via curl — see README).
// Run: `node scripts/gen-maps.mjs`.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TILE = 16;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/maps');
const TILL = '/tmp/till';

// width/height in pixels (÷16 = tiles); house in tile coords (null = no
// farmhouse, e.g. Ginger Island -> use centroid of plantable area). img is the
// background filename in public/maps/.
const FARMS = [
  { id: 'standard',    w: 1280, h: 1040, house: { x: 59, y: 8 },  img: 'standard.jpg' },
  { id: 'riverland',   w: 1280, h: 1040, house: { x: 59, y: 8 },  img: 'riverland.jpg' },
  { id: 'forest',      w: 1280, h: 1040, house: { x: 59, y: 8 },  img: 'forest.jpg' },
  { id: 'hilltop',     w: 1280, h: 1040, house: { x: 59, y: 8 },  img: 'hilltop.jpg' },
  { id: 'wilderness',  w: 1280, h: 1040, house: { x: 59, y: 8 },  img: 'wilderness.jpg' },
  { id: 'fourcorners', w: 1280, h: 1280, house: { x: 59, y: 8 },  img: 'fourcorners.jpg' },
  { id: 'beach',       w: 1760, h: 1760, house: { x: 59, y: 8 },  img: 'beach.jpg' },
  { id: 'meadowlands', w: 1600, h: 1200, house: { x: 76, y: 20 }, img: 'meadowlands.png' },
  { id: 'ginger',      w: 1760, h: 1760, house: null,             img: 'ginger.jpg' },
];

async function main() {
  for (const f of FARMS) {
    const width = f.w / TILE;
    const height = f.h / TILE;
    const tillJson = JSON.parse(await readFile(resolve(TILL, `${f.id}.json`), 'utf8'));
    const layer = tillJson['tillable.tillable'] || Object.values(tillJson)[0];
    const tiles = layer.Tiles || [];
    const tillable = new Array(width * height).fill(false);
    for (const s of tiles) {
      const [x, y] = s.split(',').map((n) => parseInt(n.trim(), 10));
      if (x >= 0 && y >= 0 && x < width && y < height) tillable[y * width + x] = true;
    }
    // Farmhouse rect for "near the house" priority. Maps without a farmhouse
    // (Ginger Island) fall back to the centroid of the plantable area.
    let house = f.house;
    if (!house) {
      let sx = 0, sy = 0, n = 0;
      for (let i = 0; i < tillable.length; i++) {
        if (tillable[i]) { sx += i % width; sy += Math.floor(i / width); n++; }
      }
      house = n ? { x: Math.round(sx / n), y: Math.round(sy / n) } : { x: 0, y: 0 };
    }

    const data = {
      width,
      height,
      tileSize: TILE,
      background: f.img,
      houseRect: { x: house.x, y: house.y, w: 9, h: 6 },
      tillable,
    };
    await writeFile(resolve(OUT, `${f.id}.json`), JSON.stringify(data));
    console.log(`${f.id}: ${width}x${height}, ${tillable.filter(Boolean).length} tillable`);
  }
  console.log('Done ->', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
