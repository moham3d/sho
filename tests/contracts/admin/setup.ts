import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { MockDatabaseService } from './mocks';
import { TEST_ADMIN_USERS } from './fixtures';

export class TestSetup {
  private static app: express.Application;
  private static dbService: any;
  private static authService: any;
  private static adminService: any;
  private static auditService: any;

  static async initialize() {
    // Initialize test database
    this.dbService = new MockDatabaseService();
    await this.dbService.connect();

    // Create Express app for testing
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Mock authentication service
    this.authService = {
      authenticate: jest.fn(),
      authorize: jest.fn(),
      generateToken: jest.fn(),
      validateToken: jest.fn()
    };

    // Mock admin service
    this.adminService = {
      getSystemMetrics: jest.fn(),
      setMaintenanceMode: jest.fn(),
      getMaintenanceMode: jest.fn(),
      createBackup: jest.fn(),
      restoreDatabase: jest.fn(),
      getSystemConfigurations: jest.fn(),
      updateSystemConfiguration: jest.fn(),
      getUserActivity: jest.fn()
    };

    // Mock audit service
    this.auditService = {
      getAuditLogs: jest.fn(),
      generateUsageReport: jest.fn(),
      generateComplianceReport: jest.fn(),
      exportAuditLogs: jest.fn()
    };

    // Setup admin routes (mock implementation)
    this.setupMockRoutes();

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

  private static setupMockRoutes() {
    // System metrics endpoint
    this.app.get('/api/admin/system-metrics', (req, res) => {
      res.json({
        success: true,
        data: {
          cpu: { usage: 25.5, cores: 4, loadAverage: [0.25, 0.30, 0.35] },
          memory: { total: 8589934592, used: 3221225472, usagePercentage: 37.5 },
          disk: { total: 107374182400, used: 32212254720, usagePercentage: 30.0 },
          uptime: 86400,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Audit logs endpoint
    this.app.get('/api/admin/audit-logs', (req, res) => {
      const { page = 1, limit = 50, action, entityType, startDate, endDate } = req.query;

      res.json({
        success: true,
        data: [
          {
            id: '1',
            userId: '1',
            username: 'admin',
            action: 'ADMIN_ACTION',
            entityType: 'system',
            entityId: 'config_1',
            ipAddress: '192.168.1.100',
            userAgent: 'test-agent',
            timestamp: new Date().toISOString(),
            description: 'System configuration update'
          }
        ],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 1,
          totalPages: 1
        }
      });
    });

    // User activity endpoint
    this.app.get('/api/admin/users/activity', (req, res) => {
      res.json({
        success: true,
        data: {
          totalUsers: 150,
          activeUsers: 125,
          concurrentSessions: 45,
          averageSessionDuration: 1800,
          usersByRole: [
            { role: 'admin', count: 5, activeUsers: 5 },
            { role: 'doctor', count: 20, activeUsers: 18 },
            { role: 'nurse', count: 30, activeUsers: 25 }
          ]
        }
      });
    });

    // Backup endpoint
    this.app.post('/api/admin/system/backup', (req, res) => {
      const { type, includeAttachments, description, retentionDays } = req.body;

      res.json({
        success: true,
        data: {
          id: `backup_${Date.now()}`,
          filename: `backup_${Date.now()}.sql`,
          type,
          size: 1024000,
          checksum: 'checksum_123',
          status: 'completed',
          startTime: new Date(Date.now() - 300000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 300000,
          description,
          retentionDays: retentionDays || 30
        }
      });
    });

    // Restore endpoint
    this.app.post('/api/admin/system/restore', (req, res) => {
      const { backupId, includeAttachments, dryRun, verifyIntegrity } = req.body;

      res.json({
        success: true,
        data: {
          id: `restore_${Date.now()}`,
          backupId,
          status: 'completed',
          startTime: new Date(Date.now() - 600000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 600000,
          dryRun,
          verifyIntegrity,
          summary: {
            tablesRestored: 15,
            recordsRestored: 5000,
            attachmentsRestored: 100
          }
        }
      });
    });

    // System configuration endpoints
    this.app.get('/api/admin/system/configuration', (req, res) => {
      const { category } = req.query;

      res.json({
        success: true,
        data: [
          {
            id: '1',
            key: 'max_sessions_per_user',
            value: 5,
            type: 'number',
            category: 'security',
            description: 'Maximum concurrent sessions per user',
            isEditable: true,
            isSensitive: false,
            lastModified: new Date().toISOString(),
            lastModifiedBy: '1'
          }
        ]
      });
    });

    this.app.put('/api/admin/system/configuration', (req, res) => {
      const { id, key, value, type, category } = req.body;

      res.json({
        success: true,
        data: {
          id,
          key,
          value,
          type,
          category,
          description: 'Test configuration',
          isEditable: true,
          isSensitive: false,
          lastModified: new Date().toISOString(),
          lastModifiedBy: '1'
        }
      });
    });

    // Maintenance mode endpoint
    this.app.post('/api/admin/system/maintenance-mode', (req, res) => {
      const { enabled, message, endTime, allowAdminAccess } = req.body;

      res.json({
        success: true,
        data: {
          enabled,
          message: message || 'System maintenance in progress',
          endTime: endTime || new Date(Date.now() + 3600000).toISOString(),
          allowAdminAccess: allowAdminAccess ?? true,
          initiatedBy: '1',
          initiatedAt: new Date().toISOString()
        }
      });
    });

    // Reports endpoints
    this.app.get('/api/admin/reports/usage', (req, res) => {
      const { type = 'daily', startDate, endDate } = req.query;

      res.json({
        success: true,
        data: {
          id: `usage_report_${Date.now()}`,
          type,
          period: {
            start: startDate || new Date(Date.now() - 86400000).toISOString(),
            end: endDate || new Date().toISOString()
          },
          summary: {
            totalUsers: 150,
            activeUsers: 125,
            totalPatients: 2500,
            totalVisits: 500,
            totalForms: 1200,
            totalStorageUsed: 21474836480
          },
          generatedAt: new Date().toISOString()
        }
      });
    });

    this.app.get('/api/admin/reports/compliance', (req, res) => {
      const { type = 'HIPAA', startDate, endDate } = req.query;

      res.json({
        success: true,
        data: {
          id: `compliance_report_${Date.now()}`,
          type,
          period: {
            start: startDate || new Date(Date.now() - 604800000).toISOString(),
            end: endDate || new Date().toISOString()
          },
          status: 'COMPLIANT',
          summary: {
            totalChecks: 50,
            passedChecks: 48,
            failedChecks: 0,
            warningChecks: 2,
            score: 96
          },
          generatedAt: new Date().toISOString()
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

  static getAuthService() {
    return this.authService;
  }

  static getAdminService() {
    return this.adminService;
  }

  static getAuditService() {
    return this.auditService;
  }

  static async createTestUser(userData: any) {
    return this.dbService.createTestUser(userData);
  }

  static async createTestAuditLog(logData: any) {
    return this.dbService.createAuditLog(logData);
  }

  static async createTestConfiguration(configData: any) {
    return this.dbService.createSystemConfiguration(configData);
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
  await TestSetup.initialize();
});

afterEach(async () => {
  // Clean up after each test
  jest.clearAllMocks();
});

export { TestSetup };