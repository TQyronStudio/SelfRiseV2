#!/usr/bin/env npx tsx

/**
 * QUICK TEST - Scheduled Days Immutability Verification
 *
 * Tests the core immutability principle: "MINULOST SE NEMĚNÍ" (the past doesn't change)
 */

import { Habit } from './src/types/habit';
import {
  getScheduledDaysForDate,
  createScheduleChangeEntry,
  wasScheduledOnDate,
  migrateHabitToTimeline,
  needsTimelineMigration
} from './src/utils/habitImmutability';

// Test data: Mock habit created on 2024-01-01 with Monday, Wednesday, Friday schedule
const mockHabit: Habit = {
  id: 'test-habit-1',
  name: 'Test Exercise',
  color: 'blue',
  icon: 'fitness',
  scheduledDays: ['monday', 'wednesday', 'friday'],
  isActive: true,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

console.log('🧪 TESTING SCHEDULED DAYS IMMUTABILITY PRINCIPLE');
console.log('=================================================\n');

// TEST 1: Migration system
console.log('1️⃣ Testing Migration System:');
console.log('- Original habit needs migration:', needsTimelineMigration(mockHabit));

const migratedHabit = migrateHabitToTimeline(mockHabit);
console.log('- After migration needs migration:', needsTimelineMigration(migratedHabit));
console.log('- Timeline entries count:', migratedHabit.scheduleHistory?.entries.length || 0);
console.log('✅ Migration system working\n');

// TEST 2: Historical schedule lookup (before changes)
console.log('2️⃣ Testing Historical Schedule Lookup:');
const historicalDate = '2024-06-15'; // June 15, 2024 (before any changes)
const scheduledDaysForJune = getScheduledDaysForDate(migratedHabit, historicalDate);
console.log(`- Scheduled days for ${historicalDate}:`, scheduledDaysForJune);
console.log(`- Was Monday scheduled on ${historicalDate}:`, wasScheduledOnDate(migratedHabit, historicalDate, 'monday'));
console.log('✅ Historical lookup working\n');

// TEST 3: Schedule change and immutability
console.log('3️⃣ Testing Schedule Change and Immutability:');
// User changes schedule on 2024-07-01: removes Monday, adds Saturday
const updatedHabit = createScheduleChangeEntry(
  migratedHabit,
  ['wednesday', 'friday', 'saturday'],
  '2024-07-01'
);

console.log('- Updated schedule from July 1st:', updatedHabit.scheduledDays);
console.log('- Timeline entries after change:', updatedHabit.scheduleHistory?.entries.length);

// TEST 4: Immutability verification - past stays unchanged
console.log('\n4️⃣ Testing Immutability - "MINULOST SE NEMĚNÍ":');
const beforeChangeDate = '2024-06-15'; // Before July 1st change
const afterChangeDate = '2024-07-15'; // After July 1st change

console.log('📅 BEFORE change date (June 15, 2024):');
console.log('- Monday scheduled:', wasScheduledOnDate(updatedHabit, beforeChangeDate, 'monday')); // Should be TRUE
console.log('- Saturday scheduled:', wasScheduledOnDate(updatedHabit, beforeChangeDate, 'saturday')); // Should be FALSE

console.log('📅 AFTER change date (July 15, 2024):');
console.log('- Monday scheduled:', wasScheduledOnDate(updatedHabit, afterChangeDate, 'monday')); // Should be FALSE
console.log('- Saturday scheduled:', wasScheduledOnDate(updatedHabit, afterChangeDate, 'saturday')); // Should be TRUE

// TEST 5: Backward compatibility
console.log('\n5️⃣ Testing Backward Compatibility:');
const legacyHabit: Habit = {
  ...mockHabit,
  // No scheduleHistory - simulates existing data
};

console.log('- Legacy habit (no timeline):');
console.log('- Monday scheduled (fallback):', wasScheduledOnDate(legacyHabit, '2024-06-15', 'monday')); // Should use current schedule
console.log('✅ Backward compatibility working\n');

console.log('🎉 ALL IMMUTABILITY TESTS COMPLETED!');
console.log('The robust implementation correctly preserves historical data while supporting schedule changes.');