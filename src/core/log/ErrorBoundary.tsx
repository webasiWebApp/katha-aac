import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { t } from '@/core/i18n/t';
import { useTheme } from '@/core/theme';
import { logError } from './errorLog';

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { color, text, space, radius } = useTheme();
  return (
    <View style={[styles.container, { padding: space.s24 }]}>
      <Text style={[text('Fac/Body'), { color: color('fac/ink'), textAlign: 'center', marginBottom: space.s24 }]}>
        {t('errors.generic')}
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: color('fac/primary'), borderRadius: radius.md, paddingHorizontal: space.s24, paddingVertical: space.s12 }]}
        onPress={onRetry}
        accessibilityRole="button"
      >
        <Text style={[text('Fac/BodyStrong'), { color: color('fac/on-primary') }]}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    logError('ErrorBoundary', 'unhandled_component_error', error);
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
  }
}

/** Install the global handler at app startup. Call after initErrorLog(). */
export function installGlobalErrorHandler(): void {
  if (typeof ErrorUtils !== 'undefined') {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError('global', isFatal ? 'fatal' : 'uncaught', error);
    });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
  },
});
