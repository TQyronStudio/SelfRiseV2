import { useMemo } from 'react';
import { GoalCategory, CreateGoalInput } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';

/**
 * Ready-made goals, shared by two very different presentations:
 *   - GoalTemplatesModal (Goals tab) — a searchable list of wide rows
 *   - onboarding screen 2 — a compact tile grid
 *
 * Only the DATA is shared. The onboarding screen deliberately does not reuse
 * the modal component: rule K2 forbids an RN <Modal> inside onboarding (that
 * overlap is what froze iOS on first launch), and bending one layout to serve
 * both would have changed how the existing Goals tab looks.
 *
 * Texts and `unit` resolve through t() at call time, so a template picked by a
 * German user yields "12 Bucher" and euros instead of the English strings that
 * used to be hardcoded here.
 */
export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  unit: string;
  suggestedTargetValue: number;
  tags: string[];
  icon: string;
  color: string;
}

export function useGoalTemplates(): GoalTemplate[] {
  const { t } = useI18n();
  return useMemo(() => [
    // Health Templates
    {
      id: 'lose_weight',
      title: t('goals.templates.loseWeight'),
      description: t('goals.templates.loseWeightDescription'),
      category: GoalCategory.HEALTH,
      unit: t('goals.units.kg'),
      suggestedTargetValue: 10,
      tags: ['weight', 'health', 'fitness'],
      icon: 'fitness',
      color: '#FF6B6B',
    },

    // Financial Templates
    {
      id: 'save_money',
      title: t('goals.templates.saveMoney'),
      description: t('goals.templates.saveMoneyDescription'),
      category: GoalCategory.FINANCIAL,
      unit: t('goals.units.currency'),
      suggestedTargetValue: 5000,
      tags: ['savings', 'money', 'financial'],
      icon: 'card',
      color: '#FFEAA7',
    },
    {
      id: 'pay_debt',
      title: t('goals.templates.payDebt'),
      description: t('goals.templates.payDebtDescription'),
      category: GoalCategory.FINANCIAL,
      unit: t('goals.units.currency'),
      suggestedTargetValue: 2000,
      tags: ['debt', 'financial', 'payment'],
      icon: 'cash',
      color: '#FFEAA7',
    },

    // Learning Templates
    {
      id: 'read_books',
      title: t('goals.templates.readBooks'),
      description: t('goals.templates.readBooksDescription'),
      category: GoalCategory.LEARNING,
      unit: t('goals.units.books'),
      suggestedTargetValue: 12,
      tags: ['reading', 'learning', 'books'],
      icon: 'book',
      color: '#45B7D1',
    },
    {
      id: 'learn_language',
      title: t('goals.templates.learnLanguage'),
      description: t('goals.templates.learnLanguageDescription'),
      category: GoalCategory.LEARNING,
      unit: t('goals.units.hours'),
      suggestedTargetValue: 100,
      tags: ['language', 'learning', 'study'],
      icon: 'language',
      color: '#45B7D1',
    },
    {
      id: 'online_course',
      title: t('goals.templates.onlineCourse'),
      description: t('goals.templates.onlineCourseDescription'),
      category: GoalCategory.LEARNING,
      unit: t('goals.units.lessons'),
      suggestedTargetValue: 30,
      tags: ['course', 'learning', 'skills'],
      icon: 'laptop',
      color: '#45B7D1',
    },

    // Career Templates
    {
      id: 'job_applications',
      title: t('goals.templates.jobApplications'),
      description: t('goals.templates.jobApplicationsDescription'),
      category: GoalCategory.CAREER,
      unit: t('goals.units.applications'),
      suggestedTargetValue: 20,
      tags: ['job', 'career', 'applications'],
      icon: 'briefcase',
      color: '#4ECDC4',
    },
    {
      id: 'networking',
      title: t('goals.templates.networking'),
      description: t('goals.templates.networkingDescription'),
      category: GoalCategory.CAREER,
      unit: t('goals.units.connections'),
      suggestedTargetValue: 50,
      tags: ['networking', 'career', 'connections'],
      icon: 'people',
      color: '#4ECDC4',
    },

    // Personal Templates
    {
      id: 'meditation',
      title: t('goals.templates.meditation'),
      description: t('goals.templates.meditationDescription'),
      category: GoalCategory.PERSONAL,
      unit: t('goals.units.minutes'),
      suggestedTargetValue: 365,
      tags: ['meditation', 'mindfulness', 'daily'],
      icon: 'leaf',
      color: '#96CEB4',
    },

    // Other Templates
    {
      id: 'art_projects',
      title: t('goals.templates.artProjects'),
      description: t('goals.templates.artProjectsDescription'),
      category: GoalCategory.OTHER,
      unit: t('goals.units.projects'),
      suggestedTargetValue: 12,
      tags: ['art', 'creative', 'projects'],
      icon: 'color-palette',
      color: '#98D8C8',
    },
    {
      id: 'cooking_recipes',
      title: t('goals.templates.cookingRecipes'),
      description: t('goals.templates.cookingRecipesDescription'),
      category: GoalCategory.OTHER,
      unit: t('goals.units.recipes'),
      suggestedTargetValue: 50,
      tags: ['cooking', 'recipes', 'food'],
      icon: 'restaurant',
      color: '#98D8C8',
    },
  ], [t]);
}

/** The exact shape the goal form expects when a template is chosen. */
export function templateToGoalInput(template: GoalTemplate): CreateGoalInput {
  return {
    title: template.title,
    description: template.description,
    unit: template.unit,
    targetValue: template.suggestedTargetValue,
    category: template.category,
  };
}
