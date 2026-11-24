/**
 * The ordering rule of the window queue (ModalQueueContext.enqueue), as a pure
 * function so the regression suite tests THE rule, not a copy
 * (__tests__/modalQueueOrdering.test.ts; migration E8 step 3).
 *
 * RULE: priority (lower = first, stable by timestamp) orders what is WAITING; it
 * must never yank the window already on screen. Sorting a higher-priority window
 * in front of a presented head unmounted it and mounted another in the same
 * frame — iOS got a dismiss racing a present and froze (July 2026, the 10th
 * bonus entry). A burst of enqueues in one tick, before anything is presented,
 * is still free to reorder fully.
 */
export interface Orderable {
  id: string;
  priority: number;
  timestamp: number;
}

export const byPriority = (a: Orderable, b: Orderable): number => {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.timestamp - b.timestamp;
};

/** The queue after `newModal` arrives; `presentedId` = the window on screen, if any. */
export function insertModal<T extends Orderable>(
  prev: T[],
  newModal: T,
  presentedId: string | null
): T[] {
  const head = prev[0];
  const headIsPresented = head !== undefined && presentedId === head.id;
  return headIsPresented
    ? [head, ...[...prev.slice(1), newModal].sort(byPriority)]
    : [...prev, newModal].sort(byPriority);
}
