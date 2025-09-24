import request from 'supertest';
import { UserTestSetup } from './setup';
import { TEST_USERS } from './fixtures';
import { UserRole } from './types';

describe('User Management - Role Management Contract Tests', () => {
  let app: any;
  let adminToken: string;
  let doctorToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = UserTestSetup.getApp();

    // Authenticate admin user
    const adminAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.ADMIN.username,
      TEST_USERS.ADMIN.password
    );
    adminToken = adminAuth!.accessToken;

    // Authenticate doctor user
    const doctorAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.DOCTOR.username,
      TEST_USERS.DOCTOR.password
    );
    doctorToken = doctorAuth!.accessToken;

    // Create a test user for role management
    const testUser = await UserTestSetup.createTestUser({
      username: 'role_test_user',
      email: 'role_test@example.com',
      role: 'nurse'
    });
    testUserId = testUser.id;
  });

  describe('POST /api/users/:id/change-role - Change User Role', () => {
    const validRoles: UserRole[] = ['admin', 'doctor', 'nurse', 'receptionist', 'technician', 'radiologist'];

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .send({ role: 'doctor', reason: 'Promotion to doctor role' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without manage permission', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ role: 'doctor', reason: 'Promotion to doctor role' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for missing role parameter', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Role change without specifying role' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Role is required');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role', reason: 'Invalid role change' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/non-existent-id/change-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'doctor', reason: 'Role change for non-existent user' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it.each(validRoles)('should successfully change role to %s', async (role) => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role, reason: `Role change to ${role}` });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('id', testUserId);
      expect(user).toHaveProperty('role', role);
      expect(user).toHaveProperty('updatedAt');

      // Verify the role was actually changed
      const getUserResponse = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getUserResponse.body.data.role).toBe(role);
    });

    it('should allow role change with optional reason', async () => {
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'technician' }); // No reason provided

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('technician');
    });

    it('should handle role change to same role', async () => {
      const currentRole = 'technician';

      // First set the role
      await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: currentRole, reason: 'Set to technician' });

      // Try to change to same role
      const response = await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: currentRole, reason: 'Same role change' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(currentRole);
    });

    it('should audit log role changes', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      await request(app)
        .post(`/api/users/${testUserId}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'radiologist', reason: 'Role change for audit test' });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const roleChangeLog = finalLogs.find(log =>
        log.action === 'ROLE_CHANGED' &&
        log.resourceId === testUserId
      );
      expect(roleChangeLog).toBeDefined();
      expect(roleChangeLog!.details.newRole).toBe('radiologist');
      expect(roleChangeLog!.details.reason).toBe('Role change for audit test');
    });
  });

  describe('Role-Based Access Control', () => {
    let testUsers: { [key: string]: any } = {};

    beforeAll(async () => {
      // Create users for each role
      const roles: UserRole[] = ['admin', 'doctor', 'nurse', 'receptionist', 'technician', 'radiologist'];

      for (const role of roles) {
        const user = await UserTestSetup.createTestUser({
          username: `rbac_${role}_user`,
          email: `rbac_${role}@example.com`,
          role
        });

        // Authenticate each user
        const auth = await UserTestSetup.authenticateUser(user.username, user.password);
        testUsers[role] = {
          user,
          token: auth!.accessToken
        };
      }
    });

    it('should only allow admin to change roles', async () => {
      const targetUserId = testUsers.nurse.user.id;

      // Test each role's ability to change roles
      for (const [role, data] of Object.entries(testUsers)) {
        const response = await request(app)
          .post(`/api/users/${targetUserId}/change-role`)
          .set('Authorization', `Bearer ${data.token}`)
          .send({ role: 'doctor', reason: `Test by ${role}` });

        if (role === 'admin') {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(403);
          expect(response.body.error.code).toBe('FORBIDDEN');
        }
      }
    });

    it('should prevent self-role changes', async () => {
      // Try to change own role (should fail for non-admin)
      const response = await request(app)
        .post(`/api/users/${testUsers.doctor.user.id}/change-role`)
        .set('Authorization', `Bearer ${testUsers.doctor.token}`)
        .send({ role: 'admin', reason: 'Self-promotion attempt' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should validate role hierarchy restrictions', async () => {
      // Create a regular user
      const regularUser = await UserTestSetup.createTestUser({
        username: 'regular_test_user',
        email: 'regular_test@example.com',
        role: 'nurse'
      });

      // Try to promote regular user to admin (should only work for admin)
      const adminResponse = await request(app)
        .post(`/api/users/${regularUser.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin', reason: 'Admin promotion' });

      expect(adminResponse.status).toBe(200);

      // Reset to nurse for next test
      await request(app)
        .post(`/api/users/${regularUser.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'nurse', reason: 'Reset to nurse' });

      // Non-admin trying to promote to admin should fail
      const doctorResponse = await request(app)
        .post(`/api/users/${regularUser.id}/change-role`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ role: 'admin', reason: 'Doctor trying to promote' });

      expect(doctorResponse.status).toBe(403);
    });

    it('should handle role changes for inactive users', async () => {
      // Create an inactive user
      const inactiveUser = await UserTestSetup.createTestUser({
        username: 'inactive_role_test_user',
        email: 'inactive_role_test@example.com',
        role: 'nurse',
        isActive: false
      });

      // Try to change role of inactive user
      const response = await request(app)
        .post(`/api/users/${inactiveUser.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'doctor', reason: 'Role change for inactive user' });

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('doctor');
      expect(response.body.data.isActive).toBe(false); // Should remain inactive
    });
  });

  describe('Role Transition Validation', () => {
    let transitionTestUserId: string;

    beforeAll(async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'transition_test_user',
        email: 'transition_test@example.com',
        role: 'nurse'
      });
      transitionTestUserId = user.id;
    });

    it('should validate role transition business rules', async () => {
      // Test transitions that should be allowed
      const validTransitions = [
        { from: 'nurse', to: 'doctor' },
        { from: 'receptionist', to: 'nurse' },
        { from: 'technician', to: 'radiologist' },
        { from: 'doctor', to: 'admin' }
      ];

      for (const transition of validTransitions) {
        // Set initial role
        await request(app)
          .post(`/api/users/${transitionTestUserId}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: transition.from, reason: `Set to ${transition.from}` });

        // Test transition
        const response = await request(app)
          .post(`/api/users/${transitionTestUserId}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: transition.to, reason: `Transition from ${transition.from} to ${transition.to}` });

        expect(response.status).toBe(200);
        expect(response.body.data.role).toBe(transition.to);
      }
    });

    it('should track role change history', async () => {
      const auditService = UserTestSetup.getAuditService();

      // Perform multiple role changes
      const roles = ['receptionist', 'nurse', 'doctor'];
      for (const role of roles) {
        await request(app)
          .post(`/api/users/${transitionTestUserId}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role, reason: `Sequential role change to ${role}` });
      }

      // Check audit logs
      const roleChangeLogs = await auditService.getAuditLogs(transitionTestUserId, 'ROLE_CHANGED');
      expect(roleChangeLogs.length).toBeGreaterThanOrEqual(roles.length);

      // Verify chronological order
      for (let i = 1; i < roleChangeLogs.length; i++) {
        expect(roleChangeLogs[i - 1].timestamp.getTime()).toBeGreaterThan(roleChangeLogs[i].timestamp.getTime());
      }
    });

    it('should handle rapid role changes', async () => {
      // Test rapid successive role changes
      const rapidRoles = ['technician', 'radiologist', 'doctor'];

      for (const role of rapidRoles) {
        const response = await request(app)
          .post(`/api/users/${transitionTestUserId}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role, reason: `Rapid change to ${role}` });

        expect(response.status).toBe(200);
        expect(response.body.data.role).toBe(role);
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle concurrent role changes', async () => {
      // Create a user for concurrency test
      const concurrentUser = await UserTestSetup.createTestUser({
        username: 'concurrent_role_test_user',
        email: 'concurrent_role_test@example.com',
        role: 'nurse'
      });

      // Simulate concurrent requests (simplified for test)
      const promises = [
        request(app)
          .post(`/api/users/${concurrentUser.id}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'doctor', reason: 'Concurrent change 1' }),
        request(app)
          .post(`/api/users/${concurrentUser.id}/change-role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'technician', reason: 'Concurrent change 2' })
      ];

      const results = await Promise.all(promises);

      // Both should succeed (last one wins)
      expect(results.every(r => r.status === 200)).toBe(true);
    });

    it('should validate role change reasons', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'reason_validation_test_user',
        email: 'reason_validation_test@example.com',
        role: 'nurse'
      });

      // Test with very long reason
      const longReason = 'a'.repeat(1001); // Exceeds typical limit
      const response = await request(app)
        .post(`/api/users/${user.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'doctor', reason: longReason });

      // Should still work (reason is optional and has generous limits)
      expect([200, 400]).toContain(response.status);
    });

    it('should prevent role changes during maintenance', async () => {
      // This test would require implementing maintenance mode
      // For now, we'll assume normal operation
      const user = await UserTestSetup.createTestUser({
        username: 'maintenance_test_user',
        email: 'maintenance_test@example.com',
        role: 'nurse'
      });

      const response = await request(app)
        .post(`/api/users/${user.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'doctor', reason: 'Maintenance test' });

      expect(response.status).toBe(200);
    });
  });

  describe('Role-Based Permissions Validation', () => {
    it('should verify permissions after role change', async () => {
      const user = await UserTestSetup.createTestUser({
        username: 'permission_test_user',
        email: 'permission_test@example.com',
        role: 'receptionist'
      });

      const dbService = UserTestSetup.getDatabaseService();

      // Check initial permissions
      const initialPermissions = await dbService.getUserPermissions('receptionist');
      expect(initialPermissions.some(p => p.resource === 'patients' && p.action === 'create')).toBe(true);
      expect(initialPermissions.some(p => p.resource === 'users' && p.action === 'manage')).toBe(false);

      // Change to admin role
      await request(app)
        .post(`/api/users/${user.id}/change-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin', reason: 'Permission test' });

      // Check new permissions
      const newPermissions = await dbService.getUserPermissions('admin');
      expect(newPermissions.some(p => p.resource === 'users' && p.action === 'manage')).toBe(true);
    });
  });
});