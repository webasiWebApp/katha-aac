import { View, Text, StyleSheet } from 'react-native';

export function AdultScreen() {
  return (
    <View style={styles.container} testID="screen-adult">
      <Text>Adult area (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
