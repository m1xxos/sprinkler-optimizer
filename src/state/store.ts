import { create } from 'zustand';
import type {
  FarmData,
  Inventory,
  ItemKind,
  OptimizeResult,
  Placement,
} from '../types';
import type { Lang } from '../i18n/strings';
import { idx } from '../optimizer/coverage';

export type Tool = ItemKind | 'erase' | 'nozzle' | null;
export type Zone = { x: number; y: number; w: number; h: number } | null;

const emptyInventory = (): Inventory => ({
  basic: 0,
  quality: 0,
  iridium: 0,
  scarecrow: 0,
  deluxe_scarecrow: 0,
});

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;

  farmId: string;
  farm: FarmData | null;
  loading: boolean;
  setFarm: (id: string, data: FarmData) => void;
  selectFarm: (id: string) => void;

  placements: Placement[];
  tool: Tool;
  setTool: (t: Tool) => void;

  inventory: Inventory;
  nozzles: number;
  setInventory: (k: ItemKind, n: number) => void;
  setNozzles: (n: number) => void;

  zone: Zone;
  setZone: (z: Zone) => void;
  zoneMode: boolean;
  setZoneMode: (on: boolean) => void;

  optimizing: boolean;
  progress: number;
  setOptimizing: (on: boolean, progress?: number) => void;
  applyResult: (r: OptimizeResult) => void;

  placeAt: (x: number, y: number) => void;
  clearPlacements: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  lang: 'ru',
  setLang: (lang) => set({ lang }),

  farmId: 'standard',
  farm: null,
  loading: false,
  setFarm: (farmId, farm) => set({ farmId, farm, loading: false }),
  selectFarm: (farmId) => set({ farmId, loading: true, placements: [], zone: null }),

  placements: [],
  tool: 'iridium',
  setTool: (tool) => set({ tool }),

  inventory: emptyInventory(),
  nozzles: 0,
  setInventory: (k, n) =>
    set((s) => ({ inventory: { ...s.inventory, [k]: Math.max(0, n) } })),
  setNozzles: (n) => set({ nozzles: Math.max(0, n) }),

  zone: null,
  setZone: (zone) => set({ zone }),
  zoneMode: false,
  setZoneMode: (zoneMode) => set({ zoneMode }),

  optimizing: false,
  progress: 0,
  setOptimizing: (optimizing, progress = 0) => set({ optimizing, progress }),
  applyResult: (r) => set({ placements: r.placements, optimizing: false, progress: 1 }),

  placeAt: (x, y) => {
    const { tool, farm, placements } = get();
    if (!farm || !tool) return;
    if (x < 0 || y < 0 || x >= farm.width || y >= farm.height) return;
    const i = idx(x, y, farm.width);
    const existing = placements.find((p) => p.x === x && p.y === y);

    if (tool === 'erase') {
      if (existing) set({ placements: placements.filter((p) => p !== existing) });
      return;
    }
    if (tool === 'nozzle') {
      if (existing && (existing.kind === 'basic' || existing.kind === 'quality' || existing.kind === 'iridium')) {
        set({
          placements: placements.map((p) =>
            p === existing ? { ...p, nozzle: !p.nozzle } : p,
          ),
        });
      }
      return;
    }
    // Placing an item: only on plantable tiles, replace whatever is there.
    if (!farm.tillable[i]) return;
    const next = placements.filter((p) => !(p.x === x && p.y === y));
    next.push({ id: crypto.randomUUID(), kind: tool, x, y });
    set({ placements: next });
  },

  clearPlacements: () => set({ placements: [] }),
}));
