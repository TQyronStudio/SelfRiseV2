/**
 * Smaller pieces of the Journal page (migration E12, from the Design Lab's
 * JournalConcept): the two writing tiles, the daily inspiration and the empty
 * day.
 *
 * - A tile shows what the next entry earns (journalPositionXp — the storage's
 *   own rule) with its milestone icon. Locked (a frozen streak, R-14) it shows a
 *   lock and earns nothing until the streak is warm.
 * - The daily inspiration is the app's own quotes (motivationalQuotes), one a
 *   day per language, with "another quote". It always stands above today's
 *   entries (technical-guides:My-Journal.md).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import {
  getDailyQuote,
  getRandomQuoteFromCategory,
  MotivationalQuote,
} from '@/src/data/motivationalQuotes';
import { fonts, Palette, radius, space, withAlpha } from '@/src/design/tokens';
import { journalMilestoneAt, journalPositionXp } from '@/src/utils/journalXp';
import {
  AppText,
  IconBadge,
  InlineIcon,
  PressableScale,
  Surface,
} from '@/src/components/ui';
import { EntryType, typeLook } from './EntryCard';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function WriteTile({
  type,
  nextPosition,
  locked,
  onPress,
}: {
  type: EntryType;
  nextPosition: number;
  locked: boolean;
  onPress: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const look = typeLook(c, type);
  const xp = journalPositionXp(nextPosition);
  const kind = journalMilestoneAt(nextPosition);
  return (
    <PressableScale
      onPress={onPress}
      // A locked tile answers with a warning (the page plays it).
      feel={locked ? null : 'tap'}
      pressScale={0.97}
      accessibilityLabel={
        type === 'gratitude'
          ? t('journal.input.addGratitudeTitle')
          : t('journal.input.addSelfPraiseTitle')
      }
      style={styles.flex}
    >
      <Surface style={[styles.tile, locked && styles.locked]}>
        <View style={styles.tileHead}>
          <IconBadge icon={locked ? 'lock-closed' : look.icon} color={look.fill} size={40} />
          <View style={styles.flex} />
          {!locked && xp > 0 && (
            <AppText
              variant="caption"
              tone="reward"
              style={styles.semibold}
              accessibilityLabel={`${t('achievements.card.xpReward', { xp })}${
                kind ? ` ${t(`journal.iconNames.${kind}`)}` : ''
              }`}
            >
              {`+${xp}`}
              {kind ? (
                <>
                  {' '}
                  <InlineIcon name={kind} />
                </>
              ) : null}
            </AppText>
          )}
        </View>
        <AppText variant="bodyStrong" style={styles.tileName} numberOfLines={1}>
          {type === 'gratitude'
            ? t('journal.input.typeGratitude')
            : t('journal.input.typeSelfPraise')}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {type === 'gratitude'
            ? t('journal.write.gratitudeHint')
            : t('journal.write.selfPraiseHint')}
        </AppText>
      </Surface>
    </PressableScale>
  );
}

const QUOTE_CATEGORIES: MotivationalQuote['category'][] = [
  'motivation',
  'gratitude',
  'habits',
  'goals',
  'achievement',
  'level',
  'streak',
  'consistency',
  'growth',
];

function quoteLook(
  c: Palette,
  category: MotivationalQuote['category']
): { icon: IconName; color: string } {
  switch (category) {
    case 'gratitude':
      return { icon: 'heart', color: c.habit.pink };
    case 'habits':
    case 'consistency':
      return { icon: 'checkmark-circle', color: c.habit.green };
    case 'goals':
      return { icon: 'flag', color: c.habit.orange };
    case 'achievement':
      return { icon: 'trophy', color: c.rewardText };
    case 'level':
      return { icon: 'trending-up', color: c.primary };
    case 'streak':
      return { icon: 'flame', color: c.flame };
    case 'growth':
      return { icon: 'leaf', color: c.habit.teal };
    default:
      return { icon: 'flash', color: c.habit.purple };
  }
}

export function QuoteCard({ today }: { today: string }) {
  const { c } = useDesign();
  const { t, currentLanguage } = useI18n();
  const language = currentLanguage as 'en' | 'de' | 'es';
  const [quote, setQuote] = useState(() => getDailyQuote(today, language));
  useEffect(() => {
    setQuote(getDailyQuote(today, language));
  }, [today, language]);
  const look = quoteLook(c, quote.category);

  return (
    <Surface style={styles.quote}>
      <View style={styles.quoteHead}>
        <Ionicons name={look.icon} size={16} color={look.color} />
        <AppText variant="overline" tone="muted" style={styles.quoteTitle}>
          {t('home.dailyQuote')}
        </AppText>
        <PressableScale
          pressScale={0.85}
          accessibilityLabel={t('journal.quote.another')}
          onPress={() => {
            const category =
              QUOTE_CATEGORIES[Math.floor(Math.random() * QUOTE_CATEGORIES.length)] ??
              'motivation';
            setQuote(getRandomQuoteFromCategory(category, language));
          }}
          style={[styles.quoteRefresh, { backgroundColor: c.track }]}
        >
          <Ionicons name="refresh" size={15} color={c.textMuted} />
        </PressableScale>
      </View>
      <Animated.View key={quote.id} entering={FadeIn.duration(360)}>
        <AppText variant="streak" style={[styles.quoteMark, { color: look.color }]}>
          “
        </AppText>
        <AppText variant="title" italic style={styles.quoteText}>
          {quote.text}
        </AppText>
        {quote.author && (
          <AppText variant="label" tone="muted" style={styles.author}>
            {`— ${quote.author}`}
          </AppText>
        )}
        <View style={[styles.categoryTag, { backgroundColor: withAlpha(look.color, 0.12) }]}>
          <AppText variant="caption" style={[styles.semibold, { color: look.color }]}>
            {t(`home.quoteCategories.${quote.category}`)}
          </AppText>
        </View>
      </Animated.View>
    </Surface>
  );
}

export function EmptyDay() {
  const { c } = useDesign();
  const { t } = useI18n();
  return (
    <View style={[styles.empty, { borderColor: c.textFaint }]}>
      <AppText variant="title" italic>
        {t('journal.empty.title')}
      </AppText>
      <AppText variant="body" tone="muted" style={styles.emptyBody}>
        {t('journal.empty.body')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  semibold: {
    fontFamily: fonts.semibold,
  },
  tile: {
    padding: space.lg,
  },
  locked: {
    opacity: 0.5,
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tileName: {
    marginTop: space.md,
  },
  quote: {
    marginTop: space.lg,
  },
  quoteHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteTitle: {
    marginLeft: space.sm,
    flex: 1,
  },
  quoteRefresh: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteMark: {
    marginTop: space.xs,
  },
  quoteText: {
    marginTop: -18,
  },
  author: {
    marginTop: space.sm,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    marginTop: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  empty: {
    marginTop: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyBody: {
    marginTop: space.sm,
  },
});
