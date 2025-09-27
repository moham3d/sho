const { requireAuth, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

function setupAdminRoutes(app) {
    app.get('/admin', requireAuth, requireRole('admin'), adminController.getAdminDashboard);
    // TODO: Add other admin routes
}

module.exports = setupAdminRoutes;