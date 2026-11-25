/** A chapter shown with its action is skipped ONCE by the level-up of the same XP (L-8). */
import { markChapterShown, takeChapterShown } from '../chapterShown';

it('skips once, then shows again', () => {
  expect(takeChapterShown(21)).toBe(false);
  markChapterShown(21);
  expect(takeChapterShown(21)).toBe(true);
  expect(takeChapterShown(21)).toBe(false);
});
