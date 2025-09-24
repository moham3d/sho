module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests'],
  displayName: 'admin-contracts',
  testMatch: [
    '**/tests/contracts/admin/**/*.test.ts',
    '**/tests/contracts/admin/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/contracts/admin/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../src/admin/**/*.ts',
    '../src/controllers/admin.controller.ts',
    '../src/services/admin.service.ts',
    '../src/middleware/admin.middleware.ts',
    '../src/services/system.service.ts',
    '../src/services/audit.service.ts',
    '../src/services/backup.service.ts',
    '!../src/**/*.d.ts',
    '!../src/**/*.stories.{ts,tsx}'
  ],
  coverageDirectory: '../coverage/admin',
  testTimeout: 30000, // Extended timeout for admin operations
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
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    BACKUP_DIR: '/tmp/test-backups',
    AUDIT_LOG_RETENTION_DAYS: '90',
    MAINTENANCE_MODE_TIMEOUT: '3600'
  }
};