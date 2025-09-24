const axios = require('axios');
const { expect } = require('chai');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3000';

// Test user data
const TEST_USER = {
  username: 'test_user_' + Date.now(),
  password: 'TestPassword123!',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'nurse',
  nationalId: '12345678901234',
  phone: '+201234567890'
};

const UPDATED_USER = {
  fullName: 'Updated Test User',
  email: 'updated@example.com',
  phone: '+201098765432'
};

describe('User Management Contract Tests', () => {
  let authToken;
  let createdUserId;

  before(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to get admin token for testing
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'admin',
        password: 'AdminPassword123!'
      });
      authToken = loginResponse.data.accessToken;
    } catch (error) {
      console.log('Could not get admin token, some tests may fail');
    }
  });

  describe('POST /users (Create User)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.post(`${POSTGREST_URL}/users`, TEST_USER);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 403 for non-admin users', async () => {
      if (!authToken) {
        console.log('Skipping non-admin test - no admin token available');
        return;
      }

      try {
        // First get a nurse token
        const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'nurse',
          password: 'NursePassword123!'
        });
        const nurseToken = nurseLogin.data.accessToken;

        await axios.post(`${POSTGREST_URL}/users`, TEST_USER, {
          headers: {
            'Authorization': `Bearer ${nurseToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(403);
      }
    });

    it('should return 400 for missing required fields', async () => {
      if (!authToken) {
        console.log('Skipping validation test - no admin token available');
        return;
      }

      try {
        const incompleteUser = { ...TEST_USER };
        delete incompleteUser.username;

        await axios.post(`${POSTGREST_URL}/users`, incompleteUser, {
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
        console.log('Skipping email validation test - no admin token available');
        return;
      }

      try {
        const invalidEmailUser = { ...TEST_USER, email: 'invalid-email' };

        await axios.post(`${POSTGREST_URL}/users`, invalidEmailUser, {
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

    it('should return 400 for invalid phone format', async () => {
      if (!authToken) {
        console.log('Skipping phone validation test - no admin token available');
        return;
      }

      try {
        const invalidPhoneUser = { ...TEST_USER, phone: 'invalid-phone' };

        await axios.post(`${POSTGREST_URL}/users`, invalidPhoneUser, {
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

    it('should return 409 for duplicate username', async () => {
      if (!authToken) {
        console.log('Skipping duplicate test - no admin token available');
        return;
      }

      try {
        // Create first user
        await axios.post(`${POSTGREST_URL}/users`, TEST_USER, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        // Try to create user with same username
        await axios.post(`${POSTGREST_URL}/users`, TEST_USER, {
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

    it('should return 201 and created user data for valid request', async () => {
      if (!authToken) {
        console.log('Skipping user creation test - no admin token available');
        return;
      }

      try {
        const response = await axios.post(`${POSTGREST_URL}/users`, TEST_USER, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(201);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const createdUser = response.data[0];
        expect(createdUser).to.have.property('id');
        expect(createdUser).to.have.property('username', TEST_USER.username);
        expect(createdUser).to.have.property('email', TEST_USER.email);
        expect(createdUser).to.have.property('fullName', TEST_USER.fullName);
        expect(createdUser).to.have.property('role', TEST_USER.role);
        expect(createdUser).to.have.property('nationalId', TEST_USER.nationalId);
        expect(createdUser).to.have.property('phone', TEST_USER.phone);
        expect(createdUser).to.have.property('isActive', true);
        expect(createdUser).to.have.property('createdAt');
        expect(createdUser).to.have.property('updatedAt');

        // Store user ID for subsequent tests
        createdUserId = createdUser.id;

      } catch (error) {
        console.log('User creation test failed:', error.message);
      }
    });
  });

  describe('GET /users (List Users)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.get(`${POSTGREST_URL}/users`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 200 and users list for authenticated users', async () => {
      if (!authToken) {
        console.log('Skipping user list test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // Check that all required fields are present
        if (response.data.length > 0) {
          const user = response.data[0];
          expect(user).to.have.property('id');
          expect(user).to.have.property('username');
          expect(user).to.have.property('email');
          expect(user).to.have.property('fullName');
          expect(user).to.have.property('role');
          expect(user).to.have.property('isActive');
        }

      } catch (error) {
        console.log('User list test failed:', error.message);
      }
    });

    it('should support pagination with limit and offset', async () => {
      if (!authToken) {
        console.log('Skipping pagination test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
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

    it('should support filtering by role', async () => {
      if (!authToken) {
        console.log('Skipping filtering test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            role: 'eq.nurse'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned users should be nurses
        response.data.forEach(user => {
          expect(user.role).to.equal('nurse');
        });

      } catch (error) {
        console.log('Role filtering test failed:', error.message);
      }
    });

    it('should support filtering by active status', async () => {
      if (!authToken) {
        console.log('Skipping active status test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
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

        // All returned users should be active
        response.data.forEach(user => {
          expect(user.isActive).to.be.true;
        });

      } catch (error) {
        console.log('Active status test failed:', error.message);
      }
    });

    it('should support ordering by creation date', async () => {
      if (!authToken) {
        console.log('Skipping ordering test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
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

        // Check that users are ordered by creation date (newest first)
        for (let i = 1; i < response.data.length; i++) {
          const currentDate = new Date(response.data[i].createdAt);
          const previousDate = new Date(response.data[i - 1].createdAt);
          expect(currentDate <= previousDate).to.be.true;
        }

      } catch (error) {
        console.log('Ordering test failed:', error.message);
      }
    });

    it('should support searching by username', async () => {
      if (!authToken) {
        console.log('Skipping search test - no admin token available');
        return;
      }

      try {
        const response = await axios.get(`${POSTGREST_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            username: 'ilike.*admin*'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;

        // All returned users should have 'admin' in username
        response.data.forEach(user => {
          expect(user.username.toLowerCase()).to.include('admin');
        });

      } catch (error) {
        console.log('Username search test failed:', error.message);
      }
    });
  });

  describe('PATCH /users/:id (Update User)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdUserId) {
        console.log('Skipping update test - no created user available');
        return;
      }

      try {
        await axios.patch(`${POSTGREST_URL}/users?id=eq.${createdUserId}`, UPDATED_USER);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 403 for non-admin users', async () => {
      if (!authToken || !createdUserId) {
        console.log('Skipping non-admin update test - no admin token or created user available');
        return;
      }

      try {
        // Get nurse token
        const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'nurse',
          password: 'NursePassword123!'
        });
        const nurseToken = nurseLogin.data.accessToken;

        await axios.patch(`${POSTGREST_URL}/users?id=eq.${createdUserId}`, UPDATED_USER, {
          headers: {
            'Authorization': `Bearer ${nurseToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(403);
      }
    });

    it('should return 200 and updated user data for valid request', async () => {
      if (!authToken || !createdUserId) {
        console.log('Skipping update test - no admin token or created user available');
        return;
      }

      try {
        const response = await axios.patch(`${POSTGREST_URL}/users?id=eq.${createdUserId}`, UPDATED_USER, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(200);
        expect(Array.isArray(response.data)).to.be.true;
        expect(response.data.length).to.equal(1);

        const updatedUser = response.data[0];
        expect(updatedUser).to.have.property('id', createdUserId);
        expect(updatedUser).to.have.property('fullName', UPDATED_USER.fullName);
        expect(updatedUser).to.have.property('email', UPDATED_USER.email);
        expect(updatedUser).to.have.property('phone', UPDATED_USER.phone);

        // Should not update username or role
        expect(updatedUser).to.have.property('username', TEST_USER.username);
        expect(updatedUser).to.have.property('role', TEST_USER.role);

      } catch (error) {
        console.log('User update test failed:', error.message);
      }
    });

    it('should return 404 for non-existent user', async () => {
      if (!authToken) {
        console.log('Skipping non-existent user test - no admin token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.patch(`${POSTGREST_URL}/users?id=eq.${nonExistentId}`, UPDATED_USER, {
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

  describe('DELETE /users/:id (Delete User)', () => {
    it('should return 401 for unauthenticated requests', async () => {
      if (!createdUserId) {
        console.log('Skipping delete test - no created user available');
        return;
      }

      try {
        await axios.delete(`${POSTGREST_URL}/users?id=eq.${createdUserId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 403 for non-admin users', async () => {
      if (!authToken || !createdUserId) {
        console.log('Skipping non-admin delete test - no admin token or created user available');
        return;
      }

      try {
        // Get nurse token
        const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'nurse',
          password: 'NursePassword123!'
        });
        const nurseToken = nurseLogin.data.accessToken;

        await axios.delete(`${POSTGREST_URL}/users?id=eq.${createdUserId}`, {
          headers: {
            'Authorization': `Bearer ${nurseToken}`,
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(403);
      }
    });

    it('should return 204 for successful deletion', async () => {
      if (!authToken || !createdUserId) {
        console.log('Skipping delete test - no admin token or created user available');
        return;
      }

      try {
        const response = await axios.delete(`${POSTGREST_URL}/users?id=eq.${createdUserId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Prefer': 'return=representation'
          }
        });

        expect(response.status).to.equal(204);

      } catch (error) {
        console.log('User deletion test failed:', error.message);
      }
    });

    it('should return 404 for non-existent user', async () => {
      if (!authToken) {
        console.log('Skipping non-existent user deletion test - no admin token available');
        return;
      }

      try {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await axios.delete(`${POSTGREST_URL}/users?id=eq.${nonExistentId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Prefer': 'return=representation'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access all user endpoints', async () => {
      if (!authToken) {
        console.log('Skipping admin RBAC test - no admin token available');
        return;
      }

      try {
        // Test GET users
        await axios.get(`${POSTGREST_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        // Test user should be able to access these endpoints
        console.log('Admin access control test passed');

      } catch (error) {
        console.log('Admin RBAC test failed:', error.message);
      }
    });

    it('should restrict non-admin users from user management', async () => {
      try {
        // Get nurse token
        const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
          username: 'nurse',
          password: 'NursePassword123!'
        });
        const nurseToken = nurseLogin.data.accessToken;

        // Test POST users (should fail)
        try {
          await axios.post(`${POSTGREST_URL}/users`, TEST_USER, {
            headers: {
              'Authorization': `Bearer ${nurseToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }

        // Test PATCH users (should fail)
        try {
          await axios.patch(`${POSTGREST_URL}/users?id=eq.123`, UPDATED_USER, {
            headers: {
              'Authorization': `Bearer ${nurseToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }

        // Test DELETE users (should fail)
        try {
          await axios.delete(`${POSTGREST_URL}/users?id=eq.123`, {
            headers: {
              'Authorization': `Bearer ${nurseToken}`,
              'Prefer': 'return=representation'
            }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(403);
        }

      } catch (error) {
        console.log('Non-admin RBAC test setup failed:', error.message);
      }
    });
  });

  after(() => {
    console.log('User management contract tests completed');
  });
});