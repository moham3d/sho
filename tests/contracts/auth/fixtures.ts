import { User } from '../types/user.types';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'technician';
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  ADMIN: {
    id: '1',
    username: 'test_admin',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    firstName: 'Test',
    lastName: 'Admin',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  DOCTOR: {
    id: '2',
    username: 'test_doctor',
    email: 'doctor@example.com',
    password: 'DoctorPassword123!',
    role: 'doctor',
    firstName: 'Test',
    lastName: 'Doctor',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  NURSE: {
    id: '3',
    username: 'test_nurse',
    email: 'nurse@example.com',
    password: 'NursePassword123!',
    role: 'nurse',
    firstName: 'Test',
    lastName: 'Nurse',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  RECEPTIONIST: {
    id: '4',
    username: 'test_receptionist',
    email: 'receptionist@example.com',
    password: 'ReceptionistPassword123!',
    role: 'receptionist',
    firstName: 'Test',
    lastName: 'Receptionist',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  INACTIVE: {
    id: '5',
    username: 'test_inactive',
    email: 'inactive@example.com',
    password: 'InactivePassword123!',
    role: 'nurse',
    firstName: 'Test',
    lastName: 'Inactive',
    isActive: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

export const VALIDATION_TEST_CASES = {
  INVALID_EMAILS: [
    'invalid-email',
    'user@',
    '@domain.com',
    'user.domain.com',
    'user@domain',
    '',
    '   '
  ],
  INVALID_PASSWORDS: [
    'short',
    'longenoughbutnocaps123',
    'LongEnoughButNoNumbers',
    'longenoughwithnumbers1butnospecialchars',
    ' spaces in password123',
    '',
    '   '
  ],
  INVALID_USERNAMES: [
    '',
    '   ',
    'a',
    'user@name',
    'user name',
    '1234567890123456789012345678901', // 31 chars
    'admin',
    'root',
    'superuser'
  ],
  INVALID_PHONES: [
    '123',
    '12345678901234567890', // too long
    'abc123',
    '+123',
    '123-abc-456'
  ]
};

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'"
};