import { View, Text, StyleSheet } from 'react-native';

export function AdultSignInScreen() {
  return (
    <View style={styles.container} testID="screen-adult-sign-in">
      <Text>Sign in (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
