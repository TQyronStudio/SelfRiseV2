/**
 * Stage E — the first-goal screen's input rules.
 *
 * The trophy handshake is already covered by the shared createWithTrophyGate
 * tests, so what is left here is the number field: the one place in the flow
 * where a user can type something the app has to reject, on a screen that has
 * no room to explain itself. The CTA simply stays dark, so the rules had
 * better be right.
 *
 * They deliberately mirror GoalForm (`GoalForm.tsx:290,326-330`) — a goal made
 * here and edited there must not obey two different sets of rules.
 */
import { parseGoalTarget, isGoalDraftComplete, GOAL_TARGET_MAX } from '../goalDraft';

describe('parseGoalTarget', () => {
  it('accepts plain whole numbers', () => {
    expect(parseGoalTarget('12')).toBe(12);
    expect(parseGoalTarget('5000')).toBe(5000);
    expect(parseGoalTarget(' 7 ')).toBe(7);
  });

  it('rejects an empty or blank field', () => {
    expect(parseGoalTarget('')).toBeNull();
    expect(parseGoalTarget('   ')).toBeNull();
  });

  it('rejects zero and negatives — a goal of nothing is not a goal', () => {
    expect(parseGoalTarget('0')).toBeNull();
    expect(parseGoalTarget('-5')).toBeNull();
  });

  it('rejects text rather than silently keeping the digits', () => {
    // parseInt('12abc') would yield 12 and let the user submit a number they
    // never typed.
    expect(parseGoalTarget('12abc')).toBeNull();
    expect(parseGoalTarget('abc')).toBeNull();
    expect(parseGoalTarget('-')).toBeNull();
  });

  it('rejects decimals, matching the rest of the app', () => {
    expect(parseGoalTarget('12.5')).toBeNull();
    expect(parseGoalTarget('12,5')).toBeNull();
  });

  it('honours the same upper bound as the goal form', () => {
    expect(parseGoalTarget(String(GOAL_TARGET_MAX))).toBe(GOAL_TARGET_MAX);
    expect(parseGoalTarget(String(GOAL_TARGET_MAX + 1))).toBeNull();
  });
});

describe('isGoalDraftComplete', () => {
  const draft = { title: 'Read books', unit: 'books', targetValue: '12' };

  it('is complete when title, unit and number are all present', () => {
    expect(isGoalDraftComplete(draft)).toBe(true);
  });

  it('needs a title', () => {
    expect(isGoalDraftComplete({ ...draft, title: '   ' })).toBe(false);
  });

  it('needs a unit — "12" alone says nothing', () => {
    expect(isGoalDraftComplete({ ...draft, unit: '' })).toBe(false);
  });

  it('needs a usable number', () => {
    expect(isGoalDraftComplete({ ...draft, targetValue: '0' })).toBe(false);
    expect(isGoalDraftComplete({ ...draft, targetValue: 'abc' })).toBe(false);
  });
});
