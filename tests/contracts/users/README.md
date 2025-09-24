# User Management Contract Tests

This directory contains comprehensive contract tests for the user management system endpoints. These tests validate API contracts, authentication, authorization, data validation, security compliance, and GDPR requirements.

## Test Structure

```
tests/contracts/users/
├── types.ts                 # TypeScript type definitions
├── fixtures.ts              # Test data and constants
├── mocks.ts                 # Mock database and service implementations
├── setup.ts                 # Test setup and teardown
├── utils.ts                 # Test utilities and helpers
├── crud.contract.test.ts    # CRUD operations tests
├── role-management.contract.test.ts  # Role management tests
├── lifecycle.contract.test.ts        # User lifecycle tests
├── profile.contract.test.ts         # Profile management tests
├── pagination-filtering.contract.test.ts  # Pagination and filtering tests
├── security-compliance.contract.test.ts  # Security and compliance tests
├── index.ts                 # Test exports and configuration
└── README.md                # This file
```

## Test Coverage

### Endpoints Tested

1. **GET /api/users** - List users with pagination, filtering, and sorting
2. **GET /api/users/:id** - Get user by ID
3. **POST /api/users** - Create new user
4. **PUT /api/users/:id** - Update user
5. **DELETE /api/users/:id** - Delete user (soft delete)
6. **GET /api/users/me** - Get current user profile
7. **PUT /api/users/me** - Update current user profile
8. **POST /api/users/:id/activate** - Activate user account
9. **POST /api/users/:id/deactivate** - Deactivate user account
10. **POST /api/users/:id/change-role** - Change user role

### Test Categories

#### 1. CRUD Operations
- Request/response format validation
- Authentication and authorization
- Input validation and sanitization
- Error handling
- Data integrity

#### 2. Role Management
- Role-based access control (RBAC)
- Role assignment and validation
- Permission inheritance
- Role transition validation
- Audit logging for role changes

#### 3. User Lifecycle
- Account activation/deactivation
- Authentication state management
- Bulk operations
- Suspension and reinstatement
- Lifecycle state transitions

#### 4. Profile Management
- Self-service profile updates
- Field validation and sanitization
- Data privacy protection
- Profile access restrictions
- Update notifications

#### 5. Pagination and Filtering
- Pagination with configurable limits
- Multi-field filtering
- Advanced search functionality
- Sorting and ordering
- Performance optimization
- Combined query operations

#### 6. Security and Compliance
- Input validation and sanitization
- Authentication and authorization
- GDPR compliance (data deletion, export, anonymization)
- Audit logging and monitoring
- Rate limiting and throttling
- Security headers
- Password security

## Key Features

### Mock Services
- **MockDatabaseService**: In-memory database with user management capabilities
- **MockAuthService**: Token-based authentication simulation
- **MockAuditService**: Audit logging for security events

### Test Data
- Comprehensive test fixtures covering all user roles
- Validation test cases for edge cases
- Security attack payload simulations
- GDPR compliance test scenarios

### Validation Coverage
- Input validation for all endpoints
- Response format validation
- Error handling scenarios
- Security vulnerability testing
- Performance benchmarking

### Compliance Testing
- GDPR compliance (right to be forgotten, data portability)
- Data retention policies
- Audit trail requirements
- Security best practices
- Accessibility standards

## Running Tests

### Individual Test Files
```bash
# Run specific test category
npm test -- crud.contract.test.ts
npm test -- role-management.contract.test.ts
npm test -- security-compliance.contract.test.ts

# Run with coverage
npm run test:contracts -- --coverage
```

### All User Management Tests
```bash
# Run all user contract tests
npm run test:contracts

# Run with verbose output
npm test -- --verbose

# Run with specific timeout
npm test -- --testTimeout=30000
```

### Configuration
Tests can be configured through the following environment variables:

```bash
# Test configuration
TEST_TIMEOUT=30000
TEST_VERBOSE=true
TEST_COVERAGE=true

# Database configuration (if using real database)
TEST_DB_URL=postgresql://test:test@localhost:5432/test_db
TEST_DB_POOL_SIZE=5

# Security configuration
JWT_SECRET=test-secret-key
SESSION_TIMEOUT=900000
RATE_LIMIT_WINDOW=60000
```

## Test Data

### Default Test Users
- **Admin**: Full system access
- **Doctor**: Limited to medical functions
- **Nurse**: Patient care functions
- **Receptionist**: Appointment and registration
- **Technician**: Equipment and technical
- **Radiologist**: Imaging and reports

### Validation Test Cases
- Invalid email formats
- Weak passwords
- SQL injection payloads
- XSS attack vectors
- Path traversal attempts
- Rate limiting scenarios

## Security Testing

### Vulnerability Testing
- **SQL Injection**: Preventing database attacks
- **XSS Prevention**: Protecting against script injection
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Sanitization**: Cleaning user input
- **Authentication Bypass**: Ensuring proper auth flow

### Compliance Testing
- **GDPR Compliance**: Data protection regulations
- **HIPAA Compliance**: Healthcare data protection
- **Audit Requirements**: Security event logging
- **Data Retention**: Proper data lifecycle management
- **Access Control**: Role-based permissions

## Performance Testing

### Benchmarks
- **Response Time**: < 1 second for most operations
- **Database Queries**: < 500ms for complex queries
- **Authentication**: < 100ms for token validation
- **Pagination**: < 2 seconds for large datasets
- **Search Operations**: < 1.5 seconds for full-text search

### Load Testing
- **Concurrent Users**: Simulating multiple users
- **Rate Limiting**: Testing API throttling
- **Memory Usage**: Monitoring resource consumption
- **Database Connections**: Pool management

## Audit Logging

All security-relevant events are logged:
- User creation, updates, deletion
- Role changes and permission assignments
- Authentication attempts (success/failure)
- Profile modifications
- Account activation/deactivation
- Data access and export requests

## Error Handling

### Standard Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource
- **429 Too Many Requests**: Rate limited
- **500 Internal Server Error**: System error

### Validation Errors
Detailed validation error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "validationErrors": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use meaningful test names
- Test both success and failure scenarios
- Include edge cases and boundary conditions
- Mock external dependencies

### Security Testing
- Test all input vectors
- Verify authentication/authorization
- Test for common vulnerabilities
- Validate error message safety
- Test audit log completeness

### Performance Testing
- Set realistic performance thresholds
- Test under various load conditions
- Monitor resource usage
- Test with large datasets
- Verify timeout handling

## Contributing

When adding new tests:

1. **Add to appropriate test file** or create new test category
2. **Include both positive and negative test cases**
3. **Add necessary test data to fixtures**
4. **Update type definitions if needed**
5. **Include performance benchmarks**
6. **Add audit logging verification**
7. **Update documentation**

## Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP assertions
- **TypeScript**: Type safety
- **uuid**: Unique identifier generation
- Express.js: Test server setup

## Integration

These tests are designed to integrate with:
- CI/CD pipelines
- Code coverage reporting
- Security scanning tools
- Performance monitoring
- Compliance checking tools

For more information about the overall test strategy, see the main project documentation.