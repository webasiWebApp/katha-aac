import { StyleSheet, Text, View } from 'react-native';

import { childText, facText, useTheme, type ColorTokens } from '@/core/theme';
import { Icon, iconNames } from '@/core/ui';
import { Pictogram, pictogramNames } from '@/features/vocabulary';

import { GalleryPage, Labeled, Showcase } from '../GalleryLayout';

function Swatches({ title, tokens }: { title: string; tokens: Record<string, string> }) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[facText.captionStrong, { color: colors.fac.inkMuted }]}>{title}</Text>
      <View style={styles.swatchRow}>
        {Object.entries(tokens).map(([name, value]) => (
          <View key={name} style={styles.swatchItem}>
            <View
              style={[styles.swatch, { backgroundColor: value, borderColor: colors.fac.border }]}
            />
            <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{name}</Text>
            <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const group = <K extends keyof ColorTokens>(c: ColorTokens, key: K) =>
  c[key] as unknown as Record<string, string>;

export function TokensScreen() {
  const { colors, mode } = useTheme();
  return (
    <GalleryPage>
      <Showcase
        title="Colour tokens"
        node="1:3"
        note={`Active mode: ${mode}. Switch mode on the index screen.`}
      >
        <View style={styles.col}>
          <Swatches title="child" tokens={group(colors, 'child')} />
          <Swatches title="classTint (6 px edge only)" tokens={group(colors, 'classTint')} />
          <Swatches title="fac" tokens={group(colors, 'fac')} />
          <Swatches title="chart" tokens={group(colors, 'chart')} />
          <Swatches title="adult" tokens={group(colors, 'adult')} />
          <Swatches title="note" tokens={group(colors, 'note')} />
        </View>
      </Showcase>

      <Showcase
        title="Text styles"
        node="4:919"
        note="Sinhala set in Noto Sans Sinhala (Figma uses Yaldevi as a stand-in)."
      >
        <View style={styles.col}>
          {Object.entries(childText).map(([name, style]) => (
            <Text key={name} style={[style, { color: colors.child.ink }]}>
              Child/{name} · මට වතුර ඕනේ · කිරිබත් · නවත්තන්න · ගුරුතුමිය
            </Text>
          ))}
          <Text style={[facText.sinhalaBody, { color: colors.fac.ink }]}>
            Fac/sinhalaBody · මට වතුර ඕනේ
          </Text>
          <Text style={[facText.sinhalaStrong, { color: colors.fac.ink }]}>
            Fac/sinhalaStrong · මට වතුර ඕනේ
          </Text>
          {(
            [
              'display',
              'title',
              'heading',
              'body',
              'bodyStrong',
              'caption',
              'captionStrong',
              'overline',
              'stat',
            ] as const
          ).map((name) => (
            <Text key={name} style={[facText[name], { color: colors.fac.ink }]}>
              Fac/{name} · Start child mode · 12 messages today
            </Text>
          ))}
        </View>
      </Showcase>

      <Showcase title="UI icons (55)" node="3:2" note="24 px grid, 2 px stroke.">
        {iconNames.map((name) => (
          <Labeled key={name} caption={name}>
            <Icon name={name} color={colors.fac.ink} />
          </Labeled>
        ))}
      </Showcase>

      <Showcase
        title="Pictograms (45) · PLACEHOLDERS"
        node="3:230"
        note="Placeholder ARASAAC-style artwork from the Figma file; not final. Every Sinhala label: verify with SLT."
      >
        {pictogramNames.map((name) => (
          <Labeled key={name} caption={name}>
            <Pictogram symbol={name} size={64} />
          </Labeled>
        ))}
      </Showcase>
    </GalleryPage>
  );
}

const styles = StyleSheet.create({
  col: { gap: 12 },
  group: { gap: 6 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchItem: { width: 96, gap: 2 },
  swatch: { height: 28, borderRadius: 6, borderWidth: 1 },
});
