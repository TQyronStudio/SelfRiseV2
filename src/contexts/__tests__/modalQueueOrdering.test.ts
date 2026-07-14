// ModalQueue ordering — Regression Suite
//
// WHY THIS EXISTS (July 14, 2026): writing the 10th bonus journal entry froze the app.
// From the device log:
//
//   📥 enqueue level_up (priority 7)
//   📋 1 items - [level_up]                        ← presented on screen
//   ... ~1s of async work (streak calc, achievement check) ...
//   📥 enqueue celebration_bonus_milestone (priority 1)
//   📋 2 items - [celebration_bonus_milestone, level_up]   ← level_up DISPLACED from the head
//
// The renderer draws queue[0] as <Modal visible> keyed by id. Sorting a higher-priority
// modal in front of an already-presented head unmounts that modal and mounts another in
// the SAME frame → iOS gets a dismiss racing a present → frozen UI. (The user never saw
// the crown celebration, and the app locked.)
//
// It had "worked before" only because those enqueues landed in one tick, so React
// rendered once and the first modal never actually got presented.
//
// RULE: priority orders what is WAITING; it must never yank the modal on screen.
//
// These tests pin the reducer logic used by ModalQueueContext.enqueue().

interface QueuedModal {
  id: string;
  type: string;
  priority: number;
  timestamp: number;
}

const byPriority = (a: QueuedModal, b: QueuedModal) => {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.timestamp - b.timestamp;
};

/** Mirrors the enqueue() reducer in ModalQueueContext. */
function enqueue(
  prev: QueuedModal[],
  newModal: QueuedModal,
  presentedId: string | null
): QueuedModal[] {
  const head = prev[0];
  const headIsPresented = head !== undefined && presentedId === head.id;

  return headIsPresented
    ? [head, ...[...prev.slice(1), newModal].sort(byPriority)]
    : [...prev, newModal].sort(byPriority);
}

let seq = 0;
const modal = (type: string, priority: number): QueuedModal => ({
  id: `${type}_${seq}`,
  type,
  priority,
  timestamp: ++seq,
});

// Priorities from ModalPriority
const ACTIVITY_CELEBRATION = 1;
const ACHIEVEMENT = 6;
const LEVEL_UP = 7;

describe('ModalQueue: the presented modal is never displaced', () => {
  beforeEach(() => {
    seq = 0;
  });

  it('THE FREEZE: a higher-priority modal arriving later must NOT displace the presented one', () => {
    const levelUp = modal('level_up', LEVEL_UP);

    // level_up is queued alone → committed → presented on screen.
    let queue = enqueue([], levelUp, null);
    expect(queue.map(m => m.type)).toEqual(['level_up']);

    const presentedId = queue[0]!.id; // React has committed it

    // ~1s later the bonus-milestone celebration (priority 1) arrives.
    queue = enqueue(queue, modal('celebration_bonus_milestone', ACTIVITY_CELEBRATION), presentedId);

    // It must queue BEHIND the modal the user is looking at — not replace it mid-flight.
    expect(queue[0]!.id).toBe(presentedId);
    expect(queue.map(m => m.type)).toEqual(['level_up', 'celebration_bonus_milestone']);
  });

  it('reproduces the full log sequence without ever swapping the head', () => {
    const levelUp5 = modal('level_up', LEVEL_UP);

    let queue = enqueue([], levelUp5, null);
    const presentedId = queue[0]!.id;

    // Everything below arrived while level_up was already on screen.
    queue = enqueue(queue, modal('celebration_bonus_milestone', ACTIVITY_CELEBRATION), presentedId);
    queue = enqueue(queue, modal('level_up', LEVEL_UP), presentedId);
    queue = enqueue(queue, modal('achievement', ACHIEVEMENT), presentedId);

    // Head untouched; the rest correctly ordered by priority behind it.
    expect(queue.map(m => m.type)).toEqual([
      'level_up', // presented — pinned
      'celebration_bonus_milestone', // 1
      'achievement', // 6
      'level_up', // 7
    ]);
  });

  it('still sorts freely while nothing has been presented yet (same-tick burst)', () => {
    // Nothing committed → presentedId is null → priority fully decides.
    let queue = enqueue([], modal('level_up', LEVEL_UP), null);
    queue = enqueue(queue, modal('celebration_bonus_milestone', ACTIVITY_CELEBRATION), null);
    queue = enqueue(queue, modal('achievement', ACHIEVEMENT), null);

    expect(queue.map(m => m.type)).toEqual([
      'celebration_bonus_milestone',
      'achievement',
      'level_up',
    ]);
  });

  it('once the head is dequeued, the next modal becomes the (unpinned) head', () => {
    let queue = enqueue([], modal('level_up', LEVEL_UP), null);
    const presentedId = queue[0]!.id;
    queue = enqueue(queue, modal('celebration_bonus_milestone', ACTIVITY_CELEBRATION), presentedId);

    // User closes the presented modal.
    queue = queue.slice(1);
    expect(queue[0]!.type).toBe('celebration_bonus_milestone');

    // A higher-priority arrival may still overtake it — it is not on screen yet.
    queue = enqueue(queue, modal('celebration_daily_complete', ACTIVITY_CELEBRATION), null);
    expect(queue).toHaveLength(2);
  });

  it('keeps priority order among waiting modals behind a pinned head', () => {
    let queue = enqueue([], modal('level_up', LEVEL_UP), null);
    const presentedId = queue[0]!.id;

    // Arrive out of priority order.
    queue = enqueue(queue, modal('level_up', LEVEL_UP), presentedId);
    queue = enqueue(queue, modal('achievement', ACHIEVEMENT), presentedId);
    queue = enqueue(queue, modal('celebration_daily_complete', ACTIVITY_CELEBRATION), presentedId);

    expect(queue.slice(1).map(m => m.priority)).toEqual([
      ACTIVITY_CELEBRATION,
      ACHIEVEMENT,
      LEVEL_UP,
    ]);
  });
});
