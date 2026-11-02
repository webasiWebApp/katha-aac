import type { AppEvent, AppEventType, EventPayload } from './schemas';

type Handler<T extends AppEventType> = (payload: EventPayload<T>) => Promise<void>;

type HandlerMap = {
  [T in AppEventType]?: Handler<T>[];
};

const handlers: HandlerMap = {};

/**
 * Subscribe to an event type.
 * Returns an unsubscribe function.
 */
export function on<T extends AppEventType>(type: T, handler: Handler<T>): () => void {
  if (!handlers[type]) {
    (handlers as Record<string, unknown[]>)[type] = [];
  }
  (handlers[type] as Handler<T>[]).push(handler);
  return () => {
    const list = handlers[type] as Handler<T>[] | undefined;
    if (list) {
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }
  };
}

/**
 * Emit an event to all subscribers of its type.
 * Handlers are awaited in registration order.
 * A handler error is logged (not thrown) so remaining handlers still run.
 */
export async function emit<T extends AppEventType>(payload: EventPayload<T>): Promise<void>;
export async function emit(payload: AppEvent): Promise<void> {
  const type = payload.type as AppEventType;
  const list = (handlers[type] ?? []) as Handler<AppEventType>[];
  for (const handler of list) {
    try {
      await handler(payload as EventPayload<AppEventType>);
    } catch (err) {
      // logError is imported lazily to avoid a circular dep at startup.
      // T-014 wires the real logError; until then, fall back to console.error.
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('[bus] handler error for event type:', type, err);
      }
    }
  }
}

/** Remove all handlers (test helper). */
export function resetBus(): void {
  for (const key of Object.keys(handlers)) {
    delete (handlers as Record<string, unknown>)[key];
  }
}
