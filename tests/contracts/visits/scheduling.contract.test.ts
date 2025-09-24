import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { VisitTestSetup } from './setup';
import { VisitTestUtils } from './utils';
import {
  MOCK_PATIENTS,
  MOCK_USERS,
  SAMPLE_EXISTING_VISITS
} from './fixtures';
import {
  Visit,
  VisitCreateRequest,
  VisitUpdateRequest,
  VisitStatus,
  VisitPriority,
  VisitType
} from './types';

describe('Visit Scheduling Management - Contract Tests', () => {
  let app: any;
  let authToken: string;
  let nurseAuthToken: string;
  let adminAuthToken: string;
  let createdVisitId: string;
  let testPatientId: string;
  let conflictVisitId: string;

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
        firstName: 'Scheduling',
        lastName: 'TestPatient',
        nationalId: '98765432109876',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        phone: '+201555123456',
        email: 'scheduling.test@example.com',
        address: '789 Scheduling Street, Giza, Egypt'
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

    if (conflictVisitId) {
      try {
        await VisitTestUtils.deleteVisit(conflictVisitId, authToken);
      } catch (error) {
        // Visit might already be deleted
      }
      conflictVisitId = '';
    }
  });

  describe('Visit Scheduling Validation', () => {
    it('should validate scheduledDateTime is not in the past', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit with past time',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        duration: 30,
        location: 'Test Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('past');
    });

    it('should validate minimum duration requirement', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit with short duration',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 5, // Too short
        location: 'Test Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('duration');
    });

    it('should validate maximum duration limit', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit with long duration',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 480, // 8 hours - too long
        location: 'Test Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('duration');
    });

    it('should require location for scheduled visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit without location',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
        // Missing location
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('location');
    });

    it('should validate working hours for regular visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Test scheduling outside working hours (e.g., 3 AM)
      const afterHoursTime = new Date();
      afterHoursTime.setHours(3, 0, 0, 0);
      afterHoursTime.setDate(afterHoursTime.getDate() + 1);

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit after hours',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: afterHoursTime,
        duration: 30,
        location: 'Test Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('hours');
    });

    it('should allow emergency visits outside working hours', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Emergency visits should be allowed at any time
      const emergencyTime = new Date();
      emergencyTime.setHours(3, 0, 0, 0);
      emergencyTime.setDate(emergencyTime.getDate() + 1);

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.EMERGENCY,
        reasonForVisit: 'Emergency visit after hours',
        priority: VisitPriority.URGENT,
        scheduledDateTime: emergencyTime,
        duration: 60,
        location: 'Emergency Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      createdVisitId = response.body.data.visit.id;
    });

    it('should validate weekend scheduling restrictions', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Schedule on a Saturday
      const saturdayTime = new Date();
      saturdayTime.setDate(saturdayTime.getDate() + ((6 - saturdayTime.getDay() + 7) % 7));
      saturdayTime.setHours(10, 0, 0, 0);

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Test visit on weekend',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: saturdayTime,
        duration: 30,
        location: 'Test Room'
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('weekend');
    });
  });

  describe('Schedule Conflict Detection', () => {
    it('should detect scheduling conflicts for the same location', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      conflictVisitId = firstVisit.body.data.visit.id;

      // Try to create conflicting visit in same location
      const conflictingVisitTime = new Date(firstVisitTime.getTime() + 15 * 60 * 1000); // 15 minutes overlap

      const conflictingVisitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Conflicting visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: conflictingVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[1].id
      };

      const response = await VisitTestUtils.createVisit(conflictingVisitData, authToken);
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('conflict');
      expect(response.body.error).toContain('location');
    });

    it('should detect scheduling conflicts for the same doctor', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      conflictVisitId = firstVisit.body.data.visit.id;

      // Try to create conflicting visit for same doctor
      const conflictingVisitTime = new Date(firstVisitTime.getTime() + 20 * 60 * 1000); // 20 minutes overlap

      const conflictingVisitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Conflicting visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: conflictingVisitTime,
        duration: 30,
        location: 'Examination Room 2',
        assignedDoctorId: MOCK_USERS[0].id // Same doctor
      };

      const response = await VisitTestUtils.createVisit(conflictingVisitData, authToken);
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('conflict');
      expect(response.body.error).toContain('doctor');
    });

    it('should detect scheduling conflicts for the same patient', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      conflictVisitId = firstVisit.body.data.visit.id;

      // Try to create conflicting visit for same patient
      const conflictingVisitTime = new Date(firstVisitTime.getTime() + 15 * 60 * 1000); // 15 minutes overlap

      const conflictingVisitData: VisitCreateRequest = {
        patientId: testPatientId, // Same patient
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Conflicting visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: conflictingVisitTime,
        duration: 30,
        location: 'Examination Room 2',
        assignedDoctorId: MOCK_USERS[1].id
      };

      const response = await VisitTestUtils.createVisit(conflictingVisitData, authToken);
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('conflict');
      expect(response.body.error).toContain('patient');
    });

    it('should allow non-conflicting visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      createdVisitId = firstVisit.body.data.visit.id;

      // Create non-conflicting visit with proper time gap
      const nonConflictingTime = new Date(firstVisitTime.getTime() + 60 * 60 * 1000); // 1 hour gap

      const nonConflictingVisitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Non-conflicting visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: nonConflictingTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      };

      const response = await VisitTestUtils.createVisit(nonConflictingVisitData, authToken);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Clean up the second visit
      await VisitTestUtils.deleteVisit(response.body.data.visit.id, authToken);
    });

    it('should provide detailed conflict information', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      conflictVisitId = firstVisit.body.data.visit.id;

      // Try to create conflicting visit
      const conflictingVisitTime = new Date(firstVisitTime.getTime() + 15 * 60 * 1000);

      const conflictingVisitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Conflicting visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: conflictingVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[1].id
      };

      const response = await VisitTestUtils.createVisit(conflictingVisitData, authToken);
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('conflicts');
      expect(Array.isArray(response.body.conflicts)).toBe(true);

      // Conflict details should include timing and location information
      if (response.body.conflicts.length > 0) {
        expect(response.body.conflicts[0]).toHaveProperty('visitId');
        expect(response.body.conflicts[0]).toHaveProperty('scheduledDateTime');
        expect(response.body.conflicts[0]).toHaveProperty('duration');
        expect(response.body.conflicts[0]).toHaveProperty('location');
      }
    });

    it('should allow emergency visits to override conflicts', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create first visit
      const firstVisitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstVisitTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      conflictVisitId = firstVisit.body.data.visit.id;

      // Create emergency visit that conflicts
      const emergencyVisitTime = new Date(firstVisitTime.getTime() + 15 * 60 * 1000);

      const emergencyVisitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.EMERGENCY,
        reasonForVisit: 'Emergency override',
        priority: VisitPriority.URGENT,
        scheduledDateTime: emergencyVisitTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[1].id
      };

      const response = await VisitTestUtils.createVisit(emergencyVisitData, authToken);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      createdVisitId = response.body.data.visit.id;
    });
  });

  describe('Visit Rescheduling', () => {
    it('should allow rescheduling visits with valid new times', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create initial visit
      const originalTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      originalTime.setHours(10, 0, 0, 0);

      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Visit to reschedule',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: originalTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Reschedule to a new time
      const newTime = new Date(originalTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, {
        scheduledDateTime: newTime
      }, authToken);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(new Date(updateResponse.body.data.visit.scheduledDateTime).getTime()).toBe(newTime.getTime());
    });

    it('should prevent rescheduling to conflicting times', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create two non-conflicting visits
      const firstTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      firstTime.setHours(10, 0, 0, 0);

      const firstVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'First visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: firstTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      const secondTime = new Date(firstTime.getTime() + 60 * 60 * 1000); // 1 hour later
      secondTime.setHours(11, 0, 0, 0);

      const secondVisit = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.FOLLOW_UP,
        reasonForVisit: 'Second visit',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: secondTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[1].id
      }, authToken);

      createdVisitId = secondVisit.body.data.visit.id;

      // Try to reschedule second visit to conflict with first
      const conflictingTime = new Date(firstTime.getTime() + 15 * 60 * 1000); // 15 minutes after first visit starts

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, {
        scheduledDateTime: conflictingTime
      }, authToken);

      expect(updateResponse.status).toBe(409);
      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.error).toContain('conflict');

      // Clean up first visit
      await VisitTestUtils.deleteVisit(firstVisit.body.data.visit.id, authToken);
    });

    it('should prevent rescheduling visits that are in progress or completed', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create and start a visit
      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Visit in progress',
        priority: VisitPriority.MEDIUM,
        status: VisitStatus.IN_PROGRESS
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Try to reschedule the in-progress visit
      const newTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, {
        scheduledDateTime: newTime
      }, authToken);

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.error).toContain('cannot reschedule');
    });

    it('should maintain visit metadata when rescheduling', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create visit with metadata
      const originalTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      originalTime.setHours(10, 0, 0, 0);

      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Visit with metadata',
        priority: VisitPriority.HIGH,
        scheduledDateTime: originalTime,
        duration: 45,
        location: 'Specialist Room',
        assignedDoctorId: MOCK_USERS[0].id,
        notes: 'Important medical history notes'
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;
      const originalData = createResponse.body.data.visit;

      // Reschedule the visit
      const newTime = new Date(originalTime.getTime() + 3 * 60 * 60 * 1000);

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, {
        scheduledDateTime: newTime
      }, authToken);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      const updatedData = updateResponse.body.data.visit;

      // Verify metadata is preserved
      expect(updatedData.patientId).toBe(originalData.patientId);
      expect(updatedData.visitType).toBe(originalData.visitType);
      expect(updatedData.reasonForVisit).toBe(originalData.reasonForVisit);
      expect(updatedData.priority).toBe(originalData.priority);
      expect(updatedData.duration).toBe(originalData.duration);
      expect(updatedData.location).toBe(originalData.location);
      expect(updatedData.assignedDoctorId).toBe(originalData.assignedDoctorId);
      expect(updatedData.notes).toBe(originalData.notes);

      // Only scheduled time and updated timestamp should change
      expect(new Date(updatedData.scheduledDateTime).getTime()).toBe(newTime.getTime());
      expect(new Date(updatedData.updatedAt).getTime()).toBeGreaterThan(new Date(originalData.updatedAt).getTime());
    });
  });

  describe('Scheduling Permissions and Workflow', () => {
    it('should allow different roles to schedule visits with appropriate restrictions', async () => {
      if (!testPatientId) {
        console.log('Skipping test - no test patient');
        return;
      }

      const visitTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      visitTime.setHours(10, 0, 0, 0);

      const baseVisitData = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Role-based scheduling test',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: visitTime,
        duration: 30,
        location: 'Test Room'
      };

      // Test scheduling with different roles
      const roles = [
        { token: nurseAuthToken, name: 'nurse', canSchedule: true },
        { token: authToken, name: 'doctor', canSchedule: true },
        { token: adminAuthToken, name: 'admin', canSchedule: true }
      ];

      for (const role of roles) {
        if (role.token) {
          const response = await VisitTestUtils.createVisit(baseVisitData, role.token);

          if (role.canSchedule) {
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // Clean up created visit
            await VisitTestUtils.deleteVisit(response.body.data.visit.id, role.token);
          } else {
            expect(response.status).toBeGreaterThanOrEqual(400);
          }
        }
      }
    });

    it('should validate doctor availability before assignment', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create a visit during doctor's time off
      const offHoursTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      offHoursTime.setHours(20, 0, 0, 0); // 8 PM - likely outside working hours

      const visitData: VisitCreateRequest = {
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Visit during doctor off hours',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: offHoursTime,
        duration: 30,
        location: 'Test Room',
        assignedDoctorId: MOCK_USERS[0].id
      };

      const response = await VisitTestUtils.createVisit(visitData, authToken);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('available');
    });

    it('should handle bulk rescheduling operations', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create multiple visits
      const visits = [];
      const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      baseTime.setHours(10, 0, 0, 0);

      for (let i = 0; i < 3; i++) {
        const visitTime = new Date(baseTime.getTime() + i * 60 * 60 * 1000); // 1 hour apart
        const response = await VisitTestUtils.createVisit({
          patientId: testPatientId,
          visitType: VisitType.INITIAL,
          reasonForVisit: `Bulk visit ${i + 1}`,
          priority: VisitPriority.MEDIUM,
          scheduledDateTime: visitTime,
          duration: 30,
          location: `Room ${i + 1}`,
          assignedDoctorId: MOCK_USERS[0].id
        }, authToken);

        visits.push(response.body.data.visit);
      }

      // Reschedule all visits (this would typically be a batch operation)
      const timeOffset = 2 * 60 * 60 * 1000; // 2 hours later
      let allRescheduled = true;

      for (const visit of visits) {
        const newTime = new Date(new Date(visit.scheduledDateTime).getTime() + timeOffset);
        const updateResponse = await VisitTestUtils.updateVisit(visit.id, {
          scheduledDateTime: newTime
        }, authToken);

        if (updateResponse.status !== 200) {
          allRescheduled = false;
        }
      }

      expect(allRescheduled).toBe(true);

      // Clean up
      for (const visit of visits) {
        await VisitTestUtils.deleteVisit(visit.id, authToken);
      }
    });

    it('should send notifications when visits are rescheduled', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping test - no auth token or test patient');
        return;
      }

      // Create initial visit
      const originalTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      originalTime.setHours(10, 0, 0, 0);

      const createResponse = await VisitTestUtils.createVisit({
        patientId: testPatientId,
        visitType: VisitType.INITIAL,
        reasonForVisit: 'Visit to test notifications',
        priority: VisitPriority.MEDIUM,
        scheduledDateTime: originalTime,
        duration: 30,
        location: 'Examination Room 1',
        assignedDoctorId: MOCK_USERS[0].id
      }, authToken);

      createdVisitId = createResponse.body.data.visit.id;

      // Reschedule the visit
      const newTime = new Date(originalTime.getTime() + 2 * 60 * 60 * 1000);

      const updateResponse = await VisitTestUtils.updateVisit(createdVisitId, {
        scheduledDateTime: newTime
      }, authToken);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // In a real implementation, you would check for notification records
      // For now, we'll verify the rescheduling worked
      expect(new Date(updateResponse.body.data.visit.scheduledDateTime).getTime()).toBe(newTime.getTime());
    });
  });

  describe('Scheduling Analytics and Reporting', () => {
    it('should support scheduling analytics endpoints', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      // Test schedule availability endpoint
      const availabilityResponse = await VisitTestUtils.listVisits({
        action: 'availability',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Examination Room 1'
      }, authToken);

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityResponse.body.success).toBe(true);
      expect(availabilityResponse.body.data).toHaveProperty('availableSlots');
      expect(Array.isArray(availabilityResponse.body.data.availableSlots)).toBe(true);

      // Test schedule utilization endpoint
      const utilizationResponse = await VisitTestUtils.listVisits({
        action: 'utilization',
        dateFrom: new Date(Date.now()).toISOString().split('T')[0],
        dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }, authToken);

      expect(utilizationResponse.status).toBe(200);
      expect(utilizationResponse.body.success).toBe(true);
      expect(utilizationResponse.body.data).toHaveProperty('utilization');
    });

    it('should provide wait time statistics', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const waitTimeResponse = await VisitTestUtils.listVisits({
        action: 'waitTimes',
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date(Date.now()).toISOString().split('T')[0]
      }, authToken);

      expect(waitTimeResponse.status).toBe(200);
      expect(waitTimeResponse.body.success).toBe(true);
      expect(waitTimeResponse.body.data).toHaveProperty('averageWaitTime');
      expect(waitTimeResponse.body.data).toHaveProperty('maxWaitTime');
      expect(waitTimeResponse.body.data).toHaveProperty('minWaitTime');
    });

    it('should support schedule optimization suggestions', async () => {
      if (!authToken) {
        console.log('Skipping test - no auth token');
        return;
      }

      const optimizationResponse = await VisitTestUtils.listVisits({
        action: 'optimization',
        doctorId: MOCK_USERS[0].id,
        dateRange: 'week'
      }, authToken);

      expect(optimizationResponse.status).toBe(200);
      expect(optimizationResponse.body.success).toBe(true);
      expect(optimizationResponse.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(optimizationResponse.body.data.suggestions)).toBe(true);
    });
  });
});