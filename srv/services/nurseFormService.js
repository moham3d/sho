const db = require('../config/database');
const SignatureService = require('./signatureService');

class NurseFormService {
    static async submitForm(formData, userId, isDraft) {
        return new Promise(async (resolve, reject) => {
            try {
                const visitId = formData.visit_id;

                // Check if assessment already exists
                const existingAssessment = await this.getExistingAssessment(visitId);

                // Prevent updates to completed assessments
                if (existingAssessment && existingAssessment.submission_status === 'submitted') {
                    return resolve({
                        error: 'This assessment has been completed and cannot be modified. Please contact an administrator if changes are needed.',
                        status: 403
                    });
                }

                // Handle signature storage - only required for final submissions
                const signatureData = formData.nurse_signature;
                if (!isDraft && (!signatureData || signatureData === '')) {
                    return resolve({
                        error: 'Signature is required for final submission',
                        status: 400
                    });
                }

                let signatureId = null;
                if (!isDraft) {
                    signatureId = await SignatureService.saveUserSignature(userId, signatureData);
                }

                // Proceed with form submission
                const result = await this.proceedWithFormSubmission(formData, signatureId, existingAssessment, isDraft);
                resolve(result);

            } catch (error) {
                reject(error);
            }
        });
    }

    static async getExistingAssessment(visitId) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT na.*, fs.submission_id, fs.submission_status 
                FROM nursing_assessments na 
                JOIN form_submissions fs ON na.submission_id = fs.submission_id 
                WHERE fs.visit_id = ?
            `, [visitId], (err, assessment) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(assessment);
                }
            });
        });
    }

    static async proceedWithFormSubmission(formData, signatureId, existingAssessment, isDraft) {
        return new Promise((resolve, reject) => {
            const visitId = formData.visit_id;
            const submissionId = existingAssessment ? existingAssessment.submission_id : 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const assessmentId = existingAssessment ? existingAssessment.assessment_id : 'nurse-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Prepare assessment data with essential fields
            const assessmentData = this.prepareAssessmentData(formData, signatureId);

            db.serialize(() => {
                if (existingAssessment) {
                    // Update existing assessment
                    this.updateExistingAssessment(assessmentId, assessmentData, isDraft, resolve, reject);
                } else {
                    // Create new assessment
                    this.createNewAssessment(visitId, submissionId, assessmentId, assessmentData, isDraft, resolve, reject);
                }
            });
        });
    }

    static prepareAssessmentData(formData, signatureId) {
        // Prepare fall risk assessment data
        const morseScaleData = {
            history_falling: formData.morse_history_falling || 0,
            secondary_diagnosis: formData.morse_secondary_diagnosis || 0,
            ambulatory_aid: formData.morse_ambulatory_aid || 0,
            iv_therapy: formData.morse_iv_therapy || 0,
            gait: formData.morse_gait || 0,
            mental_status: formData.morse_mental_status || 0,
            total_score: parseInt(formData.morse_total_score) || 0,
            risk_level: formData.morse_risk_level || 'Low Risk'
        };

        return {
            mode_of_arrival: formData.mode_of_arrival || '',
            age: parseInt(formData.age) || 0,
            chief_complaint: formData.chief_complaint || '',
            accompanied_by: formData.accompanied_by || '',
            language_spoken: formData.language_spoken || '',
            temperature_celsius: parseFloat(formData.temperature_celsius) || null,
            pulse_bpm: parseInt(formData.pulse_bpm) || null,
            blood_pressure_systolic: parseInt(formData.blood_pressure_systolic) || null,
            blood_pressure_diastolic: parseInt(formData.blood_pressure_diastolic) || null,
            respiratory_rate_per_min: parseInt(formData.respiratory_rate_per_min) || null,
            oxygen_saturation_percent: parseFloat(formData.oxygen_saturation_percent) || null,
            blood_sugar_mg_dl: parseInt(formData.blood_sugar_mg_dl) || null,
            weight_kg: parseFloat(formData.weight_kg) || null,
            height_cm: parseInt(formData.height_cm) || null,
            psychological_problem: formData.psychological_problem || '',
            is_smoker: formData.is_smoker ? 1 : 0,
            has_allergies: formData.has_allergies ? 1 : 0,
            medication_allergies: formData.medication_allergies || '',
            food_allergies: formData.food_allergies || '',
            other_allergies: formData.other_allergies || '',
            diet_type: formData.diet_type || '',
            appetite: formData.appetite || '',
            morse_total_score: morseScaleData.total_score,
            morse_risk_level: morseScaleData.risk_level,
            morse_scale: JSON.stringify(morseScaleData),
            nurse_signature_id: signatureId,
            general_condition: formData.general_condition || '',
            assessed_by: formData.assessed_by || null,
            assessed_at: new Date().toISOString()
        };
    }

    static updateExistingAssessment(assessmentId, assessmentData, isDraft, resolve, reject) {
        const updateSql = `UPDATE nursing_assessments SET
            mode_of_arrival = ?, age = ?, chief_complaint = ?, accompanied_by = ?, language_spoken = ?,
            temperature_celsius = ?, pulse_bpm = ?, blood_pressure_systolic = ?, blood_pressure_diastolic = ?,
            respiratory_rate_per_min = ?, oxygen_saturation_percent = ?, blood_sugar_mg_dl = ?,
            weight_kg = ?, height_cm = ?, psychological_problem = ?, is_smoker = ?, has_allergies = ?,
            medication_allergies = ?, food_allergies = ?, other_allergies = ?, diet_type = ?, appetite = ?,
            morse_total_score = ?, morse_risk_level = ?, morse_scale = ?, nurse_signature_id = ?,
            general_condition = ?, assessed_by = ?, assessed_at = ?
            WHERE assessment_id = ?`;

        const updateValues = [
            assessmentData.mode_of_arrival, assessmentData.age, assessmentData.chief_complaint,
            assessmentData.accompanied_by, assessmentData.language_spoken, assessmentData.temperature_celsius,
            assessmentData.pulse_bpm, assessmentData.blood_pressure_systolic, assessmentData.blood_pressure_diastolic,
            assessmentData.respiratory_rate_per_min, assessmentData.oxygen_saturation_percent, assessmentData.blood_sugar_mg_dl,
            assessmentData.weight_kg, assessmentData.height_cm, assessmentData.psychological_problem,
            assessmentData.is_smoker, assessmentData.has_allergies, assessmentData.medication_allergies,
            assessmentData.food_allergies, assessmentData.other_allergies, assessmentData.diet_type,
            assessmentData.appetite, assessmentData.morse_total_score, assessmentData.morse_risk_level,
            assessmentData.morse_scale, assessmentData.nurse_signature_id, assessmentData.general_condition,
            assessmentData.assessed_by, assessmentData.assessed_at, assessmentId
        ];

        db.run(updateSql, updateValues, function(err) {
            if (err) {
                console.error('Error updating nursing assessment:', err);
                return reject(err);
            }

            // Update form submission status
            const submissionStatus = isDraft ? 'draft' : 'submitted';
            db.run('UPDATE form_submissions SET submission_status = ? WHERE submission_id IN (SELECT submission_id FROM nursing_assessments WHERE assessment_id = ?)',
                [submissionStatus, assessmentId], function(submitErr) {
                    if (submitErr) {
                        console.error('Error updating submission status:', submitErr);
                        return reject(submitErr);
                    }
                    resolve({ success: true });
                });
        });
    }

    static createNewAssessment(visitId, submissionId, assessmentId, assessmentData, isDraft, resolve, reject) {
        // First create form submission
        const submissionStatus = isDraft ? 'draft' : 'submitted';
        db.run(`
            INSERT INTO form_submissions (submission_id, visit_id, form_id, submission_status, nurse_signature_id, submitted_at)
            VALUES (?, ?, 'form-05-uuid', ?, ?, datetime('now'))
        `, [submissionId, visitId, submissionStatus, assessmentData.nurse_signature_id], function(err) {
            if (err) {
                console.error('Error creating form submission:', err);
                return reject(err);
            }

            // Then create nursing assessment
            const insertSql = `INSERT INTO nursing_assessments (
                assessment_id, submission_id, mode_of_arrival, age, chief_complaint, accompanied_by, language_spoken,
                temperature_celsius, pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
                respiratory_rate_per_min, oxygen_saturation_percent, blood_sugar_mg_dl, weight_kg, height_cm,
                psychological_problem, is_smoker, has_allergies, medication_allergies, food_allergies, other_allergies,
                diet_type, appetite, morse_total_score, morse_risk_level, morse_scale, nurse_signature_id,
                general_condition, assessed_by, assessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const insertValues = [
                assessmentId, submissionId, assessmentData.mode_of_arrival, assessmentData.age,
                assessmentData.chief_complaint, assessmentData.accompanied_by, assessmentData.language_spoken,
                assessmentData.temperature_celsius, assessmentData.pulse_bpm, assessmentData.blood_pressure_systolic,
                assessmentData.blood_pressure_diastolic, assessmentData.respiratory_rate_per_min,
                assessmentData.oxygen_saturation_percent, assessmentData.blood_sugar_mg_dl, assessmentData.weight_kg,
                assessmentData.height_cm, assessmentData.psychological_problem, assessmentData.is_smoker,
                assessmentData.has_allergies, assessmentData.medication_allergies, assessmentData.food_allergies,
                assessmentData.other_allergies, assessmentData.diet_type, assessmentData.appetite,
                assessmentData.morse_total_score, assessmentData.morse_risk_level, assessmentData.morse_scale,
                assessmentData.nurse_signature_id, assessmentData.general_condition, assessmentData.assessed_by,
                assessmentData.assessed_at
            ];

            db.run(insertSql, insertValues, function(insertErr) {
                if (insertErr) {
                    console.error('Error creating nursing assessment:', insertErr);
                    return reject(insertErr);
                }
                resolve({ success: true });
            });
        });
    }
}

module.exports = NurseFormService;