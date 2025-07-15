import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { DateString } from '@/src/types/common';
import { Gratitude } from '@/src/types/gratitude';
import { Colors, Layout } from '@/src/constants';
import { IconSymbol } from '@/components/ui/IconSymbol';
import GratitudeList from '@/src/components/gratitude/GratitudeList';
import EditGratitudeModal from '@/src/components/gratitude/EditGratitudeModal';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import { today, addDays, subtractDays, formatDateForDisplay } from '@/src/utils/date';

export default function JournalHistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { state, actions } = useGratitude();
  const [selectedDate, setSelectedDate] = useState<DateString>(today());
  const [searchTerm, setSearchTerm] = useState('');
  const [gratitudes, setGratitudes] = useState(actions.getGratitudesByDate(selectedDate));
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGratitude, setEditingGratitude] = useState<Gratitude | null>(null);
  const [deletingGratitude, setDeletingGratitude] = useState<Gratitude | null>(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      performSearch();
    } else {
      setIsSearching(false);
      setGratitudes(actions.getGratitudesByDate(selectedDate));
    }
  }, [searchTerm, selectedDate]);

  // Refresh gratitudes when state changes (after delete/edit)
  useEffect(() => {
    if (!isSearching) {
      setGratitudes(actions.getGratitudesByDate(selectedDate));
    }
  }, [state.gratitudes, selectedDate, isSearching]);

  const performSearch = async () => {
    try {
      const results = await actions.searchGratitudes(searchTerm);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search gratitudes');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDateString = direction === 'prev' 
      ? subtractDays(selectedDate, 1)
      : addDays(selectedDate, 1);
    
    setSelectedDate(newDateString);
    
    if (!isSearching) {
      setGratitudes(actions.getGratitudesByDate(newDateString));
    }
  };

  const goToToday = () => {
    const todayDate = today();
    setSelectedDate(todayDate);
    if (!isSearching) {
      setGratitudes(actions.getGratitudesByDate(todayDate));
    }
  };

  const formatDateForDisplayLocal = (date: DateString) => {
    return formatDateForDisplay(date, 'full');
  };

  const displayedGratitudes = isSearching ? searchResults : gratitudes;
  const isToday = selectedDate === today();

  const handleEditGratitude = (gratitude: Gratitude) => {
    setEditingGratitude(gratitude);
  };

  const handleDeleteGratitude = (gratitude: Gratitude) => {
    setDeletingGratitude(gratitude);
  };

  const confirmDelete = async () => {
    if (!deletingGratitude) return;
    
    try {
      await actions.deleteGratitude(deletingGratitude.id);
      
      // Force refresh to ensure all screens have latest data
      await actions.forceRefresh();
      
      // If searching, refresh search results
      if (isSearching) {
        performSearch();
      }
      // Note: useEffect will handle refreshing gratitudes list for regular view
      
      setDeletingGratitude(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete journal entry');
    }
  };

  const handleEditSuccess = async () => {
    // Force refresh to ensure all screens have latest data
    await actions.forceRefresh();
    
    // If searching, refresh search results
    if (isSearching) {
      performSearch();
    }
    // Note: useEffect will handle refreshing gratitudes list for regular view
    setEditingGratitude(null);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'card',
          animationTypeForReplace: 'push',
        }} 
      />
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal History</Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search journal entries..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Navigation - Hidden during search */}
      {!isSearching && (
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateButton}>
            <IconSymbol name="chevron.left" size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDateForDisplayLocal(selectedDate)}</Text>
            {!isToday && (
              <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => navigateDate('next')} 
            style={[styles.dateButton, selectedDate >= today() && styles.dateButtonDisabled]}
            disabled={selectedDate >= today()}
          >
            <IconSymbol 
              name="chevron.right" 
              size={20} 
              color={selectedDate >= today() ? Colors.textSecondary : Colors.primary} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isSearching && (
          <View style={styles.searchHeader}>
            <Text style={styles.searchResultsText}>
              {searchResults.length > 0 
                ? `Found ${searchResults.length} results for "${searchTerm}"`
                : `No results found for "${searchTerm}"`
              }
            </Text>
          </View>
        )}

        {displayedGratitudes.length > 0 ? (
          <GratitudeList 
            gratitudes={displayedGratitudes} 
            showDate={isSearching}
            onEdit={handleEditGratitude}
            onDelete={handleDeleteGratitude}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isSearching 
                ? 'No journal entries match your search.'
                : `No journal entries for ${formatDateForDisplayLocal(selectedDate)}.`
              }
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Edit Modal */}
      <EditGratitudeModal
        visible={editingGratitude !== null}
        gratitude={editingGratitude}
        onClose={() => setEditingGratitude(null)}
        onSuccess={handleEditSuccess}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deletingGratitude !== null}
        title="Delete Journal Entry"
        message={`Are you sure you want to delete this ${deletingGratitude?.type === 'gratitude' ? 'gratitude' : 'self-praise'} entry? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeletingGratitude(null)}
        emoji="🗑️"
      />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textInverse,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateButton: {
    padding: Layout.spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  todayButton: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  searchHeader: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  searchResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});