import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, radius, space, useTheme } from '@/core/theme';
import type { Actor } from '../data/observationRepo';
import { Button, MixedText } from '@/core/ui';
import {
  getForMessages,
  setBreakdown,
  setFunction,
  setIntent,
  setPrompting,
} from '../data/observationRepo';

type GroupKey = 'intent' | 'function' | 'prompting' | 'breakdown';

const GROUPS: { key: GroupKey; title: string; options: string[] }[] = [
  { key: 'intent', title: 'tag.intent', options: ['meant', 'not_meant', 'unsure'] },
  { key: 'function', title: 'tag.function', options: ['requesting', 'refusing', 'commenting', 'greeting'] },
  { key: 'prompting', title: 'tag.prompting', options: ['independent', 'gesture', 'verbal', 'model', 'physical'] },
  { key: 'breakdown', title: 'tag.breakdown', options: ['yes', 'no'] },
];

/** Bottom sheet for tagging one message (RS-1, DB-06). Every group is optional and can be cleared. */
export function TagSheet({
  messageId,
  sentence,
  onClose,
}: {
  messageId: string;
  sentence: string;
  onClose: () => void;
}) {
  const db = useDb();
  const { colors } = useTheme();
  const { role } = useAppContext();
  const read = () => {
    const map: Partial<Record<GroupKey, string>> = {};
    for (const o of getForMessages(db, [messageId])) {
      if (o.kind === 'intent' || o.kind === 'function' || o.kind === 'prompting' || o.kind === 'breakdown') {
        map[o.kind] = o.value;
      }
    }
    return map;
  };
  const [values, setValues] = useState(read);
  const [failed, setFailed] = useState(false);

  const write = (group: GroupKey, value: string | null) => {
    if (!role) return;
    const actor: Actor = role;
    try {
      if (group === 'intent') setIntent(db, actor, messageId, value as never);
      else if (group === 'function') setFunction(db, actor, messageId, value as never);
      else if (group === 'prompting') setPrompting(db, actor, messageId, value as never);
      else setBreakdown(db, actor, messageId, value === null ? null : value === 'yes');
      setValues(read());
      setFailed(false);
    } catch (e) {
      logError('observations', 'tag_failed', e);
      setFailed(true);
    }
  };

  const clearAll = () => GROUPS.forEach((g) => values[g.key] !== undefined && write(g.key, null));

  return (
    <View style={[styles.sheet, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]} testID="tag-sheet" accessibilityViewIsModal>
      <MixedText text={sentence} style={facText.heading} color={colors.fac.ink} />
      {GROUPS.map((g) => (
        <View key={g.key} style={styles.group}>
          <Text style={[facText.captionStrong, { color: colors.fac.inkMuted }]}>{t(g.title)}</Text>
          <View style={styles.row}>
            {g.options.map((o) => {
              const selected = values[g.key] === o;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="button"
                  accessibilityLabel={t(`tag.${o}`)}
                  accessibilityState={{ selected }}
                  onPress={() => write(g.key, selected ? null : o)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? colors.fac.primary : colors.fac.muted },
                  ]}
                >
                  <Text style={[facText.bodyStrong, { color: selected ? colors.fac.onPrimary : colors.fac.ink }]}>
                    {t(`tag.${o}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {failed ? <Text style={[facText.body, { color: colors.fac.danger }]}>{t('errors.generic')}</Text> : null}
      <View style={styles.row}>
        <Button label={t('common.clear_all')} variant="ghost" onPress={clearAll} />
        <Button label={t('common.done')} onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, padding: space.s16, gap: space.s16 },
  group: { gap: space.s8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s8 },
  chip: { minHeight: 48, paddingHorizontal: space.s16, borderRadius: radius.xl, justifyContent: 'center' },
});
