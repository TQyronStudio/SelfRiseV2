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
 * - trophy: an achievement unlocks — each tap the next rarity (common → legendary);
 *   its XP flies into the level badge after "Continue" (xpFlight.tsx)
 * The level badge is pinned top-left on every lab page.
 * The subtitle says when the OS "reduce motion" setting is on (animations then jump
 * to their end state — that is the intended behaviour, not a bug).
 *
 * GOING LIVE: lab only — never in a store build (designLab.test.ts). Its toolbar
 * stays a development tool or is removed in F5.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
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
  Surface,
  useLab,
} from './labPrimitives';
import {
  labFontFiles,
  labFonts,
  LabMode,
  labMotion,
  labPalettes,
  labRadius,
  LabRarity,
  labSpace,
  SPLASH_BACKGROUND,
} from './labTokens';
import { LabLang, MOCK_COPY } from './mockCopy';
import { AchievementCelebrationConcept } from './AchievementCelebrationConcept';
import { LabXpProvider, LevelBadge } from './xpFlight';
import { LabTodayProvider } from './habitsMock';
import { HabitsConcept } from './HabitsConcept';

const RARITY_ORDER: LabRarity[] = ['common', 'rare', 'epic', 'legendary'];

const TAB_BAR_HEIGHT = 60;
const BANNER_HEIGHT = 50;
const TAB_PILL_WIDTH = 52;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: { active: IoniconName; idle: IoniconName }[] = [
  { active: 'home', idle: 'home-outline' },
  { active: 'repeat', idle: 'repeat-outline' },
  { active: 'book', idle: 'book-outline' },
  { active: 'locate', idle: 'locate-outline' },
  { active: 'settings', idle: 'settings-outline' },
];

export function DesignLabScreen() {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<LabMode>(isDark ? 'dark' : 'light');
  const [lang, setLang] = useState<LabLang>('en');
  const [intro, setIntro] = useState<{ kind: IntroKind; key: number }>({
    kind: 'launch',
    key: 0,
  });
  const [tab, setTab] = useState(0);
  const [showFps, setShowFps] = useState(false);
  const [crown, setCrown] = useState(true);
  const [celebration, setCelebration] = useState<{
    rarity: LabRarity;
    key: number;
  } | null>(null);
  const nextRarity = React.useRef(0);
  const [fontsLoaded, fontError] = useFonts(labFontFiles);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const c = labPalettes[mode];

  // Fonts load only here, so the rest of the app's startup is untouched. Until they
  // are in, the splash frame is shown — exactly where the launch starts.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }} />;
  }

  const bottomChrome =
    BANNER_HEIGHT + labSpace.sm * 2 + TAB_BAR_HEIGHT + insets.bottom;
  const play = (kind: IntroKind) =>
    setIntro(prev => ({ kind, key: prev.key + 1 }));

  return (
    <LabThemeProvider mode={mode} lang={lang} crown={crown}>
      <IntroProvider kind={intro.kind} playKey={intro.key}>
        <View style={{ flex: 1, backgroundColor: c.canvas }}>
          <LabXpProvider>
            <LabTodayProvider>
              <LabStatusBar mode={mode} />
              <LabToolbar
                topInset={insets.top}
                reducedMotion={reducedMotion}
                showFps={showFps}
                crown={crown}
                onToggleCrown={() => setCrown(v => !v)}
                onToggleMode={() =>
                  setMode(m => (m === 'dark' ? 'light' : 'dark'))
                }
                onToggleLang={() => setLang(l => (l === 'en' ? 'de' : 'en'))}
                onToggleFps={() => setShowFps(v => !v)}
                onLaunch={() => {
                  setTab(0);
                  play('launch');
                }}
                onSettle={() => play('settle')}
                onAchievement={() => {
                  const rarity =
                    RARITY_ORDER[nextRarity.current % RARITY_ORDER.length] ??
                    'common';
                  nextRarity.current += 1;
                  setCelebration(prev => ({
                    rarity,
                    key: (prev?.key ?? 0) + 1,
                  }));
                }}
              />

              {/* Pages cross-fade; the incoming one also runs the quick entrance. */}
              <View style={{ flex: 1 }}>
                <Animated.View
                  key={`${tab}-${intro.kind}-${intro.key}`}
                  entering={FadeIn.duration(labMotion.base)}
                  exiting={FadeOut.duration(labMotion.fast)}
                  style={StyleSheet.absoluteFill}
                >
                  {tab === 0 ? (
                    <HomeConcept bottomInset={bottomChrome} />
                  ) : tab === 1 ? (
                    <HabitsConcept bottomInset={bottomChrome} />
                  ) : (
                    <NextInLab title={MOCK_COPY[lang].tabs[tab] ?? ''} />
                  )}
                </Animated.View>

                {/* The level badge: same place on every screen, stays while pages scroll. */}
                <View style={styles.badgePin} pointerEvents="box-none">
                  <View
                    style={[contentColumn, styles.badgeColumn]}
                    pointerEvents="box-none"
                  >
                    <BadgeEntrance />
                  </View>
                </View>
              </View>

              <BottomChrome
                bottomInset={insets.bottom}
                activeTab={tab}
                onSelectTab={next => {
                  if (next === tab) return;
                  setTab(next);
                  play('settle');
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

              {celebration && (
                <AchievementCelebrationConcept
                  key={celebration.key}
                  rarity={celebration.rarity}
                  onClosed={() => setCelebration(null)}
                />
              )}

              <LaunchCurtain />
            </LabTodayProvider>
          </LabXpProvider>
        </View>
      </IntroProvider>
    </LabThemeProvider>
  );
}

/** The badge enters with the header in the intro, then never moves again. */
function BadgeEntrance() {
  const { timeline } = useIntro();
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
      <LevelBadge />
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
  showFps,
  crown,
  onToggleCrown,
  onToggleMode,
  onToggleLang,
  onToggleFps,
  onLaunch,
  onSettle,
  onAchievement,
}: {
  topInset: number;
  reducedMotion: boolean;
  showFps: boolean;
  crown: boolean;
  onToggleCrown: () => void;
  onToggleMode: () => void;
  onToggleLang: () => void;
  onToggleFps: () => void;
  onLaunch: () => void;
  onSettle: () => void;
  onAchievement: () => void;
}) {
  const { c, mode, lang } = useLab();
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
            {reducedMotion ? 'no motion' : 'mock'}
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
          label="Unlock an achievement"
          onPress={onAchievement}
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

/** Tabs other than Home: shows the page transition and the entrance, nothing more yet. */
function NextInLab({ title }: { title: string }) {
  const { c, lang } = useLab();
  const { timeline } = useIntro();
  return (
    <View
      style={[
        contentColumn,
        { paddingHorizontal: labSpace.xl, paddingTop: 72 },
      ]}
    >
      <Rise window={timeline.header} distance={18}>
        <LabText variant="display">{title}</LabText>
      </Rise>
      <Rise window={timeline.hero} scaleFrom={0.97}>
        <Surface
          style={{
            marginTop: labSpace.xxl,
            alignItems: 'center',
            paddingVertical: labSpace.xxxl,
          }}
        >
          <Ionicons
            name="color-palette-outline"
            size={32}
            color={c.textFaint}
          />
          <LabText
            variant="titleSm"
            italic
            style={{ marginTop: labSpace.md, textAlign: 'center' }}
          >
            {MOCK_COPY[lang].nextInLab}
          </LabText>
        </Surface>
      </Rise>
    </View>
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
  const { c, lang } = useLab();
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
                key={icon.active}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={copy.tabs[i] ?? ''}
                pressScale={0.92}
                onPress={() => onSelectTab(i)}
                style={styles.tab}
              >
                <View style={styles.tabPill}>
                  <Ionicons
                    name={active ? icon.active : icon.idle}
                    size={21}
                    color={active ? c.primary : c.textFaint}
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
  badgePin: {
    position: 'absolute',
    top: labSpace.sm,
    left: 0,
    right: 0,
  },
  badgeColumn: {
    paddingHorizontal: labSpace.xl,
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
