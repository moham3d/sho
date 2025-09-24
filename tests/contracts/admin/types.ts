// Admin contract test types

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician';
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
    path: string;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  database: {
    connectionCount: number;
    queryCount: number;
    slowQueryCount: number;
    responseTime: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'ADMIN_ACTION' | 'SYSTEM_CHANGE';
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  description?: string;
}

export interface BackupRequest {
  type: 'full' | 'incremental' | 'differential';
  includeAttachments: boolean;
  description?: string;
  retentionDays?: number;
}

export interface BackupResponse {
  id: string;
  filename: string;
  type: string;
  size: number;
  checksum: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  retentionDays: number;
}

export interface RestoreRequest {
  backupId: string;
  includeAttachments: boolean;
  dryRun?: boolean;
  verifyIntegrity?: boolean;
}

export interface RestoreResponse {
  id: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  dryRun: boolean;
  verifyIntegrity: boolean;
  errors?: string[];
  summary?: {
    tablesRestored: number;
    recordsRestored: number;
    attachmentsRestored: number;
  };
}

export interface SystemConfiguration {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string;
  isEditable: boolean;
  isSensitive: boolean;
  lastModified: Date;
  lastModifiedBy: string;
}

export interface MaintenanceMode {
  enabled: boolean;
  message?: string;
  endTime?: Date;
  allowAdminAccess: boolean;
  initiatedBy: string;
  initiatedAt: Date;
}

export interface UsageReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalPatients: number;
    totalVisits: number;
    totalForms: number;
    totalStorageUsed: number;
  };
  breakdown: {
    byRole: Array<{
      role: string;
      count: number;
      activeUsers: number;
    }>;
    byDepartment: Array<{
      department: string;
      patients: number;
      visits: number;
    }>;
    byDate: Array<{
      date: string;
      users: number;
      patients: number;
      visits: number;
      forms: number;
    }>;
  };
  generatedAt: Date;
}

export interface ComplianceReport {
  id: string;
  type: 'HIPAA' | 'GDPR' | 'DATA_RETENTION' | 'SECURITY';
  period: {
    start: Date;
    end: Date;
  };
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'REQUIRES_REVIEW';
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    score: number;
  };
  findings: Array<{
    checkId: string;
    category: string;
    description: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation?: string;
    evidence?: any;
  }>;
  generatedAt: Date;
}

export interface TestAdminUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician';
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissions: string[];
}

export interface AdminAuthResponse {
  success: boolean;
  data?: {
    user: Partial<AdminUser>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    permissions: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}