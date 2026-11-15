import { dragCloses, dragOpenness } from '../dragToCloseLogic';

describe('drag to close: how open it is under the finger', () => {
  it('follows the finger along the closing direction', () => {
    expect(dragOpenness(1, 0, 400, 0.3)).toBe(1);
    expect(dragOpenness(1, 100, 400, 0.3)).toBe(0.75);
    expect(dragOpenness(1, 200, 400, 0.3)).toBe(0.5);
  });

  it('does not open further when the finger moves the other way', () => {
    expect(dragOpenness(1, -150, 400, 0.3)).toBe(1);
    expect(dragOpenness(0.8, -150, 400, 0.3)).toBe(0.8);
  });

  it('stops at the floor so it stays catchable', () => {
    expect(dragOpenness(1, 5000, 400, 0.3)).toBe(0.3);
    // A sheet may follow the finger all the way down.
    expect(dragOpenness(1, 5000, 400, 0)).toBe(0);
  });

  it('continues from where a thing in motion was caught', () => {
    expect(dragOpenness(0.6, 40, 400, 0.3)).toBeCloseTo(0.5);
    // Caught below the floor: it never jumps up to it.
    expect(dragOpenness(0.2, 0, 400, 0.3)).toBe(0.2);
    expect(dragOpenness(0.2, 5000, 400, 0.3)).toBe(0.2);
  });
});

describe('drag to close: letting go', () => {
  it('stays after a short, slow drag', () => {
    expect(dragCloses(60, 0, 400)).toBe(false);
    expect(dragCloses(120, 100, 400)).toBe(false);
  });

  it('closes past 30 % of the range', () => {
    expect(dragCloses(121, 0, 400)).toBe(true);
    expect(dragCloses(300, 50, 400)).toBe(true);
  });

  it('closes on a flick, but not on a twitch', () => {
    expect(dragCloses(40, 900, 400)).toBe(true);
    expect(dragCloses(10, 900, 400)).toBe(false);
  });

  it('stays when the finger is on its way back', () => {
    expect(dragCloses(300, -400, 400)).toBe(false);
  });

  it('still closes when a resting finger only drifts back a little', () => {
    expect(dragCloses(300, -50, 400)).toBe(true);
  });
});
