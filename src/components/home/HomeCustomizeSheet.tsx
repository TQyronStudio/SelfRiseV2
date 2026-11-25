/**
 * Customise Home — hide, show, drag (migration E11e, from the Design Lab's
 * HomeSectionsConcept; replaces HomeCustomizationModal).
 *
 * - Every section below the hero can be hidden and dragged to a new place; the
 *   hero of the day stays on top (R-4b) and is not in the list.
 * - A section is called exactly what its card says on Home (decision E11/4).
 * - The rules are the app's: HomeCustomizationContext (toggleComponentVisibility,
 *   reorderComponents → hasCustomOrder, resetToDefaults) over
 *   homePreferencesStorage and mergeHomeComponents. A reorder always sends ALL
 *   ids, hidden ones too — a missing id would come back as a new, visible section.
 * - A change that was not saved: the switch stays where it was and a calm note
 *   says so (ProblemNote) — no system alert. "Reset to defaults" asks nothing:
 *   it is one tap away from being changed again (plan point 8).
 */
import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useHomeCustomization } from '@/src/contexts/HomeCustomizationContext';
import { useI18n } from '@/src/hooks/useI18n';
import { radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { HomeScreenComponent } from '@/src/types/homeCustomization';
import {
  ReorderableList,
  ReorderHandle,
} from '@/src/components/common/ReorderableList';
import {
  AppText,
  BottomSheet,
  PressableScale,
  useProblemNote,
} from '@/src/components/ui';

/** The title of each section's card on Home (E11/4). */
const NAME_KEYS: Record<string, string> = {
  quickActions: 'home.customization.componentNames.quickActions',
  todayHabits: 'home.todayHabits',
  journalStreak: 'home.customization.componentNames.journalStreak',
  monthlyChallenges: 'home.customization.componentNames.monthlyChallenges',
  habitStats: 'home.stats.title',
  insights: 'home.insights.title',
  recommendations: 'home.forYou.title',
};

export function HomeCustomizeSheet({
  bottomInset,
  onClosed,
}: {
  bottomInset: number;
  onClosed: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { state, actions } = useHomeCustomization();
  const { showProblem } = useProblemNote();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const sections = [...state.preferences.components].sort(
    (a, b) => a.order - b.order
  );
  const nameOf = (id: string) => (NAME_KEYS[id] ? t(NAME_KEYS[id]!) : id);
  const notSaved = () =>
    showProblem({ message: t('home.customization.errors.visibilityFailed') });

  return (
    // Its rows are dragged themselves, so the sheet does not follow the finger.
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      draggable={false}
      label={t('common.close')}
    >
      {() => (
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title">{t('home.customization.title')}</AppText>
          <AppText variant="label" tone="muted" style={styles.hint}>
            {t('home.customization.hint')}
          </AppText>
          <ReorderableList<HomeScreenComponent>
            data={sections}
            keyExtractor={section => section.id}
            scrollableRef={scrollRef}
            onReorder={orders => {
              const ids = [...orders]
                .sort((a, b) => a.order - b.order)
                .map(o => o.id);
              void actions.reorderComponents(ids).then(ok => {
                if (!ok) notSaved();
              });
            }}
            renderItem={section => (
              <View
                style={[
                  styles.row,
                  { backgroundColor: c.surfaceRaised, borderColor: c.border },
                ]}
              >
                <ReorderHandle style={styles.handle}>
                  <Ionicons
                    name="reorder-three"
                    size={22}
                    color={c.textFaint}
                  />
                </ReorderHandle>
                <AppText
                  variant="bodyStrong"
                  tone={section.visible ? 'text' : 'muted'}
                  numberOfLines={1}
                  style={styles.flex}
                >
                  {nameOf(section.id)}
                </AppText>
                <Switch
                  value={section.visible}
                  onValueChange={() => {
                    feel('tap');
                    void actions
                      .toggleComponentVisibility(section.id)
                      .then(ok => {
                        if (!ok) notSaved();
                      });
                  }}
                  trackColor={{ false: c.track, true: c.primary }}
                  accessibilityLabel={nameOf(section.id)}
                />
              </View>
            )}
          />
          <PressableScale
            onPress={() =>
              void actions.resetToDefaults().then(ok => {
                if (!ok) notSaved();
              })
            }
            accessibilityLabel={t('home.customization.resetToDefaults')}
            style={styles.reset}
          >
            <AppText variant="label" tone="muted">
              {t('home.customization.resetToDefaults')}
            </AppText>
          </PressableScale>
        </Animated.ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    maxHeight: 520,
    paddingHorizontal: space.xl,
  },
  hint: {
    marginTop: 2,
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    marginBottom: space.sm,
    paddingRight: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  handle: {
    paddingHorizontal: space.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  reset: {
    alignSelf: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
});
