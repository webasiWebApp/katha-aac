import { createAuthStore, getPinService } from '@/features/access/index';

/** App-wide auth store: signed-in role, 5-minute inactivity sign-out (T-092). */
export const useAuth = createAuthStore(getPinService());
