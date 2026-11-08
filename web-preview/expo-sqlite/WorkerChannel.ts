// WEB PREVIEW ONLY. Copy of expo-sqlite/web/WorkerChannel.ts (expo-sqlite 58.0.15) with one change:
// synchronous calls reuse a single 1 MB SharedArrayBuffer instead of allocating a new one per
// call (which exhausted browser memory during bulk writes), and wait up to 30 s instead of a
// fixed spin count (which timed out on large transactions such as the demo data). metro.config.js swaps it
// in for web bundles only; Android uses native SQLite and never loads this file.
// Copyright 2015-present 650 Industries. All rights reserved.

import { Deferred } from 'expo-sqlite/web/Deferred';
import { serialize, deserialize } from 'expo-sqlite/web/SyncSerializer';
import {
  type SQLiteWorkerMessageType,
  type MessageTypeMap,
  type ResultType,
  type ResultTypeMap,
} from 'expo-sqlite/web/web.types';

let messageId = 0;
const deferredMap = new Map<number, Deferred>();
const PENDING = 1;
const RESOLVED = 2;

let hasWarnedSync = false;

/**
 * For worker to send result to the main thread.
 */
export function sendWorkerResult({
  id,
  result,
  error,
  syncTrait,
}: {
  id: number;
  result: ResultType | null;
  error: Error | null;
  syncTrait?: {
    lockBuffer: SharedArrayBuffer;
    resultBuffer: SharedArrayBuffer;
  };
}) {
  // Send the message as a string. An Error doesn't survive JSON, and `String(error)` keeps it non-empty.
  const errorMessage = error != null ? error.message || String(error) : null;
  if (syncTrait) {
    const { lockBuffer, resultBuffer } = syncTrait;
    const lock = new Int32Array(lockBuffer);
    let resultBytes = new TextEncoder().encode(
      errorMessage != null ? serialize({ error: errorMessage }) : serialize({ result })
    );
    if (resultBytes.length + 4 > resultBuffer.byteLength) {
      resultBytes = new TextEncoder().encode(
        serialize({
          error: `The synchronous result is ${resultBytes.length} bytes, which is more than the ${resultBuffer.byteLength - 4} bytes that synchronous calls can return on web. Use the async API for large results.`,
        })
      );
    }
    new Uint32Array(resultBuffer, 0, 1)[0] = resultBytes.length;
    new Uint8Array(resultBuffer).set(resultBytes, 4);
    Atomics.store(lock, 0, RESOLVED);
  } else {
    if (error != null) {
      self.postMessage({ id, error: errorMessage });
    } else {
      self.postMessage({ id, result });
    }
  }
}

/**
 * For main thread to handle worker messages.
 */
export function workerMessageHandler(event: MessageEvent) {
  const { id, result, error, isSync } = event.data;
  if (!isSync) {
    const deferred = deferredMap.get(id);
    if (deferred) {
      if (error) {
        deferred.reject(new Error(error));
      } else {
        deferred.resolve(result);
      }
      deferredMap.delete(id);
    }
  }
}

/**
 * For main thread to invoke worker function asynchronously.
 */
export async function invokeWorkerAsync<T extends SQLiteWorkerMessageType & keyof ResultTypeMap>(
  worker: Worker,
  type: T,
  data: MessageTypeMap[T]['data']
): Promise<ResultTypeMap[T]> {
  const id = messageId++;
  const deferred = new Deferred<ResultTypeMap[T]>();
  deferredMap.set(id, deferred);
  worker.postMessage({ type, id, data, isSync: false });
  return deferred.getPromise();
}

/**
 * For main thread to invoke worker function synchronously.
 */
let sharedSync: { lockBuffer: SharedArrayBuffer; resultBuffer: SharedArrayBuffer } | null = null;

export function invokeWorkerSync<T extends SQLiteWorkerMessageType & keyof ResultTypeMap>(
  worker: Worker,
  type: T,
  data: MessageTypeMap[T]['data']
): ResultTypeMap[T] {
  if (__DEV__ && !hasWarnedSync) {
    console.warn(
      'Using synchronous SQLite operations can cause significant performance impact. Consider using async operations instead.'
    );
    hasWarnedSync = true;
  }

  const id = messageId++;
  // KATHA WEB PREVIEW PATCH: reuse one buffer pair instead of allocating 1 MB per call.
  // Synchronous calls block the main thread, so two can never be in flight at once.
  if (!sharedSync) {
    sharedSync = { lockBuffer: new SharedArrayBuffer(4), resultBuffer: new SharedArrayBuffer(1024 * 1024) };
  }
  const { lockBuffer, resultBuffer } = sharedSync;
  const lock = new Int32Array(lockBuffer);
  const resultArray = new Uint8Array(resultBuffer);

  Atomics.store(lock, 0, PENDING);
  worker.postMessage({
    type,
    id,
    data,
    isSync: true,
    lockBuffer,
    resultBuffer,
  });

  // KATHA WEB PREVIEW PATCH: time-based limit (30 s) instead of a fixed spin count, which timed
  // out on large transactions such as loading the demonstration data.
  const started = performance.now();
  // @ts-expect-error: Remove this when TypeScript supports Atomics.pause
  const useAtomicsPause = typeof Atomics.pause === 'function';
  while (Atomics.load(lock, 0) === PENDING) {
    if (performance.now() - started > 30_000) {
      throw new Error('Sync operation timeout');
    }
    if (useAtomicsPause) {
      // @ts-expect-error: Remove this when TypeScript supports Atomics.pause
      Atomics.pause();
    }
  }

  const length = new Uint32Array(resultArray.buffer, 0, 1)[0];
  const resultCopy = new Uint8Array(length);
  resultCopy.set(new Uint8Array(resultArray.buffer, 4, length));
  const resultJson = new TextDecoder().decode(resultCopy);
  const { result, error } = deserialize<{ result: ResultTypeMap[T]; error?: string }>(resultJson);
  if (error) throw new Error(error);
  return result;
}
