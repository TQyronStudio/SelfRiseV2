import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoalCategory, CreateGoalInput } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/dimensions';

interface GoalTemplate {
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

interface GoalTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: CreateGoalInput) => void;
}

export function GoalTemplatesModal({ visible, onClose, onSelectTemplate }: GoalTemplatesModalProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const templates: GoalTemplate[] = useMemo(() => [
    // Health Templates
    {
      id: 'lose_weight',
      title: t('goals.templates.loseWeight'),
      description: t('goals.templates.loseWeightDescription'),
      category: GoalCategory.HEALTH,
      unit: 'kg',
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
      unit: '$',
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
      unit: '$',
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
      unit: 'books',
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
      unit: 'hours',
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
      unit: 'lessons',
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
      unit: 'applications',
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
      unit: 'connections',
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
      unit: 'minutes',
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
      unit: 'projects',
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
      unit: 'recipes',
      suggestedTargetValue: 50,
      tags: ['cooking', 'recipes', 'food'],
      icon: 'restaurant',
      color: '#98D8C8',
    },
  ], [t]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const categories = [
    { key: 'all', label: t('goals.templates.all'), icon: 'grid' },
    { key: GoalCategory.HEALTH, label: t('goals.category.health'), icon: 'heart' },
    { key: GoalCategory.FINANCIAL, label: t('goals.category.financial'), icon: 'card' },
    { key: GoalCategory.LEARNING, label: t('goals.category.learning'), icon: 'school' },
    { key: GoalCategory.CAREER, label: t('goals.category.career'), icon: 'briefcase' },
    { key: GoalCategory.PERSONAL, label: t('goals.category.personal'), icon: 'person' },
    { key: GoalCategory.OTHER, label: t('goals.category.other'), icon: 'ellipsis-horizontal' },
  ];

  const handleSelectTemplate = (template: GoalTemplate) => {
    const goalInput: CreateGoalInput = {
      title: template.title,
      description: template.description,
      unit: template.unit,
      targetValue: template.suggestedTargetValue,
      category: template.category,
    };
    
    onSelectTemplate(goalInput);
    onClose();
  };

  const TemplateCard = ({ template }: { template: GoalTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleSelectTemplate(template)}
    >
      <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
        <Ionicons name={template.icon as any} size={24} color={Colors.white} />
      </View>
      <View style={styles.templateContent}>
        <Text style={styles.templateTitle}>{template.title}</Text>
        <Text style={styles.templateDescription}>{template.description}</Text>
        <View style={styles.templateMeta}>
          <Text style={styles.templateTarget}>
            {t('goals.templates.target')}: {template.suggestedTargetValue} {template.unit}
          </Text>
          <Text style={styles.templateCategory}>
            {t(`goals.category.${template.category.toLowerCase()}`)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('goals.templates.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('goals.templates.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.key && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.key as GoalCategory | 'all')}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={18} 
                    color={selectedCategory === category.key ? Colors.white : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.key && styles.categoryButtonTextActive
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
          {filteredTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>{t('goals.templates.noTemplates')}</Text>
            </View>
          ) : (
            filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('goals.templates.footerText')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  searchSection: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
    fontSize: 16,
    color: Colors.text,
  },
  categoriesSection: {
    marginBottom: Layout.spacing.md,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    marginLeft: Layout.spacing.xs,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  templatesContainer: {
    flex: 1,
    paddingHorizontal: Layout.spacing.md,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Layout.spacing.sm,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTarget: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  templateCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  footer: {
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});