# Authentication Contract Tests

This directory contains comprehensive contract tests for the authentication system endpoints, ensuring API compliance, security, and reliability.

## Test Structure

### Core Test Files

- **`auth.contract.test.ts`** - Tests for core authentication endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`

- **`profile.contract.test.ts`** - Tests for profile management:
  - `GET /api/auth/profile`
  - `PUT /api/auth/profile`

- **`password.contract.test.ts`** - Tests for password management:
  - `POST /api/auth/change-password`

- **`security.contract.test.ts`** - Security-focused tests:
  - Security headers validation
  - XSS and SQL injection protection
  - Rate limiting
  - Token security
  - Input validation

- **`integration.contract.test.ts`** - Integration and end-to-end tests:
  - Complete authentication flows
  - Cross-role authentication
  - Token lifecycle management
  - Concurrent operations

### Support Files

- **`fixtures.ts`** - Test data and sample inputs
- **`types.ts`** - TypeScript interfaces and type definitions
- **`utils.ts`** - Test utilities and helper functions
- **`setup.ts`** - Test setup and teardown configuration
- **`index.ts`** - Main export file

## Test Coverage

### Request/Response Validation
- ✅ Valid request/response schemas
- ✅ HTTP status codes
- ✅ Response format consistency
- ✅ Error response structure

### Authentication & Authorization
- ✅ JWT token structure and validation
- ✅ Role-based access control
- ✅ Token refresh mechanism
- ✅ Session invalidation

### Security Testing
- ✅ Password hashing verification
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ SQL injection protection
- ✅ Security headers
- ✅ Rate limiting

### Error Handling
- ✅ Validation errors
- ✅ Authentication failures
- ✅ Authorization failures
- ✅ Database errors
- ✅ Network errors

### Edge Cases
- ✅ Concurrent user operations
- ✅ Database connection issues
- ✅ Token expiration scenarios
- ✅ Password history validation
- ✅ Large payloads

## Running Tests

### Run all auth contract tests:
```bash
npm run test:contracts
```

### Run specific test files:
```bash
npx jest tests/contracts/auth/auth.contract.test.ts --config tests/jest.auth.config.js
npx jest tests/contracts/auth/security.contract.test.ts --config tests/jest.auth.config.js
```

### Run with coverage:
```bash
npx jest tests/contracts/auth/ --config tests/jest.auth.config.js --coverage
```

### Run in watch mode:
```bash
npx jest tests/contracts/auth/ --config tests/jest.auth.config.js --watch
```

## Test Configuration

The tests use a custom Jest configuration (`tests/jest.auth.config.js`) with:

- Extended timeout for authentication operations
- Test environment variables
- Specific coverage patterns for auth-related files
- Custom setup and teardown procedures

## Test Data

Tests use predefined test users with different roles:
- **Admin** - Full system access
- **Doctor** - Medical staff access
- **Nurse** - Limited medical access
- **Receptionist** - Patient management access
- **Technician** - Technical staff access

All test data is automatically cleaned up after each test run.

## Security Features Tested

### Password Security
- Minimum 8 characters
- Requires uppercase, lowercase, numbers, and special characters
- Password history validation (prevents reuse)
- Secure hashing with bcrypt

### Token Security
- JWT with proper expiration
- Refresh token rotation
- Signature validation
- Issuer and audience validation

### Rate Limiting
- Login attempts (5 attempts per minute)
- Registration attempts (3 attempts per minute)
- Password change attempts (3 attempts per minute)

### Input Validation
- Email format validation
- Username format validation
- Phone number validation
- XSS and SQL injection protection

## API Contracts

### Login Endpoint
```
POST /api/auth/login
Request: { username: string, password: string }
Response: { success: boolean, data: { user, accessToken, refreshToken, expiresIn } }
```

### Registration Endpoint
```
POST /api/auth/register
Request: { username, email, password, confirmPassword, role, firstName, lastName, phone? }
Response: { success: boolean, data: { user, accessToken, refreshToken, expiresIn } }
```

### Profile Endpoints
```
GET /api/auth/profile
Response: { success: boolean, data: User }

PUT /api/auth/profile
Request: { firstName?, lastName?, email?, phone? }
Response: { success: boolean, data: User }
```

### Password Change
```
POST /api/auth/change-password
Request: { currentPassword, newPassword, confirmNewPassword }
Response: { success: boolean, message: string }
```

## Error Responses

All endpoints return consistent error responses:
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: ValidationError[]
  },
  timestamp: Date,
  path: string
}
```

### Common Error Codes
- `AUTH_001` - Invalid credentials
- `AUTH_002` - User not found
- `AUTH_003` - Account locked
- `AUTH_004` - Invalid token
- `AUTH_005` - Token expired
- `AUTH_006` - Password mismatch
- `VAL_001` - Validation error
- `VAL_002` - Invalid email format
- `VAL_003` - Weak password
- `RATE_001` - Rate limit exceeded

## Dependencies

- Jest (testing framework)
- Supertest (HTTP assertions)
- TypeScript
- bcrypt (password hashing)
- jsonwebtoken (JWT handling)
- Node.js 18+

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the provided test utilities and fixtures
3. Ensure proper cleanup in `afterEach` hooks
4. Include both positive and negative test cases
5. Add documentation for new test scenarios
6. Update the README with new test coverage

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Ensure PostgreSQL is running
- Check test database configuration
- Verify database migrations are applied

**JWT Token Issues**
- Check JWT_SECRET environment variable
- Verify token expiration times
- Ensure proper token signing

**Rate Limiting Issues**
- Reset rate limits between tests
- Use different test users for concurrent tests
- Check Redis connection for rate limiting storage

### Debug Mode

Set environment variable for debug output:
```bash
DEBUG=auth:* npm run test:contracts
```