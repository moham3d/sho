// Visit Management Contract Tests Entry Point
// This file serves as the main entry point for all visit-related contract tests

export * from './types';
export * from './fixtures';
export * from './setup';
export * from './utils';
export * from './crud.contract.test';
export * from './workflow.contract.test';
export * from './scheduling.contract.test';
export * from './security-audit.contract.test';

// Test configuration
export const VISIT_TEST_CONFIG = {
  // Test timeouts (in milliseconds)
  TIMEOUTS: {
    SHORT: 5000,
    MEDIUM: 15000,
    LONG: 30000,
    EXTENDED: 60000
  },

  // Test data configuration
  TEST_DATA: {
    DEFAULT_PATIENT_COUNT: 3,
    DEFAULT_USER_COUNT: 4,
    DEFAULT_VISIT_COUNT: 10,
    MAX_FORMS_PER_VISIT: 5
  },

  // API endpoints
  ENDPOINTS: {
    BASE: '/api/visits',
    CRUD: {
      LIST: '/api/visits',
      CREATE: '/api/visits',
      GET: '/api/visits/:id',
      UPDATE: '/api/visits/:id',
      DELETE: '/api/visits/:id'
    },
    WORKFLOW: {
      CHECK_IN: '/api/visits/:id/check-in',
      CHECK_OUT: '/api/visits/:id/check-out',
      UPCOMING: '/api/visits/upcoming',
      PATIENT_VISITS: '/api/visits/patient/:patientId'
    },
    FORMS: {
      LIST: '/api/visits/:id/forms',
      CREATE: '/api/visits/:id/forms'
    },
    ANALYTICS: {
      AUDIT: '/api/visits/audit',
      UTILIZATION: '/api/visits/utilization',
      WAIT_TIMES: '/api/visits/wait-times',
      AVAILABILITY: '/api/visits/availability'
    }
  },

  // Test environment configuration
  ENVIRONMENT: {
    USE_MOCK_APP: process.env.NODE_ENV === 'test' || !process.env.POSTGREST_URL,
    BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    POSTGREST_URL: process.env.POSTGREST_URL || 'http://localhost:3000',
    TIMEOUT: process.env.TEST_TIMEOUT || '30000'
  },

  // Test coverage requirements
  COVERAGE: {
    MIN_BRANCH_COVERAGE: 80,
    MIN_FUNCTION_COVERAGE: 80,
    MIN_LINE_COVERAGE: 80,
    MIN_STATEMENT_COVERAGE: 80
  },

  // Performance thresholds
  PERFORMANCE: {
    MAX_RESPONSE_TIME: 2000, // 2 seconds
    MAX_DB_QUERY_TIME: 500, // 500ms
    MAX_CONCURRENT_REQUESTS: 100
  },

  // Security configuration
  SECURITY: {
    REQUIRE_AUTH: true,
    ENFORCE_RBAC: true,
    ENABLE_AUDIT_LOGGING: true,
    ENCRYPT_SENSITIVE_DATA: true,
    SESSION_TIMEOUT: 3600 // 1 hour
  },

  // Validation rules
  VALIDATION: {
    VISIT_TYPES: ['initial', 'follow_up', 'emergency', 'routine', 'specialist', 'surgery', 'therapy', 'consultation'],
    PRIORITIES: ['low', 'medium', 'high', 'urgent', 'emergency'],
    STATUSES: ['pending', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    OUTCOMES: ['discharged', 'admitted', 'transferred', 'referred', 'deceased', 'other'],
    FORM_TYPES: ['medical_history', 'vital_signs', 'examination', 'treatment_plan', 'progress_note'],
    MIN_DURATION: 10, // minutes
    MAX_DURATION: 240, // minutes
    WORKING_HOURS: {
      START: 8, // 8 AM
      END: 18 // 6 PM
    }
  }
};

// Helper functions for test configuration
export const getTestTimeout = (type: 'short' | 'medium' | 'long' | 'extended' = 'medium'): number => {
  return VISIT_TEST_CONFIG.TIMEOUTS[type.toUpperCase()];
};

export const getEndpoint = (path: string): string => {
  return `${VISIT_TEST_CONFIG.ENVIRONMENT.BASE_URL}${path}`;
};

export const isMockEnvironment = (): boolean => {
  return VISIT_TEST_CONFIG.ENVIRONMENT.USE_MOCK_APP;
};

export const validateTestEnvironment = (): void => {
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Using mock configuration for tests');
  }
};

// Initialize test environment
validateTestEnvironment();

// Export default configuration for easy importing
export default VISIT_TEST_CONFIG;