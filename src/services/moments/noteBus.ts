/**
 * Hands a quiet trophy note from AchievementContext (in RootProvider, above the
 * navigator) to the badge layer (XpDisplayProvider, inside the root layout) —
 * the two do not share a React tree branch (migration E8). Notes posted before
 * the badge layer listens wait here, none is lost.
 */
export interface QuietTrophyNote {
  items: { id: string; rarity: string; icon: string; nameKey: string }[];
  xp: number;
  boost?: { factor: string; hours: number } | undefined;
}

type Listener = (note: QuietTrophyNote) => void;

let listener: Listener | null = null;
let waiting: QuietTrophyNote[] = [];

export function postTrophyNote(note: QuietTrophyNote): void {
  if (listener) listener(note);
  else waiting.push(note);
}

/** The badge layer listens; notes that waited are delivered at once. */
export function listenTrophyNotes(next: Listener): () => void {
  listener = next;
  const backlog = waiting;
  waiting = [];
  backlog.forEach(next);
  return () => {
    if (listener === next) listener = null;
  };
}
