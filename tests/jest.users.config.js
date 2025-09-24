module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['/home/mohamed/sho'],
  testMatch: [
    '/home/mohamed/sho/tests/contracts/users/**/*.test.ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '/home/mohamed/sho/tests/contracts/users/**/*.ts',
    '!/home/mohamed/sho/tests/contracts/users/**/*.d.ts'
  ],
  coverageDirectory: '/home/mohamed/sho/coverage/users',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['/home/mohamed/sho/tests/contracts/users/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '/home/mohamed/sho/src/$1',
  },
  testPathIgnorePatterns: [
    '/home/mohamed/sho/node_modules/',
    '/home/mohamed/sho/tests/contracts/(?!users/).+'
  ]
};