import request from 'supertest';
import { UserTestSetup } from './setup';
import { TEST_USERS, NEW_USER_DATA, UPDATE_USER_DATA, VALIDATION_TEST_CASES } from './fixtures';
import { User, ValidationError } from './types';

describe('User Management - CRUD Operations Contract Tests', () => {
  let app: any;
  let authToken: string;
  let adminToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    app = UserTestSetup.getApp();

    // Authenticate admin user
    const adminAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.ADMIN.username,
      TEST_USERS.ADMIN.password
    );
    adminToken = adminAuth!.accessToken;

    // Authenticate regular user
    const userAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.DOCTOR.username,
      TEST_USERS.DOCTOR.password
    );
    authToken = userAuth!.accessToken;
  });

  describe('POST /api/users - Create User', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(NEW_USER_DATA);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without create permission', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(NEW_USER_DATA);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser',
          email: 'test@example.com'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.validationErrors).toBeDefined();
    });

    it('should return 400 for password mismatch', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.validationErrors).toHaveLength(1);
      expect(response.body.error.validationErrors[0].field).toBe('confirmPassword');
    });

    it('should return 409 for duplicate username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          username: TEST_USERS.ADMIN.username
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          email: TEST_USERS.ADMIN.email
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should return 201 and create user successfully', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(NEW_USER_DATA);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('id');
      expect(user.username).toBe(NEW_USER_DATA.username);
      expect(user.email).toBe(NEW_USER_DATA.email);
      expect(user.firstName).toBe(NEW_USER_DATA.firstName);
      expect(user.lastName).toBe(NEW_USER_DATA.lastName);
      expect(user.role).toBe(NEW_USER_DATA.role);
      expect(user.phone).toBe(NEW_USER_DATA.phone);
      expect(user.nationalId).toBe(NEW_USER_DATA.nationalId);
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');

      // Store user ID for subsequent tests
      createdUserId = user.id;
    });

    describe('Input Validation', () => {
      it.each(VALIDATION_TEST_CASES.INVALID_USERNAMES)('should reject invalid username: %s', async (username) => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            username
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it.each(VALIDATION_TEST_CASES.INVALID_EMAILS)('should reject invalid email: %s', async (email) => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it.each(VALIDATION_TEST_CASES.INVALID_PASSWORDS)('should reject invalid password: %s', async (password) => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            password,
            confirmPassword: password
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it.each(VALIDATION_TEST_CASES.INVALID_NAMES)('should reject invalid first name: %s', async (firstName) => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            firstName
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it.each(VALIDATION_TEST_CASES.INVALID_PHONES)('should reject invalid phone: %s', async (phone) => {
        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            phone
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/users - List Users', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without read permission', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 200 and list users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();

      const pagination = response.body.data.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');

      // Verify user structure
      if (response.body.data.users.length > 0) {
        const user = response.body.data.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
        expect(user).toHaveProperty('fullName');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActive');
        expect(user).toHaveProperty('isEmailVerified');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
      }
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should handle empty results', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: 'nonexistentuser' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/users/${TEST_USERS.ADMIN.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without read permission', async () => {
      const response = await request(app)
        .get(`/api/users/${TEST_USERS.ADMIN.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 200 and user data for valid ID', async () => {
      const response = await request(app)
        .get(`/api/users/${TEST_USERS.ADMIN.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('id', TEST_USERS.ADMIN.id);
      expect(user).toHaveProperty('username', TEST_USERS.ADMIN.username);
      expect(user).toHaveProperty('email', TEST_USERS.ADMIN.email);
      expect(user).toHaveProperty('firstName', TEST_USERS.ADMIN.firstName);
      expect(user).toHaveProperty('lastName', TEST_USERS.ADMIN.lastName);
      expect(user).toHaveProperty('fullName');
      expect(user).toHaveProperty('role', TEST_USERS.ADMIN.role);
      expect(user).toHaveProperty('phone', TEST_USERS.ADMIN.phone);
      expect(user).toHaveProperty('nationalId', TEST_USERS.ADMIN.nationalId);
      expect(user).toHaveProperty('isActive', TEST_USERS.ADMIN.isActive);
      expect(user).toHaveProperty('isEmailVerified', TEST_USERS.ADMIN.isEmailVerified);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put(`/api/users/${TEST_USERS.DOCTOR.id}`)
        .send(UPDATE_USER_DATA);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without update permission', async () => {
      const response = await request(app)
        .put(`/api/users/${TEST_USERS.DOCTOR.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(UPDATE_USER_DATA);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(UPDATE_USER_DATA);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 200 and update user successfully', async () => {
      if (!createdUserId) {
        // Create a user first
        const createResponse = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            ...NEW_USER_DATA,
            username: 'update_test_user',
            email: 'update_test@example.com'
          });

        createdUserId = createResponse.body.data.id;
      }

      const response = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(UPDATE_USER_DATA);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const user = response.body.data;
      expect(user).toHaveProperty('id', createdUserId);
      expect(user).toHaveProperty('firstName', UPDATE_USER_DATA.firstName);
      expect(user).toHaveProperty('lastName', UPDATE_USER_DATA.lastName);
      expect(user).toHaveProperty('email', UPDATE_USER_DATA.email);
      expect(user).toHaveProperty('phone', UPDATE_USER_DATA.phone);
      expect(user).toHaveProperty('fullName', `${UPDATE_USER_DATA.firstName} ${UPDATE_USER_DATA.lastName}`);
      expect(user).toHaveProperty('updatedAt');

      // Verify original data is preserved
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('role');
    });

    it('should handle partial updates', async () => {
      if (!createdUserId) return;

      const partialUpdate = { firstName: 'Partially' };
      const response = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Partially');
      expect(response.body.data.lastName).toBe(UPDATE_USER_DATA.lastName); // Should remain unchanged
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    let userIdToDelete: string;

    beforeAll(async () => {
      // Create a user to delete
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          username: 'delete_test_user',
          email: 'delete_test@example.com'
        });

      if (createResponse.body.data && createResponse.body.data.id) {
        userIdToDelete = createResponse.body.data.id;
      } else {
        // Fallback: create a user directly
        const user = await UserTestSetup.createTestUser({
          username: 'delete_test_user',
          email: 'delete_test@example.com',
          role: 'nurse'
        });
        userIdToDelete = user.id;
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete(`/api/users/${userIdToDelete}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for users without delete permission', async () => {
      const response = await request(app)
        .delete(`/api/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 204 and delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify user is deleted (should return 404)
      const getResponse = await request(app)
        .get(`/api/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should prevent deletion of already deleted user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id-format')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Audit Logging', () => {
    it('should log user creation', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          username: 'audit_test_user',
          email: 'audit_test@example.com'
        });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const creationLog = finalLogs.find(log => log.action === 'USER_CREATED');
      expect(creationLog).toBeDefined();
      expect(creationLog!.resource).toBe('users');
    });

    it('should log user updates', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      // Create a user first
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          username: 'audit_update_test_user',
          email: 'audit_update_test@example.com'
        });

      const userId = createResponse.body.data.id;

      await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' });

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const updateLog = finalLogs.find(log => log.action === 'USER_UPDATED');
      expect(updateLog).toBeDefined();
      expect(updateLog!.resource).toBe('users');
      expect(updateLog!.resourceId).toBe(userId);
    });

    it('should log user deletion', async () => {
      const auditService = UserTestSetup.getAuditService();
      const initialLogs = await auditService.getAuditLogs();

      // Create a user first
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...NEW_USER_DATA,
          username: 'audit_delete_test_user',
          email: 'audit_delete_test@example.com'
        });

      const userId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const finalLogs = await auditService.getAuditLogs();
      expect(finalLogs.length).toBeGreaterThan(initialLogs.length);

      const deleteLog = finalLogs.find(log => log.action === 'USER_DELETED');
      expect(deleteLog).toBeDefined();
      expect(deleteLog!.resource).toBe('users');
      expect(deleteLog!.resourceId).toBe(userId);
    });
  });
});