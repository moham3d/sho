// Mock services for admin contract tests
import {
  SystemMetrics,
  AuditLog,
  SystemConfiguration,
  MaintenanceMode,
  UsageReport,
  ComplianceReport,
  BackupResponse,
  RestoreResponse
} from './types';

export class MockDatabaseService {
  private users: any[] = [];
  private auditLogs: AuditLog[] = [];
  private systemConfigurations: SystemConfiguration[] = [];
  private backups: BackupResponse[] = [];
  private maintenanceMode: MaintenanceMode = {
    enabled: false,
    message: '',
    endTime: undefined,
    allowAdminAccess: true,
    initiatedBy: '',
    initiatedAt: new Date()
  };

  async connect(): Promise<void> {
    // Mock database connection
  }

  async disconnect(): Promise<void> {
    // Mock database disconnection
  }

  async query(text: string, params?: any[]): Promise<any> {
    // Mock query execution
    return { rows: [], rowCount: 0 };
  }

  async clearTestData(): Promise<void> {
    this.users = [];
    this.auditLogs = [];
    this.systemConfigurations = [];
    this.backups = [];
  }

  async createTestUser(userData: any): Promise<any> {
    const user = {
      ...userData,
      id: userData.id || `test_${Date.now()}`,
      created_at: userData.createdAt || new Date(),
      updated_at: userData.updatedAt || new Date()
    };
    this.users.push(user);
    return { rows: [user] };
  }

  async getUserByUsername(username: string): Promise<any> {
    const user = this.users.find(u => u.username === username);
    return { rows: user ? [user] : [] };
  }

  async getUserByEmail(email: string): Promise<any> {
    const user = this.users.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }

  async createAuditLog(logData: any): Promise<any> {
    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      userId: logData.userId,
      username: logData.username,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      oldValues: logData.oldValues,
      newValues: logData.newValues,
      ipAddress: logData.ipAddress || '127.0.0.1',
      userAgent: logData.userAgent || 'test-agent',
      timestamp: new Date(),
      description: logData.description
    };
    this.auditLogs.push(log);
    return { rows: [log] };
  }

  async getAuditLogs(filters: any = {}): Promise<any> {
    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    // Apply sorting
    if (filters.order) {
      const [field, direction] = filters.order.split('.');
      logs.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        if (direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      rows: paginatedLogs,
      rowCount: logs.length,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: logs.length,
        totalPages: Math.ceil(logs.length / limit)
      }
    };
  }

  async createSystemConfiguration(configData: any): Promise<any> {
    const config: SystemConfiguration = {
      id: `config_${Date.now()}`,
      key: configData.key,
      value: configData.value,
      type: configData.type,
      category: configData.category,
      description: configData.description,
      isEditable: configData.isEditable ?? true,
      isSensitive: configData.isSensitive ?? false,
      lastModified: new Date(),
      lastModifiedBy: configData.lastModifiedBy
    };
    this.systemConfigurations.push(config);
    return { rows: [config] };
  }

  async getSystemConfigurations(category?: string): Promise<any> {
    let configs = [...this.systemConfigurations];

    if (category) {
      configs = configs.filter(config => config.category === category);
    }

    return { rows: configs };
  }

  async updateSystemConfiguration(id: string, updates: any): Promise<any> {
    const configIndex = this.systemConfigurations.findIndex(config => config.id === id);
    if (configIndex !== -1) {
      this.systemConfigurations[configIndex] = {
        ...this.systemConfigurations[configIndex],
        ...updates,
        lastModified: new Date()
      };
      return { rows: [this.systemConfigurations[configIndex]] };
    }
    return { rows: [] };
  }

  async setMaintenanceMode(enabled: boolean, options: any = {}): Promise<any> {
    this.maintenanceMode = {
      enabled,
      message: options.message || '',
      endTime: options.endTime,
      allowAdminAccess: options.allowAdminAccess ?? true,
      initiatedBy: options.initiatedBy,
      initiatedAt: new Date()
    };
    return { rows: [this.maintenanceMode] };
  }

  async getMaintenanceMode(): Promise<any> {
    return { rows: [this.maintenanceMode] };
  }

  async createBackup(backupData: any): Promise<any> {
    const backup: BackupResponse = {
      id: `backup_${Date.now()}`,
      filename: `backup_${Date.now()}.sql`,
      type: backupData.type,
      size: Math.floor(Math.random() * 1000000000), // Random size
      checksum: `checksum_${Date.now()}`,
      status: 'completed',
      startTime: new Date(Date.now() - 300000), // 5 minutes ago
      endTime: new Date(),
      duration: 300000,
      description: backupData.description,
      retentionDays: backupData.retentionDays || 30
    };
    this.backups.push(backup);
    return { rows: [backup] };
  }

  async getBackups(): Promise<any> {
    return { rows: this.backups };
  }

  async restoreDatabase(restoreData: any): Promise<any> {
    const restore: RestoreResponse = {
      id: `restore_${Date.now()}`,
      backupId: restoreData.backupId,
      status: 'completed',
      startTime: new Date(Date.now() - 600000), // 10 minutes ago
      endTime: new Date(),
      duration: 600000,
      dryRun: restoreData.dryRun || false,
      verifyIntegrity: restoreData.verifyIntegrity || false,
      summary: {
        tablesRestored: 15,
        recordsRestored: 5000,
        attachmentsRestored: 100
      }
    };
    return { rows: [restore] };
  }
}

export class MockSystemService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: {
        usage: Math.random() * 100,
        cores: 4,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
      },
      memory: {
        total: 8589934592,
        used: Math.random() * 8589934592,
        free: Math.random() * 8589934592,
        usagePercentage: Math.random() * 100
      },
      disk: {
        total: 107374182400,
        used: Math.random() * 107374182400,
        free: Math.random() * 107374182400,
        usagePercentage: Math.random() * 100,
        path: '/app'
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
        packetsIn: Math.random() * 10000,
        packetsOut: Math.random() * 10000
      },
      database: {
        connectionCount: Math.floor(Math.random() * 20),
        queryCount: Math.floor(Math.random() * 5000),
        slowQueryCount: Math.floor(Math.random() * 10),
        responseTime: Math.random() * 100
      },
      uptime: Math.floor(Math.random() * 86400000),
      timestamp: new Date()
    };
  }

  async getUserActivityStats(): Promise<any> {
    return {
      totalUsers: 150,
      activeUsers: 125,
      concurrentSessions: 45,
      averageSessionDuration: 1800,
      loginAttempts24h: 500,
      successfulLogins24h: 480,
      failedLogins24h: 20,
      lockedAccounts: 2,
      usersByRole: [
        { role: 'admin', count: 5, activeUsers: 5 },
        { role: 'doctor', count: 20, activeUsers: 18 },
        { role: 'nurse', count: 30, activeUsers: 25 },
        { role: 'receptionist', count: 15, activeUsers: 15 },
        { role: 'technician', count: 10, activeUsers: 8 }
      ]
    };
  }
}

export class MockAuditService {
  async generateUsageReport(type: string, period: any): Promise<UsageReport> {
    return {
      id: `report_${Date.now()}`,
      type: type as any,
      period,
      summary: {
        totalUsers: 150,
        activeUsers: 125,
        totalPatients: 2500,
        totalVisits: 500,
        totalForms: 1200,
        totalStorageUsed: 21474836480
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
  }

  async generateComplianceReport(type: string, period: any): Promise<ComplianceReport> {
    return {
      id: `compliance_${Date.now()}`,
      type: type as any,
      period,
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
          checkId: 'CHECK_001',
          category: 'Security',
          description: 'All security protocols are in place',
          status: 'PASS',
          severity: 'HIGH'
        }
      ],
      generatedAt: new Date()
    };
  }
}

// Mock Express app for testing
export const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  listen: jest.fn()
};

// Mock request and response objects
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// Mock authentication middleware
export const mockAuthMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && token !== 'invalid-token') {
    req.user = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['admin:*']
    };
  }
  next();
};

// Mock admin authorization middleware
export const mockAdminMiddleware = (requiredPermissions: string[] = []) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (requiredPermissions.length > 0) {
      const userPermissions = req.user.permissions || [];
      const hasPermission = requiredPermissions.every(perm =>
        userPermissions.includes(perm) || userPermissions.includes('admin:*')
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    next();
  };
};

// Mock rate limiting middleware
export const mockRateLimitMiddleware = (req: any, res: any, next: any) => {
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);
  next();
};