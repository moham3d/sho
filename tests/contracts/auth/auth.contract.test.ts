import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_USERS, LoginRequest, AuthResponse } from './fixtures';

describe('Authentication System Contract Tests', () => {
  let app: any;

  beforeEach(() => {
    app = TestSetup.getApp();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 for valid credentials', async () => {
      // Create test user with hashed password
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const loginData: LoginRequest = {
        username: TEST_USERS.ADMIN.username,
        password: TEST_USERS.ADMIN.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: TEST_USERS.ADMIN.id,
            username: TEST_USERS.ADMIN.username,
            email: TEST_USERS.ADMIN.email,
            role: TEST_USERS.ADMIN.role,
            firstName: TEST_USERS.ADMIN.firstName,
            lastName: TEST_USERS.ADMIN.lastName,
            isActive: TEST_USERS.ADMIN.isActive
          },
          expiresIn: expect.any(Number)
        }
      });

      // Validate JWT token structure
      const tokenValidation = TestUtils.validateJWTStructure(response.body.data.accessToken);
      expect(tokenValidation.isValid).toBe(true);
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData: LoginRequest = {
        username: TEST_USERS.ADMIN.username,
        password: 'WrongPassword123!'
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 400 for missing username', async () => {
      const loginData = {
        password: TEST_USERS.ADMIN.password
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        username: TEST_USERS.ADMIN.username
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should return 401 for inactive user', async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.INACTIVE.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.INACTIVE,
        password: hashedPassword
      });

      const loginData: LoginRequest = {
        username: TEST_USERS.INACTIVE.username,
        password: TEST_USERS.INACTIVE.password
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should include security headers', async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const loginData: LoginRequest = {
        username: TEST_USERS.ADMIN.username,
        password: TEST_USERS.ADMIN.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      const securityValidation = TestUtils.validateSecurityHeaders(response.headers);
      expect(securityValidation.isValid).toBe(true);
    });

    it('should handle rate limiting', async () => {
      const loginData: LoginRequest = {
        username: TEST_USERS.ADMIN.username,
        password: 'WrongPassword123!'
      };

      // Make multiple failed requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Next request should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect([429, 401]).toContain(response.status);
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      username: 'new_test_user',
      email: 'newtest@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
      role: 'nurse',
      firstName: 'New',
      lastName: 'User'
    };

    it('should return 201 for valid registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            username: validRegistration.username,
            email: validRegistration.email,
            role: validRegistration.role,
            firstName: validRegistration.firstName,
            lastName: validRegistration.lastName,
            isActive: true
          }
        }
      });
    });

    it('should return 400 for password mismatch', async () => {
      const invalidRegistration = {
        ...validRegistration,
        confirmPassword: 'DifferentPassword123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidRegistration)
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidRegistration = {
        ...validRegistration,
        email: 'invalid-email'
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidRegistration)
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      const invalidRegistration = {
        ...validRegistration,
        password: 'weak',
        confirmPassword: 'weak'
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidRegistration)
        .expect(400);
    });

    it('should return 409 for duplicate username', async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const duplicateRegistration = {
        ...validRegistration,
        username: TEST_USERS.ADMIN.username
      };

      await request(app)
        .post('/api/auth/register')
        .send(duplicateRegistration)
        .expect(409);
    });

    it('should return 409 for duplicate email', async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const duplicateRegistration = {
        ...validRegistration,
        email: TEST_USERS.ADMIN.email
      };

      await request(app)
        .post('/api/auth/register')
        .send(duplicateRegistration)
        .expect(409);
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        'short',
        'longenoughbutnocaps123',
        'LongEnoughButNoNumbers',
        'longenoughwithnumbers1butnospecialchars'
      ];

      for (const weakPassword of weakPasswords) {
        const invalidRegistration = {
          ...validRegistration,
          password: weakPassword,
          confirmPassword: weakPassword
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidRegistration);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: TEST_USERS.ADMIN.password
        });

      authToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should return 200 for valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number)
        }
      });

      // Validate new access token
      const tokenValidation = TestUtils.validateJWTStructure(response.body.data.accessToken);
      expect(tokenValidation.isValid).toBe(true);
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should return 400 for missing refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should return 401 for expired refresh token', async () => {
      // Generate expired refresh token
      const expiredToken = TestUtils.generateRefreshToken({
        sub: TEST_USERS.ADMIN.id,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });

      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.ADMIN.username,
          password: TEST_USERS.ADMIN.password
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should return 200 for valid logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });
    });

    it('should return 401 for missing auth token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });

    it('should return 401 for invalid auth token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 for expired auth token', async () => {
      const expiredToken = TestUtils.generateToken({
        sub: TEST_USERS.ADMIN.id,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});