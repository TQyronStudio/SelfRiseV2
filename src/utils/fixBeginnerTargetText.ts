// Utility to fix "Beginner-friendly target" text in stored monthly challenge data
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonthlyChallenge } from '../types/gamification';

export class BeginnerTargetFixer {
  private static readonly STORAGE_KEY = 'monthly_challenges';

  /**
   * Fix any "Beginner-friendly target" text in stored monthly challenge data
   */
  public static async fixBeginnerTargetText(): Promise<void> {
    try {
      console.log('🔧 [FIXER] Starting to fix Beginner-friendly target text...');
      
      // Get all stored challenges
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('🔧 [FIXER] No stored challenges found');
        return;
      }

      const challenges: MonthlyChallenge[] = JSON.parse(stored);
      let updatedCount = 0;
      
      // Fix each challenge
      challenges.forEach((challenge, challengeIndex) => {
        console.log(`🔧 [FIXER] Checking challenge: ${challenge.title}`);
        
        // Fix requirements in this challenge
        challenge.requirements.forEach((requirement, reqIndex) => {
          const originalDescription = requirement.description;
          
          // Remove "Beginner-friendly target" and similar problematic text
          let fixedDescription = requirement.description
            .replace(/\(?\s*beginner-?friendly\s+target\s*\)?/gi, '')
            .replace(/\(?\s*beginner\s+friendly\s+target\s*\)?/gi, '')
            .replace(/beginner-?friendly\s+target/gi, 'target')
            .replace(/beginner\s+friendly\s+target/gi, 'target')
            .replace(/\s+/g, ' ') // Clean up extra spaces
            .trim();

          if (originalDescription !== fixedDescription) {
            console.log(`🔧 [FIXER] Fixed requirement ${reqIndex} in challenge ${challengeIndex}:`);
            console.log(`  BEFORE: "${originalDescription}"`);
            console.log(`  AFTER:  "${fixedDescription}"`);
            
            requirement.description = fixedDescription;
            updatedCount++;
          }
        });
      });

      if (updatedCount > 0) {
        // Save the fixed challenges back to storage
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(challenges));
        console.log(`✅ [FIXER] Successfully fixed ${updatedCount} requirement descriptions`);
      } else {
        console.log('ℹ️ [FIXER] No "Beginner-friendly target" text found to fix');
      }

    } catch (error) {
      console.error('❌ [FIXER] Error fixing Beginner-friendly target text:', error);
      throw error;
    }
  }

  /**
   * Show current challenge data for debugging
   */
  public static async debugCurrentChallengeRequirements(): Promise<void> {
    try {
      console.log('🔍 [DEBUG] Current challenge requirements:');
      
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('No stored challenges found');
        return;
      }

      const challenges: MonthlyChallenge[] = JSON.parse(stored);
      const activeChallenges = challenges.filter(c => c.isActive);
      
      activeChallenges.forEach((challenge, index) => {
        console.log(`Challenge ${index}: ${challenge.title}`);
        challenge.requirements.forEach((req, reqIndex) => {
          console.log(`  Requirement ${reqIndex}: "${req.description}"`);
        });
      });

    } catch (error) {
      console.error('Error debugging challenge requirements:', error);
    }
  }
}