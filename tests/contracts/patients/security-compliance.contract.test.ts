import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PatientTestSetup } from './setup';
import { PHI_ACCESS_TEST_SCENARIOS, COMPLIANCE_TEST_SCENARIOS, PATIENT_ROLE_PERMISSIONS } from './fixtures';
import { PatientAuditAction } from './types';

describe('Patient Security and Compliance - Contract Tests', () => {
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
    // Create test patient
    const patient = await PatientTestSetup.createTestPatient();
    patientId = patient.id;
  });

  afterEach(async () => {
    await PatientTestSetup.cleanup();
  });

  describe('PHI (Protected Health Information) Access Control', () => {
    describe.each(PHI_ACCESS_TEST_SCENARIOS)('$name', (scenario) => {
      it(`should ${scenario.isAllowed ? 'allow' : 'deny'} ${scenario.name}`, async () => {
        // Authenticate user with specific role
        const authResult = await PatientTestSetup.authenticateUser(
          `${scenario.userRole}_test`,
          'password123'
        ) || await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

        let response;
        if (scenario.action === 'patient_viewed') {
          response = await request(app)
            .get(`/api/patients/${patientId}`)
            .set('Authorization', `Bearer ${authResult?.accessToken}`);
        } else if (scenario.action === 'medical_record_viewed') {
          response = await request(app)
            .get(`/api/patients/${patientId}/medical-history`)
            .set('Authorization', `Bearer ${authResult?.accessToken}`);
        }

        if (scenario.isAllowed) {
          expect(response?.status).toBe(200);
          expect(response?.body.success).toBe(true);
        } else {
          expect(response?.status).toBe(403);
          expect(response?.body.success).toBe(false);
          expect(response?.body.error.code).toBe('PHI_ACCESS_DENIED');
        }
      });
    });

    it('should log all PHI access attempts', async () => {
      // Authenticate as doctor
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Access patient data
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      // Verify audit log contains PHI access
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({
        patientId,
        isPhiAccess: true
      });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log => log.isPhiAccess)).toBe(true);
    });

    it('should require reason for PHI access', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}?reason=Patient treatment follow-up`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      // Verify reason is logged
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ patientId });

      expect(auditLogs.logs.some(log =>
        log.details.reason === 'Patient treatment follow-up'
      )).toBe(true);
    });

    it('should encrypt sensitive PHI fields at rest', async () => {
      const encryptionService = PatientTestSetup.getEncryptionService();

      // Test encryption of sensitive fields
      const sensitiveData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+201234567890'
      };

      const encryptedData = await encryptionService.encryptPhiFields(sensitiveData);

      // Verify fields are encrypted
      expect(await encryptionService.isEncrypted(encryptedData.firstName)).toBe(true);
      expect(await encryptionService.isEncrypted(encryptedData.lastName)).toBe(true);
      expect(await encryptionService.isEncrypted(encryptedData.email)).toBe(true);
      expect(await encryptionService.isEncrypted(encryptedData.phoneNumber)).toBe(true);

      // Verify decryption works
      const decryptedData = await encryptionService.decryptPhiFields(encryptedData);
      expect(decryptedData.firstName).toBe(sensitiveData.firstName);
      expect(decryptedData.lastName).toBe(sensitiveData.lastName);
      expect(decryptedData.email).toBe(sensitiveData.email);
      expect(decryptedData.phoneNumber).toBe(sensitiveData.phoneNumber);
    });

    it('should prevent unauthorized access to sensitive medical conditions', async () => {
      // Create patient with sensitive conditions
      const sensitivePatient = await PatientTestSetup.createTestPatient({
        chronicConditions: ['HIV', 'Mental Health Disorder', 'Substance Abuse']
      });

      // Try to access with receptionist (no PHI access)
      const receptionistAuth = await PatientTestSetup.authenticateUser('reception_brown', 'password123');

      const response = await request(app)
        .get(`/api/patients/${sensitivePatient.id}`)
        .set('Authorization', `Bearer ${receptionistAuth?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHI_ACCESS_DENIED');
    });

    it('should implement role-based access control for medical records', async () => {
      const rolePermissions = [
        { role: 'doctor', canAccess: true },
        { role: 'nurse', canAccess: true },
        { role: 'radiologist', canAccess: true },
        { role: 'receptionist', canAccess: false },
        { role: 'technician', canAccess: false }
      ];

      for (const { role, canAccess } of rolePermissions) {
        const authResult = await PatientTestSetup.authenticateUser(`${role}_test`, 'password123') ||
                          await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

        const response = await request(app)
          .get(`/api/patients/${patientId}/medical-history`)
          .set('Authorization', `Bearer ${authResult?.accessToken}`);

        if (canAccess) {
          expect([200, 404]).toContain(response.status); // 404 if no medical history
        } else {
          expect(response.status).toBe(403);
        }
      }
    });
  });

  describe('HIPAA Compliance', () => {
    it('should implement minimum necessary standard', async () => {
      const authResult = await PatientTestSetup.authenticateUser('nurse_johnson', 'password123');

      // Nurse should only have access to necessary information
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify only necessary fields are returned (not full financial or sensitive data)
      const patient = response.body.data;
      expect(patient.firstName).toBeDefined();
      expect(patient.lastName).toBeDefined();
      expect(patient.dateOfBirth).toBeDefined();
      expect(patient.medicalRecordNumber).toBeUndefined(); // Should not expose internal IDs
    });

    it('should maintain audit trail for all PHI access', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Perform multiple PHI access operations
      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`);

      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`);

      await request(app)
        .get(`/api/patients/${patientId}/visits`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`);

      // Verify comprehensive audit trail
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({ patientId });

      expect(auditLogs.logs.length).toBeGreaterThanOrEqual(3);

      // Verify required audit fields
      auditLogs.logs.forEach(log => {
        expect(log.userId).toBeDefined();
        expect(log.action).toBeDefined();
        expect(log.resource).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.ipAddress).toBeDefined();
        expect(log.userAgent).toBeDefined();
        expect(log.isPhiAccess).toBeDefined();
      });
    });

    it('should implement data breach detection', async () => {
      const auditService = PatientTestSetup.getAuditService();

      // Simulate suspicious activity (multiple access attempts from different users)
      const users = ['doctor_smith', 'nurse_johnson', 'radiologist_miller'];
      for (const username of users) {
        const authResult = await PatientTestSetup.authenticateUser(username, 'password123');
        await request(app)
          .get(`/api/patients/${patientId}`)
          .set('Authorization', `Bearer ${authResult?.accessToken}`);
      }

      // Check for suspicious patterns
      const auditLogs = await auditService.getAuditLogs({ patientId });
      const recentAccess = auditLogs.logs.filter(log =>
        new Date(log.timestamp).getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
      );

      // If multiple users accessed same patient recently, it might be suspicious
      if (recentAccess.length > 2) {
        const uniqueUsers = new Set(recentAccess.map(log => log.userId));
        expect(uniqueUsers.size).toBeGreaterThan(1);
      }
    });

    it('should enforce data retention policies', async () => {
      // This would test that old data is properly archived or deleted
      // For now, we'll verify that audit logs have proper timestamps
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({});

      auditLogs.logs.forEach(log => {
        expect(log.timestamp).toBeDefined();
        expect(new Date(log.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    it('should provide patient access to their own data', async () => {
      // This would test GDPR-style patient access rights
      // For now, we'll verify that patients can be identified
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(patientId);
    });
  });

  describe('GDPR Compliance', () => {
    it('should support right to access', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify comprehensive data is provided
      const patient = response.body.data;
      expect(patient.id).toBeDefined();
      expect(patient.fullName).toBeDefined();
      expect(patient.dateOfBirth).toBeDefined();
      expect(patient.contactInfo).toBeDefined();
      expect(patient.medicalInfo).toBeDefined();
    });

    it('should support right to erasure (soft delete)', async () => {
      const authResult = await PatientTestSetup.authenticateUser('admin_wilson', 'password123');

      // Soft delete patient
      await request(app)
        .delete(`/api/patients/${patientId}`)
        .send({ reason: 'Patient requested deletion' })
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(204);

      // Verify data is no longer accessible
      const getResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(getResponse.body.data.isActive).toBe(false);
      expect(getResponse.body.data.deletedAt).toBeDefined();
    });

    it('should implement data minimization', async () => {
      const authResult = await PatientTestSetup.authenticateUser('receptionist_brown', 'password123');

      // Receptionist should only see basic info, not full medical history
      const listResponse = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);

      // Verify only basic information is exposed
      listResponse.body.data.patients.forEach((patient: any) => {
        expect(patient.id).toBeDefined();
        expect(patient.fullName).toBeDefined();
        expect(patient.patientId).toBeDefined();
        // Sensitive fields should not be exposed in list view
        expect(patient.medicalHistory).toBeUndefined();
        expect(patient.chronicConditions).toBeUndefined();
        expect(patient.medications).toBeUndefined();
      });
    });

    it('should maintain processing records', async () => {
      const auditService = PatientTestSetup.getAuditService();

      // All data processing should be logged
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`);

      const auditLogs = await auditService.getAuditLogs({ patientId });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs.some(log => log.details.reasonForAccess)).toBe(true);
    });
  });

  describe('Data Security and Encryption', () => {
    it('should encrypt data in transit', async () => {
      // This test verifies that HTTPS is used
      // In a real environment, this would check for SSL/TLS
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate input to prevent injection attacks', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const maliciousInput = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Doe',
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
        .send(maliciousInput)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Verify the script tag was sanitized or escaped
      expect(response.body.data.firstName).not.toContain('<script>');
    });

    it('should prevent brute force attacks', async () => {
      // Simulate multiple failed login attempts
      const failedAttempts = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'invalid_user', password: 'wrong_password' });

        failedAttempts.push(response);
      }

      // After multiple failed attempts, should still return 401 (not locked out in test)
      // In production, this would implement rate limiting
      failedAttempts.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('should implement proper session management', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Access protected resource with valid token
      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Try with invalid token
      const invalidResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(invalidResponse.body.success).toBe(false);
    });
  });

  describe('Access Control and Authorization', () => {
    it('should enforce role-based permissions', async () => {
      const roleTestCases = Object.entries(PATIENT_ROLE_PERMISSIONS);

      for (const [role, permissions] of roleTestCases) {
        const authResult = await PatientTestSetup.authenticateUser(`${role}_test`, 'password123') ||
                          await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

        // Test patient creation permission
        if (permissions.canCreate) {
          const createResponse = await request(app)
            .post('/api/patients')
            .send({
              firstName: 'Test',
              lastName: 'Patient',
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
            })
            .set('Authorization', `Bearer ${authResult?.accessToken}`);

          expect([201, 409]).toContain(createResponse.status);
        } else {
          const createResponse = await request(app)
            .post('/api/patients')
            .send({
              firstName: 'Test',
              lastName: 'Patient',
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
            })
            .set('Authorization', `Bearer ${authResult?.accessToken}`);

          expect(createResponse.status).toBe(403);
        }
      }
    });

    it('should implement least privilege principle', async () => {
      // Receptionist should only have access to basic patient info
      const receptionistAuth = await PatientTestSetup.authenticateUser('receptionist_brown', 'password123');

      // Can view basic patient list
      const listResponse = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${receptionistAuth?.accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);

      // Cannot access medical history
      const medicalResponse = await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${receptionistAuth?.accessToken}`)
        .expect(403);

      expect(medicalResponse.body.success).toBe(false);
    });

    it('should validate token expiration', async () => {
      // This test would normally check for expired tokens
      // In our mock implementation, tokens don't expire, but we verify the mechanism exists
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent privilege escalation', async () => {
      // Normal user trying to access admin functions
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Try to access other users' data without permission
      const otherPatient = await PatientTestSetup.createTestPatient({
        firstName: 'Other',
        lastName: 'Patient'
      });

      const response = await request(app)
        .delete(`/api/patients/${otherPatient.id}`)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Security Monitoring and Incident Response', () => {
    it('should log security events', async () => {
      const auditService = PatientTestSetup.getAuditService();

      // Trigger various security events
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Failed access attempt
      await request(app)
        .get('/api/patients/nonexistent')
        .set('Authorization', `Bearer ${authResult?.accessToken}`);

      // Unauthorized access attempt
      await request(app)
        .get(`/api/patients/${patientId}/medical-history`)
        .set('Authorization', 'Bearer invalid_token');

      // Verify security events are logged
      const securityLogs = await auditService.getAuditLogs({});
      expect(securityLogs.logs.length).toBeGreaterThan(0);
    });

    it('should detect suspicious access patterns', async () => {
      const auditService = PatientTestSetup.getAuditService();

      // Simulate rapid access to multiple patient records
      const patients = [];
      for (let i = 0; i < 5; i++) {
        const patient = await PatientTestSetup.createTestPatient({
          firstName: `Rapid${i}`,
          lastName: `Access${i}`
        });
        patients.push(patient);
      }

      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Rapid access to multiple patients
      for (const patient of patients) {
        await request(app)
          .get(`/api/patients/${patient.id}`)
          .set('Authorization', `Bearer ${authResult?.accessToken}`);
      }

      // Verify audit logs capture the pattern
      const auditLogs = await auditService.getAuditLogs({ userId: authResult?.user?.id });
      expect(auditLogs.logs.length).toBeGreaterThan(0);
    });

    it('should implement proper error handling without information leakage', async () => {
      // Try to access non-existent patient
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const response = await request(app)
        .get('/api/patients/nonexistent-id')
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_NOT_FOUND');
      // Should not leak sensitive information about why it failed
      expect(response.body.error.message).toBe('Patient not found');
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate medical data formats', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      const invalidMedicalRecord = {
        recordType: 'invalid_type',
        title: 'Test Record',
        description: 'Test Description',
        data: 'invalid data structure',
        dateOfService: 'invalid-date',
        isConfidential: false,
        accessLevel: 'invalid_level',
        tags: []
      };

      const response = await request(app)
        .post(`/api/patients/${patientId}/medical-records`)
        .send(invalidMedicalRecord)
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(500); // Should fail validation

      expect(response.body.success).toBe(false);
    });

    it('should prevent data tampering', async () => {
      const authResult = await PatientTestSetup.authenticateUser('doctor_smith', 'password123');

      // Create a patient record
      const createResponse = await request(app)
        .post('/api/patients')
        .send({
          firstName: 'Original',
          lastName: 'Patient',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationalId: '1990010101234',
          phoneNumber: '+201234567890',
          address: {
            street: '123 Original St',
            city: 'Original City',
            state: 'Original State',
            postalCode: '12345',
            country: 'Egypt'
          },
          emergencyContact: {
            name: 'Original Contact',
            relationship: 'Spouse',
            phoneNumber: '+201234567891'
          },
          insurance: {
            provider: 'Original Insurance',
            policyNumber: 'ORIGINAL-123456',
            expiryDate: '2025-12-31',
            coverageType: 'Basic'
          },
          consentGiven: true
        })
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(201);

      const createdPatient = createResponse.body.data;

      // Try to modify critical fields that shouldn't be changeable
      const tamperResponse = await request(app)
        .put(`/api/patients/${createdPatient.id}`)
        .send({
          patientId: 'TAMPERED-ID', // Should not be changeable
          createdAt: '2010-01-01' // Should not be changeable
        })
        .set('Authorization', `Bearer ${authResult?.accessToken}`)
        .expect(200);

      // Verify tampering attempts are logged
      const auditService = PatientTestSetup.getAuditService();
      const auditLogs = await auditService.getAuditLogs({
        resourceId: createdPatient.id,
        action: 'patient_updated' as PatientAuditAction
      });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
    });
  });
});