const PatientService = require('../services/patientService');
const VisitService = require('../services/visitService');
const db = require('../config/database');

const doctorController = {
    // Doctor Dashboard
    async getDashboard(req, res) {
        try {
            // Get completed nursing assessments that are ready for radiology assessment
            // Only show patients who don't have a radiology assessment yet
            const completedAssessments = await this.getCompletedNursingAssessments();

            res.render('doctor-dashboard', { 
                user: req.session, 
                message: null,
                completedAssessments: completedAssessments || []
            });
        } catch (error) {
            console.error('Error fetching completed nursing assessments:', error);
            res.render('doctor-dashboard', { 
                user: req.session, 
                message: 'Error loading patient queue',
                completedAssessments: []
            });
        }
    },

    // Start radiology assessment
    async startRadiology(req, res) {
        try {
            const visitId = req.params.visitId;

            // Get visit and patient info
            const visit = await this.getVisitWithPatientInfo(visitId);
            
            if (!visit) {
                return res.status(404).send('Visit not found');
            }

            // Store in session for radiology form access
            req.session.selectedPatient = {
                ssn: visit.patient_ssn,
                full_name: visit.full_name,
                mobile_number: visit.mobile_number,
                medical_number: visit.medical_number,
                date_of_birth: visit.date_of_birth,
                gender: visit.gender,
                phone_number: visit.phone_number,
                address: visit.address,
                emergency_contact_name: visit.emergency_contact_name,
                emergency_contact_phone: visit.emergency_contact_phone,
                emergency_contact_relation: visit.emergency_contact_relation
            };

            req.session.selectedVisit = {
                visit_id: visit.visit_id,
                visit_date: visit.visit_date,
                visit_status: visit.visit_status,
                primary_diagnosis: visit.primary_diagnosis,
                secondary_diagnosis: visit.secondary_diagnosis,
                diagnosis_code: visit.diagnosis_code,
                visit_type: visit.visit_type,
                department: visit.department
            };

            res.redirect('/radiology-form');
        } catch (error) {
            console.error('Error starting radiology assessment:', error);
            res.status(500).send('Error starting radiology assessment');
        }
    },

    // Search patient
    async searchPatient(req, res) {
        try {
            const { ssn } = req.body;

            // Validate SSN format
            if (!ssn || !/^\d{14}$/.test(ssn)) {
                return res.render('doctor-dashboard', { 
                    user: req.session, 
                    patient: null, 
                    error: 'Please enter a valid 14-digit SSN',
                    completedAssessments: []
                });
            }

            const patient = await PatientService.getPatientBySSN(ssn);

            if (!patient) {
                return res.render('doctor-dashboard', { 
                    user: req.session, 
                    patient: null, 
                    error: 'Patient not found. Please ensure the patient is registered.',
                    completedAssessments: []
                });
            }

            // Store patient in session for radiology form access
            req.session.selectedPatient = patient;

            // Check for current visit or create new one
            const visit = await this.getOrCreateVisitForPatient(ssn, req.session.userId);

            if (visit.error) {
                return res.render('doctor-dashboard', { 
                    user: req.session, 
                    patient: patient, 
                    error: visit.error,
                    completedAssessments: []
                });
            }

            req.session.selectedVisit = visit;
            res.render('doctor-dashboard', { 
                user: req.session, 
                patient: patient, 
                error: null,
                completedAssessments: []
            });

        } catch (error) {
            console.error('Database error:', error);
            res.render('doctor-dashboard', { 
                user: req.session, 
                patient: null, 
                error: 'Database error',
                completedAssessments: []
            });
        }
    },

    // Get radiology form
    async getRadiologyForm(req, res) {
        try {
            if (!req.session.selectedPatient || !req.session.selectedVisit) {
                return res.redirect('/doctor');
            }

            // Get user's signature
            const userSignature = await this.getUserSignature(req.session.userId);

            res.render('radiology-form', {
                user: req.session,
                patient: req.session.selectedPatient,
                visit: req.session.selectedVisit,
                userSignature: userSignature ? userSignature.signature_data : null
            });
        } catch (error) {
            console.error('Error getting radiology form:', error);
            res.status(500).send('Error loading radiology form');
        }
    },

    // Helper methods
    async getCompletedNursingAssessments() {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    na.assessment_id,
                    pv.visit_id,
                    p.full_name as patient_name,
                    p.ssn,
                    p.medical_number,
                    pv.visit_date,
                    na.chief_complaint,
                    pv.primary_diagnosis,
                    na.assessed_at,
                    u.full_name as nurse_name
                FROM nursing_assessments na
                JOIN form_submissions fs ON na.submission_id = fs.submission_id
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN users u ON na.assessed_by = u.user_id
                WHERE fs.submission_status = 'submitted'
                AND NOT EXISTS (
                    SELECT 1 FROM radiology_assessments ra
                    JOIN form_submissions fs2 ON ra.submission_id = fs2.submission_id
                    WHERE fs2.visit_id = pv.visit_id
                )
                ORDER BY na.assessed_at ASC
                LIMIT 20
            `, [], (err, assessments) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(assessments);
                }
            });
        });
    },

    async getVisitWithPatientInfo(visitId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT pv.*, p.full_name, p.mobile_number, p.medical_number, p.date_of_birth, p.gender,
                       p.phone_number, p.address, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation
                FROM patient_visits pv
                JOIN patients p ON pv.patient_ssn = p.ssn
                WHERE pv.visit_id = ?
            `, [visitId], (err, visit) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visit);
                }
            });
        });
    },

    async getOrCreateVisitForPatient(ssn, userId) {
        return new Promise((resolve, reject) => {
            // Check for current visit
            db.get('SELECT * FROM patient_visits WHERE patient_ssn = ? ORDER BY created_at DESC LIMIT 1', [ssn], (err, visit) => {
                if (err) {
                    console.error('Error checking visits:', err);
                    return resolve({ error: 'Error checking patient visits' });
                }

                if (!visit) {
                    // Create new visit
                    const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                        [visitId, ssn, userId], function(err) {
                            if (err) {
                                console.error('Error creating visit:', err);
                                return resolve({ error: 'Error creating visit' });
                            }
                            resolve({ visit_id: visitId });
                        });
                } else {
                    resolve(visit);
                }
            });
        });
    },

    async getUserSignature(userId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT signature_data FROM user_signatures WHERE user_id = ?', [userId], (err, signature) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(signature);
                }
            });
        });
    }
};

module.exports = doctorController;