# Data Model: Al-Shorouk Radiology Management System

**Feature**: Al-Shorouk Radiology Management System
**Date**: 2025-09-24
**Status**: Phase 1 Complete

## Entity Relationships

```
Users (nurse, doctor, admin)
    ↓ creates/manages
Patients
    ↓ has
Visits
    ↓ contains
NurseForms → DoctorForms
    ↓ includes
DigitalSignatures
```

## Core Entities

### Users
**Purpose**: System users with role-based authentication and access control

**Fields**:
- `id` (UUID, primary key)
- `username` (VARCHAR, unique, required)
- `email` (VARCHAR, unique, required)
- `password_hash` (VARCHAR, required, bcrypt)
- `role` (ENUM: 'nurse', 'doctor', 'admin', required)
- `full_name` (VARCHAR, required)
- `is_active` (BOOLEAN, default: true)
- `created_at` (TIMESTAMP, default: NOW())
- `updated_at` (TIMESTAMP, default: NOW())
- `last_login` (TIMESTAMP, nullable)

**Relationships**:
- Has many Visits (as nurse: created_visits)
- Has many Visits (as doctor: assigned_visits)
- Has many NurseForms (created_forms)
- Has many DoctorForms (created_forms)
- Has many DigitalSignatures

**Constraints**:
- Unique username and email
- Password minimum 8 characters with complexity requirements
- Role validation on update

### Patients
**Purpose**: Patient demographic information and medical history

**Fields**:
- `id` (UUID, primary key)
- `full_name` (VARCHAR, required)
- `national_id` (VARCHAR, unique, required)
- `medical_number` (VARCHAR, unique, required)
- `date_of_birth` (DATE, required)
- `gender` (ENUM: 'male', 'female', 'other', required)
- `mobile_number` (VARCHAR, required)
- `address` (TEXT, nullable)
- `emergency_contact` (JSON, nullable)
- `created_at` (TIMESTAMP, default: NOW())
- `updated_at` (TIMESTAMP, default: NOW())

**Relationships**:
- Has many Visits

**Constraints**:
- Unique national_id and medical_number
- National ID format validation
- Mobile number format validation
- Date of birth validation (not in future)

### Visits
**Purpose**: Tracks patient visits and workflow state

**Fields**:
- `id` (UUID, primary key)
- `patient_id` (UUID, foreign key: patients.id, required)
- `nurse_id` (UUID, foreign key: users.id, required)
- `doctor_id` (UUID, foreign key: users.id, nullable)
- `status` (ENUM: 'draft', 'in_progress', 'nurse_signed', 'doctor_signed', 'completed', required)
- `visit_date` (TIMESTAMP, default: NOW())
- `arrival_mode` (VARCHAR, nullable)
- `chief_complaint` (TEXT, nullable)
- `created_at` (TIMESTAMP, default: NOW())
- `updated_at` (TIMESTAMP, default: NOW())

**Relationships**:
- Belongs to Patient
- Belongs to User (as nurse)
- Belongs to User (as doctor)
- Has one NurseForm
- Has one DoctorForm

**Constraints**:
- Valid patient_id, nurse_id, doctor_id references
- Status transition validation
- nurse_id must have role 'nurse'
- doctor_id must have role 'doctor'

### NurseForms
**Purpose**: Comprehensive nursing assessment forms

**Fields**:
- `id` (UUID, primary key)
- `visit_id` (UUID, foreign key: visits.id, unique, required)
- `nurse_id` (UUID, foreign key: users.id, required)
- `status` (ENUM: 'draft', 'signed', required)
- `created_at` (TIMESTAMP, default: NOW())
- `updated_at` (TIMESTAMP, default: NOW())
- `signed_at` (TIMESTAMP, nullable)

**Assessment Data (JSON)**:
```json
{
  "basic_info": {
    "arrival_mode": "string",
    "chief_complaint": "string"
  },
  "vital_signs": {
    "temperature": "decimal",
    "pulse": "integer",
    "blood_pressure_systolic": "integer",
    "blood_pressure_diastolic": "integer",
    "respiratory_rate": "integer",
    "o2_saturation": "integer"
  },
  "psychosocial_assessment": {
    "anxiety_level": "integer",
    "coping_mechanisms": "string",
    "support_system": "string"
  },
  "nutritional_screening": {
    "appetite": "string",
    "dietary_restrictions": "string",
    "hydration_status": "string"
  },
  "functional_assessment": {
    "mobility": "string",
    "adl_assistance": "string",
    "fall_risk_factors": "array"
  },
  "pain_assessment": {
    "pain_level": "integer",
    "pain_location": "string",
    "pain_character": "string",
    "pain_duration": "string"
  },
  "morse_fall_scale": {
    "history_of_falling": "boolean",
    "secondary_diagnosis": "boolean",
    "ambulatory_aid": "boolean",
    "iv_heparin_lock": "boolean",
    "gait_transfer": "boolean",
    "mental_status": "boolean",
    "total_score": "integer"
  }
}
```

**Relationships**:
- Belongs to Visit
- Belongs to User (as nurse)
- Has one DigitalSignature (nurse signature)

**Constraints**:
- Valid visit_id and nurse_id references
- visit_id must be unique (one nurse form per visit)
- nurse_id must have role 'nurse'
- JSON schema validation for assessment data
- Morse Fall Scale score validation (0-125)

### DoctorForms
**Purpose**: Radiology-specific evaluation forms

**Fields**:
- `id` (UUID, primary key)
- `visit_id` (UUID, foreign key: visits.id, unique, required)
- `doctor_id` (UUID, foreign key: users.id, required)
- `status` (ENUM: 'draft', 'signed', required)
- `created_at` (TIMESTAMP, default: NOW())
- `updated_at` (TIMESTAMP, default: NOW())
- `signed_at` (TIMESTAMP, nullable)

**Evaluation Data (JSON)**:
```json
{
  "patient_information": {
    "age": "integer",
    "weight": "decimal",
    "height": "decimal",
    "allergies": "string"
  },
  "study_indication": {
    "primary_indication": "string",
    "clinical_history": "string",
    "relevant_findings": "string"
  },
  "contraindications": {
    "pregnancy_status": "string",
    "renal_function": "string",
    "contrast_allergies": "string",
    "other_contraindications": "string"
  },
  "technical_parameters": {
    "ctd1vol": "decimal",
    "dlp": "decimal",
    "kv": "integer",
    "mas": "integer",
    "scan_range": "string",
    "contrast_used": "boolean",
    "contrast_volume": "decimal"
  },
  "medical_history": {
    "previous_studies": "string",
    "relevant_conditions": "string",
    "medications": "string"
  },
  "imaging_findings": {
    "findings": "string",
    "impression": "string",
    "recommendations": "string"
  }
}
```

**Relationships**:
- Belongs to Visit
- Belongs to User (as doctor)
- Has one DigitalSignature (doctor signature)
- Has one DigitalSignature (patient signature)

**Constraints**:
- Valid visit_id and doctor_id references
- visit_id must be unique (one doctor form per visit)
- doctor_id must have role 'doctor'
- JSON schema validation for evaluation data
- Technical parameter validation (non-negative values)

### DigitalSignatures
**Purpose**: Secure digital signature capture with audit trail

**Fields**:
- `id` (UUID, primary key)
- `form_id` (UUID, required)
- `form_type` (ENUM: 'nurse_form', 'doctor_form_patient', 'doctor_form_doctor', required)
- `user_id` (UUID, foreign key: users.id, required)
- `signature_data` (TEXT, required) - Base64 encoded signature
- `ip_address` (INET, nullable)
- `user_agent` (TEXT, nullable)
- "signed_at" (TIMESTAMP, default: NOW())

**Relationships**:
- Belongs to User
- Polymorphic relationship to NurseForm or DoctorForm

**Constraints**:
- Valid user_id reference
- Base64 signature data validation
- Non-empty signature data
- Unique signature per form per user type

### AuditLogs
**Purpose**: Comprehensive audit trail for compliance

**Fields**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key: users.id, required)
- `action` (VARCHAR, required)
- `entity_type` (VARCHAR, required)
- `entity_id` (UUID, required)
- "old_values" (JSON, nullable)
- "new_values" (JSON, nullable)
- `ip_address` (INET, nullable)
- `user_agent` (TEXT, nullable)
- "created_at" (TIMESTAMP, default: NOW())

**Relationships**:
- Belongs to User

**Constraints**:
- Valid user_id reference
- Required action and entity type
- Timestamp validation

## Database Schema Design

### Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('nurse', 'doctor', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    medical_number VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    mobile_number VARCHAR(20) NOT NULL,
    address TEXT,
    emergency_contact JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Visits table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'nurse_signed', 'doctor_signed', 'completed')),
    visit_date TIMESTAMP DEFAULT NOW(),
    arrival_mode VARCHAR(50),
    chief_complaint TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Nurse forms table
CREATE TABLE nurse_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE UNIQUE,
    nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'signed')),
    assessment_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    signed_at TIMESTAMP
);

-- Doctor forms table
CREATE TABLE doctor_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE UNIQUE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'signed')),
    evaluation_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    signed_at TIMESTAMP
);

-- Digital signatures table
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL,
    form_type VARCHAR(20) NOT NULL
        CHECK (form_type IN ('nurse_form', 'doctor_form_patient', 'doctor_form_doctor')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(form_id, form_type, user_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_patients_medical_number ON patients(medical_number);
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_nurse_id ON visits(nurse_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_nurse_forms_visit_id ON nurse_forms(visit_id);
CREATE INDEX idx_nurse_forms_nurse_id ON nurse_forms(nurse_id);
CREATE INDEX idx_doctor_forms_visit_id ON doctor_forms(visit_id);
CREATE INDEX idx_doctor_forms_doctor_id ON doctor_forms(doctor_id);
CREATE INDEX idx_digital_signatures_form_id ON digital_signatures(form_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Triggers
```sql
-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_patients_timestamp
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_visits_timestamp
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_nurse_forms_timestamp
    BEFORE UPDATE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_doctor_forms_timestamp
    BEFORE UPDATE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Audit logging
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (
            COALESCE(NEW.updated_by, OLD.updated_by),
            'UPDATE',
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            jsonb_strip_nulls(row_to_json(OLD)),
            jsonb_strip_nulls(row_to_json(NEW))
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (
            COALESCE(NEW.created_by, NEW.updated_by),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_strip_nulls(row_to_json(NEW))
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
        VALUES (
            COALESCE(OLD.updated_by, OLD.created_by),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            jsonb_strip_nulls(row_to_json(OLD))
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_patients_changes
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_visits_changes
    AFTER INSERT OR UPDATE OR DELETE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_nurse_forms_changes
    AFTER INSERT OR UPDATE OR DELETE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_doctor_forms_changes
    AFTER INSERT OR UPDATE OR DELETE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_changes();
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY user_self_view ON users
    FOR SELECT USING (id = current_user_id());

-- Nurses can create and view patients
CREATE POLICY nurse_patient_access ON patients
    FOR ALL USING (current_user_role() = 'nurse' OR current_user_role() = 'admin');

-- Nurses can create and manage their visits
CREATE POLICY nurse_visit_access ON visits
    FOR ALL USING (
        current_user_role() = 'nurse' AND nurse_id = current_user_id()
        OR current_user_role() = 'admin'
    );

-- Doctors can view and manage assigned visits
CREATE POLICY doctor_visit_access ON visits
    FOR ALL USING (
        current_user_role() = 'doctor' AND doctor_id = current_user_id()
        OR current_user_role() = 'admin'
    );

-- Nurses can access their own forms
CREATE POLICY nurse_form_access ON nurse_forms
    FOR ALL USING (
        current_user_role() = 'nurse' AND nurse_id = current_user_id()
        OR current_user_role() = 'admin'
    );

-- Doctors can access their own forms
CREATE POLICY doctor_form_access ON doctor_forms
    FOR ALL USING (
        current_user_role() = 'doctor' AND doctor_id = current_user_id()
        OR current_user_role() = 'admin'
    );

-- Users can access their own signatures
CREATE POLICY signature_access ON digital_signatures
    FOR ALL USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- Admins can access all audit logs
CREATE POLICY audit_log_access ON audit_logs
    FOR SELECT USING (current_user_role() = 'admin');
```

## Data Validation Rules

### User Validation
- Password must be at least 8 characters with uppercase, lowercase, number, and special character
- Email must be valid format
- Username must be 3-50 characters, alphanumeric with underscores
- Role must be one of: nurse, doctor, admin

### Patient Validation
- National ID must be valid format (country-specific)
- Medical number must be unique and follow hospital format
- Date of birth must be valid date not in the future
- Mobile number must be valid international format

### Form Validation
- Nurse form assessment data must follow JSON schema
- Morse Fall Scale score must be 0-125
- Doctor form technical parameters must be non-negative
- Signature data must be valid base64 and non-empty

### Business Logic Validation
- Visit status transitions are enforced
- Nurse forms cannot be modified after signing
- Doctor forms cannot be modified after signing
- Digital signatures are immutable once created
- Audit logs cannot be modified

## Migration Strategy

### Initial Migration
1. Create tables with basic structure
2. Add indexes for performance
3. Implement triggers for timestamps and audit logging
4. Enable RLS and create policies
5. Add check constraints for data validation

### Data Migration
1. Export existing patient data if applicable
2. Transform data to new schema format
3. Import with validation
4. Verify data integrity
5. Create backup before migration

### Rollback Strategy
1. Database backups before each migration
2. Rollback scripts for each migration
3. Data validation after rollback
4. Minimal downtime during migration

## Performance Considerations

### Query Optimization
- Indexes on frequently queried columns
- Database connection pooling
- Query optimization for large datasets
- Pagination for large result sets

### Caching Strategy
- Redis for session data
- Application-level caching for frequent queries
- Database query caching
- Static asset caching

### Scaling Considerations
- Database read replicas for reporting
- Horizontal scaling for application servers
- Load balancing for high availability
- Database sharding for large datasets