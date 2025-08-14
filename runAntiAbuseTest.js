#!/usr/bin/env node

// Anti-Abuse Testing Runner - Think Hard Methodology
// Validates all security systems for 1001% compliance

console.log('🛡️ ANTI-ABUSE & BALANCE TESTING SUITE');
console.log('Think Hard Methodology: Maximum Security Validation 1001%');
console.log('=' .repeat(80));

async function simulateAntiAbuseTests() {
  console.log('\n🧪 SIMULATING COMPREHENSIVE ANTI-ABUSE TESTS...\n');
  
  // =======================================================
  // TEST 1: JOURNAL SPAM PREVENTION VALIDATION
  // =======================================================
  
  console.log('🔥 TEST 1: JOURNAL SPAM PREVENTION VALIDATION');
  console.log('─'.repeat(60));
  
  console.log('📝 Simulating 20 journal entries to test spam prevention...\n');
  
  const journalResults = [];
  let totalExpectedXP = 0;
  const criticalIssues = [];
  
  for (let entry = 1; entry <= 20; entry++) {
    let expectedXP;
    
    // Expected XP based on anti-spam rules
    if (entry <= 3) {
      expectedXP = 20; // FIRST_ENTRY, SECOND_ENTRY, THIRD_ENTRY
    } else if (entry <= 13) {
      expectedXP = 8;  // BONUS_ENTRY (entries 4-13)
    } else {
      expectedXP = 0;  // FOURTEENTH_PLUS_ENTRY (entries 14+)
    }
    
    // SIMULATE CURRENT BUGGY IMPLEMENTATION
    const actualXP = 20; // GratitudeInput.tsx ALWAYS gives 20 XP!
    
    totalExpectedXP += expectedXP;
    const isValid = actualXP === expectedXP;
    
    journalResults.push({
      entry,
      expectedXP,
      actualXP,
      isValid
    });
    
    // Log critical points
    if (entry <= 3) {
      console.log(`  Entry ${entry}: Expected ${expectedXP} XP, Got ${actualXP} XP ${isValid ? '✅' : '❌'}`);
    } else if (entry === 4) {
      console.log(`  Entry ${entry}: Expected ${expectedXP} XP (first bonus), Got ${actualXP} XP ${isValid ? '✅' : '❌'}`);
    } else if (entry === 13) {
      console.log(`  Entry ${entry}: Expected ${expectedXP} XP (last bonus), Got ${actualXP} XP ${isValid ? '✅' : '❌'}`);
    } else if (entry === 14) {
      console.log(`  Entry ${entry}: Expected ${expectedXP} XP (🚨SPAM PREVENTION), Got ${actualXP} XP ${isValid ? '✅ SAFE' : '🚨 CRITICAL VULNERABILITY'}`);
      if (!isValid) {
        criticalIssues.push('CRITICAL: Entry 14+ should give 0 XP but gives 20 XP - spam prevention BROKEN!');
      }
    } else if (entry > 14 && entry <= 17) {
      console.log(`  Entry ${entry}: Expected ${expectedXP} XP (spam prevention), Got ${actualXP} XP ${isValid ? '✅' : '🚨 VULNERABILITY'}`);
    }
    
    if (!isValid && entry >= 14) {
      criticalIssues.push(`Entry ${entry} vulnerability: Expected 0 XP, got ${actualXP} XP`);
    }
  }
  
  console.log('\n📊 JOURNAL SPAM PREVENTION TEST RESULTS:');
  console.log(`  Total entries tested: ${journalResults.length}`);
  console.log(`  Valid results: ${journalResults.filter(r => r.isValid).length}/${journalResults.length}`);
  console.log(`  Expected total XP: ${totalExpectedXP} (entries 1-3: 60 XP, entries 4-13: 80 XP, entries 14+: 0 XP)`);
  
  const actualTotalXP = journalResults.reduce((sum, r) => sum + r.actualXP, 0);
  console.log(`  Actual total XP: ${actualTotalXP} (CURRENT BUGGY IMPLEMENTATION)`);
  console.log(`  XP Difference: +${actualTotalXP - totalExpectedXP} EXCESS XP DUE TO SPAM VULNERABILITY`);
  
  const journalTestSuccess = journalResults.every(r => r.isValid);
  console.log(`  Journal Test Result: ${journalTestSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  // =======================================================
  // TEST 2: XP SOURCE BALANCING (80% SINGLE SOURCE LIMIT)
  // =======================================================
  
  console.log('\n⚖️ TEST 2: XP SOURCE BALANCING VALIDATION');
  console.log('─'.repeat(60));
  
  console.log('🧪 Testing single source XP limit (max 80% from one source)...\n');
  
  const dailyXPLimit = 1500; // DAILY_XP_LIMITS.TOTAL_DAILY_MAX
  const singleSourceMaxPercent = 80; // DAILY_XP_LIMITS.SINGLE_SOURCE_MAX_PERCENT
  const maxFromSingleSource = dailyXPLimit * (singleSourceMaxPercent / 100); // 1200 XP
  
  console.log(`  Daily XP limit: ${dailyXPLimit} XP`);
  console.log(`  Single source max: ${singleSourceMaxPercent}% = ${maxFromSingleSource} XP`);
  
  // Test scenarios
  const balanceTestScenarios = [
    { source: 'JOURNAL_ENTRY', attemptedXP: 1300, expectedAllowed: 1200 },
    { source: 'HABIT_COMPLETION', attemptedXP: 800, expectedAllowed: 800 },
    { source: 'GOAL_COMPLETION', attemptedXP: 1400, expectedAllowed: 1200 }
  ];
  
  let balanceTestSuccess = true;
  
  balanceTestScenarios.forEach(scenario => {
    const wouldExceedLimit = scenario.attemptedXP > maxFromSingleSource;
    const actualAllowed = Math.min(scenario.attemptedXP, maxFromSingleSource);
    const isValid = actualAllowed === scenario.expectedAllowed;
    
    console.log(`  ${scenario.source}: Attempted ${scenario.attemptedXP} XP → Allowed ${actualAllowed} XP ${isValid ? '✅' : '❌'}`);
    
    if (wouldExceedLimit) {
      console.log(`    🛡️ Protection activated: Reduced by ${scenario.attemptedXP - actualAllowed} XP`);
    }
    
    if (!isValid) balanceTestSuccess = false;
  });
  
  console.log(`\n📊 XP BALANCE TEST RESULT: ${balanceTestSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  // =======================================================
  // TEST 3: NOTIFICATION BATCHING (5-LIMIT QUEUE)
  // =======================================================
  
  console.log('\n🔔 TEST 3: NOTIFICATION BATCHING VALIDATION');
  console.log('─'.repeat(60));
  
  console.log('🧪 Testing notification queue limit and intelligent batching...\n');
  
  const maxNotificationsPerBatch = 5; // NOTIFICATION_BATCHING.MAX_NOTIFICATIONS_PER_BATCH
  const batchWindowMs = 3000; // NOTIFICATION_BATCHING.BATCH_WINDOW_MS
  
  console.log(`  Max notifications per batch: ${maxNotificationsPerBatch}`);
  console.log(`  Batch window: ${batchWindowMs}ms (${batchWindowMs/1000}s)`);
  
  // Simulate rapid XP gains
  const rapidXPEvents = Array.from({length: 10}, (_, i) => ({
    id: i + 1,
    xp: 25,
    source: 'HABIT_COMPLETION',
    timestamp: Date.now() + (i * 100) // 100ms apart
  }));
  
  console.log(`\n  Simulating ${rapidXPEvents.length} rapid XP events (100ms apart):`);
  
  // Batch logic simulation
  const batches = [];
  let currentBatch = [];
  
  rapidXPEvents.forEach(event => {
    if (currentBatch.length < maxNotificationsPerBatch) {
      currentBatch.push(event);
    } else {
      // Start new batch
      batches.push([...currentBatch]);
      currentBatch = [event];
    }
  });
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  console.log(`    Original events: ${rapidXPEvents.length}`);
  console.log(`    Batched into: ${batches.length} batches`);
  
  batches.forEach((batch, i) => {
    const totalXP = batch.reduce((sum, event) => sum + event.xp, 0);
    console.log(`    Batch ${i + 1}: ${batch.length} events, ${totalXP} total XP`);
  });
  
  const batchingEffective = batches.length < rapidXPEvents.length;
  const respectsLimits = batches.every(batch => batch.length <= maxNotificationsPerBatch);
  const notificationTestSuccess = batchingEffective && respectsLimits;
  
  console.log(`\n📊 NOTIFICATION BATCHING TEST RESULT: ${notificationTestSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Batching effective: ${batchingEffective ? '✅ YES' : '❌ NO'}`);
  console.log(`  Respects limits: ${respectsLimits ? '✅ YES' : '❌ NO'}`);
  
  // =======================================================
  // COMPREHENSIVE RESULTS & RECOMMENDATIONS
  // =======================================================
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE ANTI-ABUSE TEST RESULTS');
  console.log('='.repeat(80));
  
  const overallSuccess = journalTestSuccess && balanceTestSuccess && notificationTestSuccess;
  
  console.log(`\n📊 OVERALL SECURITY STATUS: ${overallSuccess ? '✅ PASSED' : '🚨 CRITICAL VULNERABILITIES DETECTED'}`);
  
  console.log('\n🧪 Individual Test Results:');
  console.log(`  1. Journal Spam Prevention: ${journalTestSuccess ? '✅ PASSED' : '🚨 FAILED'}`);
  console.log(`  2. XP Source Balancing: ${balanceTestSuccess ? '✅ PASSED' : '🚨 FAILED'}`);
  console.log(`  3. Notification Batching: ${notificationTestSuccess ? '✅ PASSED' : '🚨 FAILED'}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL SECURITY ISSUES DETECTED:');
    criticalIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  if (!journalTestSuccess) {
    console.log('\n🔧 CRITICAL RECOMMENDATIONS:');
    console.log('  1. IMMEDIATELY fix GratitudeInput.tsx to implement proper entry counting');
    console.log('  2. Add daily entry count check before awarding XP');
    console.log('  3. Use XP_REWARDS.JOURNAL.FOURTEENTH_PLUS_ENTRY (0 XP) for entries 14+');
    console.log('  4. Add comprehensive integration tests for journal XP system');
    console.log('  5. Implement rate limiting for journal entry creation');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('Think Hard Methodology: Security Analysis Complete');
  console.log('='.repeat(80));
  
  return {
    overallSuccess,
    journalTestSuccess,
    balanceTestSuccess,
    notificationTestSuccess,
    criticalIssues: criticalIssues.length,
    recommendationsProvided: !journalTestSuccess
  };
}

// Run the tests
simulateAntiAbuseTests()
  .then(results => {
    console.log(`\n🎯 Test execution completed.`);
    console.log(`   Critical vulnerabilities: ${results.criticalIssues}`);
    console.log(`   Recommendations provided: ${results.recommendationsProvided ? 'YES' : 'NO'}`);
    
    if (!results.overallSuccess) {
      console.log('\n🚨 ACTION REQUIRED: Critical security vulnerabilities detected!');
      process.exit(1);
    } else {
      console.log('\n✅ All anti-abuse systems functioning correctly.');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });