import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { ITEM_COLORS, ITEM_GLYPH } from '../data/items';
import { computeProtected, computeWatered, idx } from '../optimizer/coverage';

interface View {
  scale: number;
  ox: number;
  oy: number;
}

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);

  const farm = useStore((s) => s.farm);
  const placements = useStore((s) => s.placements);
  const zone = useStore((s) => s.zone);
  const zoneMode = useStore((s) => s.zoneMode);
  const placeAt = useStore((s) => s.placeAt);
  const setZone = useStore((s) => s.setZone);
  const setZoneMode = useStore((s) => s.setZoneMode);

  const [view, setView] = useState<View>({ scale: 1, ox: 0, oy: 0 });
  const drag = useRef<{ mode: 'pan' | 'paint' | 'zone' | null; sx: number; sy: number; tile?: { x: number; y: number } }>(
    { mode: null, sx: 0, sy: 0 },
  );
  const [tempZone, setTempZone] = useState<typeof zone>(null);

  // Load background image when farm changes.
  useEffect(() => {
    if (!farm) return;
    setImgReady(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
    img.onerror = () => {
      // No background available: render on a blank grid.
      imgRef.current = null;
      setImgReady(true);
    };
    img.src = farm.background;
  }, [farm]);

  // Fit the map to the canvas when a new farm loads.
  useEffect(() => {
    if (!farm || !imgReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const worldW = farm.width * farm.tileSize;
    const worldH = farm.height * farm.tileSize;
    const scale = Math.min(canvas.width / worldW, canvas.height / worldH) * 0.95;
    setView({
      scale,
      ox: (canvas.width - worldW * scale) / 2,
      oy: (canvas.height - worldH * scale) / 2,
    });
  }, [farm, imgReady]);

  // Redraw on any relevant change.
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm, placements, zone, tempZone, view, imgReady]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !farm) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ts = farm.tileSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    const worldW = farm.width * ts;
    const worldH = farm.height * ts;

    // Background
    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, worldW, worldH);
    } else {
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(0, 0, worldW, worldH);
    }

    // Tillable tint
    ctx.fillStyle = 'rgba(120, 200, 80, 0.18)';
    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        if (farm.tillable[idx(x, y, farm.width)]) ctx.fillRect(x * ts, y * ts, ts, ts);
      }
    }

    // Coverage overlays
    const watered = computeWatered(placements, farm.tillable, farm.width, farm.height);
    const protectedSet = computeProtected(placements, farm.tillable, farm.width, farm.height);
    ctx.fillStyle = 'rgba(70, 150, 230, 0.40)';
    watered.forEach((i) => ctx.fillRect((i % farm.width) * ts, Math.floor(i / farm.width) * ts, ts, ts));
    ctx.fillStyle = 'rgba(80, 200, 90, 0.22)';
    protectedSet.forEach((i) => ctx.fillRect((i % farm.width) * ts, Math.floor(i / farm.width) * ts, ts, ts));

    // Grid lines (only when zoomed in enough to be useful)
    if (view.scale * ts >= 5) {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1 / view.scale;
      ctx.beginPath();
      for (let x = 0; x <= farm.width; x++) {
        ctx.moveTo(x * ts, 0);
        ctx.lineTo(x * ts, worldH);
      }
      for (let y = 0; y <= farm.height; y++) {
        ctx.moveTo(0, y * ts);
        ctx.lineTo(worldW, y * ts);
      }
      ctx.stroke();
    }

    // House rect
    ctx.strokeStyle = 'rgba(220, 60, 60, 0.9)';
    ctx.lineWidth = 2 / view.scale;
    ctx.strokeRect(
      farm.houseRect.x * ts,
      farm.houseRect.y * ts,
      farm.houseRect.w * ts,
      farm.houseRect.h * ts,
    );

    // Placements
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${ts * 0.7}px sans-serif`;
    for (const p of placements) {
      ctx.fillStyle = ITEM_COLORS[p.kind];
      ctx.fillRect(p.x * ts + 1, p.y * ts + 1, ts - 2, ts - 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(ITEM_GLYPH[p.kind], p.x * ts + ts / 2, p.y * ts + ts / 2);
      if (p.nozzle) {
        ctx.strokeStyle = '#ffec70';
        ctx.lineWidth = 2 / view.scale;
        ctx.strokeRect(p.x * ts + 1, p.y * ts + 1, ts - 2, ts - 2);
      }
    }

    // Zone
    const z = tempZone || zone;
    if (z) {
      ctx.fillStyle = 'rgba(255, 230, 120, 0.18)';
      ctx.strokeStyle = 'rgba(255, 210, 60, 0.95)';
      ctx.lineWidth = 2 / view.scale;
      ctx.fillRect(z.x * ts, z.y * ts, z.w * ts, z.h * ts);
      ctx.strokeRect(z.x * ts, z.y * ts, z.w * ts, z.h * ts);
    }

    ctx.restore();
  }

  function screenToTile(e: React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - view.ox) / view.scale;
    const wy = (py - view.oy) / view.scale;
    return { x: Math.floor(wx / farm!.tileSize), y: Math.floor(wy / farm!.tileSize) };
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!farm) return;
    if (e.button === 2) {
      drag.current = { mode: 'pan', sx: e.clientX, sy: e.clientY };
      return;
    }
    if (e.button !== 0) return;
    const tile = screenToTile(e);
    if (zoneMode) {
      drag.current = { mode: 'zone', sx: e.clientX, sy: e.clientY, tile };
      setTempZone({ x: tile.x, y: tile.y, w: 1, h: 1 });
    } else {
      drag.current = { mode: 'paint', sx: e.clientX, sy: e.clientY, tile };
      placeAt(tile.x, tile.y);
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    const d = drag.current;
    if (!d.mode || !farm) return;
    if (d.mode === 'pan') {
      setView((v) => ({ ...v, ox: v.ox + (e.clientX - d.sx), oy: v.oy + (e.clientY - d.sy) }));
      drag.current = { ...d, sx: e.clientX, sy: e.clientY };
    } else if (d.mode === 'paint') {
      const tile = screenToTile(e);
      if (!d.tile || d.tile.x !== tile.x || d.tile.y !== tile.y) {
        placeAt(tile.x, tile.y);
        drag.current = { ...d, tile };
      }
    } else if (d.mode === 'zone' && d.tile) {
      const cur = screenToTile(e);
      const x = Math.max(0, Math.min(d.tile.x, cur.x));
      const y = Math.max(0, Math.min(d.tile.y, cur.y));
      const w = Math.min(farm.width, Math.max(d.tile.x, cur.x) + 1) - x;
      const h = Math.min(farm.height, Math.max(d.tile.y, cur.y) + 1) - y;
      setTempZone({ x, y, w, h });
    }
  }

  function onMouseUp() {
    const d = drag.current;
    if (d.mode === 'zone' && tempZone) {
      setZone(tempZone);
      setTempZone(null);
      setZoneMode(false);
    }
    drag.current = { mode: null, sx: 0, sy: 0 };
  }

  function onWheel(e: React.WheelEvent) {
    if (!farm) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView((v) => {
      const scale = Math.max(0.05, Math.min(20, v.scale * factor));
      const k = scale / v.scale;
      return { scale, ox: px - (px - v.ox) * k, oy: py - (py - v.oy) * k };
    });
  }

  // Resize canvas to its container.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm, imgReady]);

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
