// Form Management Test Setup
// This file contains the setup and teardown logic for form management tests

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { TestContext } from './types';
import {
  TEST_USERS,
  TEST_PATIENTS,
  TEST_VISITS,
  TEST_FORMS,
  NURSE_FORM_TEMPLATE,
  DOCTOR_FORM_TEMPLATE,
  CONSENT_FORM_TEMPLATE,
  API_ENDPOINTS,
  generateTestId
} from './fixtures';

// Global test context
let testContext: TestContext;

// Mock database setup
export const mockDatabase = {
  users: new Map(Object.entries(TEST_USERS)),
  patients: new Map(Object.entries(TEST_PATIENTS)),
  visits: new Map(Object.entries(TEST_VISITS)),
  forms: new Map(Object.entries(TEST_FORMS)),
  templates: new Map([
    [NURSE_FORM_TEMPLATE.id, NURSE_FORM_TEMPLATE],
    [DOCTOR_FORM_TEMPLATE.id, DOCTOR_FORM_TEMPLATE],
    [CONSENT_FORM_TEMPLATE.id, CONSENT_FORM_TEMPLATE]
  ]),
  signatures: new Map(),
  auditTrail: new Map(),
  reset: () => {
    mockDatabase.users = new Map(Object.entries(TEST_USERS));
    mockDatabase.patients = new Map(Object.entries(TEST_PATIENTS));
    mockDatabase.visits = new Map(Object.entries(TEST_VISITS));
    mockDatabase.forms = new Map(Object.entries(TEST_FORMS));
    mockDatabase.templates = new Map([
      [NURSE_FORM_TEMPLATE.id, NURSE_FORM_TEMPLATE],
      [DOCTOR_FORM_TEMPLATE.id, DOCTOR_FORM_TEMPLATE],
      [CONSENT_FORM_TEMPLATE.id, CONSENT_FORM_TEMPLATE]
    ]);
    mockDatabase.signatures = new Map();
    mockDatabase.auditTrail = new Map();
  }
};

// Mock API client
export const createMockApiClient = (authToken: string) => {
  return {
    async get(url: string, options?: any) {
      // Simulate API GET requests
      if (url.includes(API_ENDPOINTS.forms.list)) {
        return {
          status: 200,
          data: Array.from(mockDatabase.forms.values())
        };
      }

      if (url.includes(API_ENDPOINTS.forms.templates)) {
        return {
          status: 200,
          data: Array.from(mockDatabase.templates.values())
        };
      }

      // Form by ID
      const formIdMatch = url.match(/\/api\/forms\/([^\/]+)/);
      if (formIdMatch) {
        const formId = formIdMatch[1];
        const form = mockDatabase.forms.get(formId);
        if (form) {
          return { status: 200, data: form };
        }
        return { status: 404, data: { message: 'Form not found' } };
      }

      return { status: 404, data: { message: 'Endpoint not found' } };
    },

    async post(url: string, data: any, options?: any) {
      // Simulate API POST requests
      if (url === API_ENDPOINTS.forms.create) {
        const newForm = {
          ...data,
          id: generateTestId('form'),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockDatabase.forms.set(newForm.id, newForm);
        return { status: 201, data: newForm };
      }

      if (url.includes('/submit')) {
        return { status: 200, data: { message: 'Form submitted successfully' } };
      }

      if (url.includes('/sign')) {
        return { status: 200, data: { message: 'Form signed successfully' } };
      }

      return { status: 404, data: { message: 'Endpoint not found' } };
    },

    async put(url: string, data: any, options?: any) {
      // Simulate API PUT requests
      const formIdMatch = url.match(/\/api\/forms\/([^\/]+)/);
      if (formIdMatch) {
        const formId = formIdMatch[1];
        const form = mockDatabase.forms.get(formId);
        if (form) {
          const updatedForm = {
            ...form,
            ...data,
            updatedAt: new Date()
          };
          mockDatabase.forms.set(formId, updatedForm);
          return { status: 200, data: updatedForm };
        }
        return { status: 404, data: { message: 'Form not found' } };
      }

      return { status: 404, data: { message: 'Endpoint not found' } };
    },

    async delete(url: string, options?: any) {
      // Simulate API DELETE requests
      const formIdMatch = url.match(/\/api\/forms\/([^\/]+)/);
      if (formIdMatch) {
        const formId = formIdMatch[1];
        const form = mockDatabase.forms.get(formId);
        if (form) {
          mockDatabase.forms.delete(formId);
          return { status: 200, data: { message: 'Form deleted successfully' } };
        }
        return { status: 404, data: { message: 'Form not found' } };
      }

      return { status: 404, data: { message: 'Endpoint not found' } };
    }
  };
};

// Authentication mock
export const mockAuthService = {
  authenticate: async (username: string, password: string) => {
    const user = Array.from(mockDatabase.users.values()).find(u => u.username === username);
    if (user && user.isActive) {
      return {
        user,
        token: `mock_token_${user.role}`,
        refreshToken: `mock_refresh_${user.role}`
      };
    }
    throw new Error('Invalid credentials');
  },

  validateToken: async (token: string) => {
    if (token.startsWith('mock_token_')) {
      const role = token.split('_')[2];
      const user = Array.from(mockDatabase.users.values()).find(u => u.role === role);
      return user || null;
    }
    return null;
  },

  refreshToken: async (refreshToken: string) => {
    if (refreshToken.startsWith('mock_refresh_')) {
      const role = refreshToken.split('_')[2];
      return `mock_token_${role}`;
    }
    throw new Error('Invalid refresh token');
  }
};

// Performance monitoring mock
export const mockPerformanceMonitor = {
  startMeasurement: (name: string) => {
    return {
      name,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage()
    };
  },

  endMeasurement: (measurement: any) => {
    const endTime = Date.now();
    const duration = endTime - measurement.startTime;

    return {
      name: measurement.name,
      duration,
      startTime: measurement.startTime,
      endTime,
      memoryUsage: process.memoryUsage(),
      success: duration < 2000 // Success if under 2 seconds
    };
  },

  logPerformance: (metric: any) => {
    console.log(`[PERFORMANCE] ${metric.name}: ${metric.duration}ms`);
  }
};

// Security validator mock
export const mockSecurityValidator = {
  validateInput: (input: any) => {
    if (typeof input === 'string') {
      // Check for SQL injection
      const sqlInjectionPattern = /('|(--)|(;)|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi;
      if (sqlInjectionPattern.test(input)) {
        throw new Error('Potential SQL injection detected');
      }

      // Check for XSS
      const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      if (xssPattern.test(input)) {
        throw new Error('Potential XSS detected');
      }
    }
    return true;
  },

  validateRoleAccess: (userRole: string, requiredRole: string) => {
    const roleHierarchy = {
      admin: 4,
      doctor: 3,
      nurse: 2,
      receptionist: 1,
      technician: 1
    };

    return roleHierarchy[userRole as keyof typeof roleHierarchy] >=
           roleHierarchy[requiredRole as keyof typeof roleHierarchy];
  },

  encryptData: (data: string) => {
    return `encrypted_${Buffer.from(data).toString('base64')}`;
  },

  decryptData: (encryptedData: string) => {
    if (encryptedData.startsWith('encrypted_')) {
      return Buffer.from(encryptedData.substring(10), 'base64').toString();
    }
    return encryptedData;
  }
};

// Audit logger mock
export const mockAuditLogger = {
  logAction: async (action: string, userId: string, details: any) => {
    const auditEntry = {
      id: generateTestId('audit'),
      action,
      userId,
      details,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Suite'
    };

    mockDatabase.auditTrail.set(auditEntry.id, auditEntry);
    return auditEntry;
  },

  getAuditTrail: async (entityId: string) => {
    return Array.from(mockDatabase.auditTrail.values())
      .filter(entry => entry.details.formId === entityId || entry.details.patientId === entityId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
};

// Test setup hooks
beforeAll(async () => {
  console.log('🚀 Setting up Form Management Test Suite...');

  // Initialize test context
  testContext = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    authToken: 'mock_token_admin',
    user: TEST_USERS.admin,
    patient: TEST_PATIENTS.patient1,
    visit: TEST_VISITS.visit1,
    formTemplates: [NURSE_FORM_TEMPLATE, DOCTOR_FORM_TEMPLATE, CONSENT_FORM_TEMPLATE],
    testForms: Object.values(TEST_FORMS),
    cleanup: async () => {
      // Cleanup will be handled in afterAll
    }
  };

  // Set up global test variables
  global.testContext = testContext;
  global.mockDatabase = mockDatabase;
  global.mockApiClient = createMockApiClient;
  global.mockAuthService = mockAuthService;
  global.mockPerformanceMonitor = mockPerformanceMonitor;
  global.mockSecurityValidator = mockSecurityValidator;
  global.mockAuditLogger = mockAuditLogger;

  // Wait for any async setup to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Form Management Test Suite setup complete');
});

afterAll(async () => {
  console.log('🧹 Cleaning up Form Management Test Suite...');

  // Clean up test data
  if (testContext && typeof testContext.cleanup === 'function') {
    await testContext.cleanup();
  }

  // Reset mock database
  mockDatabase.reset();

  // Clear global variables
  delete global.testContext;
  delete global.mockDatabase;
  delete global.mockApiClient;
  delete global.mockAuthService;
  delete global.mockPerformanceMonitor;
  delete global.mockSecurityValidator;
  delete global.mockAuditLogger;

  console.log('✅ Form Management Test Suite cleanup complete');
});

beforeEach(async () => {
  // Reset database before each test
  mockDatabase.reset();

  // Reset test context
  if (testContext) {
    testContext.authToken = 'mock_token_admin';
    testContext.user = TEST_USERS.admin;
  }

  // Console log test start
  console.log(`\n📋 Starting test: ${expect.getState().currentTestName}`);
});

afterEach(async () => {
  // Performance cleanup
  if (global.performanceMetrics) {
    console.log(`⏱️ Test completed in: ${global.performanceMetrics.duration || 'N/A'}ms`);
  }

  // Console log test completion
  console.log(`✅ Test completed: ${expect.getState().currentTestName}`);
});

// Test utilities
export const createTestContext = (userRole: keyof typeof TEST_USERS = 'admin'): TestContext => {
  const user = TEST_USERS[userRole];
  return {
    ...testContext,
    authToken: `mock_token_${userRole}`,
    user
  };
};

export const measurePerformance = async (operation: () => Promise<any>, operationName: string) => {
  const measurement = mockPerformanceMonitor.startMeasurement(operationName);

  try {
    const result = await operation();
    const metric = mockPerformanceMonitor.endMeasurement(measurement);
    mockPerformanceMonitor.logPerformance(metric);

    global.performanceMetrics = metric;
    return result;
  } catch (error) {
    const metric = mockPerformanceMonitor.endMeasurement(measurement);
    mockPerformanceMonitor.logPerformance({ ...metric, success: false });
    throw error;
  }
};

export const validateApiResponse = (response: any, expectedStatus: number, expectedFields?: string[]) => {
  expect(response).toBeDefined();
  expect(response.status).toBe(expectedStatus);

  if (expectedFields && response.data) {
    expectedFields.forEach(field => {
      expect(response.data).toHaveProperty(field);
    });
  }
};

export const expectError = async (operation: () => Promise<any>, expectedStatus: number, expectedMessage?: string) => {
  try {
    await operation();
    fail('Expected operation to throw an error');
  } catch (error) {
    expect(error.response?.status).toBe(expectedStatus);
    if (expectedMessage) {
      expect(error.response?.data?.message).toContain(expectedMessage);
    }
  }
};

// Export setup utilities
export default {
  testContext,
  mockDatabase,
  mockApiClient,
  mockAuthService,
  mockPerformanceMonitor,
  mockSecurityValidator,
  mockAuditLogger,
  createTestContext,
  measurePerformance,
  validateApiResponse,
  expectError
};