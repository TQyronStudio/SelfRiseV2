/**
 * Script to regenerate November 2025 challenge with correct star rating
 *
 * This script will:
 * 1. Archive the current November challenge (set status to 'expired')
 * 2. Clear it from active challenges
 * 3. Let the lifecycle manager generate a new challenge with proper 3★ rating
 *
 * Usage: node scripts/regenerate-november-challenge.js
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');

function regenerateNovemberChallenge() {
  console.log('🔄 Starting November challenge regeneration...\n');

  try {
    // Find and open database
    const dbPath = path.join(__dirname, '..', '.expo', 'databases', 'selfrise.db');
    console.log(`📂 Database path: ${dbPath}`);

    const db = sqlite3(dbPath);
    console.log('✅ Database opened\n');

    // 1. Find current November 2025 challenge
    const currentChallenge = db.prepare(`
      SELECT id, title, status, month
      FROM monthly_challenges
      WHERE month = '2025-11'
      AND status = 'active'
      LIMIT 1
    `).get();

    if (!currentChallenge) {
      console.log('❌ No active November 2025 challenge found');
      db.close();
      return;
    }

    console.log(`📋 Found challenge: "${currentChallenge.title}"`);
    console.log(`   ID: ${currentChallenge.id}`);
    console.log(`   Status: ${currentChallenge.status}\n`);

    // 2. Archive the challenge (set status to expired)
    db.prepare(`
      UPDATE monthly_challenges
      SET status = 'expired',
          updated_at = ?
      WHERE id = ?
    `).run(Date.now(), currentChallenge.id);

    console.log('✅ Challenge archived (status → expired)');

    // 3. Check lifecycle state
    const lifecycleState = db.prepare(`
      SELECT current_state, current_challenge_id
      FROM challenge_lifecycle_state
      WHERE id = 1
    `).get();

    console.log(`📊 Lifecycle state: ${lifecycleState?.current_state || 'none'}`);
    console.log(`   Current challenge: ${lifecycleState?.current_challenge_id || 'none'}\n`);

    // 4. Clear lifecycle state to trigger regeneration
    db.prepare(`
      UPDATE challenge_lifecycle_state
      SET current_state = 'generation_needed',
          current_challenge_id = NULL,
          updated_at = ?
      WHERE id = 1
    `).run(Date.now());

    console.log('✅ Lifecycle state updated → generation_needed');

    // 5. Verify changes
    const verification = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_count
      FROM monthly_challenges
      WHERE month = '2025-11'
    `).get();

    console.log('\n📊 Verification:');
    console.log(`   Active November challenges: ${verification?.active_count || 0}`);
    console.log(`   Expired November challenges: ${verification?.expired_count || 0}`);

    // Close database
    db.close();
    console.log('\n✅ Database closed');

    console.log('\n✅ SUCCESS! November challenge regeneration prepared');
    console.log('\n📱 Next steps:');
    console.log('   1. Restart the app');
    console.log('   2. Lifecycle manager will detect missing challenge');
    console.log('   3. New challenge will be generated with 3★ rating');
    console.log('   4. Check that title is "Consistency Master" (no "First Month")');

  } catch (error) {
    console.error('❌ Error during regeneration:', error);
    throw error;
  }
}

// Run the script
regenerateNovemberChallenge();
