const { requireAuth } = require('../middleware/auth');
const apiController = require('../controllers/apiController');

function setupApiRoutes(app) {
    // Patient search API
    app.get('/api/patients/search', requireAuth, apiController.searchPatients);
}

module.exports = setupApiRoutes;