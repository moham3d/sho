-- Al-Shorouk Radiology Management System Database Schema
-- Version: 1.0.0
-- Date: 2025-09-24

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create functions for UUID generation and user context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true);
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create roles for database access
CREATE ROLE web_anon NOLOGIN;
CREATE ROLE nurse_user NOLOGIN;
CREATE ROLE doctor_user NOLOGIN;
CREATE ROLE admin_user NOLOGIN;

-- Grant permissions to roles
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT USAGE ON SCHEMA public TO nurse_user;
GRANT USAGE ON SCHEMA public TO doctor_user;
GRANT USAGE ON SCHEMA public TO admin_user;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'nurse_signed', 'doctor_signed', 'completed')),
    visit_date TIMESTAMP DEFAULT NOW(),
    arrival_mode VARCHAR(50),
    chief_complaint TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints for role validation
    CONSTRAINT valid_nurse_role CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = nurse_id AND users.role = 'nurse')
    ),
    CONSTRAINT valid_doctor_role CHECK (
        doctor_id IS NULL OR
        EXISTS (SELECT 1 FROM users WHERE users.id = doctor_id AND users.role = 'doctor')
    )
);

-- Nurse forms table
CREATE TABLE nurse_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL UNIQUE REFERENCES visits(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'signed')),
    assessment_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    signed_at TIMESTAMP,

    -- Constraint for role validation
    CONSTRAINT valid_nurse_role CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = nurse_id AND users.role = 'nurse')
    ),

    -- JSON schema validation for assessment data
    CONSTRAINT valid_assessment_data CHECK (
        assessment_data ? 'basic_info' AND
        assessment_data ? 'vital_signs' AND
        assessment_data ? 'psychosocial_assessment' AND
        assessment_data ? 'nutritional_screening' AND
        assessment_data ? 'functional_assessment' AND
        assessment_data ? 'pain_assessment' AND
        assessment_data ? 'morse_fall_scale'
    )
);

-- Doctor forms table
CREATE TABLE doctor_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL UNIQUE REFERENCES visits(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'signed')),
    evaluation_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    signed_at TIMESTAMP,

    -- Constraint for role validation
    CONSTRAINT valid_doctor_role CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = doctor_id AND users.role = 'doctor')
    ),

    -- JSON schema validation for evaluation data
    CONSTRAINT valid_evaluation_data CHECK (
        evaluation_data ? 'patient_information' AND
        evaluation_data ? 'study_indication' AND
        evaluation_data ? 'contraindications' AND
        evaluation_data ? 'technical_parameters' AND
        evaluation_data ? 'medical_history' AND
        evaluation_data ? 'imaging_findings'
    )
);

-- Digital signatures table
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL,
    form_type VARCHAR(20) NOT NULL
        CHECK (form_type IN ('nurse_form', 'doctor_form_patient', 'doctor_form_doctor')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique signature per form per user type
    UNIQUE(form_id, form_type, user_id),

    -- Validate signature data format
    CONSTRAINT valid_signature_data CHECK (
        signature_data LIKE 'data:image/%;base64,%' AND
        LENGTH(signature_data) > 50
    )
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES
('admin', 'admin@alshorouk.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZP6', 'admin', 'System Administrator');

-- Grant table permissions to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO admin_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO nurse_user, admin_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON visits TO nurse_user, doctor_user, admin_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON nurse_forms TO nurse_user, admin_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON doctor_forms TO doctor_user, admin_user;
GRANT SELECT, INSERT ON digital_signatures TO nurse_user, doctor_user, admin_user;
GRANT SELECT ON audit_logs TO admin_user;

-- Grant read-only access to web_anon role for public endpoints
GRANT SELECT ON users TO web_anon;

-- Create sequence IDs for display purposes
CREATE SEQUENCE patient_seq START 1 INCREMENT 1;
CREATE SEQUENCE visit_seq START 1 INCREMENT 1;

-- Create function to generate readable IDs
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'PAT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
           LPAD(nextval('patient_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_visit_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'VIS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
           LPAD(nextval('visit_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE users IS 'System users with role-based authentication';
COMMENT ON TABLE patients IS 'Patient demographic information and medical history';
COMMENT ON TABLE visits IS 'Patient visits and workflow state tracking';
COMMENT ON TABLE nurse_forms IS 'Comprehensive nursing assessment forms';
COMMENT ON TABLE doctor_forms IS 'Radiology-specific evaluation forms';
COMMENT ON TABLE digital_signatures IS 'Digital signature capture with audit trail';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';

-- Create view for active users
CREATE VIEW active_users AS
SELECT id, username, email, role, full_name, last_login
FROM users
WHERE is_active = true
ORDER BY full_name;

-- Create view for patient visits summary
CREATE VIEW patient_visits_summary AS
SELECT
    p.id as patient_id,
    p.full_name as patient_name,
    p.national_id,
    v.id as visit_id,
    v.visit_date,
    v.status,
    v.arrival_mode,
    v.chief_complaint,
    u_nurse.full_name as nurse_name,
    u_doctor.full_name as doctor_name
FROM patients p
LEFT JOIN visits v ON p.id = v.patient_id
LEFT JOIN users u_nurse ON v.nurse_id = u_nurse.id
LEFT JOIN users u_doctor ON v.doctor_id = u_doctor.id
ORDER BY v.visit_date DESC;

-- Set default permissions for views
GRANT SELECT ON active_users TO web_anon, nurse_user, doctor_user, admin_user;
GRANT SELECT ON patient_visits_summary TO nurse_user, doctor_user, admin_user;

-- Schema creation complete
SELECT 'Database schema created successfully' as status;