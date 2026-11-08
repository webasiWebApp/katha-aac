import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppContextProvider } from '@/core/app/AppContext';
import { DbProvider } from '@/core/db/DbProvider';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { ErrorBoundary } from '@/core/log/ErrorBoundary';
import { useAppFonts } from '@/core/theme/fonts';
import { ThemeProvider } from '@/core/theme/ThemeProvider';
import type { Db } from '@/core/types/manifest';
import { useAuth } from './auth';
import { bootApp } from './boot';
import { DevGalleryNavigator } from './navigation/DevGalleryNavigator';
import { RootNavigator } from './navigation/RootNavigator';

// Set to true to open the component gallery instead of the app (development only).
const SHOW_GALLERY = false;

function Root({ db }: { db: Db }) {
  const role = useAuth((s) => s.role);
  const touch = useAuth((s) => s.touch);
  return (
    <DbProvider db={db}>
      <AppContextProvider value={{ role, learnerId: null }}>
        {/* A root touch handler resets the 5-minute adult inactivity timer (T-092). */}
        <View style={{ flex: 1 }} onTouchStart={touch}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </View>
      </AppContextProvider>
    </DbProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts();
  const [db, setDb] = useState<Db | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (SHOW_GALLERY || !fontsLoaded) return;
    bootApp()
      .then(setDb)
      .catch((e: unknown) => {
        logError('boot', 'db_open', e);
        setFailed(true);
      });
  }, [fontsLoaded]);

  if (SHOW_GALLERY) return <DevGalleryNavigator />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            {failed || fontError ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }} testID="screen-boot-error">
                <Text>{t('errors.db_open')}</Text>
              </View>
            ) : db ? (
              <Root db={db} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="screen-boot">
                <ActivityIndicator size="large" />
              </View>
            )}
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
