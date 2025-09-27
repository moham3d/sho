const PatientService = require('../services/patientService');
const VisitService = require('../services/visitService');
const AssessmentService = require('../services/assessmentService');
const NotificationService = require('../services/notificationService');
const db = require('../config/database');

const nurseController = {
    // Nurse Dashboard
    async getDashboard(req, res) {
        try {
            // Handle notification from query parameters
            const notification = req.query.notification ? {
                type: req.query.notification,
                message: req.query.message ? decodeURIComponent(req.query.message) : ''
            } : null;

            const currentVisits = await VisitService.getNurseVisits(req.session.userId);

            res.render('nurse-dashboard', {
                user: req.session,
                currentVisits: currentVisits,
                notification: notification
            });
        } catch (error) {
            console.error('Error getting nurse dashboard:', error);
            res.render('nurse-dashboard', {
                user: req.session,
                currentVisits: [],
                notification: { type: 'error', message: 'Error loading dashboard' }
            });
        }
    },

    // Get nurse's assessments
    async getMyAssessments(req, res) {
        try {
            const assessments = await AssessmentService.getNurseAssessments(req.session.userId);

            res.render('nurse-assessments', {
                user: req.session,
                visits: assessments
            });
        } catch (error) {
            console.error('Error getting nurse assessments:', error);
            res.status(500).send('Database error');
        }
    },

    // Search patient form
    async searchPatientForm(req, res) {
        try {
            // Get nurse's current visits with assessment status
            const currentVisits = await this.getNurseCurrentVisits(req.session.userId);

            res.render('patient-search', {
                user: req.session,
                patient: null,
                error: null,
                visitId: null,
                currentVisits: currentVisits
            });
        } catch (error) {
            console.error('Error getting nurse visits:', error);
            res.render('patient-search', {
                user: req.session,
                patient: null,
                error: 'Error loading page',
                visitId: null,
                currentVisits: []
            });
        }
    },

    // Search patient
    async searchPatient(req, res) {
        try {
            const { ssn } = req.body;

            // Validate SSN format
            if (!ssn || !/^\d{14}$/.test(ssn)) {
                const currentVisits = await this.getNurseCurrentVisits(req.session.userId);
                return res.render('patient-search', {
                    user: req.session,
                    patient: null,
                    error: 'Please enter a valid 14-digit SSN',
                    visitId: null,
                    currentVisits: currentVisits
                });
            }

            // Get current visits for the template
            const currentVisits = await this.getNurseCurrentVisits(req.session.userId);

            const patient = await PatientService.getPatientBySSN(ssn);

            if (!patient) {
                return res.render('patient-search', {
                    user: req.session,
                    patient: null,
                    error: 'Patient not found',
                    visitId: null,
                    currentVisits: currentVisits
                });
            }

            // Check if there's an active visit for this patient created by this nurse
            const activeVisit = await this.getActiveVisitForPatient(ssn, req.session.userId);

            if (activeVisit) {
                return res.render('patient-search', {
                    user: req.session,
                    patient: patient,
                    error: null,
                    visitId: activeVisit.visit_id,
                    currentVisits: currentVisits
                });
            }

            // No active visit - show patient but no visit ID
            res.render('patient-search', {
                user: req.session,
                patient: patient,
                error: null,
                visitId: null,
                currentVisits: currentVisits
            });

        } catch (error) {
            console.error('Database error:', error);
            const currentVisits = await this.getNurseCurrentVisits(req.session.userId).catch(() => []);
            res.render('patient-search', {
                user: req.session,
                patient: null,
                error: 'Database error',
                visitId: null,
                currentVisits: currentVisits
            });
        }
    },

    // Add patient form
    addPatientForm(req, res) {
        res.render('add-patient', { user: req.session });
    },

    // Create patient
    async createPatient(req, res) {
        try {
            const patientData = req.body;

            // Basic validation
            if (!patientData.ssn || !patientData.full_name || !patientData.medical_number) {
                return res.status(400).send('SSN, full name, and medical number are required');
            }

            await PatientService.createPatient(patientData);

            // Redirect with success notification
            res.redirect('/nurse/search-patient?notification=success&message=' + 
                encodeURIComponent('Patient added successfully'));
        } catch (error) {
            console.error('Error creating patient:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).send('SSN or medical number already exists');
            }
            res.status(500).send('Error creating patient');
        }
    },

    // Get assessment form
    async getAssessmentForm(req, res) {
        try {
            const visitId = req.params.visitId;

            // Get visit and patient info
            const visit = await this.getVisitWithPatientInfo(visitId, req.session.userId);
            
            if (!visit) {
                return res.status(404).send('Visit not found');
            }

            // Get user's signature
            const userSignature = await this.getUserSignature(req.session.userId);

            // Check if assessment exists and get submission status
            const assessmentData = await this.getAssessmentData(visitId);

            const assessment = assessmentData ? assessmentData : null;
            const isDraft = assessmentData ? assessmentData.submission_status === 'draft' : false;
            const isCompleted = assessmentData ? assessmentData.submission_status === 'submitted' : false;
            const assessmentSignature = assessmentData ? assessmentData.assessment_signature : null;

            res.render('nurse-form', {
                user: req.session,
                visit: visit,
                assessment: assessment,
                isDraft: isDraft,
                isCompleted: isCompleted,
                assessmentSignature: assessmentSignature,
                userSignature: userSignature ? userSignature.signature_data : null
            });
        } catch (error) {
            console.error('Error getting assessment form:', error);
            res.status(500).send('Error loading assessment form');
        }
    },

    // Helper methods
    async getNurseCurrentVisits(userId) {
        return new Promise((resolve, reject) => {
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
            `, [userId], (err, visits) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visits || []);
                }
            });
        });
    },

    async getActiveVisitForPatient(ssn, userId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT visit_id, visit_status
                FROM patient_visits
                WHERE patient_ssn = ? AND created_by = ? AND visit_status IN ('open', 'in_progress')
                ORDER BY created_at DESC
                LIMIT 1
            `, [ssn, userId], (err, visit) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visit);
                }
            });
        });
    },

    async getVisitWithPatientInfo(visitId, userId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT pv.*, p.full_name, p.mobile_number, p.medical_number, p.date_of_birth, p.gender,
                       p.phone_number, p.address, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation
                FROM patient_visits pv
                JOIN patients p ON pv.patient_ssn = p.ssn
                WHERE pv.visit_id = ? AND pv.created_by = ?
            `, [visitId, userId], (err, visit) => {
                if (err) {
                    reject(err);
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
    },

    async getAssessmentData(visitId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT na.*, fs.submission_status, us.signature_data as assessment_signature
                FROM nursing_assessments na
                JOIN form_submissions fs ON na.submission_id = fs.submission_id
                LEFT JOIN user_signatures us ON na.nurse_signature_id = us.signature_id
                WHERE fs.visit_id = ?
            `, [visitId], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
};

module.exports = nurseController;