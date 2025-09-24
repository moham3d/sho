import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_USERS } from './fixtures';

describe('Authentication Security Contract Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = TestSetup.getApp();

    // Create test user
    const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
    await TestSetup.createTestUser({
      ...TEST_USERS.ADMIN,
      password: hashedPassword
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers on auth endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/auth/login' },
        { method: 'post', path: '/api/auth/register' },
        { method: 'post', path: '/api/auth/refresh' },
        { method: 'get', path: '/api/auth/profile' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);

        const securityValidation = TestUtils.validateSecurityHeaders(response.headers);
        expect(securityValidation.isValid).toBe(true,
          `Security headers validation failed for ${endpoint.method.toUpperCase()} ${endpoint.path}: ${securityValidation.errors.join(', ')}`);
      }
    });

    it('should prevent XSS attacks through input validation', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert(1)</script>',
        '"><img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>'
      ];

      for (const payload of xssPayloads) {
        // Test login endpoint
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: payload,
            password: 'TestPassword123!'
          });

        expect([400, 401, 422]).toContain(loginResponse.status);

        // Test registration endpoint
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send({
            username: payload,
            email: 'test@example.com',
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
            role: 'nurse',
            firstName: payload,
            lastName: 'Test'
          });

        expect([400, 422]).toContain(registerResponse.status);
      }
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' UNION SELECT * FROM users--",
        "'; DROP TABLE users;--",
        "1' OR '1'='1",
        "admin' OR '1'='1"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: payload,
            password: 'TestPassword123!'
          });

        expect([400, 401, 422]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        username: TEST_USERS.ADMIN.username,
        password: 'WrongPassword123!'
      };

      let rateLimited = false;

      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        if (response.status === 429) {
          rateLimited = true;
          expect(response.headers['retry-after']).toBeDefined();
          expect(response.headers['x-ratelimit-limit']).toBeDefined();
          expect(response.headers['x-ratelimit-remaining']).toBeDefined();
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });

    it('should rate limit registration attempts', async () => {
      const registrationData = {
        username: `testuser_${Date.now()}`,
        email: 'rate@test.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        role: 'nurse',
        firstName: 'Rate',
        lastName: 'Test'
      };

      let rateLimited = false;

      for (let i = 0; i < 5; i++) {
        const uniqueRegistration = {
          ...registrationData,
          username: `testuser_${Date.now()}_${i}`,
          email: `rate${i}@test.com`
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(uniqueRegistration);

        if (response.status === 429) {
          rateLimited = true;
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });

    it('should rate limit password change attempts', async () => {
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

      const authToken = loginResponse.body.data.accessToken;

      const passwordChangeData = {
        currentPassword: TEST_USERS.ADMIN.password,
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!'
      };

      let rateLimited = false;

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordChangeData);

        if (response.status === 429) {
          rateLimited = true;
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });
  });

  describe('Token Security', () => {
    it('should validate JWT signature', async () => {
      // Generate token with wrong secret
      const maliciousToken = TestUtils.generateToken({
        sub: TEST_USERS.ADMIN.id,
        username: TEST_USERS.ADMIN.username
      }, '15m');

      // Tamper with token signature
      const parts = maliciousToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered_signature`;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect([401, 403]).toContain(response.status);
    });

    it('should validate JWT expiration', async () => {
      const expiredToken = TestUtils.generateToken({
        sub: TEST_USERS.ADMIN.id,
        username: TEST_USERS.ADMIN.username,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect([401, 403]).toContain(response.status);
    });

    it('should validate JWT issuer and audience', async () => {
      // Generate token with wrong issuer
      const wrongIssuerToken = TestUtils.generateToken({
        sub: TEST_USERS.ADMIN.id,
        username: TEST_USERS.ADMIN.username,
        iss: 'malicious-issuer'
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${wrongIssuerToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Input Validation', () => {
    it('should handle extremely large payloads', async () => {
      const largePayload = {
        username: 'a'.repeat(10000),
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload);

      expect([400, 413, 422]).toContain(response.status);
    });

    it('should handle malformed JSON', async () => {
      const malformedRequests = [
        { data: 'invalid json', contentType: 'application/json' },
        { data: '{ malformed: json }', contentType: 'application/json' },
        { data: '', contentType: 'application/json' },
        { data: null, contentType: 'application/json' }
      ];

      for (const request of malformedRequests) {
        const response = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', request.contentType)
          .send(request.data);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should validate content-type header', async () => {
      const invalidContentTypes = [
        'text/plain',
        'text/html',
        'application/xml',
        'application/x-www-form-urlencoded'
      ];

      for (const contentType of invalidContentTypes) {
        const response = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', contentType)
          .send('username=test&password=test');

        expect([400, 415]).toContain(response.status);
      }
    });
  });

  describe('Session Management', () => {
    it('should invalidate session on password change', async () => {
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

      const authToken = loginResponse.body.data.accessToken;

      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: TEST_USERS.ADMIN.password,
          newPassword: 'NewPassword123!',
          confirmNewPassword: 'NewPassword123!'
        })
        .expect(200);

      // Try to use old token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect([401, 403]).toContain(profileResponse.status);
    });

    it('should handle concurrent sessions', async () => {
      const hashedPassword = await TestUtils.hashPassword(TEST_USERS.ADMIN.password);
      await TestSetup.createTestUser({
        ...TEST_USERS.ADMIN,
        password: hashedPassword
      });

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: TEST_USERS.ADMIN.username,
            password: TEST_USERS.ADMIN.password
          });

        sessions.push(loginResponse.body.data.accessToken);
      }

      // All sessions should be valid initially
      for (const token of sessions) {
        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`);

        expect(profileResponse.status).toBe(200);
      }

      // Logout one session
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${sessions[0]}`)
        .expect(200);

      // The logged out session should be invalid
      const loggedOutResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${sessions[0]}`);

      expect([401, 403]).toContain(loggedOutResponse.status);

      // Other sessions should still be valid
      for (let i = 1; i < sessions.length; i++) {
        const profileResponse = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${sessions[i]}`);

        expect(profileResponse.status).toBe(200);
      }
    });
  });
});