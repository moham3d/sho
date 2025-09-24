// Mock database service for testing
export class MockDatabaseService {
  private users: any[] = [];
  private sessions: any[] = [];

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
    this.sessions = [];
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

  async createSession(sessionData: any): Promise<any> {
    const session = {
      ...sessionData,
      id: `session_${Date.now()}`,
      created_at: new Date()
    };
    this.sessions.push(session);
    return { rows: [session] };
  }

  async invalidateSession(userId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.user_id !== userId);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPassword;
      user.updated_at = new Date();
    }
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

// Mock JWT middleware
export const mockAuthMiddleware = (req: any, res: any, next: any) => {
  // Mock authentication logic
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && token !== 'invalid-token') {
    req.user = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };
  }
  next();
};

// Mock rate limiting middleware
export const mockRateLimitMiddleware = (req: any, res: any, next: any) => {
  // Mock rate limiting logic
  next();
};