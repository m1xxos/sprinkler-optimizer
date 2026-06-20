/// <reference lib="webworker" />
import type { OptimizeRequest, OptimizeResult } from '../types';
import { optimize } from './optimize';

export interface WorkerInMessage {
  type: 'run';
  request: OptimizeRequest;
}

export type WorkerOutMessage =
  | { type: 'progress'; fraction: number }
  | { type: 'done'; result: OptimizeResult };

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  if (e.data.type !== 'run') return;
  const result = optimize(e.data.request, (fraction) => {
    const msg: WorkerOutMessage = { type: 'progress', fraction };
    self.postMessage(msg);
  });
  const done: WorkerOutMessage = { type: 'done', result };
  self.postMessage(done);
};
