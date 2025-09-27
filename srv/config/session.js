const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

function configureSession(app) {
    app.use(session({
        store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
        secret: 'al-shorouk-radiology-secret-key-2025',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true in production with HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));
}

module.exports = configureSession;