import { User, TestUser, AuditLog, UserRole, Permission } from './types';
import { v4 as uuidv4 } from 'uuid';

export class MockDatabaseService {
  private users: Map<string, TestUser> = new Map();
  private auditLogs: AuditLog[] = [];
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    this.isConnected = true;
    // Initialize with test users
    const { TEST_USERS } = await import('./fixtures');
    Object.values(TEST_USERS).forEach(user => {
      this.users.set(user.id, { ...user });
    });
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.users.clear();
    this.auditLogs = [];
  }

  async clearTestData(): Promise<void> {
    this.users.clear();
    this.auditLogs = [];
    // Re-initialize with basic test users
    const { TEST_USERS } = await import('./fixtures');
    Object.values(TEST_USERS).forEach(user => {
      this.users.set(user.id, { ...user });
    });
  }

  async findUserById(id: string): Promise<TestUser | null> {
    return this.users.get(id) || null;
  }

  async findUserByUsername(username: string): Promise<TestUser | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<TestUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUsers(params: {
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    role?: UserRole | UserRole[];
    isActive?: boolean;
    isEmailVerified?: boolean;
  }): Promise<{ users: TestUser[]; total: number }> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (params.role) {
      const roles = Array.isArray(params.role) ? params.role : [params.role];
      users = users.filter(user => roles.includes(user.role));
    }

    if (params.isActive !== undefined) {
      users = users.filter(user => user.isActive === params.isActive);
    }

    if (params.isEmailVerified !== undefined) {
      users = users.filter(user => user.isEmailVerified === params.isEmailVerified);
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(user =>
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.fullName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      users.sort((a, b) => {
        const aValue = a[params.sortBy as keyof TestUser];
        const bValue = b[params.sortBy as keyof TestUser];

        if (aValue < bValue) return params.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = users.length;
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 50); // Max 50 per page
    const offset = params.offset || ((page - 1) * limit);

    users = users.slice(offset, offset + limit);

    return { users, total };
  }

  async createUser(userData: Omit<TestUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestUser> {
    const id = uuidv4();
    const timestamp = new Date();

    const user: TestUser = {
      id,
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<TestUser>): Promise<TestUser | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // Soft delete - mark as inactive and set deletedAt
    await this.updateUser(id, {
      isActive: false,
      deletedAt: new Date()
    });

    return true;
  }

  async activateUser(id: string, reason?: string): Promise<TestUser | null> {
    return this.updateUser(id, { isActive: true });
  }

  async deactivateUser(id: string, reason?: string): Promise<TestUser | null> {
    return this.updateUser(id, { isActive: false });
  }

  async changeUserRole(id: string, newRole: UserRole, reason?: string): Promise<TestUser | null> {
    return this.updateUser(id, { role: newRole });
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      timestamp: new Date(),
      ...log
    };

    this.auditLogs.push(auditLog);
    return auditLog;
  }

  async getAuditLogs(userId?: string, action?: string): Promise<AuditLog[]> {
    let logs = [...this.auditLogs];

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserPermissions(role: UserRole): Promise<Permission[]> {
    const rolePermissions: Record<UserRole, Permission[]> = {
      admin: [
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'update' },
        { resource: 'users', action: 'delete' },
        { resource: 'users', action: 'manage' },
        { resource: 'patients', action: 'create' },
        { resource: 'patients', action: 'read' },
        { resource: 'patients', action: 'update' },
        { resource: 'patients', action: 'delete' },
        { resource: 'appointments', action: 'create' },
        { resource: 'appointments', action: 'read' },
        { resource: 'appointments', action: 'update' },
        { resource: 'appointments', action: 'delete' },
        { resource: 'system', action: 'manage' }
      ],
      doctor: [
        { resource: 'patients', action: 'read' },
        { resource: 'patients', action: 'update' },
        { resource: 'appointments', action: 'read' },
        { resource: 'appointments', action: 'update' },
        { resource: 'reports', action: 'read' }
      ],
      nurse: [
        { resource: 'patients', action: 'read' },
        { resource: 'patients', action: 'update' },
        { resource: 'appointments', action: 'read' },
        { resource: 'appointments', action: 'update' }
      ],
      receptionist: [
        { resource: 'patients', action: 'create' },
        { resource: 'patients', action: 'read' },
        { resource: 'appointments', action: 'create' },
        { resource: 'appointments', action: 'read' },
        { resource: 'appointments', action: 'update' }
      ],
      technician: [
        { resource: 'patients', action: 'read' },
        { resource: 'reports', action: 'read' },
        { resource: 'equipment', action: 'read' }
      ],
      radiologist: [
        { resource: 'patients', action: 'read' },
        { resource: 'reports', action: 'create' },
        { resource: 'reports', action: 'read' },
        { resource: 'reports', action: 'update' }
      ]
    };

    return rolePermissions[role] || [];
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) return false;

    const permissions = await this.getUserPermissions(user.role);
    return permissions.some(permission =>
      permission.resource === resource &&
      (permission.action === action || permission.action === 'manage')
    );
  }

  // Test helper methods
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const { generateTestUser } = await import('./fixtures');
    const testUser = generateTestUser(userData);
    return this.createUser(testUser);
  }

  async createTestUsers(count: number, role?: UserRole): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < count; i++) {
      const { generateTestUser } = await import('./fixtures');
      const testUser = generateTestUser(role ? { role } : {});
      const user = await this.createUser(testUser);
      users.push(user);
    }
    return users;
  }

  async getTestData(): Promise<{ users: TestUser[]; auditLogs: AuditLog[] }> {
    return {
      users: Array.from(this.users.values()),
      auditLogs: [...this.auditLogs]
    };
  }
}

export class MockAuthService {
  private tokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async authenticateUser(username: string, password: string): Promise<{ user: TestUser; accessToken: string; refreshToken: string } | null> {
    const dbService = new MockDatabaseService();
    await dbService.connect();

    const user = await dbService.findUserByUsername(username);
    if (!user || user.password !== password || !user.isActive) {
      return null;
    }

    const accessToken = this.generateToken(user.id, '15m');
    const refreshToken = this.generateToken(user.id, '7d');

    this.tokens.set(accessToken, { userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    this.refreshTokens.set(refreshToken, { userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

    return { user, accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    const tokenData = this.tokens.get(token);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return null;
    }

    const dbService = new MockDatabaseService();
    await dbService.connect();

    const user = await dbService.findUserById(tokenData.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return { userId: user.id, role: user.role };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshData = this.refreshTokens.get(refreshToken);
    if (!refreshData || refreshData.expiresAt < new Date()) {
      return null;
    }

    const dbService = new MockDatabaseService();
    await dbService.connect();

    const user = await dbService.findUserById(refreshData.userId);
    if (!user || !user.isActive) {
      return null;
    }

    const newAccessToken = this.generateToken(user.id, '15m');
    const newRefreshToken = this.generateToken(user.id, '7d');

    this.tokens.set(newAccessToken, { userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    this.refreshTokens.set(newRefreshToken, { userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

    // Remove old tokens
    this.tokens.delete(refreshToken);
    this.refreshTokens.delete(refreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string): Promise<boolean> {
    this.tokens.delete(token);
    return true;
  }

  private generateToken(userId: string, expiresIn: string): string {
    return `mock_token_${userId}_${Date.now()}_${expiresIn}`;
  }
}

export class MockAuditService {
  private logs: AuditLog[] = [];

  async logAction(userId: string, action: string, resource: string, resourceId: string, details: Record<string, any> = {}): Promise<AuditLog> {
    const dbService = new MockDatabaseService();
    await dbService.connect();

    const auditLog = await dbService.createAuditLog({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });

    this.logs.push(auditLog);
    return auditLog;
  }

  async getAuditLogs(userId?: string, action?: string): Promise<AuditLog[]> {
    let logs = [...this.logs];

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
  }
}