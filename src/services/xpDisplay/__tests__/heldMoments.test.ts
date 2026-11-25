/** Which old window releases which held XP (E7 point 3). */
import { holdKindOfModal, pendingHoldKinds, releasedKind } from '../heldMoments';

describe('heldMoments', () => {
  it('maps the moment windows to their hold kinds', () => {
    expect(holdKindOfModal('achievement')).toBe('trophy');
    expect(holdKindOfModal('goal_completion')).toBe('goal');
    expect(holdKindOfModal('celebration_streak_milestone')).toBe('streak');
    expect(holdKindOfModal('celebration_bonus_milestone')).toBe('bonusEntry');
    expect(holdKindOfModal('monthly_challenge_completion')).toBe('challenge');
    // A chapter window may carry the trophies of its action (E10, L-8).
    expect(holdKindOfModal('level_up')).toBe('trophy');
    expect(holdKindOfModal('star_level_change')).toBeNull();
  });

  it('keeps a kind pending while its window is anywhere in the queue', () => {
    expect([...pendingHoldKinds(['level_up', 'achievement'])]).toEqual(['trophy']);
  });

  it('releases the kind of the window that went away', () => {
    expect(releasedKind('achievement', 'level_up')).toBe('trophy');
    expect(releasedKind('achievement', null)).toBe('trophy');
    expect(releasedKind(null, 'achievement')).toBeNull();
    // Two trophies in a row: the head type stays the same, the first was closed.
    expect(releasedKind('achievement', 'achievement', true)).toBe('trophy');
    expect(releasedKind('achievement', 'achievement')).toBeNull();
  });
});
