/**
 * One journal entry, and its "⋯" menu (migration E12, from the Design Lab's
 * journalParts). The number is the entry's place in its day, always 1..N — a
 * deletion renumbers the day. Bonus entries (4+) wear a gold rim and a BONUS
 * tag; the ⭐ 🔥 👑 positions show their icon in the tag (the icon is drawn, the
 * text carries no emoji — E12/7).
 */
import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, Palette, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { journalMilestoneAt, JOURNAL_DAILY_GOAL } from '@/src/utils/journalXp';
import {
  AppText,
  BottomSheet,
  InlineIcon,
  PressableScale,
  RollingNumber,
} from '@/src/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type EntryType = 'gratitude' | 'self-praise';

/** Gratitude = our blue, self-praise = green — the app's existing identities. */
export function typeLook(c: Palette, type: EntryType) {
  return type === 'gratitude'
    ? { fg: c.primary, soft: c.primarySoft, fill: c.primary, icon: 'heart' as IconName }
    : { fg: c.successText, soft: c.successSoft, fill: c.success, icon: 'sparkles' as IconName };
}

interface EntryCardProps {
  id: string;
  type: EntryType;
  text: string;
  time: string;
  /** 1-based place in its day. */
  position: number;
  /** Just written: glows twice in its type's colour as it arrives. */
  fresh: boolean;
  /** Shown above the text (search results span many days). */
  dateLabel?: string;
  /** Search term to pick out in the text. */
  term?: string;
  onMore: (id: string) => void;
}

export const EntryCard = memo(function EntryCard({
  id,
  type,
  text,
  time,
  position,
  fresh,
  dateLabel,
  term = '',
  onMore,
}: EntryCardProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const look = typeLook(c, type);
  const bonus = position > JOURNAL_DAILY_GOAL;
  const milestone = journalMilestoneAt(position);

  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      260,
      withSequence(
        withTiming(1, { duration: 240 }),
        withTiming(0.25, { duration: 300 }),
        withTiming(1, { duration: 240 }),
        withTiming(0, { duration: 700 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  return (
    <View style={[styles.entry, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glow,
          { borderColor: look.fill, backgroundColor: look.soft },
          arriveStyle,
        ]}
      />
      <View style={styles.head}>
        <View
          style={[
            styles.number,
            { backgroundColor: look.soft },
            bonus && { borderWidth: 1.5, borderColor: c.reward },
          ]}
        >
          <RollingNumber
            text={`${position}`}
            variant="caption"
            style={{ color: look.fg, fontFamily: fonts.bold }}
          />
        </View>
        <Ionicons name={look.icon} size={13} color={look.fg} style={styles.typeIcon} />
        <AppText variant="caption" style={[styles.typeName, { color: look.fg }]}>
          {type === 'gratitude'
            ? t('journal.input.typeGratitude')
            : t('journal.input.typeSelfPraise')}
        </AppText>
        {bonus && (
          <View style={[styles.bonusTag, { backgroundColor: c.rewardSoft }]}>
            <AppText
              variant="micro"
              tone="reward"
              style={styles.semibold}
              accessibilityLabel={
                milestone
                  ? `${t(`journal.iconNames.${milestone}`)} ${t('gratitude.bonus.label')}`
                  : t('gratitude.bonus.label')
              }
            >
              {milestone ? (
                <>
                  <InlineIcon name={milestone} /> {t('gratitude.bonus.label')}
                </>
              ) : (
                t('gratitude.bonus.label')
              )}
            </AppText>
          </View>
        )}
        <View style={styles.flex} />
        <AppText variant="caption" tone="faint">
          {time}
        </AppText>
        <PressableScale
          onPress={() => {
            feel('tap');
            onMore(id);
          }}
          feel={null}
          pressScale={0.85}
          accessibilityLabel={t('habits.list.more')}
          style={styles.more}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
        </PressableScale>
      </View>
      {dateLabel && (
        <AppText variant="overline" tone="muted" style={styles.text}>
          {dateLabel}
        </AppText>
      )}
      <AppText variant="body" style={styles.text}>
        <Highlighted text={text} term={term} />
      </AppText>
    </View>
  );
});

/** Text with the search term picked out (case-insensitive). */
function Highlighted({ text, term }: { text: string; term: string }) {
  const { c } = useDesign();
  const needle = term.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const parts: { s: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at === -1) {
      parts.push({ s: text.slice(i), hit: false });
      break;
    }
    if (at > i) parts.push({ s: text.slice(i, at), hit: false });
    parts.push({ s: text.slice(at, at + needle.length), hit: true });
    i = at + needle.length;
  }
  return (
    <>
      {parts.map((part, k) =>
        part.hit ? (
          <Text
            key={k}
            style={{ fontFamily: fonts.semibold, color: c.primary, backgroundColor: c.primarySoft }}
          >
            {part.s}
          </Text>
        ) : (
          <Text key={k}>{part.s}</Text>
        )
      )}
    </>
  );
}

/** "⋯" on an entry → Edit / Delete. */
export function EntryActionsSheet({
  text,
  bottomInset,
  onClosed,
  onEdit,
  onDelete,
}: {
  text: string;
  bottomInset: number;
  onClosed: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const rows: { icon: IconName; label: string; color: string; run: () => void }[] = [
    { icon: 'create-outline', label: t('common.edit'), color: c.text, run: onEdit },
    { icon: 'trash-outline', label: t('common.delete'), color: c.danger, run: onDelete },
  ];
  return (
    <BottomSheet bottomInset={bottomInset} onClosed={onClosed} label={t('common.cancel')}>
      {dismiss => (
        <>
          <AppText variant="body" tone="muted" numberOfLines={2} italic style={styles.quote}>
            {`“${text}”`}
          </AppText>
          {rows.map(row => (
            <PressableScale
              key={row.label}
              feel="tap"
              pressScale={0.98}
              accessibilityLabel={row.label}
              onPress={() => dismiss(row.run)}
              style={[styles.sheetRow, { borderColor: c.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.color} />
              <AppText variant="bodyStrong" style={[styles.rowLabel, { color: row.color }]}>
                {row.label}
              </AppText>
            </PressableScale>
          ))}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  semibold: {
    fontFamily: fonts.semibold,
  },
  entry: {
    padding: space.lg,
    paddingTop: space.md,
    borderRadius: radius.md + 4,
    borderWidth: 1,
  },
  glow: {
    borderRadius: radius.md + 3,
    borderWidth: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    marginLeft: space.sm,
  },
  typeName: {
    marginLeft: 4,
    fontFamily: fonts.semibold,
  },
  bonusTag: {
    marginLeft: space.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  more: {
    width: 36,
    height: 36,
    marginLeft: 2,
    marginRight: -space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: space.sm,
  },
  quote: {
    marginBottom: space.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    marginLeft: space.md,
  },
});
