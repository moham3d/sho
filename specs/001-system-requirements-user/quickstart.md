# Quickstart Guide: Al-Shorouk Radiology Management System

**Feature**: Al-Shorouk Radiology Management System
**Date**: 2025-09-24
**Status**: Ready for Implementation

## Prerequisites

Before starting, ensure you have the following installed:

- **Docker** and **Docker Compose** (latest versions)
- **Git** for version control
- **Node.js** 18+ (for frontend development)
- **PostgreSQL** client tools (optional, for database management)

## Quick Setup (15 minutes)

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone <repository-url>
cd sho

# Switch to the feature branch
git checkout 001-system-requirements-user

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/radiology_db
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development

# Docker Services
POSTGRES_PORT=5432
POSTGRES_USER=radiology_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=radiology_db

# Frontend Development
FRONTEND_PORT=3000
BACKEND_PORT=3000
WEBSOCKET_PORT=3001
```

### 3. Start Development Environment
```bash
# Start all services
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database
```bash
# Run database migrations
docker-compose exec postgres psql -U radiology_user -d radiology_db -f /docker-entrypoint-initdb.d/01-schema.sql

# Create default admin user
docker-compose exec backend node scripts/create-admin.js
```

### 5. Verify Setup
```bash
# Check database connection
docker-compose exec postgres psql -U radiology_user -d radiology_db -c "SELECT version();"

# Check backend health
curl http://localhost:3000/health

# Check frontend
open http://localhost:3000
```

## System Access

### Default Administrator Account
- **Username**: `admin`
- **Password**: `admin123` (change immediately after first login)
- **URL**: http://localhost:3000

### API Documentation
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/spec

### Database Access
- **Host**: localhost
- **Port**: 5432
- **Database**: radiology_db
- **Username**: radiology_user
- **Password**: secure_password

## First-Time Configuration

### 1. Create Users
As an administrator, create the initial user accounts:

```bash
# Create nurse user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nurse_sarah",
    "email": "sarah@alshorouk.com",
    "password": "SecurePass123!",
    "role": "nurse",
    "full_name": "Sarah Johnson"
  }'

# Create doctor user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor_ahmed",
    "email": "ahmed@alshorouk.com",
    "password": "SecurePass123!",
    "role": "doctor",
    "full_name": "Dr. Ahmed Mohamed"
  }'
```

### 2. Test User Workflow
1. **Login as Nurse**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "nurse_sarah",
       "password": "SecurePass123!"
     }'
   ```

2. **Create Patient**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/patients \
     -H "Authorization: Bearer NURSE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Mohamed Ali",
       "national_id": "1234567890",
       "medical_number": "MED-2025-001",
       "date_of_birth": "1985-03-15",
       "gender": "male",
       "mobile_number": "+20 123 456 7890"
     }'
   ```

3. **Create Visit**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/visits \
     -H "Authorization: Bearer NURSE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "patient_id": "PATIENT_ID",
       "doctor_id": "DOCTOR_USER_ID",
       "arrival_mode": "ambulance",
       "chief_complaint": "Chest pain for 2 hours"
     }'
   ```

## Development Workflow

### Frontend Development
```bash
# Start frontend in development mode
cd frontend
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Backend Development
```bash
# Run backend in development mode
cd backend
npm run dev

# Run tests
npm test

# Migrate database
npm run migrate
```

### Database Management
```bash
# Access database shell
docker-compose exec postgres psql -U radiology_user -d radiology_db

# Backup database
docker-compose exec postgres pg_dump -U radiology_user radiology_db > backup.sql

# Restore database
docker-compose exec -i postgres psql -U radiology_user radiology_db < backup.sql
```

## Testing the System

### 1. End-to-End Test
```bash
# Run complete workflow test
npm run test:e2e
```

**Test Scenario**:
1. Administrator creates nurse and doctor accounts
2. Nurse creates patient and visit
3. Nurse completes assessment form
4. Doctor reviews and completes evaluation
5. Both signatures are captured
6. Case is marked as complete

### 2. Performance Test
```bash
# Run performance tests
npm run test:performance
```

**Expected Results**:
- Response time < 1 second for all operations
- Support for 20 concurrent users
- Database queries < 100ms

### 3. Security Test
```bash
# Run security tests
npm run test:security
```

**Expected Results**:
- RLS policies prevent unauthorized access
- JWT tokens are properly validated
- Password hashing with bcrypt
- Audit logs are created for all actions

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database service
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check network
docker network ls
```

**2. Frontend Won't Load**
```bash
# Check frontend service
docker-compose logs frontend

# Clear node modules
rm -rf frontend/node_modules
npm install
```

**3. JWT Authentication Issues**
```bash
# Verify JWT secret
echo $JWT_SECRET

# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**4. Arabic Text Display Issues**
```bash
# Check font loading in browser
# Verify RTL CSS is applied
# Test with different browsers
```

### Health Checks

**System Health**:
```bash
curl http://localhost:3000/health
```

**Database Health**:
```bash
curl http://localhost:3000/api/v1/admin/health
```

**WebSocket Connection**:
```bash
# Check WebSocket status in browser console
# Verify real-time updates work
```

## Production Deployment

### 1. Environment Configuration
```env
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/radiology_db
JWT_SECRET=production-super-secret-key
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/key.pem
```

### 2. Docker Production Setup
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  backend:
    environment:
      NODE_ENV: production
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
```

### 3. SSL Configuration
```bash
# Generate SSL certificates
sudo certbot --nginx -d api.alshorouk.com

# Configure Nginx
sudo nano /etc/nginx/nginx.conf
```

## Monitoring and Maintenance

### 1. System Monitoring
```bash
# View real-time logs
docker-compose logs -f --tail=100

# Monitor resource usage
docker stats

# Check database performance
docker-compose exec postgres psql -U radiology_user -d radiology_db -c "SELECT * FROM pg_stat_activity;"
```

### 2. Backup Strategy
```bash
# Daily backup
0 2 * * * docker-compose exec postgres pg_dump -U radiology_user radiology_db > /backups/daily-$(date +\%Y\%m\%d).sql

# Weekly backup
0 3 * * 0 docker-compose exec postgres pg_dump -U radiology_user radiology_db > /backups/weekly-$(date +\%Y\%m\%d).sql
```

### 3. Security Updates
```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Update dependencies
npm update
npm audit fix
```

## Support

### Documentation
- **API Documentation**: http://localhost:3000/api/docs
- **User Manual**: /docs/user-manual.md
- **Technical Documentation**: /docs/technical-guide.md

### Troubleshooting Resources
- **Error Codes**: /docs/error-codes.md
- **Common Issues**: /docs/troubleshooting.md
- **Performance Guide**: /docs/performance.md

### Support Contacts
- **Technical Support**: support@alshorouk.com
- **System Administrator**: admin@alshorouk.com
- **Emergency Support**: +20 123 456 7890

## Next Steps

1. **Complete Implementation**: Follow the tasks.md file for detailed implementation steps
2. **Testing**: Run comprehensive tests including security and performance
3. **Training**: Train staff on system usage and workflows
4. **Deployment**: Deploy to production environment
5. **Monitoring**: Set up monitoring and alerting systems

---

**This quickstart guide should have your system running in 15 minutes. For detailed implementation, refer to the tasks.md file.**