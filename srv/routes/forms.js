const { requireAuth, requireRole } = require('../middleware/auth');
const formController = require('../controllers/formController');

function setupFormRoutes(app) {
    // Form submission routes
    app.post('/submit-nurse-form', requireAuth, requireRole('nurse'), formController.submitNurseForm);
    app.post('/submit-radiology-form', requireAuth, requireRole('physician'), formController.submitRadiologyForm);
}

module.exports = setupFormRoutes;