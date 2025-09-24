import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_ADMIN_USERS, SAMPLE_SYSTEM_METRICS, SAMPLE_AUDIT_LOGS, SECURITY_HEADERS } from './fixtures';
import {
  SystemMetrics,
  AuditLog,
  SystemConfiguration,
  MaintenanceMode,
  UsageReport,
  ComplianceReport,
  BackupRequest,
  RestoreRequest
} from './types';

describe('Admin Functions Contract Tests', () => {
  let app: any;
  let authToken: string;
  let systemAdminToken: string;
  let auditAdminToken: string;
  let regularUserToken: string;

  beforeEach(() => {
    app = TestSetup.getApp();
  });

  describe('1. GET /api/admin/system-metrics', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );
    });

    it('should return 200 and system metrics for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const metrics = response.body.data;
      expect(TestUtils.validateSystemMetrics(metrics)).toBe(true);
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/admin/system-metrics')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      regularUserToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.REGULAR_USER.id,
        TEST_ADMIN_USERS.REGULAR_USER.username,
        TEST_ADMIN_USERS.REGULAR_USER.role,
        TEST_ADMIN_USERS.REGULAR_USER.permissions
      );

      await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should include security headers in response', async () => {
      const response = await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${authToken}`);

      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        if (key.startsWith('X-') || key === 'Content-Security-Policy') {
          expect(response.headers[key.toLowerCase()]).toBeDefined();
        }
      });
    });
  });

  describe('2. GET /api/admin/audit-logs (with filtering)', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );

      // Create test audit logs
      for (const log of SAMPLE_AUDIT_LOGS) {
        await TestSetup.createTestAuditLog(log);
      }
    });

    it('should return 200 and paginated audit logs for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(TestUtils.validatePagination(response.body.pagination)).toBe(true);

      // Validate audit log structure
      if (response.body.data.length > 0) {
        const log = response.body.data[0];
        expect(TestUtils.validateAuditLog(log)).toBe(true);
      }
    });

    it('should support filtering by action type', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?action=ADMIN_ACTION')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((log: AuditLog) => log.action === 'ADMIN_ACTION')).toBe(true);
    });

    it('should support filtering by entity type', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?entityType=system_configuration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((log: AuditLog) => log.entityType === 'system_configuration')).toBe(true);
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/audit-logs?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((log: AuditLog) => {
        const logDate = new Date(log.timestamp);
        return logDate >= new Date(startDate) && logDate <= new Date(endDate);
      })).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should support searching audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?search=backup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All results should contain the search term in description or action
      response.body.data.forEach((log: AuditLog) => {
        const searchableText = `${log.action} ${log.description || ''} ${log.entityType}`.toLowerCase();
        expect(searchableText).toContain('backup');
      });
    });

    it('should return 403 for users without audit permissions', async () => {
      const limitedAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.LIMITED_ADMIN.id,
        TEST_ADMIN_USERS.LIMITED_ADMIN.username,
        TEST_ADMIN_USERS.LIMITED_ADMIN.role,
        TEST_ADMIN_USERS.LIMITED_ADMIN.permissions
      );

      await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${limitedAdminToken}`)
        .expect(403);
    });
  });

  describe('3. GET /api/admin/users/activity', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );
    });

    it('should return 200 and user activity statistics for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const stats = response.body.data;
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('concurrentSessions');
      expect(stats).toHaveProperty('averageSessionDuration');
      expect(stats).toHaveProperty('usersByRole');

      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(Array.isArray(stats.usersByRole)).toBe(true);
    });

    it('should include detailed breakdown by user roles', async () => {
      const response = await request(app)
        .get('/api/admin/users/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const roleBreakdown = response.body.data.usersByRole;
      expect(roleBreakdown.length).toBeGreaterThan(0);

      roleBreakdown.forEach((role: any) => {
        expect(role).toHaveProperty('role');
        expect(role).toHaveProperty('count');
        expect(role).toHaveProperty('activeUsers');
        expect(typeof role.count).toBe('number');
        expect(typeof role.activeUsers).toBe('number');
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/admin/users/activity')
        .expect(401);
    });
  });

  describe('4. POST /api/admin/system/backup', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should create a backup with valid parameters', async () => {
      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: true,
        description: 'Test backup',
        retentionDays: 30
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const backup = response.body.data;
      expect(backup).toHaveProperty('id');
      expect(backup).toHaveProperty('filename');
      expect(backup).toHaveProperty('type', backupRequest.type);
      expect(backup).toHaveProperty('status');
      expect(backup).toHaveProperty('startTime');
      expect(backup).toHaveProperty('retentionDays', backupRequest.retentionDays);
    });

    it('should validate backup request parameters', async () => {
      const invalidRequest = {
        type: 'invalid_type',
        includeAttachments: 'not_a_boolean',
        retentionDays: -1
      };

      await request(app)
        .post('/api/admin/system/backup')
        .send(invalidRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should support different backup types', async () => {
      const backupTypes = ['full', 'incremental', 'differential'];

      for (const type of backupTypes) {
        const backupRequest: BackupRequest = {
          type: type as any,
          includeAttachments: false,
          description: `${type} backup test`
        };

        const response = await request(app)
          .post('/api/admin/system/backup')
          .send(backupRequest)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.type).toBe(type);
      }
    });

    it('should require backup creation permissions', async () => {
      const auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );

      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: false
      };

      await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(403);
    });
  });

  describe('5. POST /api/admin/system/restore', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should initiate database restore with valid parameters', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: true,
        dryRun: true,
        verifyIntegrity: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const restore = response.body.data;
      expect(restore).toHaveProperty('id');
      expect(restore).toHaveProperty('backupId', restoreRequest.backupId);
      expect(restore).toHaveProperty('status');
      expect(restore).toHaveProperty('startTime');
      expect(restore).toHaveProperty('dryRun', restoreRequest.dryRun);
      expect(restore).toHaveProperty('verifyIntegrity', restoreRequest.verifyIntegrity);
    });

    it('should validate restore request parameters', async () => {
      const invalidRequest = {
        backupId: '',
        includeAttachments: 'not_a_boolean',
        dryRun: 'not_a_boolean'
      };

      await request(app)
        .post('/api/admin/system/restore')
        .send(invalidRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should support dry run mode', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: false,
        dryRun: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.dryRun).toBe(true);
      expect(response.body.data.status).toMatch(/^(pending|completed|failed)$/);
    });

    it('should require restore permissions', async () => {
      const limitedAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.LIMITED_ADMIN.id,
        TEST_ADMIN_USERS.LIMITED_ADMIN.username,
        TEST_ADMIN_USERS.LIMITED_ADMIN.role,
        TEST_ADMIN_USERS.LIMITED_ADMIN.permissions
      );

      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: false
      };

      await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${limitedAdminToken}`)
        .expect(403);
    });
  });

  describe('6. GET /api/admin/system/configuration', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );

      // Create test configurations
      await TestSetup.createTestConfiguration({
        key: 'test_config',
        value: 'test_value',
        type: 'string',
        category: 'test',
        description: 'Test configuration',
        isEditable: true,
        isSensitive: false,
        lastModifiedBy: '1'
      });
    });

    it('should return system configurations for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/system/configuration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const config = response.body.data[0];
        expect(TestUtils.validateSystemConfiguration(config)).toBe(true);
      }
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/admin/system/configuration?category=security')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((config: SystemConfiguration) => config.category === 'security')).toBe(true);
    });

    it('should mask sensitive configuration values', async () => {
      await TestSetup.createTestConfiguration({
        key: 'secret_key',
        value: 'secret_value',
        type: 'string',
        category: 'security',
        description: 'Secret configuration',
        isEditable: false,
        isSensitive: true,
        lastModifiedBy: '1'
      });

      const response = await request(app)
        .get('/api/admin/system/configuration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sensitiveConfig = response.body.data.find((config: SystemConfiguration) => config.key === 'secret_key');
      if (sensitiveConfig) {
        expect(sensitiveConfig.value).toBe('***MASKED***');
      }
    });
  });

  describe('7. PUT /api/admin/system/configuration', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should update system configuration with valid parameters', async () => {
      const configUpdate = {
        id: 'config_1',
        key: 'max_sessions_per_user',
        value: 10,
        type: 'number',
        category: 'security',
        description: 'Maximum concurrent sessions per user'
      };

      const response = await request(app)
        .put('/api/admin/system/configuration')
        .send(configUpdate)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const config = response.body.data;
      expect(config.value).toBe(configUpdate.value);
      expect(config.lastModifiedBy).toBe('1');
    });

    it('should validate configuration update parameters', async () => {
      const invalidUpdate = {
        id: '',
        key: '',
        value: 'test',
        type: 'invalid_type',
        category: ''
      };

      await request(app)
        .put('/api/admin/system/configuration')
        .send(invalidUpdate)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should prevent updating sensitive configurations', async () => {
      const sensitiveUpdate = {
        id: 'sensitive_config',
        key: 'database_encryption_key',
        value: 'new_key',
        type: 'string',
        category: 'security',
        description: 'Database encryption key'
      };

      await request(app)
        .put('/api/admin/system/configuration')
        .send(sensitiveUpdate)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('8. POST /api/admin/system/maintenance-mode', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );
    });

    it('should enable maintenance mode with valid parameters', async () => {
      const maintenanceRequest = {
        enabled: true,
        message: 'System maintenance in progress',
        endTime: new Date(Date.now() + 3600000).toISOString(),
        allowAdminAccess: true
      };

      const response = await request(app)
        .post('/api/admin/system/maintenance-mode')
        .send(maintenanceRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const maintenance = response.body.data;
      expect(maintenance.enabled).toBe(maintenanceRequest.enabled);
      expect(maintenance.message).toBe(maintenanceRequest.message);
      expect(maintenance.allowAdminAccess).toBe(maintenanceRequest.allowAdminAccess);
      expect(maintenance.initiatedBy).toBe('1');
    });

    it('should disable maintenance mode', async () => {
      const disableRequest = {
        enabled: false
      };

      const response = await request(app)
        .post('/api/admin/system/maintenance-mode')
        .send(disableRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.enabled).toBe(false);
    });

    it('should validate maintenance mode parameters', async () => {
      const invalidRequest = {
        enabled: 'not_a_boolean',
        endTime: 'invalid_date'
      };

      await request(app)
        .post('/api/admin/system/maintenance-mode')
        .send(invalidRequest)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should require super admin permissions', async () => {
      const systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );

      const maintenanceRequest = {
        enabled: true,
        message: 'Test maintenance'
      };

      await request(app)
        .post('/api/admin/system/maintenance-mode')
        .send(maintenanceRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(403);
    });
  });

  describe('9. GET /api/admin/reports/usage', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should generate usage report for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/reports/usage?type=daily')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const report = response.body.data;
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('type', 'daily');
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('generatedAt');

      expect(report.summary).toHaveProperty('totalUsers');
      expect(report.summary).toHaveProperty('activeUsers');
      expect(report.summary).toHaveProperty('totalPatients');
    });

    it('should support different report types', async () => {
      const reportTypes = ['daily', 'weekly', 'monthly'];

      for (const type of reportTypes) {
        const response = await request(app)
          .get(`/api/admin/reports/usage?type=${type}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.type).toBe(type);
      }
    });

    it('should support custom date ranges', async () => {
      const startDate = new Date(Date.now() - 604800000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/reports/usage?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = response.body.data;
      expect(new Date(report.period.start).toISOString()).toBe(startDate);
      expect(new Date(report.period.end).toISOString()).toBe(endDate);
    });
  });

  describe('10. GET /api/admin/reports/compliance', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );
    });

    it('should generate compliance report for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const report = response.body.data;
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('type', 'HIPAA');
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('generatedAt');

      expect(report.summary).toHaveProperty('totalChecks');
      expect(report.summary).toHaveProperty('passedChecks');
      expect(report.summary).toHaveProperty('score');
      expect(Array.isArray(report.findings)).toBe(true);
    });

    it('should support different compliance types', async () => {
      const complianceTypes = ['HIPAA', 'GDPR', 'DATA_RETENTION', 'SECURITY'];

      for (const type of complianceTypes) {
        const response = await request(app)
          .get(`/api/admin/reports/compliance?type=${type}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.type).toBe(type);
      }
    });

    it('should include detailed findings with severity levels', async () => {
      const response = await request(app)
        .get('/api/admin/reports/compliance?type=HIPAA')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const findings = response.body.data.findings;
      if (findings.length > 0) {
        const finding = findings[0];
        expect(finding).toHaveProperty('checkId');
        expect(finding).toHaveProperty('category');
        expect(finding).toHaveProperty('description');
        expect(finding).toHaveProperty('status');
        expect(finding).toHaveProperty('severity');
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(finding.severity);
      }
    });

    it('should require audit admin permissions', async () => {
      const limitedAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.LIMITED_ADMIN.id,
        TEST_ADMIN_USERS.LIMITED_ADMIN.username,
        TEST_ADMIN_USERS.LIMITED_ADMIN.role,
        TEST_ADMIN_USERS.LIMITED_ADMIN.permissions
      );

      await request(app)
        .get('/api/admin/reports/compliance')
        .set('Authorization', `Bearer ${limitedAdminToken}`)
        .expect(403);
    });
  });

  describe('Cross-cutting concerns', () => {
    beforeEach(async () => {
      authToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SUPER_ADMIN.id,
        TEST_ADMIN_USERS.SUPER_ADMIN.username,
        TEST_ADMIN_USERS.SUPER_ADMIN.role,
        TEST_ADMIN_USERS.SUPER_ADMIN.permissions
      );
    });

    it('should handle rate limiting appropriately', async () => {
      // Make multiple requests to test rate limiting
      const promises = Array(10).fill(0).map(() =>
        request(app)
          .get('/api/admin/system-metrics')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);

      // Most requests should succeed
      const successResponses = responses.filter(r => r.status === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidToken = 'invalid_token';

      await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should handle malformed JSON requests', async () => {
      await request(app)
        .post('/api/admin/system/backup')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/admin/system-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});