import type { ReactNode } from 'react';

import { DbProvider } from '@/core/db/DbProvider';
import type { Db } from '@/core/types/manifest';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { ErrorBoundary } from '@/core/log/ErrorBoundary';

interface Props {
  db: Db;
  children: ReactNode;
}

/**
 * Root provider tree. Wrap the app's navigation and screens with this.
 * ThemeProvider must be above ErrorBoundary so the fallback can call useTheme().
 */
export function AppProviders({ db, children }: Props) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <DbProvider db={db}>{children}</DbProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
