/**
 * A chapter already shown WITH the action that opened it (L-8): the trophies'
 * XP opened a new tier, so the chapter window carried the trophies. The level-up
 * event of that same XP must not show the chapter a second time — skip it ONCE
 * (a later level-up to the same level, after losing XP, shows again).
 */
const shown = new Set<number>();

export function markChapterShown(level: number): void {
  shown.add(level);
}

/** True (and forgotten) when this chapter was already shown with its action. */
export function takeChapterShown(level: number): boolean {
  return shown.delete(level);
}
