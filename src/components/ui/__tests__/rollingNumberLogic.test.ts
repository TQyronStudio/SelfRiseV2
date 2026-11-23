import { rollColumns, splitMargins } from '../rollingNumberLogic';

describe('rollColumns()', () => {
  it('rolls only the digits, ordered from the right', () => {
    expect(rollColumns('+145 XP').map(c => [c.ch, c.isDigit, c.order])).toEqual(
      [
        ['+', false, -1],
        ['1', true, 2],
        ['4', true, 1],
        ['5', true, 0],
        [' ', false, -1],
        ['X', false, -1],
        ['P', false, -1],
      ]
    );
  });

  it('keys columns from the right, so a changing number keeps its columns', () => {
    const before = rollColumns('145').map(c => c.keyFromRight);
    const after = rollColumns('170').map(c => c.keyFromRight);
    expect(after).toEqual(before);
    // One digit more on the left: the existing columns keep their keys.
    expect(
      rollColumns('1045')
        .map(c => c.keyFromRight)
        .slice(1)
    ).toEqual(before);
  });
});

describe('splitMargins()', () => {
  it('moves every margin to the row and keeps the rest on the digits (P34)', () => {
    const { rowMargins, ownText } = splitMargins({
      fontSize: 15,
      lineHeight: 20,
      color: 'x',
      marginLeft: 4,
      marginTop: -2,
      marginHorizontal: 1,
    });
    expect(rowMargins).toEqual({
      marginLeft: 4,
      marginTop: -2,
      marginHorizontal: 1,
    });
    expect(ownText).toEqual({ fontSize: 15, lineHeight: 20, color: 'x' });
  });

  it('copes with no style', () => {
    expect(splitMargins(undefined as never)).toEqual({
      rowMargins: {},
      ownText: {},
    });
  });
});
