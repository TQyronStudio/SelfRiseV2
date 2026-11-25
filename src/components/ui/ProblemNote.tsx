/**
 * A failed action — a calm note above the tab bar and the ad banner (migration
 * E11c, plan 6.0 layer 2b; from the Design Lab's systemScreens.tsx, kolo 49).
 *
 * Instead of a modal with the raw exception text: ONE sentence about what did
 * not happen and what is still safe, "Try again" when trying again can help,
 * gone by itself after a few seconds. A new problem replaces the one on screen —
 * never two notes stacked. Errors do not apologise and are never red alarms:
 * the warm colour, an outline icon, plain words (P74).
 *
 * Texts come from the locales per action — never `error.message` (that goes to
 * the log). One host for the whole app: ProblemNoteProvider around the
 * navigator, <ProblemNoteLayer /> as layer 2b in app/_layout.tsx.
 */
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { radius, space } from '@/src/design/tokens';
import { AppText, PressableScale } from './primitives';
import { TAB_BAR_HEIGHT } from './TabBar';

/** The note stays this long, then goes by itself. */
export const PROBLEM_HOLD_MS = 6000;
/** The ad banner's room (above the tab bar on the tabs, at the bottom elsewhere). */
const BANNER_ROOM = 60;

export interface Problem {
  /** One sentence: what did not happen, and what is still safe. */
  message: string;
  /** Shown as "Try again" when trying again can help. */
  retry?: () => void;
}

interface ProblemState extends Problem {
  id: number;
}

interface ProblemNoteApi {
  showProblem: (problem: Problem) => void;
}

const ApiContext = createContext<ProblemNoteApi | null>(null);
const StateContext = createContext<{
  problem: ProblemState | null;
  gone: (id: number) => void;
} | null>(null);

export function ProblemNoteProvider({ children }: { children: ReactNode }) {
  const [problem, setProblem] = useState<ProblemState | null>(null);
  const nextId = useRef(1);
  const api = useMemo<ProblemNoteApi>(
    () => ({
      showProblem: next => setProblem({ ...next, id: nextId.current++ }),
    }),
    []
  );
  const state = useMemo(
    () => ({
      problem,
      gone: (id: number) =>
        setProblem(prev => (prev?.id === id ? null : prev)),
    }),
    [problem]
  );
  return (
    <ApiContext.Provider value={api}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ApiContext.Provider>
  );
}

/** Show a failed action's note (stable: the API never changes). */
export function useProblemNote(): ProblemNoteApi {
  const api = useContext(ApiContext);
  if (!api)
    throw new Error('useProblemNote must be used inside ProblemNoteProvider');
  return api;
}

/** Layer 2b: above the badge layer, under the onboarding and the windows. */
export function ProblemNoteLayer() {
  const state = useContext(StateContext);
  if (!state?.problem) return null;
  const { problem, gone } = state;
  return (
    <ProblemNoteView
      key={problem.id}
      problem={problem}
      onGone={() => gone(problem.id)}
    />
  );
}

function ProblemNoteView({
  problem,
  onGone,
}: {
  problem: ProblemState;
  onGone: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  // The tab bar is there only on the tabs; a pushed page (journal history,
  // statistics) has just its banner — the note sits right above it.
  const onTabs = useSegments()[0] === '(tabs)';
  const gone = useRef(onGone);
  gone.current = onGone;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(problem.message);
    const id = setTimeout(() => gone.current(), PROBLEM_HOLD_MS);
    return () => clearTimeout(id);
  }, [problem.message]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.host]}
      pointerEvents="box-none"
    >
      <Animated.View
        entering={FadeInDown.duration(260)}
        exiting={FadeOutDown.duration(200)}
        accessibilityLiveRegion="polite"
        style={[
          styles.note,
          {
            marginBottom:
              insets.bottom + (onTabs ? TAB_BAR_HEIGHT : 0) + BANNER_ROOM + space.sm,
            backgroundColor: c.surface,
            borderColor: c.border,
            boxShadow: c.shadow,
          },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={20}
          color={c.flame}
          style={styles.icon}
        />
        <AppText variant="label" style={styles.text}>
          {problem.message}
        </AppText>
        {problem.retry ? (
          <PressableScale
            onPress={() => {
              gone.current();
              problem.retry?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.tryAgain')}
            style={[styles.action, { backgroundColor: c.primarySoft }]}
          >
            <AppText variant="label" tone="primary">
              {t('common.tryAgain')}
            </AppText>
          </PressableScale>
        ) : (
          <PressableScale
            onPress={() => gone.current()}
            accessibilityRole="button"
            accessibilityLabel={t('ui.dismiss')}
            pressScale={0.9}
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={c.textMuted} />
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  note: {
    width: '100%',
    maxWidth: 560,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.lg,
    paddingRight: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    marginLeft: space.md,
    marginRight: space.sm,
  },
  action: {
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
