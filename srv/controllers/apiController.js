const PatientService = require('../services/patientService');

const apiController = {
    // Search patients API endpoint
    async searchPatients(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 2) {
                return res.json([]);
            }

            const patients = await PatientService.searchPatients(q);
            res.json(patients);
        } catch (error) {
            console.error('Patient search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
};

module.exports = apiController;