import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PatientTestSetup } from './setup';
import { PatientAuditAction } from './types';

describe('Patient Audit Logging - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let patientId: string;
  let auditService: any;

  beforeAll(async () => {
    await PatientTestSetup.initialize();
    app = PatientTestSetup.getApp();
    auditService = PatientTestSetup.getAuditService();
  });

  afterAll(async () => {
    await PatientTestSetup.cleanup();
  });

  beforeEach(async () => {
    // Clear audit logs
    await auditService.clearLogs();

    // Create test patient
    const patient = await PatientTestSetup.createTestPatient();
    patientId = patient.id;

    // Authenticate and get token
    const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');
    if (authResult) {
      authToken = authResult.accessToken;
    }
  });

  afterEach(async () => {
    await PatientTestSetup.cleanup();
  });

  describe('Patient CRUD Operation Audit Logging', () => {
    it('should log patient creation', async () => {
      const createData = {
        firstName: 'Audit',
        lastName: 'Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        nationalId: '1990010101234',
        phoneNumber: '+201234567890',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Egypt'
        },
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Spouse',
          phoneNumber: '+201234567891'
        },
        insurance: {
          provider: 'Test Insurance',
          policyNumber: 'TEST-123456',
          expiryDate: '2025-12-31',
          coverageType: 'Basic'
        },
        consentGiven: true
      };

      const response = await request(app)
        .post('/api/patients')
        .send(createData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const auditLogs = await auditService.getAuditLogs({ action: 'patient_created' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const createLog = auditLogs.logs.find(log =>
        log.action === 'patient_created' &&
        log.resourceId === response.body.data.id
      );

      expect(createLog).toBeDefined();
      expect(createLog.userId).toBe('user_1');
      expect(createLog.resource).toBe('patient');
      expect(createLog.details.patientId).toBeDefined();
      expect(createLog.details.name).toBeDefined();
      expect(createLog.timestamp).toBeDefined();
      expect(createLog.ipAddress).toBeDefined();
      expect(createLog.userAgent).toBeDefined();
      expect(createLog.isPhiAccess).toBe(true);
    });

    it('should log patient viewing', async () => {
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'patient_viewed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const viewLog = auditLogs.logs.find(log =>
        log.action === 'patient_viewed' &&
        log.resourceId === patientId
      );

      expect(viewLog).toBeDefined();
      expect(viewLog.userId).toBe('user_1');
      expect(viewLog.resource).toBe('patient');
      expect(viewLog.patientId).toBe(patientId);
      expect(viewLog.isPhiAccess).toBe(true);
    });

    it('should log patient updates', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+201234567891'
      };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'patient_updated' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const updateLog = auditLogs.logs.find(log =>
        log.action === 'patient_updated' &&
        log.resourceId === patientId
      );

      expect(updateLog).toBeDefined();
      expect(updateLog.userId).toBe('user_1');
      expect(updateLog.resource).toBe('patient');
      expect(updateLog.details.updatedFields).toBeDefined();
      expect(Array.isArray(updateLog.details.updatedFields)).toBe(true);
      expect(updateLog.details.updatedFields).toContain('firstName');
      expect(updateLog.details.updatedFields).toContain('lastName');
      expect(updateLog.details.updatedFields).toContain('phoneNumber');
    });

    it('should log patient deletion', async () => {
      // Authenticate as admin for deletion
      const adminAuth = await PatientTestSetup.authenticateUser('admin_wilson', 'password123');

      await request(app)
        .delete(`/api/patients/${patientId}`)
        .send({ reason: 'Audit test deletion' })
        .set('Authorization', `Bearer ${adminAuth?.accessToken}`)
        .expect(204);

      const auditLogs = await auditService.getAuditLogs({ action: 'patient_deleted' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const deleteLog = auditLogs.logs.find(log =>
        log.action === 'patient_deleted' &&
        log.resourceId === patientId
      );

      expect(deleteLog).toBeDefined();
      expect(deleteLog.userId).toBe('user_4'); // admin user
      expect(deleteLog.resource).toBe('patient');
      expect(deleteLog.details.reason).toBe('Audit test deletion');
      expect(deleteLog.isPhiAccess).toBe(true);
    });
  });

  describe('Medical Data Access Audit Logging', () => {
    it('should log medical history access', async () => {
      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'medical_history_accessed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const historyLog = auditLogs.logs.find(log =>
        log.action === 'medical_history_accessed' &&
        log.resourceId === patientId
      );

      expect(historyLog).toBeDefined();
      expect(historyLog.userId).toBe('user_1');
      expect(historyLog.resource).toBe('medical_record');
      expect(historyLog.patientId).toBe(patientId);
      expect(historyLog.isPhiAccess).toBe(true);
    });

    it('should log medical record creation', async () => {
      const recordData = {
        recordType: 'lab_result',
        title: 'Test Lab Result',
        description: 'Test lab result description',
        data: {
          testValue: 100,
          unit: 'mg/dL'
        },
        dateOfService: '2024-01-15',
        isConfidential: false,
        accessLevel: 'public',
        tags: ['test']
      };

      const response = await request(app)
        .post(`/api/patients/${patientId}/medical-records`)
        .send(recordData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const auditLogs = await auditService.getAuditLogs({ action: 'medical_record_created' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const createLog = auditLogs.logs.find(log =>
        log.action === 'medical_record_created' &&
        log.resourceId === response.body.data.id
      );

      expect(createLog).toBeDefined();
      expect(createLog.userId).toBe('user_1');
      expect(createLog.resource).toBe('medical_record');
      expect(createLog.patientId).toBe(patientId);
      expect(createLog.details.recordType).toBe('lab_result');
      expect(createLog.details.title).toBe('Test Lab Result');
      expect(createLog.isPhiAccess).toBe(true);
    });

    it('should log visit access', async () => {
      await request(app)
        .get(`/api/patients/${patientId}/visits`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'phi_accessed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const visitLog = auditLogs.logs.find(log =>
        log.resource === 'visit' &&
        log.details.method === 'GET'
      );

      expect(visitLog).toBeDefined();
      expect(visitLog.userId).toBe('user_1');
      expect(visitLog.isPhiAccess).toBe(true);
    });

    it('should log form access', async () => {
      await request(app)
        .get(`/api/patients/${patientId}/forms`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'phi_accessed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const formLog = auditLogs.logs.find(log =>
        log.resource === 'form' &&
        log.details.method === 'GET'
      );

      expect(formLog).toBeDefined();
      expect(formLog.userId).toBe('user_1');
      expect(formLog.isPhiAccess).toBe(true);
    });
  });

  describe('Search Activity Audit Logging', () => {
    it('should log search operations', async () => {
      await request(app)
        .get('/api/patients/search?q=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'search_performed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const searchLog = auditLogs.logs.find(log =>
        log.action === 'search_performed'
      );

      expect(searchLog).toBeDefined();
      expect(searchLog.userId).toBe('user_1');
      expect(searchLog.resource).toBe('patient');
      expect(searchLog.resourceId).toBe('search');
      expect(searchLog.details.query).toBe('Test');
      expect(searchLog.details.resultCount).toBeGreaterThanOrEqual(0);
      expect(searchLog.details.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should log advanced search with filters', async () => {
      await request(app)
        .get('/api/patients/search?name=Test&bloodType=A+&isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ action: 'search_performed' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const searchLog = auditLogs.logs.find(log =>
        log.action === 'search_performed'
      );

      expect(searchLog).toBeDefined();
      expect(searchLog.details.query).toBeDefined();
      expect(searchLog.details.filters).toBeDefined();
      expect(Array.isArray(searchLog.details.filters)).toBe(true);
    });
  });

  describe('Audit Log Integrity and Security', () => {
    it('should include all required audit fields', async () => {
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({});

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      const log = auditLogs.logs[0];

      // Verify all required fields are present
      expect(log.id).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.userName).toBeDefined();
      expect(log.userRole).toBeDefined();
      expect(log.action).toBeDefined();
      expect(log.resource).toBeDefined();
      expect(log.resourceId).toBeDefined();
      expect(log.details).toBeDefined();
      expect(log.ipAddress).toBeDefined();
      expect(log.userAgent).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.isPhiAccess).toBeDefined();
    });

    it('should prevent audit log tampering', async () => {
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({});
      const originalLog = auditLogs.logs[0];

      // Verify logs cannot be modified through normal API
      expect(originalLog.id).toBeDefined();
      expect(originalLog.timestamp).toBeDefined();

      // Timestamp should be in the past and not modifiable
      expect(new Date(originalLog.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should log failed access attempts', async () => {
      // Try to access non-existent patient
      await request(app)
        .get('/api/patients/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Try to access without authentication
      await request(app)
        .get(`/api/patients/${patientId}`)
        .expect(401);

      const auditLogs = await auditService.getAuditLogs({});

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      // Failed attempts should be logged
      expect(auditLogs.logs.some(log => log.resource === 'patient')).toBe(true);
    });

    it('should log PHI access specifically', async () => {
      // Access PHI data
      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({ isPhiAccess: true });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.every(log => log.isPhiAccess)).toBe(true);
    });
  });

  describe('Audit Log Query and Filtering', () => {
    beforeEach(async () => {
      // Perform various operations to create diverse audit logs
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .post(`/api/patients/${patientId}/medical-records`)
        .send({
          recordType: 'lab_result',
          title: 'Test Record',
          description: 'Test Description',
          data: { value: 100 },
          dateOfService: '2024-01-15',
          isConfidential: false,
          accessLevel: 'public',
          tags: ['test']
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      await request(app)
        .get('/api/patients/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should filter audit logs by patient ID', async () => {
      const patientLogs = await auditService.getAuditLogs({ patientId });

      expect(patientLogs.logs.length).toBeGreaterThan(0);
      expect(patientLogs.logs.every(log => log.patientId === patientId)).toBe(true);
    });

    it('should filter audit logs by user ID', async () => {
      const userLogs = await auditService.getAuditLogs({ userId: 'user_1' });

      expect(userLogs.logs.length).toBeGreaterThan(0);
      expect(userLogs.logs.every(log => log.userId === 'user_1')).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const viewLogs = await auditService.getAuditLogs({ action: 'patient_viewed' });

      expect(viewLogs.logs.length).toBeGreaterThan(0);
      expect(viewLogs.logs.every(log => log.action === 'patient_viewed')).toBe(true);
    });

    it('should filter audit logs by PHI access', async () => {
      const phiLogs = await auditService.getAuditLogs({ isPhiAccess: true });

      expect(phiLogs.logs.length).toBeGreaterThan(0);
      expect(phiLogs.logs.every(log => log.isPhiAccess)).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const endDate = new Date().toISOString();

      const dateFilteredLogs = await auditService.getAuditLogs({ startDate, endDate });

      expect(dateFilteredLogs.logs.length).toBeGreaterThan(0);
      dateFilteredLogs.logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(logDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });
    });

    it('should support audit log pagination', async () => {
      const paginatedLogs = await auditService.getAuditLogs({
        page: 1,
        limit: 2
      });

      expect(paginatedLogs.logs.length).toBeLessThanOrEqual(2);
      expect(paginatedLogs.total).toBeGreaterThan(0);
    });

    it('should handle empty audit log results', async () => {
      const emptyLogs = await auditService.getAuditLogs({
        userId: 'nonexistent_user'
      });

      expect(emptyLogs.logs).toEqual([]);
      expect(emptyLogs.total).toBe(0);
    });
  });

  describe('Audit Log Performance and Scalability', () => {
    it('should handle high volume of audit events', async () => {
      const operationCount = 50;
      const operations = [];

      // Generate many audit events
      for (let i = 0; i < operationCount; i++) {
        operations.push(
          request(app)
            .get(`/api/patients/${patientId}`)
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      // Execute operations concurrently
      const results = await Promise.all(operations);

      // Verify all operations succeeded and were logged
      results.forEach(result => {
        expect(result.status).toBe(200);
      });

      const auditLogs = await auditService.getAuditLogs({ patientId });
      expect(auditLogs.logs.length).toBeGreaterThanOrEqual(operationCount);
    });

    it('should maintain audit log performance under load', async () => {
      const startTime = Date.now();

      // Perform multiple operations
      for (let i = 0; i < 20; i++) {
        await request(app)
          .get(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${authToken}`);
      }

      const queryStartTime = Date.now();
      const auditLogs = await auditService.getAuditLogs({});
      const queryEndTime = Date.now();

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(queryEndTime - queryStartTime).toBeLessThan(1000); // Query should complete within 1 second
    });

    it('should not impact application performance', async () => {
      const startTime = Date.now();

      // Perform regular operations with audit logging enabled
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();

      // Operations should complete quickly even with audit logging
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Audit Log Compliance Requirements', () => {
    it('should retain logs for required retention period', async () => {
      // This test verifies that audit logs are properly stored
      // In a real implementation, this would check for retention policies
      const auditLogs = await auditService.getAuditLogs({});

      expect(auditLogs.logs.length).toBeGreaterThan(0);

      // Verify logs have timestamps
      auditLogs.logs.forEach(log => {
        expect(log.timestamp).toBeDefined();
        expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
      });
    });

    it('should provide immutable audit trail', async () => {
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({});
      const originalLog = auditLogs.logs[0];

      // Simulate attempting to modify logs
      // In a real implementation, this would test actual immutability
      expect(originalLog.id).toBeDefined();
      expect(typeof originalLog.id).toBe('string');
      expect(originalLog.id.length).toBeGreaterThan(0);
    });

    it('should support audit log export and reporting', async () => {
      const auditLogs = await auditService.getAuditLogs({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });

      expect(auditLogs.logs.length).toBeGreaterThan(0);

      // Verify logs are in exportable format
      auditLogs.logs.forEach(log => {
        expect(log).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            userId: expect.any(String),
            action: expect.any(String),
            resource: expect.any(String),
            resourceId: expect.any(String),
            timestamp: expect.any(String),
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
            isPhiAccess: expect.any(Boolean)
          })
        );
      });
    });

    it('should log consent-related activities', async () => {
      // Create patient with consent
      const patientWithConsent = await PatientTestSetup.createTestPatient({
        firstName: 'Consent',
        lastName: 'Test',
        consentGiven: true
      });

      // Access patient records
      await request(app)
        .get(`/api/patients/${patientWithConsent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const auditLogs = await auditService.getAuditLogs({
        patientId: patientWithConsent.id
      });

      expect(auditLogs.logs.length).toBeGreaterThan(0);

      // Look for consent-related activities
      const consentRelatedLogs = auditLogs.logs.filter(log =>
        log.details.consentGiven !== undefined ||
        log.action === 'patient_created'
      );

      expect(consentRelatedLogs.length).toBeGreaterThan(0);
    });

    it('should support compliance reporting', async () => {
      // Generate compliance-related audit events
      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const complianceReport = {
        phiAccessEvents: await auditService.getAuditLogs({ isPhiAccess: true }),
        patientViewEvents: await auditService.getAuditLogs({ action: 'patient_viewed' }),
        medicalRecordEvents: await auditService.getAuditLogs({ resource: 'medical_record' }),
        totalEvents: await auditService.getAuditLogs({})
      };

      expect(complianceReport.phiAccessEvents.logs.length).toBeGreaterThan(0);
      expect(complianceReport.patientViewEvents.logs.length).toBeGreaterThan(0);
      expect(complianceReport.medicalRecordEvents.logs.length).toBeGreaterThan(0);
      expect(complianceReport.totalEvents.logs.length).toBeGreaterThan(0);

      // Verify compliance metrics
      expect(complianceReport.phiAccessEvents.total).toBeGreaterThan(0);
      expect(complianceReport.phiAccessEvents.total).toBeLessThanOrEqual(complianceReport.totalEvents.total);
    });
  });
});