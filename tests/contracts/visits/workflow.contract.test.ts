import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { VisitTestSetup } from './setup';
import { VisitTestUtils } from './utils';
import {
  VALID_CHECK_IN_REQUESTS,
  INVALID_CHECK_IN_REQUESTS,
  VALID_CHECK_OUT_REQUESTS,
  INVALID_CHECK_OUT_REQUESTS,
  MOCK_PATIENTS,
  MOCK_USERS,
  SAMPLE_EXISTING_VISITS
} from './fixtures';
import {
  Visit,
  VisitCreateRequest,
  VisitCheckInRequest,
  VisitCheckOutRequest,
  VisitStatus,
  VisitPriority,
  VisitType,
  VisitOutcome
} from './types';

describe('Visit Workflow Management - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let nurseAuthToken: string;
  let adminAuthToken: string;
  let createdVisitId: string;
  let testPatientId: string;

  beforeAll(async () => {
    await VisitTestSetup.initialize();
    app = VisitTestSetup.getApp();
  });

  afterAll(async () => {
    await VisitTestSetup.cleanup();
  });

  beforeEach(async () => {
    // Authenticate with different roles
    const doctorAuth = await VisitTestSetup.authenticateUser('doctor_smith', 'password123');
    if (doctorAuth) {
      authToken = doctorAuth.accessToken;
    }

    const nurseAuth = await VisitTestSetup.authenticateUser('nurse_johnson', 'password123');
    if (nurseAuth) {
      nurseAuthToken = nurseAuth.accessToken;
    }

    const adminAuth = await VisitTestSetup.authenticateUser('admin_williams', 'password123');
    if (adminAuth) {
      adminAuthToken = adminAuth.accessToken;
    }

    // Create a test patient for visit testing
    if (authToken) {
      const testPatient = await VisitTestSetup.createTestPatient({
        firstName: 'Workflow',
        lastName: 'TestPatient',
        nationalId: '98765432109876',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        phone: '+201555123456',
        email: 'workflow.test@example.com',
        address: '789 Workflow Street, Giza, Egypt'
      }, authToken);
      testPatientId = testPatient.id;
    }
  });

  afterEach(async () => {
    // Clean up specific test data
    if (createdVisitId) {
      try {
        await VisitTestUtils.deleteVisit(createdVisitId, authToken);
      } catch (error) {
        // Visit might already be deleted
      }
      createdVisitId = '';
    }
  });

  describe('POST /api/visits/:id/check-in - Check In Patient', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping test - no created visit');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/${createdVisitId}/check-in`, 'post');
    });

    it('should return 200 and check in patient for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a scheduled visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for check-in',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED,
        scheduledDateTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      const checkInData: VisitCheckInRequest = {
        notes: 'Patient arrived on time, vitals stable',
        vitals: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 36.5,
          weight: 70,
          height: 175
        }
      };

      const response = await VisitTestUtils.checkInVisit(createdVisitId, checkInData, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visit');

      const visit = response.body.data.visit;
      VisitTestUtils.validateVisitResponse(visit);
      expect(visit.status).toBe(VisitStatus.CHECKED_IN);
      expect(visit.checkInDateTime).toBeDefined();
      expect(new Date(visit.checkInDateTime).toString()).not.toBe('Invalid Date');
    });

    it('should automatically record check-in timestamp', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a scheduled visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for automatic timestamp',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;
      const beforeCheckIn = new Date();

      // Check in the patient
      await VisitTestUtils.checkInVisit(createdVisitId, {
        notes: 'Patient checked in'
      }, authToken);

      // Get the updated visit
      const getResponse = await VisitTestUtils.getVisit(createdVisitId, authToken);
      const checkInTime = new Date(getResponse.body.data.visit.checkInDateTime);

      expect(checkInTime.getTime()).toBeGreaterThanOrEqual(beforeCheckIn.getTime() - 1000);
      expect(checkInTime.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
    });

    VALID_CHECK_IN_REQUESTS.forEach((checkInData, index) => {
      it(`should check in patient with valid data set ${index + 1}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create a scheduled visit
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for check-in ${index + 1}`,
          priority: VisitPriority.MEDIUM,
          status: VisitStatus.SCHEDULED
        }, authToken);

        createdVisitId = createResponse.body.data.visit.id;

        const response = await VisitTestUtils.checkInVisit(createdVisitId, checkInData, authToken);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.visit.status).toBe(VisitStatus.CHECKED_IN);
      });
    });

    INVALID_CHECK_IN_REQUESTS.forEach((testCase, index) => {
      it(`should return 400 for invalid check-in data - ${testCase.description}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create a scheduled visit
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for invalid check-in ${index + 1}`,
          priority: VisitPriority.MEDIUM,
          status: VisitStatus.SCHEDULED
        }, authToken);

        const visitId = createResponse.body.data.visit.id;

        const response = await VisitTestUtils.checkInVisit(visitId, testCase.data, authToken);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);

        // Clean up
        await VisitTestUtils.deleteVisit(visitId, authToken);
      });
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await VisitTestUtils.checkInVisit(nonExistentId, {}, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should prevent check-in for visits that are not scheduled or pending', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit that's already completed
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for invalid check-in status',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.COMPLETED
      }, authToken);

      const visitId = createResponse.body.data.visit.id;

      const response = await VisitTestUtils.checkInVisit(visitId, {}, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot check in');

      // Clean up
      await VisitTestUtils.deleteVisit(visitId, authToken);
    });

    it('should support role-based access for check-in', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      // Test that both nurse and doctor can check in patients
      for (const token of [nurseAuthToken, authToken]) {
        if (token) {
          // Create a scheduled visit
          const createResponse = await VisitTestUtils.createVisit({
            patientId: testPatientId,
            visitType: VisitType.INITIAL,
            reasonForVisit: 'Test visit for role-based check-in',
            priority: VisitPriority.MEDIUM,
            status: VisitStatus.SCHEDULED
          }, token);

          const visitId = createResponse.body.data.visit.id;

          const response = await VisitTestUtils.checkInVisit(visitId, {}, token);
          expect(response.status).toBe(200);

          // Clean up
          await VisitTestUtils.deleteVisit(visitId, token);
        }
      }
    });

    it('should validate vitals data when provided', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a scheduled visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for vitals validation',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Test with valid vitals
      const validVitals = {
        vitals: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98
        }
      };

      const response = await VisitTestUtils.checkInVisit(createdVisitId, validVitals, authToken);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/visits/:id/check-out - Check Out Patient', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping test - no created visit');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/${createdVisitId}/check-out`, 'post');
    });

    it('should return 200 and check out patient for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create and check in a visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for check-out',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Check in the patient first
      await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);

      const checkOutData = {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        dischargeInstructions: 'Continue medication as prescribed. Return if symptoms worsen.',
        notes: 'Patient discharged in stable condition'
      };

      const response = await VisitTestUtils.checkOutVisit(createdVisitId, checkOutData, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visit');

      const visit = response.body.data.visit;
      VisitTestUtils.validateVisitResponse(visit);
      expect(visit.status).toBe(VisitStatus.COMPLETED);
      expect(visit.checkOutDateTime).toBeDefined();
      expect(new Date(visit.checkOutDateTime).toString()).not.toBe('Invalid Date');
    });

    it('should automatically record check-out timestamp', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create and check in a visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for automatic checkout timestamp',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Check in the patient first
      await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);
      const beforeCheckOut = new Date();

      // Check out the patient
      await VisitTestUtils.checkOutVisit(createdVisitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);

      // Get the updated visit
      const getResponse = await VisitTestUtils.getVisit(createdVisitId, authToken);
      const checkOutTime = new Date(getResponse.body.data.visit.checkOutDateTime);

      expect(checkOutTime.getTime()).toBeGreaterThanOrEqual(beforeCheckOut.getTime() - 1000);
      expect(checkOutTime.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
    });

    VALID_CHECK_OUT_REQUESTS.forEach((checkOutData, index) => {
      it(`should check out patient with valid data set ${index + 1}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create and check in a visit
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for check-out ${index + 1}`,
          priority: VisitPriority.MEDIUM,
          status: VisitStatus.SCHEDULED
        }, authToken);

        const visitId = createResponse.body.data.visit.id;

        // Check in the patient first
        await VisitTestUtils.checkInVisit(visitId, {}, authToken);

        const response = await VisitTestUtils.checkOutVisit(visitId, checkOutData, authToken);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.visit.status).toBe(VisitStatus.COMPLETED);

        // Clean up
        await VisitTestUtils.deleteVisit(visitId, authToken);
      });
    });

    INVALID_CHECK_OUT_REQUESTS.forEach((testCase, index) => {
      it(`should return 400 for invalid check-out data - ${testCase.description}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create and check in a visit
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for invalid check-out ${index + 1}`,
          priority: VisitPriority.MEDIUM,
          status: VisitStatus.SCHEDULED
        }, authToken);

        const visitId = createResponse.body.data.visit.id;

        // Check in the patient first
        await VisitTestUtils.checkInVisit(visitId, {}, authToken);

        const response = await VisitTestUtils.checkOutVisit(visitId, testCase.data, authToken);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);

        // Clean up
        await VisitTestUtils.deleteVisit(visitId, authToken);
      });
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await VisitTestUtils.checkOutVisit(nonExistentId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should prevent check-out for visits that are not checked in', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit that's still scheduled
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for invalid check-out status',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      const visitId = createResponse.body.data.visit.id;

      const response = await VisitTestUtils.checkOutVisit(visitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot check out');

      // Clean up
      await VisitTestUtils.deleteVisit(visitId, authToken);
    });

    it('should require doctor or higher privileges for check-out', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      // Create and check in a visit with nurse token
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for check-out permissions',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, nurseAuthToken);

      const visitId = createResponse.body.data.visit.id;

      // Check in with nurse token
      await VisitTestUtils.checkInVisit(visitId, {}, nurseAuthToken);

      // Try to check out with nurse token (should be denied)
      const nurseResponse = await VisitTestUtils.checkOutVisit(visitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, nurseAuthToken);
      expect(nurseResponse.status).toBeGreaterThanOrEqual(400);

      // Check out with doctor token (should succeed)
      const doctorResponse = await VisitTestUtils.checkOutVisit(visitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);
      expect(doctorResponse.status).toBe(200);

      // Clean up
      await VisitTestUtils.deleteVisit(visitId, authToken);
    });

    it('should validate follow-up date is in the future when required', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create and check in a visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for follow-up date validation',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Check in the patient first
      await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);

      // Test with past follow-up date
      const invalidCheckOut = {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: true,
        followUpDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const response = await VisitTestUtils.checkOutVisit(createdVisitId, invalidCheckOut, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Visit Status Transition Workflow', () => {
    it('should support complete visit lifecycle: pending -> scheduled -> checked_in -> in_progress -> completed', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit in pending status
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for complete lifecycle',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.PENDING
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Transition to scheduled
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.PENDING,
        VisitStatus.SCHEDULED,
        true,
        authToken
      );

      // Check in (automatic transition to checked_in)
      const checkInResponse = await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);
      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.data.visit.status).toBe(VisitStatus.CHECKED_IN);

      // Transition to in_progress
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.CHECKED_IN,
        VisitStatus.IN_PROGRESS,
        true,
        authToken
      );

      // Check out (automatic transition to completed)
      const checkOutResponse = await VisitTestUtils.checkOutVisit(createdVisitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);
      expect(checkOutResponse.status).toBe(200);
      expect(checkOutResponse.body.data.visit.status).toBe(VisitStatus.COMPLETED);
    });

    it('should support emergency visit workflow', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create an emergency visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.EMERGENCY,
        reasonForVisit: 'Chest pain and shortness of breath',
        priority: VisitPriority.URGENT,
        status: VisitStatus.PENDING
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Emergency visits should go directly to in_progress
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.PENDING,
        VisitStatus.IN_PROGRESS,
        true,
        authToken
      );

      // Then proceed to completed
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.IN_PROGRESS,
        VisitStatus.COMPLETED,
        true,
        authToken
      );
    });

    it('should support visit cancellation workflow', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a scheduled visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for cancellation',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Cancel the visit
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.SCHEDULED,
        VisitStatus.CANCELLED,
        true,
        authToken
      );

      // Should not be able to check in a cancelled visit
      const checkInResponse = await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);
      expect(checkInResponse.status).toBe(400);
    });

    it('should support no-show workflow', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a scheduled visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for no-show',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED,
        scheduledDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Mark as no-show
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.SCHEDULED,
        VisitStatus.NO_SHOW,
        true,
        authToken
      );

      // Should not be able to check in a no-show visit
      const checkInResponse = await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);
      expect(checkInResponse.status).toBe(400);
    });

    it('should prevent invalid status transitions', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Test various invalid transitions
      const invalidTransitions = [
        { from: VisitStatus.COMPLETED, to: VisitStatus.IN_PROGRESS },
        { from: VisitStatus.CANCELLED, to: VisitStatus.IN_PROGRESS },
        { from: VisitStatus.NO_SHOW, to: VisitStatus.CHECKED_IN },
        { from: VisitStatus.PENDING, to: VisitStatus.COMPLETED }
      ];

      for (const transition of invalidTransitions) {
        // Create a visit with the starting status
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for invalid transition from ${transition.from}`,
          priority: VisitPriority.MEDIUM,
          status: transition.from
        }, authToken);

        const visitId = createResponse.body.data.visit.id;

        // Attempt invalid transition
        await VisitTestUtils.testStatusTransition(
          visitId,
          transition.from,
          transition.to,
          false,
          authToken
        );

        // Clean up
        await VisitTestUtils.deleteVisit(visitId, authToken);
      }
    });

    it('should maintain visit timeline throughout workflow', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for timeline tracking',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED,
        scheduledDateTime: new Date(Date.now() + 15 * 60 * 1000)
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;
      const createdAt = new Date(createResponse.body.data.visit.createdAt);

      // Check in the patient
      await VisitTestUtils.checkInVisit(createdVisitId, {}, authToken);
      const getAfterCheckIn = await VisitTestUtils.getVisit(createdVisitId, authToken);
      const checkInTime = new Date(getAfterCheckIn.body.data.visit.checkInDateTime);

      // Start the visit
      await VisitTestUtils.updateVisit(createdVisitId, { status: VisitStatus.IN_PROGRESS }, authToken);

      // Check out the patient
      await VisitTestUtils.checkOutVisit(createdVisitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);

      const getAfterCheckOut = await VisitTestUtils.getVisit(createdVisitId, authToken);
      const checkOutTime = new Date(getAfterCheckOut.body.data.visit.checkOutDateTime);

      // Verify timeline is logical
      expect(createdAt.getTime()).toBeLessThanOrEqual(checkInTime.getTime());
      expect(checkInTime.getTime()).toBeLessThanOrEqual(checkOutTime.getTime());
    });

    it('should support workflow with different user roles', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      // Create a visit with nurse
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for multi-role workflow',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.SCHEDULED
      }, nurseAuthToken);

      const visitId = createResponse.body.data.visit.id;

      // Nurse can check in
      await VisitTestUtils.checkInVisit(visitId, {}, nurseAuthToken);

      // Doctor can start the visit
      await VisitTestUtils.updateVisit(visitId, { status: VisitStatus.IN_PROGRESS }, authToken);

      // Doctor can check out
      await VisitTestUtils.checkOutVisit(visitId, {
        outcome: VisitOutcome.DISCHARGED,
        followUpRequired: false
      }, authToken);

      // Verify final status
      const finalResponse = await VisitTestUtils.getVisit(visitId, authToken);
      expect(finalResponse.body.data.visit.status).toBe(VisitStatus.COMPLETED);

      // Clean up
      await VisitTestUtils.deleteVisit(visitId, authToken);
    });
  });

  describe('GET /api/visits/upcoming - Get Upcoming Visits', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await VisitTestUtils.testAuthentication('/api/visits/upcoming', 'get');
    });

    it('should return 200 and list upcoming visits', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const response = await VisitTestUtils.getUpcomingVisits(authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visits');
      expect(Array.isArray(response.body.data.visits)).toBe(true);

      // All returned visits should be upcoming
      response.body.data.visits.forEach((visit: Visit) => {
        expect(visit.status).toBe(VisitStatus.SCHEDULED);
        if (visit.scheduledDateTime) {
          expect(new Date(visit.scheduledDateTime).getTime()).toBeGreaterThan(Date.now());
        }
      });
    });

    it('should categorize upcoming visits by time period', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const response = await VisitTestUtils.getUpcomingVisits(authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('today');
      expect(response.body.data).toHaveProperty('tomorrow');
      expect(response.body.data).toHaveProperty('thisWeek');
      expect(response.body.data).toHaveProperty('nextWeek');
      expect(response.body.data).toHaveProperty('overdue');

      expect(Array.isArray(response.body.data.today)).toBe(true);
      expect(Array.isArray(response.body.data.tomorrow)).toBe(true);
      expect(Array.isArray(response.body.data.thisWeek)).toBe(true);
      expect(Array.isArray(response.body.data.nextWeek)).toBe(true);
      expect(Array.isArray(response.body.data.overdue)).toBe(true);
    });

    it('should support role-based filtering for upcoming visits', async () => {
      if (!authToken || !nurseAuthToken) {
        console.log('Skipping test - no auth tokens');
        return;
      }

      // Test with doctor token
      const doctorResponse = await VisitTestUtils.getUpcomingVisits(authToken);
      expect(doctorResponse.status).toBe(200);

      // Test with nurse token
      const nurseResponse = await VisitTestUtils.getUpcomingVisits(nurseAuthToken);
      expect(nurseResponse.status).toBe(200);

      // Results might differ based on role, but both should succeed
    });
  });

  describe('GET /api/visits/patient/:patientId - Get Patient Visits', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/patient/${testPatientId}`, 'get');
    });

    it('should return 200 and list visits for specific patient', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create some visits for the test patient
      const visit1 = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First test visit',
        priority: VisitPriority.MEDIUM
      }, authToken);

      const visit2 = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Follow-up visit',
        priority: VisitPriority.LOW
      }, authToken);

      const response = await VisitTestUtils.getPatientVisits(testPatientId, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visits');
      expect(Array.isArray(response.body.data.visits)).toBe(true);

      // All returned visits should belong to the test patient
      response.body.data.visits.forEach((visit: Visit) => {
        expect(visit.patientId).toBe(testPatientId);
      });

      // Should include the visits we just created
      const visitIds = response.body.data.visits.map((v: Visit) => v.id);
      expect(visitIds).toContain(visit1.body.data.visit.id);
      expect(visitIds).toContain(visit2.body.data.visit.id);

      // Clean up
      await VisitTestUtils.deleteVisit(visit1.body.data.visit.id, authToken);
      await VisitTestUtils.deleteVisit(visit2.body.data.visit.id, authToken);
    });

    it('should return 404 for non-existent patient', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const nonExistentPatientId = '00000000-0000-0000-0000-000000000000';
      const response = await VisitTestUtils.getPatientVisits(nonExistentPatientId, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return empty array for patient with no visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a new patient with no visits
      const newPatient = await VisitTestSetup.createTestPatient({
        firstName: 'No',
        lastName: 'Visits',
        nationalId: '12345678900000',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+201000000000',
        email: 'no.visits@example.com',
        address: '123 No Visit Street'
      }, authToken);

      const response = await VisitTestUtils.getPatientVisits(newPatient.id, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visits).toHaveLength(0);

      // Clean up
      await VisitTestUtils.deleteVisit(newPatient.id, authToken);
    });
  });
});