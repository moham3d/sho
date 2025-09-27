const db = require('../config/database');

class PatientService {
    // Get all patients with filters
    static getPatients(filters = {}) {
        return new Promise((resolve, reject) => {
            const { search, gender, date_from, date_to } = filters;

            let sql = `
                SELECT ssn, full_name, mobile_number, medical_number, date_of_birth, gender,
                       address, emergency_contact_name, emergency_contact_phone, created_at
                FROM patients
                WHERE 1=1
            `;

            const params = [];

            if (search) {
                sql += ` AND (full_name LIKE ? OR medical_number LIKE ? OR ssn LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (gender && gender !== 'all') {
                sql += ` AND gender = ?`;
                params.push(gender);
            }

            if (date_from) {
                sql += ` AND DATE(created_at) >= ?`;
                params.push(date_from);
            }

            if (date_to) {
                sql += ` AND DATE(created_at) <= ?`;
                params.push(date_to);
            }

            sql += ` ORDER BY created_at DESC`;

            db.all(sql, params, (err, patients) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(patients || []);
                }
            });
        });
    }

    // Get patient by SSN
    static getPatientBySSN(ssn) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT ssn, full_name, mobile_number, medical_number, date_of_birth, 
                       gender, address, emergency_contact_name, emergency_contact_phone, created_at
                FROM patients 
                WHERE ssn = ?
            `, [ssn], (err, patient) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(patient);
                }
            });
        });
    }

    // Create new patient
    static createPatient(patientData) {
        return new Promise((resolve, reject) => {
            const { 
                ssn, full_name, mobile_number, medical_number, date_of_birth, 
                gender, address, emergency_contact_name, emergency_contact_phone 
            } = patientData;

            db.run(`
                INSERT INTO patients (
                    ssn, full_name, mobile_number, medical_number, date_of_birth, 
                    gender, address, emergency_contact_name, emergency_contact_phone, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [ssn, full_name, mobile_number, medical_number, date_of_birth, 
                gender, address, emergency_contact_name, emergency_contact_phone], 
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ ssn: ssn });
                }
            });
        });
    }

    // Update patient
    static updatePatient(ssn, patientData) {
        return new Promise((resolve, reject) => {
            const { 
                full_name, mobile_number, medical_number, date_of_birth, 
                gender, address, emergency_contact_name, emergency_contact_phone 
            } = patientData;

            db.run(`
                UPDATE patients 
                SET full_name = ?, mobile_number = ?, medical_number = ?, date_of_birth = ?, 
                    gender = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ?
                WHERE ssn = ?
            `, [full_name, mobile_number, medical_number, date_of_birth, 
                gender, address, emergency_contact_name, emergency_contact_phone, ssn], 
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Delete patient
    static deletePatient(ssn) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM patients WHERE ssn = ?', [ssn], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Get patient count for dashboard
    static getPatientCount() {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM patients', [], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.count);
                }
            });
        });
    }

    // Search patients for API
    static searchPatients(query) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT ssn, full_name, medical_number, date_of_birth, gender
                FROM patients 
                WHERE full_name LIKE ? OR medical_number LIKE ? OR ssn LIKE ?
                ORDER BY full_name
                LIMIT 10
            `, [`%${query}%`, `%${query}%`, `%${query}%`], (err, patients) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(patients || []);
                }
            });
        });
    }

    // Get patients for dropdown
    static getPatientsForDropdown() {
        return new Promise((resolve, reject) => {
            db.all('SELECT ssn, full_name, medical_number FROM patients ORDER BY full_name', [], (err, patients) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(patients || []);
                }
            });
        });
    }
}

module.exports = PatientService;