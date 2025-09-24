# Form Management Contract Tests

This directory contains comprehensive contract tests for the Form Management System in the Al-Shorouk Radiology System. These tests validate API contracts, business logic, security requirements, and compliance standards for form management functionality.

## Test Structure

### Core Test Files

- **`crud.contract.test.ts`** - Tests for basic CRUD operations on forms
- **`digital-signature.contract.test.ts`** - Tests for digital signature workflows
- **`audit-trail.contract.test.ts`** - Tests for audit trail and form versioning
- **`rbac.contract.test.ts`** - Tests for role-based access control
- **`security-compliance.contract.test.ts`** - Tests for security and compliance requirements

### Supporting Files

- **`types.ts`** - TypeScript types and interfaces for form management
- **`fixtures.ts`** - Test data fixtures and mock objects
- **`setup.ts`** - Test setup and teardown logic
- **`utils.ts`** - Utility functions and helpers
- **`index.ts`** - Test exports and configuration

## Test Coverage

The test suite covers the following API endpoints:

### Form CRUD Operations
- `GET /api/forms` - List forms with pagination, filtering, and sorting
- `GET /api/forms/:id` - Get form by ID
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Soft delete form

### Digital Signatures
- `GET /api/forms/:id/signatures` - List form signatures
- `POST /api/forms/:id/sign` - Add signature to form
- `GET /api/forms/:id/signatures/verify` - Verify signatures

### Audit Trail & Versioning
- `GET /api/forms/:id/audit-trail` - Get form audit trail
- `GET /api/forms/:id/versions` - List form versions
- `POST /api/forms/:id/versions` - Create form version
- `POST /api/forms/:id/restore` - Restore form version

### Form Templates
- `GET /api/forms/templates` - List form templates

## Key Features Tested

### 1. Form Lifecycle Management
- Form creation from templates
- Form data validation against schema
- Status transitions (draft → in_progress → pending_review → approved → signed → archived)
- Form submission workflows
- Soft deletion with audit trail

### 2. Digital Signature Workflows
- Electronic and digital signatures
- Multi-signature workflows
- Signature verification and validation
- Certificate-based authentication
- Biometric verification support
- Signature revocation and rejection
- Device and location capture

### 3. Audit Trail & Compliance
- Comprehensive audit logging for all operations
- Form versioning with change tracking
- Immutable audit records
- Compliance with HIPAA, GDPR, and local regulations
- Data breach detection and notification
- Audit trail export and analytics

### 4. Security & Access Control
- Role-based access control (RBAC)
- Department-based permissions
- Patient assignment restrictions
- PHI protection and encryption
- Input validation and sanitization
- Rate limiting and throttling
- Session management
- Security headers and response handling

### 5. Multi-Language Support
- Arabic and English language support
- RTL (Right-to-Left) text handling
- Field translations and localization
- Culture-specific formatting

### 6. Performance & Reliability
- Response time benchmarks
- Concurrent request handling
- Database query optimization
- Memory usage monitoring
- Error handling and recovery

## Test Categories

The tests are organized into the following categories:

### CRUD Operations
- Form listing with pagination and filtering
- Form creation, reading, updating, deletion
- Template management
- Data validation and schema enforcement

### Digital Signatures
- Signature capture and verification
- Multi-signature workflows
- Certificate and biometric authentication
- Signature lifecycle management

### Audit Trail & Versioning
- Audit log creation and management
- Form versioning and comparison
- Version restoration and rollback
- Compliance reporting

### Security & Compliance
- Data privacy and PHI protection
- Access control and authorization
- Input validation and security
- Regulatory compliance (HIPAA, GDPR)

### Role-Based Access
- Permission management by role
- Form type-specific access
- Department and patient restrictions
- Emergency override procedures

## Running Tests

### Run All Form Tests
```bash
npm run test:contracts:forms
```

### Run Specific Test Categories
```bash
# CRUD operations
npm run test:contracts:forms:crud

# Digital signatures
npm run test:contracts:forms:signatures

# Audit trail
npm run test:contracts:forms:audit

# Role-based access control
npm run test:contracts:forms:rbac

# Security and compliance
npm run test:contracts:forms:security
```

### Run with Coverage
```bash
npm run test:contracts:forms:coverage
```

### Run Individual Test Files
```bash
# Using Jest directly
jest tests/contracts/forms/crud.contract.test.ts --config tests/jest.forms.config.js

# Using npm scripts
npm run test:contracts:forms:crud
```

## Test Configuration

### Jest Configuration
- **Config File**: `jest.forms.config.js`
- **Test Timeout**: 30 seconds
- **Environment**: Node.js
- **Coverage Directory**: `coverage/forms`

### Environment Variables
```bash
# Base URL for API tests
TEST_BASE_URL=http://localhost:3000

# Database configuration
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_db

# Authentication service URL
TEST_AUTH_URL=http://localhost:3001

# Performance thresholds
TEST_MAX_RESPONSE_TIME=2000
TEST_MAX_DB_QUERY_TIME=500
```

## Test Data

### Mock Users
- **Admin**: Full system access
- **Doctor**: Can create/modify medical forms, sign documents
- **Nurse**: Can create/modify nursing forms, sign documents
- **Receptionist**: Limited access, can create consent forms
- **Technician**: Read-only access to relevant forms

### Mock Patients
- **Patient 1**: محمد أحمد (Arabic name, Egyptian national ID)
- **Patient 2**: فاطمة علي (Arabic name, Egyptian national ID)
- **Patient 3**: John Doe (English name)

### Form Templates
- **Nurse Assessment Form**: Vital signs, patient assessment
- **Doctor Evaluation Form**: Medical history, diagnosis, treatment
- **Informed Consent Form**: Procedure information and consent

## Performance Benchmarks

- **Response Time**: < 2 seconds for most operations
- **Database Query Time**: < 500ms
- **Signature Verification**: < 3 seconds
- **PDF Generation**: < 10 seconds
- **Audit Log Query**: < 1 second

## Security Requirements

### Authentication & Authorization
- JWT token validation
- Session timeout: 30 minutes
- Password requirements: 12+ characters, strong complexity
- MFA support for critical operations

### Data Protection
- AES-256-GCM encryption for sensitive data
- PHI masking based on user role
- Data minimization principles
- Right to be forgotten (GDPR)

### Audit & Compliance
- Immutable audit logs (7-year retention)
- HIPAA compliance for medical data
- GDPR compliance for EU patients
- Local regulatory compliance

## Compliance Standards

### HIPAA (Health Insurance Portability and Accountability Act)
- PHI protection
- Access controls
- Audit controls
- Integrity controls
- Transmission security

### GDPR (General Data Protection Regulation)
- Data minimization
- Consent management
- Right to access
- Right to erasure
- Data portability
- Breach notification

### Local Regulations (Egyptian Healthcare)
- Arabic language support
- National ID validation
- Local data storage requirements
- Cultural considerations

## Known Limitations

### Pending Implementation
- Form template validation tests
- Form submission and approval tests
- Multi-language support tests
- PDF generation tests
- Integration tests with visit management

### External Dependencies
- Tests require mock database setup
- Some integration tests need actual services
- File upload testing requires storage service

## Troubleshooting

### Common Issues

1. **Test Timeout Issues**
   - Increase test timeout in `jest.forms.config.js`
   - Check database connection and performance
   - Verify external service availability

2. **Authentication Failures**
   - Verify mock authentication service is running
   - Check token generation and validation
   - Ensure user roles are properly configured

3. **Database Connection Errors**
   - Verify test database is running
   - Check connection string in environment variables
   - Ensure proper table schemas exist

4. **Permission Denied Errors**
   - Verify role-based access control configuration
   - Check user permissions and role assignments
   - Ensure proper test data setup

### Debug Tips

1. **Enable Verbose Logging**
   ```bash
   DEBUG=forms:* npm run test:contracts:forms
   ```

2. **Run Tests in Isolation**
   ```bash
   jest tests/contracts/forms/crud.contract.test.ts --verbose --no-coverage
   ```

3. **Check Test Environment**
   ```bash
   npm run env:check
   ```

## Contributing

### Adding New Tests

1. **Create Test File**: Use naming convention `feature.contract.test.ts`
2. **Update Package.json**: Add test script if needed
3. **Update Index.ts**: Export new test module
4. **Add Documentation**: Update this README

### Test Guidelines

1. **Use Mock Data**: Leverage existing fixtures and utilities
2. **Follow Patterns**: Maintain consistency with existing tests
3. **Include Error Cases**: Test both success and failure scenarios
4. **Add Performance Tests**: Include benchmarks for critical operations
5. **Document Security**: Include security and compliance considerations

## Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP assertions
- **TypeScript**: Type safety
- **Axios**: HTTP client (for integration tests)
- **Mock Services**: Database and authentication mocking

## Future Enhancements

### Planned Features
- Form template validation tests
- PDF generation and export tests
- Multi-language support validation
- Visit management integration tests
- Real-time collaboration testing
- Mobile responsive form testing
- Accessibility compliance testing

### Performance Improvements
- Parallel test execution
- Test data factory patterns
- Snapshot testing optimization
- Mock service performance tuning

## License

This test suite is part of the Al-Shorouk Radiology System and is licensed under the MIT License.

## Support

For issues or questions regarding the form management tests:
1. Check existing issues in the project repository
2. Review troubleshooting section above
3. Contact the development team
4. Check project documentation for related information