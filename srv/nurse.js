const sqlite3 = require('sqlite3').verbose();

module.exports = function(app, db, requireAuth, requireRole) {

    // Nurse dashboard route
    app.get('/nurse', requireAuth, requireRole('nurse'), (req, res) => {
        // Handle notification from query parameters
        const notification = req.query.notification ? {
            type: req.query.notification,
            message: req.query.message ? decodeURIComponent(req.query.message) : ''
        } : null;

        // Get current visits for the nurse
        db.all(`
            SELECT
                pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                pv.visit_type, pv.department, pv.created_at,
                p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                na.assessment_id, fs.submission_status = 'draft' as is_draft,
                (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
            LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
            WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
            ORDER BY pv.visit_date DESC, pv.created_at DESC
            LIMIT 5
        `, [req.session.userId], (err, currentVisits) => {
            if (err) {
                console.error('Error getting nurse visits for dashboard:', err);
                currentVisits = [];
            }

            res.render('nurse-dashboard', {
                user: req.session,
                notification: notification,
                currentVisits: currentVisits || []
            });
        });
    });

    // Nurse my assessments route
    app.get('/nurse/my-assessments', requireAuth, requireRole('nurse'), (req, res) => {
        // Get visits assigned to this nurse that are in progress
        db.all(`
            SELECT
                pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                pv.visit_type, pv.department, pv.created_at,
                p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                na.assessment_id, fs.submission_status = 'draft' as is_draft,
                (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
            LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
            WHERE pv.created_by = ? AND pv.visit_status = 'in_progress'
            ORDER BY pv.visit_date DESC, pv.created_at DESC
        `, [req.session.userId], (err, visits) => {
            if (err) {
                console.error('Error getting nurse assessments:', err);
                return res.status(500).send('Database error');
            }

            res.render('nurse-assessments', {
                user: req.session,
                visits: visits || []
            });
        });
    });

    // Nurse search patient route
    app.get('/nurse/search-patient', requireAuth, requireRole('nurse'), (req, res) => {
        // Get nurse's current visits with assessment status
        db.all(`
            SELECT
                pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                pv.visit_type, pv.department, pv.created_at,
                p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                na.assessment_id, fs.submission_status = 'draft' as is_draft,
                (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
            LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
            WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
            ORDER BY pv.visit_date DESC, pv.created_at DESC
            LIMIT 10
        `, [req.session.userId], (err, visits) => {
            if (err) {
                console.error('Error getting nurse visits:', err);
                visits = [];
            }

            res.render('patient-search', {
                user: req.session,
                patient: null,
                error: null,
                visitId: null,
                currentVisits: visits || []
            });
        });
    });

    // API endpoint for patient autocomplete search
    app.get('/api/patients/search', requireAuth, (req, res) => {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json([]);
        }

        db.all(`
            SELECT full_name, ssn, medical_number, mobile_number, date_of_birth, gender
            FROM patients
            WHERE ssn LIKE ?
            ORDER BY ssn
            LIMIT 3
        `, [`%${q}%`], (err, patients) => {
            if (err) {
                console.error('Patient search error:', err);
                return res.status(500).json({ error: 'Search failed' });
            }
            res.json(patients || []);
        });
    });

    // Nurse search patient POST route
    app.post('/nurse/search-patient', requireAuth, requireRole('nurse'), (req, res) => {
        const { ssn } = req.body;

        // Validate SSN format
        if (!ssn || !/^\d{14}$/.test(ssn)) {
            return res.render('patient-search', {
                user: req.session,
                patient: null,
                error: 'Please enter a valid 14-digit SSN',
                visitId: null,
                currentVisits: []
            });
        }

        // Get current visits for the template
        db.all(`
            SELECT
                pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                pv.visit_type, pv.department, pv.created_at,
                p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                na.assessment_id, fs.submission_status = 'draft' as is_draft,
                (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
            LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
            WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
            ORDER BY pv.visit_date DESC, pv.created_at DESC
            LIMIT 10
        `, [req.session.userId], (err, currentVisits) => {
            if (err) {
                console.error('Error getting nurse visits:', err);
                currentVisits = [];
            }

            db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.render('patient-search', {
                        user: req.session,
                        patient: null,
                        error: 'Database error',
                        visitId: null,
                        currentVisits: currentVisits || []
                    });
                }

                if (!patient) {
                    return res.render('patient-search', {
                        user: req.session,
                        patient: null,
                        error: 'Patient not found. Please register the patient first.',
                        visitId: null,
                        currentVisits: currentVisits || [],
                        searchedSSN: ssn // Pass the searched SSN to the template
                    });
                }

                // Create new visit immediately
                const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                    [visitId, ssn, req.session.userId], function(err) {
                        if (err) {
                            console.error('Error creating visit:', err);
                            return res.render('patient-search', {
                                user: req.session,
                                patient: patient,
                                error: 'Error creating visit',
                                visitId: null,
                                currentVisits: currentVisits || []
                            });
                        }

                        // Create form submission
                        db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by) VALUES (?, ?, ?, ?)',
                            [submissionId, visitId, 'form-05-uuid', req.session.userId], function(err) {
                                if (err) {
                                    console.error('Error creating form submission:', err);
                                    return res.render('patient-search', {
                                        user: req.session,
                                        patient: patient,
                                        error: 'Error creating assessment',
                                        visitId: null,
                                        currentVisits: currentVisits || []
                                    });
                                }

                                // Redirect to nurse form with visit context
                                res.redirect(`/nurse/assessment/${visitId}`);
                            });
                    });
            });
        });
    });

    // Nurse add patient routes
    app.get('/nurse/add-patient', requireAuth, requireRole('nurse'), (req, res) => {
        res.render('add-patient', { user: req.session, error: null });
    });

    app.post('/nurse/add-patient', requireAuth, requireRole('nurse'), (req, res) => {
        const { ssn, full_name, mobile_number, phone_number, medical_number, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation } = req.body;

        // Validate required fields
        if (!ssn || !full_name || !mobile_number || !date_of_birth || !gender) {
            return res.render('add-patient', {
                user: req.session,
                error: 'Please fill in all required fields (SSN, Full Name, Mobile Number, Date of Birth, Gender)'
            });
        }

        // Validate SSN format (14-digit Egyptian SSN)
        if (!/^\d{14}$/.test(ssn)) {
            return res.render('add-patient', {
                user: req.session,
                error: 'SSN must be exactly 14 digits and contain only numbers'
            });
        }

        // Check if patient already exists
        db.get('SELECT ssn FROM patients WHERE ssn = ?', [ssn], (err, existingPatient) => {
            if (err) {
                console.error('Error checking patient existence:', err);
                return res.render('add-patient', {
                    user: req.session,
                    error: 'Database error occurred'
                });
            }

            if (existingPatient) {
                return res.render('add-patient', {
                    user: req.session,
                    error: 'A patient with this SSN already exists'
                });
            }

            // Insert new patient
            db.run(`INSERT INTO patients (
                ssn, full_name, mobile_number, phone_number, medical_number,
                date_of_birth, gender, address, emergency_contact_name,
                emergency_contact_phone, emergency_contact_relation, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ssn, full_name, mobile_number, phone_number || null, medical_number || null,
             date_of_birth, gender, address || null, emergency_contact_name || null,
             emergency_contact_phone || null, emergency_contact_relation || null, req.session.userId],
            function(err) {
                if (err) {
                    console.error('Error creating patient:', err);
                    return res.render('add-patient', {
                        user: req.session,
                        error: 'Error creating patient record'
                    });
                }

                // Patient created successfully, now create a new visit and redirect to assessment
                const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                    [visitId, ssn, req.session.userId], function(err) {
                        if (err) {
                            console.error('Error creating visit:', err);
                            return res.render('add-patient', {
                                user: req.session,
                                error: 'Patient created but error creating visit. Please try searching for the patient.'
                            });
                        }

                        // Create form submission
                        db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by) VALUES (?, ?, ?, ?)',
                            [submissionId, visitId, 'form-05-uuid', req.session.userId], function(err) {
                                if (err) {
                                    console.error('Error creating form submission:', err);
                                    return res.render('add-patient', {
                                        user: req.session,
                                        error: 'Patient and visit created but error creating assessment. Please try searching for the patient.'
                                    });
                                }

                                // Redirect to nurse form with visit context
                                res.redirect(`/nurse/assessment/${visitId}`);
                            });
                    });
            });
        });
    });

    // Nurse assessment route
    app.get('/nurse/assessment/:visitId', requireAuth, requireRole('nurse'), (req, res) => {
        const visitId = req.params.visitId;

        // Get visit and patient info
        db.get(`
            SELECT pv.*, p.full_name, p.mobile_number, p.medical_number, p.date_of_birth, p.gender,
                   p.phone_number, p.address, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            WHERE pv.visit_id = ? AND pv.created_by = ?
        `, [visitId, req.session.userId], (err, visit) => {
            if (err || !visit) {
                return res.status(404).send('Visit not found');
            }

            // Get user's signature
            db.get('SELECT signature_data FROM user_signatures WHERE user_id = ?', [req.session.userId], (err, userSignature) => {
                // Check if assessment exists and get submission status
                db.get(`
                    SELECT na.*, fs.submission_status, us.signature_data as assessment_signature
                    FROM nursing_assessments na
                    JOIN form_submissions fs ON na.submission_id = fs.submission_id
                    LEFT JOIN user_signatures us ON na.nurse_signature_id = us.signature_id
                    WHERE fs.visit_id = ?
                `, [visitId], (err, result) => {
                    const assessment = result ? result : null;
                    const isDraft = result ? result.submission_status === 'draft' : false;
                    const isCompleted = result ? result.submission_status === 'submitted' : false;
                    const assessmentSignature = result ? result.assessment_signature : null;

                    res.render('nurse-form', {
                        user: req.session,
                        visit: visit,
                        assessment: assessment,
                        isDraft: isDraft,
                        isCompleted: isCompleted,
                        assessmentSignature: assessmentSignature,
                        userSignature: userSignature ? userSignature.signature_data : null
                    });
                });
            });
        });
    });

    // Nurse form submission route
    app.post('/submit-nurse-form', requireAuth, requireRole('nurse'), (req, res) => {
        const formData = req.body;
        const visitId = formData.visit_id;
        const isDraft = formData.action === 'draft';

        console.log('Nurse form submitted:', {
            visitId,
            isDraft,
            hasSignature: !!formData.nurse_signature,
            signatureLength: formData.nurse_signature ? formData.nurse_signature.length : 0,
            signaturePreview: formData.nurse_signature ? formData.nurse_signature.substring(0, 100) + '...' : 'none'
        });

        // Check if assessment already exists
        db.get('SELECT na.*, fs.submission_id, fs.submission_status FROM nursing_assessments na JOIN form_submissions fs ON na.submission_id = fs.submission_id WHERE fs.visit_id = ?', [visitId], (err, existingAssessment) => {
            if (err) {
                console.error('Error checking existing assessment:', err);
                return res.status(500).send('Database error');
            }

            // Prevent updates to completed assessments
            if (existingAssessment && existingAssessment.submission_status === 'submitted') {
                return res.status(403).send('This assessment has been completed and cannot be modified. Please contact an administrator if changes are needed.');
            }

            // Handle signature storage - only required for final submissions
            const signatureData = formData.nurse_signature;
            if (!isDraft && (!signatureData || signatureData === '')) {
                return res.status(400).send('Signature is required for final submission');
            }

            // Only process signature for final submissions
            if (!isDraft) {
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
                        proceedWithFormSubmission(signatureId, existingAssessment);
                    });
                });
            } else {
                // For drafts, proceed without signature
                proceedWithFormSubmission(null, existingAssessment);
            }
        });

        function proceedWithFormSubmission(signatureId, existingAssessment) {
            const submissionId = existingAssessment ? existingAssessment.submission_id : 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const assessmentId = existingAssessment ? existingAssessment.assessment_id : 'nurse-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Prepare fall risk assessment data
            const morseScaleData = {
                history_falling: formData.morse_history_falling,
                secondary_diagnosis: formData.morse_secondary_diagnosis,
                ambulatory_aid: formData.morse_ambulatory_aid,
                iv_therapy: formData.morse_iv_therapy,
                gait: formData.morse_gait,
                mental_status: formData.morse_mental_status,
                total_score: parseInt(formData.morse_total_score) || 0,
                risk_level: formData.morse_risk_level || 'Low Risk'
            };

            const pediatricFallRiskData = {
                developmental_stage: formData.pediatric_developmental_stage,
                activity_level: formData.pediatric_activity_level,
                medication_use: formData.pediatric_medication_use,
                environmental_factors: formData.pediatric_environmental_factors,
                previous_falls: formData.pediatric_previous_falls,
                cognitive_factors: formData.pediatric_cognitive_factors,
                total_score: parseInt(formData.pediatric_total_score) || 0,
                risk_level: formData.pediatric_risk_level || 'Low Risk'
            };

            const elderlyAssessmentData = {
                orientation: formData.elderly_orientation,
                memory: formData.elderly_memory,
                bathing: formData.elderly_bathing,
                dressing: formData.elderly_dressing,
                toileting: formData.elderly_toileting,
                medication_count: formData.elderly_medication_count,
                high_risk_meds: formData.elderly_high_risk_meds ? 1 : 0,
                falls: formData.elderly_falls ? 1 : 0,
                incontinence: formData.elderly_incontinence ? 1 : 0,
                delirium: formData.elderly_delirium ? 1 : 0,
                living_situation: formData.elderly_living_situation,
                social_support: formData.elderly_social_support,
                total_score: parseInt(formData.elderly_total_score) || 0,
                risk_level: formData.elderly_risk_level || 'Low Risk'
            };

            const insertColumns = `assessment_id, submission_id, mode_of_arrival, age, chief_complaint, accompanied_by, language_spoken,
                    temperature_celsius, pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
                    respiratory_rate_per_min, oxygen_saturation_percent, blood_sugar_mg_dl, weight_kg, height_cm,
                    psychological_problem, is_smoker, has_allergies, medication_allergies, food_allergies, other_allergies,
                    diet_type, appetite, has_git_problems, has_weight_loss, has_weight_gain, feeding_status, hygiene_status,
                    toileting_status, ambulation_status, uses_walker, uses_wheelchair, uses_transfer_device, uses_other_equipment,
                    pain_intensity, pain_location, pain_frequency, pain_character, morse_total_score, morse_risk_level, morse_scale,
                    pediatric_fall_risk, elderly_assessment, needs_medication_education, needs_diet_nutrition_education, needs_medical_equipment_education,
                    needs_rehabilitation_education, needs_drug_interaction_education, needs_pain_symptom_education,
                    needs_fall_prevention_education, other_needs, nurse_signature_id, assessed_by, assessed_at`;

            const insertPlaceholders = insertColumns.split(',').map(() => '?').join(', ');

            const sql = existingAssessment ?
                `UPDATE nursing_assessments SET
                    mode_of_arrival = ?, age = ?, chief_complaint = ?, accompanied_by = ?, language_spoken = ?,
                    temperature_celsius = ?, pulse_bpm = ?, blood_pressure_systolic = ?, blood_pressure_diastolic = ?,
                    respiratory_rate_per_min = ?, oxygen_saturation_percent = ?, blood_sugar_mg_dl = ?,
                    weight_kg = ?, height_cm = ?, psychological_problem = ?, is_smoker = ?, has_allergies = ?,
                    medication_allergies = ?, food_allergies = ?, other_allergies = ?, diet_type = ?, appetite = ?,
                    has_git_problems = ?, has_weight_loss = ?, has_weight_gain = ?, feeding_status = ?, hygiene_status = ?,
                    toileting_status = ?, ambulation_status = ?, uses_walker = ?, uses_wheelchair = ?, uses_transfer_device = ?,
                    uses_other_equipment = ?, pain_intensity = ?, pain_location = ?, pain_frequency = ?,
                    pain_character = ?, morse_total_score = ?, morse_risk_level = ?, morse_scale = ?,
                    pediatric_fall_risk = ?, elderly_assessment = ?, needs_medication_education = ?, needs_diet_nutrition_education = ?,
                    needs_medical_equipment_education = ?, needs_rehabilitation_education = ?, needs_drug_interaction_education = ?,
                    needs_pain_symptom_education = ?, needs_fall_prevention_education = ?, other_needs = ?, nurse_signature_id = ?
                 WHERE assessment_id = ?` :
                `INSERT INTO nursing_assessments (${insertColumns}) VALUES (${insertPlaceholders})`;

            const values = existingAssessment ? [
                formData.mode_of_arrival, formData.age, formData.chief_complaint, formData.accompanied_by, formData.language_spoken,
                formData.temperature_celsius, formData.pulse_bpm, formData.blood_pressure_systolic, formData.blood_pressure_diastolic,
                formData.respiratory_rate_per_min, formData.oxygen_saturation_percent, formData.blood_sugar_mg_dl,
                formData.weight_kg, formData.height_cm, formData.psychological_problem, formData.is_smoker ? 1 : 0,
                formData.has_allergies ? 1 : 0, formData.medication_allergies, formData.food_allergies, formData.other_allergies,
                formData.diet_type, formData.appetite, formData.has_git_problems ? 1 : 0, formData.has_weight_loss ? 1 : 0,
                formData.has_weight_gain ? 1 : 0, formData.feeding_status, formData.hygiene_status, formData.toileting_status,
                formData.ambulation_status, formData.uses_walker ? 1 : 0, formData.uses_wheelchair ? 1 : 0, formData.uses_transfer_device ? 1 : 0,
                formData.uses_other_equipment ? 1 : 0, formData.pain_intensity, formData.pain_location, formData.pain_frequency,
                formData.pain_character, formData.morse_total_score, formData.morse_risk_level, JSON.stringify(morseScaleData),
                JSON.stringify(pediatricFallRiskData), JSON.stringify(elderlyAssessmentData), formData.needs_medication_education ? 1 : 0, formData.needs_diet_nutrition_education ? 1 : 0,
                formData.needs_medical_equipment_education ? 1 : 0, formData.needs_rehabilitation_education ? 1 : 0,
                formData.needs_drug_interaction_education ? 1 : 0, formData.needs_pain_symptom_education ? 1 : 0,
                formData.needs_fall_prevention_education ? 1 : 0, formData.other_needs ? 1 : 0, signatureId, assessmentId
            ] : [
                assessmentId, submissionId, formData.mode_of_arrival, formData.age, formData.chief_complaint,
                formData.accompanied_by, formData.language_spoken, formData.temperature_celsius, formData.pulse_bpm,
                formData.blood_pressure_systolic, formData.blood_pressure_diastolic, formData.respiratory_rate_per_min,
                formData.oxygen_saturation_percent, formData.blood_sugar_mg_dl, formData.weight_kg, formData.height_cm,
                formData.psychological_problem, formData.is_smoker ? 1 : 0, formData.has_allergies ? 1 : 0,
                formData.medication_allergies, formData.food_allergies, formData.other_allergies,
                formData.diet_type, formData.appetite, formData.has_git_problems ? 1 : 0, formData.has_weight_loss ? 1 : 0,
                formData.has_weight_gain ? 1 : 0, formData.feeding_status, formData.hygiene_status, formData.toileting_status,
                formData.ambulation_status, formData.uses_walker ? 1 : 0, formData.uses_wheelchair ? 1 : 0, formData.uses_transfer_device ? 1 : 0,
                formData.uses_other_equipment ? 1 : 0, formData.pain_intensity, formData.pain_location, formData.pain_frequency,
                formData.pain_character, formData.morse_total_score, formData.morse_risk_level, JSON.stringify(morseScaleData),
                JSON.stringify(pediatricFallRiskData), JSON.stringify(elderlyAssessmentData), formData.needs_medication_education ? 1 : 0, formData.needs_diet_nutrition_education ? 1 : 0,
                formData.needs_medical_equipment_education ? 1 : 0, formData.needs_rehabilitation_education ? 1 : 0,
                formData.needs_drug_interaction_education ? 1 : 0, formData.needs_pain_symptom_education ? 1 : 0,
                formData.needs_fall_prevention_education ? 1 : 0, formData.other_needs ? 1 : 0, signatureId, req.session.userId,
                new Date().toISOString()
            ];

            db.run(sql, values, function(err) {
                if (err) {
                    console.error('Error saving nurse assessment:', err.message);
                    console.error('SQL:', sql);
                    // show number of placeholders (matches number of ? in SQL)
                    const placeholderMatches = sql.match(/\?/g);
                    console.error('Number of placeholders in SQL:', placeholderMatches ? placeholderMatches.length : 0);
                    console.error('Number of values provided:', values.length);
                    return res.status(500).send('Error saving assessment: ' + err.message);
                }

                console.log('Nurse assessment saved successfully with ID:', existingAssessment ? existingAssessment.assessment_id : assessmentId);

                if (!existingAssessment) {
                    // Create form submission record if new
                    db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by, submission_status) VALUES (?, ?, ?, ?, ?)',
                        [submissionId, visitId, 'form-05-uuid', req.session.userId, isDraft ? 'draft' : 'submitted'], function(err) {
                            if (err) {
                                console.error('Error creating form submission:', err);
                            }
                        });
                }

                if (isDraft) {
                    res.redirect(`/nurse/assessment/${visitId}?saved=draft`);
                } else {
                    res.redirect('/nurse?notification=success&message=Nursing+assessment+submitted+successfully');
                }
            });
        }
    });

};
