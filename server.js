const { app, PORT } = require('./srv/config/app');
const configureSession = require('./srv/config/session');
const setupAuthRoutes = require('./srv/routes/auth');
const setupAdminRoutes = require('./srv/routes/admin');
const setupNurseRoutes = require('./srv/routes/nurse');
const setupDoctorRoutes = require('./srv/routes/doctor');
const setupFormRoutes = require('./srv/routes/forms');
const setupApiRoutes = require('./srv/routes/api');

// Configure session
configureSession(app);

// Setup routes
setupAuthRoutes(app);
setupAdminRoutes(app);
setupNurseRoutes(app);
setupDoctorRoutes(app);
setupFormRoutes(app);
setupApiRoutes(app);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});