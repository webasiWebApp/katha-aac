import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { RootScreenProps } from '@/app/navigation/routes';
import { useDb } from '@/core/db';
import { getSetting } from '@/core/db/settings';
import { logError } from '@/core/log';

/** Boot rules 1 and 3 (rule 2 runs in bootApp): onboarding if incomplete, else sign-in. */
export function BootScreen({ navigation }: RootScreenProps<'Boot'>) {
  const db = useDb();
  useEffect(() => {
    try {
      const done = getSetting<boolean>(db, 'onboarding.complete', false);
      navigation.replace(done ? 'AdultSignIn' : 'Onboarding');
    } catch (e) {
      logError('boot', 'route_failed', e);
      navigation.replace('Onboarding');
    }
  }, [db, navigation]);

  return (
    <View style={styles.container} testID="screen-boot">
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
