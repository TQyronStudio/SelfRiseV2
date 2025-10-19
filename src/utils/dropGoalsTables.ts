/**
 * TEMPORARY UTILITY - Drop goals tables for migration
 * DELETE THIS FILE after Phase 1.3 is complete
 */

import { getDatabase } from '../services/database/init';

export async function dropGoalsTables() {
  try {
    console.log('🗑️ Dropping goals tables...');
    const db = getDatabase();

    await db.execAsync('DROP TABLE IF EXISTS goal_progress');
    await db.execAsync('DROP TABLE IF EXISTS goal_milestones');
    await db.execAsync('DROP TABLE IF EXISTS goals');

    console.log('✅ Goals tables dropped successfully');
    console.log('🔄 Please reload the app (Cmd+R or shake device) to recreate tables');

    return { success: true, message: 'Tables dropped. Reload app now.' };
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
    return { success: false, error };
  }
}

// Expose globally for console access
if (typeof global !== 'undefined') {
  (global as any).dropGoalsTables = dropGoalsTables;
}
