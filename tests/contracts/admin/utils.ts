import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { AdminAuthResponse } from './types';

export class TestUtils {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateJWT(payload: any, secret: string, expiresIn: string): string {
    return jwt.sign(payload, secret, { expiresIn });
  }

  static validateJWTStructure(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      return (
        header.alg &&
        header.typ &&
        payload.sub &&
        payload.iat &&
        payload.exp
      );
    } catch {
      return false;
    }
  }

  static decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch {
      return null;
    }
  }

  static validateAuthResponse(response: any): response is AdminAuthResponse {
    return (
      typeof response === 'object' &&
      typeof response.success === 'boolean' &&
      (response.success ? (
        typeof response.data === 'object' &&
        typeof response.data.user === 'object' &&
        typeof response.data.accessToken === 'string' &&
        typeof response.data.refreshToken === 'string' &&
        typeof response.data.expiresIn === 'number' &&
        Array.isArray(response.data.permissions)
      ) : (
        typeof response.error === 'object' &&
        typeof response.error.code === 'string' &&
        typeof response.error.message === 'string'
      ))
    );
  }

  static generateTestToken(userId: string, username: string, role: string, permissions: string[] = []): string {
    const payload = {
      sub: userId,
      username: username,
      role: role,
      permissions: permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      type: 'access'
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key');
  }

  static generateRefreshToken(userId: string): string {
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'test-refresh-secret');
  }

  static validateTimestamps(response: any): boolean {
    const now = Date.now();
    const createdAt = new Date(response.createdAt).getTime();
    const updatedAt = new Date(response.updatedAt).getTime();

    return (
      !isNaN(createdAt) &&
      !isNaN(updatedAt) &&
      createdAt <= now &&
      updatedAt <= now &&
      createdAt <= updatedAt
    );
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (/^[0-9_]/.test(username)) {
      errors.push('Username must start with a letter');
    }

    const reservedNames = ['admin', 'root', 'superuser', 'system', 'user'];
    if (reservedNames.includes(username.toLowerCase())) {
      errors.push('Username is reserved');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static generateSecureRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static validateSystemMetrics(metrics: any): boolean {
    return (
      typeof metrics === 'object' &&
      typeof metrics.cpu === 'object' &&
      typeof metrics.cpu.usage === 'number' &&
      typeof metrics.cpu.cores === 'number' &&
      Array.isArray(metrics.cpu.loadAverage) &&
      typeof metrics.memory === 'object' &&
      typeof metrics.memory.total === 'number' &&
      typeof metrics.memory.used === 'number' &&
      typeof metrics.memory.usagePercentage === 'number' &&
      typeof metrics.disk === 'object' &&
      typeof metrics.disk.total === 'number' &&
      typeof metrics.disk.used === 'number' &&
      typeof metrics.disk.usagePercentage === 'number' &&
      typeof metrics.uptime === 'number' &&
      typeof metrics.timestamp === 'string'
    );
  }

  static validateAuditLog(log: any): boolean {
    return (
      typeof log === 'object' &&
      typeof log.id === 'string' &&
      typeof log.userId === 'string' &&
      typeof log.username === 'string' &&
      typeof log.action === 'string' &&
      typeof log.entityType === 'string' &&
      typeof log.entityId === 'string' &&
      typeof log.ipAddress === 'string' &&
      typeof log.userAgent === 'string' &&
      typeof log.timestamp === 'string'
    );
  }

  static validateSystemConfiguration(config: any): boolean {
    return (
      typeof config === 'object' &&
      typeof config.id === 'string' &&
      typeof config.key === 'string' &&
      typeof config.type === 'string' &&
      typeof config.category === 'string' &&
      typeof config.description === 'string' &&
      typeof config.isEditable === 'boolean' &&
      typeof config.isSensitive === 'boolean' &&
      typeof config.lastModified === 'string' &&
      typeof config.lastModifiedBy === 'string'
    );
  }

  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static sanitizeError(error: any): any {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    return error;
  }

  static createTestHeaders(token: string, additionalHeaders: Record<string, string> = {}) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'test-agent/1.0',
      ...additionalHeaders
    };
  }

  static validatePagination(pagination: any): boolean {
    return (
      typeof pagination === 'object' &&
      typeof pagination.page === 'number' &&
      typeof pagination.limit === 'number' &&
      typeof pagination.total === 'number' &&
      typeof pagination.totalPages === 'number' &&
      pagination.page >= 1 &&
      pagination.limit >= 1 &&
      pagination.total >= 0 &&
      pagination.totalPages >= 0
    );
  }
}