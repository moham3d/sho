import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../../../backend/src/database/DatabaseService';
import { AuthService } from '../../../backend/src/auth/AuthService';
import { AuthMiddleware } from '../../../backend/src/auth/auth.middleware';
import { MockDatabaseService, MockAuthService, MockAuditService } from './mocks';
import { TestUser, TestContext } from './types';
import { TEST_USERS } from './fixtures';

export class UserTestSetup {
  private static app: express.Application;
  private static dbService: MockDatabaseService;
  private static authService: MockAuthService;
  private static auditService: MockAuditService;
  private static testContext: TestContext;

  static async initialize() {
    // Initialize mock services
    this.dbService = new MockDatabaseService();
    this.authService = new MockAuthService();
    this.auditService = new MockAuditService();

    await this.dbService.connect();

    // Create Express app for testing
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Setup authentication middleware
    const authMiddleware = {
      authenticate: async (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Missing or invalid authorization header'
            }
          });
        }

        const token = authHeader.substring(7);
        const payload = await this.authService.verifyToken(token);

        if (!payload) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired token'
            }
          });
        }

        req.user = payload;
        next();
      },

      requireRole: (roles: string[]) => {
        return async (req: any, res: any, next: any) => {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            });
          }

          if (!roles.includes(req.user.role)) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            });
          }

          next();
        };
      },

      requirePermission: (resource: string, action: string) => {
        return async (req: any, res: any, next: any) => {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            });
          }

          const hasPermission = await this.dbService.hasPermission(req.user.userId, resource, action);

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            });
          }

          next();
        };
      }
    };

    // Setup user routes
    this.setupUserRoutes(authMiddleware);

    // Setup auth routes for testing
    this.setupAuthRoutes();

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Test error:', err);

      if (err.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Resource already exists'
          }
        });
      }

      if (err.code === '23503') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Invalid reference'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    });
  }

  private static setupUserRoutes(authMiddleware: any) {
    // GET /api/users - List users
    this.app.get('/api/users',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'read'),
      async (req, res) => {
        try {
          const params = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 10, 50),
            offset: parseInt(req.query.offset as string) || 0,
            sortBy: req.query.sortBy as string || 'createdAt',
            sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
            search: req.query.search as string,
            role: req.query.role as string,
            isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
            isEmailVerified: req.query.isEmailVerified ? req.query.isEmailVerified === 'true' : undefined
          };

          const result = await this.dbService.findUsers(params);

          const totalPages = Math.ceil(result.total / params.limit);

          res.json({
            success: true,
            data: {
              users: result.users,
              pagination: {
                page: params.page,
                limit: params.limit,
                total: result.total,
                totalPages
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch users'
            }
          });
        }
      }
    );

    // GET /api/users/:id - Get user by ID
    this.app.get('/api/users/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'read'),
      async (req, res) => {
        try {
          const user = await this.dbService.findUserById(req.params.id);

          if (!user) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          res.json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch user'
            }
          });
        }
      }
    );

    // POST /api/users - Create user
    this.app.post('/api/users',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'create'),
      async (req, res) => {
        try {
          const { username, email, password, confirmPassword, firstName, lastName, role, phone, nationalId } = req.body;

          // Validation
          if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !role) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Missing required fields',
                validationErrors: [
                  { field: 'required', message: 'All required fields must be provided' }
                ]
              }
            });
          }

          if (password !== confirmPassword) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Passwords do not match',
                validationErrors: [
                  { field: 'confirmPassword', message: 'Passwords do not match' }
                ]
              }
            });
          }

          // Check for existing user
          const existingUser = await this.dbService.findUserByUsername(username) ||
                             await this.dbService.findUserByEmail(email);

          if (existingUser) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'USER_ALREADY_EXISTS',
                message: 'User with this username or email already exists'
              }
            });
          }

          const user = await this.dbService.createUser({
            username,
            email,
            password,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            role,
            phone,
            nationalId,
            isActive: true,
            isEmailVerified: false
          });

          // Log the action
          await this.auditService.logAction(req.user.userId, 'USER_CREATED', 'users', user.id, {
            username: user.username,
            email: user.email,
            role: user.role
          });

          res.status(201).json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create user'
            }
          });
        }
      }
    );

    // PUT /api/users/:id - Update user
    this.app.put('/api/users/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'update'),
      async (req, res) => {
        try {
          const { firstName, lastName, email, phone, role, nationalId } = req.body;

          const existingUser = await this.dbService.findUserById(req.params.id);
          if (!existingUser) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          const updatedUser = await this.dbService.updateUser(req.params.id, {
            firstName,
            lastName,
            email,
            phone,
            role,
            nationalId,
            fullName: firstName && lastName ? `${firstName} ${lastName}` : existingUser.fullName
          });

          // Log the action
          await this.auditService.logAction(req.user.userId, 'USER_UPDATED', 'users', req.params.id, {
            updatedFields: Object.keys(req.body)
          });

          res.json({
            success: true,
            data: updatedUser
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update user'
            }
          });
        }
      }
    );

    // DELETE /api/users/:id - Delete user
    this.app.delete('/api/users/:id',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'delete'),
      async (req, res) => {
        try {
          const existingUser = await this.dbService.findUserById(req.params.id);
          if (!existingUser) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          await this.dbService.deleteUser(req.params.id);

          // Log the action
          await this.auditService.logAction(req.user.userId, 'USER_DELETED', 'users', req.params.id, {
            deletedUser: existingUser.username
          });

          res.status(204).send();
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete user'
            }
          });
        }
      }
    );

    // GET /api/users/me - Get current user profile
    this.app.get('/api/users/me',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const user = await this.dbService.findUserById(req.user.userId);

          if (!user) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          // Log the action
          await this.auditService.logAction(req.user.userId, 'PROFILE_VIEWED', 'users', req.user.userId);

          res.json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch profile'
            }
          });
        }
      }
    );

    // PUT /api/users/me - Update current user profile
    this.app.put('/api/users/me',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const { firstName, lastName, email, phone, bio, avatar } = req.body;

          const existingUser = await this.dbService.findUserById(req.user.userId);
          if (!existingUser) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          const updatedUser = await this.dbService.updateUser(req.user.userId, {
            firstName,
            lastName,
            email,
            phone,
            fullName: firstName && lastName ? `${firstName} ${lastName}` : existingUser.fullName
          });

          // Log the action
          await this.auditService.logAction(req.user.userId, 'PROFILE_UPDATED', 'users', req.user.userId, {
            updatedFields: Object.keys(req.body)
          });

          res.json({
            success: true,
            data: updatedUser
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to update profile'
            }
          });
        }
      }
    );

    // POST /api/users/:id/activate - Activate user
    this.app.post('/api/users/:id/activate',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'manage'),
      async (req, res) => {
        try {
          const { reason } = req.body;

          const user = await this.dbService.activateUser(req.params.id, reason);

          if (!user) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          // Log the action
          await this.auditService.logAction(req.user.userId, 'USER_ACTIVATED', 'users', req.params.id, {
            reason
          });

          res.json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to activate user'
            }
          });
        }
      }
    );

    // POST /api/users/:id/deactivate - Deactivate user
    this.app.post('/api/users/:id/deactivate',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'manage'),
      async (req, res) => {
        try {
          const { reason } = req.body;

          const user = await this.dbService.deactivateUser(req.params.id, reason);

          if (!user) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          // Log the action
          await this.auditService.logAction(req.user.userId, 'USER_DEACTIVATED', 'users', req.params.id, {
            reason
          });

          res.json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to deactivate user'
            }
          });
        }
      }
    );

    // POST /api/users/:id/change-role - Change user role
    this.app.post('/api/users/:id/change-role',
      authMiddleware.authenticate,
      authMiddleware.requirePermission('users', 'manage'),
      async (req, res) => {
        try {
          const { role, reason } = req.body;

          if (!role) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Role is required'
              }
            });
          }

          const user = await this.dbService.changeUserRole(req.params.id, role, reason);

          if (!user) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              }
            });
          }

          // Log the action
          await this.auditService.logAction(req.user.userId, 'ROLE_CHANGED', 'users', req.params.id, {
            newRole: role,
            reason
          });

          res.json({
            success: true,
            data: user
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to change user role'
            }
          });
        }
      }
    );
  }

  private static setupAuthRoutes() {
    // POST /api/auth/login - Login
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Username and password are required'
            }
          });
        }

        const result = await this.authService.authenticateUser(username, password);

        if (!result) {
          // Log failed login attempt
          await this.auditService.logAction('unknown', 'LOGIN_FAILED', 'auth', 'unknown', {
            username,
            reason: 'invalid_credentials'
          });

          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid username or password'
            }
          });
        }

        // Log successful login
        await this.auditService.logAction(result.user.id, 'LOGIN_SUCCESS', 'auth', result.user.id);

        res.json({
          success: true,
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: 900 // 15 minutes
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Login failed'
          }
        });
      }
    });
  }

  static async cleanup() {
    if (this.dbService) {
      await this.dbService.clearTestData();
      await this.dbService.disconnect();
    }
    if (this.auditService) {
      await this.auditService.clearLogs();
    }
  }

  static getApp(): express.Application {
    return this.app;
  }

  static getDatabaseService(): MockDatabaseService {
    return this.dbService;
  }

  static getAuthService(): MockAuthService {
    return this.authService;
  }

  static getAuditService(): MockAuditService {
    return this.auditService;
  }

  static async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    return this.dbService.createTestUser(userData);
  }

  static async authenticateUser(username: string, password: string): Promise<{ user: TestUser; accessToken: string; refreshToken: string } | null> {
    return this.authService.authenticateUser(username, password);
  }
}

// Global test setup
beforeAll(async () => {
  await UserTestSetup.initialize();
});

afterAll(async () => {
  await UserTestSetup.cleanup();
});

beforeEach(async () => {
  // Clear test data before each test
  await UserTestSetup.cleanup();
});

afterEach(async () => {
  // Clean up after each test
});

export { UserTestSetup };