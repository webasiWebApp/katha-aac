import { useState } from 'react';
import { Text, View } from 'react-native';

import { useDb } from '@/core/db';
import { setSetting } from '@/core/db/settings';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, space, useTheme } from '@/core/theme';
import type { GridSize } from '@/core/types/common';
import {
  Button,
  Chip,
  ListRow,
  OfflineBadge,
  Screen,
  SegmentedControl,
  TextField,
} from '@/core/ui';
import { devicePlatformSpeak, getAudioService } from '@/features/audio/index';
import {
  ConsentBanner,
  PinEntry,
  createLearner,
  getPinService,
  saveConsent,
} from '@/features/access/index';

type Step = 1 | 2 | 3 | 4 | 5;

/** OB-1 to OB-5. Writes the guardian PIN, learner, consent and `onboarding.complete`. */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const db = useDb();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>(1);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [name, setName] = useState('Demo Learner');
  const [code, setCode] = useState('P-07');
  const [grid, setGrid] = useState<GridSize>('3x4');
  const [hand, setHand] = useState<'right' | 'left'>('right');
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [research, setResearch] = useState(false);
  const [voice, setVoice] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  const guard = (area: string, fn: () => void | Promise<void>) => {
    Promise.resolve()
      .then(fn)
      .then(() => setFailed(false))
      .catch((e: unknown) => {
        logError('onboarding', area, e);
        setFailed(true);
      });
  };

  const onPin = (pin: string) => {
    if (firstPin === null) {
      setFirstPin(pin);
      setMismatch(false);
      return;
    }
    if (pin !== firstPin) {
      setFirstPin(null);
      setMismatch(true);
      return;
    }
    guard('set_pin_failed', async () => {
      await getPinService().setPin('parent', pin);
      setStep(3);
    });
  };

  const saveLearner = () =>
    guard('create_learner_failed', () => {
      const id = createLearner(db, { displayName: name.trim(), participantCode: code.trim(), isFictional: true, gridSize: grid, hand });
      setLearnerId(id);
      setStep(4);
    });

  const saveConsentStep = () =>
    guard('save_consent_failed', () => {
      if (!learnerId) throw new Error('no_learner');
      saveConsent(db, learnerId, { guardianConsent: true, researchLogging: research }, null);
      setStep(5);
    });

  const checkDevice = () =>
    guard('device_check_failed', async () => {
      const status = await getAudioService(db).init();
      setVoice(status.found);
    });

  const playTest = () =>
    guard('test_sentence_failed', async () => {
      const svc = getAudioService(db);
      await svc.init();
      // Test sentence is spoken without a session, so it is not written to the audio log.
      await devicePlatformSpeak(svc.voiceStatus()?.voice ?? null);
    });

  const finish = () =>
    guard('finish_failed', () => {
      setSetting(db, 'onboarding.complete', true);
      onComplete();
    });

  const titleKey = ['', 'onboarding.welcome', 'onboarding.guardian_pin', 'onboarding.learner', 'onboarding.consent_title', 'onboarding.device_check'][step] as string;

  return (
    <Screen title={t(titleKey)} testID="screen-onboarding">
      {step === 1 ? (
        <View style={{ gap: space.s16 }}>
          <Text style={[facText.display, { color: colors.fac.ink }]}>Katha AAC</Text>
          <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('onboarding.welcome_body')}</Text>
          <OfflineBadge label={t('onboarding.offline')} />
          <Button label={t('onboarding.get_started')} size="L" onPress={() => setStep(2)} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: space.s16 }}>
          <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('onboarding.guardian_pin_body')}</Text>
          <Chip tone="neutral" label={firstPin === null ? t('onboarding.set_parent_pin') : t('onboarding.confirm_pin')} />
          {mismatch ? <Chip tone="warning" label={t('onboarding.pin_mismatch')} /> : null}
          <PinEntry dotsLabel={t('signin.pin_prompt')} onComplete={onPin} />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: space.s16 }}>
          <TextField label={t('onboarding.learner_name')} value={name} onChangeText={setName} />
          <TextField label={t('onboarding.participant')} value={code} onChangeText={setCode} />
          <Chip tone="warning" label={t('common.fictional_profile')} />
          <SegmentedControl
            accessibilityLabel={t('prefs.grid')}
            options={[{ key: '3x4', label: '3x4' }, { key: '4x5', label: '4x5' }, { key: '5x6', label: '5x6' }]}
            selectedKey={grid}
            onSelect={(k) => setGrid(k as GridSize)}
          />
          <SegmentedControl
            accessibilityLabel={t('prefs.hand')}
            options={[{ key: 'right', label: t('prefs.hand_right') }, { key: 'left', label: t('prefs.hand_left') }]}
            selectedKey={hand}
            onSelect={(k) => setHand(k as 'right' | 'left')}
          />
          <Button label={t('onboarding.continue')} size="L" disabled={name.trim() === '' || code.trim() === ''} onPress={saveLearner} />
        </View>
      ) : null}

      {step === 4 ? (
        <View style={{ gap: space.s16 }}>
          <ConsentBanner title={t('privacy.banner_title')} body={t('privacy.banner_body')} />
          <ListRow kind="toggle" title={t('onboarding.guardian_consent')} toggleValue={consent} onToggle={setConsent} />
          <ListRow
            kind="toggle"
            title={t('privacy.research_logging')}
            subtitle={t('privacy.research_logging_hint')}
            toggleValue={research}
            onToggle={setResearch}
          />
          <Button label={t('onboarding.continue')} size="L" disabled={!consent} onPress={saveConsentStep} />
        </View>
      ) : null}

      {step === 5 ? (
        <View style={{ gap: space.s16 }}>
          <Chip
            tone={voice ? 'success' : 'neutral'}
            label={voice === null ? t('onboarding.voice_unknown') : voice ? t('onboarding.voice_found') : t('onboarding.voice_missing')}
          />
          <Button label={t('onboarding.check_voice')} variant="secondary" onPress={checkDevice} />
          <Button label={t('onboarding.play_test')} variant="secondary" onPress={playTest} />
          <Text style={[facText.heading, { color: colors.fac.ink }]}>{t('pinning.title')}</Text>
          {['pinning.step1', 'pinning.step2', 'pinning.step3'].map((k, i) => (
            <Text key={k} style={[facText.body, { color: colors.fac.ink }]}>{`${i + 1}. ${t(k)}`}</Text>
          ))}
          <Button label={t('onboarding.finish')} size="L" onPress={finish} />
        </View>
      ) : null}

      {failed ? <Text style={[facText.body, { color: colors.fac.danger }]}>{t('errors.generic')}</Text> : null}
    </Screen>
  );
}
