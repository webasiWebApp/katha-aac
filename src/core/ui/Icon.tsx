import Svg, { Path } from 'react-native-svg';

import { filledPaths, iconPaths } from './iconPaths';

export type IconName = keyof typeof iconPaths;

export const iconNames = Object.keys(iconPaths) as IconName[];

export interface IconProps {
  name: IconName;
  /** Rendered size in dp. Figma icons are drawn on a 24 px grid. */
  size?: number;
  /** Stroke colour. Pass a theme token; defaults to currentColor-less black only if omitted. */
  color: string;
  /** Icons are decorative by default. Give a label only when the icon carries meaning alone. */
  accessibilityLabel?: string;
}

/** 24 px UI icon, 2 px stroke, round caps and joins (Figma frame 3:2). */
export function Icon({ name, size = 24, color, accessibilityLabel }: IconProps) {
  const filled = filledPaths[name] ?? [];
  const labelled = accessibilityLabel !== undefined;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
    >
      {iconPaths[name].map((d, index) => (
        <Path
          key={index}
          d={d}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled.includes(index) ? color : 'none'}
        />
      ))}
    </Svg>
  );
}
