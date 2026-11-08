import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/auth';
import type { RootScreenProps } from '@/app/navigation/routes';
import { useTheme } from '@/core/theme';
import { ROLES, SignIn, getPinService } from '@/features/access/index';
import type { Role } from '@/core/types/common';

/** FB-01 as a route (cold start / inactivity sign-out). */
export function AdultSignInScreen({ navigation }: RootScreenProps<'AdultSignIn'>) {
  const { colors } = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const pins = getPinService();
    void Promise.all(ROLES.map(async (r) => ((await pins.hasPin(r)) ? r : null))).then((list) =>
      setRoles(list.filter((r): r is Role => r !== null)),
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fac.bg }} testID="screen-adult-sign-in">
      <SignIn
        roles={roles}
        signIn={signIn}
        onSuccess={() => navigation.replace('Adult')}
        lockedForMs={() => getPinService().lockedForMs()}
      />
    </SafeAreaView>
  );
}
