import { msUntilMidnight } from '../useToday';

describe('msUntilMidnight', () => {
  it('reaches just past the next local midnight', () => {
    const now = new Date(2026, 10, 25, 23, 59, 0);
    const at = new Date(now.getTime() + msUntilMidnight(now));
    expect(at.getDate()).toBe(26);
    expect(at.getHours()).toBe(0);
    expect(msUntilMidnight(now)).toBe(61_000);
  });
});
