const sqlite3 = require('sqlite3').verbose();

module.exports = function(app, db, requireAuth, requireRole) {
    // Admin routes
    app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
        // Get users count
        db.get('SELECT COUNT(*) as count FROM users', [], (err, userCount) => {
            if (err) {
                console.error('Error getting user count:', err);
                return res.status(500).send('Database error');
            }
    
            // Get patients count
            db.get('SELECT COUNT(*) as count FROM patients', [], (err, patientCount) => {
                if (err) {
                    console.error('Error getting patient count:', err);
                    return res.status(500).send('Database error');
                }
    
                // Get visits count
                db.get('SELECT COUNT(*) as count FROM patient_visits', [], (err, visitCount) => {
                    if (err) {
                        console.error('Error getting visit count:', err);
                        return res.status(500).send('Database error');
                    }
    
                    // Get assessments count (nursing + radiology)
                    db.get('SELECT (SELECT COUNT(*) FROM nursing_assessments) + (SELECT COUNT(*) FROM radiology_assessments) as count', [], (err, assessmentCount) => {
                        if (err) {
                            console.error('Error getting assessment count:', err);
                            return res.status(500).send('Database error');
                        }
    
                        // Get all users for the existing functionality
                        db.all('SELECT user_id, username, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).send('Database error');
                            }
    
                            res.render('admin', {
                                user: req.session,
                                users: users,
                                stats: {
                                    users: userCount.count,
                                    patients: patientCount.count,
                                    visits: visitCount.count,
                                    assessments: assessmentCount.count
                                }
                            });
                        });
                    });
                });
            });
        });
    });
    
    app.get('/admin/users', requireAuth, requireRole('admin'), (req, res) => {
        const { search, role, status } = req.query;
    
        let sql = `
            SELECT user_id, username, email, full_name, role, is_active, created_at
            FROM users
            WHERE 1=1
        `;
    
        const params = [];
    
        if (search) {
            sql += ` AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
    
        if (role && role !== 'all') {
            sql += ` AND role = ?`;
            params.push(role);
        }
    
        if (status && status !== 'all') {
            if (status === 'active') {
                sql += ` AND is_active = 1`;
            } else if (status === 'inactive') {
                sql += ` AND is_active = 0`;
            }
        }
    
        sql += ` ORDER BY created_at DESC`;
    
        db.all(sql, params, (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }
    
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            res.render('admin-users', {
                user: req.session,
                users: users || [],
                filters: { search, role, status },
                notification: notification
            });
        });
    });
    
    app.get('/admin/users/new', requireAuth, requireRole('admin'), (req, res) => {
        res.render('user-form', { user: req.session, editUser: null, isNew: true });
    });
    
    app.post('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
        const { username, email, full_name, role, password, user_signature } = req.body;
    
        // Validate signature
        if (!user_signature || user_signature === '') {
            return res.render('user-form', {
                user: req.session,
                editUser: null,
                isNew: true,
                error: 'User signature is required'
            });
        }
    
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
            db.run('INSERT INTO users (user_id, username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, username, email, full_name, role, hashedPassword], function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.render('user-form', {
                            user: req.session,
                            editUser: null,
                            isNew: true,
                            error: 'Error creating user: ' + err.message
                        });
                    }
    
                    // Save signature
                    const signatureId = 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    db.run('INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)',
                        [signatureId, userId, user_signature], function(sigErr) {
                            if (sigErr) {
                                console.error('Error saving signature:', sigErr);
                                // User created but signature failed - could delete user or handle differently
                                return res.render('user-form', {
                                    user: req.session,
                                    editUser: null,
                                    isNew: true,
                                    error: 'User created but error saving signature'
                                });
                            }
                            res.redirect('/admin');
                        });
                });
        } catch (error) {
            console.error('Password hashing error:', error);
            res.render('user-form', {
                user: req.session,
                editUser: null,
                isNew: true,
                error: 'Error creating user'
            });
        }
    });
    
    app.get('/admin/users/:id/edit', requireAuth, requireRole('admin'), (req, res) => {
        const userId = req.params.id;
        db.get('SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = ?', [userId], (err, user) => {
            if (err || !user) {
                return res.status(404).send('User not found');
            }
    
            // Get user's signature if exists
            db.get('SELECT signature_data FROM user_signatures WHERE user_id = ?', [userId], (err, signature) => {
                if (signature) {
                    user.signature_data = signature.signature_data;
                }
                res.render('user-form', { user: req.session, editUser: user, isNew: false });
            });
        });
    });
    
    app.post('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
        const userId = req.params.id;
        const { username, email, full_name, role, password, is_active, user_signature } = req.body;
    
        // Validate signature
        if (!user_signature || user_signature === '') {
            // Get user data for re-rendering form
            db.get('SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = ?', [userId], (err, user) => {
                if (user) {
                    db.get('SELECT signature_data FROM user_signatures WHERE user_id = ?', [userId], (err, signature) => {
                        if (signature) user.signature_data = signature.signature_data;
                        return res.render('user-form', {
                            user: req.session,
                            editUser: user,
                            isNew: false,
                            error: 'User signature is required'
                        });
                    });
                }
            });
            return;
        }
    
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
    
            // Update or insert signature
            db.get('SELECT signature_id FROM user_signatures WHERE user_id = ?', [userId], (err, existingSignature) => {
                if (err) {
                    console.error('Error checking existing signature:', err);
                    return res.redirect('/admin');
                }
    
                const signatureId = existingSignature ? existingSignature.signature_id : 'sig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const signatureSql = existingSignature ?
                    'UPDATE user_signatures SET signature_data = ?, updated_at = CURRENT_TIMESTAMP WHERE signature_id = ?' :
                    'INSERT INTO user_signatures (signature_id, user_id, signature_data) VALUES (?, ?, ?)';
    
                const signatureValues = existingSignature ?
                    [user_signature, signatureId] :
                    [signatureId, userId, user_signature];
    
                db.run(signatureSql, signatureValues, function(sigErr) {
                    if (sigErr) {
                        console.error('Error saving signature:', sigErr);
                        // User updated but signature failed - could handle differently
                    }
                    res.redirect('/admin');
                });
            });
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
    
    // Admin patient management routes
    app.get('/admin/patients', requireAuth, requireRole('admin'), (req, res) => {
        const { search, gender, date_from, date_to } = req.query;
    
        let sql = `
            SELECT ssn, full_name, mobile_number, medical_number, date_of_birth, gender,
                   address, emergency_contact_name, emergency_contact_phone, created_at
            FROM patients
            WHERE 1=1
        `;
    
        const params = [];
    
        if (search) {
            sql += ` AND (full_name LIKE ? OR medical_number LIKE ? OR ssn LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
    
        if (gender && gender !== 'all') {
            sql += ` AND gender = ?`;
            params.push(gender);
        }
    
        if (date_from) {
            sql += ` AND DATE(created_at) >= ?`;
            params.push(date_from);
        }
    
        if (date_to) {
            sql += ` AND DATE(created_at) <= ?`;
            params.push(date_to);
        }
    
        sql += ` ORDER BY created_at DESC`;
    
        db.all(sql, params, (err, patients) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }
    
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            res.render('admin-patients', {
                user: req.session,
                patients: patients || [],
                filters: { search, gender, date_from, date_to },
                notification: notification
            });
        });
    });
    
    app.get('/admin/patients/new', requireAuth, requireRole('admin'), (req, res) => {
        // Get notification from session and clear it
        const notification = req.session.notification;
        if (req.session.notification) {
            delete req.session.notification;
        }
    
        res.render('admin-patient-form', { user: req.session, patient: null, isNew: true, error: null, notification: notification });
    });
    
    app.post('/admin/patients', requireAuth, requireRole('admin'), (req, res) => {
        const { ssn, full_name, mobile_number, phone_number, medical_number, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation } = req.body;
    
        // Validate required fields
        if (!ssn || !full_name || !mobile_number || !date_of_birth || !gender) {
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            return res.render('admin-patient-form', {
                user: req.session,
                patient: null,
                isNew: true,
                error: 'Please fill in all required fields (SSN, Full Name, Mobile Number, Date of Birth, Gender)',
                notification: notification
            });
        }
    
        // Validate SSN format (14-digit Egyptian SSN)
        if (!/^\d{14}$/.test(ssn)) {
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            return res.render('admin-patient-form', {
                user: req.session,
                patient: null,
                isNew: true,
                error: 'SSN must be exactly 14 digits and contain only numbers',
                notification: notification
            });
        }
    
        // Check if patient already exists
        db.get('SELECT ssn FROM patients WHERE ssn = ?', [ssn], (err, existingPatient) => {
            if (err) {
                console.error('Error checking patient existence:', err);
                // Get notification from session and clear it
                const notification = req.session.notification;
                if (req.session.notification) {
                    delete req.session.notification;
                }
    
                return res.render('admin-patient-form', {
                    user: req.session,
                    patient: null,
                    isNew: true,
                    error: 'Database error occurred',
                    notification: notification
                });
            }
    
            if (existingPatient) {
                // Get notification from session and clear it
                const notification = req.session.notification;
                if (req.session.notification) {
                    delete req.session.notification;
                }
    
                return res.render('admin-patient-form', {
                    user: req.session,
                    patient: null,
                    isNew: true,
                    error: 'A patient with this SSN already exists',
                    notification: notification
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
                    // Get notification from session and clear it
                    const notification = req.session.notification;
                    if (req.session.notification) {
                        delete req.session.notification;
                    }
    
                    return res.render('admin-patient-form', {
                        user: req.session,
                        patient: null,
                        isNew: true,
                        error: 'Error creating patient record',
                        notification: notification
                    });
                }
    
                // Store success message in session
                req.session.notification = {
                    type: 'success',
                    message: 'Patient record created successfully.'
                };
    
                res.redirect('/admin/patients');
            });
        });
    });
    
    app.get('/admin/patients/:ssn/edit', requireAuth, requireRole('admin'), (req, res) => {
        const ssn = req.params.ssn;
        db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
            if (err || !patient) {
                return res.status(404).send('Patient not found');
            }
    
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            res.render('admin-patient-form', { user: req.session, patient: patient, isNew: false, error: null, notification: notification });
        });
    });
    
    app.post('/admin/patients/:ssn', requireAuth, requireRole('admin'), (req, res) => {
        const ssn = req.params.ssn;
        const { full_name, mobile_number, phone_number, medical_number, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation } = req.body;
    
        // Validate required fields
        if (!full_name || !mobile_number || !date_of_birth || !gender) {
            db.get('SELECT * FROM patients WHERE ssn = ?', [ssn], (err, patient) => {
                // Get notification from session and clear it
                const notification = req.session.notification;
                if (req.session.notification) {
                    delete req.session.notification;
                }
    
                return res.render('admin-patient-form', {
                    user: req.session,
                    patient: patient,
                    isNew: false,
                    error: 'Please fill in all required fields (Full Name, Mobile Number, Date of Birth, Gender)',
                    notification: notification
                });
            });
            return;
        }
    
        db.run(`UPDATE patients SET
            full_name = ?, mobile_number = ?, phone_number = ?, medical_number = ?,
            date_of_birth = ?, gender = ?, address = ?, emergency_contact_name = ?,
            emergency_contact_phone = ?, emergency_contact_relation = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ssn = ?`,
            [full_name, mobile_number, phone_number || null, medical_number || null,
             date_of_birth, gender, address || null, emergency_contact_name || null,
             emergency_contact_phone || null, emergency_contact_relation || null, ssn],
            function(err) {
                if (err) {
                    console.error('Error updating patient:', err);
                    return res.status(500).send('Error updating patient');
                }
    
                if (this.changes === 0) {
                    return res.status(404).send('Patient not found');
                }
    
                // Store success message in session
                req.session.notification = {
                    type: 'success',
                    message: 'Patient record updated successfully.'
                };
    
                res.redirect('/admin/patients');
            });
    });
    
    app.post('/admin/patients/:ssn/delete', requireAuth, requireRole('admin'), (req, res) => {
        const ssn = req.params.ssn;
    
        // First, delete related visits and assessments
        db.run('DELETE FROM nursing_assessments WHERE submission_id IN (SELECT submission_id FROM form_submissions WHERE visit_id IN (SELECT visit_id FROM patient_visits WHERE patient_ssn = ?))', [ssn], function(err) {
            if (err) {
                console.error('Error deleting nursing assessments:', err);
                return res.status(500).send('Error deleting patient');
            }
    
            db.run('DELETE FROM radiology_assessments WHERE submission_id IN (SELECT submission_id FROM form_submissions WHERE visit_id IN (SELECT visit_id FROM patient_visits WHERE patient_ssn = ?))', [ssn], function(err) {
                if (err) {
                    console.error('Error deleting radiology assessments:', err);
                    return res.status(500).send('Error deleting patient');
                }
    
                db.run('DELETE FROM form_submissions WHERE visit_id IN (SELECT visit_id FROM patient_visits WHERE patient_ssn = ?)', [ssn], function(err) {
                    if (err) {
                        console.error('Error deleting form submissions:', err);
                        return res.status(500).send('Error deleting patient');
                    }
    
                    db.run('DELETE FROM patient_visits WHERE patient_ssn = ?', [ssn], function(err) {
                        if (err) {
                            console.error('Error deleting visits:', err);
                            return res.status(500).send('Error deleting patient');
                        }
    
                        // Finally, delete the patient
                        db.run('DELETE FROM patients WHERE ssn = ?', [ssn], function(err) {
                            if (err) {
                                console.error('Error deleting patient:', err);
                                return res.status(500).send('Error deleting patient');
                            }
    
                            if (this.changes === 0) {
                                return res.status(404).send('Patient not found');
                            }
    
                            // Store success message in session
                            req.session.notification = {
                                type: 'success',
                                message: 'Patient and all associated records have been deleted successfully.'
                            };
    
                            res.redirect('/admin/patients');
                        });
                    });
                });
            });
        });
    });
    
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
    
    // Create new visit route
    app.get('/admin/visits/new', requireAuth, requireRole('admin'), (req, res) => {
        // Get all patients for dropdown
        db.all('SELECT ssn, full_name, medical_number FROM patients ORDER BY full_name', [], (err, patients) => {
            if (err) {
                console.error('Error getting patients:', err);
                return res.status(500).send('Database error');
            }
    
            // Get all users for created_by dropdown
            db.all('SELECT user_id, full_name, role FROM users ORDER BY full_name', [], (err, users) => {
                if (err) {
                    console.error('Error getting users:', err);
                    return res.status(500).send('Database error');
                }
    
                // Get notification from session and clear it
                const notification = req.session.notification;
                if (req.session.notification) {
                    delete req.session.notification;
                }
    
                res.render('admin-visit-form', {
                    user: req.session,
                    visit: null,
                    patients: patients || [],
                    users: users || [],
                    notification: notification
                });
            });
        });
    });
    
    // Create visit POST route
    app.post('/admin/visits', requireAuth, requireRole('admin'), (req, res) => {
        const { patient_ssn, visit_date, visit_status, primary_diagnosis, secondary_diagnosis,
                diagnosis_code, visit_type, department, created_by } = req.body;
    
        // Validate required fields
        if (!patient_ssn || !visit_date || !visit_status) {
            req.session.notification = {
                type: 'error',
                message: 'Patient SSN, visit date, and status are required.'
            };
            return res.redirect('/admin/visits/new');
        }
    
        // Validate patient exists
        db.get('SELECT ssn FROM patients WHERE ssn = ?', [patient_ssn], (err, patient) => {
            if (err) {
                console.error('Error checking patient:', err);
                req.session.notification = {
                    type: 'error',
                    message: 'Database error occurred.'
                };
                return res.redirect('/admin/visits/new');
            }
    
            if (!patient) {
                req.session.notification = {
                    type: 'error',
                    message: 'Selected patient does not exist.'
                };
                return res.redirect('/admin/visits/new');
            }
    
            // Generate visit ID
            const visitId = 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
            // Insert new visit
            db.run(`INSERT INTO patient_visits (
                visit_id, patient_ssn, visit_date, visit_status, primary_diagnosis,
                secondary_diagnosis, diagnosis_code, visit_type, department, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [visitId, patient_ssn, visit_date, visit_status, primary_diagnosis || null,
             secondary_diagnosis || null, diagnosis_code || null, visit_type || null,
             department || null, created_by || req.session.userId], function(err) {
                if (err) {
                    console.error('Error creating visit:', err);
                    req.session.notification = {
                        type: 'error',
                        message: 'Error creating visit record.'
                    };
                    return res.redirect('/admin/visits/new');
                }
    
                req.session.notification = {
                    type: 'success',
                    message: 'Visit created successfully.'
                };
                res.redirect('/admin/visits');
            });
        });
    });
    
    // Edit visit route
    app.get('/admin/visits/:visitId/edit', requireAuth, requireRole('admin'), (req, res) => {
        const visitId = req.params.visitId;
    
        // Get visit details
        db.get('SELECT * FROM patient_visits WHERE visit_id = ?', [visitId], (err, visit) => {
            if (err || !visit) {
                return res.status(404).send('Visit not found');
            }
    
            // Get all patients for dropdown
            db.all('SELECT ssn, full_name, medical_number FROM patients ORDER BY full_name', [], (err, patients) => {
                if (err) {
                    console.error('Error getting patients:', err);
                    return res.status(500).send('Database error');
                }
    
                // Get all users for created_by dropdown
                db.all('SELECT user_id, full_name, role FROM users ORDER BY full_name', [], (err, users) => {
                    if (err) {
                        console.error('Error getting users:', err);
                        return res.status(500).send('Database error');
                    }
    
                    // Get notification from session and clear it
                    const notification = req.session.notification;
                    if (req.session.notification) {
                        delete req.session.notification;
                    }
    
                    res.render('admin-visit-form', {
                        user: req.session,
                        visit: visit,
                        patients: patients || [],
                        users: users || [],
                        notification: notification
                    });
                });
            });
        });
    });
    
    // Update visit POST route
    app.post('/admin/visits/:visitId', requireAuth, requireRole('admin'), (req, res) => {
        const visitId = req.params.visitId;
        const { patient_ssn, visit_date, visit_status, primary_diagnosis, secondary_diagnosis,
                diagnosis_code, visit_type, department, created_by } = req.body;
    
        // Validate required fields
        if (!patient_ssn || !visit_date || !visit_status) {
            req.session.notification = {
                type: 'error',
                message: 'Patient SSN, visit date, and status are required.'
            };
            return res.redirect(`/admin/visits/${visitId}/edit`);
        }
    
        // Validate patient exists
        db.get('SELECT ssn FROM patients WHERE ssn = ?', [patient_ssn], (err, patient) => {
            if (err) {
                console.error('Error checking patient:', err);
                req.session.notification = {
                    type: 'error',
                    message: 'Database error occurred.'
                };
                return res.redirect(`/admin/visits/${visitId}/edit`);
            }
    
            if (!patient) {
                req.session.notification = {
                    type: 'error',
                    message: 'Selected patient does not exist.'
                };
                return res.redirect(`/admin/visits/${visitId}/edit`);
            }
    
            // Update visit
            db.run(`UPDATE patient_visits SET
                patient_ssn = ?, visit_date = ?, visit_status = ?, primary_diagnosis = ?,
                secondary_diagnosis = ?, diagnosis_code = ?, visit_type = ?, department = ?,
                created_by = ?, updated_at = CURRENT_TIMESTAMP
                WHERE visit_id = ?`,
            [patient_ssn, visit_date, visit_status, primary_diagnosis || null,
             secondary_diagnosis || null, diagnosis_code || null, visit_type || null,
             department || null, created_by || req.session.userId, visitId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    req.session.notification = {
                        type: 'error',
                        message: 'Error updating visit record.'
                    };
                    return res.redirect(`/admin/visits/${visitId}/edit`);
                }
    
                if (this.changes === 0) {
                    req.session.notification = {
                        type: 'error',
                        message: 'Visit not found or no changes made.'
                    };
                    return res.redirect(`/admin/visits/${visitId}/edit`);
                }
    
                req.session.notification = {
                    type: 'success',
                    message: 'Visit updated successfully.'
                };
                res.redirect('/admin/visits');
            });
        });
    });
    
    // Assessment Management Routes
    app.get('/admin/assessments', requireAuth, requireRole('admin'), (req, res) => {
        const { search, type, status, date_from, date_to } = req.query;
    
        let sql = `
            SELECT
                'nursing' as assessment_type,
                na.assessment_id as id,
                na.submission_id,
                na.assessed_at as assessment_date,
                fs.submission_status,
                p.full_name as patient_name,
                p.medical_number,
                pv.visit_id,
                pv.visit_date,
                u.full_name as assessed_by_name,
                na.chief_complaint,
                NULL as diagnosis,
                NULL as findings
            FROM nursing_assessments na
            JOIN form_submissions fs ON na.submission_id = fs.submission_id
            JOIN patient_visits pv ON fs.visit_id = pv.visit_id
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN users u ON na.assessed_by = u.user_id
            WHERE 1=1
    
            UNION ALL
    
            SELECT
                'radiology' as assessment_type,
                ra.radiology_id as id,
                ra.submission_id,
                ra.assessed_at as assessment_date,
                fs.submission_status,
                p.full_name as patient_name,
                p.medical_number,
                pv.visit_id,
                pv.visit_date,
                u.full_name as assessed_by_name,
                NULL as chief_complaint,
                ra.diagnosis,
                ra.findings
            FROM radiology_assessments ra
            JOIN form_submissions fs ON ra.submission_id = fs.submission_id
            JOIN patient_visits pv ON fs.visit_id = pv.visit_id
            JOIN patients p ON pv.patient_ssn = p.ssn
            LEFT JOIN users u ON ra.assessed_by = u.user_id
            WHERE 1=1
        `;
    
        const params = [];
    
        if (search) {
            sql += ` AND (p.full_name LIKE ? OR p.medical_number LIKE ? OR pv.visit_id LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
    
        if (type && type !== 'all') {
            if (type === 'nursing') {
                sql = sql.replace(/WHERE 1=1/g, "WHERE assessment_type = 'nursing' AND 1=1");
            } else if (type === 'radiology') {
                sql = sql.replace(/WHERE 1=1/g, "WHERE assessment_type = 'radiology' AND 1=1");
            }
        }
    
        if (status && status !== 'all') {
            sql += ` AND fs.submission_status = ?`;
            params.push(status);
        }
    
        if (date_from) {
            sql += ` AND DATE(assessment_date) >= ?`;
            params.push(date_from);
        }
    
        if (date_to) {
            sql += ` AND DATE(assessment_date) <= ?`;
            params.push(date_to);
        }
    
        sql += ` ORDER BY assessment_date DESC`;
    
        db.all(sql, params, (err, assessments) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }
    
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            res.render('admin-assessments', {
                user: req.session,
                assessments: assessments || [],
                filters: { search, type, status, date_from, date_to },
                notification: notification
            });
        });
    });
    
    // Delete assessment route
    app.post('/admin/assessments/:assessmentId/delete', requireAuth, requireRole('admin'), (req, res) => {
        const assessmentId = req.params.assessmentId;
        const assessmentType = req.query.type; // 'nursing' or 'radiology'
    
        if (!assessmentType || !['nursing', 'radiology'].includes(assessmentType)) {
            req.session.notification = {
                type: 'error',
                message: 'Invalid assessment type.'
            };
            return res.redirect('/admin/assessments');
        }
    
        // First, get the submission_id for the assessment
        let getSubmissionSql;
        if (assessmentType === 'nursing') {
            getSubmissionSql = 'SELECT submission_id FROM nursing_assessments WHERE assessment_id = ?';
        } else {
            getSubmissionSql = 'SELECT submission_id FROM radiology_assessments WHERE radiology_id = ?';
        }
    
        db.get(getSubmissionSql, [assessmentId], (err, result) => {
            if (err) {
                console.error('Error getting submission:', err);
                req.session.notification = {
                    type: 'error',
                    message: 'Database error occurred.'
                };
                return res.redirect('/admin/assessments');
            }
    
            if (!result) {
                req.session.notification = {
                    type: 'error',
                    message: 'Assessment not found.'
                };
                return res.redirect('/admin/assessments');
            }
    
            const submissionId = result.submission_id;
    
            // Delete the assessment
            let deleteAssessmentSql;
            if (assessmentType === 'nursing') {
                deleteAssessmentSql = 'DELETE FROM nursing_assessments WHERE assessment_id = ?';
            } else {
                deleteAssessmentSql = 'DELETE FROM radiology_assessments WHERE radiology_id = ?';
            }
    
            db.run(deleteAssessmentSql, [assessmentId], function(err) {
                if (err) {
                    console.error('Error deleting assessment:', err);
                    req.session.notification = {
                        type: 'error',
                        message: 'Error deleting assessment.'
                    };
                    return res.redirect('/admin/assessments');
                }
    
                // Delete the form submission
                db.run('DELETE FROM form_submissions WHERE submission_id = ?', [submissionId], function(err) {
                    if (err) {
                        console.error('Error deleting form submission:', err);
                        req.session.notification = {
                            type: 'error',
                            message: 'Assessment deleted but error cleaning up form submission.'
                        };
                        return res.redirect('/admin/assessments');
                    }
    
                    req.session.notification = {
                        type: 'success',
                        message: `${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} assessment deleted successfully.`
                    };
                    res.redirect('/admin/assessments');
                });
            });
        });
    });
    
    // View assessment details
    app.get('/admin/assessments/:assessmentId', requireAuth, requireRole('admin'), (req, res) => {
        const assessmentId = req.params.assessmentId;
        const assessmentType = req.query.type; // 'nursing' or 'radiology'
    
        if (!assessmentType || !['nursing', 'radiology'].includes(assessmentType)) {
            return res.status(400).send('Invalid assessment type');
        }
    
        let sql;
        if (assessmentType === 'nursing') {
            sql = `
                SELECT
                    'nursing' as assessment_type,
                    na.*,
                    fs.submission_status,
                    pv.visit_id, pv.visit_date, pv.visit_status as visit_status,
                    p.full_name as patient_name, p.medical_number, p.mobile_number,
                    p.date_of_birth, p.gender, p.address,
                    u.full_name as assessed_by_name,
                    us.signature_data as nurse_signature
                FROM nursing_assessments na
                JOIN form_submissions fs ON na.submission_id = fs.submission_id
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN users u ON na.assessed_by = u.user_id
                LEFT JOIN user_signatures us ON na.nurse_signature_id = us.signature_id
                WHERE na.assessment_id = ?
            `;
        } else {
            sql = `
                SELECT
                    'radiology' as assessment_type,
                    ra.*,
                    fs.submission_status,
                    pv.visit_id, pv.visit_date, pv.visit_status as visit_status,
                    p.full_name as patient_name, p.medical_number, p.mobile_number,
                    p.date_of_birth, p.gender, p.address,
                    u.full_name as assessed_by_name,
                    us.signature_data as physician_signature
                FROM radiology_assessments ra
                JOIN form_submissions fs ON ra.submission_id = fs.submission_id
                JOIN patient_visits pv ON fs.visit_id = pv.visit_id
                JOIN patients p ON pv.patient_ssn = p.ssn
                LEFT JOIN users u ON ra.assessed_by = u.user_id
                LEFT JOIN user_signatures us ON ra.physician_signature_id = us.signature_id
                WHERE ra.radiology_id = ?
            `;
        }
    
        db.get(sql, [assessmentId], (err, assessment) => {
            if (err || !assessment) {
                return res.status(404).send('Assessment not found');
            }
    
            // Get notification from session and clear it
            const notification = req.session.notification;
            if (req.session.notification) {
                delete req.session.notification;
            }
    
            res.render('admin-assessment-detail', {
                user: req.session,
                assessment: assessment,
                notification: notification
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
    
    app.get('/doctor', requireAuth, requireRole('physician'), (req, res) => {
        res.render('doctor-dashboard', { user: req.session, patient: null, error: null });
    });

};