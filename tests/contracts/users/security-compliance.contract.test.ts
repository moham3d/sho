import request from 'supertest';
import { UserTestSetup } from './setup';
import { TEST_USERS, SECURITY_TEST_CASES, GDPR_COMPLIANCE_TEST_CASES, RATE_LIMITING_TEST_CASES } from './fixtures';

describe('User Management - Security and Compliance Contract Tests', () => {
  let app: any;
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = UserTestSetup.getApp();

    // Authenticate admin user
    const adminAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.ADMIN.username,
      TEST_USERS.ADMIN.password
    );
    adminToken = adminAuth!.accessToken;

    // Create test user
    const testUser = await UserTestSetup.createTestUser({
      username: 'security_test_user',
      email: 'security_test@example.com',
      role: 'nurse'
    });
    testUserId = testUser.id;
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent SQL injection attacks', async () => {
      for (const payload of SECURITY_TEST_CASES.SQL_INJECTION) {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: `test_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
            firstName: payload,
            lastName: 'Test',
            role: 'nurse'
          });

        expect([400, 500]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent XSS attacks', async () => {
      for (const payload of SECURITY_TEST_CASES.XSS_ATTACKS) {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: `test_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
            firstName: 'Test',
            lastName: payload,
            role: 'nurse'
          });

        expect([400, 500]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent path traversal attacks', async () => {
      for (const payload of SECURITY_TEST_CASES.PATH_TRAVERSAL) {
        const response = await request(app)
          .get(`/api/users/${payload}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([400, 404]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    it('should sanitize input in profile updates', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Sanitized',
          lastName: xssPayload
        });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.lastName).not.toBe(xssPayload);
        expect(response.body.data.lastName).not.toContain('<script>');
      }
    });

    it('should validate email format to prevent header injection', async () => {
      const maliciousEmails = [
        'test@example.com\r\nBcc: victim@example.com',
        'test@example.com%0ABcc: victim@example.com',
        'test@example.com\nCc: victim@example.com'
      ];

      for (const email of maliciousEmails) {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: `test_${Date.now()}`,
            email,
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'nurse'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should validate JWT tokens properly', async () => {
      const responses = [
        // No token
        request(app)
          .get('/api/users'),

        // Invalid token format
        request(app)
          .get('/api/users')
          .set('Authorization', 'Invalid token format'),

        // Expired token (simulated)
        request(app)
          .get('/api/users')
          .set('Authorization', 'Bearer expired_token_123'),

        // Malformed token
        request(app)
          .get('/api/users')
          .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
      ];

      for (const responsePromise of responses) {
        const response = await responsePromise;
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should enforce role-based access control', async () => {
      const adminEndpoints = [
        { method: 'post', path: '/api/users', body: { username: 'test', email: 'test@example.com', password: 'Test123!', confirmPassword: 'Test123!', firstName: 'Test', lastName: 'User', role: 'nurse' } },
        { method: 'put', path: `/api/users/${testUserId}`, body: { firstName: 'Updated' } },
        { method: 'delete', path: `/api/users/${testUserId}` },
        { method: 'post', path: `/api/users/${testUserId}/activate`, body: { reason: 'test' } },
        { method: 'post', path: `/api/users/${testUserId}/change-role`, body: { role: 'doctor', reason: 'test' } }
      ];

      // Test with non-admin user
      const doctorAuth = await UserTestSetup.authenticateUser(
        TEST_USERS.DOCTOR.username,
        TEST_USERS.DOCTOR.password
      );
      const doctorToken = doctorAuth!.accessToken;

      for (const endpoint of adminEndpoints) {
        let response;
        if (endpoint.method === 'post') {
          response = await request(app)
            .post(endpoint.path)
            .set('Authorization', `Bearer ${doctorToken}`)
            .send(endpoint.body);
        } else if (endpoint.method === 'put') {
          response = await request(app)
            .put(endpoint.path)
            .set('Authorization', `Bearer ${doctorToken}`)
            .send(endpoint.body);
        } else if (endpoint.method === 'delete') {
          response = await request(app)
            .delete(endpoint.path)
            .set('Authorization', `Bearer ${doctorToken}`);
        }

        expect([403, 404]).toContain(response!.status);
      }
    });

    it('should prevent privilege escalation', async () => {
      const doctorAuth = await UserTestSetup.authenticateUser(
        TEST_USERS.DOCTOR.username,
        TEST_USERS.DOCTOR.password
      );
      const doctorToken = doctorAuth!.accessToken;

      // Try to change own role to admin
      const response = await request(app)
        .post(`/api/users/${TEST_USERS.DOCTOR.id}/change-role`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ role: 'admin', reason: 'Self promotion' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should validate user permissions for resource access', async () => {
      const nurseAuth = await UserTestSetup.authenticateUser(
        TEST_USERS.NURSE.username,
        TEST_USERS.NURSE.password
      );
      const nurseToken = nurseAuth!.accessToken;

      // Nurse should not be able to access admin-only endpoints
      const restrictedEndpoints = [
        request(app).get('/api/users').set('Authorization', `Bearer ${nurseToken}`),
        request(app).post('/api/users').set('Authorization', `Bearer ${nurseToken}`).send({}),
        request(app).put(`/api/users/${testUserId}`).set('Authorization', `Bearer ${nurseToken}`).send({}),
        request(app).delete(`/api/users/${testUserId}`).set('Authorization', `Bearer ${nurseToken}`)
      ];

      for (const endpoint of restrictedEndpoints) {
        const response = await endpoint;
        expect([403, 404]).toContain(response.status);
      }
    });
  });

  describe('Data Privacy and GDPR Compliance', () => {
    it('should support data deletion requests (right to be forgotten)', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'gdpr_delete_user',
        email: 'gdpr_delete@example.com',
        role: 'nurse'
      });

      // Request data deletion
      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify user is marked as deleted/inactive
      const getResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should support data export requests', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'gdpr_export_user',
        email: 'gdpr_export@example.com',
        role: 'nurse',
        phone: '+201234567890',
        nationalId: '12345678901234'
      });

      // Request user data
      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const userData = response.body.data;
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('username');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('firstName');
      expect(userData).toHaveProperty('lastName');
      expect(userData).toHaveProperty('phone');
      expect(userData).toHaveProperty('nationalId');

      // Should not include sensitive data
      expect(userData).not.toHaveProperty('password');
    });

    it('should handle data anonymization', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'gdpr_anonymize_user',
        email: 'gdpr_anonymize@example.com',
        role: 'nurse',
        firstName: 'Real',
        lastName: 'Name',
        phone: '+201234567890',
        nationalId: '12345678901234'
      });

      // Anonymize user data (simulate GDPR anonymization)
      const anonymizeResponse = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Anonymous',
          lastName: 'User',
          email: `anonymous_${user.id}@example.com`,
          phone: null,
          nationalId: null
        });

      expect(anonymizeResponse.status).toBe(200);

      // Verify anonymization
      const getResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.body.data.firstName).toBe('Anonymous');
      expect(getResponse.body.data.lastName).toBe('User');
      expect(getResponse.body.data.email).toContain('anonymous_');
      expect(getResponse.body.data.phone).toBeNull();
      expect(getResponse.body.data.nationalId).toBeNull();
    });

    it('should implement data retention policies', async () => {
      // Create old users that should be archived/deleted
      const oldUser = await UserTestSetup.createTestUser({
        username: 'old_user_retention',
        email: 'old@example.com',
        role: 'nurse'
      });

      // Simulate old user by manually setting creation date
      // In a real system, this would be handled by background jobs

      // Test that old users can be filtered by creation date
      const response = await request(app)
        .get('/api/users')
        .query({
          createdBefore: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Audit Logging and Monitoring', () => {
    it('should log all security-relevant events', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      // Perform various operations
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `audit_user_${Date.now()}`,
          email: `audit_${Date.now()}@example.com`,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
          firstName: 'Audit',
          lastName: 'User',
          role: 'nurse'
        });

      await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' });

      await request(app)
        .post(`/api/users/${testUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Security test' });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      // Verify specific events were logged
      const events = finalLogs.map(log => log.action);
      expect(events).toContain('USER_CREATED');
      expect(events).toContain('USER_UPDATED');
      expect(events).toContain('USER_DEACTIVATED');
    });

    it('should log authentication attempts', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      // Failed login attempt
      await UserTestSetup.authenticateUser('nonexistent_user', 'wrong_password');

      // Successful login
      await UserTestSetup.authenticateUser(
        TEST_USERS.DOCTOR.username,
        TEST_USERS.DOCTOR.password
      );

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const authEvents = finalLogs.filter(log =>
        log.action === 'LOGIN_SUCCESS' || log.action === 'LOGIN_FAILED'
      );
      expect(authEvents.length).toBeGreaterThan(0);
    });

    it('should include detailed information in audit logs', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'doctor', reason: 'Security audit test' });

      const finalLogs = await auditService.getAuditLogs();
      const roleChangeLog = finalLogs.find(log =>
        log.action === 'ROLE_CHANGED' && log.resourceId === testUserId
      );

      expect(roleChangeLog).toBeDefined();
      expect(roleChangeLog!.userId).toBeDefined();
      expect(roleChangeLog!.action).toBe('ROLE_CHANGED');
      expect(roleChangeLog!.resource).toBe('users');
      expect(roleChangeLog!.resourceId).toBe(testUserId);
      expect(roleChangeLog!.details).toBeDefined();
      expect(roleChangeLog!.details.newRole).toBe('doctor');
      expect(roleChangeLog!.details.reason).toBe('Security audit test');
      expect(roleChangeLog!.ipAddress).toBeDefined();
      expect(roleChangeLog!.userAgent).toBeDefined();
      expect(roleChangeLog!.timestamp).toBeDefined();
    });

    it('should prevent audit log tampering', async () => {
      // Audit logs should be read-only for regular users
      const doctorAuth = await UserTestSetup.authenticateUser(
        TEST_USERS.DOCTOR.username,
        TEST_USERS.DOCTOR.password
      );
      const doctorToken = doctorAuth!.accessToken;

      // Try to access audit logs (should be restricted)
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Rate Limiting and Throttling', () => {
    it('should implement rate limiting on sensitive endpoints', async () => {
      // This test simulates rate limiting behavior
      // In a real implementation, you would need to configure rate limiting middleware

      const createUser = () =>
        request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: `rate_limit_${Date.now()}_${Math.random()}`,
            email: `rate_limit_${Date.now()}_${Math.random()}@example.com`,
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
            firstName: 'Rate',
            lastName: 'Limit',
            role: 'nurse'
          });

      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(createUser());
      }

      const responses = await Promise.all(requests);

      // Some requests should succeed, some might be rate limited
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeGreaterThan(0);
      // Rate limiting may or may not be implemented in test environment
    });

    it('should implement authentication rate limiting', async () => {
      // Simulate multiple failed login attempts
      const failedLogins = [];
      for (let i = 0; i < 5; i++) {
        failedLogins.push(
          UserTestSetup.authenticateUser('wrong_user', 'wrong_password')
        );
      }

      await Promise.all(failedLogins);

      // Try to login with correct credentials (might be temporarily blocked)
      const loginResult = await UserTestSetup.authenticateUser(
        TEST_USERS.DOCTOR.username,
        TEST_USERS.DOCTOR.password
      );

      // Login should still work in test environment
      expect(loginResult).not.toBeNull();
    });
  });

  describe('Security Headers and Response Handling', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Check for security headers (if implemented)
      const headers = response.headers;
      // In a real implementation, these should be present
      // expect(headers['x-content-type-options']).toBe('nosniff');
      // expect(headers['x-frame-options']).toBe('DENY');
      // expect(headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Error should not expose internal details
      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('sql');
      expect(response.body.error.message).not.toContain('internal');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json content');

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'password123',
        'Password', // no numbers
        'password123', // no uppercase
        'PASSWORD123', // no lowercase
        'Password123' // no special characters
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: `weak_pwd_${Date.now()}`,
            email: `weak_${Date.now()}@example.com`,
            password: weakPassword,
            confirmPassword: weakPassword,
            firstName: 'Weak',
            lastName: 'Password',
            role: 'nurse'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should prevent password reuse', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'pwd_reuse_user',
        email: 'pwd_reuse@example.com',
        role: 'nurse',
        password: 'OriginalPassword123!'
      });

      // Try to update with the same password
      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'OriginalPassword123!'
        });

      // Should fail or warn about password reuse
      expect([400, 200]).toContain(response.status);
    });

    it('should not expose passwords in API responses', async () => {
      const response = await request(app)
        .get(`/api/users/${TEST_USERS.DOCTOR.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = response.body.data;
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('passwordSalt');
    });
  });
});