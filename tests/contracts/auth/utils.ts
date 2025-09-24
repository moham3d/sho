import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWTPayload, SecurityHeaders, RateLimitInfo } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
export const SALT_ROUNDS = 12;

export class TestUtils {
  /**
   * Generate a JWT token for testing
   */
  static generateToken(payload: Partial<JWTPayload>, expiresIn: string = '15m'): string {
    const defaultPayload: Partial<JWTPayload> = {
      sub: payload.sub || 'test-user-id',
      username: payload.username || 'testuser',
      email: payload.email || 'test@example.com',
      role: payload.role || 'user',
      iat: Math.floor(Date.now() / 1000)
    };

    // Remove exp from payload if it exists, since we're using expiresIn
    const { exp, ...payloadWithoutExp } = payload;

    return jwt.sign(
      { ...defaultPayload, ...payloadWithoutExp },
      JWT_SECRET,
      { expiresIn }
    );
  }

  /**
   * Generate a refresh token for testing
   */
  static generateRefreshToken(payload: Partial<JWTPayload>): string {
    const { exp, ...payloadWithoutExp } = payload;

    return jwt.sign(
      {
        ...payloadWithoutExp,
        type: 'refresh'
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  /**
   * Hash a password for testing
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
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

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   */
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

    const reservedUsernames = ['admin', 'root', 'superuser', 'system'];
    if (reservedUsernames.includes(username.toLowerCase())) {
      errors.push('Username is reserved');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse and validate JWT token structure
   */
  static validateJWTStructure(token: string): { isValid: boolean; payload?: JWTPayload; errors: string[] } {
    const errors: string[] = [];

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        errors.push('JWT token must have 3 parts (header.payload.signature)');
        return { isValid: false, errors };
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      if (!payload.sub) {
        errors.push('JWT payload must contain subject (sub)');
      }

      if (!payload.username) {
        errors.push('JWT payload must contain username');
      }

      if (!payload.role) {
        errors.push('JWT payload must contain role');
      }

      if (!payload.iat) {
        errors.push('JWT payload must contain issued at (iat)');
      }

      if (!payload.exp) {
        errors.push('JWT payload must contain expiration (exp)');
      }

      if (payload.exp <= Math.floor(Date.now() / 1000)) {
        errors.push('JWT token has expired');
      }

      return {
        isValid: errors.length === 0,
        payload,
        errors
      };
    } catch (error) {
      errors.push('Invalid JWT token format');
      return { isValid: false, errors };
    }
  }

  /**
   * Validate security headers (case-insensitive)
   */
  static validateSecurityHeaders(headers: Record<string, string>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Convert headers to lowercase for case-insensitive comparison
    const normalizedHeaders = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key];
      return acc;
    }, {} as Record<string, string>);

    if (normalizedHeaders['x-content-type-options'] !== 'nosniff') {
      errors.push('X-Content-Type-Options must be nosniff');
    }

    if (normalizedHeaders['x-frame-options'] !== 'DENY') {
      errors.push('X-Frame-Options must be DENY');
    }

    if (normalizedHeaders['x-xss-protection'] !== '1; mode=block') {
      errors.push('X-XSS-Protection must be 1; mode=block');
    }

    if (!normalizedHeaders['strict-transport-security']?.includes('max-age=31536000')) {
      errors.push('Strict-Transport-Security must include max-age=31536000');
    }

    if (!normalizedHeaders['content-security-policy']) {
      errors.push('Content-Security-Policy header is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse rate limit headers
   */
  static parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo | null {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    const retryAfter = headers['retry-after'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
    }

    return null;
  }

  /**
   * Generate test delay for rate limiting tests
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a test user data object
   */
  static createTestUser(overrides: Partial<any> = {}) {
    return {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      role: 'nurse',
      firstName: 'Test',
      lastName: 'User',
      ...overrides
    };
  }
}