// Form Management Contract Tests Entry Point
// This file exports all test modules for easy running and configuration

// Import all test modules
export * from './crud.contract.test';
export * from './digital-signature.contract.test';
export * from './audit-trail.contract.test';
export * from './rbac.contract.test';
export * from './security-compliance.contract.test';

// Import utilities and setup
export * from './setup';
export * from './fixtures';
export * from './types';
export * from './utils';

// Test suite configuration
export const FORM_MANAGEMENT_TEST_CONFIG = {
  timeout: 30000,
  setupTimeout: 10000,
  teardownTimeout: 5000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/forms',
  coverageReporters: ['text', 'lcov', 'html']
};

// Test categories for selective running
export const TEST_CATEGORIES = {
  CRUD_OPERATIONS: 'CRUD Operations',
  DIGITAL_SIGNATURES: 'Digital Signatures',
  AUDIT_TRAIL: 'Audit Trail & Versioning',
  ROLE_BASED_ACCESS: 'Role-Based Access Control',
  SECURITY_COMPLIANCE: 'Security & Compliance',
  FORM_TEMPLATES: 'Form Templates',
  SUBMISSION_APPROVAL: 'Form Submission & Approval',
  MULTI_LANGUAGE: 'Multi-Language Support',
  PDF_GENERATION: 'PDF Generation',
  INTEGRATION_VISITS: 'Visit Management Integration'
} as const;

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  MAX_RESPONSE_TIME: 2000, // 2 seconds
  MAX_DB_QUERY_TIME: 500, // 500ms
  MAX_SIGNATURE_VERIFICATION_TIME: 3000, // 3 seconds
  MAX_FORM_SEARCH_TIME: 3000, // 3 seconds
  MAX_FORM_SUBMISSION_TIME: 5000, // 5 seconds
  MAX_AUDIT_LOG_QUERY_TIME: 1000, // 1 second
  MAX_PDF_GENERATION_TIME: 10000, // 10 seconds
  MAX_CONCURRENT_REQUESTS: 100
};

// Security requirements
export const SECURITY_REQUIREMENTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 1800000, // 30 minutes
  TOKEN_EXPIRATION: 86400000, // 24 hours
  PASSWORD_MIN_LENGTH: 12,
  REQUIRE_STRONG_PASSWORD: true,
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  AUDIT_LOG_RETENTION_DAYS: 2555, // 7 years
  RATE_LIMITING: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 100
  }
};

// Compliance requirements
export const COMPLIANCE_REQUIREMENTS = {
  GDPR_COMPLIANT: true,
  HIPAA_COMPLIANT: true,
  DATA_RETENTION_DAYS: 365,
  RIGHT_TO_BE_FORGOTTEN: true,
  AUDIT_TRAIL_REQUIRED: true,
  CONSENT_REQUIRED: true,
  DATA_BREACH_NOTIFICATION_HOURS: 72,
  BACKUP_FREQUENCY_HOURS: 24,
  DISASTER_RECOVERY_RTO_HOURS: 4,
  DISASTER_RECOVERY_RPO_HOURS: 1
};

// Test data patterns
export const TEST_DATA_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  NATIONAL_ID_EG: /^\d{14}$/,
  BLOOD_PRESSURE: /^\d{2,3}\/\d{2,3}$/,
  HEART_RATE: /^\d{2,3}$/,
  TEMPERATURE: /^\d{2}\.\d$/,
  PAIN_SCALE: /^[0-9]{1,2}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
};

// Form status transitions
export const FORM_STATUS_TRANSITIONS = {
  draft: ['in_progress', 'archived'],
  in_progress: ['pending_review', 'draft', 'archived'],
  pending_review: ['approved', 'rejected', 'in_progress'],
  approved: ['signed', 'archived'],
  rejected: ['draft', 'in_progress', 'archived'],
  signed: ['archived'],
  archived: []
};

// Signature workflow requirements
export const SIGNATURE_WORKFLOW = {
  REQUIRED_ROLES: {
    nurse_form: ['nurse', 'doctor'],
    doctor_form: ['doctor'],
    consent_form: ['patient', 'doctor'],
    patient_form: ['patient', 'nurse']
  },
  SIGNATURE_TYPES: {
    digital: {
      requires_certificate: false,
      requires_biometric: false,
      legal_validity: true
    },
    electronic: {
      requires_certificate: false,
      requires_biometric: false,
      legal_validity: true
    },
    wet: {
      requires_certificate: false,
      requires_biometric: false,
      legal_validity: true
    }
  }
};

// Audit trail requirements
export const AUDIT_TRAIL_REQUIREMENTS = {
  MANDATORY_FIELDS: [
    'id',
    'formId',
    'action',
    'userId',
    'userRole',
    'timestamp',
    'ipAddress',
    'userAgent',
    'details'
  ],
  ACTIONS: [
    'created',
    'updated',
    'deleted',
    'submitted',
    'approved',
    'rejected',
    'signed',
    'archived',
    'restored',
    'viewed',
    'exported',
    'version_created',
    'version_restored'
  ],
  RETENTION_DAYS: 2555, // 7 years
  IMMUTABLE: true
};

// Multi-language support
export const LANGUAGE_SUPPORT = {
  SUPPORTED_LANGUAGES: ['en', 'ar'],
  DEFAULT_LANGUAGE: 'ar',
  RTL_LANGUAGES: ['ar'],
  FIELD_TRANSLATIONS: {
    patient_name: { en: 'Patient Name', ar: 'اسم المريض' },
    blood_pressure: { en: 'Blood Pressure', ar: 'ضغط الدم' },
    heart_rate: { en: 'Heart Rate', ar: 'معدل ضربات القلب' },
    temperature: { en: 'Temperature', ar: 'درجة الحرارة' },
    chief_complaint: { en: 'Chief Complaint', ar: 'الشكوى الرئيسية' }
  }
};

// API endpoint specifications
export const API_SPECIFICATIONS = {
  forms: {
    list: {
      method: 'GET',
      path: '/api/forms',
      authentication: 'required',
      parameters: {
        query: ['page', 'pageSize', 'type', 'status', 'patientId', 'visitId', 'startDate', 'endDate', 'search', 'sortBy', 'sortOrder'],
        required: []
      },
      response: {
        status: 200,
        structure: 'PaginatedResponse<Form>'
      }
    },
    create: {
      method: 'POST',
      path: '/api/forms',
      authentication: 'required',
      parameters: {
        body: ['templateId', 'patientId', 'type', 'status', 'data'],
        required: ['templateId', 'patientId', 'type']
      },
      response: {
        status: 201,
        structure: 'Form'
      }
    },
    get: {
      method: 'GET',
      path: '/api/forms/:id',
      authentication: 'required',
      parameters: {
        path: ['id'],
        query: ['fields']
      },
      response: {
        status: 200,
        structure: 'Form'
      }
    },
    update: {
      method: 'PUT',
      path: '/api/forms/:id',
      authentication: 'required',
      parameters: {
        path: ['id'],
        body: ['data', 'status']
      },
      response: {
        status: 200,
        structure: 'Form'
      }
    },
    delete: {
      method: 'DELETE',
      path: '/api/forms/:id',
      authentication: 'required',
      parameters: {
        path: ['id']
      },
      response: {
        status: 200,
        structure: '{ message: string }'
      }
    },
    submit: {
      method: 'POST',
      path: '/api/forms/:id/submit',
      authentication: 'required',
      parameters: {
        path: ['id'],
        body: ['submissionMethod', 'destination']
      },
      response: {
        status: 200,
        structure: 'FormSubmission'
      }
    },
    sign: {
      method: 'POST',
      path: '/api/forms/:id/sign',
      authentication: 'required',
      parameters: {
        path: ['id'],
        body: ['signatureType', 'signerRole', 'signatureData']
      },
      response: {
        status: 201,
        structure: 'FormSignature'
      }
    },
    auditTrail: {
      method: 'GET',
      path: '/api/forms/:id/audit-trail',
      authentication: 'required',
      parameters: {
        path: ['id'],
        query: ['action', 'userRole', 'startDate', 'endDate', 'page', 'pageSize']
      },
      response: {
        status: 200,
        structure: 'AuditEntry[]'
      }
    },
    versions: {
      list: {
        method: 'GET',
        path: '/api/forms/:id/versions',
        authentication: 'required',
        parameters: {
          path: ['id'],
          query: ['minVersion', 'maxVersion', 'page', 'pageSize']
        },
        response: {
          status: 200,
          structure: 'FormVersion[]'
        }
      },
      create: {
        method: 'POST',
        path: '/api/forms/:id/versions',
        authentication: 'required',
        parameters: {
          path: ['id'],
          body: ['version', 'changeReason', 'data']
        },
        response: {
          status: 201,
          structure: 'FormVersion'
        }
      },
      restore: {
        method: 'POST',
        path: '/api/forms/:id/restore',
        authentication: 'required',
        parameters: {
          path: ['id'],
          body: ['versionId', 'reason']
        },
        response: {
          status: 200,
          structure: 'Form'
        }
      }
    },
    export: {
      method: 'GET',
      path: '/api/forms/:id/export',
      authentication: 'required',
      parameters: {
        path: ['id'],
        query: ['format', 'language', 'includeSignatures', 'includeAuditTrail']
      },
      response: {
        status: 200,
        structure: 'File'
      }
    }
  }
};

// Helper functions for test organization
export const getTestsByCategory = (category: keyof typeof TEST_CATEGORIES) => {
  const categoryTests = {
    [TEST_CATEGORIES.CRUD_OPERATIONS]: [
      'GET /api/forms (list with pagination)',
      'GET /api/forms (filtering and sorting)',
      'GET /api/forms/:id (get by ID)',
      'POST /api/forms (create form)',
      'PUT /api/forms/:id (update form)',
      'DELETE /api/forms/:id (delete form)',
      'GET /api/forms/templates (list templates)'
    ],
    [TEST_CATEGORIES.DIGITAL_SIGNATURES]: [
      'GET /api/forms/:id/signatures (list signatures)',
      'POST /api/forms/:id/sign (add signature)',
      'Signature verification and validation',
      'Signature workflow management',
      'Certificate-based signatures',
      'Biometric verification',
      'Signature revocation and rejection'
    ],
    [TEST_CATEGORIES.AUDIT_TRAIL]: [
      'GET /api/forms/:id/audit-trail (get audit trail)',
      'GET /api/forms/:id/versions (list versions)',
      'POST /api/forms/:id/versions (create version)',
      'POST /api/forms/:id/restore (restore version)',
      'Audit trail filtering and search',
      'Version comparison and rollback',
      'Audit trail compliance and security'
    ],
    [TEST_CATEGORIES.ROLE_BASED_ACCESS]: [
      'Role-based CRUD permissions',
      'Form type-specific access control',
      'Department-based access control',
      'Patient assignment-based access',
      'Time-based access control',
      'Conditional access rules',
      'Emergency override permissions'
    ],
    [TEST_CATEGORIES.SECURITY_COMPLIANCE]: [
      'Data privacy and PHI protection',
      'Input validation and sanitization',
      'Authentication and authorization',
      'Rate limiting and throttling',
      'Audit trail security',
      'Data encryption',
      'HIPAA compliance',
      'GDPR compliance',
      'Security headers and response handling',
      'Vulnerability protection'
    ]
  };

  return categoryTests[category] || [];
};

export const runCategoryTests = (category: keyof typeof TEST_CATEGORIES) => {
  const tests = getTestsByCategory(category);
  console.log(`Running ${category} tests:`);
  tests.forEach(test => console.log(`  - ${test}`));
};

// Test data validation helpers
export const validateFormData = (data: any, template: any) => {
  const errors: string[] = [];

  // Check required fields
  template.requiredFields.forEach((field: string) => {
    if (!data[field]) {
      errors.push(`Required field '${field}' is missing`);
    }
  });

  // Check field validations
  template.validationRules.forEach((rule: any) => {
    const value = data[rule.fieldId];
    if (value && rule.type === 'pattern' && !new RegExp(rule.condition).test(value)) {
      errors.push(rule.message);
    }
  });

  return errors;
};

export const validateSignatureData = (signature: any) => {
  const errors: string[] = [];

  if (!signature.signatureType) {
    errors.push('Signature type is required');
  }

  if (!signature.signerRole) {
    errors.push('Signer role is required');
  }

  if (!signature.signatureData) {
    errors.push('Signature data is required');
  }

  if (signature.signatureData && !signature.signatureData.startsWith('data:image/')) {
    errors.push('Invalid signature data format');
  }

  return errors;
};

export const validateAuditEntry = (entry: any) => {
  const errors: string[] = [];

  AUDIT_TRAIL_REQUIREMENTS.MANDATORY_FIELDS.forEach((field: string) => {
    if (!entry[field]) {
      errors.push(`Mandatory field '${field}' is missing`);
    }
  });

  if (!AUDIT_TRAIL_REQUIREMENTS.ACTIONS.includes(entry.action)) {
    errors.push(`Invalid action '${entry.action}'`);
  }

  if (!entry.timestamp || new Date(entry.timestamp).toString() === 'Invalid Date') {
    errors.push('Invalid timestamp');
  }

  return errors;
};

// Performance monitoring utilities
export const monitorPerformance = (operationName: string, threshold: number = PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME) => {
  return {
    before: () => {
      return {
        name: operationName,
        startTime: Date.now(),
        memoryUsage: process.memoryUsage()
      };
    },
    after: (beforeData: any) => {
      const endTime = Date.now();
      const duration = endTime - beforeData.startTime;

      const result = {
        name: operationName,
        duration,
        threshold,
        success: duration <= threshold,
        memoryUsage: process.memoryUsage()
      };

      if (result.success) {
        console.log(`✅ ${operationName}: ${duration}ms (within ${threshold}ms threshold)`);
      } else {
        console.warn(`⚠️ ${operationName}: ${duration}ms (exceeds ${threshold}ms threshold)`);
      }

      return result;
    }
  };
};

// Security test utilities
export const securityTestRunner = {
  sqlInjection: (payload: string) => {
    const sqlPatterns = [
      /('|(--)|(;)|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(XP_|SP_)\w+\b)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(payload));
  },

  xss: (payload: string) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<img\b[^>]*onerror\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    return xssPatterns.some(pattern => pattern.test(payload));
  },

  pathTraversal: (payload: string) => {
    const pathPatterns = [
      /\.\.\//g,
      /\.\.\\\/g,
      /\/etc\/passwd/g,
      /C:\\Windows\\/g
    ];

    return pathPatterns.some(pattern => pattern.test(payload));
  }
};

// Export for Jest configuration
export default {
  testEnvironment: 'node',
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
    '!backend/src/**/*.test.ts'
  ],
  coverageDirectory: 'coverage/forms',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/contracts/forms/setup.ts'],
  testTimeout: FORM_MANAGEMENT_TEST_CONFIG.timeout,
  verbose: FORM_MANAGEMENT_TEST_CONFIG.verbose,
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
  }
};