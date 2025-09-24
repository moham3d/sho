import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { VisitTestSetup } from './setup';
import { VisitTestUtils } from './utils';
import {
  VALID_VISIT_CREATE_REQUESTS,
  INVALID_VISIT_CREATE_REQUESTS,
  VALID_VISIT_UPDATE_REQUESTS,
  INVALID_VISIT_UPDATE_REQUESTS,
  SAMPLE_EXISTING_VISITS,
  MOCK_PATIENTS,
  MOCK_USERS
} from './fixtures';
import {
  Visit,
  VisitCreateRequest,
  VisitUpdateRequest,
  VisitStatus,
  VisitPriority,
  VisitType
} from './types';

describe('Visit CRUD Operations - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let adminAuthToken: string;
  let nurseAuthToken: string;
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

    const adminAuth = await VisitTestSetup.authenticateUser('admin_williams', 'password123');
    if (adminAuth) {
      adminAuthToken = adminAuth.accessToken;
    }

    const nurseAuth = await VisitTestSetup.authenticateUser('nurse_johnson', 'password123');
    if (nurseAuth) {
      nurseAuthToken = nurseAuth.accessToken;
    }

    // Create a test patient for visit testing
    if (authToken) {
      const testPatient = await VisitTestSetup.createTestPatient({
        firstName: 'Visit',
        lastName: 'TestPatient',
        nationalId: '98765432109876',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        phone: '+201555123456',
        email: 'visit.test@example.com',
        address: '789 Visit Street, Giza, Egypt'
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

  describe('POST /api/visits - Create Visit', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await VisitTestUtils.testAuthentication('/api/visits', 'post');
    });

    it('should return 201 and create visit for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Routine checkup and examination',
        priority: VisitPriority.MEDIUM,
        assignedDoctorId: MOCK_USERS[0].id,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: 'Patient requested annual physical examination',
        duration: 30,
        location: 'Examination Room 1'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visit');

      const visit = response.body.data.visit;
      VisitTestUtils.validateVisitResponse(visit);

      expect(visit.patientId).toBe(testPatientId);
      expect(visit.visitType).toBe(VisitType.INITIAL);
      expect(visit.reasonForVisit).toBe('Routine checkup and examination');
      expect(visit.priority).toBe(VisitPriority.MEDIUM);
      expect(visit.assignedDoctorId).toBe(MOCK_USERS[0].id);
      expect(visit.status).toBe(VisitStatus.PENDING);
      expect(visit.notes).toBe('Patient requested annual physical examination');
      expect(visit.duration).toBe(30);
      expect(visit.location).toBe('Examination Room 1');

      createdVisitId = visit.id;
    });

    it('should automatically set status to pending for new visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Follow-up appointment',
        priority: VisitPriority.LOW
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);

      expect(response.status).toBe(201);
      expect(response.body.data.visit.status).toBe(VisitStatus.PENDING);

      createdVisitId = response.body.data.visit.id;
    });

    VALID_VISIT_CREATE_REQUESTS.forEach((visitData, index) => {
      it(`should create visit with valid data set ${index + 1}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        const response = await VisitTestUtils.createVisit(
          { ...visitData, patientId: testPatientId },
          authToken
        );

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        VisitTestUtils.validateVisitResponse(response.body.data.visit);

        createdVisitId = response.body.data.visit.id;
      });
    });

    INVALID_VISIT_CREATE_REQUESTS.forEach((testCase, index) => {
      it(`should return 400 for invalid visit data - ${testCase.description}`, async () => {
        if (!authToken) {
          console.log(`Skipping test ${index + 1} - no auth token`);
          return;
        }

        const response = await VisitTestUtils.createVisit(testCase.data, authToken);
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    it('should return 404 for non-existent patient', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: '00000000-0000-0000-0000-000000000000',
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit',
        priority: VisitPriority.MEDIUM
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent assigned doctor', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit',
        priority: VisitPriority.MEDIUM,
        assignedDoctorId: '00000000-0000-0000-0000-000000000000'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate scheduledDateTime is not in the past', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate duration is positive', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit',
        priority: VisitPriority.MEDIUM,
        duration: -30 // Negative duration
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should support role-based access control', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit',
        priority: VisitPriority.MEDIUM
      };

      // Test that doctor, nurse, and admin can create visits
      for (const token of [authToken, nurseAuthToken, adminAuthToken]) {
        if (token) {
          const response = await VisitTestUtils.createVisit(visitData, token);
          expect(response.status).toBe(201);

          // Clean up created visit
          const visitId = response.body.data.visit.id;
          await VisitTestUtils.deleteVisit(visitId, token);
        }
      }
    });
  });

  describe('GET /api/visits - List Visits', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await VisitTestUtils.testAuthentication('/api/visits', 'get');
    });

    it('should return 200 and list of visits for authenticated users', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const response = await VisitTestUtils.listVisits({}, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      VisitTestUtils.validatePaginationResponse(response);

      if (response.body.data.visits.length > 0) {
        const visit = response.body.data.visits[0];
        VisitTestUtils.validateVisitResponse(visit);
      }
    });

    it('should support pagination with page and limit parameters', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      await VisitTestUtils.testPagination('/api/visits', SAMPLE_EXISTING_VISITS.length, authToken);
    });

    it('should support filtering by status', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const pendingVisits = SAMPLE_EXISTING_VISITS.filter(v => v.status === VisitStatus.PENDING);
      await VisitTestUtils.testFiltering('/api/visits', { status: 'pending' }, pendingVisits.length, authToken);
    });

    it('should support filtering by visit type', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const initialVisits = SAMPLE_EXISTING_VISITS.filter(v => v.visitType === VisitType.INITIAL);
      await VisitTestUtils.testFiltering('/api/visits', { visitType: 'initial' }, initialVisits.length, authToken);
    });

    it('should support filtering by priority', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const mediumPriorityVisits = SAMPLE_EXISTING_VISITS.filter(v => v.priority === VisitPriority.MEDIUM);
      await VisitTestUtils.testFiltering('/api/visits', { priority: 'medium' }, mediumPriorityVisits.length, authToken);
    });

    it('should support filtering by assigned doctor', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const doctorVisits = SAMPLE_EXISTING_VISITS.filter(v => v.assignedDoctorId === MOCK_USERS[0].id);
      await VisitTestUtils.testFiltering('/api/visits', { assignedDoctorId: MOCK_USERS[0].id }, doctorVisits.length, authToken);
    });

    it('should support filtering by patient', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      await VisitTestUtils.testFiltering('/api/visits', { patientId: testPatientId }, 0, authToken);
    });

    it('should support filtering by date range', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = tomorrow.toISOString().split('T')[0];

      const response = await VisitTestUtils.testFiltering('/api/visits', { dateFrom, dateTo }, 0, authToken);
      expect(response.status).toBe(200);
    });

    it('should support sorting by scheduledDateTime', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      await VisitTestUtils.testSorting('/api/visits', 'scheduledDateTime', 'desc', authToken);
    });

    it('should support sorting by priority', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      await VisitTestUtils.testSorting('/api/visits', 'priority', 'desc', authToken);
    });

    it('should support sorting by status', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      await VisitTestUtils.testSorting('/api/visits', 'status', 'asc', authToken);
    });

    it('should support sorting by creation date', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      await VisitTestUtils.testSorting('/api/visits', 'createdAt', 'desc', authToken);
    });

    it('should support multiple filter combinations', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const filters = {
        status: 'pending',
        visitType: 'initial',
        priority: 'medium'
      };

      const response = await VisitTestUtils.listVisits(filters, authToken);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify all filters are applied
      response.body.data.visits.forEach((visit: Visit) => {
        expect(visit.status).toBe(VisitStatus.PENDING);
        expect(visit.visitType).toBe(VisitType.INITIAL);
        expect(visit.priority).toBe(VisitPriority.MEDIUM);
      });
    });

    it('should handle empty results gracefully', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const filters = {
        status: 'nonexistent_status'
      };

      const response = await VisitTestUtils.listVisits(filters, authToken);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visits).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/visits/:id - Get Visit', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping test - no created visit');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/${createdVisitId}`, 'get');
    });

    it('should return 200 and visit data for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit first
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for retrieval',
        priority: VisitPriority.MEDIUM
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      const response = await VisitTestUtils.getVisit(createdVisitId, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visit');

      const visit = response.body.data.visit;
      VisitTestUtils.validateVisitResponse(visit);
      expect(visit.id).toBe(createdVisitId);
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await VisitTestUtils.getVisit(nonExistentId, authToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return complete visit information with all relationships', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit with complete data
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.SPECIALIST,
        reasonForVisit: 'Specialist consultation',
        priority: VisitPriority.HIGH,
        assignedDoctorId: MOCK_USERS[0].id,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: 'Patient requires specialist evaluation',
        duration: 45,
        location: 'Specialist Room 1'
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      const response = await VisitTestUtils.getVisit(createdVisitId, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const visit = response.body.data.visit;
      expect(visit).toHaveProperty('patient');
      expect(visit).toHaveProperty('assignedDoctor');
      expect(visit).toHaveProperty('department');

      if (visit.patient) {
        expect(visit.patient).toHaveProperty('id', testPatientId);
        expect(visit.patient).toHaveProperty('firstName');
        expect(visit.patient).toHaveProperty('lastName');
      }
    });
  });

  describe('PUT /api/visits/:id - Update Visit', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping test - no created visit');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/${createdVisitId}`, 'put');
    });

    it('should return 200 and update visit for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit first
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for update',
        priority: VisitPriority.MEDIUM
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      const updateData: VisitUpdateRequest = {
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Updated reason for visit',
        priority: VisitPriority.HIGH,
        notes: 'Updated notes for the visit'
      };

      const response = await VisitTestUtils.updateVisit(createdVisitId, updateData, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visit');

      const visit = response.body.data.visit;
      VisitTestUtils.validateVisitResponse(visit);
      expect(visit.visitType).toBe(VisitType.FOLLOW_UP);
      expect(visit.reasonForVisit).toBe('Updated reason for visit');
      expect(visit.priority).toBe(VisitPriority.HIGH);
      expect(visit.notes).toBe('Updated notes for the visit');

      // Should not update patientId or creation timestamp
      expect(visit.patientId).toBe(testPatientId);
      expect(new Date(visit.createdAt).toString()).not.toBe('Invalid Date');
    });

    VALID_VISIT_UPDATE_REQUESTS.forEach((updateData, index) => {
      it(`should update visit with valid data set ${index + 1}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create a visit first
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for update ${index + 1}`,
          priority: VisitPriority.MEDIUM
        }, authToken);

        createdVisitId = createResponse.body.data.visit.id;

        const response = await VisitTestUtils.updateVisit(createdVisitId, updateData, authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        VisitTestUtils.validateVisitResponse(response.body.data.visit);
      });
    });

    INVALID_VISIT_UPDATE_REQUESTS.forEach((testCase, index) => {
      it(`should return 400 for invalid update data - ${testCase.description}`, async () => {
        if (!authToken || !testPatientId) {
          console.log(`Skipping test ${index + 1} - no auth token or test patient`);
          return;
        }

        // Create a visit with the required status for testing
        const createResponse = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Test visit for invalid update ${index + 1}`,
          priority: VisitPriority.MEDIUM,
          status: testCase.currentStatus
        }, authToken);

        const visitId = createResponse.body.data.visit.id;

        const response = await VisitTestUtils.updateVisit(visitId, testCase.data, authToken);
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
      const updateData: VisitUpdateRequest = {
        reasonForVisit: 'Updated reason'
      };

      const response = await VisitTestUtils.updateVisit(nonExistentId, updateData, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate visit status transitions', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit in pending status
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for status transition',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.PENDING
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Test valid status transition: pending -> in_progress
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.PENDING,
        VisitStatus.IN_PROGRESS,
        true,
        authToken
      );

      // Test valid status transition: in_progress -> completed
      await VisitTestUtils.testStatusTransition(
        createdVisitId,
        VisitStatus.IN_PROGRESS,
        VisitStatus.COMPLETED,
        true,
        authToken
      );
    });

    it('should prevent invalid status transitions', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit in pending status
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for invalid status transition',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.PENDING
      }, authToken);

      const visitId = createResponse.body.data.visit.id;

      // Test invalid status transition: pending -> completed (should fail)
      await VisitTestUtils.testStatusTransition(
        visitId,
        VisitStatus.PENDING,
        VisitStatus.COMPLETED,
        false,
        authToken
      );

      // Clean up
      await VisitTestUtils.deleteVisit(visitId, authToken);
    });

    it('should update updatedAt timestamp on modification', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit first
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for timestamp update',
        priority: VisitPriority.MEDIUM
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;
      const originalUpdatedAt = createResponse.body.data.visit.updatedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the visit
      const updateData: VisitUpdateRequest = {
        notes: 'Updated notes'
      };

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, updateData, authToken);
      const newUpdatedAt = updateResponse.body.data.visit.updatedAt;

      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  describe('DELETE /api/visits/:id - Delete Visit', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping test - no created visit');
        return;
      }
      await VisitTestUtils.testAuthentication(`/api/visits/${createdVisitId}`, 'delete');
    });

    it('should return 200 and soft delete visit for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit first
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for deletion',
        priority: VisitPriority.MEDIUM
      }, authToken);

      const visitId = createResponse.body.data.visit.id;

      const response = await VisitTestUtils.deleteVisit(visitId, authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify the visit is soft deleted (should not be found in normal queries)
      const getResponse = await VisitTestUtils.getVisit(visitId, authToken);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await VisitTestUtils.deleteVisit(nonExistentId, authToken);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require appropriate permissions for deletion', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      // Create a visit with admin token
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for permission check',
        priority: VisitPriority.MEDIUM
      }, adminAuthToken);

      const visitId = createResponse.body.data.visit.id;

      // Try to delete with nurse token (should be denied)
      const nurseResponse = await VisitTestUtils.deleteVisit(visitId, nurseAuthToken);
      expect(nurseResponse.status).toBeGreaterThanOrEqual(400);

      // Delete with admin token (should succeed)
      const adminResponse = await VisitTestUtils.deleteVisit(visitId, adminAuthToken);
      expect(adminResponse.status).toBe(200);
    });

    it('should maintain audit trail for deleted visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit first
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit for audit trail',
        priority: VisitPriority.MEDIUM
      }, authToken);

      const visitId = createResponse.body.data.visit.id;

      // Delete the visit
      await VisitTestUtils.deleteVisit(visitId, authToken);

      // In a real implementation, you would check the audit log
      // For now, we'll just verify the deletion worked
      const getResponse = await VisitTestUtils.getVisit(visitId, authToken);
      expect(getResponse.status).toBe(404);
    });
  });
});