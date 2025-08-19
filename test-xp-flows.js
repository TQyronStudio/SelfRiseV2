#!/usr/bin/env node

/**
 * Comprehensive XP Flow Test Script
 * Tests all gamification system functionality after bug fixes
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 COMPREHENSIVE XP SYSTEM TESTING');
console.log('=====================================');

const tests = [
  {
    name: 'TypeScript Compilation',
    cmd: 'npx tsc --noEmit',
    description: 'Ensure no type errors in XP system'
  },
  {
    name: 'Build Test',
    cmd: 'npx expo export --platform web --dev',
    description: 'Test build process with XP changes'
  },
  {
    name: 'Jest Unit Tests',
    cmd: 'npx jest --testPathPattern=gamification --verbose',
    description: 'Run gamification unit tests'
  }
];

async function runTest(test) {
  console.log(`\n🔍 Testing: ${test.name}`);
  console.log(`📝 ${test.description}`);
  console.log(`⚡ Command: ${test.cmd}\n`);

  return new Promise((resolve) => {
    const process = exec(test.cmd, { cwd: __dirname });
    
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${test.name} - PASSED\n`);
      } else {
        console.log(`❌ ${test.name} - FAILED (exit code: ${code})\n`);
      }
      resolve(code);
    });
  });
}

async function runAllTests() {
  console.log('Starting comprehensive XP system testing...\n');
  
  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await runTest(test);
    if (result === 0) passedTests++;
  }

  console.log('\n=====================================');
  console.log('🏆 TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! XP System is stable.');
  } else {
    console.log('\n⚠️ Some tests failed. Review output above.');
  }
}

runAllTests();