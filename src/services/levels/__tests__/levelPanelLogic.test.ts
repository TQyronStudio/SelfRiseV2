import {
  badgeTapAction,
  dragDismisses,
  dragProgress,
  PANEL_DRAG_FLOOR,
  PANEL_DRAG_RANGE,
  timeLeftParts,
} from '../levelPanelLogic';

describe('level panel: what a tap on the badge does', () => {
  const idle = { shown: false, covered: false, moment: null } as const;

  it('opens the panel on a main tab with nothing else going on', () => {
    expect(badgeTapAction(idle)).toBe('open');
  });

  it('puts the open panel back', () => {
    expect(badgeTapAction({ ...idle, shown: true })).toBe('close');
  });

  it('is the quiet note’s tap while a note is out — also over a detail', () => {
    expect(badgeTapAction({ ...idle, moment: 'quiet' })).toBe('note');
    expect(badgeTapAction({ ...idle, moment: 'quiet', covered: true })).toBe(
      'note'
    );
  });

  it('never opens over an open detail or during a big celebration', () => {
    expect(badgeTapAction({ ...idle, covered: true })).toBe('none');
    expect(badgeTapAction({ ...idle, moment: 'big' })).toBe('none');
  });

  it('closes an open panel even during a big celebration', () => {
    expect(badgeTapAction({ shown: true, covered: false, moment: 'big' })).toBe(
      'close'
    );
  });

  it('still closes a panel that something else covered meanwhile', () => {
    expect(
      badgeTapAction({ shown: true, covered: true, moment: 'quiet' })
    ).toBe('close');
  });
});

describe('level panel: dragging it', () => {
  it('is fully open where the finger started and shrinks both ways', () => {
    expect(dragProgress(0)).toBe(1);
    expect(dragProgress(60)).toBeCloseTo(1 - 60 / PANEL_DRAG_RANGE);
    expect(dragProgress(-60)).toBe(dragProgress(60));
  });

  it('never shrinks to nothing under the finger', () => {
    expect(dragProgress(5000)).toBe(PANEL_DRAG_FLOOR);
    expect(dragProgress(-5000)).toBe(PANEL_DRAG_FLOOR);
  });

  it('continues from where a leaving panel was caught', () => {
    expect(dragProgress(0, 0.2)).toBeCloseTo(0.2);
    expect(dragProgress(30, 0.8)).toBeCloseTo(0.8 - 30 / PANEL_DRAG_RANGE);
    // Caught below the floor: it never jumps up to it.
    expect(dragProgress(5000, 0.2)).toBeCloseTo(0.2);
  });

  it('stays open after a short drag', () => {
    expect(dragDismisses(40, 0)).toBe(false);
    expect(dragDismisses(-40, 0)).toBe(false);
  });

  it('closes after a long drag, down or up', () => {
    expect(dragDismisses(90, 0.1)).toBe(true);
    expect(dragDismisses(-90, -0.1)).toBe(true);
  });

  it('closes on a flick even if it was short', () => {
    expect(dragDismisses(20, 1.2)).toBe(true);
    expect(dragDismisses(-20, -1.2)).toBe(true);
  });

  it('does not treat a twitch as a flick', () => {
    expect(dragDismisses(6, 1.2)).toBe(false);
  });

  it('closes after a long drag when the resting finger only jitters back', () => {
    expect(dragDismisses(150, -0.02)).toBe(true);
    expect(dragDismisses(-150, 0.02)).toBe(true);
  });

  it('stays open when the finger is on its way back (changed their mind)', () => {
    expect(dragDismisses(150, -0.3)).toBe(false);
    expect(dragDismisses(-150, 0.3)).toBe(false);
  });
});

describe('level panel: multiplier time left', () => {
  it('speaks in hours from one hour up, in minutes below', () => {
    expect(timeLeftParts(14 * 60 + 20)).toEqual({ value: 14, unit: 'h' });
    expect(timeLeftParts(60)).toEqual({ value: 1, unit: 'h' });
    expect(timeLeftParts(45)).toEqual({ value: 45, unit: 'min' });
  });

  it('never says zero minutes while the multiplier still runs', () => {
    expect(timeLeftParts(0.2)).toEqual({ value: 1, unit: 'min' });
  });
});
