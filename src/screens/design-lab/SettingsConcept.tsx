/**
 * Settings concept for the Design Lab (premium-design-plan.md, F1, kolo 28).
 *
 * Everything today's Settings does, in fewer screens' worth of rows:
 *   - Reminders: afternoon / evening, a switch and a time on one row.
 *   - Appearance: three small previews instead of three radio rows — tapping one
 *     really switches the lab.
 *   - Language: one segmented row instead of three radio rows (switches the lab;
 *     Español exists in the app only, the lab has no Spanish copy).
 *   - Haptics, How SelfRise works, Restart tutorial (confirm), Privacy.
 *   - The version at the very bottom, for support.
 *
 * Time picker: the same native picker as today's NotificationSettings — in a sheet
 * on iOS, its own dialog on Android.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces app/(tabs)/settings.tsx + NotificationSettings.tsx. The logic stays:
 *   ThemeContext, setLanguage, notificationService (and its permission banner —
 *   notifications.disabled / enablePrompt — which must stay above the rows),
 *   hapticsService, the tutorial reset, adConsentService.
 * - "Privacy Settings" only when isPrivacyOptionsRequired() says so (GDPR regions);
 *   the lab always shows it. Play/App Store expect it reachable — do not drop it.
 * - Developer rows (Marketing Demo, Design Lab) stay dev-only below the sections.
 * - Reactions on the native driver (lesson 46); RN Switch is native already.
 */
import React, { useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { selection } from '@/src/services/hapticsService';
import { PRIVACY_POLICY_URL } from '@/src/constants/legal';
import { contentColumn } from '@/src/utils/layout';
import {
  Divider,
  IconBadge,
  LabText,
  PressableScale,
  Rise,
  Surface,
  useLab,
} from './labPrimitives';
import {
  labFonts,
  LabMode,
  labPalettes,
  labRadius,
  labSpace,
} from './labTokens';
import { useIntro } from './introTimeline';
import {
  ScrollCard,
  ScrollFrameProvider,
  useLabScrollFrame,
} from './scrollChoreography';
import { LabLang, MOCK_COPY } from './mockCopy';
import { BottomSheet, ConfirmSheet, useJournalT } from './journalParts';
import { UndoToast } from './goalParts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type ThemePref = 'light' | 'dark' | 'system';

interface Reminder {
  on: boolean;
  hour: number;
  minute: number;
}

export function SettingsConcept({
  bottomInset,
  themePref,
  onThemePref,
  onLang,
  onRestartTutorial,
}: {
  bottomInset: number;
  themePref: ThemePref;
  onThemePref: (pref: ThemePref) => void;
  onLang: (lang: LabLang) => void;
  onRestartTutorial: () => void;
}) {
  const { c, lang, crown } = useLab();
  const { timeline } = useIntro();
  const copy = MOCK_COPY[lang];
  const t = useJournalT();
  const { frame, onScroll, onLayout } = useLabScrollFrame(bottomInset, crown);

  const [afternoon, setAfternoon] = useState<Reminder>({
    on: true,
    hour: 16,
    minute: 0,
  });
  const [evening, setEvening] = useState<Reminder>({
    on: true,
    hour: 20,
    minute: 0,
  });
  const [picking, setPicking] = useState<'afternoon' | 'evening' | null>(null);
  const [haptics, setHaptics] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(
    null
  );
  const say = (text: string) => setToast({ key: Date.now(), text });

  const section = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;

  const version = Constants.expoConfig?.version ?? '';
  const pickingReminder = picking === 'afternoon' ? afternoon : evening;
  const setPicked = (hour: number, minute: number) => {
    const update = picking === 'afternoon' ? setAfternoon : setEvening;
    update(prev => ({ ...prev, hour, minute }));
  };

  return (
    <ScrollFrameProvider value={frame}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <RNAnimated.ScrollView
          style={{ flex: 1 }}
          onLayout={onLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            contentColumn,
            {
              paddingHorizontal: labSpace.xl,
              paddingBottom: bottomInset + labSpace.xxl,
            },
          ]}
        >
          <View style={styles.topSpace} />
          <Rise window={timeline.header}>
            <LabText variant="display">{t('settings.title')}</LabText>
            <LabText
              variant="body"
              tone="muted"
              italic
              style={{ marginTop: 2 }}
            >
              {copy.settings.subline}
            </LabText>
          </Rise>

          {/* Reminders */}
          <ScrollCard>
            <Rise window={section(0)}>
              <Title text={t('settings.notifications')} />
              <Surface style={styles.group}>
                <ReminderRow
                  icon="sunny-outline"
                  color={c.habit.orange}
                  title={t('notifications.afternoonReminder')}
                  description={t('notifications.afternoonDescription')}
                  value={afternoon}
                  onToggle={on => setAfternoon(prev => ({ ...prev, on }))}
                  onTime={() => setPicking('afternoon')}
                />
                <Divider style={styles.rowDivider} />
                <ReminderRow
                  icon="moon-outline"
                  color={c.habit.purple}
                  title={t('notifications.eveningReminder')}
                  description={t('notifications.eveningDescription')}
                  value={evening}
                  onToggle={on => setEvening(prev => ({ ...prev, on }))}
                  onTime={() => setPicking('evening')}
                />
              </Surface>
            </Rise>
          </ScrollCard>

          {/* Appearance */}
          <ScrollCard>
            <Rise window={section(1)}>
              <Title text={t('settings.appearance')} />
              <View style={styles.themes}>
                <ThemeTile
                  pref="light"
                  label={t('settings.lightMode')}
                  selected={themePref === 'light'}
                  onPress={() => onThemePref('light')}
                />
                <ThemeTile
                  pref="dark"
                  label={t('settings.darkMode')}
                  selected={themePref === 'dark'}
                  onPress={() => onThemePref('dark')}
                />
                <ThemeTile
                  pref="system"
                  label={t('settings.systemAuto')}
                  selected={themePref === 'system'}
                  onPress={() => onThemePref('system')}
                />
              </View>
            </Rise>
          </ScrollCard>

          {/* Language */}
          <ScrollCard>
            <Rise window={section(2)}>
              <Title text={t('settings.language')} />
              <View style={[styles.segment, { backgroundColor: c.track }]}>
                {(
                  [
                    ['en', t('settings.languageEnglish')],
                    ['de', t('settings.languageGerman')],
                    ['es', t('settings.languageSpanish')],
                  ] as const
                ).map(([key, label]) => {
                  const on = key === lang;
                  const available = key !== 'es';
                  return (
                    <PressableScale
                      key={key}
                      pressScale={0.96}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={label}
                      onPress={() =>
                        available
                          ? onLang(key as LabLang)
                          : say(copy.settings.labLanguages)
                      }
                      style={[
                        styles.segmentItem,
                        on && { backgroundColor: c.surface },
                      ]}
                    >
                      <LabText
                        variant="label"
                        style={{
                          fontFamily: labFonts.semibold,
                          color: on
                            ? c.text
                            : available
                              ? c.textMuted
                              : c.textFaint,
                        }}
                      >
                        {label}
                      </LabText>
                    </PressableScale>
                  );
                })}
              </View>
            </Rise>
          </ScrollCard>

          {/* Feedback + help */}
          <ScrollCard>
            <Rise window={section(3)}>
              <Title text={t('settings.feedback')} />
              <Surface style={styles.group}>
                <Row
                  icon="pulse-outline"
                  color={c.primary}
                  title={t('settings.hapticFeedback')}
                  description={t('settings.hapticFeedbackDescription')}
                  trailing={
                    <LabSwitch
                      value={haptics}
                      label={t('settings.hapticFeedback')}
                      onChange={next => {
                        setHaptics(next);
                        if (next) selection();
                      }}
                    />
                  }
                />
              </Surface>

              <Title text={t('settings.tutorial')} />
              <Surface style={styles.group}>
                <Row
                  icon="compass-outline"
                  color={c.habit.teal}
                  title={t('settings.howItWorks')}
                  description={t('settings.howItWorksDescription')}
                  onPress={() => router.push('/how-it-works' as never)}
                />
                <Divider style={styles.rowDivider} />
                <Row
                  icon="refresh-outline"
                  color={c.habit.green}
                  title={t('settings.tutorialReset')}
                  description={t('settings.tutorialResetDescription')}
                  onPress={() => setConfirmReset(true)}
                />
              </Surface>
            </Rise>
          </ScrollCard>

          {/* Privacy */}
          <ScrollCard>
            <Rise window={section(4)}>
              <Title text={t('settings.privacy')} />
              <Surface style={styles.group}>
                <Row
                  icon="shield-checkmark-outline"
                  color={c.habit.blue}
                  title={t('settings.privacyPolicy')}
                  description={t('settings.privacyPolicyDescription')}
                  external
                  onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
                />
                <Divider style={styles.rowDivider} />
                <Row
                  icon="options-outline"
                  color={c.textMuted}
                  title={t('settings.privacySettings')}
                  description={t('settings.privacySettingsDescription')}
                  onPress={() => say(copy.settings.privacyLab)}
                />
              </Surface>
              <LabText variant="caption" tone="faint" style={styles.version}>
                {`SelfRise · ${t('settings.version')} ${version}`}
              </LabText>
            </Rise>
          </ScrollCard>
        </RNAnimated.ScrollView>

        {picking && Platform.OS === 'ios' && (
          <BottomSheet
            bottomInset={bottomInset}
            onClosed={() => setPicking(null)}
            label={t('common.close')}
          >
            {dismiss => (
              <TimeSheet
                title={
                  picking === 'afternoon'
                    ? t('notifications.afternoonReminder')
                    : t('notifications.eveningReminder')
                }
                reminder={pickingReminder}
                onChange={setPicked}
                onDone={() => dismiss()}
              />
            )}
          </BottomSheet>
        )}
        {picking && Platform.OS !== 'ios' && (
          // On Android the picker is its own system dialog.
          <DateTimePicker
            mode="time"
            value={
              new Date(2026, 0, 1, pickingReminder.hour, pickingReminder.minute)
            }
            onChange={(event, date) => {
              setPicking(null);
              if (event.type === 'set' && date) {
                setPicked(date.getHours(), date.getMinutes());
              }
            }}
          />
        )}

        {confirmReset && (
          <ConfirmSheet
            title={t('settings.tutorialResetConfirmTitle')}
            message={t('settings.tutorialResetConfirmMessage')}
            confirm={t('settings.reset')}
            icon="refresh"
            bottomInset={bottomInset}
            onClosed={() => setConfirmReset(false)}
            onConfirm={onRestartTutorial}
          />
        )}

        {toast && (
          <UndoToast
            key={toast.key}
            message={toast.text}
            bottomInset={bottomInset}
            onUndo={null}
            onGone={() => setToast(null)}
          />
        )}
      </View>
    </ScrollFrameProvider>
  );
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function Title({ text }: { text: string }) {
  return (
    <LabText variant="overline" tone="muted" style={styles.title}>
      {text}
    </LabText>
  );
}

function LabSwitch({
  value,
  label,
  onChange,
}: {
  value: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const { c } = useLab();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: c.track, true: c.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.track}
    />
  );
}

function Row({
  icon,
  color,
  title,
  description,
  trailing,
  external = false,
  onPress,
}: {
  icon: IoniconName;
  color: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  external?: boolean;
  onPress?: () => void;
}) {
  const { c } = useLab();
  const body = (
    <>
      <IconBadge icon={icon} color={color} size={36} />
      <View style={styles.rowText}>
        <LabText variant="bodyStrong">{title}</LabText>
        {description && (
          <LabText variant="caption" tone="muted">
            {description}
          </LabText>
        )}
      </View>
      {trailing ??
        (onPress && (
          <Ionicons
            name={external ? 'open-outline' : 'chevron-forward'}
            size={18}
            color={c.textFaint}
          />
        ))}
    </>
  );
  return onPress ? (
    <PressableScale
      onPress={onPress}
      pressScale={0.985}
      accessibilityLabel={title}
      style={styles.row}
    >
      {body}
    </PressableScale>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}

function ReminderRow({
  icon,
  color,
  title,
  description,
  value,
  onToggle,
  onTime,
}: {
  icon: IoniconName;
  color: string;
  title: string;
  description: string;
  value: Reminder;
  onToggle: (on: boolean) => void;
  onTime: () => void;
}) {
  const { c } = useLab();
  const time = `${String(value.hour).padStart(2, '0')}:${String(
    value.minute
  ).padStart(2, '0')}`;
  return (
    <View>
      <Row
        icon={icon}
        color={color}
        title={title}
        description={description}
        trailing={
          <LabSwitch value={value.on} label={title} onChange={onToggle} />
        }
      />
      {value.on && (
        <PressableScale
          onPress={onTime}
          pressScale={0.96}
          accessibilityLabel={`${title} ${time}`}
          style={[styles.timePill, { backgroundColor: c.track }]}
        >
          <Ionicons name="time-outline" size={15} color={c.textMuted} />
          <LabText
            variant="label"
            style={{ marginLeft: 6, fontFamily: labFonts.semibold }}
          >
            {time}
          </LabText>
        </PressableScale>
      )}
    </View>
  );
}

function TimeSheet({
  title,
  reminder,
  onChange,
  onDone,
}: {
  title: string;
  reminder: Reminder;
  onChange: (hour: number, minute: number) => void;
  onDone: () => void;
}) {
  const { mode } = useLab();
  const t = useJournalT();
  const value = useRef(
    new Date(2026, 0, 1, reminder.hour, reminder.minute)
  ).current;
  return (
    <>
      <LabText variant="titleSm">{title}</LabText>
      <DateTimePicker
        mode="time"
        display="spinner"
        value={value}
        themeVariant={mode}
        onChange={(_event, date) => {
          if (date) onChange(date.getHours(), date.getMinutes());
        }}
        style={{ alignSelf: 'stretch' }}
      />
      <DoneButton label={t('common.ok')} onPress={onDone} />
    </>
  );
}

function DoneButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={styles.done}
    >
      <LinearGradient
        colors={c.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: labRadius.pill }]}
      />
      <LabText variant="bodyStrong" tone="onPrimary">
        {label}
      </LabText>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Theme tiles — a tiny screen in each theme's real colours
// ---------------------------------------------------------------------------

function MiniScreen({ theme }: { theme: LabMode }) {
  const p = labPalettes[theme];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.canvas }]}>
      <View
        style={[
          styles.miniCard,
          { backgroundColor: p.surface, borderColor: p.border },
        ]}
      >
        <View style={[styles.miniLine, { backgroundColor: p.text }]} />
        <View
          style={[styles.miniBar, { backgroundColor: p.primaryGradient[0] }]}
        />
      </View>
      <View
        style={[
          styles.miniCard,
          { backgroundColor: p.surface, borderColor: p.border, marginTop: 4 },
        ]}
      >
        <View style={[styles.miniLine, { backgroundColor: p.textFaint }]} />
      </View>
    </View>
  );
}

function ThemeTile({
  pref,
  label,
  selected,
  onPress,
}: {
  pref: ThemePref;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={onPress}
      pressScale={0.96}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={styles.themeTile}
    >
      <View
        style={[
          styles.themePreview,
          {
            borderColor: selected ? c.primary : c.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        {pref === 'system' ? (
          <>
            <MiniScreen theme="light" />
            <View style={styles.systemHalf}>
              <View style={styles.systemHalfInner}>
                <MiniScreen theme="dark" />
              </View>
            </View>
          </>
        ) : (
          <MiniScreen theme={pref} />
        )}
        {selected && (
          <View style={[styles.themeCheck, { backgroundColor: c.primary }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>
      <LabText
        variant="caption"
        numberOfLines={1}
        tone={selected ? 'text' : 'muted'}
        style={{
          marginTop: labSpace.sm,
          textAlign: 'center',
          fontFamily: selected ? labFonts.semibold : labFonts.medium,
        }}
      >
        {label}
      </LabText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topSpace: {
    height: 48 + labSpace.sm + labSpace.md,
  },
  title: {
    marginTop: labSpace.xxl,
    marginBottom: labSpace.sm,
    marginLeft: labSpace.xs,
  },
  group: {
    padding: 0,
    paddingHorizontal: labSpace.lg,
    borderRadius: labRadius.md + 6,
  },
  rowDivider: {
    marginLeft: 36 + labSpace.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.md,
    minHeight: 60,
  },
  rowText: {
    flex: 1,
    marginHorizontal: labSpace.md,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 36 + labSpace.md,
    marginBottom: labSpace.md,
    paddingHorizontal: labSpace.md,
    height: 34,
    borderRadius: labRadius.pill,
  },
  themes: {
    flexDirection: 'row',
    gap: labSpace.md,
  },
  themeTile: {
    flex: 1,
  },
  themePreview: {
    height: 88,
    borderRadius: labRadius.md,
    overflow: 'hidden',
    padding: 0,
  },
  miniCard: {
    marginHorizontal: 8,
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  miniLine: {
    width: '60%',
    height: 3,
    borderRadius: 1.5,
  },
  miniBar: {
    width: '85%',
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  systemHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%',
    overflow: 'hidden',
  },
  // Twice as wide and pinned right: the dark screen lines up with the light one.
  systemHalfInner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '200%',
  },
  themeCheck: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: labRadius.pill,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: labRadius.pill,
  },
  version: {
    textAlign: 'center',
    marginTop: labSpace.xl,
  },
  done: {
    height: 50,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
