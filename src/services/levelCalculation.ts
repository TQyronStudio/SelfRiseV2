// Mathematical level calculation system for gamification
import { LEVEL_PROGRESSION } from '../constants/gamification';
import { LevelInfo, LevelRequirement } from '../types/gamification';
import i18next from 'i18next';

// ========================================
// PERFORMANCE CACHING SYSTEM
// ========================================

interface LevelCache {
  xpRequiredCache: Map<number, number>;
  levelProgressCache: Map<number, ReturnType<typeof getXPProgress>>;
  levelInfoCache: Map<number, LevelInfo>;
  lastCacheReset: number;
}

// Cache with 5-minute TTL to balance memory usage and performance
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 200; // Limit cache size to prevent memory leaks

let levelCache: LevelCache = {
  xpRequiredCache: new Map(),
  levelProgressCache: new Map(),
  levelInfoCache: new Map(),
  lastCacheReset: Date.now(),
};

/**
 * Reset cache if it's expired or too large
 */
function resetCacheIfNeeded(): void {
  const now = Date.now();
  const cacheAge = now - levelCache.lastCacheReset;
  const totalCacheSize = 
    levelCache.xpRequiredCache.size + 
    levelCache.levelProgressCache.size + 
    levelCache.levelInfoCache.size;

  if (cacheAge > CACHE_TTL_MS || totalCacheSize > MAX_CACHE_SIZE) {
    console.log(`🗑️ Resetting level calculation cache (age: ${Math.round(cacheAge/1000)}s, size: ${totalCacheSize})`);
    levelCache = {
      xpRequiredCache: new Map(),
      levelProgressCache: new Map(),
      levelInfoCache: new Map(),
      lastCacheReset: now,
    };
  }
}

/**
 * CRITICAL: Force clear all level calculation caches
 * Used after level-up events to prevent cache desynchronization
 */
export function clearLevelCalculationCache(): void {
  const totalCacheSize = 
    levelCache.xpRequiredCache.size + 
    levelCache.levelProgressCache.size + 
    levelCache.levelInfoCache.size;

  console.log(`🚨 Force clearing level calculation cache (size: ${totalCacheSize}) - Level-up cache invalidation`);
  
  levelCache = {
    xpRequiredCache: new Map(),
    levelProgressCache: new Map(),
    levelInfoCache: new Map(),
    lastCacheReset: Date.now(),
  };
}

// ========================================
// CORE LEVEL CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate XP required to reach a specific level (CACHED)
 * Uses progressive difficulty scaling: Linear → Quadratic → Exponential → Master
 * 
 * @param level Target level (1-based)
 * @returns Total XP required to reach this level from level 0
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return LEVEL_PROGRESSION.BASE_XP_LEVEL_1;
  if (level === 2) return LEVEL_PROGRESSION.BASE_XP_LEVEL_2;

  // Check cache first
  resetCacheIfNeeded();
  const cached = levelCache.xpRequiredCache.get(level);
  if (cached !== undefined) {
    return cached;
  }

  let totalXP = LEVEL_PROGRESSION.BASE_XP_LEVEL_2; // Start from level 2 base
  
  // Calculate XP for each level from 3 to target level
  for (let currentLevel = 3; currentLevel <= level; currentLevel++) {
    const xpForThisLevel = calculateXPForSpecificLevel(currentLevel);
    totalXP += xpForThisLevel;
  }
  
  const result = Math.floor(totalXP);
  
  // Cache the result
  levelCache.xpRequiredCache.set(level, result);
  
  return result;
}

/**
 * Calculate XP needed for a specific level (not cumulative)
 * Implements the progressive difficulty phases
 * 
 * @param level The level to calculate XP for
 * @returns XP needed to advance TO this level
 */
function calculateXPForSpecificLevel(level: number): number {
  const phase = getLevelPhase(level);
  const baseXP = getPhaseBaseXP(level, phase);
  const multiplier = getPhaseMultiplier(phase);
  
  // Apply phase-specific formula
  switch (phase.formula) {
    case 'linear':
      return baseXP * Math.pow(multiplier, level - 3);
      
    case 'quadratic':
      const quadraticBase = baseXP * Math.pow(LEVEL_PROGRESSION.LINEAR_MULTIPLIER, LEVEL_PROGRESSION.BEGINNER_PHASE_END - 2);
      const quadraticLevel = level - LEVEL_PROGRESSION.BEGINNER_PHASE_END;
      return quadraticBase * Math.pow(multiplier, quadraticLevel) * (1 + quadraticLevel * 0.1);
      
    case 'exponential':
      const expBase = calculateEndOfPhaseXP('quadratic');
      const expLevel = level - LEVEL_PROGRESSION.INTERMEDIATE_PHASE_END;
      return expBase * Math.pow(multiplier, expLevel) * (1 + expLevel * 0.15);
      
    default: // master phase
      const masterBase = calculateEndOfPhaseXP('exponential');
      const masterLevel = level - LEVEL_PROGRESSION.ADVANCED_PHASE_END;
      return masterBase * Math.pow(multiplier, masterLevel) * (1 + masterLevel * 0.05);
  }
}

/**
 * Get the progression phase for a given level
 */
function getLevelPhase(level: number): LevelRequirement {
  if (level <= LEVEL_PROGRESSION.BEGINNER_PHASE_END) {
    return {
      level,
      baseXP: LEVEL_PROGRESSION.BASE_XP_LEVEL_2,
      multiplier: LEVEL_PROGRESSION.LINEAR_MULTIPLIER,
      formula: 'linear',
      phase: 'beginner'
    };
  } else if (level <= LEVEL_PROGRESSION.INTERMEDIATE_PHASE_END) {
    return {
      level,
      baseXP: calculateEndOfPhaseXP('linear'),
      multiplier: LEVEL_PROGRESSION.QUADRATIC_MULTIPLIER,
      formula: 'quadratic',
      phase: 'intermediate'
    };
  } else if (level <= LEVEL_PROGRESSION.ADVANCED_PHASE_END) {
    return {
      level,
      baseXP: calculateEndOfPhaseXP('quadratic'),
      multiplier: LEVEL_PROGRESSION.EXPONENTIAL_MULTIPLIER,
      formula: 'exponential',
      phase: 'advanced'
    };
  } else {
    return {
      level,
      baseXP: calculateEndOfPhaseXP('exponential'),
      multiplier: LEVEL_PROGRESSION.MASTER_MULTIPLIER,
      formula: 'exponential', // Master phase uses exponential formula
      phase: 'master'
    };
  }
}

/**
 * Calculate base XP for a phase
 */
function getPhaseBaseXP(level: number, phase: LevelRequirement): number {
  return phase.baseXP;
}

/**
 * Get multiplier for a phase
 */
function getPhaseMultiplier(phase: LevelRequirement): number {
  return phase.multiplier;
}

/**
 * Calculate the XP requirement at the end of a specific phase
 */
function calculateEndOfPhaseXP(phaseType: 'linear' | 'quadratic' | 'exponential'): number {
  switch (phaseType) {
    case 'linear':
      return calculateXPForSpecificLevel(LEVEL_PROGRESSION.BEGINNER_PHASE_END);
    case 'quadratic':
      return calculateXPForSpecificLevel(LEVEL_PROGRESSION.INTERMEDIATE_PHASE_END);
    case 'exponential':
      return calculateXPForSpecificLevel(LEVEL_PROGRESSION.ADVANCED_PHASE_END);
    default:
      return LEVEL_PROGRESSION.BASE_XP_LEVEL_2;
  }
}

// ========================================
// LEVEL INFORMATION FUNCTIONS
// ========================================

/**
 * Get current level based on total XP
 * 
 * @param totalXP User's total accumulated XP
 * @returns Current level (1-based)
 */
export function getCurrentLevel(totalXP: number): number {
  if (totalXP <= 0) return 0;
  if (totalXP < LEVEL_PROGRESSION.BASE_XP_LEVEL_1) return 0;
  if (totalXP < LEVEL_PROGRESSION.BASE_XP_LEVEL_2) return 1;
  
  // Binary search for efficiency with high levels
  let low = 2;
  let high = 200; // Reasonable upper bound
  
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const xpRequired = getXPRequiredForLevel(mid);
    
    if (totalXP >= xpRequired) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  
  return low;
}

/**
 * Get XP progress information for current level
 * 
 * @param totalXP User's total accumulated XP
 * @returns Progress information object
 */
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage
  xpInCurrentLevel: number;
  xpRequiredForCurrentLevel: number;
  xpRequiredForNextLevel: number;
} {
  // For progress calculations, we cache based on level rather than exact XP
  // since progress changes frequently but level changes are less frequent
  const currentLevel = getCurrentLevel(totalXP);
  
  // Check cache for this level's progress structure
  resetCacheIfNeeded();
  const cacheKey = currentLevel;
  let cachedProgress = levelCache.levelProgressCache.get(cacheKey);
  
  // If cached, just update the dynamic values
  if (cachedProgress && cachedProgress.currentLevel === currentLevel) {
    const xpRequiredForCurrentLevel = cachedProgress.xpRequiredForCurrentLevel;
    const xpRequiredForNextLevel = cachedProgress.xpRequiredForNextLevel;
    const xpInCurrentLevel = totalXP - xpRequiredForCurrentLevel;
    const xpNeededForNextLevel = xpRequiredForNextLevel - xpRequiredForCurrentLevel;
    const xpToNextLevel = xpRequiredForNextLevel - totalXP;
    const xpProgress = xpNeededForNextLevel > 0 
      ? Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100))
      : 100;
    
    return {
      currentLevel,
      xpToNextLevel,
      xpProgress,
      xpInCurrentLevel,
      xpRequiredForCurrentLevel,
      xpRequiredForNextLevel,
    };
  }
  
  // Calculate fresh values
  const nextLevel = currentLevel + 1;
  
  const xpRequiredForCurrentLevel = getXPRequiredForLevel(currentLevel);
  const xpRequiredForNextLevel = getXPRequiredForLevel(nextLevel);
  
  const xpInCurrentLevel = totalXP - xpRequiredForCurrentLevel;
  const xpNeededForNextLevel = xpRequiredForNextLevel - xpRequiredForCurrentLevel;
  const xpToNextLevel = xpRequiredForNextLevel - totalXP;
  
  const xpProgress = xpNeededForNextLevel > 0 
    ? Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100))
    : 100;
  
  const result = {
    currentLevel,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    xpProgress: Math.floor(xpProgress),
    xpInCurrentLevel: Math.max(0, xpInCurrentLevel),
    xpRequiredForCurrentLevel,
    xpRequiredForNextLevel,
  };
  
  // Cache the structure for this level (excluding dynamic values)
  levelCache.levelProgressCache.set(cacheKey, result);
  
  return result;
}

// ========================================
// LEVEL INFORMATION & MILESTONES
// ========================================

/**
 * Get detailed information about a specific level
 * 
 * @param level Target level
 * @returns Complete level information
 */
export function getLevelInfo(level: number): LevelInfo {
  const xpRequired = getXPRequiredForLevel(level);
  const previousLevelXP = level > 1 ? getXPRequiredForLevel(level - 1) : 0;
  const xpFromPrevious = xpRequired - previousLevelXP;
  
  const isMilestone = LEVEL_PROGRESSION.MILESTONE_LEVELS.includes(level as any);
  const phase = getLevelPhase(level);
  
  const levelInfo: LevelInfo = {
    level,
    xpRequired,
    xpFromPrevious,
    title: getLevelTitle(level, phase.phase),
    description: getLevelDescription(level, phase.phase),
    isMilestone,
  };
  
  if (isMilestone) {
    levelInfo.rewards = getMilestoneRewards(level);
  }
  
  return levelInfo;
}

/**
 * Get title for a level based on new rarity system
 * Levels 1-20: Grey (Common), 21-40: Blue (Rare), 41-60: Purple (Epic), 61-80: Gold (Legendary), 81-100: Red (Mythic)
 */
function getLevelTitle(level: number, phase: 'beginner' | 'intermediate' | 'advanced' | 'master'): string {
  // New level naming system based on rarity tiers
  const levelTitleMap: Record<number, string> = {
    // Grey (Common) - Levels 1-20
    1: 'Novice I', 2: 'Novice II', 3: 'Novice III', 4: 'Novice IV', 5: 'Novice V',
    6: 'Beginner I', 7: 'Beginner II', 8: 'Beginner III', 9: 'Beginner IV', 10: 'Beginner V',
    11: 'Learner I', 12: 'Learner II', 13: 'Learner III', 14: 'Learner IV', 15: 'Learner V',
    16: 'Apprentice I', 17: 'Apprentice II', 18: 'Apprentice III', 19: 'Apprentice IV', 20: 'Apprentice V',
    
    // Blue (Rare) - Levels 21-40
    21: 'Adept I', 22: 'Adept II', 23: 'Adept III', 24: 'Adept IV', 25: 'Adept V',
    26: 'Seeker I', 27: 'Seeker II', 28: 'Seeker III', 29: 'Seeker IV', 30: 'Seeker V',
    31: 'Adventurer I', 32: 'Adventurer II', 33: 'Adventurer III', 34: 'Adventurer IV', 35: 'Adventurer V',
    36: 'Practitioner I', 37: 'Practitioner II', 38: 'Practitioner III', 39: 'Practitioner IV', 40: 'Practitioner V',
    
    // Purple (Epic) - Levels 41-60
    41: 'Pathfinder I', 42: 'Pathfinder II', 43: 'Pathfinder III', 44: 'Pathfinder IV', 45: 'Pathfinder V',
    46: 'Specialist I', 47: 'Specialist II', 48: 'Specialist III', 49: 'Specialist IV', 50: 'Specialist V',
    51: 'Veteran I', 52: 'Veteran II', 53: 'Veteran III', 54: 'Veteran IV', 55: 'Veteran V',
    56: 'Expert I', 57: 'Expert II', 58: 'Expert III', 59: 'Expert IV', 60: 'Expert V',
    
    // Gold (Legendary) - Levels 61-80
    61: 'Guardian I', 62: 'Guardian II', 63: 'Guardian III', 64: 'Guardian IV', 65: 'Guardian V',
    66: 'Warden I', 67: 'Warden II', 68: 'Warden III', 69: 'Warden IV', 70: 'Warden V',
    71: 'Challenger I', 72: 'Challenger II', 73: 'Challenger III', 74: 'Challenger IV', 75: 'Challenger V',
    76: 'Master I', 77: 'Master II', 78: 'Master III', 79: 'Master IV', 80: 'Master V',
    
    // Red (Mythic/Exotic) - Levels 81-100
    81: 'Elite I', 82: 'Elite II', 83: 'Elite III', 84: 'Elite IV', 85: 'Elite V',
    86: 'Champion I', 87: 'Champion II', 88: 'Champion III', 89: 'Champion IV', 90: 'Champion V',
    91: 'Grandmaster I', 92: 'Grandmaster II', 93: 'Grandmaster III', 94: 'Grandmaster IV', 95: 'Grandmaster V',
    96: 'Mythic I', 97: 'Mythic II', 98: 'Mythic III', 99: 'Mythic IV', 100: 'Mythic V',
  };
  
  return levelTitleMap[level] || `Level ${level}`;
}

/**
 * Get description for a level based on new rarity system
 */
function getLevelDescription(level: number, phase: 'beginner' | 'intermediate' | 'advanced' | 'master'): string {
  // Descriptions based on rarity tiers
  if (level >= 1 && level <= 20) {
    return i18next.t('gamification.levelTiers.common');
  } else if (level >= 21 && level <= 40) {
    return i18next.t('gamification.levelTiers.rare');
  } else if (level >= 41 && level <= 60) {
    return i18next.t('gamification.levelTiers.epic');
  } else if (level >= 61 && level <= 80) {
    return i18next.t('gamification.levelTiers.legendary');
  } else if (level >= 81 && level <= 100) {
    return i18next.t('gamification.levelTiers.mythic');
  }

  return i18next.t('gamification.levelTiers.default');
}

/**
 * Get starting level for each phase
 */
function getPhaseStartLevel(phase: 'beginner' | 'intermediate' | 'advanced' | 'master'): number {
  switch (phase) {
    case 'beginner': return 1;
    case 'intermediate': return LEVEL_PROGRESSION.BEGINNER_PHASE_END + 1;
    case 'advanced': return LEVEL_PROGRESSION.INTERMEDIATE_PHASE_END + 1;
    case 'master': return LEVEL_PROGRESSION.ADVANCED_PHASE_END + 1;
  }
}

/**
 * Get rewards for milestone levels
 */
function getMilestoneRewards(level: number): string[] {
  const rewards: Record<number, string[]> = {
    10: [
      i18next.t('gamification.milestoneRewards.level10.badge'),
      i18next.t('gamification.milestoneRewards.level10.theme'),
      i18next.t('gamification.milestoneRewards.level10.multiplier'),
    ],
    25: [
      i18next.t('gamification.milestoneRewards.level25.badge'),
      i18next.t('gamification.milestoneRewards.level25.trophy'),
      i18next.t('gamification.milestoneRewards.level25.challenge'),
    ],
    50: [
      i18next.t('gamification.milestoneRewards.level50.badge'),
      i18next.t('gamification.milestoneRewards.level50.prestige'),
      i18next.t('gamification.milestoneRewards.level50.stats'),
    ],
    75: [
      i18next.t('gamification.milestoneRewards.level75.badge'),
      i18next.t('gamification.milestoneRewards.level75.legacy'),
      i18next.t('gamification.milestoneRewards.level75.mentor'),
    ],
    100: [
      i18next.t('gamification.milestoneRewards.level100.badge'),
      i18next.t('gamification.milestoneRewards.level100.hallOfFame'),
      i18next.t('gamification.milestoneRewards.level100.title'),
      i18next.t('gamification.milestoneRewards.level100.customAchievement'),
    ],
  };

  return rewards[level] || [i18next.t('gamification.milestoneRewards.default', { level })];
}

// ========================================
// MILESTONE DETECTION FUNCTIONS
// ========================================

/**
 * Check if a level is a milestone level
 * 
 * @param level Level to check
 * @returns True if level is a milestone
 */
export function isLevelMilestone(level: number): boolean {
  return LEVEL_PROGRESSION.MILESTONE_LEVELS.includes(level as any);
}

/**
 * Get the next milestone level after current level
 * 
 * @param currentLevel Current user level
 * @returns Next milestone level, or null if no more milestones
 */
export function getNextMilestone(currentLevel: number): number | null {
  const nextMilestone = LEVEL_PROGRESSION.MILESTONE_LEVELS.find(milestone => milestone > currentLevel);
  return nextMilestone || null;
}

/**
 * Get all milestone levels up to a maximum level
 * 
 * @param maxLevel Maximum level to consider
 * @returns Array of milestone levels
 */
export function getMilestonesUpToLevel(maxLevel: number): number[] {
  return LEVEL_PROGRESSION.MILESTONE_LEVELS.filter(milestone => milestone <= maxLevel);
}

// ========================================
// VALIDATION & TESTING FUNCTIONS
// ========================================

/**
 * Validate the progression timeline with realistic scenarios
 * Tests 5-year progression with different user types
 * 
 * @returns Validation results
 */
export function validateProgressionTimeline(): {
  isValid: boolean;
  scenarios: Array<{
    userType: string;
    dailyXP: number;
    yearlyXP: number;
    levelAfter1Year: number;
    levelAfter5Years: number;
    timeToLevel50: number; // days
    timeToLevel100: number; // days
  }>;
  issues: string[];
} {
  const scenarios = [
    { userType: 'Casual User', dailyXP: 150 },      // Light usage
    { userType: 'Regular User', dailyXP: 400 },     // Moderate usage
    { userType: 'Power User', dailyXP: 800 },       // Heavy usage
    { userType: 'Super User', dailyXP: 1200 },      // Maximum daily usage
  ];

  const results = scenarios.map(scenario => {
    const yearlyXP = scenario.dailyXP * 365;
    const fiveYearXP = yearlyXP * 5;
    
    const levelAfter1Year = getCurrentLevel(yearlyXP);
    const levelAfter5Years = getCurrentLevel(fiveYearXP);
    
    // Calculate time to reach milestone levels
    const xpForLevel50 = getXPRequiredForLevel(50);
    const xpForLevel100 = getXPRequiredForLevel(100);
    
    const timeToLevel50 = Math.ceil(xpForLevel50 / scenario.dailyXP);
    const timeToLevel100 = Math.ceil(xpForLevel100 / scenario.dailyXP);
    
    return {
      ...scenario,
      yearlyXP,
      levelAfter1Year,
      levelAfter5Years,
      timeToLevel50,
      timeToLevel100,
    };
  });

  // Validation checks
  const issues: string[] = [];
  
  // Check if casual users can reach meaningful levels
  const casualUser = results.find(r => r.userType === 'Casual User');
  if (casualUser && casualUser.levelAfter1Year < 5) {
    issues.push('Casual users progress too slowly (less than level 5 in 1 year)');
  }
  
  // Check if power users don't max out too quickly
  const powerUser = results.find(r => r.userType === 'Power User');
  if (powerUser && powerUser.levelAfter1Year > 50) {
    issues.push('Power users progress too quickly (over level 50 in 1 year)');
  }
  
  // Check if level 100 is achievable but challenging
  const superUser = results.find(r => r.userType === 'Super User');
  if (superUser && superUser.timeToLevel100 > 1825) { // 5 years
    issues.push('Level 100 takes too long even for super users (over 5 years)');
  }
  if (superUser && superUser.timeToLevel100 < 365) { // 1 year
    issues.push('Level 100 is reached too quickly by super users (under 1 year)');
  }

  return {
    isValid: issues.length === 0,
    scenarios: results,
    issues,
  };
}

/**
 * Generate a level progression preview for documentation
 * 
 * @param maxLevel Maximum level to preview
 * @returns Array of level information for preview
 */
export function generateLevelPreview(maxLevel: number = 50): Array<{
  level: number;
  xpRequired: number;
  xpFromPrevious: number;
  title: string;
  phase: string;
  isMilestone: boolean;
}> {
  const preview = [];
  
  for (let level = 1; level <= maxLevel; level++) {
    const info = getLevelInfo(level);
    const phase = getLevelPhase(level);
    
    preview.push({
      level,
      xpRequired: info.xpRequired,
      xpFromPrevious: info.xpFromPrevious,
      title: info.title,
      phase: phase.phase,
      isMilestone: info.isMilestone,
    });
  }
  
  return preview;
}