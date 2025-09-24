// Form Management Contract Tests Configuration
// This configuration sets up Jest for comprehensive form management testing

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/contracts/forms'],
  testMatch: [
    '**/tests/contracts/forms/**/*.test.ts',
    '**/tests/contracts/forms/**/*.test.js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/*.stories.ts',
    '!backend/src/**/*.test.ts'
  ],
  coverageDirectory: 'coverage/forms',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/contracts/forms/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@forms/(.*)$': '<rootDir>/tests/contracts/forms/$1'
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  maxWorkers: 4,
  detectOpenHandles: true,
  slowTestThreshold: 15000,

  // Global test variables
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },

  // Test environment variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};