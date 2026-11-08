import { useCallback, useEffect, useState } from 'react';

import { logError } from '@/core/log';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

/**
 * Runs a (synchronous or async) loader and exposes loading / error / ready.
 * Errors are logged (no learner content) and shown by the caller with errors.generic.
 */
export function useLoad<T>(
  area: string,
  loader: () => T | Promise<T>,
  deps: readonly unknown[],
): LoadState<T> & { reload: () => void } {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((e: unknown) => {
        logError(area, 'load_failed', e);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload } as LoadState<T> & { reload: () => void };
}
