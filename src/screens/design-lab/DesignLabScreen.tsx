/**
 * Design Lab — internal playground for the new look (premium-design-plan.md, F1).
 *
 * Reached from Settings → "Test design", only in development (src/config/designLab.ts).
 * Everything here is mock: no context, storage, analytics or ads are touched, and
 * the light/dark switch is local to the lab — the app's own theme setting stays.
 *
 * Opening the lab plays the proposed app launch (introTimeline.tsx): the native
 * splash lifts like the night and Home assembles underneath. Tap to skip.
 *
 * The toolbar exists for judging the design on a real phone:
 * - sun/moon: light or dark palette
 * - EN/DE: German has the longest strings of our three languages
 * - sparkles: the crown layer on/off (scroll choreography, rays, haptic ticks) —
 *   compare it with the calm version
 * - speedometer: Reanimated's FPS monitor (JS and UI thread)
 * - play: the full launch again · refresh: the quick entrance (every later open)
 * - trophy: the next scenario of "one celebration per action" (R-29,
 *   celebrationDirector.tsx) — the subtitle names it; XP flies into the level badge
 * The level badge is pinned top-left on every lab page; a tap on it opens the level
 * panel (R-31, levelPanel.tsx) — on the five tabs only, not over an open detail.
 * The subtitle says when the OS "reduce motion" setting is on (animations then jump
 * to their end state — that is the intended behaviour, not a bug).
 *
 * GOING LIVE: lab only — never in a store build (designLab.test.ts). Its toolbar
 * stays a development tool or is removed in F5.
 */
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  PerformanceMonitor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/contexts/ThemeContext';
import { contentColumn } from '@/src/utils/layout';
import { HomeConcept } from './HomeConcept';
import {
  IntroKind,
  IntroProvider,
  LaunchCurtain,
  useIntro,
} from './introTimeline';
import {
  LabText,
  LabThemeProvider,
  PressableScale,
  Rise,
  useLab,
} from './labPrimitives';
import {
  labFontFiles,
  labFonts,
  LabMode,
  labPalettes,
  labRadius,
  labSpace,
  SPLASH_BACKGROUND,
} from './labTokens';
import { LabLang, MOCK_COPY } from './mockCopy';
import {
  CelebrationModalOutlet,
  CelebrationNoteOutlet,
  LabCelebrationProvider,
} from './celebrationDirector';
import {
  OnboardingAsk,
  OnboardingConcept,
  OnboardingEnding,
  OnboardingResult,
  OnboardingXp,
} from './OnboardingConcept';
import { ScreenThreeEnding } from '@/src/components/onboarding/firstCheckCopy';
import { LabXpProvider, LevelBadge } from './xpFlight';
import { useLabScenarios } from './labScenarios';
import { LabPageActiveProvider, useLabCover } from './labCover';
import {
  LEVEL_BADGE_PIN,
  LevelPanel,
  LevelPanelControl,
  useLevelPanel,
} from './levelPanel';
import { LabTodayProvider } from './habitsMock';
import { HabitsConcept } from './HabitsConcept';
import { JournalConcept } from './JournalConcept';
import { LabJournalProvider } from './journalMock';
import { GoalsConcept } from './GoalsConcept';
import { LabGoalsProvider } from './goalsMock';
import { LabChallengeProvider } from './challengeMock';
import { LabMultiplierProvider, useLabMultiplier } from './multiplierMock';
import { badgeMark } from './multiplierLogic';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { LabPerfProbe } from './labPerf';
import { SettingsConcept, ThemePref } from './SettingsConcept';
import { TrophyRoomConcept } from './TrophyRoomConcept';
import { LevelsOverviewConcept } from './LevelsOverviewConcept';
import { HowItWorksConcept, SectionId } from './HowItWorksConcept';
import { LabHelpProvider } from './labHelp';
import { LabSystemProvider } from './systemScreens';
import { SignatureIcon, SignatureName } from './SignatureIcon';
import { SlidePage } from './journalParts';

const TAB_BAR_HEIGHT = 60;
const BANNER_HEIGHT = 50;
const TAB_PILL_WIDTH = 52;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** The tab bar's own icons (kolo 51, SignatureIcon): the same silhouette open or
 *  not — colour says which tab is open, so nothing jumps on a switch. */
const TAB_ICONS: SignatureName[] = [
  'today',
  'habits',
  'journal',
  'goals',
  'settings',
];

export function DesignLabScreen() {
  const { isDark } = useTheme();
  const scheme = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePref>(
    isDark ? 'dark' : 'light'
  );
  const mode: LabMode =
    themePref === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : themePref;
  const [trophies, setTrophies] = useState(false);
  const [levels, setLevels] = useState(false);
  const [howItWorks, setHowItWorks] = useState<{
    focus: SectionId | null;
  } | null>(null);
  // Onboarding: 'flow' covers everything, 'ask' sits over the real Habits tab.
  const [onboarding, setOnboarding] = useState<
    'off' | 'flow' | 'ask' | ScreenThreeEnding
  >('off');
  const [onbResult, setOnbResult] = useState<OnboardingResult | null>(null);
  const [pendingXp, setPendingXp] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const [lang, setLang] = useState<LabLang>('en');
  const [intro, setIntro] = useState<{ kind: IntroKind; key: number }>({
    kind: 'launch',
    key: 0,
  });
  const [tab, setTab] = useState(0);
  // Tabs the user has been to stay mounted (R-32); per-tab replays are a lab tool.
  const [visited, setVisited] = useState<ReadonlySet<number>>(
    () => new Set([0])
  );
  const [replays, setReplays] = useState<Record<number, number>>({});
  const [showFps, setShowFps] = useState(false);
  const [crown, setCrown] = useState(true);
  const [scenario, setScenario] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts(labFontFiles);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const c = labPalettes[mode];
  // The tutorial sits over the tabs: the level panel stays shut under it.
  useLabCover(onboarding !== 'off');

  // Fonts load only here, so the rest of the app's startup is untouched. Until they
  // are in, the splash frame is shown — exactly where the launch starts.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }} />;
  }

  const bottomChrome =
    BANNER_HEIGHT + labSpace.sm * 2 + TAB_BAR_HEIGHT + insets.bottom;
  const play = (kind: IntroKind) =>
    setIntro(prev => ({ kind, key: prev.key + 1 }));
  const goTab = (next: number) => {
    // A keyboard left up by the tab being left would sit over the next one.
    Keyboard.dismiss();
    setTab(next);
    setVisited(prev => (prev.has(next) ? prev : new Set(prev).add(next)));
  };

  return (
    <LabThemeProvider mode={mode} lang={lang} crown={crown}>
      {/* The lab's pages swipe back from the left edge themselves (R-33); the
          route's own back swipe would leave the whole lab instead. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <IntroProvider kind={intro.kind} playKey={intro.key}>
        <View style={{ flex: 1, backgroundColor: c.canvas }}>
          <LabXpProvider>
            <LabCelebrationProvider>
              <LabTodayProvider>
                <LabJournalProvider>
                  <LabGoalsProvider>
                    <LabChallengeProvider>
                      <LabMultiplierProvider>
                        <LabSystemProvider
                          bottomInset={bottomChrome}
                          onHome={() => goTab(0)}
                        >
                          <LabStatusBar mode={mode} />
                          <LabToolbar
                            topInset={insets.top}
                            reducedMotion={reducedMotion}
                            scenario={scenario}
                            onScenario={setScenario}
                            showFps={showFps}
                            crown={crown}
                            onToggleCrown={() => setCrown(v => !v)}
                            onToggleMode={() =>
                              setThemePref(mode === 'dark' ? 'light' : 'dark')
                            }
                            onToggleLang={() =>
                              setLang(l => (l === 'en' ? 'de' : 'en'))
                            }
                            onToggleFps={() => setShowFps(v => !v)}
                            onLaunch={() => {
                              goTab(0);
                              play('launch');
                            }}
                            // The quick entrance of the tab on screen, once more.
                            onSettle={() =>
                              tab === 0
                                ? play('settle')
                                : setReplays(prev => ({
                                    ...prev,
                                    [tab]: (prev[tab] ?? 0) + 1,
                                  }))
                            }
                          />

                          {/* Tabs stay alive (R-32): a tab is built on its first visit, plays
                          its entrance once, and from then on switching is instant and it
                          keeps its state and scroll position. */}
                          <View style={{ flex: 1 }}>
                            <LabHelpProvider
                              bottomInset={bottomChrome}
                              onOpenRules={section =>
                                setHowItWorks({ focus: section })
                              }
                            >
                              {TAB_ICONS.map((_, i) =>
                                visited.has(i) ? (
                                  <LabPage
                                    // Replaying an entrance from the toolbar rebuilds the page.
                                    key={`${i}-${i === 0 ? intro.key : (replays[i] ?? 0)}`}
                                    active={i === tab}
                                    // Home rides the lab's own intro (the launch).
                                    ownEntrance={i !== 0}
                                  >
                                    {i === 0 ? (
                                      <HomeConcept
                                        bottomInset={bottomChrome}
                                        onOpenTrophies={() => setTrophies(true)}
                                      />
                                    ) : i === 1 ? (
                                      <HabitsConcept
                                        bottomInset={bottomChrome}
                                        onboardingHabit={
                                          onbResult?.habit ?? null
                                        }
                                        asking={onboarding === 'ask'}
                                      />
                                    ) : i === 2 ? (
                                      <JournalConcept
                                        bottomInset={bottomChrome}
                                      />
                                    ) : i === 3 ? (
                                      <GoalsConcept
                                        bottomInset={bottomChrome}
                                      />
                                    ) : (
                                      <SettingsConcept
                                        bottomInset={bottomChrome}
                                        themePref={themePref}
                                        onThemePref={setThemePref}
                                        onLang={setLang}
                                        onRestartTutorial={() =>
                                          setOnboarding('flow')
                                        }
                                        onOpenHowItWorks={() =>
                                          setHowItWorks({ focus: null })
                                        }
                                      />
                                    )}
                                  </LabPage>
                                ) : null
                              )}

                              {/* Opens from Home and Settings; the level badge stays above it. */}
                              {trophies && (
                                <SlidePage
                                  width={windowWidth}
                                  onClosed={() => setTrophies(false)}
                                >
                                  {close => (
                                    <TrophyRoomConcept
                                      bottomInset={bottomChrome}
                                      onClose={close}
                                    />
                                  )}
                                </SlidePage>
                              )}

                              {/* "All levels" in the level panel; the badge stays above it too. */}
                              {levels && (
                                <SlidePage
                                  width={windowWidth}
                                  onClosed={() => setLevels(false)}
                                >
                                  {close => (
                                    <LevelsOverviewConcept
                                      bottomInset={bottomChrome}
                                      onClose={close}
                                    />
                                  )}
                                </SlidePage>
                              )}

                              {/* Settings → "How SelfRise works" (kolo 47, L-3). */}
                              {howItWorks && (
                                <SlidePage
                                  width={windowWidth}
                                  onClosed={() => setHowItWorks(null)}
                                >
                                  {close => (
                                    <HowItWorksConcept
                                      bottomInset={bottomChrome}
                                      onClose={close}
                                      focus={howItWorks.focus}
                                    />
                                  )}
                                </SlidePage>
                              )}

                              <BadgeLayer
                                closeKey={`${tab}-${intro.key}`}
                                onOpenTrophies={() => setTrophies(true)}
                                onOpenLevels={() => setLevels(true)}
                              />
                            </LabHelpProvider>
                          </View>

                          <BottomChrome
                            bottomInset={insets.bottom}
                            activeTab={tab}
                            onSelectTab={next => {
                              if (next === tab) return;
                              goTab(next);
                            }}
                          />

                          {showFps && (
                            <View
                              style={[styles.fps, { top: insets.top + 64 }]}
                              pointerEvents="none"
                            >
                              <PerformanceMonitor />
                            </View>
                          )}

                          <CelebrationModalOutlet />
                          {onboarding === 'ask' && onbResult?.habit && (
                            <OnboardingAsk
                              habit={onbResult.habit}
                              bottomInset={bottomChrome}
                              onEnding={setOnboarding}
                            />
                          )}
                          {(onboarding === 'done' || onboarding === 'later') &&
                            onbResult && (
                              <OnboardingEnding
                                ending={onboarding}
                                result={onbResult}
                                onDone={xp => {
                                  setOnboarding('off');
                                  setPendingXp(xp);
                                }}
                                onLearnMore={xp => {
                                  setOnboarding('off');
                                  setPendingXp(xp);
                                  setHowItWorks({ focus: null });
                                }}
                              />
                            )}
                          {onboarding === 'flow' && (
                            <OnboardingConcept
                              themePref={themePref}
                              onThemePref={setThemePref}
                              onLang={setLang}
                              onReady={result => {
                                setOnbResult(result);
                                if (result.habit) {
                                  goTab(1);
                                  // Habits may already be mounted: the tutorial
                                  // needs it fresh, at the top, with its new habit lit.
                                  setReplays(prev => ({
                                    ...prev,
                                    1: (prev[1] ?? 0) + 1,
                                  }));
                                  setOnboarding('ask');
                                } else {
                                  setOnboarding('later');
                                }
                              }}
                            />
                          )}
                          <OnboardingXp
                            xp={pendingXp}
                            onLanded={() => setPendingXp(0)}
                          />
                          <LaunchCurtain />
                          <LabPerfProbe />
                        </LabSystemProvider>
                      </LabMultiplierProvider>
                    </LabChallengeProvider>
                  </LabGoalsProvider>
                </LabJournalProvider>
              </LabTodayProvider>
            </LabCelebrationProvider>
          </LabXpProvider>
        </View>
      </IntroProvider>
    </LabThemeProvider>
  );
}

/**
 * One tab's page. Hidden tabs stay mounted but out of sight and out of reach;
 * they know they are hidden (useLabPageActive) so their loops can rest and an
 * overlay left open inside does not count as "something is open".
 *
 * GOING LIVE: nothing of this — expo-router's Tabs already keep screens alive and
 * detach the hidden ones natively. What converts is the RULE: the entrance plays
 * on a tab's first focus only (R-32).
 */
function LabPage({
  active,
  ownEntrance,
  children,
}: {
  active: boolean;
  ownEntrance: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[StyleSheet.absoluteFill, !active && styles.pageHidden]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    >
      <LabPageActiveProvider value={active}>
        {ownEntrance ? (
          <IntroProvider kind="settle" playKey={0}>
            {children}
          </IntroProvider>
        ) : (
          children
        )}
      </LabPageActiveProvider>
    </View>
  );
}

/**
 * The level badge and what comes out of it: its panel (a tap), the quiet trophy
 * note and the "LEVEL UP" tag. Same place on every screen, stays while pages scroll.
 */
function BadgeLayer({
  closeKey,
  onOpenTrophies,
  onOpenLevels,
}: {
  /** The tab and the intro on screen: a new one closes the level panel. */
  closeKey: string;
  onOpenTrophies: () => void;
  onOpenLevels: () => void;
}) {
  const panel = useLevelPanel(closeKey);
  return (
    <>
      {/* Under the badge: the ring of the open panel is the badge itself. */}
      {panel.shown && <LevelPanel panel={panel} onOpenLevels={onOpenLevels} />}
      <View style={styles.badgePin} pointerEvents="box-none">
        <View
          style={[contentColumn, styles.badgeColumn]}
          pointerEvents="box-none"
        >
          <BadgeEntrance panel={panel} />
          {/* Quiet trophies slide out of the badge (R-29). */}
          <View style={styles.notePin} pointerEvents="box-none">
            <CelebrationNoteOutlet onOpenTrophies={onOpenTrophies} />
          </View>
        </View>
      </View>
    </>
  );
}

/** The badge enters with the header in the intro, then never moves again. */
function BadgeEntrance({ panel }: { panel: LevelPanelControl }) {
  const { timeline } = useIntro();
  const { lang } = useLab();
  const text = MOCK_COPY[lang].levelPanel;
  const multiplier = useLabMultiplier();
  const { status, print } = multiplier;
  const kind = badgeMark(status);
  const mark =
    kind === 'tag' && status.kind === 'running'
      ? {
          kind,
          factor: print(status.factor),
          label: text.badgeRunning(print(status.factor)),
        }
      : kind === 'dot'
        ? {
            kind,
            label: text.badgeReady(
              print(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER)
            ),
          }
        : null;
  return (
    // Sized to the badge and see-through around it: it sits over every page, and a
    // full-width wrapper swallowed the taps on the close buttons under it (kolo 14).
    <Rise
      window={timeline.header}
      distance={8}
      scaleFrom={0.8}
      pointerEvents="box-none"
      style={{ alignSelf: 'flex-start' }}
    >
      <LevelBadge
        onPress={panel.onBadgePress}
        openness={panel.progress}
        open={panel.shown}
        tagTappable={panel.canOpen}
        mark={mark}
      />
    </Rise>
  );
}

/** Light icons while the dark curtain is up, then whatever the lab's palette needs. */
function LabStatusBar({ mode }: { mode: LabMode }) {
  const { timeline, done } = useIntro();
  const overCurtain = timeline.curtain && !done;
  return (
    <StatusBar style={overCurtain || mode === 'dark' ? 'light' : 'dark'} />
  );
}

function LabToolbar({
  topInset,
  reducedMotion,
  scenario,
  onScenario,
  showFps,
  crown,
  onToggleCrown,
  onToggleMode,
  onToggleLang,
  onToggleFps,
  onLaunch,
  onSettle,
}: {
  topInset: number;
  reducedMotion: boolean;
  scenario: string | null;
  onScenario: (label: string) => void;
  showFps: boolean;
  crown: boolean;
  onToggleCrown: () => void;
  onToggleMode: () => void;
  onToggleLang: () => void;
  onToggleFps: () => void;
  onLaunch: () => void;
  onSettle: () => void;
}) {
  const { c, mode, lang } = useLab();
  const scenarios = useLabScenarios();
  const nextScenario = React.useRef(0);
  return (
    <View
      style={[
        styles.toolbar,
        {
          paddingTop: topInset + 6,
          backgroundColor: c.canvas,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={[contentColumn, styles.toolbarInner]}>
        <ToolButton
          icon="arrow-back"
          label="Back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)')
          }
        />
        <View style={{ flex: 1, marginLeft: labSpace.xs }}>
          <LabText variant="overline" tone="primary" numberOfLines={1}>
            Lab
          </LabText>
          <LabText variant="caption" tone="muted" numberOfLines={1}>
            {[reducedMotion ? 'no motion' : 'mock', scenario]
              .filter(Boolean)
              .join(' · ')}
          </LabText>
        </View>
        <ToolButton
          icon={mode === 'dark' ? 'moon' : 'sunny'}
          label="Light or dark"
          onPress={onToggleMode}
        />
        <ToolButton
          text={lang.toUpperCase()}
          label="Language"
          onPress={onToggleLang}
        />
        <ToolButton
          icon="sparkles"
          label="Crown layer"
          onPress={onToggleCrown}
          active={crown}
        />
        <ToolButton
          icon="speedometer-outline"
          label="FPS monitor"
          onPress={onToggleFps}
          active={showFps}
        />
        <ToolButton
          icon="play"
          label="Play the app launch"
          onPress={onLaunch}
        />
        <ToolButton
          icon="refresh"
          label="Play the quick entrance"
          onPress={onSettle}
        />
        <ToolButton
          icon="trophy"
          label="Unlock achievements: next scenario"
          onPress={() => {
            const i = nextScenario.current % scenarios.length;
            const next = scenarios[i];
            nextScenario.current += 1;
            if (!next) return;
            onScenario(`${i + 1}/${scenarios.length} ${next.label}`);
            next.play();
          }}
        />
      </View>
    </View>
  );
}

function ToolButton({
  icon,
  text,
  label,
  onPress,
  active = false,
}: {
  icon?: IoniconName;
  text?: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      pressScale={0.9}
      style={[
        styles.toolButton,
        {
          backgroundColor: active ? c.primarySoft : c.surface,
          borderColor: c.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={17} color={active ? c.primary : c.text} />
      ) : (
        <LabText variant="caption" style={{ fontFamily: labFonts.bold }}>
          {text}
        </LabText>
      )}
    </PressableScale>
  );
}

/** Where the AdMob banner and the tab bar sit — the proposal must leave them room. */
function BottomChrome({
  bottomInset,
  activeTab,
  onSelectTab,
}: {
  bottomInset: number;
  activeTab: number;
  onSelectTab: (index: number) => void;
}) {
  const { c, lang, mode } = useLab();
  const copy = MOCK_COPY[lang];
  const tabWidth = useSharedValue(0);
  const indicatorX = useSharedValue(activeTab);

  // Follows the active tab from any source (a tap, or "play launch" returning to Home).
  useEffect(() => {
    indicatorX.value = withSpring(activeTab, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  }, [activeTab, indicatorX]);

  // The active pill glides to the tapped tab (spring), instead of the colour jumping.
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: tabWidth.value > 0 ? 1 : 0,
    transform: [
      {
        translateX:
          indicatorX.value * tabWidth.value +
          (tabWidth.value - TAB_PILL_WIDTH) / 2,
      },
    ],
  }));

  return (
    <View style={styles.bottom} pointerEvents="box-none">
      {/* Content fades out above the banner instead of being cut off. */}
      <LinearGradient
        colors={['transparent', c.canvas]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View style={{ backgroundColor: c.canvas, paddingVertical: labSpace.sm }}>
        <View style={[contentColumn, { paddingHorizontal: labSpace.lg }]}>
          <View style={[styles.adSlot, { borderColor: c.textFaint }]}>
            <LabText variant="caption" tone="muted">
              {copy.adSlot}
            </LabText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: c.tabBar,
            borderTopColor: c.border,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <View
          style={[contentColumn, styles.tabRow]}
          onLayout={e => {
            tabWidth.value = e.nativeEvent.layout.width / TAB_ICONS.length;
          }}
        >
          <Animated.View
            style={[
              styles.tabPill,
              styles.tabIndicator,
              { backgroundColor: c.primarySoft },
              indicatorStyle,
            ]}
          />
          {TAB_ICONS.map((icon, i) => {
            const active = i === activeTab;
            return (
              <PressableScale
                key={icon}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={copy.tabs[i] ?? ''}
                pressScale={0.92}
                onPress={() => onSelectTab(i)}
                style={styles.tab}
              >
                <View style={styles.tabPill}>
                  <SignatureIcon
                    name={icon}
                    size={23}
                    tones={
                      active
                        ? [c.primary, mode === 'light' ? '#F4A93F' : '#FFC24A']
                        : [c.textFaint, c.textFaint]
                    }
                  />
                </View>
                <LabText
                  variant="caption"
                  tone={active ? 'primary' : 'muted'}
                  numberOfLines={1}
                  style={[
                    { marginTop: 2 },
                    active && { fontFamily: labFonts.semibold },
                  ]}
                >
                  {copy.tabs[i]}
                </LabText>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: labSpace.sm,
    paddingHorizontal: labSpace.md,
  },
  toolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHidden: {
    opacity: 0,
  },
  badgePin: {
    position: 'absolute',
    top: LEVEL_BADGE_PIN.top,
    left: 0,
    right: 0,
  },
  badgeColumn: {
    paddingHorizontal: LEVEL_BADGE_PIN.left,
  },
  notePin: {
    position: 'absolute',
    top: 0,
    left: LEVEL_BADGE_PIN.left + 48 + labSpace.sm,
    right: labSpace.xl,
  },
  fps: {
    position: 'absolute',
    left: labSpace.lg,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    height: 28,
  },
  adSlot: {
    height: BANNER_HEIGHT,
    borderRadius: labRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    width: TAB_PILL_WIDTH,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
  },
});
