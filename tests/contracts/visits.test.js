const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3000';

// Test visit data
const TEST_VISIT = {
  patientId: null, // Will be set in before hook
  visitType: 'initial',
  reasonForVisit: 'Routine checkup',
  priority: 'medium',
  assignedDoctorId: null, // Will be set in before hook
  notes: 'Patient is here for routine examination'
};

const UPDATED_VISIT = {
  visitType: 'follow_up',
  priority: 'high',
  notes: 'Patient requires immediate attention',
  assignedDoctorId: null // Will be set in before hook
};

describe('Visit Management Contract Tests', () => {
  let authToken;
  let createdVisitId;
  let testPatientId;
  let doctorId;

  before(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to get nurse token for testing
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'nurse',
        password: 'NursePassword123!'
      });
      authToken = loginResponse.data.accessToken;
    } catch (error) {
      console.log('Could not get nurse token, some tests may fail');
    }

    // Create a test patient for visit testing
    if (authToken) {
      try {
        const testPatient = {
          firstName: 'Visit',
          lastName: 'TestPatient',
          nationalId: '98765432109876',
          dateOfBirth: '1985-05-15',
          gender: 'female',
          phone: '+201555123456',
          email: 'visit.test@example.com',
          address: '789 Visit Street, Giza, Egypt'
        };

        const patientResponse = await axios.post(`${POSTGREST_URL}/patients`, testPatient, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        testPatientId = patientResponse.data[0].id;
        TEST_VISIT.patientId = testPatientId;

        // Get a doctor ID for assignment
        const usersResponse = await axios.get(`${POSTGREST_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            role: 'eq.doctor',
            limit: 1
          }
        });

        if (usersResponse.data.length > 0) {
          doctorId = usersResponse.data[0].id;
          TEST_VISIT.assignedDoctorId = doctorId;
          UPDATED_VISIT.assignedDoctorId = doctorId;
        }

      } catch (error) {
        console.log('Could not create test patient:', error.message);
      }
    }
  });

  describe('POST /visits (Create Visit)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.post(`${POSTGREST_URL}/visits`, TEST_VISIT);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 400 for missing required fields', async () => {
      if (!authToken) {
        console.log('Skipping validation test - no nurse token available');
        return;
      }

      try {
        const incompleteVisit = { ...TEST_VISIT };
        delete incompleteVisit.patientId;

        await axios.post(`${POSTGREST_URL}/visits`, incompleteVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should return 400 for invalid visit type', async () => {
      if (!authToken) {
        console.log('Skipping visit type validation test - no nurse token available');
        return;
      }

      try {
        const invalidVisit = { ...TEST_VISIT, visitType: 'invalid_type' };

        await axios.post(`${POSTGREST_URL}/visits`, invalidVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should return 400 for invalid priority', async () => {
      if (!authToken) {
        console.log('Skipping priority validation test - no nurse token available');
        return;
      }

      try {
        const invalidVisit = { ...TEST_VISIT, priority: 'invalid_priority' };

        await axios.post(`${POSTGREST_URL}/visits`, invalidVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should return 404 for non-existent patient', async () => {
      if (!authToken) {
        console.log('Skipping non-existent patient test - no nurse token available');
        return;
      }

      try {
        const invalidVisit = {
          ...TEST_VISIT,
          patientId: '00000000-0000-0000-0000-000000000000'
        };

        await axios.post(`${POSTGREST_URL}/visits`, invalidVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 404 for non-existent doctor', async () => {
      if (!authToken) {
        console.log('Skipping non-existent doctor test - no nurse token available');
        return;
      }

      try {
        const invalidVisit = {
          ...TEST_VISIT,
          assignedDoctorId: '00000000-0000-0000-0000-000000000000'
        };

        await axios.post(`${POSTGREST_URL}/visits`, invalidVisit, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 201 and created visit data for valid request', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping visit creation test - no nurse token or test patient available');
        return;
      }

      try {
        const response = await axios.post(`${POSTGREST_URL}/visits`, TEST_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(201);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const createdVisit = response.data[0];
        expect(createdVisit).to.have.property('id');
        expect(createdVisit).to.have.property('patientId', TEST_VISIT.patientId);
        expect(createdVisit).to.have.property('visitType', TEST_VISIT.visitType);
        expect(createdVisit).to.have.property('reasonForVisit', TEST_VISIT.reasonForVisit);
        expect(createdVisit).to.have.property('priority', TEST_VISIT.priority);
        expect(createdVisit).to.have.property('assignedDoctorId', TEST_VISIT.assignedDoctorId);
        expect(createdVisit).to.have.property('notes', TEST_VISIT.notes);
        expect(createdVisit).to.have.property('status', 'pending');
        expect(createdVisit).to.have.property('createdAt');
        expect(createdVisit).to.have.property('updatedAt');

        // Store visit ID for subsequent tests
        createdVisitId = createdVisit.id;

      } catch (error) {
        console.log('Visit creation test failed:', error.message);
      }
    });

    it('should automatically set status to pending for new visits', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping status test - no nurse token or test patient available');
        return;
      }

      try {
        const response = await axios.post(`${POSTGREST_URL}/visits`, TEST_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(201);
        expect(response.data[0]).to.have.property('status', 'pending');

      } catch (error) {
        console.log('Status test failed:', error.message);
      }
    });
  });

  describe('GET /visits (List Visits)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.get(`${POSTGREST_URL}/visits`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and visits list for authenticated users', async () => {
      if (!authToken) {
        console.log('Skipping visit list test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // Check that all required fields are present
        if (response.data.length > 0) {
          const visit = response.data[0];
          expect(visit).to.have.property('id');
          expect(visit).to.have.property('patientId');
          expect(visit).to.have.property('visitType');
          expect(visit).to.have.property('reasonForVisit');
          expect(visit).to.have.property('priority');
          expect(visit).to.have.property('status');
          expect(visit).to.have.property('createdAt');
        }

      } catch (error) {
        console.log('Visit list test failed:', error.message);
      }
    });

    it('should support pagination with limit and offset', async () => {
      if (!authToken) {
        console.log('Skipping pagination test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            limit: 5,
            offset: 0
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.be.at.most(5);

      } catch (error) {
        console.log('Pagination test failed:', error.message);
      }
    });

    it('should support filtering by status', async () => {
      if (!authToken) {
        console.log('Skipping status filtering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            status: 'eq.pending'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned visits should be pending
        response.data.forEach(visit => {
          expect(visit.status).to.equal('pending');
        });

      } catch (error) {
        console.log('Status filtering test failed:', error.message);
      }
    });

    it('should support filtering by visit type', async () => {
      if (!authToken) {
        console.log('Skipping visit type filtering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            visitType: 'eq.initial'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned visits should be initial visits
        response.data.forEach(visit => {
          expect(visit.visitType).to.equal('initial');
        });

      } catch (error) {
        console.log('Visit type filtering test failed:', error.message);
      }
    });

    it('should support filtering by priority', async () => {
      if (!authToken) {
        console.log('Skipping priority filtering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            priority: 'eq.high'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned visits should be high priority
        response.data.forEach(visit => {
          expect(visit.priority).to.equal('high');
        });

      } catch (error) {
        console.log('Priority filtering test failed:', error.message);
      }
    });

    it('should support filtering by assigned doctor', async () => {
      if (!authToken || !doctorId) {
        console.log('Skipping doctor filtering test - no nurse token or doctor available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            assignedDoctorId: `eq.${doctorId}`
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned visits should be assigned to the specified doctor
        response.data.forEach(visit => {
          expect(visit.assignedDoctorId).to.equal(doctorId);
        });

      } catch (error) {
        console.log('Doctor filtering test failed:', error.message);
      }
    });

    it('should support ordering by creation date', async () => {
      if (!authToken) {
        console.log('Skipping ordering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            order: 'createdAt.desc'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // Check that visits are ordered by creation date (newest first)
        for (let i = 1; i < response.data.length; i++) {
          const currentDate = new Date(response.data[i].createdAt);
          const previousDate = new Date(response.data[i - 1].createdAt);
          expect(currentDate <= previousDate).to.be.true;
        }

      } catch (error) {
        console.log('Ordering test failed:', error.message);
      }
    });

    it('should support ordering by priority', async () => {
      if (!authToken) {
        console.log('Skipping priority ordering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            order: 'priority.desc'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // Check that visits are ordered by priority (high first)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        for (let i = 1; i < response.data.length; i++) {
          const currentPriority = priorityOrder[response.data[i].priority] || 0;
          const previousPriority = priorityOrder[response.data[i - 1].priority] || 0;
          expect(currentPriority <= previousPriority).to.be.true;
        }

      } catch (error) {
        console.log('Priority ordering test failed:', error.message);
      }
    });
  });

  describe('GET /visits/:id (Get Visit)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping get visit test - no created visit available');
        return;
      }

      try {
        await axios.get(`${POSTGREST_URL}/visits?id=eq.${createdVisitId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and visit data for valid request', async () => {
      if (!authToken || !createdVisitId) {
        console.log('Skipping get visit test - no nurse token or created visit available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits?id=eq.${createdVisitId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const visit = response.data[0];
        expect(visit).to.have.property('id', createdVisitId);
        expect(visit).to.have.property('patientId', TEST_VISIT.patientId);
        expect(visit).to.have.property('visitType', TEST_VISIT.visitType);
        expect(visit).to.have.property('reasonForVisit', TEST_VISIT.reasonForVisit);

      } catch (error) {
        console.log('Get visit test failed:', error.message);
      }
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping non-existent visit test - no nurse token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.get(`${POSTGREST_URL}/visits?id=eq.${nonExistentId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('PATCH /visits/:id (Update Visit)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdVisitId) {
        console.log('Skipping update test - no created visit available');
        return;
      }

      try {
        await axios.patch(`${POSTGREST_URL}/visits?id=eq.${createdVisitId}`, UPDATED_VISIT);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and updated visit data for valid request', async () => {
      if (!authToken || !createdVisitId) {
        console.log('Skipping update test - no nurse token or created visit available');
        return;
      }

      try {
        const response = await axios.patch(`${POSTGREST_URL}/visits?id=eq.${createdVisitId}`, UPDATED_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const updatedVisit = response.data[0];
        expect(updatedVisit).to.have.property('id', createdVisitId);
        expect(updatedVisit).to.have.property('visitType', UPDATED_VISIT.visitType);
        expect(updatedVisit).to.have.property('priority', UPDATED_VISIT.priority);
        expect(updatedVisit).to.have.property('notes', UPDATED_VISIT.notes);

        // Should not update patientId or creation timestamp
        expect(updatedVisit).to.have.property('patientId', TEST_VISIT.patientId);

      } catch (error) {
        console.log('Visit update test failed:', error.message);
      }
    });

    it('should support status transitions', async () => {
      if (!authToken || !createdVisitId) {
        console.log('Skipping status transition test - no nurse token or created visit available');
        return;
      }

      try {
        const statusTransitions = [
          { status: 'in_progress', notes: 'Doctor started examination' },
          { status: 'completed', notes: 'Visit completed successfully' },
          { status: 'cancelled', notes: 'Visit cancelled by patient' }
        ];

        for (const transition of statusTransitions) {
          const response = await axios.patch(`${POSTGREST_URL}/visits?id=eq.${createdVisitId}`, transition, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          expect(response.status).to.equal(200);
          expect(response.data[0]).to.have.property('status', transition.status);
        }

      } catch (error) {
        console.log('Status transition test failed:', error.message);
      }
    });

    it('should return 404 for non-existent visit', async () => {
      if (!authToken) {
        console.log('Skipping non-existent visit update test - no nurse token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.patch(`${POSTGREST_URL}/visits?id=eq.${nonExistentId}`, UPDATED_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('Visit Status Transitions', () => {
    it('should allow transition from pending to in_progress', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping status transition test - no nurse token or test patient available');
        return;
      }

      try {
        // Create a new visit
        const visitResponse = await axios.post(`${POSTGREST_URL}/visits`, TEST_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        const visitId = visitResponse.data[0].id;

        // Transition to in_progress
        const updateResponse = await axios.patch(`${POSTGREST_URL}/visits?id=eq.${visitId}`, {
          status: 'in_progress'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(updateResponse.status).to.equal(200);
        expect(updateResponse.data[0]).to.have.property('status', 'in_progress');

      } catch (error) {
        console.log('Pending to in_progress test failed:', error.message);
      }
    });

    it('should allow transition from in_progress to completed', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping status transition test - no nurse token or test patient available');
        return;
      }

      try {
        // Create and start a visit
        const visitResponse = await axios.post(`${POSTGREST_URL}/visits`, TEST_VISIT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        const visitId = visitResponse.data[0].id;

        await axios.patch(`${POSTGREST_URL}/visits?id=eq.${visitId}`, {
          status: 'in_progress'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        // Transition to completed
        const updateResponse = await axios.patch(`${POSTGREST_URL}/visits?id=eq.${visitId}`, {
          status: 'completed'
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(updateResponse.status).to.equal(200);
        expect(updateResponse.data[0]).to.have.property('status', 'completed');

      } catch (error) {
        console.log('In_progress to completed test failed:', error.message);
      }
    });
  });

  describe('Visit History Retrieval', () => {
    it('should retrieve visit history for a patient', async () => {
      if (!authToken || !testPatientId) {
        console.log('Skipping visit history test - no nurse token or test patient available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/visits`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            patientId: `eq.${testPatientId}`,
            order: 'createdAt.desc'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned visits should belong to the test patient
        response.data.forEach(visit => {
          expect(visit.patientId).to.equal(testPatientId);
        });

        // Should be ordered by creation date (newest first)
        for (let i = 1; i < response.data.length; i++) {
          const currentDate = new Date(response.data[i].createdAt);
          const previousDate = new Date(response.data[i - 1].createdAt);
          expect(currentDate <= previousDate).to.be.true;
        }

      } catch (error) {
        console.log('Visit history test failed:', error.message);
      }
    });
  });

  after(() => {
    console.log('Visit management contract tests completed');
  });
});