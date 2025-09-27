const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const nurseRoutes = require('./srv/nurse');
const adminRoutes = require('./srv/admin');
const doctorRoutes = require('./srv/doctor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Session configuration
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

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

function requireRole(role) {
    return function(req, res, next) {
        if (req.session.userId && req.session.role === role) {
            return next();
        }
        res.status(403).send('Access denied');
    };
}

// Database setup
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Routes
app.get('/', requireAuth, (req, res) => {
    // Redirect based on role
    if (req.session.role === 'admin') {
        res.redirect('/admin');
    } else if (req.session.role === 'nurse') {
        res.redirect('/nurse');
    } else if (req.session.role === 'physician') {
        res.redirect('/doctor');
    } else {
        // Fallback for unknown roles
        res.redirect('/login');
    }
});app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.render('login', { error: 'Database error' });
        }

        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        // Set session
        req.session.userId = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.fullName = user.full_name;

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else if (user.role === 'nurse') {
            res.redirect('/nurse');
        } else if (user.role === 'physician') {
            res.redirect('/doctor');
        } else {
            res.redirect('/');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/login');
    });
});


nurseRoutes(app, db, requireAuth, requireRole);
adminRoutes(app, db, requireAuth, requireRole);
doctorRoutes(app, db, requireAuth, requireRole);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
