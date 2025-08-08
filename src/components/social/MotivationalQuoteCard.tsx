// Motivational Quote Card - Context-Aware Inspirational Content
// Social Features Foundation - Smart motivational system

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialSharingService, MotivationalQuote } from '../../services/socialSharingService';
import { Colors, Layout } from '../../constants';

// ========================================
// INTERFACES
// ========================================

interface MotivationalQuoteCardProps {
  category?: 'achievement' | 'level' | 'streak' | 'consistency' | 'growth';
  context?: Record<string, any>;
  onQuoteChange?: (quote: MotivationalQuote) => void;
  compact?: boolean;
  showActions?: boolean;
}

// ========================================
// COMPONENT
// ========================================

export const MotivationalQuoteCard: React.FC<MotivationalQuoteCardProps> = ({
  category = 'growth',
  context = {},
  onQuoteChange,
  compact = false,
  showActions = true
}) => {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadMotivationalQuote();
  }, [category, context]);

  const loadMotivationalQuote = () => {
    try {
      const quote = SocialSharingService.getContextualMotivationalQuote(category, context);
      setCurrentQuote(quote);
      
      if (onQuoteChange) {
        onQuoteChange(quote);
      }
    } catch (error) {
      console.error('Failed to load motivational quote:', error);
    }
  };

  const handleShare = async () => {
    if (!currentQuote) return;

    try {
      setSharing(true);
      
      const shareMessage = formatQuoteForSharing(currentQuote);
      const result = await Share.share({
        message: shareMessage,
        title: '✨ Motivational Quote'
      });

      if (result.action === Share.sharedAction) {
        // Quote shared successfully
      }
    } catch (error) {
      console.error('Failed to share quote:', error);
      Alert.alert('Error', 'Failed to share quote. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!currentQuote) return;

    try {
      const quoteText = formatQuoteForSharing(currentQuote);
      Clipboard.setString(quoteText);
      
      Alert.alert(
        '📋 Copied!',
        'Quote copied to clipboard.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy quote:', error);
      Alert.alert('Error', 'Failed to copy quote. Please try again.');
    }
  };

  const formatQuoteForSharing = (quote: MotivationalQuote): string => {
    let formatted = `"${quote.text}"`;
    
    if (quote.author) {
      formatted += `\n\n— ${quote.author}`;
    }
    
    formatted += '\n\n✨ Shared from SelfRise - Your Personal Growth Journey';
    
    return formatted;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      achievement: 'trophy',
      level: 'trending-up',
      streak: 'flame',
      consistency: 'checkmark-circle',
      growth: 'leaf'
    };
    return icons[category as keyof typeof icons] || 'bulb';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      achievement: '#FFD700',
      level: '#3B82F6',
      streak: '#FF6B35',
      consistency: '#10B981',
      growth: '#8B5CF6'
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  };

  if (!currentQuote) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading inspiration...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Quote Header */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Ionicons 
            name={getCategoryIcon(currentQuote.category) as any} 
            size={16} 
            color={getCategoryColor(currentQuote.category)} 
          />
          <Text style={[styles.categoryText, { color: getCategoryColor(currentQuote.category) }]}>
            {currentQuote.category.charAt(0).toUpperCase() + currentQuote.category.slice(1)}
          </Text>
        </View>
        
        {!compact && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadMotivationalQuote}
            accessibilityLabel="Get new quote"
          >
            <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quote Content */}
      <View style={styles.quoteContainer}>
        <Ionicons 
          name="chatbubble-outline" 
          size={compact ? 20 : 24} 
          color={getCategoryColor(currentQuote.category) + '40'}
          style={styles.quoteIcon}
        />
        
        <Text 
          style={[styles.quoteText, compact && styles.quoteTextCompact]}
          numberOfLines={compact ? 3 : undefined}
        >
          {currentQuote.text}
        </Text>
        
        {currentQuote.author && !compact && (
          <Text style={styles.quoteAuthor}>— {currentQuote.author}</Text>
        )}
      </View>

      {/* Action Buttons */}
      {showActions && !compact && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyToClipboard}
            accessibilityLabel="Copy quote to clipboard"
          >
            <Ionicons name="copy-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            disabled={sharing}
            accessibilityLabel="Share quote"
          >
            <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inspiration Indicator */}
      <View style={styles.inspirationIndicator}>
        <Ionicons name="heart" size={12} color="#FF6B6B" />
        <Text style={styles.inspirationText}>
          {compact ? 'Daily inspiration' : 'Personalized for your journey'}
        </Text>
      </View>
    </View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    margin: Layout.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  containerCompact: {
    padding: Layout.spacing.md,
    margin: Layout.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  refreshButton: {
    padding: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  quoteContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.md,
  },
  quoteIcon: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 1,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    paddingLeft: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  quoteTextCompact: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  quoteAuthor: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Layout.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  inspirationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
  },
  inspirationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});