
    import { getXPRequiredForLevel, getCurrentLevel } from './src/services/levelCalculation';
    
    // Basic functionality test
    console.log('Level 1 requires:', getXPRequiredForLevel(1), 'XP');
    console.log('Level 10 requires:', getXPRequiredForLevel(10), 'XP');
    console.log('1000 XP gives level:', getCurrentLevel(1000));
    console.log('✅ Basic level functions working');
  