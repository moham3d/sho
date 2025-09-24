module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests'],
  displayName: 'auth-contracts',
  testMatch: [
    '**/tests/contracts/auth/**/*.test.ts',
    '**/tests/contracts/auth/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/contracts/auth/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../src/auth/**/*.ts',
    '../src/middleware/**/*.ts',
    '../src/services/auth.service.ts',
    '../src/controllers/auth.controller.ts',
    '!../src/**/*.d.ts',
    '!../src/**/*.stories.{ts,tsx}'
  ],
  coverageDirectory: '../coverage/auth',
  testTimeout: 15000, // Extended timeout for auth tests
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  // Add test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-for-contract-tests',
    JWT_REFRESH_SECRET: 'test-refresh-secret-for-contract-tests',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db'
  }
};