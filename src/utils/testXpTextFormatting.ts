/**
 * Test utility for verifying new XP text formatting
 * Tests the 2-line XP display format: Level info + Current/Total XP
 */

/**
 * Test the new XP text formatting
 */
export async function testXpTextFormatting(): Promise<void> {
  console.log('🧪 Testing New XP Text Formatting');
  console.log('=================================');
  
  // Mock formatNumber function (same as in component)
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Test scenarios with different XP amounts
  const testScenarios = [
    {
      name: 'Small XP (Early levels)',
      totalXP: 350,
      currentLevel: 3,
      xpProgress: 45,
      xpToNextLevel: 150,
    },
    {
      name: 'Medium XP (Mid levels)', 
      totalXP: 15197,
      currentLevel: 10,
      xpProgress: 21,
      xpToNextLevel: 3803,
    },
    {
      name: 'Large XP (High levels)',
      totalXP: 156789,
      currentLevel: 25,
      xpProgress: 67,
      xpToNextLevel: 23456,
    },
    {
      name: 'Very Large XP (Late game)',
      totalXP: 1567890,
      currentLevel: 50,
      xpProgress: 89,
      xpToNextLevel: 134567,
    },
    {
      name: 'Massive XP (End game)',
      totalXP: 15678901,
      currentLevel: 85,
      xpProgress: 5,
      xpToNextLevel: 2345678,
    }
  ];

  console.log('Testing XP Text Format:');
  console.log('');

  testScenarios.forEach(({ name, totalXP, currentLevel, xpProgress, xpToNextLevel }) => {
    // Generate old format (single line)
    const oldFormat = `Level ${currentLevel} ${Math.round(xpProgress)}% to lvl ${currentLevel + 1} ${formatNumber(xpToNextLevel)} XP to go`;
    
    // Generate new format (2 lines)
    const newFormatLine1 = `Level ${currentLevel} ${Math.round(xpProgress)}% to level ${currentLevel + 1}`;
    const newFormatLine2 = `${formatNumber(totalXP)}/${formatNumber(totalXP + xpToNextLevel)} XP`;
    
    console.log(`📊 ${name}:`);
    console.log(`   OLD: ${oldFormat}`);
    console.log(`   NEW: ${newFormatLine1}`);
    console.log(`        ${newFormatLine2}`);
    console.log('');
    
    // Check if old format is too long (over 50 characters)
    const isOldFormatTooLong = oldFormat.length > 50;
    const improvement = isOldFormatTooLong ? '✅ IMPROVEMENT' : '✓ Better layout';
    
    console.log(`   Length: OLD=${oldFormat.length} chars | NEW=${newFormatLine1.length}+${newFormatLine2.length} chars | ${improvement}`);
    console.log('   ───────────────────────────────────────────────────');
    console.log('');
  });

  console.log('=================================');
  console.log('✅ NEW FORMAT ADVANTAGES:');
  console.log('• Two lines prevent horizontal overflow');
  console.log('• Clear separation of level info and XP numbers');
  console.log('• Better readability with large XP amounts');
  console.log('• Consistent "current/total XP" format');
  console.log('• Single "XP" label instead of repetitive text');
  console.log('=================================');
}

/**
 * Quick test that can be called from console
 */
export async function quickXpFormatTest(): Promise<boolean> {
  try {
    await testXpTextFormatting();
    return true;
  } catch (error) {
    console.error('XP format test failed:', error);
    return false;
  }
}