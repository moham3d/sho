const { requireAuth, requireRole } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

function setupDoctorRoutes(app) {
    // Doctor Dashboard
    app.get('/doctor', requireAuth, requireRole('physician'), doctorController.getDashboard);
    
    // Start radiology assessment
    app.post('/doctor/start-radiology/:visitId', requireAuth, requireRole('physician'), doctorController.startRadiology);
    
    // Patient search
    app.post('/doctor/search-patient', requireAuth, requireRole('physician'), doctorController.searchPatient);
    
    // Radiology form
    app.get('/radiology-form', requireAuth, requireRole('physician'), doctorController.getRadiologyForm);
}

module.exports = setupDoctorRoutes;