// Database Initialization Test
// Run this to verify SQLite works before migration

import { initializeDatabase, getDatabase, closeDatabase, isDatabaseInitialized } from '../init';

describe('Database Initialization', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  test('should initialize database successfully', async () => {
    const db = await initializeDatabase();
    expect(db).toBeDefined();
    expect(isDatabaseInitialized()).toBe(true);
  });

  test('should create all tables', async () => {
    const db = await initializeDatabase();

    // Check if tables exist by querying sqlite_master
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('journal_entries');
    expect(tableNames).toContain('streak_state');
    expect(tableNames).toContain('habits');
    expect(tableNames).toContain('habit_completions');
    expect(tableNames).toContain('goals');
    expect(tableNames).toContain('goal_milestones');
  });

  test('should enable WAL mode', async () => {
    const db = await initializeDatabase();

    const result = await db.getFirstAsync<{ journal_mode: string }>(
      'PRAGMA journal_mode'
    );

    expect(result?.journal_mode).toBe('wal');
  });

  test('should enable foreign keys', async () => {
    const db = await initializeDatabase();

    const result = await db.getFirstAsync<{ foreign_keys: number }>(
      'PRAGMA foreign_keys'
    );

    expect(result?.foreign_keys).toBe(1);
  });

  test('should return same instance on multiple calls', async () => {
    const db1 = await initializeDatabase();
    const db2 = await initializeDatabase();

    expect(db1).toBe(db2);
  });

  test('should insert and retrieve data', async () => {
    const db = await initializeDatabase();

    // Insert test journal entry
    await db.runAsync(
      `INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['test-1', 'Test gratitude', 'gratitude', '2025-01-12', 1, Date.now(), Date.now()]
    );

    // Retrieve it
    const result = await db.getFirstAsync<{ text: string }>(
      'SELECT text FROM journal_entries WHERE id = ?',
      ['test-1']
    );

    expect(result?.text).toBe('Test gratitude');

    // Cleanup
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', ['test-1']);
  });
});
