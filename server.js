const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database setup
const db = new sqlite3.Database('./radiology.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/nurse-form', (req, res) => {
    res.render('nurse-form');
});

app.get('/radiology-form', (req, res) => {
    res.render('radiology-form');
});

// Form submission routes
app.post('/submit-nurse-form', (req, res) => {
    const formData = req.body;
    console.log('Nurse form submitted:', formData);

    // Generate UUID-like string
    const assessmentId = 'nurse-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert into database
    const sql = `
        INSERT INTO nursing_assessments (
            assessment_id, submission_id, mode_of_arrival, age, chief_complaint,
            accompanied_by, language_spoken, temperature_celsius, pulse_bpm,
            blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate_per_min,
            oxygen_saturation_percent, blood_sugar_mg_dl, weight_kg, height_cm,
            psychological_problem, is_smoker, has_allergies, medication_allergies,
            food_allergies, other_allergies, diet_type, appetite, has_git_problems,
            has_weight_loss, has_weight_gain, feeding_status, hygiene_status,
            toileting_status, ambulation_status, uses_walker, uses_wheelchair,
            uses_transfer_device, uses_other_equipment, pain_intensity, pain_location,
            pain_frequency, pain_character, needs_medication_education,
            needs_diet_nutrition_education, needs_medical_equipment_education,
            needs_rehabilitation_education, needs_drug_interaction_education,
            needs_pain_symptom_education, needs_fall_prevention_education, other_needs,
            assessed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        assessmentId, submissionId, formData.mode_of_arrival, formData.age,
        formData.chief_complaint, formData.accompanied_by, formData.language_spoken,
        formData.temperature_celsius, formData.pulse_bpm, formData.blood_pressure_systolic,
        formData.blood_pressure_diastolic, formData.respiratory_rate_per_min,
        formData.oxygen_saturation_percent, formData.blood_sugar_mg_dl,
        formData.weight_kg, formData.height_cm, formData.psychological_problem,
        formData.is_smoker ? 1 : 0, formData.has_allergies ? 1 : 0,
        formData.medication_allergies, formData.food_allergies, formData.other_allergies,
        formData.diet_type, formData.appetite, formData.has_git_problems ? 1 : 0,
        formData.has_weight_loss ? 1 : 0, formData.has_weight_gain ? 1 : 0,
        formData.feeding_status, formData.hygiene_status, formData.toileting_status,
        formData.ambulation_status, formData.uses_walker ? 1 : 0,
        formData.uses_wheelchair ? 1 : 0, formData.uses_transfer_device ? 1 : 0,
        formData.uses_other_equipment ? 1 : 0, formData.pain_intensity,
        formData.pain_location, formData.pain_frequency, formData.pain_character,
        formData.needs_medication_education ? 1 : 0,
        formData.needs_diet_nutrition_education ? 1 : 0,
        formData.needs_medical_equipment_education ? 1 : 0,
        formData.needs_rehabilitation_education ? 1 : 0,
        formData.needs_drug_interaction_education ? 1 : 0,
        formData.needs_pain_symptom_education ? 1 : 0,
        formData.needs_fall_prevention_education ? 1 : 0,
        formData.other_needs ? 1 : 0, 'nurse-uuid'
    ];

    db.run(sql, values, function(err) {
        if (err) {
            console.error('Error inserting nurse assessment:', err.message);
            return res.status(500).send('Error saving assessment');
        }
        console.log('Nurse assessment saved with ID:', assessmentId);
        res.send(`
            <div class="alert alert-success text-center">
                <h4><i class="fas fa-check-circle me-2"></i>Nurse Assessment Submitted Successfully!</h4>
                <p>Assessment ID: ${assessmentId}</p>
                <a href="/" class="btn btn-primary">Back to Home</a>
            </div>
        `);
    });
});

app.post('/submit-radiology-form', (req, res) => {
    const formData = req.body;
    console.log('Radiology form submitted:', formData);

    // Generate UUID-like string
    const radiologyId = 'radio-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Insert into database
    const sql = `
        INSERT INTO radiology_assessments (
            radiology_id, submission_id, treating_physician, department,
            fasting_hours, is_diabetic, blood_sugar_level, weight_kg, height_cm,
            dose_amount, ctd1vol, dlp, uses_contrast, kidney_function_value,
            is_first_time, requires_report, diagnosis, reason_for_study,
            findings, impression, recommendations, modality, body_region,
            has_chemotherapy, chemo_type, chemo_sessions, has_radiotherapy,
            radiotherapy_site, radiotherapy_sessions, has_operations, has_endoscopy,
            has_biopsies, has_tc_mdp_bone_scan, has_tc_dtpa_kidney_scan,
            has_mri, has_mammography, has_ct, has_xray, has_ultrasound,
            assessed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        radiologyId, submissionId, formData.treating_physician, formData.department,
        formData.fasting_hours, formData.is_diabetic, formData.blood_sugar_level,
        formData.weight_kg, formData.height_cm, formData.dose_amount,
        formData.ctd1vol, formData.dlp, formData.uses_contrast,
        formData.kidney_function_value, formData.is_first_time,
        formData.requires_report, formData.diagnosis, formData.reason_for_study,
        formData.findings, formData.impression, formData.recommendations,
        formData.modality, formData.body_region, formData.has_chemotherapy ? 1 : 0,
        formData.chemo_type, formData.chemo_sessions, formData.has_radiotherapy ? 1 : 0,
        formData.radiotherapy_site, formData.radiotherapy_sessions,
        formData.has_operations ? 1 : 0, formData.has_endoscopy ? 1 : 0,
        formData.has_biopsies ? 1 : 0, formData.has_tc_mdp_bone_scan ? 1 : 0,
        formData.has_tc_dtpa_kidney_scan ? 1 : 0, formData.has_mri ? 1 : 0,
        formData.has_mammography ? 1 : 0, formData.has_ct ? 1 : 0,
        formData.has_xray ? 1 : 0, formData.has_ultrasound ? 1 : 0, 'physician-uuid'
    ];

    db.run(sql, values, function(err) {
        if (err) {
            console.error('Error inserting radiology assessment:', err.message);
            return res.status(500).send('Error saving assessment');
        }
        console.log('Radiology assessment saved with ID:', radiologyId);
        res.send(`
            <div class="alert alert-success text-center">
                <h4><i class="fas fa-check-circle me-2"></i>Radiology Assessment Submitted Successfully!</h4>
                <p>Assessment ID: ${radiologyId}</p>
                <a href="/" class="btn btn-primary">Back to Home</a>
            </div>
        `);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;