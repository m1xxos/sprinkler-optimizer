export type SprinklerKind = 'basic' | 'quality' | 'iridium';
export type ItemKind = SprinklerKind | 'scarecrow' | 'deluxe_scarecrow';

/** A placed object on the map. Sprinklers may carry a pressure nozzle. */
export interface Placement {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
  /** Only meaningful for sprinkler kinds. */
  nozzle?: boolean;
}

/** Tile offset relative to an object's own tile. */
export interface Offset {
  dx: number;
  dy: number;
}

export interface FarmData {
  id: string;
  /** Width / height in tiles. */
  width: number;
  height: number;
  /** Pixel size of a single tile in the background image. */
  tileSize: number;
  /** Background image path (relative to BASE_URL). */
  background: string;
  /** Flat row-major boolean grid, length = width*height. true = plantable. */
  tillable: boolean[];
  /** Farmhouse rectangle in tile coords (used for "near the house" priority). */
  houseRect: { x: number; y: number; w: number; h: number };
}

export interface FarmMeta {
  id: string;
  nameRu: string;
  nameEn: string;
  /** Path to the farm JSON (relative to BASE_URL). */
  data: string;
}

export type Inventory = Record<ItemKind, number>;

/** What the optimizer should place, plus pressure nozzle count. */
export interface OptimizeRequest {
  width: number;
  height: number;
  tillable: boolean[];
  houseRect: FarmData['houseRect'];
  /** Optional restriction rectangle (tile coords). When null, whole farm. */
  zone: { x: number; y: number; w: number; h: number } | null;
  inventory: Inventory;
  nozzles: number;
}

export interface OptimizeResult {
  placements: Placement[];
  wateredCount: number;
  plantableCount: number;
  protectedCount: number;
}
