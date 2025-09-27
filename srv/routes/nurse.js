const { requireAuth, requireRole } = require('../middleware/auth');
const nurseController = require('../controllers/nurseController');

function setupNurseRoutes(app) {
    // Nurse Dashboard
    app.get('/nurse', requireAuth, requireRole('nurse'), nurseController.getDashboard);
    
    // Nurse Assessment Management
    app.get('/nurse/my-assessments', requireAuth, requireRole('nurse'), nurseController.getMyAssessments);
    
    // Patient Search
    app.get('/nurse/search-patient', requireAuth, requireRole('nurse'), nurseController.searchPatientForm);
    app.post('/nurse/search-patient', requireAuth, requireRole('nurse'), nurseController.searchPatient);
    
    // Patient Management
    app.get('/nurse/add-patient', requireAuth, requireRole('nurse'), nurseController.addPatientForm);
    app.post('/nurse/add-patient', requireAuth, requireRole('nurse'), nurseController.createPatient);
    
    // Assessment Form
    app.get('/nurse/assessment/:visitId', requireAuth, requireRole('nurse'), nurseController.getAssessmentForm);
}

module.exports = setupNurseRoutes;