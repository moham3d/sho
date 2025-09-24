import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PatientTestSetup } from './setup';
import { TEST_PATIENTS, VALID_PATIENT_CREATE_REQUEST, INVALID_PATIENT_CREATE_REQUESTS } from './fixtures';
import { PatientCreateRequest, PatientUpdateRequest } from './types';

describe('Patient CRUD Operations - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let patientId: string;

  beforeAll(async () => {
    await PatientTestSetup.initialize();
    app = PatientTestSetup.getApp();
  });

  afterAll(async () => {
    await PatientTestSetup.cleanup();
  });

  beforeEach(async () => {
    // Authenticate and get token
    const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');
    if (authResult) {
      authToken = authResult.accessToken;
    }
  });

  afterEach(async () => {
    await PatientTestSetup.cleanup();
  });

  describe('GET /api/patients - List Patients', () => {
    it('should return list of patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.patients).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/patients?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should respect maximum limit of 50 patients per page', async () => {
      const response = await request(app)
        .get('/api/patients?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBe(50);
    });

    it('should support sorting parameters', async () => {
      const response = await request(app)
        .get('/api/patients?sortBy=firstName&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify sorting
      const patients = response.body.data.patients;
      for (let i = 1; i < patients.length; i++) {
        expect(patients[i-1].firstName <= patients[i].firstName).toBe(true);
      }
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/patients?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      // Verify search results match criteria
      response.body.data.patients.forEach((patient: any) => {
        expect(
          patient.fullName.toLowerCase().includes('john') ||
          patient.patientId.toLowerCase().includes('john') ||
          patient.email?.toLowerCase().includes('john') ||
          patient.phoneNumber.includes('john')
        ).toBe(true);
      });
    });

    it('should filter by gender', async () => {
      const response = await request(app)
        .get('/api/patients?gender=male')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.gender).toBe('male');
      });
    });

    it('should filter by blood type', async () => {
      const response = await request(app)
        .get('/api/patients?bloodType=A+')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.bloodType).toBe('A+');
      });
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/patients?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);

      response.body.data.patients.forEach((patient: any) => {
        expect(patient.isActive).toBe(true);
      });
    });

    it('should filter by age range', async () => {
      const response = await request(app)
        .get('/api/patients?ageRange={"min":30,"max":50}')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.patients)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/patients')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require proper permissions', async () => {
      // Authenticate as technician (no patient read permissions)
      const techAuth = await PatientTestSetup.authenticateUser('tech_davis', 'password123');

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${techAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/patients/:id - Get Patient by ID', () => {
    beforeEach(async () => {
      const patient = await PatientTestSetup.createTestPatient();
      patientId = patient.id;
    });

    it('should return patient by ID', async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(patientId);
      expect(response.body.data.fullName).toBeDefined();
      expect(response.body.data.dateOfBirth).toBeDefined();
      expect(response.body.data.gender).toBeDefined();
      expect(response.body.data.address).toBeDefined();
      expect(response.body.data.emergencyContact).toBeDefined();
      expect(response.body.data.insurance).toBeDefined();
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require PHI access permissions', async () => {
      // Authenticate as receptionist (no PHI access)
      const receptionistAuth = await PatientTestSetup.authenticateUser('reception_brown', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHI_ACCESS_DENIED');
    });

    it('should log PHI access in audit trail', async () => {
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify audit log was created
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ patientId });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log => log.action === 'patient_viewed')).toBe(true);
    });
  });

  describe('POST /api/patients - Create Patient', () => {
    it('should create a new patient with valid data', async () => {
      const patientData: PatientCreateRequest = {
        ...VALID_PATIENT_CREATE_REQUEST,
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-03-15',
        email: 'jane.smith@example.com'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(patientData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Smith');
      expect(response.body.data.fullName).toBe('Jane Smith');
      expect(response.body.data.dateOfBirth).toBeDefined();
      expect(response.body.data.gender).toBe('male');
      expect(response.body.data.nationalId).toBeDefined();
      expect(response.body.data.phoneNumber).toBeDefined();
      expect(response.body.data.address).toBeDefined();
      expect(response.body.data.emergencyContact).toBeDefined();
      expect(response.body.data.insurance).toBeDefined();
      expect(response.body.data.consentGiven).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(incompleteData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.validationErrors).toBeDefined();
      expect(Array.isArray(response.body.error.validationErrors)).toBe(true);
    });

    it('should validate date format', async () => {
      const invalidDateData = {
        ...VALID_PATIENT_CREATE_REQUEST,
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(invalidDateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require patient consent', async () => {
      const noConsentData = {
        ...VALID_PATIENT_CREATE_REQUEST,
        consentGiven: false
      };

      const response = await request(app)
        .post('/api/patients')
        .send(noConsentData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONSENT_REQUIRED');
    });

    it('should prevent duplicate patient creation', async () => {
      // Create first patient
      await request(app)
        .post('/api/patients')
        .send(VALID_PATIENT_CREATE_REQUEST)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Try to create patient with same national ID
      const response = await request(app)
        .post('/api/patients')
        .send(VALID_PATIENT_CREATE_REQUEST)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_ALREADY_EXISTS');
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        ...VALID_PATIENT_CREATE_REQUEST,
        phoneNumber: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(invalidPhoneData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format when provided', async () => {
      const invalidEmailData = {
        ...VALID_PATIENT_CREATE_REQUEST,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/patients')
        .send(invalidEmailData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send(VALID_PATIENT_CREATE_REQUEST)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require proper permissions', async () => {
      // Authenticate as technician (no patient create permissions)
      const techAuth = await PatientTestSetup.authenticateUser('tech_davis', 'password123');

      const response = await request(app)
        .post('/api/patients')
        .send(VALID_PATIENT_CREATE_REQUEST)
        .set('Authorization', `Bearer ${techAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should log patient creation in audit trail', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send(VALID_PATIENT_CREATE_REQUEST)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Verify audit log was created
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ action: 'patient_created' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log =>
        log.action === 'patient_created' &&
        log.resourceId === response.body.data.id
      )).toBe(true);
    });
  });

  describe('PUT /api/patients/:id - Update Patient', () => {
    beforeEach(async () => {
      const patient = await PatientTestSetup.createTestPatient();
      patientId = patient.id;
    });

    it('should update patient with valid data', async () => {
      const updateData: PatientUpdateRequest = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+201234567891',
        email: 'updated@example.com',
        bloodType: 'B+'
      };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.fullName).toBe('Updated Name');
      expect(response.body.data.phoneNumber).toBe('+201234567891');
      expect(response.body.data.email).toBe('updated@example.com');
      expect(response.body.data.bloodType).toBe('B+');
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should update patient address', async () => {
      const updateData = {
        address: {
          street: '456 Updated St',
          city: 'Updated City',
          state: 'Updated State',
          postalCode: '54321',
          country: 'Egypt'
        }
      };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address.street).toBe('456 Updated St');
      expect(response.body.data.address.city).toBe('Updated City');
    });

    it('should update emergency contact', async () => {
      const updateData = {
        emergencyContact: {
          name: 'Updated Emergency',
          relationship: 'Parent',
          phoneNumber: '+201234567892',
          email: 'emergency@example.com'
        }
      };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emergencyContact.name).toBe('Updated Emergency');
      expect(response.body.data.emergencyContact.relationship).toBe('Parent');
    });

    it('should update insurance information', async () => {
      const updateData = {
        insurance: {
          provider: 'Updated Insurance',
          policyNumber: 'UPDATED-123456',
          groupNumber: 'UPDATED-789012',
          expiryDate: '2026-12-31',
          coverageType: 'Premium'
        }
      };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.insurance.provider).toBe('Updated Insurance');
      expect(response.body.data.insurance.policyNumber).toBe('UPDATED-123456');
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .put('/api/patients/nonexistent')
        .send({ firstName: 'Updated' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require PHI access permissions', async () => {
      // Authenticate as receptionist (no PHI access)
      const receptionistAuth = await PatientTestSetup.authenticateUser('reception_brown', 'password123');

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send({ firstName: 'Updated' })
        .set('Authorization', `Bearer ${receptionistAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHI_ACCESS_DENIED');
    });

    it('should log patient update in audit trail', async () => {
      const updateData = { firstName: 'Updated' };

      const response = await request(app)
        .put(`/api/patients/${patientId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify audit log was created
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ action: 'patient_updated' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log =>
        log.action === 'patient_updated' &&
        log.resourceId === patientId
      )).toBe(true);
    });
  });

  describe('DELETE /api/patients/:id - Delete Patient (Soft Delete)', () => {
    beforeEach(async () => {
      const patient = await PatientTestSetup.createTestPatient();
      patientId = patient.id;
    });

    it('should soft delete patient', async () => {
      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .send({ reason: 'Test deletion' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify patient is marked as deleted
      const getResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.isActive).toBe(false);
      expect(getResponse.body.data.deletedAt).toBeDefined();
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .delete('/api/patients/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should require delete permissions', async () => {
      // Authenticate as doctor (no delete permissions)
      const doctorAuth = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should log patient deletion in audit trail', async () => {
      // Authenticate as admin (has delete permissions)
      const adminAuth = await PatientTestSetup.authenticateUser('admin_wilson', 'password123');

      const response = await request(app)
        .delete(`/api/patients/${patientId}`)
        .send({ reason: 'Test deletion' })
        .set('Authorization', `Bearer ${adminAuth?.accessToken}`)
        .expect(204);

      // Verify audit log was created
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ action: 'patient_deleted' });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log =>
        log.action === 'patient_deleted' &&
        log.resourceId === patientId
      )).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle large payload', async () => {
      const largeData = {
        ...VALID_PATIENT_CREATE_REQUEST,
        notes: 'x'.repeat(10000) // Large text field
      };

      const response = await request(app)
        .post('/api/patients')
        .send(largeData)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/api/patients?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should fallback to default values
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should handle concurrent patient creation', async () => {
      // Create two patients with similar data concurrently
      const patient1 = {
        ...VALID_PATIENT_CREATE_REQUEST,
        nationalId: 'CONCURRENT1'
      };

      const patient2 = {
        ...VALID_PATIENT_CREATE_REQUEST,
        nationalId: 'CONCURRENT2'
      };

      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/patients')
          .send(patient1)
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .post('/api/patients')
          .send(patient2)
          .set('Authorization', `Bearer ${authToken}`)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });
});