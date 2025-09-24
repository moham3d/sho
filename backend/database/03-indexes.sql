-- Database Indexes and Performance Optimization
-- Al-Shorouk Radiology Management System
-- Version: 1.0.0
-- Date: 2025-09-24

-- Performance indexes for frequently queried columns

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Patients table indexes
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_national_id ON patients(national_id);
CREATE INDEX idx_patients_medical_number ON patients(medical_number);
CREATE INDEX idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX idx_patients_gender ON patients(gender);
CREATE INDEX idx_patients_mobile ON patients(mobile_number);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Visits table indexes
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_nurse_id ON visits(nurse_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_arrival_mode ON visits(arrival_mode);

-- Composite indexes for common query patterns
CREATE INDEX idx_visits_patient_status ON visits(patient_id, status);
CREATE INDEX idx_visits_nurse_status ON visits(nurse_id, status);
CREATE INDEX idx_visits_doctor_status ON visits(doctor_id, status);
CREATE INDEX idx_visits_date_status ON visits(visit_date, status);
CREATE INDEX idx_visits_patient_date ON visits(patient_id, visit_date);

-- Nurse forms table indexes
CREATE INDEX idx_nurse_forms_visit_id ON nurse_forms(visit_id);
CREATE INDEX idx_nurse_forms_nurse_id ON nurse_forms(nurse_id);
CREATE INDEX idx_nurse_forms_status ON nurse_forms(status);
CREATE INDEX idx_nurse_forms_created_at ON nurse_forms(created_at);
CREATE INDEX idx_nurse_forms_signed_at ON nurse_forms(signed_at);

-- JSON indexes for searching within assessment data
CREATE INDEX idx_nurse_forms_vital_signs ON nurse_forms USING GIN (assessment_data->'vital_signs');
CREATE INDEX idx_nurse_forms_morse_score ON nurse_forms ((assessment_data->'morse_fall_scale'->>'total_score')::integer);
CREATE INDEX idx_nurse_forms_pain_level ON nurse_forms ((assessment_data->'pain_assessment'->>'pain_level')::integer);

-- Doctor forms table indexes
CREATE INDEX idx_doctor_forms_visit_id ON doctor_forms(visit_id);
CREATE INDEX idx_doctor_forms_doctor_id ON doctor_forms(doctor_id);
CREATE INDEX idx_doctor_forms_status ON doctor_forms(status);
CREATE INDEX idx_doctor_forms_created_at ON doctor_forms(created_at);
CREATE INDEX idx_doctor_forms_signed_at ON doctor_forms(signed_at);

-- JSON indexes for searching within evaluation data
CREATE INDEX idx_doctor_forms_ctd1vol ON doctor_forms ((evaluation_data->'technical_parameters'->>'ctd1vol')::decimal);
CREATE INDEX idx_doctor_forms_dlp ON doctor_forms ((evaluation_data->'technical_parameters'->>'dlp')::decimal);
CREATE INDEX idx_doctor_forms_contrast_used ON doctor_forms ((evaluation_data->'technical_parameters'->>'contrast_used')::boolean);

-- Digital signatures table indexes
CREATE INDEX idx_digital_signatures_form_id ON digital_signatures(form_id);
CREATE INDEX idx_digital_signatures_user_id ON digital_signatures(user_id);
CREATE INDEX idx_digital_signatures_form_type ON digital_signatures(form_type);
CREATE INDEX idx_digital_signatures_signed_at ON digital_signatures(signed_at);
CREATE INDEX idx_digital_signatures_form_user ON digital_signatures(form_id, form_type, user_id);

-- Audit logs table indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);

-- Composite indexes for audit log queries
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_entity_created ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at);

-- Timestamp update triggers for all tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables with updated_at column
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

-- Function to automatically set signed_at timestamp
CREATE OR REPLACE FUNCTION set_signed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'signed' AND OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.signed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply signed_at triggers to forms
CREATE TRIGGER set_nurse_form_signed_at
    BEFORE UPDATE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION set_signed_at();

CREATE TRIGGER set_doctor_form_signed_at
    BEFORE UPDATE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION set_signed_at();

-- Create function to maintain data integrity
CREATE OR REPLACE FUNCTION maintain_data_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure visit status is updated when forms are signed
    IF TG_TABLE_NAME = 'nurse_forms' AND NEW.status = 'signed' AND OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE visits SET status = 'nurse_signed' WHERE id = NEW.visit_id;
    END IF;

    IF TG_TABLE_NAME = 'doctor_forms' AND NEW.status = 'signed' AND OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE visits SET status = 'doctor_signed' WHERE id = NEW.visit_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply data integrity triggers
CREATE TRIGGER maintain_visit_status_nurse
    AFTER UPDATE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION maintain_data_integrity();

CREATE TRIGGER maintain_visit_status_doctor
    AFTER UPDATE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION maintain_data_integrity();

-- Create function to validate JSON schema data
CREATE OR REPLACE FUNCTION validate_nurse_form_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate Morse Fall Scale score range
    IF NEW.assessment_data->'morse_fall_scale'->>'total_score' IS NOT NULL THEN
        IF (NEW.assessment_data->'morse_fall_scale'->>'total_score')::integer < 0 OR
           (NEW.assessment_data->'morse_fall_scale'->>'total_score')::integer > 125 THEN
            RAISE EXCEPTION 'Morse Fall Scale score must be between 0 and 125';
        END IF;
    END IF;

    -- Validate pain level range
    IF NEW.assessment_data->'pain_assessment'->>'pain_level' IS NOT NULL THEN
        IF (NEW.assessment_data->'pain_assessment'->>'pain_level')::integer < 0 OR
           (NEW.assessment_data->'pain_assessment'->>'pain_level')::integer > 10 THEN
            RAISE EXCEPTION 'Pain level must be between 0 and 10';
        END IF;
    END IF;

    -- Validate vital signs ranges
    IF NEW.assessment_data->'vital_signs'->>'temperature' IS NOT NULL THEN
        IF (NEW.assessment_data->'vital_signs'->>'temperature')::decimal < 35.0 OR
           (NEW.assessment_data->'vital_signs'->>'temperature')::decimal > 42.0 THEN
            RAISE EXCEPTION 'Temperature must be between 35.0 and 42.0°C';
        END IF;
    END IF;

    IF NEW.assessment_data->'vital_signs'->>'pulse' IS NOT NULL THEN
        IF (NEW.assessment_data->'vital_signs'->>'pulse')::integer < 30 OR
           (NEW.assessment_data->'vital_signs'->>'pulse')::integer > 200 THEN
            RAISE EXCEPTION 'Pulse must be between 30 and 200 bpm';
        END IF;
    END IF;

    IF NEW.assessment_data->'vital_signs'->>'o2_saturation' IS NOT NULL THEN
        IF (NEW.assessment_data->'vital_signs'->>'o2_saturation')::integer < 70 OR
           (NEW.assessment_data->'vital_signs'->>'o2_saturation')::integer > 100 THEN
            RAISE EXCEPTION 'O2 saturation must be between 70 and 100%';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_doctor_form_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate technical parameters
    IF NEW.evaluation_data->'technical_parameters'->>'ctd1vol' IS NOT NULL THEN
        IF (NEW.evaluation_data->'technical_parameters'->>'ctd1vol')::decimal < 0 THEN
            RAISE EXCEPTION 'CTD1vol must be non-negative';
        END IF;
    END IF;

    IF NEW.evaluation_data->'technical_parameters'->>'dlp' IS NOT NULL THEN
        IF (NEW.evaluation_data->'technical_parameters'->>'dlp')::decimal < 0 THEN
            RAISE EXCEPTION 'DLP must be non-negative';
        END IF;
    END IF;

    IF NEW.evaluation_data->'technical_parameters'->>'kv' IS NOT NULL THEN
        IF (NEW.evaluation_data->'technical_parameters'->>'kv')::integer < 0 THEN
            RAISE EXCEPTION 'kV must be non-negative';
        END IF;
    END IF;

    IF NEW.evaluation_data->'technical_parameters'->>'mas' IS NOT NULL THEN
        IF (NEW.evaluation_data->'technical_parameters'->>'mas')::integer < 0 THEN
            RAISE EXCEPTION 'mAs must be non-negative';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
CREATE TRIGGER validate_nurse_form_data
    BEFORE INSERT OR UPDATE ON nurse_forms
    FOR EACH ROW
    EXECUTE FUNCTION validate_nurse_form_data();

CREATE TRIGGER validate_doctor_form_data
    BEFORE INSERT OR UPDATE ON doctor_forms
    FOR EACH ROW
    EXECUTE FUNCTION validate_doctor_form_data();

-- Create performance views for common queries
CREATE VIEW active_patients_view AS
SELECT DISTINCT
    p.id,
    p.full_name,
    p.national_id,
    p.medical_number,
    p.date_of_birth,
    p.gender,
    p.mobile_number,
    MAX(v.visit_date) as last_visit_date,
    COUNT(v.id) as total_visits
FROM patients p
JOIN visits v ON p.id = v.patient_id
WHERE v.status IN ('in_progress', 'nurse_signed', 'doctor_signed')
GROUP BY p.id, p.full_name, p.national_id, p.medical_number, p.date_of_birth, p.gender, p.mobile_number
ORDER BY last_visit_date DESC;

CREATE VIEW nurse_dashboard_view AS
SELECT
    v.id as visit_id,
    p.full_name as patient_name,
    p.national_id,
    v.visit_date,
    v.status,
    v.arrival_mode,
    v.chief_complaint,
    nf.status as nurse_form_status,
    nf.created_at as form_created_at
FROM visits v
JOIN patients p ON v.patient_id = p.id
LEFT JOIN nurse_forms nf ON v.id = nf.visit_id
WHERE v.nurse_id = current_user_id()
    AND v.status IN ('draft', 'in_progress')
ORDER BY v.visit_date DESC;

CREATE VIEW doctor_dashboard_view AS
SELECT
    v.id as visit_id,
    p.full_name as patient_name,
    p.national_id,
    v.visit_date,
    v.status,
    v.arrival_mode,
    v.chief_complaint,
    u_nurse.full_name as nurse_name,
    nf.status as nurse_form_status,
    df.status as doctor_form_status,
    nf.created_at as nurse_form_created_at
FROM visits v
JOIN patients p ON v.patient_id = p.id
LEFT JOIN users u_nurse ON v.nurse_id = u_nurse.id
LEFT JOIN nurse_forms nf ON v.id = nf.visit_id
LEFT JOIN doctor_forms df ON v.id = df.visit_id
WHERE v.doctor_id = current_user_id()
    AND v.status IN ('nurse_signed', 'doctor_signed')
ORDER BY v.visit_date DESC;

-- Grant permissions on views
GRANT SELECT ON active_patients_view TO nurse_user, doctor_user, admin_user;
GRANT SELECT ON nurse_dashboard_view TO nurse_user, admin_user;
GRANT SELECT ON doctor_dashboard_view TO doctor_user, admin_user;

-- Create indexes for view optimization
CREATE INDEX idx_active_patients_name ON active_patients_view(full_name);
CREATE INDEX idx_active_patients_national_id ON active_patients_view(national_id);
CREATE INDEX idx_nurse_dashboard_visit ON nurse_dashboard_view(visit_id);
CREATE INDEX idx_doctor_dashboard_visit ON doctor_dashboard_view(visit_id);

-- Performance optimization complete
SELECT 'Database indexes and performance optimization completed successfully' as status;