const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

const schemaPath = path.join(__dirname, 'docs', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('Error executing schema:', err.message);
    } else {
        console.log('Database schema created successfully.');

const users = [
    { id: 'admin-uuid', username: 'admin', email: 'admin@example.com', fullName: 'Administrator', role: 'admin', password: 'admin' },
    { id: 'nurse-uuid', username: 'nurse', email: 'nurse@example.com', fullName: 'Nurse One', role: 'nurse', password: 'nurse' },
    { id: 'nurse2-uuid', username: 'nurse2', email: 'nurse2@example.com', fullName: 'Nurse Two', role: 'nurse', password: 'nurse' },
    { id: 'physician-uuid', username: 'doctor', email: 'doctor@example.com', fullName: 'Dr. Physician', role: 'physician', password: 'doctor' },
    { id: 'physician2-uuid', username: 'doctor2', email: 'doctor2@example.com', fullName: 'Dr. Physician Two', role: 'physician', password: 'doctor' }
];

const patients = [
    {
        ssn: '123456789',
        mobile_number: '+966501234567',
        phone_number: '+966112345678',
        medical_number: 'MRN001',
        full_name: 'Ahmed Mohammed Al-Saud',
        date_of_birth: '1985-03-15',
        gender: 'male',
        address: 'Riyadh, Saudi Arabia',
        emergency_contact_name: 'Fatima Al-Saud',
        emergency_contact_phone: '+966507654321',
        emergency_contact_relation: 'wife'
    },
    {
        ssn: '987654321',
        mobile_number: '+966509876543',
        phone_number: '+966118765432',
        medical_number: 'MRN002',
        full_name: 'Sara Abdullah Al-Zahrani',
        date_of_birth: '1992-07-22',
        gender: 'female',
        address: 'Jeddah, Saudi Arabia',
        emergency_contact_name: 'Abdullah Al-Zahrani',
        emergency_contact_phone: '+966501234567',
        emergency_contact_relation: 'husband'
    },
    {
        ssn: '456789123',
        mobile_number: '+966504567890',
        phone_number: '+966114567890',
        medical_number: 'MRN003',
        full_name: 'Mohammed Ali Al-Fahad',
        date_of_birth: '1978-11-08',
        gender: 'male',
        address: 'Dammam, Saudi Arabia',
        emergency_contact_name: 'Aisha Al-Fahad',
        emergency_contact_phone: '+966503456789',
        emergency_contact_relation: 'daughter'
    },
    {
        ssn: '789123456',
        mobile_number: '+966506789012',
        phone_number: '+966116789012',
        medical_number: 'MRN004',
        full_name: 'Fatima Hassan Al-Qasimi',
        date_of_birth: '2005-01-30',
        gender: 'female',
        address: 'Medina, Saudi Arabia',
        emergency_contact_name: 'Hassan Al-Qasimi',
        emergency_contact_phone: '+966502345678',
        emergency_contact_relation: 'father'
    },
    {
        ssn: '321654987',
        mobile_number: '+966508901234',
        phone_number: '+966118901234',
        medical_number: 'MRN005',
        full_name: 'Omar Saleh Al-Mansouri',
        date_of_birth: '1965-09-12',
        gender: 'male',
        address: 'Mecca, Saudi Arabia',
        emergency_contact_name: 'Saleh Al-Mansouri',
        emergency_contact_phone: '+966509012345',
        emergency_contact_relation: 'son'
    }
];

const patientVisits = [
    {
        visit_id: 'visit-001',
        patient_ssn: '123456789',
        visit_date: '2025-09-26T10:00:00Z',
        visit_status: 'open',
        primary_diagnosis: 'Hypertension',
        secondary_diagnosis: 'Type 2 Diabetes',
        diagnosis_code: 'I10, E11.9',
        visit_type: 'outpatient',
        department: 'Internal Medicine',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        notes: 'Regular follow-up for blood pressure management'
    },
    {
        visit_id: 'visit-002',
        patient_ssn: '987654321',
        visit_date: '2025-09-26T11:30:00Z',
        visit_status: 'in_progress',
        primary_diagnosis: 'Acute Respiratory Infection',
        secondary_diagnosis: null,
        diagnosis_code: 'J06.9',
        visit_type: 'outpatient',
        department: 'Family Medicine',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        notes: 'Patient presents with cough and fever'
    },
    {
        visit_id: 'visit-003',
        patient_ssn: '456789123',
        visit_date: '2025-09-25T14:00:00Z',
        visit_status: 'completed',
        primary_diagnosis: 'Coronary Artery Disease',
        secondary_diagnosis: 'Hyperlipidemia',
        diagnosis_code: 'I25.10, E78.5',
        visit_type: 'outpatient',
        department: 'Cardiology',
        created_by: 'nurse2-uuid',
        assigned_physician: 'physician2-uuid',
        completed_at: '2025-09-25T16:30:00Z',
        notes: 'Cardiac evaluation completed, follow-up in 3 months'
    },
    {
        visit_id: 'visit-004',
        patient_ssn: '789123456',
        visit_date: '2025-09-26T09:00:00Z',
        visit_status: 'open',
        primary_diagnosis: 'Pediatric Asthma',
        secondary_diagnosis: null,
        diagnosis_code: 'J45.909',
        visit_type: 'outpatient',
        department: 'Pediatrics',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        notes: 'Regular asthma management and education'
    },
    {
        visit_id: 'visit-005',
        patient_ssn: '321654987',
        visit_date: '2025-09-24T13:00:00Z',
        visit_status: 'completed',
        primary_diagnosis: 'Osteoarthritis',
        secondary_diagnosis: 'Hypertension',
        diagnosis_code: 'M19.90, I10',
        visit_type: 'outpatient',
        department: 'Orthopedics',
        created_by: 'nurse2-uuid',
        assigned_physician: 'physician2-uuid',
        completed_at: '2025-09-24T15:45:00Z',
        notes: 'Joint pain assessment and pain management plan'
    }
];

const formSubmissions = [
    {
        submission_id: 'sub-nurse-001',
        visit_id: 'visit-001',
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'draft'
    },
    {
        submission_id: 'sub-nurse-002',
        visit_id: 'visit-002',
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-26T12:00:00Z'
    },
    {
        submission_id: 'sub-nurse-003',
        visit_id: 'visit-003',
        form_id: 'form-05-uuid',
        submitted_by: 'nurse2-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-25T15:00:00Z'
    },
    {
        submission_id: 'sub-radio-001',
        visit_id: 'visit-003',
        form_id: 'form-04-uuid',
        submitted_by: 'physician2-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-25T16:00:00Z'
    }
];

const nursingAssessments = [
    {
        assessment_id: 'nurse-assess-001',
        submission_id: 'sub-nurse-002',
        age: 33,
        chief_complaint: 'Cough and fever for 3 days',
        accompanied_by: 'husband',
        language_spoken: 'arabic',
        temperature_celsius: 38.5,
        pulse_bpm: 85,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        respiratory_rate_per_min: 18,
        oxygen_saturation_percent: 97,
        weight_kg: 65,
        height_cm: 165,
        psychological_problem: 'none',
        is_smoker: 0,
        has_allergies: 0,
        diet_type: 'regular',
        appetite: 'good',
        pain_intensity: 3,
        pain_location: 'chest',
        pain_frequency: 'occasional',
        pain_character: 'sharp',
        morse_total_score: 15,
        morse_risk_level: 'Low Risk',
        morse_scale: JSON.stringify({
            history_falling: 'no',
            secondary_diagnosis: 'yes',
            ambulatory_aid: 'none',
            iv_therapy: 'no',
            gait: 'normal',
            mental_status: 'oriented'
        }),
        needs_medication_education: 1,
        needs_pain_symptom_education: 1,
        assessed_by: 'nurse-uuid',
        assessed_at: '2025-09-26T12:00:00Z'
    },
    {
        assessment_id: 'nurse-assess-002',
        submission_id: 'sub-nurse-003',
        age: 46,
        chief_complaint: 'Chest pain and shortness of breath',
        accompanied_by: 'wife',
        language_spoken: 'arabic',
        temperature_celsius: 36.8,
        pulse_bpm: 78,
        blood_pressure_systolic: 145,
        blood_pressure_diastolic: 95,
        respiratory_rate_per_min: 16,
        oxygen_saturation_percent: 98,
        weight_kg: 85,
        height_cm: 175,
        psychological_problem: 'anxious',
        is_smoker: 1,
        has_allergies: 0,
        diet_type: 'regular',
        appetite: 'good',
        pain_intensity: 6,
        pain_location: 'chest',
        pain_frequency: 'intermittent',
        pain_character: 'pressure',
        morse_total_score: 35,
        morse_risk_level: 'High Risk',
        morse_scale: JSON.stringify({
            history_falling: 'yes',
            secondary_diagnosis: 'yes',
            ambulatory_aid: 'none',
            iv_therapy: 'no',
            gait: 'weak',
            mental_status: 'oriented'
        }),
        needs_medication_education: 1,
        needs_fall_prevention_education: 1,
        assessed_by: 'nurse2-uuid',
        assessed_at: '2025-09-25T15:00:00Z'
    }
];

        users.forEach(user => {
            const hash = bcrypt.hashSync(user.password, 10);
            db.run('INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.username, user.email, user.fullName, user.role, hash], (err) => {
                    if (err) {
                        console.error('Error inserting user:', err);
                    } else {
                        console.log(`User ${user.username} inserted successfully.`);
                    }
                });
        });

        // Insert sample patients
        patients.forEach(patient => {
            db.run(`INSERT INTO patients (
                ssn, mobile_number, phone_number, medical_number, full_name,
                date_of_birth, gender, address, emergency_contact_name,
                emergency_contact_phone, emergency_contact_relation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    patient.ssn, patient.mobile_number, patient.phone_number,
                    patient.medical_number, patient.full_name, patient.date_of_birth,
                    patient.gender, patient.address, patient.emergency_contact_name,
                    patient.emergency_contact_phone, patient.emergency_contact_relation
                ], (err) => {
                    if (err) {
                        console.error('Error inserting patient:', err);
                    } else {
                        console.log(`Patient ${patient.full_name} inserted successfully.`);
                    }
                });
        });

        // Insert sample patient visits
        patientVisits.forEach(visit => {
            db.run(`INSERT INTO patient_visits (
                visit_id, patient_ssn, visit_date, visit_status, primary_diagnosis,
                secondary_diagnosis, diagnosis_code, visit_type, department,
                created_by, assigned_physician, completed_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    visit.visit_id, visit.patient_ssn, visit.visit_date, visit.visit_status,
                    visit.primary_diagnosis, visit.secondary_diagnosis, visit.diagnosis_code,
                    visit.visit_type, visit.department, visit.created_by, visit.assigned_physician,
                    visit.completed_at, visit.notes
                ], (err) => {
                    if (err) {
                        console.error('Error inserting visit:', err);
                    } else {
                        console.log(`Visit ${visit.visit_id} for patient ${visit.patient_ssn} inserted successfully.`);
                    }
                });
        });

        // Insert sample form submissions
        formSubmissions.forEach(submission => {
            db.run(`INSERT INTO form_submissions (
                submission_id, visit_id, form_id, submitted_by, submission_status, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    submission.submission_id, submission.visit_id, submission.form_id,
                    submission.submitted_by, submission.submission_status, submission.submitted_at
                ], (err) => {
                    if (err) {
                        console.error('Error inserting form submission:', err);
                    } else {
                        console.log(`Form submission ${submission.submission_id} inserted successfully.`);
                    }
                });
        });

        // Insert sample nursing assessments
        nursingAssessments.forEach(assessment => {
            db.run(`INSERT INTO nursing_assessments (
                assessment_id, submission_id, age, chief_complaint, accompanied_by, language_spoken,
                temperature_celsius, pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
                respiratory_rate_per_min, oxygen_saturation_percent, weight_kg, height_cm,
                psychological_problem, is_smoker, has_allergies, diet_type, appetite,
                pain_intensity, pain_location, pain_frequency, pain_character,
                morse_total_score, morse_risk_level, morse_scale,
                needs_medication_education, needs_pain_symptom_education, needs_fall_prevention_education,
                assessed_by, assessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    assessment.assessment_id, assessment.submission_id, assessment.age,
                    assessment.chief_complaint, assessment.accompanied_by, assessment.language_spoken,
                    assessment.temperature_celsius, assessment.pulse_bpm, assessment.blood_pressure_systolic,
                    assessment.blood_pressure_diastolic, assessment.respiratory_rate_per_min,
                    assessment.oxygen_saturation_percent, assessment.weight_kg, assessment.height_cm,
                    assessment.psychological_problem, assessment.is_smoker, assessment.has_allergies,
                    assessment.diet_type, assessment.appetite, assessment.pain_intensity,
                    assessment.pain_location, assessment.pain_frequency, assessment.pain_character,
                    assessment.morse_total_score, assessment.morse_risk_level, assessment.morse_scale,
                    assessment.needs_medication_education, assessment.needs_pain_symptom_education,
                    assessment.needs_fall_prevention_education, assessment.assessed_by, assessment.assessed_at
                ], (err) => {
                    if (err) {
                        console.error('Error inserting nursing assessment:', err);
                    } else {
                        console.log(`Nursing assessment ${assessment.assessment_id} inserted successfully.`);
                    }
                });
        });
    }
    setTimeout(() => db.close(), 5000);
});