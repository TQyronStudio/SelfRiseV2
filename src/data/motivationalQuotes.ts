import { DateString } from '../types/common';

export interface MotivationalQuote {
  id: string;
  text: string;
  author?: string;
  category: 'motivation' | 'gratitude' | 'habits' | 'goals' | 'achievement' | 'level' | 'streak' | 'consistency' | 'growth';
  language: 'en' | 'de' | 'es';
  context?: string; // For contextual selection
}

export const motivationalQuotes: MotivationalQuote[] = [
  // Motivation - English
  {
    id: 'mot_en_1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'motivation',
    language: 'en',
  },
  {
    id: 'mot_en_2',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'motivation',
    language: 'en',
  },
  {
    id: 'mot_en_3',
    text: 'Believe you can and you\'re halfway there.',
    author: 'Theodore Roosevelt',
    category: 'motivation',
    language: 'en',
  },
  {
    id: 'mot_en_4',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'motivation',
    language: 'en',
  },

  // Gratitude - English
  {
    id: 'grat_en_1',
    text: 'Gratitude turns what we have into enough.',
    category: 'gratitude',
    language: 'en',
  },
  {
    id: 'grat_en_2',
    text: 'Be thankful for what you have; you\'ll end up having more.',
    author: 'Oprah Winfrey',
    category: 'gratitude',
    language: 'en',
  },
  {
    id: 'grat_en_3',
    text: 'Gratitude is not only the greatest of virtues, but the parent of all others.',
    author: 'Cicero',
    category: 'gratitude',
    language: 'en',
  },
  {
    id: 'grat_en_4',
    text: 'The thankful receiver bears a plentiful harvest.',
    author: 'William Blake',
    category: 'gratitude',
    language: 'en',
  },

  // Habits - English
  {
    id: 'hab_en_1',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
    category: 'habits',
    language: 'en',
  },
  {
    id: 'hab_en_2',
    text: 'Your net worth to the network is your daily habits.',
    author: 'James Clear',
    category: 'habits',
    language: 'en',
  },
  {
    id: 'hab_en_3',
    text: 'Small changes can make a big difference. You are the only one who can make it happen.',
    category: 'habits',
    language: 'en',
  },
  {
    id: 'hab_en_4',
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
    category: 'habits',
    language: 'en',
  },

  // Goals - English
  {
    id: 'goal_en_1',
    text: 'A goal is a dream with a deadline.',
    author: 'Napoleon Hill',
    category: 'goals',
    language: 'en',
  },
  {
    id: 'goal_en_2',
    text: 'Set your goals high, and don\'t stop till you get there.',
    author: 'Bo Jackson',
    category: 'goals',
    language: 'en',
  },
  {
    id: 'goal_en_3',
    text: 'The trouble with not having a goal is that you can spend your life running up and down the field and never score.',
    author: 'Bill Copeland',
    category: 'goals',
    language: 'en',
  },
  {
    id: 'goal_en_4',
    text: 'Goals are dreams with deadlines.',
    author: 'Diana Scharf Hunt',
    category: 'goals',
    language: 'en',
  },

  // German quotes - basic set
  {
    id: 'mot_de_1',
    text: 'Der Weg ist das Ziel.',
    author: 'Konfuzius',
    category: 'motivation',
    language: 'de',
  },
  {
    id: 'grat_de_1',
    text: 'Dankbarkeit ist das Gedächtnis des Herzens.',
    category: 'gratitude',
    language: 'de',
  },
  {
    id: 'hab_de_1',
    text: 'Übung macht den Meister.',
    category: 'habits',
    language: 'de',
  },
  {
    id: 'goal_de_1',
    text: 'Wer will, findet Wege. Wer nicht will, findet Gründe.',
    category: 'goals',
    language: 'de',
  },

  // Spanish quotes - basic set
  {
    id: 'mot_es_1',
    text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    category: 'motivation',
    language: 'es',
  },
  {
    id: 'grat_es_1',
    text: 'La gratitud convierte lo que tenemos en suficiente.',
    category: 'gratitude',
    language: 'es',
  },
  {
    id: 'hab_es_1',
    text: 'Somos lo que hacemos repetidamente.',
    author: 'Aristóteles',
    category: 'habits',
    language: 'es',
  },
  {
    id: 'goal_es_1',
    text: 'Una meta es un sueño con fecha límite.',
    category: 'goals',
    language: 'es',
  },

  // Achievement - English
  {
    id: 'ach_en_1',
    text: 'Every achievement is a step closer to the person you\'re becoming.',
    category: 'achievement',
    language: 'en',
    context: 'general_unlock',
  },
  {
    id: 'ach_en_2',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'achievement',
    language: 'en',
    context: 'challenging_achievement',
  },
  {
    id: 'ach_en_3',
    text: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'achievement',
    language: 'en',
    context: 'first_achievement',
  },

  // Level - English
  {
    id: 'level_en_1',
    text: 'Level up in life, one small step at a time.',
    category: 'level',
    language: 'en',
    context: 'level_milestone',
  },
  {
    id: 'level_en_2',
    text: 'Growth begins at the end of your comfort zone.',
    category: 'level',
    language: 'en',
    context: 'significant_level',
  },
  {
    id: 'level_en_3',
    text: 'You are not the same person you were yesterday, and that\'s beautiful.',
    category: 'level',
    language: 'en',
    context: 'personal_growth',
  },

  // Streak - English
  {
    id: 'streak_en_1',
    text: 'Consistency is the mother of mastery.',
    category: 'streak',
    language: 'en',
    context: 'consistency_focus',
  },
  {
    id: 'streak_en_2',
    text: 'Small daily improvements lead to massive results over time.',
    category: 'streak',
    language: 'en',
    context: 'daily_progress',
  },

  // Consistency - English
  {
    id: 'con_en_1',
    text: 'Excellence is not an act, but a habit.',
    author: 'Aristotle',
    category: 'consistency',
    language: 'en',
    context: 'habit_excellence',
  },
  {
    id: 'con_en_2',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'consistency',
    language: 'en',
    context: 'momentum_building',
  },

  // Growth - English
  {
    id: 'grow_en_1',
    text: 'Personal growth is not a destination, it\'s a way of traveling.',
    category: 'growth',
    language: 'en',
    context: 'continuous_journey',
  },
  {
    id: 'grow_en_2',
    text: 'Be yourself; everyone else is already taken.',
    author: 'Oscar Wilde',
    category: 'growth',
    language: 'en',
    context: 'authentic_self',
  },
  {
    id: 'grow_en_3',
    text: 'Every step forward is progress worth celebrating.',
    category: 'growth',
    language: 'en',
    context: 'general_motivation',
  },
];

/**
 * Get daily quote based on date and language
 * Uses deterministic selection based on date hash for consistency
 */
export function getDailyQuote(
  date: DateString, 
  language: 'en' | 'de' | 'es' = 'en'
): MotivationalQuote {
  const quotesForLanguage = motivationalQuotes.filter(q => q.language === language);
  
  // Fallback to English if no quotes for language
  const availableQuotes = quotesForLanguage.length > 0 
    ? quotesForLanguage 
    : motivationalQuotes.filter(q => q.language === 'en');
  
  // Create deterministic index based on date
  const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const index = dateHash % availableQuotes.length;
  
  // Ensure we always return a quote (fallback to first English quote if somehow undefined)
  return availableQuotes[index] || motivationalQuotes.find(q => q.language === 'en') || motivationalQuotes[0] || {
    id: 'fallback',
    text: 'Every day is a new opportunity to grow.',
    category: 'motivation' as const,
    language: 'en' as const
  };
}

/**
 * Get quotes by category and language
 */
export function getQuotesByCategory(
  category: MotivationalQuote['category'],
  language: 'en' | 'de' | 'es' = 'en'
): MotivationalQuote[] {
  return motivationalQuotes.filter(q => 
    q.category === category && q.language === language
  );
}

/**
 * Get random quote from category
 */
export function getRandomQuoteFromCategory(
  category: MotivationalQuote['category'],
  language: 'en' | 'de' | 'es' = 'en'
): MotivationalQuote {
  const categoryQuotes = getQuotesByCategory(category, language);
  
  if (categoryQuotes.length === 0) {
    // Fallback to English
    const fallbackQuotes = getQuotesByCategory(category, 'en');
    const fallbackQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return fallbackQuote || motivationalQuotes.find(q => q.language === 'en') || motivationalQuotes[0] || {
      id: 'fallback',
      text: 'Every day is a new opportunity to grow.',
      category: 'motivation' as const,
      language: 'en' as const
    };
  }
  
  const selectedQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
  return selectedQuote || motivationalQuotes.find(q => q.language === 'en') || motivationalQuotes[0] || {
    id: 'fallback',
    text: 'Every day is a new opportunity to grow.',
    category: 'motivation' as const,
    language: 'en' as const
  };
}

/**
 * Get contextual quote from category with context awareness
 */
export function getContextualQuote(
  category: MotivationalQuote['category'],
  context: Record<string, any> = {},
  language: 'en' | 'de' | 'es' = 'en'
): MotivationalQuote {
  const categoryQuotes = getQuotesByCategory(category, language);
  
  if (categoryQuotes.length === 0) {
    return getRandomQuoteFromCategory(category, language);
  }

  // Try to find context-specific quote first
  if (context.context) {
    const contextQuote = categoryQuotes.find(q => q.context === context.context);
    if (contextQuote) {
      return contextQuote;
    }
  }

  // For level-based context
  if (category === 'level' && context.level) {
    const level = context.level as number;
    if (level >= 25) {
      const significantQuote = categoryQuotes.find(q => q.context === 'significant_level');
      if (significantQuote) return significantQuote;
    } else if (level === 1) {
      const firstQuote = categoryQuotes.find(q => q.context === 'level_milestone');
      if (firstQuote) return firstQuote;
    }
  }

  // For achievement-based context
  if (category === 'achievement' && context.achievements) {
    const count = context.achievements as number;
    if (count === 1) {
      const firstQuote = categoryQuotes.find(q => q.context === 'first_achievement');
      if (firstQuote) return firstQuote;
    } else if (count >= 10) {
      const challengingQuote = categoryQuotes.find(q => q.context === 'challenging_achievement');
      if (challengingQuote) return challengingQuote;
    }
  }

  // Fallback to random from category
  return getRandomQuoteFromCategory(category, language);
}