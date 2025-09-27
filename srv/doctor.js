const sqlite3 = require('sqlite3').verbose();

module.exports = function(app, db, requireAuth, requireRole) {


app.post('/doctor/search-patient', requireAuth, requireRole('physician'), (req, res) => {
    const { ssn } = req.body;

    // Validate SSN format
    if (!ssn || !/^\d{14}$/.test(ssn)) {
        return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Please enter a valid 14-digit SSN' });
    }

    db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
        if (err) {
            console.error('Database error:', err);
            return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Database error' });
        }

        if (!patient) {
            return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Patient not found. Please ensure the patient is registered.' });
        }

        // Store patient in session for radiology form access
        req.session.selectedPatient = patient;

        // Check for current visit or create new one
        db.get('SELECT * FROM patient_visits WHERE patient_ssn = ? ORDER BY created_at DESC LIMIT 1', [ssn], (err, visit) => {
            if (err) {
                console.error('Error checking visits:', err);
                return res.render('doctor-dashboard', { user: req.session, patient: patient, error: 'Error checking patient visits' });
            }

            if (!visit) {
                // Create new visit
                const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                    [visitId, ssn, req.session.userId], function(err) {
                        if (err) {
                            console.error('Error creating visit:', err);
                            return res.render('doctor-dashboard', { user: req.session, patient: patient, error: 'Error creating visit' });
                        }
                        req.session.selectedVisit = { visit_id: visitId };
                        res.render('doctor-dashboard', { user: req.session, patient: patient, error: null });
                    });
            } else {
                req.session.selectedVisit = visit;
                res.render('doctor-dashboard', { user: req.session, patient: patient, error: null });
            }
        });
    });
});

app.get('/radiology-form', requireAuth, requireRole('physician'), (req, res) => {
    if (!req.session.selectedPatient || !req.session.selectedVisit) {
        return res.redirect('/doctor');
    }

    // Get user's signature
    db.get('SELECT signature_data FROM user_signatures WHERE user_id = ?', [req.session.userId], (err, userSignature) => {
        res.render('radiology-form', {
            user: req.session,
            patient: req.session.selectedPatient,
            visit: req.session.selectedVisit,
            userSignature: userSignature ? userSignature.signature_data : null
        });
    });
});

app.post('/submit-radiology-form', requireAuth, requireRole('physician'), (req, res) => {
    const formData = req.body;
    console.log('Radiology form submitted:', formData);

    if (!req.session.selectedVisit) {
        return res.status(400).send('No patient visit selected');
    }

    // Handle signature storage
    const signatureData = formData.physician_signature;
    if (!signatureData || signatureData === '') {
        return res.status(400).send('Signature is required');
    }

    // Check if user already has a signature
    db.get('SELECT signature_id FROM user_signatures WHERE user_id = ?', [req.session.userId], (err, existingSignature) => {
        if (err) {
            console.error('Error checking existing signature:', err);
            return res.status(500).send('Database error');
        }

        const signatureId = existingSignature ? existingSignature.signature_id : 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const signatureSql = existingSignature ?
            'UPDATE user_signatures SET signature_data = ?, updated_at = CURRENT_TIMESTAMP WHERE signature_id = ?' :
            'INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)';

        const signatureValues = existingSignature ?
            [signatureData, signatureId] :
            [signatureId, req.session.userId, signatureData];

        db.run(signatureSql, signatureValues, function(sigErr) {
            if (sigErr) {
                console.error('Error saving signature:', sigErr);
                return res.status(500).send('Error saving signature');
            }

            // Now proceed with form submission using signature_id reference
            function proceedWithRadiologySubmission(signatureId) {
                // Generate UUID-like string
                const radiologyId = 'radio-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                // Insert into radiology_assessments
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
                        physician_signature_id, assessed_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const values = [
                    radiologyId, submissionId, formData.treating_physician, formData.department,
                    formData.fasting_hours, formData.is_diabetic === 'true' ? 1 : 0, formData.blood_sugar_level,
                    formData.weight_kg, formData.height_cm, formData.dose_amount,
                    formData.ctd1vol, formData.dlp, formData.uses_contrast === 'true' ? 1 : 0,
                    formData.kidney_function_value, formData.is_first_time === 'true' ? 1 : 0,
                    formData.requires_report === 'true' ? 1 : 0, formData.diagnosis, formData.reason_for_study,
                    formData.findings, formData.impression, formData.recommendations,
                    formData.modality, formData.body_region, formData.has_chemotherapy ? 1 : 0,
                    formData.chemo_type, formData.chemo_sessions, formData.has_radiotherapy ? 1 : 0,
                    formData.radiotherapy_site, formData.radiotherapy_sessions,
                    formData.has_operations ? 1 : 0, formData.has_endoscopy ? 1 : 0,
                    formData.has_biopsies ? 1 : 0, formData.has_tc_mdp_bone_scan ? 1 : 0,
                    formData.has_tc_dtpa_kidney_scan ? 1 : 0, formData.has_mri ? 1 : 0,
                    formData.has_mammography ? 1 : 0, formData.has_ct ? 1 : 0,
                    formData.has_xray ? 1 : 0, formData.has_ultrasound ? 1 : 0, signatureId, req.session.userId
                ];

                db.run(sql, values, function(err) {
                    if (err) {
                        console.error('Error inserting radiology assessment:', err.message);
                        return res.status(500).send('Error saving assessment');
                    }

                    // Create form submission record
                    db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by, submission_status) VALUES (?, ?, ?, ?, ?)',
                        [submissionId, req.session.selectedVisit.visit_id, 'form-04-uuid', req.session.userId, 'submitted'], function(err) {
                            if (err) {
                                console.error('Error creating form submission:', err);
                            }
                        });

                    console.log('Radiology assessment saved with ID:', radiologyId);
                    res.send(`
                        <div class="alert alert-success text-center">
                            <h4><i class="fas fa-check-circle me-2"></i>Radiology Assessment Submitted Successfully!</h4>
                            <p>Assessment ID: ${radiologyId}</p>
                            <a href="/doctor" class="btn btn-primary">Back to Dashboard</a>
                        </div>
                    `);
                });
            }

            proceedWithRadiologySubmission(signatureId);
        });
    });
});

};