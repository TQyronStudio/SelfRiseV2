# Debt Recovery System - Comprehensive Testing Guide

## Overview
This guide provides both automated and manual testing scenarios to validate the critical fixes made to the debt recovery system.

## Critical Bug Fixes Validated
1. **calculateDebt()** returns 0 if user has 3+ entries today
2. **requiresAdsToday()** returns 0 if user has 3+ entries today  
3. **Ad counting bug** fixed (1 ad = 1 credit, no double counting)

## Automated Test Execution

### Running the Tests
```bash
# Run all debt recovery tests
npm test -- --testPathPattern="debtRecovery"

# Run with coverage
npm test -- --testPathPattern="debtRecovery" --coverage

# Run specific test file
npm test src/services/storage/__tests__/gratitudeStorage.debtRecovery.test.ts
npm test src/components/gratitude/__tests__/DebtRecoveryModal.test.tsx
```

### Test Coverage Areas
- **GratitudeStorage Logic Tests**: 45+ test scenarios
- **DebtRecoveryModal UI Tests**: 20+ test scenarios
- **Edge Cases**: Boundary conditions, error handling
- **Integration Tests**: End-to-end debt payment flow

## Manual Testing Scenarios

### Prerequisites
1. Install the app on a test device
2. Ensure you have access to test ads (development mode)
3. Be able to manipulate system date for testing (if needed)

### Scenario 1: Primary Bug - User with 3+ Entries Today Shows Debt = 0

**Setup**:
1. User has missed 2-3 days previously
2. Today user has already written 3+ gratitude entries

**Test Steps**:
1. Open the app
2. Navigate to Journal/Gratitude section
3. Check if any debt recovery UI appears
4. Verify debt calculation in streak display

**Expected Result**:
-  NO debt recovery modal or warnings should appear
-  Debt should be 0 (user already completed today)
-  User can write additional entries normally

**Before Fix**: Would show debt > 0 and ask for ads
**After Fix**: Shows debt = 0, no ads needed

### Scenario 2: Ad Counting - 1 Ad = 1 Credit

**Setup**:
1. User has 1-2 days debt
2. User has 0-2 entries today (not completed)

**Test Steps**:
1. Open debt recovery modal
2. Note initial ads needed (should equal debt days)
3. Watch exactly 1 ad
4. Check updated ads progress
5. Repeat until all ads watched

**Expected Result**:
-  After watching 1 ad: Progress shows "1/X ads watched"
-  After watching 2 ads: Progress shows "2/X ads watched"  
-  No double counting or off-by-one errors
-  Completion happens when adsWatched = totalAdsNeeded

**Before Fix**: Watching 1 ad would count as 2, causing confusion
**After Fix**: 1 ad = 1 credit exactly

### Scenario 3: Edge Case - Exactly 3 Entries Today

**Setup**:
1. User missed some days previously
2. User writes exactly 3 entries today

**Test Steps**:
1. Write 1st entry - should show debt if any
2. Write 2nd entry - still should show debt
3. Write 3rd entry - debt should disappear immediately

**Expected Result**:
-  After 3rd entry: Debt becomes 0 automatically
-  No ads needed, can write more entries freely
-  Streak recovery UI disappears

### Scenario 4: Complete Debt Payment Flow

**Setup**:
1. User has 2 days debt
2. User has 0 entries today

**Test Steps**:
1. Try to write gratitude entry - should trigger debt modal
2. Note ads needed (should be 2)
3. Watch first ad - check progress
4. Watch second ad - should complete debt payment
5. Try writing entry again - should work normally

**Expected Result**:
-  Initial: "Need to watch 2 ads"
-  After 1 ad: "Need to watch 1 more ad"
-  After 2 ads: "Debt paid! Can write entries normally"
-  Can write entries without more ads

### Scenario 5: Boundary Conditions

**Test 5a: Exactly 3 Days Debt**
- Setup: User missed exactly 3 days
- Expected: Can recover with 3 ads (boundary of recovery system)

**Test 5b: More than 3 Days Debt**
- Setup: User missed 4+ days  
- Expected: Auto-reset triggered, no ads needed

**Test 5c: Single Day Debt**
- Setup: User missed only yesterday
- Expected: Need exactly 1 ad to recover

### Scenario 6: Error Handling

**Test 6a: Ad Loading Failure**
- Simulate ad loading failure
- Expected: Shows error message, allows retry

**Test 6b: Network Issues**
- Test with poor network connection
- Expected: Graceful error handling, retry mechanism

## Test Data Setup

### Creating Test Scenarios

**For 2-day debt scenario**:
```javascript
// Simulate in app or use debug tools
const testData = [
  // Today: 0 entries (incomplete)
  // Yesterday: 0 entries (missed)
  // Day before: 0 entries (missed)  
  // 3 days ago: 3 entries (last completed day)
  { date: '2025-07-30', entries: 3 },
  { date: '2025-07-31', entries: 0 },
  { date: '2025-08-01', entries: 0 },
  { date: '2025-08-02', entries: 0 }, // Today
];
```

**For completed today scenario**:
```javascript
const testData = [
  // Today: 3 entries (completed)
  { date: '2025-08-02', entries: 3 }, // Today - COMPLETED
  { date: '2025-08-01', entries: 0 }, // Yesterday - missed
  { date: '2025-07-31', entries: 0 }, // Day before - missed
  { date: '2025-07-30', entries: 3 }, // Last completed
];
```

## Validation Checklist

### Critical Logic Validation
- [ ]  User with 3+ entries today: debt = 0
- [ ]  User with <3 entries today: debt = missed days count
- [ ]  Ad counting: 1 ad watched = 1 ad credited
- [ ]  Completion detection: works when adsWatched = totalAdsNeeded
- [ ]  No off-by-one errors in any calculations

### UI/UX Validation  
- [ ]  Progress bars show accurate percentages
- [ ]  Button text shows correct "Watch Ad X/Y" format
- [ ]  Completion state shows "Recovery Complete!" 
- [ ]  Error states handled gracefully
- [ ]  Loading states prevent multiple ad requests

### Integration Validation
- [ ]  Debt payment creates appropriate fake entries
- [ ]  Streak calculation updates correctly after payment
- [ ]  User can write normal entries after debt clearance
- [ ]  No impossible states (entries exist but debt shows)

### Edge Case Validation
- [ ]  Exactly 3 entries boundary
- [ ]  Exactly 3 days debt boundary  
- [ ]  Single day debt scenarios
- [ ]  Auto-reset for >3 days debt
- [ ]  New user with no entries

## Test Results Documentation

### Template for Manual Test Results
```
Test: [Scenario Name]
Date: [Test Date]
Tester: [Your Name]
Result:  PASS / L FAIL
Notes: [Any observations or issues]

Expected Behavior: [What should happen]
Actual Behavior: [What actually happened]
Screenshots: [If applicable]
```

### Expected Test Outcomes

**All tests should pass with the bug fixes in place. Any failures indicate:**
1. Regression in the fixed code
2. Additional edge cases not covered
3. Integration issues with other components

### Performance Notes
- Debt calculations should be fast (<50ms)
- Ad watching should not block UI
- Storage operations should be atomic
- No memory leaks during repeated testing

## Troubleshooting Common Issues

### Tests Failing
1. Check if mocks are properly configured
2. Verify date utilities are working correctly
3. Ensure AsyncStorage is properly mocked
4. Check for typos in test assertions

### Manual Testing Issues
1. Clear app data to reset state
2. Check device date/time settings
3. Verify test ad availability
4. Restart app if state becomes inconsistent

## Next Steps After Testing

1. **All tests pass**: Mark testing checkpoint as complete
2. **Tests fail**: Identify root cause and fix before proceeding
3. **New issues found**: Document and prioritize for next iteration
4. **Performance issues**: Profile and optimize if needed

## Contact for Issues

If you encounter any issues during testing:
1. Document the exact steps to reproduce
2. Include screenshots or screen recordings
3. Note device type and OS version
4. Check console logs for error messages

This comprehensive testing ensures the debt recovery system works correctly and maintains logical consistency throughout all user scenarios.