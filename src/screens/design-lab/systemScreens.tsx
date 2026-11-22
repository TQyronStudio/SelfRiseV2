/**
 * When something goes wrong (kolo 49, lab debt L-4): an action that failed, a
 * page that does not exist, and the database that would not open.
 *
 * What today's app does, and why it changes:
 * - A failed save / delete / reorder opens ErrorModal with `error.message` — the
 *   raw text of the exception, in English, from inside the code — and a modal
 *   that has to be closed before anything else. Here a calm note slides up above
 *   the tab bar: ONE sentence about what did not happen and what is still safe,
 *   "Try again" when trying again can help, gone by itself after a few seconds.
 *   Nothing is thrown away: a composer that failed to save stays open with its text.
 *   (Validation stays where the lab already has it: at the field, in its words.)
 * - The 404 page says "Oops! This screen does not exist." with a link styled as a
 *   link. Here it is a calm page with the one way back that makes sense: today.
 * - The database screen's words are already good (errors.database.*) and stay; it
 *   gets the app's look, a "Trying again…" state and closes itself on success.
 *
 * Errors do not apologise and are never red alarms: the warm colour, an outline
 * icon, plain words (premium-design-plan.md, P74).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - ProblemNote replaces ErrorModal in HabitsScreen, GoalsScreen, GoalStatsScreen,
 *   HabitForm, GoalForm, ProgressEntryForm, TargetDateStepSelectionModal and
 *   GratitudeInput (and WarmUpErrorModal in GratitudeStreakCard): one note host in the window layer (6.0), texts per
 *   action from the locales — never `error.message` (it still goes to the log
 *   and Crashlytics).
 * - NotFound → app/+not-found.tsx ("Back to today" = router.replace('/(tabs)')).
 * - DatabaseError → DatabaseErrorScreen in app/_layout.tsx. It is drawn BEFORE the
 *   providers (no ThemeContext): colours from useColorScheme() and the tokens
 *   directly, i18n is ready at import.
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './challengeMoments';
import { useJournalT } from './journalParts';
import { useLabBack, useLabCover } from './labCover';
import { IconBadge, LabText, PressableScale, useLab } from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';

/** A failed action's note stays this long, then goes by itself. */
const PROBLEM_HOLD_MS = 6000;
/** The lab's simulated retry. */
const LAB_RETRY_MS = 1200;

export interface Problem {
  message: string;
  /** Present when trying again can help; the note then offers it. */
  retry?: () => void;
}

type SystemScreen = 'notFound' | 'database';

interface LabSystem {
  showProblem: (problem: Problem) => void;
  showScreen: (screen: SystemScreen) => void;
}

const LabSystemContext = createContext<LabSystem | null>(null);

export function LabSystemProvider({
  bottomInset,
  onHome,
  children,
}: {
  bottomInset: number;
  /** "Back to today" of the not-found page. */
  onHome: () => void;
  children: ReactNode;
}) {
  const [problem, setProblem] = useState<(Problem & { id: number }) | null>(
    null
  );
  const [screen, setScreen] = useState<SystemScreen | null>(null);
  const nextId = useRef(1);
  const api = useMemo<LabSystem>(
    () => ({
      // A new problem replaces the one on screen: never two notes stacked.
      showProblem: next => setProblem({ ...next, id: nextId.current++ }),
      showScreen: setScreen,
    }),
    []
  );
  return (
    <LabSystemContext.Provider value={api}>
      {children}
      {problem && (
        <ProblemNote
          key={problem.id}
          problem={problem}
          bottomInset={bottomInset}
          onGone={() =>
            setProblem(prev => (prev?.id === problem.id ? null : prev))
          }
        />
      )}
      {screen === 'notFound' && (
        <NotFoundConcept
          onHome={() => {
            setScreen(null);
            onHome();
          }}
        />
      )}
      {screen === 'database' && (
        <DatabaseErrorConcept onOpened={() => setScreen(null)} />
      )}
    </LabSystemContext.Provider>
  );
}

export function useLabSystem(): LabSystem {
  const ctx = useContext(LabSystemContext);
  if (!ctx)
    throw new Error('useLabSystem must be used inside LabSystemProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// A failed action — a calm note above the tab bar
// ---------------------------------------------------------------------------

function ProblemNote({
  problem,
  bottomInset,
  onGone,
}: {
  problem: Problem;
  bottomInset: number;
  onGone: () => void;
}) {
  const { c, lang } = useLab();
  const text = MOCK_COPY[lang].system;
  const gone = useRef(onGone);
  gone.current = onGone;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(problem.message);
    const id = setTimeout(() => gone.current(), PROBLEM_HOLD_MS);
    return () => clearTimeout(id);
  }, [problem.message]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.noteHost]}
      pointerEvents="box-none"
    >
      <Animated.View
        entering={FadeInDown.duration(260)}
        exiting={FadeOutDown.duration(200)}
        accessibilityLiveRegion="polite"
        style={[
          styles.note,
          {
            marginBottom: bottomInset + labSpace.sm,
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
          style={{ marginTop: 1 }}
        />
        <LabText variant="label" style={styles.noteText}>
          {problem.message}
        </LabText>
        {problem.retry ? (
          <PressableScale
            onPress={() => {
              gone.current();
              problem.retry?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={text.retry}
            style={[styles.noteAction, { backgroundColor: c.primarySoft }]}
          >
            <LabText variant="label" tone="primary">
              {text.retry}
            </LabText>
          </PressableScale>
        ) : (
          <PressableScale
            onPress={() => gone.current()}
            accessibilityRole="button"
            accessibilityLabel={text.dismiss}
            pressScale={0.9}
            style={styles.noteClose}
          >
            <Ionicons name="close" size={18} color={c.textMuted} />
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// A page that does not exist
// ---------------------------------------------------------------------------

export function NotFoundConcept({ onHome }: { onHome: () => void }) {
  const { c, lang } = useLab();
  useLabCover();
  // Back leads where the button does: there is nothing behind a missing page.
  useLabBack(onHome);
  const text = MOCK_COPY[lang].system;
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={[
        StyleSheet.absoluteFill,
        styles.page,
        { backgroundColor: c.canvas },
      ]}
    >
      <View style={styles.pageColumn}>
        <IconBadge icon="compass-outline" color={c.primary} size={64} />
        <LabText
          variant="display"
          style={[styles.centered, { marginTop: labSpace.xl }]}
        >
          {text.notFoundTitle}
        </LabText>
        <LabText
          variant="body"
          tone="muted"
          style={[styles.centered, { marginTop: labSpace.sm }]}
        >
          {text.notFoundText}
        </LabText>
        <View style={styles.pageButton}>
          <PrimaryButton label={text.notFoundButton} onPress={onHome} />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// The database would not open (before anything else can show)
// ---------------------------------------------------------------------------

export function DatabaseErrorConcept({ onOpened }: { onOpened: () => void }) {
  const { c, lang } = useLab();
  useLabCover();
  // Back does nothing here: there is no app behind this screen yet.
  useLabBack(() => undefined);
  const t = useJournalT();
  const text = MOCK_COPY[lang].system;
  const [trying, setTrying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const retry = useCallback(() => {
    if (trying) return;
    setTrying(true);
    AccessibilityInfo.announceForAccessibility(text.retrying);
    // The lab's second try works; the app would show the screen again on failure.
    timer.current = setTimeout(onOpened, LAB_RETRY_MS);
  }, [trying, onOpened, text.retrying]);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(260)}
      style={[
        StyleSheet.absoluteFill,
        styles.page,
        { backgroundColor: c.canvas },
      ]}
    >
      <View style={styles.pageColumn}>
        {/* The first thing to know: nothing is lost. */}
        <IconBadge
          icon="shield-checkmark-outline"
          color={c.successText}
          size={64}
        />
        <LabText
          variant="title"
          style={[styles.centered, { marginTop: labSpace.xl }]}
        >
          {t('errors.database.title')}
        </LabText>
        <LabText
          variant="body"
          tone="muted"
          style={[styles.centered, { marginTop: labSpace.sm }]}
        >
          {t('errors.database.message')}
        </LabText>
        <View style={styles.pageButton}>
          <PrimaryButton
            label={trying ? text.retrying : t('errors.database.retry')}
            onPress={retry}
          />
        </View>
        <LabText
          variant="caption"
          tone="faint"
          style={[styles.centered, { marginTop: labSpace.lg }]}
        >
          {t('errors.database.hint')}
        </LabText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  noteHost: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: labSpace.lg,
  },
  note: {
    width: '100%',
    maxWidth: 560,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: labSpace.lg,
    paddingRight: labSpace.sm,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.md,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    marginLeft: labSpace.md,
    marginRight: labSpace.sm,
  },
  noteAction: {
    minHeight: 36,
    paddingHorizontal: labSpace.md,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: labSpace.xl,
  },
  pageColumn: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  pageButton: {
    alignSelf: 'stretch',
    marginTop: labSpace.lg,
  },
});
