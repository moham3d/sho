// Form Management Test Utilities
// This file contains utility functions and helpers for form management tests

import { Form, FormTemplate, FormSignature, AuditEntry, User, Patient, Visit, APIError } from './types';
import { TEST_USERS, TEST_PATIENTS, TEST_VISITS, API_ENDPOINTS } from './fixtures';

// Test data generators
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const generateTestForm = (overrides: Partial<Form> = {}): Form => {
  const baseForm: Form = {
    id: generateUUID(),
    templateId: generateUUID(),
    patientId: TEST_PATIENTS.patient1.id,
    visitId: TEST_VISITS.visit1.id,
    type: 'nurse_form',
    status: 'draft',
    version: '1.0.0',
    data: {},
    metadata: {
      language: 'en',
      completionPercentage: 0,
      requiredFieldsCompleted: 0,
      totalRequiredFields: 0,
      priority: 'medium',
      tags: []
    },
    signatures: [],
    auditTrail: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: TEST_USERS.nurse.id,
    updatedBy: TEST_USERS.nurse.id
  };

  return { ...baseForm, ...overrides };
};

export const generateTestSignature = (overrides: Partial<FormSignature> = {}): FormSignature => {
  const baseSignature: FormSignature = {
    id: generateUUID(),
    formId: generateUUID(),
    signatureType: 'digital',
    signerRole: 'nurse',
    signerId: TEST_USERS.nurse.id,
    signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    status: 'pending',
    metadata: {
      deviceInfo: {
        deviceType: 'desktop',
        operatingSystem: 'Windows 10',
        browser: 'Chrome',
        screenResolution: '1920x1080',
        timezone: 'Africa/Cairo'
      },
      verificationMethod: 'password'
    },
    createdAt: new Date()
  };

  return { ...baseSignature, ...overrides };
};

export const generateTestAuditEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => {
  const baseEntry: AuditEntry = {
    id: generateUUID(),
    formId: generateUUID(),
    action: 'created',
    userId: TEST_USERS.nurse.id,
    userRole: 'nurse',
    details: {},
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Test Suite)',
    timestamp: new Date()
  };

  return { ...baseEntry, ...overrides };
};

// API request helpers
export const createAuthenticatedRequest = (authToken: string, baseUrl: string = 'http://localhost:3000') => {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Form-Management-Test-Suite'
  };

  return {
    async get(endpoint: string, params?: Record<string, any>) {
      const url = new URL(`${baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      });

      return handleApiResponse(response);
    },

    async post(endpoint: string, data: any) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      return handleApiResponse(response);
    },

    async put(endpoint: string, data: any) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      return handleApiResponse(response);
    },

    async patch(endpoint: string, data: any) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });

      return handleApiResponse(response);
    },

    async delete(endpoint: string) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers
      });

      return handleApiResponse(response);
    }
  };
};

export const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data
  };
};

// Validation helpers
export const validateFormStructure = (form: Form, requiredFields: string[] = []) => {
  const requiredFormFields = [
    'id', 'templateId', 'patientId', 'type', 'status', 'version',
    'data', 'metadata', 'signatures', 'auditTrail', 'createdAt', 'updatedAt'
  ];

  requiredFormFields.forEach(field => {
    expect(form).toHaveProperty(field);
  });

  requiredFields.forEach(field => {
    expect(form).toHaveProperty(field);
  });

  // Validate UUID format
  expect(form.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(form.templateId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  // Validate timestamps
  expect(form.createdAt).toBeInstanceOf(Date);
  expect(form.updatedAt).toBeInstanceOf(Date);
  expect(new Date(form.createdAt)).toBeValidDate();
  expect(new Date(form.updatedAt)).toBeValidDate();

  // Validate status
  const validStatuses = ['draft', 'in_progress', 'pending_review', 'approved', 'rejected', 'signed', 'archived'];
  expect(validStatuses).toContain(form.status);

  // Validate metadata
  expect(form.metadata).toHaveProperty('language');
  expect(form.metadata).toHaveProperty('completionPercentage');
  expect(form.metadata).toHaveProperty('requiredFieldsCompleted');
  expect(form.metadata).toHaveProperty('totalRequiredFields');
  expect(form.metadata).toHaveProperty('priority');

  expect(typeof form.metadata.completionPercentage).toBe('number');
  expect(form.metadata.completionPercentage).toBeGreaterThanOrEqual(0);
  expect(form.metadata.completionPercentage).toBeLessThanOrEqual(100);

  const validPriorities = ['low', 'medium', 'high'];
  expect(validPriorities).toContain(form.metadata.priority);
};

export const validateSignatureStructure = (signature: FormSignature) => {
  const requiredFields = [
    'id', 'formId', 'signatureType', 'signerRole', 'signerId',
    'signatureData', 'ipAddress', 'userAgent', 'status', 'metadata', 'createdAt'
  ];

  requiredFields.forEach(field => {
    expect(signature).toHaveProperty(field);
  });

  // Validate UUID format
  expect(signature.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(signature.formId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  // Validate status
  const validStatuses = ['pending', 'signed', 'rejected', 'expired'];
  expect(validStatuses).toContain(signature.status);

  // Validate metadata
  expect(signature.metadata).toHaveProperty('deviceInfo');
  expect(signature.metadata).toHaveProperty('verificationMethod');

  const deviceInfo = signature.metadata.deviceInfo;
  expect(deviceInfo).toHaveProperty('deviceType');
  expect(deviceInfo).toHaveProperty('operatingSystem');
  expect(deviceInfo).toHaveProperty('browser');
};

export const validateAuditEntryStructure = (entry: AuditEntry) => {
  const requiredFields = [
    'id', 'formId', 'action', 'userId', 'userRole', 'details',
    'ipAddress', 'userAgent', 'timestamp'
  ];

  requiredFields.forEach(field => {
    expect(entry).toHaveProperty(field);
  });

  // Validate UUID format
  expect(entry.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  // Validate timestamp
  expect(entry.timestamp).toBeInstanceOf(Date);
  expect(new Date(entry.timestamp)).toBeValidDate();

  // Validate action
  const validActions = ['created', 'updated', 'deleted', 'submitted', 'approved', 'rejected', 'signed', 'archived', 'restored', 'viewed', 'exported'];
  expect(validActions).toContain(entry.action);
};

// Error handling helpers
export const createApiError = (status: number, message: string, details?: any): APIError => ({
  code: `ERROR_${status}`,
  message,
  details,
  timestamp: new Date(),
  path: '/api/forms'
});

export const expectApiError = async (operation: () => Promise<any>, expectedStatus: number, expectedMessage?: string) => {
  try {
    await operation();
    fail('Expected API call to throw an error');
  } catch (error) {
    expect(error.status).toBe(expectedStatus);
    if (expectedMessage) {
      expect(error.data?.message).toContain(expectedMessage);
    }
  }
};

// Authentication helpers
export const getAuthToken = (userRole: keyof typeof TEST_USERS): string => {
  const user = TEST_USERS[userRole];
  return `mock_token_${userRole}_${user.id}`;
};

export const createAuthenticatedClient = (userRole: keyof typeof TEST_USERS = 'admin') => {
  const authToken = getAuthToken(userRole);
  return createAuthenticatedRequest(authToken);
};

// Performance monitoring helpers
export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxDuration: number = 2000
): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  console.log(`⏱️ ${operationName} completed in ${duration}ms`);

  if (duration > maxDuration) {
    console.warn(`⚠️ ${operationName} exceeded expected duration (${maxDuration}ms)`);
  }

  return { result, duration };
};

// Data transformation helpers
export const sanitizeFormData = (data: any): any => {
  const sanitized = { ...data };

  // Remove sensitive fields for logging
  delete sanitized.password;
  delete sanitized.ssn;
  delete sanitized.creditCard;

  return sanitized;
};

export const formatFormDataForLogging = (data: any): string => {
  const sanitized = sanitizeFormData(data);
  return JSON.stringify(sanitized, null, 2);
};

// Test data cleanup helpers
export const cleanupTestData = async (createdIds: string[], cleanupFunction: (id: string) => Promise<void>) => {
  const cleanupPromises = createdIds.map(id =>
    cleanupFunction(id).catch(error => {
      console.warn(`⚠️ Failed to cleanup test data with ID ${id}:`, error.message);
    })
  );

  await Promise.all(cleanupPromises);
};

// Comparison helpers
export const expectDeepEqual = (actual: any, expected: any, message?: string) => {
  expect(actual).toEqual(expected);
};

export const expectNotDeepEqual = (actual: any, expected: any, message?: string) => {
  expect(actual).not.toEqual(expected);
};

// Date/time helpers
export const getTestDate = (daysOffset: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// File handling helpers
export const createTestFile = (content: string, mimeType: string = 'text/plain'): File => {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], 'test-file.txt', { type: mimeType });
};

export const createTestImageFile = (width: number = 100, height: number = 100): File => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, width, height);
  }

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'test-image.png', { type: 'image/png' }));
      }
    }, 'image/png');
  });
};

// Mock response helpers
export const createMockResponse = <T>(data: T, status: number = 200) => ({
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  data
});

export const createMockErrorResponse = (status: number, message: string) => ({
  status,
  statusText: 'Error',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  data: {
    error: {
      code: `ERROR_${status}`,
      message
    }
  }
});

// Environment helpers
export const getTestEnvironment = () => {
  return {
    nodeVersion: process.version,
    testTimeout: process.env.TEST_TIMEOUT || '30000',
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
  };
};

// Export all utilities
export {
  generateUUID,
  generateTestForm,
  generateTestSignature,
  generateTestAuditEntry,
  createAuthenticatedRequest,
  handleApiResponse,
  validateFormStructure,
  validateSignatureStructure,
  validateAuditEntryStructure,
  createApiError,
  expectApiError,
  getAuthToken,
  createAuthenticatedClient,
  measureAsyncOperation,
  sanitizeFormData,
  formatFormDataForLogging,
  cleanupTestData,
  expectDeepEqual,
  expectNotDeepEqual,
  getTestDate,
  isValidISODate,
  createTestFile,
  createMockResponse,
  createMockErrorResponse,
  getTestEnvironment
};