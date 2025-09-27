const db = require('../config/database');
const SignatureService = require('./signatureService');

class RadiologyFormService {
    static async submitForm(formData, session) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!session.selectedVisit) {
                    return resolve({
                        error: 'No patient visit selected',
                        status: 400
                    });
                }

                // Set conditional fields to null if not applicable
                if (!formData.swelling) formData.swelling_location = null;
                if (!formData.tumor_history) formData.tumor_location_type = null;
                if (!formData.has_chemotherapy) {
                    formData.chemo_type = null;
                    formData.chemo_sessions = null;
                }
                if (!formData.has_radiotherapy) {
                    formData.radiotherapy_site = null;
                    formData.radiotherapy_sessions = null;
                }
                if (!formData.pain_numbness || formData.pain_numbness.trim() === '') {
                    formData.pain_numbness_location = null;
                }

                // Handle signature storage
                const physicianSignatureData = formData.physician_signature;
                const patientSignatureData = formData.patient_signature;
                
                if (!physicianSignatureData || physicianSignatureData === '') {
                    return resolve({
                        error: 'Physician signature is required',
                        status: 400
                    });
                }

                if (!patientSignatureData || patientSignatureData === '') {
                    return resolve({
                        error: 'Patient signature is required',
                        status: 400
                    });
                }

                // Save signatures
                const physicianSignatureId = await SignatureService.saveUserSignature(session.userId, physicianSignatureData);
                const patientSignatureId = await SignatureService.savePatientSignature(patientSignatureData);

                // Proceed with radiology submission
                const result = await this.proceedWithRadiologySubmission(formData, physicianSignatureId, patientSignatureId, session);
                resolve(result);

            } catch (error) {
                reject(error);
            }
        });
    }

    static async proceedWithRadiologySubmission(formData, physicianSignatureId, patientSignatureId, session) {
        return new Promise((resolve, reject) => {
            // Generate UUID-like string
            const radiologyId = 'radio-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Insert into radiology_assessments with essential fields
            const sql = `
                INSERT INTO radiology_assessments (
                    assessment_id, visit_id, patient_consent, examination_type, clinical_history,
                    swelling, swelling_location, tumor_history, tumor_location_type,
                    has_chemotherapy, chemo_type, chemo_sessions, has_radiotherapy,
                    radiotherapy_site, radiotherapy_sessions, pain_numbness, pain_numbness_location,
                    chief_complaint, additional_notes, physician_signature_id, patient_signature_id,
                    created_date, submission_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
            `;

            const values = [
                radiologyId,
                session.selectedVisit.visit_id,
                formData.patient_consent || '',
                formData.examination_type || '',
                formData.clinical_history || '',
                formData.swelling ? 1 : 0,
                formData.swelling_location,
                formData.tumor_history ? 1 : 0,
                formData.tumor_location_type,
                formData.has_chemotherapy ? 1 : 0,
                formData.chemo_type,
                parseInt(formData.chemo_sessions) || null,
                formData.has_radiotherapy ? 1 : 0,
                formData.radiotherapy_site,
                parseInt(formData.radiotherapy_sessions) || null,
                formData.pain_numbness || '',
                formData.pain_numbness_location,
                formData.chief_complaint || '',
                formData.additional_notes || '',
                physicianSignatureId,
                patientSignatureId,
                submissionId
            ];

            db.run(sql, values, function(err) {
                if (err) {
                    console.error('Error creating radiology assessment:', err);
                    return reject(err);
                }

                console.log('Radiology assessment created successfully with ID:', radiologyId);

                // Create form submission record
                db.run(`
                    INSERT INTO form_submissions (
                        submission_id, visit_id, form_id, submission_status, 
                        nurse_signature_id, submitted_at
                    ) VALUES (?, ?, 'radiology-form', 'submitted', ?, datetime('now'))
                `, [submissionId, session.selectedVisit.visit_id, physicianSignatureId], function(formErr) {
                    if (formErr) {
                        console.error('Error creating form submission record:', formErr);
                        // Continue anyway as the main assessment was created
                    }

                    resolve({ success: true });
                });
            });
        });
    }
}

module.exports = RadiologyFormService;