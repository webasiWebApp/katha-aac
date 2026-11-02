import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParams } from './routes';
import { BootScreen } from '@/app/screens/BootScreen';
import { OnboardingScreen } from '@/app/screens/OnboardingScreen';
import { AdultSignInScreen } from '@/app/screens/AdultSignInScreen';
import { AdultScreen } from '@/app/screens/AdultScreen';
import { ChildBoardScreen } from '@/app/screens/ChildBoardScreen';

const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Boot"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Boot" component={BootScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AdultSignIn" component={AdultSignInScreen} />
      <Stack.Screen name="Adult" component={AdultScreen} />
      <Stack.Screen name="ChildMode" component={ChildBoardScreen} />
    </Stack.Navigator>
  );
}
