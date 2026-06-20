import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { useStore } from './state/store';
import { FARMS } from './data/farms';
import { t } from './i18n/strings';
import type { FarmData } from './types';

const base = import.meta.env.BASE_URL;

export default function App() {
  const farmId = useStore((s) => s.farmId);
  const setFarm = useStore((s) => s.setFarm);
  const loading = useStore((s) => s.loading);
  const farm = useStore((s) => s.farm);
  const lang = useStore((s) => s.lang);

  useEffect(() => {
    const meta = FARMS.find((f) => f.id === farmId);
    if (!meta) return;
    let cancelled = false;
    fetch(meta.data)
      .then((r) => r.json())
      .then((raw: Omit<FarmData, 'id' | 'background'> & { background: string }) => {
        if (cancelled) return;
        const data: FarmData = {
          id: farmId,
          ...raw,
          background: `${base}maps/${raw.background}`,
        };
        setFarm(farmId, data);
      })
      .catch(() => {
        if (!cancelled) setFarm(farmId, fallbackFarm(farmId));
      });
    return () => {
      cancelled = true;
    };
  }, [farmId, setFarm]);

  return (
    <div className="app">
      <Sidebar />
      <main className="stage">
        {loading || !farm ? <div className="loading">{t('loading', lang)}</div> : <MapCanvas />}
      </main>
    </div>
  );
}

/** Minimal placeholder farm if a JSON fails to load, so the UI still works. */
function fallbackFarm(id: string): FarmData {
  const width = 40;
  const height = 30;
  const tillable = new Array(width * height).fill(false);
  for (let y = 4; y < height - 2; y++)
    for (let x = 2; x < width - 2; x++) tillable[y * width + x] = true;
  return {
    id,
    width,
    height,
    tileSize: 16,
    background: '',
    tillable,
    houseRect: { x: width - 8, y: 1, w: 6, h: 3 },
  };
}
