import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/core/i18n/t';
import { facText, space, useTheme } from '@/core/theme';

import { AppBar } from './AppBar';
import { Button } from './Button';

export interface ScreenProps {
  title: string;
  onBack?: () => void;
  testID?: string;
  children: ReactNode;
  /** Use the full width instead of the centred 600 dp column (Dashboard, Builder). */
  wide?: boolean;
  /** Content that stays below the scroll area (primary button). */
  footer?: ReactNode;
}

/** Adult screen shell: app bar, scrolling content, centred 600 dp column on tablets (9.1). */
export function Screen({ title, onBack, testID, children, wide = false, footer }: ScreenProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const centred = !wide && width >= 640;
  return (
    <SafeAreaView testID={testID} style={[styles.safe, { backgroundColor: colors.fac.bg }]}>
      <AppBar
        kind={onBack ? 'back' : 'root'}
        title={title}
        onBack={onBack}
        backLabel={t('common.back')}
        actionLabel=""
      />
      <ScrollView contentContainerStyle={[styles.content, centred && styles.centred]}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, centred && styles.centred]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** Loading and error states used by every screen that loads data (T-163). */
export function LoadGate({
  status,
  onRetry,
  children,
}: {
  status: 'loading' | 'error' | 'ready';
  onRetry: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  if (status === 'loading') {
    return (
      <View style={styles.center} accessibilityLabel={t('common.loading')} testID="load-loading">
        <ActivityIndicator size="large" color={colors.fac.primary} />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center} testID="load-error">
        <Text style={[facText.body, { color: colors.fac.ink }]}>{t('errors.generic')}</Text>
        <Button label={t('common.try_again')} onPress={onRetry} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: space.s16, gap: space.s16, flexGrow: 1 },
  centred: { width: 600, alignSelf: 'center', maxWidth: '100%' },
  footer: { padding: space.s16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.s16, padding: space.s24 },
});
