/**
 * T-017 acceptance: each placeholder route renders without crashing.
 */
import React from 'react';
import { renderThemed } from '@/core/theme/testUtils';
import { OnboardingScreen } from '../OnboardingScreen';
import { AdultSignInScreen } from '../AdultSignInScreen';
import { AdultScreen } from '../AdultScreen';

test('OnboardingScreen renders', async () => {
  const { getByTestId } = await renderThemed(<OnboardingScreen />);
  expect(getByTestId('screen-onboarding')).toBeTruthy();
});

test('AdultSignInScreen renders', async () => {
  const { getByTestId } = await renderThemed(<AdultSignInScreen />);
  expect(getByTestId('screen-adult-sign-in')).toBeTruthy();
});

test('AdultScreen renders', async () => {
  const { getByTestId } = await renderThemed(<AdultScreen />);
  expect(getByTestId('screen-adult')).toBeTruthy();
});
