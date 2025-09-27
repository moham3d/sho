const db = require('../config/database');

class VisitService {
    // Get all visits with filters
    static getVisits(filters = {}) {
        return new Promise((resolve, reject) => {
            const { search, status, department, date_from, date_to } = filters;

            let sql = `
                SELECT
                    pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                    pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                    pv.visit_type, pv.department, pv.created_at, pv.completed_at,
                    p.full_name as patient_name, p.medical_number,
                    u.full_name as created_by_name,
                    (SELECT COUNT(*) FROM form_submissions fs WHERE fs.visit_id = pv.visit_id) as assessment_count
                FROM patient_visits pv
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN users u ON pv.created_by = u.user_id
                WHERE 1=1
            `;

            const params = [];

            if (search) {
                sql += ` AND (p.full_name LIKE ? OR p.medical_number LIKE ? OR pv.patient_ssn LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (status && status !== 'all') {
                sql += ` AND pv.visit_status = ?`;
                params.push(status);
            }

            if (department && department !== 'all') {
                sql += ` AND pv.department = ?`;
                params.push(department);
            }

            if (date_from) {
                sql += ` AND DATE(pv.visit_date) >= ?`;
                params.push(date_from);
            }

            if (date_to) {
                sql += ` AND DATE(pv.visit_date) <= ?`;
                params.push(date_to);
            }

            sql += ` ORDER BY pv.visit_date DESC, pv.created_at DESC`;

            db.all(sql, params, (err, visits) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visits || []);
                }
            });
        });
    }

    // Get visit by ID with detailed information
    static getVisitById(visitId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT
                    pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                    pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                    pv.visit_type, pv.department, pv.created_at, pv.completed_at,
                    p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                    u.full_name as created_by_name
                FROM patient_visits pv
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN users u ON pv.created_by = u.user_id
                WHERE pv.visit_id = ?
            `, [visitId], (err, visit) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visit);
                }
            });
        });
    }

    // Create new visit
    static createVisit(visitData) {
        return new Promise((resolve, reject) => {
            const { 
                patient_ssn, visit_date, visit_type, department, 
                primary_diagnosis, secondary_diagnosis, diagnosis_code, created_by 
            } = visitData;

            // Generate visit ID
            const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            db.run(`
                INSERT INTO patient_visits (
                    visit_id, patient_ssn, visit_date, visit_type, department,
                    primary_diagnosis, secondary_diagnosis, diagnosis_code,
                    visit_status, created_by, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, datetime('now'))
            `, [visitId, patient_ssn, visit_date, visit_type, department, 
                primary_diagnosis, secondary_diagnosis, diagnosis_code, created_by], 
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ visitId: visitId });
                }
            });
        });
    }

    // Update visit
    static updateVisit(visitId, visitData) {
        return new Promise((resolve, reject) => {
            const { 
                visit_date, visit_type, department, visit_status,
                primary_diagnosis, secondary_diagnosis, diagnosis_code 
            } = visitData;

            let updateData = {};
            if (visit_status === 'completed') {
                updateData.completed_at = 'datetime("now")';
            }

            db.run(`
                UPDATE patient_visits 
                SET visit_date = ?, visit_type = ?, department = ?, visit_status = ?,
                    primary_diagnosis = ?, secondary_diagnosis = ?, diagnosis_code = ?
                    ${visit_status === 'completed' ? ', completed_at = datetime("now")' : ''}
                WHERE visit_id = ?
            `, [visit_date, visit_type, department, visit_status, 
                primary_diagnosis, secondary_diagnosis, diagnosis_code, visitId], 
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Delete visit and all related data
    static deleteVisit(visitId) {
        return new Promise((resolve, reject) => {
            // Start transaction-like operations
            db.serialize(() => {
                db.run('DELETE FROM radiology_assessments WHERE visit_id = ?', [visitId]);
                db.run('DELETE FROM nursing_assessments WHERE visit_id IN (SELECT submission_id FROM form_submissions WHERE visit_id = ?)', [visitId]);
                db.run('DELETE FROM form_submissions WHERE visit_id = ?', [visitId]);
                db.run('DELETE FROM patient_visits WHERE visit_id = ?', [visitId], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
            });
        });
    }

    // Get visit count for dashboard
    static getVisitCount() {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM patient_visits', [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.count);
                }
            });
        });
    }

    // Get visits for nurse dashboard
    static getNurseVisits(userId) {
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
                LIMIT 5
            `, [userId], (err, visits) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(visits || []);
                }
            });
        });
    }

    // Get visit with assessments for printing
    static getVisitForPrint(visitId) {
        return new Promise((resolve, reject) => {
            // Get visit details
            this.getVisitById(visitId).then(visit => {
                if (!visit) {
                    return reject(new Error('Visit not found'));
                }

                // Get nursing assessment
                db.get(`
                    SELECT na.*, fs.*, us.full_name as nurse_name
                    FROM form_submissions fs
                    LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
                    LEFT JOIN user_signatures us ON fs.nurse_signature_id = us.signature_id
                    WHERE fs.visit_id = ? AND fs.form_id = 'form-05-uuid'
                `, [visitId], (err, nursingAssessment) => {
                    if (err) {
                        return reject(err);
                    }

                    // Get radiology assessment
                    db.get(`
                        SELECT ra.*, fs.*, us.full_name as physician_name
                        FROM form_submissions fs
                        LEFT JOIN radiology_assessments ra ON ra.submission_id = fs.submission_id
                        LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                        WHERE fs.visit_id = ?
                    `, [visitId], (err, radiologyAssessment) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve({
                            visit: visit,
                            nursingAssessment: nursingAssessment || null,
                            radiologyAssessment: radiologyAssessment || null
                        });
                    });
                });
            }).catch(reject);
        });
    }
}

module.exports = VisitService;