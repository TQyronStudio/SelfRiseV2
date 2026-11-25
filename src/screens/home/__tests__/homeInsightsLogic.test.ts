import { FOCUS_BELOW, hasInsights, insightsOf, STRONG_FROM } from '../homeInsightsLogic';

const rate = (name: string, r: number, established = true) => ({
  name,
  rate: r,
  established,
});

describe('insightsOf', () => {
  it('tells the trend only when it goes up', () => {
    expect(insightsOf([40, 40, 70, 70], []).trendUp).toBe(30);
    expect(insightsOf([70, 70, 40, 40], []).trendUp).toBeNull();
    // within the ±10 threshold: steady, nothing to say
    expect(insightsOf([60, 60, 65, 65], []).trendUp).toBeNull();
  });

  it('names the strongest established habit, only when it is strong', () => {
    const facts = insightsOf([null, null, null, null], [
      rate('Read', 96),
      rate('Run', 80),
      rate('New', 100, false),
    ]);
    expect(facts.strongest).toEqual({ name: 'Read', rate: 96 });
    expect(
      insightsOf([], [rate('Run', STRONG_FROM - 1)]).strongest
    ).toBeNull();
  });

  it('worth a look: the lowest under the threshold — never a habit doing fine', () => {
    expect(
      insightsOf([], [rate('Read', 96), rate('Stretch', 30), rate('Run', 45)]).focus
    ).toEqual({ name: 'Stretch', rate: 30 });
    expect(insightsOf([], [rate('Read', 100), rate('Run', FOCUS_BELOW)]).focus).toBeNull();
  });

  it('a new habit (under 14 days) is never judged', () => {
    const facts = insightsOf([], [rate('New', 10, false)]);
    expect(facts.focus).toBeNull();
    expect(facts.strongest).toBeNull();
  });

  it('nothing to say = the card hides', () => {
    expect(hasInsights(insightsOf([null, null, null, null], []))).toBe(false);
    expect(hasInsights(insightsOf([], [rate('Read', 96)]))).toBe(true);
  });
});
