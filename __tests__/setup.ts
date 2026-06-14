import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage with persistent storage
const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
  multiGet: jest.fn((keys: string[]) => 
    Promise.resolve(keys.map(key => [key, mockStorage[key] || null]))
  ),
  multiSet: jest.fn((pairs: [string, string][]) => {
    pairs.forEach(([key, value]) => mockStorage[key] = value);
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

// Mock Expo modules
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en', regionCode: 'US' }]),
}));

// Mock expo-sqlite with a real in-memory SQLite (node:sqlite, Node >= 22.5).
// Gives tests genuine SQL semantics instead of inert stubs.
jest.mock('expo-sqlite', () => require('./mocks/expo-sqlite.mock'));

// Initialize the (mocked, in-memory) SQLite database before each suite.
// Mirrors production startup, where initializeDatabase() runs before any
// storage/gamification code executes. Each jest suite has its own module
// registry, so every test file gets a fresh in-memory database.
beforeAll(async () => {
  const { initializeDatabase } = require('../src/services/database/init');
  await initializeDatabase();
});

// Global test timeout
jest.setTimeout(10000);