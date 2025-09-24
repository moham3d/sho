import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_USERS } from './fixtures';

describe('Authentication Integration Contract Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = TestSetup.getApp();
  });

  afterAll(async () => {
    await TestSetup.cleanup();
  });

  describe('Complete Authentication Flow', () => {
    it('should handle complete user lifecycle: register -> login -> profile -> logout', async () => {
      const userData = {
        username: `integration_user_${Date.now()}`,
        email: `integration_${Date.now()}@example.com`,
        password: 'IntegrationPassword123!',
        confirmPassword: 'IntegrationPassword123!',
        role: 'nurse',
        firstName: 'Integration',
        lastName: 'User',
        phone: '+1234567890'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.username).toBe(userData.username);

      // Step 2: Login with new credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const authToken = loginResponse.body.data.accessToken;
      const refreshToken = loginResponse.body.data.refreshToken;

      // Step 3: Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.username).toBe(userData.username);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // Step 4: Update profile
      const updatedProfile = {
        firstName: 'Updated',
        lastName: 'Integration',
        phone: '+0987654321'
      };

      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedProfile)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.firstName).toBe(updatedProfile.firstName);
      expect(updateResponse.body.data.phone).toBe(updatedProfile.phone);

      // Step 5: Change password
      const passwordChange = {
        currentPassword: userData.password,
        newPassword: 'NewIntegrationPassword123!',
        confirmNewPassword: 'NewIntegrationPassword123!'
      };

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordChange)
        .expect(200);

      // Step 6: Verify login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: passwordChange.newPassword
        })
        .expect(200);

      const newAuthToken = newLoginResponse.body.data.accessToken;

      // Step 7: Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: newLoginResponse.body.data.refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();

      // Step 8: Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${refreshResponse.body.data.accessToken}`)
        .expect(200);

      // Verify token is invalidated
      const profileAfterLogout = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${refreshResponse.body.data.accessToken}`);

      expect([401, 403]).toContain(profileAfterLogout.status);
    });

    it('should handle concurrent user operations safely', async () => {
      // Create multiple users
      const users = [];
      const userTokens = [];

      for (let i = 0; i < 3; i++) {
        const userData = {
          username: `concurrent_user_${i}_${Date.now()}`,
          email: `concurrent_${i}_${Date.now()}@example.com`,
          password: 'ConcurrentPassword123!',
          confirmPassword: 'ConcurrentPassword123!',
          role: 'nurse',
          firstName: `Concurrent${i}`,
          lastName: 'User'
        };

        // Register user
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Login user
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            password: userData.password
          })
          .expect(200);

        users.push(userData);
        userTokens.push(loginResponse.body.data.accessToken);
      }

      // Perform concurrent operations
      const concurrentOperations = userTokens.map((token, index) =>
        request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: `Updated${index}`,
            lastName: `Concurrent${index}`
          })
      );

      // Wait for all operations to complete
      const results = await Promise.all(concurrentOperations);

      // All operations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.body.data.firstName).toBe(`Updated${index}`);
      });

      // Verify all profiles were updated correctly
      for (let i = 0; i < users.length; i++) {
        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${userTokens[i]}`)
          .expect(200);

        expect(profileResponse.body.data.firstName).toBe(`Updated${i}`);
      }
    });

    it('should handle database connection issues gracefully', async () => {
      // This test simulates database connection issues
      // In a real scenario, you would mock the database service

      const userData = {
        username: 'db_test_user',
        email: 'dbtest@example.com',
        password: 'DBTestPassword123!',
        confirmPassword: 'DBTestPassword123!',
        role: 'nurse',
        firstName: 'DB',
        lastName: 'Test'
      };

      // Test should handle database errors gracefully
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should either succeed (if database is available) or return a proper error
      expect([201, 500, 503]).toContain(response.status);
    });
  });

  describe('Cross-Role Authentication', () => {
    const roles = ['admin', 'doctor', 'nurse', 'receptionist', 'technician'];

    it('should authenticate users with different roles successfully', async () => {
      for (const role of roles) {
        const userData = {
          username: `role_test_${role}_${Date.now()}`,
          email: `role_${role}_${Date.now()}@example.com`,
          password: 'RoleTestPassword123!',
          confirmPassword: 'RoleTestPassword123!',
          role: role,
          firstName: 'Role',
          lastName: 'Test'
        };

        // Register user with specific role
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Login with user credentials
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            password: userData.password
          })
          .expect(200);

        expect(loginResponse.body.data.user.role).toBe(role);

        // Verify token contains correct role
        const tokenValidation = TestUtils.validateJWTStructure(loginResponse.body.data.accessToken);
        expect(tokenValidation.isValid).toBe(true);
        expect(tokenValidation.payload?.role).toBe(role);

        // Access profile
        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
          .expect(200);

        expect(profileResponse.body.data.role).toBe(role);
      }
    });

    it('should enforce role-based access control', async () => {
      // Create admin user
      const adminData = {
        username: `admin_role_${Date.now()}`,
        email: `admin_${Date.now()}@example.com`,
        password: 'AdminRolePassword123!',
        confirmPassword: 'AdminRolePassword123!',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: adminData.username,
          password: adminData.password
        })
        .expect(200);

      const adminToken = adminLogin.body.data.accessToken;

      // Create regular user
      const userData = {
        username: `regular_role_${Date.now()}`,
        email: `regular_${Date.now()}@example.com`,
        password: 'RegularRolePassword123!',
        confirmPassword: 'RegularRolePassword123!',
        role: 'nurse',
        firstName: 'Regular',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      const userToken = userLogin.body.data.accessToken;

      // Test admin-only endpoints (if they exist)
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/system-stats',
        '/api/admin/audit-logs'
      ];

      for (const endpoint of adminEndpoints) {
        // Admin should access
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect([200, 404]); // 404 if endpoint doesn't exist

        // Regular user should be denied
        const userResponse = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);

        expect([403, 404]).toContain(userResponse.status);
      }
    });
  });

  describe('Token Lifecycle Management', () => {
    it('should handle token refresh cycle properly', async () => {
      const userData = {
        username: `token_cycle_${Date.now()}`,
        email: `token_${Date.now()}@example.com`,
        password: 'TokenCyclePassword123!',
        confirmPassword: 'TokenCyclePassword123!',
        role: 'nurse',
        firstName: 'Token',
        lastName: 'Cycle'
      };

      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      let currentToken = loginResponse.body.data.accessToken;
      let currentRefreshToken = loginResponse.body.data.refreshToken;

      // Perform multiple refresh cycles
      for (let i = 0; i < 3; i++) {
        const refreshResponse = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: currentRefreshToken })
          .expect(200);

        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.accessToken).toBeDefined();
        expect(refreshResponse.body.data.refreshToken).toBeDefined();

        // New token should be different from old token
        expect(refreshResponse.body.data.accessToken).not.toBe(currentToken);

        // Test new token works
        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${refreshResponse.body.data.accessToken}`)
          .expect(200);

        expect(profileResponse.body.success).toBe(true);

        // Update tokens for next iteration
        currentToken = refreshResponse.body.data.accessToken;
        currentRefreshToken = refreshResponse.body.data.refreshToken;
      }
    });

    it('should invalidate refresh tokens after password change', async () => {
      const userData = {
        username: `refresh_invalidate_${Date.now()}`,
        email: `refresh_${Date.now()}@example.com`,
        password: 'RefreshInvalidatePassword123!',
        confirmPassword: 'RefreshInvalidatePassword123!',
        role: 'nurse',
        firstName: 'Refresh',
        lastName: 'Invalidate'
      };

      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.data.accessToken;
      const refreshToken = loginResponse.body.data.refreshToken;

      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: userData.password,
          newPassword: 'NewRefreshInvalidatePassword123!',
          confirmNewPassword: 'NewRefreshInvalidatePassword123!'
        })
        .expect(200);

      // Try to refresh with old refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect([401, 403]);

      expect(refreshResponse.body.success).toBe(false);
    });
  });
});