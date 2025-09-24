// Admin Contract Tests Entry Point

export * from './admin.contract.test';
export * from './security-compliance.contract.test';
export * from './backup-restore.contract.test';
export * from './system-management.contract.test';
export * from './reports-analytics.contract.test';
export * from './types';
export * from './fixtures';
export * from './utils';
export * from './setup';
export * from './mocks';

// Test configuration
export const ADMIN_TEST_CONFIG = {
  endpoints: {
    systemMetrics: '/api/admin/system-metrics',
    auditLogs: '/api/admin/audit-logs',
    userActivity: '/api/admin/users/activity',
    systemBackup: '/api/admin/system/backup',
    systemRestore: '/api/admin/system/restore',
    systemConfig: '/api/admin/system/configuration',
    maintenanceMode: '/api/admin/system/maintenance-mode',
    usageReport: '/api/admin/reports/usage',
    complianceReport: '/api/admin/reports/compliance'
  },
  permissions: {
    systemRead: 'system:read',
    systemWrite: 'system:write',
    auditRead: 'audit:read',
    auditWrite: 'audit:write',
    backupRead: 'backup:read',
    backupCreate: 'backup:create',
    restoreRead: 'restore:read',
    restoreExecute: 'restore:execute',
    configRead: 'config:read',
    configWrite: 'config:write',
    reportsRead: 'reports:read',
    maintenanceManage: 'maintenance:manage'
  },
  roles: {
    superAdmin: 'admin',
    systemAdmin: 'admin',
    auditAdmin: 'admin',
    limitedAdmin: 'admin'
  },
  testTimeout: 30000,
  batchSize: 100,
  maxRetries: 3
};

// Test utilities
export const AdminTestUtils = {
  generateTestToken: (userId: string, username: string, role: string, permissions: string[] = []) => {
    const payload = {
      sub: userId,
      username,
      role,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60),
      type: 'access'
    };
    return require('jsonwebtoken').sign(payload, process.env.JWT_SECRET || 'test-secret-key');
  },

  validateAdminResponse: (response: any) => {
    return (
      typeof response === 'object' &&
      typeof response.success === 'boolean' &&
      (response.success ? response.data !== undefined : response.error !== undefined)
    );
  },

  createTestHeaders: (token: string, additionalHeaders: Record<string, string> = {}) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'test-agent/1.0',
    ...additionalHeaders
  })
};

// Export test setup functions
export { TestSetup } from './setup';