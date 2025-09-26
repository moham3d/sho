-- SQLite version of the radiology management schema
-- Adapted from schema1.sql

-- Patients table (SSN as primary identifier)
CREATE TABLE patients (
    ssn TEXT PRIMARY KEY, -- Social Security Number as primary key
    mobile_number TEXT NOT NULL,
    phone_number TEXT, -- Additional phone number (landline, work, etc.)
    medical_number TEXT UNIQUE, -- Hospital/Medical record number if exists
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT, -- Patient address
    emergency_contact_name TEXT, -- Emergency contact information
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT, -- Relationship to patient
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- Reference to user who created the record
    is_active INTEGER DEFAULT 1
);

-- User management for nurses and physicians
CREATE TABLE users (
    user_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('nurse', 'physician', 'admin')),
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Patient visits
CREATE TABLE patient_visits (
    visit_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    patient_ssn TEXT NOT NULL REFERENCES patients(ssn) ON DELETE CASCADE,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    visit_status TEXT DEFAULT 'open' CHECK (visit_status IN ('open', 'in_progress', 'completed', 'cancelled')),
    primary_diagnosis TEXT, -- التشخيص الأساسي
    secondary_diagnosis TEXT, -- التشخيص الثانوي
    diagnosis_code TEXT, -- ICD-10 or other coding system
    visit_type TEXT DEFAULT 'outpatient' CHECK (visit_type IN ('outpatient', 'inpatient', 'emergency', 'consultation')),
    department TEXT, -- Department/Unit
    created_by TEXT NOT NULL REFERENCES users(user_id), -- Nurse who created the visit
    assigned_physician TEXT REFERENCES users(user_id), -- Physician assigned to the visit
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form definitions (SH.MR.FRM.05, SH.MR.FRM.04, etc.)
CREATE TABLE form_definitions (
    form_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    form_code TEXT UNIQUE NOT NULL, -- e.g., 'SH.MR.FRM.05'
    form_name TEXT NOT NULL,
    form_version TEXT NOT NULL,
    form_description TEXT,
    form_role TEXT NOT NULL CHECK (form_role IN ('nurse', 'physician', 'both')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions for each visit
CREATE TABLE form_submissions (
    submission_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    visit_id TEXT NOT NULL REFERENCES patient_visits(visit_id) ON DELETE CASCADE,
    form_id TEXT NOT NULL REFERENCES form_definitions(form_id),
    submitted_by TEXT NOT NULL REFERENCES users(user_id),
    submission_status TEXT DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by TEXT REFERENCES users(user_id),
    approved_at DATETIME,
    UNIQUE(visit_id, form_id) -- One submission per form per visit
);

-- Nursing assessments
CREATE TABLE nursing_assessments (
    assessment_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    submission_id TEXT NOT NULL REFERENCES form_submissions(submission_id) ON DELETE CASCADE,

    -- Basic assessment info
    mode_of_arrival TEXT, -- Mode of arrival
    arrival_other_desc TEXT, -- Other arrival description
    age INTEGER CHECK (age >= 0 AND age <= 150),
    chief_complaint TEXT, -- Chief complaint
    accompanied_by TEXT, -- Accompanied by
    language_spoken TEXT DEFAULT 'arabic', -- Language spoken
    language_other_desc TEXT, -- Other language description

    -- Vital signs
    temperature_celsius REAL CHECK (temperature_celsius >= 30.0 AND temperature_celsius <= 45.0),
    pulse_bpm INTEGER CHECK (pulse_bpm >= 30 AND pulse_bpm <= 200),
    blood_pressure_systolic INTEGER CHECK (blood_pressure_systolic >= 70 AND blood_pressure_systolic <= 250),
    blood_pressure_diastolic INTEGER CHECK (blood_pressure_diastolic >= 40 AND blood_pressure_diastolic <= 150),
    respiratory_rate_per_min INTEGER CHECK (respiratory_rate_per_min >= 8 AND respiratory_rate_per_min <= 60),
    oxygen_saturation_percent REAL CHECK (oxygen_saturation_percent >= 70.0 AND oxygen_saturation_percent <= 100.0),
    blood_sugar_mg_dl INTEGER CHECK (blood_sugar_mg_dl >= 0),
    weight_kg REAL CHECK (weight_kg > 0 AND weight_kg <= 500),
    height_cm REAL CHECK (height_cm > 0 AND height_cm <= 300),

    -- General assessment
    general_condition TEXT,
    consciousness_level TEXT,
    skin_condition TEXT,
    mobility_status TEXT,

    -- Psychosocial history
    psychological_problem TEXT CHECK (psychological_problem IN ('none', 'depressed', 'agitated', 'anxious', 'isolated', 'confused', 'other')),
    psychological_other_desc TEXT,
    is_smoker INTEGER DEFAULT 0,
    has_allergies INTEGER DEFAULT 0,
    medication_allergies TEXT,
    food_allergies TEXT,
    other_allergies TEXT,

    -- Nutritional screening
    diet_type TEXT DEFAULT 'regular' CHECK (diet_type IN ('regular', 'special')),
    special_diet_desc TEXT,
    appetite TEXT CHECK (appetite IN ('good', 'poor')),
    has_git_problems INTEGER DEFAULT 0,
    git_problems_desc TEXT,
    has_weight_loss INTEGER DEFAULT 0,
    has_weight_gain INTEGER DEFAULT 0,
    refer_to_nutritionist INTEGER DEFAULT 0,

    -- Functional assessment
    feeding_status TEXT CHECK (feeding_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    hygiene_status TEXT CHECK (hygiene_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    toileting_status TEXT CHECK (toileting_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    ambulation_status TEXT CHECK (ambulation_status IN ('independent', 'needs_supervision', 'totally_dependent')),
    has_musculoskeletal_problems INTEGER DEFAULT 0,
    has_deformities INTEGER DEFAULT 0,
    has_contractures INTEGER DEFAULT 0,
    is_amputee INTEGER DEFAULT 0,
    is_bedridden INTEGER DEFAULT 0,
    has_musculoskeletal_pain INTEGER DEFAULT 0,
    uses_walker INTEGER DEFAULT 0,
    uses_wheelchair INTEGER DEFAULT 0,
    uses_transfer_device INTEGER DEFAULT 0,
    uses_raised_toilet_seat INTEGER DEFAULT 0,
    uses_other_equipment INTEGER DEFAULT 0,
    other_equipment_desc TEXT,

    -- Pain assessment
    pain_intensity INTEGER CHECK (pain_intensity BETWEEN 0 AND 10),
    pain_location TEXT,
    pain_frequency TEXT,
    pain_duration TEXT,
    pain_character TEXT,
    action_taken TEXT,

    -- Fall risk assessment (Morse Scale)
    fall_history_3months INTEGER DEFAULT 0,
    secondary_diagnosis INTEGER DEFAULT 0,
    ambulatory_aid TEXT CHECK (ambulatory_aid IN ('none', 'bed_rest_chair', 'crutches_walker', 'furniture')),
    iv_therapy INTEGER DEFAULT 0,
    gait_status TEXT CHECK (gait_status IN ('normal', 'weak', 'impaired')),
    mental_status TEXT CHECK (mental_status IN ('oriented', 'forgets_limitations', 'unaware')),
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
    needs_medication_education INTEGER DEFAULT 0,
    needs_diet_nutrition_education INTEGER DEFAULT 0,
    needs_medical_equipment_education INTEGER DEFAULT 0,
    needs_rehabilitation_education INTEGER DEFAULT 0,
    needs_drug_interaction_education INTEGER DEFAULT 0,
    needs_pain_symptom_education INTEGER DEFAULT 0,
    needs_fall_prevention_education INTEGER DEFAULT 0,
    other_needs INTEGER DEFAULT 0,
    other_needs_desc TEXT,

    -- Elderly assessment
    daily_activities TEXT CHECK (daily_activities IN ('independent', 'needs_help', 'dependent')),
    cognitive_assessment TEXT CHECK (cognitive_assessment IN ('normal', 'mild_delirium', 'moderate_delirium', 'severe_delirium')),
    mood_assessment TEXT CHECK (mood_assessment IN ('depressed', 'not_depressed')),
    speech_disorder INTEGER DEFAULT 0,
    hearing_disorder INTEGER DEFAULT 0,
    vision_disorder INTEGER DEFAULT 0,
    sleep_disorder INTEGER DEFAULT 0,

    -- Disabled patients assessment
    disability_type TEXT CHECK (disability_type IN ('hearing', 'visual', 'mobility', 'other')),
    disability_other_desc TEXT,
    has_assistive_devices INTEGER DEFAULT 0,
    assistive_devices_desc TEXT,

    -- Abuse and neglect screening
    has_signs_of_abuse INTEGER DEFAULT 0,
    abuse_description TEXT,
    reported_to_authorities INTEGER DEFAULT 0,
    reporting_date DATETIME,

    -- Audit fields
    nurse_signature_id TEXT REFERENCES user_signatures(signature_id), -- Reference to user's signature
    assessed_by TEXT NOT NULL REFERENCES users(user_id),
    assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Radiology assessments
CREATE TABLE radiology_assessments (
    radiology_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    submission_id TEXT NOT NULL REFERENCES form_submissions(submission_id) ON DELETE CASCADE,

    -- Physician and department info
    treating_physician TEXT,
    department TEXT,

    -- Patient preparation
    fasting_hours INTEGER CHECK (fasting_hours >= 0),
    is_diabetic TEXT DEFAULT 'false',
    blood_sugar_level INTEGER CHECK (blood_sugar_level >= 0),
    weight_kg REAL CHECK (weight_kg > 0 AND weight_kg <= 500),
    height_cm REAL CHECK (height_cm > 0 AND height_cm <= 300),

    -- Imaging procedure details
    dose_amount REAL CHECK (dose_amount >= 0),
    preparation_time TEXT,
    injection_time TEXT,
    injection_site TEXT,
    ctd1vol REAL CHECK (ctd1vol >= 0),
    dlp REAL CHECK (dlp >= 0),
    uses_contrast TEXT DEFAULT 'false',
    kidney_function_value REAL CHECK (kidney_function_value >= 0),

    -- Study information
    is_first_time TEXT DEFAULT 'true',
    is_comparison TEXT DEFAULT 'false',
    previous_study_code TEXT,
    requires_report TEXT DEFAULT 'true',
    requires_cd TEXT DEFAULT 'false',

    -- Clinical information
    diagnosis TEXT,
    reason_for_study TEXT,

    -- Assessment content (findings)
    findings TEXT NOT NULL,
    impression TEXT,
    recommendations TEXT,

    -- Technical details
    modality TEXT,
    body_region TEXT,
    contrast_used TEXT,

    -- Treatment history
    has_chemotherapy INTEGER DEFAULT 0,
    chemo_type TEXT CHECK (chemo_type IN ('tablets', 'infusion')),
    chemo_details TEXT,
    chemo_sessions INTEGER,
    chemo_last_date DATE,
    has_radiotherapy INTEGER DEFAULT 0,
    radiotherapy_site TEXT,
    radiotherapy_sessions INTEGER,
    radiotherapy_last_date DATE,
    has_hormonal_treatment INTEGER DEFAULT 0,
    hormonal_last_dose_date DATE,
    other_treatments TEXT,

    -- Previous imaging history
    has_operations INTEGER DEFAULT 0,
    has_endoscopy INTEGER DEFAULT 0,
    has_biopsies INTEGER DEFAULT 0,
    has_tc_mdp_bone_scan INTEGER DEFAULT 0,
    has_tc_dtpa_kidney_scan INTEGER DEFAULT 0,
    has_mri INTEGER DEFAULT 0,
    has_mammography INTEGER DEFAULT 0,
    has_ct INTEGER DEFAULT 0,
    has_xray INTEGER DEFAULT 0,
    has_ultrasound INTEGER DEFAULT 0,
    has_other_imaging INTEGER DEFAULT 0,
    other_imaging_desc TEXT,

    -- Audit fields
    physician_signature_id TEXT REFERENCES user_signatures(signature_id), -- Reference to user's signature
    assessed_by TEXT NOT NULL REFERENCES users(user_id),
    assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User signatures for reusable signatures across forms
CREATE TABLE user_signatures (
    signature_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) -- One signature per user
);

-- Audit trail for all changes
CREATE TABLE audit_log (
    audit_id TEXT PRIMARY KEY, -- Using TEXT for UUID
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT, -- JSON as TEXT
    new_values TEXT, -- JSON as TEXT
    changed_by TEXT NOT NULL REFERENCES users(user_id),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_patients_mobile ON patients(mobile_number);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_medical_number ON patients(medical_number);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_visits_patient ON patient_visits(patient_ssn);
CREATE INDEX idx_visits_date ON patient_visits(visit_date);
CREATE INDEX idx_visits_status ON patient_visits(visit_status);
CREATE INDEX idx_visits_physician ON patient_visits(assigned_physician);
CREATE INDEX idx_visits_diagnosis ON patient_visits(primary_diagnosis);

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

-- Triggers for automatic updates (SQLite version)
CREATE TRIGGER update_patients_updated_at AFTER UPDATE ON patients
BEGIN
    UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE ssn = NEW.ssn;
END;

CREATE TRIGGER update_visits_updated_at AFTER UPDATE ON patient_visits
BEGIN
    UPDATE patient_visits SET updated_at = CURRENT_TIMESTAMP WHERE visit_id = NEW.visit_id;
END;

-- Insert form definitions
INSERT INTO form_definitions (form_id, form_code, form_name, form_version, form_description, form_role) VALUES
('form-05-uuid', 'SH.MR.FRM.05', 'Nursing Screening & Assessment', '1.0', 'Comprehensive nursing assessment and screening form', 'nurse'),
('form-04-uuid', 'SH.MR.FRM.04', 'Radiology Assessment', '1.0', 'Radiology preparation and assessment form', 'physician');