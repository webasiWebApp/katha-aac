import { createContext, useContext, type ReactNode } from 'react';

import type { Role } from '@/core/types/common';

export interface AppContextValue {
  /** Signed-in adult role, or null. */
  role: Role | null;
  /** The (single) learner on this device, once created. */
  learnerId: string | null;
}

const AppContext = createContext<AppContextValue>({ role: null, learnerId: null });

export function AppContextProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
