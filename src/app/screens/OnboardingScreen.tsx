import type { RootScreenProps } from '@/app/navigation/routes';
import { OnboardingFlow } from '@/features/onboarding/index';

export function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  return <OnboardingFlow onComplete={() => navigation.replace('AdultSignIn')} />;
}
