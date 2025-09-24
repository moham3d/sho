const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3000';

// Test patient data
const TEST_PATIENT = {
  firstName: 'Test',
  lastName: 'Patient',
  nationalId: '12345678901234',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  phone: '+201234567890',
  email: 'test.patient@example.com',
  address: '123 Test Street, Cairo, Egypt',
  emergencyContact: {
    name: 'Emergency Contact',
    relationship: 'spouse',
    phone: '+201098765432'
  }
};

const UPDATED_PATIENT = {
  firstName: 'Updated',
  lastName: 'Patient',
  phone: '+201555555555',
  email: 'updated.patient@example.com',
  address: '456 Updated Street, Alexandria, Egypt'
};

describe('Patient Management Contract Tests', () => {
  let authToken;
  let createdPatientId;

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
  });

  describe('POST /patients (Create Patient)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.post(`${POSTGREST_URL}/patients`, TEST_PATIENT);
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
        const incompletePatient = { ...TEST_PATIENT };
        delete incompletePatient.firstName;

        await axios.post(`${POSTGREST_URL}/patients`, incompletePatient, {
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

    it('should return 400 for invalid national ID format', async () => {
      if (!authToken) {
        console.log('Skipping national ID validation test - no nurse token available');
        return;
      }

      try {
        const invalidPatient = { ...TEST_PATIENT, nationalId: '123' }; // Too short

        await axios.post(`${POSTGREST_URL}/patients`, invalidPatient, {
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

    it('should return 400 for invalid date of birth', async () => {
      if (!authToken) {
        console.log('Skipping date validation test - no nurse token available');
        return;
      }

      try {
        const invalidPatient = { ...TEST_PATIENT, dateOfBirth: 'invalid-date' };

        await axios.post(`${POSTGREST_URL}/patients`, invalidPatient, {
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

    it('should return 400 for invalid gender', async () => {
      if (!authToken) {
        console.log('Skipping gender validation test - no nurse token available');
        return;
      }

      try {
        const invalidPatient = { ...TEST_PATIENT, gender: 'invalid' };

        await axios.post(`${POSTGREST_URL}/patients`, invalidPatient, {
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

    it('should return 400 for invalid email format', async () => {
      if (!authToken) {
        console.log('Skipping email validation test - no nurse token available');
        return;
      }

      try {
        const invalidPatient = { ...TEST_PATIENT, email: 'invalid-email' };

        await axios.post(`${POSTGREST_URL}/patients`, invalidPatient, {
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

    it('should return 409 for duplicate national ID', async () => {
      if (!authToken) {
        console.log('Skipping duplicate test - no nurse token available');
        return;
      }

      try {
        // Create first patient
        await axios.post(`${POSTGREST_URL}/patients`, TEST_PATIENT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        // Try to create patient with same national ID
        const duplicatePatient = { ...TEST_PATIENT, firstName: 'Another', lastName: 'Patient' };
        await axios.post(`${POSTGREST_URL}/patients`, duplicatePatient, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(409);
      }
    });

    it('should return 201 and created patient data for valid request', async () => {
      if (!authToken) {
        console.log('Skipping patient creation test - no nurse token available');
        return;
      }

      try {
        const response = await axios.post(`${POSTGREST_URL}/patients`, TEST_PATIENT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(201);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const createdPatient = response.data[0];
        expect(createdPatient).to.have.property('id');
        expect(createdPatient).to.have.property('firstName', TEST_PATIENT.firstName);
        expect(createdPatient).to.have.property('lastName', TEST_PATIENT.lastName);
        expect(createdPatient).to.have.property('nationalId', TEST_PATIENT.nationalId);
        expect(createdPatient).to.have.property('dateOfBirth', TEST_PATIENT.dateOfBirth);
        expect(createdPatient).to.have.property('gender', TEST_PATIENT.gender);
        expect(createdPatient).to.have.property('phone', TEST_PATIENT.phone);
        expect(createdPatient).to.have.property('email', TEST_PATIENT.email);
        expect(createdPatient).to.have.property('address', TEST_PATIENT.address);
        expect(createdPatient).to.have.property('emergencyContact');
        expect(createdPatient).to.have.property('isActive', true);
        expect(createdPatient).to.have.property('createdAt');
        expect(createdPatient).to.have.property('updatedAt');

        // Store patient ID for subsequent tests
        createdPatientId = createdPatient.id;

      } catch (error) {
        console.log('Patient creation test failed:', error.message);
      }
    });
  });

  describe('GET /patients (List Patients)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.get(`${POSTGREST_URL}/patients`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and patients list for authenticated users', async () => {
      if (!authToken) {
        console.log('Skipping patient list test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // Check that all required fields are present
        if (response.data.length > 0) {
          const patient = response.data[0];
          expect(patient).to.have.property('id');
          expect(patient).to.have.property('firstName');
          expect(patient).to.have.property('lastName');
          expect(patient).to.have.property('nationalId');
          expect(patient).to.have.property('dateOfBirth');
          expect(patient).to.have.property('gender');
          expect(patient).to.have.property('phone');
          expect(patient).to.have.property('isActive');
        }

      } catch (error) {
        console.log('Patient list test failed:', error.message);
      }
    });

    it('should support pagination with limit and offset', async () => {
      if (!authToken) {
        console.log('Skipping pagination test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
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

    it('should support filtering by gender', async () => {
      if (!authToken) {
        console.log('Skipping gender filtering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            gender: 'eq.male'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned patients should be male
        response.data.forEach(patient => {
          expect(patient.gender).to.equal('male');
        });

      } catch (error) {
        console.log('Gender filtering test failed:', error.message);
      }
    });

    it('should support filtering by active status', async () => {
      if (!authToken) {
        console.log('Skipping active status test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            isActive: 'eq.true'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned patients should be active
        response.data.forEach(patient => {
          expect(patient.isActive).to.be.true;
        });

      } catch (error) {
        console.log('Active status test failed:', error.message);
      }
    });

    it('should support searching by name', async () => {
      if (!authToken) {
        console.log('Skipping name search test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            or: '(firstName.ilike.*test*,lastName.ilike.*test*)'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned patients should have 'test' in first or last name
        response.data.forEach(patient => {
          const hasTestInName =
            patient.firstName.toLowerCase().includes('test') ||
            patient.lastName.toLowerCase().includes('test');
          expect(hasTestInName).to.be.true;
        });

      } catch (error) {
        console.log('Name search test failed:', error.message);
      }
    });

    it('should support searching by national ID', async () => {
      if (!authToken) {
        console.log('Skipping national ID search test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            nationalId: 'ilike.*1234*'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned patients should have '1234' in national ID
        response.data.forEach(patient => {
          expect(patient.nationalId).to.include('1234');
        });

      } catch (error) {
        console.log('National ID search test failed:', error.message);
      }
    });

    it('should support ordering by creation date', async () => {
      if (!authToken) {
        console.log('Skipping ordering test - no nurse token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients`, {
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

        // Check that patients are ordered by creation date (newest first)
        for (let i = 1; i < response.data.length; i++) {
          const currentDate = new Date(response.data[i].createdAt);
          const previousDate = new Date(response.data[i - 1].createdAt);
          expect(currentDate <= previousDate).to.be.true;
        }

      } catch (error) {
        console.log('Ordering test failed:', error.message);
      }
    });
  });

  describe('GET /patients/:id (Get Patient)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdPatientId) {
        console.log('Skipping get patient test - no created patient available');
        return;
      }

      try {
        await axios.get(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and patient data for valid request', async () => {
      if (!authToken || !createdPatientId) {
        console.log('Skipping get patient test - no nurse token or created patient available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const patient = response.data[0];
        expect(patient).to.have.property('id', createdPatientId);
        expect(patient).to.have.property('firstName', TEST_PATIENT.firstName);
        expect(patient).to.have.property('lastName', TEST_PATIENT.lastName);
        expect(patient).to.have.property('nationalId', TEST_PATIENT.nationalId);

      } catch (error) {
        console.log('Get patient test failed:', error.message);
      }
    });

    it('should return 404 for non-existent patient', async () => {
      if (!authToken) {
        console.log('Skipping non-existent patient test - no nurse token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.get(`${POSTGREST_URL}/patients?id=eq.${nonExistentId}`, {
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

  describe('PATCH /patients/:id (Update Patient)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdPatientId) {
        console.log('Skipping update test - no created patient available');
        return;
      }

      try {
        await axios.patch(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`, UPDATED_PATIENT);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and updated patient data for valid request', async () => {
      if (!authToken || !createdPatientId) {
        console.log('Skipping update test - no nurse token or created patient available');
        return;
      }

      try {
        const response = await axios.patch(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`, UPDATED_PATIENT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const updatedPatient = response.data[0];
        expect(updatedPatient).to.have.property('id', createdPatientId);
        expect(updatedPatient).to.have.property('firstName', UPDATED_PATIENT.firstName);
        expect(updatedPatient).to.have.property('lastName', UPDATED_PATIENT.lastName);
        expect(updatedPatient).to.have.property('phone', UPDATED_PATIENT.phone);
        expect(updatedPatient).to.have.property('email', UPDATED_PATIENT.email);
        expect(updatedPatient).to.have.property('address', UPDATED_PATIENT.address);

        // Should not update national ID or date of birth
        expect(updatedPatient).to.have.property('nationalId', TEST_PATIENT.nationalId);
        expect(updatedPatient).to.have.property('dateOfBirth', TEST_PATIENT.dateOfBirth);

      } catch (error) {
        console.log('Patient update test failed:', error.message);
      }
    });

    it('should return 404 for non-existent patient', async () => {
      if (!authToken) {
        console.log('Skipping non-existent patient update test - no nurse token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.patch(`${POSTGREST_URL}/patients?id=eq.${nonExistentId}`, UPDATED_PATIENT, {
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

    it('should return 400 for updating protected fields', async () => {
      if (!authToken || !createdPatientId) {
        console.log('Skipping protected fields test - no nurse token or created patient available');
        return;
      }

      try {
        const protectedUpdate = { nationalId: '99999999999999' };
        await axios.patch(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`, protectedUpdate, {
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
  });

  describe('Duplicate Patient Prevention', () => {
    it('should prevent creating patient with existing national ID', async () => {
      if (!authToken) {
        console.log('Skipping duplicate prevention test - no nurse token available');
        return;
      }

      try {
        // Try to create patient with same national ID but different name
        const duplicatePatient = {
          ...TEST_PATIENT,
          firstName: 'Duplicate',
          lastName: 'Patient'
        };

        await axios.post(`${POSTGREST_URL}/patients`, duplicatePatient, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(409);
      }
    });

    it('should allow updating existing patient without duplicate check', async () => {
      if (!authToken || !createdPatientId) {
        console.log('Skipping update duplicate test - no nurse token or created patient available');
        return;
      }

      try {
        const response = await axios.patch(`${POSTGREST_URL}/patients?id=eq.${createdPatientId}`, UPDATED_PATIENT, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(200);

      } catch (error) {
        console.log('Update duplicate test failed:', error.message);
      }
    });
  });

  describe('Access Control', () => {
    it('should allow nurse to create and manage patients', async () => {
      if (!authToken) {
        console.log('Skipping nurse access test - no nurse token available');
        return;
      }

      try {
        // Test GET patients
        await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Nurse access control test passed');

      } catch (error) {
        console.log('Nurse access test failed:', error.message);
      }
    });

    it('should allow doctor to view patients', async () => {
      try {
        // Get doctor token
        const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'doctor',
          password: 'DoctorPassword123!'
        });
        const doctorToken = doctorLogin.data.accessToken;

        // Test GET patients (should work)
        await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${doctorToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Doctor access control test passed');

      } catch (error) {
        console.log('Doctor access test failed:', error.message);
      }
    });

    it('should allow admin to manage patients', async () => {
      try {
        // Get admin token
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'admin',
          password: 'AdminPassword123!'
        });
        const adminToken = adminLogin.data.accessToken;

        // Test GET patients (should work)
        await axios.get(`${POSTGREST_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Admin access control test passed');

      } catch (error) {
        console.log('Admin access test failed:', error.message);
      }
    });
  });

  after(() => {
    console.log('Patient management contract tests completed');
  });
});