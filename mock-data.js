const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

// Connect to database
const db = new sqlite3.Database('./radiology.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database for mock data insertion.');
    }
});

// Mock data
const mockPatients = [
    {
        ssn: '12345678901234',
        mobile_number: '+201234567890',
        phone_number: '+202234567890',
        medical_number: 'MR001',
        full_name: 'Ahmed Mohamed Ali',
        date_of_birth: '1985-03-15',
        gender: 'male',
        address: '123 Nile Street, Cairo, Egypt',
        emergency_contact_name: 'Fatima Mohamed Ali',
        emergency_contact_phone: '+201234567891',
        emergency_contact_relation: 'wife',
        created_by: 'admin-uuid'
    },
    {
        ssn: '23456789012345',
        mobile_number: '+201234567891',
        phone_number: '+202234567891',
        medical_number: 'MR002',
        full_name: 'Sara Ahmed Hassan',
        date_of_birth: '1990-07-22',
        gender: 'female',
        address: '456 Pyramids Road, Giza, Egypt',
        emergency_contact_name: 'Mohamed Ahmed Hassan',
        emergency_contact_phone: '+201234567892',
        emergency_contact_relation: 'husband',
        created_by: 'admin-uuid'
    },
    {
        ssn: '34567890123456',
        mobile_number: '+201234567892',
        phone_number: '+202234567892',
        medical_number: 'MR003',
        full_name: 'Omar Khaled Mahmoud',
        date_of_birth: '1978-11-08',
        gender: 'male',
        address: '789 Alexandria Highway, Alexandria, Egypt',
        emergency_contact_name: 'Amina Khaled Mahmoud',
        emergency_contact_phone: '+201234567893',
        emergency_contact_relation: 'sister',
        created_by: 'admin-uuid'
    },
    {
        ssn: '45678901234567',
        mobile_number: '+201234567893',
        phone_number: '+202234567893',
        medical_number: 'MR004',
        full_name: 'Layla Ibrahim Saleh',
        date_of_birth: '1995-01-30',
        gender: 'female',
        address: '321 Suez Canal Street, Suez, Egypt',
        emergency_contact_name: 'Ibrahim Saleh',
        emergency_contact_phone: '+201234567894',
        emergency_contact_relation: 'father',
        created_by: 'admin-uuid'
    },
    {
        ssn: '56789012345678',
        mobile_number: '+201234567894',
        phone_number: '+202234567894',
        medical_number: 'MR005',
        full_name: 'Mohamed Hassan Ali',
        date_of_birth: '1965-09-12',
        gender: 'male',
        address: '654 Luxor Avenue, Luxor, Egypt',
        emergency_contact_name: 'Hassan Ali',
        emergency_contact_phone: '+201234567895',
        emergency_contact_relation: 'son',
        created_by: 'admin-uuid'
    }
];

const mockVisits = [
    {
        visit_id: uuidv4(),
        patient_ssn: '12345678901234',
        visit_date: '2025-09-20 09:00:00',
        visit_status: 'completed',
        primary_diagnosis: 'Chest pain',
        secondary_diagnosis: 'Hypertension',
        diagnosis_code: 'R07.9',
        visit_type: 'outpatient',
        department: 'Cardiology',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        completed_at: '2025-09-20 11:30:00',
        notes: 'Patient presented with chest pain, ECG normal, referred for stress test'
    },
    {
        visit_id: uuidv4(),
        patient_ssn: '23456789012345',
        visit_date: '2025-09-21 10:30:00',
        visit_status: 'in_progress',
        primary_diagnosis: 'Abdominal pain',
        diagnosis_code: 'R10.9',
        visit_type: 'outpatient',
        department: 'Gastroenterology',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        notes: 'Patient with right lower quadrant pain, ultrasound ordered'
    },
    {
        visit_id: uuidv4(),
        patient_ssn: '34567890123456',
        visit_date: '2025-09-22 14:00:00',
        visit_status: 'open',
        primary_diagnosis: 'Back pain',
        diagnosis_code: 'M54.9',
        visit_type: 'outpatient',
        department: 'Orthopedics',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        notes: 'Chronic low back pain, MRI spine ordered'
    },
    {
        visit_id: uuidv4(),
        patient_ssn: '45678901234567',
        visit_date: '2025-09-23 08:15:00',
        visit_status: 'completed',
        primary_diagnosis: 'Headache',
        diagnosis_code: 'R51',
        visit_type: 'emergency',
        department: 'Neurology',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        completed_at: '2025-09-23 12:00:00',
        notes: 'Migraine headache, CT brain ordered, normal findings'
    },
    {
        visit_id: uuidv4(),
        patient_ssn: '56789012345678',
        visit_date: '2025-09-24 11:45:00',
        visit_status: 'completed',
        primary_diagnosis: 'Joint pain',
        diagnosis_code: 'M25.9',
        visit_type: 'outpatient',
        department: 'Rheumatology',
        created_by: 'nurse-uuid',
        assigned_physician: 'physician-uuid',
        completed_at: '2025-09-24 13:30:00',
        notes: 'Knee osteoarthritis, X-ray ordered, moderate joint space narrowing'
    }
];

const mockSubmissions = [
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[0].visit_id,
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-20 10:15:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[0].visit_id,
        form_id: 'form-04-uuid',
        submitted_by: 'physician-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-20 11:00:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[1].visit_id,
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-21 11:00:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[3].visit_id,
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-23 09:00:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[3].visit_id,
        form_id: 'form-04-uuid',
        submitted_by: 'physician-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-23 10:30:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[4].visit_id,
        form_id: 'form-05-uuid',
        submitted_by: 'nurse-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-24 12:15:00'
    },
    {
        submission_id: uuidv4(),
        visit_id: mockVisits[4].visit_id,
        form_id: 'form-04-uuid',
        submitted_by: 'physician-uuid',
        submission_status: 'submitted',
        submitted_at: '2025-09-24 13:00:00'
    }
];

const mockNursingAssessments = [
    {
        assessment_id: uuidv4(),
        submission_id: mockSubmissions[0].submission_id,
        age: 40,
        chief_complaint: 'Chest pain for 2 hours',
        temperature_celsius: 36.8,
        pulse_bpm: 78,
        blood_pressure_systolic: 140,
        blood_pressure_diastolic: 90,
        respiratory_rate_per_min: 16,
        oxygen_saturation_percent: 98.0,
        blood_sugar_mg_dl: 95,
        weight_kg: 75.5,
        height_cm: 175.0,
        general_condition: 'stable',
        consciousness_level: 'alert',
        skin_condition: 'normal',
        mobility_status: 'independent',
        psychological_problem: 'none',
        is_smoker: 0,
        has_allergies: 0,
        diet_type: 'regular',
        appetite: 'good',
        pain_intensity: 6,
        pain_location: 'chest',
        action_taken: 'ECG performed, vital signs monitored',
        assessed_by: 'nurse-uuid',
        assessed_at: '2025-09-20 10:15:00'
    },
    {
        assessment_id: uuidv4(),
        submission_id: mockSubmissions[2].submission_id,
        age: 35,
        chief_complaint: 'Right lower abdominal pain',
        temperature_celsius: 37.2,
        pulse_bpm: 82,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        respiratory_rate_per_min: 18,
        oxygen_saturation_percent: 97.0,
        blood_sugar_mg_dl: 88,
        weight_kg: 62.0,
        height_cm: 165.0,
        general_condition: 'stable',
        consciousness_level: 'alert',
        skin_condition: 'normal',
        mobility_status: 'independent',
        psychological_problem: 'anxious',
        is_smoker: 0,
        has_allergies: 1,
        diet_type: 'regular',
        appetite: 'poor',
        pain_intensity: 7,
        pain_location: 'right lower abdomen',
        action_taken: 'IV fluids started, pain medication given',
        assessed_by: 'nurse-uuid',
        assessed_at: '2025-09-21 11:00:00'
    },
    {
        assessment_id: uuidv4(),
        submission_id: mockSubmissions[3].submission_id,
        age: 30,
        chief_complaint: 'Severe headache with nausea',
        temperature_celsius: 36.5,
        pulse_bpm: 75,
        blood_pressure_systolic: 135,
        blood_pressure_diastolic: 85,
        respiratory_rate_per_min: 14,
        oxygen_saturation_percent: 99.0,
        blood_sugar_mg_dl: 92,
        weight_kg: 58.0,
        height_cm: 160.0,
        general_condition: 'stable',
        consciousness_level: 'alert',
        skin_condition: 'pale',
        mobility_status: 'independent',
        psychological_problem: 'anxious',
        is_smoker: 0,
        has_allergies: 0,
        diet_type: 'regular',
        appetite: 'poor',
        pain_intensity: 8,
        pain_location: 'head',
        action_taken: 'Neurological assessment completed, CT brain ordered',
        assessed_by: 'nurse-uuid',
        assessed_at: '2025-09-23 09:00:00'
    },
    {
        assessment_id: uuidv4(),
        submission_id: mockSubmissions[5].submission_id,
        age: 60,
        chief_complaint: 'Knee pain and stiffness',
        temperature_celsius: 36.7,
        pulse_bpm: 72,
        blood_pressure_systolic: 145,
        blood_pressure_diastolic: 95,
        respiratory_rate_per_min: 16,
        oxygen_saturation_percent: 96.0,
        blood_sugar_mg_dl: 110,
        weight_kg: 78.0,
        height_cm: 170.0,
        general_condition: 'stable',
        consciousness_level: 'alert',
        skin_condition: 'normal',
        mobility_status: 'needs_supervision',
        psychological_problem: 'none',
        is_smoker: 1,
        has_allergies: 0,
        diet_type: 'regular',
        appetite: 'good',
        pain_intensity: 5,
        pain_location: 'right knee',
        action_taken: 'Pain assessment completed, X-ray knee ordered',
        assessed_by: 'nurse-uuid',
        assessed_at: '2025-09-24 12:15:00'
    }
];

const mockRadiologyAssessments = [
    {
        radiology_id: uuidv4(),
        submission_id: mockSubmissions[1].submission_id,
        treating_physician: 'Dr. Physician',
        department: 'Cardiology',
        fasting_hours: 8,
        is_diabetic: 'false',
        blood_sugar_level: 95,
        weight_kg: 75.5,
        height_cm: 175.0,
        dose_amount: 2.5,
        preparation_time: '08:30',
        injection_time: '09:15',
        injection_site: 'right arm',
        ctd1vol: 5.2,
        dlp: 120.5,
        uses_contrast: 'true',
        kidney_function_value: 85.0,
        is_first_time: 'true',
        is_comparison: 'false',
        requires_report: 'true',
        requires_cd: 'true',
        diagnosis: 'Chest pain evaluation',
        reason_for_study: 'Rule out coronary artery disease',
        findings: 'Normal cardiac silhouette. No cardiomegaly. Normal pulmonary vascularity. No pleural effusion. No pneumothorax.',
        impression: 'No acute cardiopulmonary abnormality detected.',
        recommendations: 'Clinical correlation recommended. Follow up as needed.',
        modality: 'CT',
        body_region: 'Chest',
        contrast_used: 'Yes',
        has_operations: 0,
        has_xray: 0,
        assessed_by: 'physician-uuid',
        assessed_at: '2025-09-20 11:00:00'
    },
    {
        radiology_id: uuidv4(),
        submission_id: mockSubmissions[4].submission_id,
        treating_physician: 'Dr. Physician',
        department: 'Neurology',
        fasting_hours: 6,
        is_diabetic: 'false',
        blood_sugar_level: 92,
        weight_kg: 58.0,
        height_cm: 160.0,
        dose_amount: 1.8,
        preparation_time: '08:45',
        injection_time: '09:30',
        injection_site: 'left arm',
        ctd1vol: 3.8,
        dlp: 95.2,
        uses_contrast: 'true',
        kidney_function_value: 78.0,
        is_first_time: 'true',
        is_comparison: 'false',
        requires_report: 'true',
        requires_cd: 'false',
        diagnosis: 'Acute headache',
        reason_for_study: 'Rule out intracranial hemorrhage',
        findings: 'No evidence of acute intracranial hemorrhage, mass lesion, or midline shift. Normal gray-white matter differentiation. No hydrocephalus.',
        impression: 'No acute intracranial abnormality.',
        recommendations: 'Clinical correlation for migraine headache.',
        modality: 'CT',
        body_region: 'Head',
        contrast_used: 'Yes',
        has_operations: 0,
        has_xray: 0,
        assessed_by: 'physician-uuid',
        assessed_at: '2025-09-23 10:30:00'
    },
    {
        radiology_id: uuidv4(),
        submission_id: mockSubmissions[6].submission_id,
        treating_physician: 'Dr. Physician',
        department: 'Orthopedics',
        fasting_hours: 0,
        is_diabetic: 'true',
        blood_sugar_level: 110,
        weight_kg: 78.0,
        height_cm: 170.0,
        dose_amount: 0,
        requires_report: 'true',
        requires_cd: 'false',
        diagnosis: 'Knee osteoarthritis',
        reason_for_study: 'Evaluate joint space narrowing',
        findings: 'Joint space narrowing at medial compartment. Osteophyte formation. Subchondral sclerosis. No acute fracture.',
        impression: 'Moderate osteoarthritis of the right knee.',
        recommendations: 'Orthopedic consultation recommended.',
        modality: 'X-Ray',
        body_region: 'Knee',
        contrast_used: 'No',
        has_operations: 0,
        has_xray: 1,
        assessed_by: 'physician-uuid',
        assessed_at: '2025-09-24 13:00:00'
    }
];

// Function to insert data sequentially
function insertMockData() {
    console.log('Starting mock data insertion...');

    // Insert patients
    console.log('Inserting patients...');
    let patientsInserted = 0;
    mockPatients.forEach(patient => {
        db.run(`INSERT OR IGNORE INTO patients (
            ssn, mobile_number, phone_number, medical_number, full_name,
            date_of_birth, gender, address, emergency_contact_name,
            emergency_contact_phone, emergency_contact_relation, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            patient.ssn, patient.mobile_number, patient.phone_number,
            patient.medical_number, patient.full_name, patient.date_of_birth,
            patient.gender, patient.address, patient.emergency_contact_name,
            patient.emergency_contact_phone, patient.emergency_contact_relation,
            patient.created_by
        ], (err) => {
            if (err) {
                console.error('Error inserting patient:', err);
            } else {
                patientsInserted++;
                if (patientsInserted === mockPatients.length) {
                    console.log(`✓ Inserted ${patientsInserted} patients`);
                    insertVisits();
                }
            }
        });
    });
}

function insertVisits() {
    console.log('Inserting patient visits...');
    let visitsInserted = 0;
    mockVisits.forEach(visit => {
        db.run(`INSERT OR IGNORE INTO patient_visits (
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
                visitsInserted++;
                if (visitsInserted === mockVisits.length) {
                    console.log(`✓ Inserted ${visitsInserted} patient visits`);
                    insertSubmissions();
                }
            }
        });
    });
}

function insertSubmissions() {
    console.log('Inserting form submissions...');
    let submissionsInserted = 0;
    mockSubmissions.forEach(submission => {
        db.run(`INSERT OR IGNORE INTO form_submissions (
            submission_id, visit_id, form_id, submitted_by, submission_status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
            submission.submission_id, submission.visit_id, submission.form_id,
            submission.submitted_by, submission.submission_status, submission.submitted_at
        ], (err) => {
            if (err) {
                console.error('Error inserting submission:', err);
            } else {
                submissionsInserted++;
                if (submissionsInserted === mockSubmissions.length) {
                    console.log(`✓ Inserted ${submissionsInserted} form submissions`);
                    insertNursingAssessments();
                }
            }
        });
    });
}

function insertNursingAssessments() {
    console.log('Inserting nursing assessments...');
    let assessmentsInserted = 0;
    mockNursingAssessments.forEach(assessment => {
        const sql = `INSERT OR IGNORE INTO nursing_assessments (
            assessment_id, submission_id, age, chief_complaint, temperature_celsius,
            pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
            respiratory_rate_per_min, oxygen_saturation_percent, blood_sugar_mg_dl,
            weight_kg, height_cm, general_condition, consciousness_level,
            skin_condition, mobility_status, psychological_problem, is_smoker,
            has_allergies, diet_type, appetite, pain_intensity, pain_location,
            action_taken, assessed_by, assessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            assessment.assessment_id, assessment.submission_id, assessment.age,
            assessment.chief_complaint, assessment.temperature_celsius, assessment.pulse_bpm,
            assessment.blood_pressure_systolic, assessment.blood_pressure_diastolic,
            assessment.respiratory_rate_per_min, assessment.oxygen_saturation_percent,
            assessment.blood_sugar_mg_dl, assessment.weight_kg, assessment.height_cm,
            assessment.general_condition, assessment.consciousness_level, assessment.skin_condition,
            assessment.mobility_status, assessment.psychological_problem, assessment.is_smoker,
            assessment.has_allergies, assessment.diet_type, assessment.appetite,
            assessment.pain_intensity, assessment.pain_location, assessment.action_taken,
            assessment.assessed_by, assessment.assessed_at
        ];

        db.run(sql, values, (err) => {
            if (err) {
                console.error('Error inserting nursing assessment:', err);
            } else {
                assessmentsInserted++;
                if (assessmentsInserted === mockNursingAssessments.length) {
                    console.log(`✓ Inserted ${assessmentsInserted} nursing assessments`);
                    insertRadiologyAssessments();
                }
            }
        });
    });
}

function insertRadiologyAssessments() {
    console.log('Inserting radiology assessments...');
    let radiologyInserted = 0;
    mockRadiologyAssessments.forEach(assessment => {
        const sql = `INSERT OR IGNORE INTO radiology_assessments (
            radiology_id, submission_id, treating_physician, department, fasting_hours,
            is_diabetic, blood_sugar_level, weight_kg, height_cm, dose_amount,
            preparation_time, injection_time, injection_site, ctd1vol, dlp,
            uses_contrast, kidney_function_value, is_first_time, is_comparison,
            requires_report, requires_cd, diagnosis, reason_for_study, findings,
            impression, recommendations, modality, body_region, contrast_used,
            has_operations, has_xray, assessed_by, assessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            assessment.radiology_id, assessment.submission_id, assessment.treating_physician,
            assessment.department, assessment.fasting_hours, assessment.is_diabetic,
            assessment.blood_sugar_level, assessment.weight_kg, assessment.height_cm,
            assessment.dose_amount, assessment.preparation_time, assessment.injection_time,
            assessment.injection_site, assessment.ctd1vol, assessment.dlp, assessment.uses_contrast,
            assessment.kidney_function_value, assessment.is_first_time, assessment.is_comparison,
            assessment.requires_report, assessment.requires_cd, assessment.diagnosis,
            assessment.reason_for_study, assessment.findings, assessment.impression,
            assessment.recommendations, assessment.modality, assessment.body_region,
            assessment.contrast_used, assessment.has_operations, assessment.has_xray,
            assessment.assessed_by, assessment.assessed_at
        ];

        db.run(sql, values, (err) => {
            if (err) {
                console.error('Error inserting radiology assessment:', err);
            } else {
                radiologyInserted++;
                if (radiologyInserted === mockRadiologyAssessments.length) {
                    console.log(`✓ Inserted ${radiologyInserted} radiology assessments`);
                    console.log('\n🎉 Mock data insertion completed successfully!');
                    console.log('\n📊 Summary:');
                    console.log(`   • ${mockPatients.length} patients`);
                    console.log(`   • ${mockVisits.length} patient visits`);
                    console.log(`   • ${mockSubmissions.length} form submissions`);
                    console.log(`   • ${mockNursingAssessments.length} nursing assessments`);
                    console.log(`   • ${mockRadiologyAssessments.length} radiology assessments`);
                    console.log('\n🔍 Test the application by:');
                    console.log('   1. Logging in as nurse (username: nurse, password: nurse)');
                    console.log('   2. Searching for patients by SSN (e.g., 12345678901234)');
                    console.log('   3. Viewing completed assessments and radiology reports');
                    console.log('   4. Logging in as physician (username: doctor, password: doctor)');
                    console.log('   5. Accessing radiology assessment forms');
                    db.close();
                }
            }
        });
    });
}

// Start the insertion process
insertMockData();