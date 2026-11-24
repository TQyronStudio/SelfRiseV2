/**
 * Sheets and their kin (moved from the Design Lab's journalParts.tsx and
 * goalParts.tsx in migration E4; the lab keeps its copies — O-6):
 *
 * - BottomSheet: rises over the page, rides on top of the keyboard when it has a
 *   text field (the keyboard's measured overlap), closes by a tap on the scrim,
 *   Android back or a pull down — never by a pull when it holds a text field.
 * - ConfirmSheet: the one way to confirm something destructive (delete, start
 *   fresh) — never an Alert (O-14).
 * - UndoToast: a short note above the banner with an optional undo, leaving by
 *   itself. Its texts come from the screen (approved with it).
 * - PageTopBar: the top row of a card screen — the level badge stays pinned on
 *   the left, the close button on the right (P10).
 *
 * All are views in the screen's own tree — never an RN <Modal> (kap. 6.0).
 */
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Animated as RNAnimated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import {
  fixed,
  fonts,
  radius,
  shadows,
  space,
  withAlpha,
} from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { contentColumn } from '@/src/utils/layout';
import { useDragToClose } from './dragToClose';
import { useOverlayBack, useOverlayCover } from './overlayRegistry';
import { AppText, PressableScale } from './primitives';
import { TOP_ROW_HEIGHT } from './TopRow';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------------------
// The top row of a card screen
// ---------------------------------------------------------------------------

/** Top bar of a card screen: the level badge stays pinned on the left, close on the right. */
export function PageTopBar({
  onClose,
  label,
  raised = false,
}: {
  onClose: () => void;
  /** What a screen reader says for the close button. */
  label: string;
  /** On a surface (inside a DetailFrame): the button takes the raised tone to stand out. */
  raised?: boolean;
}) {
  const { c } = useDesign();
  return (
    <View style={styles.topBar}>
      <PressableScale
        onPress={onClose}
        feel={null}
        pressScale={0.9}
        accessibilityLabel={label}
        style={[
          styles.roundButton,
          {
            backgroundColor: raised ? c.surfaceRaised : c.surface,
            borderColor: c.border,
          },
        ]}
      >
        <Ionicons name="close" size={20} color={c.text} />
      </PressableScale>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet — rides on top of the keyboard when it has a text field
// ---------------------------------------------------------------------------

const SHEET_TRAVEL = 520;

/**
 * How far something docked at the bottom of a page must rise so it sits on top of
 * the keyboard: the keyboard's REAL overlap with the page (measured), minus the
 * room already kept for the banner + tab bar. Correct whether the window resizes
 * for the keyboard (Android) or not (iOS). `keyboardTop` = the keyboard's top edge
 * in window coordinates while it is up (for scrolling a focused field into view).
 */
export function useKeyboardLift(
  rootRef: React.RefObject<View | null>,
  bottomInset: number,
  enabled = true
) {
  const lift = useSharedValue(0);
  const keyboardTop = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        keyboardTop.current = e.endCoordinates.screenY;
        rootRef.current?.measureInWindow((_x, y, _w, h) => {
          const overlap = Math.max(0, y + h - e.endCoordinates.screenY);
          lift.value = withTiming(Math.max(0, overlap - bottomInset), {
            duration: e.duration || 240,
            easing: Easing.out(Easing.cubic),
          });
        });
      }
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      e => {
        keyboardTop.current = null;
        lift.value = withTiming(0, {
          duration: e.duration || 220,
          easing: Easing.out(Easing.cubic),
        });
      }
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, bottomInset, lift, rootRef]);
  return { lift, keyboardTop };
}

/** Closes the sheet, then runs `after` (e.g. the confirmed action). */
export type Dismiss = (after?: () => void) => void;

export function BottomSheet({
  bottomInset,
  onClosed,
  keyboardAware = false,
  draggable = true,
  label,
  children,
}: {
  /** Banner + tab bar: the rows must sit above them. */
  bottomInset: number;
  onClosed: () => void;
  keyboardAware?: boolean;
  /** false for a sheet whose rows are dragged themselves (reordering). */
  draggable?: boolean;
  /** What a screen reader says for the scrim (it closes the sheet). */
  label: string;
  children: (dismiss: Dismiss) => ReactNode;
}) {
  const { c } = useDesign();
  useOverlayCover();
  const rootRef = useRef<View>(null);
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(1, {
      damping: 22,
      stiffness: 260,
      overshootClamping: true,
    });
  }, [p]);

  // The action to run once closed (a confirmed delete). Kept until the sheet is
  // really closed: a second dismiss (back, scrim, a drag) while the first is
  // closing must not lose it.
  const pendingAfter = useRef<(() => void) | undefined>(undefined);
  const dismiss = useCallback<Dismiss>(
    after => {
      if (after) pendingAfter.current = after;
      Keyboard.dismiss();
      const finish = () => {
        onClosed();
        const run = pendingAfter.current;
        pendingAfter.current = undefined;
        run?.();
      };
      p.value = withTiming(0, { duration: 210 }, finished => {
        if (finished) scheduleOnRN(finish);
      });
    },
    [p, onClosed]
  );

  useOverlayBack(() => dismiss());

  const { lift } = useKeyboardLift(rootRef, bottomInset, keyboardAware);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.35 * p.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * SHEET_TRAVEL - lift.value }],
  }));
  // Pulled down, the sheet follows the finger (R-33). Never a sheet with a text
  // field: a slip of the finger must not throw away what was typed.
  const pullDown = useDragToClose({
    p,
    axis: 'y',
    range: SHEET_TRAVEL,
    close: dismiss,
    enabled: draggable && !keyboardAware,
  });

  return (
    <View ref={rootRef} style={StyleSheet.absoluteFill} collapsable={false}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismiss()}
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: fixed.black },
            scrimStyle,
          ]}
        />
      </Pressable>
      <GestureDetector gesture={pullDown}>
        <Animated.View
          style={[
            styles.sheet,
            contentColumn,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              paddingBottom: bottomInset + space.lg,
            },
            panelStyle,
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: c.track }]} />
          {children(dismiss)}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Confirm (delete, start fresh)
// ---------------------------------------------------------------------------

export function ConfirmSheet({
  title,
  message,
  confirm,
  cancel,
  icon,
  bottomInset,
  onClosed,
  onConfirm,
}: {
  title: string;
  message: string;
  /** The destructive button's label. */
  confirm: string;
  /** The cancel button's label (common.cancel). */
  cancel: string;
  icon: IoniconName;
  bottomInset: number;
  onClosed: () => void;
  onConfirm: () => void;
}) {
  const { c } = useDesign();
  return (
    <BottomSheet bottomInset={bottomInset} onClosed={onClosed} label={cancel}>
      {dismiss => (
        <>
          <View
            style={[
              styles.confirmIcon,
              { backgroundColor: withAlpha(c.danger, 0.12) },
            ]}
          >
            <Ionicons name={icon} size={22} color={c.danger} />
          </View>
          <AppText variant="title" style={{ marginTop: space.md }}>
            {title}
          </AppText>
          <AppText variant="body" tone="muted" style={{ marginTop: space.sm }}>
            {message}
          </AppText>
          <View style={styles.confirmRow}>
            <PressableScale
              accessibilityLabel={cancel}
              onPress={() => dismiss()}
              style={[styles.pillButton, { backgroundColor: c.track, flex: 1 }]}
            >
              <AppText variant="bodyStrong">{cancel}</AppText>
            </PressableScale>
            <PressableScale
              accessibilityLabel={confirm}
              feel={null}
              onPress={() => {
                feel('confirm');
                dismiss(onConfirm);
              }}
              style={[
                styles.pillButton,
                { backgroundColor: c.danger, flex: 1 },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: c.onDanger }}>
                {confirm}
              </AppText>
            </PressableScale>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Undo toast — sits above the banner, leaves after a few seconds
// ---------------------------------------------------------------------------

const TOAST_MS = 4200;

export function UndoToast({
  message,
  undoLabel,
  bottomInset,
  onUndo,
  onGone,
}: {
  message: string;
  /** The undo button's label (from the screen's approved texts). */
  undoLabel: string;
  bottomInset: number;
  /** Null for a message without undo (e.g. a milestone). */
  onUndo: (() => void) | null;
  onGone: () => void;
}) {
  const { c } = useDesign();
  const gone = useRef(onGone);
  gone.current = onGone;
  // Native driver, not a layout animation (kolo 27): it arrives in the same second
  // as the fill, the roll and the sparks.
  const p = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.spring(p, {
      toValue: 1,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
    const id = setTimeout(() => {
      RNAnimated.timing(p, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // A fade cut short by a newer message is not "gone": the new toast stays.
        if (finished) gone.current();
      });
    }, TOAST_MS);
    return () => {
      clearTimeout(id);
      p.stopAnimation();
    };
  }, [message, p]);
  const translateY = useMemo(
    () => p.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
    [p]
  );
  return (
    <RNAnimated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrap,
        {
          bottom: bottomInset + space.md,
          opacity: p,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[contentColumn, styles.toastColumn]}
        pointerEvents="box-none"
      >
        <View style={[styles.toast, { backgroundColor: c.text }]}>
          <AppText
            variant="label"
            style={{ color: c.canvas, flex: 1 }}
            numberOfLines={2}
          >
            {message}
          </AppText>
          {onUndo && (
            <PressableScale
              onPress={onUndo}
              accessibilityLabel={undoLabel}
              style={styles.undo}
            >
              <AppText
                variant="label"
                style={{ color: c.canvas, fontFamily: fonts.bold }}
              >
                {undoLabel}
              </AppText>
            </PressableScale>
          )}
        </View>
      </View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: TOP_ROW_HEIGHT,
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: space.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: space.lg,
  },
  confirmIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xl,
  },
  pillButton: {
    height: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  toastColumn: {
    paddingHorizontal: space.xl,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    paddingLeft: space.lg,
    paddingRight: space.xs,
    boxShadow: shadows.toast,
  },
  undo: {
    paddingHorizontal: space.md,
    height: 44,
    justifyContent: 'center',
  },
});
