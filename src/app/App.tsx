import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/core/theme/ThemeProvider';
import { ErrorBoundary } from '@/core/log/ErrorBoundary';
import { DevGalleryNavigator } from './navigation/DevGalleryNavigator';
import { RootNavigator } from './navigation/RootNavigator';

// Set to false to run the full app boot flow in development.
const SHOW_GALLERY = __DEV__;

export default function App() {
  if (SHOW_GALLERY) {
    return <DevGalleryNavigator />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
