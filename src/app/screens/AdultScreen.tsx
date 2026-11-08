import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/auth';
import type { RootScreenProps } from '@/app/navigation/routes';
import { AppContextProvider } from '@/core/app/AppContext';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, space, useTheme } from '@/core/theme';
import type { Period, Role } from '@/core/types/common';
import { BottomNav, Screen } from '@/core/ui';
import {
  LearnerProfileScreen,
  PrivacyConsentScreen,
  RolesPermissionsScreen,
  getLearner,
} from '@/features/access/index';
import { GoalEditScreen, GoalsScreen } from '@/features/goals/index';
import { ReviewSessionScreen } from '@/features/observations/index';
import { BuilderScreen, DashboardScreen, HistoryScreen, ReportScreen } from '@/features/reports/index';
import { AdultHomeScreen, StartSessionScreen, endSession, getOpenSession } from '@/features/sessions/index';
import {
  AboutScreen,
  ChildViewSettingsScreen,
  DataRetentionScreen,
  SettingsListScreen,
  VoiceAudioScreen,
} from '@/features/settings/index';
import { ShareScreen } from '@/features/share/index';
import { VocabularyScreen } from '@/features/vocabulary/index';
import { shareText } from '@/app/shareText';

type Tab = 'home' | 'child' | 'vocabulary' | 'reports' | 'settings';
interface Route {
  name: string;
  p?: { sessionId?: string; goalId?: string; role?: Role; period?: Period; sections?: string[] };
}

const TABS = [
  { key: 'home', label: 'tab.home', icon: 'home' },
  { key: 'child', label: 'tab.child', icon: 'child' },
  { key: 'vocabulary', label: 'tab.vocabulary', icon: 'book' },
  { key: 'reports', label: 'tab.reports', icon: 'chart' },
  { key: 'settings', label: 'tab.settings', icon: 'gear' },
] as const;

const ROOT: Record<Tab, string> = {
  home: 'home',
  child: 'profile',
  vocabulary: 'vocabulary',
  reports: 'dashboard',
  settings: 'settings',
};

/** Signed-in adult area: five tabs, each with its own small stack (section 9.1). */
export function AdultScreen({ navigation, route }: RootScreenProps<'Adult'>) {
  const db = useDb();
  const { colors } = useTheme();
  const role = useAuth((s) => s.role);
  const learner = getLearner(db);
  const review = route.params?.reviewSessionId;

  const [tab, setTab] = useState<Tab>('home');
  const [stacks, setStacks] = useState<Record<Tab, Route[]>>({
    home: review ? [{ name: 'home' }, { name: 'review', p: { sessionId: review } }] : [{ name: 'home' }],
    child: [{ name: 'profile' }],
    vocabulary: [{ name: 'vocabulary' }],
    reports: [{ name: 'dashboard' }],
    settings: [{ name: 'settings' }],
  });

  useEffect(() => {
    if (!role) navigation.replace('AdultSignIn');
  }, [role, navigation]);

  const stack = stacks[tab];
  const top = stack[stack.length - 1] ?? { name: ROOT[tab] };
  const push = (r: Route) => setStacks((s) => ({ ...s, [tab]: [...s[tab], r] }));
  const pop = () => setStacks((s) => ({ ...s, [tab]: s[tab].length > 1 ? s[tab].slice(0, -1) : s[tab] }));
  const reset = () => setStacks((s) => ({ ...s, [tab]: [{ name: ROOT[tab] }] }));
  const back = stack.length > 1 ? pop : undefined;

  const startChild = (sessionId: string) => navigation.replace('ChildMode', { sessionId });

  const body = ((): ReactNode => {
    if (!learner) return <Screen title={t('home.title')}><Text>{t('errors.generic')}</Text></Screen>;
    switch (top.name) {
      case 'home':
        return (
          <AdultHomeScreen
            learnerId={learner.id}
            onStart={() => push({ name: 'start' })}
            onReview={(id) => push({ name: 'review', p: { sessionId: id } })}
            onPinningHelp={() => push({ name: 'pinning' })}
            onOpenReports={() => setTab('reports')}
          />
        );
      case 'start':
        return (
          <StartSessionScreen
            learnerName={learner.display_name}
            learnerId={learner.id}
            onStarted={startChild}
            onBack={back}
          />
        );
      case 'review':
        return <ReviewSessionScreen sessionId={top.p?.sessionId ?? ''} onBack={back} onDone={reset} />;
      case 'pinning':
        return <PinningHelp onBack={back} />;
      case 'profile':
        return <LearnerProfileScreen onBack={back} onOpenVoice={() => { setTab('settings'); }} onOpenGoals={() => push({ name: 'goals' })} />;
      case 'goals':
        return <GoalsScreen learnerId={learner.id} onBack={back} onAdd={() => push({ name: 'goalEdit' })} onEdit={(id) => push({ name: 'goalEdit', p: { goalId: id } })} />;
      case 'goalEdit':
        return <GoalEditScreen learnerId={learner.id} goalId={top.p?.goalId} onBack={back} onDone={pop} />;
      case 'vocabulary':
        return <VocabularyScreen onBack={back} />;
      case 'dashboard':
        return <DashboardScreen onOpenReport={(r) => push({ name: 'report', p: { role: r } })} onBuild={() => push({ name: 'builder' })} />;
      case 'builder':
        return <BuilderScreen onBack={back} onOpen={(r, sections) => push({ name: 'report', p: { role: r, sections } })} />;
      case 'report':
        return (
          <ReportScreen
            role={top.p?.role ?? 'parent'}
            enabledSections={top.p?.sections}
            onBack={back}
            onShare={(r, period) => push({ name: 'share', p: { role: r, period, sections: top.p?.sections } })}
            onHistory={() => push({ name: 'history' })}
          />
        );
      case 'history':
        return <HistoryScreen onBack={back} />;
      case 'share':
        return top.p?.role && top.p.period ? (
          <ShareScreen role={top.p.role} period={top.p.period} enabledSections={top.p.sections} onBack={back} />
        ) : null;
      case 'settings':
        return (
          <SettingsListScreen
            onOpen={(r) =>
              push({ name: r === 'learner' ? 'profile' : r === 'roles' ? 'roles' : r === 'privacy' ? 'privacy' : r === 'childView' ? 'childView' : r })
            }
          />
        );
      case 'childView':
        return <ChildViewSettingsScreen onBack={back} />;
      case 'voice':
        return <VoiceAudioScreen onBack={back} />;
      case 'roles':
        return <RolesPermissionsScreen onBack={back} />;
      case 'privacy':
        return <PrivacyConsentScreen onBack={back} />;
      case 'data':
        return <DataRetentionScreen onBack={back} />;
      case 'about':
        return (
          <AboutScreen
            onBack={back}
            onExportLog={(text) => void shareText('katha-error-log.txt', text).catch((e: unknown) => logError('settings', 'export_log_failed', e))}
          />
        );
      case 'vocabularyList':
        return <VocabularyScreen onBack={back} />;
      default:
        return null;
    }
  })();

  // A child session left open (should not happen) is closed when the adult area opens.
  useEffect(() => {
    const open = getOpenSession(db);
    if (open) endSession(db, open.id, 'app_restart');
  }, [db]);

  return (
    <AppContextProvider value={{ role, learnerId: learner?.id ?? null }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.fac.bg }} testID="screen-adult">
        <View style={{ flex: 1 }}>{body}</View>
        <BottomNav
          items={TABS.map((x) => ({ key: x.key, label: t(x.label), icon: x.icon }))}
          activeKey={tab}
          onSelect={(k) => setTab(k as Tab)}
        />
      </SafeAreaView>
    </AppContextProvider>
  );
}

function PinningHelp({ onBack }: { onBack?: () => void }) {
  const { colors } = useTheme();
  return (
    <Screen title={t('pinning.title')} onBack={onBack} testID="screen-pinning-help">
      <View style={{ gap: space.s12 }}>
        {['pinning.step1', 'pinning.step2', 'pinning.step3'].map((k, i) => (
          <Text key={k} style={[facText.body, { color: colors.fac.ink }]}>{`${i + 1}. ${t(k)}`}</Text>
        ))}
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{t('pinning.note')}</Text>
      </View>
    </Screen>
  );
}
