const { requireAuth, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

function setupAdminRoutes(app) {
    // Dashboard
    app.get('/admin', requireAuth, requireRole('admin'), adminController.getDashboard);
    
    // User Management Routes
    app.get('/admin/users', requireAuth, requireRole('admin'), adminController.getUsers);
    app.get('/admin/users/new', requireAuth, requireRole('admin'), adminController.newUserForm);
    app.post('/admin/users', requireAuth, requireRole('admin'), adminController.createUser);
    app.get('/admin/users/:id/edit', requireAuth, requireRole('admin'), adminController.editUserForm);
    app.post('/admin/users/:id', requireAuth, requireRole('admin'), adminController.updateUser);
    app.post('/admin/users/:id/delete', requireAuth, requireRole('admin'), adminController.deleteUser);
    
    // Patient Management Routes
    app.get('/admin/patients', requireAuth, requireRole('admin'), adminController.getPatients);
    app.get('/admin/patients/new', requireAuth, requireRole('admin'), adminController.newPatientForm);
    app.post('/admin/patients', requireAuth, requireRole('admin'), adminController.createPatient);
    app.get('/admin/patients/:ssn/edit', requireAuth, requireRole('admin'), adminController.editPatientForm);
    app.post('/admin/patients/:ssn', requireAuth, requireRole('admin'), adminController.updatePatient);
    app.post('/admin/patients/:ssn/delete', requireAuth, requireRole('admin'), adminController.deletePatient);
    
    // Visit Management Routes
    app.get('/admin/visits', requireAuth, requireRole('admin'), adminController.getVisits);
    app.post('/admin/visits/:visitId/delete', requireAuth, requireRole('admin'), adminController.deleteVisit);
    app.get('/admin/visits/new', requireAuth, requireRole('admin'), adminController.newVisitForm);
    app.post('/admin/visits', requireAuth, requireRole('admin'), adminController.createVisit);
    app.get('/admin/visits/:visitId/edit', requireAuth, requireRole('admin'), adminController.editVisitForm);
    app.post('/admin/visits/:visitId', requireAuth, requireRole('admin'), adminController.updateVisit);
    
    // Assessment Management Routes
    app.get('/admin/assessments', requireAuth, requireRole('admin'), adminController.getAssessments);
    app.post('/admin/assessments/:assessmentId/delete', requireAuth, requireRole('admin'), adminController.deleteAssessment);
    app.get('/admin/assessments/:assessmentId', requireAuth, requireRole('admin'), adminController.getAssessmentDetail);
    app.get('/admin/visits/:visitId', requireAuth, requireRole('admin'), adminController.getVisitDetail);
    app.get('/admin/visits/:visitId/print', requireAuth, requireRole('admin'), adminController.printVisit);
}

module.exports = setupAdminRoutes;