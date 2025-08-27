import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import ErrorModal from '../common/ErrorModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Step-by-Step Modal specifications  
const MODAL_SIZES = {
  year: { width: SCREEN_WIDTH * 0.95, minHeight: 310 },    // 3×7 grid: 126px content + 170px padding = 296px + buffer
  month: { width: SCREEN_WIDTH * 0.75, minHeight: 310 },  // 3×4 grid: 126px content + 170px padding = 296px + buffer
  day: { width: SCREEN_WIDTH * 0.95, minHeight: 400 },    // 7×variable: 212px content + 170px padding = 382px + buffer
};

// Square specifications (blue/green squares)
const SQUARE_SIZE = 40;        // Slightly smaller for better fit
const SQUARE_MARGIN = 3;       // Reduced margin for more space
const SQUARE_BORDER_RADIUS = 8; // Slightly rounded corners

// Color specifications - Step-by-Step Modal
const SELECTED_COLOR = '#4CAF50';     // Green for selected squares
const UNSELECTED_COLOR = '#2196F3';   // Blue for unselected squares (app theme)
const TEXT_COLOR = '#FFFFFF';         // White text on both colors
const NAVIGATION_COLOR = '#2196F3';   // Blue for back arrow
const CLOSE_COLOR = '#666666';        // Gray for close X

// Animation specifications
const MODAL_RESIZE_DURATION = 300;     // Modal resize animation duration
const CONTENT_FADE_DURATION = 150;     // Content fade in/out duration 
const SELECTION_SCALE_FACTOR = 1.05;   // Slight scale up on tap
const SELECTION_ANIMATION_DURATION = 150; // Selection feedback duration

// Step enumeration
enum SelectionStep {
  YEAR = 'year',
  MONTH = 'month', 
  DAY = 'day'
}

// Grid layout configurations
const GRID_CONFIGS = {
  year: { columns: 7, rows: 3 },        // 3×7 grid for years (21 years total)
  month: { columns: 4, rows: 3 },       // 3×4 grid for months
  day: { columns: 7, rows: 'variable' } // 7×variable grid for days
};

interface StepSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date | undefined;
}

export function TargetDateStepSelectionModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
}: StepSelectionModalProps) {
  const { t } = useI18n();

  // Default date calculation: First day of month +2 from current
  const getDefaultDate = (): Date => {
    const today = new Date();
    const defaultDate = new Date(today);
    defaultDate.setMonth(today.getMonth() + 2);
    defaultDate.setDate(1);
    return defaultDate;
  };

  // Step-by-step flow state
  const [currentStep, setCurrentStep] = useState<SelectionStep>(SelectionStep.YEAR);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Modal animations
  const modalWidth = useRef(new Animated.Value(MODAL_SIZES.year.width)).current;
  const modalHeight = useRef(new Animated.Value(MODAL_SIZES.year.minHeight)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Error handling state
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize modal state when opened
  useEffect(() => {
    if (visible) {
      // Reset to initial step
      setCurrentStep(SelectionStep.YEAR);
      
      // Pre-select default year (from +2 months logic)
      const defaultDate = getDefaultDate();
      setSelectedYear(defaultDate.getFullYear());
      setSelectedMonth(null);
      setSelectedDay(null);
      
      // Reset modal size to year step
      modalWidth.setValue(MODAL_SIZES.year.width);
      modalHeight.setValue(MODAL_SIZES.year.minHeight);
      contentOpacity.setValue(1);
    }
  }, [visible, initialDate]);

  // Simple approach - calculate every time (no caching)
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  const getDaysInMonth = (month: number, year: number): number => {
    // month is 1-indexed (1=January, 2=February, ..., 12=December)
    // new Date(year, month, 0) where month is 1-indexed gives last day of (month-1) in 0-indexed system
    // For March (month=3): new Date(year, 3, 0) = last day of March since 3 = April in 0-indexed
    return new Date(year, month, 0).getDate();
  };

  // Year range: Current year to +20 years (expanded range)
  const YEAR_MIN = new Date().getFullYear();
  const YEAR_MAX = YEAR_MIN + 20;

  // Data generation functions (simple approach)
  const generateYearOptions = (): number[] => {
    const years = [];
    for (let i = 0; i <= 20; i++) {
      years.push(YEAR_MIN + i);
    }
    return years;
  };

  const generateMonthOptions = (): number[] => {
    return Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, 3, ..., 12]
  };

  const generateDayOptions = (month: number, year: number): number[] => {
    const daysInMonth = getDaysInMonth(month, year);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Modal resize animation helper with step change callback
  const animateModalResize = (step: SelectionStep, onStepChange?: () => void) => {
    const targetSize = MODAL_SIZES[step];
    
    // Fade out content
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: CONTENT_FADE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // Change step AFTER fade out, BEFORE resize - prevents blink
      if (onStepChange) {
        onStepChange();
      }
      
      // Resize modal
      Animated.parallel([
        Animated.timing(modalWidth, {
          toValue: targetSize.width,
          duration: MODAL_RESIZE_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(modalHeight, {
          toValue: targetSize.minHeight,
          duration: MODAL_RESIZE_DURATION,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Fade in new content
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: CONTENT_FADE_DURATION,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  // Step selection handlers
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    animateModalResize(SelectionStep.MONTH, () => {
      setCurrentStep(SelectionStep.MONTH); // Step changes AFTER fade out - no blink
    });
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    animateModalResize(SelectionStep.DAY, () => {
      setCurrentStep(SelectionStep.DAY); // Step changes AFTER fade out - no blink
    });
  };

  const handleDaySelect = (day: number) => {
    if (!selectedYear || !selectedMonth) return;
    
    // Create final date
    const selectedDate = new Date(selectedYear, selectedMonth - 1, day);
    
    // Validate date immediately
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setErrorMessage('Selected date cannot be in the past');
      setShowError(true);
      return;
    }
    
    // Complete flow - auto-close modal
    onSelectDate(selectedDate);
    onClose();
  };

  // Back navigation handler
  const handleBackNavigation = () => {
    if (currentStep === SelectionStep.MONTH) {
      setSelectedMonth(null);
      animateModalResize(SelectionStep.YEAR, () => {
        setCurrentStep(SelectionStep.YEAR); // Step changes AFTER fade out - no blink
      });
    } else if (currentStep === SelectionStep.DAY) {
      setSelectedDay(null);
      animateModalResize(SelectionStep.MONTH, () => {
        setCurrentStep(SelectionStep.MONTH); // Step changes AFTER fade out - no blink
      });
    }
  };

  // Render year selection grid (2×6)
  const renderYearGrid = () => {
    const years = generateYearOptions();
    const { columns } = GRID_CONFIGS.year;
    
    return (
      <View style={styles.gridContainer}>
        {years.map((year, index) => {
          const isSelected = year === selectedYear;
          
          return (
            <TouchableOpacity
              key={year}
              style={[
                styles.gridSquare,
                {
                  backgroundColor: isSelected ? SELECTED_COLOR : UNSELECTED_COLOR,
                  marginRight: (index + 1) % columns === 0 ? 0 : SQUARE_MARGIN,
                  marginBottom: SQUARE_MARGIN,
                }
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text style={styles.gridSquareText}>{year}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render month selection grid (3×4)
  const renderMonthGrid = () => {
    const months = generateMonthOptions();
    const { columns } = GRID_CONFIGS.month;
    
    return (
      <View style={styles.gridContainer}>
        {months.map((month, index) => {
          const isSelected = month === selectedMonth;
          
          return (
            <TouchableOpacity
              key={month}
              style={[
                styles.gridSquare,
                {
                  backgroundColor: isSelected ? SELECTED_COLOR : UNSELECTED_COLOR,
                  marginRight: (index + 1) % columns === 0 ? 0 : SQUARE_MARGIN,
                  marginBottom: SQUARE_MARGIN,
                }
              ]}
              onPress={() => handleMonthSelect(month)}
            >
              <Text style={styles.gridSquareText}>{month}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render day selection grid (7×variable - calendar layout)
  const renderDayGrid = () => {
    if (!selectedYear || !selectedMonth) return null;
    
    const days = generateDayOptions(selectedMonth, selectedYear);
    const { columns } = GRID_CONFIGS.day;
    
    return (
      <View style={styles.gridContainer}>
        {days.map((day, index) => {
          const isSelected = day === selectedDay;
          
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.gridSquare,
                {
                  backgroundColor: isSelected ? SELECTED_COLOR : UNSELECTED_COLOR,
                  marginRight: (index + 1) % columns === 0 ? 0 : SQUARE_MARGIN,
                  marginBottom: SQUARE_MARGIN,
                }
              ]}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={styles.gridSquareText}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  
  // Render navigation controls (back arrow + close X)
  const renderNavigationControls = () => {
    return (
      <View style={styles.navigationContainer}>
        {/* Back arrow - only show after year step */}
        {currentStep !== SelectionStep.YEAR && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackNavigation}
          >
            <Ionicons name="chevron-back" size={24} color={NAVIGATION_COLOR} />
          </TouchableOpacity>
        )}
        
        {/* Close X - always visible */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color={CLOSE_COLOR} />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render current step content
  const renderCurrentStep = () => {
    switch (currentStep) {
      case SelectionStep.YEAR:
        return renderYearGrid();
      case SelectionStep.MONTH:
        return renderMonthGrid();
      case SelectionStep.DAY:
        return renderDayGrid();
      default:
        return null;
    }
  };
  
  // Get step title for header
  const getStepTitle = (): string => {
    switch (currentStep) {
      case SelectionStep.YEAR:
        return t('goals.selectYear') || 'Select Year';
      case SelectionStep.MONTH:
        return t('goals.selectMonth') || 'Select Month';
      case SelectionStep.DAY:
        return t('goals.selectDay') || 'Select Day';
      default:
        return t('goals.selectTargetDate') || 'Select Target Date';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dark overlay */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Modal content - animated size */}
        <Animated.View 
          style={[
            styles.modalContent,
            {
              width: modalWidth,
              height: modalHeight,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalInner}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            {/* Navigation controls */}
            {renderNavigationControls()}
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getStepTitle()}</Text>
            </View>

            {/* Step content - animated opacity */}
            <Animated.View style={[
              styles.stepContainer,
              { opacity: contentOpacity }
            ]}>
              {renderCurrentStep()}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>

      {/* Error Modal */}
      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    elevation: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Dynamic width and height set by animations
  },
  modalInner: {
    flex: 1,
    position: 'relative',
  },
  navigationContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60, // Account for navigation controls
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridSquare: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: SQUARE_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor and margins set dynamically
  },
  gridSquareText: {
    color: TEXT_COLOR,
    fontSize: 16,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
});