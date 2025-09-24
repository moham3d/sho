# Admin Functions Contract Tests

This directory contains comprehensive contract tests for admin functions and system management endpoints in the healthcare radiology system.

## Test Coverage

### Primary Endpoints Tested

1. **GET /api/admin/system-metrics** - System performance monitoring
2. **GET /api/admin/audit-logs** - Audit log management with filtering
3. **GET /api/admin/users/activity** - User activity statistics
4. **POST /api/admin/system/backup** - System backup operations
5. **POST /api/admin/system/restore** - Database restore operations
6. **GET /api/admin/system/configuration** - System configuration retrieval
7. **PUT /api/admin/system/configuration** - System configuration updates
8. **POST /api/admin/system/maintenance-mode** - Maintenance mode management
9. **GET /api/admin/reports/usage** - Usage analytics reports
10. **GET /api/admin/reports/compliance** - Compliance reports

### Test Categories

1. **Main Contract Tests** (`admin.contract.test.ts`)
   - Basic endpoint functionality
   - Request/response format validation
   - Authentication and authorization
   - Error handling
   - Basic admin operations

2. **Security and Compliance** (`security-compliance.contract.test.ts`)
   - Security headers validation
   - Authentication and authorization
   - Audit trail verification
   - Data protection and privacy
   - Compliance reporting (HIPAA, GDPR, etc.)
   - Emergency procedures

3. **Backup and Restore** (`backup-restore.contract.test.ts`)
   - Backup creation and management
   - Database restore operations
   - Backup validation and integrity
   - Restore history and monitoring
   - Backup security and encryption
   - Performance and scalability

4. **System Management** (`system-management.contract.test.ts`)
   - System configuration management
   - Maintenance mode operations
   - System health monitoring
   - Service management
   - System updates and patches
   - Cross-cutting concerns

5. **Reports and Analytics** (`reports-analytics.contract.test.ts`)
   - Usage reports (daily, weekly, monthly)
   - Compliance reports (HIPAA, GDPR, Security)
   - Analytics and dashboards
   - Alerts and notifications
   - Report scheduling and automation
   - Data export capabilities

## Test Features

### Authentication & Authorization
- Role-based access control (RBAC)
- Permission validation
- Token-based authentication
- Session management
- Multi-factor authentication requirements

### Security Validation
- HTTP security headers
- CSRF protection
- SQL injection prevention
- XSS protection
- Rate limiting
- Input validation

### Data Protection
- Sensitive data masking
- Data encryption
- Audit logging
- Data retention policies
- Privacy compliance

### Performance & Scalability
- Response time validation
- Large dataset handling
- Concurrent operations
- Memory usage monitoring
- Throughput testing

### Error Handling
- HTTP status code validation
- Error message consistency
- Graceful failure handling
- Recovery procedures
- Error logging

## Test Data & Fixtures

### Test Users
- **Super Admin**: Full system permissions
- **System Admin**: System management permissions
- **Audit Admin**: Audit and reporting permissions
- **Limited Admin**: Read-only admin permissions
- **Regular User**: Non-admin user for access control testing

### Sample Data
- System metrics (CPU, memory, disk, network)
- Audit logs with various actions
- System configurations
- Backup and restore records
- Usage and compliance reports

## Running Tests

### Individual Test Files
```bash
# Run main contract tests
npm run test:contracts:admin

# Run security compliance tests
npm run test:contracts:admin:security

# Run backup/restore tests
npm run test:contracts:admin:backup

# Run system management tests
npm run test:contracts:admin:system

# Run reports/analytics tests
npm run test:contracts:admin:reports
```

### With Coverage
```bash
# Run all admin tests with coverage
npm run test:contracts:admin:coverage

# Run specific category with coverage
npm run test:contracts:admin:security:coverage
```

### Custom Test Runs
```bash
# Using Jest directly
npx jest tests/contracts/admin/ --config tests/jest.admin.config.js

# Run specific test file
npx jest tests/contracts/admin/admin.contract.test.ts --config tests/jest.admin.config.js

# Run with verbose output
npx jest tests/contracts/admin/ --config tests/jest.admin.config.js --verbose
```

## Test Configuration

### Jest Configuration
- **Preset**: `ts-jest`
- **Test Environment**: `node`
- **Timeout**: 30 seconds (extended for admin operations)
- **Coverage**: Comprehensive coverage reporting
- **Environment Variables**: Test-specific configuration

### Test Dependencies
- **Jest**: Test framework
- **Supertest**: HTTP assertion library
- **TypeScript**: Type checking
- **Mock Services**: Database and service mocking

## Test Output

### Success Criteria
- All HTTP status codes are correct
- Response formats match API contracts
- Authentication works properly
- Authorization controls are enforced
- Error handling is robust
- Security headers are present
- Performance is acceptable

### Reports Generated
- Test coverage reports
- Performance metrics
- Security validation results
- Compliance check results
- Error analysis

## Best Practices

### Test Writing
- Follow AAA pattern (Arrange, Act, Assert)
- Use descriptive test names
- Test both success and failure scenarios
- Validate all response properties
- Include security edge cases
- Test with different user roles

### Data Management
- Use test fixtures consistently
- Clean up test data after each test
- Use meaningful test data
- Validate data integrity
- Test with large datasets

### Security Testing
- Test authentication bypasses
- Validate input sanitization
- Test for common vulnerabilities
- Verify audit logging
- Test privilege escalation

## Troubleshooting

### Common Issues
1. **Permission Errors**: Ensure test users have correct permissions
2. **Timeout Issues**: Increase test timeout for long operations
3. **Database Issues**: Check mock database setup
4. **Authentication Issues**: Verify JWT token generation
5. **Endpoint Issues**: Confirm API routes are properly mocked

### Debug Tips
- Use `--verbose` flag for detailed output
- Check test environment variables
- Verify mock service responses
- Use console.log for debugging (remove before commit)
- Check Jest configuration

## Contributing

### Adding New Tests
1. Create new test file in appropriate category
2. Follow existing naming conventions
3. Add to package.json scripts if needed
4. Update documentation
5. Ensure proper test coverage

### Test Maintenance
- Keep fixtures updated
- Review and update security tests
- Monitor test performance
- Update for API changes
- Regular coverage analysis

## Integration Notes

These tests integrate with:
- Authentication system
- Authorization middleware
- Audit logging system
- Database services
- Configuration management
- Reporting services
- Monitoring services

For questions or issues, please refer to the main project documentation or contact the development team.