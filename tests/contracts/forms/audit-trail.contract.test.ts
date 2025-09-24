// Audit Trail and Form Versioning Contract Tests
// This file contains comprehensive tests for audit trail and versioning functionality

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Form, AuditEntry, AuditAction, FormVersion, ChangeLog } from './types';
import {
  TEST_USERS,
  TEST_PATIENTS,
  TEST_VISITS,
  NURSE_FORM_TEMPLATE,
  DOCTOR_FORM_TEMPLATE,
  TEST_AUDIT_ENTRIES,
  API_ENDPOINTS,
  ERROR_RESPONSES,
  PERFORMANCE_BENCHMARKS,
  COMPLIANCE_REQUIREMENTS
} from './fixtures';
import {
  generateTestForm,
  generateTestAuditEntry,
  createAuthenticatedClient,
  validateAuditEntryStructure,
  validateApiResponse,
  expectApiError,
  measureAsyncOperation,
  createTestContext
} from './utils';
import setup, { mockDatabase, testContext } from './setup';

describe('Audit Trail and Form Versioning Contract Tests', () => {
  let app: any;
  let adminClient: any;
  let doctorClient: any;
  let nurseClient: any;
  let createdForms: string[] = [];
  let testForm: Form;

  beforeEach(async () => {
    // Reset mock database
    mockDatabase.reset();

    // Create test clients for different roles
    adminClient = createAuthenticatedClient('admin');
    doctorClient = createAuthenticatedClient('doctor');
    nurseClient = createAuthenticatedClient('nurse');

    // Clear created forms array
    createdForms = [];

    // Create a test form for audit trail tests
    const formResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
      templateId: NURSE_FORM_TEMPLATE.id,
      patientId: TEST_PATIENTS.patient1.id,
      visitId: TEST_VISITS.visit1.id,
      type: 'nurse_form',
      status: 'draft',
      data: {
        patient_name: 'Test Patient',
        blood_pressure: '120/80',
        heart_rate: 72,
        chief_complaint: 'Initial assessment'
      }
    });

    testForm = formResponse.data;
    createdForms.push(testForm.id);
  });

  afterEach(async () => {
    // Cleanup created forms
    for (const formId of createdForms) {
      try {
        await adminClient.delete(API_ENDPOINTS.forms.delete.replace(':id', formId));
      } catch (error) {
        console.warn(`Failed to cleanup form ${formId}:`, error.message);
      }
    }
  });

  describe('GET /api/forms/:id/audit-trail - Get Form Audit Trail', () => {
    beforeEach(async () => {
      // Perform some operations to generate audit entries
      await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { blood_pressure: '130/85', notes: 'Updated vital signs' }
      });

      await doctorClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        status: 'in_progress',
        data: { diagnosis: 'Hypertension' }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`),
        401
      );
    });

    it('should return 200 and complete audit trail for authenticated users', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`);
        },
        'GET /api/forms/:id/audit-trail',
        PERFORMANCE_BENCHMARKS.MAX_AUDIT_LOG_QUERY_TIME
      );

      validateApiResponse(result, 200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Validate audit entry structure
      result.data.forEach((entry: AuditEntry) => {
        validateAuditEntryStructure(entry);
      });

      // Verify entries are in chronological order
      const timestamps = result.data.map((entry: AuditEntry) => new Date(entry.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }

      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_AUDIT_LOG_QUERY_TIME);
    });

    it('should return 404 for non-existent form ID', async () => {
      await expectApiError(
        () => adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')}/audit-trail`),
        404,
        'Form not found'
      );
    });

    it('should support filtering by action type', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`,
        { action: 'updated' }
      );

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned entries should match the filter
      response.data.forEach((entry: AuditEntry) => {
        expect(entry.action).toBe('updated');
      });
    });

    it('should support filtering by user role', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`,
        { userRole: 'nurse' }
      );

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned entries should match the filter
      response.data.forEach((entry: AuditEntry) => {
        expect(entry.userRole).toBe('nurse');
      });
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString();

      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`,
        { startDate, endDate }
      );

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned entries should be within the date range
      response.data.forEach((entry: AuditEntry) => {
        const entryDate = new Date(entry.timestamp);
        expect(entryDate).toBeGreaterThanOrEqual(new Date(startDate));
        expect(entryDate).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    it('should include detailed change information for update actions', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      validateApiResponse(response, 200);

      const updateEntries = response.data.filter((entry: AuditEntry) => entry.action === 'updated');
      expect(updateEntries.length).toBeGreaterThan(0);

      const updateEntry = updateEntries[0];
      if (updateEntry.changes) {
        expect(Array.isArray(updateEntry.changes)).toBe(true);
        updateEntry.changes.forEach((change: ChangeLog) => {
          expect(change).toHaveProperty('field');
          expect(change).toHaveProperty('oldValue');
          expect(change).toHaveProperty('newValue');
        });
      }
    });

    it('should respect role-based access control', async () => {
      // Nurse should be able to see audit trail for nurse forms
      const nurseResponse = await nurseClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );
      validateApiResponse(nurseResponse, 200);

      // Receptionist should not be able to see audit trail for medical forms
      const receptionistClient = createAuthenticatedClient('receptionist');
      await expectApiError(
        () => receptionistClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`),
        403,
        'Insufficient permissions'
      );
    });

    it('should handle pagination for large audit trails', async () => {
      // Generate many audit entries
      for (let i = 0; i < 25; i++) {
        await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          data: { [`test_field_${i}`]: `test_value_${i}` }
        });
      }

      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`,
        { page: 1, pageSize: 10 }
      );

      validateApiResponse(response, 200);
      expect(response.data.length).toBeLessThanOrEqual(10);

      if (response.pagination) {
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.pageSize).toBe(10);
        expect(response.pagination.totalPages).toBeGreaterThan(1);
      }
    });

    it('should include user information in audit entries', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      validateApiResponse(response, 200);

      const entry = response.data[0];
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('userRole');
      expect(entry.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('Form Versioning', () => {
    describe('GET /api/forms/:id/versions - Get Form Versions', () => {
      beforeEach(async () => {
        // Create multiple versions by updating the form
        await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          data: { version: '1.1', notes: 'First update' }
        });

        await doctorClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          data: { version: '1.2', diagnosis: 'Updated diagnosis' }
        });
      });

      it('should return 401 for unauthenticated requests', async () => {
        await expectApiError(
          () => request(app).get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`),
          401
        );
      });

      it('should return 200 and list of form versions', async () => {
        const { result, duration } = await measureAsyncOperation(
          async () => {
            return adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`);
          },
          'GET /api/forms/:id/versions',
          PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
        );

        validateApiResponse(result, 200);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Validate version structure
        result.data.forEach((version: FormVersion) => {
          expect(version).toHaveProperty('id');
          expect(version).toHaveProperty('formId');
          expect(version).toHaveProperty('version');
          expect(version).toHaveProperty('data');
          expect(version).toHaveProperty('createdAt');
          expect(version).toHaveProperty('createdBy');
        });

        // Verify versions are in chronological order
        const versions = result.data.sort((a: FormVersion, b: FormVersion) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        expect(versions[0].version).toBe('1.0.0');
        expect(versions[versions.length - 1].version).toBe('1.2');

        expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
      });

      it('should return 404 for non-existent form ID', async () => {
        await expectApiError(
          () => adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')}/versions`),
          404,
          'Form not found'
        );
      });

      it('should support filtering by version range', async () => {
        const response = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`,
          { minVersion: '1.1', maxVersion: '1.2' }
        );

        validateApiResponse(response, 200);
        expect(Array.isArray(response.data)).toBe(true);

        // All returned versions should be within the range
        response.data.forEach((version: FormVersion) => {
          expect(version.version).toMatch(/^1\.[12]\./);
        });
      });

      it('should include change reason for versions', async () => {
        const response = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`
        );

        validateApiResponse(response, 200);

        const version = response.data.find((v: FormVersion) => v.changeReason);
        if (version) {
          expect(version.changeReason).toBeDefined();
          expect(typeof version.changeReason).toBe('string');
        }
      });

      it('should respect role-based access control', async () => {
        // Nurse should be able to see versions for nurse forms
        const nurseResponse = await nurseClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`
        );
        validateApiResponse(nurseResponse, 200);

        // Receptionist should not be able to see versions for medical forms
        const receptionistClient = createAuthenticatedClient('receptionist');
        await expectApiError(
          () => receptionistClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`),
          403,
          'Insufficient permissions'
        );
      });
    });

    describe('POST /api/forms/:id/versions - Create Form Version', () => {
      it('should return 401 for unauthenticated requests', async () => {
        await expectApiError(
          () => request(app).post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`),
          401
        );
      });

      it('should return 201 and new version for valid request', async () => {
        const versionData = {
          version: '2.0.0',
          changeReason: 'Major form restructuring',
          data: {
            ...testForm.data,
            new_field: 'new_value',
            restructured_data: true
          }
        };

        const { result, duration } = await measureAsyncOperation(
          async () => {
            return adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, versionData);
          },
          'POST /api/forms/:id/versions',
          PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
        );

        validateApiResponse(result, 201);
        expect(result.data.formId).toBe(testForm.id);
        expect(result.data.version).toBe(versionData.version);
        expect(result.data.changeReason).toBe(versionData.changeReason);
        expect(result.data.data).toEqual(versionData.data);
        expect(result.data.createdBy).toBe(TEST_USERS.admin.id);

        expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
      });

      it('should return 400 for invalid version format', async () => {
        const invalidVersionData = {
          version: 'invalid-version',
          changeReason: 'Invalid version test',
          data: testForm.data
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, invalidVersionData),
          400,
          'Invalid version format'
        );
      });

      it('should return 404 for non-existent form ID', async () => {
        const versionData = {
          version: '2.0.0',
          changeReason: 'Test',
          data: { test: 'data' }
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')}/versions`, versionData),
          404,
          'Form not found'
        );
      });

      it('should require change reason for version creation', async () => {
        const incompleteVersionData = {
          version: '2.0.0',
          data: testForm.data
          // Missing changeReason
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, incompleteVersionData),
          400,
          'changeReason is required'
        );
      });

      it('should create audit entry for version creation', async () => {
        const versionData = {
          version: '2.0.0',
          changeReason: 'Version for testing',
          data: { ...testForm.data, updated: true }
        };

        await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, versionData);

        // Check audit trail
        const auditResponse = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
        );

        const versionEntry = auditResponse.data.find((entry: AuditEntry) => entry.action === 'version_created');
        expect(versionEntry).toBeDefined();
        expect(versionEntry.userId).toBe(TEST_USERS.admin.id);
        expect(versionEntry.details.version).toBe(versionData.version);
      });

      it('should prevent duplicate version numbers', async () => {
        const versionData = {
          version: '1.0.0', // Same as initial version
          changeReason: 'Duplicate version test',
          data: testForm.data
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, versionData),
          400,
          'Version already exists'
        );
      });
    });

    describe('GET /api/forms/:id/versions/:versionId - Get Specific Version', () => {
      let testVersion: FormVersion;

      beforeEach(async () => {
        // Create a test version
        const versionResponse = await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
          version: '1.5.0',
          changeReason: 'Test version',
          data: { ...testForm.data, version_specific: true }
        });

        testVersion = versionResponse.data;
      });

      it('should return 401 for unauthenticated requests', async () => {
        await expectApiError(
          () => request(app).get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions/${testVersion.id}`),
          401
        );
      });

      it('should return 200 and specific version data', async () => {
        const response = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions/${testVersion.id}`
        );

        validateApiResponse(response, 200);
        expect(response.data.id).toBe(testVersion.id);
        expect(response.data.formId).toBe(testForm.id);
        expect(response.data.version).toBe(testVersion.version);
        expect(response.data.data).toEqual(testVersion.data);
      });

      it('should return 404 for non-existent version ID', async () => {
        await expectApiError(
          () => adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions/non-existent-id`),
          404,
          'Version not found'
        );
      });

      it('should return 404 for version belonging to different form', async () => {
        // Create another form
        const otherForm = await adminClient.post(API_ENDPOINTS.forms.create, {
          templateId: NURSE_FORM_TEMPLATE.id,
          patientId: TEST_PATIENTS.patient2.id,
          visitId: TEST_VISITS.visit1.id,
          type: 'nurse_form',
          status: 'draft',
          data: { other: 'form' }
        });

        createdForms.push(otherForm.data.id);

        await expectApiError(
          () => adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', otherForm.data.id)}/versions/${testVersion.id}`),
          404,
          'Version not found'
        );
      });
    });

    describe('POST /api/forms/:id/restore - Restore Form Version', () => {
      let testVersion: FormVersion;

      beforeEach(async () => {
        // Create a test version with different data
        const versionResponse = await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
          version: '1.5.0',
          changeReason: 'Version to restore',
          data: {
            ...testForm.data,
            restored_field: 'original_value',
            blood_pressure: '110/70'
          }
        });

        testVersion = versionResponse.data;

        // Modify the current form
        await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
          data: {
            ...testForm.data,
            restored_field: 'modified_value',
            blood_pressure: '140/90'
          }
        });
      });

      it('should return 401 for unauthenticated requests', async () => {
        await expectApiError(
          () => request(app).post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`),
          401
        );
      });

      it('should return 200 and restored form data', async () => {
        const restoreData = {
          versionId: testVersion.id,
          reason: 'Restoring previous version due to data error'
        };

        const { result, duration } = await measureAsyncOperation(
          async () => {
            return adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, restoreData);
          },
          'POST /api/forms/:id/restore',
          PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
        );

        validateApiResponse(result, 200);
        expect(result.data.id).toBe(testForm.id);
        expect(result.data.data.restored_field).toBe(testVersion.data.restored_field);
        expect(result.data.data.blood_pressure).toBe(testVersion.data.blood_pressure);

        expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
      });

      it('should return 404 for non-existent version ID', async () => {
        const restoreData = {
          versionId: 'non-existent-version-id',
          reason: 'Test'
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, restoreData),
          404,
          'Version not found'
        );
      });

      it('should require restore reason', async () => {
        const incompleteRestoreData = {
          versionId: testVersion.id
          // Missing reason
        };

        await expectApiError(
          () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, incompleteRestoreData),
          400,
          'reason is required'
        );
      });

      it('should create audit entry for version restoration', async () => {
        const restoreData = {
          versionId: testVersion.id,
          reason: 'Data correction needed'
        };

        await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, restoreData);

        // Check audit trail
        const auditResponse = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
        );

        const restoreEntry = auditResponse.data.find((entry: AuditEntry) => entry.action === 'version_restored');
        expect(restoreEntry).toBeDefined();
        expect(restoreEntry.userId).toBe(TEST_USERS.admin.id);
        expect(restoreEntry.details.versionId).toBe(testVersion.id);
        expect(restoreEntry.details.reason).toBe(restoreData.reason);
      });

      it('should create new version after restoration', async () => {
        const restoreData = {
          versionId: testVersion.id,
          reason: 'Version restoration test'
        };

        await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, restoreData);

        // Check that a new version was created
        const versionsResponse = await adminClient.get(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`
        );

        const versions = versionsResponse.data;
        const newVersion = versions.find((v: FormVersion) => v.changeReason?.includes('restored'));
        expect(newVersion).toBeDefined();
      });

      it('should respect role-based access control', async () => {
        const restoreData = {
          versionId: testVersion.id,
          reason: 'Test restore'
        };

        // Nurse should not be able to restore versions
        await expectApiError(
          () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, restoreData),
          403,
          'Insufficient permissions'
        );

        // Admin should be able to restore
        const adminResponse = await adminClient.post(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`,
          restoreData
        );
        validateApiResponse(adminResponse, 200);
      });
    });
  });

  describe('Audit Trail Compliance and Security', () => {
    it('should maintain immutable audit records', async () => {
      // Perform some operations
      await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { test_field: 'test_value' }
      });

      // Get audit trail
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      const originalEntry = auditResponse.data[0];

      // Attempt to modify audit entry (should fail)
      await expectApiError(
        () => adminClient.put(`/api/audit-entries/${originalEntry.id}`, {
          details: { modified: true }
        }),
        403,
        'Audit entries cannot be modified'
      );
    });

    it('should enforce audit log retention policies', async () => {
      // This test would check that old audit logs are properly archived or deleted
      // based on retention policies
      console.log('Audit log retention policy test would go here');
    });

    it('should capture comprehensive audit information', async () => {
      // Perform various operations
      await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { comprehensive_test: true }
      });

      await doctorClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
        signatureType: 'digital',
        signerRole: 'doctor',
        signatureData: 'test-signature-data'
      });

      // Get audit trail
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      // Verify comprehensive information is captured
      auditResponse.data.forEach((entry: AuditEntry) => {
        expect(entry.timestamp).toBeDefined();
        expect(entry.userId).toBeDefined();
        expect(entry.userRole).toBeDefined();
        expect(entry.ipAddress).toBeDefined();
        expect(entry.userAgent).toBeDefined();
        expect(entry.details).toBeDefined();
      });
    });

    it('should support audit trail export for compliance', async () => {
      // Perform some operations
      await nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
        data: { export_test: true }
      });

      // Export audit trail
      const exportResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail/export`,
        { format: 'csv' }
      );

      validateApiResponse(exportResponse, 200);
      expect(exportResponse.headers['content-type']).toContain('text/csv');
      expect(exportResponse.data).toContain('timestamp,action,userId,userRole');
    });

    it('should provide audit trail analytics', async () => {
      // Generate various audit entries
      const operations = [
        { action: 'update', user: 'nurse', data: { field1: 'value1' } },
        { action: 'update', user: 'doctor', data: { field2: 'value2' } },
        { action: 'signed', user: 'doctor', signature: 'test' }
      ];

      for (const op of operations) {
        if (op.action === 'update') {
          const client = op.user === 'nurse' ? nurseClient : doctorClient;
          await client.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), {
            data: op.data
          });
        } else if (op.action === 'signed') {
          await doctorClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
            signatureType: 'digital',
            signerRole: 'doctor',
            signatureData: 'test-signature-data'
          });
        }
      }

      // Get analytics
      const analyticsResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail/analytics`
      );

      validateApiResponse(analyticsResponse, 200);
      expect(analyticsResponse.data).toHaveProperty('totalEntries');
      expect(analyticsResponse.data).toHaveProperty('actionsByType');
      expect(analyticsResponse.data).toHaveProperty('actionsByUser');
      expect(analyticsResponse.data).toHaveProperty('timeline');
    });

    it('should detect suspicious audit patterns', async () => {
      // Simulate rapid successive updates from different users
      const rapidUpdates = [
        nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), { data: { rapid1: true } }),
        doctorClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), { data: { rapid2: true } }),
        nurseClient.put(API_ENDPOINTS.forms.update.replace(':id', testForm.id), { data: { rapid3: true } })
      ];

      await Promise.all(rapidUpdates);

      // Check for suspicious patterns
      const suspiciousResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail/suspicious`
      );

      validateApiResponse(suspiciousResponse, 200);
      expect(suspiciousResponse.data).toHaveProperty('suspiciousPatterns');
      expect(Array.isArray(suspiciousResponse.data.suspiciousPatterns)).toBe(true);
    });
  });

  describe('Versioning Best Practices and Edge Cases', () => {
    it('should handle large version differences efficiently', async () => {
      // Create a version with significantly different data
      const largeVersionData = {
        version: '2.0.0',
        changeReason: 'Major data restructuring',
        data: {
          ...testForm.data,
          new_structure: {
            nested: {
              data: 'complex nested structure'
            },
            array: Array(100).fill(null).map((_, i) => ({ item: i, value: `value_${i}` }))
          }
        }
      };

      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, largeVersionData);
        },
        'POST /api/forms/:id/versions (large data)',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME * 2
      );

      validateApiResponse(result, 201);
      expect(result.data.data.new_structure).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME * 2);
    });

    it('should prevent version creation on signed forms', async () => {
      // Sign the form first
      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
        signatureType: 'digital',
        signerRole: 'nurse',
        signatureData: 'test-signature-data'
      });

      // Try to create a version
      await expectApiError(
        () => adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
          version: '2.0.0',
          changeReason: 'Should fail',
          data: testForm.data
        }),
        400,
        'Cannot create version on signed form'
      );
    });

    it('should support version comparison', async () => {
      // Create multiple versions
      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
        version: '1.1.0',
        changeReason: 'First update',
        data: { ...testForm.data, updated: true }
      });

      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
        version: '1.2.0',
        changeReason: 'Second update',
        data: { ...testForm.data, updated: true, new_field: 'added' }
      });

      // Compare versions
      const comparisonResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions/compare`,
        { version1: '1.1.0', version2: '1.2.0' }
      );

      validateApiResponse(comparisonResponse, 200);
      expect(comparisonResponse.data).toHaveProperty('version1');
      expect(comparisonResponse.data).toHaveProperty('version2');
      expect(comparisonResponse.data).toHaveProperty('differences');
      expect(Array.isArray(comparisonResponse.data.differences)).toBe(true);
    });

    it('should handle version rollback with proper auditing', async () => {
      // Create versions
      const v1Response = await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
        version: '1.1.0',
        changeReason: 'Version 1',
        data: { ...testForm.data, version: '1.1.0' }
      });

      const v2Response = await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/versions`, {
        version: '1.2.0',
        changeReason: 'Version 2',
        data: { ...testForm.data, version: '1.2.0' }
      });

      // Rollback to version 1.1.0
      const rollbackResponse = await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/restore`, {
        versionId: v1Response.data.id,
        reason: 'Rollback due to issues with version 1.2.0'
      });

      validateApiResponse(rollbackResponse, 200);
      expect(rollbackResponse.data.data.version).toBe('1.1.0');

      // Verify rollback was audited
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      const rollbackEntry = auditResponse.data.find((entry: AuditEntry) => entry.action === 'version_restored');
      expect(rollbackEntry).toBeDefined();
      expect(rollbackEntry.details.reason).toContain('rollback');
    });
  });
});

// Helper function to get auth token
function getAuthToken(userRole: keyof typeof TEST_USERS): string {
  const user = TEST_USERS[userRole];
  return `mock_token_${userRole}_${user.id}`;
}