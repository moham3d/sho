const NurseFormService = require('../services/nurseFormService');
const RadiologyFormService = require('../services/radiologyFormService');

const formController = {
    // Submit nurse form
    async submitNurseForm(req, res) {
        try {
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

            const result = await NurseFormService.submitForm(formData, req.session.userId, isDraft);

            if (result.error) {
                return res.status(result.status || 500).send(result.error);
            }

            // Redirect with success message
            const successMessage = isDraft ? 'Assessment saved as draft' : 'Assessment submitted successfully';
            res.redirect(`/nurse?notification=success&message=${encodeURIComponent(successMessage)}`);

        } catch (error) {
            console.error('Error submitting nurse form:', error);
            res.status(500).send('Error submitting form');
        }
    },

    // Submit radiology form
    async submitRadiologyForm(req, res) {
        try {
            const formData = req.body;

            console.log('Radiology form submitted - Physician signature present:', !!formData.physician_signature);
            console.log('Radiology form submitted - Patient signature present:', !!formData.patient_signature);
            console.log('Patient signature length:', formData.patient_signature ? formData.patient_signature.length : 0);

            if (!req.session.selectedVisit) {
                return res.status(400).send('No patient visit selected');
            }

            const result = await RadiologyFormService.submitForm(formData, req.session);

            if (result.error) {
                return res.status(result.status || 500).send(result.error);
            }

            // Clear session data
            req.session.selectedPatient = null;
            req.session.selectedVisit = null;

            // Redirect with success message
            res.redirect('/doctor?success=true&message=' + encodeURIComponent('Radiology assessment submitted successfully'));

        } catch (error) {
            console.error('Error submitting radiology form:', error);
            res.status(500).send('Error submitting radiology form');
        }
    }
};

module.exports = formController;