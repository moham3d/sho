const db = require('../config/database');

class AssessmentService {
    // Get all assessments with detailed information
    static getAssessments() {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    fs.submission_id, fs.visit_id, fs.form_id, fs.submission_status,
                    fs.submitted_at, fs.nurse_signature_id,
                    pv.patient_ssn, pv.visit_date, pv.visit_status,
                    p.full_name as patient_name, p.medical_number,
                    u.full_name as nurse_name,
                    'nursing' as assessment_type
                FROM form_submissions fs
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN user_signatures us ON fs.nurse_signature_id = us.signature_id
                LEFT JOIN users u ON us.user_id = u.user_id
                WHERE fs.form_id = 'form-05-uuid'

                UNION ALL

                SELECT
                    ra.assessment_id as submission_id, ra.visit_id, 'radiology-form' as form_id,
                    CASE WHEN ra.assessment_id IS NOT NULL THEN 'submitted' ELSE 'draft' END as submission_status,
                    ra.created_date as submitted_at, ra.physician_signature_id as nurse_signature_id,
                    pv.patient_ssn, pv.visit_date, pv.visit_status,
                    p.full_name as patient_name, p.medical_number,
                    u.full_name as nurse_name,
                    'radiology' as assessment_type
                FROM radiology_assessments ra
                JOIN patient_visits pv ON ra.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                LEFT JOIN users u ON us.user_id = u.user_id

                ORDER BY submitted_at DESC
            `, [], (err, assessments) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(assessments || []);
                }
            });
        });
    }

    // Get assessment by ID with detailed information
    static getAssessmentById(assessmentId) {
        return new Promise((resolve, reject) => {
            // First try to find in nursing assessments
            db.get(`
                SELECT
                    fs.submission_id, fs.visit_id, fs.form_id, fs.submission_status,
                    fs.submitted_at, fs.nurse_signature_id,
                    na.*,
                    pv.patient_ssn, pv.visit_date, pv.visit_status,
                    p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                    u.full_name as nurse_name,
                    'nursing' as assessment_type
                FROM form_submissions fs
                LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN user_signatures us ON fs.nurse_signature_id = us.signature_id
                LEFT JOIN users u ON us.user_id = u.user_id
                WHERE fs.submission_id = ?
            `, [assessmentId], (err, nursingAssessment) => {
                if (err) {
                    return reject(err);
                }

                if (nursingAssessment) {
                    return resolve(nursingAssessment);
                }

                // If not found in nursing, try radiology assessments
                db.get(`
                    SELECT
                        ra.assessment_id as submission_id, ra.visit_id, 'radiology-form' as form_id,
                        CASE WHEN ra.assessment_id IS NOT NULL THEN 'submitted' ELSE 'draft' END as submission_status,
                        ra.created_date as submitted_at, ra.physician_signature_id as nurse_signature_id,
                        ra.*,
                        pv.patient_ssn, pv.visit_date, pv.visit_status,
                        p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                        u.full_name as nurse_name,
                        'radiology' as assessment_type
                    FROM radiology_assessments ra
                    JOIN patient_visits pv ON ra.visit_id = pv.visit_id
                    JOIN patients p ON pv.patient_ssn = p.ssn
                    LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                    LEFT JOIN users u ON us.user_id = u.user_id
                    WHERE ra.assessment_id = ?
                `, [assessmentId], (err, radiologyAssessment) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(radiologyAssessment);
                    }
                });
            });
        });
    }

    // Delete assessment
    static deleteAssessment(assessmentId) {
        return new Promise((resolve, reject) => {
            // First try to delete from nursing assessments
            db.get('SELECT submission_id FROM form_submissions WHERE submission_id = ?', [assessmentId], (err, formSubmission) => {
                if (err) {
                    return reject(err);
                }

                if (formSubmission) {
                    // Delete nursing assessment
                    db.serialize(() => {
                        db.run('DELETE FROM nursing_assessments WHERE submission_id = ?', [assessmentId]);
                        db.run('DELETE FROM form_submissions WHERE submission_id = ?', [assessmentId], function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ changes: this.changes });
                            }
                        });
                    });
                } else {
                    // Try deleting radiology assessment
                    db.run('DELETE FROM radiology_assessments WHERE assessment_id = ?', [assessmentId], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ changes: this.changes });
                        }
                    });
                }
            });
        });
    }

    // Get assessment count for dashboard
    static getAssessmentCount() {
        return new Promise((resolve, reject) => {
            db.get('SELECT (SELECT COUNT(*) FROM nursing_assessments) + (SELECT COUNT(*) FROM radiology_assessments) as count', [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.count);
                }
            });
        });
    }

    // Get nurse's assessments
    static getNurseAssessments(userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    fs.submission_id, fs.visit_id, fs.form_id, fs.submission_status,
                    fs.submitted_at, fs.nurse_signature_id,
                    pv.patient_ssn, pv.visit_date, pv.visit_status,
                    p.full_name as patient_name, p.medical_number,
                    'nursing' as assessment_type
                FROM form_submissions fs
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN user_signatures us ON fs.nurse_signature_id = us.signature_id
                WHERE us.user_id = ? AND fs.form_id = 'form-05-uuid'
                ORDER BY fs.submitted_at DESC
            `, [userId], (err, assessments) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(assessments || []);
                }
            });
        });
    }
}

module.exports = AssessmentService;