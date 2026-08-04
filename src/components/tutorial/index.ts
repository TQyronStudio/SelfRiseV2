// What survives of the tutorial system after the 3-screen onboarding replaced
// the 25-step coach-mark tour: the first-launch preferences gate, and the
// context that owns onboarding state and its storage flags.
//
// Deleted with the tour: TutorialOverlay, TutorialModal, SpotlightEffect and
// TutorialTargetHelper — the machinery that measured where UI elements sat on
// screen and dimmed everything else. Two of the three findings from the Android
// device test lived in there.
export { OnboardingPreferencesModal } from './OnboardingPreferencesModal';

export {
  TutorialProvider,
  useTutorial,
  type TutorialState,
  type TutorialContextType,
} from '@/src/contexts/TutorialContext';
