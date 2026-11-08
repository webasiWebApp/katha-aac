import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

import { logError } from '@/core/log';

/* eslint-disable @typescript-eslint/no-require-imports */

function attempt(code: string, fn: () => unknown): void {
  try {
    Promise.resolve(fn()).catch((e: unknown) => logError('board', code, e));
  } catch (e) {
    logError('board', code, e);
  }
}

/**
 * Child mode lock (D-17, T-078): screen kept awake, system bars hidden (immersive),
 * Android back button blocked. NOT RUN (needs device); native calls are wrapped so a missing
 * module never crashes the board.
 */
export function useChildModeLock(): void {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);

    attempt('keep_awake_failed', () =>
      (require('expo-keep-awake') as typeof import('expo-keep-awake')).activateKeepAwakeAsync('child-mode'),
    );
    if (Platform.OS === 'android') {
      attempt('immersive_failed', () =>
        (require('expo-navigation-bar') as typeof import('expo-navigation-bar')).setVisibilityAsync('hidden'),
      );
    }

    return () => {
      sub.remove();
      attempt('keep_awake_release_failed', () =>
        (require('expo-keep-awake') as typeof import('expo-keep-awake')).deactivateKeepAwake('child-mode'),
      );
      if (Platform.OS === 'android') {
        attempt('immersive_restore_failed', () =>
          (require('expo-navigation-bar') as typeof import('expo-navigation-bar')).setVisibilityAsync('visible'),
        );
      }
    };
  }, []);
}
