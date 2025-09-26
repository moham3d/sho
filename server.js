const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');

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
    // If nurse, get current visits data
    if (req.session.role === 'nurse') {
        db.all(`
            SELECT
                pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
                pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
                pv.visit_type, pv.department, pv.created_at,
                p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
                na.assessment_id, fs.submission_status = 'draft' as is_draft,
                (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
            FROM patient_visits pv
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
            LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
            WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
            ORDER BY pv.visit_date DESC, pv.created_at DESC
            LIMIT 5
        `, [req.session.userId], (err, currentVisits) => {
            if (err) {
                console.error('Error getting nurse visits for home page:', err);
                currentVisits = [];
            }

            res.render('index', { 
                user: req.session,
                currentVisits: currentVisits || []
            });
        });
    } else {
        res.render('index', { 
            user: req.session,
            currentVisits: []
        });
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
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else if (user.role === 'nurse') {
            res.redirect('/');
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

// Admin routes
app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
    db.all('SELECT user_id, username, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }
        res.render('admin', { user: req.session, users: users });
    });
});

app.get('/admin/users/new', requireAuth, requireRole('admin'), (req, res) => {
    res.render('user-form', { user: req.session, editUser: null, isNew: true });
});

app.post('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
    const { username, email, full_name, role, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        db.run('INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, email, full_name, role, hashedPassword], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Error creating user');
                }
                res.redirect('/admin');
            });
    } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).send('Error creating user');
    }
});

app.get('/admin/users/:id/edit', requireAuth, requireRole('admin'), (req, res) => {
    const userId = req.params.id;
    db.get('SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).send('User not found');
        }
        res.render('user-form', { user: req.session, editUser: user, isNew: false });
    });
});

app.post('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
    const userId = req.params.id;
    const { username, email, full_name, role, password, is_active } = req.body;

    let updateQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, is_active = ? WHERE user_id = ?';
    let params = [username, email, full_name, role, is_active ? 1 : 0, userId];

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, password_hash = ?, is_active = ? WHERE user_id = ?';
        params = [username, email, full_name, role, hashedPassword, is_active ? 1 : 0, userId];
    }

    db.run(updateQuery, params, function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error updating user');
        }
        res.redirect('/admin');
    });
});

app.post('/admin/users/:id/delete', requireAuth, requireRole('admin'), (req, res) => {
    const userId = req.params.id;
    db.run('DELETE FROM users WHERE user_id = ?', [userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error deleting user');
        }
        res.redirect('/admin');
    });
});

// Admin visit management routes
app.get('/admin/visits', requireAuth, requireRole('admin'), (req, res) => {
    const { search, status, department, date_from, date_to } = req.query;

    let sql = `
        SELECT
            pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
            pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
            pv.visit_type, pv.department, pv.created_at, pv.completed_at,
            p.full_name as patient_name, p.medical_number,
            u.full_name as created_by_name,
            (SELECT COUNT(*) FROM form_submissions fs WHERE fs.visit_id = pv.visit_id) as assessment_count
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN users u ON pv.created_by = u.user_id
        WHERE 1=1
    `;

    const params = [];

    if (search) {
        sql += ` AND (p.full_name LIKE ? OR p.medical_number LIKE ? OR pv.patient_ssn LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
        sql += ` AND pv.visit_status = ?`;
        params.push(status);
    }

    if (department && department !== 'all') {
        sql += ` AND pv.department = ?`;
        params.push(department);
    }

    if (date_from) {
        sql += ` AND DATE(pv.visit_date) >= ?`;
        params.push(date_from);
    }

    if (date_to) {
        sql += ` AND DATE(pv.visit_date) <= ?`;
        params.push(date_to);
    }

    sql += ` ORDER BY pv.visit_date DESC, pv.created_at DESC`;

    db.all(sql, params, (err, visits) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // Get unique departments for filter dropdown
        db.all('SELECT DISTINCT department FROM patient_visits WHERE department IS NOT NULL ORDER BY department', [], (err, departments) => {
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }

            res.render('admin-visits', {
                user: req.session,
                visits: visits || [],
                departments: departments || [],
                filters: { search, status, department, date_from, date_to },
                notification: notification
            });
        });
    });
});

// Delete visit route - must come before the :visitId routes
app.post('/admin/visits/:visitId/delete', requireAuth, requireRole('admin'), (req, res) => {
    console.log('Delete visit route hit for visitId:', req.params.visitId);
    console.log('User session:', req.session.userId, req.session.role);

    const visitId = req.params.visitId;

    // First, delete related assessments and form submissions
    db.run('DELETE FROM nursing_assessments WHERE submission_id IN (SELECT submission_id FROM form_submissions WHERE visit_id = ?)', [visitId], function(err) {
        if (err) {
            console.error('Error deleting nursing assessments:', err);
            return res.status(500).send('Error deleting visit');
        }

        db.run('DELETE FROM radiology_assessments WHERE submission_id IN (SELECT submission_id FROM form_submissions WHERE visit_id = ?)', [visitId], function(err) {
            if (err) {
                console.error('Error deleting radiology assessments:', err);
                return res.status(500).send('Error deleting visit');
            }

            db.run('DELETE FROM form_submissions WHERE visit_id = ?', [visitId], function(err) {
                if (err) {
                    console.error('Error deleting form submissions:', err);
                    return res.status(500).send('Error deleting visit');
                }

                // Finally, delete the visit itself
                db.run('DELETE FROM patient_visits WHERE visit_id = ?', [visitId], function(err) {
                    if (err) {
                        console.error('Error deleting visit:', err);
                        return res.status(500).send('Error deleting visit');
                    }

                    if (this.changes === 0) {
                        return res.status(404).send('Visit not found');
                    }

                    console.log(`Visit ${visitId} and all related data deleted successfully`);

                    // Store success message in session
                    req.session.notification = {
                        type: 'success',
                        message: 'Visit and all associated assessments have been deleted successfully.'
                    };

                    // Redirect back to the previous page or admin visits
                    const referrer = req.get('Referer') || '/admin/visits';
                    res.redirect(referrer);
                });
            });
        });
    });
});

app.get('/admin/visits/:visitId', requireAuth, requireRole('admin'), (req, res) => {
    const visitId = req.params.visitId;

    // Get visit details with patient info
    db.get(`
        SELECT
            pv.*, p.full_name, p.medical_number, p.mobile_number, p.phone_number,
            p.date_of_birth, p.gender, p.address, p.emergency_contact_name,
            p.emergency_contact_phone, p.emergency_contact_relation,
            u.full_name as created_by_name
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN users u ON pv.created_by = u.user_id
        WHERE pv.visit_id = ?
    `, [visitId], (err, visit) => {
        if (err || !visit) {
            return res.status(404).send('Visit not found');
        }

        // Get nursing assessment
        db.get(`
            SELECT na.*, u.full_name as assessed_by_name, us.signature_data as nurse_signature
            FROM nursing_assessments na
            JOIN form_submissions fs ON na.submission_id = fs.submission_id
            LEFT JOIN users u ON na.assessed_by = u.user_id
            LEFT JOIN user_signatures us ON na.nurse_signature_id = us.signature_id
            WHERE fs.visit_id = ?
        `, [visitId], (err, nursingAssessment) => {

            // Get radiology assessment
            db.get(`
                SELECT ra.*, u.full_name as assessed_by_name, us.signature_data as physician_signature
                FROM radiology_assessments ra
                JOIN form_submissions fs ON ra.submission_id = fs.submission_id
                LEFT JOIN users u ON ra.assessed_by = u.user_id
                LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                WHERE fs.visit_id = ?
            `, [visitId], (err, radiologyAssessment) => {

                // Get notification from session and clear it
                const notification = req.session.notification;
                if (req.session.notification) {
                    delete req.session.notification;
                }

                res.render('admin-visit-detail', {
                    user: req.session,
                    visit: visit,
                    nursingAssessment: nursingAssessment || null,
                    radiologyAssessment: radiologyAssessment || null,
                    notification: notification
                });
            });
        });
    });
});

app.get('/admin/visits/:visitId/print', requireAuth, requireRole('admin'), (req, res) => {
    const visitId = req.params.visitId;

    // Get visit details with patient info
    db.get(`
        SELECT
            pv.*, p.full_name, p.medical_number, p.mobile_number, p.phone_number,
            p.date_of_birth, p.gender, p.address, p.emergency_contact_name,
            p.emergency_contact_phone, p.emergency_contact_relation,
            u.full_name as created_by_name
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN users u ON pv.created_by = u.user_id
        WHERE pv.visit_id = ?
    `, [visitId], (err, visit) => {
        if (err || !visit) {
            return res.status(404).send('Visit not found');
        }

        // Get nursing assessment
        db.get(`
            SELECT na.*, u.full_name as assessed_by_name, us.signature_data as nurse_signature
            FROM nursing_assessments na
            JOIN form_submissions fs ON na.submission_id = fs.submission_id
            LEFT JOIN users u ON na.assessed_by = u.user_id
            LEFT JOIN user_signatures us ON na.nurse_signature_id = us.signature_id
            WHERE fs.visit_id = ?
        `, [visitId], (err, nursingAssessment) => {

            // Get radiology assessment
            db.get(`
                SELECT ra.*, u.full_name as assessed_by_name, us.signature_data as physician_signature
                FROM radiology_assessments ra
                JOIN form_submissions fs ON ra.submission_id = fs.submission_id
                LEFT JOIN users u ON ra.assessed_by = u.user_id
                LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                WHERE fs.visit_id = ?
            `, [visitId], (err, radiologyAssessment) => {

                res.render('visit-print', {
                    visit: visit,
                    nursingAssessment: nursingAssessment || null,
                    radiologyAssessment: radiologyAssessment || null
                });
            });
        });
    });
});

// Nurse routes
app.get('/nurse', requireAuth, requireRole('nurse'), (req, res) => {
    // Handle notification from query parameters
    const notification = req.query.notification ? {
        type: req.query.notification,
        message: req.query.message ? decodeURIComponent(req.query.message) : ''
    } : null;

    res.render('nurse-dashboard', {
        user: req.session,
        notification: notification
    });
});

app.get('/nurse/my-assessments', requireAuth, requireRole('nurse'), (req, res) => {
    // Get visits assigned to this nurse that are in progress
    db.all(`
        SELECT
            pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
            pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
            pv.visit_type, pv.department, pv.created_at,
            p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
            na.assessment_id, fs.submission_status = 'draft' as is_draft,
            (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
        LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
        WHERE pv.created_by = ? AND pv.visit_status = 'in_progress'
        ORDER BY pv.visit_date DESC, pv.created_at DESC
    `, [req.session.userId], (err, visits) => {
        if (err) {
            console.error('Error getting nurse assessments:', err);
            return res.status(500).send('Database error');
        }

        res.render('nurse-assessments', {
            user: req.session,
            visits: visits || []
        });
    });
});

app.get('/nurse/search-patient', requireAuth, requireRole('nurse'), (req, res) => {
    // Get nurse's current visits with assessment status
    db.all(`
        SELECT
            pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
            pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
            pv.visit_type, pv.department, pv.created_at,
            p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
            na.assessment_id, fs.submission_status = 'draft' as is_draft,
            (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
        LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
        WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
        ORDER BY pv.visit_date DESC, pv.created_at DESC
        LIMIT 10
    `, [req.session.userId], (err, visits) => {
        if (err) {
            console.error('Error getting nurse visits:', err);
            visits = [];
        }

        res.render('patient-search', {
            user: req.session,
            patient: null,
            error: null,
            visitId: null,
            currentVisits: visits || []
        });
    });
});

// API endpoint for patient autocomplete search
app.get('/api/patients/search', requireAuth, (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.json([]);
    }

    db.all(`
        SELECT full_name, ssn, medical_number, mobile_number, date_of_birth, gender
        FROM patients
        WHERE ssn LIKE ?
        ORDER BY ssn
        LIMIT 3
    `, [`%${q}%`], (err, patients) => {
        if (err) {
            console.error('Patient search error:', err);
            return res.status(500).json({ error: 'Search failed' });
        }
        res.json(patients || []);
    });
});

app.post('/nurse/search-patient', requireAuth, requireRole('nurse'), (req, res) => {
    const { ssn } = req.body;

    // Validate SSN format
    if (!ssn || !/^\d{14}$/.test(ssn)) {
        return res.render('patient-search', {
            user: req.session,
            patient: null,
            error: 'Please enter a valid 14-digit SSN',
            visitId: null,
            currentVisits: []
        });
    }

    // Get current visits for the template
    db.all(`
        SELECT
            pv.visit_id, pv.patient_ssn, pv.visit_date, pv.visit_status,
            pv.primary_diagnosis, pv.secondary_diagnosis, pv.diagnosis_code,
            pv.visit_type, pv.department, pv.created_at,
            p.full_name as patient_name, p.medical_number, p.date_of_birth, p.gender,
            na.assessment_id, fs.submission_status = 'draft' as is_draft,
            (SELECT COUNT(*) FROM form_submissions fs2 WHERE fs2.visit_id = pv.visit_id) as total_assessments
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        LEFT JOIN form_submissions fs ON fs.visit_id = pv.visit_id AND fs.form_id = 'form-05-uuid'
        LEFT JOIN nursing_assessments na ON na.submission_id = fs.submission_id
        WHERE pv.created_by = ? AND pv.visit_status IN ('open', 'in_progress')
        ORDER BY pv.visit_date DESC, pv.created_at DESC
        LIMIT 10
    `, [req.session.userId], (err, currentVisits) => {
        if (err) {
            console.error('Error getting nurse visits:', err);
            currentVisits = [];
        }

        db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
            if (err) {
                console.error('Database error:', err);
                return res.render('patient-search', {
                    user: req.session,
                    patient: null,
                    error: 'Database error',
                    visitId: null,
                    currentVisits: currentVisits || []
                });
            }

            if (!patient) {
                return res.render('patient-search', {
                    user: req.session,
                    patient: null,
                    error: 'Patient not found. Please register the patient first.',
                    visitId: null,
                    currentVisits: currentVisits || [],
                    searchedSSN: ssn // Pass the searched SSN to the template
                });
            }

            // Create new visit immediately
            const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                [visitId, ssn, req.session.userId], function(err) {
                    if (err) {
                        console.error('Error creating visit:', err);
                        return res.render('patient-search', {
                            user: req.session,
                            patient: patient,
                            error: 'Error creating visit',
                            visitId: null,
                            currentVisits: currentVisits || []
                        });
                    }

                    // Create form submission
                    db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by) VALUES (?, ?, ?, ?)',
                        [submissionId, visitId, 'form-05-uuid', req.session.userId], function(err) {
                            if (err) {
                                console.error('Error creating form submission:', err);
                                return res.render('patient-search', {
                                    user: req.session,
                                    patient: patient,
                                    error: 'Error creating assessment',
                                    visitId: null,
                                    currentVisits: currentVisits || []
                                });
                            }

                            // Redirect to nurse form with visit context
                            res.redirect(`/nurse/assessment/${visitId}`);
                        });
                });
        });
    });
});

// Add patient routes
app.get('/nurse/add-patient', requireAuth, requireRole('nurse'), (req, res) => {
    res.render('add-patient', { user: req.session, error: null });
});

app.post('/nurse/add-patient', requireAuth, requireRole('nurse'), (req, res) => {
    const { ssn, full_name, mobile_number, phone_number, medical_number, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation } = req.body;

    // Validate required fields
    if (!ssn || !full_name || !mobile_number || !date_of_birth || !gender) {
        return res.render('add-patient', {
            user: req.session,
            error: 'Please fill in all required fields (SSN, Full Name, Mobile Number, Date of Birth, Gender)'
        });
    }

    // Validate SSN format (14-digit Egyptian SSN)
    if (!/^\d{14}$/.test(ssn)) {
        return res.render('add-patient', {
            user: req.session,
            error: 'SSN must be exactly 14 digits and contain only numbers'
        });
    }

    // Check if patient already exists
    db.get('SELECT ssn FROM patients WHERE ssn = ?', [ssn], (err, existingPatient) => {
        if (err) {
            console.error('Error checking patient existence:', err);
            return res.render('add-patient', {
                user: req.session,
                error: 'Database error occurred'
            });
        }

        if (existingPatient) {
            return res.render('add-patient', {
                user: req.session,
                error: 'A patient with this SSN already exists'
            });
        }

        // Insert new patient
        db.run(`INSERT INTO patients (
            ssn, full_name, mobile_number, phone_number, medical_number,
            date_of_birth, gender, address, emergency_contact_name,
            emergency_contact_phone, emergency_contact_relation, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ssn, full_name, mobile_number, phone_number || null, medical_number || null,
         date_of_birth, gender, address || null, emergency_contact_name || null,
         emergency_contact_phone || null, emergency_contact_relation || null, req.session.userId],
        function(err) {
            if (err) {
                console.error('Error creating patient:', err);
                return res.render('add-patient', {
                    user: req.session,
                    error: 'Error creating patient record'
                });
            }

            // Patient created successfully, now create a new visit and redirect to assessment
            const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                [visitId, ssn, req.session.userId], function(err) {
                    if (err) {
                        console.error('Error creating visit:', err);
                        return res.render('add-patient', {
                            user: req.session,
                            error: 'Patient created but error creating visit. Please try searching for the patient.'
                        });
                    }

                    // Create form submission
                    db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by) VALUES (?, ?, ?, ?)',
                        [submissionId, visitId, 'form-05-uuid', req.session.userId], function(err) {
                            if (err) {
                                console.error('Error creating form submission:', err);
                                return res.render('add-patient', {
                                    user: req.session,
                                    error: 'Patient and visit created but error creating assessment. Please try searching for the patient.'
                                });
                            }

                            // Redirect to nurse form with visit context
                            res.redirect(`/nurse/assessment/${visitId}`);
                        });
                });
        });
    });
});

app.get('/nurse/assessment/:visitId', requireAuth, requireRole('nurse'), (req, res) => {
    const visitId = req.params.visitId;

    // Get visit and patient info
    db.get(`
        SELECT pv.*, p.full_name, p.mobile_number, p.medical_number, p.date_of_birth, p.gender,
               p.phone_number, p.address, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation
        FROM patient_visits pv
        JOIN patients p ON pv.patient_ssn = p.ssn
        WHERE pv.visit_id = ? AND pv.created_by = ?
    `, [visitId, req.session.userId], (err, visit) => {
        if (err || !visit) {
            return res.status(404).send('Visit not found');
        }

        // Check if assessment exists and get submission status
        db.get(`
            SELECT na.*, fs.submission_status
            FROM nursing_assessments na
            JOIN form_submissions fs ON na.submission_id = fs.submission_id
            WHERE fs.visit_id = ?
        `, [visitId], (err, result) => {
            const assessment = result ? result : null;
            const isDraft = result ? result.submission_status === 'draft' : false;

            res.render('nurse-form', {
                user: req.session,
                visit: visit,
                assessment: assessment,
                isDraft: isDraft
            });
        });
    });
});

app.get('/doctor', requireAuth, requireRole('physician'), (req, res) => {
    res.render('doctor-dashboard', { user: req.session, patient: null, error: null });
});

app.post('/doctor/search-patient', requireAuth, requireRole('physician'), (req, res) => {
    const { ssn } = req.body;

    // Validate SSN format
    if (!ssn || !/^\d{14}$/.test(ssn)) {
        return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Please enter a valid 14-digit SSN' });
    }

    db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
        if (err) {
            console.error('Database error:', err);
            return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Database error' });
        }

        if (!patient) {
            return res.render('doctor-dashboard', { user: req.session, patient: null, error: 'Patient not found. Please ensure the patient is registered.' });
        }

        // Store patient in session for radiology form access
        req.session.selectedPatient = patient;

        // Check for current visit or create new one
        db.get('SELECT * FROM patient_visits WHERE patient_ssn = ? ORDER BY created_at DESC LIMIT 1', [ssn], (err, visit) => {
            if (err) {
                console.error('Error checking visits:', err);
                return res.render('doctor-dashboard', { user: req.session, patient: patient, error: 'Error checking patient visits' });
            }

            if (!visit) {
                // Create new visit
                const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                db.run('INSERT INTO patient_visits (visit_id, patient_ssn, created_by) VALUES (?, ?, ?)',
                    [visitId, ssn, req.session.userId], function(err) {
                        if (err) {
                            console.error('Error creating visit:', err);
                            return res.render('doctor-dashboard', { user: req.session, patient: patient, error: 'Error creating visit' });
                        }
                        req.session.selectedVisit = { visit_id: visitId };
                        res.render('doctor-dashboard', { user: req.session, patient: patient, error: null });
                    });
            } else {
                req.session.selectedVisit = visit;
                res.render('doctor-dashboard', { user: req.session, patient: patient, error: null });
            }
        });
    });
});

app.get('/radiology-form', requireAuth, requireRole('physician'), (req, res) => {
    if (!req.session.selectedPatient || !req.session.selectedVisit) {
        return res.redirect('/doctor');
    }
    res.render('radiology-form', { user: req.session, patient: req.session.selectedPatient, visit: req.session.selectedVisit });
});

// Form submission routes
app.post('/submit-nurse-form', requireAuth, requireRole('nurse'), (req, res) => {
    const formData = req.body;
    const visitId = formData.visit_id;
    const isDraft = formData.action === 'draft';

    console.log('Nurse form submitted:', {
        visitId,
        isDraft,
        hasSignature: !!formData.nurse_signature,
        signatureLength: formData.nurse_signature ? formData.nurse_signature.length : 0,
        signaturePreview: formData.nurse_signature ? formData.nurse_signature.substring(0, 100) + '...' : 'none'
    });

    // Check if assessment already exists
    db.get('SELECT na.*, fs.submission_id FROM nursing_assessments na JOIN form_submissions fs ON na.submission_id = fs.submission_id WHERE fs.visit_id = ?', [visitId], (err, existingAssessment) => {
        if (err) {
            console.error('Error checking existing assessment:', err);
            return res.status(500).send('Database error');
        }

        // Handle signature storage
        const signatureData = formData.nurse_signature;
        if (!signatureData || signatureData === '') {
            return res.status(400).send('Signature is required');
        }

        // Check if user already has a signature
        db.get('SELECT signature_id FROM user_signatures WHERE user_id = ?', [req.session.userId], (err, existingSignature) => {
            if (err) {
                console.error('Error checking existing signature:', err);
                return res.status(500).send('Database error');
            }

            const signatureId = existingSignature ? existingSignature.signature_id : 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            const signatureSql = existingSignature ?
                'UPDATE user_signatures SET signature_data = ?, updated_at = CURRENT_TIMESTAMP WHERE signature_id = ?' :
                'INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)';

            const signatureValues = existingSignature ?
                [signatureData, signatureId] :
                [signatureId, req.session.userId, signatureData];

            db.run(signatureSql, signatureValues, function(sigErr) {
                if (sigErr) {
                    console.error('Error saving signature:', sigErr);
                    return res.status(500).send('Error saving signature');
                }

                // Now proceed with form submission using signature_id reference
                proceedWithFormSubmission(signatureId, existingAssessment);
            });
        });
    });

    function proceedWithFormSubmission(signatureId, existingAssessment) {
        const submissionId = existingAssessment ? existingAssessment.submission_id : 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const assessmentId = existingAssessment ? existingAssessment.assessment_id : 'nurse-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const sql = existingAssessment ?
            `UPDATE nursing_assessments SET
                mode_of_arrival = ?, age = ?, chief_complaint = ?, accompanied_by = ?, language_spoken = ?,
                temperature_celsius = ?, pulse_bpm = ?, blood_pressure_systolic = ?, blood_pressure_diastolic = ?,
                respiratory_rate_per_min = ?, oxygen_saturation_percent = ?, blood_sugar_mg_dl = ?,
                weight_kg = ?, height_cm = ?, psychological_problem = ?, is_smoker = ?, has_allergies = ?,
                medication_allergies = ?, food_allergies = ?, other_allergies = ?, diet_type = ?, appetite = ?,
                has_git_problems = ?, has_weight_loss = ?, has_weight_gain = ?, feeding_status = ?, hygiene_status = ?,
                toileting_status = ?, ambulation_status = ?, uses_walker = ?, uses_wheelchair = ?, uses_transfer_device = ?,
                uses_other_equipment = ?, pain_intensity = ?, pain_location = ?, pain_frequency = ?,
                pain_character = ?, needs_medication_education = ?, needs_diet_nutrition_education = ?,
                needs_medical_equipment_education = ?, needs_rehabilitation_education = ?, needs_drug_interaction_education = ?,
                needs_pain_symptom_education = ?, needs_fall_prevention_education = ?, other_needs = ?, nurse_signature_id = ?
             WHERE assessment_id = ?` :
            `INSERT INTO nursing_assessments (
                assessment_id, submission_id, mode_of_arrival, age, chief_complaint, accompanied_by, language_spoken,
                temperature_celsius, pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
                respiratory_rate_per_min, oxygen_saturation_percent, blood_sugar_mg_dl, weight_kg, height_cm,
                psychological_problem, is_smoker, has_allergies, medication_allergies, food_allergies, other_allergies,
                diet_type, appetite, has_git_problems, has_weight_loss, has_weight_gain, feeding_status, hygiene_status,
                toileting_status, ambulation_status, uses_walker, uses_wheelchair, uses_transfer_device, uses_other_equipment,
                pain_intensity, pain_location, pain_frequency, pain_character,
                needs_medication_education, needs_diet_nutrition_education, needs_medical_equipment_education,
                needs_rehabilitation_education, needs_drug_interaction_education, needs_pain_symptom_education,
                needs_fall_prevention_education, other_needs, nurse_signature_id, assessed_by, assessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = existingAssessment ? [
            formData.mode_of_arrival, formData.age, formData.chief_complaint, formData.accompanied_by, formData.language_spoken,
            formData.temperature_celsius, formData.pulse_bpm, formData.blood_pressure_systolic, formData.blood_pressure_diastolic,
            formData.respiratory_rate_per_min, formData.oxygen_saturation_percent, formData.blood_sugar_mg_dl,
            formData.weight_kg, formData.height_cm, formData.psychological_problem, formData.is_smoker ? 1 : 0,
            formData.has_allergies ? 1 : 0, formData.medication_allergies, formData.food_allergies, formData.other_allergies,
            formData.diet_type, formData.appetite, formData.has_git_problems ? 1 : 0, formData.has_weight_loss ? 1 : 0,
            formData.has_weight_gain ? 1 : 0, formData.feeding_status, formData.hygiene_status, formData.toileting_status,
            formData.ambulation_status, formData.uses_walker ? 1 : 0, formData.uses_wheelchair ? 1 : 0, formData.uses_transfer_device ? 1 : 0,
            formData.uses_other_equipment ? 1 : 0, formData.pain_intensity, formData.pain_location, formData.pain_frequency,
            formData.pain_character, formData.needs_medication_education ? 1 : 0, formData.needs_diet_nutrition_education ? 1 : 0,
            formData.needs_medical_equipment_education ? 1 : 0, formData.needs_rehabilitation_education ? 1 : 0,
            formData.needs_drug_interaction_education ? 1 : 0, formData.needs_pain_symptom_education ? 1 : 0,
            formData.needs_fall_prevention_education ? 1 : 0, formData.other_needs ? 1 : 0, signatureId, assessmentId
        ] : [
            assessmentId, submissionId, formData.mode_of_arrival, formData.age, formData.chief_complaint,
            formData.accompanied_by, formData.language_spoken, formData.temperature_celsius, formData.pulse_bpm,
            formData.blood_pressure_systolic, formData.blood_pressure_diastolic, formData.respiratory_rate_per_min,
            formData.oxygen_saturation_percent, formData.blood_sugar_mg_dl, formData.weight_kg, formData.height_cm,
            formData.psychological_problem, formData.is_smoker ? 1 : 0, formData.has_allergies ? 1 : 0,
            formData.medication_allergies, formData.food_allergies, formData.other_allergies,
            formData.diet_type, formData.appetite, formData.has_git_problems ? 1 : 0, formData.has_weight_loss ? 1 : 0,
            formData.has_weight_gain ? 1 : 0, formData.feeding_status, formData.hygiene_status, formData.toileting_status,
            formData.ambulation_status, formData.uses_walker ? 1 : 0, formData.uses_wheelchair ? 1 : 0, formData.uses_transfer_device ? 1 : 0,
            formData.uses_other_equipment ? 1 : 0, formData.pain_intensity, formData.pain_location, formData.pain_frequency,
            formData.pain_character, formData.needs_medication_education ? 1 : 0, formData.needs_diet_nutrition_education ? 1 : 0,
            formData.needs_medical_equipment_education ? 1 : 0, formData.needs_rehabilitation_education ? 1 : 0,
            formData.needs_drug_interaction_education ? 1 : 0, formData.needs_pain_symptom_education ? 1 : 0,
            formData.needs_fall_prevention_education ? 1 : 0, formData.other_needs ? 1 : 0, signatureId, req.session.userId,
            new Date().toISOString()
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Error saving nurse assessment:', err.message);
                console.error('SQL:', sql);
                console.error('Number of columns in SQL:', sql.match(/\?/g).length);
                console.error('Number of values provided:', values.length);
                return res.status(500).send('Error saving assessment: ' + err.message);
            }

            console.log('Nurse assessment saved successfully with ID:', existingAssessment ? existingAssessment.assessment_id : assessmentId);

            if (!existingAssessment) {
                // Create form submission record if new
                db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by, submission_status) VALUES (?, ?, ?, ?, ?)',
                    [submissionId, visitId, 'form-05-uuid', req.session.userId, isDraft ? 'draft' : 'submitted'], function(err) {
                        if (err) {
                            console.error('Error creating form submission:', err);
                        }
                    });
            }

            if (isDraft) {
                res.redirect(`/nurse/assessment/${visitId}?saved=draft`);
            } else {
                res.redirect('/nurse?notification=success&message=Nursing+assessment+submitted+successfully');
            }
        });
    }

app.post('/submit-radiology-form', requireAuth, requireRole('physician'), (req, res) => {
    const formData = req.body;
    console.log('Radiology form submitted:', formData);

    if (!req.session.selectedVisit) {
        return res.status(400).send('No patient visit selected');
    }

    // Handle signature storage
    const signatureData = formData.physician_signature;
    if (!signatureData || signatureData === '') {
        return res.status(400).send('Signature is required');
    }

    // Check if user already has a signature
    db.get('SELECT signature_id FROM user_signatures WHERE user_id = ?', [req.session.userId], (err, existingSignature) => {
        if (err) {
            console.error('Error checking existing signature:', err);
            return res.status(500).send('Database error');
        }

        const signatureId = existingSignature ? existingSignature.signature_id : 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const signatureSql = existingSignature ?
            'UPDATE user_signatures SET signature_data = ?, updated_at = CURRENT_TIMESTAMP WHERE signature_id = ?' :
            'INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)';

        const signatureValues = existingSignature ?
            [signatureData, signatureId] :
            [signatureId, req.session.userId, signatureData];

        db.run(signatureSql, signatureValues, function(sigErr) {
            if (sigErr) {
                console.error('Error saving signature:', sigErr);
                return res.status(500).send('Error saving signature');
            }

            // Now proceed with form submission using signature_id reference
            proceedWithRadiologySubmission(signatureId);
        });
    });

    function proceedWithRadiologySubmission(signatureId) {
        // Generate UUID-like string
        const radiologyId = 'radio-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const submissionId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Insert into radiology_assessments
        const sql = `
            INSERT INTO radiology_assessments (
                radiology_id, submission_id, treating_physician, department,
                fasting_hours, is_diabetic, blood_sugar_level, weight_kg, height_cm,
                dose_amount, ctd1vol, dlp, uses_contrast, kidney_function_value,
                is_first_time, requires_report, diagnosis, reason_for_study,
                findings, impression, recommendations, modality, body_region,
                has_chemotherapy, chemo_type, chemo_sessions, has_radiotherapy,
                radiotherapy_site, radiotherapy_sessions, has_operations, has_endoscopy,
                has_biopsies, has_tc_mdp_bone_scan, has_tc_dtpa_kidney_scan,
                has_mri, has_mammography, has_ct, has_xray, has_ultrasound,
                physician_signature_id, assessed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            radiologyId, submissionId, formData.treating_physician, formData.department,
            formData.fasting_hours, formData.is_diabetic === 'true' ? 1 : 0, formData.blood_sugar_level,
            formData.weight_kg, formData.height_cm, formData.dose_amount,
            formData.ctd1vol, formData.dlp, formData.uses_contrast === 'true' ? 1 : 0,
            formData.kidney_function_value, formData.is_first_time === 'true' ? 1 : 0,
            formData.requires_report === 'true' ? 1 : 0, formData.diagnosis, formData.reason_for_study,
            formData.findings, formData.impression, formData.recommendations,
            formData.modality, formData.body_region, formData.has_chemotherapy ? 1 : 0,
            formData.chemo_type, formData.chemo_sessions, formData.has_radiotherapy ? 1 : 0,
            formData.radiotherapy_site, formData.radiotherapy_sessions,
            formData.has_operations ? 1 : 0, formData.has_endoscopy ? 1 : 0,
            formData.has_biopsies ? 1 : 0, formData.has_tc_mdp_bone_scan ? 1 : 0,
            formData.has_tc_dtpa_kidney_scan ? 1 : 0, formData.has_mri ? 1 : 0,
            formData.has_mammography ? 1 : 0, formData.has_ct ? 1 : 0,
            formData.has_xray ? 1 : 0, formData.has_ultrasound ? 1 : 0, signatureId, req.session.userId
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Error inserting radiology assessment:', err.message);
                return res.status(500).send('Error saving assessment');
            }

            // Create form submission record
            db.run('INSERT INTO form_submissions (submission_id, visit_id, form_id, submitted_by, submission_status) VALUES (?, ?, ?, ?, ?)',
                [submissionId, req.session.selectedVisit.visit_id, 'form-04-uuid', req.session.userId, 'submitted'], function(err) {
                    if (err) {
                        console.error('Error creating form submission:', err);
                    }
                });

            console.log('Radiology assessment saved with ID:', radiologyId);
            res.send(`
                <div class="alert alert-success text-center">
                    <h4><i class="fas fa-check-circle me-2"></i>Radiology Assessment Submitted Successfully!</h4>
                    <p>Assessment ID: ${radiologyId}</p>
                    <a href="/doctor" class="btn btn-primary">Back to Dashboard</a>
                </div>
            `);
        });
    }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
