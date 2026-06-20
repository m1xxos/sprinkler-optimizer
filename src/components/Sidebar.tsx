import { useMemo } from 'react';
import { useStore } from '../state/store';
import { FARMS, farmName } from '../data/farms';
import { ALL_ITEM_KINDS, ITEM_COLORS, isSprinkler } from '../data/items';
import { t } from '../i18n/strings';
import { computeProtected, computeWatered, countPlantable, idx } from '../optimizer/coverage';
import { useOptimizer } from '../state/useOptimizer';
import type { ItemKind } from '../types';

export function Sidebar() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const farmId = useStore((s) => s.farmId);
  const selectFarm = useStore((s) => s.selectFarm);
  const farm = useStore((s) => s.farm);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const inventory = useStore((s) => s.inventory);
  const setInventory = useStore((s) => s.setInventory);
  const nozzles = useStore((s) => s.nozzles);
  const setNozzles = useStore((s) => s.setNozzles);
  const zone = useStore((s) => s.zone);
  const zoneMode = useStore((s) => s.zoneMode);
  const setZoneMode = useStore((s) => s.setZoneMode);
  const setZone = useStore((s) => s.setZone);
  const placements = useStore((s) => s.placements);
  const clearPlacements = useStore((s) => s.clearPlacements);
  const optimizing = useStore((s) => s.optimizing);
  const progress = useStore((s) => s.progress);

  const run = useOptimizer();

  const stats = useMemo(() => {
    if (!farm) return null;
    const watered = computeWatered(placements, farm.tillable, farm.width, farm.height).size;
    const prot = computeProtected(placements, farm.tillable, farm.width, farm.height).size;
    const occupied = new Set(placements.map((p) => idx(p.x, p.y, farm.width)));
    const plantable = countPlantable(farm.tillable, farm.width, farm.height, zone, occupied);
    const used = placements.reduce<Record<string, number>>((acc, p) => {
      acc[p.kind] = (acc[p.kind] || 0) + 1;
      if (p.nozzle) acc.nozzle = (acc.nozzle || 0) + 1;
      return acc;
    }, {});
    return { watered, prot, plantable, used };
  }, [farm, placements, zone]);

  return (
    <aside className="sidebar">
      <h1>{t('appTitle', lang)}</h1>

      <div className="row">
        <label>{t('language', lang)}</label>
        <div className="seg">
          <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>RU</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
      </div>

      <div className="row">
        <label>{t('farm', lang)}</label>
        <select value={farmId} onChange={(e) => selectFarm(e.target.value)}>
          {FARMS.map((f) => (
            <option key={f.id} value={f.id}>{farmName(f, lang)}</option>
          ))}
        </select>
      </div>

      <section>
        <h2>{t('palette', lang)}</h2>
        <p className="hint">{t('placeHint', lang)}</p>
        <div className="palette">
          {ALL_ITEM_KINDS.map((k) => (
            <button
              key={k}
              className={tool === k ? 'tool on' : 'tool'}
              style={{ borderColor: ITEM_COLORS[k] }}
              onClick={() => setTool(k)}
            >
              <span className="swatch" style={{ background: ITEM_COLORS[k] }} />
              {t(k, lang)}
            </button>
          ))}
          <button className={tool === 'nozzle' ? 'tool on' : 'tool'} onClick={() => setTool('nozzle')}>
            🔧 {t('nozzle', lang)}
          </button>
          <button className={tool === 'erase' ? 'tool on' : 'tool'} onClick={() => setTool('erase')}>
            🧽 {t('erase', lang)}
          </button>
        </div>
        <p className="hint">{t('nozzleHint', lang)}</p>
      </section>

      <section>
        <h2>{t('inventory', lang)}</h2>
        {ALL_ITEM_KINDS.map((k: ItemKind) => (
          <div className="row" key={k}>
            <label>{t(k, lang)}</label>
            <input
              type="number"
              min={0}
              value={inventory[k]}
              onChange={(e) => setInventory(k, parseInt(e.target.value || '0', 10))}
            />
          </div>
        ))}
        <div className="row">
          <label>{t('nozzle', lang)}</label>
          <input
            type="number"
            min={0}
            value={nozzles}
            onChange={(e) => setNozzles(parseInt(e.target.value || '0', 10))}
          />
        </div>
      </section>

      <section>
        <h2>{t('zone', lang)}</h2>
        <button className={zoneMode ? 'wide on' : 'wide'} onClick={() => setZoneMode(!zoneMode)}>
          {t('selectZone', lang)}
        </button>
        <button className="wide" onClick={() => setZone(null)} disabled={!zone}>
          {t('clearZone', lang)}
        </button>
        <p className="hint">
          {zone
            ? `${t('plantableInZone', lang)}: ${stats?.plantable ?? 0}`
            : `${t('wholeFarm', lang)}: ${stats?.plantable ?? 0}`}
        </p>
      </section>

      <section>
        <button className="wide primary" onClick={run} disabled={optimizing || !farm}>
          {optimizing ? `${t('optimizing', lang)} ${Math.round(progress * 100)}%` : t('optimize', lang)}
        </button>
        <button className="wide" onClick={clearPlacements} disabled={!placements.length}>
          {t('clear', lang)}
        </button>
      </section>

      {stats && (
        <section>
          <h2>{t('stats', lang)}</h2>
          <p>{t('watered', lang)}: <b>{stats.watered}</b> / {stats.watered + stats.plantable}</p>
          <p>{t('protected', lang)}: <b>{stats.prot}</b></p>
          <p className="hint">
            {t('used', lang)}:{' '}
            {Object.entries(stats.used)
              .map(([k, n]) => `${k === 'nozzle' ? t('nozzle', lang) : isSprinkler(k as ItemKind) || k.includes('scarecrow') ? t(k as ItemKind, lang) : k}: ${n}`)
              .join(', ') || '—'}
          </p>
        </section>
      )}

      <p className="hint">{t('panHint', lang)}</p>
    </aside>
  );
}
