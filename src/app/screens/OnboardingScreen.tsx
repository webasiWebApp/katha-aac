import { View, Text, StyleSheet } from 'react-native';

export function OnboardingScreen() {
  return (
    <View style={styles.container} testID="screen-onboarding">
      <Text>Onboarding (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
