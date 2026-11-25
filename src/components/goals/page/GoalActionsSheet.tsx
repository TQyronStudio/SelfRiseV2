/**
 * "⋯" on a goal (migration E14, R-4c like a habit): the old card's buttons in
 * one sheet — the detail (statistics), edit, delete. Delete asks first in the
 * sheet's place (ConfirmSheet, never an Alert) with the app's wording; the XP
 * the goal earned stays (technical-guides:Goals.md).
 */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { space } from '@/src/design/tokens';
import { useI18n } from '@/src/hooks/useI18n';
import { AppText, BottomSheet, ConfirmSheet, PressableScale } from '@/src/components/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function GoalActionsSheet({
  title,
  bottomInset,
  onClose,
  onDetail,
  onEdit,
  onDelete,
}: {
  title: string;
  bottomInset: number;
  onClose: () => void;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <ConfirmSheet
        title={t('goals.deleteGoal')}
        message={t('goals.deleteMessage')}
        confirm={t('common.delete')}
        cancel={t('common.cancel')}
        icon="trash-outline"
        bottomInset={bottomInset}
        onClosed={onClose}
        onConfirm={onDelete}
      />
    );
  }

  const rows: { key: string; icon: IoniconName; label: string; color: string; run: (() => void) | null }[] = [
    { key: 'detail', icon: 'stats-chart-outline', label: t('goals.stats.overview'), color: c.primary, run: onDetail },
    { key: 'edit', icon: 'create-outline', label: t('goals.editGoal'), color: c.text, run: onEdit },
    { key: 'delete', icon: 'trash-outline', label: t('goals.deleteGoal'), color: c.danger, run: null },
  ];

  return (
    <BottomSheet bottomInset={bottomInset} onClosed={onClose} label={t('common.cancel')}>
      {dismiss => (
        <>
          <AppText variant="titleSm" style={styles.title} numberOfLines={2}>
            {title}
          </AppText>
          {rows.map(row => (
            <PressableScale
              key={row.key}
              pressScale={0.98}
              accessibilityLabel={row.label}
              onPress={() => {
                // The confirm takes the sheet's place — no second window on top.
                if (!row.run) return setConfirming(true);
                dismiss(row.run);
              }}
              style={[styles.row, { borderColor: c.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.color} />
              <AppText variant="bodyStrong" style={[styles.label, { color: row.color }]}>
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
  title: { marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { marginLeft: space.md },
});
