import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { 
  PanGestureHandler, 
  GestureHandlerRootView,
  State as GestureState
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ErrorModal } from '../common/ErrorModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Modal size specifications (1/3 screen height)
const MODAL_HEIGHT = SCREEN_HEIGHT / 3;
const MODAL_WIDTH = SCREEN_WIDTH * 0.9;

// Wheel specifications
const WHEEL_SIZE = MODAL_WIDTH * 0.7;
const DAY_WHEEL_RADIUS = WHEEL_SIZE / 2;
const MONTH_WHEEL_RADIUS = WHEEL_SIZE / 3;
const YEAR_CENTER_SIZE = WHEEL_SIZE / 4;

// Color specifications
const SELECTED_COLOR = '#4CAF50';
const UNSELECTED_COLOR = '#E0E0E0';
const TEXT_SELECTED = '#FFFFFF';
const TEXT_UNSELECTED = '#333333';
const YEAR_BACKGROUND = '#F5F5F5';
const ARROW_COLOR = '#666666';

// Animation specifications (used in future enhancements)
// const WHEEL_ANIMATION_DURATION = 300;
const SELECTION_HIGHLIGHT_DURATION = 150;
const SELECTION_SCALE_FACTOR = 1.1;

// Physics specifications (from technical guide)
const WHEEL_SNAP_TENSION = 50;
const WHEEL_SNAP_FRICTION = 8;
const YEAR_CHANGE_DURATION = 200;
const YEAR_SCROLL_SENSITIVITY = 0.01; // Years per pixel scrolled

// Gesture interfaces (from technical guide)
interface WheelGesture {
  onRotationStart: (startAngle: number) => void;
  onRotationUpdate: (currentAngle: number, deltaAngle: number) => void;
  onRotationEnd: (finalAngle: number, velocity: number) => void;
  snapToPosition: (angle: number) => number;
  getValueFromAngle: (angle: number) => number;
}

interface YearScrollGesture {
  onScrollStart: (startY: number) => void;
  onScrollUpdate: (deltaY: number) => void;
  onScrollEnd: (velocity: number) => void;
  getYearDelta: (scrollDistance: number) => number;
}

// Common errors (from technical guide)
const COMMON_ERRORS = {
  INVALID_DATE: 'Selected date is invalid or in the past',
  VALUE_TOO_LARGE: 'Target value exceeds maximum allowed (999,999)',
  PROGRESS_OVERFLOW: 'Progress update would exceed target value',
  DAILY_LIMIT_REACHED: 'Daily progress update limit reached (3 updates)',
  NETWORK_ERROR: 'Unable to save goal. Please check your connection.',
  VALIDATION_ERROR: 'Please check all required fields are filled correctly'
};

interface CalendarWheelModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date | undefined;
}

export function TargetDateCalendarWheelModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
}: CalendarWheelModalProps) {
  const { t } = useI18n();

  // Default date calculation: First day of month +2 from current
  const getDefaultDate = (): Date => {
    const today = new Date();
    const defaultDate = new Date(today);
    defaultDate.setMonth(today.getMonth() + 2);
    defaultDate.setDate(1);
    return defaultDate;
  };

  // State for selected date components
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Error handling state
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animation values
  const dayWheelRotation = useRef(new Animated.Value(0)).current;
  const monthWheelRotation = useRef(new Animated.Value(0)).current;
  const selectedDayScale = useRef(new Animated.Value(1)).current;
  const selectedMonthScale = useRef(new Animated.Value(1)).current;

  // Gesture state tracking
  const dayGestureState = useRef({
    isActive: false,
    startAngle: 0,
    currentRotation: 0,
    velocity: 0
  }).current;

  const monthGestureState = useRef({
    isActive: false,
    startAngle: 0,
    currentRotation: 0,
    velocity: 0
  }).current;

  const yearGestureState = useRef({
    isActive: false,
    startY: 0,
    currentDelta: 0,
    velocity: 0
  }).current;

  // Initialize date values when modal opens
  useEffect(() => {
    if (visible) {
      const targetDate = initialDate || getDefaultDate();
      setSelectedDay(targetDate.getDate());
      setSelectedMonth(targetDate.getMonth() + 1); // getMonth() returns 0-11, we need 1-12
      setSelectedYear(targetDate.getFullYear());
    }
  }, [visible, initialDate]);

  // Leap year detection
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  // Get number of days in a month
  const getDaysInMonth = (month: number, year: number): number => {
    if (month === 2 && isLeapYear(year)) {
      return 29;
    }
    return new Date(year, month, 0).getDate();
  };

  // Validate and adjust day for selected month/year
  const validateDayForMonth = (day: number, month: number, year: number): number => {
    const maxDays = getDaysInMonth(month, year);
    return day > maxDays ? maxDays : day;
  };

  // Month names for display
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Year range: Current year to +10 years
  const YEAR_MIN = new Date().getFullYear();
  const YEAR_MAX = YEAR_MIN + 10;

  // Utility functions for gesture calculations
  const calculateAngle = (x: number, y: number, centerX: number, centerY: number): number => {
    return Math.atan2(y - centerY, x - centerX);
  };

  const normalizeAngle = (angle: number): number => {
    return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  };

  // Day wheel gesture implementation (WheelGesture interface)
  const dayWheelGesture: WheelGesture = {
    onRotationStart: (startAngle: number) => {
      dayGestureState.isActive = true;
      dayGestureState.startAngle = startAngle;
      dayGestureState.currentRotation = 0;
    },

    onRotationUpdate: (currentAngle: number, deltaAngle: number) => {
      if (!dayGestureState.isActive) return;
      
      dayGestureState.currentRotation += deltaAngle;
      
      // Apply rotation to animated value
      dayWheelRotation.setValue(dayGestureState.currentRotation);
    },

    onRotationEnd: (finalAngle: number, velocity: number) => {
      if (!dayGestureState.isActive) return;
      
      dayGestureState.isActive = false;
      dayGestureState.velocity = velocity;
      
      // Calculate target snap position
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      const targetAngle = dayWheelGesture.snapToPosition(finalAngle);
      const newDay = dayWheelGesture.getValueFromAngle(targetAngle);
      
      // Animate to snap position with physics
      Animated.spring(dayWheelRotation, {
        toValue: targetAngle,
        tension: WHEEL_SNAP_TENSION,
        friction: WHEEL_SNAP_FRICTION,
        useNativeDriver: true,
      }).start(() => {
        if (newDay >= 1 && newDay <= maxDays) {
          handleDaySelect(newDay);
        }
      });
    },

    snapToPosition: (angle: number): number => {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      const anglePerDay = (2 * Math.PI) / maxDays;
      const snappedIndex = Math.round(angle / anglePerDay);
      return snappedIndex * anglePerDay;
    },

    getValueFromAngle: (angle: number): number => {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      const anglePerDay = (2 * Math.PI) / maxDays;
      const normalizedAngle = normalizeAngle(angle);
      return Math.floor(normalizedAngle / anglePerDay) + 1;
    }
  };

  // Month wheel gesture implementation (WheelGesture interface)
  const monthWheelGesture: WheelGesture = {
    onRotationStart: (startAngle: number) => {
      monthGestureState.isActive = true;
      monthGestureState.startAngle = startAngle;
      monthGestureState.currentRotation = 0;
    },

    onRotationUpdate: (currentAngle: number, deltaAngle: number) => {
      if (!monthGestureState.isActive) return;
      
      monthGestureState.currentRotation += deltaAngle;
      
      // Apply rotation to animated value
      monthWheelRotation.setValue(monthGestureState.currentRotation);
    },

    onRotationEnd: (finalAngle: number, velocity: number) => {
      if (!monthGestureState.isActive) return;
      
      monthGestureState.isActive = false;
      monthGestureState.velocity = velocity;
      
      // Calculate target snap position
      const targetAngle = monthWheelGesture.snapToPosition(finalAngle);
      const newMonth = monthWheelGesture.getValueFromAngle(targetAngle);
      
      // Animate to snap position with physics
      Animated.spring(monthWheelRotation, {
        toValue: targetAngle,
        tension: WHEEL_SNAP_TENSION,
        friction: WHEEL_SNAP_FRICTION,
        useNativeDriver: true,
      }).start(() => {
        if (newMonth >= 1 && newMonth <= 12) {
          handleMonthSelect(newMonth);
        }
      });
    },

    snapToPosition: (angle: number): number => {
      const anglePerMonth = (2 * Math.PI) / 12;
      const snappedIndex = Math.round(angle / anglePerMonth);
      return snappedIndex * anglePerMonth;
    },

    getValueFromAngle: (angle: number): number => {
      const anglePerMonth = (2 * Math.PI) / 12;
      const normalizedAngle = normalizeAngle(angle);
      return Math.floor(normalizedAngle / anglePerMonth) + 1;
    }
  };

  // Year scroll gesture implementation (YearScrollGesture interface)
  const yearScrollGesture: YearScrollGesture = {
    onScrollStart: (startY: number) => {
      yearGestureState.isActive = true;
      yearGestureState.startY = startY;
      yearGestureState.currentDelta = 0;
    },

    onScrollUpdate: (deltaY: number) => {
      if (!yearGestureState.isActive) return;
      
      yearGestureState.currentDelta = deltaY;
      
      // Calculate year delta using sensitivity
      const yearDelta = yearScrollGesture.getYearDelta(deltaY);
      
      // Preview year change (visual feedback only)
      if (Math.abs(yearDelta) >= 1) {
        const newYear = selectedYear + Math.round(yearDelta);
        if (newYear >= YEAR_MIN && newYear <= YEAR_MAX) {
          // Visual preview without committing
          setSelectedYear(newYear);
        }
      }
    },

    onScrollEnd: (velocity: number) => {
      if (!yearGestureState.isActive) return;
      
      yearGestureState.isActive = false;
      yearGestureState.velocity = velocity;
      
      // Calculate final year change with momentum
      const momentumDelta = velocity * 0.1; // Momentum factor
      const totalDelta = yearScrollGesture.getYearDelta(yearGestureState.currentDelta + momentumDelta);
      const newYear = selectedYear + Math.round(totalDelta);
      
      // Animate to final year
      const clampedYear = Math.max(YEAR_MIN, Math.min(YEAR_MAX, newYear));
      
      Animated.timing(new Animated.Value(selectedYear), {
        toValue: clampedYear,
        duration: YEAR_CHANGE_DURATION,
        useNativeDriver: false,
      }).start(() => {
        handleYearChange(clampedYear);
      });
    },

    getYearDelta: (scrollDistance: number): number => {
      return scrollDistance * YEAR_SCROLL_SENSITIVITY;
    }
  };

  // Handle day selection with animation
  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    // Animate day selection
    Animated.sequence([
      Animated.timing(selectedDayScale, {
        toValue: SELECTION_SCALE_FACTOR,
        duration: SELECTION_HIGHLIGHT_DURATION / 2,
        useNativeDriver: true,
      }),
      Animated.timing(selectedDayScale, {
        toValue: 1,
        duration: SELECTION_HIGHLIGHT_DURATION / 2,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Haptic feedback
    Vibration.vibrate(50);
  };

  // Handle month selection with day validation
  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    
    // Auto-adjust day if invalid for new month
    const adjustedDay = validateDayForMonth(selectedDay, month, selectedYear);
    if (adjustedDay !== selectedDay) {
      setSelectedDay(adjustedDay);
      // Visual feedback for auto-adjustment
      Animated.timing(selectedDayScale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(selectedDayScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }

    // Animate month selection
    Animated.sequence([
      Animated.timing(selectedMonthScale, {
        toValue: SELECTION_SCALE_FACTOR,
        duration: SELECTION_HIGHLIGHT_DURATION / 2,
        useNativeDriver: true,
      }),
      Animated.timing(selectedMonthScale, {
        toValue: 1,
        duration: SELECTION_HIGHLIGHT_DURATION / 2,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Haptic feedback
    Vibration.vibrate(50);
  };

  // Handle year selection with day validation
  const handleYearChange = (newYear: number) => {
    // Validate year range
    const clampedYear = Math.max(YEAR_MIN, Math.min(YEAR_MAX, newYear));
    setSelectedYear(clampedYear);
    
    // Re-validate day for leap year changes
    const adjustedDay = validateDayForMonth(selectedDay, selectedMonth, clampedYear);
    if (adjustedDay !== selectedDay) {
      setSelectedDay(adjustedDay);
      // Visual feedback for auto-adjustment
      Animated.timing(selectedDayScale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(selectedDayScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
    
    // Haptic feedback
    Vibration.vibrate(50);
  };

  // Enhanced error handling function
  const showErrorModal = (errorType: keyof typeof COMMON_ERRORS) => {
    setErrorMessage(COMMON_ERRORS[errorType]);
    setShowError(true);
    
    // Enhanced haptic feedback for errors
    Vibration.vibrate([100, 50, 100, 50, 100]);
  };

  // Handle OK button with enhanced validation
  const handleConfirm = () => {
    try {
      // Create Date object from selected values
      const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      
      // Validate date construction
      if (isNaN(selectedDate.getTime())) {
        showErrorModal('INVALID_DATE');
        return;
      }
      
      // Validate date is not in past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showErrorModal('INVALID_DATE');
        return;
      }
      
      // Additional validation: reasonable date range
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);
      
      if (selectedDate > maxDate) {
        showErrorModal('VALIDATION_ERROR');
        return;
      }
      
      // Apply selected date and close modal
      onSelectDate(selectedDate);
      onClose();
      
    } catch (error) {
      console.error('Date validation error:', error);
      showErrorModal('VALIDATION_ERROR');
    }
  };

  // Pan gesture handlers for wheels
  const handleDayWheelGesture = (event: any) => {
    const { nativeEvent } = event;
    const { state, translationX, translationY, velocityX, velocityY } = nativeEvent;
    
    const centerX = WHEEL_SIZE / 2;
    const centerY = WHEEL_SIZE / 2;
    
    const currentAngle = calculateAngle(
      translationX + centerX,
      translationY + centerY,
      centerX,
      centerY
    );
    
    switch (state) {
      case GestureState.BEGAN:
        dayWheelGesture.onRotationStart(currentAngle);
        break;
        
      case GestureState.ACTIVE:
        const deltaAngle = currentAngle - dayGestureState.startAngle;
        dayWheelGesture.onRotationUpdate(currentAngle, deltaAngle);
        break;
        
      case GestureState.END:
        const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        dayWheelGesture.onRotationEnd(currentAngle, velocity);
        break;
    }
  };

  const handleMonthWheelGesture = (event: any) => {
    const { nativeEvent } = event;
    const { state, translationX, translationY, velocityX, velocityY } = nativeEvent;
    
    const centerX = WHEEL_SIZE / 2;
    const centerY = WHEEL_SIZE / 2;
    
    const currentAngle = calculateAngle(
      translationX + centerX,
      translationY + centerY,
      centerX,
      centerY
    );
    
    switch (state) {
      case GestureState.BEGAN:
        monthWheelGesture.onRotationStart(currentAngle);
        break;
        
      case GestureState.ACTIVE:
        const deltaAngle = currentAngle - monthGestureState.startAngle;
        monthWheelGesture.onRotationUpdate(currentAngle, deltaAngle);
        break;
        
      case GestureState.END:
        const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        monthWheelGesture.onRotationEnd(currentAngle, velocity);
        break;
    }
  };

  const handleYearScrollGesture = (event: any) => {
    const { nativeEvent } = event;
    const { state, translationY, velocityY } = nativeEvent;
    
    switch (state) {
      case GestureState.BEGAN:
        yearScrollGesture.onScrollStart(translationY);
        break;
        
      case GestureState.ACTIVE:
        yearScrollGesture.onScrollUpdate(translationY);
        break;
        
      case GestureState.END:
        yearScrollGesture.onScrollEnd(velocityY);
        break;
    }
  };

  // Render day wheel (outer ring) with gesture handling
  const renderDayWheel = () => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    const days = Array.from({ length: maxDays }, (_, i) => i + 1);
    
    return (
      <PanGestureHandler onHandlerStateChange={handleDayWheelGesture}>
        <Animated.View style={[
          styles.dayWheel, 
          { 
            transform: [{ 
              rotate: dayWheelRotation.interpolate({
                inputRange: [-Math.PI * 2, Math.PI * 2],
                outputRange: ['-360deg', '360deg'],
              })
            }] 
          }
        ]}>
          {days.map((day, index) => {
            const angle = (index / maxDays) * 2 * Math.PI;
            const x = DAY_WHEEL_RADIUS * 0.85 * Math.cos(angle - Math.PI / 2);
            const y = DAY_WHEEL_RADIUS * 0.85 * Math.sin(angle - Math.PI / 2);
            const isSelected = day === selectedDay;
            
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayItem,
                  {
                    left: WHEEL_SIZE / 2 + x - 20,
                    top: WHEEL_SIZE / 2 + y - 20,
                    backgroundColor: isSelected ? SELECTED_COLOR : UNSELECTED_COLOR,
                  },
                  isSelected && { transform: [{ scale: selectedDayScale }] }
                ]}
                onPress={() => handleDaySelect(day)}
              >
                <Animated.Text
                  style={[
                    styles.dayText,
                    { color: isSelected ? TEXT_SELECTED : TEXT_UNSELECTED }
                  ]}
                >
                  {day}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // Render month wheel (inner ring) with gesture handling
  const renderMonthWheel = () => {
    return (
      <PanGestureHandler onHandlerStateChange={handleMonthWheelGesture}>
        <Animated.View style={[
          styles.monthWheel, 
          { 
            transform: [{ 
              rotate: monthWheelRotation.interpolate({
                inputRange: [-Math.PI * 2, Math.PI * 2],
                outputRange: ['-360deg', '360deg'],
              })
            }] 
          }
        ]}>
          {MONTHS.map((month, index) => {
            const monthNumber = index + 1;
            const angle = (index / 12) * 2 * Math.PI;
            const x = MONTH_WHEEL_RADIUS * 0.85 * Math.cos(angle - Math.PI / 2);
            const y = MONTH_WHEEL_RADIUS * 0.85 * Math.sin(angle - Math.PI / 2);
            const isSelected = monthNumber === selectedMonth;
            
            return (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthItem,
                  {
                    left: WHEEL_SIZE / 2 + x - 25,
                    top: WHEEL_SIZE / 2 + y - 20,
                    backgroundColor: isSelected ? SELECTED_COLOR : UNSELECTED_COLOR,
                  },
                  isSelected && { transform: [{ scale: selectedMonthScale }] }
                ]}
                onPress={() => handleMonthSelect(monthNumber)}
              >
                <Animated.Text
                  style={[
                    styles.monthText,
                    { color: isSelected ? TEXT_SELECTED : TEXT_UNSELECTED }
                  ]}
                >
                  {month}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // Render year selection (center) with scroll gesture
  const renderYearSelection = () => {
    return (
      <PanGestureHandler 
        onHandlerStateChange={handleYearScrollGesture}
        minPointers={1}
        maxPointers={1}
      >
        <Animated.View style={styles.yearContainer}>
          <TouchableOpacity
            style={styles.yearArrow}
            onPress={() => handleYearChange(selectedYear - 1)}
          >
            <Ionicons name="chevron-up" size={24} color={ARROW_COLOR} />
          </TouchableOpacity>
          
          <Text style={styles.yearText}>{selectedYear}</Text>
          
          <TouchableOpacity
            style={styles.yearArrow}
            onPress={() => handleYearChange(selectedYear + 1)}
          >
            <Ionicons name="chevron-down" size={24} color={ARROW_COLOR} />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Dark overlay */}
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={onClose}
        >
          {/* Modal content */}
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('goals.selectTargetDate')}</Text>
            </View>

            {/* Calendar Wheel */}
            <View style={styles.wheelContainer}>
              {renderDayWheel()}
              {renderMonthWheel()}
              {renderYearSelection()}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.okButton} onPress={handleConfirm}>
                <Text style={styles.okButtonText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Enhanced Error Modal */}
        <ErrorModal
          visible={showError}
          onClose={() => setShowError(false)}
          title={t('common.error')}
          message={errorMessage}
        />
      </GestureHandlerRootView>
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
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    backgroundColor: Colors.background,
    borderRadius: 12,
    elevation: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayWheel: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  dayItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  monthWheel: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  monthItem: {
    position: 'absolute',
    width: 50,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  yearContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: YEAR_BACKGROUND,
    width: YEAR_CENTER_SIZE,
    height: YEAR_CENTER_SIZE,
    borderRadius: YEAR_CENTER_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  yearArrow: {
    padding: 4,
  },
  yearText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginVertical: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  okButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
});