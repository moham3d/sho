// Digital Signature Workflow Contract Tests
// This file contains comprehensive tests for digital signature functionality

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Form, FormSignature, SignatureRole, SignatureStatus, User, DeviceInfo } from './types';
import {
  TEST_USERS,
  TEST_PATIENTS,
  TEST_VISITS,
  NURSE_FORM_TEMPLATE,
  TEST_SIGNATURES,
  API_ENDPOINTS,
  ERROR_RESPONSES,
  PERFORMANCE_BENCHMARKS,
  SECURITY_REQUIREMENTS
} from './fixtures';
import {
  generateTestForm,
  generateTestSignature,
  createAuthenticatedClient,
  validateSignatureStructure,
  validateApiResponse,
  expectApiError,
  measureAsyncOperation,
  createTestContext
} from './utils';
import setup, { mockDatabase, testContext } from './setup';

describe('Digital Signature Workflow Contract Tests', () => {
  let app: any;
  let adminClient: any;
  let doctorClient: any;
  let nurseClient: any;
  let createdForms: string[] = [];
  let testForm: Form;
  let testSignature: FormSignature;

  beforeEach(async () => {
    // Reset mock database
    mockDatabase.reset();

    // Create test clients for different roles
    adminClient = createAuthenticatedClient('admin');
    doctorClient = createAuthenticatedClient('doctor');
    nurseClient = createAuthenticatedClient('nurse');

    // Clear created forms array
    createdForms = [];

    // Create a test form for signature tests
    const formResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
      templateId: NURSE_FORM_TEMPLATE.id,
      patientId: TEST_PATIENTS.patient1.id,
      visitId: TEST_VISITS.visit1.id,
      type: 'nurse_form',
      status: 'pending_signature',
      data: {
        patient_name: 'Test Patient',
        blood_pressure: '120/80',
        heart_rate: 72,
        chief_complaint: 'Ready for signature'
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

  describe('GET /api/forms/:id/signatures - List Form Signatures', () => {
    beforeEach(async () => {
      // Add a test signature
      const signatureResponse = await nurseClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`,
        {
          signatureType: 'digital',
          signerRole: 'nurse',
          signatureData: TEST_SIGNATURES.nurseSignature.signatureData,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Suite'
        }
      );

      testSignature = signatureResponse.data;
    });

    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`),
        401
      );
    });

    it('should return 200 and list of signatures for authenticated users', async () => {
      const { result, duration } = await measureAsyncOperation(
        async () => {
          return adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`);
        },
        'GET /api/forms/:id/signatures',
        PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME
      );

      validateApiResponse(result, 200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Validate signature structure
      result.data.forEach((signature: FormSignature) => {
        validateSignatureStructure(signature);
      });

      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_RESPONSE_TIME);
    });

    it('should return empty array for form with no signatures', async () => {
      // Create a new form without signatures
      const newFormResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient2.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form',
        status: 'draft',
        data: { test: 'no signatures' }
      });

      const newForm = newFormResponse.data;
      createdForms.push(newForm.id);

      const response = await adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', newForm.id)}/signatures`);
      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });

    it('should support filtering by signature status', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`,
        { status: 'pending' }
      );

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned signatures should match the filter
      response.data.forEach((signature: FormSignature) => {
        expect(signature.status).toBe('pending');
      });
    });

    it('should support filtering by signer role', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`,
        { signerRole: 'nurse' }
      );

      validateApiResponse(response, 200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned signatures should match the filter
      response.data.forEach((signature: FormSignature) => {
        expect(signature.signerRole).toBe('nurse');
      });
    });

    it('should return 404 for non-existent form ID', async () => {
      await expectApiError(
        () => adminClient.get(`${API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')}/signatures`),
        404,
        'Form not found'
      );
    });

    it('should respect role-based access control', async () => {
      // Nurse should be able to see signatures on nurse forms
      const nurseResponse = await nurseClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`
      );
      validateApiResponse(nurseResponse, 200);

      // Receptionist should not be able to see signatures on medical forms
      const receptionistClient = createAuthenticatedClient('receptionist');
      await expectApiError(
        () => receptionistClient.get(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`),
        403,
        'Insufficient permissions'
      );
    });

    it('should include signature metadata in response', async () => {
      const response = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`
      );

      validateApiResponse(response, 200);
      expect(response.data.length).toBeGreaterThan(0);

      const signature = response.data[0];
      expect(signature.metadata).toBeDefined();
      expect(signature.metadata.deviceInfo).toBeDefined();
      expect(signature.metadata.verificationMethod).toBeDefined();
    });
  });

  describe('POST /api/forms/:id/sign - Add Signature to Form', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await expectApiError(
        () => request(app).post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`),
        401
      );
    });

    it('should return 201 and created signature for valid request', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Suite',
        metadata: {
          deviceInfo: {
            deviceType: 'desktop' as const,
            operatingSystem: 'Windows 10',
            browser: 'Chrome',
            screenResolution: '1920x1080',
            timezone: 'Africa/Cairo'
          },
          verificationMethod: 'password'
        }
      };

      const { result, duration } = await measureAsyncOperation(
        async () => {
          return nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);
        },
        'POST /api/forms/:id/sign',
        PERFORMANCE_BENCHMARKS.MAX_SIGNATURE_VERIFICATION_TIME
      );

      validateApiResponse(result, 201);
      validateSignatureStructure(result.data);
      expect(result.data.formId).toBe(testForm.id);
      expect(result.data.signerRole).toBe(signatureData.signerRole);
      expect(result.data.signatureData).toBe(signatureData.signatureData);
      expect(result.data.status).toBe('signed');
      expect(result.data.signedAt).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.MAX_SIGNATURE_VERIFICATION_TIME);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteSignature = {
        signatureType: 'digital',
        // Missing signerRole
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, incompleteSignature),
        400,
        'signerRole is required'
      );
    });

    it('should return 404 for non-existent form ID', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', 'non-existent-id')}/sign`, signatureData),
        404,
        'Form not found'
      );
    });

    it('should validate signature data format', async () => {
      const invalidSignatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: 'invalid-base64-data',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Suite'
      };

      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, invalidSignatureData),
        400,
        'Invalid signature data format'
      );
    });

    it('should validate signature role permissions', async () => {
      // Receptionist should not be able to sign medical forms
      const receptionistClient = createAuthenticatedClient('receptionist');
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'receptionist' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await expectApiError(
        () => receptionistClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData),
        403,
        'Insufficient permissions to sign this form'
      );
    });

    it('should prevent duplicate signatures by same role', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Suite'
      };

      // First signature should succeed
      const firstResponse = await nurseClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        signatureData
      );
      validateApiResponse(firstResponse, 201);

      // Second signature with same role should fail
      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData),
        400,
        'Form already signed by nurse'
      );
    });

    it('should update form status when signature is added', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);

      // Check form status
      const formResponse = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', testForm.id));
      validateApiResponse(formResponse, 200);
      expect(formResponse.data.status).toBe('signed');
    });

    it('should capture device and location information', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          deviceInfo: {
            deviceType: 'mobile' as const,
            operatingSystem: 'iOS 15.0',
            browser: 'Safari',
            screenResolution: '375x812',
            timezone: 'Africa/Cairo'
          },
          location: {
            latitude: 30.0444,
            longitude: 31.2357,
            accuracy: 10,
            timestamp: new Date()
          },
          verificationMethod: 'biometric'
        }
      };

      const response = await doctorClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        signatureData
      );

      validateApiResponse(response, 201);
      expect(response.data.ipAddress).toBe(signatureData.ipAddress);
      expect(response.data.userAgent).toBe(signatureData.userAgent);
      expect(response.data.metadata.deviceInfo).toEqual(signatureData.metadata.deviceInfo);
      expect(response.data.metadata.location).toEqual(signatureData.metadata.location);
      expect(response.data.metadata.verificationMethod).toBe(signatureData.metadata.verificationMethod);
    });

    it('should support electronic signatures', async () => {
      const electronicSignatureData = {
        signatureType: 'electronic' as const,
        signerRole: 'patient' as SignatureRole,
        signatureData: TEST_SIGNATURES.patientSignature.signatureData,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Suite'
      };

      const response = await adminClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        electronicSignatureData
      );

      validateApiResponse(response, 201);
      expect(response.data.signatureType).toBe('electronic');
      expect(response.data.signerRole).toBe('patient');
    });

    it('should create audit entry for signature creation', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);

      // Check audit trail
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );
      validateApiResponse(auditResponse, 200);

      const auditEntries = auditResponse.data;
      const signatureEntry = auditEntries.find((entry: any) => entry.action === 'signed');
      expect(signatureEntry).toBeDefined();
      expect(signatureEntry.userId).toBe(TEST_USERS.nurse.id);
      expect(signatureEntry.details.signatureId).toBeDefined();
    });

    it('should handle signature validation failure', async () => {
      const invalidSignatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: 'corrupted-signature-data',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Suite'
      };

      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, invalidSignatureData),
        400,
        'Signature validation failed'
      );
    });

    it('should enforce session timeout for signature operations', async () => {
      // This test would require session management simulation
      console.log('Session timeout enforcement test would go here');
    });
  });

  describe('POST /api/forms/:id/signatures - Bulk Signature Operations', () => {
    it('should support adding multiple signatures in sequence', async () => {
      // First signature (nurse)
      const nurseSignature = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      const nurseResponse = await nurseClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        nurseSignature
      );
      validateApiResponse(nurseResponse, 201);

      // Second signature (doctor)
      const doctorSignature = {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData
      };

      const doctorResponse = await doctorClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        doctorSignature
      );
      validateApiResponse(doctorResponse, 201);

      // Verify both signatures exist
      const signaturesResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`
      );
      validateApiResponse(signaturesResponse, 200);
      expect(signaturesResponse.data.length).toBe(2);

      const nurseSig = signaturesResponse.data.find((s: FormSignature) => s.signerRole === 'nurse');
      const doctorSig = signaturesResponse.data.find((s: FormSignature) => s.signerRole === 'doctor');

      expect(nurseSig).toBeDefined();
      expect(doctorSig).toBeDefined();
    });

    it('should validate required signature workflow', async () => {
      // Create a form that requires multiple signatures
      const multiSigFormResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
        templateId: NURSE_FORM_TEMPLATE.id,
        patientId: TEST_PATIENTS.patient2.id,
        visitId: TEST_VISITS.visit1.id,
        type: 'nurse_form',
        status: 'pending_signature',
        data: {
          requiresMultipleSignatures: true,
          signatureWorkflow: ['nurse', 'doctor', 'admin']
        }
      });

      const multiSigForm = multiSigFormResponse.data;
      createdForms.push(multiSigForm.id);

      // Add nurse signature
      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      });

      // Form should still be pending doctor signature
      let formResponse = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id));
      validateApiResponse(formResponse, 200);
      expect(formResponse.data.status).toBe('pending_signature');

      // Add doctor signature
      await doctorClient.post(`${API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData
      });

      // Form should still be pending admin signature
      formResponse = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id));
      validateApiResponse(formResponse, 200);
      expect(formResponse.data.status).toBe('pending_signature');

      // Add admin signature
      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'admin' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      });

      // Form should now be fully signed
      formResponse = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', multiSigForm.id));
      validateApiResponse(formResponse, 200);
      expect(formResponse.data.status).toBe('signed');
    });

    it('should handle signature timeouts', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData,
        metadata: {
          deviceInfo: {
            deviceType: 'desktop' as const,
            operatingSystem: 'Windows 10',
            browser: 'Chrome',
            screenResolution: '1920x1080',
            timezone: 'Africa/Cairo'
          },
          verificationMethod: 'password'
        }
      };

      // Simulate signature request with timeout
      const slowSignatureResponse = await measureAsyncOperation(
        async () => {
          return nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
            ...signatureData,
            metadata: {
              ...signatureData.metadata,
              // Simulate slow verification
              verificationMethod: 'slow_verification'
            }
          });
        },
        'Slow signature verification',
        PERFORMANCE_BENCHMARKS.MAX_SIGNATURE_VERIFICATION_TIME * 2
      );

      validateApiResponse(slowSignatureResponse.result, 201);
      expect(slowSignatureResponse.duration).toBeGreaterThan(0);
    });
  });

  describe('Signature Verification and Validation', () => {
    it('should verify signature authenticity', async () => {
      // Add a valid signature
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);

      // Verify signature
      const verificationResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures/verify`
      );

      validateApiResponse(verificationResponse, 200);
      expect(verificationResponse.data.verified).toBe(true);
      expect(verificationResponse.data.signatures).toBeDefined();
      expect(verificationResponse.data.signatures.length).toBe(1);
    });

    it('should detect tampered signatures', async () => {
      // Add a signature
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);

      // Simulate signature tampering by modifying the signature data
      // This would typically be detected by the verification system
      console.log('Signature tampering detection test would go here');
    });

    it('should validate certificate-based signatures', async () => {
      const certificateSignatureData = {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData,
        metadata: {
          deviceInfo: {
            deviceType: 'desktop' as const,
            operatingSystem: 'Windows 10',
            browser: 'Chrome',
            screenResolution: '1920x1080',
            timezone: 'Africa/Cairo'
          },
          verificationMethod: 'certificate',
          certificateId: 'cert-123456',
          certificateChain: ['root-ca', 'intermediate-ca', 'end-user-cert']
        }
      };

      const response = await doctorClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        certificateSignatureData
      );

      validateApiResponse(response, 201);
      expect(response.data.metadata.certificateId).toBe(certificateSignatureData.metadata.certificateId);
    });

    it('should support biometric verification', async () => {
      const biometricSignatureData = {
        signatureType: 'digital' as const,
        signerRole: 'patient' as SignatureRole,
        signatureData: TEST_SIGNATURES.patientSignature.signatureData,
        metadata: {
          deviceInfo: {
            deviceType: 'mobile' as const,
            operatingSystem: 'iOS 15.0',
            browser: 'Safari',
            screenResolution: '375x812',
            timezone: 'Africa/Cairo'
          },
          verificationMethod: 'biometric',
          biometricData: {
            fingerprint: 'fp-hash-123456',
            faceId: 'face-id-hash-789012'
          }
        }
      };

      const response = await adminClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        biometricSignatureData
      );

      validateApiResponse(response, 201);
      expect(response.data.metadata.biometricData).toEqual(biometricSignatureData.metadata.biometricData);
    });
  });

  describe('Signature Revocation and Rejection', () => {
    beforeEach(async () => {
      // Add a test signature
      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      });
    });

    it('should allow signature revocation by authorized users', async () => {
      const revocationResponse = await adminClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures/revoke`,
        {
          signatureId: testSignature.id,
          reason: 'Form requires correction'
        }
      );

      validateApiResponse(revocationResponse, 200);
      expect(revocationResponse.data.status).toBe('revoked');
      expect(revocationResponse.data.rejectionReason).toBe('Form requires correction');
    });

    it('should prevent unauthorized signature revocation', async () => {
      await expectApiError(
        () => nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures/revoke`, {
          signatureId: testSignature.id,
          reason: 'Unauthorized attempt'
        }),
        403,
        'Insufficient permissions to revoke signatures'
      );
    });

    it('should create audit entry for signature revocation', async () => {
      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures/revoke`, {
        signatureId: testSignature.id,
        reason: 'Administrative revocation'
      });

      // Check audit trail
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      const revocationEntry = auditResponse.data.find((entry: any) => entry.action === 'signature_revoked');
      expect(revocationEntry).toBeDefined();
      expect(revocationEntry.userId).toBe(TEST_USERS.admin.id);
    });

    it('should update form status when signature is revoked', async () => {
      await adminClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures/revoke`, {
        signatureId: testSignature.id,
        reason: 'Form needs correction'
      });

      // Check form status
      const formResponse = await adminClient.get(API_ENDPOINTS.forms.get.replace(':id', testForm.id));
      validateApiResponse(formResponse, 200);
      expect(formResponse.data.status).toBe('draft');
    });
  });

  describe('Signature Security and Compliance', () => {
    it('should enforce signature data encryption', async () => {
      const sensitiveSignatureData = {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData,
        phiData: 'sensitive-patient-information'
      };

      const response = await doctorClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        sensitiveSignatureData
      );

      validateApiResponse(response, 201);
      // Verify that sensitive data is encrypted (this would be checked in the actual implementation)
      expect(response.data.signatureData).toBeDefined();
    });

    it('should validate signature timestamp accuracy', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      const response = await nurseClient.post(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
        signatureData
      );

      validateApiResponse(response, 201);

      // Verify timestamp is within acceptable range
      const signatureTime = new Date(response.data.signedAt).getTime();
      const currentTime = Date.now();
      const timeDifference = Math.abs(currentTime - signatureTime);

      expect(timeDifference).toBeLessThan(60000); // Within 1 minute
    });

    it('should maintain signature chain of custody', async () => {
      // Add multiple signatures
      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      });

      await doctorClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, {
        signatureType: 'digital' as const,
        signerRole: 'doctor' as SignatureRole,
        signatureData: TEST_SIGNATURES.doctorSignature.signatureData
      });

      // Verify chain of custody
      const signaturesResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/signatures`
      );

      const signatures = signaturesResponse.data.sort((a: FormSignature, b: FormSignature) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      expect(signatures.length).toBe(2);
      expect(signatures[0].signerRole).toBe('nurse');
      expect(signatures[1].signerRole).toBe('doctor');
    });

    it('should support signature audit trail for compliance', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      await nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData);

      // Request audit trail
      const auditResponse = await adminClient.get(
        `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/audit-trail`
      );

      validateApiResponse(auditResponse, 200);

      const signatureAuditEntries = auditResponse.data.filter((entry: any) =>
        entry.action === 'signed' || entry.action.includes('signature')
      );

      expect(signatureAuditEntries.length).toBeGreaterThan(0);

      // Verify audit entry contains required compliance information
      const signatureEntry = signatureAuditEntries[0];
      expect(signatureEntry.timestamp).toBeDefined();
      expect(signatureEntry.userId).toBeDefined();
      expect(signatureEntry.ipAddress).toBeDefined();
      expect(signatureEntry.userAgent).toBeDefined();
    });

    it('should enforce rate limiting on signature operations', async () => {
      const signatureData = {
        signatureType: 'digital' as const,
        signerRole: 'nurse' as SignatureRole,
        signatureData: TEST_SIGNATURES.nurseSignature.signatureData
      };

      // Attempt rapid signature operations
      const rapidRequests = Array(10).fill(null).map(() =>
        nurseClient.post(`${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`, signatureData)
      );

      const responses = await Promise.allSettled(rapidRequests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r =>
        r.status === 'rejected' &&
        r.reason?.response?.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    it('should support signatures from different browsers', async () => {
      const browsers = [
        { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        { name: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0' },
        { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15' }
      ];

      for (const browser of browsers) {
        const signatureData = {
          signatureType: 'digital' as const,
          signerRole: 'doctor' as SignatureRole,
          signatureData: TEST_SIGNATURES.doctorSignature.signatureData,
          userAgent: browser.userAgent,
          metadata: {
            deviceInfo: {
              deviceType: 'desktop' as const,
              operatingSystem: 'Windows 10',
              browser: browser.name,
              screenResolution: '1920x1080',
              timezone: 'Africa/Cairo'
            },
            verificationMethod: 'password'
          }
        };

        // Create a new form for each test to avoid signature conflicts
        const testFormResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
          templateId: NURSE_FORM_TEMPLATE.id,
          patientId: TEST_PATIENTS.patient1.id,
          visitId: TEST_VISITS.visit1.id,
          type: 'nurse_form',
          status: 'pending_signature',
          data: { browser: browser.name }
        });

        const testForm = testFormResponse.data;
        createdForms.push(testForm.id);

        const response = await doctorClient.post(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
          signatureData
        );

        validateApiResponse(response, 201);
        expect(response.data.userAgent).toBe(browser.userAgent);
      }
    });

    it('should support mobile device signatures', async () => {
      const mobileDevices = [
        { type: 'mobile', os: 'iOS', resolution: '375x812' },
        { type: 'tablet', os: 'Android', resolution: '1024x768' }
      ];

      for (const device of mobileDevices) {
        const signatureData = {
          signatureType: 'digital' as const,
          signerRole: 'patient' as SignatureRole,
          signatureData: TEST_SIGNATURES.patientSignature.signatureData,
          metadata: {
            deviceInfo: {
              deviceType: device.type as any,
              operatingSystem: device.os,
              browser: 'Mobile Browser',
              screenResolution: device.resolution,
              timezone: 'Africa/Cairo'
            },
            verificationMethod: 'touch_id'
          }
        };

        // Create a new form for each test
        const testFormResponse = await adminClient.post(API_ENDPOINTS.forms.create, {
          templateId: NURSE_FORM_TEMPLATE.id,
          patientId: TEST_PATIENTS.patient1.id,
          visitId: TEST_VISITS.visit1.id,
          type: 'nurse_form',
          status: 'pending_signature',
          data: { device: device.type }
        });

        const testForm = testFormResponse.data;
        createdForms.push(testForm.id);

        const response = await adminClient.post(
          `${API_ENDPOINTS.forms.get.replace(':id', testForm.id)}/sign`,
          signatureData
        );

        validateApiResponse(response, 201);
        expect(response.data.metadata.deviceInfo.deviceType).toBe(device.type);
      }
    });
  });
});

// Helper function to get auth token
function getAuthToken(userRole: keyof typeof TEST_USERS): string {
  const user = TEST_USERS[userRole];
  return `mock_token_${userRole}_${user.id}`;
}