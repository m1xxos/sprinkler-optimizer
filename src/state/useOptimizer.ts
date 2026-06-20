import { useCallback, useEffect, useRef } from 'react';
import { useStore } from './store';
import type { OptimizeRequest } from '../types';
import type { WorkerOutMessage } from '../optimizer/worker';

/** Provides a `run()` that optimizes the current farm/inventory in a Web Worker. */
export function useOptimizer() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../optimizer/worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const s = useStore.getState();
      if (e.data.type === 'progress') s.setOptimizing(true, e.data.fraction);
      else if (e.data.type === 'done') s.applyResult(e.data.result);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const run = useCallback(() => {
    const s = useStore.getState();
    if (!s.farm || s.optimizing) return;
    s.setOptimizing(true, 0);
    const request: OptimizeRequest = {
      width: s.farm.width,
      height: s.farm.height,
      tillable: s.farm.tillable,
      houseRect: s.farm.houseRect,
      zone: s.zone,
      inventory: s.inventory,
      nozzles: s.nozzles,
    };
    workerRef.current?.postMessage({ type: 'run', request });
  }, []);

  return run;
}
