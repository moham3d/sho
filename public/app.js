// Al-Shorouk Radiology Management System - Frontend JavaScript

class RadiologyApp {
    constructor() {
        console.log('RadiologyApp constructor called');
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.currentView = 'patients';
        this.currentVisitId = null;
        
        console.log('Token from localStorage:', this.token);
        console.log('User from localStorage:', this.user);

        console.log('Initializing event listeners');
        this.initializeEventListeners();
        console.log('Checking authentication');
        this.checkAuth();
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            console.log('Login form found, adding event listener');
            loginForm.addEventListener('submit', (e) => {
                console.log('Login form submitted');
                e.preventDefault();
                this.login();
            });
        } else {
            console.error('Login form not found!');
        }

        // Also add click handler for login button
        const loginBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
        if (loginBtn) {
            console.log('Login button found, adding click handler');
            loginBtn.addEventListener('click', (e) => {
                console.log('Login button clicked');
                e.preventDefault();
                this.login();
            });
        }

        // Navigation
        document.getElementById('patients-btn').addEventListener('click', () => this.showView('patients'));
        document.getElementById('visits-btn').addEventListener('click', () => this.showView('visits'));
        document.getElementById('nurse-forms-btn').addEventListener('click', () => this.showView('nurse-forms'));
        document.getElementById('doctor-forms-btn').addEventListener('click', () => this.showView('doctor-forms'));
        document.getElementById('admin-btn').addEventListener('click', () => this.showView('admin'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Bootstrap modals will be handled by Bootstrap's JavaScript
        // No need for manual close handlers
        document.getElementById('clear-signature').addEventListener('click', () => this.clearSignature());
        document.getElementById('save-signature').addEventListener('click', () => this.saveSignature());
    }

    checkAuth() {
        console.log('checkAuth() called, token:', this.token, 'user:', this.user);
        if (this.token) {
            if (!this.user) {
                this.user = JSON.parse(localStorage.getItem('user') || 'null');
                console.log('Loaded user from localStorage:', this.user);
            }
            console.log('Token exists, calling showApp()');
            this.showApp();
        } else {
            console.log('No token, calling showLogin()');
            this.showLogin();
        }
    }

    async login() {
        console.log('Login function called');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Username:', username, 'Password length:', password.length);

        if (!username || !password) {
            this.showError('login-error', 'Please enter both username and password');
            return;
        }

        try {
            console.log('Attempting login API call');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // Hide login error if it was shown
                const errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                console.log('Login successful, showing app');
                this.showApp();
            } else {
                console.log('Login failed with error:', data.error);
                this.showError('login-error', data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login-error', 'Login failed. Please check your connection.');
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showLogin();
    }

    showLogin() {
        console.log('showLogin() called');
        const loginSection = document.getElementById('login-section');
        const appSection = document.getElementById('app');
        
        if (loginSection) {
            loginSection.style.setProperty('display', 'flex', 'important');
            console.log('Login section shown with !important');
        }
        
        if (appSection) {
            appSection.style.setProperty('display', 'none', 'important');
            console.log('App section hidden with !important');
        }
    }

    showApp() {
        console.log('showApp() called');
        console.log('Current user:', this.user);
        
        const loginSection = document.getElementById('login-section');
        const appSection = document.getElementById('app');
        
        console.log('Login section element:', loginSection);
        console.log('App section element:', appSection);
        
        if (loginSection) {
            loginSection.style.setProperty('display', 'none', 'important');
            console.log('Login section hidden with !important');
        } else {
            console.error('Login section not found');
        }
        
        if (appSection) {
            appSection.style.setProperty('display', 'block', 'important');
            console.log('App section shown with !important');
        } else {
            console.error('App section not found');
        }

        // Update user info
        if (this.user && this.user.name) {
            const userName = document.getElementById('user-name');
            const userRole = document.getElementById('user-role');
            
            if (userName) {
                userName.textContent = this.user.name;
                console.log('User name set to:', this.user.name);
            } else {
                console.error('user-name element not found');
            }
            
            if (userRole) {
                userRole.textContent = this.getRoleName(this.user.role);
                console.log('User role set to:', this.getRoleName(this.user.role));
            } else {
                console.error('user-role element not found');
            }
        } else {
            console.error('User data is missing:', this.user);
        }

        // Show/hide navigation based on role
        this.updateNavigation();
        this.showView('patients');
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Admin',
            'doctor': 'Doctor',
            'nurse': 'Nurse'
        };
        return roles[role] || role;
    }

    updateNavigation() {
        const nurseFormsBtn = document.getElementById('nurse-forms-btn');
        const doctorFormsBtn = document.getElementById('doctor-forms-btn');
        const adminBtn = document.getElementById('admin-btn');

        if (this.user.role === 'nurse') {
            nurseFormsBtn.style.display = 'inline-block';
            doctorFormsBtn.style.display = 'none';
            adminBtn.style.display = 'none';
        } else if (this.user.role === 'doctor') {
            nurseFormsBtn.style.display = 'none';
            doctorFormsBtn.style.display = 'inline-block';
            adminBtn.style.display = 'none';
        } else if (this.user.role === 'admin') {
            nurseFormsBtn.style.display = 'inline-block';
            doctorFormsBtn.style.display = 'inline-block';
            adminBtn.style.display = 'inline-block';
        }
    }

    showView(view) {
        this.currentView = view;

        // Update active navigation for Bootstrap navbar
        document.querySelectorAll('.navbar-nav .nav-link').forEach(btn => {
            btn.classList.remove('active');
            btn.style.backgroundColor = '';
        });
        const activeBtn = document.getElementById(`${view}-btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }

        // Load view content
        switch (view) {
            case 'patients':
                this.loadPatients();
                break;
            case 'visits':
                this.loadVisits();
                break;
            case 'nurse-forms':
                this.loadNurseForms();
                break;
            case 'doctor-forms':
                this.loadDoctorForms();
                break;
            case 'admin':
                this.loadAdminPanel();
                break;
        }
    }

    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        return response;
    }

    async loadPatients() {
        this.showLoading();

        try {
            const response = await this.apiCall('/api/patients');
            const patients = await response.json();

            this.renderPatients(patients);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل بيانات المرضى');
        }
    }

    renderPatients(patients) {
        const html = `
            <div class="card medical-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-people-fill me-2"></i>Patient Management
                    </h5>
                    <button class="btn btn-light btn-sm" onclick="app.showEnhancedPatientModal()">
                        <i class="bi bi-person-plus me-2"></i>Add New Patient
                    </button>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-search"></i>
                                </span>
                                <input type="text" id="patient-search" class="form-control" placeholder="Search patients by name, ID, or mobile...">
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <small class="text-muted">
                                <i class="bi bi-info-circle me-1"></i>
                                ${patients.length} patient${patients.length !== 1 ? 's' : ''} found
                            </small>
                        </div>
                    </div>
                    
                    <div class="row" id="patient-list">
                        ${patients.map(patient => `
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card patient-card h-100" onclick="app.showEnhancedPatientModal(${patient.id})" style="cursor: pointer;">
                                    <div class="card-body">
                                        <h6 class="card-title text-primary">
                                            <i class="bi bi-person me-2"></i>${patient.full_name}
                                        </h6>
                                        <div class="card-text">
                                            <small class="text-muted d-block">
                                                <i class="bi bi-card-text me-1"></i>
                                                ID: ${patient.national_id || 'Not specified'}
                                            </small>
                                            <small class="text-muted d-block">
                                                <i class="bi bi-telephone me-1"></i>
                                                ${patient.mobile || 'No phone'}
                                            </small>
                                            <small class="text-muted d-block">
                                                <i class="bi bi-calendar me-1"></i>
                                                Age: ${patient.age || 'Not specified'} • ${patient.gender || 'Not specified'}
                                            </small>
                                        </div>
                                        <div class="mt-3">
                                            <button class="btn btn-primary btn-sm me-2" onclick="event.stopPropagation(); app.createVisit(${patient.id})">
                                                <i class="bi bi-plus-circle me-1"></i>New Visit
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); app.showEnhancedPatientModal(${patient.id})">
                                                <i class="bi bi-pencil me-1"></i>Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${patients.length === 0 ? `
                        <div class="text-center py-5">
                            <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
                            <h5 class="text-muted mt-3">No Patients Found</h5>
                            <p class="text-muted">Start by adding your first patient to the system.</p>
                            <button class="btn btn-primary" onclick="app.showEnhancedPatientModal()">
                                <i class="bi bi-person-plus me-2"></i>Add First Patient
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Add search functionality
        document.getElementById('patient-search').addEventListener('input', (e) => {
            this.filterPatients(e.target.value, patients);
        });
    }

    filterPatients(searchTerm, patients) {
        const filtered = patients.filter(patient =>
            patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.national_id && patient.national_id.includes(searchTerm)) ||
            (patient.medical_number && patient.medical_number.includes(searchTerm)) ||
            (patient.mobile && patient.mobile.includes(searchTerm))
        );
        
        // Update the patient list container only
        const patientListContainer = document.getElementById('patient-list');
        if (patientListContainer) {
            patientListContainer.innerHTML = filtered.map(patient => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card patient-card h-100" onclick="app.showEnhancedPatientModal(${patient.id})" style="cursor: pointer;">
                        <div class="card-body">
                            <h6 class="card-title text-primary">
                                <i class="bi bi-person me-2"></i>${patient.full_name}
                            </h6>
                            <div class="card-text">
                                <small class="text-muted d-block">
                                    <i class="bi bi-card-text me-1"></i>
                                    ID: ${patient.national_id || 'Not specified'}
                                </small>
                                <small class="text-muted d-block">
                                    <i class="bi bi-telephone me-1"></i>
                                    ${patient.mobile || 'No phone'}
                                </small>
                                <small class="text-muted d-block">
                                    <i class="bi bi-calendar me-1"></i>
                                    Age: ${patient.age || 'Not specified'} • ${patient.gender || 'Not specified'}
                                </small>
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-primary btn-sm me-2" onclick="event.stopPropagation(); app.createVisit(${patient.id})">
                                    <i class="bi bi-plus-circle me-1"></i>New Visit
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation(); app.showEnhancedPatientModal(${patient.id})">
                                    <i class="bi bi-pencil me-1"></i>Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Update the counter
            const counterElement = document.querySelector('.text-muted small');
            if (counterElement) {
                counterElement.innerHTML = `
                    <i class="bi bi-info-circle me-1"></i>
                    ${filtered.length} patient${filtered.length !== 1 ? 's' : ''} found
                `;
            }
        }
    }

    async loadVisits() {
        this.showLoading();

        try {
            const response = await this.apiCall('/api/visits');
            const visits = await response.json();

            this.renderVisits(visits);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل بيانات الزيارات');
        }
    }

    renderVisits(visits) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Visits</h2>
                </div>
                <ul class="visit-list">
                    ${visits.map(visit => `
                        <li class="visit-item" onclick="app.showVisitModal(${visit.id})">
                            <div class="visit-info">
                                <div>
                                    <div class="visit-patient">${visit.patient_name}</div>
                                    <div class="visit-details">
                                        Visit Date: ${new Date(visit.visit_date).toLocaleDateString('en-US')} |
                                        Status: <span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span>
                                    </div>
                                    <div class="visit-details">
                                        Nurse: ${visit.nurse_name || 'Not assigned'} |
                                        Doctor: ${visit.doctor_name || 'Not assigned'}
                                    </div>
                                </div>
                                <div class="actions">
                                    ${this.user.role === 'nurse' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.showNurseForm(${visit.id})">Nurse Assessment</button>` : ''}
                                    ${this.user.role === 'doctor' || this.user.role === 'admin' ?
                                        `<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.showDoctorForm(${visit.id})">Doctor Evaluation</button>` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        document.getElementById('content').innerHTML = html;
    }

    getStatusName(status) {
        const statuses = {
            'open': 'Open',
            'in_progress': 'In Progress',
            'signed': 'Signed',
            'closed': 'Closed'
        };
        return statuses[status] || status;
    }

    async loadNurseForms() {
        this.showLoading();

        try {
            // Load visits where this nurse is assigned or can be assigned
            const response = await this.apiCall('/api/visits');
            const visits = await response.json();
            
            // Filter visits that this nurse can access
            const nurseVisits = visits.filter(visit => 
                this.user.role === 'admin' || 
                visit.nurse_id === this.user.id || 
                visit.nurse_id === null
            );

            this.renderNurseForms(nurseVisits);
        } catch (error) {
            this.showError('content', 'Error loading nurse forms');
        }
    }

    renderNurseForms(visits) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Nurse Assessment Forms</h2>
                </div>
                <div class="forms-list">
                    ${visits.length === 0 ? 
                        '<div class="no-data">No visits available for nurse assessments</div>' :
                        visits.map(visit => `
                            <div class="form-item" onclick="app.showNurseForm(${visit.id})">
                                <div class="form-info">
                                    <div class="form-header">
                                        <h4>Patient: ${visit.patient_name}</h4>
                                        <span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span>
                                    </div>
                                    <div class="form-details">
                                        <p><strong>Visit Date:</strong> ${new Date(visit.visit_date).toLocaleDateString()}</p>
                                        <p><strong>Visit ID:</strong> #${visit.id}</p>
                                        <p><strong>Assigned Nurse:</strong> ${visit.nurse_name || 'Not assigned'}</p>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.showNurseForm(${visit.id})">
                                        ${visit.nurse_name ? 'Edit Assessment' : 'Start Assessment'}
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = html;
    }

    async loadDoctorForms() {
        this.showLoading();

        try {
            // Load visits where this doctor is assigned or can be assigned
            const response = await this.apiCall('/api/visits');
            const visits = await response.json();
            
            // Filter visits that this doctor can access
            const doctorVisits = visits.filter(visit => 
                this.user.role === 'admin' || 
                visit.doctor_id === this.user.id || 
                visit.doctor_id === null
            );

            this.renderDoctorForms(doctorVisits);
        } catch (error) {
            this.showError('content', 'Error loading doctor forms');
        }
    }

    renderDoctorForms(visits) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Doctor Radiology Evaluations</h2>
                </div>
                <div class="forms-list">
                    ${visits.length === 0 ? 
                        '<div class="no-data">No visits available for doctor evaluations</div>' :
                        visits.map(visit => `
                            <div class="form-item" onclick="app.showDoctorForm(${visit.id})">
                                <div class="form-info">
                                    <div class="form-header">
                                        <h4>Patient: ${visit.patient_name}</h4>
                                        <span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span>
                                    </div>
                                    <div class="form-details">
                                        <p><strong>Visit Date:</strong> ${new Date(visit.visit_date).toLocaleDateString()}</p>
                                        <p><strong>Visit ID:</strong> #${visit.id}</p>
                                        <p><strong>Assigned Doctor:</strong> ${visit.doctor_name || 'Not assigned'}</p>
                                        <p><strong>Nurse Assessment:</strong> ${visit.nurse_name ? 'Completed' : 'Pending'}</p>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.showDoctorForm(${visit.id})">
                                        ${visit.doctor_name ? 'Edit Evaluation' : 'Start Evaluation'}
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = html;
    }

    showPatientModal(patientId = null) {
        const title = patientId ? 'Edit Patient' : 'Add New Patient';
        const patient = patientId ? {} : {}; // Would load patient data if editing

        const html = `
            <form id="patient-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="full_name" required>
                    </div>
                    <div class="form-group">
                        <label>National ID</label>
                        <input type="text" name="national_id">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Mobile Phone</label>
                        <input type="tel" name="mobile">
                    </div>
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dob">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" name="age">
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select name="gender">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Medical Number</label>
                        <input type="text" name="medical_number">
                    </div>
                    <div class="form-group">
                        <label>Diagnosis</label>
                        <input type="text" name="diagnosis">
                    </div>
                </div>
                <div class="form-group">
                    <label>Additional Contact Info (JSON)</label>
                    <textarea name="contact_info" placeholder='{"email": "patient@example.com", "address": "City, Country"}'></textarea>
                </div>
                <div class="actions" style="margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(title, html);

        // Form submission
        document.getElementById('patient-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePatient(new FormData(e.target), patientId);
        });
    }

    async savePatient(formData, patientId) {
        const data = Object.fromEntries(formData);

        try {
            const response = await this.apiCall(
                patientId ? `/api/patients/${patientId}` : '/api/patients',
                {
                    method: patientId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                this.closeModal();
                this.loadPatients();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    async showEnhancedPatientModal(patientId = null) {
        const title = patientId ? 'Edit Patient' : 'Add New Patient';
        let patient = {};
        
        if (patientId) {
            try {
                const response = await this.apiCall(`/api/patients/${patientId}`);
                patient = await response.json();
                
                // Parse contact_info if it exists
                if (patient.contact_info && typeof patient.contact_info === 'string') {
                    try {
                        patient.contact_info = JSON.parse(patient.contact_info);
                    } catch (e) {
                        patient.contact_info = {};
                    }
                } else if (!patient.contact_info) {
                    patient.contact_info = {};
                }
            } catch (error) {
                this.showError('content', 'Error loading patient data');
                return;
            }
        } else {
            patient.contact_info = {};
        }

        const html = `
            <form id="enhanced-patient-form" class="multi-step-form">
                <!-- Progress Indicator -->
                <div class="progress mb-4" style="height: 8px;">
                    <div class="progress-bar bg-primary progress-fill" style="width: 33.33%;"></div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-12">
                        <nav aria-label="Form steps">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item active" data-step="1">
                                    <i class="bi bi-1-circle-fill me-1"></i>Basic Info
                                </li>
                                <li class="breadcrumb-item" data-step="2">
                                    <i class="bi bi-2-circle me-1"></i>Contact
                                </li>
                                <li class="breadcrumb-item" data-step="3">
                                    <i class="bi bi-3-circle me-1"></i>Medical
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <!-- Step 1: Basic Information -->
                <div class="form-step active" data-step="1">
                    <div class="card border-0 bg-light">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="bi bi-person-fill me-2"></i>Basic Information
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label required">
                                        <i class="bi bi-person me-2"></i>Full Name
                                    </label>
                                    <input type="text" class="form-control" name="full_name" value="${patient.full_name || ''}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-card-text me-2"></i>National ID
                                    </label>
                                    <input type="text" class="form-control" name="national_id" value="${patient.national_id || ''}">
                                </div>
                            </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Medical Number</label>
                            <input type="text" name="medical_number" value="${patient.medical_number || ''}">
                        </div>
                        <div class="form-group">
                            <label>Date of Birth</label>
                            <input type="date" name="dob" value="${patient.dob || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Age</label>
                            <input type="number" name="age" value="${patient.age || ''}" min="0" max="150">
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select name="gender">
                                <option value="">Select Gender</option>
                                <option value="male" ${patient.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${patient.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${patient.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Contact Information -->
                <div class="form-step" data-step="2">
                    <h3>Contact Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Mobile Phone</label>
                            <input type="tel" name="mobile" value="${patient.mobile || ''}">
                        </div>
                        <div class="form-group">
                            <label>Home Phone</label>
                            <input type="tel" name="contact_home_phone" value="${patient.contact_info?.home_phone || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" name="contact_email" value="${patient.contact_info?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>Emergency Contact Name</label>
                            <input type="text" name="contact_emergency_name" value="${patient.contact_info?.emergency_contact_name || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Emergency Contact Phone</label>
                            <input type="tel" name="contact_emergency_phone" value="${patient.contact_info?.emergency_contact_phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Relationship to Emergency Contact</label>
                            <select name="contact_emergency_relationship">
                                <option value="">Select Relationship</option>
                                <option value="spouse" ${patient.contact_info?.emergency_relationship === 'spouse' ? 'selected' : ''}>Spouse</option>
                                <option value="parent" ${patient.contact_info?.emergency_relationship === 'parent' ? 'selected' : ''}>Parent</option>
                                <option value="child" ${patient.contact_info?.emergency_relationship === 'child' ? 'selected' : ''}>Child</option>
                                <option value="sibling" ${patient.contact_info?.emergency_relationship === 'sibling' ? 'selected' : ''}>Sibling</option>
                                <option value="friend" ${patient.contact_info?.emergency_relationship === 'friend' ? 'selected' : ''}>Friend</option>
                                <option value="other" ${patient.contact_info?.emergency_relationship === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="contact_address" rows="3" placeholder="Street address, city, postal code">${patient.contact_info?.address || ''}</textarea>
                    </div>
                </div>

                <!-- Step 3: Medical Information -->
                <div class="form-step" data-step="3">
                    <h3>Medical Information</h3>
                    <div class="form-group">
                        <label>Primary Diagnosis</label>
                        <input type="text" name="diagnosis" value="${patient.diagnosis || ''}" placeholder="Primary diagnosis or reason for visit">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Insurance Provider</label>
                            <input type="text" name="contact_insurance_provider" value="${patient.contact_info?.insurance_provider || ''}">
                        </div>
                        <div class="form-group">
                            <label>Insurance Number</label>
                            <input type="text" name="contact_insurance_number" value="${patient.contact_info?.insurance_number || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Allergies</label>
                        <textarea name="contact_allergies" rows="3" placeholder="Known allergies (medications, foods, environmental)">${patient.contact_info?.allergies || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Current Medications</label>
                        <textarea name="contact_medications" rows="3" placeholder="Current medications with dosages">${patient.contact_info?.medications || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Medical Notes</label>
                        <textarea name="contact_notes" rows="3" placeholder="Additional medical notes or comments">${patient.contact_info?.notes || ''}</textarea>
                    </div>
                </div>

                <div class="form-navigation">
                    <button type="button" class="btn btn-secondary prev-step" disabled>Previous</button>
                    <button type="button" class="btn btn-primary next-step">Next</button>
                    <button type="submit" class="btn btn-success submit-form" style="display: none;">Save Patient</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(title, html);
        this.initializeMultiStepForm();
        
        // Add real-time validation to the form
        const form = document.getElementById('enhanced-patient-form');
        this.addFieldValidation(form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form before submission
            if (this.validateFormBeforeSubmit(e.target)) {
                await this.saveEnhancedPatient(new FormData(e.target), patientId);
            }
        });
    }

    initializeMultiStepForm() {
        const form = document.getElementById('enhanced-patient-form');
        const steps = form.querySelectorAll('.form-step');
        const indicators = form.querySelectorAll('.step');
        const nextBtn = form.querySelector('.next-step');
        const prevBtn = form.querySelector('.prev-step');
        const submitBtn = form.querySelector('.submit-form');
        let currentStep = 1;

        function updateStep() {
            // Hide all steps
            steps.forEach(step => step.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active', 'completed'));
            
            // Show current step
            const activeStep = form.querySelector(`[data-step="${currentStep}"]`);
            if (activeStep) activeStep.classList.add('active');
            
            // Update indicators
            indicators.forEach((indicator, index) => {
                if (index + 1 < currentStep) {
                    indicator.classList.add('completed');
                } else if (index + 1 === currentStep) {
                    indicator.classList.add('active');
                }
            });
            
            // Update buttons
            prevBtn.disabled = currentStep === 1;
            
            if (currentStep === steps.length) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                submitBtn.style.display = 'none';
            }
        }

        nextBtn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                currentStep++;
                updateStep();
            }
        });

        prevBtn.addEventListener('click', () => {
            currentStep--;
            updateStep();
        });

        function validateCurrentStep() {
            const activeStep = form.querySelector(`[data-step="${currentStep}"].form-step`);
            const requiredFields = activeStep.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            let errors = [];
            
            requiredFields.forEach(field => {
                const fieldName = field.name || field.id || 'Field';
                const label = field.closest('.form-group')?.querySelector('label')?.textContent || fieldName;
                
                if (!field.value.trim()) {
                    field.classList.add('error');
                    errors.push(`${label} is required`);
                    isValid = false;
                } else {
                    field.classList.remove('error');
                    
                    // Additional validation based on field type
                    if (field.type === 'email' && !this.validateEmail(field.value)) {
                        field.classList.add('error');
                        errors.push(`${label} must be a valid email address`);
                        isValid = false;
                    } else if (field.type === 'tel' && !this.validatePhone(field.value)) {
                        field.classList.add('error');
                        errors.push(`${label} must be a valid phone number`);
                        isValid = false;
                    } else if (field.type === 'number') {
                        const min = parseInt(field.min);
                        const max = parseInt(field.max);
                        const value = parseInt(field.value);
                        
                        if (!isNaN(min) && value < min) {
                            field.classList.add('error');
                            errors.push(`${label} must be at least ${min}`);
                            isValid = false;
                        } else if (!isNaN(max) && value > max) {
                            field.classList.add('error');
                            errors.push(`${label} must be no more than ${max}`);
                            isValid = false;
                        }
                    }
                }
            });
            
            if (!isValid) {
                this.showValidationErrors(errors);
            } else {
                this.clearValidationErrors();
            }
            
            return isValid;
        }

        updateStep();
    }

    async saveEnhancedPatient(formData, patientId) {
        // Build contact_info object from form fields
        const contactInfo = {
            home_phone: formData.get('contact_home_phone'),
            email: formData.get('contact_email'),
            emergency_contact_name: formData.get('contact_emergency_name'),
            emergency_contact_phone: formData.get('contact_emergency_phone'),
            emergency_relationship: formData.get('contact_emergency_relationship'),
            address: formData.get('contact_address'),
            insurance_provider: formData.get('contact_insurance_provider'),
            insurance_number: formData.get('contact_insurance_number'),
            allergies: formData.get('contact_allergies'),
            medications: formData.get('contact_medications'),
            notes: formData.get('contact_notes')
        };

        // Remove empty fields from contact_info
        Object.keys(contactInfo).forEach(key => {
            if (!contactInfo[key]) {
                delete contactInfo[key];
            }
        });

        const patientData = {
            full_name: formData.get('full_name'),
            national_id: formData.get('national_id'),
            medical_number: formData.get('medical_number'),
            mobile: formData.get('mobile'),
            dob: formData.get('dob'),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            gender: formData.get('gender'),
            diagnosis: formData.get('diagnosis'),
            contact_info: contactInfo
        };

        try {
            const method = patientId ? 'PUT' : 'POST';
            const url = patientId ? `/api/patients/${patientId}` : '/api/patients';
            
            const response = await this.apiCall(url, {
                method: method,
                body: JSON.stringify(patientData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeModal();
                this.showNotification(`Patient ${patientData.full_name} ${patientId ? 'updated' : 'created'} successfully!`, 'success');
                // Reload the appropriate view
                if (this.currentView === 'admin') {
                    this.loadAdminPatients();
                } else {
                    this.loadPatients();
                }
            } else {
                this.showError('modal-body', result.error);
            }
        } catch (error) {
            this.showError('modal-body', 'Error saving patient');
        }
    }

    async createVisit(patientId) {
        try {
            const response = await this.apiCall('/api/visits', {
                method: 'POST',
                body: JSON.stringify({ patient_id: patientId })
            });

            if (response.ok) {
                alert('Visit created successfully');
                this.loadVisits();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Failed to create visit');
        }
    }

    showNurseForm(visitId) {
        this.currentVisitId = visitId;
        this.loadNurseForm(visitId);
    }

    async loadNurseForm(visitId) {
        this.showLoading();

        try {
            const response = await this.apiCall(`/api/nurse-forms/${visitId}`);
            const formData = await response.json();
            
            // Store the form ID for signature
            this.currentNurseFormId = formData.id;

            this.renderNurseForm(formData, visitId);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل نموذج الممرض');
        }
    }

    renderNurseForm(formData, visitId) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Nurse Assessment</h2>
                    <div class="actions">
                        <button class="btn btn-secondary" onclick="app.printForm('nurse')">Print Form</button>
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signNurseForm()">Sign Form</button>' : '<span class="status-badge status-signed">Signed</span>'}
                    </div>
                </div>

                <form id="nurse-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="nurse_id" value="${this.user.id}">

                    <!-- Basic Screening -->
                    <div class="form-section">
                        <h3>Basic Screening</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mode of Arrival</label>
                                <select name="arrival_mode">
                                    <option value="">Select</option>
                                    <option value="ambulatory" ${formData.arrival_mode === 'ambulatory' ? 'selected' : ''}>Ambulatory</option>
                                    <option value="stretcher" ${formData.arrival_mode === 'stretcher' ? 'selected' : ''}>Stretcher</option>
                                    <option value="chair" ${formData.arrival_mode === 'chair' ? 'selected' : ''}>Wheelchair</option>
                                    <option value="other" ${formData.arrival_mode === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Chief Complaint</label>
                                <input type="text" name="chief_complaint" value="${formData.chief_complaint || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Age Description</label>
                                <input type="text" name="age_text" value="${formData.age_text || ''}">
                            </div>
                            <div class="form-group">
                                <label>Accompanied By</label>
                                <select name="accompanied_by">
                                    <option value="">Select</option>
                                    <option value="spouse" ${formData.accompanied_by === 'spouse' ? 'selected' : ''}>Spouse</option>
                                    <option value="relative" ${formData.accompanied_by === 'relative' ? 'selected' : ''}>Relative</option>
                                    <option value="other" ${formData.accompanied_by === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Language Spoken</label>
                            <select name="language_spoken">
                                <option value="">Select</option>
                                <option value="Arabic" ${formData.language_spoken === 'Arabic' ? 'selected' : ''}>Arabic</option>
                                <option value="English" ${formData.language_spoken === 'English' ? 'selected' : ''}>English</option>
                                <option value="other" ${formData.language_spoken === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>

                    <!-- Vital Signs -->
                    <div class="form-section">
                        <h3>Vital Signs</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Temperature (°C)</label>
                                <input type="text" name="temp" value="${formData.temp || ''}">
                            </div>
                            <div class="form-group">
                                <label>Pulse (bpm)</label>
                                <input type="text" name="pulse" value="${formData.pulse || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Blood Pressure</label>
                                <input type="text" name="bp" placeholder="120/80" value="${formData.bp || ''}">
                            </div>
                            <div class="form-group">
                                <label>Respiratory Rate</label>
                                <input type="text" name="resp_rate" value="${formData.resp_rate || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>O2 Saturation (%)</label>
                                <input type="text" name="o2_saturation" value="${formData.o2_saturation || ''}">
                            </div>
                            <div class="form-group">
                                <label>Blood Sugar</label>
                                <input type="text" name="blood_sugar" value="${formData.blood_sugar || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Weight (kg)</label>
                                <input type="text" name="weight" value="${formData.weight || ''}">
                            </div>
                            <div class="form-group">
                                <label>Height (cm)</label>
                                <input type="text" name="height" value="${formData.height || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Psychosocial Assessment -->
                    <div class="form-section">
                        <h3>Psychosocial Assessment</h3>
                        <div class="form-group">
                            <label>Psychosocial History</label>
                            <textarea name="psychosocial_history">${formData.psychosocial_history || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Psychological State</label>
                                <select name="psychological_problem">
                                    <option value="">Select</option>
                                    <option value="anxious" ${formData.psychological_problem === 'anxious' ? 'selected' : ''}>Anxious</option>
                                    <option value="agitated" ${formData.psychological_problem === 'agitated' ? 'selected' : ''}>Agitated</option>
                                    <option value="depressed" ${formData.psychological_problem === 'depressed' ? 'selected' : ''}>Depressed</option>
                                    <option value="none" ${formData.psychological_problem === 'none' ? 'selected' : ''}>No problems</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Special Habits</label>
                                <input type="text" name="special_habits" placeholder="Smoking, etc." value="${formData.special_habits || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Allergies</label>
                                <select name="allergies">
                                    <option value="">Select</option>
                                    <option value="yes" ${formData.allergies === 'yes' ? 'selected' : ''}>Yes</option>
                                    <option value="no" ${formData.allergies === 'no' ? 'selected' : ''}>No</option>
                                    <option value="unknown" ${formData.allergies === 'unknown' ? 'selected' : ''}>Unknown</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Allergy Details</label>
                                <input type="text" name="allergies_details" value="${formData.allergies_details || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Nutritional Assessment -->
                    <div class="form-section">
                        <h3>Nutritional Assessment</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Diet Type</label>
                                <select name="diet">
                                    <option value="">Select</option>
                                    <option value="regular" ${formData.diet === 'regular' ? 'selected' : ''}>Regular</option>
                                    <option value="special" ${formData.diet === 'special' ? 'selected' : ''}>Special</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Appetite</label>
                                <select name="appetite">
                                    <option value="">Select</option>
                                    <option value="good" ${formData.appetite === 'good' ? 'selected' : ''}>Good</option>
                                    <option value="poor" ${formData.appetite === 'poor' ? 'selected' : ''}>Poor</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="gi_problems" ${formData.gi_problems ? 'checked' : ''}>
                                <label>GI Problems</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>GI Problems Details</label>
                            <textarea name="gi_problems_details">${formData.gi_problems_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_loss" ${formData.weight_loss ? 'checked' : ''}>
                                <label>Weight Loss</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="weight_gain" ${formData.weight_gain ? 'checked' : ''}>
                                <label>Weight Gain</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="refer_to_nutritionist" ${formData.refer_to_nutritionist ? 'checked' : ''}>
                                <label>Refer to Nutritionist</label>
                            </div>
                        </div>
                    </div>

                    <!-- Functional Assessment -->
                    <div class="form-section">
                        <h3>Functional Assessment</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Self Care</label>
                                <select name="self_care_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.self_care_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.self_care_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.self_care_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Eating</label>
                                <select name="feeding_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.feeding_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.feeding_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.feeding_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Hygiene</label>
                                <select name="hygiene_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.hygiene_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.hygiene_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.hygiene_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Toileting</label>
                                <select name="toileting_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.toileting_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.toileting_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.toileting_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ambulation</label>
                                <select name="ambulation_status">
                                    <option value="">Select</option>
                                    <option value="independent" ${formData.ambulation_status === 'independent' ? 'selected' : ''}>Independent</option>
                                    <option value="needs_supervision" ${formData.ambulation_status === 'needs_supervision' ? 'selected' : ''}>Needs Supervision</option>
                                    <option value="dependent" ${formData.ambulation_status === 'dependent' ? 'selected' : ''}>Dependent</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Assistive Equipment</label>
                                <select name="use_of_assistive_equipment">
                                    <option value="">Select</option>
                                    <option value="walker" ${formData.use_of_assistive_equipment === 'walker' ? 'selected' : ''}>Walker</option>
                                    <option value="wheelchair" ${formData.use_of_assistive_equipment === 'wheelchair' ? 'selected' : ''}>Wheelchair</option>
                                    <option value="none" ${formData.use_of_assistive_equipment === 'none' ? 'selected' : ''}>None</option>
                                    <option value="other" ${formData.use_of_assistive_equipment === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Musculoskeletal Notes</label>
                            <textarea name="musculoskeletal_notes">${formData.musculoskeletal_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Musculoskeletal Pain</label>
                            <input type="text" name="pain_musculoskeletal" value="${formData.pain_musculoskeletal || ''}">
                        </div>
                    </div>

                    <!-- Pain Assessment -->
                    <div class="form-section">
                        <h3>Pain Assessment</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_present" ${formData.pain_present ? 'checked' : ''}>
                                <label>Pain Present</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Intensity (0-10)</label>
                                <input type="number" name="pain_intensity" min="0" max="10" value="${formData.pain_intensity || ''}">
                            </div>
                            <div class="form-group">
                                <label>Pain Location</label>
                                <input type="text" name="pain_location" value="${formData.pain_location || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Frequency</label>
                                <select name="pain_frequency">
                                    <option value="">Select</option>
                                    <option value="constant" ${formData.pain_frequency === 'constant' ? 'selected' : ''}>Constant</option>
                                    <option value="intermittent" ${formData.pain_frequency === 'intermittent' ? 'selected' : ''}>Intermittent</option>
                                    <option value="occasional" ${formData.pain_frequency === 'occasional' ? 'selected' : ''}>Occasional</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Pain Duration</label>
                                <input type="text" name="pain_duration" value="${formData.pain_duration || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Character</label>
                                <select name="pain_character">
                                    <option value="">Select</option>
                                    <option value="sharp" ${formData.pain_character === 'sharp' ? 'selected' : ''}>Sharp</option>
                                    <option value="dull" ${formData.pain_character === 'dull' ? 'selected' : ''}>Dull</option>
                                    <option value="burning" ${formData.pain_character === 'burning' ? 'selected' : ''}>Burning</option>
                                    <option value="throbbing" ${formData.pain_character === 'throbbing' ? 'selected' : ''}>Throbbing</option>
                                    <option value="other" ${formData.pain_character === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Action Taken</label>
                                <input type="text" name="pain_action_taken" value="${formData.pain_action_taken || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Fall Risk Assessment -->
                    <div class="form-section">
                        <h3>Fall Risk Assessment</h3>
                        <div class="form-group">
                            <label>Fall Risk Score</label>
                            <input type="number" name="fall_risk_score" value="${formData.fall_risk_score || ''}">
                        </div>
                        <div class="form-group">
                            <label>Fall Risk Details (JSON)</label>
                            <textarea name="fall_risk_details" placeholder='{"history": true, "secondary_diagnosis": false, ...}'>${formData.fall_risk_details ? JSON.stringify(formData.fall_risk_details, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Educational Needs -->
                    <div class="form-section">
                        <h3>Educational Needs</h3>
                        <div class="form-group">
                            <label>Educational Notes</label>
                            <textarea name="education_notes">${formData.education_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Educational Needs (JSON)</label>
                            <textarea name="educational_needs" placeholder='{"medication": true, "nutrition": false, ...}'>${formData.educational_needs ? JSON.stringify(formData.educational_needs, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <!-- Specialized Assessments -->
                    <div class="form-section">
                        <h3>Specialized Assessments</h3>
                        <div class="form-group">
                            <label>Elderly Assessment (JSON)</label>
                            <textarea name="elderly_assessment" placeholder='{"mobility": "limited", "cognitive": "intact", ...}'>${formData.elderly_assessment ? JSON.stringify(formData.elderly_assessment, null, 2) : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Disabled Assessment (JSON)</label>
                            <textarea name="disabled_assessment" placeholder='{"type": "physical", "severity": "moderate", ...}'>${formData.disabled_assessment ? JSON.stringify(formData.disabled_assessment, null, 2) : ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">Save Form</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">Back</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Form submission
        document.getElementById('nurse-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNurseForm(new FormData(e.target), formData.id);
        });
    }

    async saveNurseForm(formData, formId) {
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        ['gi_problems', 'weight_loss', 'weight_gain', 'refer_to_nutritionist', 'pain_present'].forEach(field => {
            data[field] = formData.get(field) === 'on';
        });

        try {
            const response = await this.apiCall(
                formId ? `/api/nurse-forms/${formId}` : '/api/nurse-forms',
                {
                    method: formId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                alert('Form saved successfully');
                this.loadNurseForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    signNurseForm() {
        this.showSignatureModal('nurse');
    }

    showDoctorForm(visitId) {
        this.currentVisitId = visitId;
        this.loadDoctorForm(visitId);
    }

    async loadDoctorForm(visitId) {
        this.showLoading();

        try {
            const response = await this.apiCall(`/api/doctor-forms/${visitId}`);
            const formData = await response.json();
            
            // Store the form ID for signature
            this.currentDoctorFormId = formData.id;

            this.renderDoctorForm(formData, visitId);
        } catch (error) {
            this.showError('content', 'خطأ في تحميل نموذج الطبيب');
        }
    }

    renderDoctorForm(formData, visitId) {
        const html = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Doctor Radiology Evaluation</h2>
                    <div class="actions">
                        <button class="btn btn-secondary" onclick="app.printForm('doctor')">Print Form</button>
                        ${!formData.signed ? '<button class="btn btn-success" onclick="app.signDoctorForm()">Sign Form</button>' : '<span class="status-badge status-signed">Signed</span>'}
                    </div>
                </div>

                <form id="doctor-form">
                    <input type="hidden" name="visit_id" value="${visitId}">
                    <input type="hidden" name="doctor_id" value="${this.user.id}">

                    <!-- Patient Information -->
                    <div class="form-section">
                        <h3>Patient Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" name="patient_full_name" value="${formData.patient_full_name || ''}">
                            </div>
                            <div class="form-group">
                                <label>Exam Date</label>
                                <input type="date" name="exam_date" value="${formData.exam_date || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mobile</label>
                                <input type="tel" name="mobile" value="${formData.mobile || ''}">
                            </div>
                            <div class="form-group">
                                <label>Medical Number</label>
                                <input type="text" name="medical_number" value="${formData.medical_number || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" value="${formData.dob || ''}">
                            </div>
                            <div class="form-group">
                                <label>Age</label>
                                <input type="number" name="age" value="${formData.age || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Gender</label>
                                <select name="gender">
                                    <option value="">Select</option>
                                    <option value="male" ${formData.gender === 'male' ? 'selected' : ''}>Male</option>
                                    <option value="female" ${formData.gender === 'female' ? 'selected' : ''}>Female</option>
                                    <option value="other" ${formData.gender === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Diagnosis</label>
                                <input type="text" name="diagnosis" value="${formData.diagnosis || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Study Information -->
                    <div class="form-section">
                        <h3>Study Information</h3>
                        <div class="form-group">
                            <label>Study Reason</label>
                            <input type="text" name="study_reason" placeholder="Why is the study being done?" value="${formData.study_reason || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="splint_present" ${formData.splint_present ? 'checked' : ''}>
                                <label>Is there a splint/cast?</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Splint Notes</label>
                            <textarea name="splint_notes">${formData.splint_notes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Chronic Disease</label>
                            <input type="text" name="chronic_disease" value="${formData.chronic_disease || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pacemaker" ${formData.pacemaker ? 'checked' : ''}>
                                <label>Pacemaker</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Implants</label>
                            <input type="text" name="implants" placeholder="Screws, plates, artificial joints" value="${formData.implants || ''}">
                        </div>
                        <div class="form-group">
                            <label>Pregnancy Status (for women)</label>
                            <select name="pregnancy_status">
                                <option value="">Select</option>
                                <option value="unknown" ${formData.pregnancy_status === 'unknown' ? 'selected' : ''}>Unknown</option>
                                <option value="yes" ${formData.pregnancy_status === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${formData.pregnancy_status === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>

                    <!-- Clinical Information -->
                    <div class="form-section">
                        <h3>Clinical Information</h3>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="pain_numbness" ${formData.pain_numbness ? 'checked' : ''}>
                                <label>Pain or Numbness</label>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pain Site</label>
                                <input type="text" name="pain_site" value="${formData.pain_site || ''}">
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="spinal_deformity" ${formData.spinal_deformity ? 'checked' : ''}>
                                <label>Spinal Deformity</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Spinal Deformity Details</label>
                            <textarea name="spinal_deformity_details">${formData.spinal_deformity_details || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="swelling" ${formData.swelling ? 'checked' : ''}>
                                <label>Swelling</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Swelling Site</label>
                            <input type="text" name="swelling_site" value="${formData.swelling_site || ''}">
                        </div>
                        <div class="form-group">
                            <label>Neurological Symptoms</label>
                            <input type="text" name="neuro_symptoms" placeholder="Headache, visual, hearing, imbalance" value="${formData.neuro_symptoms || ''}">
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="fever" ${formData.fever ? 'checked' : ''}>
                                <label>Fever</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Previous Surgeries (+ dates)</label>
                            <textarea name="surgeries">${formData.surgeries || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Tumor History</label>
                            <input type="text" name="tumor_history" value="${formData.tumor_history || ''}">
                        </div>
                        <div class="form-group">
                            <label>Previous Investigations</label>
                            <textarea name="previous_investigations">${formData.previous_investigations || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="checkbox-group">
                                <input type="checkbox" name="previous_disc" ${formData.previous_disc ? 'checked' : ''}>
                                <label>Previous Disc/Herniation</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" name="meds_increase_fall_risk" ${formData.meds_increase_fall_risk ? 'checked' : ''}>
                                <label>Medications that increase fall risk</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Current Medication</label>
                            <textarea name="current_medication">${formData.current_medication || ''}</textarea>
                        </div>
                    </div>

                    <!-- Technical Parameters -->
                    <div class="form-section">
                        <h3>Technical Parameters</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>CTDIvol (mGy)</label>
                                <input type="text" name="ctd1vol" value="${formData.ctd1vol || ''}">
                            </div>
                            <div class="form-group">
                                <label>DLP (mGy·cm)</label>
                                <input type="text" name="dlp" value="${formData.dlp || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>kV</label>
                                <input type="text" name="kv" value="${formData.kv || ''}">
                            </div>
                            <div class="form-group">
                                <label>mAs</label>
                                <input type="text" name="mas" value="${formData.mas || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Findings -->
                    <div class="form-section">
                        <h3>Findings & Interpretation</h3>
                        <div class="form-group">
                            <label>Radiological Findings</label>
                            <textarea name="findings" rows="6" placeholder="Enter radiological findings and interpretation here...">${formData.findings || ''}</textarea>
                        </div>
                    </div>

                    <div class="actions" style="margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary">Save Form</button>
                        <button type="button" class="btn btn-secondary" onclick="app.showView('visits')">Back</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('content').innerHTML = html;

        // Form submission
        document.getElementById('doctor-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDoctorForm(new FormData(e.target), formData.id);
        });
    }

    async saveDoctorForm(formData, formId) {
        const data = Object.fromEntries(formData);

        // Convert checkbox values
        ['splint_present', 'pacemaker', 'pain_numbness', 'spinal_deformity', 'swelling', 'fever', 'previous_disc', 'meds_increase_fall_risk'].forEach(field => {
            data[field] = formData.get(field) === 'on';
        });

        try {
            const response = await this.apiCall(
                formId ? `/api/doctor-forms/${formId}` : '/api/doctor-forms',
                {
                    method: formId ? 'PUT' : 'POST',
                    body: JSON.stringify(data)
                }
            );

            if (response.ok) {
                alert('Form saved successfully');
                this.loadDoctorForm(this.currentVisitId);
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            alert('Save failed');
        }
    }

    signDoctorForm() {
        this.showSignatureModal('doctor');
    }

    showSignatureModal(type) {
        this.signatureType = type;
        
        // Set currentFormId based on type
        if (type === 'nurse') {
            this.currentFormId = this.currentNurseFormId;
        } else {
            this.currentFormId = this.currentDoctorFormId;
        }
        
        // Use Bootstrap modal API
        const modal = new bootstrap.Modal(document.getElementById('signature-modal'));
        modal.show();

        // Initialize canvas
        const canvas = document.getElementById('signature-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let isDrawing = false;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e.touches[0]);
        });
        canvas.addEventListener('touchend', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
        }

        function draw(e) {
            if (!isDrawing) return;
            ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
            ctx.stroke();
        }

        function stopDrawing() {
            isDrawing = false;
        }
    }

    clearSignature() {
        const canvas = document.getElementById('signature-canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    async saveSignature() {
        if (!this.currentFormId) {
            this.showNotification('Error: No form selected', 'error');
            return;
        }

        if (!this.token) {
            this.showNotification('Please login again', 'error');
            this.logout();
            return;
        }

        const canvas = document.getElementById('signature-canvas');
        const signatureData = canvas.toDataURL('image/png');

        try {
            const endpoint = this.signatureType === 'nurse' ? `/api/nurse-forms/${this.currentFormId}` : `/api/doctor-forms/${this.currentFormId}`;
            const response = await this.apiCall(endpoint, {
                method: 'PUT',
                body: JSON.stringify({
                    signed: true,
                    signature_data: signatureData,
                    signed_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                this.closeSignatureModal();
                this.showNotification('Signature saved successfully', 'success');
                if (this.signatureType === 'nurse') {
                    this.loadNurseForm(this.currentVisitId);
                } else {
                    this.loadDoctorForm(this.currentVisitId);
                }
            } else if (response.status === 401) {
                this.showNotification('Session expired. Please login again', 'error');
                this.logout();
            } else {
                const error = await response.json();
                this.showNotification(`Error: ${error.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showNotification('Network error. Please check your connection.', 'error');
        }
    }

    closeSignatureModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('signature-modal'));
        if (modal) {
            modal.hide();
        }
    }

    showModal(title, content) {
        document.getElementById('modal-title').innerHTML = `<i class="bi bi-plus-circle me-2"></i>${title}`;
        document.getElementById('modal-body').innerHTML = content;
        
        // Use Bootstrap's modal API
        const modal = new bootstrap.Modal(document.getElementById('modal'));
        modal.show();
    }

    closeModal() {
        // Use Bootstrap's modal API
        const modal = bootstrap.Modal.getInstance(document.getElementById('modal'));
        if (modal) {
            modal.hide();
        }
    }

    // Admin Panel Functions
    async loadAdminPanel() {
        this.showLoading();
        
        try {
            // Load dashboard statistics
            const response = await this.apiCall('/api/admin/stats');
            const stats = await response.json();
            
            this.renderAdminDashboard(stats);
        } catch (error) {
            this.showError('content', 'Error loading admin panel');
        }
    }

    renderAdminDashboard(stats) {
        const html = `
            <div class="admin-panel">
                <div class="admin-header">
                    <h2>Admin Dashboard</h2>
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab active" onclick="app.showAdminTab('dashboard')">Dashboard</button>
                    <button class="admin-tab" onclick="app.showAdminTab('users')">Users</button>
                    <button class="admin-tab" onclick="app.showAdminTab('patients')">Patients</button>
                    <button class="admin-tab" onclick="app.showAdminTab('visits')">Visits</button>
                    <button class="admin-tab" onclick="app.showAdminTab('forms')">Forms</button>
                </div>

                <div id="admin-content">
                    ${this.renderDashboardStats(stats)}
                </div>
            </div>
        `;
        
        document.getElementById('content').innerHTML = html;
    }

    renderDashboardStats(stats) {
        return `
            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-md-4 col-lg-2 mb-3">
                    <div class="card bg-primary text-white h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-people-fill" style="font-size: 2rem;"></i>
                            <h3 class="mt-2 mb-1">${stats.totalPatients?.[0]?.count || 0}</h3>
                            <small>Total Patients</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-2 mb-3">
                    <div class="card bg-success text-white h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-calendar-check-fill" style="font-size: 2rem;"></i>
                            <h3 class="mt-2 mb-1">${stats.totalVisits?.[0]?.count || 0}</h3>
                            <small>Total Visits</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-2 mb-3">
                    <div class="card bg-info text-white h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-person-badge-fill" style="font-size: 2rem;"></i>
                            <h3 class="mt-2 mb-1">${stats.totalUsers?.[0]?.count || 0}</h3>
                            <small>System Users</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-3 mb-3">
                    <div class="card bg-warning text-dark h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-clipboard-pulse" style="font-size: 2rem;"></i>
                            <h3 class="mt-2 mb-1">${stats.nurseFormsCount?.[0]?.count || 0}</h3>
                            <small>Nurse Assessments</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-lg-3 mb-3">
                    <div class="card bg-danger text-white h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-file-medical-fill" style="font-size: 2rem;"></i>
                            <h3 class="mt-2 mb-1">${stats.doctorFormsCount?.[0]?.count || 0}</h3>
                            <small>Doctor Evaluations</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="row mb-4">
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="bi bi-pie-chart me-2"></i>Visits by Status
                            </h6>
                        </div>
                        <div class="card-body">
                            <canvas id="visitStatusChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="bi bi-bar-chart me-2"></i>Users by Role
                            </h6>
                        </div>
                        <div class="card-body">
                            <canvas id="userRoleChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-charts">
                <div class="chart-section">
                    <h3>Visits by Status</h3>
                    <div class="chart-data">
                        ${(stats.visitsByStatus || []).map(item => 
                            `<div class="chart-item">
                                <span class="status-badge status-${item.status}">${this.getStatusName(item.status)}</span>
                                <span class="chart-value">${item.count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="chart-section">
                    <h3>Users by Role</h3>
                    <div class="chart-data">
                        ${(stats.usersByRole || []).map(item => 
                            `<div class="chart-item">
                                <span class="role-badge role-${item.role}">${this.getRoleName(item.role)}</span>
                                <span class="chart-value">${item.count}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            </div>

            <div class="recent-activity">
                <h3>Recent Visits</h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Patient</th>
                            <th>Visit Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(stats.recentVisits || []).map(visit => `
                            <tr onclick="app.showVisitModal(${visit.id})">
                                <td>#${visit.id}</td>
                                <td>${visit.full_name}</td>
                                <td>${new Date(visit.visit_date).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async showAdminTab(tab) {
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="app.showAdminTab('${tab}')"]`).classList.add('active');
        
        const content = document.getElementById('admin-content');
        content.innerHTML = '<div class="loading">Loading...</div>';

        switch (tab) {
            case 'dashboard':
                const response = await this.apiCall('/api/admin/stats');
                const stats = await response.json();
                content.innerHTML = this.renderDashboardStats(stats);
                break;
            case 'users':
                this.loadAdminUsers();
                break;
            case 'patients':
                this.loadAdminPatients();
                break;
            case 'visits':
                this.loadAdminVisits();
                break;
            case 'forms':
                this.loadAdminForms();
                break;
        }
    }

    async loadAdminUsers() {
        try {
            const response = await this.apiCall('/api/users');
            const users = await response.json();
            this.renderAdminUsers(users);
        } catch (error) {
            this.showError('admin-content', 'Error loading users');
        }
    }

    renderAdminUsers(users) {
        const html = `
            <div class="admin-section">
                <div class="section-header">
                    <h3>User Management</h3>
                    <button class="btn btn-primary" onclick="app.showUserModal()">Add New User</button>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>#${user.id}</td>
                                <td>${user.name}</td>
                                <td>${user.username}</td>
                                <td><span class="role-badge role-${user.role}">${this.getRoleName(user.role)}</span></td>
                                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.showUserModal(${user.id})">Edit</button>
                                    ${user.id !== this.user.id ? `<button class="btn btn-sm btn-danger" onclick="app.deleteUser(${user.id})">Delete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Initialize charts after DOM is updated
        setTimeout(() => {
            this.initializeCharts(stats);
        }, 100);
    }

    initializeCharts(stats) {
        // Configure Toastr
        if (typeof toastr !== 'undefined') {
            toastr.options = {
                "closeButton": true,
                "progressBar": true,
                "positionClass": "toast-top-right",
                "timeOut": "3000"
            };
        }

        // Visits by Status Pie Chart
        const visitStatusCtx = document.getElementById('visitStatusChart');
        if (visitStatusCtx && typeof Chart !== 'undefined') {
            const visitStatusData = stats.visitsByStatus || [];
            new Chart(visitStatusCtx, {
                type: 'doughnut',
                data: {
                    labels: visitStatusData.map(item => this.getStatusName(item.status)),
                    datasets: [{
                        data: visitStatusData.map(item => item.count),
                        backgroundColor: [
                            '#0dcaf0', // info - open
                            '#ffc107', // warning - in_progress  
                            '#198754', // success - signed
                            '#6c757d'  // secondary - closed
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Users by Role Bar Chart  
        const userRoleCtx = document.getElementById('userRoleChart');
        if (userRoleCtx && typeof Chart !== 'undefined') {
            const userRoleData = stats.usersByRole || [];
            new Chart(userRoleCtx, {
                type: 'bar',
                data: {
                    labels: userRoleData.map(item => this.getRoleName(item.role)),
                    datasets: [{
                        label: 'Number of Users',
                        data: userRoleData.map(item => item.count),
                        backgroundColor: [
                            '#dc3545', // danger - admin
                            '#0d6efd', // primary - doctor  
                            '#198754'  // success - nurse
                        ],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }

    // Notification system
    showNotification(message, type = 'success') {
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
        } else {
            // Fallback for browsers without toastr
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    async showUserModal(userId = null) {
        const title = userId ? 'Edit User' : 'Add New User';
        let user = {};
        
        if (userId) {
            try {
                const response = await this.apiCall(`/api/users`);
                const users = await response.json();
                user = users.find(u => u.id === userId) || {};
            } catch (error) {
                this.showError('content', 'Error loading user data');
                return;
            }
        }

        const html = `
            <form id="user-form">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value="${user.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Username *</label>
                    <input type="text" name="username" value="${user.username || ''}" required>
                </div>
                <div class="form-group">
                    <label>Role *</label>
                    <select name="role" required>
                        <option value="">Select Role</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="doctor" ${user.role === 'doctor' ? 'selected' : ''}>Doctor</option>
                        <option value="nurse" ${user.role === 'nurse' ? 'selected' : ''}>Nurse</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password ${userId ? '(leave empty to keep current)' : '*'}</label>
                    <input type="password" name="password" ${userId ? '' : 'required'}>
                </div>
                <div class="actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(title, html);
        
        // Add real-time validation to the form
        const form = document.getElementById('user-form');
        this.addFieldValidation(form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form before submission
            if (this.validateFormBeforeSubmit(e.target)) {
                await this.saveUser(new FormData(e.target), userId);
            }
        });
    }

    async saveUser(formData, userId = null) {
        const userData = {
            name: formData.get('name'),
            username: formData.get('username'),
            role: formData.get('role'),
            password: formData.get('password')
        };

        try {
            const method = userId ? 'PUT' : 'POST';
            const url = userId ? `/api/users/${userId}` : '/api/users';
            
            const response = await this.apiCall(url, {
                method: method,
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeModal();
                this.loadAdminUsers(); // Reload users
            } else {
                this.showError('modal-body', result.error);
            }
        } catch (error) {
            this.showError('modal-body', 'Error saving user');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await this.apiCall(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('User deleted successfully!', 'success');
                this.loadAdminUsers(); // Reload users
            } else {
                const error = await response.json();
                this.showNotification(error.error, 'error');
            }
        } catch (error) {
            alert('Error deleting user');
        }
    }

    async loadAdminPatients() {
        try {
            const response = await this.apiCall('/api/patients');
            const patients = await response.json();
            this.renderAdminPatients(patients);
        } catch (error) {
            this.showError('admin-content', 'Error loading patients');
        }
    }

    renderAdminPatients(patients) {
        const html = `
            <div class="admin-section">
                <div class="section-header">
                    <h3>Patient Management</h3>
                    <button class="btn btn-primary" onclick="app.showEnhancedPatientModal()">Add New Patient</button>
                </div>
                <div class="search-section">
                    <input type="text" id="admin-patient-search" class="search-input" placeholder="Search patients...">
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>National ID</th>
                            <th>Mobile</th>
                            <th>Age/Gender</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="admin-patients-tbody">
                        ${patients.map(patient => `
                            <tr>
                                <td>#${patient.id}</td>
                                <td>${patient.full_name}</td>
                                <td>${patient.national_id || '-'}</td>
                                <td>${patient.mobile || '-'}</td>
                                <td>${patient.age || '-'} / ${patient.gender || '-'}</td>
                                <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.showEnhancedPatientModal(${patient.id})">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="app.deletePatient(${patient.id})">Delete</button>
                                    <button class="btn btn-sm btn-primary" onclick="app.createVisit(${patient.id})">New Visit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
        
        // Add search functionality
        document.getElementById('admin-patient-search').addEventListener('input', (e) => {
            this.filterAdminPatients(e.target.value, patients);
        });
    }

    filterAdminPatients(searchTerm, patients) {
        const filtered = patients.filter(patient =>
            patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.national_id && patient.national_id.includes(searchTerm)) ||
            (patient.mobile && patient.mobile.includes(searchTerm))
        );
        
        const tbody = document.getElementById('admin-patients-tbody');
        tbody.innerHTML = filtered.map(patient => `
            <tr>
                <td>#${patient.id}</td>
                <td>${patient.full_name}</td>
                <td>${patient.national_id || '-'}</td>
                <td>${patient.mobile || '-'}</td>
                <td>${patient.age || '-'} / ${patient.gender || '-'}</td>
                <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.showEnhancedPatientModal(${patient.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deletePatient(${patient.id})">Delete</button>
                    <button class="btn btn-sm btn-primary" onclick="app.createVisit(${patient.id})">New Visit</button>
                </td>
            </tr>
        `).join('');
    }

    async deletePatient(patientId) {
        if (!confirm('Are you sure you want to delete this patient? This will also delete all associated data.')) return;

        try {
            const response = await this.apiCall(`/api/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadAdminPatients(); // Reload patients
            } else {
                const error = await response.json();
                alert(error.error);
            }
        } catch (error) {
            alert('Error deleting patient');
        }
    }

    async loadAdminVisits() {
        try {
            const response = await this.apiCall('/api/visits');
            const visits = await response.json();
            this.renderAdminVisits(visits);
        } catch (error) {
            this.showError('admin-content', 'Error loading visits');
        }
    }

    renderAdminVisits(visits) {
        const html = `
            <div class="admin-section">
                <div class="section-header">
                    <h3>Visit Management</h3>
                    <button class="btn btn-primary" onclick="app.showVisitModal()">Create New Visit</button>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Patient</th>
                            <th>Visit Date</th>
                            <th>Nurse</th>
                            <th>Doctor</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${visits.map(visit => `
                            <tr>
                                <td>#${visit.id}</td>
                                <td>${visit.patient_name}</td>
                                <td>${new Date(visit.visit_date).toLocaleDateString()}</td>
                                <td>${visit.nurse_name || '<em>Not assigned</em>'}</td>
                                <td>${visit.doctor_name || '<em>Not assigned</em>'}</td>
                                <td><span class="status-badge status-${visit.status}">${this.getStatusName(visit.status)}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.showVisitModal(${visit.id})">Edit</button>
                                    <button class="btn btn-sm btn-primary" onclick="app.showNurseForm(${visit.id})">Nurse Form</button>
                                    <button class="btn btn-sm btn-success" onclick="app.showDoctorForm(${visit.id})">Doctor Form</button>
                                    <button class="btn btn-sm btn-danger" onclick="app.deleteVisit(${visit.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
    }

    async deleteVisit(visitId) {
        if (!confirm('Are you sure you want to delete this visit? This will also delete all associated forms.')) return;

        try {
            const response = await this.apiCall(`/api/visits/${visitId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadAdminVisits(); // Reload visits
            } else {
                const error = await response.json();
                alert(error.error);
            }
        } catch (error) {
            alert('Error deleting visit');
        }
    }

    async loadAdminForms() {
        try {
            const [nurseResponse, doctorResponse] = await Promise.all([
                this.apiCall('/api/nurse-forms'),
                this.apiCall('/api/doctor-forms')
            ]);
            
            const nurseForms = await nurseResponse.json();
            const doctorForms = await doctorResponse.json();
            
            this.renderAdminForms(nurseForms, doctorForms);
        } catch (error) {
            this.showError('admin-content', 'Error loading forms');
        }
    }

    renderAdminForms(nurseForms, doctorForms) {
        this.currentNurseForms = nurseForms;
        this.currentDoctorForms = doctorForms;
        
        const html = `
            <div class="admin-section">
                <div class="section-header">
                    <h3>Forms Management</h3>
                    <div class="forms-stats">
                        <span class="stat-item">Nurse Forms: ${nurseForms.length}</span>
                        <span class="stat-item">Doctor Forms: ${doctorForms.length}</span>
                    </div>
                </div>
                
                <div class="forms-tabs">
                    <button class="form-tab active" onclick="app.showFormsTab('nurse')">
                        Nurse Forms (${nurseForms.length})
                    </button>
                    <button class="form-tab" onclick="app.showFormsTab('doctor')">
                        Doctor Forms (${doctorForms.length})
                    </button>
                </div>

                <div id="forms-content">
                    ${this.renderNurseFormsTable(nurseForms)}
                </div>
            </div>
        `;
        
        document.getElementById('admin-content').innerHTML = html;
    }

    renderNurseFormsTable(forms) {
        if (forms.length === 0) {
            return `
                <div class="no-data">
                    <p>No nurse assessment forms found</p>
                    <small>Forms will appear here once nurses complete patient assessments</small>
                </div>
            `;
        }

        return `
            <div class="forms-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Form ID</th>
                            <th>Patient</th>
                            <th>Nurse</th>
                            <th>Visit Date</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${forms.map(form => `
                            <tr>
                                <td>#${form.id}</td>
                                <td>${form.patient_name || 'Unknown'}</td>
                                <td>${form.nurse_name || 'Unknown'}</td>
                                <td>${form.visit_date ? new Date(form.visit_date).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${form.signed ? 'status-signed' : 'status-open'}">
                                        ${form.signed ? 'Signed' : 'Draft'}
                                    </span>
                                </td>
                                <td>${new Date(form.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.viewForm('nurse', ${form.visit_id})">View</button>
                                    <button class="btn btn-sm btn-primary" onclick="app.printForm('nurse')">Print</button>
                                    ${!form.signed ? `<button class="btn btn-sm btn-danger" onclick="app.deleteForm('nurse', ${form.id})">Delete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderDoctorFormsTable(forms) {
        if (forms.length === 0) {
            return `
                <div class="no-data">
                    <p>No doctor evaluation forms found</p>
                    <small>Forms will appear here once doctors complete patient evaluations</small>
                </div>
            `;
        }

        return `
            <div class="forms-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Form ID</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Visit Date</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${forms.map(form => `
                            <tr>
                                <td>#${form.id}</td>
                                <td>${form.patient_name || 'Unknown'}</td>
                                <td>${form.doctor_name || 'Unknown'}</td>
                                <td>${form.visit_date ? new Date(form.visit_date).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${form.signed ? 'status-signed' : 'status-open'}">
                                        ${form.signed ? 'Signed' : 'Draft'}
                                    </span>
                                </td>
                                <td>${new Date(form.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.viewForm('doctor', ${form.visit_id})">View</button>
                                    <button class="btn btn-sm btn-primary" onclick="app.printForm('doctor')">Print</button>
                                    ${!form.signed ? `<button class="btn btn-sm btn-danger" onclick="app.deleteForm('doctor', ${form.id})">Delete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showFormsTab(type) {
        // Update active tab
        document.querySelectorAll('.form-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="app.showFormsTab('${type}')"]`).classList.add('active');
        
        // Display the appropriate forms table
        const content = document.getElementById('forms-content');
        
        if (type === 'nurse') {
            content.innerHTML = this.renderNurseFormsTable(this.currentNurseForms || []);
        } else if (type === 'doctor') {
            content.innerHTML = this.renderDoctorFormsTable(this.currentDoctorForms || []);
        }
    }

    viewForm(formType, visitId) {
        if (formType === 'nurse') {
            this.showNurseForm(visitId);
        } else if (formType === 'doctor') {
            this.showDoctorForm(visitId);
        }
    }

    async deleteForm(formType, formId) {
        if (!confirm(`Are you sure you want to delete this ${formType} form? This action cannot be undone.`)) {
            return;
        }

        try {
            const endpoint = formType === 'nurse' ? `/api/nurse-forms/${formId}` : `/api/doctor-forms/${formId}`;
            const response = await this.apiCall(endpoint, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Reload the forms data
                this.loadAdminForms();
            } else {
                const error = await response.json();
                alert(`Error deleting form: ${error.error}`);
            }
        } catch (error) {
            alert('Error deleting form');
        }
    }

    printForm(formType) {
        // Add print class to body to activate print styles
        document.body.classList.add('printing');
        
        // Hide navigation and other non-printable elements
        const elementsToHide = ['.header', '.nav', '.actions', '.btn', '.signature-controls'];
        elementsToHide.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.display = 'none';
            });
        });
        
        // Add print header with logo and facility information
        const content = document.getElementById('content');
        const originalContent = content.innerHTML;
        
        const printHeader = `
            <div class="print-header">
                <div class="facility-info">
                    <h1>Al-Shorouk Radiology Center</h1>
                    <p>Comprehensive Radiology Services</p>
                    <p>Phone: +123-456-7890 | Email: info@alshorouk-radiology.com</p>
                </div>
                <div class="form-info">
                    <h2>${formType === 'nurse' ? 'Nursing Assessment Form' : 'Radiology Evaluation Form'}</h2>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Time: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
        
        content.innerHTML = printHeader + originalContent;
        
        // Trigger print
        setTimeout(() => {
            window.print();
            
            // Restore original state after print dialog
            setTimeout(() => {
                content.innerHTML = originalContent;
                elementsToHide.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        el.style.display = '';
                    });
                });
                document.body.classList.remove('printing');
            }, 1000);
        }, 100);
    }

    // Validation Helper Methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        // Remove spaces, dashes, and parentheses
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Check if it's a valid phone number (basic check)
        return /^[\+]?[\d]{7,15}$/.test(cleanPhone);
    }

    validateNationalId(nationalId) {
        // Basic validation - adjust based on your country's format
        return /^\d{10,14}$/.test(nationalId);
    }

    validateAge(age) {
        const numAge = parseInt(age);
        return numAge >= 0 && numAge <= 150;
    }

    validateVitalSigns(vitals) {
        const errors = [];
        
        // Temperature validation (normal range: 36-40°C)
        if (vitals.temp && (vitals.temp < 30 || vitals.temp > 45)) {
            errors.push('Temperature seems unusual (normal range: 36-40°C)');
        }
        
        // Blood pressure validation
        if (vitals.bp) {
            const bpMatch = vitals.bp.match(/(\d+)\/(\d+)/);
            if (bpMatch) {
                const systolic = parseInt(bpMatch[1]);
                const diastolic = parseInt(bpMatch[2]);
                if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
                    errors.push('Blood pressure values seem unusual');
                }
            }
        }
        
        // Heart rate validation (normal range: 40-200 bpm)
        if (vitals.pulse && (vitals.pulse < 30 || vitals.pulse > 220)) {
            errors.push('Heart rate seems unusual (normal range: 60-100 bpm)');
        }
        
        // O2 Saturation validation (normal range: 95-100%)
        if (vitals.o2_saturation && (vitals.o2_saturation < 70 || vitals.o2_saturation > 100)) {
            errors.push('Oxygen saturation seems unusual (normal range: 95-100%)');
        }
        
        return errors;
    }

    showValidationErrors(errors) {
        // Remove existing error display
        this.clearValidationErrors();
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-errors';
        errorDiv.innerHTML = `
            <div class="error-header">
                <i class="error-icon">⚠</i>
                <span>Please correct the following errors:</span>
            </div>
            <ul class="error-list">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        // Insert at the top of the active form step
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            activeStep.insertBefore(errorDiv, activeStep.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.clearValidationErrors();
        }, 5000);
    }

    clearValidationErrors() {
        const existingErrors = document.querySelectorAll('.validation-errors');
        existingErrors.forEach(error => error.remove());
    }

    // Real-time validation for form fields
    addFieldValidation(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            field.addEventListener('input', () => {
                // Clear error styling on input
                field.classList.remove('error');
                this.clearFieldError(field);
            });
        });
    }

    validateField(field) {
        const fieldName = field.name || field.id || 'Field';
        const label = field.closest('.form-group')?.querySelector('label')?.textContent || fieldName;
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = `${label} is required`;
        } else if (field.value.trim()) {
            // Type-specific validation
            switch (field.type) {
                case 'email':
                    if (!this.validateEmail(field.value)) {
                        isValid = false;
                        errorMessage = `${label} must be a valid email address`;
                    }
                    break;
                case 'tel':
                    if (!this.validatePhone(field.value)) {
                        isValid = false;
                        errorMessage = `${label} must be a valid phone number`;
                    }
                    break;
                case 'number':
                    const min = parseInt(field.min);
                    const max = parseInt(field.max);
                    const value = parseInt(field.value);
                    
                    if (!isNaN(min) && value < min) {
                        isValid = false;
                        errorMessage = `${label} must be at least ${min}`;
                    } else if (!isNaN(max) && value > max) {
                        isValid = false;
                        errorMessage = `${label} must be no more than ${max}`;
                    }
                    break;
            }

            // Field-specific validation
            if (field.name === 'national_id' && field.value && !this.validateNationalId(field.value)) {
                isValid = false;
                errorMessage = 'National ID must be 10-14 digits';
            } else if (field.name === 'age' && field.value && !this.validateAge(field.value)) {
                isValid = false;
                errorMessage = 'Age must be between 0 and 150';
            }
        }

        if (!isValid) {
            field.classList.add('error');
            this.showFieldError(field, errorMessage);
        } else {
            field.classList.remove('error');
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.appendChild(errorDiv);
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            const existingError = formGroup.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    // Form submission validation
    validateFormBeforeSubmit(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        const errors = [];

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional form-level validation
        if (form.id === 'nurse-form') {
            const vitals = {
                temp: form.querySelector('[name="temp"]')?.value,
                bp: form.querySelector('[name="bp"]')?.value,
                pulse: form.querySelector('[name="pulse"]')?.value,
                o2_saturation: form.querySelector('[name="o2_saturation"]')?.value
            };
            
            const vitalErrors = this.validateVitalSigns(vitals);
            if (vitalErrors.length > 0) {
                errors.push(...vitalErrors);
            }
        }

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            isValid = false;
        }

        return isValid;
    }

    showLoading() {
        document.getElementById('content').innerHTML = `
            <div class="d-flex justify-content-center align-items-center py-5">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
                    <div class="text-muted">Loading...</div>
                </div>
            </div>
        `;
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </div>`;
            element.style.display = 'block';
        }
    }
}

// Initialize the application when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app');
    app = new RadiologyApp();
});