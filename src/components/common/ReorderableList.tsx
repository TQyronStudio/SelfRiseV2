import React, { useCallback } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable, {
  SortableGridDragEndParams,
  SortableGridRenderItem,
} from 'react-native-sortables';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { isHapticsEnabled } from '@/src/services/hapticsService';
import {
  REORDER_GESTURE,
  REORDER_HANDLE_HIT_SIZE,
  toOrderUpdates,
} from './reorderConfig';

// Reorder mode shared by Habits and Goals — rules in technical-guides:Habits.md
// → "Řazení (reorder mode)".
//
// The list MUST sit inside an `Animated.ScrollView` whose ref is passed as
// `scrollableRef`: that is what lets the page scroll normally and auto-scroll
// while an item is dragged towards an edge.

interface ReorderableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactElement;
  /** Called only when the order actually changed. */
  onReorder: (orders: Array<{ id: string; order: number }>) => void;
  /** Ref of the Animated.ScrollView that contains the list. */
  scrollableRef: AnimatedRef<Animated.ScrollView>;
}

export function ReorderableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  scrollableRef,
}: ReorderableListProps<T>) {
  const { isDark } = useTheme();

  const renderSortableItem = useCallback<SortableGridRenderItem<T>>(
    ({ item }) => renderItem(item),
    [renderItem]
  );

  const handleDragEnd = useCallback(
    ({ data: reordered, fromIndex, toIndex }: SortableGridDragEndParams<T>) => {
      const orders = toOrderUpdates(reordered, keyExtractor, fromIndex, toIndex);
      if (orders) {
        onReorder(orders);
      }
    },
    [keyExtractor, onReorder]
  );

  return (
    <Sortable.Grid
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderSortableItem}
      onDragEnd={handleDragEnd}
      scrollableRef={scrollableRef}
      customHandle={REORDER_GESTURE.customHandle}
      dragActivationDelay={REORDER_GESTURE.dragActivationDelay}
      // Single column: the card may only travel up and down.
      overDrag="vertical"
      // Lift the card a little — full-width cards clip at the default 1.1.
      activeItemScale={1.03}
      // No shadows in dark mode (theme rule); depth comes from the scale there.
      activeItemShadowOpacity={isDark ? 0 : 0.15}
      inactiveItemOpacity={0.85}
      // Pick-up, every swap and the drop — only if the user has vibrations on.
      hapticsEnabled={isHapticsEnabled()}
      // Items are never added or removed in reorder mode; entrance animations
      // would only make every card flash when the mode is switched on.
      itemEntering={null}
      itemExiting={null}
    />
  );
}

const HANDLE_HIT_AREA: ViewStyle = {
  minWidth: REORDER_HANDLE_HIT_SIZE,
  minHeight: REORDER_HANDLE_HIT_SIZE,
  alignItems: 'center',
  justifyContent: 'center',
};

interface ReorderHandleProps {
  /** Extra layout for the touch area (e.g. negative margins to keep the row height). */
  style?: StyleProp<ViewStyle>;
  /** The visible grip. The touch area around it is at least 44 × 44 pt. */
  children: React.ReactNode;
}

/** The only place an item can be picked up in a ReorderableList. */
export function ReorderHandle({ style, children }: ReorderHandleProps) {
  const { t } = useI18n();

  return (
    <Sortable.Handle style={[HANDLE_HIT_AREA, style]}>
      <View accessible accessibilityLabel={t('ui.dragToReorder')}>
        {children}
      </View>
    </Sortable.Handle>
  );
}
