/**
 * The overlay counter (kap. 6.0, R-31): the level panel may open only while
 * nothing is open over the screen.
 */
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));

// eslint-disable-next-line import/first -- after jest.mock on purpose
import { overlayStore } from '../overlayRegistry';

describe('overlayStore', () => {
  afterEach(() => {
    while (overlayStore.covered()) overlayStore.close();
  });

  it('is covered while at least one overlay is open', () => {
    expect(overlayStore.covered()).toBe(false);
    overlayStore.open();
    overlayStore.open();
    overlayStore.close();
    expect(overlayStore.covered()).toBe(true);
    overlayStore.close();
    expect(overlayStore.covered()).toBe(false);
  });

  it('never goes below zero (a double close cannot hide a later overlay)', () => {
    overlayStore.close();
    overlayStore.open();
    expect(overlayStore.covered()).toBe(true);
  });

  it('tells its listeners about every change', () => {
    const seen: boolean[] = [];
    const stop = overlayStore.subscribe(() =>
      seen.push(overlayStore.covered())
    );
    overlayStore.open();
    overlayStore.close();
    stop();
    overlayStore.open();
    expect(seen).toEqual([true, false]);
  });
});
