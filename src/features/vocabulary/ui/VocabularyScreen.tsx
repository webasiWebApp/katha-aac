import { StyleSheet, Text, View } from 'react-native';

import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { facText, space, useTheme } from '@/core/theme';
import { Chip, LoadGate, MixedText, Screen } from '@/core/ui';
import { getActiveVocabulary } from '../data/vocabularyRepo';
import { Pictogram, type PictogramName } from './Pictogram';

/** FB-06 Vocabulary: read-only list of the active version. */
export function VocabularyScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { colors } = useTheme();
  const load = useLoad('vocabulary', () => getActiveVocabulary(db), [db]);
  return (
    <Screen title={t('settings.vocabulary')} onBack={onBack} testID="screen-vocabulary">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            <Chip tone="warning" label={t('vocabulary.note')} />
            <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{load.data.label}</Text>
            {load.data.symbols.map((s) => (
              <View key={s.id} style={styles.row} accessible accessibilityLabel={`${s.label}, ${s.gloss}`}>
                <Pictogram symbol={s.pictogram as PictogramName} size={48} />
                <View style={styles.text}>
                  <MixedText text={s.label} style={facText.sinhalaStrong} color={colors.fac.ink} />
                  <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>
                    {`${s.gloss} ${t('vocabulary.draft_label')}`}
                  </Text>
                </View>
                <Chip label={s.category} />
              </View>
            ))}
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s12, minHeight: 64 },
  text: { flex: 1 },
});
