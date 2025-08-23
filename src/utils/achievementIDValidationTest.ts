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
    // HABITS Category
    'first-habit',
    'habit-builder', 
    'century-club',
    'consistency-king',
    'streak-champion',
    'century-streak',
    'multi-tasker',
    'habit-legend',
    
    // JOURNAL Category  
    'first-journal',
    'deep-thinker',
    'journal-enthusiast',
    'grateful-heart',
    'gratitude-guru', 
    'eternal-gratitude',
    'bonus-seeker',
    
    // GOALS Category
    'first-goal',
    'goal-getter',
    'goal-achiever', 
    'goal-champion',
    'achievement-unlocked',
    'ambitious',
    'progress-tracker',
    
    // CONSISTENCY Category
    'weekly-warrior',
    'monthly-master',
    'hundred-days',
    'journal-streaker',
    'daily-visitor',
    'dedicated-user',
    
    // MASTERY Category
    'level-up',
    'selfrise-expert',
    'selfrise-master', 
    'ultimate-selfrise-legend',
    'trophy-collector-basic',
    'trophy-collector-master'
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

## NEXT STEPS:
${missingIDs.length > 0 ? '1. Fix remaining ID mismatches\n2. Implement preview logic for uncovered achievements' : '1. Implement preview logic for remaining ' + uncoveredIDs.length + ' achievements\n2. Test functionality with real user data'}
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