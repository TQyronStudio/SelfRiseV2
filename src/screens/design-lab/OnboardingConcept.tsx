/**
 * Onboarding concept for the Design Lab (premium-design-plan.md, F1, kolo 30).
 *
 * THE MEASURE (Petr): new users must WANT to click through it. Built on what the
 * psychology actually supports (plan R-27), not on popular myths:
 * - The whole flow is one story: a sunrise, picking up from the launch intro's night.
 *   Every tap does something you can see; the sun moves the moment a tile is chosen.
 * - "Your first day": the first slot is already earned on "Let's go" (endowed
 *   progress), the others fill with the user's OWN habit, goal, gratitude and tick.
 * - Skip leaves THIS step, not the whole flow: nobody loses the rest for not
 *   wanting a goal today.
 * - Gratitude: the one action anybody can finish right now, so everyone leaves
 *   with a real win, even if their habit has to wait until tonight.
 * - The ending is the peak, because the end is what people remember (peak-end):
 *   their habit, goal and own words, every trophy at once. Reminders come last,
 *   when motivation is highest.
 * Deliberately not here: invented user counts, countdowns, guilt for skipping, and
 * any question whose answer the app could not use (a "when" step was built and
 * removed: nothing kept it, plan R-27). Reminders use the real wording for the same
 * reason: they never name a habit, so the question must not either.
 *
 * The shortest path: Let's go → tile → Create → tile → Create → a few words → tick →
 * Let's do this → reminders. Nothing but the gratitude needs typing; a preset
 * is a starting point, never a lock.
 *
 * Kept from today's flow: no RN <Modal> (rule 1), no goal date, the honest "later"
 * ending, the check happens on the real habit in the real list.
 *
 * Motion runs on the native driver (lesson 46). White on the sky is at least
 * 5.2:1 on the brightest stage (computed). The sun can never sit behind text, by
 * layout: the body ends above the footer, the sun only rises inside the footer's
 * band, behind the white button; quiet links stand on the dark hill.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces OnboardingPreferencesModal + WelcomeScreen + FirstHabitScreen +
 *   FirstGoalScreen + FirstCheckCard + DayOneCelebration. Tutorial.md's rules stay,
 *   except rule 3, which R-27 changes: trophies wait for the ending. That needs the
 *   gate rewritten and the guide updated first; two modals must still never meet.
 * - Skipping a step needs a new meaning of `onb_skip` and a flow that survives a
 *   missing habit (no tick step); the storage flags keep their meaning.
 * - The funnel keeps its events: onb_language / onb_theme fire with the device
 *   defaults, onb_notifications moves to the end, the gratitude step is a new
 *   event (firstDayEvents.ts whitelist + analytics guide).
 * - The gratitude goes through the real createGratitude, with its debt gate; a new
 *   user has streak 0, so no debt can exist.
 * - The OS notification prompt must open only when this view is the only thing on
 *   screen (startup order, technical-guides:Startup-Orchestrator.md).
 * - The sky is its own world in both themes; cards after onboarding follow the theme.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { XP_REWARDS } from '@/src/constants/gamification';
import { HABIT_PRESETS } from '@/src/constants/habitPresets';
import { HABIT_ICON_MAP, IoniconName } from '@/src/constants/habitIcons';
import {
  impact,
  ImpactFeedbackStyle,
  selection,
} from '@/src/services/hapticsService';
import {
  isGoalDraftComplete,
  parseGoalTarget,
} from '@/src/components/onboarding/goalDraft';
import {
  askCopyKeys,
  endingCopyKeys,
  quotedHabitName,
  ScreenThreeEnding,
} from '@/src/components/onboarding/firstCheckCopy';
import { getXPProgress } from '@/src/services/levelCalculation';
import {
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace, SPLASH_ICON_SIZE } from './labTokens';
import { LabLang, MOCK_COPY } from './mockCopy';
import { LabHabit, useLabToday } from './habitsMock';
import { useLabJournal } from './journalMock';
import { GoalCategoryKey, CATEGORY_LOOK, useLabGoals } from './goalsMock';
import { COLORS, DayToggle, ICONS, Swatch } from './HabitComposerConcept';
import { IDEAS, suggestQuick } from './GoalComposerConcept';
import { useJournalT, useKeyboardLift } from './journalParts';
import { StreakFlame } from './StreakFlame';
import { ThemePref } from './SettingsConcept';
import { useLabXpAward } from './xpFlight';

const splashIcon = require('../../../assets/images/splash-icon.png');

const NIGHT_INK = '#12123A';
const HILL = '#080618';
const WHITE_MUTED = 'rgba(255, 255, 255, 0.72)';
const GLASS = 'rgba(255, 255, 255, 0.09)';
const GLASS_LINE = 'rgba(255, 255, 255, 0.16)';

/** Top → bottom of the sky per step. White text checked on each (kolo 30). */
const SKY: readonly (readonly [string, string])[] = [
  ['#07051A', '#0F0B2E'], // night — the splash colour
  ['#0B0A2A', '#2A1B52'], // first light
  ['#12123A', '#4A2560'], // dawn
  ['#171845', '#6E3560'], // sunrise
  ['#1E2A5C', '#8A4A4A'], // day
];
/**
 * How far the sun's top is above the hill, per step. Capped at FOOTER_BAND: above
 * that line text may be, and white on the sun is only 1.7:1.
 */
const SUN_RISE = [-6, 20, 34, 48, 60];
/** One tap on a tile already moves it: the next step's light comes closer. */
const SUN_NUDGE = 8;
/** Hill height above the safe area: tall enough for the links standing on it. */
const HILL_TOP = 58;
/** Space kept above the hill inside every footer — where the sun comes up. */
const FOOTER_BAND = 60;

/** What the user actually did. Null = that step was skipped. */
export interface OnboardingResult {
  habit: LabHabit | null;
  goal: { title: string; icon: string; color: string } | null;
  gratitude: string | null;
}

const EMPTY_RESULT: OnboardingResult = {
  habit: null,
  goal: null,
  gratitude: null,
};

// ---------------------------------------------------------------------------
// The sky
// ---------------------------------------------------------------------------

function SkyLayer({ stage, index }: { stage: number; index: number }) {
  const opacity = useRef(new RNAnimated.Value(stage >= index ? 1 : 0)).current;
  useEffect(() => {
    RNAnimated.timing(opacity, {
      toValue: stage >= index ? 1 : 0,
      duration: 900,
      easing: RNEasing.inOut(RNEasing.quad),
      useNativeDriver: true,
    }).start();
  }, [stage, index, opacity]);
  const colors = SKY[index]!;
  return (
    <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
    </RNAnimated.View>
  );
}

/** Deterministic, so the stars do not jump when the screen re-renders. */
const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: ((i * 37 + 11) % 97) / 100,
  y: ((i * 61 + 7) % 62) / 100,
  size: 1.5 + (i % 3) * 0.7,
}));

export function Sky({
  stage,
  nudged = false,
}: {
  stage: number;
  nudged?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const hillHeight = HILL_TOP + insets.bottom;
  const target = SUN_RISE[stage]! + (nudged ? SUN_NUDGE : 0);
  const rise = useRef(new RNAnimated.Value(target)).current;
  const stars = useRef(new RNAnimated.Value(stage === 0 ? 1 : 0.6)).current;

  useEffect(() => {
    if (reducedMotion) {
      rise.setValue(target);
      return;
    }
    RNAnimated.spring(rise, {
      toValue: target,
      damping: 20,
      stiffness: 60,
      useNativeDriver: true,
    }).start();
  }, [target, rise, reducedMotion]);
  useEffect(() => {
    RNAnimated.timing(stars, {
      toValue: Math.max(0, 1 - stage * 0.34),
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [stage, stars]);

  const translateY = useMemo(() => RNAnimated.multiply(rise, -1), [rise]);
  const sun = 190;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={SKY[0]!} style={StyleSheet.absoluteFill} />
      {SKY.map((_, i) =>
        i === 0 ? null : <SkyLayer key={i} stage={stage} index={i} />
      )}
      <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: stars }]}>
        {STARS.map((star, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: star.x * width,
                top: star.y * height,
                width: star.size,
                height: star.size,
                borderRadius: star.size,
              },
            ]}
          />
        ))}
      </RNAnimated.View>
      <RNAnimated.View
        style={[
          styles.sun,
          {
            width: sun,
            height: sun,
            borderRadius: sun / 2,
            bottom: hillHeight - sun,
            left: (width - sun) / 2,
            transform: [{ translateY }],
          },
        ]}
      />
      {/* The hill: the sun comes up behind it, buttons always stand on the dark. */}
      <View
        style={[
          styles.hill,
          {
            height: hillHeight,
            width: width * 1.5,
            left: -width * 0.25,
            borderTopLeftRadius: width * 0.75,
            borderTopRightRadius: width * 0.75,
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function SkyButton({
  label,
  enabled = true,
  icon,
  onPress,
}: {
  label: string;
  enabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <PressableScale
      haptic={null}
      accessibilityLabel={label}
      accessibilityState={{ selected: enabled }}
      {...(enabled
        ? {
            onPress: () => {
              impact(ImpactFeedbackStyle.Medium);
              onPress();
            },
          }
        : null)}
      style={[styles.cta, !enabled && styles.ctaOff]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={NIGHT_INK}
          style={{ marginRight: labSpace.sm }}
        />
      )}
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          typeStyle('bodyStrong', NIGHT_INK),
          { fontFamily: labFonts.bold },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function StepIn({ children }: { children: React.ReactNode }) {
  const p = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(p, {
      toValue: 1,
      duration: 380,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [p]);
  const translateY = useMemo(
    () => p.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
    [p]
  );
  return (
    <RNAnimated.View style={{ opacity: p, transform: [{ translateY }] }}>
      {children}
    </RNAnimated.View>
  );
}

interface DayState {
  habit: { icon: string; color: string } | null;
  goal: { icon: string; color: string } | null;
  gratitude: boolean;
  checked: boolean;
}

/**
 * "Your first day": the start is already earned, the rest fill with the user's OWN
 * habit, goal, gratitude and tick. Honest about what is left, worth finishing.
 */
function DaySlots({ day, current }: { day: DayState; current: 1 | 2 | 3 | 4 }) {
  const { lang } = useLab();
  const t = useJournalT();
  const o = MOCK_COPY[lang].onboarding;
  const slots = [
    {
      label: o.slotStart,
      filled: { icon: 'sunny', color: '#E8A020' },
      fallback: 'sunny' as const,
    },
    { label: o.slotHabit, filled: day.habit, fallback: 'repeat' as const },
    { label: o.slotGoal, filled: day.goal, fallback: 'flag' as const },
    {
      label: o.slotGratitude,
      filled: day.gratitude ? { icon: 'heart', color: '#E0558E' } : null,
      fallback: 'heart' as const,
    },
    {
      label: o.slotCheck,
      filled: day.checked ? { icon: 'checkmark', color: '#1E9E5A' } : null,
      fallback: 'checkmark' as const,
    },
  ];
  return (
    <View
      style={styles.slots}
      accessibilityRole="progressbar"
      accessibilityLabel={t('onboarding.progressA11y', {
        current: current + 1,
        total: slots.length,
      })}
    >
      {slots.map((slot, i) => (
        <View key={slot.label} style={styles.slot}>
          <SlotMark
            icon={slot.filled?.icon ?? slot.fallback}
            color={slot.filled?.color ?? null}
            active={i === current}
            arrive={i === current - 1}
          />
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={[
              typeStyle(
                'caption',
                slot.filled || i === current ? '#FFFFFF' : WHITE_MUTED
              ),
              { fontSize: 10, marginTop: 4 },
            ]}
          >
            {slot.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SlotMark({
  icon,
  color,
  active,
  arrive,
}: {
  icon: string;
  color: string | null;
  active: boolean;
  /** Filled by the step just finished: it lands as this screen appears. */
  arrive: boolean;
}) {
  const landing = arrive && color !== null;
  const pop = useRef(new RNAnimated.Value(landing ? 0.4 : 1)).current;
  useEffect(() => {
    if (!landing) return;
    RNAnimated.spring(pop, {
      toValue: 1,
      damping: 9,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [landing, pop]);
  return (
    <RNAnimated.View
      style={[
        styles.slotMark,
        color
          ? { backgroundColor: color, borderColor: color }
          : active
            ? { borderColor: '#FFFFFF' }
            : { borderColor: GLASS_LINE, borderStyle: 'dashed' },
        { transform: [{ scale: pop }] },
      ]}
    >
      <Ionicons
        name={icon as IoniconName}
        size={16}
        color={color || active ? '#FFFFFF' : WHITE_MUTED}
      />
    </RNAnimated.View>
  );
}

function Tile({
  label,
  detail,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  icon: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      haptic={null}
      pressScale={0.95}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        impact(ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.tile, selected && styles.tileOn]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${color}33` }]}>
        <Ionicons name={icon as IoniconName} size={20} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: labSpace.sm }}>
        <Text
          maxFontSizeMultiplier={1.3}
          numberOfLines={2}
          style={[
            typeStyle('label', selected ? NIGHT_INK : '#FFFFFF'),
            { fontFamily: labFonts.semibold },
          ]}
        >
          {label}
        </Text>
        {detail && (
          <Text
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            style={[
              typeStyle('caption', selected ? NIGHT_INK : WHITE_MUTED),
              { fontSize: 11 },
            ]}
          >
            {detail}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const RevealContext = createContext<(node: TextInput | null) => void>(
  () => undefined
);

function SkyInput(props: React.ComponentProps<typeof TextInput>) {
  const reveal = useContext(RevealContext);
  const ref = useRef<TextInput>(null);
  return (
    <TextInput
      ref={ref}
      onFocus={() => reveal(ref.current)}
      placeholderTextColor="rgba(255, 255, 255, 0.5)"
      selectionColor="#F6C350"
      maxFontSizeMultiplier={1.4}
      {...props}
      style={[typeStyle('bodyStrong', '#FFFFFF'), styles.input, props.style]}
    />
  );
}

/** The frame of the two tasks: slots + Skip, a scrollable body, the button on the hill. */
function TaskFrame({
  title,
  subtitle,
  day,
  current,
  cta,
  ctaEnabled,
  onCta,
  onSkip,
  children,
}: {
  title: string;
  subtitle: string;
  day: DayState;
  current: 1 | 2 | 3;
  cta: string;
  ctaEnabled: boolean;
  onCta: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  const t = useJournalT();
  const insets = useSafeAreaInsets();
  const rootRef = useRef<View>(null);
  const { lift, keyboardTop } = useKeyboardLift(rootRef, insets.bottom);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const footerHeight = useRef(0);
  // The field being typed in stays above the button riding on the keyboard.
  const reveal = (node: TextInput | null) => {
    setTimeout(() => {
      const top = keyboardTop.current;
      if (top === null || !node) return;
      node.measureInWindow((_x, y, _w, h) => {
        const limit =
          top - (footerHeight.current - insets.bottom) - labSpace.md;
        if (y + h > limit) {
          scrollRef.current?.scrollTo({
            y: scrollY.current + (y + h - limit),
            animated: true,
          });
        }
      });
    }, 320);
  };
  return (
    <View ref={rootRef} style={{ flex: 1 }} collapsable={false}>
      <View style={[styles.frameTop, { paddingTop: insets.top + labSpace.sm }]}>
        <View style={styles.skipRow}>
          <Text
            maxFontSizeMultiplier={1.2}
            style={[typeStyle('overline', WHITE_MUTED), { flex: 1 }]}
          >
            {MOCK_COPY[useLab().lang].onboarding.day}
          </Text>
          <PressableScale
            onPress={onSkip}
            accessibilityLabel={t('onboarding.skip')}
            style={styles.skip}
          >
            <Text style={typeStyle('label', WHITE_MUTED)}>
              {t('onboarding.skip')}
            </Text>
          </PressableScale>
        </View>
        <DaySlots day={day} current={current} />
      </View>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={[styles.column, { paddingBottom: labSpace.xxl }]}
      >
        <RevealContext.Provider value={reveal}>
          <StepIn>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('display', '#FFFFFF'),
                { fontSize: 30, lineHeight: 36 },
              ]}
            >
              {title}
            </Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('body', WHITE_MUTED),
                { marginTop: labSpace.xs },
              ]}
            >
              {subtitle}
            </Text>
            {children}
          </StepIn>
        </RevealContext.Provider>
      </ScrollView>
      <LiftedFooter
        lift={lift}
        bottom={insets.bottom}
        onHeight={height => {
          footerHeight.current = height;
        }}
      >
        <SkyButton label={cta} enabled={ctaEnabled} onPress={onCta} />
      </LiftedFooter>
    </View>
  );
}

function LiftedFooter({
  lift,
  bottom,
  onHeight,
  children,
}: {
  lift: ReturnType<typeof useKeyboardLift>['lift'];
  bottom: number;
  onHeight: (height: number) => void;
  children: React.ReactNode;
}) {
  // Rides on top of the keyboard, so the button never disappears (lesson 43).
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));
  return (
    <Animated.View
      onLayout={e => onHeight(e.nativeEvent.layout.height)}
      style={[styles.footer, { paddingBottom: bottom + labSpace.md }, style]}
    >
      <View style={styles.footerColumn}>{children}</View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// The flow: welcome → habit → goal → gratitude (then the real list, then the ending)
// ---------------------------------------------------------------------------

type Step = 'welcome' | 'habit' | 'goal' | 'gratitude';

export function OnboardingConcept({
  themePref,
  onThemePref,
  onLang,
  onReady,
}: {
  themePref: ThemePref;
  onThemePref: (pref: ThemePref) => void;
  onLang: (lang: LabLang) => void;
  /** All steps taken or skipped: on to the real list (or straight to the ending). */
  onReady: (result: OnboardingResult) => void;
}) {
  const { c, lang } = useLab();
  const { create } = useLabGoals();
  const journal = useLabJournal();
  const [step, setStep] = useState<Step>('welcome');
  const [result, setResult] = useState<OnboardingResult>(EMPTY_RESULT);
  const [nudged, setNudged] = useState(false);

  const day = dayOf(result, c, false);
  const stage = { welcome: 0, habit: 1, goal: 2, gratitude: 3 }[step];
  const go = (next: Step) => {
    setNudged(false);
    setStep(next);
  };

  return (
    <View style={styles.takeover} accessibilityViewIsModal>
      <Sky stage={stage} nudged={nudged} />
      {step === 'welcome' && (
        <Welcome
          themePref={themePref}
          onThemePref={onThemePref}
          onLang={onLang}
          onContinue={() => go('habit')}
        />
      )}
      {step === 'habit' && (
        <HabitStep
          key={lang}
          day={day}
          onPick={() => setNudged(true)}
          onSkip={() => go('goal')}
          onCreate={habit => {
            setResult(prev => ({ ...prev, habit }));
            go('goal');
          }}
        />
      )}
      {step === 'goal' && (
        <GoalStep
          day={day}
          onPick={() => setNudged(true)}
          onSkip={() => go('gratitude')}
          onCreate={(input, goal) => {
            create(input);
            setResult(prev => ({ ...prev, goal }));
            go('gratitude');
          }}
        />
      )}
      {step === 'gratitude' && (
        <GratitudeStep
          day={day}
          onSkip={() => onReady(result)}
          onSave={text => {
            journal.add('gratitude', text);
            onReady({ ...result, gratitude: text });
          }}
        />
      )}
    </View>
  );
}

function dayOf(
  result: OnboardingResult,
  c: ReturnType<typeof useLab>['c'],
  checked: boolean
): DayState {
  return {
    habit: result.habit
      ? { icon: result.habit.icon, color: c.habit[result.habit.color] }
      : null,
    goal: result.goal,
    gratitude: result.gratitude !== null,
    checked,
  };
}

function Welcome({
  themePref,
  onThemePref,
  onLang,
  onContinue,
}: {
  themePref: ThemePref;
  onThemePref: (pref: ThemePref) => void;
  onLang: (lang: LabLang) => void;
  onContinue: () => void;
}) {
  const { lang } = useLab();
  const t = useJournalT();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<'language' | 'look' | null>(null);
  const languageLabel =
    lang === 'de'
      ? t('settings.languageGerman')
      : t('settings.languageEnglish');
  const lookLabel =
    themePref === 'light'
      ? t('settings.lightMode')
      : themePref === 'dark'
        ? t('settings.darkMode')
        : t('settings.systemAuto');

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={styles.welcomeBody}>
        <StepIn>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.crystalGlow} />
            <Image
              source={splashIcon}
              style={styles.crystal}
              resizeMode="contain"
            />
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[typeStyle('display', '#FFFFFF'), styles.center]}
            >
              {t('onboarding.welcome.title')}
            </Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('title', '#FFFFFF', true),
                styles.center,
                { marginTop: labSpace.sm },
              ]}
            >
              {t('onboarding.welcome.tagline')}
            </Text>
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('body', WHITE_MUTED),
                styles.center,
                { marginTop: labSpace.md },
              ]}
            >
              {t('onboarding.welcome.promise')}
            </Text>
          </View>
        </StepIn>
      </View>

      <View
        style={[
          styles.welcomeFoot,
          { paddingBottom: insets.bottom + labSpace.md },
        ]}
      >
        {panel === 'language' && (
          <View style={styles.options}>
            {(['en', 'de'] as LabLang[]).map(key => (
              <OptionPill
                key={key}
                label={
                  key === 'de'
                    ? t('settings.languageGerman')
                    : t('settings.languageEnglish')
                }
                on={key === lang}
                onPress={() => {
                  onLang(key);
                  setPanel(null);
                }}
              />
            ))}
          </View>
        )}
        {panel === 'look' && (
          <View style={styles.options}>
            {(
              [
                ['light', t('settings.lightMode')],
                ['dark', t('settings.darkMode')],
                ['system', t('settings.systemAuto')],
              ] as const
            ).map(([key, label]) => (
              <OptionPill
                key={key}
                label={label}
                on={key === themePref}
                onPress={() => {
                  onThemePref(key);
                  setPanel(null);
                }}
              />
            ))}
          </View>
        )}
        <SkyButton label={t('onboarding.welcome.cta')} onPress={onContinue} />
        <View style={styles.quietRow}>
          <QuietChip
            icon="globe-outline"
            label={languageLabel}
            onPress={() =>
              setPanel(p => (p === 'language' ? null : 'language'))
            }
          />
          <QuietChip
            icon="contrast-outline"
            label={lookLabel}
            onPress={() => setPanel(p => (p === 'look' ? null : 'look'))}
          />
        </View>
      </View>
    </View>
  );
}

function QuietChip({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      pressScale={0.95}
      accessibilityLabel={label}
      style={styles.quietChip}
    >
      <Ionicons name={icon} size={14} color={WHITE_MUTED} />
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[typeStyle('caption', WHITE_MUTED), { marginLeft: 6 }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function OptionPill({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      pressScale={0.95}
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={[styles.option, on && styles.optionOn]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          typeStyle('label', on ? NIGHT_INK : '#FFFFFF'),
          { fontFamily: labFonts.semibold },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const CUSTOM = 'custom';

function HabitStep({
  day,
  onPick,
  onSkip,
  onCreate,
}: {
  day: DayState;
  onPick: () => void;
  onSkip: () => void;
  onCreate: (habit: LabHabit) => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const t = useJournalT();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabHabit['color']>('blue');
  const [icon, setIcon] = useState<IoniconName>(ICONS[0]!);
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [open, setOpen] = useState(false);
  const canCreate = name.trim().length > 0 && days.length > 0;

  const pick = (id: string) => {
    onPick();
    setSelected(id);
    const preset = HABIT_PRESETS.find(p => p.id === id);
    if (preset) {
      setName(t(preset.nameKey));
      setColor(preset.color as LabHabit['color']);
      setIcon(HABIT_ICON_MAP[preset.icon]);
    } else {
      setName('');
      setOpen(false);
    }
  };

  return (
    <TaskFrame
      title={t('onboarding.habit.title')}
      subtitle={copy.onboarding.habitSmall}
      day={day}
      current={1}
      cta={t('onboarding.habit.cta')}
      ctaEnabled={canCreate}
      onSkip={onSkip}
      onCta={() =>
        onCreate({
          id: `onb-${Date.now()}`,
          icon,
          color,
          name: { en: name.trim(), de: name.trim() },
          days: [...days].sort(),
          createdDaysAgo: 0,
          streak: 0,
          best: 0,
        })
      }
    >
      <View style={styles.grid}>
        {HABIT_PRESETS.map(preset => (
          <Tile
            key={preset.id}
            label={t(preset.nameKey)}
            icon={HABIT_ICON_MAP[preset.icon]}
            color={c.habit[preset.color as LabHabit['color']]}
            selected={selected === preset.id}
            onPress={() => pick(preset.id)}
          />
        ))}
        <Tile
          label={t('onboarding.habit.customTile')}
          icon="create-outline"
          color="#FFFFFF"
          selected={selected === CUSTOM}
          onPress={() => pick(CUSTOM)}
        />
      </View>

      {selected !== null && (
        <StepIn>
          <View style={styles.preview}>
            <View style={styles.previewRow}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: c.habit[color] },
                ]}
              >
                <Ionicons name={icon} size={22} color="#FFFFFF" />
              </View>
              <SkyInput
                value={name}
                onChangeText={setName}
                placeholder={t('onboarding.habit.namePlaceholder')}
                accessibilityLabel={t('onboarding.habit.nameLabel')}
                autoFocus={selected === CUSTOM}
                maxLength={50}
                style={styles.previewInput}
              />
            </View>
            <PressableScale
              onPress={() => setOpen(v => !v)}
              accessibilityLabel={copy.onboarding.customize}
              accessibilityState={{ selected: open }}
              style={styles.customize}
            >
              <Ionicons
                name={open ? 'chevron-up' : 'color-wand-outline'}
                size={15}
                color={WHITE_MUTED}
              />
              <Text
                style={[typeStyle('label', WHITE_MUTED), { marginLeft: 6 }]}
              >
                {copy.onboarding.customize}
              </Text>
            </PressableScale>
            {open && (
              <StepIn>
                <SkyLabel text={t('onboarding.habit.colorLabel')} />
                <View style={styles.swatches}>
                  {COLORS.map(key => (
                    <Swatch
                      key={key}
                      color={c.habit[key]}
                      selected={color === key}
                      onPress={() => setColor(key)}
                    />
                  ))}
                </View>
                <SkyLabel text={t('onboarding.habit.iconLabel')} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: labSpace.sm }}
                >
                  {ICONS.map(key => (
                    <PressableScale
                      key={key}
                      onPress={() => setIcon(key)}
                      pressScale={0.9}
                      accessibilityLabel={key}
                      accessibilityState={{ selected: icon === key }}
                      style={[
                        styles.iconCell,
                        icon === key && styles.iconCellOn,
                      ]}
                    >
                      <Ionicons
                        name={key}
                        size={20}
                        color={icon === key ? NIGHT_INK : '#FFFFFF'}
                      />
                    </PressableScale>
                  ))}
                </ScrollView>
                <SkyLabel text={t('onboarding.habit.daysLabel')} />
                <View style={styles.days}>
                  {copy.weekdays.map((letter, i) => (
                    <DayToggle
                      key={i}
                      letter={letter}
                      on={days.includes(i)}
                      color={c.habit[color]}
                      onPress={() => {
                        selection();
                        setDays(prev =>
                          prev.includes(i)
                            ? prev.filter(d => d !== i)
                            : [...prev, i]
                        );
                      }}
                    />
                  ))}
                </View>
              </StepIn>
            )}
          </View>
        </StepIn>
      )}
    </TaskFrame>
  );
}

function SkyLabel({ text }: { text: string }) {
  return (
    <Text style={[typeStyle('overline', WHITE_MUTED), styles.skyLabel]}>
      {text}
    </Text>
  );
}

function GoalStep({
  day,
  onPick,
  onSkip,
  onCreate,
}: {
  day: DayState;
  onPick: () => void;
  onSkip: () => void;
  onCreate: (
    input: Parameters<ReturnType<typeof useLabGoals>['create']>[0],
    goal: NonNullable<OnboardingResult['goal']>
  ) => void;
}) {
  const { c } = useLab();
  const t = useJournalT();
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<GoalCategoryKey>('personal');
  const [icon, setIcon] = useState<string>('flag');
  const parsed = parseGoalTarget(target);
  const canCreate = isGoalDraftComplete({ title, unit, targetValue: target });

  const pick = (id: string) => {
    onPick();
    setSelected(id);
    const idea = IDEAS.find(x => x.id === id);
    if (idea) {
      setTitle(t(`goals.templates.${idea.title}`));
      setUnit(t(`goals.units.${idea.unit}`));
      setTarget(String(idea.target));
      setCategory(idea.category);
      setIcon(idea.icon);
    } else {
      setTitle('');
      setUnit('');
      setTarget('');
      setCategory('personal');
      setIcon('flag');
    }
  };

  return (
    <TaskFrame
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      day={day}
      current={2}
      cta={t('onboarding.goal.cta')}
      ctaEnabled={canCreate}
      onSkip={onSkip}
      onCta={() =>
        onCreate(
          {
            title: { en: title.trim(), de: title.trim() },
            category,
            icon,
            unit: { en: unit.trim(), de: unit.trim() },
            kind: 'count',
            start: 0,
            target: parsed!,
            targetDate: null,
            quick: suggestQuick(parsed!),
          },
          {
            title: title.trim(),
            icon,
            color: c.habit[CATEGORY_LOOK[category].color],
          }
        )
      }
    >
      <View style={styles.grid}>
        {IDEAS.map(idea => (
          <Tile
            key={idea.id}
            label={t(`goals.templates.${idea.title}`)}
            detail={`${idea.target} ${t(`goals.units.${idea.unit}`)}`}
            icon={idea.icon}
            color={c.habit[CATEGORY_LOOK[idea.category].color]}
            selected={selected === idea.id}
            onPress={() => pick(idea.id)}
          />
        ))}
        <Tile
          label={t('onboarding.goal.customTile')}
          icon="create-outline"
          color="#FFFFFF"
          selected={selected === CUSTOM}
          onPress={() => pick(CUSTOM)}
        />
      </View>
      {selected !== null && (
        <StepIn>
          <View style={styles.preview}>
            <SkyInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('onboarding.goal.namePlaceholder')}
              accessibilityLabel={t('onboarding.goal.nameLabel')}
              autoFocus={selected === CUSTOM}
              maxLength={100}
            />
            <View style={styles.inlineRow}>
              <SkyInput
                value={target}
                onChangeText={setTarget}
                placeholder={t('onboarding.goal.targetLabel')}
                accessibilityLabel={t('onboarding.goal.targetLabel')}
                keyboardType="number-pad"
                maxLength={12}
                style={{ flex: 1 }}
              />
              <SkyInput
                value={unit}
                onChangeText={setUnit}
                placeholder={t('onboarding.goal.unitLabel')}
                accessibilityLabel={t('onboarding.goal.unitLabel')}
                maxLength={20}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </StepIn>
      )}
    </TaskFrame>
  );
}

/** The real prompts (journal.input.gratitudePlaceholders) — the same as in the Journal. */
function GratitudeStep({
  day,
  onSkip,
  onSave,
}: {
  day: DayState;
  onSkip: () => void;
  onSave: (text: string) => void;
}) {
  const { lang } = useLab();
  const o = MOCK_COPY[lang].onboarding;
  const t = useJournalT();
  const prompts = useMemo(() => {
    const list = t('journal.input.gratitudePlaceholders', {
      returnObjects: true,
    }) as unknown;
    return Array.isArray(list) && list.length > 0
      ? (list as string[])
      : [t('journal.input.defaultPlaceholder')];
  }, [t]);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const trimmed = text.trim();
  return (
    <TaskFrame
      title={prompts[index % prompts.length] ?? ''}
      subtitle={o.gratitudeHint}
      day={day}
      current={3}
      cta={t('journal.input.addGratitudeTitle')}
      ctaEnabled={trimmed.length >= 3}
      onSkip={onSkip}
      onCta={() => onSave(trimmed)}
    >
      <SkyInput
        value={text}
        onChangeText={setText}
        accessibilityLabel={t('journal.input.addGratitudeTitle')}
        multiline
        autoFocus
        maxLength={200}
        style={styles.gratitude}
      />
      <PressableScale
        onPress={() => setIndex(i => i + 1)}
        accessibilityLabel={MOCK_COPY[lang].journal.anotherPrompt}
        style={styles.customize}
      >
        <Ionicons name="shuffle" size={15} color={WHITE_MUTED} />
        <Text style={[typeStyle('label', WHITE_MUTED), { marginLeft: 6 }]}>
          {MOCK_COPY[lang].journal.anotherPrompt}
        </Text>
      </PressableScale>
    </TaskFrame>
  );
}

// ---------------------------------------------------------------------------
// The ask: over the real list, the real check does it
// ---------------------------------------------------------------------------

/** After a check the XP gets a moment to land before the ending covers the app. */
const ENDING_AFTER_CHECK_MS = 1200;

export function OnboardingAsk({
  habit,
  bottomInset,
  onEnding,
}: {
  habit: LabHabit;
  bottomInset: number;
  onEnding: (ending: ScreenThreeEnding) => void;
}) {
  const { lang } = useLab();
  const t = useJournalT();
  const { done } = useLabToday();
  const checked = !!done[habit.id];
  const name = quotedHabitName(habit.name[lang]);
  const copy = askCopyKeys(true);
  const ending = useRef(onEnding);
  ending.current = onEnding;

  useEffect(() => {
    if (!checked) return undefined;
    const id = setTimeout(() => ending.current('done'), ENDING_AFTER_CHECK_MS);
    return () => clearTimeout(id);
  }, [checked]);

  return (
    <View style={styles.askRoot} pointerEvents="box-none">
      <Surface
        style={[styles.ask, { marginBottom: bottomInset + labSpace.md }]}
      >
        <LabText variant="titleSm">{t(copy.titleKey, { habit: name })}</LabText>
        <LabText variant="body" tone="muted" style={{ marginTop: 2 }}>
          {t(copy.bodyKey)}
        </LabText>
        <PressableScale
          onPress={() => onEnding(checked ? 'done' : 'later')}
          accessibilityLabel={t('onboarding.done.later')}
          style={styles.askLater}
        >
          <LabText variant="label" tone="muted">
            {t('onboarding.done.later')}
          </LabText>
        </PressableScale>
      </Surface>
    </View>
  );
}

// ---------------------------------------------------------------------------
// The ending: the sun is up
// ---------------------------------------------------------------------------

const TROPHY_IDS = {
  habit: 'first-habit',
  goal: 'first-goal',
  gratitude: 'first-journal',
} as const;

export function OnboardingEnding({
  ending,
  result,
  onDone,
  onLearnMore,
}: {
  ending: ScreenThreeEnding;
  result: OnboardingResult;
  /** `xp` = what the trophies and the gratitude earned; it flies when the app shows. */
  onDone: (xp: number) => void;
  onLearnMore: () => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const o = copy.onboarding;
  const t = useJournalT();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'peak' | 'remind'>('peak');
  const { habit, goal, gratitude } = result;
  const text = endingCopyKeys(ending, false, habit !== null);
  const name = habit ? quotedHabitName(habit.name[lang]) : '';

  const trophies = CORE_ACHIEVEMENTS.filter(
    a =>
      (habit && a.id === TROPHY_IDS.habit) ||
      (goal && a.id === TROPHY_IDS.goal) ||
      (gratitude && a.id === TROPHY_IDS.gratitude)
  );
  const quietXp =
    trophies.reduce((sum, a) => sum + a.xpReward, 0) +
    (gratitude ? XP_REWARDS.JOURNAL.FIRST_ENTRY : 0);
  const shownXp = quietXp + (ending === 'done' ? 25 : 0);
  // A new user's total. Live: the real one, nothing else was earned.
  const level = getXPProgress(shownXp).currentLevel;
  // Honest: rewards for what really happened, whichever ending this is.
  const stats = [
    ...(shownXp > 0 ? [t('onboarding.done.statXp', { xp: shownXp })] : []),
    // "Level 0" is no reward: the first level to show is the first one reached.
    ...(level > 0 ? [t('onboarding.done.statLevel', { level })] : []),
    ...(ending === 'done' ? [t('onboarding.done.statStreak')] : []),
  ];

  if (phase === 'remind') {
    return (
      <View style={styles.takeover} accessibilityViewIsModal>
        <Sky stage={4} />
        <View style={[styles.welcomeBody, { paddingTop: insets.top }]}>
          <StepIn>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.bell}>
                <Ionicons name="notifications" size={38} color="#F6C350" />
              </View>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.3}
                style={[
                  typeStyle('display', '#FFFFFF'),
                  styles.center,
                  { fontSize: 30, lineHeight: 36 },
                ]}
              >
                {t('notifications.priming.title')}
              </Text>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[
                  typeStyle('body', WHITE_MUTED),
                  styles.center,
                  { marginTop: labSpace.md },
                ]}
              >
                {t('notifications.priming.message')}
              </Text>
            </View>
          </StepIn>
        </View>
        <View
          style={[
            styles.welcomeFoot,
            { paddingBottom: insets.bottom + labSpace.sm },
          ]}
        >
          <SkyButton
            label={t('notifications.priming.allow')}
            icon="notifications"
            onPress={() => onDone(quietXp)}
          />
          <PressableScale
            onPress={() => onDone(quietXp)}
            accessibilityLabel={t('notifications.priming.later')}
            style={styles.quietLink}
          >
            <Text style={typeStyle('label', WHITE_MUTED)}>
              {t('notifications.priming.later')}
            </Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.takeover} accessibilityViewIsModal>
      <Sky stage={ending === 'done' ? 4 : 3} />
      <View style={[styles.frameTop, { paddingTop: insets.top + labSpace.lg }]}>
        <DaySlots day={dayOf(result, c, ending === 'done')} current={4} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.column, styles.peak]}
      >
        <StepIn>
          <View style={{ alignItems: 'center' }}>
            {ending === 'done' && (
              <StreakFlame
                state="fire"
                onStateChange={() => undefined}
                size={76}
                label={t('onboarding.done.statStreak')}
              />
            )}
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('display', '#FFFFFF'),
                styles.center,
                { fontSize: 30, lineHeight: 36 },
              ]}
            >
              {t(text.titleKey)}
            </Text>
            {stats.length > 0 && (
              <View style={styles.stats}>
                {stats.map(stat => (
                  <View key={stat} style={styles.stat}>
                    <Text
                      maxFontSizeMultiplier={1.3}
                      style={[
                        typeStyle('caption', '#FFFFFF'),
                        { fontFamily: labFonts.semibold },
                      ]}
                    >
                      {stat}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Theirs: the peak of the flow is what THEY made today. */}
          {(habit || goal || gratitude) && (
            <View style={styles.yours}>
              {habit && (
                <YourRow
                  icon={habit.icon}
                  color={c.habit[habit.color]}
                  title={habit.name[lang]}
                />
              )}
              {goal && (
                <YourRow
                  icon={goal.icon}
                  color={goal.color}
                  title={goal.title}
                />
              )}
              {gratitude && (
                <Text
                  maxFontSizeMultiplier={1.3}
                  numberOfLines={3}
                  style={[typeStyle('body', '#FFFFFF', true), styles.quote]}
                >
                  {`“${gratitude}”`}
                </Text>
              )}
            </View>
          )}

          {trophies.length > 0 && (
            <View style={styles.earned}>
              <View style={styles.earnedMedals}>
                {trophies.map(a => (
                  <View key={a.id} style={styles.earnedItem}>
                    <View style={styles.earnedMedal}>
                      <Text maxFontSizeMultiplier={1} style={styles.earnedIcon}>
                        {a.icon}
                      </Text>
                    </View>
                    <Text
                      maxFontSizeMultiplier={1.2}
                      numberOfLines={2}
                      style={[
                        typeStyle('caption', '#FFFFFF'),
                        styles.center,
                        { marginTop: labSpace.xs },
                      ]}
                    >
                      {t(a.nameKey)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[typeStyle('label', '#FFFFFF'), styles.center]}
              >
                {o.trophiesEarned(trophies.length)}
              </Text>
            </View>
          )}

          <Text
            maxFontSizeMultiplier={1.3}
            style={[
              typeStyle('body', '#FFFFFF'),
              styles.center,
              { marginTop: labSpace.lg },
            ]}
          >
            {habit ? t(text.bodyKey, { habit: name }) : o.noHabitBody}
          </Text>
        </StepIn>
      </ScrollView>
      <View
        style={[
          styles.welcomeFoot,
          { paddingBottom: insets.bottom + labSpace.sm },
        ]}
      >
        <SkyButton
          label={t('onboarding.done.cta')}
          onPress={() => setPhase('remind')}
        />
        <PressableScale
          onPress={onLearnMore}
          accessibilityLabel={t('onboarding.done.learnMore')}
          style={styles.quietLink}
        >
          <Text style={typeStyle('label', WHITE_MUTED)}>
            {t('onboarding.done.learnMore')}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

/**
 * The trophies' and gratitude's XP waited for the ending; now it flies into the
 * level badge, the first time the user sees it.
 */
export function OnboardingXp({
  xp,
  onLanded,
}: {
  xp: number;
  onLanded: () => void;
}) {
  const award = useLabXpAward();
  const landed = useRef(onLanded);
  landed.current = onLanded;
  useEffect(() => {
    if (xp <= 0) return undefined;
    const id = setTimeout(() => {
      award(xp);
      landed.current();
    }, 500);
    return () => clearTimeout(id);
  }, [xp, award]);
  return null;
}

function YourRow({
  icon,
  color,
  title,
}: {
  icon: string;
  color: string;
  title: string;
}) {
  return (
    <View style={styles.yourRow}>
      <View style={[styles.yourIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as IoniconName} size={16} color="#FFFFFF" />
      </View>
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[
          typeStyle('bodyStrong', '#FFFFFF'),
          { flex: 1, marginLeft: labSpace.md },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  takeover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
    backgroundColor: '#07051A',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  sun: {
    position: 'absolute',
    backgroundColor: '#F6C350',
    boxShadow: '0px 0px 90px 34px rgba(246, 195, 80, 0.5)',
  },
  hill: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: HILL,
  },
  column: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: labSpace.xl,
    paddingTop: labSpace.lg,
  },
  center: {
    textAlign: 'center',
  },
  cta: {
    height: 56,
    borderRadius: labRadius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  frameTop: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: labSpace.xl,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skip: {
    minHeight: 44,
    paddingLeft: labSpace.lg,
    justifyContent: 'center',
  },
  slots: {
    flexDirection: 'row',
    marginTop: labSpace.xs,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  slotMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
    marginTop: labSpace.lg,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    padding: labSpace.sm,
    borderRadius: labRadius.md,
    borderWidth: 1,
    backgroundColor: GLASS,
    borderColor: GLASS_LINE,
  },
  tileOn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: labRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    marginTop: labSpace.lg,
    padding: labSpace.md,
    borderRadius: labRadius.md + 4,
    borderWidth: 1,
    backgroundColor: GLASS,
    borderColor: GLASS_LINE,
    gap: labSpace.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 46,
    height: 46,
    borderRadius: labRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInput: {
    flex: 1,
    marginLeft: labSpace.md,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: labSpace.md,
    paddingVertical: 0,
    borderRadius: labRadius.sm,
    backgroundColor: GLASS,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: labSpace.sm,
  },
  gratitude: {
    marginTop: labSpace.lg,
    minHeight: 96,
    paddingTop: labSpace.md,
    textAlignVertical: 'top',
  },
  peak: {
    paddingTop: labSpace.md,
    paddingBottom: labSpace.lg,
  },
  yours: {
    marginTop: labSpace.lg,
    padding: labSpace.md,
    borderRadius: labRadius.md + 4,
    borderWidth: 1,
    backgroundColor: GLASS,
    borderColor: GLASS_LINE,
    gap: labSpace.sm,
  },
  yourRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yourIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quote: {
    marginTop: labSpace.xs,
  },
  earned: {
    alignItems: 'center',
    marginTop: labSpace.lg,
    gap: labSpace.xs,
  },
  earnedMedals: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: labSpace.sm,
  },
  earnedItem: {
    flex: 1,
    maxWidth: 104,
    alignItems: 'center',
  },
  earnedMedal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F6C350',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  earnedIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  customize: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  skyLabel: {
    marginTop: labSpace.md,
    marginBottom: labSpace.sm,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.xs,
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: labRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS,
  },
  iconCellOn: {
    backgroundColor: '#FFFFFF',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    paddingHorizontal: labSpace.xl,
    paddingTop: HILL_TOP + FOOTER_BAND - 56,
  },
  footerColumn: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  welcomeBody: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: labSpace.xxl,
  },
  crystal: {
    width: SPLASH_ICON_SIZE * 0.62,
    height: SPLASH_ICON_SIZE * 0.62,
    marginBottom: labSpace.md,
  },
  crystalGlow: {
    position: 'absolute',
    top: 10,
    width: 96,
    height: 96,
    borderRadius: 48,
    boxShadow: '0px 0px 70px 18px rgba(125, 227, 244, 0.4)',
  },
  welcomeFoot: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: labSpace.xl,
    paddingTop: labSpace.lg,
    gap: labSpace.sm,
  },
  quietRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: labSpace.sm,
  },
  quietChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: labSpace.md,
    borderRadius: labRadius.pill,
    backgroundColor: GLASS,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: labSpace.sm,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: labSpace.lg,
    borderRadius: labRadius.pill,
    justifyContent: 'center',
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: GLASS_LINE,
  },
  optionOn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  quietLink: {
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: labSpace.lg,
  },
  bell: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: labSpace.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  stat: {
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  askRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: labSpace.lg,
  },
  ask: {
    padding: labSpace.lg,
  },
  askLater: {
    alignSelf: 'flex-start',
    minHeight: 40,
    justifyContent: 'center',
    marginTop: labSpace.xs,
  },
});
