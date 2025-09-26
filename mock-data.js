const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const mockData = {
    users: [
        { id: 'admin-uuid', username: 'admin', email: 'admin@example.com', fullName: 'Administrator', role: 'admin', password: 'admin' },
        { id: 'nurse-uuid', username: 'nurse', email: 'nurse@example.com', fullName: 'Nurse One', role: 'nurse', password: 'nurse' },
        { id: 'nurse2-uuid', username: 'nurse2', email: 'nurse2@example.com', fullName: 'Nurse Two', role: 'nurse', password: 'nurse' },
        { id: 'physician-uuid', username: 'doctor', email: 'doctor@example.com', fullName: 'Dr. Physician', role: 'physician', password: 'doctor' },
        { id: 'physician2-uuid', username: 'doctor2', email: 'doctor2@example.com', fullName: 'Dr. Physician Two', role: 'physician', password: 'doctor' }
    ],

    patients: [
        {
            ssn: '15038529876541',
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
            ssn: '22079229876542',
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
            ssn: '08117829876541',
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
            ssn: '30010529876540',
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
            ssn: '12096529876539',
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
    ],

    patientVisits: [
        {
            visit_id: 'visit-001',
            patient_ssn: '15038529876541',
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
            patient_ssn: '22079229876542',
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
            patient_ssn: '08117829876541',
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
            patient_ssn: '30010529876540',
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
            patient_ssn: '12096529876539',
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
    ],

    formSubmissions: [
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
            form_id: 'form-03-uuid',
            submitted_by: 'physician2-uuid',
            submission_status: 'submitted',
            submitted_at: '2025-09-25T16:00:00Z'
        }
    ],

    nursingAssessments: [
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
    ],

    radiologyAssessments: [
        {
            radiology_id: 'radio-001',
            submission_id: 'sub-radio-001',
            patient_full_name: 'Mohammed Ali Al-Fahad',
            examination_date: '2025-09-25T15:00:00Z',
            mobile_number: '+966504567890',
            gender: 'male',
            age: 46,
            medical_number: 'MRN003',
            date_of_birth: '1978-11-08',
            diagnosis: 'Coronary Artery Disease evaluation',
            ctd1vol: 45.2,
            dlp: 120.5,
            kv: 120,
            mas: 150,
            reason_for_examination: 'Chest pain evaluation',
            gypsum_splint_presence: 0,
            xrays_before_splint: 0,
            chronic_diseases: 'Hypertension, Hyperlipidemia',
            pacemaker: 0,
            slats_screws_artificial_joints: 0,
            pregnancy_status: 0,
            pain_numbness: 'Chest pain',
            pain_numbness_location: 'Left chest',
            spinal_deformities: 0,
            swelling: 0,
            swelling_location: null,
            headache_visual_troubles_hearing_problems_imbalance: 'None reported',
            fever: 0,
            previous_operations: 'Appendectomy 2010',
            tumor_history: 0,
            tumor_location_type: null,
            previous_investigations: 'ECG, Blood tests',
            disc_problems: 0,
            fall_risk_medications: 'Beta blockers',
            current_medications: 'Aspirin, Metoprolol, Atorvastatin',
            patient_signature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJibGFjayI+UGF0aWVudCBTaWduYXR1cmU8L3RleHQ+PC9zdmc+',
            doctor_signature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJibGFjayI+RG9jdG9yIFNpZ25hdHVyZTwvdGV4dD48L3N2Zz4=',
            form_number: 'SH.MR.FRM.03',
            assessed_by: 'physician2-uuid',
            assessed_at: '2025-09-25T16:00:00Z'
        }
    ]
};

async function insertMockData(db) {
    console.log('Inserting mock data...');

    try {
        // Insert users
        for (const user of mockData.users) {
            const hash = await bcrypt.hash(user.password, 10);
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                    [user.id, user.username, user.email, user.fullName, user.role, hash], (err) => {
                        if (err) {
                            console.error('Error inserting user:', err);
                            reject(err);
                        } else {
                            console.log(`✓ User ${user.username} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        // Insert patients
        for (const patient of mockData.patients) {
            await new Promise((resolve, reject) => {
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
                            reject(err);
                        } else {
                            console.log(`✓ Patient ${patient.full_name} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        // Insert patient visits
        for (const visit of mockData.patientVisits) {
            await new Promise((resolve, reject) => {
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
                            reject(err);
                        } else {
                            console.log(`✓ Visit ${visit.visit_id} for patient ${visit.patient_ssn} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        // Insert form submissions
        for (const submission of mockData.formSubmissions) {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO form_submissions (
                    submission_id, visit_id, form_id, submitted_by, submission_status, submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        submission.submission_id, submission.visit_id, submission.form_id,
                        submission.submitted_by, submission.submission_status, submission.submitted_at
                    ], (err) => {
                        if (err) {
                            console.error('Error inserting form submission:', err);
                            reject(err);
                        } else {
                            console.log(`✓ Form submission ${submission.submission_id} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        // Insert nursing assessments
        for (const assessment of mockData.nursingAssessments) {
            await new Promise((resolve, reject) => {
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
                            reject(err);
                        } else {
                            console.log(`✓ Nursing assessment ${assessment.assessment_id} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        // Insert radiology assessments
        for (const assessment of mockData.radiologyAssessments) {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO radiology_assessments (
                    radiology_id, submission_id, patient_full_name, examination_date, mobile_number, gender, age, medical_number, date_of_birth, diagnosis, ctd1vol, dlp, kv, mas, reason_for_examination, gypsum_splint_presence, xrays_before_splint, chronic_diseases, pacemaker, slats_screws_artificial_joints, pregnancy_status, pain_numbness, pain_numbness_location, spinal_deformities, swelling, swelling_location, headache_visual_troubles_hearing_problems_imbalance, fever, previous_operations, tumor_history, tumor_location_type, previous_investigations, disc_problems, fall_risk_medications, current_medications, patient_signature, doctor_signature, form_number, assessed_by, assessed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        assessment.radiology_id, assessment.submission_id, assessment.patient_full_name,
                        assessment.examination_date, assessment.mobile_number, assessment.gender, assessment.age,
                        assessment.medical_number, assessment.date_of_birth, assessment.diagnosis,
                        assessment.ctd1vol, assessment.dlp, assessment.kv, assessment.mas,
                        assessment.reason_for_examination, assessment.gypsum_splint_presence,
                        assessment.xrays_before_splint, assessment.chronic_diseases, assessment.pacemaker,
                        assessment.slats_screws_artificial_joints, assessment.pregnancy_status,
                        assessment.pain_numbness, assessment.pain_numbness_location, assessment.spinal_deformities,
                        assessment.swelling, assessment.swelling_location,
                        assessment.headache_visual_troubles_hearing_problems_imbalance, assessment.fever,
                        assessment.previous_operations, assessment.tumor_history, assessment.tumor_location_type,
                        assessment.previous_investigations, assessment.disc_problems, assessment.fall_risk_medications,
                        assessment.current_medications, assessment.patient_signature, assessment.doctor_signature,
                        assessment.form_number, assessment.assessed_by, assessment.assessed_at
                    ], (err) => {
                        if (err) {
                            console.error('Error inserting radiology assessment:', err);
                            reject(err);
                        } else {
                            console.log(`✓ Radiology assessment ${assessment.radiology_id} inserted successfully.`);
                            resolve();
                        }
                    });
            });
        }

        console.log('✅ All mock data inserted successfully!');
    } catch (error) {
        console.error('❌ Error inserting mock data:', error);
        throw error;
    }
}

// Export the mock data and insertion function
module.exports = {
    mockData,
    insertMockData
};