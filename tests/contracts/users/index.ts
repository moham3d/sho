// User Management Contract Tests Entry Point
// This file exports all test modules for easy running and configuration

// Import all test modules
export * from './crud.contract.test';
export * from './role-management.contract.test';
export * from './lifecycle.contract.test';
export * from './profile.contract.test';
export * from './pagination-filtering.contract.test';
export * from './security-compliance.contract.test';

// Import utilities and setup
export * from './setup';
export * from './fixtures';
export * from './mocks';
export * from './types';

// Test suite configuration
export const USER_MANAGEMENT_TEST_CONFIG = {
  timeout: 30000,
  setupTimeout: 10000,
  teardownTimeout: 5000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/users',
  coverageReporters: ['text', 'lcov', 'html']
};

// Test categories for selective running
export const TEST_CATEGORIES = {
  CRUD: 'CRUD Operations',
  ROLE_MANAGEMENT: 'Role Management',
  LIFECYCLE: 'User Lifecycle',
  PROFILE: 'Profile Management',
  PAGINATION_FILTERING: 'Pagination & Filtering',
  SECURITY_COMPLIANCE: 'Security & Compliance'
} as const;

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  MAX_RESPONSE_TIME: 1000, // 1 second
  MAX_DB_QUERY_TIME: 500, // 500ms
  MAX_AUTH_TIME: 100, // 100ms
  MAX_PAGINATION_TIME: 2000, // 2 seconds for large datasets
  MAX_SEARCH_TIME: 1500 // 1.5 seconds for search operations
};

// Security requirements
export const SECURITY_REQUIREMENTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 900000, // 15 minutes
  TOKEN_EXPIRATION: 604800000, // 7 days
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100
};

// Compliance requirements
export const COMPLIANCE_REQUIREMENTS = {
  DATA_RETENTION_DAYS: 365,
  AUDIT_LOG_RETENTION_DAYS: 1825, // 5 years
  GDPR_DELETE_WITHIN_DAYS: 30,
  MIN_PASSWORD_AGE_DAYS: 1,
  PASSWORD_HISTORY_SIZE: 5
};

// Test data patterns
export const TEST_DATA_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  NATIONAL_ID: /^\d{14}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Helper functions for test organization
export const getTestsByCategory = (category: keyof typeof TEST_CATEGORIES) => {
  const categoryTests = {
    [TEST_CATEGORIES.CRUD]: [
      'POST /api/users',
      'GET /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ],
    [TEST_CATEGORIES.ROLE_MANAGEMENT]: [
      'POST /api/users/:id/change-role',
      'Role-based access control',
      'Role transition validation'
    ],
    [TEST_CATEGORIES.LIFECYCLE]: [
      'POST /api/users/:id/activate',
      'POST /api/users/:id/deactivate',
      'User lifecycle state management'
    ],
    [TEST_CATEGORIES.PROFILE]: [
      'GET /api/users/me',
      'PUT /api/users/me',
      'Profile field validation'
    ],
    [TEST_CATEGORIES.PAGINATION_FILTERING]: [
      'Pagination',
      'Filtering',
      'Sorting',
      'Search',
      'Combined operations'
    ],
    [TEST_CATEGORIES.SECURITY_COMPLIANCE]: [
      'Input validation and sanitization',
      'Authentication and authorization',
      'Data privacy and GDPR compliance',
      'Audit logging and monitoring',
      'Rate limiting and throttling',
      'Security headers and response handling',
      'Password security'
    ]
  };

  return categoryTests[category] || [];
};

export const runCategoryTests = (category: keyof typeof TEST_CATEGORIES) => {
  const tests = getTestsByCategory(category);
  console.log(`Running ${category} tests:`);
  tests.forEach(test => console.log(`  - ${test}`));
};

// Export for Jest configuration
export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/contracts/users/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.ts'
  ],
  coverageDirectory: 'coverage/users',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/contracts/users/setup.ts'],
  testTimeout: USER_MANAGEMENT_TEST_CONFIG.timeout,
  verbose: USER_MANAGEMENT_TEST_CONFIG.verbose,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};