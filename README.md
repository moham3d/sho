# Al-Shorouk Radiology Management System

Multi-role healthcare management platform for radiology departments with comprehensive nursing assessments, doctor evaluations, and administrative oversight.

## Features

- **Role-based Access Control**: Nurse, Doctor, and Admin roles with appropriate permissions
- **Digital Signatures**: Canvas-based signature capture for legal compliance
- **Bilingual Interface**: Arabic/English language support with RTL layout
- **Real-time Monitoring**: WebSocket-based system health and error tracking
- **Comprehensive Forms**: Nursing assessments and doctor evaluations with validation
- **Audit Trail**: Complete audit logging for compliance requirements

## Technology Stack

- **Frontend**: React 18+ with TypeScript, Tailwind CSS, React Router
- **Backend**: PostgREST with PostgreSQL 14+
- **Authentication**: JWT with bcrypt password hashing
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Containerization**: Docker Compose with Nginx
- **Testing**: Jest, React Testing Library, PostgreSQL testing

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

### Setup

1. **Clone and setup repository**
   ```bash
   git clone <repository-url>
   cd sho
   git checkout 001-system-requirements-user
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Start development environment**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   npm run db:migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Default admin: admin/admin123

## Development

### Project Structure

```
sho/
├── backend/           # Node.js backend with PostgREST
├── frontend/          # React TypeScript application
├── tests/             # Test suites (contracts, e2e, performance)
├── docs/              # Documentation
├── specs/             # Feature specifications
└── docker-compose.yml # Container orchestration
```

### Available Scripts

- `npm run dev` - Start development environment
- `npm test` - Run all tests
- `npm run lint` - Run code linting
- `npm run build` - Build for production
- `npm start` - Start with Docker

## Testing

### Test Categories

1. **Contract Tests**: API endpoint validation
2. **E2E Tests**: Complete user workflows
3. **Performance Tests**: 20 concurrent users, 1-second response time
4. **Security Tests**: RLS policies, JWT validation, SQL injection prevention

### Running Tests

```bash
# Run specific test suites
npm run test:contracts
npm run test:e2e
npm run test:performance
npm run test:security

# Run all tests
npm test
```

## Deployment

### Production Setup

1. **Environment Configuration**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:password@prod-db:5432/radiology_db
   JWT_SECRET=production-super-secret-key
   ```

2. **Docker Production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **SSL Configuration**
   ```bash
   sudo certbot --nginx -d api.alshorouk.com
   ```

## Documentation

- [API Documentation](http://localhost:3000/api/docs)
- [User Manual](docs/user-manual.md)
- [Technical Guide](docs/technical-guide.md)
- [Troubleshooting](docs/troubleshooting.md)

## Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Audit Logging**: Complete audit trail for all actions
- **Data Encryption**: Encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization

## Performance

- **20 Concurrent Users**: System designed for multi-hospital deployment
- **1-Second Response**: Optimized database queries and caching
- **99% Uptime**: High availability with automatic failover
- **Database Optimization**: Smart indexing and connection pooling

## Contributing

1. Follow the established coding standards
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

MIT License - see LICENSE file for details

## Support

- **Technical Support**: support@alshorouk.com
- **System Administrator**: admin@alshorouk.com
- **Emergency Support**: +20 123 456 7890

---

**Al-Shorouk Hospital Radiology Department** © 2025