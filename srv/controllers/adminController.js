const UserService = require('../services/userService');
const PatientService = require('../services/patientService');
const VisitService = require('../services/visitService');
const AssessmentService = require('../services/assessmentService');
const NotificationService = require('../services/notificationService');

const adminController = {
    // Dashboard
    async getDashboard(req, res) {
        try {
            const [userCount, patientCount, visitCount, assessmentCount, users] = await Promise.all([
                UserService.getUserCount(),
                PatientService.getPatientCount(),
                VisitService.getVisitCount(),
                AssessmentService.getAssessmentCount(),
                UserService.getUsers()
            ]);

            res.render('admin', {
                user: req.session,
                users: users,
                stats: {
                    users: userCount,
                    patients: patientCount,
                    visits: visitCount,
                    assessments: assessmentCount
                }
            });
        } catch (error) {
            console.error('Error getting admin dashboard:', error);
            res.status(500).send('Database error');
        }
    },

    // User Management
    async getUsers(req, res) {
        try {
            const filters = req.query;
            const users = await UserService.getUsers(filters);
            const notification = NotificationService.get(req);

            res.render('admin-users', {
                user: req.session,
                users: users,
                filters: filters,
                notification: notification
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).send('Database error');
        }
    },

    newUserForm(req, res) {
        res.render('user-form', { user: req.session, editUser: null, isNew: true });
    },

    async createUser(req, res) {
        try {
            const { username, email, full_name, role, password } = req.body;

            // Basic validation
            if (!username || !email || !full_name || !role || !password) {
                return res.status(400).send('All fields are required');
            }

            await UserService.createUser({ username, email, full_name, role, password });

            NotificationService.set(req, 'success', 'User created successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).send('Username or email already exists');
            }
            res.status(500).send('Error creating user');
        }
    },

    async editUserForm(req, res) {
        try {
            const userId = req.params.id;
            const editUser = await UserService.getUserById(userId);
            
            if (!editUser) {
                return res.status(404).send('User not found');
            }

            res.render('user-form', { user: req.session, editUser: editUser, isNew: false });
        } catch (error) {
            console.error('Error getting user:', error);
            res.status(500).send('Error getting user');
        }
    },

    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const { username, email, full_name, role, password, is_active } = req.body;

            // Basic validation
            if (!username || !email || !full_name || !role) {
                return res.status(400).send('Username, email, full name, and role are required');
            }

            const result = await UserService.updateUser(userId, {
                username, email, full_name, role, password, is_active: is_active ? 1 : 0
            });

            if (result.changes === 0) {
                return res.status(404).send('User not found');
            }

            NotificationService.set(req, 'success', 'User updated successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).send('Username or email already exists');
            }
            res.status(500).send('Error updating user');
        }
    },

    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            const result = await UserService.deleteUser(userId);

            if (result.changes === 0) {
                return res.status(404).send('User not found');
            }

            NotificationService.set(req, 'success', 'User deleted successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).send('Error deleting user');
        }
    },

    // Patient Management
    async getPatients(req, res) {
        try {
            const filters = req.query;
            const patients = await PatientService.getPatients(filters);
            const notification = NotificationService.get(req);

            res.render('admin-patients', {
                user: req.session,
                patients: patients,
                filters: filters,
                notification: notification
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).send('Database error');
        }
    },

    newPatientForm(req, res) {
        const notification = NotificationService.get(req);
        res.render('patient-form', { user: req.session, editPatient: null, isNew: true, notification });
    },

    async createPatient(req, res) {
        try {
            const patientData = req.body;

            // Basic validation
            if (!patientData.ssn || !patientData.full_name || !patientData.medical_number) {
                return res.status(400).send('SSN, full name, and medical number are required');
            }

            await PatientService.createPatient(patientData);

            NotificationService.set(req, 'success', 'Patient created successfully');
            res.redirect('/admin/patients');
        } catch (error) {
            console.error('Error creating patient:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).send('SSN or medical number already exists');
            }
            res.status(500).send('Error creating patient');
        }
    },

    async editPatientForm(req, res) {
        try {
            const ssn = req.params.ssn;
            const editPatient = await PatientService.getPatientBySSN(ssn);
            
            if (!editPatient) {
                return res.status(404).send('Patient not found');
            }

            res.render('patient-form', { user: req.session, editPatient: editPatient, isNew: false, notification: null });
        } catch (error) {
            console.error('Error getting patient:', error);
            res.status(500).send('Error getting patient');
        }
    },

    async updatePatient(req, res) {
        try {
            const ssn = req.params.ssn;
            const patientData = req.body;

            // Basic validation
            if (!patientData.full_name || !patientData.medical_number) {
                return res.status(400).send('Full name and medical number are required');
            }

            const result = await PatientService.updatePatient(ssn, patientData);

            if (result.changes === 0) {
                return res.status(404).send('Patient not found');
            }

            NotificationService.set(req, 'success', 'Patient updated successfully');
            res.redirect('/admin/patients');
        } catch (error) {
            console.error('Error updating patient:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).send('Medical number already exists');
            }
            res.status(500).send('Error updating patient');
        }
    },

    async deletePatient(req, res) {
        try {
            const ssn = req.params.ssn;
            const result = await PatientService.deletePatient(ssn);

            if (result.changes === 0) {
                return res.status(404).send('Patient not found');
            }

            NotificationService.set(req, 'success', 'Patient deleted successfully');
            res.redirect('/admin/patients');
        } catch (error) {
            console.error('Error deleting patient:', error);
            res.status(500).send('Error deleting patient');
        }
    },

    // Visit Management
    async getVisits(req, res) {
        try {
            const filters = req.query;
            const visits = await VisitService.getVisits(filters);
            const notification = NotificationService.get(req);

            res.render('admin-visits', {
                user: req.session,
                visits: visits,
                filters: filters,
                notification: notification
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).send('Database error');
        }
    },

    async deleteVisit(req, res) {
        try {
            const visitId = req.params.visitId;
            const result = await VisitService.deleteVisit(visitId);

            if (result.changes === 0) {
                return res.status(404).send('Visit not found');
            }

            console.log(`Visit ${visitId} and all related data deleted successfully`);
            NotificationService.set(req, 'success', 'Visit and all associated assessments have been deleted successfully.');

            // Redirect back to the previous page or admin visits
            const referrer = req.get('Referer') || '/admin/visits';
            res.redirect(referrer);
        } catch (error) {
            console.error('Error deleting visit:', error);
            res.status(500).send('Error deleting visit');
        }
    },

    async newVisitForm(req, res) {
        try {
            const patients = await PatientService.getPatientsForDropdown();
            res.render('visit-form', { user: req.session, patients: patients, editVisit: null, isNew: true });
        } catch (error) {
            console.error('Error getting patients:', error);
            res.status(500).send('Error getting patients');
        }
    },

    async createVisit(req, res) {
        try {
            const visitData = { ...req.body, created_by: req.session.userId };

            // Basic validation
            if (!visitData.patient_ssn || !visitData.visit_date || !visitData.visit_type) {
                return res.status(400).send('Patient, visit date, and visit type are required');
            }

            const result = await VisitService.createVisit(visitData);

            NotificationService.set(req, 'success', 'Visit created successfully');
            res.redirect('/admin/visits');
        } catch (error) {
            console.error('Error creating visit:', error);
            res.status(500).send('Error creating visit');
        }
    },

    async editVisitForm(req, res) {
        try {
            const visitId = req.params.visitId;
            const [editVisit, patients] = await Promise.all([
                VisitService.getVisitById(visitId),
                PatientService.getPatientsForDropdown()
            ]);
            
            if (!editVisit) {
                return res.status(404).send('Visit not found');
            }

            res.render('visit-form', { user: req.session, patients: patients, editVisit: editVisit, isNew: false });
        } catch (error) {
            console.error('Error getting visit:', error);
            res.status(500).send('Error getting visit');
        }
    },

    async updateVisit(req, res) {
        try {
            const visitId = req.params.visitId;
            const visitData = req.body;

            // Basic validation
            if (!visitData.visit_date || !visitData.visit_type) {
                return res.status(400).send('Visit date and visit type are required');
            }

            const result = await VisitService.updateVisit(visitId, visitData);

            if (result.changes === 0) {
                return res.status(404).send('Visit not found');
            }

            NotificationService.set(req, 'success', 'Visit updated successfully');
            res.redirect('/admin/visits');
        } catch (error) {
            console.error('Error updating visit:', error);
            res.status(500).send('Error updating visit');
        }
    },

    // Assessment Management
    async getAssessments(req, res) {
        try {
            const assessments = await AssessmentService.getAssessments();
            const notification = NotificationService.get(req);

            res.render('admin-assessments', {
                user: req.session,
                assessments: assessments,
                notification: notification
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).send('Database error');
        }
    },

    async deleteAssessment(req, res) {
        try {
            const assessmentId = req.params.assessmentId;
            const result = await AssessmentService.deleteAssessment(assessmentId);

            if (result.changes === 0) {
                return res.status(404).send('Assessment not found');
            }

            NotificationService.set(req, 'success', 'Assessment deleted successfully');

            // Redirect back to the previous page or admin assessments
            const referrer = req.get('Referer') || '/admin/assessments';
            res.redirect(referrer);
        } catch (error) {
            console.error('Error deleting assessment:', error);
            res.status(500).send('Error deleting assessment');
        }
    },

    async getAssessmentDetail(req, res) {
        try {
            const assessmentId = req.params.assessmentId;
            const assessment = await AssessmentService.getAssessmentById(assessmentId);
            
            if (!assessment) {
                return res.status(404).send('Assessment not found');
            }

            res.render('assessment-detail', { user: req.session, assessment: assessment });
        } catch (error) {
            console.error('Error getting assessment:', error);
            res.status(500).send('Error getting assessment');
        }
    },

    async getVisitDetail(req, res) {
        try {
            const visitId = req.params.visitId;
            const visit = await VisitService.getVisitById(visitId);
            
            if (!visit) {
                return res.status(404).send('Visit not found');
            }

            res.render('visit-detail', { user: req.session, visit: visit });
        } catch (error) {
            console.error('Error getting visit:', error);
            res.status(500).send('Error getting visit');
        }
    },

    async printVisit(req, res) {
        try {
            const visitId = req.params.visitId;
            const visitData = await VisitService.getVisitForPrint(visitId);
            
            if (!visitData.visit) {
                return res.status(404).send('Visit not found');
            }

            res.render('visit-print', visitData);
        } catch (error) {
            console.error('Error getting visit for printing:', error);
            res.status(500).send('Error getting visit');
        }
    }
};

module.exports = adminController;