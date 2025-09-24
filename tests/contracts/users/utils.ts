import request from 'supertest';
import { TestUser, User, UserResponse, SingleUserResponse } from './types';
import { UserTestSetup } from './setup';
import { TEST_USERS } from './fixtures';

export class TestUtils {
  /**
   * Authenticate a user and return authentication token
   */
  static async authenticateUser(username: string, password: string): Promise<{ user: TestUser; accessToken: string; refreshToken: string } | null> {
    return UserTestSetup.authenticateUser(username, password);
  }

  /**
   * Create a test user with default or custom data
   */
  static async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    return UserTestSetup.createTestUser(userData);
  }

  /**
   * Create multiple test users for bulk operations
   */
  static async createTestUsers(count: number, role?: string): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        username: `bulk_user_${i}`,
        email: `bulk_${i}@example.com`,
        role: role || 'nurse'
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Clean up test data
   */
  static async cleanup(): Promise<void> {
    await UserTestSetup.cleanup();
  }

  /**
   * Get authenticated request agent
   */
  static getAuthenticatedRequest(token: string, app: any) {
    return request(app).set('Authorization', `Bearer ${token}`);
  }

  /**
   * Validate API response structure
   */
  static validateApiResponse(response: any, expectedSuccess: boolean = true) {
    expect(response).toHaveProperty('success', expectedSuccess);

    if (expectedSuccess) {
      expect(response).toHaveProperty('data');
    } else {
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
    }
  }

  /**
   * Validate user object structure
   */
  static validateUserObject(user: any, expectSensitiveData: boolean = false) {
    // Required fields
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

    // Optional fields
    if (user.phone !== undefined) {
      expect(typeof user.phone).toBe('string');
    }

    if (user.nationalId !== undefined) {
      expect(typeof user.nationalId).toBe('string');
    }

    // Sensitive data should not be exposed
    if (!expectSensitiveData) {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('passwordSalt');
    }

    // Data types
    expect(typeof user.id).toBe('string');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.firstName).toBe('string');
    expect(typeof user.lastName).toBe('string');
    expect(typeof user.fullName).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.isActive).toBe('boolean');
    expect(typeof user.isEmailVerified).toBe('boolean');
  }

  /**
   * Validate pagination structure
   */
  static validatePagination(pagination: any) {
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('totalPages');

    expect(typeof pagination.page).toBe('number');
    expect(typeof pagination.limit).toBe('number');
    expect(typeof pagination.total).toBe('number');
    expect(typeof pagination.totalPages).toBe('number');

    expect(pagination.page).toBeGreaterThan(0);
    expect(pagination.limit).toBeGreaterThan(0);
    expect(pagination.total).toBeGreaterThanOrEqual(0);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
  }

  /**
   * Validate error response structure
   */
  static validateErrorResponse(response: any, expectedCode: string, expectedMessage?: string) {
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(expectedCode);

    if (expectedMessage) {
      expect(response.error.message).toContain(expectedMessage);
    }

    // Should have validation errors if it's a validation error
    if (expectedCode === 'VALIDATION_ERROR') {
      expect(response.error.validationErrors).toBeDefined();
      expect(Array.isArray(response.error.validationErrors)).toBe(true);
    }
  }

  /**
   * Measure response time for performance testing
   */
  static async measureResponseTime(fn: () => Promise<any>): Promise<{ result: any; timeMs: number }> {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();

    return {
      result,
      timeMs: end - start
    };
  }

  /**
   * Assert response time is within acceptable limits
   */
  static assertResponseTime(timeMs: number, maxTimeMs: number, operation: string) {
    expect(timeMs).toBeLessThan(maxTimeMs,
      `${operation} took ${timeMs}ms, which exceeds the maximum allowed time of ${maxTimeMs}ms`
    );
  }

  /**
   * Generate unique test data
   */
  static generateUniqueTestData(baseData: any = {}) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);

    return {
      username: `test_${timestamp}_${randomId}`,
      email: `test_${timestamp}_${randomId}@example.com`,
      ...baseData
    };
  }

  /**
   * Test authentication scenarios
   */
  static async testAuthenticationScenarios(app: any, endpoints: Array<{ method: string; path: string; body?: any }>) {
    const scenarios = [
      { name: 'No authentication', setup: (req: any) => req },
      { name: 'Invalid token', setup: (req: any) => req.set('Authorization', 'Bearer invalid_token') },
      { name: 'Expired token', setup: (req: any) => req.set('Authorization', 'Bearer expired_token') },
      { name: 'Malformed token', setup: (req: any) => req.set('Authorization', 'Bearer malformed.token') }
    ];

    for (const scenario of scenarios) {
      for (const endpoint of endpoints) {
        let requestBuilder = request(app)[endpoint.method](endpoint.path);

        if (endpoint.body) {
          requestBuilder = requestBuilder.send(endpoint.body);
        }

        requestBuilder = scenario.setup(requestBuilder);

        const response = await requestBuilder;

        expect([401, 403]).toContain(response.status,
          `${scenario.name} should be unauthorized for ${endpoint.method.toUpperCase()} ${endpoint.path}`
        );
      }
    }
  }

  /**
   * Test role-based access control
   */
  static async testRoleBasedAccess(app: any, endpoint: { method: string; path: string; body?: any }, roles: string[]) {
    for (const role of roles) {
      const userData = TEST_USERS[role.toUpperCase() as keyof typeof TEST_USERS];
      if (!userData) continue;

      const authResult = await this.authenticateUser(userData.username, userData.password);
      if (!authResult) continue;

      let requestBuilder = request(app)[endpoint.method](endpoint.path);

      if (endpoint.body) {
        requestBuilder = requestBuilder.send(endpoint.body);
      }

      requestBuilder = requestBuilder.set('Authorization', `Bearer ${authResult.accessToken}`);

      const response = await requestBuilder;

      // Admin should have access, others may or may not
      if (role === 'admin') {
        expect([200, 201, 204]).toContain(response.status,
          `Admin should have access to ${endpoint.method.toUpperCase()} ${endpoint.path}`
        );
      }
    }
  }

  /**
   * Test input validation
   */
  static async testInputValidation(app: any, endpoint: { method: string; path: string }, invalidInputs: Array<{ field: string; value: any; expectedError?: string }>) {
    for (const input of invalidInputs) {
      const body = { [input.field]: input.value };

      let requestBuilder = request(app)[endpoint.method](endpoint.path);

      if (endpoint.method !== 'get') {
        requestBuilder = requestBuilder.send(body);
      } else {
        requestBuilder = requestBuilder.query(body);
      }

      const response = await requestBuilder
        .set('Authorization', `Bearer ${(await this.authenticateUser(TEST_USERS.ADMIN.username, TEST_USERS.ADMIN.password))!.accessToken}`);

      expect(response.status).toBe(400);
      this.validateErrorResponse(response.body, 'VALIDATION_ERROR', input.expectedError);
    }
  }

  /**
   * Clean up database after tests
   */
  static async cleanTestDatabase() {
    const dbService = UserTestSetup.getDatabaseService();
    await dbService.clearTestData();
  }

  /**
   * Get audit logs for verification
   */
  static async getAuditLogs(userId?: string, action?: string) {
    const auditService = UserTestSetup.getAuditService();
    return auditService.getAuditLogs(userId, action);
  }

  /**
   * Verify audit log was created
   */
  static async verifyAuditLog(userId: string, action: string, resourceId?: string) {
    const logs = await this.getAuditLogs(userId, action);

    const targetLog = logs.find(log =>
      log.action === action &&
      (!resourceId || log.resourceId === resourceId)
    );

    expect(targetLog).toBeDefined();
    expect(targetLog!.userId).toBe(userId);
    expect(targetLog!.action).toBe(action);

    if (resourceId) {
      expect(targetLog!.resourceId).toBe(resourceId);
    }

    return targetLog;
  }

  /**
   * Test rate limiting
   */
  static async testRateLimiting(app: any, endpoint: { method: string; path: string; body?: any }, maxRequests: number = 10) {
    const requests = [];

    for (let i = 0; i < maxRequests + 5; i++) {
      let requestBuilder = request(app)[endpoint.method](endpoint.path);

      if (endpoint.body) {
        requestBuilder = requestBuilder.send(endpoint.body);
      }

      const authResult = await this.authenticateUser(TEST_USERS.ADMIN.username, TEST_USERS.ADMIN.password);
      requestBuilder = requestBuilder.set('Authorization', `Bearer ${authResult!.accessToken}`);

      requests.push(requestBuilder);
    }

    const responses = await Promise.all(requests);

    const successCount = responses.filter(r => [200, 201, 204].includes(r.status)).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    // Some requests should succeed, some might be rate limited
    expect(successCount).toBeGreaterThan(0);

    return { successCount, rateLimitedCount };
  }

  /**
   * Generate test report
   */
  static generateTestReport(testResults: any[]) {
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const skipped = testResults.filter(r => r.status === 'skipped').length;

    return {
      total: testResults.length,
      passed,
      failed,
      skipped,
      passRate: (passed / testResults.length) * 100,
      duration: testResults.reduce((acc, r) => acc + (r.duration || 0), 0)
    };
  }
}