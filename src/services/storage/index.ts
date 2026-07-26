// Main storage service exports
export * from './base';

// SQLite storage services — the live implementations.
// Feature code must NOT import these directly; resolve storage through the
// helpers in `src/config/featureFlags.ts` (getHabitStorageImpl / …), which are
// also the seam tests mock.
export { SQLiteGratitudeStorage, sqliteGratitudeStorage } from './SQLiteGratitudeStorage';
export { SQLiteHabitStorage, sqliteHabitStorage } from './SQLiteHabitStorage';

// REMOVED in super audit Fáze 13 — the whole dead AsyncStorage cluster:
//   habitStorage / gratitudeStorage / goalStorage  (legacy impls, 3375 lines)
//   userStorage                                    (only read by StorageService)
//   migration (DataMigration)                      (only read by StorageService/backup)
//   backup (DataBackup)                            (parked Data Export & Backup feature)
//   StorageService + storageService singleton      (built entirely on the above;
//                                                   initialize() was never called)
//
// Nothing outside that cluster referenced any of it — the only path in was this
// barrel, re-exported by `src/services/index.ts` and pulled in by the
// side-effect `import '../src/services'` in `app/_layout.tsx:18`.
//
// The Data Export & Backup design intent is recorded in
// @projectplan-future-updates.md; the deleted implementation is recoverable with
// `git show 4292741:src/services/storage/backup.ts`. It could not be kept alive:
// it imported the legacy singletons, and repointing it at the SQLite helpers was
// impossible without writing new destructive code — `deleteAll` exists only on
// SQLiteGoalStorage, not on the habit or journal implementations.
