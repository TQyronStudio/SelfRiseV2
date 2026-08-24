/**
 * What the "How SelfRise works" screen shows, and in what order.
 *
 * ONLY KEYS LIVE HERE — NEVER COPIES OF THE TEXT. Every entry points at the
 * same `help.*` key the in-app `?` tooltips already use, so the screen and the
 * tooltip can never drift apart. Duplicating the copy would give us two places
 * to edit and no way to notice when only one of them changed.
 *
 * ADMISSION TEST — "if the user does not know this, does it cost them
 * something?" Mechanics the app applies invisibly get in; labels for buttons
 * that already say what they do stay out.
 *
 *   ✅ makeupFunction   — without it you think you lost a streak unfairly
 *   ✅ selfRiseStreak   — without it your streak silently breaks at 2 entries
 *   ❌ home.quickActions      — the buttons are labelled with what they do
 *   ❌ home.recommendations   — self-evident once you look at the card
 *
 * The two excluded topics keep their tooltips; they are just not worth a
 * paragraph on a page somebody chose to read. This bar exists because pages
 * like this grow until nobody reads them — which is exactly how the 25-step
 * tutorial this app used to ship died.
 *
 * Deliberately import-free so the grouping can be asserted in tests without
 * pulling in the theme, i18n and navigation stacks.
 */
/**
 * Every key below is relative to `help.` — the screen and the test both add
 * that prefix. Keeping one convention means the guard test can check section
 * headings and topics the same way.
 */
export interface HelpSection {
  /** Stable id — React key and test anchor, never shown. */
  id: string;
  /** Key under `help.`, resolving to the section heading string. */
  titleKey: string;
  /**
   * Keys under `help.`, each resolving to an object with `title` and
   * `content`. Order is reading order, not importance order.
   */
  topicKeys: string[];
}

export const HOW_IT_WORKS_SECTIONS: HelpSection[] = [
  {
    id: 'habits',
    titleKey: 'sections.habits',
    topicKeys: [
      'habits.scheduling',
      'habits.bonusConversion',
      'habits.makeupFunction',
    ],
  },
  {
    id: 'journal',
    titleKey: 'sections.journal',
    topicKeys: [
      'journal.selfRiseStreak',
      'journal.debtRecovery',
    ],
  },
  {
    id: 'goals',
    titleKey: 'sections.goals',
    topicKeys: [
      'goals.overview',
      'goals.predictions',
    ],
  },
  {
    id: 'progress',
    titleKey: 'sections.progress',
    topicKeys: [
      'home.xpSystem',
    ],
  },
];

/** Every topic key on the screen, flattened — used by the i18n guard test. */
export function allHowItWorksTopicKeys(): string[] {
  return HOW_IT_WORKS_SECTIONS.flatMap(section => section.topicKeys);
}
