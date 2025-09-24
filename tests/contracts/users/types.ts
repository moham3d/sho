export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  nationalId?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  nationalId?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  nationalId?: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface UserRoleChangeRequest {
  role: UserRole;
  reason?: string;
}

export interface UserActivationRequest {
  isActive: boolean;
  reason?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'username' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: UserRole | UserRole[];
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

export interface UserResponse {
  success: boolean;
  data?: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    validationErrors?: ValidationError[];
  };
}

export interface SingleUserResponse {
  success: boolean;
  data?: User;
  error?: {
    code: string;
    message: string;
    details?: any;
    validationErrors?: ValidationError[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AuthContext {
  userId: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician' | 'radiologist';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  nationalId?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTestData {
  users: TestUser[];
  auditLogs: AuditLog[];
}

export interface TestContext {
  authToken: string;
  refreshToken: string;
  currentUser: TestUser;
  app: any;
  dbService: any;
}