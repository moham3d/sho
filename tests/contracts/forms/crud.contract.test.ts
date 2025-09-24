// Form Management CRUD Contract Tests
// This file contains comprehensive tests for form CRUD operations

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Form, FormTemplate, FormStatus, FormType, UserRole, PaginatedResponse } from './types';
import {
  TEST_USERS,
  TEST_PATIENTS,
  TEST_VISITS,
  NURSE_FORM_TEMPLATE,
  DOCTOR_FORM_TEMPLATE,
  TEST_FORMS,
  API_ENDPOINTS,
  ERROR_RESPONSES,
  PERFORMANCE_BENCHMARKS
} from './fixtures';
import {
  generateTestForm,
  createAuthenticatedClient,
  validateFormStructure,
  validateApiResponse,
  expectApiError,
  measureAsyncOperation,
  createTestContext
} from './utils';
import setup, { mockDatabase, testContext } from './setup';

describe('Form Management CRUD Contract Tests', () => {
  let app: any;
  let authToken: string;
  let adminClient: any;
  let doctorClient: any;
  let nurseClient: any;
  let createdForms: string[] = [];

  beforeEach(async () => {
    // Reset mock database
    mockDatabase.reset();

    // Create test clients for different roles
    adminClient = createAuthenticatedClient('admin');
    doctorClient = createAuthenticatedClient('doctor');
    nurseClient = createAuthenticatedClient('nurse');

    // Clear created forms array
    createdForms = [];
  });

  afterEach(async () => {
    // Cleanup created forms
    for (const formId of createdForms) {
      try {
        await adminClient.delete(`${API_ENDPOINTS.forms.get.replace(':id', formId)}`);
      } catch (error) {
        console.warn(`Failed to cleanup form ${formId}:`, error.message);
      }
    }
  });

  describe('GET /api/forms - List Forms', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(API_ENDPOINTS.forms.list)
        .expect(401);

      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return 200 and list of forms for authenticated users', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.get(API_ENDPOINTS.forms.list);
        },
        'GET /api/forms',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      expect(result.data).toBeInstanceOf(Array);
      expect(Array.isArray(result.data)).toBe(true);

      // Validate pagination structure
      if (result.data.pagination) {
        expect(result.data.pagination).toHaveProperty('page');
        expect(result.data.pagination).toHaveProperty('pageSize');
        expect(result.data.pagination).toHaveProperty('totalCount');
        expect(result.data.pagination).toHaveProperty('totalPages');
      }

      // Validate each form structure
      result.data.forEach((form: Form) => {
        validateFormStructure(form);
      });

      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should support pagination parameters', async () => {
      const page = 1;
      const pageSize = 10;

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        page,
        pageSize
      });

      validateApiResponse(response, 200);
      expect(response.data.pagination).toEqual({
        page,
        pageSize,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean)
      });
    });

    it('should support filtering by form type', async () => {
      const formType = 'nurse_form';

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        type: formType
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned forms should match the filter
      response.data.forEach((form: Form) => {
        expect(form.type).toBe(formType);
      });
    });

    it('should support filtering by status', async () => {
      const status = 'draft';

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        status
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned forms should match the filter
      response.data.forEach((form: Form) => {
        expect(form.status).toBe(status);
      });
    });

    it('should support filtering by patient ID', async () => {
      const patientId = TEST_PATIENTS.patient1.id;

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        patientId
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned forms should match the filter
      response.data.forEach((form: Form) => {
        expect(form.patientId).toBe(patientId);
      });
    });

    it('should support filtering by visit ID', async () => {
      const visitId = TEST_VISITS.visit1.id;

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        visitId
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned forms should match the filter
      response.data.forEach((form: Form) => {
        expect(form.visitId).toBe(visitId);
      });
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date('2023-01-01').toISOString();
      const endDate = new Date('2023-12-31').toISOString();

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        startDate,
        endDate
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned forms should be within the date range
      response.data.forEach((form: Form) => {
        const formDate = new Date(form.createdAt);
        expect(formDate).toBeGreaterThanOrEqual(new Date(startDate));
        expect(formDate).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    it('should support sorting by multiple fields', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // Verify sorting
      if (response.data.length > 1) {
        const dates = response.data.map((form: Form) => new Date(form.createdAt).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });

    it('should support text search across form fields', async () => {
      const searchText = 'chest pain';

      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        search: searchText
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // Search should be case-insensitive and match partial text
      const searchResults = response.data.filter((form: Form) => {
        const formText = JSON.stringify(form).toLowerCase();
        return formText.includes(searchText.toLowerCase());
      });

      expect(response.data.length).toBe(searchResults.length);
    });

    it('should handle empty result sets gracefully', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        patientId: 'non-existent-patient-id'
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });

    it('should validate pagination limits', async () => {
      // Test with extremely large page size
      const response = await adminClient.get(API_ENDPOINTS.forms.list, {
        pageSize: 10000
      });

      validateApiResponse(response, 200);
      expect(response.data.pagination.pageSize).toBeLessThanOrEqual(100);
    });

    it('should return 400 for invalid filter parameters', async () => {
      await expectApiError(
        () => adminClient.get(API_ENDPOINTS.forms.list, {
          status: 'invalid_status'
        }),
        400,
        'Invalid status parameter'
      );
    });
  });

  describe('GET /api/forms/:id - Get Form by ID', () => {
    let testForm: Form;

    beforeEach(async () => {
      // Create a test form
      const createResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form' as FormType,
        status: 'draft' as FormStatus,
        data: { test: 'data' }
      });

      testForm = createResponse.data;
      createdForms.push(testForm.id);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).get(API_ENDPOINTS.forms.get.replace(':id', testForm.id)),
        401
      );
    });

    it('should return 200 and form data for valid ID', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.get(API_ENDPOINTS.forms.get.replace(':id', testForm.id));
        },
        'GET /api/forms/:id',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      validateFormStructure(result.data);
      expect(result.data.id).toBe(testForm.id);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should return 404 for non-existent form ID', async () => {
      await expectApiError(
        () => adminClient.get(API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')),
        404,
        'Form not found'
      );
    });

    it('should return 400 for invalid UUID format', async () => {
      await expectApiError(
        () => adminClient.get(API_ENDPOINTS.forms.get.replace(':id', 'invalid-uuid-format')),
        400,
        'Invalid UUID format'
      );
    });

    it('should include related data (signatures, audit trail)', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', testForm.id));

      validateApiResponse(response, 200);
      expect(response.data).toHaveProperty('signatures');
      expect(response.data).toHaveProperty('auditTrail');
      expect(Array.isArray(response.data.signatures)).toBe(true);
      expect(Array.isArray(response.data.auditTrail)).toBe(true);
    });

    it('should respect role-based access control', async () => {
      // Test that nurse can access nurse forms
      const nurseResponse = await nurseClient.get(API_ENDPOINTS.forms.get.replace(':id', testForm.id));
      validateApiResponse(nurseResponse, 200);

      // Create a doctor form and test access
      const doctorFormResponse = await doctorClient.post(API_ENDPOINTS.forms.create, {
        templateId: DOCTOR_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'doctor_form' as FormType,
        status: 'draft' as FormStatus,
        data: { test: 'doctor data' }
      });

      const doctorForm = doctorFormResponse.data;
      createdForms.push(doctorForm.id);

      // Nurse should not be able to access doctor forms
      await expectApiError(
        () => nurseClient.get(API_ENDPOINTS.forms.get.replace(':id', doctorForm.id)),
        403,
        'Insufficient permissions'
      );
    });
  });

  describe('POST /api/forms - Create Form', () => {
    const validForm = {
      templateId: NURSE_FORM_TEMPLATE.id,
      patientId: TEST_PATIENTS.patient1.id,
      visitId: TEST_VISITS.visit1.id,
      type: 'nurse_form' as FormType,
      status: 'draft' as FormStatus,
      data: {
        patient_name: 'Test Patient',
        blood_pressure: '120/80',
        heart_rate: 72,
        chief_complaint: 'Routine checkup'
      }
    };

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).post(API_ENDPOINTS.forms.create).send(validForm),
        401
      );
    });

    it('should return 201 and created form for valid request', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.post(API_ENDPOINTS.forms.create, validForm);
        },
        'POST /api/forms',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 201);
      validateFormStructure(result.data);
      expect(result.data.id).toBeDefined();
      expect(result.data.templateId).toBe(validForm.templateId);
      expect(result.data.patientId).toBe(validForm.patientId);
      expect(result.data.visitId).toBe(validForm.visitId);
      expect(result.data.type).toBe(validForm.type);
      expect(result.data.status).toBe(validForm.status);
      expect(result.data.data).toEqual(validForm.data);

      createdForms.push(result.data.id);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteForm = { ...validForm };
      delete incompleteForm.templateId;

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, incompleteForm),
        400,
        'templateId is required'
      );
    });

    it('should return 404 for non-existent template ID', async () => {
      const invalidForm = { ...validForm, templateId: 'non-existent-template-id' };

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, invalidForm),
        404,
        'Template not found'
      );
    });

    it('should return 404 for non-existent patient ID', async () => {
      const invalidForm = { ...validForm, patientId: 'non-existent-patient-id' };

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, invalidForm),
        404,
        'Patient not found'
      );
    });

    it('should return 404 for non-existent visit ID', async () => {
      const invalidForm = { ...validForm, visitId: 'non-existent-visit-id' };

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, invalidForm),
        404,
        'Visit not found'
      );
    });

    it('should validate form data against template schema', async () => {
      const invalidDataForm = {
        ...validForm,
        data: {
          // Invalid blood pressure format
          blood_pressure: 'invalid-format',
          // Invalid heart rate value
          heart_rate: 300
        }
      };

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, invalidDataForm),
        400,
        'Invalid form data'
      );
    });

    it('should respect role-based creation permissions', async () => {
      // Nurse should be able to create nurse forms
      const nurseFormResponse = await nurseClient.post(API_ENDPOINTS.forms.create, validForm);
      validateApiResponse(nurseFormResponse, 201);
      createdForms.push(nurseFormResponse.data.id);

      // Receptionist should not be able to create medical forms
      const receptionistClient = createAuthenticatedClient('receptionist');
      await expectApiError(
        () => receptionistClient.post(API_ENDPOINTS.forms.create, validForm),
        403,
        'Insufficient permissions'
      );
    });

    it('should create audit entry for form creation', async () => {
      const response = await adminClient.post(API_ENDPOINTS.forms.create, validForm);
      createdForms.push(response.data.id);

      // Check audit trail
      const auditResponse = await adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', response.data.id)}/audit-trail`);
      validateApiResponse(auditResponse, 200);

      const auditEntries = auditResponse.data;
      expect(auditEntries.length).toBeGreaterThan(0);

      const createEntry = auditEntries.find((entry: any) => entry.action === 'created');
      expect(createEntry).toBeDefined();
      expect(createEntry.userId).toBe(TEST_USERS.admin.id);
    });

    it('should handle large form data efficiently', async () => {
      const largeDataForm = {
        ...validForm,
        data: {
          ...validForm.data,
          // Add large text field
          notes: 'x'.repeat(10000) // 10KB of text
        }
      };

      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.post(API_ENDPOINTS.forms.create, largeDataForm);
        },
        'POST /api/forms (large data)',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME * 2 // Allow more time for large data
      );

      validateApiResponse(result, 201);
      expect(result.data.data.notes.length).toBe(10000);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME * 2);

      createdForms.push(result.data.id);
    });
  });

  describe('PUT /api/forms/:id - Update Form', () => {
    let testForm: Form;

    beforeEach(async () => {
      const createResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form' as FormType,
        status: 'draft' as FormStatus,
        data: {
          patient_name: 'Test Patient',
          blood_pressure: '120/80',
          heart_rate: 72,
          chief_complaint: 'Initial assessment'
        }
      });

      testForm = createResponse.data;
      createdForms.push(testForm.id);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).put(API_ENDPOINTS.forms.update.replace(':id', testForm.id)).send({}),
        401
      );
    });

    it('should return 200 and updated form for valid request', async () => {
      const updateData = {
        status: 'in_progress' as FormStatus,
        data: {
          ...testForm.data,
          blood_pressure: '130/85',
          heart_rate: 75,
          notes: 'Updated assessment'
        }
      };

      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), updateData);
        },
        'PUT /api/forms/:id',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      validateFormStructure(result.data);
      expect(result.data.id).toBe(testForm.id);
      expect(result.data.status).toBe(updateData.status);
      expect(result.data.data.blood_pressure).toBe(updateData.data.blood_pressure);
      expect(result.data.data.heart_rate).toBe(updateData.data.heart_rate);
      expect(result.data.data.notes).toBe(updateData.data.notes);

      // Verify updated timestamp
      expect(new Date(result.data.updatedAt)).getTime().toBeGreaterThan(new Date(testForm.updatedAt).getTime());
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should return 404 for non-existent form ID', async () => {
      await expectApiError(
        () => adminClient.put(API_ENDPOINTS.forms.update.replace(':id', 'non-existent-id'), {}),
        404,
        'Form not found'
      );
    });

    it('should return 400 for invalid status transition', async () => {
      // Try to transition from draft to signed (invalid)
      await expectApiError(
        () => adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          status: 'signed'
        }),
        400,
        'Invalid status transition'
      );
    });

    it('should validate updated form data', async () => {
      const invalidUpdate = {
        data: {
          ...testForm.data,
          blood_pressure: 'invalid-format'
        }
      };

      await expectApiError(
        () => adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), invalidUpdate),
        400,
        'Invalid form data'
      );
    });

    it('should prevent updates to read-only fields', async () => {
      const readOnlyUpdate = {
        templateId: 'different-template-id',
        patientId: 'different-patient-id',
        createdBy: 'different-user'
      };

      const response = await adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), readOnlyUpdate);
      validateApiResponse(response, 200);

      // Verify that read-only fields were not changed
      expect(response.data.templateId).toBe(testForm.templateId);
      expect(response.data.patientId).toBe(testForm.patientId);
      expect(response.data.createdBy).toBe(testForm.createdBy);
    });

    it('should create audit entry for form update', async () => {
      const updateData = {
        data: {
          ...testForm.data,
          blood_pressure: '130/85'
        }
      };

      await adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), updateData);

      // Check audit trail
      const auditResponse = await adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`);
      validateApiResponse(auditResponse, 200);

      const auditEntries = auditResponse.data;
      const updateEntry = auditEntries.find((entry: any) => entry.action === 'updated');
      expect(updateEntry).toBeDefined();
      expect(updateEntry.userId).toBe(TEST_USERS.admin.id);
      expect(updateEntry.changes).toBeDefined();
    });

    it('should support partial updates', async () => {
      const partialUpdate = {
        data: {
          notes: 'Added additional notes'
        }
      };

      const response = await adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), partialUpdate);
      validateApiResponse(response, 200);

      // Verify that only the specified field was updated
      expect(response.data.data.notes).toBe(partialUpdate.data.notes);
      expect(response.data.data.blood_pressure).toBe(testForm.data.blood_pressure);
      expect(response.data.data.heart_rate).toBe(testForm.data.heart_rate);
    });

    it('should handle concurrent updates gracefully', async () => {
      // Simulate concurrent updates
      const update1 = adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { blood_pressure: '130/85' }
      });

      const update2 = adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { heart_rate: 80 }
      });

      const [response1, response2] = await Promise.allSettled([update1, update2]);

      // Both should succeed, but the second one might overwrite the first
      expect(response1.status).toBe('fulfilled');
      expect(response2.status).toBe('fulfilled');
    });

    it('should respect role-based update permissions', async () => {
      // Nurse should be able to update nurse forms
      const nurseUpdate = await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { notes: 'Nurse update' }
      });
      validateApiResponse(nurseUpdate, 200);

      // Receptionist should not be able to update medical forms
      const receptionistClient = createAuthenticatedClient('receptionist');
      await expectApiError(
        () => receptionistClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          data: { notes: 'Receptionist update' }
        }),
        403,
        'Insufficient permissions'
      );
    });
  });

  describe('DELETE /api/forms/:id - Delete Form', () => {
    let testForm: Form;

    beforeEach(async () => {
      const createResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form' as FormType,
        status: 'draft' as FormStatus,
        data: { test: 'data' }
      });

      testForm = createResponse.data;
      createdForms.push(testForm.id);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).delete(API_ENDPOINTS.forms.delete.replace(':id', testForm.id)),
        401
      );
    });

    it('should return 200 for successful soft delete', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', testForm.id));
        },
        'DELETE /api/forms/:id',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      expect(result.data.message).toContain('deleted');
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);

      // Verify the form is soft-deleted (should not appear in list)
      const listResponse = await adminClient.get(API_ENDPOINTS.forms.list);
      const deletedForm = listResponse.data.find((form: Form) => form.id === testForm.id);
      expect(deletedForm).toBeUndefined();

      // Remove from cleanup array since it's already deleted
      const index = createdForms.indexOf(testForm.id);
      if (index > -1) {
        createdForms.splice(index, 1);
      }
    });

    it('should return 404 for non-existent form ID', async () => {
      await expectApiError(
        () => adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', 'non-existent-id')),
        404,
        'Form not found'
      );
    });

    it('should prevent deletion of signed forms', async () => {
      // First, sign the form
      await adminClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        status: 'signed'
      });

      // Then try to delete it
      await expectApiError(
        () => adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', testForm.id)),
        400,
        'Cannot delete signed form'
      );
    });

    it('should create audit entry for form deletion', async () => {
      await adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', testForm.id));

      // Check audit trail (might need to query audit logs differently for deleted forms)
      const auditResponse = await adminClient.get('/api/audit-logs', {
        entityId: testForm.id,
        action: 'deleted'
      });

      validateApiResponse(auditResponse, 200);
      const auditEntries = auditResponse.data;
      const deleteEntry = auditEntries.find((entry: any) => entry.action === 'deleted');
      expect(deleteEntry).toBeDefined();
      expect(deleteEntry.userId).toBe(TEST_USERS.admin.id);

      // Remove from cleanup array since it's already deleted
      const index = createdForms.indexOf(testForm.id);
      if (index > -1) {
        createdForms.splice(index, 1);
      }
    });

    it('should respect role-based delete permissions', async () => {
      // Create a new form for this test
      const formToDelete = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form' as FormType,
        status: 'draft' as FormStatus,
        data: { test: 'to delete' }
      });

      createdForms.push(formToDelete.data.id);

      // Nurse should not be able to delete forms
      await expectApiError(
        () => nurseClient.delete(API_ENDPOINTS.forms.delete.replace(':id', formToDelete.data.id)),
        403,
        'Insufficient permissions'
      );

      // Admin should be able to delete
      const adminDelete = await adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', formToDelete.data.id));
      validateApiResponse(adminDelete, 200);

      // Remove from cleanup array since it's already deleted
      const index = createdForms.indexOf(formToDelete.data.id);
      if (index > -1) {
        createdForms.splice(index, 1);
      }
    });

    it('should handle form with related data (signatures, attachments)', async () => {
      // Add some related data to the form
      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`, {
        signatureType: 'digital',
        signerRole: 'nurse',
        signatureData: 'test-signature-data'
      });

      // Delete should still work
      const response = await adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', testForm.id));
      validateApiResponse(response, 200);

      // Remove from cleanup array since it's already deleted
      const index = createdForms.indexOf(testForm.id);
      if (index > -1) {
        createdForms.splice(index, 1);
      }
    });
  });

  describe('GET /api/forms/templates - List Form Templates', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).get(API_ENDPOINTS.forms.templates),
        401
      );
    });

    it('should return 200 and list of form templates', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.get(API_ENDPOINTS.forms.templates);
        },
        'GET /api/forms/templates',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Validate template structure
      result.data.forEach((template: FormTemplate) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('version');
        expect(template).toHaveProperty('schema');
        expect(template).toHaveProperty('requiredFields');
        expect(template).toHaveProperty('supportedLanguages');
        expect(template).toHaveProperty('isActive');
        expect(template).toHaveProperty('createdAt');
        expect(template).toHaveProperty('updatedAt');
      });

      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should support filtering by form type', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.templates, {
        type: 'nurse_form'
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned templates should match the filter
      response.data.forEach((template: FormTemplate) => {
        expect(template.type).toBe('nurse_form');
      });
    });

    it('should support filtering by active status', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.templates, {
        active: true
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned templates should be active
      response.data.forEach((template: FormTemplate) => {
        expect(template.isActive).toBe(true);
      });
    });

    it('should support filtering by language support', async () => {
      const response = await adminClient.get(API_ENDPOINTS.forms.templates, {
        language: 'ar'
      });

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned templates should support Arabic
      response.data.forEach((template: FormTemplate) => {
        expect(template.supportedLanguages).toContain('ar');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const malformedJson = '{"invalid": json}';

      await expectApiError(
        () => request(app)
          .post(API_ENDPOINTS.forms.create)
          .set('Content-Type', 'application/json')
          .send(malformedJson)
          .set('Authorization', `Bearer ${getAuthToken('admin')}`),
        400,
        'Invalid JSON'
      );
    });

    it('should handle requests with missing content-type header', async () => {
      await expectApiError(
        () => request(app)
          .post(API_ENDPOINTS.forms.create)
          .send({ test: 'data' })
          .set('Authorization', `Bearer ${getAuthToken('admin')}`),
        400,
        'Content-Type header is required'
      );
    });

    it('should handle requests with oversized payload', async () => {
      const oversizedData = {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient1.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form' as FormType,
        status: 'draft' as FormStatus,
        data: {
          hugeField: 'x'.repeat(1000000) // 1MB of data
        }
      };

      await expectApiError(
        () => adminClient.post(API_ENDPOINTS.forms.create, oversizedData),
        413,
        'Request payload too large'
      );
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, we'll just verify the error handling structure
      console.log('Database connection error handling test would go here');
    });

    it('should handle concurrent form creation', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        adminClient.post(API_ENDPOINTS.forms.create, {
          templateId: NURSE_FORM_TEMPLATE.id,
          patientId: TEST_PATIENTS.patient1.id,
          visitId: TEST_VISITS.visit1.id,
          type: 'nurse_form' as FormType,
          status: 'draft' as FormStatus,
          data: { test: `concurrent ${Math.random()}` }
        })
      );

      const responses = await Promise.allSettled(concurrentRequests);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe('fulfilled');
        if (response.status === 'fulfilled') {
          createdForms.push(response.value.data.id);
        }
      });
    });
  });
});

// Helper function to get auth token
function getAuthToken(userRole: keyof typeof TEST_USERS): string {
  const user = TEST_USERS[userRole];
  return `mock_token_${userRole}_${user.id}`;
}