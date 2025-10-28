import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Layout } from '@/src/constants';
import { useTheme } from '@/src/hooks/useTheme';
import { useI18n } from '@/src/hooks/useI18n';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import HelpAnalyticsService from '@/src/services/helpAnalyticsService';
import HelpPerformanceMonitor from '@/src/services/helpPerformanceMonitor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Global state to prevent multiple tooltips from being open
let currentOpenTooltip: string | null = null;
const openTooltipCallbacks: { [key: string]: () => void } = {};

export interface HelpTooltipProps {
  helpKey: string;                    // Reference to i18n help text
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  maxWidth?: number;                  // Default 280px
  iconSize?: number;                  // Default 16px
  showOnMount?: boolean;             // For onboarding hints
  variant?: 'default' | 'prominent'; // Styling variants
  children?: React.ReactNode;        // Optional custom trigger
}

const HelpTooltipComponent: React.FC<HelpTooltipProps> = ({
  helpKey,
  position = 'auto',
  maxWidth = 280,
  iconSize = 16,
  showOnMount = false,
  variant = 'default',
  children,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { isHighContrastEnabled } = useAccessibility();

  const [isVisible, setIsVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const triggerRef = useRef<View>(null);
  const tooltipId = useRef(`tooltip-${Date.now()}-${Math.random()}`).current;
  const openTimestamp = useRef<number | null>(null);
  const performanceMeasurement = useRef<{
    endMeasurement: () => void;
    markAnimationFrame: () => void;
  } | null>(null);

  // Get help content from i18n
  const helpContent = t(`help.${helpKey}`, {
    defaultValue: {
      title: 'Help',
      content: 'Help information not available for this feature.'
    }
  }) as any;

  const title = typeof helpContent === 'object' && helpContent?.title
    ? helpContent.title
    : 'Help';

  const content = typeof helpContent === 'object' && helpContent?.content
    ? helpContent.content
    : typeof helpContent === 'string'
    ? helpContent
    : 'Help information not available.';

  // Show tooltip on mount if requested (for onboarding)
  useEffect(() => {
    if (showOnMount) {
      setTimeout(() => {
        handleShowTooltip();
      }, 500); // Small delay for better UX
    }
  }, [showOnMount]);

  // Register close callback for global tooltip management
  useEffect(() => {
    openTooltipCallbacks[tooltipId] = handleHideTooltip;
    return () => {
      delete openTooltipCallbacks[tooltipId];
      if (currentOpenTooltip === tooltipId) {
        currentOpenTooltip = null;
      }
    };
  }, [tooltipId]);

  const closeOtherTooltips = () => {
    if (currentOpenTooltip && currentOpenTooltip !== tooltipId) {
      const callback = openTooltipCallbacks[currentOpenTooltip];
      if (callback) {
        callback();
      }
    }
  };

  const calculateTooltipPosition = (triggerLayout: any) => {
    const padding = Layout.spacing.md;
    const tooltipWidth = Math.min(maxWidth, screenWidth - padding * 2);
    const tooltipHeight = 120; // Estimated height, will adjust based on content

    let finalPosition = position;
    let x = 0;
    let y = 0;

    if (position === 'auto') {
      // Smart positioning logic
      const spaceAbove = triggerLayout.y;
      const spaceBelow = screenHeight - (triggerLayout.y + triggerLayout.height);
      const spaceLeft = triggerLayout.x;
      const spaceRight = screenWidth - (triggerLayout.x + triggerLayout.width);

      if (spaceBelow >= tooltipHeight + padding) {
        finalPosition = 'bottom';
      } else if (spaceAbove >= tooltipHeight + padding) {
        finalPosition = 'top';
      } else if (spaceRight >= tooltipWidth + padding) {
        finalPosition = 'right';
      } else if (spaceLeft >= tooltipWidth + padding) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // Fallback
      }
    }

    switch (finalPosition) {
      case 'top':
        x = triggerLayout.x + triggerLayout.width / 2 - tooltipWidth / 2;
        y = triggerLayout.y - tooltipHeight - Layout.spacing.sm;
        break;
      case 'bottom':
        x = triggerLayout.x + triggerLayout.width / 2 - tooltipWidth / 2;
        y = triggerLayout.y + triggerLayout.height + Layout.spacing.sm;
        break;
      case 'left':
        x = triggerLayout.x - tooltipWidth - Layout.spacing.sm;
        y = triggerLayout.y + triggerLayout.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = triggerLayout.x + triggerLayout.width + Layout.spacing.sm;
        y = triggerLayout.y + triggerLayout.height / 2 - tooltipHeight / 2;
        break;
    }

    // Ensure tooltip stays within screen bounds
    x = Math.max(padding, Math.min(x, screenWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, screenHeight - tooltipHeight - padding));

    setActualPosition(finalPosition as 'top' | 'bottom' | 'left' | 'right');

    // Defer analytics to avoid impacting position calculation performance
    setTimeout(() => {
      HelpAnalyticsService.trackHelpInteraction('tooltip_position_changed', helpKey, {
        position: finalPosition as 'top' | 'bottom' | 'left' | 'right',
      });
    }, 0);

    return { x, y };
  };

  const handleShowTooltip = () => {
    closeOtherTooltips();
    currentOpenTooltip = tooltipId;

    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        // Start performance monitoring just before UI updates
        performanceMeasurement.current = HelpPerformanceMonitor.startRenderMeasurement(helpKey);

        const layout = { x, y, width, height };
        setTriggerLayout(layout);
        const position = calculateTooltipPosition(layout);
        setTooltipPosition(position);
        setIsVisible(true);
        openTimestamp.current = Date.now();

        // End performance measurement immediately after UI state changes
        if (performanceMeasurement.current) {
          performanceMeasurement.current.endMeasurement();
          performanceMeasurement.current = null;
        }

        // Defer analytics to next tick to not impact render performance
        setTimeout(() => {
          HelpAnalyticsService.trackHelpInteraction('tooltip_opened', helpKey, {
            position: actualPosition,
            screenName: 'unknown'
          });
          HelpAnalyticsService.trackHelpInteraction('help_content_viewed', helpKey, {
            position: actualPosition,
          });
        }, 0);

        // Animate in - simplified for better performance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150, // Reduced duration
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 120, // Higher tension for snappier animation
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleHideTooltip = () => {
    // Calculate viewing duration for analytics
    const viewingDuration = openTimestamp.current
      ? Date.now() - openTimestamp.current
      : undefined;

    // Defer analytics to not block hide animation
    setTimeout(() => {
      HelpAnalyticsService.trackHelpInteraction('tooltip_closed', helpKey, {
        position: actualPosition,
      });

      if (viewingDuration !== undefined) {
        HelpAnalyticsService.trackHelpInteraction('help_content_duration', helpKey, {
          duration: viewingDuration,
          position: actualPosition,
        });
      }
    }, 0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      openTimestamp.current = null;
      if (currentOpenTooltip === tooltipId) {
        currentOpenTooltip = null;
      }
    });
  };

  const iconColor = variant === 'prominent'
    ? colors.primary
    : isHighContrastEnabled
    ? colors.text
    : colors.textSecondary;

  const styles = StyleSheet.create({
    trigger: {
      padding: Layout.spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
    },
    triggerProminent: {
      backgroundColor: colors.primary + '20',
      borderRadius: Layout.borderRadius.full,
      padding: Layout.spacing.sm,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.md,
      padding: Layout.spacing.md,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tooltipHighContrast: {
      borderColor: colors.text,
      borderWidth: 2,
    },
    arrow: {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    },
    arrowTop: {
      bottom: -8,
      left: '50%',
      marginLeft: -8,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: colors.cardBackgroundElevated,
    },
    arrowBottom: {
      top: -8,
      left: '50%',
      marginLeft: -8,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: colors.cardBackgroundElevated,
    },
    arrowLeft: {
      right: -8,
      top: '50%',
      marginTop: -8,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 8,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: colors.cardBackgroundElevated,
    },
    arrowRight: {
      left: -8,
      top: '50%',
      marginTop: -8,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderRightWidth: 8,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderRightColor: colors.cardBackgroundElevated,
    },
    arrowHighContrast: {
      borderTopColor: colors.cardBackgroundElevated,
      borderBottomColor: colors.cardBackgroundElevated,
      borderLeftColor: colors.cardBackgroundElevated,
      borderRightColor: colors.cardBackgroundElevated,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    title: {
      fontSize: Fonts.sizes.md,
      fontWeight: '600' as const,
      color: colors.text,
      flex: 1,
    },
    titleHighContrast: {
      fontWeight: '700' as const,
    },
    closeButton: {
      padding: Layout.spacing.xs,
      marginLeft: Layout.spacing.sm,
    },
    contentText: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      lineHeight: Fonts.lineHeights.sm,
    },
    contentTextHighContrast: {
      color: colors.text,
      fontWeight: '500' as const,
    },
  });

  const renderTrigger = () => {
    if (children) {
      return (
        <TouchableOpacity
          ref={triggerRef}
          onPress={handleShowTooltip}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Help: ${title}`}
          accessibilityHint="Double tap to show help information"
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        ref={triggerRef}
        style={[styles.trigger, variant === 'prominent' && styles.triggerProminent]}
        onPress={handleShowTooltip}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Help: ${title}`}
        accessibilityHint="Double tap to show help information"
      >
        <Ionicons
          name="help-circle-outline"
          size={iconSize}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  const renderTooltip = () => {
    if (!isVisible) return null;

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={handleHideTooltip}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleHideTooltip}
        >
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                maxWidth,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
              isHighContrastEnabled && styles.tooltipHighContrast,
            ]}
          >
            {/* Arrow indicator */}
            <View style={[
              styles.arrow,
              actualPosition === 'top' && styles.arrowTop,
              actualPosition === 'bottom' && styles.arrowBottom,
              actualPosition === 'left' && styles.arrowLeft,
              actualPosition === 'right' && styles.arrowRight,
              isHighContrastEnabled && styles.arrowHighContrast,
            ]} />

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={[
                  styles.title,
                  isHighContrastEnabled && styles.titleHighContrast
                ]}>
                  {title}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleHideTooltip}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close help"
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={isHighContrastEnabled ? colors.text : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[
                styles.contentText,
                isHighContrastEnabled && styles.contentTextHighContrast
              ]}>
                {content}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      {renderTrigger()}
      {renderTooltip()}
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export const HelpTooltip = React.memo(HelpTooltipComponent);