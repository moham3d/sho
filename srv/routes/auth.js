const bcrypt = require('bcrypt');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

function setupAuthRoutes(app) {
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
    });

    app.get('/login', (req, res) => {
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
            if (req.session.role === 'admin') {
                res.redirect('/admin');
            } else if (req.session.role === 'nurse') {
                res.redirect('/nurse');
            } else if (req.session.role === 'physician') {
                res.redirect('/doctor');
            } else {
                res.redirect('/login');
            }
        });
    });

    // Logout route if exists
    app.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.redirect('/login');
        });
    });
}

module.exports = setupAuthRoutes;