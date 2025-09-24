import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../../../backend/src/database/DatabaseService';
import { AuthService } from '../../../backend/src/auth/AuthService';
import { AuthController } from '../../../backend/src/auth/auth.controller';
import { AuthMiddleware } from '../../../backend/src/auth/auth.middleware';
import { createAuthRoutes } from '../../../backend/src/auth/auth.routes';
import { TestUtils } from './utils';
import { MockDatabaseService } from './mocks';

export class TestSetup {
  private static app: express.Application;
  private static dbService: any;

  static async initialize() {
    // Initialize test database (use mock for testing)
    this.dbService = new MockDatabaseService();
    await this.dbService.connect();

    // Create Express app for testing
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Initialize auth services
    const authService = new AuthService(
      this.dbService,
      process.env.JWT_SECRET || 'test-secret-key',
      '15m',
      '7d'
    );

    const authController = new AuthController(this.dbService, authService);
    const authMiddleware = new AuthMiddleware(authService);

    // Setup auth routes
    this.app.use('/api/auth', createAuthRoutes(authController, authMiddleware));

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Test error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    });
  }

  static async cleanup() {
    await this.dbService.clearTestData();
    await this.dbService.disconnect();
  }

  static getApp(): express.Application {
    return this.app;
  }

  static getDatabaseService() {
    return this.dbService;
  }

  static async createTestUser(userData: any) {
    return this.dbService.createTestUser(userData);
  }
}

// Global test setup
beforeAll(async () => {
  await TestSetup.initialize();
});

afterAll(async () => {
  await TestSetup.cleanup();
});

beforeEach(async () => {
  // Clear test data before each test
  await TestSetup.cleanup();
});

afterEach(async () => {
  // Clean up after each test
});

export { TestSetup };