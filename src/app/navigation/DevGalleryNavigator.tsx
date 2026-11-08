import { NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChartsScreen } from '@/app/dev/screens/ChartsScreen';
import { ChildGridScreen } from '@/app/dev/screens/ChildGridScreen';
import { ChildMessageScreen } from '@/app/dev/screens/ChildMessageScreen';
import { FacilitatorScreen } from '@/app/dev/screens/FacilitatorScreen';
import { TokensScreen } from '@/app/dev/screens/TokensScreen';
import { facText, fontFamily, ThemeProvider, useTheme, type ColorMode } from '@/core/theme';
import { ListRow, SegmentedControl } from '@/core/ui';

type GalleryRoutes = {
  Index: undefined;
  ChildBoard: undefined;
  Tokens: undefined;
  ChildGrid: undefined;
  ChildMessage: undefined;
  Facilitator: undefined;
  Charts: undefined;
};

const Stack = createNativeStackNavigator<GalleryRoutes>();

const SCREENS: { name: Exclude<keyof GalleryRoutes, 'Index'>; title: string; subtitle: string }[] =
  [
    {
      name: 'ChildBoard',
      title: '▶ Child board (C-02)',
      subtitle: 'Full child-facing screen: grid, core keys, message bar',
    },
    {
      name: 'Tokens',
      title: 'Tokens, icons, pictograms',
      subtitle: 'Colours, text styles, 55 icons, 45 placeholder pictograms',
    },
    {
      name: 'ChildGrid',
      title: 'Child · grid',
      subtitle: 'ClassTint, SymbolCell, StripCell, PredictionStrip',
    },
    {
      name: 'ChildMessage',
      title: 'Child · message and keys',
      subtitle: 'MessageBar, ChildButton, CoreKey(Row), AdultGate, ...',
    },
    {
      name: 'Facilitator',
      title: 'Facilitator',
      subtitle: 'Button, AppBar, BottomNav, SuggestionCard, ...',
    },
    { name: 'Charts', title: 'Charts', subtitle: 'LineChart, BarChart, Heatmap (sample data)' },
  ];

const MODES: { key: ColorMode; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'highContrast', label: 'High contrast' },
];

interface IndexProps {
  mode: ColorMode;
  onMode: (m: ColorMode) => void;
  reducedMotion: boolean;
  onReducedMotion: (v: boolean) => void;
  navigate: (name: Exclude<keyof GalleryRoutes, 'Index'>) => void;
}

function IndexScreen({ mode, onMode, reducedMotion, onReducedMotion, navigate }: IndexProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.fac.bg }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>
        Dev-only gallery. Every component is shown in every state. Sinhala labels and sample data
        are placeholders (verify with SLT).
      </Text>
      <SegmentedControl
        options={MODES}
        selectedKey={mode}
        onSelect={(key) => onMode(key as ColorMode)}
        accessibilityLabel="Colour mode"
      />
      <ListRow
        kind="toggle"
        title="Reduced motion"
        subtitle="Hides the speaking waveform and highlight"
        icon="pause"
        toggleValue={reducedMotion}
        onToggle={onReducedMotion}
      />
      <View style={{ gap: 1 }}>
        {SCREENS.map((s) => (
          <ListRow
            key={s.name}
            kind="navigation"
            title={s.title}
            subtitle={s.subtitle}
            icon="grid"
            onPress={() => navigate(s.name)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * Dev-only component gallery (React Navigation native stack). Rendered from App.tsx when __DEV__
 * is true so every component and state can be checked on an emulator or device.
 */
export function DevGalleryNavigator() {
  const [mode, setMode] = useState<ColorMode>('light');
  const [reducedMotion, setReducedMotion] = useState(false);
  return (
    <SafeAreaProvider>
      <ThemeProvider mode={mode} reducedMotion={reducedMotion}>
        <GalleryContainer
          mode={mode}
          setMode={setMode}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function GalleryContainer(props: {
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  const navTheme: NavTheme = {
    dark: props.mode === 'dark',
    colors: {
      primary: colors.fac.primary,
      background: colors.fac.bg,
      card: colors.fac.surface,
      text: colors.fac.ink,
      border: colors.fac.border,
      notification: colors.fac.primary,
    },
    fonts: {
      regular: { fontFamily: fontFamily.latinRegular, fontWeight: '400' },
      medium: { fontFamily: fontFamily.latinSemiBold, fontWeight: '600' },
      bold: { fontFamily: fontFamily.latinBold, fontWeight: '700' },
      heavy: { fontFamily: fontFamily.latinBold, fontWeight: '700' },
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerTitleStyle: { fontFamily: fontFamily.latinSemiBold } }}
      >
        <Stack.Screen name="Index" options={{ title: 'Katha AAC · components' }}>
          {({ navigation }) => (
            <IndexScreen
              mode={props.mode}
              onMode={props.setMode}
              reducedMotion={props.reducedMotion}
              onReducedMotion={props.setReducedMotion}
              navigate={(name) => navigation.navigate(name)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Tokens"
          component={TokensScreen}
          options={{ title: 'Tokens, icons, pictograms' }}
        />
        <Stack.Screen
          name="ChildGrid"
          component={ChildGridScreen}
          options={{ title: 'Child · grid' }}
        />
        <Stack.Screen
          name="ChildMessage"
          component={ChildMessageScreen}
          options={{ title: 'Child · message and keys' }}
        />
        <Stack.Screen
          name="Facilitator"
          component={FacilitatorScreen}
          options={{ title: 'Facilitator' }}
        />
        <Stack.Screen name="Charts" component={ChartsScreen} options={{ title: 'Charts' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
