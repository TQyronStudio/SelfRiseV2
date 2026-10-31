import { isDevelopmentSession } from '../diagnosticsMode';

describe('isDevelopmentSession', () => {
  it('is true for JS served from Metro', () => {
    expect(isDevelopmentSession(true, undefined)).toBe(true);
    expect(isDevelopmentSession(true, 'false')).toBe(true);
  });

  it('is false for store builds — real users are always measured', () => {
    expect(isDevelopmentSession(false, undefined)).toBe(false);
    expect(isDevelopmentSession(false, 'false')).toBe(false);
  });

  it('is switched off by the explicit opt-in, so events and test crashes can be verified', () => {
    expect(isDevelopmentSession(true, 'true')).toBe(false);
  });

  it('the opt-in cannot turn a store build into a development session', () => {
    expect(isDevelopmentSession(false, 'true')).toBe(false);
  });

  it('only the exact string "true" opts in', () => {
    for (const value of ['1', 'TRUE', 'yes', '']) {
      expect(isDevelopmentSession(true, value)).toBe(true);
    }
  });
});
