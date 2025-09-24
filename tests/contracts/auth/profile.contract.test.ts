import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_USERS, UpdateProfileRequest } from './fixtures';

describe('Profile Management Contract Tests', () => {
  let app: any;
  let authToken: string;
  let userToken: string;

  beforeEach(async () => {
    app = TestSetup.getApp();

    // Create test users
    const adminHashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
    await TestSetup.createTestUser({
      ...TEST_USERS.ADMIN,
      password: adminHashedPassword
    });

    const userHashedPassword = await TestUtils.hashPassword(TEST_USERS.DOCTOR.password);
    await TestSetup.createTestUser({
      ...TEST_USERS.DOCTOR,
      password: userHashedPassword
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERS.ADMIN.username,
        password: TEST_USERS.ADMIN.password
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        username: TEST_USERS.DOCTOR.username,
        password: TEST_USERS.DOCTOR.password
      });

    authToken = adminLogin.body.data.accessToken;
    userToken = userLogin.body.data.accessToken;
  });

  describe('GET /api/auth/profile', () => {
    it('should return 200 and user profile for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: TEST_USERS.ADMIN.id,
          username: TEST_USERS.ADMIN.username,
          email: TEST_USERS.ADMIN.email,
          role: TEST_USERS.ADMIN.role,
          firstName: TEST_USERS.ADMIN.firstName,
          lastName: TEST_USERS.ADMIN.lastName,
          isActive: TEST_USERS.ADMIN.isActive,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      // Should not contain sensitive data
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should return 401 for invalid auth token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 for expired auth token', async () => {
      const expiredToken = TestUtils.generateToken({
        sub: TEST_USERS.ADMIN.id,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should include last login information when available', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Last login should be present after successful login
      expect(response.body.data).toHaveProperty('lastLogin');
    });

    it('should return consistent response format for all user roles', async () => {
      // Test different user roles
      const roles = ['admin', 'doctor', 'nurse', 'receptionist'];

      for (const role of roles) {
        const userData = {
          ...TEST_USERS.ADMIN,
          id: `test_${role}_id`,
          username: `test_${role}`,
          email: `test_${role}@example.com`,
          role: role
        };

        const hashedPassword = await TestUtils.hashPassword(userData.password);
        await TestSetup.createTestUser({
          ...userData,
          password: hashedPassword
        });

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            password: userData.password
          });

        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
          .expect(200);

        expect(profileResponse.body).toMatchObject({
          success: true,
          data: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isActive: userData.isActive
          }
        });
      }
    });
  });

  describe('PUT /api/auth/profile', () => {
    const validProfileUpdate: UpdateProfileRequest = {
      firstName: 'Updated',
      lastName: 'User',
      email: 'updated@example.com',
      phone: '+1234567890'
    };

    it('should return 200 for valid profile update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProfileUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: TEST_USERS.ADMIN.id,
          username: TEST_USERS.ADMIN.username,
          firstName: validProfileUpdate.firstName,
          lastName: validProfileUpdate.lastName,
          email: validProfileUpdate.email,
          phone: validProfileUpdate.phone,
          role: TEST_USERS.ADMIN.role,
          isActive: TEST_USERS.ADMIN.isActive
        }
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUpdate = {
        ...validProfileUpdate,
        email: 'invalid-email'
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateEmailUpdate = {
        ...validProfileUpdate,
        email: TEST_USERS.DOCTOR.email // Use email from existing user
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateEmailUpdate)
        .expect(409);
    });

    it('should return 400 for invalid phone format', async () => {
      const invalidPhoneNumbers = [
        '123',
        'abc123',
        '+12345678901234567890', // too long
        '123-abc-456',
        '   '
      ];

      for (const invalidPhone of invalidPhoneNumbers) {
        const invalidUpdate = {
          ...validProfileUpdate,
          phone: invalidPhone
        };

        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidUpdate);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should return 400 for empty first name', async () => {
      const invalidUpdate = {
        ...validProfileUpdate,
        firstName: ''
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should return 400 for empty last name', async () => {
      const invalidUpdate = {
        ...validProfileUpdate,
        lastName: ''
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .put('/api/auth/profile')
        .send(validProfileUpdate)
        .expect(401);
    });

    it('should allow partial updates', async () => {
      const partialUpdate = {
        firstName: 'Partially'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          firstName: partialUpdate.firstName,
          lastName: TEST_USERS.ADMIN.lastName, // Unchanged
          email: TEST_USERS.ADMIN.email, // Unchanged
          phone: TEST_USERS.ADMIN.phone // Unchanged or null
        }
      });
    });

    it('should handle special characters in names', async () => {
      const specialCharUpdate = {
        firstName: 'José María',
        lastName: 'O\'Connor-Smith',
        email: 'jose@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialCharUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          firstName: specialCharUpdate.firstName,
          lastName: specialCharUpdate.lastName,
          email: specialCharUpdate.email
        }
      });
    });

    it('should validate email uniqueness case-insensitively', async () => {
      const caseInsensitiveEmailUpdate = {
        ...validProfileUpdate,
        email: TEST_USERS.DOCTOR.email.toUpperCase() // Use same email in different case
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(caseInsensitiveEmailUpdate)
        .expect(409);
    });

    it('should return 422 for excessively long field values', async () => {
      const longValue = 'a'.repeat(256); // Exceed typical database limits

      const invalidUpdate = {
        ...validProfileUpdate,
        firstName: longValue
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(422);
    });

    it('should trim whitespace from string fields', async () => {
      const whitespaceUpdate = {
        firstName: '  Trimmed  ',
        lastName: '  Name  ',
        email: '  trimmed@example.com  '
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(whitespaceUpdate)
        .expect(200);

      expect(response.body.data.firstName).toBe('Trimmed');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.email).toBe('trimmed@example.com');
    });
  });
});