import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name: string;
  is_active: boolean;
}

export interface AuthPayload {
  user: User;
  token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthService {
  private pool: Pool;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private refreshExpiresIn: string;

  constructor(pool: Pool, jwtSecret: string, jwtExpiresIn: string = '15m', refreshExpiresIn: string = '7d') {
    this.pool = pool;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  async login(credentials: LoginCredentials): Promise<AuthPayload> {
    const { username, password } = credentials;

    // Find user by username or email
    const query = `
      SELECT id, username, email, password_hash, role, full_name, is_active
      FROM users
      WHERE username = $1 OR email = $1
      AND is_active = true
    `;

    const result = await this.pool.query(query, [username]);

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login
    await this.updateLastLogin(user.id);

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refresh_token: refreshToken
    };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refresh_token?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any;

      // Check if it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Verify user still exists and is active
      const query = `
        SELECT id, username, email, role, full_name, is_active
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const result = await this.pool.query(query, [decoded.sub]);
      if (result.rows.length === 0) {
        throw new Error('User not found or inactive');
      }

      const user = result.rows[0];

      // Generate new access token
      const newToken = this.generateAccessToken(user);

      // Optionally generate new refresh token for security
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newToken,
        refresh_token: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    // In a real implementation, you might want to maintain a token blacklist
    // For now, we'll just validate the token
    try {
      jwt.verify(token, this.jwtSecret);
    } catch (error) {
      // Token is invalid or expired, no need to blacklist
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, role, full_name, is_active
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    full_name: string;
  }): Promise<User> {
    const { username, email, password, role, full_name } = userData;

    // Check if username or email already exists
    const checkQuery = `
      SELECT id FROM users
      WHERE username = $1 OR email = $2
    `;

    const checkResult = await this.pool.query(checkQuery, [username, email]);
    if (checkResult.rows.length > 0) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, full_name, is_active
    `;

    const result = await this.pool.query(insertQuery, [username, email, passwordHash, role, full_name]);
    return result.rows[0];
  }

  async updateUser(userId: string, updates: {
    email?: string;
    full_name?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<User> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClause.push(`${key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No updates provided');
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, full_name, is_active
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  private generateRefreshToken(user: any): string {
    const payload = {
      sub: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshExpiresIn });
  }

  private async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}