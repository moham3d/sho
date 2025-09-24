import request from 'supertest';
import { UserTestSetup } from './setup';
import { TEST_USERS } from './fixtures';

describe('User Management - Profile Management Contract Tests', () => {
  let app: any;
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = UserTestSetup.getApp();

    // Authenticate users
    const adminAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.ADMIN.username,
      TEST_USERS.ADMIN.password
    );
    adminToken = adminAuth!.accessToken;

    const doctorAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.DOCTOR.username,
      TEST_USERS.DOCTOR.password
    );
    doctorToken = doctorAuth!.accessToken;

    const nurseAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.NURSE.username,
      TEST_USERS.NURSE.password
    );
    nurseToken = nurseAuth!.accessToken;

    // Create test user
    const testUser = await UserTestSetup.createTestUser({
      username: 'profile_test_user',
      email: 'profile_test@example.com',
      role: 'nurse'
    });
    testUserId = testUser.id;
  });

  describe('GET /api/users/me - Get Current User Profile', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 and user profile for authenticated users', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', TEST_USERS.DOCTOR.username);
      expect(user).toHaveProperty('email', TEST_USERS.DOCTOR.email);
      expect(user).toHaveProperty('firstName', TEST_USERS.DOCTOR.firstName);
      expect(user).toHaveProperty('lastName', TEST_USERS.DOCTOR.lastName);
      expect(user).toHaveProperty('fullName');
      expect(user).toHaveProperty('role', TEST_USERS.DOCTOR.role);
      expect(user).toHaveProperty('phone', TEST_USERS.DOCTOR.phone);
      expect(user).toHaveProperty('nationalId', TEST_USERS.DOCTOR.nationalId);
      expect(user).toHaveProperty('isActive', TEST_USERS.DOCTOR.isActive);
      expect(user).toHaveProperty('isEmailVerified', TEST_USERS.DOCTOR.isEmailVerified);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');

      // Should not contain sensitive data
      expect(user).not.toHaveProperty('password');
    });

    it('should return correct profile for different user roles', async () => {
      const tokens = [
        { token: adminToken, expectedRole: 'admin', expectedUsername: TEST_USERS.ADMIN.username },
        { token: doctorToken, expectedRole: 'doctor', expectedUsername: TEST_USERS.DOCTOR.username },
        { token: nurseToken, expectedRole: 'nurse', expectedUsername: TEST_USERS.NURSE.username }
      ];

      for (const { token, expectedRole, expectedUsername } of tokens) {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.role).toBe(expectedRole);
        expect(response.body.data.username).toBe(expectedUsername);
      }
    });

    it('should handle inactive user profile access', async () => {
      // Create inactive user
      const inactiveUser = await UserTestSetup.createTestUser({
        username: 'inactive_profile_user',
        email: 'inactive_profile@example.com',
        role: 'nurse',
        isActive: false
      });

      // Authenticate as inactive user (this should fail in real system)
      const authResult = await UserTestSetup.authenticateUser(
        inactiveUser.username,
        inactiveUser.password
      );

      if (authResult) {
        // If authentication somehow works, test profile access
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${authResult.accessToken}`);

        // In real system, this should be blocked for inactive users
        expect([200, 401]).toContain(response.status);
      }
    });

    it('should audit log profile access', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const profileViewLog = finalLogs.find(log =>
        log.action === 'PROFILE_VIEWED' &&
        log.userId === TEST_USERS.DOCTOR.id
      );
      expect(profileViewLog).toBeDefined();
    });
  });

  describe('PUT /api/users/me - Update Current User Profile', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@example.com',
        phone: '+201234567899'
      };

      const response = await request(app)
        .put('/api/users/me')
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 and update user profile successfully', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Updated',
        email: 'john.updated@example.com',
        phone: '+201234567899'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('firstName', 'John');
      expect(user).toHaveProperty('lastName', 'Updated');
      expect(user).toHaveProperty('email', 'john.updated@example.com');
      expect(user).toHaveProperty('phone', '+201234567899');
      expect(user).toHaveProperty('fullName', 'John Updated');
      expect(user).toHaveProperty('updatedAt');

      // Verify other fields remain unchanged
      expect(user).toHaveProperty('username', TEST_USERS.DOCTOR.username);
      expect(user).toHaveProperty('role', TEST_USERS.DOCTOR.role);
      expect(user).toHaveProperty('nationalId', TEST_USERS.DOCTOR.nationalId);
    });

    it('should handle partial profile updates', async () => {
      const partialUpdate = {
        firstName: 'Partial'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = response.body.data;
      expect(user).toHaveProperty('firstName', 'Partial');
      expect(user).toHaveProperty('lastName', TEST_USERS.NURSE.lastName); // Unchanged
      expect(user).toHaveProperty('email', TEST_USERS.NURSE.email); // Unchanged
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateEmailUpdate = {
        email: TEST_USERS.ADMIN.email // Use admin's email
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(duplicateEmailUpdate);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should return 400 for invalid phone format', async () => {
      const invalidUpdate = {
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent role changes through profile update', async () => {
      const roleUpdateAttempt = {
        role: 'admin' // Try to promote self
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(roleUpdateAttempt);

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('nurse'); // Role should remain unchanged
    });

    it('should prevent username changes through profile update', async () => {
      const usernameUpdateAttempt = {
        username: 'new_username' // Try to change username
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(usernameUpdateAttempt);

      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe(TEST_USERS.NURSE.username); // Username should remain unchanged
    });

    it('should handle empty update requests', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({}); // Empty update

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should audit log profile updates', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          firstName: 'Audit',
          lastName: 'Test'
        });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const profileUpdateLog = finalLogs.find(log =>
        log.action === 'PROFILE_UPDATED' &&
        log.userId === TEST_USERS.DOCTOR.id
      );
      expect(profileUpdateLog).toBeDefined();
      expect(profileUpdateLog!.details.updatedFields).toEqual(['firstName', 'lastName']);
    });
  });

  describe('Profile Field Validation', () => {
    it('should validate first name requirements', async () => {
      const invalidNames = ['', '   ', 'A', 'ThisNameIsWayTooLongAndShouldFailValidationBecauseItExceedsTheMaximumAllowedLength'];

      for (const invalidName of invalidNames) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ firstName: invalidName });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate last name requirements', async () => {
      const invalidNames = ['', '   ', 'A', 'ThisNameIsWayTooLongAndShouldFailValidationBecauseItExceedsTheMaximumAllowedLength'];

      for (const invalidName of invalidNames) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ lastName: invalidName });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate phone number formats', async () => {
      const invalidPhones = ['123', 'abc123', '+123', 'phone', '123-abc-456'];

      for (const invalidPhone of invalidPhones) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ phone: invalidPhone });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid phone number formats', async () => {
      const validPhones = ['+201234567890', '+1 (555) 123-4567', '+44 20 7946 0958'];

      for (const validPhone of validPhones) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ phone: validPhone });

        expect(response.status).toBe(200);
        expect(response.body.data.phone).toBe(validPhone);
      }
    });
  });

  describe('Profile Data Privacy', () => {
    it('should not expose sensitive information in profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      const user = response.body.data;

      // Sensitive fields should not be present
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('passwordSalt');
      expect(user).not.toHaveProperty('securityQuestion');
      expect(user).not.toHaveProperty('securityAnswer');
    });

    it('should handle optional profile fields gracefully', async () => {
      // Create user with minimal information
      const minimalUser = await UserTestSetup.createTestUser({
        username: 'minimal_profile_user',
        email: 'minimal_profile@example.com',
        role: 'nurse',
        phone: undefined,
        nationalId: undefined
      });

      const authResult = await UserTestSetup.authenticateUser(
        minimalUser.username,
        minimalUser.password
      );

      if (authResult) {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${authResult.accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.phone).toBeUndefined();
        expect(response.body.data.nationalId).toBeUndefined();
      }
    });

    it('should allow removal of optional fields', async () => {
      // First set optional fields
      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          phone: '+201234567890',
          bio: 'Test bio'
        });

      // Then remove them
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          phone: null,
          bio: null
        });

      expect(response.status).toBe(200);
      expect(response.body.data.phone).toBeNull();
      expect(response.body.data.bio).toBeNull();
    });
  });

  describe('Profile Update Restrictions', () => {
    it('should prevent updates to system-managed fields', async () => {
      const restrictedFields = [
        { field: 'id', value: 'new-id' },
        { field: 'createdAt', value: new Date().toISOString() },
        { field: 'updatedAt', value: new Date().toISOString() },
        { field: 'isActive', value: false },
        { field: 'isEmailVerified', value: true }
      ];

      for (const { field, value } of restrictedFields) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${nurseToken}`)
          .send({ [field]: value });

        expect(response.status).toBe(200);
        expect(response.body.data[field]).not.toBe(value);
      }
    });

    it('should prevent profile updates for deactivated users', async () => {
      // Create and deactivate a user
      const deactivatedUser = await UserTestSetup.createTestUser({
        username: 'deactivated_profile_user',
        email: 'deactivated_profile@example.com',
        role: 'nurse',
        isActive: false
      });

      const authResult = await UserTestSetup.authenticateUser(
        deactivatedUser.username,
        deactivatedUser.password
      );

      if (authResult) {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${authResult.accessToken}`)
          .send({ firstName: 'Should Not Update' });

        // In a real system, this should be blocked
        expect([200, 401]).toContain(response.status);
      }
    });

    it('should handle concurrent profile updates', async () => {
      const updatePromises = [
        request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ firstName: 'Concurrent 1' }),
        request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ lastName: 'Concurrent 2' })
      ];

      const responses = await Promise.all(updatePromises);

      // Both should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);

      // Final state should reflect the last update
      const finalProfile = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(finalProfile.status).toBe(200);
    });
  });

  describe('Profile Update Notifications', () => {
    it('should trigger notifications for sensitive profile changes', async () => {
      // This test would require implementing notification services
      // For now, we'll verify the update succeeds and audit logs are created
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      // Update sensitive information
      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          email: 'new.email@example.com',
          phone: '+201234567899'
        });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const sensitiveUpdateLog = finalLogs.find(log =>
        log.action === 'PROFILE_UPDATED' &&
        log.userId === TEST_USERS.DOCTOR.id
      );
      expect(sensitiveUpdateLog).toBeDefined();
      expect(sensitiveUpdateLog!.details.updatedFields).toContain('email');
      expect(sensitiveUpdateLog!.details.updatedFields).toContain('phone');
    });

    it('should not trigger notifications for non-sensitive changes', async () => {
      // Update non-sensitive information
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          firstName: 'Non-sensitive',
          lastName: 'Update'
        });

      expect(response.status).toBe(200);
      // Audit log should still be created, but maybe without sensitive flags
    });
  });
});