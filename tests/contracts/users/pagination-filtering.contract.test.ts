import request from 'supertest';
import { UserTestSetup } from './setup';
import { TEST_USERS, PAGINATION_TEST_CASES, FILTERING_TEST_CASES, SORTING_TEST_CASES, SEARCH_TEST_CASES } from './fixtures';

describe('User Management - Pagination and Filtering Contract Tests', () => {
  let app: any;
  let adminToken: string;
  let testUsers: any[] = [];

  beforeAll(async () => {
    app = UserTestSetup.getApp();

    // Authenticate admin user
    const adminAuth = await UserTestSetup.authenticateUser(
      TEST_USERS.ADMIN.username,
      TEST_USERS.ADMIN.password
    );
    adminToken = adminAuth!.accessToken;

    // Create test users for pagination/filtering tests
    const userData = [
      { username: 'user_001', email: 'user001@example.com', firstName: 'Alice', lastName: 'Johnson', role: 'doctor' },
      { username: 'user_002', email: 'user002@example.com', firstName: 'Bob', lastName: 'Smith', role: 'nurse' },
      { username: 'user_003', email: 'user003@example.com', firstName: 'Carol', lastName: 'Williams', role: 'doctor' },
      { username: 'user_004', email: 'user004@example.com', firstName: 'David', lastName: 'Brown', role: 'receptionist' },
      { username: 'user_005', email: 'user005@example.com', firstName: 'Eve', lastName: 'Davis', role: 'technician' },
      { username: 'user_006', email: 'user006@example.com', firstName: 'Frank', lastName: 'Miller', role: 'nurse' },
      { username: 'user_007', email: 'user007@example.com', firstName: 'Grace', lastName: 'Wilson', role: 'doctor' },
      { username: 'user_008', email: 'user008@example.com', firstName: 'Henry', lastName: 'Moore', role: 'receptionist' },
      { username: 'user_009', email: 'user009@example.com', firstName: 'Ivy', lastName: 'Taylor', role: 'technician' },
      { username: 'user_010', email: 'user010@example.com', firstName: 'Jack', lastName: 'Anderson', role: 'nurse' },
      { username: 'user_011', email: 'user011@example.com', firstName: 'Kate', lastName: 'Thomas', role: 'doctor' },
      { username: 'user_012', email: 'user012@example.com', firstName: 'Liam', lastName: 'Jackson', role: 'radiologist' },
      { username: 'inactive_001', email: 'inactive001@example.com', firstName: 'Mike', lastName: 'White', role: 'nurse', isActive: false },
      { username: 'inactive_002', email: 'inactive002@example.com', firstName: 'Nancy', lastName: 'Harris', role: 'doctor', isActive: false },
      { username: 'unverified_001', email: 'unverified001@example.com', firstName: 'Oliver', lastName: 'Martin', role: 'receptionist', isEmailVerified: false }
    ];

    for (const data of userData) {
      const user = await UserTestSetup.createTestUser(data);
      testUsers.push(user);
    }
  });

  describe('Pagination', () => {
    it('should return pagination metadata in list responses', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();

      const pagination = response.body.data.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
    });

    it.each(PAGINATION_TEST_CASES)('should handle pagination parameters: %o', async (testCase) => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: testCase.page, limit: testCase.limit })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const pagination = response.body.data.pagination;
      const expectedPage = testCase.expectedPage || testCase.page;
      const expectedLimit = testCase.expectedLimit || testCase.limit;

      expect(pagination.page).toBe(expectedPage);
      expect(pagination.limit).toBe(expectedLimit);
      expect(response.body.data.users.length).toBeLessThanOrEqual(expectedLimit);
    });

    it('should respect maximum limit restrictions', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ limit: 100 }) // Request more than maximum
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(50); // Max limit
      expect(response.body.data.users.length).toBeLessThanOrEqual(50);
    });

    it('should handle pagination beyond available data', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 999, limit: 10 }) // Very high page number
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0); // Empty result
      expect(response.body.data.pagination.page).toBe(999);
    });

    it('should calculate total pages correctly', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const pagination = response.body.data.pagination;
      const expectedTotalPages = Math.ceil(pagination.total / 5);

      expect(pagination.totalPages).toBe(expectedTotalPages);
    });

    it('should handle offset parameter alternative', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ offset: 5, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeLessThanOrEqual(5);

      // Should return different users than first page
      const firstPageResponse = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`);

      const firstPageIds = firstPageResponse.body.data.users.map((u: any) => u.id);
      const offsetPageIds = response.body.data.users.map((u: any) => u.id);

      expect(firstPageIds).not.toEqual(offsetPageIds);
    });
  });

  describe('Filtering', () => {
    it('should filter by role', async () => {
      const roles = ['doctor', 'nurse', 'receptionist', 'technician', 'radiologist'];

      for (const role of roles) {
        const response = await request(app)
          .get('/api/users')
          .query({ role })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // All returned users should have the specified role
        response.body.data.users.forEach((user: any) => {
          expect(user.role).toBe(role);
        });
      }
    });

    it('should filter by multiple roles', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ role: ['doctor', 'nurse'] })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // All returned users should be either doctors or nurses
      response.body.data.users.forEach((user: any) => {
        expect(['doctor', 'nurse']).toContain(user.role);
      });
    });

    it('should filter by active status', async () => {
      // Test active users
      const activeResponse = await request(app)
        .get('/api/users')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activeResponse.status).toBe(200);
      activeResponse.body.data.users.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });

      // Test inactive users
      const inactiveResponse = await request(app)
        .get('/api/users')
        .query({ isActive: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(inactiveResponse.status).toBe(200);
      inactiveResponse.body.data.users.forEach((user: any) => {
        expect(user.isActive).toBe(false);
      });
    });

    it('should filter by email verification status', async () => {
      // Test verified users
      const verifiedResponse = await request(app)
        .get('/api/users')
        .query({ isEmailVerified: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(verifiedResponse.status).toBe(200);
      verifiedResponse.body.data.users.forEach((user: any) => {
        expect(user.isEmailVerified).toBe(true);
      });

      // Test unverified users
      const unverifiedResponse = await request(app)
        .get('/api/users')
        .query({ isEmailVerified: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unverifiedResponse.status).toBe(200);
      unverifiedResponse.body.data.users.forEach((user: any) => {
        expect(user.isEmailVerified).toBe(false);
      });
    });

    it('should filter by date ranges', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Test created after date
      const afterResponse = await request(app)
        .get('/api/users')
        .query({ createdAfter: yesterday })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(afterResponse.status).toBe(200);
      afterResponse.body.data.users.forEach((user: any) => {
        expect(new Date(user.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(yesterday).getTime());
      });

      // Test created before date
      const beforeResponse = await request(app)
        .get('/api/users')
        .query({ createdBefore: tomorrow })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(beforeResponse.status).toBe(200);
      beforeResponse.body.data.users.forEach((user: any) => {
        expect(new Date(user.createdAt).getTime()).toBeLessThanOrEqual(new Date(tomorrow).getTime());
      });

      // Test date range
      const rangeResponse = await request(app)
        .get('/api/users')
        .query({ createdAfter: yesterday, createdBefore: tomorrow })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(rangeResponse.status).toBe(200);
      rangeResponse.body.data.users.forEach((user: any) => {
        const createdDate = new Date(user.createdAt).getTime();
        expect(createdDate).toBeGreaterThanOrEqual(new Date(yesterday).getTime());
        expect(createdDate).toBeLessThanOrEqual(new Date(tomorrow).getTime());
      });
    });

    it('should handle complex filter combinations', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          role: 'doctor',
          isActive: true,
          isEmailVerified: true,
          limit: 10
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe('doctor');
        expect(user.isActive).toBe(true);
        expect(user.isEmailVerified).toBe(true);
      });
    });

    it('should handle filters that return no results', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          role: 'nonexistent_role',
          isActive: true
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('Sorting', () => {
    it.each(SORTING_TEST_CASES)('should sort by $sortBy in $sortOrder order', async (testCase) => {
      const response = await request(app)
        .get('/api/users')
        .query({
          sortBy: testCase.sortBy,
          sortOrder: testCase.sortOrder,
          limit: 50 // Get enough users to test sorting
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const users = response.body.data.users;
      if (users.length > 1) {
        for (let i = 1; i < users.length; i++) {
          const currentValue = users[i][testCase.sortBy as keyof typeof users[0]];
          const previousValue = users[i - 1][testCase.sortBy as keyof typeof users[0]];

          if (testCase.sortOrder === 'asc') {
            expect(currentValue >= previousValue).toBe(true);
          } else {
            expect(currentValue <= previousValue).toBe(true);
          }
        }
      }
    });

    it('should default to sorting by creation date descending', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const users = response.body.data.users;
      if (users.length > 1) {
        for (let i = 1; i < users.length; i++) {
          const currentDate = new Date(users[i].createdAt);
          const previousDate = new Date(users[i - 1].createdAt);
          expect(currentDate <= previousDate).toBe(true);
        }
      }
    });

    it('should handle sorting with pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          sortBy: 'username',
          sortOrder: 'asc',
          page: 1,
          limit: 5
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const users = response.body.data.users;
      if (users.length > 1) {
        for (let i = 1; i < users.length; i++) {
          expect(users[i].username >= users[i - 1].username).toBe(true);
        }
      }

      // Get next page and verify sorting continues
      const nextPageResponse = await request(app)
        .get('/api/users')
        .query({
          sortBy: 'username',
          sortOrder: 'asc',
          page: 2,
          limit: 5
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(nextPageResponse.status).toBe(200);

      const nextPageUsers = nextPageResponse.body.data.users;
      if (nextPageUsers.length > 0 && users.length > 0) {
        expect(nextPageUsers[0].username >= users[users.length - 1].username).toBe(true);
      }
    });
  });

  describe('Search', () => {
    it.each(SEARCH_TEST_CASES)('should search for "$query" and expect results for %o', async (testCase) => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: testCase.query })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const users = response.body.data.users;
      if (testCase.expected.length > 0) {
        expect(users.length).toBeGreaterThan(0);

        // Check that returned users match the search criteria
        users.forEach((user: any) => {
          const searchableText = `${user.username} ${user.email} ${user.firstName} ${user.lastName} ${user.fullName}`.toLowerCase();
          expect(searchableText.includes(testCase.query.toLowerCase())).toBe(true);
        });
      } else {
        // For searches that should return no results
        expect(users.length).toBe(0);
      }
    });

    it('should search across multiple fields', async () => {
      const searchTerm = 'john';
      const response = await request(app)
        .get('/api/users')
        .query({ search: searchTerm })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const users = response.body.data.users;
      users.forEach((user: any) => {
        const searchableText = `${user.username} ${user.email} ${user.firstName} ${user.lastName} ${user.fullName}`.toLowerCase();
        expect(searchableText.includes(searchTerm)).toBe(true);
      });
    });

    it('should handle case-insensitive search', async () => {
      const searchTerms = ['alice', 'ALICE', 'Alice', 'aLiCe'];

      for (const term of searchTerms) {
        const response = await request(app)
          .get('/api/users')
          .query({ search: term })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Should find Alice Johnson regardless of case
        const foundAlice = response.body.data.users.some((user: any) =>
          user.firstName === 'Alice' && user.lastName === 'Johnson'
        );
        expect(foundAlice).toBe(true);
      }
    });

    it('should handle partial matches', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: 'john' }) // Should match 'Johnson'
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Should find users with 'john' in their name
      const foundJohnson = response.body.data.users.some((user: any) =>
        user.lastName === 'Johnson'
      );
      expect(foundJohnson).toBe(true);
    });

    it('should search in combination with filters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          search: 'user',
          role: 'doctor',
          isActive: true
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe('doctor');
        expect(user.isActive).toBe(true);
        const searchableText = `${user.username} ${user.email} ${user.firstName} ${user.lastName} ${user.fullName}`.toLowerCase();
        expect(searchableText.includes('user')).toBe(true);
      });
    });
  });

  describe('Combined Operations', () => {
    it('should handle pagination, filtering, sorting, and search together', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          search: 'user',
          role: ['doctor', 'nurse'],
          isActive: true,
          sortBy: 'username',
          sortOrder: 'asc',
          page: 1,
          limit: 5
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { users, pagination } = response.body.data;

      // Check pagination
      expect(users.length).toBeLessThanOrEqual(5);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(5);

      // Check filters
      users.forEach((user: any) => {
        expect(['doctor', 'nurse']).toContain(user.role);
        expect(user.isActive).toBe(true);
        const searchableText = `${user.username} ${user.email} ${user.firstName} ${user.lastName} ${user.fullName}`.toLowerCase();
        expect(searchableText.includes('user')).toBe(true);
      });

      // Check sorting
      if (users.length > 1) {
        for (let i = 1; i < users.length; i++) {
          expect(users[i].username >= users[i - 1].username).toBe(true);
        }
      }
    });

    it('should handle empty result sets gracefully', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          search: 'nonexistent',
          role: 'nonexistent_role',
          isActive: false,
          isEmailVerified: false
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
      expect(response.body.data.pagination.totalPages).toBe(0);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          page: 'invalid',
          limit: 'invalid',
          sortBy: 'invalid_field',
          sortOrder: 'invalid_order'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      // Should default to valid values or return error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many users for performance testing
      const largeUserCount = 20;
      const largeUsers = [];

      for (let i = 0; i < largeUserCount; i++) {
        const user = await UserTestSetup.createTestUser({
          username: `perf_user_${i}`,
          email: `perf_${i}@example.com`,
          firstName: `Perf`,
          lastName: `User ${i}`,
          role: 'nurse'
        });
        largeUsers.push(user);
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/users')
        .query({ limit: 50 })
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should apply filters efficiently to reduce result set', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({
          role: 'radiologist', // Should have very few results
          limit: 50
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeLessThan(10); // Should be a small result set
    });
  });
});