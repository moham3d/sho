-- ===================================================================
-- Patient Visit Management System - PostgreSQL Database Schema
-- ===================================================================
-- REVISED: Single table per form design - each PDF form has one mirrored table
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Patients table (SSN as primary identifier)
CREATE TABLE patients (
    ssn VARCHAR(20) PRIMARY KEY, -- Social Security Number as primary key
    mobile_number VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20), -- Additional phone number (landline, work, etc.)
    medical_number VARCHAR(50) UNIQUE, -- Hospital/Medical record number if exists
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT, -- Patient address
    emergency_contact_name VARCHAR(255), -- Emergency contact information
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50), -- Relationship to patient
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- Reference to user who created the record
    is_active BOOLEAN DEFAULT TRUE
);

-- User management for nurses and physicians
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('nurse', 'physician', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Patient visits
CREATE TABLE patient_visits (
    visit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_ssn VARCHAR(20) NOT NULL REFERENCES patients(ssn) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    visit_status VARCHAR(20) DEFAULT 'open' CHECK (visit_status IN ('open', 'in_progress', 'completed', 'cancelled')),
    primary_diagnosis TEXT, -- التشخيص الأساسي
    secondary_diagnosis TEXT, -- التشخيص الثانوي
    diagnosis_code VARCHAR(20), -- ICD-10 or other coding system
    visit_type VARCHAR(30) DEFAULT 'outpatient' CHECK (visit_type IN ('outpatient', 'inpatient', 'emergency', 'consultation')),
    department VARCHAR(100), -- Department/Unit
    created_by UUID NOT NULL REFERENCES users(user_id), -- Nurse who created the visit
    assigned_physician UUID REFERENCES users(user_id), -- Physician assigned to the visit
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- FORM DEFINITIONS AND DATA STORAGE
-- ===================================================================

-- Form definitions (SH.MR.FRM.05, SH.MR.FRM.04, etc.)
CREATE TABLE form_definitions (
    form_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'SH.MR.FRM.05'
    form_name VARCHAR(255) NOT NULL,
    form_version VARCHAR(10) NOT NULL,
    form_description TEXT,
    form_role VARCHAR(20) NOT NULL CHECK (form_role IN ('nurse', 'physician', 'both')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions for each visit
CREATE TABLE form_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES patient_visits(visit_id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES form_definitions(form_id),
    submitted_by UUID NOT NULL REFERENCES users(user_id),
    submission_status VARCHAR(20) DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(visit_id, form_id) -- One submission per form per visit
);

-- ===================================================================
-- NURSING ASSESSMENT FORM (SH.MR.FRM.05) - SINGLE TABLE DESIGN
-- ===================================================================
-- Complete nursing assessment form - all fields in one table
CREATE TABLE nursing_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(submission_id) ON DELETE CASCADE,

    -- Basic assessment info
    mode_of_arrival VARCHAR(20), -- Mode of arrival
    arrival_other_desc TEXT, -- Other arrival description
    age INTEGER CHECK (age >= 0 AND age <= 150),
    chief_complaint TEXT, -- Chief complaint
    accompanied_by VARCHAR(20), -- Accompanied by
    language_spoken VARCHAR(20) DEFAULT 'arabic', -- Language spoken
    language_other_desc TEXT, -- Other language description

    -- Vital signs
    temperature_celsius DECIMAL(4,2) CHECK (temperature_celsius >= 30.0 AND temperature_celsius <= 45.0),
    pulse_bpm INTEGER CHECK (pulse_bpm >= 30 AND pulse_bpm <= 200),
    blood_pressure_systolic INTEGER CHECK (blood_pressure_systolic >= 70 AND blood_pressure_systolic <= 250),
    blood_pressure_diastolic INTEGER CHECK (blood_pressure_diastolic >= 40 AND blood_pressure_diastolic <= 150),
    respiratory_rate_per_min INTEGER CHECK (respiratory_rate_per_min >= 8 AND respiratory_rate_per_min <= 60),
    oxygen_saturation_percent DECIMAL(5,2) CHECK (oxygen_saturation_percent >= 70.0 AND oxygen_saturation_percent <= 100.0),
    blood_sugar_mg_dl INTEGER CHECK (blood_sugar_mg_dl >= 0),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
    height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm <= 300),

    -- General assessment
    general_condition VARCHAR(100),
    consciousness_level VARCHAR(50),
    skin_condition TEXT,
    mobility_status VARCHAR(100),

    -- Psychosocial history
    psychological_problem VARCHAR(50) CHECK (psychological_problem IN ('none', 'depressed', 'agitated', 'anxious', 'isolated', 'confused', 'other')),
    psychological_other_desc TEXT,
    is_smoker BOOLEAN DEFAULT FALSE,
    has_allergies BOOLEAN DEFAULT FALSE,
    medication_allergies TEXT,
    food_allergies TEXT,
    other_allergies TEXT,

    -- Nutritional screening
    diet_type VARCHAR(20) DEFAULT 'regular' CHECK (diet_type IN ('regular', 'special')),
    special_diet_desc TEXT,
    appetite VARCHAR(20) CHECK (appetite IN ('good', 'poor')),
    has_git_problems BOOLEAN DEFAULT FALSE,
    git_problems_desc TEXT,
    has_weight_loss BOOLEAN DEFAULT FALSE,
    has_weight_gain BOOLEAN DEFAULT FALSE,
    refer_to_nutritionist BOOLEAN DEFAULT FALSE,

    -- Functional assessment
    feeding_status VARCHAR(20) CHECK (feeding_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    hygiene_status VARCHAR(20) CHECK (hygiene_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    toileting_status VARCHAR(20) CHECK (toileting_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    ambulation_status VARCHAR(20) CHECK (ambulation_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    has_musculoskeletal_problems BOOLEAN DEFAULT FALSE,
    has_deformities BOOLEAN DEFAULT FALSE,
    has_contractures BOOLEAN DEFAULT FALSE,
    is_amputee BOOLEAN DEFAULT FALSE,
    is_bedridden BOOLEAN DEFAULT FALSE,
    has_musculoskeletal_pain BOOLEAN DEFAULT FALSE,
    uses_walker BOOLEAN DEFAULT FALSE,
    uses_wheelchair BOOLEAN DEFAULT FALSE,
    uses_transfer_device BOOLEAN DEFAULT FALSE,
    uses_raised_toilet_seat BOOLEAN DEFAULT FALSE,
    uses_other_equipment BOOLEAN DEFAULT FALSE,
    other_equipment_desc TEXT,

    -- Pain assessment
    pain_intensity INTEGER CHECK (pain_intensity BETWEEN 0 AND 10),
    pain_location TEXT,
    pain_frequency TEXT,
    pain_duration TEXT,
    pain_character TEXT,
    action_taken TEXT,

    -- Fall risk assessment (Morse Scale)
    fall_history_3months BOOLEAN DEFAULT FALSE,
    secondary_diagnosis BOOLEAN DEFAULT FALSE,
    ambulatory_aid VARCHAR(30) CHECK (ambulatory_aid IN ('none', 'bed_rest_chair', 'crutches_walker', 'furniture')),
    iv_therapy BOOLEAN DEFAULT FALSE,
    gait_status VARCHAR(20) CHECK (gait_status IN ('normal', 'weak', 'impaired')),
    mental_status VARCHAR(20) CHECK (mental_status IN ('oriented', 'forgets_limitations', 'unaware')),
    morse_total_score INTEGER,

    -- Pediatric fall risk (Humpty Dumpty Scale)
    age_score INTEGER,
    gender_score INTEGER,
    diagnosis_score INTEGER,
    cognitive_score INTEGER,
    environmental_score INTEGER,
    surgery_anesthesia_score INTEGER,
    medication_score INTEGER,
    humpty_total_score INTEGER,

    -- Educational needs
    needs_medication_education BOOLEAN DEFAULT FALSE,
    needs_diet_nutrition_education BOOLEAN DEFAULT FALSE,
    needs_medical_equipment_education BOOLEAN DEFAULT FALSE,
    needs_rehabilitation_education BOOLEAN DEFAULT FALSE,
    needs_drug_interaction_education BOOLEAN DEFAULT FALSE,
    needs_pain_symptom_education BOOLEAN DEFAULT FALSE,
    needs_fall_prevention_education BOOLEAN DEFAULT FALSE,
    other_needs BOOLEAN DEFAULT FALSE,
    other_needs_desc TEXT,

    -- Elderly assessment
    daily_activities VARCHAR(30) CHECK (daily_activities IN ('independent', 'needs_help', 'dependent')),
    cognitive_assessment VARCHAR(30) CHECK (cognitive_assessment IN ('normal', 'mild_delirium', 'moderate_delirium', 'severe_delirium')),
    mood_assessment VARCHAR(20) CHECK (mood_assessment IN ('depressed', 'not_depressed')),
    speech_disorder BOOLEAN DEFAULT FALSE,
    hearing_disorder BOOLEAN DEFAULT FALSE,
    vision_disorder BOOLEAN DEFAULT FALSE,
    sleep_disorder BOOLEAN DEFAULT FALSE,

    -- Disabled patients assessment
    disability_type VARCHAR(20) CHECK (disability_type IN ('hearing', 'visual', 'mobility', 'other')),
    disability_other_desc TEXT,
    has_assistive_devices BOOLEAN DEFAULT FALSE,
    assistive_devices_desc TEXT,

    -- Abuse and neglect screening
    has_signs_of_abuse BOOLEAN DEFAULT FALSE,
    abuse_description TEXT,
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    reporting_date TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    assessed_by UUID NOT NULL REFERENCES users(user_id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- RADIOLOGY ASSESSMENT FORM (SH.MR.FRM.04) - SINGLE TABLE DESIGN
-- ===================================================================

);

-- ===================================================================
-- RADIOLOGY FORM (SH.MR.FRM.04) SPECIFIC TABLES
-- ===================================================================

-- Radiology assessments
CREATE TABLE radiology_assessments (
    radiology_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES patient_visits(visit_id) ON DELETE CASCADE,
    
    -- Assessment content
    findings TEXT NOT NULL,
    diagnosis TEXT,
    recommendations TEXT,
    
    -- Technical details
    modality VARCHAR(50),
    body_region VARCHAR(100),
    contrast_used TEXT,
    
    -- Audit fields
    assessed_by UUID NOT NULL REFERENCES users(user_id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- DOCUMENT STORAGE
-- ===================================================================

-- ===================================================================
-- RADIOLOGY ASSESSMENT FORM (SH.MR.FRM.04) - SINGLE TABLE DESIGN
-- ===================================================================
-- Complete radiology assessment form - all fields in one table
CREATE TABLE radiology_assessments (
    radiology_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(submission_id) ON DELETE CASCADE,

    -- Physician and department info
    treating_physician VARCHAR(255),
    department VARCHAR(100),

    -- Patient preparation
    fasting_hours INTEGER CHECK (fasting_hours >= 0),
    is_diabetic VARCHAR(10) DEFAULT 'false',
    blood_sugar_level INTEGER CHECK (blood_sugar_level >= 0),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
    height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm <= 300),

    -- Imaging procedure details
    dose_amount DECIMAL(10,2) CHECK (dose_amount >= 0),
    preparation_time TEXT,
    injection_time TEXT,
    injection_site VARCHAR(100),
    ctd1vol DECIMAL(10,2) CHECK (ctd1vol >= 0),
    dlp DECIMAL(10,2) CHECK (dlp >= 0),
    uses_contrast VARCHAR(10) DEFAULT 'false',
    kidney_function_value DECIMAL(10,2) CHECK (kidney_function_value >= 0),

    -- Study information
    is_first_time VARCHAR(10) DEFAULT 'true',
    is_comparison VARCHAR(10) DEFAULT 'false',
    previous_study_code VARCHAR(50),
    requires_report VARCHAR(10) DEFAULT 'true',
    requires_cd VARCHAR(10) DEFAULT 'false',

    -- Clinical information
    diagnosis TEXT,
    reason_for_study TEXT,

    -- Assessment content (findings)
    findings TEXT NOT NULL,
    impression TEXT,
    recommendations TEXT,

    -- Technical details
    modality VARCHAR(50),
    body_region VARCHAR(100),
    contrast_used TEXT,

    -- Treatment history
    has_chemotherapy BOOLEAN DEFAULT FALSE,
    chemo_type VARCHAR(20) CHECK (chemo_type IN ('tablets', 'infusion')),
    chemo_details TEXT,
    chemo_sessions INTEGER,
    chemo_last_date DATE,
    has_radiotherapy BOOLEAN DEFAULT FALSE,
    radiotherapy_site TEXT,
    radiotherapy_sessions INTEGER,
    radiotherapy_last_date DATE,
    has_hormonal_treatment BOOLEAN DEFAULT FALSE,
    hormonal_last_dose_date DATE,
    other_treatments TEXT,

    -- Previous imaging history
    has_operations BOOLEAN DEFAULT FALSE,
    has_endoscopy BOOLEAN DEFAULT FALSE,
    has_biopsies BOOLEAN DEFAULT FALSE,
    has_tc_mdp_bone_scan BOOLEAN DEFAULT FALSE,
    has_tc_dtpa_kidney_scan BOOLEAN DEFAULT FALSE,
    has_mri BOOLEAN DEFAULT FALSE,
    has_mammography BOOLEAN DEFAULT FALSE,
    has_ct BOOLEAN DEFAULT FALSE,
    has_xray BOOLEAN DEFAULT FALSE,
    has_ultrasound BOOLEAN DEFAULT FALSE,
    has_other_imaging BOOLEAN DEFAULT FALSE,
    other_imaging_desc TEXT,

    -- Audit fields
    assessed_by UUID NOT NULL REFERENCES users(user_id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- DOCUMENT STORAGE
-- ===================================================================

-- Document storage for scanned papers and attachments
CREATE TABLE visit_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES patient_visits(visit_id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'scanned_form', 'lab_result', 'image', 'report', etc.
    file_path TEXT NOT NULL, -- Path to stored file
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- ===================================================================
-- AUDIT AND LOGGING
-- ===================================================================

-- Audit trail for all changes
CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(user_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Primary lookup indexes
CREATE INDEX idx_patients_mobile ON patients(mobile_number);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_medical_number ON patients(medical_number);
CREATE INDEX idx_patients_name ON patients USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_visits_patient ON patient_visits(patient_ssn);
CREATE INDEX idx_visits_date ON patient_visits(visit_date);
CREATE INDEX idx_visits_status ON patient_visits(visit_status);
CREATE INDEX idx_visits_physician ON patient_visits(assigned_physician);
CREATE INDEX idx_visits_diagnosis ON patient_visits USING gin(to_tsvector('english', primary_diagnosis));

-- Form submission indexes
CREATE INDEX idx_submissions_visit ON form_submissions(visit_id);
CREATE INDEX idx_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_submissions_status ON form_submissions(submission_status);

-- Assessment indexes
CREATE INDEX idx_nursing_assessment ON nursing_assessments(submission_id);
CREATE INDEX idx_radiology_assessment ON radiology_assessments(submission_id);

-- Document indexes
CREATE INDEX idx_documents_visit ON visit_documents(visit_id);
CREATE INDEX idx_documents_type ON visit_documents(document_type);

-- Audit indexes
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user_date ON audit_log(changed_by, changed_at);

-- ===================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON patient_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- INITIAL DATA SETUP
-- ===================================================================

-- Insert form definitions
INSERT INTO form_definitions (form_code, form_name, form_version, form_description, form_role) VALUES
('SH.MR.FRM.05', 'Nursing Screening & Assessment', '1.0', 'Comprehensive nursing assessment and screening form', 'nurse'),
('SH.MR.FRM.04', 'Radiology Assessment', '1.0', 'Radiology preparation and assessment form', 'physician');

-- ===================================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================================

-- View for active patient visits with form status
CREATE VIEW v_active_visits AS
SELECT 
    pv.visit_id,
    pv.patient_ssn,
    p.full_name,
    p.mobile_number,
    p.phone_number,
    p.medical_number,
    pv.visit_date,
    pv.visit_status,
    pv.primary_diagnosis,
    pv.secondary_diagnosis,
    pv.visit_type,
    pv.department,
    u_creator.full_name as created_by_nurse,
    u_physician.full_name as assigned_physician,
    COALESCE(nursing_submitted.submission_status, 'not_started') as nursing_form_status,
    COALESCE(radiology_submitted.submission_status, 'not_started') as radiology_form_status
FROM patient_visits pv
JOIN patients p ON pv.patient_ssn = p.ssn
JOIN users u_creator ON pv.created_by = u_creator.user_id
LEFT JOIN users u_physician ON pv.assigned_physician = u_physician.user_id
LEFT JOIN (
    SELECT fs.visit_id, fs.submission_status 
    FROM form_submissions fs 
    JOIN form_definitions fd ON fs.form_id = fd.form_id 
    WHERE fd.form_code = 'SH.MR.FRM.05'
) nursing_submitted ON pv.visit_id = nursing_submitted.visit_id
LEFT JOIN (
    SELECT fs.visit_id, fs.submission_status 
    FROM form_submissions fs 
    JOIN form_definitions fd ON fs.form_id = fd.form_id 
    WHERE fd.form_code = 'SH.MR.FRM.04'
) radiology_submitted ON pv.visit_id = radiology_submitted.visit_id
WHERE pv.visit_status IN ('open', 'in_progress');

-- View for patient visit history
CREATE VIEW v_patient_history AS
SELECT 
    p.ssn,
    p.full_name,
    p.mobile_number,
    p.phone_number,
    p.medical_number,
    pv.visit_id,
    pv.visit_date,
    pv.visit_status,
    pv.primary_diagnosis,
    pv.secondary_diagnosis,
    pv.visit_type,
    pv.department,
    COUNT(vd.document_id) as document_count,
    COUNT(fs.submission_id) as form_count
FROM patients p
LEFT JOIN patient_visits pv ON p.ssn = pv.patient_ssn
LEFT JOIN visit_documents vd ON pv.visit_id = vd.visit_id AND vd.is_active = true
LEFT JOIN form_submissions fs ON pv.visit_id = fs.visit_id
GROUP BY p.ssn, p.full_name, p.mobile_number, p.phone_number, p.medical_number, 
         pv.visit_id, pv.visit_date, pv.visit_status, pv.primary_diagnosis, 
         pv.secondary_diagnosis, pv.visit_type, pv.department
ORDER BY pv.visit_date DESC;