# Visit Management Contract Tests

This directory contains comprehensive contract tests for the visit management system endpoints. These tests validate API contracts for patient visit lifecycle, scheduling, and clinical workflow management.

## Test Coverage

### 1. CRUD Operations (`crud.contract.test.ts`)
- **POST /api/visits** - Create new visits
- **GET /api/visits** - List visits with pagination, filtering, and sorting
- **GET /api/visits/:id** - Retrieve specific visit details
- **PUT /api/visits/:id** - Update visit information
- **DELETE /api/visits/:id** - Soft delete visits with audit

### 2. Workflow Management (`workflow.contract.test.ts`)
- **POST /api/visits/:id/check-in** - Patient check-in process
- **POST /api/visits/:id/check-out** - Patient check-out process
- **GET /api/visits/upcoming** - Retrieve upcoming visits by time period
- **GET /api/visits/patient/:patientId** - Get patient visit history
- Visit status transitions and validation
- Clinical workflow state management

### 3. Scheduling Management (`scheduling.contract.test.ts`)
- Visit scheduling validation and rules
- Schedule conflict detection and resolution
- Visit rescheduling capabilities
- Doctor availability validation
- Working hours and weekend restrictions
- Emergency visit scheduling exceptions

### 4. Security & Audit Logging (`security-audit.contract.test.ts`)
- Authentication and authorization enforcement
- Role-based access control (RBAC)
- Comprehensive audit logging for all operations
- Data privacy and confidentiality measures
- HIPAA compliance features
- Form management security
- Data breach response capabilities

### 5. Form Management
- **GET /api/visits/:id/forms** - Retrieve visit-specific forms
- **POST /api/visits/:id/forms** - Create and manage visit forms
- Form validation and signing workflows
- Medical data handling and privacy

## Test Structure

### Directory Layout
```
tests/contracts/visits/
├── types.ts              # TypeScript interfaces and types
├── fixtures.ts           # Test data and mock objects
├── setup.ts             # Test environment setup
├── utils.ts             # Test utilities and helpers
├── index.ts             # Main entry point and configuration
├── crud.contract.test.ts        # CRUD operations tests
├── workflow.contract.test.ts    # Workflow management tests
├── scheduling.contract.test.ts  # Scheduling management tests
├── security-audit.contract.test.ts # Security and audit tests
└── README.md            # This documentation
```

### Key Components

#### Types and Interfaces (`types.ts`)
- Complete TypeScript definitions for all visit-related data structures
- Request/response type definitions
- Enum definitions for visit types, priorities, statuses, and outcomes
- Form and audit log interfaces

#### Test Fixtures (`fixtures.ts`)
- Mock patient data for testing
- Mock user data with different roles (doctor, nurse, admin)
- Valid and invalid test data for all endpoints
- Sample existing visits and forms for testing

#### Test Setup (`setup.ts`)
- `VisitTestSetup` class for test environment management
- Mock application setup with visit endpoints
- Database initialization and cleanup
- User authentication utilities
- Test data creation and management

#### Test Utilities (`utils.ts`)
- `VisitTestUtils` class with helper methods
- Reusable test functions for common operations
- Authentication and authorization testing helpers
- Validation and assertion utilities

#### Configuration (`index.ts`)
- Centralized test configuration
- Environment-specific settings
- API endpoint definitions
- Performance and security thresholds

## Test Features

### Authentication & Authorization
- JWT token validation
- Role-based access control
- Permission enforcement for sensitive operations
- Session management testing

### Data Validation
- Request format validation
- Business rule enforcement
- Data type checking
- Required field validation
- Format validation (dates, emails, etc.)

### Error Handling
- HTTP status code validation
- Error message format testing
- Graceful failure scenarios
- Input sanitization testing

### Performance Testing
- Response time validation
- Load testing capabilities
- Concurrency testing
- Database query performance

### Security Testing
- SQL injection prevention
- XSS protection
- CSRF protection
- Data encryption validation
- Access control testing

### Audit Logging
- Complete operation tracking
- User action logging
- Data change tracking
- Timestamp validation
- Log integrity verification

## Running Tests

### Available Commands

```bash
# Run all visit contract tests
npm run test:contracts:visits

# Run tests with coverage report
npm run test:contracts:visits:coverage

# Run specific test categories
npm run test:contracts:visits:crud      # CRUD operations
npm run test:contracts:visits:workflow   # Workflow management
npm run test:contracts:visits:scheduling # Scheduling management
npm run test:contracts:visits:security   # Security and audit

# Run individual test files
npx jest tests/contracts/visits/crud.contract.test.ts --config tests/jest.visits.config.js
npx jest tests/contracts/visits/workflow.contract.test.ts --config tests/jest.visits.config.js
npx jest tests/contracts/visits/scheduling.contract.test.ts --config tests/jest.visits.config.js
npx jest tests/contracts/visits/security-audit.contract.test.ts --config tests/jest.visits.config.js
```

### Test Configuration

The test suite uses a dedicated Jest configuration file (`tests/jest.visits.config.js`) with:

- TypeScript support
- Test environment setup
- Coverage reporting
- JUnit XML output for CI/CD integration
- Timeout configuration (30 seconds default)
- Parallel test execution

### Environment Variables

The tests support the following environment variables:

```bash
NODE_ENV=test                    # Test environment
TEST_BASE_URL=http://localhost:3000  # API base URL
POSTGREST_URL=http://localhost:3000   # PostgREST URL
TEST_TIMEOUT=30000              # Test timeout in milliseconds
```

## Test Data Management

### Mock Data
The test suite includes comprehensive mock data:
- **Patients**: 3 test patients with varying demographics
- **Users**: 4 users with different roles (doctor, nurse, admin)
- **Visits**: Sample visits covering all statuses and types
- **Forms**: Medical forms for various use cases

### Test Cleanup
- Automatic cleanup of created test data
- Database transaction rollback
- File system cleanup
- Memory management

### Data Relationships
- Patient-visit relationships
- User-role assignments
- Visit-form associations
- Doctor-patient assignments

## API Contract Validation

### Request Format Testing
- HTTP method validation
- Header requirements
- Content-Type validation
- Authentication header testing

### Response Format Testing
- Status code validation
- Response structure validation
- Data type checking
- Pagination format testing

### Error Response Testing
- 400 Bad Request validation
- 401 Unauthorized testing
- 403 Forbidden testing
- 404 Not Found testing
- 409 Conflict testing
- 500 Internal Server Error handling

## Integration Testing

### Database Integration
- PostgreSQL connection testing
- Data persistence validation
- Query performance testing
- Transaction rollback testing

### External Service Integration
- PostgREST API testing
- WebSocket connection testing
- External API integration
- Service availability testing

### Frontend Integration
- API contract validation
- Data format compatibility
- Error handling consistency
- Authentication flow testing

## Performance Benchmarks

### Response Time Thresholds
- List operations: < 2 seconds
- Create operations: < 1 second
- Update operations: < 1 second
- Delete operations: < 1 second
- Search operations: < 3 seconds

### Concurrency Testing
- Multiple simultaneous requests
- Database connection pooling
- Resource utilization monitoring
- Memory leak detection

## Security Compliance

### HIPAA Compliance
- PHI data protection
- Access control validation
- Audit trail completeness
- Data encryption verification
- Breach notification testing

### Data Privacy
- Patient data confidentiality
- Access logging validation
- Data retention compliance
- Consent management testing

### Security Best Practices
- Input validation
- Output encoding
- Parameterized queries
- Secure session management
- CSRF protection

## Continuous Integration

### CI/CD Pipeline
- Automated test execution
- Coverage reporting
- Performance monitoring
- Security scanning
- Deployment validation

### Test Reporting
- JUnit XML output
- HTML coverage reports
- Performance metrics
- Security scan results
- Code quality metrics

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify JWT token configuration
   - Check user role assignments
   - Validate authentication service availability

2. **Database Connection Issues**
   - Verify PostgreSQL service status
   - Check connection string configuration
   - Validate database permissions

3. **Test Timeouts**
   - Increase timeout values in configuration
   - Check for infinite loops
   - Verify external service availability

4. **Mock Data Issues**
   - Validate test data integrity
   - Check foreign key constraints
   - Verify data relationships

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=visit-tests npm run test:contracts:visits
```

## Contributing

### Adding New Tests
1. Create test data in `fixtures.ts`
2. Add type definitions in `types.ts`
3. Implement test in appropriate test file
4. Update documentation
5. Validate test coverage

### Test Maintenance
- Regular test data updates
- Dependency version management
- Configuration optimization
- Performance monitoring
- Security patch testing

## License

This test suite is part of the Al-Shorouk Hospital Radiology System and is subject to the same license terms as the main project.

## Support

For questions or issues related to these tests:
- Create an issue in the project repository
- Contact the development team
- Review the main project documentation