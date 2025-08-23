// Achievement ID Validation Test - Phase 1.3
// Validates that all achievement IDs in preview system match the catalog

import { CORE_ACHIEVEMENTS } from '../constants/achievementCatalog';
import { Achievement } from '../types/gamification';

/**
 * Validates that all achievement IDs used in preview system exist in catalog
 */
export const validateAchievementIDs = (): { 
  isValid: boolean; 
  report: string;
  missingIDs: string[];
  totalCatalogIDs: number;
  totalPreviewIDs: number;
} => {
  // Extract all IDs from catalog
  const catalogIDs = CORE_ACHIEVEMENTS.map(a => a.id);
  
  // Extract all IDs used in preview system (from achievementPreviewUtils.ts)
  const previewIDs = [
    // HABITS Category (8 achievements)
    'first-habit',
    'habit-builder', 
    'century-club',
    'consistency-king',
    'streak-champion',
    'century-streak',
    'multi-tasker',
    'habit-legend',
    
    // JOURNAL Category (7 achievements)
    'first-journal',
    'deep-thinker',
    'journal-enthusiast',
    'grateful-heart',
    'gratitude-guru', 
    'eternal-gratitude',
    'bonus-seeker',
    
    // GOALS Category (7 achievements)
    'first-goal',
    'goal-getter',
    'goal-achiever', 
    'goal-champion',
    'achievement-unlocked',
    'ambitious',
    'progress-tracker',
    
    // CONSISTENCY Category (8 achievements)
    'weekly-warrior',
    'monthly-master',
    'hundred-days',
    'journal-streaker',
    'daily-visitor',
    'dedicated-user',
    'perfect-month', // NEW in Phase 1.4
    'triple-crown',  // NEW in Phase 1.4
    
    // MASTERY Category (8 achievements)
    'level-up',
    'selfrise-expert',
    'selfrise-master', 
    'ultimate-selfrise-legend',
    'trophy-collector-basic',
    'trophy-collector-master',
    'recommendation-master', // NEW in Phase 1.4
    'balance-master',        // NEW in Phase 1.4
    
    // SPECIAL Category (14 achievements - 4 regular + 10 loyalty)
    'lightning-start',      // NEW in Phase 1.4
    'seven-wonder',         // NEW in Phase 1.4  
    'persistence-pays',     // NEW in Phase 1.4
    'legendary-master',     // NEW in Phase 1.4
    'loyalty-first-week',   // NEW in Phase 1.4
    'loyalty-two-weeks-strong', // NEW in Phase 1.4
    'loyalty-three-weeks-committed', // NEW in Phase 1.4
    'loyalty-month-explorer', // NEW in Phase 1.4
    'loyalty-two-month-veteran', // NEW in Phase 1.4
    'loyalty-century-user', // NEW in Phase 1.4
    'loyalty-half-year-hero', // NEW in Phase 1.4
    'loyalty-year-legend',  // NEW in Phase 1.4
    'loyalty-ultimate-veteran', // NEW in Phase 1.4
    'loyalty-master'        // NEW in Phase 1.4
  ];
  
  // Find missing IDs
  const missingIDs = previewIDs.filter(id => !catalogIDs.includes(id));
  
  // Find extra catalog IDs not covered by preview system
  const uncoveredIDs = catalogIDs.filter(id => !previewIDs.includes(id));
  
  const isValid = missingIDs.length === 0;
  
  const report = `
# Achievement ID Validation Report - Phase 1.3

## VALIDATION RESULTS
- **Status**: ${isValid ? '✅ ALL IDs VALID' : '❌ ID MISMATCHES FOUND'}
- **Total Catalog IDs**: ${catalogIDs.length}
- **Total Preview IDs**: ${previewIDs.length}
- **Missing IDs**: ${missingIDs.length}
- **Uncovered IDs**: ${uncoveredIDs.length}

## MISSING IDs (Preview system references non-existent achievements):
${missingIDs.length > 0 ? missingIDs.map(id => `❌ "${id}" - Does not exist in catalog`).join('\n') : '✅ No missing IDs found'}

## UNCOVERED IDs (Catalog achievements without preview logic):
${uncoveredIDs.length > 0 ? uncoveredIDs.slice(0, 10).map(id => `⚠️  "${id}" - No preview logic implemented`).join('\n') + (uncoveredIDs.length > 10 ? '\n... and ' + (uncoveredIDs.length - 10) + ' more' : '') : '✅ All catalog IDs have preview logic'}

## SYSTEM FUNCTIONALITY ESTIMATE:
- **Working achievements**: ${previewIDs.length - missingIDs.length}/${catalogIDs.length}
- **Functionality**: ${Math.round(((previewIDs.length - missingIDs.length) / catalogIDs.length) * 100)}%
- **Phase 1.4 Target**: 100% (all 52 achievements working)

## PHASE 1.4 IMPLEMENTATION STATUS:
- **Original working**: 25 achievements (48% functionality)  
- **New in Phase 1.4**: ${previewIDs.length - 25} achievements implemented
- **Total preview logic**: ${previewIDs.length} achievements
- **Target functionality**: ${previewIDs.length >= catalogIDs.length ? '🎯 100% TARGET ACHIEVED!' : 'Target: 52 achievements'}

## NEXT STEPS:
${missingIDs.length > 0 ? '❌ PHASE 1.4 INCOMPLETE:\n1. Fix remaining ID mismatches: ' + missingIDs.join(', ') + '\n2. Complete missing implementations' : uncoveredIDs.length > 0 ? '⚠️ CATALOG HAS MORE ACHIEVEMENTS:\n1. ' + uncoveredIDs.length + ' achievements in catalog but not in preview system\n2. Review catalog vs preview system coverage' : '✅ PHASE 1.4 COMPLETE:\n1. All achievement IDs match between systems\n2. 100% achievement compatibility achieved\n3. Ready for comprehensive testing'}
`;

  return {
    isValid,
    report,
    missingIDs,
    totalCatalogIDs: catalogIDs.length,
    totalPreviewIDs: previewIDs.length
  };
};

/**
 * Console test runner - run this to validate IDs
 */
export const runIDValidationTest = (): void => {
  console.log('🔍 Running Achievement ID Validation Test...\n');
  
  const result = validateAchievementIDs();
  
  console.log(result.report);
  
  if (result.isValid) {
    console.log('✅ SUCCESS: All achievement IDs are valid!');
  } else {
    console.error('❌ FAILURE: ID mismatches found. System will not work properly.');
    console.error('Missing IDs:', result.missingIDs);
  }
};

// Auto-run test if this file is executed directly
if (require.main === module) {
  runIDValidationTest();
}