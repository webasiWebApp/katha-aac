/**
 * Route names and param types for the root navigation stack.
 * Section 9.1 of the tasklist.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParams = {
  Boot: undefined;
  Onboarding: undefined;
  AdultSignIn: undefined;
  Adult: undefined;
  ChildMode: undefined;
};

export type RootScreenProps<T extends keyof RootStackParams> = NativeStackScreenProps<
  RootStackParams,
  T
>;
