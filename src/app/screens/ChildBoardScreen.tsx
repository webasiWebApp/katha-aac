import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/auth';
import type { RootScreenProps } from '@/app/navigation/routes';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { useTheme } from '@/core/theme';
import type { Role } from '@/core/types/common';
import { EmptyState } from '@/core/ui';
import { ROLES, SignIn, canView, getLearner, getPinService, loadPermissions } from '@/features/access/index';
import { BoardScreen } from '@/features/board/index';
import { appendEvent } from '@/features/event-log/index';
import {
  createActiveTimeTracker,
  endSession,
  flushActiveMs,
  getSession,
} from '@/features/sessions/index';

/** Child mode (CB): the board, the adult gate and the session clock. */
export function ChildBoardScreen({ navigation, route }: RootScreenProps<'ChildMode'>) {
  const db = useDb();
  const { colors } = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const sessionId = route.params.sessionId;
  const learner = useMemo(() => getLearner(db), [db]);
  const session = useMemo(() => getSession(db, sessionId), [db, sessionId]);
  const tracker = useRef(createActiveTimeTracker(Date.now()));
  const [gateOpen, setGateOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const ended = useRef(false);

  const finish = useCallback(
    (reason: 'adult_exit' | 'background_timeout') => {
      if (ended.current) return;
      ended.current = true;
      try {
        endSession(db, sessionId, reason, { activeMs: tracker.current.total(Date.now()) });
      } catch (e) {
        logError('sessions', 'end_failed', e);
      }
    },
    [db, sessionId],
  );

  // Active time: flush every 15 s; a background gap over 120 s ends the session.
  useEffect(() => {
    const flush = setInterval(() => {
      if (tracker.current.isActive()) flushActiveMs(db, sessionId, tracker.current.total(Date.now()));
    }, 15_000);
    const sub = AppState.addEventListener('change', (next) => {
      const now = Date.now();
      if (next === 'active') {
        if (tracker.current.foreground(now) === 'timeout') {
          finish('background_timeout');
          navigation.replace('AdultSignIn');
        }
      } else {
        tracker.current.background(now);
        flushActiveMs(db, sessionId, tracker.current.total(now));
      }
    });
    return () => {
      clearInterval(flush);
      sub.remove();
    };
  }, [db, sessionId, finish, navigation]);

  useEffect(() => {
    if (!gateOpen) return;
    const pins = getPinService();
    void Promise.all(ROLES.map(async (r) => ((await pins.hasPin(r)) ? r : null))).then((l) =>
      setRoles(l.filter((r): r is Role => r !== null)),
    );
  }, [gateOpen]);

  if (!learner || !session) {
    return (
      <SafeAreaView style={styles.fill} testID="screen-child-error">
        <EmptyState title={t('errors.generic')} body={t('errors.db_open')} />
      </SafeAreaView>
    );
  }

  const gatedSignIn = async (role: Role, pin: string) => {
    const result = await signIn(role, pin);
    try {
      appendEvent(db, {
        sessionId,
        learnerId: learner.id,
        type: 'gate_attempt',
        payload: { result: result === 'ok' ? 'success' : result, role },
      });
    } catch (e) {
      logError('board', 'gate_log_failed', e);
    }
    return result;
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.child.bg }]} testID="screen-child-mode">
      <BoardScreen
        sessionId={sessionId}
        learnerId={learner.id}
        hand={learner.hand}
        gridSize={learner.grid_size}
        idleReturnSeconds={learner.idle_return_seconds}
        reducedMotion={learner.reduced_motion === 1}
        onGate={() => setGateOpen(true)}
      />
      {gateOpen ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.fac.bg }]} testID="gate-signin">
          <SignIn
            roles={roles}
            signIn={gatedSignIn}
            lockedForMs={() => getPinService().lockedForMs()}
            onCancel={() => setGateOpen(false)}
            onSuccess={(role) => {
              finish('adult_exit');
              const mayReview = canView(role, 'observations:enter', loadPermissions(db));
              navigation.replace('Adult', mayReview ? { reviewSessionId: sessionId } : undefined);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { alignItems: 'center', justifyContent: 'center' },
});
