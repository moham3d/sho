const db = require('../config/database');

class SignatureService {
    // Save or update user signature
    static async saveUserSignature(userId, signatureData) {
        return new Promise((resolve, reject) => {
            // Check if user already has a signature
            db.get('SELECT signature_id FROM user_signatures WHERE user_id = ?', [userId], (err, existingSignature) => {
                if (err) {
                    console.error('Error checking existing signature:', err);
                    return reject(err);
                }

                const signatureId = existingSignature ? existingSignature.signature_id : 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                const signatureSql = existingSignature ?
                    'UPDATE user_signatures SET signature_data = ?, updated_at = CURRENT_TIMESTAMP WHERE signature_id = ?' :
                    'INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)';

                const signatureValues = existingSignature ?
                    [signatureData, signatureId] :
                    [signatureId, userId, signatureData];

                db.run(signatureSql, signatureValues, function(sigErr) {
                    if (sigErr) {
                        console.error('Error saving signature:', sigErr);
                        return reject(sigErr);
                    }
                    resolve(signatureId);
                });
            });
        });
    }

    // Save patient signature (for radiology forms)
    static async savePatientSignature(signatureData) {
        return new Promise((resolve, reject) => {
            const signatureId = 'pat-sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            db.run('INSERT INTO patient_signatures (signature_id, signature_data) VALUES (?, ?)', 
                [signatureId, signatureData], function(err) {
                if (err) {
                    console.error('Error saving patient signature:', err);
                    return reject(err);
                }
                resolve(signatureId);
            });
        });
    }

    // Get user signature
    static async getUserSignature(userId) {
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
}

module.exports = SignatureService;