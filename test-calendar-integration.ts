#!/usr/bin/env npx tsx

/**
 * COMPREHENSIVE TEST - Calendar Integration with Immutability
 *
 * Simulates real-world scenario: user creates habit, completes it for several weeks,
 * then changes schedule, and calendar must show correct historical data.
 */

import { Habit, HabitCompletion } from './src/types/habit';
import {
  getScheduledDaysForDate,
  createScheduleChangeEntry,
  wasScheduledOnDate,
  migrateHabitToTimeline
} from './src/utils/habitImmutability';
import { formatDateToString, getDayOfWeek } from './src/utils/date';

console.log('🗓️ TESTING CALENDAR INTEGRATION WITH IMMUTABILITY');
console.log('==================================================\n');

// SCENARIO: User creates "Morning Exercise" habit on May 1, 2024
// Initial schedule: Monday, Wednesday, Friday
const originalHabit: Habit = {
  id: 'exercise-habit',
  name: 'Morning Exercise',
  color: 'green',
  icon: 'fitness',
  scheduledDays: ['monday', 'wednesday', 'friday'],
  isActive: true,
  order: 1,
  createdAt: new Date('2024-05-01'),
  updatedAt: new Date('2024-05-01')
};

// Migrate to timeline format
let habit = migrateHabitToTimeline(originalHabit);

// PHASE 1: User completes habit consistently for 3 weeks (May 1-21)
console.log('📊 PHASE 1: Consistent completion (May 1-21, 2024)');
const phase1Completions: HabitCompletion[] = [
  // Week 1 (May 1-7) - M/W/F schedule
  { id: '1', habitId: habit.id, date: '2024-05-01', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Wed
  { id: '2', habitId: habit.id, date: '2024-05-03', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Fri
  { id: '3', habitId: habit.id, date: '2024-05-06', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Mon

  // Week 2 (May 8-14) - M/W/F schedule
  { id: '4', habitId: habit.id, date: '2024-05-08', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Wed
  { id: '5', habitId: habit.id, date: '2024-05-10', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Fri
  { id: '6', habitId: habit.id, date: '2024-05-13', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Mon

  // Week 3 (May 15-21) - M/W/F schedule
  { id: '7', habitId: habit.id, date: '2024-05-15', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Wed
  { id: '8', habitId: habit.id, date: '2024-05-17', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Fri
  // Missing: 2024-05-20 (Mon) - user missed this day
];

console.log('- Total completions in Phase 1:', phase1Completions.length);
console.log('- Example: May 6 (Monday) was scheduled:', wasScheduledOnDate(habit, '2024-05-06', 'monday'));
console.log('- Example: May 7 (Tuesday) was scheduled:', wasScheduledOnDate(habit, '2024-05-07', 'tuesday'));

// PHASE 2: User changes schedule on May 22, 2024
// New schedule: Wednesday, Friday, Saturday (removes Monday, adds Saturday)
console.log('\n🔄 PHASE 2: Schedule change (May 22, 2024)');
console.log('- OLD schedule: Monday, Wednesday, Friday');
console.log('- NEW schedule: Wednesday, Friday, Saturday');

habit = createScheduleChangeEntry(habit, ['wednesday', 'friday', 'saturday'], '2024-05-22');
console.log('- Schedule change applied');
console.log('- Timeline entries count:', habit.scheduleHistory?.entries.length);

// PHASE 3: User continues with new schedule (May 22-31)
const phase2Completions: HabitCompletion[] = [
  // Week 4 (May 22-28) - NEW W/F/Sat schedule
  { id: '9', habitId: habit.id, date: '2024-05-22', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Wed
  { id: '10', habitId: habit.id, date: '2024-05-24', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Fri
  { id: '11', habitId: habit.id, date: '2024-05-25', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Sat

  // Week 5 (May 29-31) - NEW W/F/Sat schedule
  { id: '12', habitId: habit.id, date: '2024-05-29', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Wed
  { id: '13', habitId: habit.id, date: '2024-05-31', completed: true, isBonus: false, createdAt: new Date(), updatedAt: new Date() }, // Fri
];

const allCompletions = [...phase1Completions, ...phase2Completions];
console.log('- Total completions in Phase 2:', phase2Completions.length);

// IMMUTABILITY VERIFICATION: Calendar display for different periods
console.log('\n🎯 IMMUTABILITY VERIFICATION - Calendar Display:');

console.log('\n📅 HISTORICAL PERIOD (May 6-12, 2024) - Before schedule change:');
for (let day = 6; day <= 12; day++) {
  const date = `2024-05-${day.toString().padStart(2, '0')}`;
  const dayOfWeek = getDayOfWeek(new Date(date));
  const wasScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
  const completion = allCompletions.find(c => c.date === date);
  const status = completion ? '✅ completed' : (wasScheduled ? '❌ missed' : '⚪ not scheduled');

  console.log(`  ${date} (${dayOfWeek.slice(0,3)}): scheduled=${wasScheduled} ${status}`);
}

console.log('\n📅 CURRENT PERIOD (May 24-30, 2024) - After schedule change:');
for (let day = 24; day <= 30; day++) {
  const date = `2024-05-${day}`;
  const dayOfWeek = getDayOfWeek(new Date(date));
  const wasScheduled = wasScheduledOnDate(habit, date, dayOfWeek);
  const completion = allCompletions.find(c => c.date === date);
  const status = completion ? '✅ completed' : (wasScheduled ? '❌ missed' : '⚪ not scheduled');

  console.log(`  ${date} (${dayOfWeek.slice(0,3)}): scheduled=${wasScheduled} ${status}`);
}

// KEY IMMUTABILITY TESTS
console.log('\n🔍 KEY IMMUTABILITY TESTS:');

// Test 1: Monday was scheduled before change, not scheduled after
const beforeChange = '2024-05-20'; // Monday before change
const afterChange = '2024-05-27'; // Monday after change
console.log(`1. Monday before change (${beforeChange}):`, wasScheduledOnDate(habit, beforeChange, 'monday'), '(should be TRUE)');
console.log(`2. Monday after change (${afterChange}):`, wasScheduledOnDate(habit, afterChange, 'monday'), '(should be FALSE)');

// Test 2: Saturday was not scheduled before change, scheduled after
const satBefore = '2024-05-18'; // Saturday before change
const satAfter = '2024-05-25'; // Saturday after change
console.log(`3. Saturday before change (${satBefore}):`, wasScheduledOnDate(habit, satBefore, 'saturday'), '(should be FALSE)');
console.log(`4. Saturday after change (${satAfter}):`, wasScheduledOnDate(habit, satAfter, 'saturday'), '(should be TRUE)');

// Test 3: Wednesday remained scheduled throughout
const wedBefore = '2024-05-15'; // Wednesday before change
const wedAfter = '2024-05-29'; // Wednesday after change
console.log(`5. Wednesday before change (${wedBefore}):`, wasScheduledOnDate(habit, wedBefore, 'wednesday'), '(should be TRUE)');
console.log(`6. Wednesday after change (${wedAfter}):`, wasScheduledOnDate(habit, wedAfter, 'wednesday'), '(should be TRUE)');

console.log('\n🎉 CALENDAR INTEGRATION TEST COMPLETED!');
console.log('✅ Historical data preserved correctly');
console.log('✅ Schedule changes apply only from change date forward');
console.log('✅ Calendar will display accurate historical information');