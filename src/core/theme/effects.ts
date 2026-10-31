// Source: Figma effect styles. Both are DROP_SHADOW.
//   Child/Pressed glow : colour #2563EB @ 28% (0x47), offset 0,0, blur 16, spread 4
//   Fac/Card           : colour #0F1729 @ 6%  (0x0F), offset 0,1, blur 3,  spread 0
// Rendered with the React Native `boxShadow` style (supported on Android and iOS with the
// New Architecture) so the spread value is honoured. R13: flat shapes, no heavy shadows.

import type { ViewStyle } from 'react-native';

export const pressedGlow: ViewStyle = {
  boxShadow: '0px 0px 16px 4px rgba(37, 99, 235, 0.28)',
};

export const facCard: ViewStyle = {
  boxShadow: '0px 1px 3px 0px rgba(15, 23, 41, 0.06)',
};
