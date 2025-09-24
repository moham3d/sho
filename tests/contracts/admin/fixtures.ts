import {
  TestAdminUser,
  SystemMetrics,
  AuditLog,
  SystemConfiguration,
  MaintenanceMode,
  UsageReport,
  ComplianceReport,
  BackupRequest,
  RestoreRequest
} from './types';

export const TEST_ADMIN_USERS: Record<string, TestAdminUser> = {
  SUPER_ADMIN: {
    id: '1',
    username: 'test_super_admin',
    email: 'superadmin@example.com',
    password: 'SuperAdminPassword123!',
    role: 'admin',
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    permissions: [
      'admin:*',
      'system:*',
      'audit:*',
      'backup:*',
      'restore:*',
      'config:*',
      'reports:*',
      'users:*',
      'patients:*',
      'visits:*',
      'forms:*'
    ]
  },
  SYSTEM_ADMIN: {
    id: '2',
    username: 'test_system_admin',
    email: 'systemadmin@example.com',
    password: 'SystemAdminPassword123!',
    role: 'admin',
    firstName: 'System',
    lastName: 'Admin',
    isActive: true,
    permissions: [
      'system:read',
      'system:metrics',
      'audit:read',
      'backup:read',
      'backup:create',
      'restore:read',
      'restore:execute',
      'config:read',
      'config:write',
      'reports:read',
      'maintenance:manage'
    ]
  },
  AUDIT_ADMIN: {
    id: '3',
    username: 'test_audit_admin',
    email: 'auditadmin@example.com',
    password: 'AuditAdminPassword123!',
    role: 'admin',
    firstName: 'Audit',
    lastName: 'Admin',
    isActive: true,
    permissions: [
      'audit:read',
      'audit:export',
      'reports:read',
      'system:read'
    ]
  },
  LIMITED_ADMIN: {
    id: '4',
    username: 'test_limited_admin',
    email: 'limitedadmin@example.com',
    password: 'LimitedAdminPassword123!',
    role: 'admin',
    firstName: 'Limited',
    lastName: 'Admin',
    isActive: true,
    permissions: [
      'system:read',
      'audit:read',
      'reports:read'
    ]
  },
  REGULAR_USER: {
    id: '5',
    username: 'test_regular_user',
    email: 'user@example.com',
    password: 'RegularPassword123!',
    role: 'doctor',
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
    permissions: []
  },
  INACTIVE_ADMIN: {
    id: '6',
    username: 'test_inactive_admin',
    email: 'inactiveadmin@example.com',
    password: 'InactiveAdminPassword123!',
    role: 'admin',
    firstName: 'Inactive',
    lastName: 'Admin',
    isActive: false,
    permissions: ['admin:*']
  }
};

export const SAMPLE_SYSTEM_METRICS: SystemMetrics = {
  cpu: {
    usage: 25.5,
    cores: 4,
    loadAverage: [0.25, 0.30, 0.35]
  },
  memory: {
    total: 8589934592, // 8GB
    used: 3221225472, // 3GB
    free: 5368709120, // 5GB
    usagePercentage: 37.5
  },
  disk: {
    total: 107374182400, // 100GB
    used: 32212254720, // 30GB
    free: 75161927680, // 70GB
    usagePercentage: 30.0,
    path: '/app'
  },
  network: {
    bytesIn: 1024000,
    bytesOut: 2048000,
    packetsIn: 1000,
    packetsOut: 2000
  },
  database: {
    connectionCount: 5,
    queryCount: 1500,
    slowQueryCount: 2,
    responseTime: 15.5
  },
  uptime: 86400, // 24 hours
  timestamp: new Date()
};

export const SAMPLE_AUDIT_LOGS: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    username: 'superadmin',
    action: 'ADMIN_ACTION',
    entityType: 'system_configuration',
    entityId: 'config_1',
    oldValues: { value: 'old_value' },
    newValues: { value: 'new_value' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    description: 'Updated system configuration: max_sessions'
  },
  {
    id: '2',
    userId: '2',
    username: 'systemadmin',
    action: 'BACKUP_CREATE',
    entityType: 'system_backup',
    entityId: 'backup_1',
    oldValues: null,
    newValues: { type: 'full', size: 1024000 },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    description: 'Created full backup: backup_2024_01_01_full.sql'
  },
  {
    id: '3',
    userId: '3',
    username: 'auditadmin',
    action: 'AUDIT_EXPORT',
    entityType: 'audit_logs',
    entityId: null,
    oldValues: null,
    newValues: { format: 'csv', count: 1000 },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    description: 'Exported audit logs to CSV format'
  }
];

export const SAMPLE_SYSTEM_CONFIGURATIONS: SystemConfiguration[] = [
  {
    id: '1',
    key: 'max_sessions_per_user',
    value: 5,
    type: 'number',
    category: 'security',
    description: 'Maximum concurrent sessions per user',
    isEditable: true,
    isSensitive: false,
    lastModified: new Date(Date.now() - 86400000),
    lastModifiedBy: '1'
  },
  {
    id: '2',
    key: 'session_timeout_minutes',
    value: 30,
    type: 'number',
    category: 'security',
    description: 'Session timeout in minutes',
    isEditable: true,
    isSensitive: false,
    lastModified: new Date(Date.now() - 172800000),
    lastModifiedBy: '1'
  },
  {
    id: '3',
    key: 'backup_retention_days',
    value: 90,
    type: 'number',
    category: 'backup',
    description: 'Number of days to retain backups',
    isEditable: true,
    isSensitive: false,
    lastModified: new Date(Date.now() - 259200000),
    lastModifiedBy: '2'
  },
  {
    id: '4',
    key: 'database_encryption_key',
    value: 'encrypted_key_here',
    type: 'string',
    category: 'security',
    description: 'Database encryption key',
    isEditable: false,
    isSensitive: true,
    lastModified: new Date(Date.now() - 604800000),
    lastModifiedBy: '1'
  }
];

export const SAMPLE_BACKUP_REQUESTS: BackupRequest[] = [
  {
    type: 'full',
    includeAttachments: true,
    description: 'Weekly full backup',
    retentionDays: 90
  },
  {
    type: 'incremental',
    includeAttachments: false,
    description: 'Daily incremental backup',
    retentionDays: 30
  },
  {
    type: 'differential',
    includeAttachments: true,
    description: 'Daily differential backup',
    retentionDays: 14
  }
];

export const SAMPLE_RESTORE_REQUESTS: RestoreRequest[] = [
  {
    backupId: 'backup_1',
    includeAttachments: true,
    dryRun: true,
    verifyIntegrity: true
  },
  {
    backupId: 'backup_2',
    includeAttachments: false,
    dryRun: false,
    verifyIntegrity: false
  }
];

export const SAMPLE_MAINTENANCE_MODE: MaintenanceMode = {
  enabled: false,
  message: 'System maintenance in progress',
  endTime: new Date(Date.now() + 3600000), // 1 hour from now
  allowAdminAccess: true,
  initiatedBy: '1',
  initiatedAt: new Date()
};

export const SAMPLE_USAGE_REPORT: UsageReport = {
  id: '1',
  type: 'daily',
  period: {
    start: new Date(Date.now() - 86400000),
    end: new Date()
  },
  summary: {
    totalUsers: 150,
    activeUsers: 125,
    totalPatients: 2500,
    totalVisits: 500,
    totalForms: 1200,
    totalStorageUsed: 21474836480 // 20GB
  },
  breakdown: {
    byRole: [
      { role: 'admin', count: 5, activeUsers: 5 },
      { role: 'doctor', count: 20, activeUsers: 18 },
      { role: 'nurse', count: 30, activeUsers: 25 },
      { role: 'receptionist', count: 15, activeUsers: 15 },
      { role: 'technician', count: 10, activeUsers: 8 }
    ],
    byDepartment: [
      { department: 'Radiology', patients: 2000, visits: 400 },
      { department: 'Emergency', patients: 300, visits: 50 },
      { department: 'Outpatient', patients: 200, visits: 50 }
    ],
    byDate: [
      { date: '2024-01-01', users: 100, patients: 100, visits: 150, forms: 200 },
      { date: '2024-01-02', users: 120, patients: 120, visits: 180, forms: 240 }
    ]
  },
  generatedAt: new Date()
};

export const SAMPLE_COMPLIANCE_REPORT: ComplianceReport = {
  id: '1',
  type: 'HIPAA',
  period: {
    start: new Date(Date.now() - 604800000), // 7 days ago
    end: new Date()
  },
  status: 'COMPLIANT',
  summary: {
    totalChecks: 50,
    passedChecks: 48,
    failedChecks: 0,
    warningChecks: 2,
    score: 96
  },
  findings: [
    {
      checkId: 'HIPAA_001',
      category: 'Access Control',
      description: 'Multi-factor authentication required for admin accounts',
      status: 'PASS',
      severity: 'HIGH',
      recommendation: 'Continue maintaining MFA requirements'
    },
    {
      checkId: 'HIPAA_002',
      category: 'Audit Logging',
      description: 'All system access is logged and reviewed',
      status: 'PASS',
      severity: 'MEDIUM',
      recommendation: 'Maintain current audit logging practices'
    },
    {
      checkId: 'HIPAA_003',
      category: 'Data Encryption',
      description: 'Data encrypted at rest and in transit',
      status: 'WARNING',
      severity: 'HIGH',
      recommendation: 'Update TLS version to latest standard'
    }
  ],
  generatedAt: new Date()
};

export const AUDIT_FILTER_TEST_CASES = {
  ACTION_FILTERS: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ADMIN_ACTION', 'SYSTEM_CHANGE'],
  ENTITY_TYPE_FILTERS: ['users', 'patients', 'visits', 'forms', 'system_configuration', 'system_backup'],
  USER_FILTERS: ['superadmin', 'systemadmin', 'auditadmin', 'doctor', 'nurse'],
  DATE_RANGES: [
    { start: new Date(Date.now() - 86400000), end: new Date() }, // Last 24 hours
    { start: new Date(Date.now() - 604800000), end: new Date() }, // Last 7 days
    { start: new Date(Date.now() - 2592000000), end: new Date() } // Last 30 days
  ],
  IP_ADDRESS_FILTERS: ['192.168.1.100', '192.168.1.101', '192.168.1.102'],
  SEARCH_TERMS: ['backup', 'configuration', 'login', 'export']
};

export const VALIDATION_TEST_CASES = {
  INVALID_BACKUP_REQUESTS: [
    { type: 'invalid_type', includeAttachments: true, description: 'Test backup' },
    { type: 'full', includeAttachments: 'invalid_boolean', description: 'Test backup' },
    { type: 'full', includeAttachments: true, retentionDays: -1 },
    { type: 'full', includeAttachments: true, retentionDays: 'invalid_number' }
  ],
  INVALID_RESTORE_REQUESTS: [
    { backupId: '', includeAttachments: true },
    { backupId: 'invalid_id', includeAttachments: true },
    { backupId: 'backup_1', includeAttachments: 'invalid_boolean' },
    { backupId: 'backup_1', includeAttachments: true, dryRun: 'invalid_boolean' }
  ],
  INVALID_CONFIGURATIONS: [
    { key: '', value: 'test', type: 'string', category: 'test' },
    { key: 'test', value: 'test', type: 'invalid_type', category: 'test' },
    { key: 'test', value: 'test', type: 'string', category: '' },
    { key: 'test', value: 123, type: 'string', category: 'test' }
  ]
};

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 3600
};