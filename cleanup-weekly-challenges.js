// Weekly Challenge Cleanup Script
// Run this script to clean up all Weekly Challenge data from AsyncStorage

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Weekly Challenge AsyncStorage keys to be removed
const WEEKLY_CHALLENGE_STORAGE_KEYS = [
  'weekly_challenges_active',
  'weekly_challenges_progress', 
  'weekly_challenges_history',
  'weekly_challenges_user_level_cache',
  'weekly_challenges_generation_data',
];

async function cleanupWeeklyChallengeData() {
  try {
    console.log('🧹 Starting Weekly Challenge data cleanup...');
    
    // Check what data exists first
    console.log('\n📊 Checking existing data:');
    for (const key of WEEKLY_CHALLENGE_STORAGE_KEYS) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}: ${value ? 'EXISTS' : 'NOT FOUND'}`);
      } catch (error) {
        console.log(`${key}: ERROR checking`);
      }
    }
    
    // Remove all Weekly Challenge keys
    console.log('\n🗑️ Removing Weekly Challenge keys:');
    const removalPromises = WEEKLY_CHALLENGE_STORAGE_KEYS.map(async (key) => {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
        return { key, success: true };
      } catch (error) {
        console.error(`❌ Failed to remove ${key}:`, error);
        return { key, success: false, error };
      }
    });
    
    const results = await Promise.allSettled(removalPromises);
    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;
    
    console.log(`\n✅ Weekly Challenge cleanup completed: ${successCount}/${WEEKLY_CHALLENGE_STORAGE_KEYS.length} keys removed`);
    console.log('🎉 Monthly Challenge system is now the sole challenge system!');
    
  } catch (error) {
    console.error('❌ Weekly Challenge cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanupWeeklyChallengeData()
    .then(() => {
      console.log('✅ Cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupWeeklyChallengeData };