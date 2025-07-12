import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { today } from '@/src/utils/date';
import { Colors, Layout } from '@/src/constants';
import GratitudeInput from '@/src/components/gratitude/GratitudeInput';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import DailyGratitudeProgress from '@/src/components/gratitude/DailyGratitudeProgress';

export default function GratitudeScreen() {
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const [showInput, setShowInput] = useState(false);
  
  const todayDate = today();
  const todaysGratitudes = actions.getGratitudesByDate(todayDate);
  const currentCount = todaysGratitudes.length;
  const isComplete = currentCount >= 3;
  const hasBonus = currentCount >= 4;

  const handleInputSuccess = useCallback(() => {
    setShowInput(false);
    const newCount = currentCount + 1;
    
    // Show celebration on 3rd gratitude
    if (newCount === 3) {
      Alert.alert(
        t('gratitude.celebration.title'),
        t('gratitude.celebration.message'),
        [
          {
            text: t('gratitude.celebration.continue'),
          },
        ]
      );
    }
    
    // Show milestone alerts for bonus gratitudes
    const bonusCount = newCount - 3;
    if (bonusCount === 1) {
      Alert.alert(
        t('gratitude.milestone1_title'),
        t('gratitude.milestone1_text')
      );
    } else if (bonusCount === 5) {
      Alert.alert(
        t('gratitude.milestone5_title'),
        t('gratitude.milestone5_text')
      );
    } else if (bonusCount === 10) {
      Alert.alert(
        t('gratitude.milestone10_title'),
        t('gratitude.milestone10_text')
      );
    }
  }, [currentCount, t]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <DailyGratitudeProgress
          currentCount={currentCount}
          isComplete={isComplete}
          hasBonus={hasBonus}
        />
        
        {showInput && (
          <GratitudeInput 
            onSubmitSuccess={handleInputSuccess} 
            isBonus={isComplete}
          />
        )}
        
        {!showInput && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowInput(true)}
            >
              <Text style={styles.addButtonText}>
                + {t('gratitude.addGratitude')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <GratitudeList
          gratitudes={todaysGratitudes}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: Layout.spacing.md,
  },
  addButtonContainer: {
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Layout.spacing.md,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});