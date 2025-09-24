import { TestUser, UserRole, AuditLog } from './types';
import { v4 as uuidv4 } from 'uuid';

export const TEST_USERS: Record<string, TestUser> = {
  ADMIN: {
    id: '1',
    username: 'admin_user',
    email: 'admin@shospital.com',
    password: 'AdminPassword123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    phone: '+201234567890',
    nationalId: '12345678901234',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  DOCTOR: {
    id: '2',
    username: 'doctor_smith',
    email: 'smith@shospital.com',
    password: 'DoctorPassword123!',
    firstName: 'John',
    lastName: 'Smith',
    role: 'doctor',
    phone: '+201234567891',
    nationalId: '12345678901235',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  NURSE: {
    id: '3',
    username: 'nurse_johnson',
    email: 'johnson@shospital.com',
    password: 'NursePassword123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'nurse',
    phone: '+201234567892',
    nationalId: '12345678901236',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },
  RECEPTIONIST: {
    id: '4',
    username: 'reception_brown',
    email: 'brown@shospital.com',
    password: 'ReceptionPassword123!',
    firstName: 'Emma',
    lastName: 'Brown',
    role: 'receptionist',
    phone: '+201234567893',
    nationalId: '12345678901237',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  },
  TECHNICIAN: {
    id: '5',
    username: 'tech_davis',
    email: 'davis@shospital.com',
    password: 'TechPassword123!',
    firstName: 'Michael',
    lastName: 'Davis',
    role: 'technician',
    phone: '+201234567894',
    nationalId: '12345678901238',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-05')
  },
  INACTIVE_USER: {
    id: '6',
    username: 'inactive_user',
    email: 'inactive@shospital.com',
    password: 'InactivePassword123!',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'nurse',
    phone: '+201234567895',
    nationalId: '12345678901239',
    isActive: false,
    isEmailVerified: false,
    createdAt: new Date('2023-01-06'),
    updatedAt: new Date('2023-01-06')
  },
  UNVERIFIED_USER: {
    id: '7',
    username: 'unverified_user',
    email: 'unverified@shospital.com',
    password: 'UnverifiedPassword123!',
    firstName: 'Unverified',
    lastName: 'User',
    role: 'receptionist',
    phone: '+201234567896',
    nationalId: '12345678901240',
    isActive: true,
    isEmailVerified: false,
    createdAt: new Date('2023-01-07'),
    updatedAt: new Date('2023-01-07')
  }
};

export const NEW_USER_DATA = {
  username: 'new_test_user',
  email: 'newuser@shospital.com',
  password: 'NewPassword123!',
  confirmPassword: 'NewPassword123!',
  firstName: 'New',
  lastName: 'User',
  role: 'nurse' as UserRole,
  phone: '+201234567897',
  nationalId: '12345678901241'
};

export const UPDATE_USER_DATA = {
  firstName: 'Updated',
  lastName: 'User',
  email: 'updated@shospital.com',
  phone: '+201234567898'
};

export const VALIDATION_TEST_CASES = {
  INVALID_USERNAMES: [
    '',
    '   ',
    'a',
    'user@name',
    'user name',
    '1234567890123456789012345678901', // 31 chars
    'admin',
    'root',
    'superuser',
    'system',
    'administrator'
  ],
  INVALID_EMAILS: [
    'invalid-email',
    'user@',
    '@domain.com',
    'user.domain.com',
    'user@domain',
    '',
    '   ',
    'user@domain.c',
    'user@.com'
  ],
  INVALID_PASSWORDS: [
    'short',
    'longenoughbutnocaps123',
    'LongEnoughButNoNumbers',
    'longenoughwithnumbers1butnospecialchars',
    ' spaces in password123',
    '',
    '   ',
    'Password1!',
    'password123!',
    'PASSWORD123!'
  ],
  INVALID_NAMES: [
    '',
    '   ',
    'A',
    'ThisNameIsWayTooLongAndShouldFailValidationBecauseItExceedsTheMaximumAllowedLength',
    '123',
    'User123',
    'User@Name',
    'User-Name'
  ],
  INVALID_PHONES: [
    '123',
    '12345678901234567890', // too long
    'abc123',
    '+123',
    '123-abc-456',
    'phone',
    '',
    '   '
  ],
  INVALID_NATIONAL_IDS: [
    '123',
    '12345678901234567890', // too long
    'abc123456789',
    '123-456-789',
    'nationalid',
    '',
    '   '
  ]
};

export const PAGINATION_TEST_CASES = [
  { page: 1, limit: 10, expectedLimit: 10 },
  { page: 2, limit: 5, expectedLimit: 5 },
  { page: 1, limit: 100, expectedLimit: 50 }, // max limit
  { page: 0, limit: 10, expectedPage: 1 }, // negative page
  { page: -1, limit: 10, expectedPage: 1 }
];

export const FILTERING_TEST_CASES = {
  ROLE_FILTERING: ['admin', 'doctor', 'nurse', 'receptionist', 'technician'],
  STATUS_FILTERING: [true, false],
  EMAIL_VERIFICATION_FILTERING: [true, false],
  DATE_RANGE_FILTERING: [
    { start: '2023-01-01', end: '2023-01-31' },
    { start: '2023-06-01', end: '2023-12-31' }
  ]
};

export const SORTING_TEST_CASES = [
  { sortBy: 'username', sortOrder: 'asc' },
  { sortBy: 'username', sortOrder: 'desc' },
  { sortBy: 'firstName', sortOrder: 'asc' },
  { sortBy: 'lastName', sortOrder: 'desc' },
  { sortBy: 'createdAt', sortOrder: 'asc' },
  { sortBy: 'createdAt', sortOrder: 'desc' }
];

export const SEARCH_TEST_CASES = [
  { query: 'admin', expected: ['admin_user'] },
  { query: 'doctor', expected: ['doctor_smith'] },
  { query: 'nurse', expected: ['nurse_johnson', 'inactive_user'] },
  { query: 'john', expected: ['nurse_johnson'] },
  { query: 'smith', expected: ['doctor_smith'] },
  { query: 'nonexistent', expected: [] }
];

export const SECURITY_TEST_CASES = {
  SQL_INJECTION: [
    "admin' OR '1'='1",
    "admin'; DROP TABLE users; --",
    "1' UNION SELECT username, password FROM users --",
    "admin' AND 1=1 --",
    "admin' OR 1=1#"
  ],
  XSS_ATTACKS: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '"><script>alert(1)</script>',
    '<svg onload="alert(1)">'
  ],
  PATH_TRAVERSAL: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '/etc/passwd',
    'C:\\Windows\\System32\\config'
  ]
};

export const AUDIT_LOG_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'ROLE_CHANGED',
  'PROFILE_UPDATED',
  'PASSWORD_CHANGED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT'
];

export const GDPR_COMPLIANCE_TEST_CASES = {
  DATA_DELETION: [
    { userId: '1', expected: 'user data deleted' },
    { userId: '2', expected: 'user data anonymized' }
  ],
  DATA_EXPORT: [
    { userId: '1', format: 'json' },
    { userId: '1', format: 'csv' }
  ],
  DATA_RETENTION: [
    { days: 30, expected: 'data retained' },
    { days: 365, expected: 'data archived' }
  ]
};

export const RATE_LIMITING_TEST_CASES = [
  { requests: 100, window: '1m', expected: 'allowed' },
  { requests: 101, window: '1m', expected: 'blocked' },
  { requests: 1000, window: '1h', expected: 'blocked' }
];

export const generateTestUser = (overrides: Partial<TestUser> = {}): TestUser => {
  const id = uuidv4();
  const timestamp = new Date();

  return {
    id,
    username: `test_user_${id.substring(0, 8)}`,
    email: `test_${id.substring(0, 8)}@shospital.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'nurse',
    phone: '+201234567899',
    nationalId: '12345678901242',
    isActive: true,
    isEmailVerified: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
};

export const generateAuditLog = (userId: string, action: string, resource: string, resourceId: string): AuditLog => {
  return {
    id: uuidv4(),
    userId,
    action,
    resource,
    resourceId,
    details: {},
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    timestamp: new Date()
  };
};