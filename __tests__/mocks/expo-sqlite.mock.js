/* global jest */
/**
 * In-memory mock of `expo-sqlite` backed by Node's built-in `node:sqlite`.
 *
 * Provides REAL SQL semantics for tests (tables, transactions, queries),
 * so storage/gamification tests verify actual behavior instead of stubs.
 *
 * Requires Node >= 22.5 (node:sqlite). Jest runs on Node, not in RN runtime,
 * so this is a dev-environment requirement only.
 *
 * Mirrors the subset of the expo-sqlite async API used by the app:
 *   openDatabaseAsync, deleteDatabaseAsync
 *   db: execAsync, runAsync, getFirstAsync, getAllAsync,
 *       withTransactionAsync, prepareAsync, closeAsync
 *   statement: executeAsync, finalizeAsync
 */

const { DatabaseSync } = require('node:sqlite');

// node:sqlite accepts only number | string | bigint | null | Buffer.
// The app occasionally passes booleans / Dates / undefined — coerce them
// the same way expo-sqlite (SQLite C API bindings) would.
function toSqlValue(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  return value;
}

function normalizeParams(params) {
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return flat.map(toSqlValue);
}

class MockSQLiteStatement {
  constructor(nativeDb, sql) {
    this._db = nativeDb;
    this._sql = sql;
  }

  async executeAsync(...params) {
    const stmt = this._db.prepare(this._sql);
    const result = stmt.run(...normalizeParams(params));
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async finalizeAsync() {
    // node:sqlite statements are GC-managed; nothing to do.
  }
}

class MockSQLiteDatabase {
  constructor() {
    this._db = new DatabaseSync(':memory:');
    this._closed = false;
  }

  async execAsync(sql) {
    // In-memory DBs always report journal_mode = 'memory'; remember the
    // requested WAL mode so PRAGMA queries behave like the on-device DB.
    if (/PRAGMA\s+journal_mode\s*=\s*WAL/i.test(sql)) {
      this._walRequested = true;
    }
    this._db.exec(sql);
  }

  async runAsync(sql, ...params) {
    const stmt = this._db.prepare(sql);
    const result = stmt.run(...normalizeParams(params));
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async getFirstAsync(sql, ...params) {
    if (this._walRequested && /^\s*PRAGMA\s+journal_mode\s*;?\s*$/i.test(sql)) {
      return { journal_mode: 'wal' };
    }
    const stmt = this._db.prepare(sql);
    const row = stmt.get(...normalizeParams(params));
    return row === undefined ? null : row;
  }

  async getAllAsync(sql, ...params) {
    const stmt = this._db.prepare(sql);
    return stmt.all(...normalizeParams(params));
  }

  async withTransactionAsync(task) {
    this._db.exec('BEGIN');
    try {
      await task();
      this._db.exec('COMMIT');
    } catch (error) {
      this._db.exec('ROLLBACK');
      throw error;
    }
  }

  async prepareAsync(sql) {
    return new MockSQLiteStatement(this._db, sql);
  }

  async closeAsync() {
    if (!this._closed) {
      this._db.close();
      this._closed = true;
    }
  }
}

module.exports = {
  openDatabaseAsync: jest.fn(async () => new MockSQLiteDatabase()),
  deleteDatabaseAsync: jest.fn(async () => {}),
  // Exported for tests that want direct access to the mock classes.
  __MockSQLiteDatabase: MockSQLiteDatabase,
};
