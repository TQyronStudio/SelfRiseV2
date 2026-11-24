/**
 * Where an XP spark starts (migration E7, point 2) — without touching the app's
 * logic. Right BEFORE an action that earns XP, the screen registers the point of
 * the control the user touched (a habit's check, the journal's Add button, a
 * goal's quick log). When the `xpGained` event arrives, the spark layer takes
 * the point once: matched by `sourceId`, or by the FAMILY of the source (habit_*,
 * journal_*, goal_* …) when the record is younger than 3 s — the journal pays an
 * entry as journal_entry, journal_bonus or journal_bonus_milestone depending on
 * the day's count, which the screen cannot know before the action. Take the
 * point only for a gain that really flies now (not a held or negative one).
 * Nothing found → the spark starts from the centre.
 *
 * Contexts, storage and addXP do not change for this. Pure module store, tested
 * in __tests__/xpOriginRegistry.test.ts.
 */
export interface XpOriginPoint {
  x: number;
  y: number;
}

interface OriginRecord {
  source: string;
  sourceId?: string | undefined;
  point: XpOriginPoint;
  at: number;
}

/** A record matched by its kind of source only must be this fresh. */
export const ORIGIN_BY_SOURCE_MS = 3000;
/** Records older than this are forgotten in any case. */
const ORIGIN_MAX_AGE_MS = 10000;

let records: OriginRecord[] = [];

/** habit_completion → habit, journal_bonus_milestone → journal, … */
export function sourceFamily(source: string): string {
  const cut = source.indexOf('_');
  return cut === -1 ? source : source.slice(0, cut);
}

function prune(now: number) {
  records = records.filter(r => now - r.at <= ORIGIN_MAX_AGE_MS);
}

export function registerXpOrigin(
  key: { source: string; sourceId?: string | undefined },
  point: XpOriginPoint,
  now: number = Date.now()
): void {
  prune(now);
  records.push({ source: key.source, sourceId: key.sourceId, point, at: now });
}

/** Takes (and forgets) the point for a gain; null = start from the centre. */
export function takeXpOrigin(
  gain: { source: string; sourceId?: string | undefined },
  now: number = Date.now()
): XpOriginPoint | null {
  prune(now);
  let index = gain.sourceId
    ? records.findIndex(r => r.sourceId === gain.sourceId)
    : -1;
  if (index === -1) {
    // Newest first: the last touch of that kind is the one that earned it.
    for (let i = records.length - 1; i >= 0; i--) {
      const r = records[i]!;
      if (
        sourceFamily(r.source) === sourceFamily(gain.source) &&
        now - r.at <= ORIGIN_BY_SOURCE_MS
      ) {
        index = i;
        break;
      }
    }
  }
  if (index === -1) return null;
  const [record] = records.splice(index, 1);
  return record ? record.point : null;
}

/** Tests only. */
export function resetXpOrigins(): void {
  records = [];
}

// ---------------------------------------------------------------------------
// The point a MOMENT's held XP leaves from (E8): the window's Continue button.
// The window registers it as it closes; the XP layer takes it when it releases
// the held XP of that kind (a moment closes once, so one point per kind).
// ---------------------------------------------------------------------------

const MOMENT_ORIGIN_MAX_AGE_MS = 3000;
const momentOrigins = new Map<string, { point: XpOriginPoint; at: number }>();

export function registerMomentOrigin(kind: string, point: XpOriginPoint, now: number = Date.now()): void {
  momentOrigins.set(kind, { point, at: now });
}

export function takeMomentOrigin(kind: string, now: number = Date.now()): XpOriginPoint | null {
  const record = momentOrigins.get(kind);
  momentOrigins.delete(kind);
  if (!record || now - record.at > MOMENT_ORIGIN_MAX_AGE_MS) return null;
  return record.point;
}
