import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme';

/** Word classes with a tint colour. `core` = purple core words, `folder` = neutral category folders. */
export type WordClass = 'people' | 'action' | 'describing' | 'thing' | 'core' | 'folder';

export interface ClassTintProps {
  wordClass: WordClass;
  style?: ViewStyle;
  testID?: string;
}

/**
 * 6 px word-class edge (Figma 4:13, R3 and R5). Fitzgerald-key colours appear ONLY as this thin
 * edge, never as a full-cell background. Width comes from the parent (default: fills its width).
 */
export function ClassTint({ wordClass, style, testID }: ClassTintProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { height: 6, alignSelf: 'stretch', backgroundColor: colors.classTint[wordClass] },
        style,
      ]}
    />
  );
}
