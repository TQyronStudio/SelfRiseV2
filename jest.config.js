module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
  },
  transformIgnorePatterns: [
    // Prefix match (no trailing slash) so that e.g. `expo` also covers
    // expo-sqlite, expo-modules-core and other expo-* ESM packages.
    'node_modules/(?!(react-native|@react-native|@expo|expo|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|react-navigation|@react-navigation))',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/__tests__/setup.ts',
    '<rootDir>/__tests__/mocks/',
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};