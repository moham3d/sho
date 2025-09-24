# Al-Shorouk Radiology Management System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Frontend Application](#frontend-application)
5. [Backend Services](#backend-services)
6. [Docker Configuration](#docker-configuration)
7. [API Endpoints](#api-endpoints)
8. [Security & Authentication](#security--authentication)
9. [Development & Deployment](#development--deployment)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

**Al-Shorouk Radiology Management System** is a comprehensive healthcare application designed for radiology departments to manage patient visits, nursing assessments, and doctor evaluations. The system supports role-based workflows for nurses, doctors, and administrators.

### Core Features
- **Patient Management**: Registration, demographics, visit tracking
- **Nursing Assessments**: Comprehensive screening forms with vital signs, pain assessment, fall risk evaluation
- **Doctor Evaluations**: Radiology-specific forms with technical parameters and findings
- **Digital Signatures**: Integrated signature capture for form validation
- **Role-Based Access**: Secure access control for different user types
- **Real-time Monitoring**: Health monitoring and error tracking
- **Audit Trail**: Complete form and signature tracking

### Technology Stack
- **Frontend**: React 18+ with TypeScript
- **Backend**: PostgREST (PostgreSQL REST API)
- **Database**: PostgreSQL 14+ with Row Level Security (RLS)
- **Infrastructure**: Docker Compose, Nginx reverse proxy
- **Authentication**: JWT-based with role-based access control

---

## Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx         │    │   Backend       │
│   React App     │────│   Reverse       │────│   PostgREST     │
│   Port: 3001    │    │   Proxy         │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                      ┌─────────────────┐
                      │   PostgreSQL    │
                      │   Database      │
                      │   Port: 5432    │
                      └─────────────────┘
```

### Component Architecture
```
Frontend (React/TypeScript)
├── Authentication Context
├── Role-Based Routing
├── Nurse Module
│   ├── Patient Search
│   ├── Visit Management
│   └── Assessment Forms
├── Doctor Module
│   ├── Case Review
│   └── Radiology Forms
├── Admin Module
│   ├── User Management
│   └── System Monitoring
└── Troubleshooting Services
    ├── Error Logging
    ├── Health Monitoring
    └── WebSocket Communication
```

---

## Database Schema

### Core Tables Overview

#### 1. Users Table
**Purpose**: Store system users (nurses, doctors, admins)
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE,
  password_hash text,
  role text NOT NULL CHECK (role IN ('nurse','doctor','admin')),
  created_at timestamptz DEFAULT now()
);
```

**Fields:**
- `id`: Unique user identifier (UUID)
- `name`: Full name of the user
- `email`: Login email (unique)
- `password_hash`: Encrypted password
- `role`: User role (nurse, doctor, admin)
- `created_at`: Account creation timestamp

#### 2. Patients Table
**Purpose**: Store patient demographics and contact information
```sql
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  national_id text UNIQUE,            -- الرقم القومي
  medical_number text,                -- الرقم الطبي
  full_name text,
  mobile text,
  dob date,
  age int,
  gender text CHECK (gender IN ('male','female','other')),
  diagnosis text,
  contact_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Fields:**
- `id`: Unique patient identifier
- `national_id`: National ID number (الرقم القومي) - unique
- `medical_number`: Hospital medical record number
- `full_name`: Patient's full name
- `mobile`: Contact phone number
- `dob`: Date of birth
- `age`: Patient age
- `gender`: Patient gender (male/female/other)
- `diagnosis`: Current diagnosis
- `contact_info`: Additional contact details (JSON)
- `created_at/updated_at`: Timestamps

#### 3. Visits Table
**Purpose**: Track patient visits and link nurse/doctor forms
```sql
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES users(id),   -- who started the visit
  doctor_id uuid REFERENCES users(id),  -- assigned doctor
  visit_date timestamptz DEFAULT now(),
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','signed','closed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Fields:**
- `id`: Unique visit identifier
- `patient_id`: Reference to patient
- `nurse_id`: Nurse who initiated the visit
- `doctor_id`: Assigned doctor (nullable until assigned)
- `visit_date`: Visit date and time
- `status`: Visit status (open/in_progress/signed/closed)
- `notes`: Additional visit notes
- `created_at/updated_at`: Timestamps

#### 4. Nurse Forms Table
**Purpose**: Store comprehensive nursing assessments
```sql
CREATE TABLE nurse_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  nurse_id uuid REFERENCES users(id),

  -- Basic screening fields
  arrival_mode text,        -- ambulatory/stretcher/chair/other
  chief_complaint text,     -- الشكوي الحالية
  age_text text,           -- free-form age description
  accompanied_by text,      -- spouse/relative/other
  language_spoken text,     -- Arabic/English/other

  -- Vital signs
  temp text,               -- Temperature
  pulse text,              -- Pulse rate
  bp text,                 -- Blood pressure
  resp_rate text,          -- Respiratory rate
  o2_saturation text,      -- Oxygen saturation
  blood_sugar text,        -- Blood glucose
  weight text,             -- Weight
  height text,             -- Height

  -- Psychosocial assessment
  psychosocial_history text,
  psychological_problem text,    -- anxious/agitated/depressed/none
  special_habits text,           -- smoking habits
  allergies text,                -- allergy status
  allergies_details text,        -- allergy details

  -- Nutritional screening
  diet text,                     -- regular/special diet
  appetite text,                 -- good/poor
  gi_problems boolean,           -- GI issues present
  gi_problems_details text,
  weight_loss boolean,
  weight_gain boolean,
  refer_to_nutritionist boolean,

  -- Functional assessment
  self_care_status text,         -- independent/needs supervision/dependent
  feeding_status text,
  hygiene_status text,
  toileting_status text,
  ambulation_status text,
  musculoskeletal_notes text,
  pain_musculoskeletal text,
  use_of_assistive_equipment text, -- walker/wheelchair/none/other

  -- Educational needs (JSON structure)
  educational_needs jsonb,       -- {medication: bool, nutrition: bool, equipment: bool, etc.}
  education_notes text,

  -- Pain assessment
  pain_present boolean,
  pain_intensity text,           -- 0-10 scale
  pain_location text,
  pain_frequency text,
  pain_duration text,
  pain_character text,
  pain_action_taken text,

  -- Fall risk assessment
  fall_risk_score int,
  fall_risk_details jsonb,       -- Morse scale or similar

  -- Specialized assessments
  elderly_assessment jsonb,
  disabled_assessment jsonb,

  -- Form management
  temporary boolean DEFAULT true,   -- draft status
  signed boolean DEFAULT false,
  signature_data text,              -- base64 signature
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Sections:**
1. **Basic Screening**: Arrival mode, complaints, demographics
2. **Vital Signs**: Complete set of vital signs measurements
3. **Psychosocial**: Mental health, habits, allergies
4. **Nutritional**: Diet, appetite, weight changes
5. **Functional**: Self-care abilities, mobility
6. **Educational Needs**: Patient education requirements
7. **Pain Assessment**: Comprehensive pain evaluation
8. **Fall Risk**: Fall prevention assessment
9. **Signatures**: Digital signature capture

#### 5. Doctor Forms Table
**Purpose**: Store radiology-specific evaluations and technical parameters
```sql
CREATE TABLE doctor_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES users(id),

  -- Patient information (repeated for form completion)
  patient_full_name text,
  exam_date date,
  mobile text,
  medical_number text,
  dob date,
  age int,
  gender text,
  diagnosis text,

  -- Study information
  study_reason text,            -- "Why you do the study?"
  splint_present boolean,       -- "Is there a gypsum splint?"
  splint_notes text,
  chronic_disease text,
  pacemaker boolean,
  implants text,                -- slats/screws/artificial joints
  pregnancy_status text,        -- unknown/yes/no (for women)
  pain_numbness boolean,
  pain_site text,
  spinal_deformity boolean,
  spinal_deformity_details text,
  swelling boolean,
  swelling_site text,
  neuro_symptoms text,          -- headache/visual/hearing/imbalance
  fever boolean,
  surgeries text,               -- previous operations + dates
  tumor_history text,
  previous_investigations text,
  previous_disc boolean,        -- previous disc/herniation
  meds_increase_fall_risk boolean,
  current_medication text,

  -- Technical radiology parameters
  ctd1vol text,                 -- CTD1vol (mGy)
  dlp text,                     -- DLP (mGy·cm)
  kv text,                      -- kV setting
  mas text,                     -- mAs setting

  -- Signatures
  patient_signature text,       -- optional patient signature
  doctor_signature text,        -- radiologist signature (base64)
  doctor_signed_at timestamptz,

  -- Form management
  temporary boolean DEFAULT true,
  signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Sections:**
1. **Patient Demographics**: Repeated for form completeness
2. **Study Information**: Reason, contraindications, medical history
3. **Technical Parameters**: Radiation dose and imaging settings
4. **Clinical Findings**: Space for radiological interpretation
5. **Signatures**: Patient and doctor digital signatures

### Database Views

#### Visit Forms View
**Purpose**: Consolidated view of visit status and form completion
```sql
CREATE VIEW visit_forms_view AS
SELECT
  v.*,
  p.full_name as patient_name,
  nf.id as nurse_form_id,
  nf.signed as nurse_signed,
  df.id as doctor_form_id,
  df.signed as doctor_signed
FROM visits v
LEFT JOIN patients p ON p.id = v.patient_id
LEFT JOIN nurse_forms nf ON nf.visit_id = v.id
LEFT JOIN doctor_forms df ON df.visit_id = v.id;
```

### Row Level Security (RLS) Policies

The database implements comprehensive Row Level Security:

1. **Users**: Admin full access, users can view their own profile
2. **Patients**: Clinical staff can view/create, admin can modify
3. **Visits**: Users can only see visits they're involved in
4. **Nurse Forms**: Nurses can create/edit their own forms, doctors can view
5. **Doctor Forms**: Doctors can create/edit their own forms, nurses can view

---

## Frontend Application

### Application Structure
```
frontend/src/
├── components/           # Reusable components
│   ├── Forms/           # Form components
│   │   ├── NurseForm.tsx
│   │   ├── DoctorForm.tsx
│   │   └── SignaturePad.tsx
│   ├── Troubleshooting/ # System monitoring
│   │   ├── ErrorLogViewer.tsx
│   │   ├── WebSocketStatus.tsx
│   │   └── HealthMonitorDashboard.tsx
│   └── ErrorBoundary.tsx
├── pages/               # Route components
│   ├── nurse/           # Nurse module
│   │   ├── NurseDashboard.tsx
│   │   ├── PatientSearch.tsx
│   │   ├── NewVisit.tsx
│   │   ├── NurseForm.tsx
│   │   └── VisitDetail.tsx
│   ├── doctor/          # Doctor module
│   │   ├── DoctorDashboard.tsx
│   │   └── DoctorForm.tsx
│   ├── admin/           # Admin module
│   │   └── AdminDashboard.tsx
│   ├── DashboardPage.tsx
│   └── LoginPage.tsx
├── services/            # API and business logic
│   ├── apiClient.ts
│   ├── authSessionService.ts
│   ├── errorLoggingService.ts
│   ├── healthMonitoringService.ts
│   ├── websocketService.ts
│   ├── jwtService.ts
│   ├── dataRetentionService.ts
│   └── index.ts
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── hooks/               # Custom hooks
│   └── useErrorLogging.ts
├── css/                 # Stylesheets
└── tests/               # Test files
```

### Key Frontend Features

#### 1. Authentication System
- **JWT-based authentication** with automatic token refresh
- **Role-based access control** (nurse, doctor, admin)
- **Session management** with activity tracking
- **Development credentials** for easy testing

#### 2. Nurse Module
- **Patient Search**: Search by name or national ID
- **Visit Management**: Create and track patient visits
- **Assessment Forms**: Comprehensive nursing evaluation
- **Digital Signatures**: Integrated signature capture

#### 3. Doctor Module
- **Case Review**: Review nurse assessments
- **Radiology Forms**: Technical parameters and findings
- **Priority Management**: Case prioritization and filtering

#### 4. Admin Module
- **User Management**: Create and manage system users
- **System Monitoring**: Health status and error tracking
- **Data Analytics**: System usage statistics

#### 5. Error Handling & Monitoring
- **Error Boundaries**: Catch and handle React errors
- **Comprehensive Logging**: Categorized error tracking
- **Health Monitoring**: API endpoint status checking
- **Real-time Notifications**: WebSocket-based updates

### Form Field Documentation

#### Nurse Form Fields (Complete List)

**Basic Information Section:**
- `arrival_mode`: How patient arrived (ambulatory/stretcher/wheelchair/other)
- `chief_complaint`: Patient's main complaint (الشكوي الحالية)
- `age_text`: Age description or numeric age
- `accompanied_by`: Who came with patient (spouse/relative/other)
- `language_spoken`: Primary language (Arabic/English/other)

**Vital Signs Section:**
- `temp`: Body temperature (°C or °F)
- `pulse`: Heart rate (beats per minute)
- `bp`: Blood pressure (systolic/diastolic)
- `resp_rate`: Respiratory rate (breaths per minute)
- `o2_saturation`: Oxygen saturation percentage
- `blood_sugar`: Blood glucose level
- `weight`: Patient weight (kg or lbs)
- `height`: Patient height (cm or inches)

**Psychosocial Assessment:**
- `psychosocial_history`: Relevant psychosocial background
- `psychological_problem`: Mental state (anxious/agitated/depressed/none)
- `special_habits`: Smoking and other habits
- `allergies`: Allergy status (yes/no/unknown)
- `allergies_details`: Specific allergy information

**Nutritional Assessment:**
- `diet`: Diet type (regular/special/therapeutic)
- `appetite`: Appetite status (good/poor/variable)
- `gi_problems`: GI issues present (boolean)
- `gi_problems_details`: Description of GI problems
- `weight_loss`: Recent weight loss (boolean)
- `weight_gain`: Recent weight gain (boolean)
- `refer_to_nutritionist`: Needs nutrition consult (boolean)

**Functional Assessment:**
- `self_care_status`: Independence level (independent/supervised/dependent)
- `feeding_status`: Feeding ability
- `hygiene_status`: Hygiene self-care ability
- `toileting_status`: Toileting independence
- `ambulation_status`: Mobility status
- `musculoskeletal_notes`: MSK observations
- `pain_musculoskeletal`: MSK pain assessment
- `use_of_assistive_equipment`: Mobility aids (walker/wheelchair/none/other)

**Educational Needs (JSON structure):**
```json
{
  "medication": boolean,          // Medication education needed
  "nutrition": boolean,           // Nutrition education needed
  "equipment": boolean,           // Equipment training needed
  "rehab_techniques": boolean,    // Rehabilitation techniques
  "interactions": boolean,        // Drug/food interactions
  "pain_symptoms": boolean,       // Pain management education
  "fall_risk_education": boolean, // Fall prevention education
  "other": "string"              // Other educational needs
}
```

**Pain Assessment:**
- `pain_present`: Pain currently present (boolean)
- `pain_intensity`: Pain scale 0-10
- `pain_location`: Anatomical location of pain
- `pain_frequency`: How often pain occurs
- `pain_duration`: How long pain lasts
- `pain_character`: Type of pain (sharp/dull/burning/etc.)
- `pain_action_taken`: Interventions attempted

**Fall Risk Assessment:**
- `fall_risk_score`: Numeric fall risk score
- `fall_risk_details`: JSON structure with assessment details

**Specialized Assessments:**
- `elderly_assessment`: Geriatric-specific assessments (JSON)
- `disabled_assessment`: Disability-related assessments (JSON)

**Form Management:**
- `temporary`: Draft status (boolean)
- `signed`: Final signature status (boolean)
- `signature_data`: Base64 encoded signature image
- `signed_at`: Timestamp of signature

#### Doctor Form Fields (Complete List)

**Patient Information (Header):**
- `patient_full_name`: Patient's full name
- `exam_date`: Date of examination
- `mobile`: Contact phone number
- `medical_number`: Hospital medical record number
- `dob`: Date of birth
- `age`: Patient age
- `gender`: Patient gender
- `diagnosis`: Current diagnosis

**Study Information:**
- `study_reason`: Medical indication for imaging
- `splint_present`: Presence of cast/splint (boolean)
- `splint_notes`: Details about splint/cast
- `chronic_disease`: Chronic medical conditions
- `pacemaker`: Cardiac pacemaker present (boolean)
- `implants`: Surgical implants (slats/screws/joints)
- `pregnancy_status`: Pregnancy status for women (unknown/yes/no)
- `pain_numbness`: Pain or numbness present (boolean)
- `pain_site`: Location of pain
- `spinal_deformity`: Spinal abnormalities (boolean)
- `spinal_deformity_details`: Description of spinal issues
- `swelling`: Swelling present (boolean)
- `swelling_site`: Location of swelling
- `neuro_symptoms`: Neurological symptoms (headache/visual/hearing/imbalance)
- `fever`: Fever present (boolean)
- `surgeries`: Previous surgical history with dates
- `tumor_history`: History of malignancy
- `previous_investigations`: Prior imaging studies
- `previous_disc`: History of disc problems (boolean)
- `meds_increase_fall_risk`: Fall risk medications (boolean)
- `current_medication`: Current medication list

**Technical Parameters:**
- `ctd1vol`: CT Dose Index Volume (mGy)
- `dlp`: Dose Length Product (mGy·cm)
- `kv`: Kilovoltage setting
- `mas`: Milliampere-seconds

**Signatures:**
- `patient_signature`: Patient signature (base64)
- `doctor_signature`: Doctor signature (base64)
- `doctor_signed_at`: Doctor signature timestamp

**Form Management:**
- `temporary`: Draft status (boolean)
- `signed`: Final signature status (boolean)

---

## Backend Services

### PostgREST Configuration
The backend uses PostgREST, which automatically generates a REST API from the PostgreSQL schema.

#### Environment Variables
```bash
PGRST_DB_URI=postgres://radiology_app:secure_password@database:5432/alshorouk_radiology
PGRST_DB_SCHEMA=public
PGRST_DB_ANON_ROLE=web_anon
PGRST_JWT_SECRET=your-256-bit-secret-key-here-change-in-production
PGRST_OPENAPI_SERVER_PROXY_URI=http://localhost:3000
PGRST_SERVER_CORS_ALLOWED_ORIGINS=http://localhost:3001
```

#### Database Roles
- `web_anon`: Anonymous access role
- `radiology_app`: Application database user
- Role-based access through JWT claims

### WebSocket Service
Real-time communication service built with Node.js WebSocket server.

**Features:**
- Connection monitoring
- Real-time error broadcasting
- Health status updates
- Session management

---

## Docker Configuration

### Services Overview

#### 1. Database Service
```yaml
database:
  image: postgres:14
  container_name: alshorouk-db
  environment:
    POSTGRES_DB: alshorouk_radiology
    POSTGRES_USER: radiology_app
    POSTGRES_PASSWORD: secure_password
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
```

#### 2. PostgREST API Service
```yaml
postgrest:
  image: postgrest/postgrest:v11.2.0
  container_name: alshorouk-api
  expose:
    - "3000"
  environment:
    PGRST_DB_URI: postgres://radiology_app:secure_password@database:5432/alshorouk_radiology
    PGRST_DB_SCHEMA: public
    PGRST_DB_ANON_ROLE: web_anon
    PGRST_JWT_SECRET: your-256-bit-secret-key-here-change-in-production
```

#### 3. Frontend Service
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.dev
  container_name: alshorouk-frontend
  expose:
    - "3000"
  environment:
    - REACT_APP_API_URL=http://localhost:3000
    - REACT_APP_WS_URL=ws://localhost:3000/ws
    - NODE_ENV=development
```

#### 4. Nginx Reverse Proxy
```yaml
nginx:
  image: nginx:alpine
  container_name: alshorouk-nginx
  ports:
    - "3001:80"      # Frontend
    - "3000:3000"    # Backend API
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
```

#### 5. WebSocket Service
```yaml
websocket:
  image: node:18-alpine
  container_name: alshorouk-websocket
  expose:
    - "8080"
  command: # WebSocket server implementation
```

### Network Configuration
```yaml
networks:
  alshorouk-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## API Endpoints

### Authentication Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Patient Management
- `GET /patients` - List patients
- `POST /patients` - Create new patient
- `GET /patients/{id}` - Get patient details
- `PATCH /patients/{id}` - Update patient
- `DELETE /patients/{id}` - Delete patient

### Visit Management
- `GET /visits` - List visits
- `POST /visits` - Create new visit
- `GET /visits/{id}` - Get visit details
- `PATCH /visits/{id}` - Update visit
- `DELETE /visits/{id}` - Delete visit

### Nurse Forms
- `GET /nurse_forms` - List nurse forms
- `POST /nurse_forms` - Create nurse form
- `GET /nurse_forms/{id}` - Get nurse form
- `PATCH /nurse_forms/{id}` - Update nurse form
- `DELETE /nurse_forms/{id}` - Delete nurse form

### Doctor Forms
- `GET /doctor_forms` - List doctor forms
- `POST /doctor_forms` - Create doctor form
- `GET /doctor_forms/{id}` - Get doctor form
- `PATCH /doctor_forms/{id}` - Update doctor form
- `DELETE /doctor_forms/{id}` - Delete doctor form

### System Monitoring
- `GET /health` - System health check
- `GET /error_logs` - Error log entries
- `POST /error_logs` - Log new error
- `GET /websocket_connections` - WebSocket status

---

## Security & Authentication

### JWT Token Structure
```json
{
  "user_id": "uuid",
  "role": "nurse|doctor|admin",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1640995200,
  "iat": 1640995200
}
```

### Role-Based Access Control

#### Nurse Role
- Create and manage patients
- Create and edit own nurse forms
- View assigned visits
- Cannot access admin functions

#### Doctor Role
- View nurse assessments
- Create and edit own doctor forms
- Review and sign cases
- Cannot create patients or visits

#### Admin Role
- Full system access
- User management
- System monitoring
- All CRUD operations

### Row Level Security Policies
All database tables implement RLS policies that enforce:
- Users can only access data they're authorized for
- Forms can only be edited by their creators
- Signed forms become read-only
- Admins have override access

---

## Development & Deployment

### Development Setup
1. **Clone repository**
2. **Start services**: `docker-compose up -d`
3. **Access application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

### Development Credentials
- **Nurse**: nurse@example.com / nurse
- **Doctor**: doctor@example.com / doctor
- **Admin**: admin@example.com / admin

### Production Deployment
1. **Update environment variables**
2. **Use production Docker compose**: `docker-compose -f docker-compose.prod.yml up -d`
3. **Configure SSL certificates**
4. **Set up monitoring and backups**

### Environment Variables
```bash
# Database
POSTGRES_DB=alshorouk_radiology
POSTGRES_USER=radiology_app
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your-256-bit-secret-key

# Frontend
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000/ws
```

---

## Troubleshooting

### Common Issues

#### 1. Frontend Not Accessible (403 Forbidden)
**Cause**: Nginx permission issues
**Solution**:
```bash
docker exec alshorouk-nginx chown -R nginx:nginx /usr/share/nginx/html
docker restart alshorouk-nginx
```

#### 2. TypeScript Compilation Errors
**Cause**: Duplicate function implementations or missing types
**Solution**:
- Check for duplicate method names
- Add proper TypeScript types
- Restart frontend container

#### 3. Database Connection Issues
**Cause**: Database not ready or connection string incorrect
**Solution**:
- Check database container status
- Verify connection parameters
- Check database logs

#### 4. JWT Token Issues
**Cause**: Invalid JWT secret or expired tokens
**Solution**:
- Verify JWT_SECRET configuration
- Check token expiration
- Clear browser storage

### Monitoring Tools

#### Error Log Viewer
Access comprehensive error logging at `/admin` (admin role required):
- Filter by error type, severity, date
- View error details and stack traces
- Track error resolution status

#### Health Monitor Dashboard
Monitor system health and API endpoints:
- Real-time status indicators
- Response time metrics
- Error rate tracking

#### WebSocket Status
Monitor real-time communication:
- Connection status
- Message history
- Connection statistics

### Log Locations
- **Frontend logs**: Browser console and ErrorLogViewer component
- **Backend logs**: PostgREST logs via `docker logs alshorouk-api`
- **Database logs**: PostgreSQL logs via `docker logs alshorouk-db`
- **Nginx logs**: Access/error logs via `docker logs alshorouk-nginx`

---

## Conclusion

This documentation provides comprehensive coverage of the Al-Shorouk Radiology Management System. The system is designed with healthcare workflows in mind, providing robust form management, digital signatures, role-based access control, and comprehensive monitoring capabilities.

For additional support or questions, refer to the troubleshooting section or check the system logs through the monitoring interfaces.

**Last Updated**: September 2025
**Version**: 1.0.0