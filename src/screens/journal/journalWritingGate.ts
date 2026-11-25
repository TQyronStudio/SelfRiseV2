/**
 * The debt gate of the journal's save path (moved UNCHANGED from GratitudeInput
 * in migration E12; plan point 4: "the gate in the save path stays as it is").
 *
 * The locked writing tiles (R-14) are UX on top; THIS is authoritative: right
 * before an entry is stored it asks the storage again, so an entry can never
 * slip through while a debt exists (a stale state after midnight, a past entry
 * deleted, another screen).
 *
 * Returns the frozen days that block writing (0 = writing is allowed).
 */
import { getGratitudeStorageImpl } from '@/src/config/featureFlags';

const gratitudeStorage = getGratitudeStorageImpl();

export async function blockingDebtDays(): Promise<number> {
  const currentStreak = await gratitudeStorage.getStreak();
  const calculatedFrozenDays = await gratitudeStorage.calculateFrozenDays();
  // HARDENED (July 2026): the max of the saved state and the fresh calculation.
  // The saved value can be stale right after a midnight rollover or a past-entry
  // deletion — trusting it alone let entries slip through while real debt
  // existed. The fresh calculation returns 0 when currentStreak === 0 (FIX 15.3),
  // so Start Fresh / new users are unaffected.
  const authoritative = Math.max(currentStreak.frozenDays, calculatedFrozenDays);
  // No debt after a reset (streak 0).
  if (currentStreak.currentStreak === 0 && authoritative === 0) return 0;
  return authoritative > 0 ? authoritative : 0;
}
