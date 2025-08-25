// XP Animation System Components
export { XpPopupAnimation } from './XpPopupAnimation';
export { XpNotification } from './XpNotification';
export { XpAnimationContainer } from './XpAnimationContainer';
export { ParticleEffects } from './ParticleEffects';

// XP Progress Components
// XpProgressBar removed - using OptimizedXpProgressBar only

// XP Multiplier Components
export { XpMultiplierIndicator } from './XpMultiplierIndicator';
export { MultiplierCountdownTimer } from './MultiplierCountdownTimer';
export { MultiplierActivationModal } from './MultiplierActivationModal';

// Star Rating & Challenge Difficulty Components
export { StarRatingDisplay } from './StarRatingDisplay';
export { StarProgressIndicator } from './StarProgressIndicator';
export { 
  StarRatingBadge, 
  CompactStarBadge, 
  CategoryStarBadge, 
  MultiplierStarBadge,
  StarRatingGrid 
} from './StarRatingBadge';

// Animation Context and Hooks
export { 
  XpAnimationProvider, 
  useXpAnimation, 
  useXpPopup, 
  useXpNotification 
} from '../../contexts/XpAnimationContext';

// Feedback Hook (separate to prevent circular dependency)
export { useXpFeedback } from '../../hooks/useXpFeedback';