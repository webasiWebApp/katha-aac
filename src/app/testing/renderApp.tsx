import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppContextProvider } from '@/core/app/AppContext';
import { DbProvider } from '@/core/db/DbProvider';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import type { Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';

const METRICS = {
  frame: { x: 0, y: 0, width: 1280, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Renders a screen inside theme, database and app-context providers (test only). */
export function renderScreen(
  ui: ReactElement,
  opts: { db: Db; role?: Role | null; learnerId?: string | null },
) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider>
        <DbProvider db={opts.db}>
          <AppContextProvider value={{ role: opts.role === undefined ? 'parent' : opts.role, learnerId: opts.learnerId ?? 'L1' }}>
            {ui}
          </AppContextProvider>
        </DbProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
