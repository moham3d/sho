import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { TestSetup } from './setup';
import { TestUtils } from './utils';
import { TEST_ADMIN_USERS, SAMPLE_BACKUP_REQUESTS, SAMPLE_RESTORE_REQUESTS } from './fixtures';
import { BackupRequest, RestoreRequest } from './types';

describe('Admin Backup and Restore Contract Tests', () => {
  let app: any;
  let authToken: string;
  let systemAdminToken: string;

  beforeEach(() => {
    app = TestSetup.getApp();
  });

  describe('Backup Operations', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should create full backup with all options', async () => {
      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: true,
        description: 'Complete system backup - weekly',
        retentionDays: 90
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: 'full',
        includeAttachments: true,
        retentionDays: 90
      });

      const backup = response.body.data;
      expect(backup.id).toBeDefined();
      expect(backup.filename).toContain('.sql');
      expect(backup.status).toMatch(/^(pending|in_progress|completed|failed)$/);
      expect(backup.startTime).toBeDefined();
      expect(backup.checksum).toBeDefined();
      expect(backup.size).toBeGreaterThan(0);
    });

    it('should create incremental backup', async () => {
      const backupRequest: BackupRequest = {
        type: 'incremental',
        includeAttachments: false,
        description: 'Daily incremental backup',
        retentionDays: 30
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('incremental');
      expect(response.body.data.includeAttachments).toBe(false);
    });

    it('should create differential backup', async () => {
      const backupRequest: BackupRequest = {
        type: 'differential',
        includeAttachments: true,
        description: 'Daily differential backup',
        retentionDays: 14
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.type).toBe('differential');
      expect(response.body.data.includeAttachments).toBe(true);
    });

    it('should validate backup request parameters', async () => {
      const invalidRequests = [
        {}, // Empty request
        { type: 'invalid_type' }, // Invalid backup type
        { type: 'full', includeAttachments: 'not_boolean' }, // Invalid boolean
        { type: 'full', includeAttachments: true, retentionDays: -1 }, // Invalid retention days
        { type: 'full', includeAttachments: true, retentionDays: 'invalid' }, // Invalid retention type
      ];

      for (const invalidRequest of invalidRequests) {
        await request(app)
          .post('/api/admin/system/backup')
          .send(invalidRequest)
          .set('Authorization', `Bearer ${systemAdminToken}`)
          .expect(400);
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

    it('should handle backup creation errors gracefully', async () => {
      // Simulate a backup creation error by sending invalid data
      const response = await request(app)
        .post('/api/admin/system/backup')
        .send({
          type: 'full',
          includeAttachments: true,
          description: 'Test backup that will fail'
        })
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .set('X-Force-Error', 'true') // Custom header to simulate error
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should support backup scheduling', async () => {
      const scheduledBackup = {
        type: 'full',
        includeAttachments: true,
        description: 'Scheduled backup',
        retentionDays: 90,
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 0, // Sunday
          time: '02:00'
        }
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(scheduledBackup)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.schedule).toBeDefined();
    });

    it('should validate backup retention policies', async () => {
      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: true,
        retentionDays: 1000 // Exceeds maximum allowed
      };

      await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(400);
    });
  });

  describe('Backup Listing and Management', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );

      // Create test backups
      const backupTypes = ['full', 'incremental', 'differential'];
      for (const type of backupTypes) {
        await request(app)
          .post('/api/admin/system/backup')
          .send({
            type,
            includeAttachments: true,
            description: `${type} backup test`
          })
          .set('Authorization', `Bearer ${systemAdminToken}`);
      }
    });

    it('should list all available backups', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Validate backup structure
      const backup = response.body.data[0];
      expect(backup).toHaveProperty('id');
      expect(backup).toHaveProperty('filename');
      expect(backup).toHaveProperty('type');
      expect(backup).toHaveProperty('size');
      expect(backup).toHaveProperty('status');
      expect(backup).toHaveProperty('created_at');
    });

    it('should support filtering backups by type', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups?type=full')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.every((backup: any) => backup.type === 'full')).toBe(true);
    });

    it('should support filtering backups by status', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups?status=completed')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.every((backup: any) => backup.status === 'completed')).toBe(true);
    });

    it('should support filtering backups by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/admin/system/backups?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.every((backup: any) => {
        const backupDate = new Date(backup.created_at);
        return backupDate >= new Date(startDate) && backupDate <= new Date(endDate);
      })).toBe(true);
    });

    it('should support backup pagination', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups?page=1&limit=5')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should sort backups by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups?sort=created_at&order=desc')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      const backups = response.body.data;
      for (let i = 1; i < backups.length; i++) {
        const currentDate = new Date(backups[i].created_at);
        const previousDate = new Date(backups[i - 1].created_at);
        expect(currentDate <= previousDate).toBe(true);
      }
    });
  });

  describe('Restore Operations', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );

      // Create a test backup first
      await request(app)
        .post('/api/admin/system/backup')
        .send({
          type: 'full',
          includeAttachments: true,
          description: 'Test backup for restore'
        })
        .set('Authorization', `Bearer ${systemAdminToken}`);
    });

    it('should restore database with valid backup ID', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: true,
        dryRun: false,
        verifyIntegrity: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        backupId: restoreRequest.backupId,
        includeAttachments: true,
        dryRun: false,
        verifyIntegrity: true
      });

      const restore = response.body.data;
      expect(restore.id).toBeDefined();
      expect(restore.status).toMatch(/^(pending|in_progress|completed|failed)$/);
      expect(restore.startTime).toBeDefined();
      expect(restore.summary).toBeDefined();
    });

    it('should perform dry run restore', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: false,
        dryRun: true,
        verifyIntegrity: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.dryRun).toBe(true);
      expect(response.body.data.status).toBe('completed'); // Dry run should complete
    });

    it('should restore without integrity verification', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: false,
        dryRun: false,
        verifyIntegrity: false
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.verifyIntegrity).toBe(false);
    });

    it('should validate restore request parameters', async () => {
      const invalidRequests = [
        {}, // Empty request
        { backupId: '' }, // Empty backup ID
        { backupId: 'non_existent_backup' }, // Non-existent backup
        { backupId: 'test_backup_id', includeAttachments: 'not_boolean' }, // Invalid boolean
        { backupId: 'test_backup_id', dryRun: 'not_boolean' }, // Invalid boolean
        { backupId: 'test_backup_id', verifyIntegrity: 'not_boolean' }, // Invalid boolean
      ];

      for (const invalidRequest of invalidRequests) {
        await request(app)
          .post('/api/admin/system/restore')
          .send(invalidRequest)
          .set('Authorization', `Bearer ${systemAdminToken}`)
          .expect(400);
      }
    });

    it('should require restore permissions', async () => {
      const auditAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.AUDIT_ADMIN.id,
        TEST_ADMIN_USERS.AUDIT_ADMIN.username,
        TEST_ADMIN_USERS.AUDIT_ADMIN.role,
        TEST_ADMIN_USERS.AUDIT_ADMIN.permissions
      );

      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: false
      };

      await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${auditAdminToken}`)
        .expect(403);
    });

    it('should handle restore operation errors', async () => {
      const response = await request(app)
        .post('/api/admin/system/restore')
        .send({
          backupId: 'corrupted_backup_id',
          includeAttachments: true
        })
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .set('X-Force-Error', 'true') // Custom header to simulate error
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('corrupted');
    });

    it('should provide detailed restore summary', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'test_backup_id',
        includeAttachments: true,
        dryRun: false,
        verifyIntegrity: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      const summary = response.body.data.summary;
      expect(summary).toHaveProperty('tablesRestored');
      expect(summary).toHaveProperty('recordsRestored');
      expect(summary).toHaveProperty('attachmentsRestored');
      expect(typeof summary.tablesRestored).toBe('number');
      expect(typeof summary.recordsRestored).toBe('number');
      expect(typeof summary.attachmentsRestored).toBe('number');
    });
  });

  describe('Restore History and Monitoring', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );

      // Create test backup and restore operations
      await request(app)
        .post('/api/admin/system/backup')
        .send({
          type: 'full',
          includeAttachments: true,
          description: 'Test backup'
        })
        .set('Authorization', `Bearer ${systemAdminToken}`);

      await request(app)
        .post('/api/admin/system/restore')
        .send({
          backupId: 'test_backup_id',
          includeAttachments: true,
          dryRun: false,
          verifyIntegrity: true
        })
        .set('Authorization', `Bearer ${systemAdminToken}`);
    });

    it('should list restore operations history', async () => {
      const response = await request(app)
        .get('/api/admin/system/restores')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const restore = response.body.data[0];
        expect(restore).toHaveProperty('id');
        expect(restore).toHaveProperty('backupId');
        expect(restore).toHaveProperty('status');
        expect(restore).toHaveProperty('startTime');
        expect(restore).toHaveProperty('duration');
        expect(restore).toHaveProperty('summary');
      }
    });

    it('should monitor restore operation progress', async () => {
      const response = await request(app)
        .get('/api/admin/system/restores/restore_123456/progress')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.progress).toBeGreaterThanOrEqual(0);
      expect(response.body.data.progress).toBeLessThanOrEqual(100);
    });

    it('should cancel restore operation', async () => {
      const response = await request(app)
        .post('/api/admin/system/restores/restore_123456/cancel')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('Backup and Restore Security', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should encrypt backup files', async () => {
      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: true,
        description: 'Encrypted backup',
        encryption: {
          enabled: true,
          algorithm: 'AES-256',
          keyRotation: true
        }
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.encryption).toBeDefined();
      expect(response.body.data.encryption.enabled).toBe(true);
    });

    it('should validate backup integrity', async () => {
      const response = await request(app)
        .get('/api/admin/system/backups/backup_123456/verify')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('integrityCheck');
      expect(response.body.data).toHaveProperty('checksumValid');
      expect(response.body.data).toHaveProperty('verifiedAt');
    });

    it('should require multi-admin approval for restore operations', async () => {
      const restoreRequest: RestoreRequest = {
        backupId: 'production_backup_id',
        includeAttachments: true,
        dryRun: false,
        verifyIntegrity: true,
        requiresApproval: true
      };

      const response = await request(app)
        .post('/api/admin/system/restore')
        .send(restoreRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(202); // Accepted pending approval

      expect(response.body.data.status).toBe('pending_approval');
      expect(response.body.data.approvals).toBeDefined();
    });

    it('should log all backup and restore operations', async () => {
      // Perform backup operation
      await request(app)
        .post('/api/admin/system/backup')
        .send({
          type: 'full',
          includeAttachments: true,
          description: 'Audit test backup'
        })
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      // Check audit logs
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs?action=BACKUP_CREATE')
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(auditResponse.body.data.length).toBeGreaterThan(0);
      expect(auditResponse.body.data[0].action).toBe('BACKUP_CREATE');
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      systemAdminToken = TestUtils.generateTestToken(
        TEST_ADMIN_USERS.SYSTEM_ADMIN.id,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.username,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.role,
        TEST_ADMIN_USERS.SYSTEM_ADMIN.permissions
      );
    });

    it('should handle large backup creation within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send({
          type: 'full',
          includeAttachments: true,
          description: 'Large backup test'
        })
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

      expect(response.body.data.size).toBeGreaterThan(0);
    });

    it('should support backup compression', async () => {
      const backupRequest: BackupRequest = {
        type: 'full',
        includeAttachments: true,
        description: 'Compressed backup',
        compression: {
          enabled: true,
          algorithm: 'gzip',
          level: 6
        }
      };

      const response = await request(app)
        .post('/api/admin/system/backup')
        .send(backupRequest)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .expect(200);

      expect(response.body.data.compression).toBeDefined();
      expect(response.body.data.compression.enabled).toBe(true);
    });

    it('should handle concurrent backup requests', async () => {
      const promises = Array(3).fill(0).map(() =>
        request(app)
          .post('/api/admin/system/backup')
          .send({
            type: 'full',
            includeAttachments: false,
            description: 'Concurrent backup test'
          })
          .set('Authorization', `Bearer ${systemAdminToken}`)
      );

      const responses = await Promise.all(promises);

      // All requests should succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status); // Success or rate limited
      });
    });
  });
});