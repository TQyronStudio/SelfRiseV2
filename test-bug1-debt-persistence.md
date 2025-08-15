# 🧪 BUG #1 DEBT PERSISTENCE - COMPREHENSIVE TEST SCENARIOS

## **OVERVIEW**
Testing the enhanced debt tracking system with incremental ad payment persistence to ensure Bug #1 is completely resolved.

## **CRITICAL SCENARIOS TO VALIDATE**

### **🎯 SCENARIO 1: Partial Debt Payment Persistence**
**Objective**: Verify debt payments persist across app sessions

**Test Steps**:
1. User has 3 days debt (missed 3 consecutive days)
2. User watches 1 ad → should reduce debt to 2 days
3. **CRITICAL**: Restart app / navigate away / come back next day
4. Check debt status → should show 2 days debt (NOT 4+ days)
5. User watches 1 more ad → should reduce debt to 1 day
6. Complete process → debt should be 0

**Expected Result**: ✅ Partial payments persist, no auto-reset triggered

---

### **🎯 SCENARIO 2: Incremental Payment Progress**
**Objective**: Each ad payment is immediately persisted

**Test Steps**:
1. Start with 3 days debt
2. Watch ad #1 → Verify debt immediately shows 2 days
3. Force close app
4. Reopen app → Verify debt still shows 2 days
5. Watch ad #2 → Verify debt immediately shows 1 day
6. Force close app
7. Reopen app → Verify debt still shows 1 day
8. Watch ad #3 → Verify debt shows 0 days

**Expected Result**: ✅ Each payment persists individually across app restarts

---

### **🎯 SCENARIO 3: Multi-Day Accumulation with Partial Payments**
**Objective**: Complex debt accumulation and payment over multiple days

**Test Steps**:
1. Day 1: Miss journal entries → 1 day debt
2. Day 2: Miss journal entries → 2 days debt
3. Day 3: Miss journal entries → 3 days debt
4. Day 4: Watch 1 ad → 2 days debt remaining
5. Day 5: Miss journal entries → Should be 3 days debt (2 + 1 new)
6. Day 6: Watch 2 ads → 1 day debt remaining
7. Verify no auto-reset triggered (≤ 3 days)

**Expected Result**: ✅ Debt accumulation works correctly with partial payments

---

### **🎯 SCENARIO 4: Auto-Reset Prevention**
**Objective**: Paid debt prevents premature auto-reset

**Test Steps**:
1. User accumulates 3 days debt
2. User watches 2 ads → 1 day debt remaining
3. User misses 2 more days → Should be 3 days debt total
4. System should NOT auto-reset (debt ≤ 3)
5. User watches 3 ads → All debt cleared

**Expected Result**: ✅ Auto-reset only triggers with genuine 4+ unpaid days

---

### **🎯 SCENARIO 5: Complete Payment Verification**
**Objective**: Full debt clearance works correctly

**Test Steps**:
1. Start with 3 days debt
2. Watch all 3 ads sequentially
3. Verify debt shows 0 after each payment
4. Verify streak unfrozen after complete payment
5. Verify user can write journal entries normally
6. Verify My Journal screen immediately reflects changes

**Expected Result**: ✅ Complete debt clearance unfreezes streak and enables entries

---

### **🎯 SCENARIO 6: Edge Case - Today Completion Override**
**Objective**: Completing today overrides debt calculation

**Test Steps**:
1. User has 2 days debt from previous days
2. User writes 3+ entries today
3. Debt should immediately show 0 (today completion override)
4. Streak should unfreeze automatically

**Expected Result**: ✅ Today completion clears debt regardless of payment history

---

### **🎯 SCENARIO 7: Audit Trail Verification**
**Objective**: Debt history tracking works correctly

**Test Steps**:
1. Create 3 days debt
2. Watch 2 ads (partial payment)
3. Check debt history → should show 2 payment entries
4. Force reset debt
5. Check debt history → should show force reset entry
6. Verify all timestamps and details are accurate

**Expected Result**: ✅ Complete audit trail maintained for debugging

---

## **TECHNICAL VALIDATION POINTS**

### **🔧 Storage Integrity**
- [ ] `debtPayments` array persists across app restarts
- [ ] `debtHistory` maintains chronological order
- [ ] `calculateDebt()` correctly accounts for paid days
- [ ] No data corruption in AsyncStorage

### **🔧 State Synchronization**
- [ ] Home screen debt indicator updates immediately
- [ ] My Journal entry blocking respects paid debt
- [ ] GratitudeContext refreshes correctly
- [ ] Modal progress bars show accurate state

### **🔧 Performance**
- [ ] Debt calculation remains fast with payment history
- [ ] No memory leaks from debt tracking objects
- [ ] UI remains responsive during payment processing

---

## **REGRESSION PREVENTION**

### **🛡️ Scenarios That Should NOT Happen**
1. **No Fake Entry Creation**: Force reset should NOT create golden bar entries
2. **No Streak Corruption**: Debt payment should NOT increment streak beyond correct value
3. **No Payment Loss**: Partial payments should NEVER be forgotten
4. **No Auto-Reset Bug**: Auto-reset should NOT trigger with valid partial payments

### **🛡️ Data Consistency Checks**
- Verify `debtDays` matches `calculateDebt()` output
- Verify `debtPayments` array reflects actual paid days
- Verify missed day calculation excludes properly paid days
- Verify streak preservation works correctly

---

## **SUCCESS CRITERIA**

✅ **Bug #1 RESOLVED**: Debt progress persists across all app sessions
✅ **No Regressions**: All existing functionality works correctly  
✅ **Performance**: No significant impact on app performance
✅ **Type Safety**: No TypeScript errors in debt tracking code
✅ **User Experience**: Smooth, predictable debt payment flow

---

*This comprehensive test plan ensures Bug #1 is completely resolved with robust debt payment persistence.*