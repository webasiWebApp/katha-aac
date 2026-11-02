import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import type { RootScreenProps } from '@/app/navigation/routes';
import { useAppFonts } from '@/core/theme/fonts';
import { getOrCreateDbKey, openDatabase, runMigrations } from '@/core/db';
import { initErrorLog, installGlobalErrorHandler } from '@/core/log';
import { featureRegistry } from '@/app/registry/featureRegistry';
import { t } from '@/core/i18n/t';

export function BootScreen({ navigation }: RootScreenProps<'Boot'>) {
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    if (!fontsLoaded) return;

    async function boot() {
      try {
        const key = await getOrCreateDbKey();
        const db = openDatabase('katha.db', key);
        await runMigrations(db, featureRegistry);
        initErrorLog(db, '1.0.0');
        installGlobalErrorHandler();

        // Boot rule 1: if onboarding is not complete, go to Onboarding.
        // For now, always go to Onboarding until the settings table is populated.
        const row = db.get<{ value: string }>(
          "SELECT value FROM settings WHERE key = 'onboarding_complete'",
        );
        if (row?.value === '1') {
          navigation.replace('AdultSignIn');
        } else {
          navigation.replace('Onboarding');
        }
      } catch {
        // DB open failure: show db_open error. Navigation will stay on Boot
        // and render the error message via ErrorBoundary (logError called in handler).
        // Rethrow so ErrorBoundary catches it and shows errors.generic.
        throw new Error(t('errors.db_open'));
      }
    }

    void boot();
  }, [fontsLoaded, navigation]);

  return (
    <View style={styles.container} testID="screen-boot">
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
