const db = require('../config/database');

const getAdminDashboard = (req, res) => {
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
};

module.exports = {
    getAdminDashboard
};